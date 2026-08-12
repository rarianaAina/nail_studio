/*
# Avis clientes : dépôt contrôlé, photo, et modération

## Contexte
La table `reviews` existait mais aucun code n'y insérait quoi que ce soit, et
sa policy d'insertion acceptait n'importe quelle ligne — la phase A a seulement
empêché l'auto-certification. Aucune page n'affichait les avis.

## Règles retenues (décision du 13 août 2026)
1. Seule une cliente ayant eu un rendez-vous **confirmé ou terminé** peut
   déposer un avis, et uniquement sur ce rendez-vous.
2. **Un avis par rendez-vous** — une cliente peut être satisfaite en mars et
   déçue en juin, chaque visite a sa voix.
3. Un avis peut être accompagné d'une **photographie**.
4. **Tout avis est validé par l'administratrice avant publication.**

## Conséquence assumée
Le dépôt exige d'être identifiée : sans compte, impossible de rattacher un avis
à un rendez-vous. Les clientes ayant réservé en anonyme ne peuvent donc pas en
laisser tant qu'elles ne créent pas de compte avec la même adresse — la liaison
est alors automatique.

## Colonnes
`verified` conserve son sens de « cliente vérifiée » et vaut désormais toujours
vrai : un avis ne peut exister sans rendez-vous rattaché. La modération est
portée par une colonne distincte, `status`, car elle décrit un autre état.
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Colonnes
-- ---------------------------------------------------------------------------

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id      uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url      text,
  ADD COLUMN IF NOT EXISTS status         text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderated_at   timestamptz;

COMMENT ON COLUMN public.reviews.status IS
  'pending | approved | rejected — état de modération. Seuls les avis approuvés sont publics.';

-- Un avis par rendez-vous. La contrainte porte la règle : sans elle, un double
-- envoi simultané passerait entre les mailles du contrôle applicatif.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_appointment
  ON public.reviews (appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reviews_status_idx ON public.reviews (status);

-- Les avis antérieurs à cette migration — s'il en existe — sont considérés
-- comme déjà publiés pour ne pas les faire disparaître.
UPDATE public.reviews SET status = 'approved' WHERE status = 'pending' AND appointment_id IS NULL;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_status_valide CHECK (status IN ('pending', 'approved', 'rejected'))
  NOT VALID;

-- ---------------------------------------------------------------------------
-- 2. Dépôt d'un avis
-- ---------------------------------------------------------------------------
-- Le contrôle ne peut pas vivre dans une policy : il faut vérifier que le
-- rendez-vous appartient bien à la personne connectée ET qu'il a eu lieu.

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
  v_uid    uuid := auth.uid();
  v_email  text := auth.email();
  v_appt   public.appointments%ROWTYPE;
  v_name   text;
  v_service text;
  v_id     uuid;
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

  -- Le rendez-vous doit exister, appartenir à la personne connectée, et avoir
  -- eu lieu. Un rendez-vous en attente ou annulé n'ouvre aucun droit.
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
  SELECT string_agg(s->>'name', ' + ')
    INTO v_service
  FROM jsonb_array_elements(COALESCE(v_appt.services, '[]'::jsonb)) s;

  INSERT INTO public.reviews (
    appointment_id, client_id, name, rating, comment,
    service, image_url, verified, status, date
  )
  VALUES (
    p_appointment_id, v_appt.client_id, v_name, p_rating, btrim(p_comment),
    v_service, NULLIF(btrim(COALESCE(p_image_url, '')), ''),
    -- Un avis ne peut exister sans rendez-vous rattaché : il est vérifié par
    -- construction.
    true, 'pending', public.salon_today()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_review(uuid, integer, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Rendez-vous ouvrant droit à un avis
-- ---------------------------------------------------------------------------
-- Évite à l'espace cliente de deviner la règle : la base répond directement.

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

-- ---------------------------------------------------------------------------
-- 4. Visibilité
-- ---------------------------------------------------------------------------
-- Le public ne voit que les avis approuvés. L'insertion directe disparaît :
-- elle passe désormais par submit_review().

DROP POLICY IF EXISTS reviews_public_select ON public.reviews;
CREATE POLICY reviews_public_select ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS reviews_public_insert ON public.reviews;

DROP POLICY IF EXISTS reviews_admin_select ON public.reviews;
CREATE POLICY reviews_admin_select ON public.reviews
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Une cliente peut relire son propre avis, y compris tant qu'il est en attente.
DROP POLICY IF EXISTS reviews_own_select ON public.reviews;
CREATE POLICY reviews_own_select ON public.reviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = reviews.client_id AND c.user_id = auth.uid()
    )
  );

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Le public ne voit que les avis approuvés :
--
--    select status, count(*) from public.reviews group by status;
--
-- b) Depuis un compte cliente, sur un rendez-vous qui ne lui appartient pas :
--
--    select public.submit_review('<id d''un autre rendez-vous>', 5, 'test');
--
--    Résultat attendu : ERREUR « Aucun rendez-vous éligible ».
--
-- c) Sur un rendez-vous en attente — non confirmé — le refus doit être le même.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- BEGIN;
--   DROP FUNCTION IF EXISTS public.submit_review(uuid, integer, text, text);
--   DROP FUNCTION IF EXISTS public.reviewable_appointments();
--   DROP INDEX IF EXISTS public.reviews_one_per_appointment;
--   DROP POLICY IF EXISTS reviews_own_select ON public.reviews;
--   DROP POLICY IF EXISTS reviews_public_select ON public.reviews;
--   CREATE POLICY reviews_public_select ON public.reviews
--     FOR SELECT TO anon, authenticated USING (true);
--   ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_status_valide;
--   ALTER TABLE public.reviews
--     DROP COLUMN IF EXISTS appointment_id, DROP COLUMN IF EXISTS client_id,
--     DROP COLUMN IF EXISTS image_url, DROP COLUMN IF EXISTS status,
--     DROP COLUMN IF EXISTS moderated_at;
-- COMMIT;
