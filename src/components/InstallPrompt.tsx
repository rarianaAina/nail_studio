import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Événement propre à Chrome, absent des types standards du DOM. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const CLE_REFUS = 'installation-refusee';

interface InstallPromptProps {
  /** Texte adapté au public : la praticienne et les clientes n'installent pas pour les mêmes raisons. */
  message?: string;
}

/**
 * Invitation discrète à installer l'application.
 *
 * Chrome propose déjà l'installation de lui-même, mais par un menu que
 * personne n'ouvre. Une invitation visible change nettement le taux
 * d'installation — ce qui compte surtout pour la praticienne, l'application
 * installée étant la condition des notifications de réservation.
 */
export default function InstallPrompt({ message }: InstallPromptProps) {
  const [invite, setInvite] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(CLE_REFUS)) return;

    const onPrompt = (e: Event) => {
      // Empêcher l'invitation native, pour la déclencher au moment choisi.
      e.preventDefault();
      setInvite(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  // L'événement n'est émis que si l'application est installable et ne l'est pas
  // déjà : aucune bannière ne s'affiche une fois installée.
  if (!invite) return null;

  const installer = async () => {
    await invite.prompt();
    const { outcome } = await invite.userChoice;
    if (outcome === 'dismissed') localStorage.setItem(CLE_REFUS, '1');
    setInvite(null);
  };

  const refuser = () => {
    localStorage.setItem(CLE_REFUS, '1');
    setInvite(null);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-border/60 bg-card p-4 shadow-glow sm:inset-x-auto sm:right-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Installer l'application</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {message ?? 'Accédez au salon depuis votre écran d\'accueil, sans passer par le navigateur.'}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="rounded-full" onClick={installer}>
              Installer
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={refuser}>
              Plus tard
            </Button>
          </div>
        </div>
        <button
          onClick={refuser}
          aria-label="Fermer"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
