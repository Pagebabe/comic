import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  validateReadiness,
  validateProbeSequences,
  detectDependencyCycle,
  classifyProbeResult
} from '../scripts/check_program_merge_readiness.mjs';

const manifest = JSON.parse(await readFile(new URL('../project/program-merge-readiness.json', import.meta.url), 'utf8'));
const copy = () => JSON.parse(JSON.stringify(manifest));
const rejects = (value, pattern) => assert.throws(() => validateReadiness(value), pattern);
const validProbeSequences = () => ['A', 'B', 'C'].map((id) => ({
  id,
  steps: [{
    worker_id: 'worker_1',
    state: 'MERGEABLE_IN_REHEARSAL',
    clean_after: true,
    conflict_files: []
  }],
  clean_after_rollback: true
}));

// 1
test('accepts the fail-closed program manifest', () => {
  assert.equal(validateReadiness(copy()).decision, 'PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2');
});

// 2
test('rejects an unknown branch in a sequence', () => {
  const value = copy();
  value.merge_sequences[0].steps.push('unknown_branch');
  rejects(value, /UNKNOWN_SEQUENCE_BRANCH/);
});

// 3
test('rejects a false head SHA', () => {
  const value = copy();
  value.workers[0].head_sha = 'not-a-sha';
  rejects(value, /WORKER_HEAD_SHA/);
});

// 4
test('rejects a missing merge base', () => {
  const value = copy();
  value.workers[0].merge_base_to_main = '';
  rejects(value, /MISSING_MERGE_BASE/);
});

// 5
test('detects a cyclic branch dependency', () => {
  const value = copy();
  value.dependencies.push({ from: 'mkt0', requires: 'worker_3', type: 'hard' });
  assert.equal(detectDependencyCycle(value.dependencies), true);
  rejects(value, /CYCLIC_DEPENDENCY/);
});

// 6
test('rejects Worker 3 without PR 131', () => {
  const value = copy();
  value.dependencies = value.dependencies.filter((edge) => !(edge.from === 'worker_3' && edge.requires === 'pr_131'));
  rejects(value, /WORKER_3_MISSING_PR_131/);
});

// 7
test('keeps Worker 2 without a final head as a hard pending gate', () => {
  const value = validateReadiness(copy());
  const worker2 = value.workers.find((worker) => worker.id === 'worker_2');
  assert.equal(worker2.head_sha, null);
  assert.equal(worker2.status, 'PENDING');
  assert.equal(value.merge_sequences.find((sequence) => sequence.id === 'C').allowed, false);
});

// 8
test('rejects a falsely finalized Worker 2 head', () => {
  const value = copy();
  value.workers.find((worker) => worker.id === 'worker_2').head_sha = 'a'.repeat(40);
  rejects(value, /WORKER_2_FALSE_FINAL_HEAD/);
});

// 9
test('rejects direct Worker 3 merge permission to main', () => {
  const value = copy();
  value.workers.find((worker) => worker.id === 'worker_3').direct_main_merge_allowed = true;
  rejects(value, /DIRECT_MAIN_MERGE_ENABLED/);
});

// 10
test('rejects a sequence that bypasses current-main MKT0 reintegration', () => {
  const value = copy();
  value.recommended_sequence = value.recommended_sequence.filter((step) => step !== 'CREATE_CURRENT_MAIN_MKT0_REINTEGRATION_BRANCH');
  rejects(value, /MKT0_REINTEGRATION_STEP_MISSING/);
});

// 11
test('classifies a conflict probe with exact files', () => {
  assert.equal(classifyProbeResult({ exitCode: 1, conflictFiles: ['package.json'], cleanAfter: true }), 'CONFLICT_REQUIRES_MANUAL_INTEGRATION');
});

// 12
test('classifies a conflict-free merge probe', () => {
  assert.equal(classifyProbeResult({ exitCode: 0, conflictFiles: [], cleanAfter: true }), 'MERGEABLE_IN_REHEARSAL');
});

// 13
test('fails closed when rollback leaves a dirty worktree', () => {
  assert.equal(classifyProbeResult({ exitCode: 1, conflictFiles: ['package.json'], cleanAfter: false }), 'ROLLBACK_FAILED');
});

// 14
test('rejects force-push permission', () => {
  const value = copy();
  value.force_push_allowed = true;
  rejects(value, /SAFETY_GATE_ENABLED.*force_push_allowed/);
});

// 15
test('rejects direct program merge permission', () => {
  const value = copy();
  value.direct_main_merge_allowed = true;
  rejects(value, /SAFETY_GATE_ENABLED.*direct_main_merge_allowed/);
});

// 16
test('rejects history rewrite permission', () => {
  const value = copy();
  value.history_rewrite_allowed = true;
  rejects(value, /SAFETY_GATE_ENABLED.*history_rewrite_allowed/);
});

// 17
test('rejects duplicate worker identifiers', () => {
  const value = copy();
  value.workers.push({ ...value.workers[0] });
  rejects(value, /DUPLICATE_WORKER_ID/);
});

// 18
test('rejects live activation permission', () => {
  const value = copy();
  value.live_activation_allowed = true;
  rejects(value, /SAFETY_GATE_ENABLED.*live_activation_allowed/);
});

// 19
test('accepts reproducible probe evidence with clean rollbacks', () => {
  assert.equal(validateProbeSequences(validProbeSequences()).length, 3);
});

// 20
test('rejects a technical probe failure even when the runner produced JSON', () => {
  const sequences = validProbeSequences();
  sequences[0].steps[0].state = 'PROBE_FAILED';
  assert.throws(() => validateProbeSequences(sequences), /PROBE_TECHNICAL_FAILURE/);
});

// 21
test('rejects missing exact conflict files', () => {
  const sequences = validProbeSequences();
  sequences[1].steps[0].state = 'CONFLICT_REQUIRES_MANUAL_INTEGRATION';
  sequences[1].steps[0].conflict_files = [];
  assert.throws(() => validateProbeSequences(sequences), /PROBE_CONFLICT_FILES_MISSING/);
});

// 22
test('rejects dirty rollback evidence', () => {
  const sequences = validProbeSequences();
  sequences[2].clean_after_rollback = false;
  assert.throws(() => validateProbeSequences(sequences), /PROBE_ROLLBACK_DIRTY/);
});
