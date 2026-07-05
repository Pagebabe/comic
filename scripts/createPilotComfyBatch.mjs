import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const renderQueuePath = join(root, 'outputs', 'render-queue', 'pilot-render-queue.json');
const outRoot = join(root, 'outputs', 'comfyui', 'pilot');
const batchPath = join(outRoot, 'pilot-comfy-batch.json');
const indexPath = join(outRoot, 'index.json');

if (!existsSync(renderQueuePath)) {
  console.error('Missing outputs/render-queue/pilot-render-queue.json');
  console.error('Run first: node scripts/createPilotPromptPack.mjs');
  console.error('Then run: node scripts/createPilotRenderQueue.mjs');
  process.exit(1);
}

const renderQueue = JSON.parse(readFileSync(renderQueuePath, 'utf8'));

function toComfyItem(item) {
  return {
    id: item.id,
    priority: item.priority,
    sourceQueue: 'outputs/render-queue/pilot-render-queue.json',
    status: 'planned',
    endpointEnv: 'COMFYUI_URL',
    endpointDefault: 'http://127.0.0.1:8188',
    workflowTemplate: item.workflowTemplate,
    workflowSlots: {
      positive_prompt: item.inputs.positivePrompt,
      negative_prompt: item.inputs.negativePrompt,
      width: item.inputs.width,
      height: item.inputs.height,
      seed: item.inputs.seed,
      steps: item.inputs.steps,
      cfg: item.inputs.cfg,
      sampler: item.inputs.sampler,
      scheduler: item.inputs.scheduler,
      output_path: item.inputs.outputPath
    },
    metadata: {
      episodeId: item.episodeId,
      panelId: item.panelId,
      sceneId: item.sceneId,
      sceneOrder: item.sceneOrder,
      sceneTitle: item.sceneTitle,
      location: item.location,
      attempt: item.attempt,
      dialogueReference: item.source.dialogue,
      reviewTarget: item.review.target
    },
    reviewAfterRender: item.review.required,
    reviewChecks: item.review.checks
  };
}

const items = renderQueue.items.map(toComfyItem);

const batch = {
  id: 'rico_gegen_berlin_pilot_comfy_batch',
  createdAt: new Date().toISOString(),
  mode: 'plan_only_first',
  sourceQueue: 'outputs/render-queue/pilot-render-queue.json',
  adapter: {
    id: 'adapter_comfyui_comic_panels_v1',
    endpointEnv: 'COMFYUI_URL',
    defaultEndpoint: 'http://127.0.0.1:8188',
    runnerStatus: 'not_connected_yet'
  },
  itemCount: items.length,
  items
};

const index = {
  id: batch.id,
  createdAt: batch.createdAt,
  itemCount: batch.itemCount,
  batchFile: 'outputs/comfyui/pilot/pilot-comfy-batch.json',
  sourceQueue: batch.sourceQueue,
  nextStep: 'Attach an actual ComfyUI runner that converts each workflowSlots object into the chosen workflow JSON.'
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

console.log('wrote outputs/comfyui/pilot/pilot-comfy-batch.json');
console.log('wrote outputs/comfyui/pilot/index.json');
console.log(`comfy batch items: ${items.length}`);
