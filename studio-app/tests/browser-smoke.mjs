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
      lr2ClosedPresent: text.includes('LR2 GESCHLOSSEN') && text.includes('PUBLIC BUILD PROVEN'),
      lr3ActivePresent: text.includes('LR3') && text.includes('Issue #60'),
      foundationPresent: text.includes('Studio Foundation') && text.includes('FOUNDATION PUBLICLY VERIFIED'),
      boundaryPresent: text.includes('Produktionsloop noch nicht gerettet') && text.includes('Produktionsloop bleibt offen'),
      forbiddenOpenPilotCopy: text.includes('DECISION_REQUIRED') || text.includes('Pilot-Canon ist nicht ausgewählt'),
      forbiddenCompletionClaim: text.includes('Produktionsloop vollständig gerettet') || text.includes('Episode fertig'),
      imageCount: document.querySelectorAll('img').length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (!foundationChecks.selectedPilotPresent || !foundationChecks.lr2ClosedPresent || !foundationChecks.lr3ActivePresent || !foundationChecks.foundationPresent || !foundationChecks.boundaryPresent || foundationChecks.forbiddenOpenPilotCopy || foundationChecks.forbiddenCompletionClaim || foundationChecks.imageCount !== 0 || foundationChecks.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} studio foundation smoke failed: ${JSON.stringify(foundationChecks)}`);
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
  await page.getByTestId('loop-restore').click();
  await page.waitForFunction(() => (document.querySelector('[data-testid="restore-status"]')?.textContent || '').includes('HASH MATCH'));

  const loopChecks = await page.evaluate(() => {
    const text = document.body.textContent || '';
    const stations = [...document.querySelectorAll('.loop-stations article')];
    const codes = [...document.querySelectorAll('[data-testid="loop-hashes"] code')].map((node) => node.textContent?.trim() || '');
    const packageText = (document.querySelector('.package-preview textarea') as HTMLTextAreaElement | null)?.value || '';
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
    throw new Error(`${target.name} LR3 loop smoke failed: ${JSON.stringify(loopChecks)}`);
  }

  const checks = { ...foundationChecks, ...loopChecks };
  const result = { ...target, checks };
  if (outputDir) {
    await mkdir(outputDir, { recursive: true });
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
  schemaVersion: 3,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  route: baseUrl,
  foundationGate: 'LR2',
  foundationStatus: 'closed_verified',
  activeGate: 'LR3',
  activeTrackingIssue: 60,
  selectedPilot: 'pilot-das-zimmer',
  productionLoopRestored: false,
  productionLoopCandidatePassed: true,
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
