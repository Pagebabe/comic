import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HASH64 = /^[a-f0-9]{64}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;

const EXPECTED = Object.freeze({
  repository: 'Pagebabe/comic',
  main: 'b58534d0a737b1d01834628177e1090de027de61',
  status: 'PROGRAM_FACTORY_INTEGRATION_PROVEN_MAIN_BLOCKED',
  worker1: { head: '1bb4df874d8e2a36fd32fbad19074ed629ec922d', merge: '2139c5f772f4136185d65d073cc605e2f2766d57', pr: 138 },
  worker2: { head: 'e8b8e348120ad527abe7a33caab9f56b6627f8c2', merge: 'eb07bc9ab5536d89ccc01ccccbd5aaeabf82d3b3', pr: 140 },
  worker3: { head: 'c8c0adcef30645142190c19d8fbc6903fe177ae7', pr: 139 },
  integration: {
    branch: 'integration/factory-final-heads',
    head: 'eb07bc9ab5536d89ccc01ccccbd5aaeabf82d3b3',
    pr: 144,
    mergeTest: '9583298db30e2860111b744e07d013199783b578',
    runs: {
      'Comic Factory CI': [29189949177, 8259201718, 'sha256:2015269af652d29035ad18a184315e88fa10564fec55d4160c4977da53453a91'],
      'Fresh Install Drill': [29189949186, 8259199794, 'sha256:600a88f638596bf970409b0ec8afedcd7959baf4bc4d4874e8b35615be23bbdf'],
      'Operator Recovery Drill': [29189949188, 8259192606, 'sha256:fb1a2cbd63ed324c80ed384d467072a91ebc909238a8ae7dc65f95c1b127a780'],
      'Worker 2 Episode 1 Production Proof': [29189949214, 8259198679, 'sha256:1005ee99f4fdf48925224cb3cb3843688a8945c854380b02d82eaeedb70cf478']
    }
  },
  rehearsal: {
    head: 'efbeb4a6468ca77aac6412e50ea9e606df313f14',
    run: 29189811909,
    artifact: 8259156073,
    digest: 'sha256:5953faeda918bd4ff23d3fbe70114ce102874c7e6bdff239fb0de0ec9ba4183b'
  },
  growth: {
    mkt0: '4b4673f2d068e3b8c1e007daf1cda763d9836ed3',
    pr131: '9573757dbd9b39858ebae2b37337d2728a3455e4'
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

const fail = (code, detail = '') => {
  throw new Error(`[PROGRAM_EVIDENCE:${code}]${detail ? ` ${detail}` : ''}`);
};
const ok = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};
const equal = (actual, expected, code, detail = '') => {
  ok(actual === expected, code, `${detail}${detail ? ' · ' : ''}${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
};
const exactSet = (actual, expected, code) => {
  const left = [...actual].sort();
  const right = [...expected].sort();
  ok(JSON.stringify(left) === JSON.stringify(right), code, `${left.join(',')} != ${right.join(',')}`);
};
const worker = (manifest, id) => manifest.workers.find((entry) => entry.worker_id === id);

function validateRunPacket(packet) {
  equal(packet.runs.length, 4, 'FACTORY_RUN_COUNT');
  exactSet(packet.runs.map((run) => run.workflow), Object.keys(EXPECTED.integration.runs), 'FACTORY_RUN_NAMES');
  for (const [workflow, [runId, artifactId, digest]] of Object.entries(EXPECTED.integration.runs)) {
    const run = packet.runs.find((entry) => entry.workflow === workflow);
    ok(run, 'FACTORY_RUN_MISSING', workflow);
    equal(run.run_id, runId, 'FACTORY_RUN_ID', workflow);
    equal(run.artifact_id, artifactId, 'FACTORY_ARTIFACT_ID', workflow);
    equal(run.digest, digest, 'FACTORY_DIGEST', workflow);
    ok(DIGEST.test(run.digest), 'FACTORY_DIGEST_FORMAT', workflow);
  }
}

export function validateProgramEvidence(manifest, { checkRepositoryRefs = false } = {}) {
  equal(manifest.schema_version, 1, 'SCHEMA_VERSION');
  equal(manifest.repository, EXPECTED.repository, 'REPOSITORY');
  equal(manifest.source_main?.branch, 'main', 'MAIN_BRANCH');
  equal(manifest.source_main?.head_sha, EXPECTED.main, 'MAIN_HEAD');
  equal(manifest.source_main?.unchanged, true, 'MAIN_NOT_UNCHANGED');
  equal(manifest.program_status, EXPECTED.status, 'PROGRAM_STATUS');
  equal(manifest.decision, 'PROGRAM_EVIDENCE_GATE_READY', 'DECISION');

  ok(Array.isArray(manifest.workers), 'WORKERS_ARRAY');
  exactSet(manifest.workers.map((entry) => entry.worker_id), [1, 2, 3], 'WORKER_IDS');

  const w1 = worker(manifest, 1);
  equal(w1.head_sha, EXPECTED.worker1.head, 'WORKER_1_HEAD');
  equal(w1.status, 'CANON_CAST_SEPARATION_PROVEN', 'WORKER_1_STATUS');
  equal(w1.pr.number, EXPECTED.worker1.pr, 'WORKER_1_PR');
  equal(w1.pr.state, 'closed', 'WORKER_1_PR_STATE');
  equal(w1.pr.merged, true, 'WORKER_1_NOT_MERGED_TO_INTEGRATION');
  equal(w1.pr.base, EXPECTED.integration.branch, 'WORKER_1_PR_BASE');
  equal(w1.pr.merge_commit_sha, EXPECTED.worker1.merge, 'WORKER_1_MERGE_COMMIT');
  equal(w1.merged_to_main, false, 'WORKER_1_FALSE_MAIN_MERGE');

  const w2 = worker(manifest, 2);
  equal(w2.head_sha, EXPECTED.worker2.head, 'WORKER_2_HEAD');
  equal(w2.status, 'EPISODE_PIPELINE_PROVEN', 'WORKER_2_STATUS');
  equal(w2.pr.number, EXPECTED.worker2.pr, 'WORKER_2_PR');
  equal(w2.pr.state, 'closed', 'WORKER_2_PR_STATE');
  equal(w2.pr.merged, true, 'WORKER_2_NOT_MERGED_TO_INTEGRATION');
  equal(w2.pr.base, EXPECTED.integration.branch, 'WORKER_2_PR_BASE');
  equal(w2.pr.merge_commit_sha, EXPECTED.worker2.merge, 'WORKER_2_MERGE_COMMIT');
  equal(w2.technical_only, true, 'WORKER_2_TECHNICAL_BOUNDARY');
  equal(w2.real_pilot_proven, false, 'WORKER_2_FALSE_REAL_PILOT');
  equal(w2.merged_to_main, false, 'WORKER_2_FALSE_MAIN_MERGE');
  for (const item of ['NO_CREATIVE_APPROVAL','NO_CHARACTER_LOCK','NO_LOCATION_LOCK','NO_STYLE_LOCK','NO_VOICE_LOCK','NO_REAL_PILOT_EPISODE']) {
    ok(w2.non_claims.includes(item), 'WORKER_2_NON_CLAIM_MISSING', item);
  }

  const w3 = worker(manifest, 3);
  equal(w3.head_sha, EXPECTED.worker3.head, 'WORKER_3_HEAD');
  equal(w3.pr.number, EXPECTED.worker3.pr, 'WORKER_3_PR');
  equal(w3.pr.state, 'open', 'WORKER_3_PR_STATE');
  equal(w3.pr.merged, false, 'WORKER_3_FALSE_MERGE');
  equal(w3.merged_to_main, false, 'WORKER_3_FALSE_MAIN_MERGE');

  const integration = manifest.factory_integration;
  equal(integration.branch, EXPECTED.integration.branch, 'FACTORY_BRANCH');
  equal(integration.head_sha, EXPECTED.integration.head, 'FACTORY_HEAD');
  equal(integration.status, 'FACTORY_INTEGRATION_PROVEN', 'FACTORY_STATUS');
  equal(integration.pr.number, EXPECTED.integration.pr, 'FACTORY_PR');
  equal(integration.pr.state, 'open', 'FACTORY_PR_STATE');
  equal(integration.pr.draft, true, 'FACTORY_PR_NOT_DRAFT');
  equal(integration.pr.merged, false, 'FACTORY_FALSE_MAIN_MERGE');
  equal(integration.pr.base, 'main', 'FACTORY_PR_BASE');
  equal(integration.pr.base_sha, EXPECTED.main, 'FACTORY_PR_BASE_SHA');
  equal(integration.pr.merge_test_sha, EXPECTED.integration.mergeTest, 'FACTORY_MERGE_TEST');
  equal(integration.contains.length, 2, 'FACTORY_CONTAINS_COUNT');
  equal(integration.contains.find((entry) => entry.worker_id === 1)?.merge_commit_sha, EXPECTED.worker1.merge, 'FACTORY_WORKER_1_MERGE');
  equal(integration.contains.find((entry) => entry.worker_id === 2)?.merge_commit_sha, EXPECTED.worker2.merge, 'FACTORY_WORKER_2_MERGE');
  validateRunPacket(integration);
  equal(integration.main_merge_allowed, false, 'FACTORY_MAIN_MERGE_ALLOWED');
  equal(integration.growth_included, false, 'FACTORY_GROWTH_INCLUDED');
  equal(integration.live_activation_allowed, false, 'FACTORY_LIVE_ALLOWED');

  const rehearsal = manifest.merge_rehearsal;
  equal(rehearsal.head_sha, EXPECTED.rehearsal.head, 'REHEARSAL_HEAD');
  equal(rehearsal.run_id, EXPECTED.rehearsal.run, 'REHEARSAL_RUN');
  equal(rehearsal.artifact_id, EXPECTED.rehearsal.artifact, 'REHEARSAL_ARTIFACT');
  equal(rehearsal.digest, EXPECTED.rehearsal.digest, 'REHEARSAL_DIGEST');
  equal(rehearsal.factory_workers_composable, true, 'FACTORY_NOT_COMPOSABLE');
  equal(rehearsal.growth_conflict_path, 'package.json', 'GROWTH_CONFLICT_PATH');
  equal(rehearsal.rollback_clean, true, 'REHEARSAL_ROLLBACK_DIRTY');

  const growth = manifest.growth_dependency;
  equal(growth.mkt0_head_sha, EXPECTED.growth.mkt0, 'MKT0_HEAD');
  equal(growth.behind_main_by, 344, 'MKT0_BEHIND');
  equal(growth.pr.number, 131, 'PR_131_NUMBER');
  equal(growth.pr.head_sha, EXPECTED.growth.pr131, 'PR_131_HEAD');
  equal(growth.pr.state, 'open', 'PR_131_STATE');
  equal(growth.pr.merged, false, 'PR_131_FALSE_MERGE');
  equal(growth.status, 'CURRENT_MAIN_REINTEGRATION_REQUIRED', 'GROWTH_STATUS');
  equal(growth.conflict_path, 'package.json', 'GROWTH_CONFLICT');
  equal(growth.satisfied, false, 'GROWTH_FALSE_SATISFACTION');

  const blockers = [
    'FACTORY_MAIN_MERGE_BLOCKED',
    'MKT0_CURRENT_MAIN_REINTEGRATION_NOT_PROVEN',
    'PR_131_AND_WORKER_3_STACK_NOT_REBASED_TO_CURRENT_MAIN',
    'LOCAL_ASSET_SCAN_NOT_EXECUTED',
    'REAL_MASTERS_NOT_APPROVED',
    'REAL_PILOT_NOT_PROVEN',
    'LIVE_ACTIVATION_FORBIDDEN'
  ];
  exactSet(manifest.blocked_gates, blockers, 'BLOCKED_GATES');
  ok(!manifest.blocked_gates.includes('PROGRAM_INTEGRATION_NOT_PROVEN'), 'OBSOLETE_FACTORY_BLOCKER');

  for (const rule of ['fail_closed','current_heads_required','factory_integration_required','growth_reintegration_required','local_asset_scan_required','human_master_approval_required','real_pilot_required','human_main_merge_approval_required']) {
    equal(manifest.release_rules?.[rule], true, `RELEASE_RULE_${rule.toUpperCase()}`);
  }
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
    repository: manifest.repository,
    decision: manifest.decision,
    program_status: manifest.program_status,
    factory_head: integration.head_sha,
    factory_integration_proven: true,
    main_merge_allowed: false,
    growth_included: false,
    blocked_gates: manifest.blocked_gates,
    manifest_sha256: manifest.integrity.manifest_sha256,
    repository_refs_checked: checkRepositoryRefs
  };
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function ref(branch) {
  for (const candidate of [`refs/remotes/origin/${branch}`, `refs/heads/${branch}`]) {
    try { return git(['rev-parse', candidate]); } catch {}
  }
  fail('REF_MISSING', branch);
}
function ancestor(older, newer, code) {
  try { execFileSync('git', ['merge-base', '--is-ancestor', older, newer], { stdio: 'ignore' }); }
  catch { fail(code, `${older} !<= ${newer}`); }
}
function objectExists(commit, file) {
  try { execFileSync('git', ['cat-file', '-e', `${commit}:${file}`], { stdio: 'ignore' }); }
  catch { fail('REPOSITORY_ARTIFACT_MISSING', `${commit}:${file}`); }
}
function verifyRepository(manifest) {
  equal(ref('main'), EXPECTED.main, 'MAIN_REF_DRIFT');
  equal(ref('worker/canon-lock'), EXPECTED.worker1.head, 'WORKER_1_REF_DRIFT');
  equal(ref('worker/episode1-proof'), EXPECTED.worker2.head, 'WORKER_2_REF_DRIFT');
  equal(ref('worker/mkt0-shadow-integration'), EXPECTED.worker3.head, 'WORKER_3_REF_DRIFT');
  equal(ref(EXPECTED.integration.branch), EXPECTED.integration.head, 'FACTORY_REF_DRIFT');
  equal(ref('feature/mkt0-growth-os-rebased'), EXPECTED.growth.mkt0, 'MKT0_REF_DRIFT');
  equal(ref('feature/mkt1-001-factory-handoff'), EXPECTED.growth.pr131, 'PR_131_REF_DRIFT');

  ancestor(EXPECTED.main, EXPECTED.integration.head, 'MAIN_NOT_ANCESTOR_OF_FACTORY');
  ancestor(EXPECTED.worker1.head, EXPECTED.integration.head, 'WORKER_1_NOT_IN_FACTORY');
  ancestor(EXPECTED.worker2.head, EXPECTED.integration.head, 'WORKER_2_NOT_IN_FACTORY');

  for (const file of [
    'project/cast-canon-v1.json',
    'docs/canon/CAST_CANON.md',
    'docs/reports/WORKER_1_CANON_REPORT.md',
    'docs/reports/WORKER_2_EPISODE_PROOF_REPORT.md',
    '.github/workflows/episode1-production-proof.yml',
    'tests/episode1-proof-contract.test.mjs'
  ]) objectExists(EXPECTED.integration.head, file);

  ok(EXPECTED.integration.head !== EXPECTED.main, 'FACTORY_EQUALS_MAIN');
  equal(manifest.factory_integration.growth_included, false, 'REPOSITORY_GROWTH_INCLUDED');
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
  const proof = { ...result, status: 'pass', deterministic_repeat: computeManifestHash(manifest) === computeManifestHash(structuredClone(manifest)) };
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
