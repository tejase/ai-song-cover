# CoverReel Studio

Turn your vocal recording into a vertical lyric video. Run locally, tap lyrics in
time with your voice, then use your coding agent to make the visuals your own.

React + TypeScript + Remotion. No OpenAI API key or cloud audio upload required.
Your coding assistant may have its own account requirements. This makes videos for
**existing recordings**; it does not synthesize voices, generate backing tracks,
auto-align singing, or post to Instagram.

## Quick Start

Clone this repository, open its folder, and run with Node.js 22.12+ and npm:

```sh
git clone https://github.com/tejase/ai-song-cover.git
cd ai-song-cover
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. The local render server runs on port 3333.
For a single server, run `npm run serve` and open <http://127.0.0.1:3333>.

1. Upload your recording (up to 100 MB / 10 minutes) and paste lyrics, one line per shot.
2. Play audio in Tap Sync and tap each line at its vocal entrance. Undo or edit times.
3. Preview Cinematic, Illustrated Story, or Rock Stage. Blank lines define story sections.
4. Export a 1080x1920, 30 fps H.264/AAC MP4 to `outputs/reels/`.

Use the folder/save icons to open/save `.coverreel.json` files. Audio is not embedded:
select the matching recording after reopening. Work is not automatically saved;
save a project before reloading or closing the tab.

## Make It Yours With an Agent

Open the clone in Codex, Cursor, Claude Code, or another coding assistant. Start with:

> Read AGENTS.md and docs/AGENT_WORKFLOW.md. My recording is in projects/my-cover.mp3.
> My lyrics and timed project are in projects/my-cover.coverreel.json. This is a rock
> cover, not the original pop arrangement. Create a song-specific visual storyboard
> and implement it. Keep my recording unchanged, use my tap timings, vary scenes and
> lyric treatments, and render a short proof before the full Reel. Do not upload my
> audio or commit private files. Ask me about the mood if it isn't clear.

The built-in styles are starting points, not an automatic AI video generator.
Agents can implement original characters, scenes, transitions, and lyric treatments
in the composition. See [the workflow](docs/AGENT_WORKFLOW.md) and
[project format](docs/PROJECT_FORMAT.md). `AGENTS.md` is the shared instruction source;
`CLAUDE.md` and a Cursor rule point to it.

## Command-Line Render

The sample is an original synthesized instrumental, not a commercial recording:

```sh
npm run sample
# Keep npm run dev or npm run serve running in another terminal.
npm run render -- examples/moonlight.coverreel.json public/sample.wav
```

Use the same command with your saved project and recording paths. It submits only
to your local server. Rock Stage supports optional per-word times; without them,
word progression is estimated. Its built-in rhythm is illustrative, not beat detection.

## Rendering Setup

The server looks for installed Chrome/Chromium on macOS, Linux, and Windows. Override:

```sh
CHROME_EXECUTABLE="/path/to/chrome" npm run serve
```

In PowerShell, set `$env:CHROME_EXECUTABLE` first. Without an installed browser,
Remotion may download a headless browser at first export. Installation/downloads need
internet. Linux may need Chromium system dependencies. Remotion normally supplies
its encoder; install ffmpeg only if an error calls for it. Fonts vary by platform;
bundle licensed fonts for consistent custom typography. `PORT` changes the server
port; also update `vite.config.ts`'s proxy when using development mode.

Render speed depends on duration, machine, and complexity. A 39-second 1080p rock cut
took about 100 seconds locally; this is an example, not a guarantee.

## Development

```sh
npm test
npm run build
npm run check:public
```

Read [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the
[release checklist](docs/RELEASING.md). The server is loopback-only, not a public
service. Temporary render uploads are removed; exports remain until you delete them.

## License and Credits

Original CoverReel code, example lyrics, and synthesized sample are MIT licensed.
Dependencies have separate licenses: **Remotion has its own license and eligibility
requirements**. Review [its current terms](https://www.remotion.dev/docs/license)
before commercial/organizational use. MIT does not relicense dependencies or grant
rights to music, lyrics, fonts, or media you import.

Inspired by John Heibel's PDoomVideo. Small animation helpers are adapted from the
MIT-licensed ClaudeAnimationBase; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
No source song recording, song-specific lyrics/timing data, or third-party character
artwork is included in the public file set. Personal work/exports are ignored by Git.
