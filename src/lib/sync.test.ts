import {describe, expect, it} from 'vitest';
import {parseLyrics} from './lyrics';
import {
  findNextUnsyncedIndex,
  tapNextLine,
  undoLastTap,
  updateLineTiming
} from './sync';

describe('tap sync timing', () => {
  it('records taps in lyric order and closes the previous line', () => {
    let lines = parseLyrics('First line\nSecond line\nThird line');

    lines = tapNextLine(lines, 1.2, 10);
    lines = tapNextLine(lines, 4.4, 10);

    expect(lines[0].startTime).toBe(1.2);
    expect(lines[0].endTime).toBe(4.36);
    expect(lines[1].startTime).toBe(4.4);
    expect(findNextUnsyncedIndex(lines)).toBe(2);
  });

  it('undoes the latest tap and reopens the previous line', () => {
    let lines = parseLyrics('First line\nSecond line');

    lines = tapNextLine(lines, 0.5, 8);
    lines = tapNextLine(lines, 3, 8);
    lines = undoLastTap(lines, 8);

    expect(lines[0].endTime).toBe(8);
    expect(lines[1].startTime).toBeNull();
    expect(lines[1].endTime).toBeNull();
  });

  it('allows manual timing edits while preserving minimum duration', () => {
    let lines = parseLyrics('First line');
    lines = tapNextLine(lines, 2, 6);
    lines = updateLineTiming(lines, 0, 'endTime', 1.5, 6);

    expect(lines[0].endTime).toBe(2.2);
  });
});
