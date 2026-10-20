import {cinematicGlowPreset} from './stylePresets';
import {defaultStory} from './story';
import type {LyricLine, LyricToken, SongProject} from '../types';

const DEFAULT_RENDER_DURATION = 45;

export const createProjectId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `project-${Date.now()}`;
};

export const tokenizeLine = (line: string): LyricToken[] =>
  line
    .split(/\s+/)
    .filter(Boolean)
    .map((text, index) => ({
      index,
      text,
      emphasis: text.replace(/[^\p{L}\p{N}]/gu, '').length >= 5
    }));

export const parseLyrics = (rawLyrics: string): LyricLine[] =>
  rawLyrics
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text, index) => ({
      index,
      text,
      tokens: tokenizeLine(text),
      startTime: null,
      endTime: null
    }));

export const createEmptyProject = (): SongProject => {
  const now = new Date().toISOString();

  return {
    id: createProjectId(),
    title: 'Untitled Cover',
    audio: null,
    rawLyrics: '',
    lines: [],
    stylePreset: cinematicGlowPreset,
    story: {...defaultStory, scenes: {}},
    renderSettings: {
      width: 1080,
      height: 1920,
      fps: 30,
      duration: DEFAULT_RENDER_DURATION,
      outputName: 'coverreel'
    },
    createdAt: now,
    updatedAt: now
  };
};

export const withParsedLyrics = (
  project: SongProject,
  rawLyrics: string
): SongProject => {
  const lines = parseLyrics(rawLyrics);
  const now = new Date().toISOString();

  return {
    ...project,
    rawLyrics,
    lines,
    story: project.story ? {...project.story, scenes: {}} : undefined,
    updatedAt: now
  };
};

export const deriveTitleFromFilename = (name: string): string => {
  const cleaned = name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Untitled Cover';
};
