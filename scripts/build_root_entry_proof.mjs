import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const baseUrl = args.find((value) => !value.startsWith('--')) || 'http://127.0.0.1:4173/';
const outputIndex = args.indexOf('--output');
const outputPath = outputIndex >= 0
  ? resolve(args[outputIndex + 1])
  : new URL('../_site/proof/root-entry/', import.meta.url).pathname;
const commit = process.env.GITHUB_SHA || 'local';
const origin = new URL(baseUrl).origin;
await mkdir(outputPath, { recursive: true });

const browser = await chromium.launch({ headless: true });
const targets = [];
for (const target of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: target.width, height: target.height } });
  const external = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="root-entry"]');
  const checks = await page.evaluate(() => {
    const text = document.body.textContent || '';
    const primary = document.querySelector('[data-testid="root-primary-action"]');
    return {
      title: document.title,
      primaryLabel: primary?.textContent?.trim() || '',
      primaryHref: primary?.getAttribute('href') || '',
      entryCards: document.querySelectorAll('.entry-card').length,
      stateCards: document.querySelectorAll('.state-strip article').length,
      boundaries: document.querySelectorAll('[data-testid="root-boundaries"] > div').length,
      academyLink: Boolean(document.querySelector('a[href="./studio/#academy"]')),
      reviewLink: [...document.querySelectorAll('a[href="./studio/#cockpit"]')].length >= 2,
      auditLink: Boolean(document.querySelector('a[href="./audit.html"]')),
      activeReviewPresent: text.includes('P1-RICCO-001') && text.includes('Issues #153 und #155'),
      staleLr1Copy: text.includes('LR1 PILOTENTSCHEIDUNG')
        || text.includes('Canon DECISION_REQUIRED')
        || text.includes('Pilot menschlich auswählen'),
      zeroState: text.includes('0/1') && text.includes('0/4') && text.includes('0/3') && text.includes('EPISODEN'),
      productionFalse: text.includes('PRODUKTIONSREIFE') && text.includes('NICHT ERREICHT'),
      beginnerFalse: text.includes('ANFÄNGER-ABNAHME') && text.includes('NOCH OFFEN'),
      imageBlocked: text.includes('BILDGENERIERUNG') && text.includes('GESPERRT'),
      growthSeparated: text.includes('GROWTH OS') && text.includes('GETRENNT'),
      scripts: document.querySelectorAll('script').length,
      buttons: document.querySelectorAll('button').length,
      images: document.querySelectorAll('img').length,
      canvas: document.querySelectorAll('canvas').length,
      iframe: document.querySelectorAll('iframe').length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const failed = checks.title !== 'Comic Factory · Produktionsstart'
    || checks.primaryLabel !== 'Produktions-Cockpit öffnen'
    || checks.primaryHref !== './studio/#cockpit'
    || checks.entryCards !== 4
    || checks.stateCards !== 5
    || checks.boundaries !== 4
    || !checks.academyLink
    || !checks.reviewLink
    || !checks.auditLink
    || !checks.activeReviewPresent
    || checks.staleLr1Copy
    || !checks.zeroState
    || !checks.productionFalse
    || !checks.beginnerFalse
    || !checks.imageBlocked
    || !checks.growthSeparated
    || checks.scripts !== 0
    || checks.buttons !== 0
    || checks.images !== 0
    || checks.canvas !== 0
    || checks.iframe !== 0
    || checks.overflow > 2
    || external.length;
  if (failed) {
    throw new Error(`${target.name} root entry failed: ${JSON.stringify({ checks, external })}`);
  }

  const screenshotName = `root-entry-${target.name}.png`;
  const file = resolve(outputPath, screenshotName);
  await page.screenshot({ path: file, fullPage: true });
  const bytes = await readFile(file);
  targets.push({
    ...target,
    checks,
    screenshot: screenshotName,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    externalRequests: external,
  });
  await page.close();
}
await browser.close();

const manifest = {
  schemaVersion: 2,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  route: new URL(baseUrl).toString(),
  trackingIssue: 121,
  parentIssue: 117,
  primaryAction: './studio/#cockpit',
  auditRoute: './audit.html',
  activeReviewIssue: 153,
  localExecutionIssue: 155,
  activeWorkspace: 'review',
  nextDecision: 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED',
  entryCards: 4,
  stateCards: 5,
  boundaries: 4,
  externalRequests: 0,
  scriptCount: 0,
  buttonCount: 0,
  imageCount: 0,
  canvasCount: 0,
  iframeCount: 0,
  riccoCandidates: 0,
  productionReady: false,
  beginnerReady: false,
  imageGenerationAllowed: false,
  growthOsIntegrated: false,
  targets,
  generatedAt: new Date().toISOString(),
};
await writeFile(
  resolve(outputPath, 'root-entry-runtime-evidence.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(JSON.stringify(manifest));
