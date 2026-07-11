import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const proofDir = resolve(valueAfter('--dir', '/tmp/readiness-public-proof'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');

function fail(code, detail = '') { throw new Error(`[READINESS_PUBLIC:${code}]${detail ? ` ${detail}` : ''}`); }
function assert(condition, code, detail = '') { if (!condition) fail(code, detail); }
async function requireFile(relativePath) {
  const path = resolve(proofDir, relativePath);
  try { await access(path); } catch { fail('MISSING_FILE', relativePath); }
  return path;
}
async function json(relativePath) {
  const path = await requireFile(relativePath);
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { fail('INVALID_JSON', `${relativePath}: ${error.message}`); }
}
async function text(relativePath) { return readFile(await requireFile(relativePath), 'utf8'); }
async function sha256(relativePath) { return createHash('sha256').update(await readFile(await requireFile(relativePath))).digest('hex'); }

const [runtime, status, readiness, acceptance, academyProof, readinessProof, protocol] = await Promise.all([
  json('runtime-evidence.json'),
  json('production-academy-status.json'),
  json('production-readiness-v1.json'),
  json('novice-acceptance-template.json'),
  json('academy/academy-runtime-evidence.json'),
  json('readiness/academy-readiness-runtime-evidence.json'),
  text('NOVICE_ACCEPTANCE_PROTOCOL.md')
]);

assert(Boolean(expectedCommit), 'EXPECTED_COMMIT');
assert(runtime.status === 'pass', 'RUNTIME_STATUS');
assert(runtime.commit === expectedCommit, 'RUNTIME_COMMIT', `${runtime.commit} != ${expectedCommit}`);
assert(runtime.activeGate === 'LR5', 'ACTIVE_GATE');
assert(runtime.activeWorkPackage === 'LR5.1', 'ACTIVE_WORK_PACKAGE');

assert(status.status === 'proven_guided_training_ready_novice_acceptance_open', 'ACADEMY_STATUS');
assert(status.readiness?.status === 'NOT_PRODUCTION_READY', 'ACADEMY_READINESS');
assert(status.readiness?.productionReady === false, 'ACADEMY_PRODUCTION_BOUNDARY');
assert(status.readiness?.beginnerReady === false, 'ACADEMY_BEGINNER_BOUNDARY');
assert(status.readiness?.observedNoviceRunPassed === false, 'ACADEMY_NOVICE_BOUNDARY');
assert(status.readiness?.completeReviewedEpisodeExists === false, 'ACADEMY_EPISODE_BOUNDARY');

assert(readiness.status === 'NOT_PRODUCTION_READY', 'READINESS_STATUS');
assert(readiness.currentScore?.display === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN', 'READINESS_SCORE');
assert(readiness.gates?.length === 10, 'READINESS_GATES');
assert(readiness.academyBoundary?.productionReady === false, 'READINESS_PRODUCTION_BOUNDARY');
assert(readiness.academyBoundary?.beginnerReady === false, 'READINESS_BEGINNER_BOUNDARY');
assert(readiness.academyBoundary?.imageGenerationAllowed === false, 'READINESS_IMAGE_BOUNDARY');
assert(readiness.academyBoundary?.creativeApprovalGranted === false, 'READINESS_CREATIVE_BOUNDARY');
assert(readiness.academyBoundary?.growthOsIntegrated === false, 'READINESS_GROWTH_BOUNDARY');
assert(readiness.parallelLineBoundary?.sharedIntegrationSmokePassed === false, 'READINESS_GROWTH_SMOKE');

assert(acceptance.status === 'TEMPLATE_NOT_EXECUTED', 'ACCEPTANCE_STATUS');
assert(acceptance.tasks?.length === 12, 'ACCEPTANCE_TASKS');
assert(acceptance.result?.decision === 'NOT_EXECUTED', 'ACCEPTANCE_DECISION');
assert(protocol.includes('12/12 ohne undokumentierte Hilfe'), 'PROTOCOL_SCORE');
assert(protocol.includes('10/10 PRODUCTION_READY'), 'PROTOCOL_TEN_OF_TEN');

assert(academyProof.status === 'pass', 'ACADEMY_PROOF_STATUS');
assert(academyProof.commit === expectedCommit, 'ACADEMY_PROOF_COMMIT');
assert(academyProof.stageCount === 12, 'ACADEMY_STAGES');
assert(academyProof.trainingPathPassed === true, 'ACADEMY_TRAINING');
assert(academyProof.productionHumanGatesPassed === true, 'ACADEMY_HUMAN_GATES');
assert(academyProof.creativeApprovalGranted === false, 'ACADEMY_CREATIVE_BOUNDARY');
assert(academyProof.finalEpisodeApprovalGranted === false, 'ACADEMY_FINAL_BOUNDARY');
assert(academyProof.targets?.length === 2, 'ACADEMY_TARGETS');

assert(readinessProof.status === 'pass', 'READINESS_PROOF_STATUS');
assert(readinessProof.commit === expectedCommit, 'READINESS_PROOF_COMMIT');
assert(readinessProof.readinessScore === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN', 'READINESS_PROOF_SCORE');
assert(readinessProof.readinessGates === 10, 'READINESS_PROOF_GATES');
assert(readinessProof.noviceTasks === 12, 'READINESS_PROOF_TASKS');
assert(readinessProof.productionReady === false, 'READINESS_PROOF_PRODUCTION');
assert(readinessProof.beginnerReady === false, 'READINESS_PROOF_BEGINNER');
assert(readinessProof.observedNoviceRunPassed === false, 'READINESS_PROOF_NOVICE');
assert(readinessProof.completeReviewedEpisodeExists === false, 'READINESS_PROOF_EPISODE');
assert(readinessProof.imageGenerationAllowed === false, 'READINESS_PROOF_IMAGE');
assert(readinessProof.creativeApprovalGranted === false, 'READINESS_PROOF_CREATIVE');
assert(readinessProof.growthOsIntegrated === false, 'READINESS_PROOF_GROWTH');
assert(readinessProof.externalRequests === 0, 'READINESS_PROOF_EXTERNAL');
assert(readinessProof.targets?.length === 2, 'READINESS_PROOF_TARGETS');

for (const target of academyProof.targets) {
  const actual = await sha256(`academy/${target.screenshot}`);
  assert(actual === target.sha256, 'ACADEMY_SCREENSHOT_HASH', `${target.target?.name || target.name}: ${actual} != ${target.sha256}`);
}
for (const target of readinessProof.targets) {
  assert(target.checks?.gateCount === 10, 'VISIBLE_GATES', target.name);
  assert(target.checks?.acceptanceTasks === 12, 'VISIBLE_TASKS', target.name);
  assert(target.checks?.productionReadyFalse === true, 'VISIBLE_PRODUCTION_BOUNDARY', target.name);
  assert(target.checks?.beginnerReadyFalse === true, 'VISIBLE_BEGINNER_BOUNDARY', target.name);
  assert(target.checks?.imageGenerationBlocked === true, 'VISIBLE_IMAGE_BOUNDARY', target.name);
  assert(target.checks?.growthSeparated === true, 'VISIBLE_GROWTH_BOUNDARY', target.name);
  assert(target.checks?.horizontalOverflowPixels <= 2, 'VISIBLE_OVERFLOW', target.name);
  const actual = await sha256(`readiness/${target.screenshot}`);
  assert(actual === target.sha256, 'READINESS_SCREENSHOT_HASH', `${target.name}: ${actual} != ${target.sha256}`);
}

console.log(JSON.stringify({status:'pass',expectedCommit,academyStages:12,readinessGates:10,noviceTasks:12,readiness:'2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN',productionReady:false,beginnerReady:false,observedNoviceRunPassed:false,completeReviewedEpisodeExists:false,imageGenerationAllowed:false,creativeApprovalGranted:false,growthOsIntegrated:false,screenshotHashesMatched:true}, null, 2));