/*
# Correctif — trigger de restriction référençant des colonnes supprimées

## Symptôme
Toute mise à jour d'un rendez-vous échoue avec
`42703 — column "price" does not exist`.

## Cause
`restrict_client_appointment_update()`, posée en phase B, énumérait les
colonnes une à une pour détecter ce qu'une cliente tentait de modifier. Cette
liste comprenait `price` et `service_name`, retirées depuis par le nettoyage
des colonnes héritées. PL/pgSQL résout ces références à l'exécution : la
comparaison échoue dès qu'elle est atteinte.

## Correctif
La comparaison porte désormais sur la représentation JSON de la ligne, dont on
retire les seuls champs qu'une cliente a le droit de faire varier. Le trigger
n'énumère plus aucune colonne et suit donc automatiquement le schéma — c'est
exactement la classe de défaut qui vient de se produire.

## Portée
Ce correctif ne traite que le trigger issu de la phase B. Si d'autres triggers
de la table référencent les colonnes supprimées, ils doivent être corrigés
séparément ; la requête d'inventaire figure en fin de fichier.
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.restrict_client_appointment_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  -- Seuls champs qu'une cliente peut faire varier : l'annulation depuis son
  -- espace, et l'horodatage technique qui l'accompagne.
  v_mutables constant text[] := ARRAY['status', 'updated_at'];
BEGIN
  -- Les appels privilégiés — fonctions SECURITY DEFINER, maintenance SQL —
  -- s'exécutent sous un autre rôle et ne sont pas concernés.
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Comparer les lignes converties en JSON, privées des champs autorisés,
  -- évite d'énumérer les colonnes — et donc de se désynchroniser du schéma.
  IF (to_jsonb(NEW) - v_mutables) IS DISTINCT FROM (to_jsonb(OLD) - v_mutables) THEN
    RAISE EXCEPTION 'Seul le statut du rendez-vous peut être modifié'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;

-- ---------------------------------------------------------------------------
-- INVENTAIRE — à exécuter pour repérer les autres triggers en cause
-- ---------------------------------------------------------------------------
-- Liste les triggers de la table et le corps de leur fonction :
--
--   select t.tgname, p.proname, pg_get_functiondef(p.oid)
--   from pg_trigger t
--   join pg_proc p on p.oid = t.tgfoid
--   where t.tgrelid = 'public.appointments'::regclass
--     and not t.tgisinternal;
--
-- Tout corps contenant `price`, `service_name`, `service_id` ou
-- `reference_image` doit être repris : ces colonnes n'existent plus.
--
-- Vérification une fois l'ensemble corrigé — la mise à jour doit aboutir :
--
--   update public.appointments
--   set status = status
--   where id = (select id from public.appointments limit 1);
