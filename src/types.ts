export type ViewName = 'upload' | 'sync' | 'preview' | 'export';

export interface AudioAsset {
  name: string;
  type: string;
  size: number;
  duration: number;
}

export interface LyricToken {
  index: number;
  text: string;
  emphasis: boolean;
  startTime?: number;
  endTime?: number;
}

export interface LyricLine {
  index: number;
  text: string;
  tokens: LyricToken[];
  startTime: number | null;
  endTime: number | null;
}

export interface StylePreset {
  id: string;
  name: string;
  mood: string;
  fontFamily: string;
  textColor: string;
  glowColor: string;
  accentColor: string;
  secondaryColor: string;
  backgroundA: string;
  backgroundB: string;
  backgroundC: string;
  motionIntensity: number;
  grainOpacity: number;
}

export interface RenderSettings {
  width: number;
  height: number;
  fps: number;
  duration: number;
  outputName: string;
}

export type SceneId = 'rain' | 'hills' | 'ocean' | 'stage';
export type StoryMood = 'midnight' | 'rose' | 'daybreak';
export interface StorySettings {
  mode: 'cinematic' | 'illustrated' | 'directed';
  mood: StoryMood;
  scenes: Record<string, SceneId>;
}

export interface SongProject {
  id: string;
  title: string;
  audio: AudioAsset | null;
  rawLyrics: string;
  lines: LyricLine[];
  stylePreset: StylePreset;
  story?: StorySettings;
  authoredCut?: 'beauty-beat';
  renderSettings: RenderSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CoverVideoProps extends Record<string, unknown> {
  project: SongProject;
  audioSrc: string;
}

export interface RenderResponse {
  ok: boolean;
  outputPath?: string;
  outputUrl?: string;
  error?: string;
}
