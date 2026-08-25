/*
# Mesure d'audience du site public

## Contexte
La page Statistiques ne rend compte que de ce qui se passe après la
réservation : chiffre d'affaires, prestations, fidélisation. Rien ne dit
combien de personnes visitent le site, ni par quel chemin elles y arrivent.
La gérante ne peut donc pas savoir si une publication Instagram a porté, ni
quelle page retient l'attention.

## Sans cookie, sans donnée personnelle
Aucun identifiant n'est déposé dans le navigateur : la page de
confidentialité annonce qu'aucun bandeau de consentement n'est présenté, et
cette mesure ne doit pas remettre cela en cause.

Un visiteur est reconnu par une empreinte calculée côté serveur à partir de
son adresse IP, de son navigateur et d'un sel secret, le tout haché avec la
date du jour. L'adresse IP n'est jamais écrite : seule l'empreinte l'est, et
elle change chaque nuit. Elle ne permet donc ni de suivre quelqu'un d'un jour
à l'autre, ni de remonter à une personne — les conditions posées par la CNIL
pour exempter une mesure d'audience de consentement.

## Écriture réservée au serveur
La table n'accepte aucune insertion directe : seule `enregistrer_visite()`,
privilégiée, y écrit. Le navigateur ne transmet qu'un chemin et un référent ;
appareil, provenance et empreinte sont déduits des en-têtes de la requête,
hors de portée d'une page forgée.
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- Sel secret
-- ---------------------------------------------------------------------------
-- Sans sel, l'empreinte d'une adresse IP serait retrouvable par simple
-- épuisement : quatre milliards de hachages suffisent. Le sel rend l'opération
-- impossible à qui n'a pas accès à la base.

CREATE TABLE IF NOT EXISTS public.audience_sel (
  id         boolean PRIMARY KEY DEFAULT true CHECK (id),
  sel        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audience_sel IS
  'Sel secret des empreintes de visite. Une seule ligne, jamais exposée : la contrainte sur `id` interdit la seconde.';

INSERT INTO public.audience_sel (id, sel)
VALUES (true, gen_random_uuid()::text || gen_random_uuid()::text)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.audience_sel ENABLE ROW LEVEL SECURITY;
-- Aucune politique : la table reste inaccessible à tous, y compris à la
-- gérante. Seules les fonctions privilégiées la lisent.

-- ---------------------------------------------------------------------------
-- Journal des visites
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.visites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jour          date NOT NULL,
  chemin        text NOT NULL,
  empreinte     text NOT NULL,
  provenance    text NOT NULL,
  appareil      text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.visites IS
  'Une ligne par page consultée. `empreinte` distingue les visiteurs sur une journée sans permettre de les identifier ni de les suivre au-delà.';
COMMENT ON COLUMN public.visites.empreinte IS
  'Hachage salé de l''adresse IP, du navigateur et de la date. Change chaque nuit.';

-- Les trois interrogations de la page de fréquentation partent toutes de la
-- fenêtre de dates ; le comptage des visiteurs distincts s'appuie en plus sur
-- l'empreinte, d'où l'index composé.
CREATE INDEX IF NOT EXISTS visites_jour_idx ON public.visites (jour);
CREATE INDEX IF NOT EXISTS visites_jour_empreinte_idx ON public.visites (jour, empreinte);

ALTER TABLE public.visites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS visites_admin_select ON public.visites;
CREATE POLICY visites_admin_select ON public.visites
  FOR SELECT TO authenticated USING (public.is_admin());

-- Aucune politique d'insertion : l'écriture passe exclusivement par
-- `enregistrer_visite()`, qui contrôle ce qu'elle consigne.

-- ---------------------------------------------------------------------------
-- Lecture des en-têtes
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audience_appareil(p_ua text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    -- Une tablette Android se présente comme « Android » sans « Mobile ».
    WHEN lower(p_ua) ~ '(ipad|tablet)' THEN 'Tablette'
    WHEN lower(p_ua) ~ 'android' AND lower(p_ua) !~ 'mobile' THEN 'Tablette'
    WHEN lower(p_ua) ~ '(mobi|iphone|ipod|android|windows phone)' THEN 'Mobile'
    ELSE 'Ordinateur'
  END;
$$;

CREATE OR REPLACE FUNCTION public.audience_provenance(p_referent text, p_hote_site text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hote text;
BEGIN
  IF p_referent IS NULL OR btrim(p_referent) = '' THEN
    RETURN 'Accès direct';
  END IF;

  v_hote := lower(regexp_replace(substring(p_referent from '^https?://([^/?#]+)'), '^www\.', ''));

  IF v_hote IS NULL OR v_hote = '' THEN
    RETURN 'Accès direct';
  END IF;

  -- Une navigation interne n'est pas une provenance : sur une application à
  -- page unique, le référent reste celui de la page d'entrée.
  IF p_hote_site <> '' AND v_hote = p_hote_site THEN
    RETURN 'Accès direct';
  END IF;

  RETURN CASE
    WHEN v_hote ~ 'instagram'            THEN 'Instagram'
    WHEN v_hote ~ '(facebook|^fb\.)'     THEN 'Facebook'
    WHEN v_hote ~ 'google'               THEN 'Google'
    WHEN v_hote ~ 'tiktok'               THEN 'TikTok'
    WHEN v_hote ~ 'pinterest'            THEN 'Pinterest'
    WHEN v_hote ~ '(whatsapp|^wa\.me)'   THEN 'WhatsApp'
    WHEN v_hote ~ '(^t\.co|twitter|^x\.com)' THEN 'X (Twitter)'
    WHEN v_hote ~ 'youtube'              THEN 'YouTube'
    WHEN v_hote ~ 'snapchat'             THEN 'Snapchat'
    WHEN v_hote ~ 'linkedin'             THEN 'LinkedIn'
    WHEN v_hote ~ 'bing'                 THEN 'Bing'
    WHEN v_hote ~ 'duckduckgo'           THEN 'DuckDuckGo'
    WHEN v_hote ~ '(yahoo|ecosia|qwant)' THEN initcap(split_part(v_hote, '.', 1))
    ELSE v_hote
  END;
END;
$$;

-- ---------------------------------------------------------------------------
-- Enregistrement d'une visite
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enregistrer_visite(
  p_chemin   text,
  p_referent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_entetes    json;
  v_ua         text;
  v_ip         text;
  v_hote_site  text;
  v_jour       date;
  v_empreinte  text;
  v_chemin     text;
  v_vues       integer;
BEGIN
  BEGIN
    v_entetes := current_setting('request.headers', true)::json;
  EXCEPTION WHEN others THEN
    v_entetes := NULL;
  END;

  v_ua := COALESCE(v_entetes->>'user-agent', '');

  -- Robots d'indexation, aperçus de lien et sondes de disponibilité : leur
  -- passage n'apprend rien sur la clientèle et gonflerait les chiffres.
  IF v_ua = '' OR lower(v_ua) ~ '(bot|crawl|spider|slurp|headless|preview|monitor|curl|wget|python-requests|lighthouse|pingdom|facebookexternalhit|whatsapp)' THEN
    RETURN;
  END IF;

  -- Le chemin est borné à un alphabet restreint : sans cela, une page forgée
  -- pourrait inventer des milliers de chemins et rendre le classement
  -- illisible.
  v_chemin := COALESCE(btrim(p_chemin), '/');
  IF v_chemin !~ '^/[a-z0-9/-]{0,60}$' THEN
    v_chemin := '/autre';
  END IF;

  -- L'administration n'est pas le site public : ses consultations ne relèvent
  -- pas de la fréquentation.
  IF v_chemin LIKE '/admin%' THEN
    RETURN;
  END IF;

  v_jour := public.salon_today();

  -- `x-forwarded-for` peut chaîner plusieurs relais ; le client est en tête.
  v_ip := btrim(split_part(COALESCE(v_entetes->>'x-forwarded-for', ''), ',', 1));
  IF v_ip = '' THEN
    v_ip := COALESCE(v_entetes->>'cf-connecting-ip', 'inconnue');
  END IF;

  SELECT substring(
           encode(sha256(convert_to(s.sel || v_ip || v_ua || v_jour::text, 'UTF8')), 'hex')
           from 1 for 32
         )
    INTO v_empreinte
  FROM public.audience_sel s
  LIMIT 1;

  IF v_empreinte IS NULL THEN
    RETURN;
  END IF;

  -- Un visiteur consultant plus de deux cents pages dans la journée n'est plus
  -- un visiteur : le plafond évite qu'une boucle, volontaire ou non, noie les
  -- chiffres réels.
  SELECT count(*) INTO v_vues
  FROM public.visites v
  WHERE v.jour = v_jour AND v.empreinte = v_empreinte;

  IF v_vues >= 200 THEN
    RETURN;
  END IF;

  v_hote_site := lower(regexp_replace(COALESCE(v_entetes->>'origin', ''), '^https?://(www\.)?', ''));

  INSERT INTO public.visites (jour, chemin, empreinte, provenance, appareil)
  VALUES (
    v_jour,
    v_chemin,
    v_empreinte,
    public.audience_provenance(p_referent, v_hote_site),
    public.audience_appareil(v_ua)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.enregistrer_visite(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.enregistrer_visite(text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Purge
-- ---------------------------------------------------------------------------
-- Treize mois : de quoi comparer une saison à la même saison l'an passé, sans
-- conserver au-delà de l'utile.

CREATE OR REPLACE FUNCTION public.purger_visites()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.visites WHERE jour < public.salon_today() - 400;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS visites_purge ON public.visites;
CREATE TRIGGER visites_purge
  AFTER INSERT ON public.visites
  FOR EACH STATEMENT EXECUTE FUNCTION public.purger_visites();


-- ---------------------------------------------------------------------------
-- Agrégation pour l'administration
-- ---------------------------------------------------------------------------
-- Tout est calculé en base et remonté en un seul aller-retour. Rapatrier le
-- journal brut pour le regrouper dans le navigateur deviendrait intenable dès
-- quelques milliers de lignes, et exposerait des données que la page n'affiche
-- jamais.
--
-- L'unité retenue est la *visite* : une personne sur une journée. L'empreinte
-- changeant chaque nuit, une même personne revenant trois jours de suite
-- compte pour trois visites. Suivre un individu dans le temps supposerait un
-- identifiant persistant — précisément ce que cette mesure s'interdit.

CREATE OR REPLACE FUNCTION public.statistiques_frequentation(p_jours integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_jours    integer;
  v_fin      date;
  v_debut    date;
  v_resultat jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;

  v_jours := LEAST(GREATEST(COALESCE(p_jours, 30), 1), 365);
  v_fin   := public.salon_today();
  v_debut := v_fin - (v_jours - 1);

  WITH fenetre AS (
    SELECT * FROM public.visites WHERE jour BETWEEN v_debut AND v_fin
  ),
  precedente AS (
    -- Même durée, immédiatement avant : le seul point de comparaison qui ait
    -- un sens pour dire si la fréquentation progresse.
    SELECT count(DISTINCT empreinte)::int AS visites
    FROM public.visites
    WHERE jour BETWEEN v_debut - v_jours AND v_debut - 1
  ),
  serie AS (
    -- Les journées sans visite doivent figurer dans la courbe : les omettre
    -- donnerait à lire une fréquentation continue là où il y a des creux.
    SELECT g.jour::date                        AS jour,
           count(f.id)::int                    AS pages_vues,
           count(DISTINCT f.empreinte)::int    AS visites
    FROM generate_series(v_debut::timestamp, v_fin::timestamp, interval '1 day') g(jour)
    LEFT JOIN fenetre f ON f.jour = g.jour::date
    GROUP BY 1
  ),
  pages AS (
    SELECT chemin,
           count(*)::int                     AS vues,
           count(DISTINCT empreinte)::int    AS visites
    FROM fenetre GROUP BY chemin ORDER BY count(*) DESC LIMIT 12
  ),
  provenances AS (
    SELECT provenance, count(DISTINCT empreinte)::int AS visites
    FROM fenetre GROUP BY provenance
    ORDER BY count(DISTINCT empreinte) DESC LIMIT 10
  ),
  appareils AS (
    SELECT appareil, count(DISTINCT empreinte)::int AS visites
    FROM fenetre GROUP BY appareil
    ORDER BY count(DISTINCT empreinte) DESC
  ),
  totaux AS (
    SELECT count(*)::int AS pages_vues, count(DISTINCT empreinte)::int AS visites
    FROM fenetre
  )
  SELECT jsonb_build_object(
    'periode_jours',    v_jours,
    'debut',            v_debut,
    'fin',              v_fin,
    'total_visites',    t.visites,
    'total_pages_vues', t.pages_vues,
    'pages_par_visite',
      CASE WHEN t.visites = 0 THEN 0
           ELSE round(t.pages_vues::numeric / t.visites, 1) END,
    -- Sans période précédente peuplée, aucune variation n'est calculable :
    -- afficher « +100 % » sur un socle vide induirait en erreur.
    'delta_visites',
      CASE WHEN p.visites = 0 THEN NULL
           ELSE round((t.visites - p.visites)::numeric * 100 / p.visites, 1) END,
    'serie', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'jour', s.jour, 'visites', s.visites, 'pages_vues', s.pages_vues
             ) ORDER BY s.jour) FROM serie s), '[]'::jsonb),
    'pages', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'chemin', pg.chemin, 'vues', pg.vues, 'visites', pg.visites
             ) ORDER BY pg.vues DESC) FROM pages pg), '[]'::jsonb),
    'provenances', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'source', pr.provenance, 'visites', pr.visites
             ) ORDER BY pr.visites DESC) FROM provenances pr), '[]'::jsonb),
    'appareils', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'type', ap.appareil, 'visites', ap.visites
             ) ORDER BY ap.visites DESC) FROM appareils ap), '[]'::jsonb)
  )
  INTO v_resultat
  FROM totaux t, precedente p;

  RETURN v_resultat;
END;
$$;

REVOKE ALL ON FUNCTION public.statistiques_frequentation(integer) FROM public;
GRANT EXECUTE ON FUNCTION public.statistiques_frequentation(integer) TO authenticated;

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Une visite s'enregistre (depuis le site ; en SQL direct les en-têtes sont
--    absents et la fonction sort sans rien écrire) :
--
--    select jour, chemin, provenance, appareil, created_at
--    from public.visites order by created_at desc limit 10;
--
-- b) L'empreinte ne dit rien de personne et change de jour en jour :
--
--    select distinct jour, left(empreinte, 8) from public.visites order by jour desc;
--
-- c) L'agrégation répond, et refuse un compte non administrateur :
--
--    select public.statistiques_frequentation(30);
--
-- d) Le sel reste hors de portée, même connecté en administratrice :
--
--    select * from public.audience_sel;   -- doit ne rien renvoyer

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.statistiques_frequentation(integer);
-- DROP FUNCTION IF EXISTS public.enregistrer_visite(text, text);
-- DROP FUNCTION IF EXISTS public.audience_provenance(text, text);
-- DROP FUNCTION IF EXISTS public.audience_appareil(text);
-- DROP TRIGGER IF EXISTS visites_purge ON public.visites;
-- DROP FUNCTION IF EXISTS public.purger_visites();
-- DROP TABLE IF EXISTS public.visites;
-- DROP TABLE IF EXISTS public.audience_sel;
