# Courriel à chaque réservation — mise en service

Quatre étapes. Compter une trentaine de minutes, dont l'essentiel en attente de
propagation DNS.

## 1. Créer un compte Resend

[resend.com](https://resend.com) — l'offre gratuite couvre 3 000 courriels par
mois et 100 par jour. Un salon en enverra quelques dizaines : c'est très
largement suffisant, et il n'y a pas de carte bancaire à fournir.

## 2. Vérifier le domaine

Resend → **Domains** → Add Domain → `harrys-studio.com`.

Il affiche trois enregistrements DNS à créer dans **Cloudflare** — un `MX` et
deux `TXT` (SPF et DKIM). Ajoute-les en **DNS only**, nuage gris, comme les
autres.

Cette étape n'est pas facultative. Sans elle, tu ne peux expédier que depuis
`onboarding@resend.dev`, et uniquement vers l'adresse du titulaire du compte
Resend — inutilisable en production. Un domaine vérifié permet d'écrire depuis
`reservation@harrys-studio.com`, ce qui évite aussi le dossier indésirables.

La vérification prend de quelques minutes à une heure.

## 3. Renseigner les secrets

Supabase → Edge Functions → Secrets :

```
RESEND_API_KEY   = re_xxxxxxxxxx
EMAIL_EXPEDITEUR = Harrys Studio <reservation@harrys-studio.com>
```

La clé se crée dans Resend → API Keys, en accès **Sending access** seulement.

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement.

## 4. Déployer et programmer

```bash
supabase functions deploy envoyer-emails --no-verify-jwt
```

`--no-verify-jwt` est nécessaire : la fonction est appelée par un cron, sans
utilisateur connecté. Elle n'accepte aucune donnée en entrée — tout provient de
la file alimentée par le trigger — donc l'exposer ne permet pas de faire
expédier un courriel arbitraire.

Puis, dans le SQL Editor :

```sql
select cron.schedule(
  'envoyer-emails',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<REF>.supabase.co/functions/v1/envoyer-emails',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

Remplace `<REF>` par la référence du projet. Une exécution par minute donne un
délai maximal d'une minute entre la réservation et le courriel. La fonction se
termine immédiatement quand la file est vide : le coût est négligeable.

Si `pg_cron` et `pg_net` ne sont pas activés, fais-le dans Database →
Extensions.

## Choisir l'adresse destinataire

Par défaut, c'est l'adresse du salon — Paramètres → Général.

Pour recevoir les avis de réservation ailleurs que sur l'adresse publique,
renseigne **Paramètres → Rappels → Email admin** : elle est prioritaire.

## Vérifier

```sql
-- La file se remplit à chaque réservation
select destinataire, sujet, created_at, envoye_le, erreur
from public.emails_a_envoyer order by created_at desc limit 10;
```

`envoye_le` renseigné : le courriel est parti. Resté à `null` avec un nombre de
tentatives qui monte : la colonne `erreur` porte le message exact renvoyé par
Resend — domaine non vérifié, clé invalide, quota dépassé.

## Si rien n'arrive

1. La file se remplit-elle ? Si non, le trigger n'est pas posé : rejoue la
   migration `20260814040000_file_emails_reservation.sql`.
2. Une adresse destinataire est-elle configurée ? Sans elle, le trigger ne met
   rien en file.
3. Le cron tourne-t-il ? `select * from cron.job;`
4. Que dit la colonne `erreur` ?
5. Regarde les journaux dans Resend → Emails : un courriel accepté par Resend
   mais non reçu s'y trouve, avec son statut de remise.

## Ce que ça n'inclut pas

Les annulations ne déclenchent aucun courriel. La cliente ne reçoit pas de
confirmation non plus — seule la gérante est avertie, conformément à la
demande. Les deux s'ajoutent facilement : la file et la fonction d'envoi sont
déjà en place, il ne manque qu'un trigger.
