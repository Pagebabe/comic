import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const inputDir = join(root, 'outputs', 'ricco', 'ep001', 'final');
const outputDir = join(root, 'outputs', 'ricco', 'ep001', 'exports');
const subtitlePath = join(outputDir, 'ricco_ep001_9x16.srt');
const outputPath = join(outputDir, 'ricco_ep001_9x16.mp4');

const panels = [
  {
    file: 'panel_001.png',
    duration: 6,
    title: 'Ankunft',
    dialogue: ['Ricco: Bruder, endlich was Eigenes.']
  },
  {
    file: 'panel_002.png',
    duration: 8,
    title: 'Basti erscheint',
    dialogue: [
      'Basti: Ricco, schön, dass du da bist. Wichtig: Das hier ist kein Mietverhältnis.',
      'Ricco: Noch besser. Dann muss ich ja keine Miete zahlen.'
    ]
  },
  {
    file: 'panel_003.png',
    duration: 9,
    title: 'Solidarische Nutzungsgebühr',
    dialogue: [
      'Ricco: 780? Für ein Zimmer?',
      'Basti: Nicht Zimmer. Raum.',
      'Ricco: Was ist der Unterschied?',
      'Basti: Zimmer klingt bürgerlich.'
    ]
  },
  {
    file: 'panel_004.png',
    duration: 10,
    title: 'Das Zimmer',
    dialogue: [
      'Ricco: Das ist ja kleiner als auf den Fotos.',
      'Basti: Die Fotos waren symbolisch.',
      'Ricco: Symbolisch wofür?',
      'Basti: Wohnraumknappheit.'
    ]
  },
  {
    file: 'panel_005.png',
    duration: 8,
    title: 'Mama ruft an',
    dialogue: [
      'Basti: Familie ist wichtig.',
      'Ricco: Ja, deswegen geh ich später ran.',
      'Basti: Später ist oft ein kapitalistisches Konzept.',
      'Ricco: Was?'
    ]
  },
  {
    file: 'panel_006.png',
    duration: 7,
    title: 'Hausregeln',
    dialogue: [
      'Ricco: Muss ich mir das alles merken?',
      'Basti: Nein. Du musst es fühlen.',
      'Ricco: Ich fühl grad Schimmel.'
    ]
  },
  {
    file: 'panel_007.png',
    duration: 8,
    title: 'Die Küche',
    dialogue: [
      'Jule: Du bist der Neue? Wichtig: Alles hier ist gemeinschaftlich.',
      'Ricco: Auch mein Essen?',
      'Jule: Kommt auf deinen Klassenhintergrund an.'
    ]
  },
  {
    file: 'panel_008.png',
    duration: 9,
    title: 'Mietrealität',
    dialogue: [
      'Ricco: Okay. Nur Übergang.',
      'Aus der Wand: Mach mal leiser, ich produzier grad!',
      'Mama-Sprachnachricht: Ricco, ich wollte nur wissen, ob du gut angekommen bist.'
    ]
  }
];

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function srtTime(seconds) {
  const whole = Math.floor(seconds);
  const ms = Math.round((seconds - whole) * 1000);
  const hh = String(Math.floor(whole / 3600)).padStart(2, '0');
  const mm = String(Math.floor((whole % 3600) / 60)).padStart(2, '0');
  const ss = String(whole % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss},${String(ms).padStart(3, '0')}`;
}

function buildSubtitles() {
  let cursor = 0;
  let index = 1;
  const blocks = [];

  for (const panel of panels) {
    const lineDuration = panel.duration / Math.max(panel.dialogue.length, 1);

    for (const line of panel.dialogue) {
      const start = cursor;
      const end = cursor + lineDuration;
      blocks.push(`${index}\n${srtTime(start)} --> ${srtTime(end)}\n${line}`);
      cursor = end;
      index += 1;
    }
  }

  return `${blocks.join('\n\n')}\n`;
}

if (!existsSync(inputDir)) {
  fail(`Missing input folder: ${inputDir}\nCreate it and add panel_001.png to panel_008.png.`);
}

for (const panel of panels) {
  const panelPath = join(inputDir, panel.file);
  if (!existsSync(panelPath)) {
    fail(`Missing panel image: ${panelPath}`);
  }
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(subtitlePath, buildSubtitles(), 'utf8');

const ffmpegCheck = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
if (ffmpegCheck.error || ffmpegCheck.status !== 0) {
  fail('FFmpeg is not available. Install FFmpeg first, then run npm run assemble:ricco-pilot again.');
}

const args = ['-y'];
for (const panel of panels) {
  args.push('-loop', '1', '-t', String(panel.duration), '-i', join(inputDir, panel.file));
}

const videoInputs = panels
  .map((_, index) => `[v${index}]`)
  .join('');

const filter = panels
  .map((_, index) => `[${index}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30[v${index}]`)
  .join(';') + `;${videoInputs}concat=n=${panels.length}:v=1:a=0[outv]`;

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

console.log('Assembling Ricco pilot video from:');
for (const panel of panels) console.log(`- ${basename(panel.file)} (${panel.duration}s) ${panel.title}`);
console.log(`\nSubtitles: ${subtitlePath}`);
console.log(`Output: ${outputPath}\n`);

const result = spawnSync('ffmpeg', args, { stdio: 'inherit' });
if (result.error || result.status !== 0) {
  fail('FFmpeg assembly failed. Check the panel files, subtitle path and FFmpeg subtitle filter support.');
}

console.log(`\nDone: ${outputPath}`);
