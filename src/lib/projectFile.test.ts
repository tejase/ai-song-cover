import {describe, expect, it} from 'vitest';
import {createEmptyProject, parseLyrics} from './lyrics';
import {parseProjectFile, serializeProject, validateProject} from './projectFile';
import {layoutRockLine} from './rock';

function fixture() {
  const p = createEmptyProject();
  p.rawLyrics = 'An original line\nAnother original line';
  p.lines = parseLyrics(p.rawLyrics).map((l, i) => ({...l, startTime: i * 3, endTime: (i + 1) * 3}));
  p.renderSettings.duration = 6;
  return p;
}

describe('portable project files', () => {
  it('round trips timing/style without embedded audio or unknown properties', () => {
    const p = fixture();
    const restored = parseProjectFile(serializeProject({...p, story: {...p.story!, mode: 'directed'}}));
    expect(restored.lines).toEqual(p.lines);
    expect(restored.story?.mode).toBe('directed');
    expect(restored.audio).toBeNull();
    expect(validateProject({...p, secret: 'drop me'})).not.toHaveProperty('secret');
  });
  it('allows untapped drafts but rejects them for rendering', () => {
    const p = fixture(); p.lines[1].startTime = null;
    expect(() => parseProjectFile(serializeProject(p))).not.toThrow();
    expect(() => validateProject(p, true)).toThrow(/Time every/);
  });
  it('rejects invalid versions, oversized files and invalid timing', () => {
    expect(() => parseProjectFile('{"version":2}')).toThrow(/version/);
    expect(() => parseProjectFile(' '.repeat(1_000_001))).toThrow(/1 MB/);
    const p = fixture(); p.lines[1].startTime = -1;
    expect(() => validateProject(p)).toThrow();
    p.lines[1].startTime = 0; p.lines[0].startTime = 2;
    expect(() => validateProject(p)).toThrow(/ordered/);
  });
  it('rejects unbounded rendering, invalid styles and words outside the line', () => {
    const p = fixture(); p.renderSettings.duration = Infinity;
    expect(() => validateProject(p)).toThrow();
    p.renderSettings.duration = 6; p.stylePreset = {...p.stylePreset, textColor: 'url(x)'};
    expect(() => validateProject(p)).toThrow(/hex/);
    p.stylePreset = createEmptyProject().stylePreset; p.lines[0].tokens[0].startTime = 5;
    expect(() => validateProject(p)).toThrow(/Word time/);
  });
  it('preserves all words in bounded rock rows for arbitrary lengths', () => {
    for (const line of ['Hey!', 'word '.repeat(100).trim(), 'Superlongunbrokenlyric'.repeat(10)]) {
      const rows = layoutRockLine(line);
      expect(rows.length).toBeLessThanOrEqual(3);
      expect(rows.join(' ')).toBe(line);
    }
  });
});
