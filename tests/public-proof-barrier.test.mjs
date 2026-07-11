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
  '/project/production-academy-status.json': {
    status: 'proven_guided_training_ready_novice_acceptance_open',
    readiness: { productionReady: false, beginnerReady: false, observedNoviceRunPassed: false }
  },
  '/project/production-readiness-v1.json': {
    status: 'NOT_PRODUCTION_READY',
    currentScore: { display: '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN' },
    academyBoundary: { productionReady: false, beginnerReady: false }
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

function runBarrier(baseUrl, output, extraArgs = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [
      script.pathname,
      '--base-url', baseUrl,
      '--expect-commit', expectedCommit,
      '--output', output,
      '--attempts', '2',
      '--delay-ms', '10',
      ...extraArgs
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('barrier writes all six exact public contracts after a successful check', async () => {
  const output = await mkdtemp(join(tmpdir(), 'comic-public-barrier-'));
  try {
    await withServer({}, async (baseUrl) => {
      const result = await runBarrier(baseUrl, output);
      assert.equal(result.code, 0, result.stderr);
      assert.match(result.stdout, /"status":"pass"/);
      const runtime = JSON.parse(await readFile(join(output, 'runtime-evidence.json'), 'utf8'));
      const readiness = JSON.parse(await readFile(join(output, 'production-readiness-v1.json'), 'utf8'));
      assert.equal(runtime.commit, expectedCommit);
      assert.equal(readiness.status, 'NOT_PRODUCTION_READY');
    });
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('barrier fails closed when one public manifest remains stale', async () => {
  const output = await mkdtemp(join(tmpdir(), 'comic-public-barrier-stale-'));
  try {
    await withServer({
      '/proof/readiness/academy-readiness-runtime-evidence.json': {
        ...payloads['/proof/readiness/academy-readiness-runtime-evidence.json'],
        commit: 'stale-commit'
      }
    }, async (baseUrl) => {
      const result = await runBarrier(baseUrl, output);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, /PUBLIC_BARRIER:TIMEOUT/);
      assert.match(result.stdout, /readiness:CONTRACT_PENDING:stale-commit/);
    });
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
