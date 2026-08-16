import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { estInstallee } from '@/lib/installPwa';

/**
 * Une seule redirection par lancement.
 *
 * Sans ce drapeau, « Accueil » deviendrait inatteignable depuis l'application :
 * chaque retour sur `/` renverrait aussitôt vers l'espace personnel. Le module
 * n'étant évalué qu'une fois par chargement de page, le drapeau se réarme
 * naturellement à chaque ouverture de l'application.
 */
let demarrageTraite = false;

/**
 * Ouvre l'application installée sur l'espace de la personne connectée.
 *
 * Le `start_url` du manifeste est l'accueil public, et il doit le rester : une
 * visiteuse qui découvre le salon, ou une cliente sans compte, doivent voir la
 * vitrine et pouvoir réserver. Mais pour quelqu'un de déjà connecté, atterrir
 * sur la page publique à chaque ouverture donne l'impression d'être déconnectée
 * et impose de traverser le menu pour rejoindre son espace.
 *
 * La redirection ne vise donc que le lancement depuis l'écran d'accueil. Dans
 * un onglet de navigateur, l'accueil reste l'accueil : on y arrive par un lien
 * ou une recherche, et détourner la navigation serait déroutant.
 */
export function useDemarrageApplication(): void {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    // Tant que la session n'est pas tranchée, on ne sait pas où envoyer.
    if (loading || demarrageTraite) return;
    demarrageTraite = true;

    if (!user || !estInstallee() || pathname !== '/') return;

    // `replace` plutôt qu'un empilement : le bouton retour doit fermer
    // l'application, pas ramener sur l'accueil qu'on vient de quitter.
    navigate(user.role === 'admin' ? '/admin' : '/mon-espace', { replace: true });
  }, [user, loading, pathname, navigate]);
}
