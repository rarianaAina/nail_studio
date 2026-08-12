/*
# Correctif — `update_client_total_spent_on_confirm` sommait la colonne supprimée

## Symptôme
Confirmer un rendez-vous depuis l'administration échouait avec
`42703 — column "price" does not exist`.

## Cause
Ce trigger, antérieur aux interventions de cette session, recalculait
`clients.total_spent` par `SUM(price)` sur `appointments`. La colonne `price` a
été retirée après reprise de son contenu dans le JSONB `services`.

Les deux fonctions de fidélité — `update_loyalty_points` et
`recalc_all_loyalty_points` — travaillaient déjà sur le JSONB et ne sont pas
concernées.

## Correctif
Le montant est extrait du JSONB, via une fonction dédiée que les trois
fonctions concernées peuvent partager plutôt que de recopier la même sous-
requête.

## Redondance signalée, non corrigée
`update_loyalty_points` met déjà à jour `clients.total_spent`, avec le même
calcul. Les deux triggers écrivent donc la même colonne sur les mêmes
événements, et le dernier exécuté l'emporte. Le résultat est identique une fois
les deux alignés, mais l'un des deux est superflu.

Je ne le supprime pas ici : leurs listes d'événements diffèrent peut-être, et
retirer un trigger qui touche à des montants mérite une décision explicite
plutôt qu'un effet de bord de correctif.
*/

BEGIN;

/**
 * Montant d'un rendez-vous : somme des prix contenus dans le JSONB `services`.
 *
 * Remplace la lecture de l'ancienne colonne `price`, qui ne portait qu'une
 * prestation par rendez-vous.
 */
CREATE OR REPLACE FUNCTION public.appointment_total_price(p_services jsonb)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    (SELECT SUM((s->>'price')::numeric)
     FROM jsonb_array_elements(COALESCE(p_services, '[]'::jsonb)) s),
    0
  );
$$;

CREATE OR REPLACE FUNCTION public.update_client_total_spent_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR
     (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status != 'confirmed') OR
     (TG_OP = 'DELETE' AND OLD.status = 'confirmed') THEN

    UPDATE clients
    SET total_spent = (
      SELECT COALESCE(SUM(public.appointment_total_price(a.services)), 0)
      FROM appointments a
      WHERE a.client_id = COALESCE(NEW.client_id, OLD.client_id)
        AND a.status = 'confirmed'
    )
    WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Reprise : les montants cumulés enregistrés depuis la suppression de la
-- colonne peuvent avoir dérivé. Recalcul pour toutes les clientes.
UPDATE clients c
SET total_spent = (
  SELECT COALESCE(SUM(public.appointment_total_price(a.services)), 0)
  FROM appointments a
  WHERE a.client_id = c.id AND a.status = 'confirmed'
);

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) La mise à jour d'un rendez-vous aboutit :
--
--    update public.appointments set status = status
--    where id = (select id from public.appointments limit 1);
--
-- b) Les montants cumulés correspondent bien aux rendez-vous confirmés :
--
--    select c.name, c.total_spent,
--           (select coalesce(sum(public.appointment_total_price(a.services)), 0)
--            from appointments a
--            where a.client_id = c.id and a.status = 'confirmed') as recalcul
--    from clients c
--    order by c.total_spent desc
--    limit 10;
--
--    Les deux colonnes doivent être égales.
--
-- c) `visit_count` n'est mis à jour par aucun trigger — il reste à zéro pour
--    toutes les clientes alors que la fiche cliente l'affiche. À traiter
--    séparément.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- Remplacer `public.appointment_total_price(a.services)` par `a.price` dans la
-- fonction ci-dessus — ce qui suppose de recréer la colonne.
