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
    const seriesUniverse = [...document.querySelectorAll('[data-testid="series-universe-inventory"] .cast-grid article')];
    const activePilotCast = [...document.querySelectorAll('[data-testid="active-pilot-cast-inventory"] .cast-grid article')];
    return {
      currentTask: document.querySelector('[data-testid="cockpit-current-task"] strong')?.textContent || '',
      nextStep: document.querySelector('[data-testid="cockpit-next-step"] h2')?.textContent || '',
      metrics: document.querySelectorAll('.cockpit-metrics article').length,
      workspaces: workspaces.length,
      activeWorkspaces: workspaces.filter((item) => item.getAttribute('data-status') === 'ACTIVE_REVIEW_GATE').length,
      boundaries: boundaries.length,
      boundaryText: boundaries.map((item) => item.textContent || ''),
      seriesUniverse: seriesUniverse.length,
      activePilotCast: activePilotCast.length,
      seriesUniverseText: seriesUniverse.map((item) => item.textContent || ''),
      activePilotCastText: activePilotCast.map((item) => item.textContent || ''),
      hasAcademyLink: Boolean(document.querySelector('a[href="#academy"]')),
      hasRiccoLink: Boolean(document.querySelector('a[href="#lr5-ricco"]')),
      hasExpertLink: Boolean(document.querySelector('a[href="#proof"]')),
      selectedPilotVisible: text.includes('Das Zimmer'),
      countsVisible: text.includes('13') && text.includes('4') && text.includes('9/13') && text.includes('6/13') && text.includes('0/4'),
      scopeBoundaryVisible: text.includes('LEGACY- UND ASSETBESTAND') && text.includes('AKTIVER PILOTCAST'),
      stopRuleVisible: text.includes('nichts automatisch freigeben'),
      noProductionClaim: !text.includes('PRODUCTION READY: JA') && !text.includes('ANFÄNGER-ABNAHME: BESTANDEN'),
      buttons: document.querySelectorAll('button').length,
      images: document.querySelectorAll('img').length,
      canvas: document.querySelectorAll('canvas').length,
      iframe: document.querySelectorAll('iframe').length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  if (
    !checks.currentTask.includes('Aktiven Pilotcast') ||
    checks.nextStep !== 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE' ||
    checks.metrics !== 6 ||
    checks.workspaces !== 6 ||
    checks.activeWorkspaces !== 1 ||
    checks.boundaries !== 6 ||
    checks.seriesUniverse !== 13 ||
    checks.activePilotCast !== 4 ||
    !checks.seriesUniverseText.every((value) => value.includes('SERIENUNIVERSUM')) ||
    !checks.activePilotCastText.some((value) => value.includes('Ricco')) ||
    !checks.boundaryText.every((value) => value.includes('AUS') || value.includes('GETRENNT')) ||
    !checks.hasAcademyLink ||
    !checks.hasRiccoLink ||
    !checks.hasExpertLink ||
    !checks.selectedPilotVisible ||
    !checks.countsVisible ||
    !checks.scopeBoundaryVisible ||
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
  if (focus.section !== 'characters' || !focus.text.includes('Vier Figuren bilden den aktiven Produktionscast') || focus.overflow > 2) throw new Error(`${target.name} cockpit focus failed: ${JSON.stringify(focus)}`);

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
  schemaVersion: 3,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  route: url,
  trackingIssue: 117,
  activeGate: 'LR5.1',
  activeWorkPackage: 88,
  currentTask: 'Aktiven Pilotcast und LR5.1-Nullzustand prüfen',
  nextDecision: 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE',
  seriesUniverseCharacters: 13,
  activePilotCastCharacters: 4,
  legacyAssetInventoryCharacters: 13,
  productionSheetsAvailable: 9,
  loraTrainingSheetsAvailable: 6,
  verifiedReferenceImages: 0,
  approvedVisualMasters: 0,
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
