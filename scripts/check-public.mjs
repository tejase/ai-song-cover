import {execFileSync} from 'node:child_process';
import {readFileSync, statSync} from 'node:fs';

const paths = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {encoding: 'utf8'}).split('\0').filter(Boolean))];
const problems = [];
for (const file of paths) {
  if (/^(work|outputs|projects|private|public\/covers)\//.test(file) || /(^|\/)\.env(?:\.|$)/.test(file) || /\.(pem|key|mp3|m4a|mp4|mov|flac|aac|ogg|webm|wav)$/i.test(file) && file !== 'public/sample.wav') {
    problems.push(`${file}: private path, credential, or non-demo media`);
  }
  if (/beautyBeat|remotion\/beautyBeat/.test(file)) problems.push(`${file}: personal song data`);
  if (statSync(file).size > 2_000_000) problems.push(`${file}: unexpectedly large public file`);
  if (!/\.(ts|tsx|mts|mjs|json|md|mdc|ya?ml|html|css)$/.test(file)) continue;
  const content = readFileSync(file, 'utf8');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bsk-[A-Za-z0-9]{40,}/.test(content)) problems.push(`${file}: potential secret`);
  if (/\/(?:Users|home)\/[A-Za-z0-9._-]+\//.test(content)) problems.push(`${file}: personal absolute path`);
}
if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
else console.log(`Checked ${paths.length} public files; private paths/media and obvious secrets excluded. Review staged content and history separately.`);
