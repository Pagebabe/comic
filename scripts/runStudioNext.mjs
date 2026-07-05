import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const root = process.cwd();
const outputPath = join(root, 'outputs', 'pilot', 'status', 'ep001_studio_next.json');

function run(id, script) {
  const result = spawnSync('node', [script], {
    cwd: root,
    encoding: 'utf8',
    shell: true
  });
  return {
    id,
    script,
    ok: (result.status ?? 0) === 0,
    status_code: result.status ?? 0,
    stdout: (result.stdout ?? '').trim().split('\n').filter(Boolean).slice(-5),
    stderr: (result.stderr ?? '').trim().split('\n').filter(Boolean).slice(-5)
  };
}

function readJson(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    return null;
  }
}

const baseRuns = [
  run('studio_status', 'scripts/createStudioStatus.mjs'),
  run('pilot_step', 'scripts/createPilotStepReport.mjs'),
  run('queue_health', 'scripts/checkQueueHealth.mjs'),
  run('frame_qa', 'scripts/createFrameQaReport.mjs'),
  run('frame_plan', 'scripts/createNextFrameAttempt.mjs'),
  run('frame_lifecycle', 'scripts/createFrameLifecycle.mjs'),
  run('episode_state', 'scripts/createEpisodeState.mjs')
];

const pilotStep = readJson('outputs/pilot/status/ep001_pilot_step.json');
const episodeState = readJson('outputs/pilot/status/ep001_episode_state.json');
const lifecycle = readJson('outputs/pilot/status/ep001_frame_lifecycle.json');
const currentStep = pilotStep?.current_step ?? null;
const nextShot = episodeState?.next_shot ?? lifecycle?.next_item ?? null;
const plannedRuns = [];

if (nextShot?.next_command && nextShot.next_command !== 'none') {
  plannedRuns.push({ id: 'next_shot_command', action: 'follow_episode_state', command: nextShot.next_command });
}

if (currentStep?.type === 'approved_missing_file') {
  plannedRuns.push({ id: 'asset_path_needed', action: 'place_missing_approved_file', command: currentStep.command });
} else if (currentStep?.type === 'first_fix_queue_item' || currentStep?.type === 'queued_keyframe') {
  plannedRuns.push({ id: 'frame_plan', action: 'use_next_frame_plan', command: 'npm run create:frame-plan' });
  plannedRuns.push({ id: 'prompt_files', action: 'refresh_prompt_files', command: 'npm run create:prompt-files' });
} else if (currentStep?.type === 'motion_plan') {
  plannedRuns.push({ id: 'motion_jobs', action: 'create_motion_jobs', command: 'npm run create:motion-jobs' });
  plannedRuns.push({ id: 'camera_notes', action: 'create_camera_notes', command: 'npm run create:camera-notes' });
} else if (currentStep?.type === 'assembly_plan') {
  plannedRuns.push({ id: 'assembly_package', action: 'create_assembly_package', command: 'npm run create:assembly-package' });
  plannedRuns.push({ id: 'remotion_plan', action: 'create_remotion_plan', command: 'npm run create:remotion-plan' });
}

const uniquePlannedRuns = plannedRuns.filter((item, index, all) => all.findIndex((other) => other.command === item.command) === index);

const report = {
  id: 'studio_next_v2',
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  current_step: currentStep,
  episode_state: {
    overall_status: episodeState?.overall_status ?? 'unknown',
    counts: episodeState?.counts ?? null,
    next_shot: nextShot
  },
  base_runs: baseRuns,
  planned_runs: uniquePlannedRuns,
  open_routes: [
    '#/studio-next',
    '#/episode-state',
    '#/frame-lifecycle',
    '#/studio-status',
    '#/pilot-step',
    '#/frame-plan',
    '#/frame-registry',
    '#/asset-gallery'
  ],
  next_message: nextShot?.title ?? currentStep?.title ?? 'No current step found.'
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote outputs/pilot/status/ep001_studio_next.json');
console.log(`Current step: ${currentStep?.type ?? 'unknown'}`);
console.log(`Episode: ${report.episode_state.overall_status}`);
console.log(report.next_message);
if (uniquePlannedRuns.length > 0) {
  console.log('Suggested commands:');
  for (const item of uniquePlannedRuns) console.log(`- ${item.command}`);
}
