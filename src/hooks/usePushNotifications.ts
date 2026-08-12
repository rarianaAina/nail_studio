import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/** Clé publique VAPID, sans laquelle aucun abonnement n'est possible. */
const CLE_PUBLIQUE = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** Le navigateur attend un Uint8Array, la clé est transmise en base64url. */
function base64UrlVersOctets(base64: string): Uint8Array {
  const complement = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalise = (base64 + complement).replace(/-/g, '+').replace(/_/g, '/');
  const brut = atob(normalise);
  return Uint8Array.from(brut, (c) => c.charCodeAt(0));
}

function cleVersBase64(cle: ArrayBuffer | null): string {
  if (!cle) return '';
  return btoa(String.fromCharCode(...new Uint8Array(cle)));
}

export type EtatPush =
  | 'indisponible'   // navigateur sans prise en charge, ou clé absente
  | 'refuse'         // autorisation refusée : seul l'utilisateur peut revenir dessus
  | 'inactif'
  | 'actif';

interface UsePushReturn {
  etat: EtatPush;
  occupe: boolean;
  activer: () => Promise<void>;
  desactiver: () => Promise<void>;
}

/**
 * Abonnement de l'appareil courant aux notifications.
 *
 * Un même compte peut être abonné depuis plusieurs appareils : chacun produit
 * son propre abonnement, et l'envoi les vise tous.
 */
export function usePushNotifications(): UsePushReturn {
  const { user } = useAuth();
  const [etat, setEtat] = useState<EtatPush>('indisponible');
  const [occupe, setOccupe] = useState(false);

  const pris_en_charge =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!CLE_PUBLIQUE;

  const relire = useCallback(async () => {
    if (!pris_en_charge) return setEtat('indisponible');
    if (Notification.permission === 'denied') return setEtat('refuse');

    const registration = await navigator.serviceWorker.ready;
    const abonnement = await registration.pushManager.getSubscription();
    setEtat(abonnement ? 'actif' : 'inactif');
  }, [pris_en_charge]);

  useEffect(() => {
    relire();
  }, [relire]);

  const activer = useCallback(async () => {
    if (!pris_en_charge || !user) return;
    setOccupe(true);
    try {
      const autorisation = await Notification.requestPermission();
      if (autorisation !== 'granted') {
        setEtat(autorisation === 'denied' ? 'refuse' : 'inactif');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const abonnement =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          // Sans cette option, Chrome refuse l'abonnement : toute notification
          // doit être visible, aucune ne peut être silencieuse.
          userVisibleOnly: true,
          applicationServerKey: base64UrlVersOctets(CLE_PUBLIQUE!),
        }));

      const donnees = abonnement.toJSON();

      // `upsert` sur l'endpoint : réactiver depuis un appareil déjà connu ne
      // doit pas créer de doublon.
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: abonnement.endpoint,
          p256dh: donnees.keys?.p256dh ?? cleVersBase64(abonnement.getKey('p256dh')),
          auth: donnees.keys?.auth ?? cleVersBase64(abonnement.getKey('auth')),
          user_agent: navigator.userAgent.slice(0, 200),
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

      if (error) throw error;
      setEtat('actif');
    } finally {
      setOccupe(false);
    }
  }, [pris_en_charge, user]);

  const desactiver = useCallback(async () => {
    setOccupe(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const abonnement = await registration.pushManager.getSubscription();
      if (abonnement) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', abonnement.endpoint);
        await abonnement.unsubscribe();
      }
      setEtat('inactif');
    } finally {
      setOccupe(false);
    }
  }, []);

  return { etat, occupe, activer, desactiver };
}
