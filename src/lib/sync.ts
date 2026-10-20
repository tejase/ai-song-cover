import type {LyricLine} from '../types';

export const roundTime = (value: number): number =>
  Math.round(value * 100) / 100;

export const clampTime = (value: number, duration: number): number =>
  Math.min(Math.max(roundTime(value), 0), Math.max(duration, 0));

export const findNextUnsyncedIndex = (lines: LyricLine[]): number =>
  lines.findIndex((line) => line.startTime === null);

export const getLineEndTime = (
  lines: LyricLine[],
  index: number,
  duration: number
): number | null => {
  const line = lines[index];

  if (!line || line.startTime === null) {
    return null;
  }

  if (line.endTime !== null) {
    return line.endTime;
  }

  const nextLine = lines.slice(index + 1).find((candidate) => {
    return candidate.startTime !== null;
  });

  return nextLine?.startTime ?? duration;
};

export const normalizeLineEnds = (
  lines: LyricLine[],
  duration: number
): LyricLine[] =>
  lines.map((line, index) => {
    if (line.startTime === null) {
      return {...line, endTime: null};
    }

    const nextLine = lines.slice(index + 1).find((candidate) => {
      return candidate.startTime !== null;
    });
    const fallbackEnd = nextLine?.startTime ?? duration;
    const endTime = line.endTime ?? fallbackEnd;

    return {
      ...line,
      endTime: roundTime(Math.max(line.startTime + 0.2, endTime))
    };
  });

export const tapNextLine = (
  lines: LyricLine[],
  currentTime: number,
  duration: number
): LyricLine[] => {
  const nextIndex = findNextUnsyncedIndex(lines);

  if (nextIndex === -1) {
    return lines;
  }

  const startTime = clampTime(currentTime, duration);
  const nextLines = lines.map((line) => ({...line}));

  nextLines[nextIndex].startTime = startTime;

  const previousLine = nextLines[nextIndex - 1];

  if (nextIndex > 0 && previousLine.startTime !== null) {
    nextLines[nextIndex - 1].endTime = roundTime(
      Math.max(previousLine.startTime + 0.2, startTime - 0.04)
    );
  }

  if (nextIndex === nextLines.length - 1) {
    nextLines[nextIndex].endTime = roundTime(
      Math.max(startTime + 0.2, duration)
    );
  }

  return normalizeLineEnds(nextLines, duration);
};

export const undoLastTap = (
  lines: LyricLine[],
  duration: number
): LyricLine[] => {
  const lastSyncedIndex = [...lines]
    .reverse()
    .find((line) => line.startTime !== null)?.index;

  if (lastSyncedIndex === undefined) {
    return lines;
  }

  const nextLines = lines.map((line) => ({...line}));
  nextLines[lastSyncedIndex].startTime = null;
  nextLines[lastSyncedIndex].endTime = null;

  if (lastSyncedIndex > 0 && nextLines[lastSyncedIndex - 1].startTime !== null) {
    nextLines[lastSyncedIndex - 1].endTime = duration;
  }

  return normalizeLineEnds(nextLines, duration);
};

export const updateLineTiming = (
  lines: LyricLine[],
  lineIndex: number,
  field: 'startTime' | 'endTime',
  rawValue: number,
  duration: number
): LyricLine[] => {
  const nextLines = lines.map((line) => ({...line}));
  const line = nextLines[lineIndex];

  if (!line) {
    return lines;
  }

  const value = clampTime(rawValue, duration);
  line[field] = value;

  if (line.startTime !== null && line.endTime !== null) {
    if (line.endTime <= line.startTime) {
      line.endTime = roundTime(Math.min(duration, line.startTime + 0.2));
    }
  }

  if (field === 'startTime' && lineIndex > 0) {
    const previous = nextLines[lineIndex - 1];
    if (previous.startTime !== null) {
      previous.endTime = roundTime(Math.max(previous.startTime + 0.2, value));
    }
  }

  return normalizeLineEnds(nextLines, duration);
};

export const findActiveLineIndex = (
  lines: LyricLine[],
  currentTime: number,
  duration: number
): number => {
  const active = lines.find((line, index) => {
    if (line.startTime === null) {
      return false;
    }

    const endTime = getLineEndTime(lines, index, duration);
    return currentTime >= line.startTime && currentTime < (endTime ?? duration);
  });

  if (active) {
    return active.index;
  }

  const next = lines.find((line) => {
    return line.startTime !== null && line.startTime > currentTime;
  });

  return next?.index ?? Math.max(0, lines.length - 1);
};

export const formatTime = (seconds: number | null): string => {
  if (seconds === null || Number.isNaN(seconds)) {
    return '--:--.--';
  }

  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const wholeSeconds = Math.floor(safeSeconds % 60);
  const centiseconds = Math.round((safeSeconds % 1) * 100);

  return `${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(
    2,
    '0'
  )}.${String(centiseconds).padStart(2, '0')}`;
};
