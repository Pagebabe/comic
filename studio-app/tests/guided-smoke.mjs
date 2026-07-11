import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const baseUrl = args.find((item) => !item.startsWith('--')) || 'http://127.0.0.1:4174/studio/';
const outputIndex = args.indexOf('--output');
const outputDir = outputIndex >= 0 ? args[outputIndex + 1] : null;
const commit = process.env.GITHUB_SHA || 'local';
const guidedUrl = new URL('#guided', baseUrl).toString();
const allowedOrigin = new URL(baseUrl).origin;

const browser = await chromium.launch({ headless: true });
const targets = [];

for (const target of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport: { width: target.width, height: target.height } });
  const externalRequests = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== allowedOrigin) externalRequests.push(request.url());
  });

  await page.goto(guidedUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="guided-mode"]');

  const initial = await page.evaluate(() => {
    const text = document.body.textContent || '';
    return {
      guidedPresent: Boolean(document.querySelector('[data-testid="guided-mode"]')),
      readinessPresent: Boolean(document.querySelector('[data-testid="guided-readiness"]')),
      chapterButtons: document.querySelectorAll('[data-chapter]').length,
      readinessGates: document.querySelectorAll('[data-testid="readiness-gates"] .readiness-grid article').length,
      acceptanceQuestions: document.querySelectorAll('[data-testid="novice-acceptance"] ol li').length,
      concepts: document.querySelectorAll('.concept-grid article').length,
      stepButtons: document.querySelectorAll('.step-check').length,
      scorePresent: text.includes('2/10 CLOSED_VERIFIED · 6 PARTIAL · 2 OPEN'),
      notProductionReady: text.includes('NOT_PRODUCTION_READY') && text.includes('PRODUCTION READY') && text.includes('NEIN'),
      boundariesPresent: text.includes('BILDGENERIERUNG') && text.includes('GESPERRT') && text.includes('CREATIVE APPROVAL') && text.includes('GROWTH OS') && text.includes('GETRENNT'),
      humanObservationPresent: text.includes('menschliche Beobachtung erforderlich') && text.includes('Selbst angeklickter Fortschritt schließt kein Readiness-Gate'),
      imageCount: document.querySelectorAll('img').length,
      canvasCount: document.querySelectorAll('canvas').length,
      videoCount: document.querySelectorAll('video').length,
      iframeCount: document.querySelectorAll('iframe').length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      progressText: document.querySelector('[data-testid="guided-readiness"] small')?.textContent || '',
      storage: window.localStorage.getItem('comic-ops1-guided-progress-v1')
    };
  });

  if (!initial.guidedPresent || !initial.readinessPresent || initial.chapterButtons !== 5 || initial.readinessGates !== 10 || initial.acceptanceQuestions !== 12 || initial.concepts !== 5 || initial.stepButtons !== 3 || !initial.scorePresent || !initial.notProductionReady || !initial.boundariesPresent || !initial.humanObservationPresent || initial.imageCount !== 0 || initial.canvasCount !== 0 || initial.videoCount !== 0 || initial.iframeCount !== 0 || initial.horizontalOverflowPixels > 2 || !initial.progressText.includes('0/5') || initial.storage !== null || externalRequests.length !== 0) {
    throw new Error(`${target.name} Guided initial proof failed: ${JSON.stringify({ initial, externalRequests })}`);
  }

  const firstChapterButtons = page.locator('.step-check');
  await firstChapterButtons.nth(0).click();
  await firstChapterButtons.nth(1).click();
  await firstChapterButtons.nth(2).click();

  const progressed = await page.evaluate(() => {
    const raw = window.localStorage.getItem('comic-ops1-guided-progress-v1');
    return {
      saved: raw ? JSON.parse(raw) : [],
      progressText: document.querySelector('[data-testid="guided-readiness"] small')?.textContent || '',
      doneSteps: document.querySelectorAll('.guided-steps article[data-status="done"]').length
    };
  });

  if (progressed.saved.length !== 3 || progressed.doneSteps !== 3 || !progressed.progressText.includes('1/5')) {
    throw new Error(`${target.name} Guided progress proof failed: ${JSON.stringify(progressed)}`);
  }

  for (const chapterId of ['setup', 'masters', 'episode', 'qa']) {
    await page.locator(`[data-chapter="${chapterId}"]`).click();
    await page.waitForFunction((id) => document.querySelector(`[data-chapter="${id}"]`)?.classList.contains('active'), chapterId);
  }

  await page.getByTestId('guided-reset').click();
  const reset = await page.evaluate(() => ({
    storage: window.localStorage.getItem('comic-ops1-guided-progress-v1'),
    doneSteps: document.querySelectorAll('.guided-steps article[data-status="done"]').length,
    progressText: document.querySelector('[data-testid="guided-readiness"] small')?.textContent || '',
    imageCount: document.querySelectorAll('img').length,
    canvasCount: document.querySelectorAll('canvas').length,
    horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));

  if (reset.storage !== null || reset.doneSteps !== 0 || !reset.progressText.includes('0/5') || reset.imageCount !== 0 || reset.canvasCount !== 0 || reset.horizontalOverflowPixels > 2 || externalRequests.length !== 0) {
    throw new Error(`${target.name} Guided reset proof failed: ${JSON.stringify({ reset, externalRequests })}`);
  }

  const result = { ...target, initial, progressed, reset, externalRequests };

  if (outputDir) {
    await mkdir(outputDir, { recursive: true });
    await page.goto(guidedUrl, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="guided-mode"]');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const screenshotPath = `${outputDir}/guided-${target.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const bytes = await readFile(screenshotPath);
    Object.assign(result, {
      screenshot: `guided-${target.name}.png`,
      sha256: createHash('sha256').update(bytes).digest('hex')
    });
  }

  targets.push(result);
  await page.close();
}

await browser.close();

const manifest = {
  schemaVersion: 1,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  route: guidedUrl,
  workstream: 'OPS1',
  trackingIssue: 95,
  guideStatus: 'GUIDE_READY_FOR_PUBLIC_ACCEPTANCE',
  readinessStatus: 'NOT_PRODUCTION_READY',
  readinessScore: '2/10 CLOSED_VERIFIED · 6 PARTIAL · 2 OPEN',
  chapters: 5,
  steps: 18,
  concepts: 5,
  readinessGates: 10,
  acceptanceQuestions: 12,
  progressStorageOnly: true,
  resetPassed: true,
  productionReady: false,
  beginnerReady: false,
  imageGenerationAllowed: false,
  creativeApprovalGranted: false,
  growthOsIntegrated: false,
  externalRequests: 0,
  imageCount: 0,
  canvasCount: 0,
  generatedAt: new Date().toISOString(),
  targets
};

if (outputDir) await writeFile(`${outputDir}/guided-runtime-evidence.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));