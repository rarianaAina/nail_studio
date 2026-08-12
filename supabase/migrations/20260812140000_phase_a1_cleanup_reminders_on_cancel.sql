/*
# Phase A.1 — Nettoyage des rappels à l'annulation, côté base

## Contexte
Correctif d'une régression introduite par la phase A.

`appointmentService.update()` supprime les rappels d'un rendez-vous lorsque son
statut passe à 'cancelled'. Cette suppression était portée par la policy
`anon_delete_reminders` (rôles anon + authenticated, `USING (true)`), retirée en
phase A parce qu'elle laissait n'importe qui effacer l'ensemble des rappels.

Conséquence : lorsqu'une cliente annule depuis son espace
(ClientSpace.tsx → updateStatus → update), le DELETE ne correspond plus à aucune
ligne. PostgREST ne renvoie pas d'erreur dans ce cas — l'annulation aboutit donc
normalement, mais le rappel subsiste. Sans effet à ce jour, les rappels n'étant
pas encore réellement envoyés ; à corriger avant tout branchement d'un envoi.

## Approche
Déplacer le nettoyage dans un trigger `SECURITY DEFINER` sur `appointments`.
Il s'applique quel que soit l'acteur — cliente, administratrice ou traitement
automatique — sans rouvrir de droit de suppression aux clientes.

L'appel client à `reminderService.deleteByAppointmentId()` devient redondant
mais reste inoffensif : le trigger a déjà fait le travail.

## Note
`reminders.appointment_id` est de type `text` alors que `appointments.id` est un
`uuid` : la comparaison exige une conversion explicite.
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.cleanup_reminders_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    DELETE FROM public.reminders WHERE appointment_id = NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_cleanup_reminders ON public.appointments;
CREATE TRIGGER appointments_cleanup_reminders
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_reminders_on_cancel();

-- Rattrapage : purge des rappels déjà orphelins, rattachés à un rendez-vous
-- annulé ou supprimé.
DELETE FROM public.reminders r
WHERE NOT EXISTS (
  SELECT 1 FROM public.appointments a
  WHERE a.id::text = r.appointment_id
    AND a.status <> 'cancelled'
);

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATION
-- ---------------------------------------------------------------------------
-- Plus aucun rappel ne doit subsister pour un rendez-vous annulé :
--
--   select count(*) from public.reminders r
--   join public.appointments a on a.id::text = r.appointment_id
--   where a.status = 'cancelled';
--
--   Résultat attendu : 0
--
-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS appointments_cleanup_reminders ON public.appointments;
-- DROP FUNCTION IF EXISTS public.cleanup_reminders_on_cancel();
