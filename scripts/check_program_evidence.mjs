import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const COMMIT_SHA = /^[a-f0-9]{40}$/;
const HASH64 = /^[a-f0-9]{64}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;

const EXPECTED = Object.freeze({
  repository: 'Pagebabe/comic',
  sourceMain: 'b58534d0a737b1d01834628177e1090de027de61',
  programStatus: 'PROGRAM_RELEASE_BLOCKED_PENDING_WORKER_2',
  workers: {
    1: {
      role: 'CANON_LOCK',
      branch: 'worker/canon-lock',
      head: 'b891d36c32c2a38badcfb897f46e6f1a29f13e70',
      pr: 138,
      base: 'main',
      baseSha: 'b58534d0a737b1d01834628177e1090de027de61',
      status: 'READY_FOR_REVIEW_NOT_MERGED',
      report: 'docs/reports/WORKER_1_CANON_REPORT.md',
      reportToken: 'READY_FOR_REVIEW_NOT_MERGED',
      requiredArtifacts: [
        'docs/reports/WORKER_1_CANON_REPORT.md',
        'project/cast-canon-v1.json',
        'docs/canon/CAST_CANON.md',
        'docs/canon/CHARACTER_INVENTORY.md',
        'docs/canon/ASSET_GAP_REPORT.md',
        'scripts/check_cast_canon.mjs',
        'tests/cast-canon.test.mjs'
      ],
      runs: {
        'Comic Factory CI': 29184300535,
        'Fresh Install Drill': 29184300563,
        'Operator Recovery Drill': 29184300562
      },
      artifacts: {
        8257480400: 'sha256:f669fcd660195291f95c916ef70f4f4abe1bd9f1cad5fb5964ec15846e05230b',
        8257478030: 'sha256:9710cf825704fada99f00d67ddb8fcb4e31e44ff52bf243fb080871fd38e95e9',
        8257469700: 'sha256:5e0a291e13db800e7d596f162db5f63c4fb346e6224372b6ac3234973da2f09a'
      }
    },
    3: {
      role: 'MKT0_SHADOW_INTEGRATION',
      branch: 'worker/mkt0-shadow-integration',
      head: 'c8c0adcef30645142190c19d8fbc6903fe177ae7',
      pr: 139,
      base: 'feature/mkt1-001-factory-handoff',
      baseSha: '9573757dbd9b39858ebae2b37337d2728a3455e4',
      status: 'MKT0_INTEGRATION_MERGE_READY',
      report: 'docs/reports/WORKER_3_MKT0_INTEGRATION_REPORT.md',
      reportToken: 'MKT0_INTEGRATION_MERGE_READY',
      requiredArtifacts: [
        'docs/reports/WORKER_3_MKT0_INTEGRATION_REPORT.md',
        '.github/workflows/studio-mkt0-shadow-integration.yml',
        'growth-os/contracts/studio-mkt0-handoff-v1.schema.json',
        'growth-os/studio-mkt0-integration.mjs',
        'growth-os/studio-mkt0-integration-fixture.mjs',
        'growth-os/studio-mkt0-integration-check.mjs',
        'tests/growth-os-studio-mkt0-integration.test.mjs',
        'docs/integration/LIVE_ACTIVATION_GATES.md',
        'docs/integration/MKT0_MERGE_MAP.md'
      ],
      runs: {
        'Studio MKT0 Shadow Integration': 29184362940,
        'Growth Factory Handoff': 29184362967,
        'Comic Factory CI': 29184362937
      },
      artifacts: {
        8257490164: 'sha256:c51a6d660c0d3da3f324de1e04e194875065881e692b2016509ba4ae630e831a',
        8257489997: 'sha256:8812c3f60101581f3b73d7e94f9eb4c3af4ba95903ba55ab972207902582c0a3',
        8257494349: 'sha256:3789ab63102860ef6a050c082e5649b7faa6721ac8e0d356db2ee0e236540e83'
      }
    }
  },
  dependency: {
    id: 'PR_131',
    branch: 'feature/mkt1-001-factory-handoff',
    head: '9573757dbd9b39858ebae2b37337d2728a3455e4',
    pr: 131,
    base: 'feature/mkt0-growth-os-rebased',
    baseSha: '4b4673f2d068e3b8c1e007daf1cda763d9836ed3',
    status: 'PROVEN_NOT_MERGED',
    requiredArtifacts: [
      '.github/workflows/growth-handoff.yml',
      'growth-os/contracts/factory-handoff-v1.json',
      'growth-os/handoff.mjs',
      'growth-os/handoff-check.mjs',
      'tests/growth-os-handoff.test.mjs',
      'growth-os/evidence/MKT1-001.md'
    ],
    runs: {
      'Growth Factory Handoff': 29168036308,
      'Comic Factory CI': 29168036347
    },
    artifacts: {
      8252718070: 'sha256:42833a26ac9aefeadec1f1ae46b87bffe7e5af2619f8044f80c210e6209ecc67',
      8252722848: 'sha256:60b3c1447414822c1c681a3c0f9256914bf406018a68dcb42ee03cea26a32b93'
    }
  }
});

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function computeManifestHash(manifest) {
  const copy = structuredClone(manifest);
  delete copy.integrity;
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(copy)))
    .digest('hex');
}

function fail(code, detail = '') {
  throw new Error(`[PROGRAM_EVIDENCE:${code}]${detail ? ` ${detail}` : ''}`);
}

function ok(condition, code, detail = '') {
  if (!condition) fail(code, detail);
}

function equal(actual, expected, code, detail = '') {
  ok(actual === expected, code, `${detail}${detail ? ' · ' : ''}${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
}

function exactSet(actual, expected, code) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  ok(JSON.stringify(left) === JSON.stringify(right), code, `${left.join(',')} != ${right.join(',')}`);
}

function getWorker(manifest, id) {
  return manifest.workers.find((worker) => worker.worker_id === id);
}

function validatePullRequest(pr, expected, codePrefix) {
  ok(pr && typeof pr === 'object', `${codePrefix}_PR_MISSING`);
  equal(pr.number, expected.pr, `${codePrefix}_PR_NUMBER`);
  equal(pr.state, 'open', `${codePrefix}_PR_STATE`);
  equal(pr.merged, false, `${codePrefix}_FALSE_MERGE_CLAIM`);
  equal(pr.base_branch, expected.base, `${codePrefix}_PR_BASE`);
  equal(pr.base_sha, expected.baseSha, `${codePrefix}_PR_BASE_SHA`);
}

function validateRuns(worker, expected, codePrefix) {
  ok(Array.isArray(worker.ci_runs), `${codePrefix}_RUNS`);
  exactSet(worker.ci_runs.map((run) => run.workflow), Object.keys(expected.runs), `${codePrefix}_RUN_NAMES`);
  for (const [workflow, runId] of Object.entries(expected.runs)) {
    const run = worker.ci_runs.find((entry) => entry.workflow === workflow);
    ok(run, `${codePrefix}_RUN_MISSING`, workflow);
    equal(run.run_id, runId, `${codePrefix}_RUN_ID`, workflow);
    equal(run.status, 'completed', `${codePrefix}_RUN_STATUS`, workflow);
    equal(run.conclusion, 'success', `${codePrefix}_RUN_CONCLUSION`, workflow);
    equal(run.head_sha, expected.head, `${codePrefix}_RUN_HEAD`, workflow);
  }
}

function validateWorkflowArtifacts(worker, expected, codePrefix) {
  ok(Array.isArray(worker.workflow_artifacts), `${codePrefix}_WORKFLOW_ARTIFACTS`);
  exactSet(
    worker.workflow_artifacts.map((artifact) => artifact.artifact_id),
    Object.keys(expected.artifacts).map(Number),
    `${codePrefix}_WORKFLOW_ARTIFACT_IDS`
  );
  for (const [artifactIdText, digest] of Object.entries(expected.artifacts)) {
    const artifactId = Number(artifactIdText);
    const artifact = worker.workflow_artifacts.find((entry) => entry.artifact_id === artifactId);
    ok(artifact, `${codePrefix}_WORKFLOW_ARTIFACT_MISSING`, artifactIdText);
    equal(artifact.digest, digest, `${codePrefix}_ARTIFACT_DIGEST`, artifactIdText);
    ok(DIGEST.test(artifact.digest), `${codePrefix}_ARTIFACT_DIGEST_FORMAT`, artifactIdText);
    equal(artifact.expired, false, `${codePrefix}_ARTIFACT_EXPIRED`, artifactIdText);
    ok(worker.ci_runs.some((run) => run.run_id === artifact.run_id), `${codePrefix}_ARTIFACT_RUN_LINK`, artifactIdText);
  }
}

function validateRequiredArtifacts(worker, expected, codePrefix) {
  ok(Array.isArray(worker.required_artifacts), `${codePrefix}_REQUIRED_ARTIFACTS`);
  exactSet(worker.required_artifacts.map((artifact) => artifact.path), expected.requiredArtifacts, `${codePrefix}_REQUIRED_ARTIFACT_PATHS`);
  for (const artifact of worker.required_artifacts) {
    equal(artifact.status, 'VERIFIED_PRESENT', `${codePrefix}_REQUIRED_ARTIFACT_STATUS`, artifact.path);
    ok(typeof artifact.type === 'string' && artifact.type.length > 0, `${codePrefix}_REQUIRED_ARTIFACT_TYPE`, artifact.path);
  }
}

function validateCompletedWorker(worker, expected, codePrefix) {
  ok(worker, `${codePrefix}_MISSING`);
  equal(worker.role, expected.role, `${codePrefix}_ROLE`);
  equal(worker.branch, expected.branch, `${codePrefix}_BRANCH`);
  ok(COMMIT_SHA.test(worker.head_sha || ''), `${codePrefix}_HEAD_FORMAT`);
  equal(worker.head_sha, expected.head, `${codePrefix}_HEAD_MISMATCH`);
  validatePullRequest(worker.pull_request, expected, codePrefix);
  equal(worker.base_branch, expected.base, `${codePrefix}_BASE_BRANCH`);
  equal(worker.status, expected.status, `${codePrefix}_STATUS_REPORT_MISMATCH`);
  equal(worker.verified, true, `${codePrefix}_VERIFIED`);
  equal(worker.report_path, expected.report, `${codePrefix}_REPORT_PATH`);
  equal(worker.merge_allowed, false, `${codePrefix}_MERGE_ALLOWED`);
  equal(worker.main_merge_allowed, false, `${codePrefix}_MAIN_MERGE_ALLOWED`);
  equal(worker.live_activation_allowed, false, `${codePrefix}_LIVE_ALLOWED`);
  validateRequiredArtifacts(worker, expected, codePrefix);
  validateRuns(worker, expected, codePrefix);
  validateWorkflowArtifacts(worker, expected, codePrefix);
  ok(Array.isArray(worker.non_claims) && worker.non_claims.length > 0, `${codePrefix}_NON_CLAIMS`);
}

function validateWorker2(worker) {
  ok(worker, 'WORKER_2_MISSING');
  equal(worker.role, 'EPISODE_1_PROOF', 'WORKER_2_ROLE');
  equal(worker.status, 'PENDING', 'WORKER_2_STATUS');
  equal(worker.verified, false, 'WORKER_2_VERIFIED');
  for (const field of ['branch', 'head_sha', 'pull_request', 'base_branch', 'report_path']) {
    equal(worker[field], null, 'WORKER_2_UNKNOWN_VALUE_INVENTED', field);
  }
  equal(worker.required_artifacts.length, 0, 'WORKER_2_ARTIFACT_CLAIM');
  equal(worker.ci_runs.length, 0, 'WORKER_2_RUN_CLAIM');
  equal(worker.workflow_artifacts.length, 0, 'WORKER_2_WORKFLOW_ARTIFACT_CLAIM');
  ok(worker.dependencies.includes('FINAL_REPORT_REQUIRED'), 'WORKER_2_FINAL_REPORT_GATE');
  equal(worker.merge_allowed, false, 'WORKER_2_MERGE_ALLOWED');
  equal(worker.main_merge_allowed, false, 'WORKER_2_MAIN_MERGE_ALLOWED');
  equal(worker.live_activation_allowed, false, 'WORKER_2_LIVE_ALLOWED');
  equal(worker.evidence_integrity?.completion_evidence_present, false, 'WORKER_2_COMPLETION_EVIDENCE');
  equal(worker.evidence_integrity?.unknown_values_preserved, true, 'WORKER_2_UNKNOWN_PRESERVATION');
}

function validateDependency(worker3) {
  ok(Array.isArray(worker3.dependencies), 'WORKER_3_DEPENDENCIES');
  equal(worker3.dependencies.length, 1, 'WORKER_3_DEPENDENCY_COUNT');
  const dependency = worker3.dependencies[0];
  const expected = EXPECTED.dependency;
  equal(dependency.dependency_id, expected.id, 'WORKER_3_PR_131_ID');
  equal(dependency.type, 'PULL_REQUEST', 'WORKER_3_PR_131_TYPE');
  equal(dependency.required, true, 'WORKER_3_PR_131_REQUIRED');
  equal(dependency.status, expected.status, 'WORKER_3_PR_131_STATUS');
  equal(dependency.satisfied, false, 'WORKER_3_PR_131_FALSE_SATISFACTION');
  equal(dependency.branch, expected.branch, 'WORKER_3_PR_131_BRANCH');
  equal(dependency.head_sha, expected.head, 'WORKER_3_PR_131_HEAD');
  validatePullRequest(dependency.pull_request, expected, 'WORKER_3_PR_131');
  validateRequiredArtifacts(dependency, expected, 'WORKER_3_PR_131');
  validateRuns(dependency, expected, 'WORKER_3_PR_131');
  validateWorkflowArtifacts(dependency, expected, 'WORKER_3_PR_131');
  equal(dependency.gate, 'WORKER_3_TARGET_MERGE_BLOCKED_UNTIL_PR_131_MERGED', 'WORKER_3_PR_131_GATE');
  equal(worker3.merge_allowed, false, 'WORKER_3_DEPENDENCY_MERGE_BLOCK');
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function resolveBranchHead(branch) {
  const refs = [`refs/remotes/origin/${branch}`, `refs/heads/${branch}`];
  for (const ref of refs) {
    try {
      return git(['rev-parse', ref]);
    } catch {
      // try the next exact ref
    }
  }
  fail('BRANCH_REF_MISSING', branch);
}

function verifyObjectAtCommit(commit, file) {
  try {
    git(['cat-file', '-e', `${commit}:${file}`]);
  } catch {
    fail('REPOSITORY_ARTIFACT_MISSING', `${commit}:${file}`);
  }
}

function showObjectAtCommit(commit, file) {
  try {
    return git(['show', `${commit}:${file}`]);
  } catch {
    fail('REPOSITORY_REPORT_MISSING', `${commit}:${file}`);
  }
}

function verifyRepositoryEvidence(manifest) {
  equal(resolveBranchHead('main'), EXPECTED.sourceMain, 'SOURCE_MAIN_REF_DRIFT');
  for (const workerId of [1, 3]) {
    const worker = getWorker(manifest, workerId);
    const expected = EXPECTED.workers[workerId];
    equal(resolveBranchHead(worker.branch), worker.head_sha, `WORKER_${workerId}_BRANCH_HEAD_DRIFT`);
    for (const artifact of worker.required_artifacts) verifyObjectAtCommit(worker.head_sha, artifact.path);
    const report = showObjectAtCommit(worker.head_sha, worker.report_path);
    ok(report.includes(expected.reportToken), `WORKER_${workerId}_REPORT_STATUS_MISMATCH`);
  }
  const dependency = getWorker(manifest, 3).dependencies[0];
  equal(resolveBranchHead(dependency.branch), dependency.head_sha, 'WORKER_3_PR_131_BRANCH_HEAD_DRIFT');
  for (const artifact of dependency.required_artifacts) verifyObjectAtCommit(dependency.head_sha, artifact.path);
}

export function validateProgramEvidence(manifest, { checkRepositoryRefs = false } = {}) {
  ok(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'MANIFEST_OBJECT');
  equal(manifest.schema_version, 1, 'SCHEMA_VERSION');
  equal(manifest.repository, EXPECTED.repository, 'REPOSITORY');
  equal(manifest.source_main?.branch, 'main', 'SOURCE_MAIN_BRANCH');
  equal(manifest.source_main?.head_sha, EXPECTED.sourceMain, 'SOURCE_MAIN_HEAD');
  equal(manifest.program_status, EXPECTED.programStatus, 'PROGRAM_STATUS');
  equal(manifest.decision, 'PROGRAM_EVIDENCE_GATE_READY', 'EVIDENCE_GATE_DECISION');

  ok(Array.isArray(manifest.workers), 'WORKERS_ARRAY');
  equal(manifest.workers.length, 3, 'WORKER_COUNT');
  exactSet(manifest.workers.map((worker) => worker.worker_id), [1, 2, 3], 'WORKER_IDS');
  equal(new Set(manifest.workers.map((worker) => worker.worker_id)).size, 3, 'DUPLICATE_WORKER_ID');
  const branches = manifest.workers.map((worker) => worker.branch).filter(Boolean);
  equal(new Set(branches).size, branches.length, 'DUPLICATE_BRANCH');

  const worker1 = getWorker(manifest, 1);
  const worker2 = getWorker(manifest, 2);
  const worker3 = getWorker(manifest, 3);
  validateCompletedWorker(worker1, EXPECTED.workers[1], 'WORKER_1');
  validateWorker2(worker2);
  validateCompletedWorker(worker3, EXPECTED.workers[3], 'WORKER_3');
  validateDependency(worker3);

  const requiredBlockedGates = [
    'WORKER_2_FINAL_REPORT_MISSING',
    'WORKER_2_FINAL_HEAD_UNKNOWN',
    'WORKER_3_DEPENDENCY_PR_131_NOT_MERGED',
    'PROGRAM_INTEGRATION_NOT_PROVEN',
    'MAIN_MERGE_FORBIDDEN',
    'LIVE_ACTIVATION_FORBIDDEN'
  ];
  for (const gate of requiredBlockedGates) ok(manifest.blocked_gates?.includes(gate), 'BLOCKED_GATE_MISSING', gate);
  equal(manifest.release_rules?.fail_closed, true, 'FAIL_CLOSED');
  equal(manifest.release_rules?.all_workers_required, true, 'ALL_WORKERS_REQUIRED');
  equal(manifest.release_rules?.single_worker_success_cannot_release, true, 'SINGLE_WORKER_RELEASE');
  equal(manifest.release_rules?.worker_3_requires_pr_131_merged, true, 'WORKER_3_DEPENDENCY_RULE');
  equal(manifest.release_rules?.worker_2_requires_final_report, true, 'WORKER_2_REPORT_RULE');

  equal(manifest.main_merge_allowed, false, 'PROGRAM_MAIN_MERGE_ALLOWED');
  equal(manifest.live_activation_allowed, false, 'PROGRAM_LIVE_ALLOWED');
  equal(manifest.activation_controls?.oauth_allowed, false, 'OAUTH_ALLOWED');
  equal(manifest.activation_controls?.platform_accounts_connected, 0, 'PLATFORM_ACCOUNTS_ACTIVE');
  equal(manifest.activation_controls?.network_execution_allowed, false, 'NETWORK_EXECUTION_ALLOWED');
  equal(manifest.activation_controls?.publishing_allowed, false, 'PUBLISHING_ALLOWED');

  equal(manifest.integrity?.algorithm, 'sha256', 'INTEGRITY_ALGORITHM');
  ok(HASH64.test(manifest.integrity?.manifest_sha256 || ''), 'INTEGRITY_FORMAT');
  equal(manifest.integrity.manifest_sha256, computeManifestHash(manifest), 'INTEGRITY_MISMATCH');

  if (checkRepositoryRefs) verifyRepositoryEvidence(manifest);

  return {
    schema_version: manifest.schema_version,
    repository: manifest.repository,
    decision: manifest.decision,
    program_status: manifest.program_status,
    manifest_sha256: manifest.integrity.manifest_sha256,
    workers: manifest.workers.map((worker) => ({
      worker_id: worker.worker_id,
      status: worker.status,
      verified: worker.verified
    })),
    blocked_gates: manifest.blocked_gates,
    main_merge_allowed: manifest.main_merge_allowed,
    live_activation_allowed: manifest.live_activation_allowed,
    repository_refs_checked: checkRepositoryRefs
  };
}

async function main() {
  const args = process.argv.slice(2);
  const manifestIndex = args.indexOf('--manifest');
  const outputIndex = args.indexOf('--output');
  const manifestPath = path.resolve(manifestIndex >= 0 ? args[manifestIndex + 1] : 'project/program-evidence-manifest.json');
  const outputPath = outputIndex >= 0 ? path.resolve(args[outputIndex + 1]) : null;
  const checkRepositoryRefs = !args.includes('--skip-repository-refs');

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const result = validateProgramEvidence(manifest, { checkRepositoryRefs });
  const proof = {
    ...result,
    status: 'pass',
    generated_at: manifest.generated_at,
    canonical_repeat_hash: computeManifestHash(manifest),
    deterministic_repeat: computeManifestHash(manifest) === computeManifestHash(structuredClone(manifest))
  };

  if (outputPath) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(proof, null, 2)}\n`);
  }
  console.log(JSON.stringify(proof));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
