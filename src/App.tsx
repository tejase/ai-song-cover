import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Player} from '@remotion/player';
import {
  Download,
  FolderOpen,
  Save,
  Film,
  Mic2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  StepForward,
  Undo2,
  Upload,
  WandSparkles
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {CoverVideo} from './remotion/CoverVideo';
import {
  createEmptyProject,
  deriveTitleFromFilename,
  withParsedLyrics
} from './lib/lyrics';
import {prepareProjectForRender, getSafeOutputName} from './lib/renderProject';
import {
  findActiveLineIndex,
  findNextUnsyncedIndex,
  formatTime,
  tapNextLine,
  undoLastTap,
  updateLineTiming
} from './lib/sync';
import {findStylePreset, stylePresets} from './lib/stylePresets';
import {defaultStory, getStorySections, sceneOptions, storyMoods} from './lib/story';
import {SceneThumbnail} from './remotion/IllustratedVideo';
import {parseLyrics} from './lib/lyrics';
import {rockShots} from './lib/rock';
import {MAX_PROJECT_BYTES, parseProjectFile, serializeProject} from './lib/projectFile';
import {isStaticHosting, sampleAudioUrl} from './lib/hosting';
import type {RenderResponse, SongProject, ViewName} from './types';

const MAX_AUDIO_SIZE_MB = 100;
const ACCEPTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/flac',
  'audio/ogg',
  'audio/webm',
  'video/mp4'
];

const viewOrder: Array<{
  id: ViewName;
  label: string;
  icon: LucideIcon;
}> = [
  {id: 'upload', label: 'Upload', icon: Upload},
  {id: 'sync', label: 'Tap Sync', icon: Mic2},
  {id: 'preview', label: 'Preview', icon: Film},
  {id: 'export', label: 'Export', icon: Download}
];

const getAudioDuration = (url: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    audio.onerror = () => reject(new Error('Could not read audio metadata.'));
    audio.src = url;
  });

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName);
};

export const App: React.FC = () => {
  const [project, setProject] = useState<SongProject>(() => createEmptyProject());
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [view, setView] = useState<ViewName>('upload');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [renderStatus, setRenderStatus] = useState('');
  const [renderOutputUrl, setRenderOutputUrl] = useState('');
  const [rendering, setRendering] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const projectInput = useRef<HTMLInputElement | null>(null);

  const preparedProject = useMemo(
    () => prepareProjectForRender(project),
    [project]
  );
  const duration = preparedProject.renderSettings.duration;
  const nextUnsyncedIndex = findNextUnsyncedIndex(project.lines);
  const syncComplete =
    project.lines.length > 0 && nextUnsyncedIndex === -1 && duration > 0;
  const activeLineIndex = findActiveLineIndex(project.lines, currentTime, duration);
  const canWork = Boolean(audioFile && project.lines.length);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (view !== 'sync' || isTypingTarget(event.target)) {
        return;
      }

      if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        handleTapNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const updateProject = (updater: (current: SongProject) => SongProject) => {
    setRenderOutputUrl('');
    setProject((current) => ({
      ...updater(current),
      updatedAt: new Date().toISOString()
    }));
  };

  const loadSample = async () => {
    try {
      const response = await fetch(sampleAudioUrl);
      if (!response.ok) throw new Error('Sample audio is unavailable.');
      const file = new File([await response.blob()], 'Moonlight Study.wav', {type: 'audio/wav'});
      const lyrics = 'Rain writes on the window\nAnd the city falls asleep\n\nOver quiet hills we wander\nWhere the moonlight runs deep\n\nLet the ocean carry echoes\nOf a melody we keep\n\nOne light waits upon the stage\nFor the song we have to sing';
      const lines = parseLyrics(lyrics).map((line, i) => ({...line, startTime: i * 1.5, endTime: (i + 1) * 1.5}));
      setAudioFile(file); setAudioUrl(URL.createObjectURL(file));
      const sample = createEmptyProject();
      setProject({...sample, title: 'Moonlight Study', rawLyrics: lyrics, lines,
        audio: {name: file.name, type: file.type, size: file.size, duration: 12},
        renderSettings: {...sample.renderSettings, duration: 12, outputName: 'moonlight-study'}});
      setView('preview'); setRenderOutputUrl(''); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not open sample.'); }
  };

  const openProject = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > MAX_PROJECT_BYTES) throw new Error('Project file exceeds 1 MB.');
      const imported = parseProjectFile(await file.text());
      audioRef.current?.pause();
      setProject(imported); setAudioFile(null); setAudioUrl(''); setCurrentTime(0); setIsPlaying(false);
      setView('upload'); setRenderOutputUrl('');
      setMessage(`Opened project. Choose the matching audio file${imported.audio ? ` (${imported.audio.name})` : ''}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not open project.'); }
  };

  const saveProject = () => {
    try {
      const url = URL.createObjectURL(new Blob([serializeProject(project)], {type: 'application/json'}));
      const link = document.createElement('a');
      link.href = url; link.download = `${getSafeOutputName(project.title)}.coverreel.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save project.'); }
  };

  const handleAudioFile = async (file: File | null) => {
    setMessage('');
    setRenderOutputUrl('');

    if (!file) {
      return;
    }

    if (
      !ACCEPTED_AUDIO_TYPES.includes(file.type) &&
      !/\.(mp3|m4a|mp4|wav|aac|flac|ogg|webm)$/i.test(file.name)
    ) {
      setMessage('Choose a common audio file such as MP3, M4A, WAV, AAC, FLAC, OGG, or WEBM.');
      return;
    }

    if (file.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
      setMessage(`Keep the audio under ${MAX_AUDIO_SIZE_MB} MB for this local version.`);
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setAudioUrl(objectUrl);
    setAudioFile(file);

    try {
      const audioDuration = await getAudioDuration(objectUrl);
      const title = deriveTitleFromFilename(file.name);
      updateProject((current) => ({
        ...current,
        title: current.lines.length ? current.title : title,
        audio: {
          name: file.name,
          type: file.type || 'audio/*',
          size: file.size,
          duration: audioDuration
        },
        renderSettings: {
          ...current.renderSettings,
          duration: Math.max(audioDuration, 1),
          outputName: current.lines.length ? current.renderSettings.outputName : getSafeOutputName(title)
        }
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read audio metadata.');
    }
  };

  const handleLyricsChange = (rawLyrics: string) => {
    setRenderOutputUrl('');
    updateProject((current) => withParsedLyrics({...current, authoredCut:undefined,
      story:current.story?.mode === 'directed' ? {...defaultStory,scenes:{}} : current.story}, rawLyrics));
  };

  const handleTapNext = () => {
    if (!audioRef.current || !project.lines.length) {
      return;
    }

    const audioTime = audioRef.current.currentTime;
    setProject((current) => ({
      ...current,
      lines: tapNextLine(current.lines, audioTime, duration),
      updatedAt: new Date().toISOString()
    }));
    setRenderOutputUrl('');
  };

  const handleUndo = () => {
    setProject((current) => ({
      ...current,
      lines: undoLastTap(current.lines, duration),
      updatedAt: new Date().toISOString()
    }));
    setRenderOutputUrl('');
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleRestartSection = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const targetLine =
      nextUnsyncedIndex > 0
        ? project.lines[nextUnsyncedIndex - 1]
        : project.lines[activeLineIndex];
    audio.currentTime = Math.max((targetLine?.startTime ?? 0) - 0.3, 0);
    setCurrentTime(audio.currentTime);
  };

  const handleTimingChange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    setProject((current) => ({
      ...current,
      lines: updateLineTiming(current.lines, index, field, numericValue, duration),
      updatedAt: new Date().toISOString()
    }));
    setRenderOutputUrl('');
  };

  const handleRender = async () => {
    if (isStaticHosting) return;
    if (!audioFile || !project.lines.length) {
      setRenderStatus('Add audio and lyrics before exporting.');
      return;
    }
    if (!syncComplete) {
      setRenderStatus('Tap every lyric line before exporting.');
      return;
    }

    setRendering(true);
    setRenderStatus('Rendering the Reel...');
    setRenderOutputUrl('');

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('project', JSON.stringify(preparedProject));

    try {
      const response = await fetch('/api/render', {
        method: 'POST',
        body: formData
      });
      const payload = (await response.json()) as RenderResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'Render failed.');
      }

      setRenderStatus(`Rendered ${payload.outputPath ?? 'your Reel'}.`);
      setRenderOutputUrl(payload.outputUrl ?? '');
    } catch (error) {
      setRenderStatus(
        error instanceof Error ? error.message : 'Render failed. Check the server terminal.'
      );
    } finally {
      setRendering(false);
    }
  };

  const selectView = (nextView: ViewName) => {
    if (nextView !== 'upload' && !canWork) {
      setMessage('Add an audio file and lyrics first.');
      return;
    }

    setView(nextView);
    setMessage('');
  };

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand-mark">
          <WandSparkles size={26} />
          <div>
            <strong>CoverReel</strong>
            <span>Studio</span>
          </div>
        </div>

        <nav className="view-tabs" aria-label="Workflow">
          {viewOrder.map(({id, label, icon: Icon}) => (
            <button
              key={id}
              type="button"
              className={view === id ? 'active' : ''}
              onClick={() => selectView(id)}
              title={label}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sync-meter">
          <span>{project.lines.length ? `${project.lines.length} lines` : 'No lyrics'}</span>
          <strong>{syncComplete ? 'Synced' : `${Math.max(nextUnsyncedIndex, 0)} tapped`}</strong>
        </div>
      </aside>

      <main className="workspace">
        <header className="top-bar">
          <div>
            <p className="eyebrow">{isStaticHosting ? 'Browser edition' : 'Tap-to-sync lyric video maker'}</p>
            <h1>{project.title}</h1>
          </div>
          <div className="project-actions">
            <input ref={projectInput} type="file" accept=".json,application/json" aria-label="Project JSON" hidden
              onChange={event => {void openProject(event.target.files?.[0]); event.target.value = '';}} />
            <button type="button" title="Open project" aria-label="Open project" onClick={() => projectInput.current?.click()}><FolderOpen size={20}/></button>
            <button type="button" title="Save project" aria-label="Save project" onClick={saveProject}><Save size={20}/></button>
          <div className="format-pill">
            1080 x 1920
            <span>30fps</span>
          </div>
          </div>
        </header>

        {message ? <div className="notice">{message}</div> : null}

        {view === 'upload' ? (
          <section className="two-column">
            <div className="panel upload-panel">
              <label className="file-drop">
                <Upload size={30} />
                <input
                  type="file"
                  accept="audio/*,video/mp4"
                  onChange={(event) => handleAudioFile(event.target.files?.[0] ?? null)}
                />
                <span>{audioFile ? audioFile.name : 'Choose song audio'}</span>
                <small>
                  {project.audio
                    ? `${formatTime(project.audio.duration)} detected`
                    : 'MP3, M4A, WAV, AAC, FLAC, OGG, WEBM'}
                </small>
              </label>

              <label className="field-label">
                Cover title
                <input
                  value={project.title}
                  onChange={(event) =>
                    updateProject((current) => ({
                      ...current,
                      title: event.target.value,
                      renderSettings: {
                        ...current.renderSettings,
                        outputName: getSafeOutputName(event.target.value)
                      }
                    }))
                  }
                  placeholder="Song name / artist"
                />
              </label>
              <button type="button" className="sample-action" onClick={loadSample}>
                <Play size={18} /> Try a sample
              </button>
            </div>

            <div className="panel lyrics-panel">
              <label className="field-label grow">
                Lyrics
                <textarea
                  value={project.rawLyrics}
                  onChange={(event) => handleLyricsChange(event.target.value)}
                  placeholder={'Paste lyrics here\nOne lyric line per visual beat'}
                />
              </label>
              <button
                type="button"
                className="primary-action"
                disabled={!canWork}
                onClick={() => selectView('sync')}
              >
                <Mic2 size={18} />
                Start Sync
              </button>
            </div>
          </section>
        ) : null}

        {view === 'sync' ? (
          <section className="sync-layout">
            <div className="panel transport-panel">
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                controls
              />

              <div className="transport-controls">
                <button type="button" onClick={handlePlayPause} title="Play or pause">
                  {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button type="button" onClick={handleRestartSection} title="Restart section">
                  <RotateCcw size={22} />
                  <span>Restart</span>
                </button>
                <button
                  type="button"
                  className="tap-button"
                  onClick={handleTapNext}
                  disabled={nextUnsyncedIndex === -1}
                  title="Tap next lyric"
                >
                  <StepForward size={26} />
                  <span>
                    {nextUnsyncedIndex === -1
                      ? 'All Lines Tapped'
                      : `Tap Line ${nextUnsyncedIndex + 1}`}
                  </span>
                </button>
                <button type="button" onClick={handleUndo} title="Undo last tap">
                  <Undo2 size={22} />
                  <span>Undo</span>
                </button>
              </div>

              <div className="now-line">
                <span>{formatTime(currentTime)}</span>
                <strong>
                  {nextUnsyncedIndex === -1
                    ? 'Timing complete'
                    : project.lines[nextUnsyncedIndex]?.text}
                </strong>
              </div>
            </div>

            <div className="panel timeline-panel">
              <div className="panel-heading">
                <h2>Lyric timing</h2>
                <span>{syncComplete ? 'Ready for preview' : 'Tap through the lines'}</span>
              </div>
              <div className="timing-list">
                {project.lines.map((line) => (
                  <div
                    key={line.index}
                    className={`timing-row ${line.index === activeLineIndex ? 'active' : ''}`}
                  >
                    <span className="line-number">{line.index + 1}</span>
                    <p>{line.text}</p>
                    <label>
                      Start
                      <input
                        type="number"
                        min="0"
                        max={duration}
                        step="0.01"
                        value={line.startTime ?? ''}
                        onChange={(event) =>
                          handleTimingChange(line.index, 'startTime', event.target.value)
                        }
                      />
                    </label>
                    <label>
                      End
                      <input
                        type="number"
                        min="0"
                        max={duration}
                        step="0.01"
                        value={line.endTime ?? ''}
                        onChange={(event) =>
                          handleTimingChange(line.index, 'endTime', event.target.value)
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {view === 'preview' ? (
          <section className="preview-layout">
            <div className="phone-frame">
              <Player
                component={CoverVideo}
                inputProps={{
                  project: preparedProject,
                  audioSrc: audioUrl
                }}
                durationInFrames={Math.ceil(duration * 30)}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={30}
                controls
                style={{
                  width: '100%',
                  aspectRatio: '9 / 16'
                }}
              />
            </div>

            <div className="panel style-panel">
              <div className="panel-heading">
                <h2>Style</h2>
                <SlidersHorizontal size={20} />
              </div>

              <div className="mode-switch with-directed" role="group" aria-label="Video style">
                <button type="button" aria-pressed={!project.story || project.story.mode === 'cinematic'}
                  onClick={() => updateProject(current => ({...current, story: {...(current.story ?? defaultStory), mode: 'cinematic'}}))}>
                  <Film size={17} /> Cinematic
                </button>
                <button type="button" aria-pressed={project.story?.mode === 'illustrated'}
                  onClick={() => updateProject(current => ({...current, story: {...(current.story ?? defaultStory), mode: 'illustrated'}}))}>
                  <WandSparkles size={17} /> Illustrated Story
                </button>
                <button type="button" aria-pressed={project.story?.mode === 'directed'}
                  onClick={() => updateProject(current=>({...current,story:{...(current.story??defaultStory),mode:'directed'}}))}>
                  <Film size={17}/> Rock Stage
                </button>
              </div>

              {project.story?.mode === 'directed' ? <div className="directed-shots">
                {project.lines.map((line,i)=><div key={i}>
                  <span className="line-number">{i+1}</span><div><strong>{rockShots[i%rockShots.length]}</strong><p>{line.text}</p></div>
                  <span className="section-meta">{formatTime(project.lines[i]?.startTime??null)}</span>
                </div>)}
              </div> : null}

              {project.story?.mode === 'illustrated' ? <>
                <div className="mood-options" role="group" aria-label="Story mood">
                  {storyMoods.map(mood => <button type="button" key={mood.id}
                    aria-pressed={project.story?.mood === mood.id}
                    onClick={() => updateProject(current => ({...current, story: {...(current.story ?? defaultStory), mood: mood.id}}))}>
                    <span style={{backgroundColor: mood.color}} />{mood.name}
                  </button>)}
                </div>
                <div className="story-sections">
                  {getStorySections(project).map((section, i) => <div className="story-section" key={section.id}>
                    <SceneThumbnail scene={section.scene} mood={project.story?.mood ?? 'midnight'} />
                    <div>
                      <span className="section-meta">Section {i + 1} · {formatTime(section.start)} / {formatTime(section.end)}</span>
                      <p>{section.label}</p>
                      <select aria-label={`Scene for section ${i + 1}`} value={section.scene}
                        onChange={event => {
                          const scene = sceneOptions.find(option => option.id === event.target.value)!.id;
                          updateProject(current => ({...current, story: {...(current.story ?? defaultStory), scenes: {...current.story?.scenes, [section.id]: scene}}}));
                        }}>
                        {sceneOptions.map(scene => <option key={scene.id} value={scene.id}>{scene.name}</option>)}
                      </select>
                    </div>
                  </div>)}
                </div>
              </> : null}

              {(!project.story || project.story.mode === 'cinematic') ? <div className="preset-grid">
                {stylePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={project.stylePreset.id === preset.id ? 'selected' : ''}
                    onClick={() =>
                      updateProject((current) => ({
                        ...current,
                        stylePreset: findStylePreset(preset.id)
                      }))
                    }
                  >
                    <span
                      className="swatch"
                      style={{
                        background: `linear-gradient(135deg, ${preset.backgroundB}, ${preset.accentColor})`
                      }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div> : null}

              {project.story?.mode !== 'directed' ? <><label className="field-label">
                Motion
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.01"
                  value={project.stylePreset.motionIntensity}
                  onChange={(event) =>
                    updateProject((current) => ({
                      ...current,
                      stylePreset: {
                        ...current.stylePreset,
                        motionIntensity: Number(event.target.value)
                      }
                    }))
                  }
                />
              </label>

              <label className="field-label">
                Grain
                <input
                  type="range"
                  min="0"
                  max="0.28"
                  step="0.01"
                  value={project.stylePreset.grainOpacity}
                  onChange={(event) =>
                    updateProject((current) => ({
                      ...current,
                      stylePreset: {
                        ...current.stylePreset,
                        grainOpacity: Number(event.target.value)
                      }
                    }))
                  }
                />
              </label></> : null}
            </div>
          </section>
        ) : null}

        {view === 'export' ? (
          <section className="export-layout">
            <div className="panel export-panel">
              <div className="panel-heading">
                <h2>Export Reel</h2>
                <Download size={20} />
              </div>

              <label className="field-label">
                Output name
                <input
                  value={project.renderSettings.outputName}
                  onChange={(event) =>
                    updateProject((current) => ({
                      ...current,
                      renderSettings: {
                        ...current.renderSettings,
                        outputName: getSafeOutputName(event.target.value)
                      }
                    }))
                  }
                />
              </label>

              <div className="export-specs">
                <span>MP4</span>
                <span>H.264</span>
                <span>AAC</span>
                <span>9:16</span>
              </div>

              {isStaticHosting ? <>
                <p className="render-status">MP4 rendering is available in the local app only.</p>
                <button type="button" className="primary-action" onClick={saveProject}>
                  <Save size={18}/> Save project
                </button>
                <a className="download-link" href="https://github.com/tejase/ai-song-cover#quick-start" target="_blank" rel="noreferrer">Get local app</a>
              </> : <button
                type="button"
                className="primary-action"
                disabled={rendering || !syncComplete}
                onClick={handleRender}
              >
                <Download size={18} />
                {rendering ? 'Rendering...' : 'Render MP4'}
              </button>}

              {!syncComplete && !isStaticHosting ? <p className="render-status">Tap every lyric line before exporting.</p> : null}

              {renderStatus ? <p className="render-status">{renderStatus}</p> : null}
              {renderOutputUrl ? (
                <a className="download-link" href={renderOutputUrl} download>
                  Download rendered Reel
                </a>
              ) : null}
            </div>

            <div className="phone-frame compact">
              <Player
                component={CoverVideo}
                inputProps={{
                  project: preparedProject,
                  audioSrc: audioUrl
                }}
                durationInFrames={Math.ceil(duration * 30)}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={30}
                controls
                style={{
                  width: '100%',
                  aspectRatio: '9 / 16'
                }}
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
};
