/**
 * Dépile `notifications_a_envoyer` et émet les notifications push.
 *
 * Appelée périodiquement par un cron, ou à la demande. Elle ne reçoit aucune
 * donnée : tout ce qu'elle envoie provient de la file, alimentée par des
 * triggers. Une requête forgée ne peut donc pas faire émettre n'importe quoi.
 *
 * Un abonnement révoqué — application désinstallée, navigateur réinitialisé —
 * répond 404 ou 410. Il est alors supprimé : le conserver ferait échouer tous
 * les envois suivants.
 *
 * Déploiement :
 *   supabase functions deploy envoyer-notification --no-verify-jwt
 *
 * Secrets attendus :
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@harrys-studio.com';

/** Au-delà, la notification est abandonnée plutôt que retentée indéfiniment. */
const TENTATIVES_MAX = 3;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

interface Abonnement {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: enAttente, error } = await supabase
    .from('notifications_a_envoyer')
    .select('*')
    .is('envoyee_le', null)
    .lt('tentatives', TENTATIVES_MAX)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    return Response.json({ erreur: error.message }, { status: 500 });
  }

  if (!enAttente?.length) {
    return Response.json({ traitees: 0 });
  }

  let envoyees = 0;
  let echecs = 0;

  for (const notif of enAttente) {
    // Destinataires : toutes les administratrices, ou un compte précis.
    let abonnements: Abonnement[] = [];

    if (notif.destinataire === 'admin') {
      const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
      const ids = (admins ?? []).map((a: { id: string }) => a.id);
      if (ids.length > 0) {
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id, endpoint, p256dh, auth')
          .in('user_id', ids);
        abonnements = data ?? [];
      }
    } else if (notif.user_id) {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', notif.user_id);
      abonnements = data ?? [];
    }

    // Aucun appareil abonné : la notification est close, pas mise en échec.
    // La retenter n'aboutirait à rien tant que personne ne s'est abonné.
    if (abonnements.length === 0) {
      await supabase
        .from('notifications_a_envoyer')
        .update({ envoyee_le: new Date().toISOString(), erreur: 'aucun appareil abonné' })
        .eq('id', notif.id);
      continue;
    }

    const charge = JSON.stringify({
      title: notif.titre,
      body: notif.corps,
      url: notif.url,
    });

    const resultats = await Promise.allSettled(
      abonnements.map((a) =>
        webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          charge,
          { TTL: 60 * 60 * 12 }
        )
      )
    );

    const perimes: string[] = [];
    let auMoinsUn = false;

    resultats.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        auMoinsUn = true;
        return;
      }
      const code = (r.reason as { statusCode?: number })?.statusCode;
      // 404 et 410 : abonnement révoqué côté navigateur.
      if (code === 404 || code === 410) perimes.push(abonnements[i].id);
    });

    if (perimes.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', perimes);
    }

    if (auMoinsUn) {
      await supabase
        .from('notifications_a_envoyer')
        .update({ envoyee_le: new Date().toISOString(), erreur: null })
        .eq('id', notif.id);
      envoyees++;
    } else {
      await supabase
        .from('notifications_a_envoyer')
        .update({
          tentatives: (notif.tentatives ?? 0) + 1,
          erreur: 'aucun envoi abouti',
        })
        .eq('id', notif.id);
      echecs++;
    }
  }

  return Response.json({ traitees: enAttente.length, envoyees, echecs });
});
