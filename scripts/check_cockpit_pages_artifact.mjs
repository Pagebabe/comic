import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const site = resolve(value('--site', '_site'));
const expected = value('--expect-commit', process.env.GITHUB_SHA || '');
const fail = (code, detail = '') => { throw new Error(`[COCKPIT_ARTIFACT:${code}]${detail ? ` ${detail}` : ''}`); };
const ok = (condition, code, detail = '') => { if (!condition) fail(code, detail); };
async function req(file) { const target = resolve(site, file); try { await access(target); } catch { fail('MISSING', file); } return target; }
async function json(file) { return JSON.parse(await readFile(await req(file), 'utf8')); }
async function sha(file) { return createHash('sha256').update(await readFile(await req(file))).digest('hex'); }

for (const file of [
  'project/production-cockpit-v1.json',
  'project/cast-canon-v1.json',
  'proof/cockpit/production-cockpit-runtime-evidence.json',
  'proof/cockpit/production-cockpit-desktop.png',
  'proof/cockpit/production-cockpit-mobile.png'
]) await req(file);

const [contract, canon, proof] = await Promise.all([
  json('project/production-cockpit-v1.json'),
  json('project/cast-canon-v1.json'),
  json('proof/cockpit/production-cockpit-runtime-evidence.json')
]);

ok(Boolean(expected), 'EXPECTED_COMMIT');
ok(contract.status === 'WORKING_COCKPIT_V1', 'STATUS');
ok(contract.route === '/studio/#cockpit', 'ROUTE');
ok(contract.trackingIssue === 117, 'TRACKING_ISSUE');
ok(contract.activeGate?.id === 'CANON-LOCK' && contract.activeGate?.trackingIssue === 117, 'ACTIVE_GATE');
ok(contract.nextAllowedStep?.decision === 'VERIFY_MISSING_CAST_ASSETS', 'DECISION');
ok(contract.sections?.length === 6, 'SECTIONS');
ok(Object.values(contract.boundaries || {}).every((entry) => entry === false), 'BOUNDARIES');
ok(contract.counts?.activeCanonCharacters === 13, 'ACTIVE_COUNT');
ok(contract.counts?.variantCharacters === 4, 'VARIANT_COUNT');
ok(contract.counts?.productionSheetsAvailable === 9, 'PRODUCTION_SHEETS');
ok(contract.counts?.loraTrainingSheetsAvailable === 6, 'LORA_SHEETS');
ok(contract.counts?.characterMastersApproved === 0 && contract.counts?.trustedVisualMasters === 0 && contract.counts?.reviewedEpisodes === 0, 'FALSE_PROGRESS');
ok(canon.counts?.activeCanonCharacters === contract.counts.activeCanonCharacters, 'CANON_ACTIVE_MATCH');
ok(canon.counts?.variantCharacters === contract.counts.variantCharacters, 'CANON_VARIANT_MATCH');
ok(canon.activeCast?.length === 13 && canon.variantCast?.length === 4, 'CANON_LISTS');

ok(proof.status === 'pass', 'PROOF_STATUS');
ok(proof.commit === expected, 'PROOF_COMMIT', `${proof.commit} != ${expected}`);
ok(proof.route.endsWith('/studio/#cockpit'), 'PROOF_ROUTE');
ok(proof.trackingIssue === 117, 'PROOF_TRACKING');
ok(proof.activeGate === 'CANON-LOCK' && proof.activeWorkPackage === 117, 'PROOF_GATE');
ok(proof.nextDecision === 'VERIFY_MISSING_CAST_ASSETS', 'PROOF_DECISION');
ok(proof.activeCanonCharacters === 13 && proof.variantCharacters === 4, 'PROOF_CAST_COUNTS');
ok(proof.productionSheetsAvailable === 9 && proof.loraTrainingSheetsAvailable === 6, 'PROOF_SHEET_COUNTS');
ok(proof.trustedVisualMasters === 0, 'PROOF_MASTERS');
ok(proof.workspaceCount === 6, 'PROOF_WORKSPACES');
ok(proof.executableButtons === 0 && proof.externalRequests === 0 && proof.imageCount === 0 && proof.canvasCount === 0 && proof.iframeCount === 0, 'PROOF_SURFACE');
for (const field of ['imageGenerationAllowed', 'creativeApprovalGranted', 'productionReady', 'beginnerReady', 'growthOsIntegrated']) ok(proof[field] === false, `PROOF_${field}`);
ok(proof.targets?.length === 2, 'TARGETS');

for (const target of proof.targets) {
  ok(target.checks?.metrics === 6, 'VISIBLE_METRICS', target.name);
  ok(target.checks?.workspaces === 6, 'VISIBLE_WORKSPACES', target.name);
  ok(target.checks?.activeWorkspaces === 1, 'VISIBLE_ACTIVE', target.name);
  ok(target.checks?.boundaries === 6, 'VISIBLE_BOUNDARIES', target.name);
  ok(target.checks?.activeCast === 13, 'VISIBLE_ACTIVE_CAST', target.name);
  ok(target.checks?.variants === 4, 'VISIBLE_VARIANTS', target.name);
  ok(target.checks?.buttons === 0 && target.checks?.images === 0 && target.checks?.canvas === 0 && target.checks?.iframe === 0, 'VISIBLE_SURFACE', target.name);
  ok(target.checks?.overflow <= 2, 'OVERFLOW', target.name);
  ok(Boolean(target.sha256), 'HASH_MISSING', target.name);
  const actual = await sha(`proof/cockpit/production-cockpit-${target.name}.png`);
  ok(actual === target.sha256, 'HASH_MISMATCH', target.name);
}

console.log(JSON.stringify({
  status: 'pass',
  expectedCommit: expected,
  route: contract.route,
  workspaces: 6,
  currentTask: contract.currentTask.title,
  nextDecision: contract.nextAllowedStep.decision,
  activeCanonCharacters: 13,
  variantCharacters: 4,
  productionSheetsAvailable: 9,
  loraTrainingSheetsAvailable: 6,
  trustedVisualMasters: 0,
  productionReady: false,
  beginnerReady: false,
  creativeApprovalGranted: false,
  targets: 2
}, null, 2));
