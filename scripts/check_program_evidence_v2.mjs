import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SHA40 = /^[a-f0-9]{40}$/;
const HASH64 = /^[a-f0-9]{64}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;

const EXPECTED = Object.freeze({
  repository: 'Pagebabe/comic',
  main: 'b58534d0a737b1d01834628177e1090de027de61',
  status: 'PROGRAM_INTEGRATION_PROVEN_PENDING_LOCAL_ASSET_SCAN',
  decision: 'PROGRAM_EVIDENCE_CURRENT',
  integration: {
    branch: 'integration/canon-episode-growth',
    head: '9bf5c5350138371c4940475cf36fb51ba7d4ae9e',
    tree: '5adae6d73f85d7ffb72bd285cd2184ae498038ce',
    packageHash: 'd04b323ad69b12c1428df89dad2b35a397ac530196a18c07db5f0d118a4c9b34',
    pr: 150,
    mergeTest: 'a66e43a76640c65937501b74686e34fbcd64292f',
    sourceHeads: {
      canon_cast: '1bb4df874d8e2a36fd32fbad19074ed629ec922d',
      episode_pipeline: 'e8b8e348120ad527abe7a33caab9f56b6627f8c2',
      growth_shadow: '77f77db12a227c976e6e33ef7afde655f455772e'
    },
    runs: {
      'Comic Factory CI': [29191223093, 8259584188, 'sha256:3c7974f06f695d35211429308bce02f630f4da30830e9fac76ff6a2475e51df3'],
      'Fresh Install Drill': [29191223092, 8259577319, 'sha256:2bd803c7748e9d168523e1fcd430caf0c27379c302093b63b5da322937e71262'],
      'Operator Recovery Drill': [29191223062, 8259570398, 'sha256:4bbfe1e00497be330c3858f3293160c605df10e4ce8bfe6d5540a4040be13641'],
      'Growth Factory Handoff': [29191223129, 8259570443, 'sha256:0652e0b2a1079ed91aae0caf3ba9583e9deee1a41e3a3b2d9a7ad07a76f38925'],
      'Studio MKT0 Shadow Integration': [29191223119, 8259570932, 'sha256:65466ab0a4de8ff7df5b9b0e0ca2fefff9d504e7502299d0b5ad8956a33cf39f'],
      'Worker 2 Episode 1 Production Proof': [29191223088, 8259577115, 'sha256:acd9739edfc97e027880a4a040651b66a8be3a9f212d07e710bc0a4af4cfdb67']
    }
  },
  rehearsal: {
    pr: 148,
    head: 'ed4e18e086b579e9f35c6f2269bec8a774121014',
    mergeTest: '8aaae1cde362a3605969e06da973ec812d74c911',
    run: 29190877463,
    artifact: 8259488839,
    digest: 'sha256:7d20a45779f2f1f4babb9cd074256d1ca868a8f105446bf7cc757eadecfe2e81',
    manifestHash: '642d6990fba1b32f475bbda9539bf84e5a137d1e47b763d48c1839568ace04d7'
  },
  evidenceV1: {
    pr: 141,
    head: 'd1a25610c37e076c6df87f585d9439265d536861'
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
  return createHash('sha256').update(JSON.stringify(canonicalize(copy))).digest('hex');
}

function fail(code, detail = '') {
  throw new Error(`[PROGRAM_EVIDENCE_V2:${code}]${detail ? ` ${detail}` : ''}`);
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

function validateRuns(runs) {
  ok(Array.isArray(runs), 'RUNS_ARRAY');
  equal(runs.length, 6, 'RUN_COUNT');
  exactSet(runs.map((run) => run.workflow), Object.keys(EXPECTED.integration.runs), 'RUN_NAMES');
  for (const [workflow, [runId, artifactId, digest]] of Object.entries(EXPECTED.integration.runs)) {
    const run = runs.find((entry) => entry.workflow === workflow);
    ok(run, 'RUN_MISSING', workflow);
    equal(run.run_id, runId, 'RUN_ID', workflow);
    equal(run.artifact_id, artifactId, 'ARTIFACT_ID', workflow);
    equal(run.digest, digest, 'ARTIFACT_DIGEST', workflow);
    ok(DIGEST.test(run.digest), 'ARTIFACT_DIGEST_FORMAT', workflow);
  }
}

export function validateProgramEvidenceV2(manifest, { checkRepositoryRefs = false } = {}) {
  equal(manifest.schema_version, 2, 'SCHEMA_VERSION');
  equal(manifest.repository, EXPECTED.repository, 'REPOSITORY');
  equal(manifest.source_main?.branch, 'main', 'MAIN_BRANCH');
  equal(manifest.source_main?.head_sha, EXPECTED.main, 'MAIN_HEAD');
  equal(manifest.source_main?.unchanged, true, 'MAIN_CHANGED');
  equal(manifest.program_status, EXPECTED.status, 'PROGRAM_STATUS');
  equal(manifest.decision, EXPECTED.decision, 'DECISION');

  const integration = manifest.integration;
  ok(integration && typeof integration === 'object', 'INTEGRATION_OBJECT');
  equal(integration.branch, EXPECTED.integration.branch, 'INTEGRATION_BRANCH');
  equal(integration.head_sha, EXPECTED.integration.head, 'INTEGRATION_HEAD');
  ok(SHA40.test(integration.head_sha), 'INTEGRATION_HEAD_FORMAT');
  equal(integration.product_tree_sha, EXPECTED.integration.tree, 'PRODUCT_TREE');
  ok(SHA40.test(integration.product_tree_sha), 'PRODUCT_TREE_FORMAT');
  equal(integration.package_sha256, EXPECTED.integration.packageHash, 'PACKAGE_HASH');
  ok(HASH64.test(integration.package_sha256), 'PACKAGE_HASH_FORMAT');
  equal(integration.status, 'ACTUAL_INTEGRATION_BRANCH_PROVEN', 'INTEGRATION_STATUS');

  equal(integration.pull_request?.number, EXPECTED.integration.pr, 'INTEGRATION_PR');
  equal(integration.pull_request?.state, 'open', 'INTEGRATION_PR_STATE');
  equal(integration.pull_request?.draft, true, 'INTEGRATION_PR_DRAFT');
  equal(integration.pull_request?.merged, false, 'INTEGRATION_FALSE_MERGE');
  equal(integration.pull_request?.base_branch, 'main', 'INTEGRATION_PR_BASE');
  equal(integration.pull_request?.base_sha, EXPECTED.main, 'INTEGRATION_PR_BASE_SHA');
  equal(integration.pull_request?.merge_test_sha, EXPECTED.integration.mergeTest, 'INTEGRATION_MERGE_TEST');

  exactSet(Object.keys(integration.source_heads || {}), Object.keys(EXPECTED.integration.sourceHeads), 'SOURCE_HEAD_KEYS');
  for (const [name, sha] of Object.entries(EXPECTED.integration.sourceHeads)) {
    equal(integration.source_heads[name], sha, `SOURCE_HEAD_${name.toUpperCase()}`);
  }

  const proofFields = [
    'product_tree_matches_rehearsal',
    'package_hash_matches_rehearsal',
    'bootstrap_absent',
    'full_regression_green',
    'browser_proof_green',
    'fresh_install_green',
    'operator_recovery_green',
    'growth_handoff_green',
    'growth_shadow_green',
    'episode_pipeline_green'
  ];
  for (const field of proofFields) equal(integration.proofs?.[field], true, `PROOF_${field.toUpperCase()}`);
  equal(integration.proofs?.expected_conflict_only, 'package.json', 'EXPECTED_CONFLICT');
  validateRuns(integration.runs);
  equal(integration.main_merge_allowed, false, 'INTEGRATION_MAIN_MERGE_ALLOWED');
  equal(integration.live_activation_allowed, false, 'INTEGRATION_LIVE_ALLOWED');

  const rehearsal = manifest.control_proofs?.final_rehearsal;
  equal(rehearsal?.pull_request, EXPECTED.rehearsal.pr, 'REHEARSAL_PR');
  equal(rehearsal?.head_sha, EXPECTED.rehearsal.head, 'REHEARSAL_HEAD');
  equal(rehearsal?.merge_test_sha, EXPECTED.rehearsal.mergeTest, 'REHEARSAL_MERGE_TEST');
  equal(rehearsal?.run_id, EXPECTED.rehearsal.run, 'REHEARSAL_RUN');
  equal(rehearsal?.artifact_id, EXPECTED.rehearsal.artifact, 'REHEARSAL_ARTIFACT');
  equal(rehearsal?.digest, EXPECTED.rehearsal.digest, 'REHEARSAL_DIGEST');
  equal(rehearsal?.manifest_sha256, EXPECTED.rehearsal.manifestHash, 'REHEARSAL_MANIFEST_HASH');

  const evidenceV1 = manifest.control_proofs?.evidence_v1;
  equal(evidenceV1?.pull_request, EXPECTED.evidenceV1.pr, 'EVIDENCE_V1_PR');
  equal(evidenceV1?.head_sha, EXPECTED.evidenceV1.head, 'EVIDENCE_V1_HEAD');
  equal(evidenceV1?.status, 'HISTORICAL_SUPERSEDED_BY_V2', 'EVIDENCE_V1_STATUS');

  equal(manifest.truth?.local_asset_scan, 'NOT_EXECUTED', 'LOCAL_ASSET_SCAN_STATUS');
  equal(manifest.truth?.source_assets_modified, false, 'SOURCE_ASSETS_MODIFIED');
  equal(manifest.truth?.automatic_master_approvals, 0, 'AUTOMATIC_MASTER_APPROVALS');
  equal(manifest.truth?.character_masters, '0/4', 'CHARACTER_MASTERS');
  equal(manifest.truth?.location_masters, '0/4', 'LOCATION_MASTERS');
  equal(manifest.truth?.voice_masters, '0/3', 'VOICE_MASTERS');
  equal(manifest.truth?.real_pilot_proven, false, 'REAL_PILOT_FALSE_CLAIM');
  equal(manifest.truth?.production_ready, false, 'PRODUCTION_READY_FALSE_CLAIM');
  equal(manifest.truth?.beginner_ready, false, 'BEGINNER_READY_FALSE_CLAIM');

  const blockers = [
    'MAIN_MERGE_DECISION_REQUIRED',
    'LOCAL_ASSET_SCAN_NOT_EXECUTED',
    'REAL_MASTERS_NOT_APPROVED',
    'REAL_PILOT_NOT_PROVEN',
    'LIVE_ACTIVATION_FORBIDDEN'
  ];
  exactSet(manifest.blocked_gates, blockers, 'BLOCKED_GATES');

  const rules = [
    'fail_closed',
    'current_integration_head_required',
    'exact_product_tree_required',
    'all_workflows_green_required',
    'local_asset_scan_required',
    'human_master_approval_required',
    'real_pilot_required',
    'human_main_merge_approval_required'
  ];
  for (const rule of rules) equal(manifest.release_rules?.[rule], true, `RELEASE_RULE_${rule.toUpperCase()}`);

  equal(manifest.activation_controls?.oauth_allowed, false, 'OAUTH_ALLOWED');
  equal(manifest.activation_controls?.platform_accounts_connected, 0, 'PLATFORM_ACCOUNTS');
  equal(manifest.activation_controls?.network_execution_allowed, false, 'NETWORK_ALLOWED');
  equal(manifest.activation_controls?.publishing_allowed, false, 'PUBLISHING_ALLOWED');
  equal(manifest.main_merge_allowed, false, 'PROGRAM_MAIN_MERGE_ALLOWED');
  equal(manifest.live_activation_allowed, false, 'PROGRAM_LIVE_ALLOWED');

  equal(manifest.integrity?.algorithm, 'sha256', 'HASH_ALGORITHM');
  ok(HASH64.test(manifest.integrity?.manifest_sha256 || ''), 'HASH_FORMAT');
  equal(manifest.integrity.manifest_sha256, computeManifestHash(manifest), 'HASH_MISMATCH');

  if (checkRepositoryRefs) verifyRepository(manifest);

  return {
    schema_version: 2,
    repository: manifest.repository,
    decision: manifest.decision,
    program_status: manifest.program_status,
    integration_head: integration.head_sha,
    product_tree_sha: integration.product_tree_sha,
    package_sha256: integration.package_sha256,
    workflow_count: integration.runs.length,
    blocked_gates: manifest.blocked_gates,
    main_merge_allowed: false,
    live_activation_allowed: false,
    manifest_sha256: manifest.integrity.manifest_sha256,
    repository_refs_checked: checkRepositoryRefs
  };
}

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options }).trim();
}

function resolveRef(branch) {
  for (const candidate of [`refs/remotes/origin/${branch}`, `refs/heads/${branch}`]) {
    try { return git(['rev-parse', candidate]); } catch {}
  }
  fail('REF_MISSING', branch);
}

function assertAncestor(older, newer, code) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', older, newer], { stdio: 'ignore' });
  } catch {
    fail(code, `${older} !<= ${newer}`);
  }
}

function verifyRepository(manifest) {
  const integration = manifest.integration;
  equal(resolveRef('main'), EXPECTED.main, 'REPO_MAIN_REF_DRIFT');
  equal(resolveRef(integration.branch), integration.head_sha, 'REPO_INTEGRATION_REF_DRIFT');
  equal(resolveRef('worker/canon-lock'), integration.source_heads.canon_cast, 'REPO_CANON_REF_DRIFT');
  equal(resolveRef('worker/episode1-proof'), integration.source_heads.episode_pipeline, 'REPO_EPISODE_REF_DRIFT');
  equal(resolveRef('worker/current-main-growth-reintegration'), integration.source_heads.growth_shadow, 'REPO_GROWTH_REF_DRIFT');
  equal(resolveRef('worker/final-program-rehearsal'), manifest.control_proofs.final_rehearsal.head_sha, 'REPO_REHEARSAL_REF_DRIFT');
  equal(resolveRef('worker/program-evidence-gate'), manifest.control_proofs.evidence_v1.head_sha, 'REPO_EVIDENCE_V1_REF_DRIFT');

  equal(git(['rev-parse', `${integration.head_sha}^{tree}`]), integration.product_tree_sha, 'REPO_PRODUCT_TREE_DRIFT');
  const packageText = git(['show', `${integration.head_sha}:package.json`]);
  const packageHash = createHash('sha256').update(`${packageText}\n`).digest('hex');
  equal(packageHash, integration.package_sha256, 'REPO_PACKAGE_HASH_DRIFT');

  try {
    execFileSync('git', ['cat-file', '-e', `${integration.head_sha}:.github/workflows/bootstrap-controlled-integration.yml`], { stdio: 'ignore' });
    fail('REPO_BOOTSTRAP_PRESENT');
  } catch (error) {
    if (String(error?.message || '').includes('REPO_BOOTSTRAP_PRESENT')) throw error;
  }

  assertAncestor(EXPECTED.main, integration.head_sha, 'REPO_MAIN_NOT_ANCESTOR');
  assertAncestor(integration.source_heads.canon_cast, integration.head_sha, 'REPO_CANON_NOT_ANCESTOR');
  assertAncestor(integration.source_heads.episode_pipeline, integration.head_sha, 'REPO_EPISODE_NOT_ANCESTOR');
  assertAncestor(integration.source_heads.growth_shadow, integration.head_sha, 'REPO_GROWTH_NOT_ANCESTOR');
  ok(integration.head_sha !== EXPECTED.main, 'REPO_FALSE_MAIN_INTEGRATION');
}

async function main() {
  const args = process.argv.slice(2);
  const manifestIndex = args.indexOf('--manifest');
  const outputIndex = args.indexOf('--output');
  const manifestPath = path.resolve(manifestIndex >= 0 ? args[manifestIndex + 1] : 'project/program-evidence-v2.json');
  const outputPath = outputIndex >= 0 ? path.resolve(args[outputIndex + 1]) : null;
  const checkRepositoryRefs = !args.includes('--skip-repository-refs');

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const result = validateProgramEvidenceV2(manifest, { checkRepositoryRefs });
  const proof = {
    ...result,
    status: 'pass',
    generated_at: manifest.generated_at,
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
