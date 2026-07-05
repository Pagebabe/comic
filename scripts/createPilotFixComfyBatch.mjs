import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const fixQueuePath = join(root, 'outputs', 'render-queue', 'pilot-fix-render-queue.json');
const outRoot = join(root, 'outputs', 'comfyui', 'pilot-fixes');
const batchPath = join(outRoot, 'pilot-fix-comfy-batch.json');
const indexPath = join(outRoot, 'index.json');

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    console.error('Run first: node scripts/createPilotFixJobs.mjs');
    console.error('Then run: node scripts/createPilotFixRenderQueue.mjs');
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function toComfyItem(item) {
  return {
    id: item.id,
    priority: item.priority,
    sourceQueue: 'outputs/render-queue/pilot-fix-render-queue.json',
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
      sourceFixJobId: item.sourceFixJobId,
      sourceManifest: item.sourceManifest,
      sourceImage: item.sourceImage,
      sourcePromptId: item.sourcePromptId,
      decision: item.decision,
      reviewNote: item.reviewNote,
      attempt: item.attempt,
      reviewTarget: item.review.target
    },
    reviewAfterRender: item.review.required,
    reviewChecks: item.review.checks
  };
}

const fixQueue = readJson(fixQueuePath, 'fix render queue');
const queueItems = Array.isArray(fixQueue.items) ? fixQueue.items : [];
const items = queueItems.map(toComfyItem);

const batch = {
  id: 'rico_gegen_berlin_pilot_fix_comfy_batch',
  createdAt: new Date().toISOString(),
  mode: 'plan_only_fix_pass',
  sourceQueue: 'outputs/render-queue/pilot-fix-render-queue.json',
  adapter: {
    id: 'adapter_comfyui_comic_panel_fixes_v1',
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
  batchFile: 'outputs/comfyui/pilot-fixes/pilot-fix-comfy-batch.json',
  sourceQueue: batch.sourceQueue,
  nextStep: items.length > 0
    ? 'Validate this fix Comfy batch and then pass it to a guarded fix runner.'
    : 'No fix render queue items found yet.'
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf8');
writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

console.log('wrote outputs/comfyui/pilot-fixes/pilot-fix-comfy-batch.json');
console.log('wrote outputs/comfyui/pilot-fixes/index.json');
console.log(`fix comfy batch items: ${items.length}`);
