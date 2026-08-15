import { useCallback, useSyncExternalStore } from 'react';
import {
  estInstallable,
  estInstallee,
  proposerInstallation,
  sAbonner,
} from '@/lib/installPwa';

interface UseInstallAppReturn {
  /** Vrai tant que le navigateur propose l'installation et qu'elle n'a pas eu lieu. */
  installable: boolean;
  /** Vrai lorsque l'application est déjà lancée depuis l'écran d'accueil. */
  installee: boolean;
  installer: () => Promise<boolean>;
}

/**
 * Accès à l'installation depuis n'importe quel composant.
 *
 * Plusieurs éléments d'interface la proposent — une bannière, une entrée de
 * menu — et doivent tous refléter le même état : dès que l'installation a lieu,
 * ils disparaissent ensemble.
 */
export function useInstallApp(): UseInstallAppReturn {
  const installable = useSyncExternalStore(
    sAbonner,
    estInstallable,
    () => false
  );

  const installer = useCallback(() => proposerInstallation(), []);

  return { installable, installee: estInstallee(), installer };
}
