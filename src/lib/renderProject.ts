import type {SongProject} from '../types';
import {normalizeStory} from './story';

export const prepareProjectForRender = (project: SongProject): SongProject => {
  const duration = Math.max(
    project.audio?.duration ?? 0,
    project.renderSettings.duration,
    1
  );

  return {
    ...project,
    story: normalizeStory(project.story),
    renderSettings: {
      ...project.renderSettings,
      duration,
      width: 1080,
      height: 1920,
      fps: 30
    }
  };
};

export const getSafeOutputName = (value: string): string => {
  const safe = value
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);

  return safe || 'coverreel';
};
