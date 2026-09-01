/*
# Les points de fidélité suivent le réglage, toujours

## Symptôme
Deux clientes ayant dépensé 45 € affichaient l'une 45 points, l'autre 450.

## Cause
`recalc_client_totals()` recalcule les points depuis l'historique, mais n'est
déclenchée que par les triggers posés sur `appointments`. Rien n'écoute
`loyalty_settings` : changer le taux ne retouchait aucune fiche.

Chaque cliente conservait donc le taux en vigueur au dernier moment où l'un de
ses rendez-vous avait bougé. La différence entre 45 et 450 points ne tenait à
rien de justifiable — seulement au hasard des modifications survenues après le
changement de taux.

`recalc_all_loyalty_points()` existait déjà, mais n'était appelée par personne.

## Trois failles, non une
1. Le taux ne se propageait pas. Un trigger sur `loyalty_settings` s'en charge.

2. `recalc_client_totals()` lisait le taux avec `LIMIT 1` sans garantie
   d'unicité : deux lignes de réglage auraient donné un taux arbitraire, et
   variable d'un appel à l'autre. La table devient un singleton.

3. Le taux était lu dans une variable `integer`, alors que l'écran propose des
   demi-points (`step={0.5}`). Régler 0,5 point par euro était arrondi en
   silence : le réglage annonçait une chose et la base en appliquait une autre.
   Le calcul passe en `numeric`, l'arrondi n'intervenant plus qu'une fois, sur
   le total.

## Portée
Les points ne sont jamais accumulés, ils sont recalculés depuis les
rendez-vous confirmés ou terminés. Changer le taux revalorise donc tout
l'historique — c'est ce qu'annonce l'écran de réglage, qui présente « X points
par euro » comme une règle unique et non comme un barème daté.
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Un seul réglage possible
-- ---------------------------------------------------------------------------

-- En cas de lignes multiples, la plus récente fait foi : c'est celle que la
-- gérante a enregistrée en dernier.
DELETE FROM public.loyalty_settings
WHERE id <> (
  SELECT id FROM public.loyalty_settings
  ORDER BY updated_at DESC NULLS LAST, id
  LIMIT 1
);

-- Un index unique sur une expression constante n'autorise qu'une ligne.
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_settings_ligne_unique
  ON public.loyalty_settings ((true));

-- ---------------------------------------------------------------------------
-- 2. Le taux accepte les décimales que l'écran propose
-- ---------------------------------------------------------------------------

ALTER TABLE public.loyalty_settings
  ALTER COLUMN points_per_euro TYPE numeric(6,2)
  USING points_per_euro::numeric;

ALTER TABLE public.loyalty_settings
  ALTER COLUMN points_per_euro SET DEFAULT 1;

-- Un taux nul ou négatif n'a pas de sens ; le plafond garde le produit dans
-- les bornes de `clients.loyalty_points`, qui est un entier sur 32 bits.
ALTER TABLE public.loyalty_settings
  DROP CONSTRAINT IF EXISTS loyalty_settings_taux_valide;
ALTER TABLE public.loyalty_settings
  ADD CONSTRAINT loyalty_settings_taux_valide
  CHECK (points_per_euro > 0 AND points_per_euro <= 1000);

-- Sans ligne de réglage, `recalc_client_totals()` retombait silencieusement
-- sur 1 point par euro. Mieux vaut une ligne explicite.
INSERT INTO public.loyalty_settings (points_per_euro)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_settings);

-- ---------------------------------------------------------------------------
-- 3. Le calcul respecte les décimales
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.recalc_client_totals(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  -- `numeric` et non `integer` : un taux de 0,5 était auparavant arrondi dès
  -- la lecture, avant même d'avoir servi.
  v_points_per_euro numeric;
BEGIN
  IF p_client_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(points_per_euro, 1) INTO v_points_per_euro
  FROM public.loyalty_settings LIMIT 1;
  v_points_per_euro := COALESCE(v_points_per_euro, 1);

  UPDATE public.clients c
  SET total_spent = agg.total,
      visit_count = agg.nb,
      last_visit  = agg.derniere,
      -- L'arrondi n'intervient qu'ici, sur le total : arrondir plus tôt
      -- ferait perdre les demi-points avant qu'ils ne s'additionnent.
      loyalty_points = round(agg.total * v_points_per_euro)::integer
  FROM (
    SELECT COALESCE(SUM(public.appointment_total_price(a.services)), 0) AS total,
           COUNT(*)                                                     AS nb,
           MAX(a.date)                                                  AS derniere
    FROM public.appointments a
    WHERE a.client_id = p_client_id
      AND a.status IN ('confirmed', 'completed')
  ) agg
  WHERE c.id = p_client_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Le réglage se propage de lui-même
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.loyalty_settings_propager()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Le nombre de clientes d'un salon se compte en centaines : la reprise
  -- complète tient dans la transaction de l'enregistrement.
  PERFORM public.recalc_all_loyalty_points();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS loyalty_settings_recalcul ON public.loyalty_settings;
CREATE TRIGGER loyalty_settings_recalcul
  AFTER INSERT OR UPDATE OF points_per_euro ON public.loyalty_settings
  FOR EACH ROW
  -- À l'insertion, OLD n'existe pas : la condition ne porte que sur la
  -- modification, où un enregistrement sans changement de taux est fréquent.
  WHEN (TG_OP = 'INSERT' OR OLD.points_per_euro IS DISTINCT FROM NEW.points_per_euro)
  EXECUTE FUNCTION public.loyalty_settings_propager();

-- ---------------------------------------------------------------------------
-- 5. Reprise de l'existant
-- ---------------------------------------------------------------------------
-- Les fiches divergent aujourd'hui selon la date de leur dernier rendez-vous
-- modifié. Toutes sont réalignées sur le taux courant.

SELECT public.recalc_all_loyalty_points();

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Plus aucune divergence : le rapport est le même partout.
--
--    select points_per_euro from public.loyalty_settings;
--    select total_spent, loyalty_points,
--           round(loyalty_points::numeric / nullif(total_spent, 0), 2) as rapport
--    from public.clients where total_spent > 0 order by rapport;
--
-- b) Changer le taux propage immédiatement :
--
--    update public.loyalty_settings set points_per_euro = 2;
--    select total_spent, loyalty_points from public.clients where total_spent > 0;
--
-- c) Les demi-points ne sont plus perdus :
--
--    update public.loyalty_settings set points_per_euro = 0.5;
--    -- une cliente à 45 € doit afficher 23 points, non 45 ni 0.
--
-- d) Le singleton tient :
--
--    insert into public.loyalty_settings (points_per_euro) values (3);
--    -- doit échouer sur loyalty_settings_ligne_unique.
--
-- e) Un taux nul est refusé :
--
--    update public.loyalty_settings set points_per_euro = 0;  -- doit échouer.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS loyalty_settings_recalcul ON public.loyalty_settings;
-- DROP FUNCTION IF EXISTS public.loyalty_settings_propager();
-- DROP INDEX IF EXISTS public.loyalty_settings_ligne_unique;
-- ALTER TABLE public.loyalty_settings DROP CONSTRAINT IF EXISTS loyalty_settings_taux_valide;
-- La version précédente de recalc_client_totals() est dans
-- 20260813180000_consolidate_client_totals.sql.
