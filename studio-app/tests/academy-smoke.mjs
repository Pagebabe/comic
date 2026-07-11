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
  await page.click('a[href="#academy"]');
  await page.waitForSelector('[data-testid="production-academy"]');
  await page.getByTestId('academy-reset').click();

  const initial = await page.evaluate(() => {
    const text = document.body.textContent || '';
    const stages = [...document.querySelectorAll('.academy-rail button')];
    return {
      stageCount: stages.length,
      disabledCount: stages.filter((stage) => stage.hasAttribute('disabled')).length,
      progressText: document.querySelector('[data-testid="academy-progress"] strong')?.textContent || '',
      trainingModePresent: text.includes('ÜBUNGSMODUS'),
      humanBoundaryPresent: text.includes('Human Gates bleiben REVIEW_REQUIRED'),
      dayPlanPresent: text.includes('Ein Arbeitstag bis zum technischen Übungspaket'),
      rolesPresent: text.includes('Wer entscheidet was?'),
      forbiddenAutoApproval: text.includes('AUTOMATISCH APPROVED') || text.includes('finale Episode automatisch freigegeben'),
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (initial.stageCount !== 12 || initial.disabledCount !== 11 || !initial.progressText.includes('0/12') || !initial.trainingModePresent || !initial.humanBoundaryPresent || !initial.dayPlanPresent || !initial.rolesPresent || initial.forbiddenAutoApproval || initial.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} academy initial smoke failed: ${JSON.stringify(initial)}`);
  }

  await page.getByTestId('academy-advance').click();
  await page.waitForFunction(() => (document.querySelector('[data-testid="academy-progress"] strong')?.textContent || '').includes('1/12'));
  const training = await page.evaluate(() => ({
    firstStatus: document.querySelector('[data-testid="academy-stage-series_brief"]')?.getAttribute('data-status'),
    secondStatus: document.querySelector('[data-testid="academy-stage-series_bible"]')?.getAttribute('data-status'),
    thirdDisabled: document.querySelector('[data-testid="academy-stage-character_masters"]')?.hasAttribute('disabled'),
    activeTitle: document.querySelector('[data-testid="academy-active-stage"] h2')?.textContent || ''
  }));
  if (training.firstStatus !== 'training_complete' || training.secondStatus !== 'in_progress' || !training.thirdDisabled || training.activeTitle !== 'Serien-, Style- und Canon-Bibel') {
    throw new Error(`${target.name} academy training gate smoke failed: ${JSON.stringify(training)}`);
  }

  await page.locator('[data-testid="academy-mode"] button', { hasText: 'Echte Produktion' }).click();
  await page.getByTestId('academy-reset').click();
  await page.locator('[data-testid="academy-mode"] button', { hasText: 'Echte Produktion' }).click();
  await page.getByTestId('academy-advance').click();
  await page.getByTestId('academy-advance').click();
  await page.waitForFunction(() => (document.querySelector('[data-testid="academy-stage-series_bible"]')?.getAttribute('data-status') || '') === 'review_required');

  const production = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem('comic-production-academy-progress-v1') || '{}');
    return {
      mode: stored.mode,
      seriesBrief: stored.stages?.series_brief?.status,
      seriesBible: stored.stages?.series_bible?.status,
      characterStage: stored.stages?.character_masters?.status,
      creativeApproved: Object.values(stored.stages || {}).some((value) => value && typeof value === 'object' && value.status === 'approved'),
      visibleReview: (document.body.textContent || '').includes('HUMAN REVIEW'),
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  if (production.mode !== 'production' || production.seriesBrief !== 'completed' || production.seriesBible !== 'review_required' || production.characterStage !== 'in_progress' || production.creativeApproved || !production.visibleReview || production.horizontalOverflowPixels > 2) {
    throw new Error(`${target.name} academy production gate smoke failed: ${JSON.stringify(production)}`);
  }

  const note = `smoke-${target.name}-resume`;
  await page.locator('.academy-notes textarea').fill(note);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="production-academy"]');
  const resumed = await page.locator('.academy-notes textarea').inputValue();
  if (resumed !== note) throw new Error(`${target.name} academy resume failed: expected ${note}, got ${resumed}`);

  const result = { target, initial, training, production, resumed: true };
  if (outputDir) {
    await mkdir(outputDir, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const screenshotPath = `${outputDir}/academy-${target.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const bytes = await readFile(screenshotPath);
    result.screenshot = `academy-${target.name}.png`;
    result.sha256 = createHash('sha256').update(bytes).digest('hex');
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
  route: `${baseUrl}#academy`,
  trackingIssue: 94,
  stageCount: 12,
  trainingPathPassed: true,
  productionHumanGatesPassed: true,
  resumePassed: true,
  creativeApprovalGranted: false,
  finalEpisodeApprovalGranted: false,
  targets,
  generatedAt: new Date().toISOString()
};

if (outputDir) await writeFile(`${outputDir}/academy-runtime-evidence.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest));
