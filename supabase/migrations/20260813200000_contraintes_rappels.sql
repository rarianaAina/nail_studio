/*
# Contraindre les valeurs de destinataire et de délai

## Contexte
`reminder_settings.recipients` et `reminders.recipients` sont des colonnes de
type texte sans contrainte ; `delay_hours` est un entier libre. Les valeurs
attendues — 'client', 'admin', 'both' — ne figuraient que dans un commentaire
de la migration d'origine.

L'interface ne propose que les valeurs correctes, mais rien n'empêche une
correction manuelle, un import ou un futur traitement d'en écrire une autre.

## Conséquence observée
La page des rappels associe chaque destinataire à une icône. Une valeur
inattendue renvoie `undefined`, et rendre un composant absent fait planter
React : c'est toute la page qui disparaît, pas seulement la ligne fautive.

Le correctif applicatif garantit un repli. Cette migration traite la cause :
une valeur invalide ne peut plus être enregistrée.

## Validation
Les contraintes sont posées `NOT VALID` : elles s'appliquent aux écritures
futures sans rejeter d'emblée d'éventuelles lignes existantes non conformes.
La requête de contrôle en fin de fichier permet de les repérer, puis de valider
les contraintes une fois le nettoyage fait.
*/

BEGIN;

ALTER TABLE public.reminder_settings
  DROP CONSTRAINT IF EXISTS reminder_settings_recipients_valide;
ALTER TABLE public.reminder_settings
  ADD CONSTRAINT reminder_settings_recipients_valide
  CHECK (recipients IN ('client', 'admin', 'both')) NOT VALID;

ALTER TABLE public.reminder_settings
  DROP CONSTRAINT IF EXISTS reminder_settings_delai_valide;
ALTER TABLE public.reminder_settings
  ADD CONSTRAINT reminder_settings_delai_valide
  CHECK (delay_hours > 0 AND delay_hours <= 168) NOT VALID;

COMMENT ON COLUMN public.reminder_settings.delay_hours IS
  'Délai avant le rendez-vous, en heures. Une semaine au maximum : au-delà, un rappel perd son sens.';

ALTER TABLE public.reminders
  DROP CONSTRAINT IF EXISTS reminders_recipients_valide;
ALTER TABLE public.reminders
  ADD CONSTRAINT reminders_recipients_valide
  CHECK (recipients IN ('client', 'admin', 'both')) NOT VALID;

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Lignes existantes non conformes, à corriger le cas échéant :
--
--    select id, recipients, delay_hours from public.reminder_settings
--    where recipients not in ('client','admin','both')
--       or delay_hours <= 0 or delay_hours > 168;
--
--    select id, recipients from public.reminders
--    where recipients not in ('client','admin','both');
--
-- b) Une fois ces lignes corrigées, valider les contraintes :
--
--    alter table public.reminder_settings validate constraint reminder_settings_recipients_valide;
--    alter table public.reminder_settings validate constraint reminder_settings_delai_valide;
--    alter table public.reminders validate constraint reminders_recipients_valide;
--
-- c) Une valeur invalide doit désormais être refusée :
--
--    update public.reminder_settings set recipients = 'personne';
--
--    Résultat attendu : violation de contrainte.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- ALTER TABLE public.reminder_settings DROP CONSTRAINT IF EXISTS reminder_settings_recipients_valide;
-- ALTER TABLE public.reminder_settings DROP CONSTRAINT IF EXISTS reminder_settings_delai_valide;
-- ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_recipients_valide;
