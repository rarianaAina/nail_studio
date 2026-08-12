/*
# Un avis ne peut porter que sur une prestation déjà reçue

## Défaut corrigé
`submit_review()` et `reviewable_appointments()` ne contrôlaient que le statut
du rendez-vous — `confirmed` ou `completed` — sans jamais regarder la date. Un
rendez-vous confirmé pour le mois suivant ouvrait donc le droit à un avis, et
une cliente pouvait noter une prestation qu'elle n'avait pas encore reçue.

## Règle retenue
Le rendez-vous doit avoir eu lieu, ce qui se constate de deux façons :

- soit son statut est `completed` — la praticienne l'a explicitement marqué
  comme terminé, l'avis est alors possible le jour même, à la sortie du salon ;
- soit sa date est révolue, pour le cas où le statut `completed` n'est pas
  utilisé systématiquement.

Les deux sont acceptées plutôt qu'une seule : exiger `completed` seul
empêcherait tout avis si la gérante ne marque pas ses rendez-vous, et exiger
une date passée seule ferait attendre au lendemain une cliente qui sort de son
rendez-vous.

Un rendez-vous annulé n'ouvre aucun droit, comme auparavant.
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.reviewable_appointments()
RETURNS TABLE (appointment_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT a.id
  FROM public.appointments a
  WHERE a.status IN ('confirmed', 'completed')
    -- La prestation doit avoir été reçue.
    AND (a.status = 'completed' OR a.date < public.salon_today())
    AND (
      a.email = auth.email()
      OR EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = a.client_id AND c.user_id = auth.uid()
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.reviews r WHERE r.appointment_id = a.id
    );
$$;

GRANT EXECUTE ON FUNCTION public.reviewable_appointments() TO authenticated;

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
    AND (a.status = 'completed' OR a.date < public.salon_today())
    AND (
      a.email = v_email
      OR EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = a.client_id AND c.user_id = v_uid
      )
    );

  IF NOT FOUND THEN
    -- Message distinct selon la cause : une cliente qui vient de réserver doit
    -- comprendre qu'elle doit attendre, pas croire à une erreur.
    IF EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = p_appointment_id
        AND a.status = 'confirmed'
        AND a.date >= public.salon_today()
    ) THEN
      RAISE EXCEPTION 'Vous pourrez donner votre avis après votre rendez-vous'
        USING ERRCODE = '22023';
    END IF;

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
-- a) Un rendez-vous confirmé à venir n'ouvre plus de droit. Depuis un compte
--    cliente ayant un rendez-vous futur confirmé :
--
--    select public.submit_review('<id du rendez-vous futur>', 5, 'test');
--
--    Résultat attendu : « Vous pourrez donner votre avis après votre
--    rendez-vous ».
--
-- b) Un rendez-vous passé, ou marqué terminé, reste éligible :
--
--    select * from public.reviewable_appointments();
--
--    Ne doit contenir que des rendez-vous dont la date est révolue ou dont le
--    statut est `completed`.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- Rejouer les deux fonctions depuis
-- 20260813100000_reviews_multiple_images.sql et
-- 20260813080000_reviews_by_service.sql.
