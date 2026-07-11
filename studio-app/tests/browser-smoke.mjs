import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const baseUrl = args.find((item) => !item.startsWith('--')) || 'http://127.0.0.1:4174/studio/';
const outputIndex = args.indexOf('--output');
const outputDir = outputIndex >= 0 ? args[outputIndex + 1] : null;
const commit = process.env.GITHUB_SHA || 'local';

const browser = await chromium.launch({ headless: true });
const targets = [];

for (const target of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport: { width: target.width, height: target.height } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="studio-foundation"]');

  const foundationChecks = await page.evaluate(() => {
    const text = document.body.textContent || '';
    return {
      selectedPilotPresent: text.includes('Das Zimmer'),
      lr4ClosedPresent: text.includes('LR4 GESCHLOSSEN') && text.includes('LR4 PUBLICLY VERIFIED') && text.includes('SELECTED PILOT HASH MATCH'),
      lr5ActivePresent: text.includes('LR5') && text.includes('Issue #82'),
      foundationPresent: text.includes('Production Studio') && text.includes('FOUNDATION'),
      pilotRoutePresent: Boolean(document.querySelector('a[href="#pilot-fire-test"]')),
      riccoRoutePresent: Boolean(document.querySelector('a[href="#lr5-ricco"]')),
      boundaryPresent: text.includes('Character-Master 0/4') && text.includes('Location-Master 0/4') && text.includes('Stimmen 0/3') && text.includes('Keine') && text.includes('automatische Freigabe'),
      forbiddenOpenPilotCopy: text.includes('DECISION_REQUIRED') || text.includes('Pilot-Canon ist nicht ausgewählt') || text.includes('Selected-Pilot-Fire-Test noch offen'),
      forbiddenCompletionClaim: text.includes('Episode fertig') || text.includes('Production Ready'),
      imageCount: document.querySelectorAll('img').length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (!foundationChecks.selectedPilotPresent || !foundationChecks.lr4ClosedPresent || !foundationChecks.lr5ActivePresent || !foundationChecks.foundationPresent || !foundationChecks.pilotRoutePresent || !foundationChecks.riccoRoutePresent || !foundationChecks.boundaryPresent || foundationChecks.forbiddenOpenPilotCopy || foundationChecks.forbiddenCompletionClaim || foundationChecks.imageCount !== 0 || foundationChecks.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} Studio closure projection smoke failed: ${JSON.stringify(foundationChecks)}`);
  }

  await page.click('a[href="#loop"]');
  await page.waitForSelector('[data-testid="production-loop"]');
  await page.getByTestId('loop-reset').click();
  await page.getByTestId('loop-import').click();
  await page.getByTestId('loop-review').click();
  await page.getByTestId('loop-qa').click();
  await page.getByTestId('loop-letter').click();
  await page.getByTestId('loop-package').click();
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="loop-delete"]');
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await page.getByTestId('loop-delete').click();
  await page.waitForFunction(() => (document.querySelector('[data-testid="loop-message"]')?.textContent || '').includes('STATE DELETED'));

  const lr3DeletionChecks = await page.evaluate(() => ({
    stateRemoved: window.localStorage.getItem('comic-lr3-neutral-loop-v1') === null,
    packageRetained: Boolean(window.localStorage.getItem('comic-lr3-neutral-package-v1')),
    restoreEnabled: (() => {
      const button = document.querySelector('[data-testid="loop-restore"]');
      return button instanceof HTMLButtonElement && !button.disabled;
    })()
  }));
  if (!lr3DeletionChecks.stateRemoved || !lr3DeletionChecks.packageRetained || !lr3DeletionChecks.restoreEnabled) {
    throw new Error(`${target.name} LR3 deletion countercheck failed: ${JSON.stringify(lr3DeletionChecks)}`);
  }

  await page.getByTestId('loop-restore').click();
  await page.waitForFunction(() => (document.querySelector('[data-testid="restore-status"]')?.textContent || '').includes('HASH MATCH'));

  const lr3LoopChecks = await page.evaluate(() => {
    const text = document.body.textContent || '';
    const stations = [...document.querySelectorAll('.loop-stations article')];
    const codes = [...document.querySelectorAll('[data-testid="loop-hashes"] code')].map((node) => node.textContent?.trim() || '');
    const packageTextarea = document.querySelector('.package-preview textarea');
    const packageText = packageTextarea && 'value' in packageTextarea ? String(packageTextarea.value) : '';
    return {
      stationCount: stations.length,
      passedStationCount: stations.filter((station) => station.getAttribute('data-status') === 'passed').length,
      deleteRestorePassPresent: text.includes('DELETE + RESTORE PASS') && text.includes('HASH MATCH · DELETE AND RESTORE PASS'),
      hashMatchPresent: (document.querySelector('[data-testid="restore-status"]')?.textContent || '').includes('HASH MATCH'),
      packageHash: codes[0] || '',
      stateHashBeforeDelete: codes[1] || '',
      stateHashAfterRestore: codes[2] || '',
      packageContractPresent: packageText.includes('comic-factory-neutral-episode-package') && packageText.includes('technical_loop_candidate_only'),
      technicalBoundaryPresent: text.includes('Keine Bildgenerierung') && text.includes('keine kreative Freigabe'),
      forbiddenCreativeApproval: packageText.includes('"visualMaster": true') || packageText.includes('"voiceMaster": true') || packageText.includes('"finalEpisode": true'),
      imageCount: document.querySelectorAll('img').length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (lr3LoopChecks.stationCount !== 9 || lr3LoopChecks.passedStationCount !== 9 || !lr3LoopChecks.deleteRestorePassPresent || !lr3LoopChecks.hashMatchPresent || !lr3LoopChecks.packageHash || !lr3LoopChecks.stateHashBeforeDelete || lr3LoopChecks.stateHashBeforeDelete !== lr3LoopChecks.stateHashAfterRestore || !lr3LoopChecks.packageContractPresent || !lr3LoopChecks.technicalBoundaryPresent || lr3LoopChecks.forbiddenCreativeApproval || lr3LoopChecks.imageCount !== 0 || lr3LoopChecks.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} LR3 loop regression smoke failed: ${JSON.stringify(lr3LoopChecks)}`);
  }

  await page.click('a[href="#pilot-fire-test"]');
  await page.waitForSelector('[data-testid="selected-pilot-loop"]');
  await page.getByTestId('pilot-reset').click();
  await page.getByTestId('pilot-import').click();
  await page.getByTestId('pilot-review').click();
  await page.getByTestId('pilot-qa').click();
  await page.getByTestId('pilot-letter').click();
  await page.getByTestId('pilot-package').click();
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="pilot-delete"]');
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await page.getByTestId('pilot-delete').click();
  await page.waitForFunction(() => (document.querySelector('[data-testid="pilot-message"]')?.textContent || '').includes('STATE DELETED'));

  const pilotDeletionChecks = await page.evaluate(() => ({
    stateRemoved: window.localStorage.getItem('comic-lr4-selected-pilot-loop-v1') === null,
    packageRetained: Boolean(window.localStorage.getItem('comic-lr4-selected-pilot-package-v1')),
    restoreEnabled: (() => {
      const button = document.querySelector('[data-testid="pilot-restore"]');
      return button instanceof HTMLButtonElement && !button.disabled;
    })()
  }));
  if (!pilotDeletionChecks.stateRemoved || !pilotDeletionChecks.packageRetained || !pilotDeletionChecks.restoreEnabled) {
    throw new Error(`${target.name} LR4 deletion countercheck failed: ${JSON.stringify(pilotDeletionChecks)}`);
  }

  await page.getByTestId('pilot-restore').click();
  await page.waitForFunction(() => (document.querySelector('[data-testid="pilot-restore-status"]')?.textContent || '').includes('HASH MATCH'));

  const pilotLoopChecks = await page.evaluate(() => {
    const text = document.body.textContent || '';
    const stations = [...document.querySelectorAll('.loop-stations article')];
    const codes = [...document.querySelectorAll('[data-testid="pilot-hashes"] code')].map((node) => node.textContent?.trim() || '');
    const packageTextarea = document.querySelector('.package-preview textarea');
    const packageText = packageTextarea && 'value' in packageTextarea ? String(packageTextarea.value) : '';
    return {
      selectedPilotPresent: text.includes('Das Zimmer'),
      reviewRequiredPresent: text.includes('REVIEW_REQUIRED'),
      panelCountPresent: (document.querySelector('[data-testid="pilot-panel-count"]')?.textContent || '').includes('8/8'),
      durationPresent: (document.querySelector('[data-testid="pilot-duration"]')?.textContent || '').includes('45,5'),
      dialogueCountPresent: (document.querySelector('[data-testid="pilot-dialogue-count"]')?.textContent || '').trim() === '10',
      stationCount: stations.length,
      passedStationCount: stations.filter((station) => station.getAttribute('data-status') === 'passed').length,
      deleteRestorePassPresent: text.includes('DELETE + RESTORE PASS') && text.includes('SELECTED PILOT DELETE AND RESTORE PASS'),
      hashMatchPresent: (document.querySelector('[data-testid="pilot-restore-status"]')?.textContent || '').includes('HASH MATCH'),
      packageHash: codes[0] || '',
      stateHashBeforeDelete: codes[1] || '',
      stateHashAfterRestore: codes[2] || '',
      packageContractPresent: packageText.includes('comic-factory-selected-pilot-episode-package') && packageText.includes('selected_pilot_fire_test_candidate_only') && packageText.includes('pilot-das-zimmer'),
      sourceBindingPresent: packageText.includes('39011644e108d0a3c2dd8ddda41a5f2c74369b23') && packageText.includes('edbec4be2b3e9f72f60f95cef3178dcbce01ef1a'),
      noImageBytesPresent: packageText.includes('"containsImage": false') && packageText.includes('"mediaByteLength": 0'),
      forbiddenCreativeApproval: packageText.includes('"detailCanon": true') || packageText.includes('"dialogue": true') || packageText.includes('"timing": true') || packageText.includes('"visualMaster": true') || packageText.includes('"voiceMaster": true') || packageText.includes('"finalEpisode": true'),
      imageCount: document.querySelectorAll('img').length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (!pilotLoopChecks.selectedPilotPresent || !pilotLoopChecks.reviewRequiredPresent || !pilotLoopChecks.panelCountPresent || !pilotLoopChecks.durationPresent || !pilotLoopChecks.dialogueCountPresent || pilotLoopChecks.stationCount !== 9 || pilotLoopChecks.passedStationCount !== 9 || !pilotLoopChecks.deleteRestorePassPresent || !pilotLoopChecks.hashMatchPresent || !pilotLoopChecks.packageHash || !pilotLoopChecks.stateHashBeforeDelete || pilotLoopChecks.stateHashBeforeDelete !== pilotLoopChecks.stateHashAfterRestore || !pilotLoopChecks.packageContractPresent || !pilotLoopChecks.sourceBindingPresent || !pilotLoopChecks.noImageBytesPresent || pilotLoopChecks.forbiddenCreativeApproval || pilotLoopChecks.imageCount !== 0 || pilotLoopChecks.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} LR4 selected-pilot regression smoke failed: ${JSON.stringify(pilotLoopChecks)}`);
  }

  await page.click('a[href="#lr5-ricco"]');
  await page.waitForSelector('[data-testid="ricco-master-review"]');
  await page.waitForFunction(() => (document.body.textContent || '').includes('CONTRACT_READY_REVIEW_REQUIRED'));

  const riccoContractChecks = await page.evaluate(() => {
    const text = document.body.textContent || '';
    const reviewArticles = [...document.querySelectorAll('[data-testid="ricco-review-tests"] .loop-stations article')];
    const sourceCount = document.querySelector('[data-testid="ricco-source-count"]')?.textContent?.trim() || '';
    const candidateCount = document.querySelector('[data-testid="ricco-candidate-count"]')?.textContent?.trim() || '';
    const reviewStatus = document.querySelector('[data-testid="ricco-review-status"]')?.textContent?.trim() || '';
    return {
      routePresent: Boolean(document.querySelector('[data-testid="ricco-master-review"]')),
      contractReadyPresent: text.includes('CONTRACT_READY_REVIEW_REQUIRED'),
      executionBlockedPresent: text.includes('EXECUTION BLOCKED'),
      sourceCountPresent: sourceCount === '7/7',
      candidateCountPresent: candidateCount === '0/1' && text.includes('0/1 Kandidaten'),
      reviewRequiredPresent: reviewStatus === 'REVIEW_REQUIRED',
      issuePresent: text.includes('ISSUE #88'),
      viewCountPresent: text.includes('5 Ansichten'),
      expressionCountPresent: text.includes('6 Expressions'),
      totalReviewTests: reviewArticles.length,
      blockingReviewTests: reviewArticles.filter((article) => (article.querySelector('em')?.textContent || '').trim() === 'BLOCKING').length,
      executionBoundaryPresent: text.includes('Bildgenerierung jetzt erlaubt: false') && text.includes('Batch erlaubt: false') && text.includes('LoRA-Training erlaubt: false') && text.includes('Automatische Masterfreigabe: false'),
      zeroStatePresent: text.includes('BILDBYTES') && text.includes('EXTERNE AUSFÜHRUNG') && text.includes('CHARACTER-MASTER') && text.includes('0/4'),
      forbiddenApproval: text.includes('APPROVED_MASTER') && reviewStatus !== 'REVIEW_REQUIRED',
      imageCount: document.querySelectorAll('img').length,
      canvasCount: document.querySelectorAll('canvas').length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (!riccoContractChecks.routePresent || !riccoContractChecks.contractReadyPresent || !riccoContractChecks.executionBlockedPresent || !riccoContractChecks.sourceCountPresent || !riccoContractChecks.candidateCountPresent || !riccoContractChecks.reviewRequiredPresent || !riccoContractChecks.issuePresent || !riccoContractChecks.viewCountPresent || !riccoContractChecks.expressionCountPresent || riccoContractChecks.totalReviewTests !== 10 || riccoContractChecks.blockingReviewTests !== 9 || !riccoContractChecks.executionBoundaryPresent || !riccoContractChecks.zeroStatePresent || riccoContractChecks.forbiddenApproval || riccoContractChecks.imageCount !== 0 || riccoContractChecks.canvasCount !== 0 || riccoContractChecks.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} LR5.1 Ricco contract smoke failed: ${JSON.stringify(riccoContractChecks)}`);
  }

  const result = {
    ...target,
    checks: {
      foundation: foundationChecks,
      lr3Deletion: lr3DeletionChecks,
      lr3Loop: lr3LoopChecks,
      pilotDeletion: pilotDeletionChecks,
      pilotLoop: pilotLoopChecks,
      riccoContract: riccoContractChecks
    }
  };

  if (outputDir) {
    await mkdir(outputDir, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const screenshotPath = `${outputDir}/studio-${target.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const bytes = await readFile(screenshotPath);
    Object.assign(result, {
      screenshot: `studio-${target.name}.png`,
      sha256: createHash('sha256').update(bytes).digest('hex')
    });
  }

  targets.push(result);
  await page.close();
}

await browser.close();

const lr3StateHashes = [...new Set(targets.map((target) => target.checks.lr3Loop.stateHashAfterRestore))];
const lr3PackageHashes = [...new Set(targets.map((target) => target.checks.lr3Loop.packageHash))];
const pilotStateHashes = [...new Set(targets.map((target) => target.checks.pilotLoop.stateHashAfterRestore))];
const pilotPackageHashes = [...new Set(targets.map((target) => target.checks.pilotLoop.packageHash))];
if (lr3StateHashes.length !== 1 || lr3PackageHashes.length !== 1) throw new Error('Desktop and mobile produced different deterministic LR3 hashes.');
if (pilotStateHashes.length !== 1 || pilotPackageHashes.length !== 1) throw new Error('Desktop and mobile produced different deterministic LR4 selected-pilot hashes.');

const manifest = {
  schemaVersion: 7,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  route: baseUrl,
  foundationGate: 'LR2',
  foundationStatus: 'closed_verified',
  productionLoopClosureStatus: 'closed_verified',
  selectedPilotFireTestClosureStatus: 'closed_verified',
  closedGate: 'LR4',
  activeGate: 'LR5',
  activeTrackingIssue: 82,
  activeWorkPackage: 'LR5.1',
  activeWorkPackageTrackingIssue: 88,
  selectedPilot: 'pilot-das-zimmer',
  productionLoopRestored: true,
  productionLoopCandidatePassed: true,
  selectedPilotFireTestCandidatePassed: true,
  selectedPilotFireTestPassed: true,
  selectedPilotDetailsStatus: 'REVIEW_REQUIRED',
  deleteCountercheckPassed: true,
  deleteRestoreHashMatch: true,
  stationsPassed: 9,
  stateHash: lr3StateHashes[0],
  packageHash: lr3PackageHashes[0],
  selectedPilotStateHash: pilotStateHashes[0],
  selectedPilotPackageHash: pilotPackageHashes[0],
  selectedPilotPanelCount: 8,
  selectedPilotDialogueCueCount: 10,
  selectedPilotCandidateDurationSeconds: 45.5,
  riccoMasterContractStatus: 'CONTRACT_READY_REVIEW_REQUIRED',
  riccoMasterReviewStatus: 'REVIEW_REQUIRED',
  riccoMasterCandidateLimit: 1,
  riccoMasterCandidateSheets: 0,
  riccoMasterImageGenerationAllowedNow: false,
  riccoMasterImageBytesPresent: false,
  riccoMasterExternalExecutionUsed: false,
  riccoMasterApproved: false,
  characterMastersApproved: 0,
  locationMastersApproved: 0,
  voiceMastersApproved: 0,
  imageBytesUsed: false,
  externalExecutionUsed: false,
  creativeApprovalGranted: false,
  generatedAt: new Date().toISOString(),
  targets
};

if (outputDir) await writeFile(`${outputDir}/studio-runtime-evidence.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
