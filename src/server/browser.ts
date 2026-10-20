import {existsSync} from 'node:fs';

export function browserOptions() {
  const explicit = process.env.CHROME_EXECUTABLE;
  if (explicit && !existsSync(explicit)) throw new Error('CHROME_EXECUTABLE does not exist.');
  const executable = explicit ?? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    `${process.env.PROGRAMFILES}/Google/Chrome/Application/chrome.exe`,
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
  ].find(candidate => existsSync(candidate));
  return executable ? {browserExecutable: executable, chromeMode: 'chrome-for-testing' as const} : {};
}
