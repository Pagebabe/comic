import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const baseUrl = new URL(valueAfter('--base-url', 'https://pagebabe.github.io/comic/'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');
const outputDir = resolve(valueAfter('--output', '/tmp/public-proof'));
const attempts = Number(valueAfter('--attempts', '30'));
const delayMs = Number(valueAfter('--delay-ms', '5000'));

if (!expectedCommit) throw new Error('[PUBLIC_BARRIER:EXPECTED_COMMIT_MISSING]');
if (!Number.isInteger(attempts) || attempts < 1) throw new Error('[PUBLIC_BARRIER:INVALID_ATTEMPTS]');
if (!Number.isInteger(delayMs) || delayMs < 0) throw new Error('[PUBLIC_BARRIER:INVALID_DELAY]');

const targets = [
  {
    id: 'dashboard',
    path: 'proof/runtime-evidence.json',
    output: 'runtime-evidence.json',
    validate: (data) => data.status === 'pass'
      && data.commit === expectedCommit
      && data.activeGate === 'LR5'
      && data.activeWorkPackage === 'LR5.1'
  },
  {
    id: 'studio',
    path: 'proof/studio/studio-runtime-evidence.json',
    output: 'studio-runtime-evidence.json',
    validate: (data) => data.status === 'pass'
      && data.commit === expectedCommit
      && data.activeGate === 'LR5'
      && data.activeWorkPackage === 'LR5.1'
  },
  {
    id: 'academy',
    path: 'proof/studio/academy-runtime-evidence.json',
    output: 'academy-runtime-evidence.json',
    validate: (data) => data.status === 'pass'
      && data.commit === expectedCommit
      && data.stageCount === 12
      && data.creativeApprovalGranted === false
      && data.finalEpisodeApprovalGranted === false
  },
  {
    id: 'readiness',
    path: 'proof/readiness/academy-readiness-runtime-evidence.json',
    output: 'readiness-runtime-evidence.json',
    validate: (data) => data.status === 'pass'
      && data.commit === expectedCommit
      && data.readinessScore === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN'
      && data.productionReady === false
      && data.beginnerReady === false
      && data.creativeApprovalGranted === false
  },
  {
    id: 'academy-status',
    path: 'project/production-academy-status.json',
    output: 'production-academy-status.json',
    validate: (data) => data.status === 'proven_guided_training_ready_novice_acceptance_open'
      && data.readiness?.productionReady === false
      && data.readiness?.beginnerReady === false
      && data.readiness?.observedNoviceRunPassed === false
  },
  {
    id: 'readiness-contract',
    path: 'project/production-readiness-v1.json',
    output: 'production-readiness-v1.json',
    validate: (data) => data.status === 'NOT_PRODUCTION_READY'
      && data.currentScore?.display === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN'
      && data.academyBoundary?.productionReady === false
      && data.academyBoundary?.beginnerReady === false
  }
];

await mkdir(outputDir, { recursive: true });

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
let lastPending = [];

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const pending = [];
  const fetched = new Map();

  await Promise.all(targets.map(async (target) => {
    const url = new URL(target.path, baseUrl);
    url.searchParams.set('sha', expectedCommit);
    url.searchParams.set('attempt', String(attempt));
    try {
      const response = await fetch(url, {
        headers: { 'cache-control': 'no-cache', pragma: 'no-cache' }
      });
      if (!response.ok) {
        pending.push(`${target.id}:HTTP_${response.status}`);
        return;
      }
      const data = await response.json();
      if (!target.validate(data)) {
        const observedCommit = data?.commit ? `:${data.commit}` : '';
        pending.push(`${target.id}:CONTRACT_PENDING${observedCommit}`);
        return;
      }
      fetched.set(target.id, { target, data });
    } catch (error) {
      pending.push(`${target.id}:${error instanceof Error ? error.message : String(error)}`);
    }
  }));

  if (pending.length === 0 && fetched.size === targets.length) {
    for (const { target, data } of fetched.values()) {
      await writeFile(resolve(outputDir, target.output), `${JSON.stringify(data, null, 2)}\n`);
    }
    console.log(JSON.stringify({
      status: 'pass',
      expectedCommit,
      attempt,
      manifests: targets.map((target) => target.id)
    }));
    process.exit(0);
  }

  lastPending = pending.sort();
  console.log(JSON.stringify({
    status: 'pending',
    expectedCommit,
    attempt,
    pending: lastPending
  }));

  if (attempt < attempts) await sleep(delayMs);
}

throw new Error(`[PUBLIC_BARRIER:TIMEOUT] ${lastPending.join(', ')}`);
