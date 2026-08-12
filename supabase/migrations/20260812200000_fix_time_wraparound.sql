/*
# Correctif — bouclage sur minuit, et retrait du contrôle de fermeture

## Symptôme
Plus la prestation choisie était longue, plus le nombre de créneaux proposés
augmentait. Une prestation de 30 min ne renvoyait aucun créneau, une de 2h30 en
renvoyait un.

## Cause 1 — l'arithmétique des heures repassait par minuit
`get_available_times()` raisonnait sur le type `time`. En PostgreSQL,
`time + interval` renvoie un `time` et **boucle sur 24 heures** :

    '21:30'::time + interval '2h30'  →  '00:00'

Le contrôle de fermeture `créneau + durée <= fermeture` devenait alors
`'00:00' <= '21:00'`, soit vrai : le créneau passait en débordant de plusieurs
heures. Plus la durée était longue, plus le passage de minuit était probable, et
plus le filtre laissait passer — d'où l'inversion.

Le calcul de fin des rendez-vous existants avait le même défaut : la fin d'un
rendez-vous tardif repassait avant son début, annulant toute détection de
chevauchement. Tous les calculs se font désormais sur des `timestamp` complets,
dont l'addition ne boucle pas.

## Cause 2 — le contrôle de fermeture n'aurait pas dû exister
Précision de la gérante (2026-08-12) : elle accepte des clientes après l'heure de
fermeture affichée. Les horaires de `business_settings` servent l'affichage
public ; ce sont les créneaux de `time_slots`, qu'elle configure date par date,
qui font foi pour la réservation.

Le contrôle est donc retiré. Un créneau déclaré est réservable, sa seule limite
étant de ne pas chevaucher un rendez-vous existant. C'est cohérent avec ses
créneaux de 21h et 21h30 un jeudi dont les horaires annoncent une fermeture à
21h : ce n'était pas une incohérence de configuration, mais un choix.

Le modèle de durée est inchangé : un rendez-vous occupe
`somme des durées + (préparation × nombre de prestations)`.
*/

BEGIN;

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
  SELECT COALESCE(s.preparation_minutes, 15) INTO v_prep
  FROM public.appointment_settings s LIMIT 1;
  v_prep := COALESCE(v_prep, 15);

  -- Place occupée par le rendez-vous envisagé : ses prestations, plus le temps
  -- de préparation qui suivra.
  v_occupies := make_interval(mins => GREATEST(COALESCE(p_duration_minutes, 0), 0) + v_prep);

  RETURN QUERY
  WITH occupied AS (
    -- `p_date + heure` produit un timestamp : contrairement au type `time`,
    -- l'ajout d'un intervalle n'y boucle pas sur 24 heures.
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
    -- Seule contrainte : ne pas recouvrir un rendez-vous existant. Les créneaux
    -- déclarés font foi, y compris après l'heure de fermeture affichée.
    AND NOT EXISTS (
      SELECT 1 FROM occupied o
      WHERE (p_date + ts.label::time) < o.end_ts
        AND ((p_date + ts.label::time) + v_occupies) > o.start_ts
    )
  ORDER BY ts.sort_order, ts.label;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_times(date, integer) TO anon, authenticated;

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATION
-- ---------------------------------------------------------------------------
-- Le nombre de créneaux ne doit jamais augmenter quand la durée augmente :
--
--   select 30  as duree, count(*) from get_available_times('2026-08-13', 30)
--   union all
--   select 120,          count(*) from get_available_times('2026-08-13', 120)
--   union all
--   select 150,          count(*) from get_available_times('2026-08-13', 150);
--
-- Avec un rendez-vous de 2h confirmé à 19h00 le 13 août — poste occupé jusqu'à
-- 21h15 — et des créneaux de 19h00 à 21h30, les trois lignes doivent renvoyer 1 :
-- seul le 21h30 reste, quelle que soit la durée demandée.
