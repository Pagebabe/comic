import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const siteDir = resolve(valueAfter('--site', '_site'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');

function fail(code, detail = '') { throw new Error(`[OPS1_ARTIFACT:${code}]${detail ? ` ${detail}` : ''}`); }
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
  'project/operator-guide-v1.json',
  'project/production-readiness-v1.json',
  'docs/OPERATOR_MANUAL_V1.md',
  'docs/operator/00_START_HERE.md',
  'docs/operator/01_SETUP_AND_DAILY_FLOW.md',
  'docs/operator/02_PRODUCTION_PIPELINE.md',
  'docs/operator/03_QA_RECOVERY_EXPORT.md',
  'docs/operator/04_ACCEPTANCE.md',
  'docs/VIDEO_TUTORIAL_SCRIPT_V1.md',
  'proof/guided/guided-runtime-evidence.json',
  'proof/guided/guided-desktop.png',
  'proof/guided/guided-mobile.png'
]) await requireFile(file);

const [guide, readiness, proof] = await Promise.all([
  json('project/operator-guide-v1.json'),
  json('project/production-readiness-v1.json'),
  json('proof/guided/guided-runtime-evidence.json')
]);

assert(Boolean(expectedCommit), 'EXPECTED_COMMIT');
assert(guide.status === 'GUIDE_READY_FOR_PUBLIC_ACCEPTANCE', 'GUIDE_STATUS');
assert(guide.route === '/studio/#guided', 'GUIDE_ROUTE');
assert(guide.chapters.length === 5, 'CHAPTERS');
assert(guide.chapters.flatMap((chapter) => chapter.steps).length === 18, 'STEPS');
assert(guide.acceptance.questions.length === 12, 'QUESTIONS');
assert(guide.acceptance.humanObservationRequired === true, 'HUMAN_OBSERVATION');
assert(Object.values(guide.claimBoundary).every((value) => value === false), 'CLAIM_BOUNDARY');

assert(readiness.status === 'NOT_PRODUCTION_READY', 'READINESS_STATUS');
assert(readiness.currentScore.display === '2/10 CLOSED_VERIFIED · 6 PARTIAL · 2 OPEN', 'READINESS_SCORE');
assert(readiness.gates.length === 10, 'READINESS_GATES');
assert(readiness.parallelLineBoundary.liveReady === false, 'GROWTH_LIVE');
assert(readiness.parallelLineBoundary.mainIntegrationAllowed === false, 'GROWTH_INTEGRATION');

assert(proof.status === 'pass', 'PROOF_STATUS');
assert(proof.commit === expectedCommit, 'PROOF_COMMIT', `${proof.commit} != ${expectedCommit}`);
assert(proof.route.endsWith('#guided'), 'PROOF_ROUTE', proof.route);
assert(proof.chapters === 5, 'PROOF_CHAPTERS');
assert(proof.steps === 18, 'PROOF_STEPS');
assert(proof.concepts === 5, 'PROOF_CONCEPTS');
assert(proof.readinessGates === 10, 'PROOF_GATES');
assert(proof.acceptanceQuestions === 12, 'PROOF_QUESTIONS');
assert(proof.progressStorageOnly === true, 'PROGRESS_STORAGE');
assert(proof.resetPassed === true, 'RESET');
assert(proof.productionReady === false, 'PRODUCTION_BOUNDARY');
assert(proof.beginnerReady === false, 'BEGINNER_BOUNDARY');
assert(proof.imageGenerationAllowed === false, 'IMAGE_BOUNDARY');
assert(proof.creativeApprovalGranted === false, 'CREATIVE_BOUNDARY');
assert(proof.growthOsIntegrated === false, 'GROWTH_BOUNDARY');
assert(proof.externalRequests === 0, 'EXTERNAL_REQUESTS');
assert(proof.imageCount === 0, 'IMAGES');
assert(proof.canvasCount === 0, 'CANVAS');
assert(proof.targets?.length === 2, 'TARGETS');

for (const target of proof.targets) {
  assert(target.initial?.chapterButtons === 5, 'VISIBLE_CHAPTERS', target.name);
  assert(target.initial?.readinessGates === 10, 'VISIBLE_GATES', target.name);
  assert(target.initial?.acceptanceQuestions === 12, 'VISIBLE_QUESTIONS', target.name);
  assert(target.initial?.scorePresent === true, 'VISIBLE_SCORE', target.name);
  assert(target.initial?.boundariesPresent === true, 'VISIBLE_BOUNDARIES', target.name);
  assert(target.progressed?.saved?.length === 3, 'VISIBLE_PROGRESS', target.name);
  assert(target.reset?.storage === null, 'VISIBLE_RESET_STORAGE', target.name);
  assert(target.reset?.doneSteps === 0, 'VISIBLE_RESET_STEPS', target.name);
  assert(target.reset?.horizontalOverflowPixels <= 2, 'VISIBLE_OVERFLOW', target.name);
  assert(target.externalRequests?.length === 0, 'VISIBLE_EXTERNAL_REQUESTS', target.name);
  assert(Boolean(target.sha256), 'SCREENSHOT_HASH', target.name);
}

console.log(JSON.stringify({status:'pass',expectedCommit,route:guide.route,chapters:5,steps:18,readinessGates:10,acceptanceQuestions:12,productionReady:false,beginnerReady:false,creativeApprovalGranted:false,imageGenerationAllowed:false,growthOsIntegrated:false,targets:2}, null, 2));