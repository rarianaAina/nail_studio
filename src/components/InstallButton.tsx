import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useInstallApp } from '@/hooks/useInstallApp';
import IosInstallGuide from '@/components/IosInstallGuide';
import { cn } from '@/utils/cn';

interface InstallButtonProps {
  className?: string;
  label?: string;
}

/**
 * Entrée permanente vers l'installation.
 *
 * La bannière se tait pendant un mois après un refus. Ce bouton, lui, reste
 * disponible en permanence : quelqu'un qui a écarté la bannière puis change
 * d'avis doit pouvoir installer sans attendre ni vider son navigateur.
 *
 * Il disparaît de lui-même une fois l'application installée, ou lorsque le
 * navigateur ne propose pas l'installation — sur un ordinateur de bureau
 * ancien, par exemple.
 */
export default function InstallButton({ className, label }: InstallButtonProps) {
  const { installable, installee, ios, installer } = useInstallApp();
  const [guideOuvert, setGuideOuvert] = useState(false);

  // Sur iPhone, `installable` est toujours faux : Safari n'émet aucune
  // invitation. Le bouton doit malgré tout s'afficher, pour ouvrir la marche
  // à suivre manuelle.
  if (installee || (!installable && !ios)) return null;

  return (
    <>
      <button
        onClick={async () => {
          if (ios) {
            setGuideOuvert(true);
            return;
          }
          const accepte = await installer();
          if (accepte) toast.success('Application installée.');
        }}
        className={cn(
          'flex items-center gap-1.5 text-sm transition-colors hover:text-primary',
          className
        )}
      >
        <Download className="h-4 w-4" />
        {label ?? "Installer l'application"}
      </button>

      {ios && <IosInstallGuide ouvert={guideOuvert} onClose={() => setGuideOuvert(false)} />}
    </>
  );
}
