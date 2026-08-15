/*
# Rendre modifiable le bandeau d'accueil

## Contexte
Le titre, le sous-titre et l'image du bandeau d'accueil étaient écrits en dur
dans `Home.tsx`. Toute retouche demandait une intervention et un déploiement,
alors que ce sont les premiers mots que lit une visiteuse — et ceux que la
gérante voudra ajuster le plus souvent.

## Colonnes
Le titre est stocké en deux parties. La seconde ligne est composée en italique
et dans la couleur d'accentuation : conserver cette typographie suppose de
distinguer les deux morceaux plutôt que de stocker une chaîne unique.

Les valeurs par défaut reprennent le texte actuellement affiché : rien ne
change tant que la gérante n'a rien modifié.
*/

BEGIN;

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS hero_title        text,
  ADD COLUMN IF NOT EXISTS hero_title_accent text,
  ADD COLUMN IF NOT EXISTS hero_subtitle     text,
  ADD COLUMN IF NOT EXISTS hero_image_url    text;

COMMENT ON COLUMN public.business_settings.hero_title IS
  'Première ligne du titre d''accueil, en typographie normale.';
COMMENT ON COLUMN public.business_settings.hero_title_accent IS
  'Seconde ligne du titre, composée en italique et dans la couleur d''accentuation.';

-- Reprise du texte actuellement affiché, pour que la mise en service soit
-- invisible. Le nom du salon est repris de la ligne existante plutôt que
-- recopié : il peut différer de « Harrys Studio ».
UPDATE public.business_settings
SET hero_title        = COALESCE(hero_title, 'L''art des ongles,'),
    hero_title_accent = COALESCE(hero_title_accent, 'sublimé avec ' || name),
    hero_subtitle     = COALESCE(
      hero_subtitle,
      'Des mains soignées, des ongles sublimes. Découvrez un univers de raffinement où chaque geste est pensé pour révéler votre beauté.'
    );

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATION
-- ---------------------------------------------------------------------------
--   select hero_title, hero_title_accent, hero_subtitle, hero_image_url
--   from public.business_settings;
--
-- Les trois textes doivent être renseignés. `hero_image_url` reste vide tant
-- qu'aucune image n'a été téléversée : l'application retombe alors sur celle
-- qui était écrite en dur.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- ALTER TABLE public.business_settings
--   DROP COLUMN IF EXISTS hero_title,
--   DROP COLUMN IF EXISTS hero_title_accent,
--   DROP COLUMN IF EXISTS hero_subtitle,
--   DROP COLUMN IF EXISTS hero_image_url;
