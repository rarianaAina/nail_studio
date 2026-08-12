/*
# Aucun rappel pour un rendez-vous déjà passé

## Symptôme
Un rendez-vous consigné a posteriori par l'administratrice, puis confirmé, se
voyait attribuer un rappel programmé pour une date révolue.

## Cause
La création du rappel a deux origines, et une seule avait été traitée :

- `create_public_appointment()` — corrigée par la migration précédente ;
- `appointmentService.update()`, côté application, qui recrée un rappel au
  passage du statut à `confirmed` ainsi qu'à tout changement de date ou d'heure.

C'est cette seconde origine qui produisait le rappel constaté : le rendez-vous
était bien créé sans rappel, puis la confirmation en ajoutait un.

## Correctif
Le garde applicatif est posé, mais il ne suffit pas : la même erreur pourrait
revenir par un autre chemin — import, correction manuelle, futur traitement
automatique. La règle est donc portée par la base.

Le trigger écarte silencieusement l'insertion plutôt que de la refuser : les
appels à `reminderService.create()` sont enveloppés dans un `try/catch` qui
journalise sans interrompre, si bien qu'une exception passerait inaperçue tout
en polluant la console. Ne rien insérer produit exactement le résultat attendu.

Les rappels déjà enregistrés pour des rendez-vous passés sont supprimés.
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.skip_reminder_for_past_appointment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.appointment_date < public.salon_today() THEN
    -- Ligne écartée sans erreur : l'appelant n'a rien à traiter.
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reminders_skip_past ON public.reminders;
CREATE TRIGGER reminders_skip_past
  BEFORE INSERT ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.skip_reminder_for_past_appointment();

-- Purge des rappels devenus sans objet.
DELETE FROM public.reminders
WHERE sent = false
  AND appointment_date < public.salon_today();

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Plus aucun rappel en attente ne porte sur une date révolue :
--
--    select count(*) from public.reminders
--    where sent = false and appointment_date < public.salon_today();
--
--    Résultat attendu : 0
--
-- b) Confirmer un rendez-vous passé depuis l'administration n'en crée aucun,
--    et n'affiche aucune erreur.
--
-- c) Confirmer un rendez-vous à venir en crée toujours un.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS reminders_skip_past ON public.reminders;
-- DROP FUNCTION IF EXISTS public.skip_reminder_for_past_appointment();
