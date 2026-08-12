import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';

interface SeoProps {
  title: string;
  description: string;
  /** Image de partage. À défaut, celle par défaut du site est conservée. */
  image?: string;
  /** `noindex` pour les pages sans intérêt en recherche. */
  noindex?: boolean;
}

/** Crée la balise si elle manque, la met à jour sinon. */
function setMeta(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Métadonnées de la page courante.
 *
 * L'application étant rendue côté navigateur, `index.html` ne portait qu'un
 * titre et une description uniques pour l'ensemble du site : toutes les pages
 * se présentaient de façon identique dans les résultats de recherche.
 *
 * Google exécute le JavaScript et retient donc ces balises. Les robots des
 * réseaux sociaux, eux, ne l'exécutent pas : les valeurs par défaut inscrites
 * dans `index.html` leur restent nécessaires pour le partage de la page
 * d'accueil.
 */
export default function Seo({ title, description, image, noindex }: SeoProps) {
  const { pathname } = useLocation();
  const { settings } = useSettings();

  // Le nom du salon est ajouté ici plutôt que répété sur chaque page : il vient
  // des paramètres et suivrait donc un changement de dénomination.
  const nom = settings?.name;
  const titreComplet = nom && !title.includes(nom) ? `${title} — ${nom}` : title;
  const partage = image ?? settings?.logoUrl;

  useEffect(() => {
    const url = `${window.location.origin}${pathname}`;
    const title = titreComplet;
    const image = partage;

    document.title = title;
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setLink('canonical', url);

    setMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: url });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    if (image) {
      setMeta('meta[property="og:image"]', { property: 'og:image', content: image });
      setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
    }

    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });

    setMeta('meta[name="robots"]', {
      name: 'robots',
      content: noindex ? 'noindex, follow' : 'index, follow',
    });
  }, [titreComplet, description, partage, noindex, pathname]);

  return null;
}
