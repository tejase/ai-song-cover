import {describe, expect, it} from 'vitest';
import {createEmptyProject, parseLyrics} from './lyrics';
import {getStorySections, normalizeStory} from './story';

describe('illustrated storyboard', () => {
  it('uses stanza boundaries and the tapped start of the next section', () => {
    const project = createEmptyProject();
    project.rawLyrics = 'First\nSecond\n\nThird\nFourth';
    project.lines = parseLyrics(project.rawLyrics).map((line, i) => ({...line, startTime: i * 2}));
    project.renderSettings.duration = 8;
    project.story!.scenes['2'] = 'stage';
    const sections = getStorySections(project);
    expect(sections.map(s => [s.firstLine, s.lastLine, s.start, s.end, s.scene])).toEqual([
      [0, 1, 0, 4, 'rain'], [2, 3, 4, 8, 'stage']
    ]);
  });
  it('groups lyrics without blank lines into four-line sections', () => {
    const project = createEmptyProject();
    project.rawLyrics = 'One\nTwo\nThree\nFour\nFive';
    project.lines = parseLyrics(project.rawLyrics);
    expect(getStorySections(project).map(s => [s.firstLine, s.lastLine])).toEqual([[0, 3], [4, 4]]);
  });
  it('rejects unknown settings and keeps old projects cinematic', () => {
    expect(normalizeStory(undefined).mode).toBe('cinematic');
    expect(normalizeStory({mode: 'illustrated', mood: 'bad', scenes: {'0': 'rain', '2': '<script>', '__proto__': 'stage'}})).toEqual({
      mode: 'illustrated', mood: 'midnight', scenes: {'0': 'rain'}
    });
  });
});
