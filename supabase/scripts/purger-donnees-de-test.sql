/*
# Purge des données de test avant mise en service

⚠️  IRRÉVERSIBLE. Faites une sauvegarde du projet Supabase avant d'exécuter
    quoi que ce soit — Database → Backups.

Ce fichier n'est PAS une migration : il ne doit pas être rejoué et n'a rien à
faire dans `supabase/migrations`. Il s'exécute une fois, à la main, dans le SQL
Editor.

## Ce qui est supprimé
- tous les rendez-vous, et les rappels et avis qui s'y rattachent
- toutes les fiches clientes
- tous les comptes, **sauf les administratrices**

## Ce qui est conservé
Les prestations, catégories, moyens de paiement, créneaux, galerie, horaires,
paramètres du salon et informations spéciales. Ce sont des réglages, pas des
données de test.

## Ordre
Les suppressions suivent les dépendances : avis, rappels, rendez-vous, fiches
clientes, puis comptes. Supprimer les rendez-vous déclenche le recalcul des
compteurs des clientes — sans effet, puisqu'elles disparaissent ensuite.
*/

-- ===========================================================================
-- ÉTAPE 1 — INVENTAIRE.  À exécuter seul, d'abord.
-- ===========================================================================
-- Vérifiez notamment que la liste des comptes conservés est bien celle
-- attendue. Tout compte absent de cette liste sera supprimé.

SELECT 'rendez-vous'        AS donnee, count(*) FROM public.appointments
UNION ALL SELECT 'clientes',           count(*) FROM public.clients
UNION ALL SELECT 'rappels',            count(*) FROM public.reminders
UNION ALL SELECT 'avis',               count(*) FROM public.reviews
UNION ALL SELECT 'comptes (total)',    count(*) FROM auth.users
UNION ALL SELECT 'comptes admin',      count(*) FROM public.users WHERE role = 'admin';

-- Comptes qui seront CONSERVÉS :
SELECT u.email, p.role
FROM public.users p JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY u.email;

-- Comptes qui seront SUPPRIMÉS :
SELECT u.email, COALESCE(p.role, '(sans profil)') AS role, u.created_at
FROM auth.users u LEFT JOIN public.users p ON p.id = u.id
WHERE COALESCE(p.role, '') <> 'admin'
ORDER BY u.created_at;


-- ===========================================================================
-- ÉTAPE 2 — PURGE.  À exécuter seulement après avoir contrôlé l'étape 1.
-- ===========================================================================
-- Sélectionnez ce bloc en entier avant de l'exécuter : la transaction doit
-- aboutir d'un seul tenant.

BEGIN;

-- Garde-fou : interrompt tout s'il ne reste aucune administratrice. Sans lui,
-- une erreur de rôle supprimerait l'intégralité des comptes, y compris ceux
-- permettant d'accéder à l'administration.
DO $$
DECLARE
  v_admins integer;
BEGIN
  SELECT count(*) INTO v_admins FROM public.users WHERE role = 'admin';
  IF v_admins = 0 THEN
    RAISE EXCEPTION 'Aucune administratrice trouvée : purge interrompue.';
  END IF;
  RAISE NOTICE '% compte(s) administrateur conservé(s).', v_admins;
END;
$$;

-- Avis : référencent les rendez-vous et les clientes.
DELETE FROM public.reviews;

-- Rappels : `appointment_id` est un texte, sans clé étrangère — ils ne
-- disparaissent donc pas d'eux-mêmes avec les rendez-vous.
DELETE FROM public.reminders;

-- File de notifications, si la fonctionnalité a été déployée.
DO $$
BEGIN
  IF to_regclass('public.notifications_a_envoyer') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.notifications_a_envoyer';
  END IF;
END;
$$;

DELETE FROM public.appointments;
DELETE FROM public.clients;

-- Profils applicatifs des comptes non administrateurs.
DELETE FROM public.users WHERE role IS DISTINCT FROM 'admin';

-- Comptes d'authentification correspondants. Les abonnements aux
-- notifications, s'ils existent, disparaissent par cascade.
DELETE FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.users p WHERE p.id = u.id AND p.role = 'admin'
);

COMMIT;


-- ===========================================================================
-- ÉTAPE 3 — VÉRIFICATION
-- ===========================================================================

SELECT 'rendez-vous' AS donnee, count(*) FROM public.appointments
UNION ALL SELECT 'clientes',      count(*) FROM public.clients
UNION ALL SELECT 'rappels',       count(*) FROM public.reminders
UNION ALL SELECT 'avis',          count(*) FROM public.reviews
UNION ALL SELECT 'comptes',       count(*) FROM auth.users;

-- Les cinq premières lignes doivent être à zéro, la dernière égale au nombre
-- d'administratrices.

-- Les prestations et réglages doivent être intacts :
SELECT 'prestations' AS reglage, count(*) FROM public.services
UNION ALL SELECT 'créneaux',        count(*) FROM public.time_slots
UNION ALL SELECT 'galerie',         count(*) FROM public.gallery
UNION ALL SELECT 'moyens paiement', count(*) FROM public.payment_methods;


-- ===========================================================================
-- À FAIRE ENSUITE, HORS SQL
-- ===========================================================================
-- 1. Les photographies restent dans le stockage : supprimer le contenu des
--    dossiers `appointments/` et `reviews/` depuis Storage. Les lignes qui les
--    référençaient n'existent plus, ces fichiers sont devenus orphelins.
--
-- 2. Les créneaux passés n'ont plus d'objet. Pour repartir d'une grille
--    propre :
--        DELETE FROM public.time_slots WHERE date < public.salon_today();
--
-- 3. Vérifier que les compteurs des administratrices sont cohérents — elles
--    peuvent avoir une fiche cliente rattachée, désormais supprimée :
--        SELECT * FROM public.clients;
