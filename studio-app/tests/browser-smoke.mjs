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
      lr3ClosedPresent: text.includes('LR3 GESCHLOSSEN') && text.includes('LR3 PUBLICLY VERIFIED') && text.includes('DELETE + RESTORE PASS'),
      lr4ActivePresent: text.includes('LR4') && text.includes('Issue #76'),
      foundationPresent: text.includes('Production Studio') && text.includes('FOUNDATION'),
      boundaryPresent: text.includes('Selected-Pilot-Fire-Test') && text.includes('noch offen'),
      forbiddenOpenPilotCopy: text.includes('DECISION_REQUIRED') || text.includes('Pilot-Canon ist nicht ausgewählt'),
      forbiddenCompletionClaim: text.includes('Selected-Pilot-Fire-Test bestanden') || text.includes('Episode fertig'),
      imageCount: document.querySelectorAll('img').length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (!foundationChecks.selectedPilotPresent || !foundationChecks.lr3ClosedPresent || !foundationChecks.lr4ActivePresent || !foundationChecks.foundationPresent || !foundationChecks.boundaryPresent || foundationChecks.forbiddenOpenPilotCopy || foundationChecks.forbiddenCompletionClaim || foundationChecks.imageCount !== 0 || foundationChecks.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} Studio LR3-closure smoke failed: ${JSON.stringify(foundationChecks)}`);
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

  const deletionChecks = await page.evaluate(() => ({
    stateRemoved: window.localStorage.getItem('comic-lr3-neutral-loop-v1') === null,
    packageRetained: Boolean(window.localStorage.getItem('comic-lr3-neutral-package-v1')),
    restoreEnabled: (() => {
      const button = document.querySelector('[data-testid="loop-restore"]');
      return button instanceof HTMLButtonElement && !button.disabled;
    })()
  }));
  if (!deletionChecks.stateRemoved || !deletionChecks.packageRetained || !deletionChecks.restoreEnabled) {
    throw new Error(`${target.name} LR3 deletion countercheck failed: ${JSON.stringify(deletionChecks)}`);
  }

  await page.getByTestId('loop-restore').click();
  await page.waitForFunction(() => (document.querySelector('[data-testid="restore-status"]')?.textContent || '').includes('HASH MATCH'));

  const loopChecks = await page.evaluate(() => {
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

  if (loopChecks.stationCount !== 9 || loopChecks.passedStationCount !== 9 || !loopChecks.deleteRestorePassPresent || !loopChecks.hashMatchPresent || !loopChecks.packageHash || !loopChecks.stateHashBeforeDelete || loopChecks.stateHashBeforeDelete !== loopChecks.stateHashAfterRestore || !loopChecks.packageContractPresent || !loopChecks.technicalBoundaryPresent || loopChecks.forbiddenCreativeApproval || loopChecks.imageCount !== 0 || loopChecks.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} LR3 loop regression smoke failed: ${JSON.stringify(loopChecks)}`);
  }

  const checks = { ...foundationChecks, ...deletionChecks, ...loopChecks };
  const result = { ...target, checks };
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

const stateHashes = [...new Set(targets.map((target) => target.checks.stateHashAfterRestore))];
const packageHashes = [...new Set(targets.map((target) => target.checks.packageHash))];
if (stateHashes.length !== 1 || packageHashes.length !== 1) throw new Error('Desktop and mobile produced different deterministic LR3 hashes.');

const manifest = {
  schemaVersion: 4,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  route: baseUrl,
  foundationGate: 'LR2',
  foundationStatus: 'closed_verified',
  closedGate: 'LR3',
  productionLoopClosureStatus: 'closed_verified',
  activeGate: 'LR4',
  activeTrackingIssue: 76,
  selectedPilot: 'pilot-das-zimmer',
  productionLoopRestored: true,
  productionLoopCandidatePassed: true,
  selectedPilotFireTestPassed: false,
  deleteCountercheckPassed: true,
  deleteRestoreHashMatch: true,
  stationsPassed: 9,
  stateHash: stateHashes[0],
  packageHash: packageHashes[0],
  imageBytesUsed: false,
  externalExecutionUsed: false,
  creativeApprovalGranted: false,
  generatedAt: new Date().toISOString(),
  targets
};

if (outputDir) await writeFile(`${outputDir}/studio-runtime-evidence.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
