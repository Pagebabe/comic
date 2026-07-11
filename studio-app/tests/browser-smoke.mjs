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

  const checks = await page.evaluate(() => {
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

  if (!checks.selectedPilotPresent || !checks.lr2ClosedPresent || !checks.lr3ActivePresent || !checks.foundationPresent || !checks.boundaryPresent || checks.forbiddenOpenPilotCopy || checks.forbiddenCompletionClaim || checks.imageCount !== 0 || checks.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} studio smoke failed: ${JSON.stringify(checks)}`);
  }

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

const manifest = {
  schemaVersion: 2,
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
  generatedAt: new Date().toISOString(),
  targets
};

if (outputDir) await writeFile(`${outputDir}/studio-runtime-evidence.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
