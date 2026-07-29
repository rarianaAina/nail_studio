/**
 * Format a number as Malagasy Ariary.
 * e.g. 25000 → "25 000 €"
 */
export const formatAriary = (amount: number): string =>
  new Intl.NumberFormat('fr-FR').format(amount) + ' €';

/**
 * Format a date string for display.
 * e.g. "2026-07-14" → "14 juil."
 */
export const formatShortDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });

/**
 * Format a date string for full display.
 * e.g. "2026-07-14" → "lundi 14 juillet 2026"
 */
export const formatFullDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/**
 * Get today's ISO date string.
 */
export const todayISO = (): string => new Date().toISOString().slice(0, 10);

/**
 * Get ISO date string offset from today.
 */
export const isoOffset = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
