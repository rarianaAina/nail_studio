import { describe, it, expect, vi, afterEach } from 'vitest';
import { isPastDate, toDateString, parseDate, isToday } from './date';

/** Fige l'horloge au 12 août 2026 à 14h locales. */
const freezeAt = (d: Date) => {
  vi.useFakeTimers();
  vi.setSystemTime(d);
};

afterEach(() => {
  vi.useRealTimers();
});

describe('isPastDate', () => {
  it('considère la veille comme passée', () => {
    freezeAt(new Date(2026, 7, 12, 14, 0));
    expect(isPastDate('2026-08-11')).toBe(true);
  });

  // La journée en cours reste réservable, c'est la règle métier retenue.
  it("ne considère pas aujourd'hui comme passé", () => {
    freezeAt(new Date(2026, 7, 12, 14, 0));
    expect(isPastDate('2026-08-12')).toBe(false);
  });

  it('ne considère pas le lendemain comme passé', () => {
    freezeAt(new Date(2026, 7, 12, 14, 0));
    expect(isPastDate('2026-08-13')).toBe(false);
  });

  it('reste correct au changement de mois', () => {
    freezeAt(new Date(2026, 8, 1, 0, 30)); // 1er septembre, 0h30
    expect(isPastDate('2026-08-31')).toBe(true);
    expect(isPastDate('2026-09-01')).toBe(false);
  });

  it('reste correct au changement d’année', () => {
    freezeAt(new Date(2027, 0, 1, 9, 0));
    expect(isPastDate('2026-12-31')).toBe(true);
    expect(isPastDate('2027-01-01')).toBe(false);
  });

  // La comparaison est lexicographique : elle n'a de sens que si le format est
  // strictement zéro-complété.
  it('compare correctement des mois et jours à un chiffre', () => {
    freezeAt(new Date(2026, 0, 9, 12, 0)); // 9 janvier 2026
    expect(isPastDate('2026-01-08')).toBe(true);
    expect(isPastDate('2026-01-10')).toBe(false);
  });
});

describe('toDateString', () => {
  it('complète le mois et le jour à deux chiffres', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateString(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('parseDate', () => {
  // `new Date('2026-08-31')` serait interprété en UTC et pourrait basculer de
  // jour selon le fuseau.
  it('interprète la date dans le fuseau local', () => {
    const d = parseDate('2026-08-31');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(31);
  });
});

describe('isToday', () => {
  it('reconnaît la date du jour', () => {
    freezeAt(new Date(2026, 7, 12, 23, 45));
    expect(isToday('2026-08-12')).toBe(true);
    expect(isToday('2026-08-13')).toBe(false);
  });
});
