import type {SceneId, StoryMood} from '../types';
import {clamp, hash, onTwos} from './animation';

export const storyPalette = {
  midnight: {sky: '#101f30', light: '#e7dfb4', far: '#395b70', mid: '#397f81', front: '#143c47', accent: '#c8b8d7'},
  rose: {sky: '#382836', light: '#ffe1c2', far: '#845c7b', mid: '#ba7d8d', front: '#4d485f', accent: '#e0ad91'},
  daybreak: {sky: '#466b76', light: '#ffe7a0', far: '#90a69b', mid: '#b8ba85', front: '#355d60', accent: '#e3b878'}
};

type Point = [number, number];
function polygon(c: CanvasRenderingContext2D, points: Point[], fill: string) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.closePath(); c.fillStyle = fill; c.fill();
}
function ellipse(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill();
}
function stroke(c: CanvasRenderingContext2D, points: Point[], color: string, width: number) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
}

export function paintScene(c: CanvasRenderingContext2D, scene: SceneId, mood: StoryMood, time: number, motion: number, grain: number) {
  const p = storyPalette[mood];
  const t = time * motion;
  c.save();
  c.fillStyle = p.sky; c.fillRect(0, 0, 1080, 1920);
  // Gentle camera drift, with overscan so the canvas never reveals an edge.
  c.translate(540 + Math.sin(t * .12) * 12, 960 + Math.cos(t * .15) * 8);
  c.scale(1.05 + .012 * Math.sin(t * .21), 1.05 + .012 * Math.sin(t * .21)); c.translate(-540, -960);

  if (scene === 'hills' || scene === 'ocean') {
    for (let i = 0; i < 45; i++) {
      c.globalAlpha = .25 + .5 * hash(i + 10);
      ellipse(c, hash(i + 3) * 1080, hash(i + 7) * 790, 1 + hash(i) * 2, 1 + hash(i) * 2, p.light);
    }
    c.globalAlpha = 1;
    ellipse(c, 760, 380, 104, 104, p.light);
    ellipse(c, 793, 353, 92, 92, p.sky);
    // Long, brushed cloud shapes rather than floating decorative blobs.
    for (let i = 0; i < 5; i++) {
      const x = ((i * 293 + t * 6) % 1600) - 260;
      c.globalAlpha = .14;
      stroke(c, [[x, 510 + i * 80], [x + 100, 497 + i * 80], [x + 230, 510 + i * 80]], p.light, 16 + i * 5);
    }
    c.globalAlpha = 1;
  }

  if (scene === 'hills') {
    for (let layer = 0; layer < 4; layer++) {
      const points: Point[] = [[-100, 2020]];
      for (let x = -100; x <= 1180; x += 25) {
        points.push([x, 790 + layer * 200 + Math.sin(x * .004 + layer * 2 + t * .025) * (135 - layer * 17) + Math.sin(x * .011 + layer) * 23]);
      }
      points.push([1180, 2020]);
      polygon(c, points, [p.far, p.mid, p.front, '#132b32'][layer]);
    }
    // A winding path leads through the foreground toward the horizon.
    c.beginPath(); c.moveTo(640, 1920); c.bezierCurveTo(470, 1630, 810, 1600, 640, 1405);
    c.bezierCurveTo(570, 1300, 620, 1220, 648, 1200);
    c.strokeStyle = p.light; c.globalAlpha = .25; c.lineWidth = 28; c.stroke(); c.globalAlpha = 1;
    for (let i = 0; i < 13; i++) {
      const x = hash(i + 90) * 1080, y = 1570 + hash(i + 40) * 400;
      const sway = Math.sin(t * .7 + i) * 9;
      stroke(c, [[x, y], [x + sway, y - 72]], p.mid, 3);
      ellipse(c, x + sway, y - 72, 5, 10, p.accent);
    }
  }

  if (scene === 'ocean') {
    c.fillStyle = p.far; c.fillRect(0, 800, 1080, 1120);
    for (let layer = 0; layer < 12; layer++) {
      const points: Point[] = [[-100, 2020]];
      for (let x = -100; x <= 1200; x += 20) {
        points.push([x, 820 + layer * 100 + Math.sin(x * .007 + t * (.3 + layer * .02) + layer) * (10 + layer * 2)]);
      }
      points.push([1200, 2020]);
      polygon(c, points, layer % 2 ? p.front : p.mid);
      c.globalAlpha = .14;
      stroke(c, points.slice(1, -1), p.light, 4); c.globalAlpha = 1;
    }
    for (let i = 0; i < 20; i++) {
      const y = 850 + i * 25, width = 15 + i * 4;
      const x = 760 + Math.sin(i * 2.1 + t) * width;
      c.globalAlpha = .18;
      stroke(c, [[x - width, y], [x + width, y + Math.sin(t + i) * 4]], p.light, 3);
    }
    c.globalAlpha = 1;
    // Small sailboat, animated around its own anchor.
    c.save(); c.translate(320 + Math.sin(t * .18) * 34, 1140 + Math.sin(t * .9) * 12); c.rotate(Math.sin(t * .65) * .035);
    polygon(c, [[-100, 0], [100, 0], [66, 40], [-65, 40]], '#19272c');
    stroke(c, [[0, 0], [0, -210]], p.light, 5);
    polygon(c, [[-8, -200], [-8, -20], [-100, -20]], p.light);
    polygon(c, [[10, -180], [10, -20], [85, -20]], p.accent); c.restore();
  }

  if (scene === 'rain') {
    c.fillStyle = '#1c2831'; c.fillRect(0, 0, 1080, 1920);
    c.fillStyle = p.far; c.fillRect(95, 130, 890, 1430);
    ellipse(c, 760, 410, 76, 76, p.light);
    for (let i = 0; i < 13; i++) {
      const x = i * 92 - 25, height = 100 + hash(i + 9) * 360;
      c.fillStyle = p.front; c.fillRect(x, 1500 - height, 80, height);
      for (let j = 0; j < 4; j++) {
        if (hash(i * 11 + j) > .4) {
          c.fillStyle = p.light; c.globalAlpha = .38;
          c.fillRect(x + 18, 1515 - height + j * 44, 12, 20); c.globalAlpha = 1;
        }
      }
    }
    c.save(); c.beginPath(); c.rect(95, 130, 890, 1430); c.clip();
    for (let i = 0; i < 100; i++) {
      const x = 95 + hash(i * 7) * 890, y = 100 + ((hash(i + 57) * 1600 + t * (90 + hash(i) * 100)) % 1500);
      c.globalAlpha = .15 + hash(i + 22) * .3;
      stroke(c, [[x, y], [x - 9, y + 30 + hash(i + 5) * 90]], '#d1e3df', 1.5 + hash(i) * 2);
    }
    c.globalAlpha = 1; c.restore();
    c.fillStyle = '#15242c';
    c.fillRect(65, 110, 950, 28); c.fillRect(65, 1550, 950, 36);
    c.fillRect(65, 110, 30, 1476); c.fillRect(985, 110, 30, 1476);
    c.fillRect(525, 110, 30, 1476); c.fillRect(65, 770, 950, 24);
    c.fillStyle = '#334c52'; c.fillRect(20, 1586, 1040, 35);
    // A cup on the sill, with line-drawn steam.
    c.fillStyle = p.accent; c.fillRect(160, 1480, 105, 105);
    c.beginPath(); c.arc(270, 1521, 33, -Math.PI / 2, Math.PI / 2); c.strokeStyle = p.accent; c.lineWidth = 12; c.stroke();
    for (let i = 0; i < 3; i++) {
      const points: Point[] = [];
      for (let y = 0; y <= 120; y += 10) points.push([180 + i * 28 + Math.sin(y * .04 - t + i) * 10, 1470 - y]);
      c.globalAlpha = .3; stroke(c, points, p.light, 2);
    }
    c.globalAlpha = 1;
  }

  if (scene === 'stage') {
    c.fillStyle = '#17252a'; c.fillRect(0, 0, 1080, 1920);
    for (let i = 0; i < 2; i++) {
      c.globalAlpha = .17;
      const x = i ? 980 : 100, target = 540 + Math.sin(t * .28 + i) * 180;
      polygon(c, [[x - 35, 0], [x + 35, 0], [target + 330, 1700], [target - 330, 1700]], i ? p.accent : p.light);
    }
    c.globalAlpha = 1;
    for (const side of [-1, 1]) {
      c.save(); c.translate(side === -1 ? 0 : 1080, 0); c.scale(side === -1 ? 1 : -1, 1);
      polygon(c, [[0, 0], [230, 0], [180 + Math.sin(t * .3) * 12, 450], [115, 1200], [145, 1920], [0, 1920]], p.front);
      for (let i = 0; i < 4; i++) stroke(c, [[30 + i * 42, 0], [50 + i * 22, 600], [25 + i * 23, 1920]], p.mid, 3);
      c.restore();
    }
    c.fillStyle = '#23373b'; c.fillRect(0, 1640, 1080, 280);
    for (let i = 0; i < 9; i++) stroke(c, [[540, 1640], [i * 180 - 180, 1920]], '#3b5053', 2);
    // Vintage microphone and stand, leaving the upper centre open for lyrics.
    c.save(); c.translate(540, 1370); c.rotate(Math.sin(t * .45) * .01);
    stroke(c, [[0, 0], [0, 360]], p.light, 9);
    ellipse(c, 0, 360, 90, 14, '#0e2025');
    c.fillStyle = p.accent; c.beginPath(); c.roundRect(-43, -160, 86, 146, 40); c.fill();
    for (let i = 0; i < 6; i++) stroke(c, [[-29, -130 + i * 17], [29, -130 + i * 17]], '#324b51', 4);
    stroke(c, [[-60, -75], [-60, 0], [60, 0], [60, -75]], p.light, 7); c.restore();
  }
  c.restore();
  // Deterministic dry-brush flecks. Nothing depends on render order or wall clock.
  c.save(); c.globalAlpha = clamp(grain, 0, .28) * .48;
  for (let i = 0; i < 1600; i++) {
    const x = hash(i * 3) * 1080, y = hash(i * 3 + 1) * 1920;
    c.fillStyle = i % 2 ? '#f1e8d3' : '#0d222b';
    c.fillRect(x, y, 1 + hash(i + 90) * 3, 2 + hash(i + 91) * 9);
  }
  // Pencil hatching holds for two frames, inspired by the starter's boiling linework.
  c.globalAlpha = .025;
  for (let i = 0; i < 55; i++) {
    const x = hash(i + 200) * 1080, y = hash(i + 300) * 1920;
    stroke(c, [[x, y], [x + 25 + hash(i + onTwos(time)) * 6, y - 8]], '#f1e8d3', 1);
  }
  c.restore();
}
