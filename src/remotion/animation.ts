// Adapted from John Heibel's ClaudeAnimationBase/src/core.js (MIT).
// Copyright (c) 2026 John Heibel. See THIRD_PARTY_NOTICES.md.
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
export const ease = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const backOut = (x: number) => {
  x = clamp(x); const s = 1.9;
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const onTwos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
