/**
 * Conserve la possibilité d'installer l'application.
 *
 * Le navigateur n'émet `beforeinstallprompt` **qu'une seule fois par
 * chargement**, et très tôt — souvent avant que React ait monté quoi que ce
 * soit. L'écouteur est donc posé à l'import de ce module, et l'événement mis de
 * côté : sans cela, une bannière montée après coup ne le verrait jamais.
 *
 * L'invitation ne peut être présentée qu'une fois par événement. Après un
 * refus, le navigateur en émettra un nouveau au chargement suivant.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let invitation: BeforeInstallPromptEvent | null = null;
const abonnes = new Set<() => void>();

function prevenir() {
  abonnes.forEach((cb) => cb());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Empêcher l'invitation native, pour la déclencher au moment choisi.
    e.preventDefault();
    invitation = e as BeforeInstallPromptEvent;
    prevenir();
  });

  window.addEventListener('appinstalled', () => {
    invitation = null;
    prevenir();
  });
}

/** L'application tourne-t-elle déjà en mode installé ? */
export function estInstallee(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari sur iOS n'implémente pas `display-mode`.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function estInstallable(): boolean {
  return invitation !== null;
}

export function sAbonner(cb: () => void): () => void {
  abonnes.add(cb);
  return () => {
    abonnes.delete(cb);
  };
}

/**
 * Présente l'invitation d'installation.
 *
 * Renvoie `true` si l'installation a été acceptée. L'événement est consommé
 * quel que soit le choix : le navigateur en émettra un nouveau plus tard.
 */
export async function proposerInstallation(): Promise<boolean> {
  if (!invitation) return false;
  const evenement = invitation;
  invitation = null;
  prevenir();

  await evenement.prompt();
  const { outcome } = await evenement.userChoice;
  return outcome === 'accepted';
}
