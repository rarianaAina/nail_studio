/**
 * Fréquentation du site public.
 *
 * L'unité de mesure est la *visite* : une personne sur une journée. Les
 * visiteurs sont distingués par une empreinte anonyme renouvelée chaque nuit,
 * si bien qu'une même personne revenant trois jours compte pour trois visites.
 * Aucun compteur de « visiteurs uniques sur le mois » n'est donc exposé : il
 * supposerait un identifiant persistant, que cette mesure s'interdit.
 */

/** Un point de la courbe journalière. */
export interface PointFrequentation {
  /** Date au format 'YYYY-MM-DD'. */
  jour: string;
  visites: number;
  pagesVues: number;
}

export interface PageConsultee {
  /** Chemin de la page, par exemple '/prestations'. */
  chemin: string;
  vues: number;
  visites: number;
}

export interface Provenance {
  /** 'Instagram', 'Google', 'Accès direct', ou le domaine référent. */
  source: string;
  visites: number;
}

export interface Appareil {
  /** 'Mobile', 'Tablette' ou 'Ordinateur'. */
  type: string;
  visites: number;
}

export interface FrequentationStats {
  periodeJours: number;
  debut: string;
  fin: string;
  totalVisites: number;
  totalPagesVues: number;
  pagesParVisite: number;
  /** Variation en pourcentage face à la période précédente de même durée.
   *  `null` lorsque cette période ne comptait aucune visite : il n'y a alors
   *  rien à comparer. */
  deltaVisites: number | null;
  serie: PointFrequentation[];
  pages: PageConsultee[];
  provenances: Provenance[];
  appareils: Appareil[];
}

/** Périodes proposées dans l'administration. */
export const PERIODES = [7, 30, 90] as const;
export type Periode = (typeof PERIODES)[number];
