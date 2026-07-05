import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const root = process.cwd();
const outputPath = join(root, 'outputs', 'pilot', 'status', 'ep001_studio_status.json');

const steps = [
  { id: 'asset_intake', script: 'scripts/createAssetIntake.mjs', required: false },
  { id: 'preview_sync', script: 'scripts/syncAssetPreviews.mjs', required: false },
  { id: 'review_summary', script: 'scripts/createReviewSummary.mjs', required: false },
  { id: 'pipeline_overview', script: 'scripts/createPipelineOverview.mjs', required: false },
  { id: 'pilot_step', script: 'scripts/createPilotStepReport.mjs', required: false },
  { id: 'pilot_ready', script: 'scripts/checkAssemblyGate.mjs', required: false },
  { id: 'motion_jobs', script: 'scripts/createMotionJobs.mjs', required: false },
  { id: 'camera_notes', script: 'scripts/createMotionTextFiles.mjs', required: false }
];

function readJson(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    return null;
  }
}

const results = steps.map((step) => {
  const result = spawnSync('node', [step.script], {
    cwd: root,
    encoding: 'utf8',
    shell: true
  });

  return {
    id: step.id,
    script: step.script,
    required: step.required,
    status_code: result.status ?? 0,
    ok: (result.status ?? 0) === 0,
    stdout: (result.stdout ?? '').trim().split('\n').filter(Boolean).slice(-6),
    stderr: (result.stderr ?? '').trim().split('\n').filter(Boolean).slice(-6)
  };
});

const reviewSummary = readJson('outputs/pilot/status/ep001_review_summary.json');
const pipelineOverview = readJson('outputs/pilot/status/ep001_pipeline_overview.json');
const pilotStep = readJson('outputs/pilot/status/ep001_pilot_step.json');
const pilotReady = readJson('outputs/pilot/status/ep001_assembly_gate.json');
const motionJobs = readJson('outputs/pilot/jobs/motion/ep001_motion_jobs.json');

const status = {
  id: 'studio_status_v1',
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  run_ok: results.every((item) => item.ok || !item.required),
  results,
  summary: {
    review_counts: reviewSummary?.counts ?? null,
    pipeline_status: pipelineOverview?.status ?? null,
    pipeline_next_step: pipelineOverview?.next_step ?? null,
    current_step: pilotStep?.current_step ?? null,
    pilot_ready: pilotReady?.ready_for_assembly ?? false,
    pilot_ready_blocked_count: pilotReady?.blocked_count ?? null,
    motion_queued: motionJobs?.queued_for_motion ?? null,
    motion_blocked: motionJobs?.blocked ?? null
  },
  recommended_open_routes: [
    '#/pilot-step',
    '#/pilot-control',
    '#/asset-gallery',
    '#/pipeline-status',
    '#/motion-jobs'
  ]
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(status, null, 2), 'utf8');

console.log('wrote outputs/pilot/status/ep001_studio_status.json');
console.log(`Pilot ready: ${status.summary.pilot_ready}`);
console.log(`Current step: ${status.summary.current_step?.type ?? 'unknown'}`);
if (status.summary.current_step?.title) {
  console.log(status.summary.current_step.title);
}
