import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const reportPath = join(root, 'outputs', 'status', 'pilot-ui-refresh-report.json');
const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const skipReview = args.has('--skip-review');
const skipAssets = args.has('--skip-assets');

const steps = [
  {
    id: 'production_status',
    label: 'Build unified pilot production status',
    command: ['node', 'scripts/createPilotProductionStatus.mjs'],
    required: true
  },
  {
    id: 'publish_status',
    label: 'Publish pilot status for UI',
    command: ['node', 'scripts/publishPilotStatusForUi.mjs'],
    required: true
  },
  {
    id: 'review_manifests',
    label: 'Build pilot review manifests',
    command: ['node', 'scripts/createPilotReviewManifests.mjs'],
    required: !skipReview,
    skip: skipReview
  },
  {
    id: 'publish_review',
    label: 'Publish pilot review manifests for UI',
    command: ['node', 'scripts/publishPilotReviewForUi.mjs'],
    required: !skipReview,
    skip: skipReview
  },
  {
    id: 'publish_review_assets',
    label: 'Publish pilot review assets for UI',
    command: ['node', 'scripts/publishPilotReviewAssetsForUi.mjs'],
    required: !skipAssets,
    skip: skipAssets
  }
];

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf8');
}

function scriptExists(command) {
  const scriptPath = command[1];
  return scriptPath ? existsSync(join(root, scriptPath)) : true;
}

function runStep(step) {
  if (step.skip) {
    return {
      id: step.id,
      label: step.label,
      skipped: true,
      ok: true,
      required: step.required,
      command: step.command.join(' '),
      reason: 'Skipped by flag.'
    };
  }

  if (!scriptExists(step.command)) {
    return {
      id: step.id,
      label: step.label,
      skipped: false,
      ok: !step.required,
      required: step.required,
      command: step.command.join(' '),
      exitCode: null,
      stdout: '',
      stderr: `Missing script: ${step.command[1]}`
    };
  }

  const startedAt = new Date().toISOString();
  const result = spawnSync(step.command[0], step.command.slice(1), {
    cwd: root,
    encoding: 'utf8',
    env: process.env
  });

  return {
    id: step.id,
    label: step.label,
    skipped: false,
    ok: result.status === 0,
    required: step.required,
    command: step.command.join(' '),
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode: result.status,
    signal: result.signal,
    stdout: result.stdout?.trim() ?? '',
    stderr: result.stderr?.trim() ?? ''
  };
}

const results = [];
for (const step of steps) {
  const result = runStep(step);
  results.push(result);
  console.log(`${result.ok ? 'ok' : 'fail'} ${result.command}`);
  if (result.stderr) console.log(result.stderr);
  if (!result.ok && (strict || result.required)) break;
}

const failed = results.filter((result) => !result.ok);
const report = {
  id: 'pilot_ui_refresh_report',
  createdAt: new Date().toISOString(),
  strict,
  skipReview,
  skipAssets,
  ok: failed.length === 0,
  failedCount: failed.length,
  results,
  publicOutputs: {
    status: 'public/status/pilot-production-status.json',
    review: 'public/review/pilot/index.json',
    assets: 'public/assets/review/pilot/index.json'
  },
  nextStep: failed.length === 0 ? 'Open #/pilot-control, #/review or #/asset-gallery.' : 'Inspect failed step output and run the missing upstream pipeline step.'
};

writeJson(reportPath, report);
console.log('wrote outputs/status/pilot-ui-refresh-report.json');
console.log(`refresh ok: ${report.ok}`);

if (strict && failed.length > 0) process.exit(1);
if (failed.some((result) => result.required)) process.exit(1);
