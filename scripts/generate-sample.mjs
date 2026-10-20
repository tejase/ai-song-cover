import {mkdirSync, writeFileSync} from 'node:fs';
// Original instrumental sample: a quiet four-chord arpeggio, no third-party recording.
const rate = 22050, duration = 12, count = rate * duration;
const buffer = Buffer.alloc(44 + count * 2);
buffer.write('RIFF'); buffer.writeUInt32LE(36 + count * 2, 4); buffer.write('WAVEfmt ', 8);
buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28);
buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
buffer.write('data', 36); buffer.writeUInt32LE(count * 2, 40);
const chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
for (let i = 0; i < count; i++) {
  const t = i / rate, chord = chords[Math.min(3, Math.floor(t / 3))];
  const age = t % .5, note = chord[Math.floor(t / .5) % 3] * 2;
  const envelope = Math.min(1, t / .1, (duration - t) / .3);
  const pad = chord.reduce((sum, hz) => sum + Math.sin(t * Math.PI * 2 * hz), 0) / 3;
  const arp = Math.sin(age * Math.PI * 2 * note) * Math.exp(-age * 7) * Math.min(1, age * 150);
  buffer.writeInt16LE(Math.round((pad * .1 + arp * .15) * envelope * 32767), 44 + i * 2);
}
mkdirSync('public', {recursive: true}); writeFileSync('public/sample.wav', buffer);
