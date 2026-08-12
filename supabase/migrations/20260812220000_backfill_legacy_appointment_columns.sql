/*
# Reprise des rendez-vous antérieurs à la bascule JSONB

## Contexte
La table `appointments` porte deux générations de colonnes :

  héritées : service_id, service_name, price, reference_image
  actuelles : services (jsonb), reference_images (jsonb)

Depuis la bascule, seules les colonnes actuelles sont alimentées. Les colonnes
héritées ne subsistent que pour les rendez-vous créés avant, et `statsService`
s'en sert comme repli afin de ne pas perdre l'historique du chiffre d'affaires.

Tant que ce repli est nécessaire, les colonnes héritées ne peuvent pas être
supprimées : elles détiennent l'unique copie de ces montants.

## Objet
Recopier les données héritées dans le JSONB, afin que le repli devienne inutile
et que les colonnes puissent être retirées ensuite — voir la migration
`..._drop_legacy_appointment_columns.sql`, à ne jouer qu'après vérification.

La durée n'existant pas sur la ligne, elle est reprise de la prestation
référencée par `service_id` lorsqu'elle existe encore, sinon 30 minutes par
défaut. Cette valeur n'entre dans aucun calcul de chiffre d'affaires ; elle ne
sert qu'à la cohérence de forme du JSONB.

## Réversibilité
Cette migration n'écrit que dans `services` et `reference_images`, et
uniquement sur les lignes où ces colonnes sont vides. Les colonnes héritées ne
sont pas touchées : en cas de doute, il suffit de remettre `services` à NULL
sur les lignes concernées pour revenir à l'état antérieur.
*/

BEGIN;

-- Rendez-vous dont le JSONB `services` est vide alors que les colonnes
-- héritées portent une prestation.
UPDATE public.appointments a
SET services = jsonb_build_array(
      jsonb_build_object(
        'id',       COALESCE(a.service_id::text, ''),
        'name',     COALESCE(a.service_name, 'Prestation'),
        'price',    COALESCE(a.price, 0),
        'duration', COALESCE(s.duration, 30)
      )
    )
FROM (SELECT id, duration FROM public.services) s
WHERE s.id = a.service_id
  AND (a.services IS NULL OR jsonb_array_length(COALESCE(a.services, '[]'::jsonb)) = 0)
  AND (a.service_name IS NOT NULL OR a.price IS NOT NULL);

-- Même reprise pour les lignes dont la prestation référencée n'existe plus.
UPDATE public.appointments a
SET services = jsonb_build_array(
      jsonb_build_object(
        'id',       COALESCE(a.service_id::text, ''),
        'name',     COALESCE(a.service_name, 'Prestation'),
        'price',    COALESCE(a.price, 0),
        'duration', 30
      )
    )
WHERE (a.services IS NULL OR jsonb_array_length(COALESCE(a.services, '[]'::jsonb)) = 0)
  AND (a.service_name IS NOT NULL OR a.price IS NOT NULL);

-- Image de référence unique → tableau.
UPDATE public.appointments a
SET reference_images = jsonb_build_array(
      jsonb_build_object(
        'id',   'legacy',
        'url',  a.reference_image,
        'type', 'inspiration'
      )
    )
WHERE a.reference_image IS NOT NULL
  AND btrim(a.reference_image) <> ''
  AND (a.reference_images IS NULL
       OR jsonb_array_length(COALESCE(a.reference_images, '[]'::jsonb)) = 0);

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATION
-- ---------------------------------------------------------------------------
-- a) Plus aucun rendez-vous ne dépend des colonnes héritées :
--
--    select count(*) from public.appointments
--    where (services is null or jsonb_array_length(coalesce(services,'[]'::jsonb)) = 0)
--      and (service_name is not null or price is not null);
--
--    Résultat attendu : 0
--
-- b) Les montants sont préservés. Comparer, avant et après, la somme calculée
--    depuis le JSONB avec celle des colonnes héritées :
--
--    select
--      sum(coalesce(price, 0))                                   as total_herite,
--      sum((select coalesce(sum((x->>'price')::numeric), 0)
--           from jsonb_array_elements(coalesce(services,'[]'::jsonb)) x)) as total_jsonb
--    from public.appointments
--    where status <> 'cancelled';
--
--    `total_jsonb` doit être supérieur ou égal à `total_herite` — il inclut
--    aussi les rendez-vous récents, absents des colonnes héritées.
