import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import tvShots from '../src/data/tvShots.json' assert { type: 'json' };

const root = process.cwd();
const soundRoot = join(root, 'outputs', 'pilot', 'sound');
const packagePath = join(soundRoot, 'ep001_sound_package.json');
const cueSheetPath = join(soundRoot, 'ep001_sound_cue_sheet.md');

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const cues = [];

for (const shot of tvShots) {
  if (!shot.sound || shot.sound.length === 0) continue;

  mkdirSync(join(soundRoot, shot.id), { recursive: true });

  shot.sound.forEach((cue, index) => {
    cues.push({
      id: `sound_${String(cues.length + 1).padStart(3, '0')}`,
      tv_shot_id: shot.id,
      timecode: shot.timecode,
      cue,
      cue_type:
        cue.includes('sting') || cue.includes('hit') || cue.includes('pluck') ? 'comedy_sting' :
        cue.includes('room tone') || cue.includes('buzz') || cue.includes('rumble') || cue.includes('hum') ? 'atmosphere' :
        cue.includes('door') || cue.includes('key') || cue.includes('coin') || cue.includes('paper') ? 'foley' :
        'sound_effect',
      priority:
        cue.includes('punchline') || cue.includes('sting') || cue.includes('keychain') || cue.includes('coin') ? 'high' : 'medium',
      file_target: `outputs/pilot/sound/${shot.id}/${String(index + 1).padStart(2, '0')}_${slugify(cue)}.wav`,
      notes: `Support shot ${shot.id}: ${shot.action}`
    });
  });
}

mkdirSync(soundRoot, { recursive: true });

const soundPackage = {
  episode_id: 'ep001',
  title: 'Die Entkommerzialisierungsgebühr',
  total_cues: cues.length,
  cues,
  mix_rules: [
    'Room tone should make the episode feel like one continuous space.',
    'Comedy stings stay small and dry, not cartoonishly loud.',
    'Door, keychain, coin and paper sounds carry the physical comedy.',
    'Do not over-score Sami. His punchline works because it is dry.',
    'Leave space for voice lines first, sound second, music last.'
  ]
};

writeFileSync(packagePath, JSON.stringify(soundPackage, null, 2), 'utf8');

const cueSheet = [
  '# Sound Cue Sheet: Die Entkommerzialisierungsgebühr',
  '',
  `Total cues: ${cues.length}`,
  '',
  ...cues.map((cue) => `## ${cue.id} · ${cue.tv_shot_id}\n\n- Timecode: ${cue.timecode}\n- Cue: ${cue.cue}\n- Type: ${cue.cue_type}\n- Priority: ${cue.priority}\n- Target: ${cue.file_target}\n`)
].join('\n');

writeFileSync(cueSheetPath, cueSheet, 'utf8');

console.log(`wrote outputs/pilot/sound/ep001_sound_package.json`);
console.log(`wrote outputs/pilot/sound/ep001_sound_cue_sheet.md`);
console.log(`Sound cues: ${cues.length}`);
