import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const batchPath = join(root, 'outputs', 'comfyui', 'pilot', 'pilot-comfy-batch.json');
const outRoot = join(root, 'outputs', 'comfyui', 'pilot');
const dryRunPath = join(outRoot, 'pilot-comfy-runner-dry-run.json');
const endpoint = process.env.COMFYUI_URL ?? 'http://127.0.0.1:8188';
const shouldHealthcheck = process.argv.includes('--health');
const shouldSend = process.argv.includes('--send');

if (shouldSend) {
  console.error('Refusing to send real ComfyUI requests from dryRunPilotComfyRunner.mjs.');
  console.error('This sprint is dry-run only. Build a separate reviewed runner for real API calls.');
  process.exit(1);
}

if (!existsSync(batchPath)) {
  console.error('Missing outputs/comfyui/pilot/pilot-comfy-batch.json');
  console.error('Run first: node scripts/createPilotPromptPack.mjs');
  console.error('Then run: node scripts/createPilotRenderQueue.mjs');
  console.error('Then run: node scripts/createPilotComfyBatch.mjs');
  console.error('Then run: node scripts/checkPilotComfyBatch.mjs');
  process.exit(1);
}

function validateItem(item) {
  const missing = [];
  const slots = item.workflowSlots ?? {};

  if (!item.id) missing.push('id');
  if (!item.metadata?.panelId) missing.push('metadata.panelId');
  if (!item.workflowTemplate) missing.push('workflowTemplate');
  if (!slots.positive_prompt) missing.push('workflowSlots.positive_prompt');
  if (!slots.negative_prompt) missing.push('workflowSlots.negative_prompt');
  if (!slots.output_path) missing.push('workflowSlots.output_path');
  if (!slots.width) missing.push('workflowSlots.width');
  if (!slots.height) missing.push('workflowSlots.height');
  if (!slots.steps) missing.push('workflowSlots.steps');
  if (!slots.cfg) missing.push('workflowSlots.cfg');
  if (!slots.sampler) missing.push('workflowSlots.sampler');
  if (!slots.scheduler) missing.push('workflowSlots.scheduler');

  return missing;
}

function buildComfyRequestPreview(item) {
  const slots = item.workflowSlots;
  return {
    method: 'POST',
    url: `${endpoint}/prompt`,
    bodyPreview: {
      client_id: 'comic-factory-pilot-dry-run',
      prompt: {
        __note: 'This is a dry-run slot payload, not the final ComfyUI workflow graph.',
        __workflow_template: item.workflowTemplate,
        positive_prompt: slots.positive_prompt,
        negative_prompt: slots.negative_prompt,
        width: slots.width,
        height: slots.height,
        seed: slots.seed,
        steps: slots.steps,
        cfg: slots.cfg,
        sampler: slots.sampler,
        scheduler: slots.scheduler,
        output_path: slots.output_path
      },
      extra_data: {
        episodeId: item.metadata.episodeId,
        panelId: item.metadata.panelId,
        sceneId: item.metadata.sceneId,
        sceneOrder: item.metadata.sceneOrder,
        sceneTitle: item.metadata.sceneTitle,
        location: item.metadata.location,
        reviewTarget: item.metadata.reviewTarget
      }
    }
  };
}

async function maybeHealthcheck() {
  if (!shouldHealthcheck) {
    return { skipped: true, reason: 'Use --health to check ComfyUI availability.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${endpoint}/system_stats`, { signal: controller.signal });
    clearTimeout(timeout);
    return {
      skipped: false,
      ok: response.ok,
      status: response.status,
      url: `${endpoint}/system_stats`
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      skipped: false,
      ok: false,
      url: `${endpoint}/system_stats`,
      error: String(error)
    };
  }
}

const batch = JSON.parse(readFileSync(batchPath, 'utf8'));
const items = Array.isArray(batch.items) ? batch.items : [];
const validation = items.map((item) => ({ id: item.id, panelId: item.metadata?.panelId, missing: validateItem(item) }));
const validItems = items.filter((item) => validateItem(item).length === 0);
const healthcheck = await maybeHealthcheck();

const dryRun = {
  id: 'pilot_comfy_runner_dry_run',
  createdAt: new Date().toISOString(),
  safeMode: true,
  sentRequests: 0,
  endpoint,
  sourceBatch: 'outputs/comfyui/pilot/pilot-comfy-batch.json',
  healthcheck,
  counts: {
    total: items.length,
    valid: validItems.length,
    invalid: items.length - validItems.length
  },
  validation,
  requestPreviews: validItems.map(buildComfyRequestPreview),
  nextStep: 'Review this dry-run. Real sending should be implemented in a separate runner only after the workflow graph is locked.'
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(dryRunPath, JSON.stringify(dryRun, null, 2), 'utf8');

console.log('wrote outputs/comfyui/pilot/pilot-comfy-runner-dry-run.json');
console.log(`batch items: ${items.length}`);
console.log(`valid items: ${validItems.length}`);
console.log(`sent requests: ${dryRun.sentRequests}`);
console.log(`healthcheck: ${healthcheck.skipped ? 'skipped' : healthcheck.ok ? 'ok' : 'failed'}`);

if (validItems.length !== items.length) {
  process.exit(1);
}
