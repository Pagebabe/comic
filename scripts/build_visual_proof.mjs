import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173/';
const commit = process.env.GITHUB_SHA || 'local';
const outputDir = new URL('../_site/proof/', import.meta.url);
const truth = JSON.parse(await readFile(new URL('../_site/project/truth-state.json', import.meta.url), 'utf8'));
const evidenceClosure = JSON.parse(await readFile(new URL('../_site/project/evidence-closure.json', import.meta.url), 'utf8'));
const lineResetClosure = JSON.parse(await readFile(new URL('../_site/project/line-reset-closure.json', import.meta.url), 'utf8'));
const decisionRecord = JSON.parse(await readFile(new URL('../_site/project/pilot-decision-record.json', import.meta.url), 'utf8'));
const foundationClosure = JSON.parse(await readFile(new URL('../_site/project/studio-foundation-closure.json', import.meta.url), 'utf8'));

if (truth.status !== 'recovery_line_active') throw new Error('Recovery line is not active.');
if (truth.nextSequence?.find((item) => item.id === 'LR0')?.status !== 'done') throw new Error('LR0 is not closed.');
if (truth.nextSequence?.find((item) => item.id === 'LR1')?.status !== 'done') throw new Error('LR1 is not closed.');
if (truth.nextSequence?.find((item) => item.id === 'LR2')?.status !== 'done') throw new Error('LR2 is not closed.');
if (truth.nextSequence?.find((item) => item.id === 'LR3')?.status !== 'active_recovery_gate') throw new Error('LR3 is not active.');
if (truth.trackingIssue !== 60) throw new Error('LR3 tracking issue drifted.');
if (truth.canon.status !== 'pilot_selected_human_confirmed' || truth.canon.selectedPilot !== 'pilot-das-zimmer') throw new Error('Human pilot selection is missing.');
if (truth.evidence.currentCoveragePercent !== null) throw new Error('Current evidence percentage must be null.');
if (evidenceClosure.status !== 'historical_bounded_snapshot' || evidenceClosure.currentCompletenessClaimAllowed !== false) throw new Error('Old closure is not a bounded snapshot.');
if (lineResetClosure.status !== 'closed_verified') throw new Error('LR0 closure proof is invalid.');
if (decisionRecord.status !== 'human_decision_recorded' || decisionRecord.selectedCandidateId !== 'pilot-das-zimmer') throw new Error('Decision record is invalid.');
if (foundationClosure.status !== 'closed_verified' || foundationClosure.pullRequest?.number !== 59 || foundationClosure.deployment?.runId !== 29148728164 || foundationClosure.nextGate?.trackingIssue !== 60) throw new Error('LR2 closure proof is invalid.');

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
  await page.waitForFunction(() => document.body.textContent.includes('LR3') && document.body.textContent.includes('Issue #60') && document.body.textContent.includes('DAS ZIMMER'));

  const checks = await page.evaluate(() => {
    const visible = (element) => element
      && getComputedStyle(element).display !== 'none'
      && element.getBoundingClientRect().width > 0
      && element.getBoundingClientRect().height > 0;
    const text = document.body.textContent || '';
    return {
      coreCards: document.querySelectorAll('.core-card').length,
      visualOpenLabels: [...document.querySelectorAll('.visual-unproven span')].filter((node) => node.textContent.trim() === 'VISUAL OFFEN').length,
      visiblePortraitImages: [...document.querySelectorAll('.core-card .portrait img')].filter(visible).length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      lr0ClosedPresent: text.includes('LR0 TRUTH RESET') && text.includes('PASS'),
      lr1ClosedPresent: text.includes('LR1 PILOTWAHL') && text.includes('PASS'),
      lr2ClosedPresent: text.includes('LR2 FOUNDATION') && text.includes('PASS'),
      lr3ActivePresent: text.includes('LR3') && text.includes('Issue #60'),
      selectedPilotPresent: text.includes('DAS ZIMMER'),
      foundationProofLinkPresent: text.includes('LR2 Closure') && text.includes('Studio Foundation live'),
      productionLoopOpenPresent: text.includes('Produktionsloop') && text.includes('noch nicht bewiesen'),
      partialEvidencePresent: text.includes('PARTIELL') && text.includes('keine Prozentzahl'),
      historicalSnapshotPresent: text.includes('HISTORISCHER SNAPSHOT'),
      oldCurrentClosureClaimPresent: text.includes('PRIORITY 0 · BEWEISKETTE 100% GESCHLOSSEN'),
      canonOpenClaimPresent: text.includes('DECISION_REQUIRED') && text.includes('Pilot'),
      finishedEpisodeClaimPresent: text.includes('FERTIGE EPISODE') && text.includes('JA')
    };
  });

  const failed = checks.coreCards !== 4
    || checks.visualOpenLabels !== 4
    || checks.visiblePortraitImages !== 0
    || checks.horizontalOverflowPixels > 2
    || !checks.lr0ClosedPresent
    || !checks.lr1ClosedPresent
    || !checks.lr2ClosedPresent
    || !checks.lr3ActivePresent
    || !checks.selectedPilotPresent
    || !checks.foundationProofLinkPresent
    || !checks.productionLoopOpenPresent
    || !checks.partialEvidencePresent
    || !checks.historicalSnapshotPresent
    || checks.oldCurrentClosureClaimPresent
    || checks.canonOpenClaimPresent
    || checks.finishedEpisodeClaimPresent;

  if (failed) throw new Error(`${target.name} visual proof failed: ${JSON.stringify(checks)}`);

  const screenshotName = `dashboard-${target.name}.png`;
  const file = new URL(screenshotName, outputDir);
  await page.screenshot({ path: file.pathname, fullPage: true });
  const bytes = await readFile(file);
  results.push({ ...target, checks, screenshot: `proof/${screenshotName}`, sha256: createHash('sha256').update(bytes).digest('hex') });
  await page.close();
}

await browser.close();

const manifest = {
  schemaVersion: 10,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  generatedAt: new Date().toISOString(),
  truthStatus: truth.status,
  currentAuthority: truth.authority,
  closedGate: 'LR2',
  activeGate: 'LR3',
  activeTrackingIssue: 60,
  lr0ClosureStatus: lineResetClosure.status,
  lr1DecisionStatus: decisionRecord.status,
  lr2ClosureStatus: foundationClosure.status,
  selectedPilot: truth.canon.selectedPilot,
  selectedPilotTitle: truth.canon.selectedTitle,
  studioFoundationStatus: truth.productArchitecture.productionFoundation.status,
  productionLoopRestored: false,
  currentEvidenceCoveragePercent: null,
  historicalSnapshot: {
    throughPullRequest: evidenceClosure.snapshotThroughPullRequest,
    selectedEntries: evidenceClosure.coverage.trackedEntries,
    oldCoveragePercent: evidenceClosure.coverage.percent
  },
  targets: results
};

await writeFile(new URL('runtime-evidence.json', outputDir), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
