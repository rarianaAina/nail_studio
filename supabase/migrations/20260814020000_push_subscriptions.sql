/*
# Notifications push : abonnements et déclenchement

## Objet
Prévenir la praticienne dès qu'une réservation arrive. Aujourd'hui personne
n'est averti : elle doit ouvrir l'administration pour découvrir ses
rendez-vous, et une cliente peut se présenter sans qu'elle le sache.

## Mécanique
Le navigateur produit un abonnement — une URL propre au service de
notification, plus deux clés de chiffrement. Il est enregistré ici, puis relu
par la fonction `envoyer-notification` qui signe et chiffre l'envoi.

## Déclenchement
Un trigger consigne l'événement dans `notifications_a_envoyer`, que la fonction
dépile. Ce découplage est délibéré : appeler un service externe depuis un
trigger ferait échouer la réservation si le service est indisponible. Une
cliente ne doit jamais perdre son rendez-vous parce qu'une notification n'est
pas partie.
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Abonnements
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.push_subscriptions IS
  'Abonnements aux notifications. Un même compte peut en avoir plusieurs : téléphone, tablette, ordinateur.';

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Chacune ne voit et ne gère que ses propres appareils. La fonction d'envoi
-- passe par la clé de service et n'est pas soumise à ces règles.
DROP POLICY IF EXISTS push_own_select ON public.push_subscriptions;
CREATE POLICY push_own_select ON public.push_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS push_own_insert ON public.push_subscriptions;
CREATE POLICY push_own_insert ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS push_own_update ON public.push_subscriptions;
CREATE POLICY push_own_update ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS push_own_delete ON public.push_subscriptions;
CREATE POLICY push_own_delete ON public.push_subscriptions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. File d'attente
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notifications_a_envoyer (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinataire text NOT NULL DEFAULT 'admin',
  titre        text NOT NULL,
  corps        text NOT NULL,
  url          text,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  envoyee_le   timestamptz,
  erreur       text,
  tentatives   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications_a_envoyer IS
  'File des notifications restant à émettre. Découple la réservation de l''envoi : une indisponibilité du service de notification ne doit jamais faire échouer un rendez-vous.';

COMMENT ON COLUMN public.notifications_a_envoyer.destinataire IS
  '`admin` pour toutes les administratrices, `user` pour le seul compte désigné par user_id.';

CREATE INDEX IF NOT EXISTS notifications_en_attente_idx
  ON public.notifications_a_envoyer (created_at)
  WHERE envoyee_le IS NULL;

ALTER TABLE public.notifications_a_envoyer ENABLE ROW LEVEL SECURITY;

-- Consultable par l'administratrice pour diagnostic. L'écriture reste le fait
-- des triggers et de la fonction d'envoi, tous deux privilégiés.
DROP POLICY IF EXISTS notifications_admin_select ON public.notifications_a_envoyer;
CREATE POLICY notifications_admin_select ON public.notifications_a_envoyer
  FOR SELECT TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Déclenchement sur les rendez-vous
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notifier_nouveau_rendez_vous()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_prestations text;
BEGIN
  SELECT string_agg(s->>'name', ' + ')
    INTO v_prestations
  FROM jsonb_array_elements(COALESCE(NEW.services, '[]'::jsonb)) s;

  INSERT INTO public.notifications_a_envoyer (destinataire, titre, corps, url)
  VALUES (
    'admin',
    'Nouvelle réservation',
    format('%s — %s le %s à %s',
           NEW.client_name,
           COALESCE(v_prestations, 'Prestation'),
           to_char(NEW.date, 'DD/MM'),
           NEW.time),
    '/admin/rendez-vous'
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS appointments_notifier_admin ON public.appointments;
CREATE TRIGGER appointments_notifier_admin
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notifier_nouveau_rendez_vous();

-- Annulation par une cliente : la praticienne doit pouvoir reproposer le
-- créneau, c'est une information au moins aussi utile qu'une réservation.
CREATE OR REPLACE FUNCTION public.notifier_annulation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled'
     AND NOT public.is_admin() THEN
    INSERT INTO public.notifications_a_envoyer (destinataire, titre, corps, url)
    VALUES (
      'admin',
      'Rendez-vous annulé',
      format('%s a annulé son rendez-vous du %s à %s',
             NEW.client_name, to_char(NEW.date, 'DD/MM'), NEW.time),
      '/admin/rendez-vous'
    );
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS appointments_notifier_annulation ON public.appointments;
CREATE TRIGGER appointments_notifier_annulation
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notifier_annulation();

-- ---------------------------------------------------------------------------
-- 4. Purge
-- ---------------------------------------------------------------------------
-- La file n'a pas vocation à conserver un historique : les notifications
-- émises depuis plus de trente jours sont supprimées à chaque insertion.

CREATE OR REPLACE FUNCTION public.purger_notifications()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.notifications_a_envoyer
  WHERE envoyee_le IS NOT NULL AND envoyee_le < now() - interval '30 days';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS notifications_purge ON public.notifications_a_envoyer;
CREATE TRIGGER notifications_purge
  AFTER INSERT ON public.notifications_a_envoyer
  FOR EACH STATEMENT EXECUTE FUNCTION public.purger_notifications();

COMMIT;

-- ---------------------------------------------------------------------------
-- VÉRIFICATIONS
-- ---------------------------------------------------------------------------
-- a) Une réservation alimente bien la file :
--
--    select titre, corps, created_at, envoyee_le
--    from public.notifications_a_envoyer order by created_at desc limit 5;
--
-- b) Une notification restée en attente signale que la fonction d'envoi n'a
--    pas tourné, ou qu'aucun appareil n'est abonné :
--
--    select count(*) from public.notifications_a_envoyer where envoyee_le is null;
--
-- c) Appareils abonnés :
--
--    select u.email, p.user_agent, p.created_at
--    from public.push_subscriptions p join auth.users u on u.id = p.user_id;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS appointments_notifier_admin ON public.appointments;
-- DROP TRIGGER IF EXISTS appointments_notifier_annulation ON public.appointments;
-- DROP TABLE IF EXISTS public.notifications_a_envoyer;
-- DROP TABLE IF EXISTS public.push_subscriptions;
