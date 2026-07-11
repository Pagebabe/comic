import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const siteDir = resolve(valueAfter('--site', '_site'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');

function fail(code, detail = '') { throw new Error(`[READINESS_ARTIFACT:${code}]${detail ? ` ${detail}` : ''}`); }
function assert(condition, code, detail = '') { if (!condition) fail(code, detail); }
async function requireFile(relativePath) {
  const path = resolve(siteDir, relativePath);
  try { await access(path); } catch { fail('MISSING_FILE', relativePath); }
  return path;
}
async function json(relativePath) {
  const path = await requireFile(relativePath);
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { fail('INVALID_JSON', `${relativePath}: ${error.message}`); }
}

for (const file of [
  'studio/index.html',
  'project/production-academy.json',
  'project/production-academy-status.json',
  'project/production-readiness-v1.json',
  'project/novice-acceptance-template.json',
  'docs/PRODUCTION_HANDBOOK_DE.md',
  'docs/QUICKSTART_DAY_ONE.md',
  'docs/VIDEO_TUTORIAL_SCRIPT_DE.md',
  'docs/NOVICE_ACCEPTANCE_PROTOCOL.md',
  'proof/studio/academy-runtime-evidence.json',
  'proof/studio/academy-desktop.png',
  'proof/studio/academy-mobile.png',
  'proof/readiness/academy-readiness-runtime-evidence.json',
  'proof/readiness/academy-readiness-desktop.png',
  'proof/readiness/academy-readiness-mobile.png'
]) await requireFile(file);

const [academy, status, readiness, acceptance, academyProof, readinessProof] = await Promise.all([
  json('project/production-academy.json'),
  json('project/production-academy-status.json'),
  json('project/production-readiness-v1.json'),
  json('project/novice-acceptance-template.json'),
  json('proof/studio/academy-runtime-evidence.json'),
  json('proof/readiness/academy-readiness-runtime-evidence.json')
]);

assert(Boolean(expectedCommit), 'EXPECTED_COMMIT');
assert(academy.stages?.length === 12, 'ACADEMY_STAGES');
assert(academy.safetyRules?.length > 0, 'ACADEMY_SAFETY');
assert(status.status === 'proven_guided_training_ready_novice_acceptance_open', 'ACADEMY_STATUS');
assert(status.readiness?.productionReady === false, 'ACADEMY_PRODUCTION_BOUNDARY');
assert(status.readiness?.beginnerReady === false, 'ACADEMY_BEGINNER_BOUNDARY');
assert(status.readiness?.observedNoviceRunPassed === false, 'ACADEMY_NOVICE_BOUNDARY');
assert(status.readiness?.completeReviewedEpisodeExists === false, 'ACADEMY_EPISODE_BOUNDARY');

assert(readiness.status === 'NOT_PRODUCTION_READY', 'READINESS_STATUS');
assert(readiness.currentScore?.display === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN', 'READINESS_SCORE');
assert(readiness.gates?.length === 10, 'READINESS_GATES');
assert(readiness.academyBoundary?.productionReady === false, 'READINESS_PRODUCTION_BOUNDARY');
assert(readiness.academyBoundary?.beginnerReady === false, 'READINESS_BEGINNER_BOUNDARY');
assert(readiness.parallelLineBoundary?.mainIntegrationAllowed === false, 'GROWTH_INTEGRATION_BOUNDARY');
assert(readiness.parallelLineBoundary?.sharedIntegrationSmokePassed === false, 'GROWTH_SMOKE_BOUNDARY');

assert(acceptance.status === 'TEMPLATE_NOT_EXECUTED', 'ACCEPTANCE_STATUS');
assert(acceptance.tasks?.length === 12, 'ACCEPTANCE_TASKS');
assert(acceptance.result?.decision === 'NOT_EXECUTED', 'ACCEPTANCE_DECISION');
assert(acceptance.environment?.testedCommit === null, 'ACCEPTANCE_COMMIT');

assert(academyProof.status === 'pass', 'ACADEMY_PROOF_STATUS');
assert(academyProof.commit === expectedCommit, 'ACADEMY_PROOF_COMMIT', `${academyProof.commit} != ${expectedCommit}`);
assert(academyProof.stageCount === 12, 'ACADEMY_PROOF_STAGES');
assert(academyProof.trainingPathPassed === true, 'ACADEMY_TRAINING');
assert(academyProof.productionHumanGatesPassed === true, 'ACADEMY_HUMAN_GATES');
assert(academyProof.creativeApprovalGranted === false, 'ACADEMY_CREATIVE_BOUNDARY');
assert(academyProof.finalEpisodeApprovalGranted === false, 'ACADEMY_FINAL_BOUNDARY');
assert(academyProof.targets?.length === 2, 'ACADEMY_TARGETS');

assert(readinessProof.status === 'pass', 'READINESS_PROOF_STATUS');
assert(readinessProof.commit === expectedCommit, 'READINESS_PROOF_COMMIT', `${readinessProof.commit} != ${expectedCommit}`);
assert(readinessProof.readinessScore === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN', 'READINESS_PROOF_SCORE');
assert(readinessProof.stages === 12, 'READINESS_PROOF_STAGES');
assert(readinessProof.readinessGates === 10, 'READINESS_PROOF_GATES');
assert(readinessProof.noviceTasks === 12, 'READINESS_PROOF_TASKS');
assert(readinessProof.trainingBoundaryPassed === true, 'READINESS_TRAINING_BOUNDARY');
assert(readinessProof.resetPassed === true, 'READINESS_RESET');
assert(readinessProof.productionReady === false, 'READINESS_PRODUCTION_CLAIM');
assert(readinessProof.beginnerReady === false, 'READINESS_BEGINNER_CLAIM');
assert(readinessProof.observedNoviceRunPassed === false, 'READINESS_NOVICE_CLAIM');
assert(readinessProof.completeReviewedEpisodeExists === false, 'READINESS_EPISODE_CLAIM');
assert(readinessProof.imageGenerationAllowed === false, 'READINESS_IMAGE_BOUNDARY');
assert(readinessProof.creativeApprovalGranted === false, 'READINESS_CREATIVE_BOUNDARY');
assert(readinessProof.growthOsIntegrated === false, 'READINESS_GROWTH_BOUNDARY');
assert(readinessProof.sharedGrowthIntegrationSmokePassed === false, 'READINESS_GROWTH_SMOKE');
assert(readinessProof.externalRequests === 0, 'READINESS_EXTERNAL_REQUESTS');
assert(readinessProof.targets?.length === 2, 'READINESS_TARGETS');
for (const target of readinessProof.targets) {
  assert(target.checks?.gateCount === 10, 'VISIBLE_GATES', target.name);
  assert(target.checks?.acceptanceTasks === 12, 'VISIBLE_TASKS', target.name);
  assert(target.checks?.productionReadyFalse === true, 'VISIBLE_PRODUCTION_BOUNDARY', target.name);
  assert(target.checks?.beginnerReadyFalse === true, 'VISIBLE_BEGINNER_BOUNDARY', target.name);
  assert(target.checks?.imageGenerationBlocked === true, 'VISIBLE_IMAGE_BOUNDARY', target.name);
  assert(target.checks?.growthSeparated === true, 'VISIBLE_GROWTH_BOUNDARY', target.name);
  assert(target.checks?.horizontalOverflowPixels <= 2, 'VISIBLE_OVERFLOW', target.name);
  assert(Boolean(target.sha256), 'VISIBLE_SCREENSHOT_HASH', target.name);
}

console.log(JSON.stringify({status:'pass',expectedCommit,academyStages:12,readinessGates:10,noviceTasks:12,readiness:'2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN',productionReady:false,beginnerReady:false,observedNoviceRunPassed:false,completeReviewedEpisodeExists:false,creativeApprovalGranted:false,imageGenerationAllowed:false,growthOsIntegrated:false,targets:2}, null, 2));