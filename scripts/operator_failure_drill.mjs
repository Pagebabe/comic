import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderRecoveryReportHtml, runSyntheticRecoveryDrills, validateRecoveryPlan } from '../lib/operator-recovery.mjs';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

export async function runOperatorFailureDrill({
  outputDirectory = 'output/operator-recovery',
  occurredAt = '2026-07-11T00:00:00.000Z'
} = {}) {
  const destination = resolve(outputDirectory);
  await mkdir(destination, { recursive: true });
  const report = runSyntheticRecoveryDrills({ occurredAt });
  for (const result of report.results) validateRecoveryPlan(result.diagnosis);
  if (report.passed !== report.scenarioCount) throw new Error('RECOVERY_DRILL_NOT_ALL_PASS');
  if (report.results.some((result) => !result.sandboxRestored || result.externalActionExecuted || result.destructiveActionExecuted)) {
    throw new Error('RECOVERY_DRILL_BOUNDARY_VIOLATION');
  }
  const html = renderRecoveryReportHtml(report);
  const jsonPath = resolve(destination, 'operator-recovery-report.json');
  const htmlPath = resolve(destination, 'operator-recovery-report.html');
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(htmlPath, html);
  return { report, jsonPath, htmlPath };
}

const invokedDirectly = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  const { report, jsonPath, htmlPath } = await runOperatorFailureDrill({
    outputDirectory: valueAfter('--output', 'output/operator-recovery'),
    occurredAt: valueAfter('--occurred-at', process.env.RECOVERY_OCCURRED_AT || '2026-07-11T00:00:00.000Z')
  });
  console.log(JSON.stringify({
    status: 'pass',
    trackingIssue: report.trackingIssue,
    scenarios: report.scenarioCount,
    passed: report.passed,
    reportHash: report.reportHash,
    jsonPath,
    htmlPath,
    productionReady: false,
    beginnerReady: false,
    observedOperatorRecovery: false
  }));
}
