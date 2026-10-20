import {mkdir, writeFile} from 'node:fs/promises';
import {createEmptyProject, parseLyrics} from '../src/lib/lyrics';
import {serializeProject} from '../src/lib/projectFile';

const project = createEmptyProject();
project.title = 'Moonlight Study';
project.rawLyrics = 'Rain writes on the window\nAnd the city falls asleep\nOver quiet hills we wander\nWhere the moonlight runs deep\nLet the ocean carry echoes\nOf a melody we keep\nOne light waits upon the stage\nFor the song we have to sing';
project.lines = parseLyrics(project.rawLyrics).map((line, i) => ({...line, startTime: i * 1.5, endTime: (i + 1) * 1.5}));
project.renderSettings = {...project.renderSettings, duration: 12, outputName: 'moonlight-study'};
project.audio = {name: 'sample.wav', type: 'audio/wav', size: 529244, duration: 12};
await mkdir('examples', {recursive: true});
await writeFile('examples/moonlight.coverreel.json', serializeProject(project) + '\n');
