import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const batchPath = join(root, 'outputs', 'comfyui', 'pilot', 'pilot-comfy-batch.json');
const outRoot = join(root, 'outputs', 'checks');
const reportPath = join(outRoot, 'pilot-comfy-batch-check.json');

const expectedItemCount = 30;
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

function addIssue(issues, severity, code, message, itemId = null) {
  issues.push({ severity, code, message, itemId });
}

if (!existsSync(batchPath)) {
  console.error('Missing outputs/comfyui/pilot/pilot-comfy-batch.json');
  console.error('Run first: node scripts/createPilotPromptPack.mjs');
  console.error('Then run: node scripts/createPilotRenderQueue.mjs');
  console.error('Then run: node scripts/createPilotComfyBatch.mjs');
  process.exit(1);
}

const batch = JSON.parse(readFileSync(batchPath, 'utf8'));
const issues = [];
const items = Array.isArray(batch.items) ? batch.items : [];

if (items.length !== expectedItemCount) {
  addIssue(
    issues,
    'error',
    'wrong_item_count',
    `Expected ${expectedItemCount} items but found ${items.length}`
  );
}

const ids = new Set();
const panelIds = new Set();
const outputPaths = new Set();
const priorities = new Set();

for (const item of items) {
  if (!item.id) {
    addIssue(issues, 'error', 'missing_id', 'Item has no id');
  } else if (ids.has(item.id)) {
    addIssue(issues, 'error', 'duplicate_id', `Duplicate item id ${item.id}`, item.id);
  } else {
    ids.add(item.id);
  }

  if (!item.metadata?.panelId) {
    addIssue(issues, 'error', 'missing_panel_id', 'Item has no metadata.panelId', item.id);
  } else if (panelIds.has(item.metadata.panelId)) {
    addIssue(issues, 'error', 'duplicate_panel_id', `Duplicate panel id ${item.metadata.panelId}`, item.id);
  } else {
    panelIds.add(item.metadata.panelId);
  }

  if (typeof item.priority !== 'number') {
    addIssue(issues, 'error', 'missing_priority', 'Item priority is not a number', item.id);
  } else if (priorities.has(item.priority)) {
    addIssue(issues, 'error', 'duplicate_priority', `Duplicate priority ${item.priority}`, item.id);
  } else {
    priorities.add(item.priority);
  }

  if (item.status !== 'planned') {
    addIssue(issues, 'warning', 'unexpected_status', `Expected status planned but got ${item.status}`, item.id);
  }

  if (!item.workflowTemplate) {
    addIssue(issues, 'error', 'missing_workflow_template', 'Missing workflowTemplate', item.id);
  }

  const slots = item.workflowSlots ?? {};
  for (const slot of requiredWorkflowSlots) {
    if (slots[slot] === undefined || slots[slot] === null || slots[slot] === '') {
      addIssue(issues, 'error', 'missing_workflow_slot', `Missing workflow slot ${slot}`, item.id);
    }
  }

  if (typeof slots.positive_prompt === 'string' && slots.positive_prompt.length < 200) {
    addIssue(issues, 'warning', 'short_positive_prompt', 'Positive prompt looks too short', item.id);
  }

  if (typeof slots.negative_prompt === 'string') {
    const lowerNegative = slots.negative_prompt.toLowerCase();
    for (const requiredTerm of ['speech bubbles', 'readable text', 'watermark']) {
      if (!lowerNegative.includes(requiredTerm)) {
        addIssue(issues, 'warning', 'weak_negative_prompt', `Negative prompt does not include ${requiredTerm}`, item.id);
      }
    }
  }

  if (slots.output_path) {
    if (outputPaths.has(slots.output_path)) {
      addIssue(issues, 'error', 'duplicate_output_path', `Duplicate output path ${slots.output_path}`, item.id);
    } else {
      outputPaths.add(slots.output_path);
    }

    if (!String(slots.output_path).endsWith('.png')) {
      addIssue(issues, 'warning', 'output_not_png', `Output path is not png: ${slots.output_path}`, item.id);
    }
  }

  if (!item.reviewAfterRender) {
    addIssue(issues, 'error', 'review_not_required', 'reviewAfterRender must be true', item.id);
  }

  if (!item.metadata?.reviewTarget) {
    addIssue(issues, 'error', 'missing_review_target', 'Missing metadata.reviewTarget', item.id);
  }

  if (!Array.isArray(item.reviewChecks) || item.reviewChecks.length < 4) {
    addIssue(issues, 'error', 'missing_review_checks', 'Review checks are missing or too short', item.id);
  }
}

const errorCount = issues.filter((issue) => issue.severity === 'error').length;
const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

const report = {
  id: 'pilot_comfy_batch_check',
  checkedAt: new Date().toISOString(),
  batchFile: 'outputs/comfyui/pilot/pilot-comfy-batch.json',
  itemCount: items.length,
  expectedItemCount,
  uniqueIds: ids.size,
  uniquePanelIds: panelIds.size,
  uniqueOutputPaths: outputPaths.size,
  errorCount,
  warningCount,
  passed: errorCount === 0,
  issues
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`wrote outputs/checks/pilot-comfy-batch-check.json`);
console.log(`items: ${items.length}`);
console.log(`errors: ${errorCount}`);
console.log(`warnings: ${warningCount}`);

if (errorCount > 0) {
  process.exit(1);
}
