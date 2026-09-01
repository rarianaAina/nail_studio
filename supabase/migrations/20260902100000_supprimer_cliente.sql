/*
# Supprimer une fiche cliente

## Contexte
Rien ne permettait de retirer une cliente : ni un doublon créé par une
réservation faite deux fois sous deux adresses, ni une saisie d'essai, ni une
demande d'effacement au titre du RGPD — que la politique de confidentialité
promet pourtant d'honorer sous un mois.

`clientService.delete()` existait côté application mais n'était appelé nulle
part, et une suppression directe de la ligne se heurtait à deux obstacles :
la contrainte portée par `appointments.client_id`, et l'absence de politique
d'effacement pour l'administratrice. Les deux disparaissent ici, l'écriture
étant faite par une fonction privilégiée.

## Anonymiser plutôt que supprimer
L'historique des rendez-vous n'est pas effacé, il est dépouillé de tout ce qui
identifie : nom, téléphone, adresse, photographies, notes de suivi.

Supprimer les rendez-vous ferait diminuer rétroactivement le chiffre
d'affaires des mois clos — l'article L123-22 du Code de commerce impose dix ans
de conservation des pièces comptables, et la page de confidentialité annonce
déjà que « les pièces comptables sont conservées lorsque la loi l'exige ».

Ce qui reste est un rendez-vous sans titulaire : un montant, une date, une
prestation. Plus rien ne s'y rattache à une personne.

## Le compte de connexion part avec la fiche
Le laisser en place ne serait pas seulement incomplet, ce serait inopérant :
`link_client_account()` recrée une fiche à la connexion suivante, annulant la
suppression. Les deux vont donc ensemble.
*/

BEGIN;

CREATE OR REPLACE FUNCTION public.supprimer_cliente(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cliente   public.clients%ROWTYPE;
  v_rdv       integer := 0;
  v_avis      integer := 0;
  v_rappels   integer := 0;
  v_courriels integer := 0;
  v_compte    boolean := false;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cliente FROM public.clients WHERE id = p_client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cette cliente n''existe plus.' USING ERRCODE = '22023';
  END IF;

  -- 1. Rappels — supprimés, non anonymisés : ils ne portent que des
  -- coordonnées et n'ont plus d'objet une fois la cliente partie.
  -- `reminders.appointment_id` est de type text, d'où la conversion.
  DELETE FROM public.reminders
  WHERE appointment_id IN (
    SELECT a.id::text FROM public.appointments a WHERE a.client_id = p_client_id
  );
  GET DIAGNOSTICS v_rappels = ROW_COUNT;

  -- 2. Courriels de notification encore en file : leur corps reprend nom et
  -- téléphone en clair.
  DELETE FROM public.emails_a_envoyer
  WHERE appointment_id IN (
    SELECT a.id FROM public.appointments a WHERE a.client_id = p_client_id
  );
  GET DIAGNOSTICS v_courriels = ROW_COUNT;

  -- 3. Avis — conservés mais anonymisés. Les supprimer retirerait au salon des
  -- avis publiés de bonne foi ; la note et le texte ne désignent personne une
  -- fois le nom et les photographies retirés.
  UPDATE public.reviews
  SET name       = 'Cliente supprimée',
      image_urls = '{}'::text[],
      image_url  = NULL,
      client_id  = NULL
  WHERE client_id = p_client_id;
  GET DIAGNOSTICS v_avis = ROW_COUNT;

  -- 4. Rendez-vous — anonymisés. `client_id` est détaché avant la suppression
  -- de la fiche : la contrainte est ainsi respectée quelle que soit la règle
  -- qu'elle porte.
  --
  -- `phone` est NOT NULL et reçoit donc la chaîne vide plutôt que NULL.
  UPDATE public.appointments
  SET client_name      = 'Cliente supprimée',
      phone            = '',
      email            = NULL,
      reference_images = '[]'::jsonb,
      client_notes     = NULL,
      notes            = NULL,
      client_id        = NULL
  WHERE client_id = p_client_id;
  GET DIAGNOSTICS v_rdv = ROW_COUNT;

  -- 5. Compte de connexion, s'il existe.
  IF v_cliente.user_id IS NOT NULL THEN
    DELETE FROM public.users WHERE id = v_cliente.user_id;

    -- `auth.users` appartient à un autre rôle. Si le propriétaire de cette
    -- fonction n'a pas le droit d'y écrire, mieux vaut interrompre : une
    -- suppression laissant le compte en vie serait défaite dès la connexion
    -- suivante par `link_client_account()`.
    BEGIN
      DELETE FROM auth.users WHERE id = v_cliente.user_id;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE EXCEPTION
        'Le compte de connexion de cette cliente n''a pas pu être supprimé ; rien n''a été modifié.'
        USING ERRCODE = '42501';
    END;

    v_compte := true;
  END IF;

  -- 6. La fiche elle-même.
  DELETE FROM public.clients WHERE id = p_client_id;

  -- Le détail est renvoyé pour être annoncé à la gérante : une suppression
  -- qui ne dit pas ce qu'elle a emporté ne peut pas être vérifiée.
  RETURN jsonb_build_object(
    'nom',                v_cliente.name,
    'rendezVousAnonymises', v_rdv,
    'avisAnonymises',     v_avis,
    'rappelsSupprimes',   v_rappels,
    'courrielsSupprimes', v_courriels,
    'compteSupprime',     v_compte
  );
END;
$$;

REVOKE ALL ON FUNCTION public.supprimer_cliente(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.supprimer_cliente(uuid) TO authenticated;

COMMENT ON FUNCTION public.supprimer_cliente(uuid) IS
  'Supprime une fiche cliente et son compte, en anonymisant l''historique conservé pour raisons comptables.';

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) À TESTER EN PREMIER, sur une cliente d'essai disposant d'un compte :
--    la suppression de `auth.users` est le seul point dont le droit dépend de
--    l'installation. En cas de refus, la fonction interrompt tout et le
--    message le dit — aucune suppression partielle n'est possible.
--
--    select public.supprimer_cliente('<uuid>');
--
-- b) L'historique subsiste, sans identité :
--
--    select client_id, client_name, phone, email, date,
--           public.appointment_total_price(services) as montant
--    from public.appointments where client_name = 'Cliente supprimée';
--
-- c) Le chiffre d'affaires du mois est inchangé avant/après.
--
-- d) Un compte non administrateur reçoit 42501.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- Les anonymisations déjà faites sont irréversibles : ce retrait ne rend que
-- la fonction indisponible.
--
-- DROP FUNCTION IF EXISTS public.supprimer_cliente(uuid);
