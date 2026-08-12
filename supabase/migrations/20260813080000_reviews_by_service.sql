/*
# Rattacher les avis aux prestations

## Contexte
`reviews.service` stocke le libellé concaténé des prestations du rendez-vous —
« Pose gel + Beauté des pieds ». Utilisable pour l'affichage, inexploitable
pour filtrer : une recherche sur « Pose gel » capturerait « Pose gel French »,
et l'ordre de concaténation varie d'un avis à l'autre.

Remonter aux prestations par le rendez-vous n'est pas une option non plus : les
visiteurs anonymes n'ont aucun accès à `appointments` depuis la phase B, et
c'est très bien ainsi.

## Correctif
Les identifiants des prestations sont recopiés sur l'avis au moment du dépôt.
Le filtrage devient exact et se fait sur une table déjà publique.

La colonne `service` est conservée : elle porte le libellé affiché, qui doit
rester figé même si une prestation est renommée ou supprimée plus tard.
*/

BEGIN;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS service_ids uuid[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.reviews.service_ids IS
  'Identifiants des prestations du rendez-vous commenté, recopiés au dépôt pour permettre un filtrage exact sans accéder à `appointments`.';

-- L'opérateur de recouvrement de tableaux exige un index GIN.
CREATE INDEX IF NOT EXISTS reviews_service_ids_idx
  ON public.reviews USING gin (service_ids);

-- ---------------------------------------------------------------------------
-- Reprise des avis déjà déposés
-- ---------------------------------------------------------------------------
UPDATE public.reviews r
SET service_ids = COALESCE(
  (
    SELECT array_agg((s->>'id')::uuid)
    FROM public.appointments a,
         LATERAL jsonb_array_elements(COALESCE(a.services, '[]'::jsonb)) s
    WHERE a.id = r.appointment_id
      AND (s->>'id') ~ '^[0-9a-f-]{36}$'
  ),
  '{}'
)
WHERE r.appointment_id IS NOT NULL
  AND cardinality(r.service_ids) = 0;

-- ---------------------------------------------------------------------------
-- Dépôt : recopier les identifiants
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_review(
  p_appointment_id uuid,
  p_rating         integer,
  p_comment        text,
  p_image_url      text DEFAULT NULL
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
    service, service_ids, image_url, verified, status, date
  )
  VALUES (
    p_appointment_id, v_appt.client_id, v_name, p_rating, btrim(p_comment),
    v_service, COALESCE(v_service_ids, '{}'), NULLIF(btrim(COALESCE(p_image_url, '')), ''),
    true, 'pending', public.salon_today()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_review(uuid, integer, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Note moyenne par prestation
-- ---------------------------------------------------------------------------
-- Alimente les cartes de prestation sans transférer les avis eux-mêmes, et
-- sans exposer autre chose que des agrégats.

CREATE OR REPLACE FUNCTION public.service_ratings()
RETURNS TABLE (service_id uuid, average numeric, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT sid AS service_id,
         round(avg(r.rating)::numeric, 1) AS average,
         count(*) AS total
  FROM public.reviews r,
       LATERAL unnest(r.service_ids) AS sid
  WHERE r.status = 'approved'
  GROUP BY sid;
$$;

GRANT EXECUTE ON FUNCTION public.service_ratings() TO anon, authenticated;

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Les avis existants ont bien été rattachés :
--
--    select id, service, service_ids from public.reviews;
--
--    `service_ids` ne doit être vide que pour les avis sans rendez-vous.
--
-- b) Les notes par prestation sont cohérentes :
--
--    select s.name, sr.average, sr.total
--    from public.service_ratings() sr
--    join public.services s on s.id = sr.service_id;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.service_ratings();
-- DROP INDEX IF EXISTS public.reviews_service_ids_idx;
-- ALTER TABLE public.reviews DROP COLUMN IF EXISTS service_ids;
-- Puis rejouer submit_review() depuis 20260813030000_reviews_moderation.sql.
