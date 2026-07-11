import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateRecoveryPlan } from '../lib/operator-recovery.mjs';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const reportPath = resolve(valueAfter('--report', 'output/operator-recovery/operator-recovery-report.json'));
const htmlPath = resolve(valueAfter('--html', 'output/operator-recovery/operator-recovery-report.html'));
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const html = await readFile(htmlPath, 'utf8');
const ok = (condition, code) => {
  if (!condition) throw new Error(`[OPERATOR_RECOVERY_REPORT:${code}]`);
};

ok(report.schemaVersion === 1, 'SCHEMA');
ok(report.ruleVersion === 'ops-recovery.v1', 'RULE_VERSION');
ok(report.repository === 'Pagebabe/comic', 'REPOSITORY');
ok(report.trackingIssue === 118, 'TRACKING');
ok(report.occurredAt === '2026-07-11T00:00:00.000Z', 'DETERMINISTIC_TIME');
ok(report.scenarioCount === 14, 'SCENARIOS');
ok(report.passed === 14, 'PASSED');
ok(/^[0-9a-f]{64}$/.test(report.reportHash), 'REPORT_HASH');
ok(report.results.length === 14, 'RESULTS');
ok(report.results.filter((result) => result.diagnosis.category === 'UNKNOWN').length === 1, 'UNKNOWN_COUNT');

for (const result of report.results) {
  ok(result.status === 'PASS', `RESULT_${result.code}`);
  ok(result.sandboxRestored === true, `SANDBOX_${result.code}`);
  ok(result.externalActionExecuted === false, `EXTERNAL_${result.code}`);
  ok(result.destructiveActionExecuted === false, `DESTRUCTIVE_${result.code}`);
  ok(validateRecoveryPlan(result.diagnosis) === true, `PLAN_${result.code}`);
}

const unknown = report.results.find((result) => result.diagnosis.category === 'UNKNOWN');
ok(unknown.diagnosis.decision === 'HUMAN_ESCALATION_REQUIRED', 'UNKNOWN_DECISION');
ok(unknown.diagnosis.commands.length === 0, 'UNKNOWN_COMMANDS');
ok(unknown.diagnosis.retry === null, 'UNKNOWN_RETRY');

ok(report.boundaries.productionReady === false, 'PRODUCTION_BOUNDARY');
ok(report.boundaries.beginnerReady === false, 'BEGINNER_BOUNDARY');
ok(report.boundaries.creativeApprovalGranted === false, 'CREATIVE_BOUNDARY');
ok(report.boundaries.imageGenerationAllowed === false, 'IMAGE_BOUNDARY');
ok(report.boundaries.growthOsIntegrated === false, 'GROWTH_BOUNDARY');
ok(report.boundaries.observedOperatorRecovery === false, 'OBSERVATION_BOUNDARY');

ok(html.includes("default-src 'none'"), 'HTML_CSP');
ok(html.includes(report.reportHash), 'HTML_HASH');
ok(html.includes('14/14 sichere Failure-Drills'), 'HTML_COUNT');
ok(html.includes('Production Ready: NEIN'), 'HTML_PRODUCTION');
ok(!/<script/i.test(html), 'HTML_SCRIPT');
ok(!/https?:\/\//i.test(html), 'HTML_NETWORK');

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: report.trackingIssue,
  scenarios: report.scenarioCount,
  passed: report.passed,
  reportHash: report.reportHash,
  unknownDecision: unknown.diagnosis.decision,
  sandboxRestored: true,
  externalActionsExecuted: false,
  destructiveActionsExecuted: false,
  productionReady: false,
  beginnerReady: false,
  observedOperatorRecovery: false
}, null, 2));
