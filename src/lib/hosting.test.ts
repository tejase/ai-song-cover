import {expect, it} from 'vitest';
import {isStaticHosting, sampleAudioUrl} from './hosting';

it('keeps normal local mode and resolves the sample relative to the Vite base', () => {
  expect(isStaticHosting).toBe(false);
  expect(sampleAudioUrl).toBe(`${import.meta.env.BASE_URL}sample.wav`);
});
