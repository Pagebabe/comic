import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const batchPath = join(root, 'outputs', 'comfyui', 'pilot', 'pilot-comfy-batch.json');
const workflowPath = join(root, 'src', 'data', 'comfyWorkflows', 'comic_panel_clean_v1.json');
const outRoot = join(root, 'outputs', 'comfyui', 'pilot');
const reportPath = join(outRoot, 'pilot-comfy-runner-report.json');

const endpoint = process.env.COMFYUI_URL ?? 'http://127.0.0.1:8188';
const checkpoint = process.env.COMFYUI_CHECKPOINT;
const allowSend = process.env.COMFYUI_ALLOW_SEND === '1';
const shouldSend = process.argv.includes('--send');
const shouldHealthcheck = process.argv.includes('--health');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assertSafeToSend() {
  if (!shouldSend) return { ok: false, reason: 'Dry run only. Add --send to allow real requests.' };
  if (!allowSend) return { ok: false, reason: 'Missing COMFYUI_ALLOW_SEND=1.' };
  if (!checkpoint) return { ok: false, reason: 'Missing COMFYUI_CHECKPOINT. Set the exact checkpoint filename available in ComfyUI.' };
  return { ok: true, reason: 'Send enabled by explicit flag and environment.' };
}

function validateItem(item) {
  const missing = [];
  const slots = item.workflowSlots ?? {};
  for (const key of ['positive_prompt', 'negative_prompt', 'width', 'height', 'seed', 'steps', 'cfg', 'sampler', 'scheduler', 'output_path']) {
    if (slots[key] === undefined || slots[key] === null || slots[key] === '') missing.push(`workflowSlots.${key}`);
  }
  if (!item.id) missing.push('id');
  if (!item.metadata?.panelId) missing.push('metadata.panelId');
  if (!item.workflowTemplate) missing.push('workflowTemplate');
  return missing;
}

function filenamePrefix(outputPath) {
  return String(outputPath).replace(/\.png$/i, '');
}

function buildComfyGraph(item) {
  const slots = item.workflowSlots;
  return {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: checkpoint ?? 'SET_COMFYUI_CHECKPOINT'
      }
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: slots.positive_prompt,
        clip: ['1', 1]
      }
    },
    '3': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: slots.negative_prompt,
        clip: ['1', 1]
      }
    },
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width: slots.width,
        height: slots.height,
        batch_size: 1
      }
    },
    '5': {
      class_type: 'KSampler',
      inputs: {
        seed: slots.seed,
        steps: slots.steps,
        cfg: slots.cfg,
        sampler_name: slots.sampler,
        scheduler: slots.scheduler,
        denoise: 1,
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0]
      }
    },
    '6': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['5', 0],
        vae: ['1', 2]
      }
    },
    '7': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: filenamePrefix(slots.output_path),
        images: ['6', 0]
      }
    }
  };
}

function buildRequest(item) {
  return {
    client_id: `comic-factory-pilot-${item.metadata.panelId}`,
    prompt: buildComfyGraph(item),
    extra_data: {
      episodeId: item.metadata.episodeId,
      panelId: item.metadata.panelId,
      sceneId: item.metadata.sceneId,
      sceneOrder: item.metadata.sceneOrder,
      sceneTitle: item.metadata.sceneTitle,
      location: item.metadata.location,
      reviewTarget: item.metadata.reviewTarget,
      sourceBatch: 'outputs/comfyui/pilot/pilot-comfy-batch.json'
    }
  };
}

async function healthcheck() {
  if (!shouldHealthcheck && !shouldSend) {
    return { skipped: true, reason: 'Use --health or --send to check ComfyUI.' };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${endpoint}/system_stats`, { signal: controller.signal });
    clearTimeout(timeout);
    return { skipped: false, ok: response.ok, status: response.status, url: `${endpoint}/system_stats` };
  } catch (error) {
    clearTimeout(timeout);
    return { skipped: false, ok: false, url: `${endpoint}/system_stats`, error: String(error) };
  }
}

async function postPrompt(request) {
  const response = await fetch(`${endpoint}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body };
}

const workflow = readJson(workflowPath, 'workflow contract');
const batch = readJson(batchPath, 'pilot Comfy batch');

if (workflow.id !== 'comic_panel_clean_v1' || workflow.status !== 'locked_template_contract') {
  console.error('Workflow contract is not locked for comic_panel_clean_v1.');
  process.exit(1);
}

const allItems = Array.isArray(batch.items) ? batch.items : [];
const selectedItems = Number.isFinite(limit) && limit > 0 ? allItems.slice(0, limit) : allItems;
const validation = selectedItems.map((item) => ({ id: item.id, panelId: item.metadata?.panelId, missing: validateItem(item) }));
const invalid = validation.filter((item) => item.missing.length > 0);

if (invalid.length > 0) {
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(reportPath, JSON.stringify({ passed: false, reason: 'validation_failed', validation }, null, 2), 'utf8');
  console.error('Validation failed. See outputs/comfyui/pilot/pilot-comfy-runner-report.json');
  process.exit(1);
}

const sendGate = assertSafeToSend();
const health = await healthcheck();
const requestPreviews = selectedItems.map((item) => ({ id: item.id, panelId: item.metadata.panelId, request: buildRequest(item) }));
const results = [];

if (sendGate.ok) {
  if (!health.ok) {
    console.error('ComfyUI healthcheck failed. Refusing to send.');
  } else {
    for (const preview of requestPreviews) {
      const result = await postPrompt(preview.request);
      results.push({ id: preview.id, panelId: preview.panelId, ...result });
      if (!result.ok) break;
    }
  }
}

const report = {
  id: 'pilot_comfy_guarded_runner_report',
  createdAt: new Date().toISOString(),
  endpoint,
  sourceBatch: 'outputs/comfyui/pilot/pilot-comfy-batch.json',
  workflowContract: 'src/data/comfyWorkflows/comic_panel_clean_v1.json',
  mode: sendGate.ok ? 'send_enabled' : 'dry_run_blocked',
  sendGate,
  healthcheck: health,
  totalBatchItems: allItems.length,
  selectedItems: selectedItems.length,
  sentRequests: results.length,
  validation,
  requestPreviews: sendGate.ok ? [] : requestPreviews,
  results,
  nextStep: sendGate.ok ? 'Inspect ComfyUI queue/history and rendered files.' : 'Set COMFYUI_ALLOW_SEND=1, COMFYUI_CHECKPOINT and pass --send only when ready.'
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote outputs/comfyui/pilot/pilot-comfy-runner-report.json');
console.log(`mode: ${report.mode}`);
console.log(`selected items: ${report.selectedItems}`);
console.log(`sent requests: ${report.sentRequests}`);
console.log(`healthcheck: ${health.skipped ? 'skipped' : health.ok ? 'ok' : 'failed'}`);

if (sendGate.ok && results.some((result) => !result.ok)) {
  process.exit(1);
}
