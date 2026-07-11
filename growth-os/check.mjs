import assert from 'node:assert/strict';
import { runSyntheticShadowDemo } from './fixture.mjs';

const first = runSyntheticShadowDemo();
const second = runSyntheticShadowDemo();

assert.deepEqual(first, second, 'MKT0 shadow result must be deterministic');
assert.equal(first.mode, 'shadow');
assert.equal(first.auditValid, true);
assert.equal(first.liveActionsExecuted, false);
assert.ok(first.jobs.length >= 3);
assert.ok(first.jobs.every(({ job }) => ['SIMULATED', 'WAITING_HUMAN', 'CANCELLED'].includes(job.state)));
assert.ok(first.jobs.every(({ job }) => job.mode === 'shadow'));
assert.ok(first.productionBrief.constraints.includes('NO_LIVE_PUBLISHING_FROM_MKT0_CORE'));

console.log(JSON.stringify({
  status: 'PASS',
  mode: first.mode,
  jobs: first.jobs.length,
  classification: first.analysis.classification,
  growthScore: first.analysis.score,
  auditEntries: first.audit.length,
  auditHead: first.audit.at(-1).hash,
  liveActionsExecuted: first.liveActionsExecuted
}, null, 2));
