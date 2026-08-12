/*
# Correctif — fuseau horaire du salon

## Contexte
Trois fonctions codaient en dur le fuseau `Indian/Antananarivo`, déduit à tort
de l'adresse présente dans les données de démonstration. L'entreprise est
française : le fuseau applicable est `Europe/Paris`.

## Conséquences du défaut
- `salon_today()` basculait une à deux heures trop tôt. En fin de soirée, la
  journée en cours était déjà tenue pour passée, et les réservations du jour
  refusées par le contrôle des dates révolues.
- `scheduled_at` des rappels était calculé avec le même décalage. Sans effet
  visible tant qu'aucun rappel n'est envoyé, mais les valeurs enregistrées
  depuis la mise en place sont fausses.

`Europe/Paris` applique en outre l'heure d'été, contrairement à Antananarivo :
l'écart n'était pas même constant selon la saison.

## Correctif
Le fuseau est extrait dans une fonction unique, afin qu'un futur changement se
fasse en un seul endroit plutôt que dans trois définitions recopiées.

Les rappels déjà enregistrés sont recalculés.
*/

BEGIN;

/**
 * Fuseau de référence du salon. Toute conversion entre une heure de
 * rendez-vous — exprimée dans le fuseau local — et un horodatage absolu doit
 * passer par ici.
 */
CREATE OR REPLACE FUNCTION public.salon_timezone()
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT 'Europe/Paris'::text;
$$;

GRANT EXECUTE ON FUNCTION public.salon_timezone() TO anon, authenticated;

-- Date du jour telle que la vit le salon.
CREATE OR REPLACE FUNCTION public.salon_today()
RETURNS date
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT (now() AT TIME ZONE public.salon_timezone())::date;
$$;

GRANT EXECUTE ON FUNCTION public.salon_today() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Création d'un rendez-vous public : même correction sur le calcul du rappel
-- ---------------------------------------------------------------------------
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

  PERFORM pg_advisory_xact_lock(hashtext('booking:' || p_date::text));

  IF NOT EXISTS (
    SELECT 1 FROM public.get_available_times(p_date, v_duration) t
    WHERE t.slot_label = p_time
  ) THEN
    RAISE EXCEPTION 'Ce créneau n''est plus disponible' USING ERRCODE = '23505';
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

  RETURN to_jsonb(v_appointment);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_appointment(
  text, text, text, uuid[], date, text, uuid, jsonb, text
) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reprise des rappels déjà enregistrés avec le mauvais fuseau
-- ---------------------------------------------------------------------------
UPDATE public.reminders r
SET scheduled_at = ((r.appointment_date + r.appointment_time::time)
                      AT TIME ZONE public.salon_timezone())
                   - make_interval(hours => COALESCE(
                       (SELECT delay_hours FROM public.reminder_settings LIMIT 1), 24))
WHERE r.sent = false;

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Le fuseau est bien celui de Paris :
--
--    select public.salon_timezone(), public.salon_today(), current_date;
--
-- b) Un rappel de 24 h avant un rendez-vous à 10h00 doit être programmé la
--    veille à 10h00 heure de Paris :
--
--    select appointment_date, appointment_time,
--           scheduled_at AT TIME ZONE public.salon_timezone() as heure_locale
--    from public.reminders where sent = false order by scheduled_at limit 5;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- Remplacer le corps de salon_timezone() par 'Indian/Antananarivo', puis
-- rejouer la reprise des rappels ci-dessus.
