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
const loopClosure = JSON.parse(await readFile(new URL('../_site/project/lr3-production-loop-closure.json', import.meta.url), 'utf8'));
const pilotClosure = JSON.parse(await readFile(new URL('../_site/project/lr4-selected-pilot-closure.json', import.meta.url), 'utf8'));

if (truth.status !== 'recovery_line_active') throw new Error('Recovery line is not active.');
for (const gate of ['LR0','LR1','LR2','LR3','LR4']) if (truth.nextSequence?.find((item) => item.id === gate)?.status !== 'done') throw new Error(`${gate} is not closed.`);
if (truth.nextSequence?.find((item) => item.id === 'LR5')?.status !== 'active_recovery_gate') throw new Error('LR5 is not active.');
if (truth.trackingIssue !== 82) throw new Error('LR5 tracking issue drifted.');
if (truth.canon.status !== 'pilot_selected_human_confirmed' || truth.canon.selectedPilot !== 'pilot-das-zimmer') throw new Error('Human pilot selection is missing.');
if (truth.evidence.currentCoveragePercent !== null) throw new Error('Current evidence percentage must be null.');
if (evidenceClosure.status !== 'historical_bounded_snapshot' || evidenceClosure.currentCompletenessClaimAllowed !== false) throw new Error('Old closure is not a bounded snapshot.');
if (lineResetClosure.status !== 'closed_verified') throw new Error('LR0 closure proof is invalid.');
if (decisionRecord.status !== 'human_decision_recorded' || decisionRecord.selectedCandidateId !== 'pilot-das-zimmer') throw new Error('Decision record is invalid.');
if (foundationClosure.status !== 'closed_verified' || foundationClosure.pullRequest?.number !== 59 || foundationClosure.deployment?.runId !== 29148728164 || foundationClosure.nextGate?.trackingIssue !== 60) throw new Error('LR2 closure proof is invalid.');
if (loopClosure.status !== 'closed_verified' || loopClosure.implementedBy?.pullRequest !== 74 || loopClosure.implementedBy?.ciRun !== 29150833651 || loopClosure.publicProof?.pagesRun !== 29150875221 || loopClosure.publicProof?.publicVerificationPassed !== true) throw new Error('LR3 closure proof is invalid.');
if (loopClosure.proof?.stationsPassed !== 9 || !loopClosure.proof?.deleteCountercheckPassed || !loopClosure.proof?.deleteRestoreHashMatch || loopClosure.proof?.imageBytesUsed || loopClosure.proof?.externalExecutionUsed || loopClosure.proof?.creativeApprovalGranted) throw new Error('LR3 proof crossed its technical boundary.');
if (loopClosure.nextGate?.trackingIssue !== 76) throw new Error('LR3 closure did not hand off to LR4.');
if (pilotClosure.status !== 'closed_verified' || pilotClosure.implementedBy?.pullRequest !== 81 || pilotClosure.implementedBy?.ciRun !== 29152706460 || pilotClosure.implementedBy?.mergeCommit !== '63021f49152dee7375578537be13dafd65685391' || pilotClosure.publicProof?.pagesRun !== 29152807415 || pilotClosure.publicProof?.publicVerificationPassed !== true) throw new Error('LR4 closure proof is invalid.');
if (pilotClosure.proof?.stationsPassed !== 9 || !pilotClosure.proof?.stateActuallyDeleted || !pilotClosure.proof?.deleteRestoreHashMatch || pilotClosure.proof?.imageBytesUsed || pilotClosure.proof?.externalExecutionUsed || pilotClosure.proof?.creativeApprovalGranted) throw new Error('LR4 proof crossed its technical boundary.');
if (pilotClosure.nextGate?.trackingIssue !== 82) throw new Error('LR4 closure did not hand off to LR5.');

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
  await page.waitForFunction(() => document.body.textContent.includes('LR5') && document.body.textContent.includes('Issue #82') && document.body.textContent.includes('DAS ZIMMER'));

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
      lr3ClosedPresent: text.includes('LR3 LOOP') && text.includes('9/9') && text.includes('PASS'),
      lr4ClosedPresent: text.includes('LR4 PILOT FIRE TEST') && text.includes('PASS') && text.includes('Pages 29152807415'),
      lr5ActivePresent: text.includes('LR5') && text.includes('Issue #82'),
      selectedPilotPresent: text.includes('DAS ZIMMER'),
      foundationProofPresent: text.includes('LR2 FOUNDATION') && text.includes('PR #59'),
      productionLoopProofPresent: text.includes('LR3 LOOP') && text.includes('9/9'),
      selectedPilotClosurePresent: text.includes('LR4 Closure') && text.includes('Selected-Pilot-Fire-Test live'),
      masterBoundaryPresent: text.includes('0/4') && text.includes('0/3') && text.includes('keine automatische') && text.includes('Freigabe'),
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
    || !checks.lr3ClosedPresent
    || !checks.lr4ClosedPresent
    || !checks.lr5ActivePresent
    || !checks.selectedPilotPresent
    || !checks.foundationProofPresent
    || !checks.productionLoopProofPresent
    || !checks.selectedPilotClosurePresent
    || !checks.masterBoundaryPresent
    || !checks.partialEvidencePresent
    || !checks.historicalSnapshotPresent
    || checks.oldCurrentClosureClaimPresent
    || checks.canonOpenClaimPresent
    || checks.finishedEpisodeClaimPresent;

  if (failed) throw new Error(`${target.name} visual proof failed: ${JSON.stringify(checks)}`);

  const screenshotName = `dashboard-${target.name}.png`;
  const file = new URL(screenshotName, outputDir);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
  await page.screenshot({ path: file.pathname, fullPage: true });
  const bytes = await readFile(file);
  results.push({ ...target, checks, screenshot: `proof/${screenshotName}`, sha256: createHash('sha256').update(bytes).digest('hex') });
  await page.close();
}

await browser.close();

const manifest = {
  schemaVersion: 12,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  generatedAt: new Date().toISOString(),
  truthStatus: truth.status,
  currentAuthority: truth.authority,
  closedGate: 'LR4',
  activeGate: 'LR5',
  activeTrackingIssue: 82,
  lr0ClosureStatus: lineResetClosure.status,
  lr1DecisionStatus: decisionRecord.status,
  lr2ClosureStatus: foundationClosure.status,
  lr3ClosureStatus: loopClosure.status,
  lr4ClosureStatus: pilotClosure.status,
  lr3StationsPassed: loopClosure.proof.stationsPassed,
  lr3DeleteRestoreHashMatch: loopClosure.proof.deleteRestoreHashMatch,
  lr4StationsPassed: pilotClosure.proof.stationsPassed,
  lr4DeleteRestoreHashMatch: pilotClosure.proof.deleteRestoreHashMatch,
  selectedPilot: truth.canon.selectedPilot,
  selectedPilotTitle: truth.canon.selectedTitle,
  studioFoundationStatus: truth.productArchitecture.productionFoundation.status,
  productionLoopRestored: true,
  selectedPilotFireTestPassed: true,
  selectedPilotDetailsStatus: 'REVIEW_REQUIRED',
  characterMastersApproved: 0,
  locationMastersApproved: 0,
  voiceMastersApproved: 0,
  finishedEpisodes: 0,
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
