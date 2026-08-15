/*
# Avertir la gérante par courriel à chaque réservation

## Contexte
Personne n'était prévenu d'une réservation : la gérante devait ouvrir
l'administration pour découvrir ses rendez-vous, et une cliente pouvait se
présenter sans qu'elle le sache.

## Découplage volontaire
Un trigger consigne l'événement dans `emails_a_envoyer`, qu'une fonction
Supabase dépile ensuite. Appeler un service d'envoi depuis le trigger ferait
échouer la réservation si ce service est indisponible : une cliente ne doit
jamais perdre son rendez-vous parce qu'un courriel n'est pas parti.

Ce découplage donne aussi une trace : une réservation dont le courriel n'est
pas parti reste visible dans la file, avec sa cause.

## Destinataire
`reminder_settings.admin_email` s'il est renseigné, sinon l'adresse du salon.
La première permet de recevoir les avis de réservation ailleurs que sur
l'adresse publique.
*/

BEGIN;

CREATE TABLE IF NOT EXISTS public.emails_a_envoyer (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinataire   text NOT NULL,
  sujet          text NOT NULL,
  corps_html     text NOT NULL,
  corps_texte    text NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  envoye_le      timestamptz,
  erreur         text,
  tentatives     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.emails_a_envoyer IS
  'File des courriels restant à émettre. Découple la réservation de l''envoi : une indisponibilité du service de messagerie ne doit jamais faire échouer un rendez-vous.';

-- L'index ne porte que sur les courriels en attente : la table conserve un
-- historique, mais seule la tête de file est interrogée à chaque passage.
CREATE INDEX IF NOT EXISTS emails_en_attente_idx
  ON public.emails_a_envoyer (created_at)
  WHERE envoye_le IS NULL;

ALTER TABLE public.emails_a_envoyer ENABLE ROW LEVEL SECURITY;

-- Consultable par la gérante, pour diagnostiquer un envoi manquant.
-- L'écriture reste le fait du trigger et de la fonction d'envoi, tous deux
-- privilégiés.
DROP POLICY IF EXISTS emails_admin_select ON public.emails_a_envoyer;
CREATE POLICY emails_admin_select ON public.emails_a_envoyer
  FOR SELECT TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Composition du message
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notifier_reservation_par_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_destinataire text;
  v_prestations  text;
  v_total        numeric;
  v_date_fr      text;
  v_html         text;
  v_texte        text;
BEGIN
  SELECT COALESCE(NULLIF(btrim(rs.admin_email), ''), NULLIF(btrim(bs.email), ''))
    INTO v_destinataire
  FROM public.business_settings bs
  LEFT JOIN public.reminder_settings rs ON true
  LIMIT 1;

  -- Sans adresse configurée, il n'y a rien à mettre en file. Le rendez-vous
  -- doit malgré tout être enregistré.
  IF v_destinataire IS NULL THEN
    RAISE NOTICE 'Aucune adresse de notification configurée : courriel non mis en file.';
    RETURN NULL;
  END IF;

  SELECT string_agg(s->>'name', ' + '),
         COALESCE(SUM((s->>'price')::numeric), 0)
    INTO v_prestations, v_total
  FROM jsonb_array_elements(COALESCE(NEW.services, '[]'::jsonb)) s;

  -- Le nom du jour est dérivé de l'indice, la locale du serveur n'étant pas
  -- garantie.
  v_date_fr := (ARRAY['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'])
                 [EXTRACT(DOW FROM NEW.date)::int + 1]
               || ' ' || to_char(NEW.date, 'DD/MM/YYYY');

  v_texte :=
    'Nouvelle réservation' || E'\n\n' ||
    'Cliente : '     || NEW.client_name || E'\n' ||
    'Téléphone : '   || NEW.phone || E'\n' ||
    COALESCE('Email : ' || NEW.email || E'\n', '') ||
    'Prestation : '  || COALESCE(v_prestations, 'Prestation') || E'\n' ||
    'Date : '        || v_date_fr || ' à ' || NEW.time || E'\n' ||
    'Montant : '     || to_char(v_total, 'FM999999990') || ' EUR' || E'\n' ||
    COALESCE('Précisions : ' || NEW.client_notes || E'\n', '') || E'\n' ||
    'Ce rendez-vous est en attente de votre confirmation.';

  v_html :=
    '<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;color:#2b2320">'
    || '<h2 style="font-size:18px;margin:0 0 16px">Nouvelle réservation</h2>'
    || '<table style="border-collapse:collapse;font-size:14px;width:100%">'
    || '<tr><td style="padding:6px 0;color:#8a7a6d">Cliente</td><td style="padding:6px 0;font-weight:600">' || NEW.client_name || '</td></tr>'
    || '<tr><td style="padding:6px 0;color:#8a7a6d">Téléphone</td><td style="padding:6px 0"><a href="tel:' || NEW.phone || '">' || NEW.phone || '</a></td></tr>'
    || COALESCE('<tr><td style="padding:6px 0;color:#8a7a6d">Email</td><td style="padding:6px 0"><a href="mailto:' || NEW.email || '">' || NEW.email || '</a></td></tr>', '')
    || '<tr><td style="padding:6px 0;color:#8a7a6d">Prestation</td><td style="padding:6px 0">' || COALESCE(v_prestations, 'Prestation') || '</td></tr>'
    || '<tr><td style="padding:6px 0;color:#8a7a6d">Date</td><td style="padding:6px 0;font-weight:600">' || v_date_fr || ' à ' || NEW.time || '</td></tr>'
    || '<tr><td style="padding:6px 0;color:#8a7a6d">Montant</td><td style="padding:6px 0">' || to_char(v_total, 'FM999999990') || ' €</td></tr>'
    || COALESCE('<tr><td style="padding:6px 0;color:#8a7a6d">Précisions</td><td style="padding:6px 0;font-style:italic">' || NEW.client_notes || '</td></tr>', '')
    || '</table>'
    || '<p style="font-size:13px;color:#8a7a6d;margin:20px 0 0">Ce rendez-vous est en attente de votre confirmation.</p>'
    || '<p style="margin:16px 0 0"><a href="https://harrys-studio.com/admin/rendez-vous" style="background:#b9834d;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px;display:inline-block">Voir dans l''administration</a></p>'
    || '</div>';

  INSERT INTO public.emails_a_envoyer (destinataire, sujet, corps_html, corps_texte, appointment_id)
  VALUES (
    v_destinataire,
    'Nouvelle réservation — ' || NEW.client_name || ' le ' || to_char(NEW.date, 'DD/MM') || ' à ' || NEW.time,
    v_html,
    v_texte,
    NEW.id
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS appointments_email_reservation ON public.appointments;
CREATE TRIGGER appointments_email_reservation
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notifier_reservation_par_email();

-- ---------------------------------------------------------------------------
-- Purge
-- ---------------------------------------------------------------------------
-- La file n'a pas vocation à conserver un historique indéfini.

CREATE OR REPLACE FUNCTION public.purger_emails()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.emails_a_envoyer
  WHERE envoye_le IS NOT NULL AND envoye_le < now() - interval '90 days';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS emails_purge ON public.emails_a_envoyer;
CREATE TRIGGER emails_purge
  AFTER INSERT ON public.emails_a_envoyer
  FOR EACH STATEMENT EXECUTE FUNCTION public.purger_emails();

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Une réservation alimente la file :
--
--    select destinataire, sujet, created_at, envoye_le, erreur
--    from public.emails_a_envoyer order by created_at desc limit 5;
--
-- b) L'adresse retenue est la bonne :
--
--    select coalesce(nullif(btrim(rs.admin_email), ''), nullif(btrim(bs.email), ''))
--    from public.business_settings bs left join public.reminder_settings rs on true limit 1;
--
-- c) Un courriel resté en attente signale que la fonction d'envoi n'a pas
--    tourné, ou qu'elle a échoué — la colonne `erreur` le précise.

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS appointments_email_reservation ON public.appointments;
-- DROP FUNCTION IF EXISTS public.notifier_reservation_par_email();
-- DROP TABLE IF EXISTS public.emails_a_envoyer;
