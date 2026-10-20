import {createEmptyProject, tokenizeLine} from './lyrics';
import {normalizeStory} from './story';
import type {SongProject, StylePreset} from '../types';

export const MAX_PROJECT_BYTES = 1_000_000;
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Expected a project object.');
  return v as Record<string, unknown>;
};
const text = (v: unknown, max: number): string => {
  if (typeof v !== 'string' || v.length > max) throw new Error('Invalid or oversized project text.');
  return v;
};
const number = (v: unknown, max: number): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > max) throw new Error('Invalid project number.');
  return v;
};
const timing = (v: unknown): number | null => v == null ? null : number(v, 600);

// Rebuild an allowlisted object. Files contain metadata, never audio bytes or remote URLs.
export function validateProject(value: unknown, requireTiming = false): SongProject {
  const input = object(value), base = createEmptyProject();
  const settings = object(input.renderSettings);
  const duration = number(settings.duration, 600);
  if (duration < 1) throw new Error('Duration must be between 1 and 600 seconds.');
  if (!Array.isArray(input.lines) || input.lines.length > 500) throw new Error('Maximum 500 lyric lines.');
  let previous = -1;
  const lines = input.lines.map((value, index) => {
    const line = object(value), lineText = text(line.text, 500);
    const startTime = timing(line.startTime), endTime = timing(line.endTime);
    if (startTime !== null && (startTime < previous || startTime >= duration)) throw new Error('Line starts must be ordered and inside the recording.');
    if (endTime !== null && (endTime > duration || (startTime !== null && endTime <= startTime))) throw new Error('Invalid lyric end time.');
    if (requireTiming && startTime === null) throw new Error('Time every lyric line before rendering.');
    if (startTime !== null) previous = startTime;
    const tokens = tokenizeLine(lineText).map((token, i) => {
      const candidate = Array.isArray(line.tokens) ? line.tokens[i] : undefined;
      if (!candidate || typeof candidate !== 'object') return token;
      const raw = object(candidate), start = timing(raw.startTime), end = timing(raw.endTime);
      if (start !== null && (start < (startTime ?? 0) || start >= (endTime ?? duration))) throw new Error('Word time is outside its lyric line.');
      if (end !== null && (end > (endTime ?? duration) || (start !== null && end <= start))) throw new Error('Invalid word end time.');
      return {...token, emphasis: raw.emphasis === true, ...(start !== null ? {startTime: start} : {}), ...(end !== null ? {endTime: end} : {})};
    });
    return {index, text: lineText, tokens, startTime, endTime};
  });
  if (requireTiming && !lines.length) throw new Error('Add at least one lyric line.');
  const rawStyle = object(input.stylePreset);
  const style = {...base.stylePreset};
  for (const key of ['id', 'name', 'mood', 'fontFamily'] as const) style[key] = text(rawStyle[key], 250);
  for (const key of ['textColor', 'glowColor', 'accentColor', 'secondaryColor', 'backgroundA', 'backgroundB', 'backgroundC'] as const) {
    const color = text(rawStyle[key], 7);
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Colors must be six-digit hex values.');
    style[key] = color;
  }
  style.motionIntensity = number(rawStyle.motionIntensity, 2);
  style.grainOpacity = number(rawStyle.grainOpacity, 1);
  const audio = input.audio == null ? null : object(input.audio);
  return {...base, title: text(input.title, 200), rawLyrics: text(input.rawLyrics, 100_000), lines,
    audio: audio ? {name: text(audio.name, 255), type: text(audio.type, 100), size: number(audio.size, 100 * 1024 * 1024), duration: number(audio.duration, 600)} : null,
    stylePreset: style as StylePreset, story: normalizeStory(input.story),
    renderSettings: {width: 1080, height: 1920, fps: 30, duration, outputName: text(settings.outputName, 200)}};
}

export function parseProjectFile(raw: string): SongProject {
  if (new TextEncoder().encode(raw).length > MAX_PROJECT_BYTES) throw new Error('Project file exceeds 1 MB.');
  const document = object(JSON.parse(raw));
  if (document.version !== 1) throw new Error('Unsupported project file version.');
  return validateProject(document.project);
}

export const serializeProject = (project: SongProject): string =>
  JSON.stringify({version: 1, project: validateProject(project)}, null, 2);
