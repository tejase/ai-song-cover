import type {SceneId, SongProject, StoryMood, StorySettings} from '../types';

export const sceneOptions: Array<{id: SceneId; name: string}> = [
  {id: 'rain', name: 'Rain Window'},
  {id: 'hills', name: 'Moonlit Hills'},
  {id: 'ocean', name: 'Ocean'},
  {id: 'stage', name: 'Spotlight'}
];
export const storyMoods: Array<{id: StoryMood; name: string; color: string}> = [
  {id: 'midnight', name: 'Midnight', color: '#389b9a'},
  {id: 'rose', name: 'Rose', color: '#d97890'},
  {id: 'daybreak', name: 'Daybreak', color: '#e8b34b'}
];
export const defaultStory: StorySettings = {
  mode: 'illustrated', mood: 'midnight', scenes: {}
};
export interface StorySection {
  id: string;
  firstLine: number;
  lastLine: number;
  label: string;
  start: number;
  end: number;
  scene: SceneId;
}

export function getStorySections(project: SongProject): StorySection[] {
  const groups = project.rawLyrics.trim().split(/\r?\n\s*\r?\n/)
    .map(group => group.split(/\r?\n/).filter(line => line.trim()).length)
    .filter(Boolean);
  const counts = groups.length > 1 ? groups : Array.from(
    {length: Math.ceil(project.lines.length / 4)},
    (_, i) => Math.min(4, project.lines.length - i * 4)
  );
  const duration = project.audio?.duration || project.renderSettings.duration;
  let cursor = 0;
  return counts.map((count, i) => {
    const firstLine = cursor;
    cursor += count;
    const id = String(firstLine);
    const start = i === 0 ? 0 : project.lines[firstLine]?.startTime ??
      duration * firstLine / Math.max(1, project.lines.length);
    const end = project.lines[cursor]?.startTime ??
      (cursor >= project.lines.length ? duration : duration * cursor / project.lines.length);
    return {
      id, firstLine, lastLine: cursor - 1,
      label: project.lines[firstLine]?.text || `Section ${i + 1}`,
      start, end,
      scene: project.story?.scenes[id] ?? sceneOptions[i % sceneOptions.length].id
    };
  });
}

// Only known scene IDs and moods can reach the renderer. Older projects remain cinematic.
export function normalizeStory(value: unknown): StorySettings {
  const input = (value && typeof value === 'object' ? value : {}) as Partial<StorySettings>;
  const scenes: Record<string, SceneId> = {};
  if (input.scenes && typeof input.scenes === 'object') {
    for (const [key, scene] of Object.entries(input.scenes).slice(0, 1000)) {
      if (/^\d{1,5}$/.test(key) && sceneOptions.some(option => option.id === scene)) {
        scenes[key] = scene;
      }
    }
  }
  return {
    mode: input.mode === 'directed' ? 'directed' : input.mode === 'illustrated' ? 'illustrated' : 'cinematic',
    mood: storyMoods.some(mood => mood.id === input.mood) ? input.mood! : 'midnight',
    scenes
  };
}
