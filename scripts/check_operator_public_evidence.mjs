import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const proofDir = resolve(valueAfter('--dir', '/tmp/ops1-public-proof'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');

function fail(code, detail = '') { throw new Error(`[OPS1_PUBLIC:${code}]${detail ? ` ${detail}` : ''}`); }
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

const [runtime, guide, readiness, guided, index, video] = await Promise.all([
  json('runtime-evidence.json'),
  json('operator-guide-v1.json'),
  json('production-readiness-v1.json'),
  json('guided/guided-runtime-evidence.json'),
  text('OPERATOR_MANUAL_V1.md'),
  text('VIDEO_TUTORIAL_SCRIPT_V1.md')
]);

assert(Boolean(expectedCommit), 'EXPECTED_COMMIT');
assert(runtime.commit === expectedCommit, 'PAGES_COMMIT', `${runtime.commit} != ${expectedCommit}`);
assert(runtime.status === 'pass', 'PAGES_RUNTIME_STATUS');
assert(runtime.activeGate === 'LR5', 'PAGES_ACTIVE_GATE');
assert(runtime.activeWorkPackage === 'LR5.1', 'PAGES_ACTIVE_WORK_PACKAGE');

assert(guide.status === 'GUIDE_READY_FOR_PUBLIC_ACCEPTANCE', 'GUIDE_STATUS');
assert(guide.route === '/studio/#guided', 'GUIDE_ROUTE');
assert(guide.chapters.length === 5, 'GUIDE_CHAPTERS');
assert(guide.chapters.flatMap((chapter) => chapter.steps).length === 18, 'GUIDE_STEPS');
assert(guide.acceptance.questions.length === 12, 'GUIDE_QUESTIONS');
assert(Object.values(guide.claimBoundary).every((value) => value === false), 'GUIDE_BOUNDARY');

assert(readiness.status === 'NOT_PRODUCTION_READY', 'READINESS_STATUS');
assert(readiness.currentScore.display === '2/10 CLOSED_VERIFIED · 6 PARTIAL · 2 OPEN', 'READINESS_SCORE');
assert(readiness.gates.length === 10, 'READINESS_GATES');
assert(readiness.parallelLineBoundary.liveReady === false, 'GROWTH_LIVE');
assert(readiness.parallelLineBoundary.mainIntegrationAllowed === false, 'GROWTH_INTEGRATION');

assert(index.includes('Operator-Handbuch V1'), 'MANUAL_TITLE');
assert(index.includes('2/10 CLOSED_VERIFIED'), 'MANUAL_SCORE');
assert(index.includes('operator/04_ACCEPTANCE.md'), 'MANUAL_ACCEPTANCE_LINK');
assert(video.includes('Gesamtlänge: etwa 22 Minuten'), 'VIDEO_DURATION');
assert(video.includes('CONTRACT_APPROVED_FOR_ONE_CANDIDATE'), 'VIDEO_GATE');
assert(video.includes('Nur HASH MATCH = PASS'), 'VIDEO_RESTORE');

assert(guided.status === 'pass', 'GUIDED_STATUS');
assert(guided.commit === expectedCommit, 'GUIDED_COMMIT', `${guided.commit} != ${expectedCommit}`);
assert(guided.route.endsWith('#guided'), 'GUIDED_ROUTE', guided.route);
assert(guided.chapters === 5, 'GUIDED_CHAPTERS');
assert(guided.steps === 18, 'GUIDED_STEPS');
assert(guided.readinessGates === 10, 'GUIDED_GATES');
assert(guided.acceptanceQuestions === 12, 'GUIDED_QUESTIONS');
assert(guided.progressStorageOnly === true, 'GUIDED_STORAGE');
assert(guided.resetPassed === true, 'GUIDED_RESET');
assert(guided.productionReady === false, 'GUIDED_PRODUCTION_BOUNDARY');
assert(guided.beginnerReady === false, 'GUIDED_BEGINNER_BOUNDARY');
assert(guided.imageGenerationAllowed === false, 'GUIDED_IMAGE_BOUNDARY');
assert(guided.creativeApprovalGranted === false, 'GUIDED_CREATIVE_BOUNDARY');
assert(guided.growthOsIntegrated === false, 'GUIDED_GROWTH_BOUNDARY');
assert(guided.externalRequests === 0, 'GUIDED_EXTERNAL_REQUESTS');
assert(guided.targets?.length === 2, 'GUIDED_TARGETS');

for (const target of guided.targets) {
  assert(target.initial?.chapterButtons === 5, 'VISIBLE_CHAPTERS', target.name);
  assert(target.initial?.readinessGates === 10, 'VISIBLE_GATES', target.name);
  assert(target.initial?.acceptanceQuestions === 12, 'VISIBLE_QUESTIONS', target.name);
  assert(target.initial?.scorePresent === true, 'VISIBLE_SCORE', target.name);
  assert(target.initial?.boundariesPresent === true, 'VISIBLE_BOUNDARIES', target.name);
  assert(target.progressed?.saved?.length === 3, 'VISIBLE_PROGRESS', target.name);
  assert(target.reset?.storage === null, 'VISIBLE_RESET', target.name);
  assert(target.reset?.horizontalOverflowPixels <= 2, 'VISIBLE_OVERFLOW', target.name);
  assert(target.externalRequests?.length === 0, 'VISIBLE_EXTERNAL', target.name);
  const actual = await sha256(`guided/${target.screenshot}`);
  assert(actual === target.sha256, 'SCREENSHOT_HASH', `${target.name}: ${actual} != ${target.sha256}`);
}

console.log(JSON.stringify({status:'pass',expectedCommit,route:guide.route,chapters:5,steps:18,readiness:'2/10 CLOSED_VERIFIED · 6 PARTIAL · 2 OPEN',productionReady:false,beginnerReady:false,imageGenerationAllowed:false,creativeApprovalGranted:false,growthOsIntegrated:false,screenshotHashesMatched:true}, null, 2));