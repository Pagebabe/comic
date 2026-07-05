import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import tvShots from '../src/data/tvShots.json' assert { type: 'json' };
import adapter from '../src/data/remotionAdapter.json' assert { type: 'json' };

const root = process.cwd();
const assemblyDir = join(root, 'outputs', 'pilot', 'assembly');
const planPath = join(assemblyDir, 'ep001_remotion_plan.json');
const assemblyPackagePath = join(assemblyDir, 'ep001_assembly_package.json');
const voicePackagePath = join(root, 'outputs', 'pilot', 'voice', 'ep001_voice_package.json');
const soundPackagePath = join(root, 'outputs', 'pilot', 'sound', 'ep001_sound_package.json');

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseStart(timecode) {
  const [start] = timecode.split('-');
  const [minutes, seconds] = start.split(':').map(Number);
  return minutes * 60 + seconds;
}

const assemblyPackage = readJson(assemblyPackagePath, null);
const voicePackage = readJson(voicePackagePath, { voice_lines: [] });
const soundPackage = readJson(soundPackagePath, { cues: [] });

const fps = adapter.composition.fps;
const sequences = tvShots.map((shot) => {
  const startSeconds = parseStart(shot.timecode);
  const voice = voicePackage.voice_lines.filter((line) => line.tv_shot_id === shot.id);
  const sound = soundPackage.cues.filter((cue) => cue.tv_shot_id === shot.id);
  const assemblyItem = assemblyPackage?.timeline?.find((item) => item.tv_shot_id === shot.id);

  return {
    id: shot.id,
    from_frame: Math.round(startSeconds * fps),
    duration_frames: Math.round(shot.duration * fps),
    duration_seconds: shot.duration,
    timecode: shot.timecode,
    action: shot.action,
    layer_type: assemblyItem?.asset_target ? 'approved_keyframe_or_motion' : 'placeholder',
    asset_target: assemblyItem?.asset_target ?? null,
    approved: assemblyItem?.approved ?? false,
    camera_move: shot.animation,
    voice_lines: voice,
    sound_cues: sound,
    subtitle_mode: 'video_layer_only'
  };
});

const plan = {
  episode_id: 'ep001',
  adapter: adapter.name,
  composition: adapter.composition,
  ready_for_remotion_render: assemblyPackage?.ready_for_assembly === true,
  render_warning: assemblyPackage?.ready_for_assembly === true ? null : 'Assembly is still blocked; render only rough previews until all TV shots are approved.',
  input_sources: adapter.input_sources,
  sequences,
  output_target: 'outputs/pilot/exports/ep001_pilot_tv_episode_remotion_v1.mp4'
};

mkdirSync(assemblyDir, { recursive: true });
writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8');

console.log('wrote outputs/pilot/assembly/ep001_remotion_plan.json');
console.log(`Sequences: ${sequences.length}`);
console.log(`Ready: ${plan.ready_for_remotion_render}`);
