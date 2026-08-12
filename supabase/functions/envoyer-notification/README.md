# Notifications push — mise en service

Quatre étapes, à faire une seule fois. Compter une vingtaine de minutes.

## 1. Générer les clés VAPID

```bash
node scripts/generer-cles-vapid.mjs
```

Le script affiche une clé publique et une clé privée, et indique où placer
chacune. Générez-les **une seule fois** : les remplacer invalide tous les
abonnements existants, et chaque appareil devra se réabonner.

La clé privée est un secret. Elle ne va que dans les secrets Supabase — jamais
dans le dépôt, jamais dans les variables du client.

## 2. Renseigner les secrets

**Vercel** → Settings → Environment Variables, cochée pour Production et
Preview :

```
VITE_VAPID_PUBLIC_KEY = <clé publique>
```

Sans elle, le bouton d'activation reste sur « Notifications indisponibles ».

**Supabase** → Edge Functions → Secrets :

```
VAPID_PUBLIC_KEY  = <clé publique>
VAPID_PRIVATE_KEY = <clé privée>
VAPID_SUBJECT     = mailto:contact@harrys-studio.com
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement.

## 3. Déployer la fonction

```bash
supabase functions deploy envoyer-notification --no-verify-jwt
```

`--no-verify-jwt` est nécessaire : la fonction est appelée par un cron, sans
utilisateur connecté. Elle n'accepte aucune donnée en entrée — tout ce qu'elle
envoie provient de la file alimentée par les triggers — donc l'exposer ne
permet pas de faire émettre n'importe quoi.

## 4. Programmer l'exécution

Dans le SQL Editor de Supabase :

```sql
select cron.schedule(
  'envoyer-notifications',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<REF>.supabase.co/functions/v1/envoyer-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

Remplacez `<REF>` par la référence du projet. Une exécution par minute donne un
délai maximal d'une minute entre la réservation et la notification — largement
suffisant, et sans coût notable : la fonction se termine immédiatement quand la
file est vide.

Si `pg_cron` et `pg_net` ne sont pas activés, faites-le dans Database →
Extensions.

## Vérifier

```sql
-- La file se remplit à chaque réservation
select titre, corps, created_at, envoyee_le, erreur
from public.notifications_a_envoyer order by created_at desc limit 10;

-- Appareils abonnés
select u.email, p.user_agent, p.created_at
from public.push_subscriptions p join auth.users u on u.id = p.user_id;
```

`envoyee_le` renseigné : la notification est partie. Restée à `null` avec un
nombre de tentatives qui monte : consultez les journaux de la fonction.

`erreur = 'aucun appareil abonné'` : la file fonctionne, mais personne n'a
encore activé les notifications. C'est le cas le plus fréquent au premier essai.

## Activer sur un appareil

Administration → Notifications → **Activer**. À faire sur chaque appareil :
l'abonnement est propre au navigateur, activer sur l'ordinateur du salon ne
notifie pas le téléphone.

Sur Android, tout fonctionne, y compris application fermée.

Sur iPhone, les notifications n'arrivent que si l'application a été ajoutée à
l'écran d'accueil, et Apple les restreint davantage.

## Si rien n'arrive

1. `VITE_VAPID_PUBLIC_KEY` est-elle définie dans Vercel, **et le site
   reconstruit depuis** ? La variable est figée à la construction.
2. L'autorisation a-t-elle été accordée ? Une fois refusée, le navigateur ne la
   redemande plus : il faut la rétablir dans ses paramètres.
3. La table `push_subscriptions` contient-elle une ligne ?
4. Le cron tourne-t-il ? `select * from cron.job;`
5. Les notifications de la file passent-elles à `envoyee_le` ?

Un abonnement révoqué — application désinstallée, navigateur réinitialisé —
répond 404 ou 410 et est supprimé automatiquement.
