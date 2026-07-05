import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import episodeBuilderScenes from '../src/data/episodeBuilderScenes.json' assert { type: 'json' };
import tvShots from '../src/data/tvShots.json' assert { type: 'json' };
import styleGuide from '../src/data/styleGuide.json' assert { type: 'json' };

const root = process.cwd();
const jobRoot = join(root, 'outputs', 'pilot', 'jobs', 'keyframes');
const requestedSceneId = process.argv[2];

const scenes = requestedSceneId
  ? episodeBuilderScenes.filter((scene) => scene.id === requestedSceneId)
  : episodeBuilderScenes;

if (requestedSceneId && scenes.length === 0) {
  console.error(`Unknown scene id: ${requestedSceneId}`);
  process.exit(1);
}

mkdirSync(jobRoot, { recursive: true });

function findShot(id) {
  return tvShots.find((shot) => shot.id === id);
}

function createJob(scene, shot) {
  return {
    job_id: `keyframe_${shot.id}`,
    episode_id: scene.episode_id,
    scene_id: scene.id,
    scene_title: scene.title,
    tv_shot_id: shot.id,
    timecode: shot.timecode,
    duration: shot.duration,
    stage: 'keyframe_generation',
    status: 'queued',
    output_target: `outputs/pilot/keyframes/${scene.id}/${scene.episode_id}_${scene.id}_${shot.id}_keyframe_v1.png`,
    manifest_target: `outputs/pilot/keyframes/${scene.id}/keyframes.manifest.json`,
    beat_goal: scene.beat_goal,
    action: shot.action,
    camera: shot.camera,
    animation_intent: shot.animation,
    characters: shot.characters,
    voice: shot.voice,
    sound: shot.sound,
    prompt: shot.prompt,
    negative_prompt: `${shot.negative_prompt}, ${styleGuide.negative_rules.join(', ')}`,
    scene_generator_notes: scene.generator_notes,
    continuity_checks: scene.continuity_checks,
    approval_required: true
  };
}

const created = [];

for (const scene of scenes) {
  const sceneJobDir = join(jobRoot, scene.id);
  mkdirSync(sceneJobDir, { recursive: true });

  const shotJobs = [];
  for (const shotId of scene.tv_shot_ids) {
    const shot = findShot(shotId);
    if (!shot) {
      console.warn(`Missing TV shot for id: ${shotId}`);
      continue;
    }
    const job = createJob(scene, shot);
    const jobPath = join(sceneJobDir, `${job.job_id}.json`);
    writeFileSync(jobPath, JSON.stringify(job, null, 2), 'utf8');
    shotJobs.push(job);
    created.push(jobPath);
  }

  const indexPath = join(sceneJobDir, 'index.json');
  writeFileSync(indexPath, JSON.stringify({ scene_id: scene.id, jobs: shotJobs.map((job) => job.job_id) }, null, 2), 'utf8');
}

console.log(`Created ${created.length} keyframe job files.`);
for (const file of created) {
  console.log(`- ${file.replace(`${root}/`, '')}`);
}
