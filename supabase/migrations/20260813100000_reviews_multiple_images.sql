/*
# Plusieurs photographies par avis

## Contexte
Un avis ne pouvait porter qu'une seule image (`image_url`). Une cliente
souhaitant montrer les deux mains, ou un rendu sous plusieurs angles, devait
choisir.

## Correctif
`image_urls text[]` remplace la colonne unique. L'ancienne est conservée le
temps du déploiement — le code en production continue de la lire jusqu'à la
mise en ligne du nouveau — et sa suppression fait l'objet d'une migration
distincte, pour ne pas reproduire la panne provoquée par le retrait des
colonnes héritées de `appointments`.

`submit_review()` accepte désormais un tableau. L'ancienne signature à quatre
paramètres est supprimée : PostgreSQL les distinguerait comme deux surcharges,
et PostgREST choisirait mal.
*/

BEGIN;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.reviews.image_urls IS
  'Photographies jointes à l''avis. Remplace `image_url`, limitée à une seule.';

-- Reprise des avis déjà déposés avec une image unique.
UPDATE public.reviews
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND btrim(image_url) <> ''
  AND cardinality(image_urls) = 0;

-- L'ancienne signature doit disparaître : conservée, elle deviendrait une
-- surcharge et PostgREST ne saurait laquelle appeler.
DROP FUNCTION IF EXISTS public.submit_review(uuid, integer, text, text);

CREATE OR REPLACE FUNCTION public.submit_review(
  p_appointment_id uuid,
  p_rating         integer,
  p_comment        text,
  p_image_urls     text[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid         uuid := auth.uid();
  v_email       text := auth.email();
  v_appt        public.appointments%ROWTYPE;
  v_name        text;
  v_service     text;
  v_service_ids uuid[];
  v_images      text[];
  v_id          uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connectée pour laisser un avis'
      USING ERRCODE = '42501';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'La note doit être comprise entre 1 et 5' USING ERRCODE = '22023';
  END IF;

  IF p_comment IS NULL OR btrim(p_comment) = '' THEN
    RAISE EXCEPTION 'Le commentaire est requis' USING ERRCODE = '22023';
  END IF;

  -- Les entrées vides sont écartées plutôt que refusées : une case laissée
  -- vide ne doit pas faire échouer un dépôt par ailleurs valide.
  SELECT COALESCE(array_agg(u), '{}')
    INTO v_images
  FROM unnest(COALESCE(p_image_urls, '{}')) u
  WHERE u IS NOT NULL AND btrim(u) <> '';

  IF cardinality(v_images) > 6 THEN
    RAISE EXCEPTION 'Six photographies au maximum par avis' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_appt
  FROM public.appointments a
  WHERE a.id = p_appointment_id
    AND a.status IN ('confirmed', 'completed')
    AND (
      a.email = v_email
      OR EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = a.client_id AND c.user_id = v_uid
      )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun rendez-vous éligible ne correspond à cette demande'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reviews r WHERE r.appointment_id = p_appointment_id) THEN
    RAISE EXCEPTION 'Un avis a déjà été déposé pour ce rendez-vous'
      USING ERRCODE = '23505';
  END IF;

  v_name := COALESCE(NULLIF(btrim(v_appt.client_name), ''), 'Cliente');

  SELECT string_agg(s->>'name', ' + '),
         array_agg((s->>'id')::uuid) FILTER (WHERE (s->>'id') ~ '^[0-9a-f-]{36}$')
    INTO v_service, v_service_ids
  FROM jsonb_array_elements(COALESCE(v_appt.services, '[]'::jsonb)) s;

  INSERT INTO public.reviews (
    appointment_id, client_id, name, rating, comment,
    service, service_ids, image_urls, image_url, verified, status, date
  )
  VALUES (
    p_appointment_id, v_appt.client_id, v_name, p_rating, btrim(p_comment),
    v_service, COALESCE(v_service_ids, '{}'), v_images,
    -- `image_url` reste alimentée le temps que l'ancien code disparaisse.
    v_images[1],
    true, 'pending', public.salon_today()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_review(uuid, integer, text, text[]) TO authenticated;

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Les avis existants ont conservé leur image :
--
--    select id, image_url, image_urls from public.reviews
--    where image_url is not null;
--
--    `image_urls` doit contenir exactement l'ancienne valeur.
--
-- b) Une seule signature de submit_review subsiste :
--
--    select pg_get_function_identity_arguments(p.oid)
--    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname = 'submit_review';
--
--    Résultat attendu : une seule ligne, se terminant par `text[]`.

-- ---------------------------------------------------------------------------
-- SUITE — après déploiement du nouveau code
-- ---------------------------------------------------------------------------
-- `image_url` et son alimentation dans submit_review() pourront être retirées.
-- Volontairement séparé : retirer une colonne encore lue par le code en
-- production est exactement ce qui a provoqué les pannes de cette session.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.submit_review(uuid, integer, text, text[]);
-- ALTER TABLE public.reviews DROP COLUMN IF EXISTS image_urls;
-- Puis rejouer submit_review() depuis 20260813080000_reviews_by_service.sql.
