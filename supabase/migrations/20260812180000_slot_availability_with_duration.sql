/*
# Disponibilité des créneaux calculée à partir de la durée

## Contexte
Un créneau n'était rendu indisponible que si un rendez-vous commençait
exactement à la même heure. Une pose de 2h à 10h00 laissait donc le 11h00
réservable, alors que la praticienne est seule et encore occupée.

Décision métier (gérante, 2026-08-12) : créneaux de 30 minutes, blocage de tous
les créneaux couverts par la durée réelle de la prestation, et temps de
préparation entre les prestations. Pas de chevauchement pendant les séchages.

## Modèle retenu
Un rendez-vous occupe :

    somme des durées + (temps de préparation × nombre de prestations)

Le temps de préparation est ajouté APRÈS chaque prestation : il couvre donc à la
fois l'enchaînement de deux prestations d'un même rendez-vous et le battement
avant la cliente suivante.

Le contrôle de fermeture porte en revanche sur la seule durée des prestations :
la préparation peut déborder après l'heure de fermeture, pas le soin lui-même.

## Concurrence
`get_available_times()` ne protège pas d'une double réservation : deux clientes
peuvent valider le même créneau simultanément, chaque transaction ignorant
l'insertion non validée de l'autre. `create_public_appointment()` prend donc un
verrou consultatif par date, puis revérifie la disponibilité avant d'insérer.
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Temps de préparation, réglable
-- ---------------------------------------------------------------------------

ALTER TABLE public.appointment_settings
  ADD COLUMN IF NOT EXISTS preparation_minutes integer NOT NULL DEFAULT 15;

COMMENT ON COLUMN public.appointment_settings.preparation_minutes IS
  'Minutes ajoutées après chaque prestation : nettoyage du poste et battement avant la cliente suivante.';

-- ---------------------------------------------------------------------------
-- 2. Durée occupée par un rendez-vous
-- ---------------------------------------------------------------------------
-- Lit le JSONB `services` ; repli sur la colonne héritée pour les rendez-vous
-- antérieurs à la bascule, dont `services` est vide.

CREATE OR REPLACE FUNCTION public.appointment_occupied_minutes(
  p_services jsonb,
  p_prep     integer
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    (
      SELECT SUM((s->>'duration')::int) + (COUNT(*)::int * p_prep)
      FROM jsonb_array_elements(p_services) s
      WHERE jsonb_typeof(p_services) = 'array'
    ),
    -- Aucune prestation exploitable : on réserve au moins un créneau + préparation.
    30 + p_prep
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Créneaux réellement disponibles
-- ---------------------------------------------------------------------------
-- `p_duration_minutes` est la somme des durées des prestations choisies.
-- À 0 — page « disponibilités », aucune prestation sélectionnée — la fonction
-- renvoie les créneaux qu'aucun rendez-vous n'occupe déjà.

CREATE OR REPLACE FUNCTION public.get_available_times(
  p_date             date,
  p_duration_minutes integer DEFAULT 0
)
RETURNS TABLE (slot_label text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prep     integer;
  v_close    time;
  v_day      text;
  v_occupies interval;
  v_service  interval;
BEGIN
  SELECT COALESCE(s.preparation_minutes, 15) INTO v_prep
  FROM public.appointment_settings s LIMIT 1;
  v_prep := COALESCE(v_prep, 15);

  v_occupies := make_interval(mins => GREATEST(COALESCE(p_duration_minutes, 0), 0) + v_prep);
  v_service  := make_interval(mins => GREATEST(COALESCE(p_duration_minutes, 0), 0));

  -- Heure de fermeture du jour. Le nom du jour est dérivé de l'indice et non
  -- de la locale du serveur, qui n'est pas garantie.
  v_day := (ARRAY['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'])
             [EXTRACT(DOW FROM p_date)::int + 1];

  SELECT (h->>'close')::time INTO v_close
  FROM public.business_settings bs,
       LATERAL jsonb_array_elements(bs.hours) h
  WHERE h->>'day' = v_day
    AND COALESCE((h->>'closed')::boolean, false) = false
  LIMIT 1;

  RETURN QUERY
  WITH occupied AS (
    SELECT a.time::time AS start_t,
           a.time::time
             + make_interval(mins => public.appointment_occupied_minutes(a.services, v_prep))
             AS end_t
    FROM public.appointments a
    WHERE a.date = p_date
      AND a.status IN ('pending', 'confirmed')
  )
  SELECT ts.label
  FROM public.time_slots ts
  WHERE ts.date = p_date
    AND ts.active
    -- La prestation doit être terminée avant la fermeture.
    AND (v_close IS NULL OR (ts.label::time + v_service) <= v_close)
    -- Aucun recouvrement avec un rendez-vous existant.
    AND NOT EXISTS (
      SELECT 1 FROM occupied o
      WHERE ts.label::time < o.end_t
        AND (ts.label::time + v_occupies) > o.start_t
    )
  ORDER BY ts.sort_order, ts.label;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_times(date, integer) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Refus des chevauchements à l'insertion
-- ---------------------------------------------------------------------------
-- Reprend create_public_appointment() en y ajoutant le verrou par date et la
-- revérification. Le reste du corps est identique à la phase B.

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

  -- Sérialise les réservations d'une même date : sans ce verrou, deux clientes
  -- validant le même créneau au même instant passeraient toutes les deux, chaque
  -- transaction ignorant l'insertion non encore validée de l'autre.
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
      ((p_date + p_time::time) AT TIME ZONE 'Indian/Antananarivo')
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

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Sur une date ayant un rendez-vous, comparer la liste brute et la liste
--    filtrée pour une prestation de 2h30 :
--
--    select label from time_slots where date = '2026-08-20' and active order by sort_order;
--    select * from get_available_times('2026-08-20', 150);
--
--    La seconde doit être strictement plus courte, les créneaux couverts par un
--    rendez-vous existant ayant disparu.
--
-- b) Le refus de chevauchement est effectif :
--
--    select create_public_appointment('Test','0340000000',null,
--             array(select id from services limit 1)::uuid[],
--             '2026-08-20','<un créneau déjà occupé>');
--
--    Résultat attendu : ERREUR « Ce créneau n'est plus disponible ».

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- Rejouer la version de create_public_appointment() figurant dans
-- 20260812160000_phase_b_close_public_data_leak.sql, puis :
--   DROP FUNCTION IF EXISTS public.get_available_times(date, integer);
--   DROP FUNCTION IF EXISTS public.appointment_occupied_minutes(jsonb, integer);
--   ALTER TABLE public.appointment_settings DROP COLUMN IF EXISTS preparation_minutes;
