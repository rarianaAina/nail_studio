import { describe, it, expect } from 'vitest';
import { extensionPourType } from './storageService';

describe('extensionPourType', () => {
  it('reconnaît les formats produits par le navigateur', () => {
    expect(extensionPourType('image/webp')).toBe('webp');
    expect(extensionPourType('image/jpeg')).toBe('jpg');
    expect(extensionPourType('image/png')).toBe('png');
  });

  /**
   * Le défaut d'origine : le fichier était nommé « .webp » quel que soit le
   * format réellement obtenu. Des photographies encodées en PNG se sont ainsi
   * retrouvées en ligne sous une extension mensongère, à 700 Ko au lieu de 60.
   */
  it('ne prétend pas au WebP pour un type qui ne l’est pas', () => {
    expect(extensionPourType('image/png')).not.toBe('webp');
    expect(extensionPourType('image/jpeg')).not.toBe('webp');
  });

  it('reste prudent sur un type inattendu', () => {
    expect(extensionPourType('image/avif')).toBe('bin');
    expect(extensionPourType('')).toBe('bin');
  });
});
