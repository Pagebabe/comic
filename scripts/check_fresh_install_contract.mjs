import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));
const requiredFiles = [
  'project/fresh-install-contract.json',
  'project/production-readiness-v1.json',
  'docs/FRESH_INSTALL_DRILL.md',
  'docs/FRESH_INSTALL_EVIDENCE.md',
  'scripts/fresh_install_drill.mjs',
  'scripts/check_fresh_install_report.mjs',
  'tests/fresh-install-contract.test.mjs',
  '.github/workflows/fresh-install-drill.yml'
];

for (const file of requiredFiles) await access(new URL(file, root));

const [contract, readiness, packageJson, documentation, evidence, drill, workflow] = await Promise.all([
  json('project/fresh-install-contract.json'),
  json('project/production-readiness-v1.json'),
  json('package.json'),
  read('docs/FRESH_INSTALL_DRILL.md'),
  read('docs/FRESH_INSTALL_EVIDENCE.md'),
  read('scripts/fresh_install_drill.mjs'),
  read('.github/workflows/fresh-install-drill.yml')
]);

const ok = (condition, code) => {
  if (!condition) throw new Error(`[FRESH_INSTALL_CONTRACT:${code}]`);
};

ok(contract.schemaVersion === 1, 'SCHEMA');
ok(contract.repository === 'Pagebabe/comic', 'REPOSITORY');
ok(contract.trackingIssue === 115, 'TRACKING');
ok(contract.readinessGate === 'PR1', 'GATE');
ok(contract.status === 'AUTOMATED_DRILL_PROVEN_SECOND_PERSON_PENDING', 'STATUS');
ok(contract.requiredSteps.length === 13, 'REQUIRED_STEPS');
ok(contract.requiredNegativeTests.length === 5, 'NEGATIVE_TESTS');
ok(contract.readinessEffect.pr1AfterAutomatedPass === 'PARTIAL', 'PR1_EFFECT');
ok(contract.readinessEffect.productionReady === false, 'PRODUCTION_BOUNDARY');
ok(contract.readinessEffect.beginnerReady === false, 'BEGINNER_BOUNDARY');
ok(contract.report.mustBindExactCommit === true, 'COMMIT_BINDING');
ok(contract.report.mustHashBrowserProof === true, 'HASH_PROOF');
ok(contract.report.mustRecordProjectTruthData === true, 'PROJECT_TRUTH_PROOF');
ok(contract.automatedProof.status === 'PROVEN', 'AUTOMATED_PROOF_STATUS');
ok(contract.automatedProof.workflowRun === 29164969887, 'AUTOMATED_PROOF_RUN');
ok(contract.automatedProof.checkedMergeCommit === '79496acdf31ae6a6d2f4d302d27d6f02f8ac6830', 'AUTOMATED_PROOF_COMMIT');
ok(contract.automatedProof.artifactId === 8251886079, 'AUTOMATED_PROOF_ARTIFACT');
ok(contract.automatedProof.artifactDigest === 'sha256:ee7ac373958ea3c3684687f438b5402a66ed5de0f6ce5d389341e2285d3e2bd5', 'AUTOMATED_PROOF_DIGEST');
ok(contract.automatedProof.comicFactoryCiRun === 29164969868, 'AUTOMATED_PROOF_CI');
ok(contract.automatedProof.exactCommitMatch === true, 'AUTOMATED_PROOF_MATCH');
ok(contract.automatedProof.freshStatePassed === true, 'AUTOMATED_PROOF_FRESH');
ok(contract.automatedProof.requiredStepsPassed === 14, 'AUTOMATED_PROOF_STEPS');
ok(contract.automatedProof.browserProofFiles === 9, 'AUTOMATED_PROOF_FILES');

const pr1 = readiness.gates.find((gate) => gate.id === 'PR1');
ok(pr1?.status === 'PARTIAL', 'PR1_STATUS');
ok(pr1.existingProof.some((entry) => entry.includes('29164969887')), 'PR1_RUN_PROOF');
ok(pr1.existingProof.some((entry) => entry.includes('8251886079')), 'PR1_ARTIFACT_PROOF');
ok(pr1.missingProof.some((entry) => /second person/i.test(entry)), 'SECOND_PERSON_MISSING');
ok(readiness.currentScore.display === '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN', 'READINESS_SCORE');
ok(readiness.academyBoundary.productionReady === false, 'READINESS_PRODUCTION');
ok(readiness.academyBoundary.beginnerReady === false, 'READINESS_BEGINNER');
ok(readiness.academyBoundary.creativeApprovalGranted === false, 'READINESS_CREATIVE');
ok(readiness.academyBoundary.imageGenerationAllowed === false, 'READINESS_IMAGE');
ok(readiness.academyBoundary.growthOsIntegrated === false, 'READINESS_GROWTH');

ok(packageJson.scripts['drill:fresh-install'] === 'node scripts/fresh_install_drill.mjs', 'PACKAGE_DRILL');
ok(packageJson.scripts.test.includes('fresh-install-contract.test.mjs'), 'PACKAGE_TEST');
ok(packageJson.scripts.check.includes('check_fresh_install_contract.mjs'), 'PACKAGE_CHECK');

for (const marker of [
  'npm run drill:fresh-install',
  'zweite Person',
  'PR1 `PARTIAL`',
  'output/fresh-install/fresh-install-report.json',
  'keine API-Schlüssel',
  'Vite-Preview',
  'Projektwahrheitsdaten',
  '29164969887',
  '8251886079'
]) ok(documentation.includes(marker), `DOC_${marker}`);

for (const marker of [
  '29164219409',
  '29164323675',
  '29164785728',
  '29164969887',
  '8251886079',
  'sha256:ee7ac373958ea3c3684687f438b5402a66ed5de0f6ce5d389341e2285d3e2bd5',
  'PR1 bleibt `PARTIAL`'
]) ok(evidence.includes(marker), `EVIDENCE_${marker}`);

for (const marker of [
  'git', 'clone', '--no-hardlinks', 'checkout', '--detach',
  'npm', 'ci', 'playwright', 'chromium', 'studio-build',
  'stage-project-data', 'PROJECT_TRUTH_STATE_MISSING', 'PROJECT_ACADEMY_CONTRACT_MISSING',
  'studio-preview-start', 'VITE_PREVIEW_BINARY_MISSING', "'vite', 'bin', 'vite.js'", 'process.execPath', '--strictPort',
  'studio-browser-smoke', 'academy-browser-smoke', 'readiness-browser-smoke',
  'fresh-install-report.json', "firstStartServer: 'vite-preview'", 'projectTruthDataStaged: true', 'observedSecondPersonInstall: false'
]) ok(drill.includes(marker), `DRILL_${marker}`);

for (const marker of [
  'name: Fresh Install Drill',
  'cancel-in-progress: true',
  'npm run drill:fresh-install',
  'check_fresh_install_report.mjs',
  'comic-fresh-install-proof',
  'output/fresh-install/'
]) ok(workflow.includes(marker), `WORKFLOW_${marker}`);

ok(!workflow.includes('secrets.'), 'NO_SECRETS');
ok(!workflow.includes('deploy-pages'), 'NO_DEPLOY');
ok(!drill.includes('productionReady: true'), 'NO_PRODUCTION_OVERCLAIM');
ok(!drill.includes('creativeApprovalGranted: true'), 'NO_CREATIVE_OVERCLAIM');

console.log(JSON.stringify({
  status: 'pass',
  repository: contract.repository,
  trackingIssue: contract.trackingIssue,
  contractStatus: contract.status,
  automatedProofRun: contract.automatedProof.workflowRun,
  automatedProofArtifact: contract.automatedProof.artifactId,
  readinessGate: contract.readinessGate,
  readinessStatus: pr1.status,
  firstStartServer: 'vite-preview',
  projectTruthDataStaged: true,
  processModel: 'direct-vite-child',
  productionReady: false,
  beginnerReady: false,
  observedSecondPersonInstall: false
}, null, 2));
