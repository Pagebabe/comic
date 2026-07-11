import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const baseUrl = args.find((item) => !item.startsWith('--')) || 'http://127.0.0.1:4174/studio/';
const outputIndex = args.indexOf('--output');
const outputDir = outputIndex >= 0 ? args[outputIndex + 1] : null;
const commit = process.env.GITHUB_SHA || 'local';
const academyUrl = new URL('#academy', baseUrl).toString();
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

  await page.goto(academyUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="production-academy"]');
  await page.waitForSelector('[data-testid="academy-readiness"]');
  await page.getByTestId('academy-reset').click();

  const checks = await page.evaluate(() => {
    const text = document.body.textContent || '';
    const gateCards = [...document.querySelectorAll('[data-testid="academy-readiness-gates"] article')];
    const boundaryCards = [...document.querySelectorAll('.academy-boundary-cards article')];
    return {
      academyPresent: Boolean(document.querySelector('[data-testid="production-academy"]')),
      readinessPresent: Boolean(document.querySelector('[data-testid="academy-readiness"]')),
      academyStages: document.querySelectorAll('.academy-rail button').length,
      academyProgress: document.querySelector('[data-testid="academy-progress"] strong')?.textContent || '',
      scoreText: document.querySelector('[data-testid="academy-readiness-score"] strong')?.textContent || '',
      gateCount: gateCards.length,
      closedGateCount: gateCards.filter((card) => card.getAttribute('data-status') === 'CLOSED_VERIFIED').length,
      partialGateCount: gateCards.filter((card) => card.getAttribute('data-status') === 'PARTIAL').length,
      openGateCount: gateCards.filter((card) => card.getAttribute('data-status') === 'OPEN').length,
      acceptanceTasks: document.querySelectorAll('[data-testid="academy-novice-acceptance"] ol li').length,
      acceptanceStatusPresent: text.includes('TEMPLATE_NOT_EXECUTED'),
      humanObservationPresent: text.includes('Eine echte beobachtende Person ist Pflicht: ja'),
      productionReadyFalse: boundaryCards.some((card) => card.textContent?.includes('PRODUCTION READY') && card.textContent?.includes('NEIN')),
      beginnerReadyFalse: boundaryCards.some((card) => card.textContent?.includes('BEGINNER READY') && card.textContent?.includes('NOCH NICHT')),
      imageGenerationBlocked: boundaryCards.some((card) => card.textContent?.includes('BILDGENERIERUNG') && card.textContent?.includes('GESPERRT')),
      creativeApprovalFalse: boundaryCards.some((card) => card.textContent?.includes('CREATIVE APPROVAL') && card.textContent?.includes('NEIN')),
      growthSeparated: boundaryCards.some((card) => card.textContent?.includes('GROWTH OS') && card.textContent?.includes('GETRENNT')),
      growthSmokeOpen: text.includes('gemeinsamer Integrations-Smoke: offen'),
      tenOfTenRulePresent: text.includes('10/10 erst bei zehnmal CLOSED_VERIFIED'),
      staleBeginnerClaimPresent: text.includes('anfängerbedienbar') || text.includes('BEGINNER READY: JA'),
      staleProductionClaimPresent: text.includes('PRODUCTION READY: JA') || text.includes('10/10 PRODUCTION_READY'),
      imageCount: document.querySelectorAll('img').length,
      canvasCount: document.querySelectorAll('canvas').length,
      iframeCount: document.querySelectorAll('iframe').length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      academyStorage: window.localStorage.getItem('comic-production-academy-progress-v1')
    };
  });

  if (!checks.academyPresent || !checks.readinessPresent || checks.academyStages !== 12 || !checks.academyProgress.includes('0/12') || checks.scoreText !== '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN' || checks.gateCount !== 10 || checks.closedGateCount !== 2 || checks.partialGateCount !== 7 || checks.openGateCount !== 1 || checks.acceptanceTasks !== 12 || !checks.acceptanceStatusPresent || !checks.humanObservationPresent || !checks.productionReadyFalse || !checks.beginnerReadyFalse || !checks.imageGenerationBlocked || !checks.creativeApprovalFalse || !checks.growthSeparated || !checks.growthSmokeOpen || !checks.tenOfTenRulePresent || checks.staleBeginnerClaimPresent || checks.staleProductionClaimPresent || checks.imageCount !== 0 || checks.canvasCount !== 0 || checks.iframeCount !== 0 || checks.horizontalOverflowPixels > 2 || externalRequests.length !== 0) {
    throw new Error(`${target.name} Academy readiness smoke failed: ${JSON.stringify({ checks, externalRequests })}`);
  }

  await page.getByTestId('academy-advance').click();
  await page.waitForFunction(() => (document.querySelector('[data-testid="academy-progress"] strong')?.textContent || '').includes('1/12'));
  const trainingBoundary = await page.evaluate(() => ({
    firstStatus: document.querySelector('[data-testid="academy-stage-series_brief"]')?.getAttribute('data-status'),
    creativeApproved: JSON.parse(window.localStorage.getItem('comic-production-academy-progress-v1') || '{}')?.stages?.series_bible?.status === 'approved',
    readinessScore: document.querySelector('[data-testid="academy-readiness-score"] strong')?.textContent || ''
  }));
  if (trainingBoundary.firstStatus !== 'training_complete' || trainingBoundary.creativeApproved || trainingBoundary.readinessScore !== '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN') {
    throw new Error(`${target.name} training/readiness boundary drifted: ${JSON.stringify(trainingBoundary)}`);
  }

  await page.getByTestId('academy-reset').click();
  const reset = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem('comic-production-academy-progress-v1') || '{}');
    return {
      completed: Object.values(stored.stages || {}).filter((stage) => stage && typeof stage === 'object' && ['training_complete', 'completed', 'review_required', 'approved'].includes(stage.status)).length,
      activeStage: stored.activeStageId,
      mode: stored.mode,
      productionReadyText: document.querySelector('[data-testid="academy-readiness-score"] span')?.textContent || '',
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  if (reset.completed !== 0 || reset.activeStage !== 'series_brief' || reset.mode !== 'training' || reset.productionReadyText !== 'NOT_PRODUCTION_READY' || reset.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} readiness reset failed: ${JSON.stringify(reset)}`);
  }

  const result = { ...target, checks, trainingBoundary, reset, externalRequests };
  if (outputDir) {
    await mkdir(outputDir, { recursive: true });
    await page.evaluate(() => document.querySelector('[data-testid="academy-readiness"]')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(150);
    const screenshotPath = `${outputDir}/academy-readiness-${target.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const bytes = await readFile(screenshotPath);
    Object.assign(result, {
      screenshot: `academy-readiness-${target.name}.png`,
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
  route: academyUrl,
  trackingIssue: 95,
  academyTrackingIssue: 94,
  academyStatus: 'PROVEN_GUIDED_TRAINING_READY_NOVICE_ACCEPTANCE_OPEN',
  readinessStatus: 'NOT_PRODUCTION_READY',
  readinessScore: '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN',
  stages: 12,
  readinessGates: 10,
  noviceTasks: 12,
  trainingBoundaryPassed: true,
  resetPassed: true,
  productionReady: false,
  beginnerReady: false,
  observedNoviceRunPassed: false,
  completeReviewedEpisodeExists: false,
  imageGenerationAllowed: false,
  creativeApprovalGranted: false,
  growthOsIntegrated: false,
  sharedGrowthIntegrationSmokePassed: false,
  externalRequests: 0,
  imageCount: 0,
  canvasCount: 0,
  targets,
  generatedAt: new Date().toISOString()
};

if (outputDir) await writeFile(`${outputDir}/academy-readiness-runtime-evidence.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest));