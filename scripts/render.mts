import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {parseProjectFile, validateProject} from '../src/lib/projectFile';

const [projectPath, audioPath] = process.argv.slice(2);
if (!projectPath || !audioPath) {
  console.error('Usage: npm run render -- <project.coverreel.json> <audio-file>\nStart npm run dev or npm run serve first.');
  process.exit(1);
}
try {
  const project = validateProject(parseProjectFile(await readFile(projectPath, 'utf8')), true);
  const audio = await readFile(audioPath);
  if (audio.length > 100 * 1024 * 1024) throw new Error('Audio exceeds 100 MB.');
  const port = Number(process.env.PORT ?? 3333);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  const body = new FormData();
  body.append('project', JSON.stringify(project));
  body.append('audio', new Blob([audio]), path.basename(audioPath));
  console.log('Rendering locally. Keep the render server running...');
  const response = await fetch(`http://127.0.0.1:${port}/api/render`, {method: 'POST', body});
  const result = await response.json() as {ok: boolean; outputPath?: string; error?: string};
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Render failed.');
  console.log(result.outputPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Render failed.');
  process.exitCode = 1;
}
