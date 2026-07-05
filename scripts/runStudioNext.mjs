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
  run('episode_state', 'scripts/createEpisodeState.mjs'),
  run('episode_state_check', 'scripts/checkEpisodeState.mjs'),
  run('work_packet', 'scripts/createNextWorkPacket.mjs'),
  run('work_progress', 'scripts/createWorkPacketProgress.mjs'),
  run('work_progress_sync', 'scripts/syncWorkPacketProgress.mjs'),
  run('work_progress_check', 'scripts/checkWorkPacketProgress.mjs')
];

const pilotStep = readJson('outputs/pilot/status/ep001_pilot_step.json');
const episodeState = readJson('outputs/pilot/status/ep001_episode_state.json');
const episodeStateCheck = readJson('outputs/pilot/status/ep001_episode_state_check.json');
const workPacket = readJson('outputs/pilot/work-packet/ep001_next_work_packet.json');
const workProgress = readJson('outputs/pilot/work-packet/ep001_work_packet_progress.json');
const workProgressCheck = readJson('outputs/pilot/work-packet/ep001_work_packet_check.json');
const lifecycle = readJson('outputs/pilot/status/ep001_frame_lifecycle.json');
const currentStep = pilotStep?.current_step ?? null;
const nextShot = episodeState?.next_shot ?? lifecycle?.next_item ?? null;
const plannedRuns = [];

if (workProgressCheck?.ok === false && workProgressCheck?.next_command) {
  plannedRuns.push({ id: 'work_progress_check_fix', action: 'fix_work_progress', command: workProgressCheck.next_command });
}

if (workProgress?.overall_status === 'done') {
  plannedRuns.push({ id: 'archive_work_packet', action: 'archive_finished_packet', command: 'npm run archive:work-packet' });
} else if (workProgress?.current_step?.command) {
  plannedRuns.push({ id: 'work_progress_next', action: 'continue_work_packet', command: workProgress.current_step.command });
} else if (workPacket?.commands?.register_candidate) {
  plannedRuns.push({ id: 'work_packet_register', action: 'use_work_packet', command: workPacket.commands.register_candidate });
}

if (episodeStateCheck?.next_command && episodeStateCheck.next_command !== 'npm run studio:next') {
  plannedRuns.push({ id: 'state_check_command', action: 'resolve_state_check', command: episodeStateCheck.next_command });
}

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
const hasWorkIssue = workProgressCheck?.ok === false;

const report = {
  id: 'studio_next_v8',
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  current_step: currentStep,
  episode_state: {
    overall_status: episodeState?.overall_status ?? 'unknown',
    counts: episodeState?.counts ?? null,
    next_shot: nextShot
  },
  state_check: {
    ok: episodeStateCheck?.ok ?? null,
    counts: episodeStateCheck?.counts ?? null,
    next_message: episodeStateCheck?.next_message ?? null
  },
  work_packet: {
    shot: workPacket?.shot ?? null,
    json: 'outputs/pilot/work-packet/ep001_next_work_packet.json',
    markdown: 'outputs/pilot/work-packet/ep001_next_work_packet.md',
    commands: 'outputs/pilot/work-packet/ep001_next_commands.txt'
  },
  work_progress: {
    overall_status: workProgress?.overall_status ?? null,
    counts: workProgress?.counts ?? null,
    current_step: workProgress?.current_step ?? null,
    next_command: workProgress?.next_command ?? null,
    auto_sync: workProgress?.auto_sync ?? null,
    file: 'outputs/pilot/work-packet/ep001_work_packet_progress.json'
  },
  work_progress_check: {
    ok: workProgressCheck?.ok ?? null,
    counts: workProgressCheck?.counts ?? null,
    next_message: workProgressCheck?.next_message ?? null,
    next_command: workProgressCheck?.next_command ?? null,
    file: 'outputs/pilot/work-packet/ep001_work_packet_check.json'
  },
  base_runs: baseRuns,
  planned_runs: uniquePlannedRuns,
  open_routes: [
    '#/studio-next',
    '#/work-packet',
    '#/work-progress',
    '#/work-archive',
    '#/episode-state',
    '#/episode-state-check',
    '#/frame-lifecycle',
    '#/studio-status',
    '#/pilot-step',
    '#/frame-plan',
    '#/frame-registry',
    '#/asset-gallery'
  ],
  next_message: hasWorkIssue
    ? workProgressCheck.next_message
    : workProgress?.overall_status === 'done'
      ? 'Current work packet is done. Archive it before moving on.'
      : episodeStateCheck?.next_message ?? nextShot?.title ?? currentStep?.title ?? 'No current step found.'
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote outputs/pilot/status/ep001_studio_next.json');
console.log(`Current step: ${currentStep?.type ?? 'unknown'}`);
console.log(`Episode: ${report.episode_state.overall_status}`);
console.log(`State check: ${report.state_check.ok}`);
console.log(`Work packet: ${workPacket?.shot?.tv_shot_id ?? 'none'}`);
console.log(`Work progress: ${workProgress?.overall_status ?? 'unknown'} ${workProgress?.counts?.done ?? 0}/${workProgress?.counts?.total ?? 0}`);
console.log(`Work check: ${workProgressCheck?.ok ?? 'unknown'}`);
console.log(report.next_message);
if (uniquePlannedRuns.length > 0) {
  console.log('Suggested commands:');
  for (const item of uniquePlannedRuns) console.log(`- ${item.command}`);
}
