import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import runner from '../src/data/comfyRunner.json' assert { type: 'json' };

const root = process.cwd();
const batchArg = process.argv[2];
const shouldHealthcheck = process.argv.includes('--health');
const batchPath = join(root, batchArg ?? runner.input_batch);
const dryRunPath = join(root, runner.dry_run_output);
const comfyUrl = process.env[runner.endpoint_env] ?? runner.default_endpoint;

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Missing file: ${path.replace(`${root}/`, '')}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function validateItem(item) {
  const missing = [];
  if (!item.id) missing.push('id');
  if (!item.tv_shot_id) missing.push('tv_shot_id');
  if (!item.inputs?.positive_prompt) missing.push('inputs.positive_prompt');
  if (!item.inputs?.negative_prompt) missing.push('inputs.negative_prompt');
  if (!item.inputs?.output_path) missing.push('inputs.output_path');
  return missing;
}

function buildQueuePreview(item) {
  return {
    client_id: 'comic-factory-dry-run',
    prompt_preview: {
      workflow_template: item.workflow_template,
      positive_prompt: item.inputs.positive_prompt,
      negative_prompt: item.inputs.negative_prompt,
      width: item.inputs.width,
      height: item.inputs.height,
      steps: item.inputs.steps,
      cfg: item.inputs.cfg,
      sampler: item.inputs.sampler,
      scheduler: item.inputs.scheduler,
      seed: item.inputs.seed,
      save_to: item.inputs.output_path
    }
  };
}

async function maybeHealthcheck() {
  if (!shouldHealthcheck) return { skipped: true, reason: 'Use --health to check ComfyUI.' };
  const url = `${comfyUrl}${runner.healthcheck.path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), runner.healthcheck.timeout_ms);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return { skipped: false, ok: response.ok, status: response.status, url };
  } catch (error) {
    clearTimeout(timeout);
    return { skipped: false, ok: false, url, error: String(error) };
  }
}

const batch = readJson(batchPath);
const items = batch.items ?? [];
const validation = items.map((item) => ({ id: item.id, missing: validateItem(item) }));
const validItems = items.filter((item) => validateItem(item).length === 0);
const healthcheck = await maybeHealthcheck();

const dryRun = {
  runner_id: runner.id,
  safe_mode: runner.safe_mode,
  endpoint: comfyUrl,
  batch_source: batchPath.replace(`${root}/`, ''),
  healthcheck,
  counts: {
    total: items.length,
    valid: validItems.length,
    invalid: items.length - validItems.length
  },
  validation,
  queue_previews: validItems.map(buildQueuePreview),
  next_step: 'Inspect this dry-run file before enabling real ComfyUI queue sending.'
};

mkdirSync(join(root, 'outputs', 'pilot', 'jobs', 'comfyui'), { recursive: true });
writeFileSync(dryRunPath, JSON.stringify(dryRun, null, 2), 'utf8');

console.log(`wrote ${runner.dry_run_output}`);
console.log(`Batch items: ${items.length}`);
console.log(`Valid items: ${validItems.length}`);
console.log(`Healthcheck: ${healthcheck.skipped ? 'skipped' : healthcheck.ok ? 'ok' : 'failed'}`);
