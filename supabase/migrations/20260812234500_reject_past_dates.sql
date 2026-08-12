/*
# Refus des dates révolues, côté base

## Contexte
Le calendrier public proposait les dates déjà passées dès lors que des créneaux
y restaient déclarés, et l'administration permettait encore de modifier les
créneaux d'une date révolue.

Ces deux points sont corrigés dans l'interface, mais une garde d'interface ne
protège de rien : les fonctions `get_available_times()` et
`create_public_appointment()` sont exposées à `anon`, et un appel direct
contourne l'écran. La règle est donc portée par la base.

## Fuseau
`current_date` s'évalue dans le fuseau du serveur, généralement UTC. Madagascar
étant à UTC+3, la date UTC est en retard sur la date locale pendant les trois
premières heures de la journée — une réservation pour « hier » resterait
acceptée en début de matinée. La comparaison est donc faite dans le fuseau du
salon.

La journée en cours reste réservable : seules les dates strictement antérieures
sont refusées.
*/

BEGIN;

/** Date du jour telle que la vit le salon. */
CREATE OR REPLACE FUNCTION public.salon_today()
RETURNS date
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT (now() AT TIME ZONE 'Indian/Antananarivo')::date;
$$;

GRANT EXECUTE ON FUNCTION public.salon_today() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Aucun créneau proposé sur une date révolue
-- ---------------------------------------------------------------------------
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
  v_occupies interval;
BEGIN
  -- Une date passée n'a plus de disponibilité, quels que soient les créneaux
  -- qui y restent déclarés.
  IF p_date < public.salon_today() THEN
    RETURN;
  END IF;

  SELECT COALESCE(s.preparation_minutes, 15) INTO v_prep
  FROM public.appointment_settings s LIMIT 1;
  v_prep := COALESCE(v_prep, 15);

  v_occupies := make_interval(mins => GREATEST(COALESCE(p_duration_minutes, 0), 0) + v_prep);

  RETURN QUERY
  WITH occupied AS (
    SELECT (p_date + a.time::time) AS start_ts,
           (p_date + a.time::time)
             + make_interval(mins => public.appointment_occupied_minutes(a.services, v_prep))
             AS end_ts
    FROM public.appointments a
    WHERE a.date = p_date
      AND a.status IN ('pending', 'confirmed')
  )
  SELECT ts.label
  FROM public.time_slots ts
  WHERE ts.date = p_date
    AND ts.active
    AND NOT EXISTS (
      SELECT 1 FROM occupied o
      WHERE (p_date + ts.label::time) < o.end_ts
        AND ((p_date + ts.label::time) + v_occupies) > o.start_ts
    )
  ORDER BY ts.sort_order, ts.label;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_times(date, integer) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Aucune réservation sur une date révolue
-- ---------------------------------------------------------------------------
-- `create_public_appointment()` vérifie déjà la disponibilité du créneau via
-- `get_available_times()`, qui ne renvoie plus rien pour une date passée : la
-- réservation échouerait donc déjà. Le contrôle explicite est ajouté pour que
-- le message d'erreur soit compréhensible plutôt que « ce créneau n'est plus
-- disponible ».

CREATE OR REPLACE FUNCTION public.reject_past_appointment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- L'administratrice peut consigner un rendez-vous passé — saisie a
  -- posteriori d'une cliente venue sans réservation, correction d'oubli.
  IF public.is_admin() OR current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF NEW.date < public.salon_today() THEN
    RAISE EXCEPTION 'Impossible de réserver à une date déjà passée'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_reject_past_date ON public.appointments;
CREATE TRIGGER appointments_reject_past_date
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.reject_past_appointment();

-- ---------------------------------------------------------------------------
-- Créneaux : plus de modification sur une date révolue
-- ---------------------------------------------------------------------------
-- L'écriture de `time_slots` est réservée à l'administratrice depuis la
-- phase A ; ce trigger empêche en plus de toucher au passé, y compris depuis
-- le SQL Editor par mégarde.

CREATE OR REPLACE FUNCTION public.reject_past_time_slot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_date date;
BEGIN
  v_date := COALESCE(NEW.date, OLD.date);

  IF current_user IN ('anon', 'authenticated') AND v_date < public.salon_today() THEN
    RAISE EXCEPTION 'Les créneaux d''une date passée ne sont plus modifiables'
      USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS time_slots_reject_past_date ON public.time_slots;
CREATE TRIGGER time_slots_reject_past_date
  BEFORE INSERT OR UPDATE OR DELETE ON public.time_slots
  FOR EACH ROW EXECUTE FUNCTION public.reject_past_time_slot();

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Aucune disponibilité dans le passé, disponibilités inchangées aujourd'hui :
--
--    select count(*) from get_available_times(public.salon_today() - 1, 60);  -- 0
--    select count(*) from get_available_times(public.salon_today(), 60);      -- inchangé
--
-- b) La date du salon est correcte (UTC+3, sans heure d'été) :
--
--    select public.salon_today(), current_date;
--
--    Les deux peuvent différer d'un jour entre minuit et 3 h UTC : c'est
--    précisément le cas que ce fuseau explicite corrige.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS time_slots_reject_past_date ON public.time_slots;
-- DROP TRIGGER IF EXISTS appointments_reject_past_date ON public.appointments;
-- DROP FUNCTION IF EXISTS public.reject_past_time_slot();
-- DROP FUNCTION IF EXISTS public.reject_past_appointment();
-- Puis rejouer get_available_times() depuis 20260812200000_fix_time_wraparound.sql.
