import { Share, Plus, ChevronRight, Compass, Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface IosInstallGuideProps {
  ouvert: boolean;
  onClose: () => void;
  /** Faux dans Chrome, Firefox ou une vue intégrée : un détour par Safari s'impose. */
  safari?: boolean;
}

/**
 * Marche à suivre pour installer sur iPhone.
 *
 * Safari n'offre aucune installation automatique : la manipulation est
 * manuelle, et surtout elle ne se devine pas. Personne ne pense à chercher
 * « Sur l'écran d'accueil » dans un menu de partage.
 *
 * Ces instructions remplacent donc le bouton d'installation sur les appareils
 * Apple, où il serait sans effet.
 */
export default function IosInstallGuide({ ouvert, onClose, safari = true }: IosInstallGuideProps) {
  // Hors Safari, la toute première étape est d'y basculer : les suivantes sont
  // simplement absentes du menu de partage des autres navigateurs.
  const etapeSafari = {
    icone: Compass,
    titre: 'Ouvrez d’abord ce site dans Safari',
    detail:
      'L’ajout à l’écran d’accueil n’existe que dans Safari. Copiez l’adresse ci-dessous, puis collez-la dans Safari.',
  };

  const etapes = [
    {
      icone: Share,
      titre: 'Touchez le bouton Partager',
      detail: 'Le carré avec une flèche vers le haut, en bas de l’écran dans Safari.',
    },
    {
      icone: ChevronRight,
      titre: 'Faites défiler la liste',
      detail: 'Les options d’écran d’accueil se trouvent plus bas.',
    },
    {
      icone: Plus,
      titre: 'Choisissez « Sur l’écran d’accueil »',
      detail: 'Puis « Ajouter », en haut à droite.',
    },
  ];

  const liste = safari ? etapes : [etapeSafari, ...etapes];

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Installer sur iPhone</DialogTitle>
          <DialogDescription>
            {safari
              ? 'Trois gestes, depuis Safari. L’application rejoindra votre écran d’accueil.'
              : 'Vous n’êtes pas dans Safari : une étape supplémentaire est nécessaire.'}
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4">
          {liste.map((e, i) => (
            <li key={e.titre} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <e.icone className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {i + 1}. {e.titre}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        {!safari && (
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.origin);
                toast.success('Adresse copiée. Collez-la dans Safari.');
              } catch {
                // Le presse-papiers peut être refusé : l'adresse reste lisible
                // et recopiable à la main.
                toast.error('Copie impossible. Notez l’adresse affichée.');
              }
            }}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-secondary/60 p-3 text-left text-xs transition-colors hover:border-primary/40"
          >
            <span className="min-w-0 truncate font-medium">{window.location.origin}</span>
            <span className="flex shrink-0 items-center gap-1 text-primary">
              <Copy className="h-3.5 w-3.5" /> Copier
            </span>
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
