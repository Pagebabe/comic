import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const workflowPath = join(root, 'src', 'data', 'comfyWorkflows', 'comic_panel_clean_v1.json');
const batchPath = join(root, 'outputs', 'comfyui', 'pilot', 'pilot-comfy-batch.json');
const outRoot = join(root, 'outputs', 'checks');
const reportPath = join(outRoot, 'pilot-workflow-graph-check.json');

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function addIssue(issues, severity, code, message, itemId = null) {
  issues.push({ severity, code, message, itemId });
}

const workflow = readJson(workflowPath, 'workflow contract');
const batch = readJson(batchPath, 'Comfy batch');
const issues = [];

if (workflow.id !== 'comic_panel_clean_v1') {
  addIssue(issues, 'error', 'wrong_workflow_id', `Unexpected workflow id ${workflow.id}`);
}

if (workflow.status !== 'locked_template_contract') {
  addIssue(issues, 'error', 'workflow_not_locked', `Workflow status is ${workflow.status}`);
}

if (!Array.isArray(workflow.required_slots) || workflow.required_slots.length === 0) {
  addIssue(issues, 'error', 'missing_required_slots', 'Workflow has no required_slots');
}

const requiredSlots = new Set(workflow.required_slots ?? []);
const nodeTargets = workflow.node_targets ?? {};

for (const slot of requiredSlots) {
  if (!nodeTargets[slot]) {
    addIssue(issues, 'error', 'missing_node_target', `No node target defined for slot ${slot}`);
  }
}

if (!Array.isArray(workflow.graph_skeleton) || workflow.graph_skeleton.length < 5) {
  addIssue(issues, 'error', 'weak_graph_skeleton', 'Graph skeleton is missing or too small');
}

if (!workflow.review_required) {
  addIssue(issues, 'error', 'review_not_required', 'Workflow must require review');
}

const items = Array.isArray(batch.items) ? batch.items : [];

for (const item of items) {
  if (item.workflowTemplate !== workflow.id) {
    addIssue(
      issues,
      'error',
      'item_workflow_mismatch',
      `Item uses ${item.workflowTemplate}, expected ${workflow.id}`,
      item.id
    );
  }

  const itemSlots = Object.keys(item.workflowSlots ?? {});
  for (const slot of requiredSlots) {
    if (!itemSlots.includes(slot)) {
      addIssue(issues, 'error', 'item_missing_required_slot', `Item missing required slot ${slot}`, item.id);
    }
  }

  for (const slot of itemSlots) {
    if (!requiredSlots.has(slot)) {
      addIssue(issues, 'warning', 'item_extra_slot', `Item has extra slot ${slot}`, item.id);
    }
  }

  if (item.reviewAfterRender !== workflow.review_required) {
    addIssue(issues, 'error', 'review_requirement_mismatch', 'Item review flag does not match workflow', item.id);
  }
}

const errorCount = issues.filter((issue) => issue.severity === 'error').length;
const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

const report = {
  id: 'pilot_workflow_graph_check',
  checkedAt: new Date().toISOString(),
  workflowFile: 'src/data/comfyWorkflows/comic_panel_clean_v1.json',
  batchFile: 'outputs/comfyui/pilot/pilot-comfy-batch.json',
  workflowId: workflow.id,
  workflowStatus: workflow.status,
  itemCount: items.length,
  requiredSlotCount: requiredSlots.size,
  errorCount,
  warningCount,
  passed: errorCount === 0,
  issues
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote outputs/checks/pilot-workflow-graph-check.json');
console.log(`items: ${items.length}`);
console.log(`required slots: ${requiredSlots.size}`);
console.log(`errors: ${errorCount}`);
console.log(`warnings: ${warningCount}`);

if (errorCount > 0) {
  process.exit(1);
}
