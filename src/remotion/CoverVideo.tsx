import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';
import type {CoverVideoProps, LyricLine} from '../types';
import {findActiveLineIndex, getLineEndTime} from '../lib/sync';
import {IllustratedVideo} from './IllustratedVideo';
import {RockVideo} from './RockVideo';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const grainBackground =
  'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.2) 0 1px, transparent 1px), radial-gradient(circle at 76% 62%, rgba(255,255,255,0.13) 0 1px, transparent 1px)';

const getLineProgress = (
  line: LyricLine,
  lineIndex: number,
  lines: LyricLine[],
  time: number,
  duration: number
): number => {
  if (line.startTime === null) {
    return 0;
  }

  const end = getLineEndTime(lines, lineIndex, duration) ?? duration;
  return clamp((time - line.startTime) / Math.max(end - line.startTime, 0.2), 0, 1);
};

export const CoverVideo: React.FC<CoverVideoProps> = (props) =>
  props.project.story?.mode === 'directed'
    ? <RockVideo {...props} />
    : props.project.story?.mode === 'illustrated'
    ? <IllustratedVideo {...props} />
    : <CinematicVideo {...props} />;

const CinematicVideo: React.FC<CoverVideoProps> = ({project, audioSrc}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const time = frame / fps;
  const duration = project.renderSettings.duration || durationInFrames / fps;
  const preset = project.stylePreset;
  const activeIndex = findActiveLineIndex(project.lines, time, duration);
  const activeLine = project.lines[activeIndex];
  const previousLine = project.lines[activeIndex - 1];
  const nextLine = project.lines[activeIndex + 1];
  const lineProgress = activeLine
    ? getLineProgress(activeLine, activeIndex, project.lines, time, duration)
    : 0;
  const activeTokenCount = activeLine
    ? Math.max(1, Math.ceil(activeLine.tokens.length * lineProgress))
    : 0;
  const drift = preset.motionIntensity * frame;
  const breathe = interpolate(
    Math.sin(frame / 34),
    [-1, 1],
    [0.94, 1.04]
  );
  const entrance = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        color: preset.textColor,
        fontFamily: preset.fontFamily,
        overflow: 'hidden',
        background: `linear-gradient(146deg, ${preset.backgroundA}, ${preset.backgroundB} 48%, ${preset.backgroundC})`
      }}
    >
      {audioSrc ? <Audio src={audioSrc} /> : null}

      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${30 + Math.sin(drift / 48) * 18}% ${
            20 + Math.cos(drift / 58) * 14
          }%, ${preset.glowColor}55, transparent 34%),
          radial-gradient(circle at ${75 + Math.cos(drift / 55) * 12}% ${
            70 + Math.sin(drift / 45) * 10
          }%, ${preset.accentColor}4a, transparent 38%),
          linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.55))`,
          filter: 'saturate(112%)'
        }}
      />

      <AbsoluteFill
        style={{
          backgroundImage: grainBackground,
          backgroundSize: '38px 38px, 54px 54px',
          opacity: preset.grainOpacity,
          mixBlendMode: 'screen',
          transform: `translate(${Math.sin(frame / 19) * 12}px, ${
            Math.cos(frame / 23) * 12
          }px)`
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: '250px 92px 340px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            transform: `scale(${breathe}) translateY(${(1 - entrance) * 34}px)`,
            opacity: entrance
          }}
        >
          {previousLine ? (
            <p
              style={{
                margin: '0 0 34px',
                fontSize: 42,
                lineHeight: 1.1,
                opacity: 0.34,
                filter: 'blur(0.2px)'
              }}
            >
              {previousLine.text}
            </p>
          ) : null}

          <h1
            style={{
              margin: 0,
              fontSize: activeLine && activeLine.text.length > 42 ? 78 : 92,
              lineHeight: 0.98,
              fontWeight: 850,
              letterSpacing: 0,
              textWrap: 'balance',
              textShadow: `0 0 24px ${preset.glowColor}66, 0 20px 60px rgba(0,0,0,0.42)`
            }}
          >
            {activeLine
              ? activeLine.tokens.map((token, tokenIndex) => {
                  const isActive = tokenIndex < activeTokenCount;
                  return (
                    <React.Fragment key={`${activeLine.index}-${token.index}`}>
                      <span
                        style={{
                          color: isActive ? preset.textColor : 'rgba(255,255,255,0.56)',
                          textShadow: isActive
                            ? `0 0 18px ${preset.glowColor}, 0 0 46px ${preset.accentColor}7a`
                            : 'none',
                          transition: 'color 120ms ease'
                        }}
                      >
                        {token.text}
                      </span>
                      {tokenIndex < activeLine.tokens.length - 1 ? ' ' : ''}
                    </React.Fragment>
                  );
                })
              : project.title}
          </h1>

          {nextLine ? (
            <p
              style={{
                margin: '38px 0 0',
                fontSize: 42,
                lineHeight: 1.12,
                opacity: 0.42
              }}
            >
              {nextLine.text}
            </p>
          ) : null}
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 86,
          right: 86,
          bottom: 172,
          height: 4,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.18)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${clamp((time / duration) * 100, 0, 100)}%`,
            background: `linear-gradient(90deg, ${preset.accentColor}, ${preset.secondaryColor}, ${preset.glowColor})`
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'rgba(255,255,255,0.66)',
          fontSize: 28,
          letterSpacing: 0,
          textTransform: 'uppercase'
        }}
      >
        <span>{project.title}</span>
        <span>{preset.name}</span>
      </div>
    </AbsoluteFill>
  );
};
