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
  status: 'PROGRAM_INTEGRATION_PROVEN_ASSET_SCAN_COMPLETE_NEW_ASSET_GENERATION_REQUIRED',
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
  scan: {
    issue: 123,
    target: '9bf5c5350138371c4940475cf36fb51ba7d4ae9e',
    inventory: '542705e090d29a76d706822c929da71f3fb334d664fd38c30e798cb9f9fdbc21',
    shortlist: 'c72ddf86bb9c3d7ba3c12e6fc14f4b0adbb78b37374a213fb81a397aa6589d5b',
    zip: '3a1afaa9f81922add4a517263a7ccce4b5ba46ac093c678f811d054e838bc532'
  }
});

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}

export function computeManifestHash(manifest) {
  const copy = structuredClone(manifest);
  delete copy.integrity;
  return createHash('sha256').update(JSON.stringify(canonicalize(copy))).digest('hex');
}

const fail = (code, detail = '') => { throw new Error(`[PROGRAM_EVIDENCE_V3:${code}]${detail ? ` ${detail}` : ''}`); };
const ok = (condition, code, detail = '') => { if (!condition) fail(code, detail); };
const equal = (actual, expected, code) => ok(actual === expected, code, `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
const exactSet = (actual, expected, code) => equal(JSON.stringify([...actual].sort()), JSON.stringify([...expected].sort()), code);

function validateRuns(runs) {
  equal(runs.length, 6, 'RUN_COUNT');
  exactSet(runs.map((run) => run.workflow), Object.keys(EXPECTED.integration.runs), 'RUN_NAMES');
  for (const [workflow, [runId, artifactId, digest]] of Object.entries(EXPECTED.integration.runs)) {
    const run = runs.find((item) => item.workflow === workflow);
    ok(run, 'RUN_MISSING', workflow);
    equal(run.run_id, runId, 'RUN_ID');
    equal(run.artifact_id, artifactId, 'ARTIFACT_ID');
    equal(run.digest, digest, 'ARTIFACT_DIGEST');
    ok(DIGEST.test(run.digest), 'ARTIFACT_DIGEST_FORMAT');
  }
}

export function validateProgramEvidenceV3(manifest, { checkRepositoryRefs = false } = {}) {
  equal(manifest.schema_version, 3, 'SCHEMA_VERSION');
  equal(manifest.repository, EXPECTED.repository, 'REPOSITORY');
  equal(manifest.source_main?.branch, 'main', 'MAIN_BRANCH');
  equal(manifest.source_main?.head_sha, EXPECTED.main, 'MAIN_HEAD');
  equal(manifest.source_main?.unchanged, true, 'MAIN_CHANGED');
  equal(manifest.program_status, EXPECTED.status, 'PROGRAM_STATUS');
  equal(manifest.decision, 'PROGRAM_EVIDENCE_CURRENT', 'DECISION');

  const integration = manifest.integration;
  equal(integration.branch, EXPECTED.integration.branch, 'INTEGRATION_BRANCH');
  equal(integration.head_sha, EXPECTED.integration.head, 'INTEGRATION_HEAD');
  equal(integration.product_tree_sha, EXPECTED.integration.tree, 'PRODUCT_TREE');
  equal(integration.package_sha256, EXPECTED.integration.packageHash, 'PACKAGE_HASH');
  ok(SHA40.test(integration.head_sha) && SHA40.test(integration.product_tree_sha), 'INTEGRATION_SHA_FORMAT');
  ok(HASH64.test(integration.package_sha256), 'PACKAGE_HASH_FORMAT');
  equal(integration.status, 'ACTUAL_INTEGRATION_BRANCH_PROVEN', 'INTEGRATION_STATUS');
  equal(integration.pull_request?.number, EXPECTED.integration.pr, 'INTEGRATION_PR');
  equal(integration.pull_request?.state, 'open', 'INTEGRATION_PR_STATE');
  equal(integration.pull_request?.draft, true, 'INTEGRATION_PR_DRAFT');
  equal(integration.pull_request?.merged, false, 'INTEGRATION_FALSE_MERGE');
  equal(integration.pull_request?.base_branch, 'main', 'INTEGRATION_PR_BASE');
  equal(integration.pull_request?.base_sha, EXPECTED.main, 'INTEGRATION_PR_BASE_SHA');
  equal(integration.pull_request?.merge_test_sha, EXPECTED.integration.mergeTest, 'INTEGRATION_MERGE_TEST');
  for (const [key, value] of Object.entries(EXPECTED.integration.sourceHeads)) equal(integration.source_heads?.[key], value, `SOURCE_HEAD_${key.toUpperCase()}`);
  validateRuns(integration.runs);
  equal(integration.main_merge_allowed, false, 'INTEGRATION_MAIN_MERGE_ALLOWED');
  equal(integration.live_activation_allowed, false, 'INTEGRATION_LIVE_ALLOWED');

  const scan = manifest.local_asset_scan;
  equal(scan.issue, EXPECTED.scan.issue, 'SCAN_ISSUE');
  equal(scan.issue_state, 'closed', 'SCAN_ISSUE_STATE');
  equal(scan.state_reason, 'completed', 'SCAN_ISSUE_REASON');
  equal(scan.target_commit, EXPECTED.scan.target, 'SCAN_TARGET');
  equal(scan.status, 'COMPLETE_NO_TRUSTWORTHY_CANDIDATES', 'SCAN_STATUS');
  equal(scan.scanner_version, '1.0.0', 'SCANNER_VERSION');
  equal(scan.analyzer_version, '1.1.0', 'ANALYZER_VERSION');
  equal(scan.scanned_roots, 5, 'SCANNED_ROOTS');
  equal(scan.missing_optional_roots, 10, 'MISSING_ROOTS');
  equal(scan.files, 6215, 'SCAN_FILES');
  equal(scan.likely_candidates, 222, 'LIKELY_CANDIDATES');
  equal(scan.errors, 0, 'SCAN_ERRORS');
  equal(scan.duplicate_groups, 249, 'DUPLICATE_GROUPS');
  equal(scan.model_files, 0, 'MODEL_FILES');
  equal(scan.model_bytes, 0, 'MODEL_BYTES');
  equal(scan.model_plan_documents, 6, 'MODEL_PLAN_DOCUMENTS');
  equal(scan.shortlist_targets, 8, 'SHORTLIST_TARGETS');
  equal(scan.ranked_candidates, 0, 'RANKED_CANDIDATES');
  equal(scan.targets_with_candidates, 0, 'TARGETS_WITH_CANDIDATES');
  equal(scan.source_assets_modified, false, 'SOURCE_ASSETS_MODIFIED');
  equal(scan.automatic_master_approvals, 0, 'AUTOMATIC_MASTER_APPROVALS');
  equal(scan.automatic_canon_approval, false, 'AUTOMATIC_CANON_APPROVAL');
  equal(scan.inventory_sha256, EXPECTED.scan.inventory, 'INVENTORY_HASH');
  equal(scan.shortlist_sha256, EXPECTED.scan.shortlist, 'SHORTLIST_HASH');
  equal(scan.zip_sha256, EXPECTED.scan.zip, 'ZIP_HASH');
  for (const [target, decision] of Object.entries(scan.targets || {})) equal(decision, 'NO_TRUSTWORTHY_CANDIDATE', `TARGET_${target.toUpperCase()}`);
  equal(Object.keys(scan.targets || {}).length, 8, 'TARGET_COUNT');

  equal(manifest.truth?.character_masters, '0/4', 'CHARACTER_MASTERS');
  equal(manifest.truth?.location_masters, '0/4', 'LOCATION_MASTERS');
  equal(manifest.truth?.voice_masters, '0/3', 'VOICE_MASTERS');
  equal(manifest.truth?.real_pilot_proven, false, 'REAL_PILOT_FALSE_CLAIM');
  equal(manifest.truth?.production_ready, false, 'PRODUCTION_READY_FALSE_CLAIM');
  equal(manifest.truth?.beginner_ready, false, 'BEGINNER_READY_FALSE_CLAIM');

  exactSet(manifest.blocked_gates, [
    'MAIN_MERGE_DECISION_REQUIRED',
    'NEW_ASSET_GENERATION_REQUIRED',
    'REAL_MASTERS_NOT_APPROVED',
    'REAL_PILOT_NOT_PROVEN',
    'LIVE_ACTIVATION_FORBIDDEN'
  ], 'BLOCKED_GATES');

  equal(manifest.activation_controls?.oauth_allowed, false, 'OAUTH_ALLOWED');
  equal(manifest.activation_controls?.platform_accounts_connected, 0, 'PLATFORM_ACCOUNTS');
  equal(manifest.activation_controls?.network_execution_allowed, false, 'NETWORK_ALLOWED');
  equal(manifest.activation_controls?.publishing_allowed, false, 'PUBLISHING_ALLOWED');
  equal(manifest.main_merge_allowed, false, 'PROGRAM_MAIN_MERGE_ALLOWED');
  equal(manifest.live_activation_allowed, false, 'PROGRAM_LIVE_ALLOWED');
  equal(manifest.integrity?.algorithm, 'sha256', 'HASH_ALGORITHM');
  ok(HASH64.test(manifest.integrity?.manifest_sha256 || ''), 'HASH_FORMAT');
  equal(manifest.integrity.manifest_sha256, computeManifestHash(manifest), 'HASH_MISMATCH');

  if (checkRepositoryRefs) {
    const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    equal(git(['rev-parse', 'refs/remotes/origin/main']), EXPECTED.main, 'REPO_MAIN_REF_DRIFT');
    equal(git(['rev-parse', `refs/remotes/origin/${EXPECTED.integration.branch}`]), EXPECTED.integration.head, 'REPO_INTEGRATION_REF_DRIFT');
    equal(git(['rev-parse', `${EXPECTED.integration.head}^{tree}`]), EXPECTED.integration.tree, 'REPO_PRODUCT_TREE_DRIFT');
  }

  return {
    schema_version: 3,
    program_status: manifest.program_status,
    integration_head: integration.head_sha,
    local_asset_scan: scan.status,
    files_scanned: scan.files,
    ranked_candidates: scan.ranked_candidates,
    model_files: scan.model_files,
    blocked_gates: manifest.blocked_gates,
    main_merge_allowed: false,
    live_activation_allowed: false,
    manifest_sha256: manifest.integrity.manifest_sha256,
    repository_refs_checked: checkRepositoryRefs
  };
}

async function main() {
  const args = process.argv.slice(2);
  const manifestIndex = args.indexOf('--manifest');
  const outputIndex = args.indexOf('--output');
  const manifestPath = path.resolve(manifestIndex >= 0 ? args[manifestIndex + 1] : 'project/program-evidence-v3.json');
  const outputPath = outputIndex >= 0 ? path.resolve(args[outputIndex + 1]) : null;
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const result = validateProgramEvidenceV3(manifest, { checkRepositoryRefs: !args.includes('--skip-repository-refs') });
  if (outputPath) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify({ ...result, status: 'pass' }, null, 2)}\n`);
  }
  console.log(JSON.stringify(result));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
