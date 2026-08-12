/**
 * Produit une paire de clés VAPID pour les notifications push.
 *
 *   node scripts/generer-cles-vapid.mjs
 *
 * Les clés identifient le serveur auprès des services de notification.
 * Générez-les une seule fois : les remplacer invalide tous les abonnements
 * existants, et chaque appareil devra se réabonner.
 *
 * La clé privée est un secret. Elle ne doit figurer ni dans le dépôt, ni dans
 * les variables du client — seulement dans les secrets de la fonction Supabase.
 */
import { generateKeyPairSync } from 'node:crypto';

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

const base64url = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// La clé publique est le point non compressé, soit les 65 derniers octets du
// format SPKI. La privée occupe 32 octets à l'offset 36 du format PKCS#8.
const pub = base64url(publicKey.export({ type: 'spki', format: 'der' }).subarray(-65));
const priv = base64url(privateKey.export({ type: 'pkcs8', format: 'der' }).subarray(36, 68));

console.log(`
Clés VAPID générées.

  Vercel — Environment Variables (Production et Preview)
    VITE_VAPID_PUBLIC_KEY = ${pub}

  Supabase — Edge Functions → Secrets
    VAPID_PUBLIC_KEY  = ${pub}
    VAPID_PRIVATE_KEY = ${priv}
    VAPID_SUBJECT     = mailto:contact@harrys-studio.com

La clé publique se retrouve des deux côtés, c'est normal : le navigateur en a
besoin pour s'abonner, le serveur pour signer ses envois.

Ne versionnez jamais la clé privée.
`);
