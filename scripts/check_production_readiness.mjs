import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

for (const file of [
  'project/production-readiness-v1.json',
  'project/novice-acceptance-template.json',
  'project/production-academy-status.json',
  'docs/NOVICE_ACCEPTANCE_PROTOCOL.md',
  'studio-app/src/AcademyReadiness.tsx',
  'studio-app/src/academy-readiness.css',
  'tests/production-readiness.test.mjs'
]) await access(new URL(file, root));

const [readiness, acceptance, academyStatus, app, component, protocol, evidence] = await Promise.all([
  json('project/production-readiness-v1.json'),
  json('project/novice-acceptance-template.json'),
  json('project/production-academy-status.json'),
  read('studio-app/src/App.tsx'),
  read('studio-app/src/AcademyReadiness.tsx'),
  read('docs/NOVICE_ACCEPTANCE_PROTOCOL.md'),
  read('docs/PRODUCTION_ACADEMY_EVIDENCE.md')
]);

function assert(condition, code, detail = '') {
  if (!condition) throw new Error(`[READINESS:${code}]${detail ? ` ${detail}` : ''}`);
}

assert(readiness.schemaVersion === 2, 'SCHEMA');
assert(readiness.repository === 'Pagebabe/comic', 'REPOSITORY');
assert(readiness.trackingIssue === 95, 'TRACKING');
assert(readiness.academyTrackingIssue === 94, 'ACADEMY_TRACKING');
assert(readiness.creativeGate === 'LR5.1', 'CREATIVE_GATE');
assert(readiness.status === 'NOT_PRODUCTION_READY', 'STATUS');
assert(readiness.currentScore.closedVerified === 2, 'CLOSED_SCORE');
assert(readiness.currentScore.partial === 7, 'PARTIAL_SCORE');
assert(readiness.currentScore.open === 1, 'OPEN_SCORE');
assert(readiness.currentScore.total === 10, 'TOTAL_SCORE');
assert(readiness.currentScore.display === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN', 'DISPLAY_SCORE');
assert(readiness.gates.length === 10, 'GATE_COUNT');
assert(readiness.gates.filter((gate) => gate.status === 'CLOSED_VERIFIED').length === 2, 'CLOSED_COUNT');
assert(readiness.gates.filter((gate) => gate.status === 'PARTIAL').length === 7, 'PARTIAL_COUNT');
assert(readiness.gates.filter((gate) => gate.status === 'OPEN').length === 1, 'OPEN_COUNT');
assert(readiness.gates.find((gate) => gate.id === 'PR10')?.status === 'OPEN', 'PR10_OPEN');
assert(readiness.academyBoundary.productionReady === false, 'PRODUCTION_BOUNDARY');
assert(readiness.academyBoundary.beginnerReady === false, 'BEGINNER_BOUNDARY');
assert(readiness.academyBoundary.creativeApprovalGranted === false, 'CREATIVE_BOUNDARY');
assert(readiness.academyBoundary.imageGenerationAllowed === false, 'IMAGE_BOUNDARY');
assert(readiness.academyBoundary.growthOsIntegrated === false, 'GROWTH_BOUNDARY');
assert(readiness.parallelLineBoundary.growthOsStatus === 'SHADOW_RELEASE_READY', 'GROWTH_STATUS');
assert(readiness.parallelLineBoundary.liveReady === false, 'GROWTH_LIVE');
assert(readiness.parallelLineBoundary.mainIntegrationAllowed === false, 'GROWTH_INTEGRATION');
assert(readiness.parallelLineBoundary.sharedIntegrationSmokePassed === false, 'GROWTH_SMOKE');

assert(acceptance.status === 'TEMPLATE_NOT_EXECUTED', 'ACCEPTANCE_STATUS');
assert(acceptance.requiredScore === 12, 'ACCEPTANCE_SCORE');
assert(acceptance.humanObservationRequired === true, 'HUMAN_OBSERVATION');
assert(acceptance.tasks.length === 12, 'ACCEPTANCE_TASKS');
assert(acceptance.result.score === 0, 'ACCEPTANCE_RESULT_SCORE');
assert(acceptance.result.decision === 'NOT_EXECUTED', 'ACCEPTANCE_DECISION');
assert(acceptance.environment.testedCommit === null, 'ACCEPTANCE_COMMIT');

assert(academyStatus.schemaVersion === 2, 'ACADEMY_STATUS_SCHEMA');
assert(academyStatus.status === 'proven_guided_training_ready_novice_acceptance_open', 'ACADEMY_STATUS');
assert(academyStatus.readiness.status === 'NOT_PRODUCTION_READY', 'ACADEMY_READINESS_STATUS');
assert(academyStatus.readiness.score === readiness.currentScore.display, 'ACADEMY_SCORE');
assert(academyStatus.readiness.productionReady === false, 'ACADEMY_PRODUCTION_BOUNDARY');
assert(academyStatus.readiness.beginnerReady === false, 'ACADEMY_BEGINNER_BOUNDARY');
assert(academyStatus.readiness.observedNoviceRunPassed === false, 'ACADEMY_NOVICE_BOUNDARY');
assert(academyStatus.readiness.completeReviewedEpisodeExists === false, 'ACADEMY_EPISODE_BOUNDARY');
assert(academyStatus.claimBoundary.academyTechnicallyProven === true, 'ACADEMY_TECH_PROOF');
assert(academyStatus.claimBoundary.academyBeginnerReadyClaimAllowed === false, 'ACADEMY_BEGINNER_CLAIM');
assert(academyStatus.claimBoundary.productionReadyClaimAllowed === false, 'ACADEMY_PRODUCTION_CLAIM');

for (const marker of ['AcademyReadiness', '2/10 READINESS CLOSED', 'Anfänger-Abnahme offen']) assert(app.includes(marker), `APP_MARKER_${marker}`);
for (const marker of ['data-testid="academy-readiness"', 'data-testid="academy-readiness-gates"', 'data-testid="academy-novice-acceptance"', '10/10 erst bei zehnmal CLOSED_VERIFIED', 'Growth OS bleibt isoliert']) assert(component.includes(marker), `COMPONENT_MARKER_${marker}`);
for (const marker of ['12/12 ohne undokumentierte Hilfe', '10/10 PRODUCTION_READY', 'keine Character-, Location- oder Voice-Master']) assert(protocol.includes(marker), `PROTOCOL_MARKER_${marker}`);
assert(!evidence.includes('Der Produktionsmodus ist technisch einsatzbereit und anfängerbedienbar.'), 'STALE_BEGINNER_READY_CLAIM');

console.log(JSON.stringify({
  status: 'pass',
  repository: readiness.repository,
  trackingIssue: readiness.trackingIssue,
  academyTrackingIssue: readiness.academyTrackingIssue,
  readiness: readiness.currentScore.display,
  productionReady: false,
  beginnerReady: false,
  observedNoviceRunPassed: false,
  completeReviewedEpisodeExists: false,
  imageGenerationAllowed: false,
  creativeApprovalGranted: false,
  growthOsIntegrated: false,
  acceptanceTasks: acceptance.tasks.length
}, null, 2));