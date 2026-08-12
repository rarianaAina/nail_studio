/**
 * Convertit une date en format YYYY-MM-DD sans décalage horaire
 * Utile pour stocker des dates en base de données
 */
export const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

/**
 * Parse une date stockée en base (YYYY-MM-DD) en Date locale
 */
export const parseDate = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
};

/**
 * Formate une date pour l'affichage (ex: "20 août 2026")
 */
export const formatDate = (dateStr: string, locale: string = 'fr-FR'): string => {
  const date = parseDate(dateStr);
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Vérifie si une date est aujourd'hui (sans heure)
 */
export const isToday = (dateStr: string): boolean => {
  const today = toDateString(new Date());
  return dateStr === today;
};

/**
 * Vérifie si une date est révolue, la journée en cours ne l'étant pas.
 *
 * La comparaison porte sur les chaînes 'YYYY-MM-DD', dont l'ordre
 * lexicographique coïncide avec l'ordre chronologique. Passer par des objets
 * `Date` exposerait aux décalages de fuseau qui ont déjà faussé les agrégats.
 */
export const isPastDate = (dateStr: string): boolean =>
  dateStr < toDateString(new Date());

/**
 * Formate une date courte (ex: "20 août")
 */
export const formatDateShort = (dateStr: string, locale: string = 'fr-FR'): string => {
  const date = parseDate(dateStr);
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short'
  });
};