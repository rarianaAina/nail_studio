import { useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useReviews } from '@/hooks/useReviews';
import type { BusinessHours } from '@/types';

const JOURS_SCHEMA: Record<string, string> = {
  Lundi: 'Monday',
  Mardi: 'Tuesday',
  Mercredi: 'Wednesday',
  Jeudi: 'Thursday',
  Vendredi: 'Friday',
  Samedi: 'Saturday',
  Dimanche: 'Sunday',
};

const SCRIPT_ID = 'donnees-structurees-salon';

/**
 * Décrit le salon au format schema.org, pour la recherche locale.
 *
 * `BeautySalon` est un sous-type de `LocalBusiness` : plus précis, il permet à
 * Google d'afficher horaires, téléphone et note moyenne directement dans les
 * résultats — le principal levier d'acquisition pour un commerce de proximité.
 *
 * Les données proviennent des paramètres du salon plutôt que d'un fichier
 * statique : modifier une adresse ou des horaires dans l'administration met le
 * balisage à jour, sans risque de désynchronisation.
 */
export default function StructuredData() {
  const { settings } = useSettings();
  const { reviews, averageRating } = useReviews();

  useEffect(() => {
    if (!settings) return;

    const origine = window.location.origin;

    const horaires = (settings.hours ?? [])
      .filter((h: BusinessHours) => !h.closed && JOURS_SCHEMA[h.day])
      .map((h: BusinessHours) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${JOURS_SCHEMA[h.day]}`,
        opens: h.open,
        closes: h.close,
      }));

    const reseaux = [settings.facebook, settings.instagram].filter(Boolean);

    const donnees: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'BeautySalon',
      name: settings.name,
      description: settings.tagline,
      url: origine,
      telephone: settings.phone,
      email: settings.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.address,
        addressCountry: 'FR',
      },
      priceRange: '€€',
      currenciesAccepted: 'EUR',
      // Le règlement s'effectue sur place, aucun paiement n'étant traité en ligne.
      paymentAccepted: 'Espèces, Carte bancaire',
    };

    if (settings.logoUrl) donnees.image = settings.logoUrl;
    if (horaires.length > 0) donnees.openingHoursSpecification = horaires;
    if (reseaux.length > 0) donnees.sameAs = reseaux;

    // La note n'est déclarée que si elle repose sur des avis réels : un
    // balisage d'agrégat sans avis est considéré comme trompeur par Google.
    if (reviews.length > 0 && averageRating > 0) {
      donnees.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: averageRating,
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(donnees);
  }, [settings, reviews, averageRating]);

  return null;
}
