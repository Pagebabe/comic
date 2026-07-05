import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reviewRoot = join(root, 'outputs', 'review', 'pilot');
const panelId = process.argv[2];
const decision = process.argv[3];
const note = process.argv.slice(4).join(' ').trim();
const reviewer = process.env.REVIEWER ?? process.env.USER ?? 'local_reviewer';
const allowedDecisions = ['approved', 'needs_fix', 'retry', 'rejected'];

function usage() {
  console.error('Usage: node scripts/setPilotReviewDecision.mjs <panelId> <approved|needs_fix|retry|rejected> [note]');
  console.error('Example: node scripts/setPilotReviewDecision.mjs panel_001 approved');
  console.error('Example: node scripts/setPilotReviewDecision.mjs panel_001 needs_fix "face inconsistent"');
}

if (!panelId || !decision) {
  usage();
  process.exit(1);
}

if (!allowedDecisions.includes(decision)) {
  console.error(`Invalid decision: ${decision}`);
  console.error(`Allowed: ${allowedDecisions.join(', ')}`);
  process.exit(1);
}

const manifestPath = join(reviewRoot, `${panelId}.json`);
const indexPath = join(reviewRoot, 'index.json');
const decisionLogPath = join(reviewRoot, 'decision-log.json');

function readJson(path, fallback = null) {
  if (!existsSync(path)) {
    if (fallback !== null) return fallback;
    console.error(`Missing file: ${path.replace(`${root}/`, '')}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function statusForDecision(value) {
  if (value === 'approved') return 'approved';
  if (value === 'needs_fix') return 'needs_fix';
  if (value === 'retry') return 'retry_requested';
  return 'rejected';
}

function nextActionForDecision(value) {
  if (value === 'approved') return 'Move panel toward final assembly.';
  if (value === 'needs_fix') return 'Create a fix job from this review manifest.';
  if (value === 'retry') return 'Queue a fresh render attempt for this panel.';
  return 'Do not use this render; keep for audit only.';
}

const manifest = readJson(manifestPath);
const index = readJson(indexPath, {
  id: 'pilot_review_manifest_index',
  createdAt: new Date().toISOString(),
  outputRoot: 'outputs/review/pilot',
  items: []
});
const log = readJson(decisionLogPath, {
  id: 'pilot_review_decision_log',
  createdAt: new Date().toISOString(),
  items: []
});

const decidedAt = new Date().toISOString();
const decisionEntry = {
  panelId,
  decision,
  note,
  reviewer,
  decidedAt,
  manifestFile: `outputs/review/pilot/${panelId}.json`
};

const updatedManifest = {
  ...manifest,
  status: statusForDecision(decision),
  decision,
  reviewer,
  reviewedAt: decidedAt,
  reviewNote: note,
  decisionHistory: [...(manifest.decisionHistory ?? []), decisionEntry],
  nextAction: nextActionForDecision(decision)
};

const indexItems = Array.isArray(index.items) ? index.items : [];
const existingIndexItem = indexItems.find((item) => item.panelId === panelId);
const updatedIndexItem = {
  panelId,
  promptId: updatedManifest.promptId ?? existingIndexItem?.promptId ?? null,
  status: updatedManifest.status,
  decision: updatedManifest.decision,
  primaryImage: updatedManifest.primaryImage ?? existingIndexItem?.primaryImage ?? null,
  manifestFile: `outputs/review/pilot/${panelId}.json`,
  reviewedAt: decidedAt,
  reviewer,
  note
};

const updatedIndex = {
  ...index,
  updatedAt: decidedAt,
  items: existingIndexItem
    ? indexItems.map((item) => (item.panelId === panelId ? updatedIndexItem : item))
    : [...indexItems, updatedIndexItem]
};

const updatedLog = {
  ...log,
  updatedAt: decidedAt,
  items: [...(Array.isArray(log.items) ? log.items : []), decisionEntry]
};

mkdirSync(reviewRoot, { recursive: true });
writeFileSync(manifestPath, JSON.stringify(updatedManifest, null, 2), 'utf8');
writeFileSync(indexPath, JSON.stringify(updatedIndex, null, 2), 'utf8');
writeFileSync(decisionLogPath, JSON.stringify(updatedLog, null, 2), 'utf8');

console.log(`updated outputs/review/pilot/${panelId}.json`);
console.log(`decision: ${decision}`);
console.log(`status: ${updatedManifest.status}`);
console.log(`next: ${updatedManifest.nextAction}`);
