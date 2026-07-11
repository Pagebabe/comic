import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173/';
const commit = process.env.GITHUB_SHA || 'local';
const outputDir = new URL('../_site/proof/', import.meta.url);
const truth = JSON.parse(await readFile(new URL('../_site/project/truth-state.json', import.meta.url), 'utf8'));
const closure = JSON.parse(await readFile(new URL('../_site/project/evidence-closure.json', import.meta.url), 'utf8'));
const lineResetClosure = JSON.parse(await readFile(new URL('../_site/project/line-reset-closure.json', import.meta.url), 'utf8'));
const decisionPacket = JSON.parse(await readFile(new URL('../_site/project/pilot-decision-packet.json', import.meta.url), 'utf8'));

if (truth.status !== 'recovery_line_active') throw new Error('Recovery line is not active.');
if (truth.nextSequence?.find((item) => item.id === 'LR0')?.status !== 'done') throw new Error('LR0 is not closed.');
if (truth.nextSequence?.find((item) => item.id === 'LR1')?.status !== 'active_human_decision_required') throw new Error('LR1 is not the active decision gate.');
if (truth.canon.status !== 'decision_required' || truth.canon.selectedPilot !== null) throw new Error('Canon decision is not open.');
if (truth.evidence.currentCoveragePercent !== null) throw new Error('Current evidence percentage must be null.');
if (closure.status !== 'historical_bounded_snapshot' || closure.currentCompletenessClaimAllowed !== false) throw new Error('Old closure is not a bounded snapshot.');
if (lineResetClosure.status !== 'closed_verified' || lineResetClosure.mergeCommit !== '47b513c31d5326efdf5bd8c81e835233f97b6b47') throw new Error('LR0 closure proof is invalid.');
if (decisionPacket.status !== 'ready_for_human_decision' || decisionPacket.selectedCandidateId !== null) throw new Error('LR1 decision packet is not ready or selected canon without authority.');
if (decisionPacket.advisoryRecommendation?.candidateId !== 'pilot-das-zimmer' || decisionPacket.advisoryRecommendation?.status !== 'advisory_not_selection') throw new Error('LR1 recommendation is not advisory.');

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const target of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport: { width: target.width, height: target.height } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#evidenceChain .evidence-summary');
  await page.waitForFunction(() => document.body.textContent.includes('LR1') && document.body.textContent.includes('Issue #38'));

  const checks = await page.evaluate(() => {
    const visible = (element) => element
      && getComputedStyle(element).display !== 'none'
      && element.getBoundingClientRect().width > 0
      && element.getBoundingClientRect().height > 0;
    const text = document.body.textContent;
    return {
      coreCards: document.querySelectorAll('.core-card').length,
      visualOpenLabels: [...document.querySelectorAll('.visual-unproven span')]
        .filter((node) => node.textContent.trim() === 'VISUAL OFFEN').length,
      visiblePortraitImages: [...document.querySelectorAll('.core-card .portrait img')].filter(visible).length,
      horizontalOverflowPixels: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      lr0ClosedPresent: text.includes('LR0 TRUTH RESET') && text.includes('PASS'),
      lr1ActivePresent: text.includes('LR1') && text.includes('Issue #38'),
      canonOpenPresent: text.includes('DECISION_REQUIRED') && text.includes('Canon'),
      decisionPacketLinkPresent: text.includes('Pilot Decision Packet') && text.includes('Pilot-Entscheidungsblatt'),
      advisoryBoundaryPresent: text.includes('Empfehlung ohne Auswahl'),
      productionArchivePresent: text.includes('PRODUKTIONSAPP') && text.includes('ARCHIV'),
      partialEvidencePresent: text.includes('PARTIELL') && text.includes('keine Prozentzahl'),
      historicalSnapshotPresent: text.includes('HISTORISCHER SNAPSHOT'),
      closureAuditLinkPresent: text.includes('Closure Audit'),
      oldCurrentClosureClaimPresent: text.includes('PRIORITY 0 · BEWEISKETTE 100% GESCHLOSSEN'),
      finishedEpisodeClaimPresent: text.includes('FERTIGE EPISODE') && text.includes('JA')
    };
  });

  const failed = checks.coreCards !== 4
    || checks.visualOpenLabels !== 4
    || checks.visiblePortraitImages !== 0
    || checks.horizontalOverflowPixels > 2
    || !checks.lr0ClosedPresent
    || !checks.lr1ActivePresent
    || !checks.canonOpenPresent
    || !checks.decisionPacketLinkPresent
    || !checks.advisoryBoundaryPresent
    || !checks.productionArchivePresent
    || !checks.partialEvidencePresent
    || !checks.historicalSnapshotPresent
    || !checks.closureAuditLinkPresent
    || checks.oldCurrentClosureClaimPresent
    || checks.finishedEpisodeClaimPresent;

  if (failed) throw new Error(`${target.name} visual proof failed: ${JSON.stringify(checks)}`);

  const screenshotName = `dashboard-${target.name}.png`;
  const file = new URL(screenshotName, outputDir);
  await page.screenshot({ path: file.pathname, fullPage: true });
  const bytes = await readFile(file);
  results.push({
    ...target,
    checks,
    screenshot: `proof/${screenshotName}`,
    sha256: createHash('sha256').update(bytes).digest('hex')
  });
  await page.close();
}

await browser.close();

const manifest = {
  schemaVersion: 8,
  status: 'pass',
  repository: 'Pagebabe/comic',
  commit,
  generatedAt: new Date().toISOString(),
  truthStatus: truth.status,
  currentAuthority: truth.authority,
  activeGate: 'LR1',
  activeTrackingIssue: 38,
  lr0ClosureStatus: lineResetClosure.status,
  canonStatus: truth.canon.status,
  selectedPilot: truth.canon.selectedPilot,
  decisionPacketStatus: decisionPacket.status,
  advisoryRecommendation: decisionPacket.advisoryRecommendation.candidateId,
  advisoryRecommendationStatus: decisionPacket.advisoryRecommendation.status,
  selectedCandidateId: decisionPacket.selectedCandidateId,
  productionAppStatus: truth.productArchitecture.productionFoundation.status,
  currentEvidenceCoveragePercent: null,
  historicalSnapshot: {
    throughPullRequest: closure.snapshotThroughPullRequest,
    selectedEntries: closure.coverage.trackedEntries,
    oldCoveragePercent: closure.coverage.percent
  },
  targets: results
};

await writeFile(new URL('runtime-evidence.json', outputDir), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
