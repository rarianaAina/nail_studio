/*
# Phase A — Verrouillage de l'escalade de privilèges et des tables de configuration

## Contexte
Audit du 2026-08-12. Deux failles majeures constatées en production :

1. `users_update_own` / `users_insert_self` ne protègent pas la colonne `role`.
   N'importe quel compte authentifié pouvait exécuter
   `update users set role='admin' where id = auth.uid();`
   et obtenir, via `is_admin()`, l'intégralité des droits administrateur.

2. Les policies héritées « Enable write for authenticated users » sont accordées
   au rôle `{public}` avec la seule condition `auth.role() = 'authenticated'`.
   Toute cliente connectée pouvait donc réécrire les créneaux, les moyens de
   paiement, les paramètres du salon et le barème de fidélité.

## Périmètre de CETTE migration
Uniquement ce qui n'a AUCUNE dépendance avec le code applicatif : elle peut être
déployée seule, immédiatement, sans modifier l'application.

Les policies laxistes sur `appointments` et `clients` — qui exposent publiquement
le fichier clients — ne sont volontairement PAS traitées ici : le tunnel de
réservation en dépend aujourd'hui. Voir la phase B, qui doit être déployée
conjointement à la modification du code.

## Vérifications effectuées avant rédaction
- `Auth.tsx:42` inscrit toujours avec `role: 'client'` → forcer ce rôle ne casse rien.
- `reviewService` n'insère jamais → restreindre `reviews_public_insert` ne casse rien.
- Les écritures sur les tables de configuration ne proviennent que des pages admin.

## Réversibilité
Chaque bloc est idempotent. Le script de rollback figure en commentaire en fin de fichier.
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Gel de la colonne `role`
-- ---------------------------------------------------------------------------
-- Une policy RLS ne peut pas comparer NEW.role à OLD.role (WITH CHECK n'a pas
-- accès à l'ancienne ligne). Le verrou passe donc par un trigger BEFORE UPDATE.

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Modification du rôle interdite'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_prevent_role_escalation ON public.users;
CREATE TRIGGER users_prevent_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- `is_admin()` est STABLE : pendant le BEFORE UPDATE elle lit l'état validé
-- avant la modification. Un non-admin obtient donc bien `false`.

-- Empêcher également la création directe d'un compte administrateur.
DROP POLICY IF EXISTS users_insert_self ON public.users;
CREATE POLICY users_insert_self ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND COALESCE(role, 'client') = 'client');

-- Note : la promotion d'une administratrice se fait désormais manuellement en SQL :
--   update public.users set role = 'admin' where email = '...';
-- (à exécuter depuis le SQL Editor, qui n'est pas soumis à la RLS).

-- Durcissement de `is_admin()` : sans `search_path` figé, une fonction
-- SECURITY DEFINER est un vecteur d'escalade connu (linter Supabase :
-- `function_search_path_mutable`). Le corps est inchangé.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Tables de configuration : écriture réservée à l'administratrice
-- ---------------------------------------------------------------------------
-- La lecture publique est conservée partout : le site vitrine et le tunnel de
-- réservation en ont besoin en anonyme.

DROP POLICY IF EXISTS "Enable write for authenticated users" ON public.time_slots;
CREATE POLICY time_slots_admin_write ON public.time_slots
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Enable write for authenticated users" ON public.payment_methods;
CREATE POLICY payment_methods_admin_write ON public.payment_methods
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Enable write for authenticated users" ON public.special_infos;
CREATE POLICY special_infos_admin_write ON public.special_infos
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Enable write for authenticated users" ON public.appointment_settings;
CREATE POLICY appointment_settings_admin_write ON public.appointment_settings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.loyalty_settings;
CREATE POLICY loyalty_settings_admin_write ON public.loyalty_settings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Rappels : suppression des droits de modification anonymes
-- ---------------------------------------------------------------------------
-- `anon` pouvait modifier et supprimer l'intégralité des rappels.
-- L'INSERT et le SELECT anonymes sont CONSERVÉS ici : `appointmentService.create()`
-- crée un rappel pendant la réservation publique, et `reminderService.create()`
-- utilise `.insert().select().single()` — le RETURNING exige une policy SELECT.
-- Cette lecture reste donc une fuite de données personnelles jusqu'à la phase B,
-- qui déplacera la création du rappel dans un trigger côté base.

DROP POLICY IF EXISTS anon_update_reminders ON public.reminders;
DROP POLICY IF EXISTS anon_delete_reminders ON public.reminders;

DROP POLICY IF EXISTS anon_insert_reminder_settings ON public.reminder_settings;
DROP POLICY IF EXISTS anon_update_reminder_settings ON public.reminder_settings;
DROP POLICY IF EXISTS anon_delete_reminder_settings ON public.reminder_settings;

-- ---------------------------------------------------------------------------
-- 4. Avis : empêcher l'auto-certification
-- ---------------------------------------------------------------------------
-- `reviews_public_insert` autorisait n'importe qui à insérer un avis avec
-- `verified = true`. Aucun code applicatif n'insère d'avis à ce jour.

DROP POLICY IF EXISTS reviews_public_insert ON public.reviews;
CREATE POLICY reviews_public_insert ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (COALESCE(verified, false) = false);

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS APRÈS APPLICATION
-- ---------------------------------------------------------------------------
-- a) Plus aucune policy laxiste sur les tables de configuration :
--
--    select tablename, policyname, cmd, roles, qual
--    from pg_policies
--    where schemaname = 'public'
--      and policyname ilike 'Enable %'
--    order by tablename;
--
--    Résultat attendu : uniquement des lignes `SELECT` (lecture publique),
--    plus aucune ligne `ALL` / `UPDATE` / `INSERT`.
--    Les entrées restantes sur `appointments` et `clients` sont normales
--    à ce stade — elles sont traitées en phase B.
--
-- b) Le gel du rôle fonctionne. Depuis un compte cliente connecté :
--
--    update public.users set role = 'admin' where id = auth.uid();
--
--    Résultat attendu : ERREUR 42501 « Modification du rôle interdite ».
--
-- c) Aucun compte admin n'a été perdu :
--
--    select email, role from public.users where role = 'admin';

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- BEGIN;
--   DROP TRIGGER IF EXISTS users_prevent_role_escalation ON public.users;
--   DROP FUNCTION IF EXISTS public.prevent_role_escalation();
--
--   DROP POLICY IF EXISTS users_insert_self ON public.users;
--   CREATE POLICY users_insert_self ON public.users
--     FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
--
--   DROP POLICY IF EXISTS time_slots_admin_write ON public.time_slots;
--   CREATE POLICY "Enable write for authenticated users" ON public.time_slots
--     FOR ALL TO public USING (auth.role() = 'authenticated');
--   -- (idem pour payment_methods, special_infos, appointment_settings)
--
--   DROP POLICY IF EXISTS loyalty_settings_admin_write ON public.loyalty_settings;
--   CREATE POLICY "Enable update for authenticated users" ON public.loyalty_settings
--     FOR UPDATE TO public
--     USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
--
--   DROP POLICY IF EXISTS reviews_public_insert ON public.reviews;
--   CREATE POLICY reviews_public_insert ON public.reviews
--     FOR INSERT TO anon, authenticated WITH CHECK (true);
-- COMMIT;
