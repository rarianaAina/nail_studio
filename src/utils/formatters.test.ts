import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatAriary,
  formatShortDate,
  formatFullDate,
  todayISO,
  isoOffset,
} from './formatters';
import { toDateString } from './date';

describe('formatDuration', () => {
  it('affiche les durées inférieures à une heure en minutes', () => {
    expect(formatDuration(30)).toBe('30min');
    expect(formatDuration(45)).toBe('45min');
    expect(formatDuration(5)).toBe('5min');
  });

  it('omet les minutes quand la durée est une heure pleine', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(180)).toBe('3h');
  });

  it('complète les minutes à deux chiffres', () => {
    // « 2h5 » se lit mal : on écrit « 2h05 ».
    expect(formatDuration(125)).toBe('2h05');
    expect(formatDuration(61)).toBe('1h01');
  });

  it('combine heures et minutes', () => {
    expect(formatDuration(90)).toBe('1h30');
    expect(formatDuration(135)).toBe('2h15');
    expect(formatDuration(150)).toBe('2h30');
  });

  it('tient les valeurs limites', () => {
    expect(formatDuration(0)).toBe('0min');
    expect(formatDuration(-10)).toBe('0min');
    expect(formatDuration(NaN)).toBe('0min');
  });
});

describe('formatAriary', () => {
  // `Intl` sépare les milliers par une espace fine insécable, dont le point de
  // code varie selon la version d'ICU. On normalise plutôt que de le figer.
  const normalize = (s: string) => s.replace(/\s/g, ' ');

  it('sépare les milliers', () => {
    expect(normalize(formatAriary(25000))).toBe('25 000 €');
  });

  it('accepte zéro', () => {
    expect(normalize(formatAriary(0))).toBe('0 €');
  });
});

/**
 * Régression : un rendez-vous enregistré au 30 août s'affichait au 29.
 *
 * Deux conversions fautives se répondaient. `new Date('2026-08-30')` interprète
 * la chaîne en UTC, et `toISOString()` reconvertit une date locale vers UTC —
 * dans tout fuseau en avance sur Greenwich, Paris comme Antananarivo, le jour
 * reculait d'un cran.
 *
 * Les tests s'exécutent dans le fuseau de la machine ; ils vaudraient donc
 * aussi bien pour un décalage négatif, dans l'autre sens.
 */
describe('dates — pas de glissement de fuseau', () => {
  it('affiche le jour enregistré, sans décalage', () => {
    expect(formatShortDate('2026-08-30')).toContain('30');
    expect(formatFullDate('2026-08-30')).toContain('30');
    expect(formatFullDate('2026-08-30')).toContain('août');
  });

  it('reste juste au premier et au dernier jour du mois', () => {
    expect(formatShortDate('2026-09-01')).toContain('01');
    expect(formatShortDate('2026-08-31')).toContain('31');
    expect(formatFullDate('2026-12-31')).toContain('2026');
    expect(formatFullDate('2027-01-01')).toContain('2027');
  });

  it('todayISO correspond à la date locale', () => {
    const attendu = toDateString(new Date());
    expect(todayISO()).toBe(attendu);
  });

  it('isoOffset décale du bon nombre de jours', () => {
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    expect(isoOffset(1)).toBe(toDateString(demain));
    expect(isoOffset(0)).toBe(todayISO());
  });
});
