import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const expectedCommit = '90079ccb0cd51be865c05bcb88cc22e63a287a24';
const script = new URL('../scripts/wait_public_proof_barrier.mjs', import.meta.url);

const payloads = {
  '/proof/runtime-evidence.json': {
    status: 'pass', commit: expectedCommit, activeGate: 'LR5', activeWorkPackage: 'LR5.1'
  },
  '/proof/studio/studio-runtime-evidence.json': {
    status: 'pass', commit: expectedCommit, activeGate: 'LR5', activeWorkPackage: 'LR5.1'
  },
  '/proof/studio/academy-runtime-evidence.json': {
    status: 'pass', commit: expectedCommit, stageCount: 12,
    creativeApprovalGranted: false, finalEpisodeApprovalGranted: false
  },
  '/proof/readiness/academy-readiness-runtime-evidence.json': {
    status: 'pass', commit: expectedCommit,
    readinessScore: '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN',
    productionReady: false, beginnerReady: false, creativeApprovalGranted: false
  },
  '/proof/cockpit/production-cockpit-runtime-evidence.json': {
    schemaVersion: 2,
    status: 'pass',
    commit: expectedCommit,
    trackingIssue: 117,
    activeParentGate: 'LR5',
    activeParentTrackingIssue: 82,
    strategicContract: 'LR5.1',
    strategicContractTrackingIssue: 88,
    completedAssetScan: 123,
    activeReviewGate: 153,
    localExecutionTask: 155,
    toolingPullRequest: 154,
    workspaceCount: 6,
    activeWorkspace: 'review',
    nextDecision: 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED',
    riccoCandidates: 0,
    imageGenerationAllowed: false,
    creativeApprovalGranted: false,
    productionReady: false,
    beginnerReady: false,
    growthOsIntegrated: false
  },
  '/project/production-academy-status.json': {
    status: 'proven_guided_training_ready_novice_acceptance_open',
    readiness: { productionReady: false, beginnerReady: false, observedNoviceRunPassed: false }
  },
  '/project/production-readiness-v1.json': {
    status: 'NOT_PRODUCTION_READY',
    currentScore: { display: '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN' },
    academyBoundary: { productionReady: false, beginnerReady: false }
  },
  '/project/production-cockpit-v1.json': {
    status: 'WORKING_COCKPIT_V1',
    route: '/studio/#cockpit',
    trackingIssue: 117,
    activeGate: { id: 'P1-RICCO-001', trackingIssue: 153 },
    currentTask: { primaryHref: 'https://github.com/Pagebabe/comic/issues/155' },
    nextAllowedStep: { decision: 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED' },
    counts: { riccoCandidates: 0 },
    sections: [
      { id: 'characters', status: 'BLOCKED' },
      { id: 'sets', status: 'BLOCKED' },
      { id: 'voices', status: 'BLOCKED' },
      { id: 'episode', status: 'PLANNED_REVIEW_REQUIRED' },
      { id: 'review', status: 'ACTIVE_REVIEW_GATE' },
      { id: 'export', status: 'BLOCKED' }
    ],
    boundaries: {
      imageGenerationAllowed: false,
      providerExecutionAllowed: false,
      batchAllowed: false,
      loraTrainingAllowed: false,
      automaticMasterApprovalAllowed: false,
      growthOsIntegrated: false,
      livePublishingAllowed: false,
      productionReady: false,
      beginnerReady: false
    }
  }
};

async function withServer(overrides, callback) {
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    const payload = overrides[path] ?? payloads[path];
    if (!payload) {
      response.writeHead(404).end('not found');
      return;
    }
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(payload));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    await callback(`http://127.0.0.1:${address.port}/`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function runBarrier(baseUrl, output) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [
      script.pathname,
      '--base-url', baseUrl,
      '--expect-commit', expectedCommit,
      '--output', output,
      '--attempts', '2',
      '--delay-ms', '10'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('barrier writes all eight public contracts after a successful active-line check', async () => {
  const output = await mkdtemp(join(tmpdir(), 'comic-public-barrier-'));
  try {
    await withServer({}, async (baseUrl) => {
      const result = await runBarrier(baseUrl, output);
      assert.equal(result.code, 0, result.stderr);
      assert.match(result.stdout, /"status":"pass"/);
      const runtime = JSON.parse(await readFile(join(output, 'runtime-evidence.json'), 'utf8'));
      const readiness = JSON.parse(await readFile(join(output, 'production-readiness-v1.json'), 'utf8'));
      const cockpit = JSON.parse(await readFile(join(output, 'production-cockpit-v1.json'), 'utf8'));
      const cockpitRuntime = JSON.parse(await readFile(join(output, 'cockpit-runtime-evidence.json'), 'utf8'));
      assert.equal(runtime.commit, expectedCommit);
      assert.equal(readiness.status, 'NOT_PRODUCTION_READY');
      assert.equal(cockpit.activeGate.trackingIssue, 153);
      assert.equal(cockpit.currentTask.primaryHref, 'https://github.com/Pagebabe/comic/issues/155');
      assert.equal(cockpitRuntime.commit, expectedCommit);
      assert.equal(cockpitRuntime.activeReviewGate, 153);
      assert.equal(cockpitRuntime.localExecutionTask, 155);
      assert.equal(cockpitRuntime.activeWorkspace, 'review');
    });
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('barrier fails closed when one public manifest remains stale', async () => {
  const output = await mkdtemp(join(tmpdir(), 'comic-public-barrier-stale-'));
  try {
    await withServer({
      '/proof/cockpit/production-cockpit-runtime-evidence.json': {
        ...payloads['/proof/cockpit/production-cockpit-runtime-evidence.json'],
        commit: 'stale-commit'
      }
    }, async (baseUrl) => {
      const result = await runBarrier(baseUrl, output);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, /PUBLIC_BARRIER:TIMEOUT/);
      assert.match(result.stdout, /cockpit:CONTRACT_PENDING:stale-commit/);
    });
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('barrier rejects the former strategic contract as the active operational gate', async () => {
  const output = await mkdtemp(join(tmpdir(), 'comic-public-barrier-old-gate-'));
  try {
    await withServer({
      '/project/production-cockpit-v1.json': {
        ...payloads['/project/production-cockpit-v1.json'],
        activeGate: { id: 'LR5.1', trackingIssue: 88 },
        nextAllowedStep: { decision: 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE' }
      }
    }, async (baseUrl) => {
      const result = await runBarrier(baseUrl, output);
      assert.notEqual(result.code, 0);
      assert.match(result.stdout, /cockpit-contract:CONTRACT_PENDING/);
    });
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
