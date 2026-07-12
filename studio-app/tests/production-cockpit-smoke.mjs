import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const baseUrl = args.find((value) => !value.startsWith('--')) || 'http://127.0.0.1:4174/studio/';
const outputIndex = args.indexOf('--output');
const output = outputIndex >= 0 ? args[outputIndex + 1] : null;
const commit = process.env.GITHUB_SHA || 'local';
const url = new URL('#cockpit', baseUrl).toString();
const origin = new URL(baseUrl).origin;

const browser = await chromium.launch({ headless: true });
const targets = [];

for (const target of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: { width: target.width, height: target.height } });
  const external = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) external.push(request.url());
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="production-cockpit"]');

  const checks = await page.evaluate(() => {
    const text = document.body.textContent || '';
    const workspaces = [...document.querySelectorAll('[data-testid="cockpit-workspaces"] article')];
    const boundaries = [...document.querySelectorAll('[data-testid="cockpit-boundaries"] li')];
    const activeCast = [...document.querySelectorAll('[data-testid="cast-canon-inventory"] .cast-grid article')];
    const variants = [...document.querySelectorAll('[data-testid="variant-cast-inventory"] li')];
    return {
      currentTask: document.querySelector('[data-testid="cockpit-current-task"] strong')?.textContent || '',
      nextStep: document.querySelector('[data-testid="cockpit-next-step"] h2')?.textContent || '',
      metrics: document.querySelectorAll('.cockpit-metrics article').length,
      workspaces: workspaces.length,
      activeWorkspaces: workspaces.filter((item) => item.getAttribute('data-status') === 'ACTIVE_REVIEW_GATE').length,
      boundaries: boundaries.length,
      boundaryText: boundaries.map((item) => item.textContent || ''),
      activeCast: activeCast.length,
      variants: variants.length,
      activeCastText: activeCast.map((item) => item.textContent || ''),
      variantText: variants.map((item) => item.textContent || ''),
      hasAcademyLink: Boolean(document.querySelector('a[href="#academy"]')),
      hasVariantLink: Boolean(document.querySelector('a[href="#lr5-ricco"]')),
      hasExpertLink: Boolean(document.querySelector('a[href="#proof"]')),
      selectedPilotVisible: text.includes('Das Zimmer'),
      countsVisible: text.includes('13') && text.includes('9/13') && text.includes('6/13') && text.includes('0/13'),
      variantBoundaryVisible: text.includes('Pilotvariante, nicht Hauptkanon'),
      stopRuleVisible: text.includes('Bestand dokumentieren, nichts automatisch umdeuten'),
      noProductionClaim: !text.includes('PRODUCTION READY: JA') && !text.includes('ANFÄNGER-ABNAHME: BESTANDEN'),
      buttons: document.querySelectorAll('button').length,
      images: document.querySelectorAll('img').length,
      canvas: document.querySelectorAll('canvas').length,
      iframe: document.querySelectorAll('iframe').length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (
    !checks.currentTask.includes('Asset-Lücken') ||
    checks.nextStep !== 'VERIFY_MISSING_CAST_ASSETS' ||
    checks.metrics !== 6 ||
    checks.workspaces !== 6 ||
    checks.activeWorkspaces !== 1 ||
    checks.boundaries !== 6 ||
    checks.activeCast !== 13 ||
    checks.variants !== 4 ||
    !checks.activeCastText.every((value) => value.includes('HAUPTKANON')) ||
    !checks.variantText.some((value) => value.includes('Ricco')) ||
    !checks.boundaryText.every((value) => value.includes('AUS') || value.includes('GETRENNT')) ||
    !checks.hasAcademyLink ||
    !checks.hasVariantLink ||
    !checks.hasExpertLink ||
    !checks.selectedPilotVisible ||
    !checks.countsVisible ||
    !checks.variantBoundaryVisible ||
    !checks.stopRuleVisible ||
    !checks.noProductionClaim ||
    checks.buttons !== 0 ||
    checks.images !== 0 ||
    checks.canvas !== 0 ||
    checks.iframe !== 0 ||
    checks.overflow > 2 ||
    external.length
  ) throw new Error(`${target.name} cockpit failed: ${JSON.stringify({ checks, external })}`);

  await page.getByRole('link', { name: 'Figuren' }).first().click();
  await page.waitForSelector('[data-testid="cockpit-focused-section"]');
  const focus = await page.evaluate(() => ({
    section: document.querySelector('[data-testid="production-cockpit"]')?.getAttribute('data-active-section'),
    text: document.querySelector('[data-testid="cockpit-focused-section"]')?.textContent || '',
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  if (focus.section !== 'characters' || !focus.text.includes('13 Figuren bilden den bestätigten Hauptkanon') || focus.overflow > 2) throw new Error(`${target.name} cockpit focus failed: ${JSON.stringify(focus)}`);

  const result = { ...target, checks, focus, externalRequests: external };
  if (output) {
    await mkdir(output, { recursive: true });
    await page.goto(url, { waitUntil: 'networkidle' });
    const screenshot = `${output}/production-cockpit-${target.name}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    const bytes = await readFile(screenshot);
    Object.assign(result, { screenshot: `production-cockpit-${target.name}.png`, sha256: createHash('sha256').update(bytes).digest('hex') });
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
  route: url,
  trackingIssue: 117,
  activeGate: 'CANON-LOCK',
  activeWorkPackage: 117,
  currentTask: 'Asset-Lücken des Hauptcasts prüfen',
  nextDecision: 'VERIFY_MISSING_CAST_ASSETS',
  activeCanonCharacters: 13,
  variantCharacters: 4,
  productionSheetsAvailable: 9,
  loraTrainingSheetsAvailable: 6,
  trustedVisualMasters: 0,
  workspaceCount: 6,
  executableButtons: 0,
  externalRequests: 0,
  imageCount: 0,
  canvasCount: 0,
  iframeCount: 0,
  imageGenerationAllowed: false,
  creativeApprovalGranted: false,
  productionReady: false,
  beginnerReady: false,
  growthOsIntegrated: false,
  targets,
  generatedAt: new Date().toISOString()
};
if (output) await writeFile(`${output}/production-cockpit-runtime-evidence.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest));
