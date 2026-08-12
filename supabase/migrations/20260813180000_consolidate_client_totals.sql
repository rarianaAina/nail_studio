/*
# Compteurs des clientes : un seul calcul, incluant les rendez-vous terminés

## Symptômes
- Les points de fidélité n'augmentent pas à la confirmation d'un rendez-vous.
- Marquer un rendez-vous comme terminé fait *baisser* les points et le montant
  cumulé.
- `clients.visit_count` reste à zéro pour toutes les clientes, alors que la
  fiche cliente l'affiche.

## Causes
Deux triggers entretenaient les compteurs, chacun avec sa propre logique :

- `update_client_total_spent_on_confirm` → `total_spent`
- `update_loyalty_points` → `loyalty_points` ET `total_spent`

Tous deux ne comptaient que `status = 'confirmed'`. Un rendez-vous passé à
`completed` sortait donc de l'assiette : ses points et son montant étaient
retirés au moment même où la prestation était constatée comme accomplie. C'est
l'inverse du comportement attendu.

Ils écrivaient de plus la même colonne sur les mêmes événements, le dernier
exécuté l'emportant — une redondance signalée lors d'un correctif précédent
sans être traitée.

Enfin, `visit_count` et `last_visit` n'étaient alimentés par personne.

## Correctif
Les deux triggers sont remplacés par un seul, qui recalcule l'ensemble des
compteurs d'une cliente à partir de ses rendez-vous confirmés **ou** terminés.

Le recalcul est intégral plutôt qu'incrémental : il ne peut pas dériver, et
reste juste quel que soit le chemin — création, changement de statut,
modification de prestations, suppression. C'est précisément la logique par
branches qui avait produit le défaut.
*/

BEGIN;

/**
 * Recalcule les compteurs d'une cliente depuis ses rendez-vous.
 *
 * L'assiette retenue est `confirmed` ou `completed` : un rendez-vous honoré
 * compte, qu'il ait été explicitement clos ou non.
 */
CREATE OR REPLACE FUNCTION public.recalc_client_totals(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_points_per_euro integer;
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
      loyalty_points = (agg.total * v_points_per_euro)::integer
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

/** Recalcule après toute écriture sur un rendez-vous. */
CREATE OR REPLACE FUNCTION public.appointments_sync_client_totals()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.recalc_client_totals(NEW.client_id);

  -- Un rendez-vous rattaché à une autre cliente impose de reprendre les deux.
  IF TG_OP <> 'INSERT' AND OLD.client_id IS DISTINCT FROM NEW.client_id THEN
    PERFORM public.recalc_client_totals(OLD.client_id);
  END IF;

  RETURN NULL;
END;
$$;

/** Variante pour la suppression, où NEW n'existe pas. */
CREATE OR REPLACE FUNCTION public.appointments_sync_client_totals_del()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.recalc_client_totals(OLD.client_id);
  RETURN NULL;
END;
$$;

-- Les deux triggers historiques disparaissent : leur logique par branches est
-- entièrement reprise par le recalcul intégral.
DROP TRIGGER IF EXISTS update_client_spent_on_confirm ON public.appointments;
DROP TRIGGER IF EXISTS trigger_update_loyalty_points  ON public.appointments;

DROP TRIGGER IF EXISTS appointments_sync_totals ON public.appointments;
CREATE TRIGGER appointments_sync_totals
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_sync_client_totals();

DROP TRIGGER IF EXISTS appointments_sync_totals_del ON public.appointments;
CREATE TRIGGER appointments_sync_totals_del
  AFTER DELETE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.appointments_sync_client_totals_del();

-- Reprise de toutes les clientes.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.clients LOOP
    PERFORM public.recalc_client_totals(r.id);
  END LOOP;
END;
$$;

-- Fonction de maintenance alignée sur la même assiette.
CREATE OR REPLACE FUNCTION public.recalc_all_loyalty_points()
RETURNS text
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  r record;
  n integer := 0;
BEGIN
  FOR r IN SELECT id FROM public.clients LOOP
    PERFORM public.recalc_client_totals(r.id);
    n := n + 1;
  END LOOP;
  RETURN format('%s clientes recalculées', n);
END;
$$;

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Les compteurs correspondent aux rendez-vous honorés :
--
--    select c.name, c.visit_count, c.total_spent, c.loyalty_points,
--           (select count(*) from appointments a
--            where a.client_id = c.id and a.status in ('confirmed','completed')) as rdv
--    from clients c order by c.total_spent desc limit 10;
--
--    `visit_count` doit égaler `rdv`, et ne plus valoir zéro.
--
-- b) Marquer un rendez-vous comme terminé ne fait plus baisser les compteurs :
--    relever les valeurs avant, puis après le changement de statut.
--
-- c) Une annulation les fait bien baisser.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS appointments_sync_totals ON public.appointments;
-- DROP TRIGGER IF EXISTS appointments_sync_totals_del ON public.appointments;
-- Puis recréer les deux triggers historiques depuis leur définition d'origine.
