import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const packetPath = join(root, 'outputs', 'pilot', 'work-packet', 'ep001_next_work_packet.json');
const progressPath = join(root, 'outputs', 'pilot', 'work-packet', 'ep001_work_packet_progress.json');
const outputPath = join(root, 'outputs', 'pilot', 'work-packet', 'ep001_work_packet_check.json');

function readJson(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    return null;
  }
}

if (!existsSync(packetPath)) {
  console.error('Next work packet not found. Run npm run create:work-packet first.');
  process.exit(1);
}

if (!existsSync(progressPath)) {
  console.error('Work progress not found. Run npm run create:work-progress first.');
  process.exit(1);
}

const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
const progress = JSON.parse(readFileSync(progressPath, 'utf8'));
const shotId = packet.shot?.tv_shot_id;
const progressShotId = progress.shot?.tv_shot_id;

const candidates = readJson('outputs/pilot/candidates/ep001_frame_candidates.json')?.candidates ?? [];
const qaReport = readJson('outputs/pilot/qa/ep001_frame_qa.json');
const qaDecisions = readJson('outputs/pilot/qa/ep001_frame_qa_decisions.json')?.decisions ?? [];
const promotions = readJson('outputs/pilot/candidates/ep001_candidate_promotions.json')?.promotions ?? [];
const episodeState = readJson('outputs/pilot/status/ep001_episode_state.json');
const framePlan = readJson('outputs/pilot/attempts/ep001_next_frame_attempts.json');
const assetIntake = readJson('outputs/pilot/intake/ep001_asset_intake.json');
const previewManifestExists = existsSync(join(root, 'public', 'previews', 'pilot', 'ep001_asset_previews.json'));
const stateShot = (episodeState?.shots ?? []).find((item) => item.id === shotId);

const evidence = {
  frame_plan_exists: Boolean(framePlan),
  candidate_exists: candidates.some((item) => item.tv_shot_id === shotId),
  qa_report_has_shot: (qaReport?.qa_items ?? []).some((item) => item.tv_shot_id === shotId),
  qa_approved: qaDecisions.some((item) => item.tv_shot_id === shotId && item.decision === 'approved_candidate'),
  promoted: promotions.some((item) => item.tv_shot_id === shotId) || stateShot?.frame?.promoted === true,
  assets_refreshed: Boolean(assetIntake) || previewManifestExists,
  review_approved: stateShot?.review?.status === 'approved'
};

const expected = {
  step_01: evidence.frame_plan_exists,
  step_02: evidence.candidate_exists,
  step_03: evidence.qa_report_has_shot,
  step_04: evidence.qa_approved,
  step_05: evidence.promoted,
  step_06: evidence.assets_refreshed,
  step_07: evidence.review_approved,
  step_08: true
};

const issues = [];
const warnings = [];

if (shotId !== progressShotId) {
  issues.push({
    code: 'packet_progress_shot_mismatch',
    message: 'The work packet shot and progress shot do not match.',
    packet_shot_id: shotId,
    progress_shot_id: progressShotId,
    command: 'npm run create:work-progress'
  });
}

for (const step of progress.steps ?? []) {
  const isExpected = expected[step.id];
  if (step.status === 'done' && isExpected === false) {
    issues.push({
      code: 'step_done_without_evidence',
      step_id: step.id,
      message: 'Step is marked done but required evidence is missing.',
      command: `npm run work:step -- ${step.id} open "reset: missing evidence"`
    });
  }
  if (step.status === 'open' && isExpected === true && step.id !== 'step_08') {
    warnings.push({
      code: 'step_open_but_evidence_exists',
      step_id: step.id,
      message: 'Step is open but evidence exists. Run sync to auto-mark it.',
      command: 'npm run sync:work-progress'
    });
  }
  if (step.status === 'blocked' && isExpected === true) {
    warnings.push({
      code: 'step_blocked_but_evidence_exists',
      step_id: step.id,
      message: 'Step is blocked even though evidence exists. Review manually before reopening.',
      command: `npm run work:step -- ${step.id} done "evidence exists"`
    });
  }
}

const done = (progress.steps ?? []).filter((step) => step.status === 'done').length;
const report = {
  id: 'work_packet_check_v1',
  episode_id: packet.episode_id ?? 'ep001',
  created_at: new Date().toISOString(),
  ok: issues.length === 0,
  shot_id: shotId,
  counts: {
    issues: issues.length,
    warnings: warnings.length,
    steps: progress.steps?.length ?? 0,
    done
  },
  evidence,
  issues,
  warnings,
  next_command: issues[0]?.command ?? warnings[0]?.command ?? progress.next_command ?? 'npm run studio:next',
  next_message: issues[0]?.message ?? warnings[0]?.message ?? 'Work progress is consistent with current evidence.'
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
console.log('wrote outputs/pilot/work-packet/ep001_work_packet_check.json');
console.log(`Issues: ${issues.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(report.next_message);
if (!report.ok) process.exitCode = 1;
