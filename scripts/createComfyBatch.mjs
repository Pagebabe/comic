import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import adapter from '../src/data/comfyAdapter.json' assert { type: 'json' };
import tvShots from '../src/data/tvShots.json' assert { type: 'json' };
import repairQueue from '../src/data/nextFixQueue.json' assert { type: 'json' };

const root = process.cwd();
const outRoot = join(root, 'outputs', 'pilot', 'jobs', 'comfyui');
mkdirSync(outRoot, { recursive: true });

const width = 1080;
const height = 1920;
const defaults = {
  steps: 30,
  cfg: 4.5,
  sampler: 'dpmpp_2m',
  scheduler: 'karras'
};

function shotFor(id) {
  return tvShots.find((shot) => shot.id === id);
}

function toRenderItem(item, index) {
  const shot = shotFor(item.tv_shot_id);
  const prompt = [
    shot?.prompt,
    item.instruction,
    ...(item.must_have ?? []).map((rule) => `must have: ${rule}`)
  ].filter(Boolean).join('\n');

  const negativePrompt = [
    shot?.negative_prompt,
    ...(item.must_not_have ?? []).map((rule) => `avoid: ${rule}`),
    'readable text, speech bubbles, subtitles inside image, logos, watermarks, fake UI, infographic, poster text'
  ].filter(Boolean).join(', ');

  return {
    id: item.id,
    priority: item.priority ?? index + 1,
    episode_id: 'ep001',
    scene_id: item.scene_id,
    tv_shot_id: item.tv_shot_id,
    task_type: item.type,
    status: 'queued',
    endpoint_env: adapter.endpoint_env,
    endpoint_default: adapter.default_endpoint,
    workflow_template: 'comic_keyframe_clean_v1',
    inputs: {
      positive_prompt: prompt,
      negative_prompt: negativePrompt,
      width,
      height,
      seed: -1,
      ...defaults,
      output_path: item.output_target
    },
    review_after_render: true,
    review_target: `outputs/pilot/review/${item.scene_id}/review.manifest.json`
  };
}

const repairBatch = repairQueue
  .slice()
  .sort((a, b) => a.priority - b.priority)
  .map(toRenderItem);

const keyframeBatch = tvShots.map((shot, index) => ({
  id: `render_${shot.id}`,
  priority: index + 1,
  episode_id: 'ep001',
  scene_id: shot.scene_id,
  tv_shot_id: shot.id,
  task_type: 'create_keyframe',
  status: 'queued',
  endpoint_env: adapter.endpoint_env,
  endpoint_default: adapter.default_endpoint,
  workflow_template: 'comic_keyframe_clean_v1',
  inputs: {
    positive_prompt: shot.prompt,
    negative_prompt: [shot.negative_prompt, 'readable text, speech bubbles, subtitles inside image, logos, watermarks'].filter(Boolean).join(', '),
    width,
    height,
    seed: -1,
    ...defaults,
    output_path: `outputs/pilot/keyframes/${shot.scene_id}/ep001_${shot.scene_id}_${shot.id}_keyframe_v1.png`
  },
  review_after_render: true,
  review_target: `outputs/pilot/review/${shot.scene_id}/review.manifest.json`
}));

const repairPayload = {
  adapter_id: adapter.id,
  mode: 'priority_repairs_first',
  count: repairBatch.length,
  items: repairBatch
};

const keyframePayload = {
  adapter_id: adapter.id,
  mode: 'all_keyframes_reference_batch',
  count: keyframeBatch.length,
  items: keyframeBatch
};

writeFileSync(join(outRoot, 'ep001_comfyui_repair_batch.json'), JSON.stringify(repairPayload, null, 2), 'utf8');
writeFileSync(join(outRoot, 'ep001_comfyui_keyframe_batch.json'), JSON.stringify(keyframePayload, null, 2), 'utf8');

console.log('wrote outputs/pilot/jobs/comfyui/ep001_comfyui_repair_batch.json');
console.log('wrote outputs/pilot/jobs/comfyui/ep001_comfyui_keyframe_batch.json');
console.log(`Repair items: ${repairBatch.length}`);
console.log(`Keyframe items: ${keyframeBatch.length}`);
