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
    tested_head: '1bb4df874d8e2a36fd32fbad19074ed629ec922d',
    state: 'MERGEABLE_IN_REHEARSAL',
    clean_after: true,
    conflict_files: []
  }],
  clean_after_rollback: true
}));

test('accepts current final-head rehearsal manifest', () => {
  const result = validateReadiness(copy());
  assert.equal(result.decision, 'PROGRAM_MERGE_REHEARSAL_READY_CURRENT_HEADS');
  assert.equal(result.all_final_worker_heads_pinned, true);
});

test('Worker 1 is pinned to its final head and measured distance', () => {
  const worker = validateReadiness(copy()).workers.find((entry) => entry.id === 'worker_1');
  assert.equal(worker.head_sha, '1bb4df874d8e2a36fd32fbad19074ed629ec922d');
  assert.equal(worker.ahead_by, 38);
  assert.equal(worker.changed_file_count, 20);
});

test('Worker 2 is pinned as technical pipeline proof', () => {
  const value = validateReadiness(copy());
  const worker = value.workers.find((entry) => entry.id === 'worker_2');
  assert.equal(worker.head_sha, 'e8b8e348120ad527abe7a33caab9f56b6627f8c2');
  assert.equal(worker.status, 'EPISODE_PIPELINE_PROVEN');
  assert.equal(worker.technical_proof_only, true);
  assert.equal(worker.real_pilot_proven, false);
  assert.equal(value.worker_2_status, 'EPISODE_PIPELINE_PROVEN');
});

test('rejects Worker 2 regressing to Pending', () => {
  const value = copy();
  value.workers.find((entry) => entry.id === 'worker_2').status = 'PENDING';
  rejects(value, /WORKER_STATUS/);
});

test('rejects a changed Worker 2 final head', () => {
  const value = copy();
  value.workers.find((entry) => entry.id === 'worker_2').head_sha = 'a'.repeat(40);
  rejects(value, /WORKER_FINAL_HEAD_MISMATCH/);
});

test('rejects false real-pilot claim from Worker 2', () => {
  const value = copy();
  value.workers.find((entry) => entry.id === 'worker_2').real_pilot_proven = true;
  rejects(value, /WORKER_2_FALSE_REAL_PILOT/);
});

test('rejects an unknown branch in a sequence', () => {
  const value = copy();
  value.merge_sequences[0].steps.push('unknown_branch');
  rejects(value, /UNKNOWN_SEQUENCE_BRANCH/);
});

test('rejects malformed worker SHA', () => {
  const value = copy();
  value.workers[0].head_sha = 'not-a-sha';
  rejects(value, /WORKER_HEAD_SHA/);
});

test('rejects missing merge base', () => {
  const value = copy();
  value.workers[0].merge_base_to_main = '';
  rejects(value, /MISSING_MERGE_BASE/);
});

test('detects cyclic branch dependency', () => {
  const value = copy();
  value.dependencies.push({ from: 'mkt0', requires: 'worker_3', type: 'hard' });
  assert.equal(detectDependencyCycle(value.dependencies), true);
  rejects(value, /CYCLIC_DEPENDENCY/);
});

test('rejects Worker 3 without PR 131', () => {
  const value = copy();
  value.dependencies = value.dependencies.filter((edge) => !(edge.from === 'worker_3' && edge.requires === 'pr_131'));
  rejects(value, /WORKER_3_MISSING_PR_131/);
});

test('rejects program integration without final Worker 2 dependency', () => {
  const value = copy();
  value.dependencies = value.dependencies.filter((edge) => !(edge.from === 'program_integration' && edge.requires === 'worker_2'));
  rejects(value, /WORKER_2_FINAL_DEPENDENCY_MISSING/);
});

test('rejects direct Worker 3 permission to main', () => {
  const value = copy();
  value.workers.find((entry) => entry.id === 'worker_3').direct_main_merge_allowed = true;
  rejects(value, /DIRECT_MAIN_MERGE_ENABLED/);
});

test('rejects sequence that bypasses MKT0 current-main reintegration', () => {
  const value = copy();
  value.recommended_sequence = value.recommended_sequence.filter((step) => step !== 'CREATE_CURRENT_MAIN_MKT0_REINTEGRATION_BRANCH');
  rejects(value, /RECOMMENDED_STEP_MISSING/);
});

test('rejects obsolete Worker 2 wait step', () => {
  const value = copy();
  value.recommended_sequence.push('WAIT_FOR_WORKER_2_FINAL_REPORT_FINAL_HEAD_AND_GREEN_CI');
  rejects(value, /OBSOLETE_WORKER_2_WAIT_STEP/);
});

test('rejects an allowed merge sequence before gates', () => {
  const value = copy();
  value.merge_sequences.find((entry) => entry.id === 'C').allowed = true;
  rejects(value, /UNSAFE_SEQUENCE_ALLOWED/);
});

test('rejects changed controlled sequence order', () => {
  const value = copy();
  value.merge_sequences.find((entry) => entry.id === 'C').steps = ['worker_2', 'worker_1', 'mkt0', 'pr_131', 'worker_3'];
  rejects(value, /CONTROLLED_SEQUENCE_CHANGED/);
});

test('rejects missing combined regression blocker', () => {
  const value = copy();
  value.blocked_gates = value.blocked_gates.filter((gate) => gate !== 'PROGRAM_COMBINED_REGRESSION_NOT_PROVEN');
  rejects(value, /BLOCKED_GATE_MISSING/);
});

test('rejects obsolete Worker 2 final blocker', () => {
  const value = copy();
  value.blocked_gates.push('WORKER_2_FINAL_HEAD_UNVERIFIED');
  rejects(value, /OBSOLETE_WORKER_2_GATE/);
});

test('classifies conflict probe with exact files', () => {
  assert.equal(classifyProbeResult({ exitCode: 1, conflictFiles: ['package.json'], cleanAfter: true }), 'CONFLICT_REQUIRES_MANUAL_INTEGRATION');
});

test('classifies conflict-free merge probe', () => {
  assert.equal(classifyProbeResult({ exitCode: 0, conflictFiles: [], cleanAfter: true }), 'MERGEABLE_IN_REHEARSAL');
});

test('fails closed when rollback leaves dirty worktree', () => {
  assert.equal(classifyProbeResult({ exitCode: 1, conflictFiles: ['package.json'], cleanAfter: false }), 'ROLLBACK_FAILED');
});

test('rejects force-push permission', () => {
  const value = copy();
  value.force_push_allowed = true;
  rejects(value, /SAFETY_GATE_ENABLED.*force_push_allowed/);
});

test('rejects direct program main permission', () => {
  const value = copy();
  value.direct_main_merge_allowed = true;
  rejects(value, /SAFETY_GATE_ENABLED.*direct_main_merge_allowed/);
});

test('rejects history rewrite permission', () => {
  const value = copy();
  value.history_rewrite_allowed = true;
  rejects(value, /SAFETY_GATE_ENABLED.*history_rewrite_allowed/);
});

test('rejects duplicate worker identifiers', () => {
  const value = copy();
  value.workers.push({ ...value.workers[0] });
  rejects(value, /WORKERS|DUPLICATE_WORKER_ID/);
});

test('rejects live activation permission', () => {
  const value = copy();
  value.live_activation_allowed = true;
  rejects(value, /SAFETY_GATE_ENABLED.*live_activation_allowed/);
});

test('accepts reproducible probe evidence with clean rollbacks', () => {
  assert.equal(validateProbeSequences(validProbeSequences()).length, 3);
});

test('rejects technical probe failure even with JSON output', () => {
  const sequences = validProbeSequences();
  sequences[0].steps[0].state = 'PROBE_FAILED';
  assert.throws(() => validateProbeSequences(sequences), /PROBE_TECHNICAL_FAILURE/);
});

test('rejects missing exact conflict files', () => {
  const sequences = validProbeSequences();
  sequences[1].steps[0].state = 'CONFLICT_REQUIRES_MANUAL_INTEGRATION';
  sequences[1].steps[0].conflict_files = [];
  assert.throws(() => validateProbeSequences(sequences), /PROBE_CONFLICT_FILES_MISSING/);
});

test('rejects missing tested head in probe evidence', () => {
  const sequences = validProbeSequences();
  sequences[0].steps[0].tested_head = null;
  assert.throws(() => validateProbeSequences(sequences), /PROBE_TESTED_HEAD/);
});

test('rejects dirty rollback evidence', () => {
  const sequences = validProbeSequences();
  sequences[2].clean_after_rollback = false;
  assert.throws(() => validateProbeSequences(sequences), /PROBE_ROLLBACK_DIRTY/);
});
