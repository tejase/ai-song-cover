import type {StylePreset} from '../types';

export const cinematicGlowPreset: StylePreset = {
  id: 'cinematic-glow',
  name: 'Cinematic Glow',
  mood: 'warm-night',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  textColor: '#fff7ed',
  glowColor: '#f97316',
  accentColor: '#2dd4bf',
  secondaryColor: '#facc15',
  backgroundA: '#111827',
  backgroundB: '#2f1f46',
  backgroundC: '#073b3a',
  motionIntensity: 0.72,
  grainOpacity: 0.15
};

export const duskBloomPreset: StylePreset = {
  id: 'dusk-bloom',
  name: 'Dusk Bloom',
  mood: 'violet-dawn',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  textColor: '#fdf2f8',
  glowColor: '#ec4899',
  accentColor: '#38bdf8',
  secondaryColor: '#a7f3d0',
  backgroundA: '#15151f',
  backgroundB: '#4a1d4d',
  backgroundC: '#0e3a4f',
  motionIntensity: 0.62,
  grainOpacity: 0.13
};

export const softSpotlightPreset: StylePreset = {
  id: 'soft-spotlight',
  name: 'Soft Spotlight',
  mood: 'stage-room',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  textColor: '#f8fafc',
  glowColor: '#22c55e',
  accentColor: '#fb7185',
  secondaryColor: '#fde68a',
  backgroundA: '#171717',
  backgroundB: '#2e2b20',
  backgroundC: '#163135',
  motionIntensity: 0.5,
  grainOpacity: 0.16
};

export const stylePresets = [
  cinematicGlowPreset,
  duskBloomPreset,
  softSpotlightPreset
];

export const findStylePreset = (id: string): StylePreset =>
  stylePresets.find((preset) => preset.id === id) ?? cinematicGlowPreset;
