import {build} from 'vite';
import {copyFile, lstat, readdir} from 'node:fs/promises';
import path from 'node:path';

await build({mode: 'pages'});
// Never copy public/ wholesale: local recordings can exist in its ignored subfolders.
await copyFile('public/sample.wav', 'dist-pages/sample.wav');
async function audit(directory, prefix = '') {
  for (const name of await readdir(directory)) {
    const relative = `${prefix}${name}`, absolute = path.join(directory, name);
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Symlink in Pages artifact: ${relative}`);
    if (stat.isDirectory() && relative === 'assets') await audit(absolute, 'assets/');
    else if (!stat.isFile() || !/^(index\.html|sample\.wav|assets\/[a-zA-Z0-9_-]+\.(js|css))$/.test(relative)) {
      throw new Error(`Unexpected file in Pages artifact: ${relative}`);
    }
  }
}
await audit('dist-pages');
console.log('Pages artifact verified: app bundle and original sample only.');
