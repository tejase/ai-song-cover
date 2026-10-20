# CoverReel Studio

**An agent-first workspace for turning your vocal covers into bespoke music videos.**

Bring your recording, lyrics, and a creative direction. Open this repo with
**Codex, Cursor, Claude Code, or another coding agent**, and collaborate on a video
made for your arrangement: original scenes, animated characters, kinetic lyrics,
transitions, and visual moments that follow the song.

**The agent-led workflow is the point.** This is not just a subtitle editor or a
collection of fixed templates. Your agent writes and revises the actual video code;
the included editor, timing tools, and renderer support that creative process.

React + TypeScript + Remotion. No OpenAI API key or paid media-generation API is
required by the app. Your coding assistant may have its own account requirements.
It works with **your existing vocal recording**; it does not generate a singing
voice, backing track, or automatic vocal alignment.

## Start With Your Agent

### 1. Clone and Open the Workspace

Clone the repo and open the folder in your coding assistant:

```sh
git clone https://github.com/tejase/ai-song-cover.git
cd ai-song-cover
```

Put your recording and lyrics in the Git-ignored `projects/` directory, for example
`projects/my-cover/audio.mp3` and `projects/my-cover/lyrics.txt`. Do not commit them.

### 2. Give the Agent a Brief

Start with this prompt, replacing the genre and direction with your own:

```text
Read AGENTS.md and docs/AGENT_WORKFLOW.md.

My vocal recording: projects/my-cover/audio.mp3
My lyrics: projects/my-cover/lyrics.txt
Arrangement: a rock cover, not the original pop version.
Direction: a gritty illustrated performance with guitar/drums, bold animated
lyrics, and distinct scenes that build toward the chorus.

Set up the app and help me establish lyric timings. Propose a song-specific
storyboard, then implement it in Remotion. Vary the framing, animation, and lyric
treatment instead of repeating one background. Render a short proof for review,
iterate with my feedback, and export the full vertical MP4 when ready.

Keep my recording unchanged. Do not upload it or commit private files.
Ask me about anything unclear in the creative direction. Do not claim guessed
word timings are exact.
```

Already have a timed `.coverreel.json` project? Give the agent that path too.
The agent reads local project instructions and edits the code in your clone;
there is no built-in chat agent or one-click AI generation service on the website.

### 3. Direct, Review, and Refine

1. **Brief:** give the agent your arrangement, mood, references, and visual ideas.
2. **Timing:** tap lyric entrances in the editor and correct them while listening.
3. **Storyboard:** review the agent's proposed scenes before it builds the custom cut.
4. **Implement:** the agent codes the visuals and lyric animation in Remotion.
5. **Iterate:** review a short render and give concrete feedback on motion and timing.
6. **Export:** render the full 1080x1920, 30 fps H.264/AAC MP4 locally.

The supplied Cinematic, Illustrated Story, and Rock Stage styles are examples and
starting points, not the limit of what a cover can look like. A custom cut can have
its own visual world rather than reusing the same template for every song.

See [the detailed agent workflow](docs/AGENT_WORKFLOW.md) and
[project format](docs/PROJECT_FORMAT.md). [AGENTS.md](AGENTS.md) is the shared
instruction source; `CLAUDE.md` and a Cursor rule point to it.

## Quick Start

To run the supporting editor yourself, use Node.js 22.12+ and npm:

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. The local render server runs on port 3333.
For a single server, run `npm run serve` and open <http://127.0.0.1:3333>.

Upload audio (up to 100 MB / 10 minutes), paste lyrics, and use Tap Sync to mark
line entrances. Preview the composition and export to `outputs/reels/`.
The folder/save icons open/save `.coverreel.json` files. Audio is not embedded:
reselect the matching recording after reopening. Save before closing or reloading;
there is no automatic project saving. Word sweeps without supplied word timings
are expressive estimates, not verified vocal alignment.

## Free Browser Edition

[Try the supporting editor](https://tejase.github.io/ai-song-cover/) without installing
anything: upload audio, edit lyrics, tap sync, preview the built-in styles, and save
project JSON. Your selected audio stays in your browser. Bring the saved project and
recording into your local clone for agent-created visuals and MP4 export.

**The website is the editor, not the coding-agent workspace or an online renderer.**
It has no hosted audio upload/render backend and does not post to Instagram.

GitHub Pages serves only the frontend. `npm run build:pages` builds `dist-pages/`
with the repository base path and an allowlisted original sample; it does not copy
the whole local `public/` folder. To test it, run `npm run preview:pages` and open
the `/ai-song-cover/` path on the displayed local URL. The Pages workflow deploys
on pushes to `main` once Settings > Pages > Source is set to GitHub Actions.

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
