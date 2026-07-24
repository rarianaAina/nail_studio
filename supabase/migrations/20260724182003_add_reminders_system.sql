/*
# Système de rappels de rendez-vous

## Description
Ajout de deux tables pour gérer les rappels automatiques prototype :
- `reminder_settings` : configuration globale des rappels (singleton, une seule ligne)
- `reminders` : rappels individuels générés lors de la confirmation d'un rendez-vous

## Nouvelles tables

### reminder_settings
- `id` (uuid, clé primaire) — identifiant unique
- `enabled` (boolean, défaut true) — activer/désactiver les rappels automatiques
- `delay_hours` (integer, défaut 24) — délai avant le RDV en heures (24, 12 ou 2)
- `recipients` (text, défaut 'both') — destinataires : 'client' | 'admin' | 'both'
- `admin_phone` (text, nullable) — numéro de téléphone de l'administratrice
- `admin_email` (text, nullable) — email de l'administratrice
- `updated_at` (timestamptz) — date de dernière modification

### reminders
- `id` (uuid, clé primaire)
- `appointment_id` (text, non null) — identifiant du rendez-vous associé
- `client_name` (text) — nom de la cliente
- `client_phone` (text) — téléphone de la cliente
- `client_email` (text, nullable) — email de la cliente
- `service_name` (text) — nom de la prestation
- `appointment_date` (date) — date du rendez-vous
- `appointment_time` (text) — heure au format HH:mm
- `scheduled_at` (timestamptz) — moment auquel le rappel doit être envoyé
- `recipients` (text) — 'client' | 'admin' | 'both'
- `sent` (boolean, défaut false) — indique si le rappel a été envoyé
- `created_at` (timestamptz)

## Sécurité
- RLS activé sur les deux tables.
- Accès anon + authenticated (app sans authentification stricte côté anon key).

## Notes
- La table `reminder_settings` ne doit contenir qu'une seule ligne (singleton).
  Elle est pré-remplie avec les valeurs par défaut via INSERT … ON CONFLICT DO NOTHING.
- Les rappels sont un prototype : aucun envoi réel n'est effectué.
*/

-- TABLE reminder_settings (singleton)
CREATE TABLE IF NOT EXISTS reminder_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  delay_hours integer NOT NULL DEFAULT 24,
  recipients text NOT NULL DEFAULT 'both',
  admin_phone text,
  admin_email text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reminder_settings" ON reminder_settings;
CREATE POLICY "anon_select_reminder_settings" ON reminder_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reminder_settings" ON reminder_settings;
CREATE POLICY "anon_insert_reminder_settings" ON reminder_settings FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reminder_settings" ON reminder_settings;
CREATE POLICY "anon_update_reminder_settings" ON reminder_settings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reminder_settings" ON reminder_settings;
CREATE POLICY "anon_delete_reminder_settings" ON reminder_settings FOR DELETE
TO anon, authenticated USING (true);

-- Seed par défaut (singleton)
INSERT INTO reminder_settings (enabled, delay_hours, recipients)
VALUES (true, 24, 'both')
ON CONFLICT DO NOTHING;

-- TABLE reminders
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id text NOT NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  service_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  recipients text NOT NULL DEFAULT 'both',
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminders_appointment_id_idx ON reminders(appointment_id);
CREATE INDEX IF NOT EXISTS reminders_scheduled_at_idx ON reminders(scheduled_at);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reminders" ON reminders;
CREATE POLICY "anon_select_reminders" ON reminders FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reminders" ON reminders;
CREATE POLICY "anon_insert_reminders" ON reminders FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reminders" ON reminders;
CREATE POLICY "anon_update_reminders" ON reminders FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reminders" ON reminders;
CREATE POLICY "anon_delete_reminders" ON reminders FOR DELETE
TO anon, authenticated USING (true);
