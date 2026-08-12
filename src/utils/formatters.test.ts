import { describe, it, expect } from 'vitest';
import { formatDuration, formatAriary } from './formatters';

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
