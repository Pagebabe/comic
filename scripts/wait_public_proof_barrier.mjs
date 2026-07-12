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
  { id: 'dashboard', path: 'proof/runtime-evidence.json', output: 'runtime-evidence.json', validate: (data) => data.status === 'pass' && data.commit === expectedCommit && data.activeGate === 'LR5' && data.activeWorkPackage === 'LR5.1' && data.route?.endsWith('/audit.html') },
  { id: 'root-entry', path: 'proof/root-entry/root-entry-runtime-evidence.json', output: 'root-entry-runtime-evidence.json', validate: (data) => data.status === 'pass' && data.commit === expectedCommit && data.trackingIssue === 121 && data.parentIssue === 117 && data.primaryAction === './studio/#cockpit' && data.auditRoute === './audit.html' && data.riccoCandidates === 0 && data.productionReady === false && data.beginnerReady === false && data.imageGenerationAllowed === false && data.growthOsIntegrated === false },
  { id: 'studio', path: 'proof/studio/studio-runtime-evidence.json', output: 'studio-runtime-evidence.json', validate: (data) => data.status === 'pass' && data.commit === expectedCommit && data.activeGate === 'LR5' && data.activeWorkPackage === 'LR5.1' },
  { id: 'academy', path: 'proof/studio/academy-runtime-evidence.json', output: 'academy-runtime-evidence.json', validate: (data) => data.status === 'pass' && data.commit === expectedCommit && data.stageCount === 12 && data.creativeApprovalGranted === false && data.finalEpisodeApprovalGranted === false },
  { id: 'readiness', path: 'proof/readiness/academy-readiness-runtime-evidence.json', output: 'readiness-runtime-evidence.json', validate: (data) => data.status === 'pass' && data.commit === expectedCommit && data.readinessScore === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN' && data.productionReady === false && data.beginnerReady === false && data.creativeApprovalGranted === false },
  { id: 'cockpit', path: 'proof/cockpit/production-cockpit-runtime-evidence.json', output: 'cockpit-runtime-evidence.json', validate: (data) => data.status === 'pass' && data.commit === expectedCommit && data.trackingIssue === 117 && data.activeGate === 'LR5.1' && data.activeWorkPackage === 88 && data.workspaceCount === 6 && data.riccoCandidates === 0 && data.imageGenerationAllowed === false && data.creativeApprovalGranted === false && data.productionReady === false && data.beginnerReady === false && data.growthOsIntegrated === false },
  { id: 'academy-status', path: 'project/production-academy-status.json', output: 'production-academy-status.json', validate: (data) => data.status === 'proven_guided_training_ready_novice_acceptance_open' && data.readiness?.productionReady === false && data.readiness?.beginnerReady === false && data.readiness?.observedNoviceRunPassed === false },
  { id: 'readiness-contract', path: 'project/production-readiness-v1.json', output: 'production-readiness-v1.json', validate: (data) => data.status === 'NOT_PRODUCTION_READY' && data.currentScore?.display === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN' && data.academyBoundary?.productionReady === false && data.academyBoundary?.beginnerReady === false },
  { id: 'cockpit-contract', path: 'project/production-cockpit-v1.json', output: 'production-cockpit-v1.json', validate: (data) => data.status === 'WORKING_COCKPIT_V1' && data.route === '/studio/#cockpit' && data.trackingIssue === 117 && data.activeGate?.id === 'LR5.1' && data.activeGate?.trackingIssue === 88 && data.nextAllowedStep?.decision === 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE' && data.counts?.riccoCandidates === 0 && data.sections?.length === 6 && Object.values(data.boundaries || {}).every((entry) => entry === false) },
  { id: 'root-entry-contract', path: 'project/root-entry-v1.json', output: 'root-entry-v1.json', validate: (data) => data.status === 'ROOT_ENTRY_READY_FOR_PROOF' && data.route === '/' && data.trackingIssue === 121 && data.parentIssue === 117 && data.primaryAction?.href === './studio/#cockpit' && data.legacyAudit?.preserved === true && data.legacyAudit?.route === '/audit.html' && data.currentState?.riccoCandidates === 0 && data.currentState?.productionReady === false && data.currentState?.beginnerReady === false && Object.values(data.boundaries || {}).every((entry) => entry === false) }
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
      const response = await fetch(url, { headers: { 'cache-control': 'no-cache', pragma: 'no-cache' } });
      if (!response.ok) { pending.push(`${target.id}:HTTP_${response.status}`); return; }
      const data = await response.json();
      if (!target.validate(data)) { const observedCommit = data?.commit ? `:${data.commit}` : ''; pending.push(`${target.id}:CONTRACT_PENDING${observedCommit}`); return; }
      fetched.set(target.id, { target, data });
    } catch (error) { pending.push(`${target.id}:${error instanceof Error ? error.message : String(error)}`); }
  }));
  if (pending.length === 0 && fetched.size === targets.length) {
    for (const { target, data } of fetched.values()) await writeFile(resolve(outputDir, target.output), `${JSON.stringify(data, null, 2)}\n`);
    console.log(JSON.stringify({ status: 'pass', expectedCommit, attempt, manifests: targets.map((target) => target.id) }));
    process.exit(0);
  }
  lastPending = pending.sort();
  console.log(JSON.stringify({ status: 'pending', expectedCommit, attempt, pending: lastPending }));
  if (attempt < attempts) await sleep(delayMs);
}
throw new Error(`[PUBLIC_BARRIER:TIMEOUT] ${lastPending.join(', ')}`);
