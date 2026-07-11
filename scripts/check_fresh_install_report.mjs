import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const reportPath = resolve(valueAfter('--report', 'output/fresh-install/fresh-install-report.json'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');
if (!expectedCommit) throw new Error('[FRESH_INSTALL_REPORT:EXPECTED_COMMIT_MISSING]');

const report = JSON.parse(await readFile(reportPath, 'utf8'));
const ok = (condition, code) => {
  if (!condition) throw new Error(`[FRESH_INSTALL_REPORT:${code}]`);
};

ok(report.schemaVersion === 1, 'SCHEMA');
ok(report.status === 'PASS', 'STATUS');
ok(report.repository === 'Pagebabe/comic', 'REPOSITORY');
ok(report.trackingIssue === 115, 'TRACKING');
ok(report.sourceCommit === expectedCommit, 'SOURCE_COMMIT');
ok(report.cloneCommit === expectedCommit, 'CLONE_COMMIT');
ok(report.exactCommitMatch === true, 'COMMIT_MATCH');
ok(report.environment && Number(String(report.environment.node).match(/\d+/)?.[0]) >= 20, 'NODE_VERSION');
ok(typeof report.environment.npm === 'string' && report.environment.npm.length > 0, 'NPM_VERSION');
ok(typeof report.environment.git === 'string' && report.environment.git.includes('git version'), 'GIT_VERSION');
ok(report.environment.firstStartServer === 'vite-preview', 'FIRST_START_SERVER');
ok(report.environment.projectTruthDataStaged === true, 'PROJECT_TRUTH_STAGED');

const freshValues = Object.values(report.freshBeforeInstall || {});
ok(freshValues.length === 5, 'FRESH_STATE_FIELDS');
ok(freshValues.every((value) => value === false), 'FRESH_STATE_CONTAMINATED');

const requiredSteps = [
  'git-version',
  'npm-version',
  'source-commit',
  'isolated-clone',
  'checkout-exact-commit',
  'clone-commit',
  'locked-studio-install',
  'playwright-chromium-install',
  'studio-build',
  'stage-project-data',
  'studio-preview-start',
  'studio-browser-smoke',
  'academy-browser-smoke',
  'readiness-browser-smoke'
];

for (const name of requiredSteps) {
  const step = report.steps.find((candidate) => candidate.name === name);
  ok(step, `STEP_MISSING_${name}`);
  ok(step.status === 'PASS', `STEP_FAILED_${name}`);
  ok(step.exitCode === 0, `STEP_EXIT_${name}`);
  ok(step.timedOut === false, `STEP_TIMEOUT_${name}`);
  ok(Number.isFinite(step.durationMs) && step.durationMs >= 0, `STEP_DURATION_${name}`);
}

const proofPaths = new Set((report.browserProof || []).map((entry) => entry.path));
for (const suffix of [
  'studio/studio-runtime-evidence.json',
  'studio/studio-desktop.png',
  'studio/studio-mobile.png',
  'academy/academy-runtime-evidence.json',
  'academy/academy-desktop.png',
  'academy/academy-mobile.png',
  'readiness/academy-readiness-runtime-evidence.json',
  'readiness/academy-readiness-desktop.png',
  'readiness/academy-readiness-mobile.png'
]) {
  ok([...proofPaths].some((path) => path.endsWith(suffix)), `PROOF_MISSING_${suffix}`);
}

for (const entry of report.browserProof) {
  ok(/^[0-9a-f]{64}$/.test(entry.sha256), `PROOF_HASH_${entry.path}`);
  ok(Number.isInteger(entry.sizeBytes) && entry.sizeBytes > 0, `PROOF_SIZE_${entry.path}`);
}

for (const key of [
  'productionReady',
  'beginnerReady',
  'creativeApprovalGranted',
  'imageGenerationAllowed',
  'growthOsIntegrated',
  'observedSecondPersonInstall'
]) ok(report.boundaries?.[key] === false, `BOUNDARY_${key}`);
ok(report.boundaries?.readinessGate === 'PR1_PARTIAL', 'READINESS_GATE');
ok(report.temporaryCloneRetained === false, 'TEMP_CLONE_RETAINED');
ok(report.temporaryClonePath === null, 'TEMP_CLONE_PATH');

console.log(JSON.stringify({
  status: 'pass',
  repository: report.repository,
  trackingIssue: report.trackingIssue,
  commit: expectedCommit,
  steps: report.steps.length,
  proofFiles: report.browserProof.length,
  firstStartServer: report.environment.firstStartServer,
  projectTruthDataStaged: report.environment.projectTruthDataStaged,
  readinessGate: report.boundaries.readinessGate,
  productionReady: false,
  beginnerReady: false,
  observedSecondPersonInstall: false
}, null, 2));
