import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const statePath = join(root, 'outputs', 'pilot', 'status', 'ep001_episode_state.json');
const outputPath = join(root, 'outputs', 'pilot', 'status', 'ep001_episode_state_check.json');

if (!existsSync(statePath)) {
  console.error('Episode state not found. Run npm run create:episode-state first.');
  process.exit(1);
}

const state = JSON.parse(readFileSync(statePath, 'utf8'));
const issues = [];
const warnings = [];

for (const shot of state.shots ?? []) {
  const ref = {
    tv_shot_id: shot.id,
    scene_id: shot.scene_id,
    title: shot.title
  };

  if (shot.review.status === 'approved' && !shot.review.asset_exists) {
    issues.push({
      ...ref,
      code: 'approved_asset_missing',
      message: 'Review is approved but the official keyframe file is missing.',
      command: shot.next_command ?? `npm run promote:candidate -- ${shot.id}`
    });
  }

  if (shot.frame.promoted && !shot.review.asset_exists) {
    issues.push({
      ...ref,
      code: 'promoted_asset_missing',
      message: 'Frame is promoted but the official target file is missing.',
      command: `npm run promote:candidate -- ${shot.id}`
    });
  }

  if (shot.frame.latest_qa_decision === 'approved_candidate' && !shot.frame.promoted) {
    warnings.push({
      ...ref,
      code: 'approved_candidate_not_promoted',
      message: 'QA approved a candidate but it has not been promoted to the official keyframe target.',
      command: `npm run promote:candidate -- ${shot.id}`
    });
  }

  if (shot.review.asset_exists && shot.review.status !== 'approved') {
    warnings.push({
      ...ref,
      code: 'official_file_waiting_for_review',
      message: 'Official keyframe file exists but review status is not approved.',
      command: `npm run review:set -- approved ${shot.id} ${shot.review.asset_target} "approved"`
    });
  }

  if (shot.readiness.ready_for_motion && shot.fix_queue) {
    warnings.push({
      ...ref,
      code: 'ready_but_fix_queue_present',
      message: 'Shot looks ready for motion but still has a fix queue entry.',
      command: 'review nextFixQueue.json and remove stale item if intentional'
    });
  }

  if (shot.frame.candidate_count > 0 && !shot.frame.latest_qa_decision) {
    warnings.push({
      ...ref,
      code: 'candidate_without_qa_decision',
      message: 'Candidates exist but no QA decision has been recorded.',
      command: `npm run qa:set -- ${shot.id} approved_candidate 80 "checked"`
    });
  }
}

const report = {
  id: 'episode_state_check_v1',
  episode_id: state.episode_id ?? 'ep001',
  created_at: new Date().toISOString(),
  ok: issues.length === 0,
  counts: {
    issues: issues.length,
    warnings: warnings.length,
    shots_checked: state.shots?.length ?? 0
  },
  issues,
  warnings,
  next_command: issues[0]?.command ?? warnings[0]?.command ?? 'npm run studio:next',
  next_message: issues[0]?.message ?? warnings[0]?.message ?? 'Episode state is internally consistent.'
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
console.log('wrote outputs/pilot/status/ep001_episode_state_check.json');
console.log(`Issues: ${issues.length}`);
console.log(`Warnings: ${warnings.length}`);
console.log(report.next_message);
if (!report.ok) process.exitCode = 1;
