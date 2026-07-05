import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const progressPath = join(root, 'outputs', 'pilot', 'work-packet', 'ep001_work_packet_progress.json');

function readJson(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    return null;
  }
}

if (!existsSync(progressPath)) {
  console.error('Work progress not found. Run npm run create:work-progress first.');
  process.exit(1);
}

const progress = JSON.parse(readFileSync(progressPath, 'utf8'));
const shotId = progress.shot?.tv_shot_id;

if (!shotId) {
  console.error('Progress file has no shot id.');
  process.exit(1);
}

const candidates = readJson('outputs/pilot/candidates/ep001_frame_candidates.json')?.candidates ?? [];
const qaDecisions = readJson('outputs/pilot/qa/ep001_frame_qa_decisions.json')?.decisions ?? [];
const promotions = readJson('outputs/pilot/candidates/ep001_candidate_promotions.json')?.promotions ?? [];
const episodeState = readJson('outputs/pilot/status/ep001_episode_state.json');
const framePlan = readJson('outputs/pilot/attempts/ep001_next_frame_attempts.json');
const assetIntake = readJson('outputs/pilot/intake/ep001_asset_intake.json');
const stateShot = (episodeState?.shots ?? []).find((item) => item.id === shotId);

const evidence = {
  frame_plan_exists: Boolean(framePlan),
  candidate_exists: candidates.some((item) => item.tv_shot_id === shotId),
  qa_report_exists: existsSync(join(root, 'outputs', 'pilot', 'qa', 'ep001_frame_qa.json')),
  qa_approved: qaDecisions.some((item) => item.tv_shot_id === shotId && item.decision === 'approved_candidate'),
  promoted: promotions.some((item) => item.tv_shot_id === shotId) || stateShot?.frame?.promoted === true,
  assets_refreshed: Boolean(assetIntake) || existsSync(join(root, 'public', 'previews', 'pilot', 'ep001_asset_previews.json')),
  review_approved: stateShot?.review?.status === 'approved'
};

const rules = [
  { step: 'step_01', done: evidence.frame_plan_exists, note: 'frame plan output exists' },
  { step: 'step_02', done: evidence.candidate_exists, note: 'candidate registered for shot' },
  { step: 'step_03', done: evidence.qa_report_exists, note: 'frame QA report exists' },
  { step: 'step_04', done: evidence.qa_approved, note: 'QA approved candidate' },
  { step: 'step_05', done: evidence.promoted, note: 'candidate promoted or episode state says promoted' },
  { step: 'step_06', done: evidence.assets_refreshed, note: 'asset intake or preview manifest exists' },
  { step: 'step_07', done: evidence.review_approved, note: 'review approved in episode state' }
];

const changes = [];
for (const rule of rules) {
  const step = (progress.steps ?? []).find((item) => item.id === rule.step);
  if (!step) continue;
  if (step.status === 'blocked') continue;
  if (rule.done && step.status !== 'done') {
    step.status = 'done';
    step.note = step.note ? `${step.note}; auto: ${rule.note}` : `auto: ${rule.note}`;
    step.updated_at = new Date().toISOString();
    changes.push(`${rule.step} -> done`);
  }
}

const done = progress.steps.filter((item) => item.status === 'done').length;
const open = progress.steps.filter((item) => item.status === 'open').length;
const blocked = progress.steps.filter((item) => item.status === 'blocked').length;
const overallStatus = blocked > 0 ? 'blocked' : done === progress.steps.length ? 'done' : 'open';

progress.counts = {
  total: progress.steps.length,
  done,
  open,
  blocked
};
progress.overall_status = overallStatus;
progress.current_step = progress.steps.find((item) => item.status !== 'done') ?? null;
progress.next_command = progress.current_step?.command ?? 'npm run studio:next';
progress.auto_sync = {
  synced_at: new Date().toISOString(),
  evidence,
  changes
};
progress.updated_at = new Date().toISOString();

writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf8');
console.log('synced outputs/pilot/work-packet/ep001_work_packet_progress.json');
console.log(`Changes: ${changes.length}`);
for (const change of changes) console.log(`- ${change}`);
console.log(`Progress: ${done}/${progress.steps.length}`);
console.log(`Status: ${overallStatus}`);
console.log(`Next: ${progress.next_command}`);
