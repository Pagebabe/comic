import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const batchPath = join(root, 'outputs', 'comfyui', 'pilot-fixes', 'pilot-fix-comfy-batch.json');
const outRoot = join(root, 'outputs', 'checks');
const reportPath = join(outRoot, 'pilot-fix-comfy-batch-check.json');

const requiredWorkflowSlots = [
  'positive_prompt',
  'negative_prompt',
  'width',
  'height',
  'seed',
  'steps',
  'cfg',
  'sampler',
  'scheduler',
  'output_path'
];

const requiredMetadata = [
  'episodeId',
  'panelId',
  'sourceFixJobId',
  'sourceManifest',
  'decision',
  'reviewNote',
  'attempt',
  'reviewTarget'
];

function addIssue(issues, severity, code, message, itemId = null) {
  issues.push({ severity, code, message, itemId });
}

if (!existsSync(batchPath)) {
  console.error('Missing outputs/comfyui/pilot-fixes/pilot-fix-comfy-batch.json');
  console.error('Run first: node scripts/createPilotFixJobs.mjs');
  console.error('Then run: node scripts/createPilotFixRenderQueue.mjs');
  console.error('Then run: node scripts/createPilotFixComfyBatch.mjs');
  process.exit(1);
}

const batch = JSON.parse(readFileSync(batchPath, 'utf8'));
const issues = [];
const items = Array.isArray(batch.items) ? batch.items : [];

if (batch.id !== 'rico_gegen_berlin_pilot_fix_comfy_batch') {
  addIssue(issues, 'error', 'wrong_batch_id', `Unexpected batch id ${batch.id}`);
}

if (batch.mode !== 'plan_only_fix_pass') {
  addIssue(issues, 'error', 'wrong_batch_mode', `Unexpected batch mode ${batch.mode}`);
}

if (batch.itemCount !== items.length) {
  addIssue(issues, 'error', 'item_count_mismatch', `itemCount says ${batch.itemCount} but items has ${items.length}`);
}

const ids = new Set();
const outputPaths = new Set();
const sourceFixJobIds = new Set();

for (const item of items) {
  if (!item.id) {
    addIssue(issues, 'error', 'missing_id', 'Item has no id');
  } else if (ids.has(item.id)) {
    addIssue(issues, 'error', 'duplicate_id', `Duplicate item id ${item.id}`, item.id);
  } else {
    ids.add(item.id);
  }

  if (item.status !== 'planned') {
    addIssue(issues, 'warning', 'unexpected_status', `Expected status planned but got ${item.status}`, item.id);
  }

  if (item.workflowTemplate !== 'comic_panel_clean_v1') {
    addIssue(issues, 'error', 'wrong_workflow_template', `Expected comic_panel_clean_v1 but got ${item.workflowTemplate}`, item.id);
  }

  const slots = item.workflowSlots ?? {};
  for (const slot of requiredWorkflowSlots) {
    if (slots[slot] === undefined || slots[slot] === null || slots[slot] === '') {
      addIssue(issues, 'error', 'missing_workflow_slot', `Missing workflow slot ${slot}`, item.id);
    }
  }

  if (typeof slots.positive_prompt === 'string' && !slots.positive_prompt.includes('FIX PASS:')) {
    addIssue(issues, 'error', 'missing_fix_pass_marker', 'Positive prompt does not include FIX PASS marker', item.id);
  }

  if (typeof slots.negative_prompt === 'string') {
    for (const term of ['readable text', 'speech bubbles', 'watermark']) {
      if (!slots.negative_prompt.toLowerCase().includes(term)) {
        addIssue(issues, 'warning', 'weak_negative_prompt', `Negative prompt does not include ${term}`, item.id);
      }
    }
  }

  if (slots.output_path) {
    if (outputPaths.has(slots.output_path)) {
      addIssue(issues, 'error', 'duplicate_output_path', `Duplicate output path ${slots.output_path}`, item.id);
    } else {
      outputPaths.add(slots.output_path);
    }

    if (!String(slots.output_path).includes('/fixes/')) {
      addIssue(issues, 'error', 'output_not_in_fixes_folder', `Fix output path must include /fixes/: ${slots.output_path}`, item.id);
    }

    if (!String(slots.output_path).endsWith('.png')) {
      addIssue(issues, 'warning', 'output_not_png', `Output path is not png: ${slots.output_path}`, item.id);
    }
  }

  const metadata = item.metadata ?? {};
  for (const key of requiredMetadata) {
    if (metadata[key] === undefined || metadata[key] === null || metadata[key] === '') {
      addIssue(issues, 'error', 'missing_metadata', `Missing metadata.${key}`, item.id);
    }
  }

  if (metadata.sourceFixJobId) {
    if (sourceFixJobIds.has(metadata.sourceFixJobId)) {
      addIssue(issues, 'warning', 'duplicate_source_fix_job_id', `Duplicate sourceFixJobId ${metadata.sourceFixJobId}`, item.id);
    } else {
      sourceFixJobIds.add(metadata.sourceFixJobId);
    }
  }

  if (!['needs_fix', 'retry'].includes(metadata.decision)) {
    addIssue(issues, 'error', 'invalid_fix_decision', `Fix decision must be needs_fix or retry but got ${metadata.decision}`, item.id);
  }

  if (typeof metadata.attempt !== 'number' || metadata.attempt < 2) {
    addIssue(issues, 'error', 'invalid_attempt', `Fix attempt must be number >= 2 but got ${metadata.attempt}`, item.id);
  }

  if (!item.reviewAfterRender) {
    addIssue(issues, 'error', 'review_not_required', 'reviewAfterRender must be true', item.id);
  }

  if (!Array.isArray(item.reviewChecks) || !item.reviewChecks.includes('review_note_resolved')) {
    addIssue(issues, 'error', 'missing_review_note_check', 'Fix review checks must include review_note_resolved', item.id);
  }
}

const errorCount = issues.filter((issue) => issue.severity === 'error').length;
const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

const report = {
  id: 'pilot_fix_comfy_batch_check',
  checkedAt: new Date().toISOString(),
  batchFile: 'outputs/comfyui/pilot-fixes/pilot-fix-comfy-batch.json',
  itemCount: items.length,
  uniqueIds: ids.size,
  uniqueOutputPaths: outputPaths.size,
  uniqueSourceFixJobIds: sourceFixJobIds.size,
  errorCount,
  warningCount,
  passed: errorCount === 0,
  issues
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote outputs/checks/pilot-fix-comfy-batch-check.json');
console.log(`items: ${items.length}`);
console.log(`errors: ${errorCount}`);
console.log(`warnings: ${warningCount}`);

if (errorCount > 0) {
  process.exit(1);
}
