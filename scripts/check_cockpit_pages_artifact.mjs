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
ok(contract.activeGate?.id === 'LR5.1' && contract.activeGate?.trackingIssue === 88, 'ACTIVE_GATE');
ok(contract.nextAllowedStep?.decision === 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'DECISION');
ok(contract.sections?.length === 6, 'SECTIONS');
ok(Object.values(contract.boundaries || {}).every((entry) => entry === false), 'BOUNDARIES');
ok(contract.counts?.seriesUniverseCharacters === 13, 'SERIES_COUNT');
ok(contract.counts?.activePilotCastCharacters === 4, 'PILOT_COUNT');
ok(contract.counts?.legacyAssetInventoryCharacters === 13, 'LEGACY_COUNT');
ok(contract.counts?.productionSheetsAvailable === 9, 'PRODUCTION_SHEETS');
ok(contract.counts?.loraTrainingSheetsAvailable === 6, 'LORA_SHEETS');
ok(contract.counts?.characterMastersApproved === 0 && contract.counts?.approvedVisualMasters === 0 && contract.counts?.reviewedEpisodes === 0, 'FALSE_PROGRESS');
ok(canon.counts?.seriesUniverseCharacters === contract.counts.seriesUniverseCharacters, 'CANON_SERIES_MATCH');
ok(canon.counts?.activePilotCastCharacters === contract.counts.activePilotCastCharacters, 'CANON_PILOT_MATCH');
ok(canon.seriesUniverse?.length === 13 && canon.activePilotCast?.length === 4, 'CANON_LISTS');
ok(canon.approvedVisualMasters?.length === 0, 'CANON_MASTERS');

ok(proof.status === 'pass', 'PROOF_STATUS');
ok(proof.commit === expected, 'PROOF_COMMIT', `${proof.commit} != ${expected}`);
ok(proof.route.endsWith('/studio/#cockpit'), 'PROOF_ROUTE');
ok(proof.trackingIssue === 117, 'PROOF_TRACKING');
ok(proof.activeGate === 'LR5.1' && proof.activeWorkPackage === 88, 'PROOF_GATE');
ok(proof.nextDecision === 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'PROOF_DECISION');
ok(proof.seriesUniverseCharacters === 13 && proof.activePilotCastCharacters === 4, 'PROOF_CAST_COUNTS');
ok(proof.legacyAssetInventoryCharacters === 13, 'PROOF_LEGACY_COUNT');
ok(proof.productionSheetsAvailable === 9 && proof.loraTrainingSheetsAvailable === 6, 'PROOF_SHEET_COUNTS');
ok(proof.verifiedReferenceImages === 0 && proof.approvedVisualMasters === 0, 'PROOF_VISUAL_STATE');
ok(proof.workspaceCount === 6, 'PROOF_WORKSPACES');
ok(proof.executableButtons === 0 && proof.externalRequests === 0 && proof.imageCount === 0 && proof.canvasCount === 0 && proof.iframeCount === 0, 'PROOF_SURFACE');
for (const field of ['imageGenerationAllowed', 'creativeApprovalGranted', 'productionReady', 'beginnerReady', 'growthOsIntegrated']) ok(proof[field] === false, `PROOF_${field}`);
ok(proof.targets?.length === 2, 'TARGETS');

for (const target of proof.targets) {
  ok(target.checks?.metrics === 6, 'VISIBLE_METRICS', target.name);
  ok(target.checks?.workspaces === 6, 'VISIBLE_WORKSPACES', target.name);
  ok(target.checks?.activeWorkspaces === 1, 'VISIBLE_ACTIVE', target.name);
  ok(target.checks?.boundaries === 6, 'VISIBLE_BOUNDARIES', target.name);
  ok(target.checks?.seriesUniverse === 13, 'VISIBLE_SERIES', target.name);
  ok(target.checks?.activePilotCast === 4, 'VISIBLE_PILOT', target.name);
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
  seriesUniverseCharacters: 13,
  activePilotCastCharacters: 4,
  legacyAssetInventoryCharacters: 13,
  productionSheetsAvailable: 9,
  loraTrainingSheetsAvailable: 6,
  verifiedReferenceImages: 0,
  approvedVisualMasters: 0,
  productionReady: false,
  beginnerReady: false,
  creativeApprovalGranted: false,
  targets: 2
}, null, 2));
