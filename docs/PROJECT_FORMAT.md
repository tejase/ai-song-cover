# Project Files (Version 1)

A `.coverreel.json` document is `{ "version": 1, "project": SongProject }`.
Run `npm run sample` for a complete example, or save a project in the app.
Types: `src/types.ts`. Parser/serializer: `src/lib/projectFile.ts`.

- `title`, `rawLyrics`: plain text; blank lines divide illustrated story sections.
- `lines`: ordered `index`, `text`, `tokens`, `startTime`, `endTime` entries.
- Times are seconds from recording start. Untapped times are `null`. Starts must
  be ordered and inside the recording; ends must follow starts and not exceed
  duration. All starts are required for rendering. Do not include empty lines.
- `tokens`: word `index`, `text`, `emphasis`; optional absolute `startTime`/`endTime`
  inside the line. Rock Stage uses word starts; other styles estimate progression.
  Update word timings after retiming a line.
- `audio`: metadata (`name`, `type`, `size` in bytes, `duration`) or `null`. No paths,
  URLs, or audio bytes. Reopening requires the matching recording.
- `stylePreset`: typography, six-digit hex colors, motion 0..2, grain 0..1.
- `story.mode`: `cinematic`, `illustrated`, or `directed` (Rock Stage).
- `story.mood`: `midnight`, `rose`, `daybreak`. `story.scenes` maps first-line indices
  to `rain`, `hills`, `ocean`, `stage` for Illustrated Story.
- `renderSettings`: duration, outputName, width, height, fps. Export normalizes to
  1080x1920/30fps; names are sanitized and timestamped by the server.

Limits: 1 MB JSON, 500 lines, 500 characters/line, 1..600 seconds, 100 MB audio.
Import rebuilds tokens from text, drops unknown fields, and regenerates IDs/dates.
Selecting a different recording does not automatically align or scale timings.
