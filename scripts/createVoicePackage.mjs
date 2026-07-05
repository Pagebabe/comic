import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import tvShots from '../src/data/tvShots.json' assert { type: 'json' };

const root = process.cwd();
const voiceRoot = join(root, 'outputs', 'pilot', 'voice');
const subtitleRoot = join(root, 'outputs', 'pilot', 'subtitles');
const packagePath = join(voiceRoot, 'ep001_voice_package.json');
const srtPath = join(subtitleRoot, 'ep001_pilot_subtitles.srt');
const vttPath = join(subtitleRoot, 'ep001_pilot_subtitles.vtt');

function parseStart(timecode) {
  const [start] = timecode.split('-');
  const [minutes, seconds] = start.split(':').map(Number);
  return minutes * 60 + seconds;
}

function formatSrtTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatVttTime(totalSeconds) {
  return formatSrtTime(totalSeconds).replace(',', '.');
}

const voiceLines = [];

for (const shot of tvShots) {
  if (!shot.voice || shot.voice.length === 0) continue;

  const shotStart = parseStart(shot.timecode);
  const available = Math.max(shot.duration - 0.4, 1);
  const slot = available / shot.voice.length;

  shot.voice.forEach((line, index) => {
    const start = shotStart + 0.2 + index * slot;
    const end = Math.min(shotStart + shot.duration - 0.1, start + Math.max(slot - 0.15, 1.1));
    voiceLines.push({
      id: `line_${String(voiceLines.length + 1).padStart(3, '0')}`,
      tv_shot_id: shot.id,
      timecode: shot.timecode,
      character: line.character,
      line: line.line,
      start_seconds: Number(start.toFixed(2)),
      end_seconds: Number(end.toFixed(2)),
      srt_start: formatSrtTime(start),
      srt_end: formatSrtTime(end),
      voice_file_target: `outputs/pilot/voice/${shot.id}/${line.character.toLowerCase().replaceAll(' ', '_')}_${String(index + 1).padStart(2, '0')}.wav`
    });
  });
}

const cast = [...new Set(voiceLines.map((line) => line.character))].map((character) => ({
  character,
  direction:
    character === 'Falk Reuter' ? 'soft, moral, manipulative, never openly evil' :
    character === 'Rico Bassmann' ? 'young, polite, innocent, confused' :
    character === 'Kralle' ? 'dry Berlin Kiez boss, physically cat-like, not cute' :
    character === 'Sami' ? 'deadpan, short, tired, Späti oracle' :
    'supporting voice'
}));

mkdirSync(voiceRoot, { recursive: true });
mkdirSync(subtitleRoot, { recursive: true });
for (const line of voiceLines) {
  mkdirSync(join(voiceRoot, line.tv_shot_id), { recursive: true });
}

const voicePackage = {
  episode_id: 'ep001',
  title: 'Die Entkommerzialisierungsgebühr',
  total_lines: voiceLines.length,
  cast,
  voice_lines: voiceLines,
  notes: [
    'Voice is added after clean keyframes are approved.',
    'Do not generate speech bubbles or dialogue text inside images.',
    'Subtitle timing is a first pass and should be adjusted after final voice recordings.'
  ]
};

writeFileSync(packagePath, JSON.stringify(voicePackage, null, 2), 'utf8');

const srt = voiceLines.map((line, index) => `${index + 1}\n${line.srt_start} --> ${line.srt_end}\n${line.character}: ${line.line}\n`).join('\n');
writeFileSync(srtPath, srt, 'utf8');

const vtt = 'WEBVTT\n\n' + voiceLines.map((line) => `${formatVttTime(line.start_seconds)} --> ${formatVttTime(line.end_seconds)}\n${line.character}: ${line.line}\n`).join('\n');
writeFileSync(vttPath, vtt, 'utf8');

console.log(`wrote outputs/pilot/voice/ep001_voice_package.json`);
console.log(`wrote outputs/pilot/subtitles/ep001_pilot_subtitles.srt`);
console.log(`wrote outputs/pilot/subtitles/ep001_pilot_subtitles.vtt`);
console.log(`Voice lines: ${voiceLines.length}`);
