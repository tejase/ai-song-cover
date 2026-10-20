import React from 'react';
import {Composition} from 'remotion';
import {cinematicGlowPreset} from '../lib/stylePresets';
import type {SongProject} from '../types';
import {CoverVideo} from './CoverVideo';

const defaultProject: SongProject = {
  id: 'default-remotion-project',
  title: 'CoverReel',
  audio: null,
  rawLyrics: '',
  lines: [],
  stylePreset: cinematicGlowPreset,
  renderSettings: {
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 30,
    outputName: 'coverreel'
  },
  createdAt: '2026-10-09T00:00:00.000Z',
  updatedAt: '2026-10-09T00:00:00.000Z'
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CoverReel"
      component={CoverVideo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={30 * 30}
      defaultProps={{
        project: defaultProject,
        audioSrc: ''
      }}
      calculateMetadata={({props}) => {
        const fps = props.project.renderSettings.fps || 30;
        const duration = Math.max(props.project.renderSettings.duration, 1);

        return {
          fps,
          width: props.project.renderSettings.width || 1080,
          height: props.project.renderSettings.height || 1920,
          durationInFrames: Math.ceil(duration * fps)
        };
      }}
    />
  );
};
