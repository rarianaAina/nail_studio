/*
# L'administratrice peut consigner un rendez-vous passé

## Symptôme
Créer un rendez-vous à une date révolue depuis l'administration échoue avec
`23505 — Ce créneau n'est plus disponible`, remonté en HTTP 409.

## Cause
`create_public_appointment()` vérifie la disponibilité du créneau via
`get_available_times()`, qui ne renvoie plus rien pour une date passée depuis
l'ajout du contrôle des dates révolues. La création échoue donc pour tout le
monde — alors que le trigger `reject_past_appointment()` exempte explicitement
l'administratrice, précisément pour lui permettre de consigner une cliente
venue sans réservation.

Les deux règles se contredisaient : l'une autorisait, l'autre bloquait en
amont.

## Correctif
Le contrôle de disponibilité est ignoré lorsque l'administratrice enregistre un
rendez-vous à une date révolue. La disponibilité d'un créneau passé n'a pas de
sens : il s'agit de consigner ce qui a eu lieu, pas de réserver.

Le contrôle reste appliqué pour toute date présente ou future, y compris à
l'administratrice. Elle est protégée du double-engagement comme les autres, et
reçoit un message clair plutôt qu'un chevauchement créé en silence. Lui
permettre de forcer un créneau occupé serait une décision distincte, à prendre
explicitement.
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_client_name        text,
  p_phone              text,
  p_email              text,
  p_service_ids        uuid[],
  p_date               date,
  p_time               text,
  p_payment_method_id  uuid DEFAULT NULL,
  p_reference_images   jsonb DEFAULT '[]'::jsonb,
  p_client_notes       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_services     jsonb;
  v_client_id    uuid;
  v_appointment  public.appointments%ROWTYPE;
  v_settings     public.reminder_settings%ROWTYPE;
  v_service_name text;
  v_duration     integer;
  v_historique   boolean;
BEGIN
  IF p_client_name IS NULL OR btrim(p_client_name) = '' THEN
    RAISE EXCEPTION 'Le nom est requis' USING ERRCODE = '22023';
  END IF;
  IF p_phone IS NULL OR btrim(p_phone) = '' THEN
    RAISE EXCEPTION 'Le téléphone est requis' USING ERRCODE = '22023';
  END IF;
  IF p_service_ids IS NULL OR array_length(p_service_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Au moins une prestation est requise' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_agg(
           jsonb_build_object(
             'id', s.id, 'name', s.name,
             'price', s.price, 'duration', s.duration
           ) ORDER BY s.name
         ),
         string_agg(s.name, ' + ' ORDER BY s.name),
         SUM(s.duration)::int
    INTO v_services, v_service_name, v_duration
  FROM public.services s
  WHERE s.id = ANY(p_service_ids);

  IF v_services IS NULL THEN
    RAISE EXCEPTION 'Prestations introuvables' USING ERRCODE = '22023';
  END IF;

  -- Saisie a posteriori par l'administratrice : on consigne ce qui a eu lieu.
  v_historique := public.is_admin() AND p_date < public.salon_today();

  IF NOT v_historique THEN
    PERFORM pg_advisory_xact_lock(hashtext('booking:' || p_date::text));

    IF NOT EXISTS (
      SELECT 1 FROM public.get_available_times(p_date, v_duration) t
      WHERE t.slot_label = p_time
    ) THEN
      RAISE EXCEPTION 'Ce créneau n''est plus disponible' USING ERRCODE = '23505';
    END IF;
  END IF;

  IF p_email IS NOT NULL AND btrim(p_email) <> '' THEN
    SELECT c.id INTO v_client_id
    FROM public.clients c WHERE c.email = p_email LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (name, phone, email)
    VALUES (p_client_name, p_phone, NULLIF(btrim(COALESCE(p_email, '')), ''))
    RETURNING id INTO v_client_id;
  END IF;

  INSERT INTO public.appointments (
    client_id, client_name, phone, email, services, "date", "time",
    status, payment_method_id, reference_images, client_notes
  )
  VALUES (
    v_client_id, p_client_name, p_phone,
    NULLIF(btrim(COALESCE(p_email, '')), ''),
    v_services, p_date, p_time,
    'pending', p_payment_method_id,
    COALESCE(p_reference_images, '[]'::jsonb), p_client_notes
  )
  RETURNING * INTO v_appointment;

  -- Aucun rappel pour un rendez-vous déjà passé : il partirait pour une date
  -- révolue.
  IF NOT v_historique THEN
    SELECT * INTO v_settings FROM public.reminder_settings LIMIT 1;

    IF FOUND AND v_settings.enabled THEN
      INSERT INTO public.reminders (
        appointment_id, client_name, client_phone, client_email,
        service_name, appointment_date, appointment_time,
        scheduled_at, recipients, sent
      )
      VALUES (
        v_appointment.id::text, p_client_name, p_phone,
        NULLIF(btrim(COALESCE(p_email, '')), ''),
        v_service_name, p_date, p_time,
        ((p_date + p_time::time) AT TIME ZONE public.salon_timezone())
          - make_interval(hours => v_settings.delay_hours),
        v_settings.recipients, false
      );
    END IF;
  END IF;

  RETURN to_jsonb(v_appointment);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_appointment(
  text, text, text, uuid[], date, text, uuid, jsonb, text
) TO anon, authenticated;

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Depuis l'administration, créer un rendez-vous à une date passée aboutit.
--
-- b) Depuis un onglet non connecté, la réservation à une date passée reste
--    refusée — le trigger `reject_past_appointment()` s'applique toujours.
--
-- c) Aucun rappel n'est créé pour un rendez-vous consigné a posteriori :
--
--    select count(*) from public.reminders r
--    join public.appointments a on a.id::text = r.appointment_id
--    where a.date < public.salon_today();
--
--    Résultat attendu : 0 pour les rendez-vous saisis après cette migration.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- Rejouer create_public_appointment() depuis
-- 20260813010000_fix_salon_timezone.sql.
