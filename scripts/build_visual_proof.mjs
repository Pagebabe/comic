import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173/';
const commit = process.env.GITHUB_SHA || 'local';
const outputDir = new URL('../_site/proof/', import.meta.url);
const closure = JSON.parse(await readFile(new URL('../_site/project/evidence-closure.json', import.meta.url), 'utf8'));
const history = JSON.parse(await readFile(new URL('../_site/project/historical-pr-evidence.json', import.meta.url), 'utf8'));
const screenshotNames = { desktop: 'dashboard-desktop.png', mobile: 'dashboard-mobile.png' };

if (closure.repository !== 'Pagebabe/comic' || closure.status !== 'coverage_closed') throw new Error('Evidence closure is not active for Pagebabe/comic.');
if (closure.coverage?.percent !== 100 || closure.coverage?.trackedEntries !== 25 || closure.coverage?.terminallyClassified !== 25) throw new Error('Runtime proof requires 100 percent evidence coverage across 25/25 entries.');
if (closure.coverage?.historicalPullRequestsAudited !== 25 || closure.coverage?.historicalUnitsAudited !== 26) throw new Error('Runtime proof requires all 25 pull requests and 26 historical units.');
if (Object.keys(closure.incidentClosures || {}).length !== 5 || closure.incidentClosures?.['INC-005-stale-evidence-heading'] !== 'closed_verified_by_runtime_visual_proof') throw new Error('Runtime proof requires five terminally closed incidents.');
if (closure.classifications?.['RULE-009-evidence-first-pr-gate'] !== 'proven') throw new Error('Priority-zero evidence rule is not proven.');
if (closure.classifications?.['CLAIM-016-complete-historical-pr-backfill'] !== 'proven') throw new Error('Historical PR backfill is not proven.');
if (history.status !== 'coverage_closed' || history.summary?.pending !== 0 || history.summary?.coveragePercent !== 100) throw new Error('Historical PR ledger is not closed.');

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
for (const target of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport: { width: target.width, height: target.height } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#evidenceChain .evidence-summary');
  const checks = await page.evaluate(() => {
    const visible = (element) => element && getComputedStyle(element).display !== 'none' && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
    const cards = [...document.querySelectorAll('.core-card')];
    const openLabels = [...document.querySelectorAll('.visual-unproven span')].filter((node) => node.textContent.trim() === 'VISUAL OFFEN');
    const visiblePortraits = [...document.querySelectorAll('.core-card .portrait img')].filter(visible);
    const text = document.body.textContent;
    return {
      coreCards: cards.length,
      visualOpenLabels: openLabels.length,
      visiblePortraitImages: visiblePortraits.length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      evidencePanelPresent: Boolean(document.querySelector('#evidenceChain')),
      coverageTextPresent: text.includes('100%'),
      trackedEntryTextPresent: text.includes('25/25'),
      historicalUnitsTextPresent: text.includes('26 historische Einheiten'),
      historicalBackfillTextPresent: text.includes('Historischer PR-Backfill'),
      priorityZeroTextPresent: text.includes('PRIORITY 0'),
      driftSafeEvidenceHeadingPresent: text.includes('Vollständige Regeln- und Claim-Klassifikation'),
      staleEvidenceCountPresent: text.includes('23/23 Arbeitsregeln und Behauptungen'),
      incidentClosureTextPresent: text.includes('Alle fünf Vorfälle terminal geschlossen')
    };
  });
  if (checks.coreCards !== 4 || checks.visualOpenLabels !== 4 || checks.visiblePortraitImages !== 0 || checks.horizontalOverflowPixels > 2 || !checks.evidencePanelPresent || !checks.coverageTextPresent || !checks.trackedEntryTextPresent || !checks.historicalUnitsTextPresent || !checks.historicalBackfillTextPresent || !checks.priorityZeroTextPresent || !checks.driftSafeEvidenceHeadingPresent || checks.staleEvidenceCountPresent || !checks.incidentClosureTextPresent) {
    throw new Error(`${target.name} visual proof failed: ${JSON.stringify(checks)}`);
  }
  const screenshotName = screenshotNames[target.name];
  const file = new URL(screenshotName, outputDir);
  await page.screenshot({ path: file.pathname, fullPage: true });
  const bytes = await readFile(file);
  results.push({ ...target, checks, screenshot: `proof/${screenshotName}`, sha256: createHash('sha256').update(bytes).digest('hex') });
  await page.close();
}
await browser.close();

const manifest = {
  schemaVersion: 5,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  generatedAt: new Date().toISOString(),
  evidenceCoveragePercent: closure.coverage.percent,
  trackedEntries: closure.coverage.trackedEntries,
  terminallyClassified: closure.coverage.terminallyClassified,
  historicalPullRequestsAudited: closure.coverage.historicalPullRequestsAudited,
  historicalUnitsAudited: closure.coverage.historicalUnitsAudited,
  historicalPending: history.summary.pending,
  incidentsClosed: Object.keys(closure.incidentClosures).length,
  priorityZeroRule: 'RULE-009-evidence-first-pr-gate',
  historicalBackfillClaim: 'CLAIM-016-complete-historical-pr-backfill',
  targets: results
};
await writeFile(new URL('runtime-evidence.json', outputDir), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
