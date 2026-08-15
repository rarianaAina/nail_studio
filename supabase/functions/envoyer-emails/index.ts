/**
 * Dépile `emails_a_envoyer` et expédie les courriels via Resend.
 *
 * Appelée périodiquement par un cron. Elle ne reçoit aucune donnée : tout ce
 * qu'elle envoie provient de la file, alimentée par un trigger. Une requête
 * forgée ne peut donc pas faire expédier n'importe quoi à n'importe qui.
 *
 * Déploiement :
 *   supabase functions deploy envoyer-emails --no-verify-jwt
 *
 * Secrets attendus :
 *   RESEND_API_KEY, EMAIL_EXPEDITEUR
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const EXPEDITEUR = Deno.env.get('EMAIL_EXPEDITEUR') ?? 'Harrys Studio <onboarding@resend.dev>';

/** Au-delà, le courriel est abandonné plutôt que retenté indéfiniment. */
const TENTATIVES_MAX = 3;

/** Traitement par lots : un passage ne doit pas dépasser la durée d'exécution. */
const LOT = 20;

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: enAttente, error } = await supabase
    .from('emails_a_envoyer')
    .select('*')
    .is('envoye_le', null)
    .lt('tentatives', TENTATIVES_MAX)
    .order('created_at', { ascending: true })
    .limit(LOT);

  if (error) return Response.json({ erreur: error.message }, { status: 500 });
  if (!enAttente?.length) return Response.json({ traites: 0 });

  let envoyes = 0;
  let echecs = 0;

  for (const mail of enAttente) {
    try {
      const reponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: EXPEDITEUR,
          to: [mail.destinataire],
          subject: mail.sujet,
          html: mail.corps_html,
          // Version texte : certains clients de messagerie la préfèrent, et sa
          // présence améliore nettement le classement anti-pourriel.
          text: mail.corps_texte,
        }),
      });

      if (!reponse.ok) {
        const detail = await reponse.text();
        throw new Error(`Resend ${reponse.status} — ${detail.slice(0, 300)}`);
      }

      await supabase
        .from('emails_a_envoyer')
        .update({ envoye_le: new Date().toISOString(), erreur: null })
        .eq('id', mail.id);
      envoyes++;
    } catch (e) {
      // La cause est conservée : un courriel resté en file doit dire pourquoi.
      await supabase
        .from('emails_a_envoyer')
        .update({
          tentatives: (mail.tentatives ?? 0) + 1,
          erreur: e instanceof Error ? e.message : String(e),
        })
        .eq('id', mail.id);
      echecs++;
    }
  }

  return Response.json({ traites: enAttente.length, envoyes, echecs });
});
