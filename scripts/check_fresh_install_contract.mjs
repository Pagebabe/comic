import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));
const requiredFiles = [
  'project/fresh-install-contract.json',
  'project/production-readiness-v1.json',
  'docs/FRESH_INSTALL_DRILL.md',
  'scripts/fresh_install_drill.mjs',
  'scripts/check_fresh_install_report.mjs',
  'tests/fresh-install-contract.test.mjs',
  '.github/workflows/fresh-install-drill.yml'
];

for (const file of requiredFiles) await access(new URL(file, root));

const [contract, readiness, packageJson, documentation, drill, workflow] = await Promise.all([
  json('project/fresh-install-contract.json'),
  json('project/production-readiness-v1.json'),
  json('package.json'),
  read('docs/FRESH_INSTALL_DRILL.md'),
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
ok([
  'AUTOMATED_DRILL_DEFINED_PROOF_PENDING',
  'AUTOMATED_DRILL_PROVEN_SECOND_PERSON_PENDING'
].includes(contract.status), 'STATUS');
ok(contract.requiredSteps.length === 12, 'REQUIRED_STEPS');
ok(contract.requiredNegativeTests.length === 5, 'NEGATIVE_TESTS');
ok(contract.readinessEffect.pr1AfterAutomatedPass === 'PARTIAL', 'PR1_EFFECT');
ok(contract.readinessEffect.productionReady === false, 'PRODUCTION_BOUNDARY');
ok(contract.readinessEffect.beginnerReady === false, 'BEGINNER_BOUNDARY');
ok(contract.report.mustBindExactCommit === true, 'COMMIT_BINDING');
ok(contract.report.mustHashBrowserProof === true, 'HASH_PROOF');

const pr1 = readiness.gates.find((gate) => gate.id === 'PR1');
ok(pr1?.status === 'PARTIAL', 'PR1_STATUS');
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
  'Vite-Preview'
]) ok(documentation.includes(marker), `DOC_${marker}`);

for (const marker of [
  'git', 'clone', '--no-hardlinks', 'checkout', '--detach',
  'npm', 'ci', 'playwright', 'chromium', 'studio-build',
  'studio-preview-start', 'VITE_PREVIEW_BINARY_MISSING', "'vite', 'bin', 'vite.js'", 'process.execPath', '--strictPort',
  'studio-browser-smoke', 'academy-browser-smoke', 'readiness-browser-smoke',
  'fresh-install-report.json', "firstStartServer: 'vite-preview'", 'observedSecondPersonInstall: false'
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
  readinessGate: contract.readinessGate,
  readinessStatus: pr1.status,
  firstStartServer: 'vite-preview',
  processModel: 'direct-vite-child',
  productionReady: false,
  beginnerReady: false,
  observedSecondPersonInstall: false
}, null, 2));
