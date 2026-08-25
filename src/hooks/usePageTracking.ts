import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { audienceService } from '@/services/audienceService';

/**
 * Consigne chaque page publique consultée.
 *
 * Sur une application à page unique, aucun chargement de document ne survient
 * après l'entrée sur le site : la navigation est interne, et une mesure fondée
 * sur le seul chargement initial ne verrait qu'une page par visite. L'écoute
 * du routeur est donc le seul point d'observation possible.
 *
 * Le référent n'est transmis qu'à la première page : `document.referrer`
 * conserve ensuite la valeur de l'entrée, et la répéter ferait compter une
 * même provenance à chaque page parcourue.
 */
export function usePageTracking(): void {
  const { pathname } = useLocation();
  const dernierChemin = useRef<string | null>(null);

  useEffect(() => {
    // Le mode strict monte les effets deux fois en développement, et un
    // retour arrière peut rejouer le même chemin : sans cette garde, la page
    // serait comptée deux fois.
    if (dernierChemin.current === pathname) return;

    const premiereVue = dernierChemin.current === null;
    dernierChemin.current = pathname;

    void audienceService.enregistrerVisite(
      pathname,
      premiereVue ? document.referrer : null
    );
  }, [pathname]);
}
