import crypto from 'node:crypto';
import {existsSync} from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import multer from 'multer';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {getSafeOutputName, prepareProjectForRender} from '../lib/renderProject';
import type {CoverVideoProps, SongProject} from '../types';
import {validateProject} from '../lib/projectFile';
import {browserOptions} from './browser';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../..');
const uploadDir = path.join(projectRoot, 'work', 'uploads');
const outputDir = path.join(projectRoot, 'outputs', 'reels');
const distDir = path.join(projectRoot, 'dist');
const distIndex = path.join(distDir, 'index.html');
const remotionEntry = path.join(projectRoot, 'src', 'remotion', 'index.tsx');
const allowedExtensions = new Set([
  '.mp3',
  '.m4a',
  '.mp4',
  '.wav',
  '.aac',
  '.flac',
  '.ogg',
  '.webm'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1,
    fields: 1
  }
});

const app = express();
const port = Number(process.env.PORT ?? 3333);

app.use(
  '/outputs',
  express.static(path.join(projectRoot, 'outputs'), {
    fallthrough: false,
    immutable: false
  })
);

app.use(
  '/__uploads',
  express.static(uploadDir, {
    fallthrough: false,
    immutable: false,
    index: false
  })
);

const assertProject = (value: unknown): SongProject =>
  prepareProjectForRender(validateProject(value, true));

const getSafeUploadedAudioPath = (originalName: string): string => {
  const extension = path.extname(originalName).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    throw new Error('Unsupported audio file extension.');
  }

  return path.join(uploadDir, `${crypto.randomUUID()}${extension}`);
};

// Local-only tool, not a public render service. Reject cross-origin browser submissions.
app.use('/api', (request, response, next) => {
  const origin = request.get('origin');
  if (origin) {
    try {
      const url = new URL(origin);
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error();
    } catch { response.status(403).json({ok: false, error: 'Local requests only.'}); return; }
  }
  next();
});

let rendering = false;

app.post('/api/render', upload.single('audio'), async (request, response) => {
  if (rendering) { response.status(409).json({ok: false, error: 'A render is already running.'}); return; }
  rendering = true;
  let audioPath = '';
  const browserLogs: string[] = [];
  const onBrowserLog = (log: {type: string; text: string}) => {
    browserLogs.push(`[${log.type}] ${log.text}`);
  };

  try {
    await fs.mkdir(uploadDir, {recursive: true});
    await fs.mkdir(outputDir, {recursive: true});

    if (!request.file) {
      throw new Error('Audio file is required.');
    }

    const projectPayload = request.body.project;
    if (typeof projectPayload !== 'string' || projectPayload.length > 1_000_000) {
      throw new Error('Project payload is missing or too large.');
    }

    const project = assertProject(JSON.parse(projectPayload));
    audioPath = getSafeUploadedAudioPath(request.file.originalname);
    await fs.writeFile(audioPath, request.file.buffer, {flag: 'wx'});

    const outputBase = getSafeOutputName(project.renderSettings.outputName || project.title);
    const outputFile = `${outputBase}-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFile);
    const uploadUrl = `http://127.0.0.1:${port}/__uploads/${path.basename(audioPath)}`;
    const inputProps: CoverVideoProps = {
      project,
      audioSrc: uploadUrl
    };
    const serveUrl = await bundle({
      entryPoint: remotionEntry
    });
    const browser = browserOptions();
    const composition = await selectComposition({
      serveUrl,
      id: 'CoverReel',
      inputProps,
      timeoutInMilliseconds: 120_000,
      onBrowserLog,
      ...browser
    });

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      audioCodec: 'aac',
      pixelFormat: 'yuv420p',
      concurrency: 2,
      outputLocation: outputPath,
      inputProps,
      overwrite: true,
      timeoutInMilliseconds: 120_000,
      onBrowserLog,
      ...browser
    });

    response.json({
      ok: true,
      outputPath,
      outputUrl: `/outputs/reels/${outputFile}`
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown render error.';
    const hint = /ffmpeg|ffprobe/i.test(errorMessage)
      ? ' Install ffmpeg with `brew install ffmpeg`, then try again.'
      : '';

    response.status(500).json({
      ok: false,
      error: `${errorMessage}${hint}`,
      browserLogs: browserLogs.slice(-20)
    });
  } finally {
    rendering = false;
    if (audioPath) {
      await fs.rm(audioPath, {force: true});
    }
  }
});

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  response.status(400).json({ok: false, error: error instanceof multer.MulterError ? error.message : 'Invalid request.'});
});

if (existsSync(distIndex)) {
  app.use(
    express.static(distDir, {
      fallthrough: true,
      immutable: false,
      index: false
    })
  );

  app.get(/.*/, (_request, response) => {
    response.sendFile(distIndex);
  });
}

app.listen(port, '127.0.0.1', () => {
  console.log(`CoverReel render server listening on http://127.0.0.1:${port}`);
});
