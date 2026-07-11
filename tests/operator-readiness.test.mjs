import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  assertAllowedCommand,
  buildDoctorReport,
  buildEvidenceManifest,
  buildExecutionReport,
  createNoviceSession,
  evaluateNoviceRecord,
  setupCommandPlan,
  validateSupportedEnvironmentContract,
  verifyCommandPlan
} from '../lib/operator-readiness.mjs';

const commit = 'a'.repeat(40);
const template = {
  tasks: Array.from({ length: 12 }, (_, index) => ({
    id: `T${String(index + 1).padStart(2, '0')}`,
    prompt: `Task ${index + 1}`
  }))
};
const independentRole = (code) => ({
  code,
  actorType: 'HUMAN',
  projectContributor: false,
  priorProjectKnowledge: false
});

function session() {
  return createNoviceSession({
    template,
    commit,
    participant: independentRole('participant-01'),
    observer: independentRole('observer-01'),
    reviewer: independentRole('reviewer-01'),
    environment: {
      operatingSystem: 'macOS 14',
      browser: 'Chromium 126',
      device: 'MacBook',
      freshMachine: true,
      route: 'https://pagebabe.github.io/comic/'
    },
    sessionId: 'novice-001',
    createdAt: '2026-07-11T18:00:00.000Z'
  });
}

test('supported environment contract requires at least two profiles and Node 20+', async () => {
  const contract = JSON.parse(await readFile(new URL('../project/supported-environments.json', import.meta.url), 'utf8'));
  const result = validateSupportedEnvironmentContract(contract);
  assert.ok(result.supportedProfiles.length >= 2);
  assert.ok(result.supportedProfiles.every((profile) => profile.minimumNodeMajor >= 20));
});

test('studio doctor does not require media tools', () => {
  const report = buildDoctorReport({
    profile: 'studio', commit, platform: 'darwin', arch: 'arm64', nodeVersion: 'v22.1.0', npmVersion: '10.8.0'
  });
  assert.equal(report.ready, true);
  assert.equal(report.mutatedWorkspace, false);
  assert.match(report.reportHash, /^[0-9a-f]{64}$/);
});

test('media doctor fails closed when ffmpeg and espeak are missing', () => {
  const report = buildDoctorReport({
    profile: 'media', commit, platform: 'darwin', arch: 'arm64', nodeVersion: 'v22.1.0', npmVersion: '10.8.0',
    pythonVersion: 'Python 3.12.1', ffmpegAvailable: false, espeakAvailable: false
  });
  assert.equal(report.ready, false);
  assert.equal(report.checks.find((check) => check.id === 'ffmpeg').passed, false);
});

test('operator executes only exact allowlisted commands', () => {
  for (const command of [...setupCommandPlan(), ...verifyCommandPlan()]) {
    assert.deepEqual(assertAllowedCommand(command), command);
  }
  assert.throws(() => assertAllowedCommand(['sh', '-c', 'rm -rf /']), /allowlist/);
  assert.throws(() => assertAllowedCommand(['npm', 'run', 'anything']), /allowlist/);
});

test('execution report binds commands and output hashes', () => {
  const plan = setupCommandPlan();
  const results = plan.map(() => ({ exitCode: 0, stdout: 'ok', stderr: '' }));
  const report = buildExecutionReport({ type: 'comic-factory-setup-execution', commit, profile: 'studio', plan, results });
  assert.equal(report.passed, true);
  assert.equal(report.results.length, 2);
  assert.match(report.reportHash, /^[0-9a-f]{64}$/);
});

test('novice session requires three distinct independent humans', () => {
  const record = session();
  assert.equal(record.status, 'READY_FOR_OBSERVATION');
  assert.equal(record.tasks.length, 12);
  assert.match(record.recordHash, /^[0-9a-f]{64}$/);

  assert.throws(() => createNoviceSession({
    template, commit,
    participant: independentRole('same'), observer: independentRole('same'), reviewer: independentRole('reviewer'),
    environment: record.environment, sessionId: 'bad', createdAt: record.createdAt
  }), /different people/);

  assert.throws(() => createNoviceSession({
    template, commit,
    participant: { ...independentRole('p'), actorType: 'AI' }, observer: independentRole('o'), reviewer: independentRole('r'),
    environment: record.environment, sessionId: 'bad-ai', createdAt: record.createdAt
  }), /must be HUMAN/);
});

test('empty or self-attested novice record remains not passed', () => {
  const record = JSON.parse(JSON.stringify(session()));
  const result = evaluateNoviceRecord(record);
  assert.equal(result.passed, false);
  assert.ok(result.blockingFindings.includes('NOT_ALL_TASKS_PASSED'));
  assert.ok(result.blockingFindings.includes('SECOND_REVIEW_NOT_APPROVED'));
});

test('fully observed and independently reviewed record can pass', () => {
  const record = JSON.parse(JSON.stringify(session()));
  record.status = 'OBSERVED';
  record.tasks = record.tasks.map((task, index) => ({
    ...task,
    passed: true,
    helpRequired: false,
    notes: `Observed task ${index + 1}`,
    evidenceRefs: ['screen-recording.mp4']
  }));
  record.timing = { startedAt: '2026-07-11T18:00:00.000Z', completedAt: '2026-07-11T18:40:00.000Z', durationMinutes: 40 };
  record.safety = { violations: [], aborted: false };
  record.assistance = { undocumentedHelpUsed: false, documentedInterventions: [] };
  record.observerAttestation = 'I observed all twelve tasks without undocumented assistance.';
  record.reviewerDecision = { decision: 'APPROVED', attestation: 'I independently reviewed the record and evidence hashes.' };
  record.evidence = [{ path: 'screen-recording.mp4', sha256: 'b'.repeat(64) }];

  const result = evaluateNoviceRecord(record);
  assert.equal(result.passed, true);
  assert.equal(result.score, 12);
  assert.equal(result.decision, 'PASSED');
});

test('participant with prior project knowledge cannot pass', () => {
  const record = JSON.parse(JSON.stringify(session()));
  record.roles.participant.priorProjectKnowledge = true;
  assert.throws(() => evaluateNoviceRecord(record), /independence/);
});

test('evidence manifest is deterministic and sorted', () => {
  const first = buildEvidenceManifest([
    { path: 'z.txt', content: 'z' },
    { path: 'a.txt', content: 'a' }
  ], { sessionId: 'novice-001' });
  const second = buildEvidenceManifest([
    { path: 'a.txt', content: 'a' },
    { path: 'z.txt', content: 'z' }
  ], { sessionId: 'novice-001' });
  assert.equal(first.manifestHash, second.manifestHash);
  assert.deepEqual(first.files.map((file) => file.path), ['a.txt', 'z.txt']);
});

test('operator CLI does not enable free shell execution', async () => {
  const source = await readFile(new URL('../scripts/operator.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /shell\s*:\s*true/);
  assert.doesNotMatch(source, /execSync|\bexec\(/);
  assert.match(source, /assertAllowedCommand/);
});
