import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const DEFAULT_MANIFEST = join(ROOT, 'project/program-merge-readiness.json');
const SHA40 = /^[a-f0-9]{40}$/;
const ACCEPTABLE_PROBE_STATES = new Set([
  'MERGEABLE_IN_REHEARSAL',
  'CONFLICT_REQUIRES_MANUAL_INTEGRATION'
]);

const EXPECTED = Object.freeze({
  main: 'b58534d0a737b1d01834628177e1090de027de61',
  decision: 'PROGRAM_MERGE_REHEARSAL_READY_CURRENT_HEADS',
  workers: {
    worker_1: {
      branch: 'worker/canon-lock',
      head: '1bb4df874d8e2a36fd32fbad19074ed629ec922d',
      status: 'CANON_CAST_SEPARATION_PROVEN',
      ahead: 38,
      behind: 0,
      files: 20
    },
    worker_2: {
      branch: 'worker/episode1-proof',
      head: 'e8b8e348120ad527abe7a33caab9f56b6627f8c2',
      status: 'EPISODE_PIPELINE_PROVEN',
      ahead: 24,
      behind: 0,
      files: 14
    },
    mkt0: {
      branch: 'feature/mkt0-growth-os-rebased',
      head: '4b4673f2d068e3b8c1e007daf1cda763d9836ed3',
      status: 'DIVERGED'
    },
    pr_131: {
      branch: 'feature/mkt1-001-factory-handoff',
      head: '9573757dbd9b39858ebae2b37337d2728a3455e4',
      status: 'PROVEN_NOT_MERGED'
    },
    worker_3: {
      branch: 'worker/mkt0-shadow-integration',
      head: 'c8c0adcef30645142190c19d8fbc6903fe177ae7',
      status: 'MKT0_INTEGRATION_MERGE_READY'
    }
  }
});

const fail = (code, detail = '') => {
  throw new Error(`[PROGRAM_MERGE_READINESS:${code}]${detail ? ` ${detail}` : ''}`);
};
const assert = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};
const equal = (actual, expected, code, detail = '') => {
  assert(actual === expected, code, `${detail}${detail ? ' · ' : ''}${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
};
const clone = (value) => JSON.parse(JSON.stringify(value));

export function detectDependencyCycle(dependencies = []) {
  const graph = new Map();
  for (const edge of dependencies) {
    if (!graph.has(edge.from)) graph.set(edge.from, []);
    graph.get(edge.from).push(edge.requires);
  }
  const visiting = new Set();
  const visited = new Set();
  const walk = (node) => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of graph.get(node) || []) if (walk(next)) return true;
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...graph.keys()].some(walk);
}

export function classifyProbeResult({ exitCode, conflictFiles = [], cleanAfter = true }) {
  if (!cleanAfter) return 'ROLLBACK_FAILED';
  if (exitCode === 0 && conflictFiles.length === 0) return 'MERGEABLE_IN_REHEARSAL';
  if (conflictFiles.length > 0) return 'CONFLICT_REQUIRES_MANUAL_INTEGRATION';
  return 'PROBE_FAILED';
}

export function validateProbeSequences(sequences) {
  assert(Array.isArray(sequences) && sequences.length === 3, 'PROBE_SEQUENCE_COUNT');
  const ids = sequences.map((sequence) => sequence.id);
  assert(new Set(ids).size === 3 && ['A', 'B', 'C'].every((id) => ids.includes(id)), 'PROBE_SEQUENCE_IDS');
  for (const sequence of sequences) {
    assert(Array.isArray(sequence.steps) && sequence.steps.length > 0, 'PROBE_SEQUENCE_EMPTY', sequence.id);
    assert(sequence.clean_after_rollback === true, 'PROBE_ROLLBACK_DIRTY', sequence.id);
    for (const step of sequence.steps) {
      assert(ACCEPTABLE_PROBE_STATES.has(step.state), 'PROBE_TECHNICAL_FAILURE', `${sequence.id}:${step.worker_id}:${step.state}`);
      assert(step.clean_after === true, 'PROBE_STEP_DIRTY', `${sequence.id}:${step.worker_id}`);
      assert(SHA40.test(step.tested_head || ''), 'PROBE_TESTED_HEAD', `${sequence.id}:${step.worker_id}`);
      if (step.state === 'CONFLICT_REQUIRES_MANUAL_INTEGRATION') {
        assert(Array.isArray(step.conflict_files) && step.conflict_files.length > 0, 'PROBE_CONFLICT_FILES_MISSING', `${sequence.id}:${step.worker_id}`);
      }
    }
  }
  return sequences;
}

export function validateReadiness(input) {
  const manifest = clone(input);
  equal(manifest.schema_version, 1, 'SCHEMA_VERSION');
  equal(manifest.repository, 'Pagebabe/comic', 'REPOSITORY');
  equal(manifest.main_head, EXPECTED.main, 'MAIN_HEAD');
  assert(SHA40.test(manifest.main_head), 'MAIN_HEAD_SHA');
  equal(manifest.decision, EXPECTED.decision, 'DECISION');
  assert(Array.isArray(manifest.workers) && manifest.workers.length === 5, 'WORKERS');
  assert(Array.isArray(manifest.dependencies), 'DEPENDENCIES');
  assert(Array.isArray(manifest.merge_sequences) && manifest.merge_sequences.length === 3, 'MERGE_SEQUENCES');
  assert(Array.isArray(manifest.recommended_sequence) && manifest.recommended_sequence.length > 0, 'RECOMMENDED_SEQUENCE');
  assert(Array.isArray(manifest.blocked_gates) && manifest.blocked_gates.length > 0, 'BLOCKED_GATES');

  const ids = manifest.workers.map((worker) => worker.id);
  assert(new Set(ids).size === ids.length, 'DUPLICATE_WORKER_ID');
  const workers = new Map(manifest.workers.map((worker) => [worker.id, worker]));
  for (const [id, expected] of Object.entries(EXPECTED.workers)) {
    const worker = workers.get(id);
    assert(worker, 'WORKER_MISSING', id);
    equal(worker.branch, expected.branch, 'WORKER_BRANCH', id);
    assert(SHA40.test(worker.head_sha || ''), 'WORKER_HEAD_SHA', id);
    equal(worker.head_sha, expected.head, 'WORKER_FINAL_HEAD_MISMATCH', id);
    equal(worker.status, expected.status, 'WORKER_STATUS', id);
    equal(worker.final_head_verified, true, 'WORKER_FINAL_HEAD_UNVERIFIED', id);
    assert(typeof worker.merge_base_to_main === 'string' && SHA40.test(worker.merge_base_to_main), 'MISSING_MERGE_BASE', id);
    equal(worker.direct_main_merge_allowed, false, 'DIRECT_MAIN_MERGE_ENABLED', id);
  }

  const worker1 = workers.get('worker_1');
  equal(worker1.ahead_by, EXPECTED.workers.worker_1.ahead, 'WORKER_1_AHEAD');
  equal(worker1.behind_by, EXPECTED.workers.worker_1.behind, 'WORKER_1_BEHIND');
  equal(worker1.changed_file_count, EXPECTED.workers.worker_1.files, 'WORKER_1_FILES');

  const worker2 = workers.get('worker_2');
  equal(worker2.ahead_by, EXPECTED.workers.worker_2.ahead, 'WORKER_2_AHEAD');
  equal(worker2.behind_by, EXPECTED.workers.worker_2.behind, 'WORKER_2_BEHIND');
  equal(worker2.changed_file_count, EXPECTED.workers.worker_2.files, 'WORKER_2_FILES');
  equal(worker2.technical_proof_only, true, 'WORKER_2_TECHNICAL_BOUNDARY');
  equal(worker2.real_pilot_proven, false, 'WORKER_2_FALSE_REAL_PILOT');
  equal(manifest.worker_2_status, 'EPISODE_PIPELINE_PROVEN', 'WORKER_2_PROGRAM_STATUS');
  equal(manifest.all_final_worker_heads_pinned, true, 'FINAL_HEADS_NOT_PINNED');

  for (const edge of manifest.dependencies) {
    assert(workers.has(edge.from) || edge.from === 'program_integration', 'UNKNOWN_DEPENDENCY_SOURCE', edge.from);
    assert(workers.has(edge.requires), 'UNKNOWN_DEPENDENCY_TARGET', edge.requires);
  }
  assert(!detectDependencyCycle(manifest.dependencies), 'CYCLIC_DEPENDENCY');
  assert(manifest.dependencies.some((edge) => edge.from === 'worker_3' && edge.requires === 'pr_131' && edge.type === 'hard'), 'WORKER_3_MISSING_PR_131');
  assert(manifest.dependencies.some((edge) => edge.from === 'pr_131' && edge.requires === 'mkt0' && edge.type === 'hard'), 'PR_131_MISSING_MKT0');
  assert(manifest.dependencies.some((edge) => edge.from === 'program_integration' && edge.requires === 'worker_2' && edge.type === 'verified_final_head'), 'WORKER_2_FINAL_DEPENDENCY_MISSING');

  const sequences = new Map(manifest.merge_sequences.map((sequence) => [sequence.id, sequence]));
  for (const id of ['A', 'B', 'C']) assert(sequences.has(id), 'SEQUENCE_MISSING', id);
  for (const sequence of manifest.merge_sequences) {
    for (const step of sequence.steps) assert(workers.has(step), 'UNKNOWN_SEQUENCE_BRANCH', `${sequence.id}:${step}`);
    equal(sequence.allowed, false, 'UNSAFE_SEQUENCE_ALLOWED', sequence.id);
  }
  equal(JSON.stringify(sequences.get('C').steps), JSON.stringify(['worker_1', 'worker_2', 'mkt0', 'pr_131', 'worker_3']), 'CONTROLLED_SEQUENCE_CHANGED');

  for (const step of [
    'CREATE_FRESH_PROGRAM_INTEGRATION_BRANCH_FROM_VERIFIED_MAIN',
    'MERGE_EXACT_WORKER_1_FINAL_HEAD_INTO_INTEGRATION_BRANCH',
    'MERGE_EXACT_WORKER_2_FINAL_HEAD_INTO_INTEGRATION_BRANCH',
    'RUN_FACTORY_ONLY_COMBINED_REGRESSION',
    'CREATE_CURRENT_MAIN_MKT0_REINTEGRATION_BRANCH',
    'RUN_FULL_REPOSITORY_FRESH_INSTALL_RECOVERY_BROWSER_EVIDENCE_AND_ROLLBACK_GATES',
    'HUMAN_REVIEW_BEFORE_ANY_MAIN_MERGE'
  ]) assert(manifest.recommended_sequence.includes(step), 'RECOMMENDED_STEP_MISSING', step);
  assert(!manifest.recommended_sequence.some((step) => step.includes('WAIT_FOR_WORKER_2')), 'OBSOLETE_WORKER_2_WAIT_STEP');

  for (const gate of [
    'MKT0_CURRENT_MAIN_REINTEGRATION_NOT_PROVEN',
    'PR_131_AND_WORKER_3_STACK_NOT_REBASED_TO_CURRENT_MAIN',
    'PROGRAM_COMBINED_REGRESSION_NOT_PROVEN',
    'PROGRAM_ROLLBACK_NOT_PROVEN',
    'HUMAN_MAIN_MERGE_APPROVAL_MISSING'
  ]) assert(manifest.blocked_gates.includes(gate), 'BLOCKED_GATE_MISSING', gate);
  assert(!manifest.blocked_gates.some((gate) => gate.startsWith('WORKER_2_FINAL_')), 'OBSOLETE_WORKER_2_GATE');

  for (const key of [
    'direct_main_merge_allowed',
    'force_push_allowed',
    'branch_deletion_allowed',
    'history_rewrite_allowed',
    'live_activation_allowed',
    'publishing_allowed',
    'oauth_allowed',
    'secrets_allowed'
  ]) equal(manifest[key], false, 'SAFETY_GATE_ENABLED', key);

  assert(workers.get('mkt0').behind_by > 0, 'MKT0_DRIFT_NOT_RECORDED');
  assert(manifest.conflict_candidates.some((candidate) => candidate.path === 'package.json'), 'PACKAGE_CONFLICT_NOT_RECORDED');
  return manifest;
}

function git(args, cwd = ROOT, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (!allowFailure && result.status !== 0) fail('GIT_COMMAND', `${args.join(' ')}\n${result.stderr}`);
  return { exitCode: result.status ?? 1, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}
function refFor(worker) {
  return `refs/remotes/origin/${worker.branch}`;
}
function mergeStep(cwd, worker) {
  const before = git(['status', '--porcelain'], cwd).stdout;
  assert(before === '', 'WORKTREE_DIRTY_BEFORE_MERGE', worker.id);
  const attempt = git(['merge', '--no-commit', '--no-ff', refFor(worker)], cwd, { allowFailure: true });
  const conflicts = git(['diff', '--name-only', '--diff-filter=U'], cwd, { allowFailure: true }).stdout.split('\n').filter(Boolean);
  if (attempt.exitCode === 0) {
    const mergeHead = git(['rev-parse', '-q', '--verify', 'MERGE_HEAD'], cwd, { allowFailure: true });
    if (mergeHead.exitCode === 0) git(['commit', '-m', `rehearsal: ${worker.id}`], cwd);
  } else {
    git(['merge', '--abort'], cwd, { allowFailure: true });
  }
  const cleanAfter = git(['status', '--porcelain'], cwd).stdout === '';
  return {
    worker_id: worker.id,
    branch: worker.branch,
    tested_head: git(['rev-parse', refFor(worker)], cwd).stdout,
    exit_code: attempt.exitCode,
    conflict_files: conflicts,
    stderr: attempt.stderr,
    clean_after: cleanAfter,
    state: classifyProbeResult({ exitCode: attempt.exitCode, conflictFiles: conflicts, cleanAfter })
  };
}

export async function runGitProbe(manifest, outputPath) {
  validateReadiness(manifest);
  const sourceStatusBefore = git(['status', '--porcelain'], ROOT).stdout;
  assert(sourceStatusBefore === '', 'SOURCE_WORKTREE_DIRTY_BEFORE_PROBE');

  git(['fetch', '--no-tags', 'origin',
    'main:refs/remotes/origin/main',
    'worker/canon-lock:refs/remotes/origin/worker/canon-lock',
    'worker/episode1-proof:refs/remotes/origin/worker/episode1-proof',
    'feature/mkt0-growth-os-rebased:refs/remotes/origin/feature/mkt0-growth-os-rebased',
    'feature/mkt1-001-factory-handoff:refs/remotes/origin/feature/mkt1-001-factory-handoff',
    'worker/mkt0-shadow-integration:refs/remotes/origin/worker/mkt0-shadow-integration'
  ], ROOT);

  const workers = new Map(manifest.workers.map((worker) => [worker.id, worker]));
  const observedRefs = {};
  for (const worker of manifest.workers) {
    const actual = git(['rev-parse', refFor(worker)], ROOT).stdout;
    observedRefs[worker.id] = actual;
    equal(actual, worker.head_sha, 'PINNED_HEAD_MOVED', worker.id);
  }
  equal(git(['rev-parse', 'refs/remotes/origin/main'], ROOT).stdout, manifest.main_head, 'MAIN_MOVED_SINCE_AUDIT');

  const tempRoot = await mkdtemp(join(tmpdir(), 'comic-merge-rehearsal-'));
  const worktree = join(tempRoot, 'worktree');
  const results = [];
  try {
    git(['worktree', 'add', '--detach', worktree, 'refs/remotes/origin/main'], ROOT);
    git(['config', 'user.name', 'Comic Factory Rehearsal'], worktree);
    git(['config', 'user.email', 'rehearsal@example.invalid'], worktree);
    const sequencePlans = {
      A: ['worker_1', 'worker_2', 'pr_131', 'worker_3'],
      B: ['pr_131', 'worker_3', 'worker_1', 'worker_2'],
      C: ['worker_1', 'worker_2', 'mkt0', 'pr_131', 'worker_3']
    };
    for (const [id, steps] of Object.entries(sequencePlans)) {
      git(['reset', '--hard', 'refs/remotes/origin/main'], worktree);
      git(['clean', '-fdx'], worktree);
      const sequence = { id, start: manifest.main_head, steps: [], completed: true };
      for (const step of steps) {
        const result = mergeStep(worktree, workers.get(step));
        sequence.steps.push(result);
        if (result.state !== 'MERGEABLE_IN_REHEARSAL') {
          sequence.completed = false;
          break;
        }
      }
      git(['reset', '--hard', 'refs/remotes/origin/main'], worktree);
      git(['clean', '-fdx'], worktree);
      sequence.clean_after_rollback = git(['status', '--porcelain'], worktree).stdout === '';
      results.push(sequence);
    }
  } finally {
    git(['worktree', 'remove', '--force', worktree], ROOT, { allowFailure: true });
    git(['worktree', 'prune'], ROOT, { allowFailure: true });
    await rm(tempRoot, { recursive: true, force: true });
  }

  validateProbeSequences(results);
  const sourceCleanAfter = git(['status', '--porcelain'], ROOT).stdout === '';
  assert(sourceCleanAfter, 'SOURCE_WORKTREE_DIRTY_AFTER_PROBE');
  const proof = {
    schema_version: 1,
    repository: manifest.repository,
    main_head: manifest.main_head,
    observed_refs: observedRefs,
    all_final_worker_heads_pinned: true,
    worker_2_final_status: 'EPISODE_PIPELINE_PROVEN',
    sequences: results,
    source_worktree_clean_after: sourceCleanAfter,
    direct_main_merge_performed: false,
    pushes_performed: 0,
    force_pushes_performed: 0,
    decision: 'PROGRAM_MERGE_REHEARSAL_READY_CURRENT_HEADS'
  };
  if (outputPath) await writeFile(resolve(outputPath), `${JSON.stringify(proof, null, 2)}\n`, 'utf8');
  return proof;
}

async function main() {
  const args = process.argv.slice(2);
  const manifestPath = args.find((arg) => arg.endsWith('.json') && !arg.startsWith('--')) || DEFAULT_MANIFEST;
  const manifest = JSON.parse(await readFile(resolve(manifestPath), 'utf8'));
  validateReadiness(manifest);
  if (args.includes('--git-probe')) {
    const outputIndex = args.indexOf('--output');
    const output = outputIndex >= 0 ? args[outputIndex + 1] : join(ROOT, 'output/program-merge-rehearsal.json');
    const proof = await runGitProbe(manifest, output);
    console.log(JSON.stringify(proof, null, 2));
  } else {
    console.log('PROGRAM_MERGE_REHEARSAL_READY_CURRENT_HEADS');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
