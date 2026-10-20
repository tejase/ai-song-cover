# Recording to Bespoke Reel

## Brief and Timing

Collect a local recording, lyrics, arrangement/genre, mood, and references. Put
private inputs in `projects/<name>/`. Do not infer genre from the song title.
Upload audio in the app, paste lyrics, tap line entrances, correct timings, and
save JSON. Agents can edit the JSON; reopen it and reselect the same recording.
See PROJECT_FORMAT.md. No cloud audio analysis is needed. Auto-alignment is not
part of V1; do not present guesses as verified singing synchronization.

## Storyboard and Implement

Map lyrics/instrumental changes to distinct shots. Vary scene, framing, motion,
and typography. Plan an entrance, reveal, contrast, peak, and closing image.
Confirm a substantial bespoke direction before an expensive render. Avoid strobe.

Built-ins are `CoverVideo.tsx` (cinematic), `IllustratedVideo.tsx` + `paintScene.ts`
(scene-based), and `RockVideo.tsx` (band). Rock Stage cycles six scenes across any
number of lines; its performance rhythm is illustrative, not audio analysis.

For a unique cut, add `src/remotion/CustomVideo.tsx`, a React component accepting
`CoverVideoProps`, and route the chosen mode to it in `CoverVideo.tsx`. Include
`<Audio src={audioSrc} />` exactly once. Use project title, lines, times, duration,
and fps, not a fixed song, line count, private waveform, or machine path.
Preserve reusable built-ins when contributing a custom renderer upstream.

Use `useCurrentFrame`, `useVideoConfig`, and deterministic animation helpers.
Canvas can draw original characters/props/scenes without paid image APIs.
Only add appropriately licensed assets/fonts; record provenance and license.
Never commit private song data just to make a custom cut run.

## Verify and Export

Run tests/build. Keep the local server running and use:

```sh
npm run render -- projects/my-cover.coverreel.json projects/my-cover.mp3
```

For a short proof, copy JSON under `work/`, set both `audio.duration` and
`renderSettings.duration` to the proof duration, remove lines outside it, and clamp
line/word ends. This does not modify the recording itself.

Inspect transitions, the longest lyric, instrumental passages, and the ending.
Listen for timing. Verify nonblank moving frames, audio, 1080x1920 at 30fps,
H.264/AAC, and duration within one frame of the intended duration. Then render
the full cut. Run `npm run check:public` before any contribution/publication.
