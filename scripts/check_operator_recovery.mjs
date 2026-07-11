import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

const required = [
  'project/operator-recovery-contract.json',
  'project/production-readiness-v1.json',
  'docs/OPERATOR_RECOVERY_DRILLS.md',
  'lib/operator-recovery.mjs',
  'scripts/operator_doctor.mjs',
  'scripts/operator_failure_drill.mjs',
  'tests/operator-recovery.test.mjs',
  '.github/workflows/operator-recovery-drill.yml'
];
for (const file of required) await access(new URL(file, root));

const [contract, readiness, packageJson, docs, engine, doctor, drill, workflow] = await Promise.all([
  json('project/operator-recovery-contract.json'),
  json('project/production-readiness-v1.json'),
  json('package.json'),
  read('docs/OPERATOR_RECOVERY_DRILLS.md'),
  read('lib/operator-recovery.mjs'),
  read('scripts/operator_doctor.mjs'),
  read('scripts/operator_failure_drill.mjs'),
  read('.github/workflows/operator-recovery-drill.yml')
]);

const ok = (condition, code) => {
  if (!condition) throw new Error(`[OPERATOR_RECOVERY:${code}]`);
};

ok(contract.schemaVersion === 1, 'SCHEMA');
ok(contract.repository === 'Pagebabe/comic', 'REPOSITORY');
ok(contract.trackingIssue === 118, 'TRACKING');
ok(contract.readinessGate === 'PR8', 'READINESS_GATE');
ok(contract.ruleVersion === 'ops-recovery.v1', 'RULE_VERSION');
ok(contract.knownFailureCodes.length === 13, 'KNOWN_CODES');
ok(contract.requiredDrills.total === 14, 'DRILL_COUNT');
ok(contract.requiredDrills.sandboxRestored === true, 'SANDBOX_RESTORE');
ok(contract.requiredDrills.externalActionsExecuted === false, 'NO_EXTERNAL_ACTIONS');
ok(contract.requiredDrills.destructiveActionsExecuted === false, 'NO_DESTRUCTIVE_ACTIONS');
ok(contract.unknownFailurePolicy.decision === 'HUMAN_ESCALATION_REQUIRED', 'UNKNOWN_DECISION');
ok(contract.unknownFailurePolicy.commandsAllowed === false, 'UNKNOWN_COMMANDS');
ok(contract.readinessEffect.pr8AfterAutomatedPass === 'PARTIAL', 'PR8_EFFECT');
ok(contract.readinessEffect.productionReady === false, 'PRODUCTION_BOUNDARY');
ok(contract.readinessEffect.beginnerReady === false, 'BEGINNER_BOUNDARY');

const pr8 = readiness.gates.find((gate) => gate.id === 'PR8');
ok(pr8?.status === 'PARTIAL', 'PR8_STATUS');
ok(pr8.missingProof.includes('operator recovery observation'), 'OPERATOR_OBSERVATION_OPEN');
ok(readiness.academyBoundary.productionReady === false, 'READINESS_PRODUCTION');
ok(readiness.academyBoundary.beginnerReady === false, 'READINESS_BEGINNER');
ok(readiness.academyBoundary.creativeApprovalGranted === false, 'READINESS_CREATIVE');
ok(readiness.academyBoundary.imageGenerationAllowed === false, 'READINESS_IMAGE');
ok(readiness.academyBoundary.growthOsIntegrated === false, 'READINESS_GROWTH');

for (const marker of [
  'UNKNOWN_RECOVERY_MUST_NOT_EXECUTE',
  'UNSAFE_RECOVERY_COMMAND',
  'RECOVERY_PLAN_HASH_MISMATCH',
  'HUMAN_ESCALATION_REQUIRED',
  'SAFE_RETRY_ALLOWED',
  'destructiveActionExecuted: false',
  'externalActionExecuted: false'
]) ok(engine.includes(marker), `ENGINE_${marker}`);

for (const marker of [
  'mutationPerformed: false',
  'READY_FOR_SAFE_DRILLS',
  'STUDIO_LOCKFILE_MISSING',
  'PROJECT_TRUTH_MISSING'
]) ok(doctor.includes(marker), `DOCTOR_${marker}`);

for (const marker of [
  'operator-recovery-report.json',
  'operator-recovery-report.html',
  'RECOVERY_DRILL_BOUNDARY_VIOLATION'
]) ok(drill.includes(marker), `DRILL_${marker}`);

for (const marker of [
  'npm run doctor',
  'npm run drill:operator-recovery',
  'HUMAN_ESCALATION_REQUIRED',
  'PR8 bleibt trotzdem `PARTIAL`',
  'rm -rf'
]) ok(docs.includes(marker), `DOC_${marker}`);

for (const marker of [
  'name: Operator Recovery Drill',
  'npm run test:operator-recovery',
  'npm run drill:operator-recovery',
  'check_operator_recovery_report.mjs',
  'comic-operator-recovery-proof'
]) ok(workflow.includes(marker), `WORKFLOW_${marker}`);

ok(packageJson.scripts.doctor === 'node scripts/operator_doctor.mjs', 'PACKAGE_DOCTOR');
ok(packageJson.scripts['drill:operator-recovery'] === 'node scripts/operator_failure_drill.mjs', 'PACKAGE_DRILL');
ok(packageJson.scripts.test.includes('operator-recovery.test.mjs'), 'PACKAGE_TEST');
ok(packageJson.scripts.check.includes('check_operator_recovery.mjs'), 'PACKAGE_CHECK');
ok(!workflow.includes('secrets.'), 'NO_SECRETS');
ok(!workflow.includes('deploy-pages'), 'NO_DEPLOY');

console.log(JSON.stringify({
  status: 'pass',
  repository: contract.repository,
  trackingIssue: contract.trackingIssue,
  readinessGate: contract.readinessGate,
  readinessStatus: pr8.status,
  knownFailureCodes: contract.knownFailureCodes.length,
  requiredDrills: contract.requiredDrills.total,
  unknownDecision: contract.unknownFailurePolicy.decision,
  productionReady: false,
  beginnerReady: false,
  observedOperatorRecovery: false
}, null, 2));
