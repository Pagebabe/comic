import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import template from '../src/data/comfyTemplatePlaceholder.json' assert { type: 'json' };

const root = process.cwd();
const batchPath = join(root, 'outputs', 'pilot', 'jobs', 'comfyui', 'ep001_comfyui_repair_batch.json');
const previewPath = join(root, 'outputs', 'pilot', 'jobs', 'comfyui', 'ep001_comfyui_runner_dryrun.json');
const outPath = join(root, 'outputs', 'pilot', 'jobs', 'comfyui', 'ep001_comfyui_preview_check.json');

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

const batch = readJson(batchPath);
const preview = readJson(previewPath);
const items = preview?.queue_previews ?? [];

const checks = [
  { name: 'repair batch exists', ok: Boolean(batch) },
  { name: 'dry-run preview exists', ok: Boolean(preview) },
  { name: 'template placeholder exists', ok: Boolean(template?.expected_slots?.length) },
  { name: 'preview has items', ok: items.length > 0 },
  { name: 'all items have positive prompt', ok: items.every((item) => Boolean(item.prompt_preview?.positive_prompt)) },
  { name: 'all items have negative prompt', ok: items.every((item) => Boolean(item.prompt_preview?.negative_prompt)) },
  { name: 'all items have output path', ok: items.every((item) => Boolean(item.prompt_preview?.save_to)) }
];

const report = {
  id: 'comfyui_preview_check_v1',
  status: checks.every((check) => check.ok) ? 'preview_ready' : 'preview_incomplete',
  count: items.length,
  checks,
  next_step: 'Inspect the preview file and keep generated images in TV Review before assembly.'
};

mkdirSync(join(root, 'outputs', 'pilot', 'jobs', 'comfyui'), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote outputs/pilot/jobs/comfyui/ep001_comfyui_preview_check.json');
console.log(`Status: ${report.status}`);
checks.forEach((check) => console.log(`${check.ok ? 'ok' : 'missing'} - ${check.name}`));
