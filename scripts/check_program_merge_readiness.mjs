import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const DEFAULT_MANIFEST = join(ROOT, 'project/program-merge-readiness.json');
const SHA40 = /^[a-f0-9]{40}$/;

const fail = (code, detail = '') => {
  throw new Error(`[PROGRAM_MERGE_READINESS:${code}]${detail ? ` ${detail}` : ''}`);
};
const assert = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
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

export function validateReadiness(input) {
  const manifest = clone(input);
  assert(manifest.schema_version === 1, 'SCHEMA_VERSION');
  assert(manifest.repository === 'Pagebabe/comic', 'REPOSITORY');
  assert(SHA40.test(manifest.main_head), 'MAIN_HEAD_SHA');
  assert(Array.isArray(manifest.workers) && manifest.workers.length >= 5, 'WORKERS');
  assert(Array.isArray(manifest.dependencies), 'DEPENDENCIES');
  assert(Array.isArray(manifest.merge_sequences) && manifest.merge_sequences.length >= 3, 'MERGE_SEQUENCES');
  assert(Array.isArray(manifest.recommended_sequence) && manifest.recommended_sequence.length > 0, 'RECOMMENDED_SEQUENCE');
  assert(Array.isArray(manifest.blocked_gates) && manifest.blocked_gates.length > 0, 'BLOCKED_GATES');

  const ids = manifest.workers.map((worker) => worker.id);
  assert(new Set(ids).size === ids.length, 'DUPLICATE_WORKER_ID');
  const workers = new Map(manifest.workers.map((worker) => [worker.id, worker]));
  for (const worker of manifest.workers) {
    assert(typeof worker.branch === 'string' && worker.branch.length > 0, 'UNKNOWN_BRANCH', worker.id);
    if (worker.head_sha !== null) assert(SHA40.test(worker.head_sha), 'WORKER_HEAD_SHA', worker.id);
    if (worker.observed_head_sha !== undefined) assert(SHA40.test(worker.observed_head_sha), 'OBSERVED_HEAD_SHA', worker.id);
    assert(typeof worker.merge_base_to_main === 'string' && SHA40.test(worker.merge_base_to_main), 'MISSING_MERGE_BASE', worker.id);
    assert(worker.direct_main_merge_allowed === false, 'DIRECT_MAIN_MERGE_ENABLED', worker.id);
  }

  for (const edge of manifest.dependencies) {
    assert(workers.has(edge.from) || edge.from === 'program_integration', 'UNKNOWN_DEPENDENCY_SOURCE', edge.from);
    assert(workers.has(edge.requires), 'UNKNOWN_DEPENDENCY_TARGET', edge.requires);
  }
  assert(!detectDependencyCycle(manifest.dependencies), 'CYCLIC_DEPENDENCY');

  const worker2 = workers.get('worker_2');
  assert(worker2.status === 'PENDING', 'WORKER_2_NOT_PENDING');
  assert(worker2.head_sha === null, 'WORKER_2_FALSE_FINAL_HEAD');
  assert(worker2.final_head_verified === false, 'WORKER_2_FALSE_VERIFICATION');
  assert(manifest.worker_2_status === 'PENDING', 'WORKER_2_PROGRAM_STATUS');
  assert(manifest.blocked_gates.includes('WORKER_2_FINAL_HEAD_UNVERIFIED'), 'WORKER_2_GATE_MISSING');

  const worker3Requires131 = manifest.dependencies.some((edge) => edge.from === 'worker_3' && edge.requires === 'pr_131' && edge.type === 'hard');
  assert(worker3Requires131, 'WORKER_3_MISSING_PR_131');
  const pr131RequiresMkt0 = manifest.dependencies.some((edge) => edge.from === 'pr_131' && edge.requires === 'mkt0' && edge.type === 'hard');
  assert(pr131RequiresMkt0, 'PR_131_MISSING_MKT0');

  const sequences = new Map(manifest.merge_sequences.map((sequence) => [sequence.id, sequence]));
  for (const id of ['A', 'B', 'C']) assert(sequences.has(id), 'SEQUENCE_MISSING', id);
  for (const sequence of manifest.merge_sequences) {
    for (const step of sequence.steps) assert(workers.has(step), 'UNKNOWN_SEQUENCE_BRANCH', `${sequence.id}:${step}`);
  }
  assert(sequences.get('A').allowed === false, 'UNSAFE_SEQUENCE_A_ALLOWED');
  assert(sequences.get('B').allowed === false, 'UNSAFE_SEQUENCE_B_ALLOWED');
  assert(sequences.get('C').allowed === false, 'WORKER_2_GATE_BYPASSED');
  assert(manifest.recommended_sequence.includes('WAIT_FOR_WORKER_2_FINAL_REPORT_FINAL_HEAD_AND_GREEN_CI'), 'WORKER_2_WAIT_STEP_MISSING');
  assert(manifest.recommended_sequence.includes('CREATE_CURRENT_MAIN_MKT0_REINTEGRATION_BRANCH'), 'MKT0_REINTEGRATION_STEP_MISSING');

  for (const key of [
    'direct_main_merge_allowed',
    'force_push_allowed',
    'branch_deletion_allowed',
    'history_rewrite_allowed',
    'live_activation_allowed',
    'publishing_allowed',
    'oauth_allowed',
    'secrets_allowed'
  ]) assert(manifest[key] === false, 'SAFETY_GATE_ENABLED', key);

  const diverged = workers.get('mkt0');
  assert(diverged.behind_by > 0, 'MKT0_DRIFT_NOT_RECORDED');
  assert(manifest.conflict_candidates.some((candidate) => candidate.path === 'package.json'), 'PACKAGE_CONFLICT_NOT_RECORDED');
  assert(manifest.decision === 'PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2', 'DECISION');
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
    if (mergeHead.exitCode === 0) {
      git(['-c', 'user.name=Comic Factory Rehearsal', '-c', 'user.email=rehearsal@example.invalid', 'commit', '-m', `rehearsal: ${worker.id}`], cwd);
    }
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
    if (worker.id !== 'worker_2') assert(actual === worker.head_sha, 'PINNED_HEAD_MOVED', worker.id);
  }
  assert(git(['rev-parse', 'refs/remotes/origin/main'], ROOT).stdout === manifest.main_head, 'MAIN_MOVED_SINCE_AUDIT');

  const tempRoot = await mkdtemp(join(tmpdir(), 'comic-merge-rehearsal-'));
  const worktree = join(tempRoot, 'worktree');
  const results = [];
  try {
    git(['worktree', 'add', '--detach', worktree, 'refs/remotes/origin/main'], ROOT);
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

  const sourceCleanAfter = git(['status', '--porcelain'], ROOT).stdout === '';
  assert(sourceCleanAfter, 'SOURCE_WORKTREE_DIRTY_AFTER_PROBE');
  const proof = {
    schema_version: 1,
    repository: manifest.repository,
    main_head: manifest.main_head,
    observed_refs: observedRefs,
    worker_2_final_status: 'PENDING',
    sequences: results,
    source_worktree_clean_after: sourceCleanAfter,
    direct_main_merge_performed: false,
    pushes_performed: 0,
    force_pushes_performed: 0,
    decision: 'PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2'
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
    console.log('PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
