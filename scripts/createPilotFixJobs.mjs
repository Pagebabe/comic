import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const reviewRoot = join(root, 'outputs', 'review', 'pilot');
const decisionLogPath = join(reviewRoot, 'decision-log.json');
const promptPackPath = join(root, 'outputs', 'prompt-packs', 'pilot-prompts.json');
const outRoot = join(root, 'outputs', 'fix-jobs', 'pilot');
const indexPath = join(outRoot, 'index.json');
const actionableDecisions = new Set(['needs_fix', 'retry']);

function readJson(path, fallback = null) {
  if (!existsSync(path)) {
    if (fallback !== null) return fallback;
    console.error(`Missing file: ${path.replace(`${root}/`, '')}`);
    console.error('Run first: node scripts/setPilotReviewDecision.mjs <panelId> needs_fix "note"');
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function latestDecisionByPanel(logItems) {
  const latest = new Map();
  for (const item of logItems) {
    latest.set(item.panelId, item);
  }
  return latest;
}

function safeSlug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'fix';
}

function jobTypeForDecision(decision) {
  return decision === 'retry' ? 'fresh_retry_render' : 'targeted_fix_render';
}

function instructionForDecision(decision, note) {
  if (decision === 'retry') {
    return [
      'Create a fresh render attempt for this panel.',
      'Keep the original story intent and composition readable.',
      note ? `Reviewer note: ${note}` : null
    ].filter(Boolean).join(' ');
  }

  return [
    'Repair the previous render according to the reviewer note.',
    'Preserve character identity, location continuity and panel action.',
    note ? `Reviewer note: ${note}` : null
  ].filter(Boolean).join(' ');
}

const decisionLog = readJson(decisionLogPath);
const promptPack = readJson(promptPackPath, []);
const promptByPanel = new Map(Array.isArray(promptPack) ? promptPack.map((item) => [item.panelId, item]) : []);
const logItems = Array.isArray(decisionLog.items) ? decisionLog.items : [];
const latest = latestDecisionByPanel(logItems);

const candidates = [...latest.values()].filter((item) => actionableDecisions.has(item.decision));
const jobs = candidates.map((decisionItem, index) => {
  const manifestPath = join(root, decisionItem.manifestFile ?? `outputs/review/pilot/${decisionItem.panelId}.json`);
  const manifest = existsSync(manifestPath) ? readJson(manifestPath) : null;
  const promptItem = promptByPanel.get(decisionItem.panelId);
  const attempt = (manifest?.fixHistory?.length ?? 0) + 1;
  const jobId = `fix_${decisionItem.panelId}_${safeSlug(decisionItem.decision)}_${String(attempt).padStart(2, '0')}`;

  return {
    id: jobId,
    priority: index + 1,
    status: 'queued',
    taskType: jobTypeForDecision(decisionItem.decision),
    episodeId: 'episode_001',
    panelId: decisionItem.panelId,
    decision: decisionItem.decision,
    reviewer: decisionItem.reviewer ?? null,
    reviewNote: decisionItem.note ?? '',
    sourceManifest: decisionItem.manifestFile ?? `outputs/review/pilot/${decisionItem.panelId}.json`,
    sourceImage: manifest?.primaryImage ?? null,
    sourcePromptId: manifest?.promptId ?? promptItem?.promptId ?? null,
    attempt,
    instruction: instructionForDecision(decisionItem.decision, decisionItem.note),
    originalPrompt: promptItem?.prompt ?? null,
    originalDialogue: promptItem?.dialogue ?? null,
    originalVisualDescription: promptItem?.visualDescription ?? null,
    originalAction: promptItem?.action ?? null,
    outputTarget: `outputs/renders/pilot/fixes/${decisionItem.panelId}/${jobId}.png`,
    reviewTarget: `outputs/review/pilot/${decisionItem.panelId}.json`,
    required: [
      'same character identity',
      'same location continuity',
      'clean comic frame',
      'no readable text in image',
      'no speech bubbles inside image'
    ],
    forbidden: [
      'watermark',
      'logo',
      'broken face',
      'distorted hands',
      'random extra characters',
      'photorealism'
    ],
    createdFromDecision: {
      decidedAt: decisionItem.decidedAt,
      note: decisionItem.note,
      decision: decisionItem.decision
    }
  };
});

mkdirSync(outRoot, { recursive: true });

const indexItems = jobs.map((job) => {
  const path = `outputs/fix-jobs/pilot/${job.id}.json`;
  writeFileSync(join(root, path), JSON.stringify(job, null, 2), 'utf8');
  return {
    id: job.id,
    panelId: job.panelId,
    priority: job.priority,
    decision: job.decision,
    status: job.status,
    path
  };
});

const index = {
  id: 'pilot_fix_job_index',
  createdAt: new Date().toISOString(),
  sourceDecisionLog: 'outputs/review/pilot/decision-log.json',
  actionableDecisions: [...actionableDecisions],
  candidateCount: candidates.length,
  jobCount: jobs.length,
  outputRoot: 'outputs/fix-jobs/pilot',
  jobs: indexItems,
  nextStep: jobs.length > 0
    ? 'Convert fix jobs into prompt/render queue items.'
    : 'No needs_fix or retry decisions found yet.'
};

writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

console.log('wrote outputs/fix-jobs/pilot/index.json');
console.log(`fix jobs: ${jobs.length}`);
for (const item of indexItems) {
  console.log(`- ${item.path}`);
}
