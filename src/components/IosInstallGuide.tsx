import { Share, Plus, ChevronRight } from 'lucide-react';
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
export default function IosInstallGuide({ ouvert, onClose }: IosInstallGuideProps) {
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

  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Installer sur iPhone</DialogTitle>
          <DialogDescription>
            Trois gestes, depuis Safari. L’application rejoindra votre écran d’accueil.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4">
          {etapes.map((e, i) => (
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

        {/* Chrome et Firefox sur iPhone s'appuient sur le moteur de Safari mais
            n'exposent pas l'ajout à l'écran d'accueil : le préciser évite une
            tentative vouée à l'échec. */}
        <p className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
          Cette manipulation n’est possible que depuis <strong>Safari</strong>. Si vous
          utilisez Chrome ou Firefox, ouvrez d’abord le site dans Safari.
        </p>
      </DialogContent>
    </Dialog>
  );
}
