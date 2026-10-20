import {describe, expect, it} from 'vitest';
import {parseLyrics, tokenizeLine} from './lyrics';

describe('lyric parsing', () => {
  it('keeps repeated chorus lines and removes blanks', () => {
    const lines = parseLyrics('\nStay with me\n\nStay with me\nTonight\n');

    expect(lines).toHaveLength(3);
    expect(lines.map((line) => line.text)).toEqual([
      'Stay with me',
      'Stay with me',
      'Tonight'
    ]);
    expect(lines.map((line) => line.index)).toEqual([0, 1, 2]);
  });

  it('tokenizes punctuation without dropping display text', () => {
    const tokens = tokenizeLine("I'm yours, forever.");

    expect(tokens.map((token) => token.text)).toEqual([
      "I'm",
      'yours,',
      'forever.'
    ]);
    expect(tokens[2].emphasis).toBe(true);
  });
});
