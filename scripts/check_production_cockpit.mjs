import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readText = (file) => readFile(path.join(root, file), 'utf8');
const fail = (code, message) => {
  throw new Error(`[PRODUCTION_COCKPIT:${code}] ${message}`);
};

const [contractText, appSource, componentSource, cssSource] = await Promise.all([
  readText('project/production-cockpit-v1.json'),
  readText('studio-app/src/App.tsx'),
  readText('studio-app/src/ProductionCockpit.tsx'),
  readText('studio-app/src/production-cockpit.css')
]);

const contract = JSON.parse(contractText);
const expectedSections = ['characters', 'sets', 'voices', 'episode', 'review', 'export'];

if (contract.schemaVersion !== 1) fail('SCHEMA', 'schemaVersion must be 1');
if (contract.repository !== 'Pagebabe/comic') fail('REPOSITORY', 'repository scope drifted');
if (contract.trackingIssue !== 117) fail('TRACKING_ISSUE', 'tracking issue must be #117');
if (contract.status !== 'WORKING_COCKPIT_V1') fail('STATUS', 'cockpit status must stay WORKING_COCKPIT_V1');
if (contract.route !== '/studio/#cockpit') fail('ROUTE', 'default cockpit route drifted');
if (contract.activeGate?.id !== 'LR5.1' || contract.activeGate?.trackingIssue !== 88) fail('ACTIVE_GATE', 'LR5.1 issue #88 must remain active');
if (contract.currentTask?.primaryHref !== '#lr5-ricco') fail('CURRENT_TASK', 'current task must open Ricco review');
if (contract.nextAllowedStep?.decision !== 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE') fail('DECISION', 'exact one-candidate decision drifted');

const ids = contract.sections?.map((section) => section.id) || [];
if (JSON.stringify(ids) !== JSON.stringify(expectedSections)) fail('SECTIONS', `expected ${expectedSections.join(', ')}`);
if (contract.sections.some((section) => !section.title || !section.summary || !section.blocker || !section.status)) fail('SECTION_CONTENT', 'every section needs title, summary, blocker and status');
if (contract.sections.filter((section) => section.status === 'ACTIVE_REVIEW_GATE').length !== 1) fail('ACTIVE_SECTION_COUNT', 'exactly one active review section is allowed');
if (contract.sections.find((section) => section.id === 'characters')?.status !== 'ACTIVE_REVIEW_GATE') fail('CHARACTER_GATE', 'characters must be the only active review gate');

const counts = contract.counts || {};
const expectedZeroFields = ['characterMastersApproved', 'locationMastersApproved', 'voiceMastersApproved', 'riccoCandidates', 'reviewedEpisodes'];
for (const field of expectedZeroFields) if (counts[field] !== 0) fail('FALSE_PROGRESS', `${field} must remain 0`);
if (counts.characterMastersRequired !== 4 || counts.locationMastersRequired !== 4 || counts.voiceMastersRequired !== 3 || counts.riccoCandidateLimit !== 1) fail('REQUIRED_COUNTS', 'required production counts drifted');

const boundaries = contract.boundaries || {};
for (const [key, value] of Object.entries(boundaries)) if (value !== false) fail('BOUNDARY_OPEN', `${key} must remain false`);

if (!appSource.includes("return 'cockpit';")) fail('DEFAULT_VIEW', 'studio default must resolve to cockpit');
if (!appSource.includes("loadJson<ProductionCockpitContract>('../project/production-cockpit-v1.json')")) fail('CONTRACT_LOAD', 'App must load cockpit contract');
if (!appSource.includes('<ProductionCockpit contract={cockpit}')) fail('COCKPIT_RENDER', 'App must render ProductionCockpit');
if (!appSource.includes('Expertenbereich')) fail('EXPERT_AREA', 'proof navigation must remain available');
if (!componentSource.includes('data-testid="production-cockpit"')) fail('TEST_ID', 'cockpit test id missing');
if (!componentSource.includes('data-testid="cockpit-current-task"')) fail('CURRENT_TASK_UI', 'current task must be visible');
if (!componentSource.includes('data-testid="cockpit-next-step"')) fail('NEXT_STEP_UI', 'next step must be visible');
if (!componentSource.includes('data-testid="cockpit-boundaries"')) fail('BOUNDARY_UI', 'boundaries must be visible');
if ((componentSource.match(/<button/g) || []).length !== 0) fail('EXECUTION_CONTROL', 'cockpit V1 may not contain executable buttons');
if (/<img|<canvas|<iframe/i.test(componentSource)) fail('MEDIA_SURFACE', 'cockpit V1 may not contain images, canvas or iframes');
if (!cssSource.includes('@media (max-width: 640px)')) fail('MOBILE_CSS', 'mobile breakpoint missing');

const report = {
  schemaVersion: 1,
  status: 'pass',
  repository: contract.repository,
  trackingIssue: contract.trackingIssue,
  route: contract.route,
  activeGate: contract.activeGate,
  currentTask: contract.currentTask.title,
  nextDecision: contract.nextAllowedStep.decision,
  sections: ids,
  counts,
  boundaries,
  executableButtons: 0,
  mediaSurfaces: 0,
  generatedAt: new Date().toISOString()
};

await mkdir(path.join(root, 'output/production-cockpit'), { recursive: true });
await writeFile(path.join(root, 'output/production-cockpit/check.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
