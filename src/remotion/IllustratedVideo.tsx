import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Audio, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CoverVideoProps, SceneId, StoryMood} from '../types';
import {getStorySections} from '../lib/story';
import {getLineEndTime} from '../lib/sync';
import {backOut, clamp, ease, easeOut} from './animation';
import {paintScene, storyPalette} from './paintScene';

export const SceneThumbnail: React.FC<{scene: SceneId; mood: StoryMood}> = ({scene, mood}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    c.save(); c.scale(180 / 1080, 320 / 1920);
    paintScene(c, scene, mood, 3, .7, .15); c.restore();
  }, [scene, mood]);
  return <canvas ref={ref} width={180} height={320} aria-hidden="true" />;
};

function wrapText(c: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const rows: string[] = []; let row = '';
  for (const word of text.split(/\s+/)) {
    if (c.measureText(word).width > maxWidth) {
      if (row) { rows.push(row); row = ''; }
      // Also handles long unbroken words and non-Latin lyrics.
      for (const char of Array.from(word)) {
        if (c.measureText(row + char).width > maxWidth && row) { rows.push(row); row = ''; }
        row += char;
      }
    } else if (row && c.measureText(`${row} ${word}`).width > maxWidth) {
      rows.push(row); row = word;
    } else row = row ? `${row} ${word}` : word;
  }
  if (row) rows.push(row);
  return rows;
}

export const IllustratedVideo: React.FC<CoverVideoProps> = ({project, audioSrc}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  useLayoutEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    const t = frame / fps;
    const sections = getStorySections(project);
    let sectionIndex = 0;
    sections.forEach((section, index) => { if (t >= section.start) sectionIndex = index; });
    const section = sections[sectionIndex];
    const mood = project.story?.mood ?? 'midnight';
    const p = storyPalette[mood];
    paintScene(c, section?.scene ?? 'hills', mood, t,
      project.stylePreset.motionIntensity, project.stylePreset.grainOpacity);

    const activeIndex = project.lines.findIndex((line, index) =>
      line.startTime !== null && t >= line.startTime &&
      t < (getLineEndTime(project.lines, index, project.renderSettings.duration) ?? 0));
    const line = project.lines[activeIndex];
    if (line && line.startTime !== null) {
      const age = t - line.startTime;
      const end = getLineEndTime(project.lines, activeIndex, project.renderSettings.duration)!;
      const life = Math.max(.1, end - line.startTime);
      const progress = clamp(age / life);
      const fade = Math.min(easeOut(age / Math.min(.25, life / 3)), clamp((end - t) / Math.min(.16, life / 3)));
      let size = 94, rows: string[] = [];
      do {
        c.font = `italic 600 ${size}px Georgia, serif`;
        rows = wrapText(c, line.text, 840);
        if (rows.length * size * 1.18 <= 510) break;
        size -= 2;
      } while (size > 24);
      const lineHeight = size * 1.18;
      const centreY = section?.scene === 'stage' ? 700 : 930;
      const top = centreY - rows.length * lineHeight / 2;
      c.save();
      // A translucent ink wash protects readability without a subtitle box.
      const wash = c.createLinearGradient(0, top - 140, 0, top + rows.length * lineHeight + 140);
      wash.addColorStop(0, '#0d1e2800'); wash.addColorStop(.3, '#0d1e28a8');
      wash.addColorStop(.7, '#0d1e28a8'); wash.addColorStop(1, '#0d1e2800');
      c.globalAlpha = fade; c.fillStyle = wash;
      c.fillRect(0, top - 140, 1080, rows.length * lineHeight + 280);
      c.translate(540, centreY + (1 - easeOut(age / .45)) * 32);
      const scale = .98 + .02 * backOut(age / .55); c.scale(scale, scale); c.translate(-540, -centreY);
      c.textBaseline = 'top';
      c.shadowColor = '#091924'; c.shadowBlur = 12;
      const totalLength = rows.reduce((sum, row) => sum + row.length, 0);
      let used = 0;
      rows.forEach((row, i) => {
        const width = c.measureText(row).width;
        const x = (1080 - width) / 2, y = top + i * lineHeight;
        c.fillStyle = '#f8eee0'; c.fillText(row, x, y);
        // This sweep is expressive interpolation between tapped LINE timings, not forced word alignment.
        const fraction = clamp((progress * totalLength - used) / Math.max(row.length, 1));
        c.save(); c.beginPath(); c.rect(x - 4, y - 8, (width + 8) * fraction, lineHeight + 16); c.clip();
        c.fillStyle = p.light; c.fillText(row, x, y); c.restore();
        used += row.length;
      });
      const underline = Math.min(180, 180 * easeOut(age / .65));
      c.beginPath(); c.moveTo(540 - underline / 2, top + rows.length * lineHeight + 38);
      c.quadraticCurveTo(540, top + rows.length * lineHeight + 44, 540 + underline / 2, top + rows.length * lineHeight + 35);
      c.lineWidth = 4; c.strokeStyle = p.accent; c.stroke(); c.restore();
    }

    // Deterministic brush reveal at section boundaries; preview and export agree at any frame.
    if (section && sectionIndex > 0 && t - section.start < .55) {
      const reveal = ease((t - section.start) / .55);
      for (let i = 0; i < 10; i++) {
        const x = 1080 * clamp((reveal - i * .012) / .88);
        c.fillStyle = i % 2 ? p.front : p.mid;
        c.fillRect(x, i * 192 - 4, 1084 - x, 202);
      }
    }
    c.save(); c.globalAlpha = .65; c.fillStyle = '#f8eee0';
    c.font = '24px system-ui, sans-serif'; c.textAlign = 'left';
    const title = project.title.length > 50 ? `${project.title.slice(0, 47)}...` : project.title;
    c.fillText(title, 100, 220, 840); c.restore();
  }, [frame, fps, project]);

  return <AbsoluteFill style={{background: '#101f30'}}>
    {audioSrc ? <Audio src={audioSrc} /> : null}
    <canvas ref={ref} width={1080} height={1920} style={{width: '100%', height: '100%'}} />
  </AbsoluteFill>;
};
