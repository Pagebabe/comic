import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173/';
const commit = process.env.GITHUB_SHA || 'local';
const outputDir = new URL('../_site/proof/', import.meta.url);
const truth = JSON.parse(await readFile(new URL('../_site/project/truth-state.json', import.meta.url), 'utf8'));
const closure = JSON.parse(await readFile(new URL('../_site/project/evidence-closure.json', import.meta.url), 'utf8'));

if (truth.status !== 'line_reset_active') throw new Error('Line reset is not active.');
if (truth.canon.status !== 'decision_required') throw new Error('Canon decision is not open.');
if (truth.evidence.currentCoveragePercent !== null) throw new Error('Current evidence percentage must be null.');
if (closure.status !== 'historical_bounded_snapshot') throw new Error('Old closure is not a bounded snapshot.');
if (closure.currentCompletenessClaimAllowed !== false) throw new Error('Old closure still allows a current completeness claim.');

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
    const visible = (element) => element
      && getComputedStyle(element).display !== 'none'
      && element.getBoundingClientRect().width > 0
      && element.getBoundingClientRect().height > 0;
    const text = document.body.textContent;
    return {
      coreCards: document.querySelectorAll('.core-card').length,
      visualOpenLabels: [...document.querySelectorAll('.visual-unproven span')]
        .filter((node) => node.textContent.trim() === 'VISUAL OFFEN').length,
      visiblePortraitImages: [...document.querySelectorAll('.core-card .portrait img')].filter(visible).length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      lineResetPresent: text.includes('LINE RESET') || text.includes('Line Reset'),
      canonOpenPresent: text.includes('DECISION_REQUIRED') && text.includes('Canon'),
      productionArchivePresent: text.includes('PRODUKTIONSAPP') && text.includes('ARCHIV'),
      partialEvidencePresent: text.includes('PARTIELL') && text.includes('keine Prozentzahl'),
      historicalSnapshotPresent: text.includes('HISTORISCHER SNAPSHOT'),
      oldCurrentClosureClaimPresent: text.includes('PRIORITY 0 · BEWEISKETTE 100% GESCHLOSSEN'),
      finishedEpisodeClaimPresent: text.includes('FERTIGE EPISODE') && text.includes('JA')
    };
  });

  const failed = checks.coreCards !== 4
    || checks.visualOpenLabels !== 4
    || checks.visiblePortraitImages !== 0
    || checks.horizontalOverflowPixels > 2
    || !checks.lineResetPresent
    || !checks.canonOpenPresent
    || !checks.productionArchivePresent
    || !checks.partialEvidencePresent
    || !checks.historicalSnapshotPresent
    || checks.oldCurrentClosureClaimPresent
    || checks.finishedEpisodeClaimPresent;

  if (failed) throw new Error(`${target.name} visual proof failed: ${JSON.stringify(checks)}`);

  const screenshotName = `dashboard-${target.name}.png`;
  const file = new URL(screenshotName, outputDir);
  await page.screenshot({ path: file.pathname, fullPage: true });
  const bytes = await readFile(file);
  results.push({
    ...target,
    checks,
    screenshot: `proof/${screenshotName}`,
    sha256: createHash('sha256').update(bytes).digest('hex')
  });
  await page.close();
}

await browser.close();

const manifest = {
  schemaVersion: 6,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  generatedAt: new Date().toISOString(),
  truthStatus: truth.status,
  currentAuthority: truth.authority,
  canonStatus: truth.canon.status,
  selectedPilot: truth.canon.selectedPilot,
  productionAppStatus: truth.productArchitecture.productionFoundation.status,
  currentEvidenceCoveragePercent: null,
  historicalSnapshot: {
    throughPullRequest: closure.snapshotThroughPullRequest,
    selectedEntries: closure.coverage.trackedEntries,
    oldCoveragePercent: closure.coverage.percent
  },
  targets: results
};

await writeFile(new URL('runtime-evidence.json', outputDir), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
