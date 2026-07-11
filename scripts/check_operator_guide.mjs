import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

const requiredFiles = [
  'project/operator-guide-v1.json',
  'project/production-readiness-v1.json',
  'docs/OPERATOR_MANUAL_V1.md',
  'docs/operator/00_START_HERE.md',
  'docs/operator/01_SETUP_AND_DAILY_FLOW.md',
  'docs/operator/02_PRODUCTION_PIPELINE.md',
  'docs/operator/03_QA_RECOVERY_EXPORT.md',
  'docs/operator/04_ACCEPTANCE.md',
  'docs/VIDEO_TUTORIAL_SCRIPT_V1.md',
  'studio-app/src/GuidedMode.tsx',
  'studio-app/src/guided.css'
];

for (const file of requiredFiles) await access(new URL(file, root));

const [guide, readiness, app, guided, index, video] = await Promise.all([
  json('project/operator-guide-v1.json'),
  json('project/production-readiness-v1.json'),
  read('studio-app/src/App.tsx'),
  read('studio-app/src/GuidedMode.tsx'),
  read('docs/OPERATOR_MANUAL_V1.md'),
  read('docs/VIDEO_TUTORIAL_SCRIPT_V1.md')
]);

function assert(condition, code) {
  if (!condition) throw new Error(`[OPS1:${code}]`);
}

assert(guide.status === 'GUIDE_READY_FOR_PUBLIC_ACCEPTANCE', 'GUIDE_STATUS');
assert(guide.route === '/studio/#guided', 'GUIDE_ROUTE');
assert(guide.chapters.length === 5, 'CHAPTER_COUNT');
assert(guide.chapters.flatMap((chapter) => chapter.steps).length === 18, 'STEP_COUNT');
assert(guide.acceptance.questions.length === 12, 'QUESTION_COUNT');
assert(guide.acceptance.requiredScore === 12, 'REQUIRED_SCORE');
assert(guide.acceptance.humanObservationRequired === true, 'HUMAN_OBSERVATION');
assert(Object.values(guide.claimBoundary).every((value) => value === false), 'CLAIM_BOUNDARY');

assert(readiness.status === 'NOT_PRODUCTION_READY', 'READINESS_STATUS');
assert(readiness.currentScore.closedVerified === 2, 'CLOSED_SCORE');
assert(readiness.currentScore.partial === 6, 'PARTIAL_SCORE');
assert(readiness.currentScore.open === 2, 'OPEN_SCORE');
assert(readiness.currentScore.total === 10, 'TOTAL_SCORE');
assert(readiness.gates.length === 10, 'GATE_COUNT');
assert(readiness.parallelLineBoundary.growthOsStatus === 'SHADOW_RELEASE_READY', 'GROWTH_STATUS');
assert(readiness.parallelLineBoundary.liveReady === false, 'GROWTH_LIVE_BOUNDARY');
assert(readiness.parallelLineBoundary.mainIntegrationAllowed === false, 'GROWTH_INTEGRATION_BOUNDARY');

for (const marker of ['#guided', 'GuidedMode', 'Guided Mode öffnen']) assert(app.includes(marker), `APP_MARKER_${marker}`);
for (const marker of ['data-testid="guided-mode"', 'data-testid="guided-readiness"', 'data-testid="novice-acceptance"', 'completionStorageKey', 'Fortschritt zurücksetzen']) assert(guided.includes(marker), `GUIDED_MARKER_${marker}`);
for (const marker of ['2/10 CLOSED_VERIFIED', 'operator/00_START_HERE.md', 'VIDEO_TUTORIAL_SCRIPT_V1.md']) assert(index.includes(marker), `INDEX_MARKER_${marker}`);
for (const marker of ['22 Minuten', 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'Nur HASH MATCH = PASS', 'zweite Person']) assert(video.includes(marker), `VIDEO_MARKER_${marker}`);

for (const forbidden of ['10/10 PRODUCTION_READY</strong>', 'imageGenerationAllowed: true', 'creativeApprovalGranted: true', 'growthOsIntegrated: true']) {
  assert(!guided.includes(forbidden), `FORBIDDEN_${forbidden}`);
}

console.log(JSON.stringify({
  status: 'pass',
  repository: guide.repository,
  trackingIssue: guide.trackingIssue,
  route: guide.route,
  chapters: guide.chapters.length,
  steps: guide.chapters.flatMap((chapter) => chapter.steps).length,
  concepts: guide.concepts.length,
  acceptanceQuestions: guide.acceptance.questions.length,
  readiness: readiness.currentScore.display,
  productionReady: guide.claimBoundary.productionReady,
  beginnerReady: guide.claimBoundary.beginnerReady,
  imageGenerationAllowed: guide.claimBoundary.imageGenerationAllowed,
  creativeApprovalGranted: guide.claimBoundary.creativeApprovalGranted,
  growthOsIntegrated: guide.claimBoundary.growthOsIntegrated
}, null, 2));