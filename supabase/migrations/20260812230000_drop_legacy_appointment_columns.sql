/*
# Suppression des colonnes héritées de `appointments`

## ⚠️ À ne jouer qu'après vérification de la migration précédente
`20260812220000_backfill_legacy_appointment_columns.sql` recopie les données
héritées dans le JSONB. Tant que cette reprise n'est pas vérifiée, ces colonnes
détiennent l'unique copie du chiffre d'affaires des anciens rendez-vous.

Contrôle bloquant — doit renvoyer 0 :

    select count(*) from public.appointments
    where (services is null or jsonb_array_length(coalesce(services,'[]'::jsonb)) = 0)
      and (service_name is not null or price is not null);

Si le résultat n'est pas 0, ne pas jouer cette migration.

## Objet
Retirer les quatre colonnes devenues inutiles :

  service_id       remplacée par les identifiants contenus dans `services`
  service_name     remplacée par les noms contenus dans `services`
  price            remplacée par les prix contenus dans `services`
  reference_image  remplacée par `reference_images`

Leur présence a déjà induit le code en erreur une fois : `statsService`
additionnait `price`, laissée NULL depuis la bascule, ce qui produisait un
chiffre d'affaires nul sans lever la moindre erreur. Les garder, c'est laisser
le piège en place pour la prochaine personne.

## Irréversible
Un rollback recrée les colonnes mais pas leur contenu. Faire une sauvegarde du
projet Supabase avant de jouer cette migration.
*/

BEGIN;

-- Garde-fou : interrompt la migration si des lignes dépendent encore des
-- colonnes héritées.
DO $$
DECLARE
  v_restantes integer;
BEGIN
  SELECT count(*) INTO v_restantes
  FROM public.appointments
  WHERE (services IS NULL OR jsonb_array_length(COALESCE(services, '[]'::jsonb)) = 0)
    AND (service_name IS NOT NULL OR price IS NOT NULL);

  IF v_restantes > 0 THEN
    RAISE EXCEPTION
      'Reprise incomplète : % rendez-vous dépendent encore des colonnes héritées. Jouer d''abord la migration de reprise.',
      v_restantes;
  END IF;
END;
$$;

ALTER TABLE public.appointments DROP COLUMN IF EXISTS service_id;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS service_name;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS price;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS reference_image;

COMMIT;

-- ---------------------------------------------------------------------------
-- APRÈS CETTE MIGRATION
-- ---------------------------------------------------------------------------
-- Le repli sur les colonnes héritées peut être retiré de `statsService`
-- (fonctions `rowRevenue` et `rowServiceNames`), ainsi que les colonnes
-- correspondantes de la requête `getAll()`. Les tests couvrant ce repli
-- deviennent alors sans objet.
--
-- Ce nettoyage n'est volontairement pas fait ici : le code doit continuer de
-- fonctionner avec ET sans ces colonnes le temps du déploiement.

-- ---------------------------------------------------------------------------
-- ROLLBACK (structure seule — le contenu n'est pas récupérable)
-- ---------------------------------------------------------------------------
-- ALTER TABLE public.appointments ADD COLUMN service_id uuid;
-- ALTER TABLE public.appointments ADD COLUMN service_name text;
-- ALTER TABLE public.appointments ADD COLUMN price bigint;
-- ALTER TABLE public.appointments ADD COLUMN reference_image text;
