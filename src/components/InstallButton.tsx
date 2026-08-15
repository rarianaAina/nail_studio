import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useInstallApp } from '@/hooks/useInstallApp';
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
  const { installable, installee, installer } = useInstallApp();

  if (!installable || installee) return null;

  return (
    <button
      onClick={async () => {
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
  );
}
