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
const riccoInventory = JSON.parse(await readFile(new URL('../_site/project/lr5-ricco-master-source-inventory.json', import.meta.url), 'utf8'));
const riccoContract = JSON.parse(await readFile(new URL('../_site/project/lr5-ricco-master-contract.json', import.meta.url), 'utf8'));

if (truth.status !== 'recovery_line_active') throw new Error('Recovery line is not active.');
for (const gate of ['LR0','LR1','LR2','LR3','LR4']) if (truth.nextSequence?.find((item) => item.id === gate)?.status !== 'done') throw new Error(`${gate} is not closed.`);
if (truth.nextSequence?.find((item) => item.id === 'LR5')?.status !== 'active_recovery_gate') throw new Error('LR5 is not active.');
if (truth.trackingIssue !== 82) throw new Error('LR5 tracking issue drifted.');
if (truth.activeWorkPackage?.id !== 'LR5.1' || truth.activeWorkPackage?.trackingIssue !== 88 || truth.activeWorkPackage?.status !== 'contract_review_required') throw new Error('LR5.1 is not active.');
if (truth.activeWorkPackage?.candidateSheets !== 0 || truth.activeWorkPackage?.imageGenerationAllowedNow !== false || truth.activeWorkPackage?.imageBytesPresent !== false || truth.activeWorkPackage?.externalExecutionUsed !== false || truth.activeWorkPackage?.masterApproved !== false) throw new Error('LR5.1 truth zero state drifted.');
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
if (riccoInventory.gate !== 'LR5' || riccoInventory.workPackage !== 'LR5.1' || riccoInventory.trackingIssue !== 88 || riccoInventory.sources?.length !== 7 || riccoInventory.resolvedConflicts?.length !== 5) throw new Error('Ricco source inventory is invalid.');
if (riccoInventory.candidateBoundary?.currentCandidateSheets !== 0 || riccoInventory.candidateBoundary?.imageBytesPresent !== false || riccoInventory.candidateBoundary?.externalGeneratorExecutionUsed !== false || riccoInventory.candidateBoundary?.masterApproved !== false) throw new Error('Ricco inventory zero state drifted.');
if (riccoContract.status !== 'CONTRACT_READY_REVIEW_REQUIRED' || riccoContract.executionGate?.imageGenerationAllowedNow !== false || riccoContract.executionGate?.maximumCandidateSheetsAfterApproval !== 1 || riccoContract.executionGate?.batchGenerationAllowed !== false || riccoContract.executionGate?.loraTrainingAllowed !== false || riccoContract.executionGate?.automaticMasterAssignmentAllowed !== false || riccoContract.currentState?.candidateSheets !== 0 || riccoContract.currentState?.masterApproved !== false) throw new Error('Ricco contract boundary drifted.');

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
  await page.waitForFunction(() => document.body.textContent.includes('LR5.1') && document.body.textContent.includes('Issue #88') && document.body.textContent.includes('0/1'));

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
      lr4ClosedPresent: text.includes('LR4 PILOT FIRE TEST') && text.includes('PASS') && text.includes('Pages 29154561431'),
      lr5ActivePresent: text.includes('LR5') && text.includes('Issue #82'),
      lr51ActivePresent: text.includes('LR5.1') && text.includes('Issue #88'),
      riccoContractPresent: text.includes('CONTRACT_READY_REVIEW_REQUIRED'),
      riccoCandidateZeroPresent: text.includes('RICCO KANDIDATEN') && text.includes('0/1'),
      riccoExecutionBlockedPresent: text.includes('BILDGENERIERUNG') && text.includes('GESPERRT') && text.includes('EXECUTION BLOCKED'),
      riccoSourceProofPresent: text.includes('7 Quellen') && text.includes('5 Konflikte') && text.includes('10 Reviewtests'),
      riccoRoutePresent: Boolean(document.querySelector('a[href="./studio/#lr5-ricco"]')),
      selectedPilotPresent: text.includes('Das Zimmer'),
      foundationProofPresent: text.includes('LR2 FOUNDATION') && text.includes('PR #59'),
      productionLoopProofPresent: text.includes('LR3 LOOP') && text.includes('9/9'),
      selectedPilotClosurePresent: text.includes('LR4 Closure') && text.includes('Selected-Pilot-Fire-Test live'),
      masterBoundaryPresent: text.includes('0/4') && text.includes('0/3') && text.includes('keine automatische') && text.includes('Freigabe'),
      partialEvidencePresent: text.includes('PARTIELL') && text.includes('keine Prozentzahl'),
      historicalSnapshotPresent: text.includes('HISTORISCHER SNAPSHOT'),
      oldCurrentClosureClaimPresent: text.includes('PRIORITY 0 · BEWEISKETTE 100% GESCHLOSSEN'),
      canonOpenClaimPresent: text.includes('DECISION_REQUIRED') && text.includes('Pilot'),
      finishedEpisodeClaimPresent: text.includes('FERTIGE EPISODE') && text.includes('JA'),
      generationAllowedClaimPresent: text.includes('LR5 darf jetzt kontrollierte visuelle Kandidaten erzeugen')
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
    || !checks.lr51ActivePresent
    || !checks.riccoContractPresent
    || !checks.riccoCandidateZeroPresent
    || !checks.riccoExecutionBlockedPresent
    || !checks.riccoSourceProofPresent
    || !checks.riccoRoutePresent
    || !checks.selectedPilotPresent
    || !checks.foundationProofPresent
    || !checks.productionLoopProofPresent
    || !checks.selectedPilotClosurePresent
    || !checks.masterBoundaryPresent
    || !checks.partialEvidencePresent
    || !checks.historicalSnapshotPresent
    || checks.oldCurrentClosureClaimPresent
    || checks.canonOpenClaimPresent
    || checks.finishedEpisodeClaimPresent
    || checks.generationAllowedClaimPresent;

  if (failed) throw new Error(`${target.name} LR5.1 visual proof failed: ${JSON.stringify(checks)}`);

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
  schemaVersion: 13,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  generatedAt: new Date().toISOString(),
  truthStatus: truth.status,
  currentAuthority: truth.authority,
  closedGate: 'LR4',
  activeGate: 'LR5',
  activeTrackingIssue: 82,
  activeWorkPackage: 'LR5.1',
  activeWorkPackageTrackingIssue: 88,
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
  riccoMasterContractStatus: riccoContract.status,
  riccoMasterReviewStatus: riccoContract.humanDecision.current,
  riccoMasterSourceCount: riccoInventory.sources.length,
  riccoMasterConflictCount: riccoInventory.resolvedConflicts.length,
  riccoMasterReviewTestCount: riccoContract.reviewTests.length,
  riccoMasterCandidateLimit: riccoContract.executionGate.maximumCandidateSheetsAfterApproval,
  riccoMasterCandidateSheets: riccoContract.currentState.candidateSheets,
  riccoMasterImageGenerationAllowedNow: riccoContract.executionGate.imageGenerationAllowedNow,
  riccoMasterImageBytesPresent: riccoContract.currentState.imageBytesPresent,
  riccoMasterExternalExecutionUsed: riccoContract.currentState.externalExecutionUsed,
  riccoMasterApproved: riccoContract.currentState.masterApproved,
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
