import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const inputDir = join(root, 'outputs', 'pilot', 'approved');
const outputDir = join(root, 'outputs', 'pilot', 'exports');
const subtitlePath = join(root, 'outputs', 'pilot', 'pilot.srt');
const outputPath = join(outputDir, 'pilot_episode.mp4');

const panels = [
  { file: 'panel_01.png', duration: 5 },
  { file: 'panel_02.png', duration: 6 },
  { file: 'panel_03.png', duration: 5 },
  { file: 'panel_04.png', duration: 6 }
];

const subtitles = `1
00:00:00,000 --> 00:00:01,700
Falk: Kurzer Hausmoment.

2
00:00:01,700 --> 00:00:03,200
Rico: Ist was kaputt?

3
00:00:03,200 --> 00:00:05,000
Falk: Nur das System.

4
00:00:05,000 --> 00:00:07,000
Falk: Das ist keine Miete.

5
00:00:07,000 --> 00:00:09,700
Falk: Das ist eine Entkommerzialisierungsgebühr.

6
00:00:09,700 --> 00:00:11,000
Rico: Aber ich bezahle sie mit Geld?

7
00:00:11,000 --> 00:00:13,500
Rico: Und wofür ist die genau?

8
00:00:13,500 --> 00:00:16,000
Kralle: Der nimmt sogar Mäusen Miete.

9
00:00:16,000 --> 00:00:19,000
Rico: Ist das normal?

10
00:00:19,000 --> 00:00:22,000
Sami: Willkommen in Berlin.
`;

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (!existsSync(inputDir)) {
  fail(`Missing input folder: ${inputDir}\nCreate it and add panel_01.png to panel_04.png.`);
}

for (const panel of panels) {
  const path = join(inputDir, panel.file);
  if (!existsSync(path)) {
    fail(`Missing panel image: ${path}`);
  }
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(subtitlePath, subtitles, 'utf8');

const ffmpegCheck = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
if (ffmpegCheck.error || ffmpegCheck.status !== 0) {
  fail('FFmpeg is not available. Install FFmpeg first, then run npm run assemble:pilot again.');
}

const args = ['-y'];
for (const panel of panels) {
  args.push('-loop', '1', '-t', String(panel.duration), '-i', join(inputDir, panel.file));
}

const filter = panels
  .map((_, index) => `[${index}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30[v${index}]`)
  .join(';') + `;${panels.map((_, index) => `[v${index}]`).join('')}concat=n=${panels.length}:v=1:a=0[outv]`;

args.push(
  '-filter_complex',
  filter,
  '-map',
  '[outv]',
  '-vf',
  `subtitles=${subtitlePath}`,
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  outputPath
);

console.log('Assembling pilot video from:');
for (const panel of panels) console.log(`- ${basename(panel.file)} (${panel.duration}s)`);
console.log(`\nOutput: ${outputPath}\n`);

const result = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (result.error || result.status !== 0) {
  fail('FFmpeg assembly failed. Check the panel files and subtitle path.');
}

console.log(`\nDone: ${outputPath}`);
