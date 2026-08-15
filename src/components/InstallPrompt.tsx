import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallApp } from '@/hooks/useInstallApp';
import IosInstallGuide from '@/components/IosInstallGuide';

/**
 * Durée pendant laquelle la bannière reste silencieuse après un refus.
 *
 * Un refus définitif fermerait la porte pour toujours : une visiteuse qui
 * écarte la bannière lors de sa première visite n'aurait plus jamais
 * l'occasion d'installer, alors qu'elle peut très bien le vouloir après
 * quelques rendez-vous. Un mois laisse le temps d'oublier sans harceler.
 *
 * Le bouton permanent du menu, lui, reste disponible pendant ce silence.
 */
const SILENCE_JOURS = 30;
const CLE_REFUS = 'installation-reportee-jusqu-au';

function silencieuse(): boolean {
  const jusquA = localStorage.getItem(CLE_REFUS);
  if (!jusquA) return false;
  const echeance = Number(jusquA);
  // Valeur illisible — ancien format, stockage altéré : on repart à zéro.
  if (!Number.isFinite(echeance)) {
    localStorage.removeItem(CLE_REFUS);
    return false;
  }
  return Date.now() < echeance;
}

function reporter() {
  localStorage.setItem(
    CLE_REFUS,
    String(Date.now() + SILENCE_JOURS * 24 * 60 * 60 * 1000)
  );
}

interface InstallPromptProps {
  /** Texte adapté au public : la praticienne et les clientes n'installent pas pour les mêmes raisons. */
  message?: string;
}

export default function InstallPrompt({ message }: InstallPromptProps) {
  const { installable, installee, ios, installer } = useInstallApp();
  const [masquee, setMasquee] = useState(true);
  const [guideOuvert, setGuideOuvert] = useState(false);

  // Le stockage local n'est lu qu'après le montage : le consulter pendant le
  // rendu ferait diverger le premier affichage.
  useEffect(() => {
    setMasquee(silencieuse());
  }, []);

  if (installee || masquee || (!installable && !ios)) return null;

  const lancer = async () => {
    // Sur iPhone, l'installation est manuelle : on montre la marche à suivre
    // et on laisse la bannière ouverte, le temps de la lire.
    if (ios) {
      setGuideOuvert(true);
      return;
    }
    const accepte = await installer();
    if (!accepte) reporter();
    setMasquee(true);
  };

  const refuser = () => {
    reporter();
    setMasquee(true);
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
            <Button size="sm" className="rounded-full" onClick={lancer}>
              {ios ? 'Comment faire' : 'Installer'}
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

      {ios && (
        <IosInstallGuide
          ouvert={guideOuvert}
          onClose={() => {
            setGuideOuvert(false);
            reporter();
            setMasquee(true);
          }}
        />
      )}
    </div>
  );
}
