import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readText = (file) => readFile(path.join(root, file), 'utf8');
const fail = (code, message) => {
  throw new Error(`[PRODUCTION_COCKPIT:${code}] ${message}`);
};

const [contractText, castCanonText, appSource, componentSource, cssSource] = await Promise.all([
  readText('project/production-cockpit-v1.json'),
  readText('project/cast-canon-v1.json'),
  readText('studio-app/src/App.tsx'),
  readText('studio-app/src/ProductionCockpit.tsx'),
  readText('studio-app/src/production-cockpit.css')
]);

const contract = JSON.parse(contractText);
const castCanon = JSON.parse(castCanonText);
const expectedSections = ['characters', 'sets', 'voices', 'episode', 'review', 'export'];

if (contract.schemaVersion !== 1) fail('SCHEMA', 'schemaVersion must be 1');
if (contract.repository !== 'Pagebabe/comic') fail('REPOSITORY', 'repository scope drifted');
if (contract.trackingIssue !== 117) fail('TRACKING_ISSUE', 'tracking issue must be #117');
if (contract.status !== 'WORKING_COCKPIT_V1') fail('STATUS', 'cockpit status must stay WORKING_COCKPIT_V1');
if (contract.route !== '/studio/#cockpit') fail('ROUTE', 'default cockpit route drifted');
if (contract.activeGate?.id !== 'CANON-LOCK' || contract.activeGate?.trackingIssue !== 117) fail('ACTIVE_GATE', 'canon lock issue #117 must remain active');
if (contract.currentTask?.primaryHref !== '#characters') fail('CURRENT_TASK', 'current task must open cast inventory');
if (contract.nextAllowedStep?.decision !== 'VERIFY_MISSING_CAST_ASSETS') fail('DECISION', 'next decision must verify missing cast assets');

const ids = contract.sections?.map((section) => section.id) || [];
if (JSON.stringify(ids) !== JSON.stringify(expectedSections)) fail('SECTIONS', `expected ${expectedSections.join(', ')}`);
if (contract.sections.some((section) => !section.title || !section.summary || !section.blocker || !section.status)) fail('SECTION_CONTENT', 'every section needs title, summary, blocker and status');
if (contract.sections.filter((section) => section.status === 'ACTIVE_REVIEW_GATE').length !== 1) fail('ACTIVE_SECTION_COUNT', 'exactly one active review section is allowed');
if (contract.sections.find((section) => section.id === 'characters')?.status !== 'ACTIVE_REVIEW_GATE') fail('CHARACTER_GATE', 'characters must be the only active review gate');

const counts = contract.counts || {};
const expectedZeroFields = ['characterMastersApproved', 'locationMastersApproved', 'voiceMastersApproved', 'riccoCandidates', 'reviewedEpisodes', 'trustedVisualMasters'];
for (const field of expectedZeroFields) if (counts[field] !== 0) fail('FALSE_PROGRESS', `${field} must remain 0`);
if (counts.activeCanonCharacters !== 13) fail('ACTIVE_CAST_COUNT', 'active canon count must be 13');
if (counts.variantCharacters !== 4) fail('VARIANT_COUNT', 'variant count must be 4');
if (counts.productionSheetsAvailable !== 9 || counts.productionSheetsMissing !== 4) fail('PRODUCTION_SHEETS', 'production sheet counts must be 9 available and 4 missing');
if (counts.loraTrainingSheetsAvailable !== 6 || counts.loraTrainingSheetsMissing !== 7) fail('LORA_SHEETS', 'LoRA sheet counts must be 6 available and 7 missing');
if (counts.characterMastersRequired !== 13 || counts.locationMastersRequired !== 4 || counts.voiceMastersRequired !== 3 || counts.riccoCandidateLimit !== 1) fail('REQUIRED_COUNTS', 'required production counts drifted');
if (counts.activeCanonCharacters !== castCanon.counts.activeCanonCharacters) fail('CANON_ACTIVE_MISMATCH', 'dashboard active count contradicts cast canon');
if (counts.variantCharacters !== castCanon.counts.variantCharacters) fail('CANON_VARIANT_MISMATCH', 'dashboard variant count contradicts cast canon');
if (counts.productionSheetsAvailable !== castCanon.counts.productionSheetsAvailable) fail('CANON_PRODUCTION_MISMATCH', 'dashboard production sheet count contradicts cast canon');
if (counts.loraTrainingSheetsAvailable !== castCanon.counts.loraTrainingSheetsAvailable) fail('CANON_LORA_MISMATCH', 'dashboard LoRA count contradicts cast canon');

const boundaries = contract.boundaries || {};
for (const [key, value] of Object.entries(boundaries)) if (value !== false) fail('BOUNDARY_OPEN', `${key} must remain false`);

if (!appSource.includes("return 'cockpit';")) fail('DEFAULT_VIEW', 'studio default must resolve to cockpit');
if (!appSource.includes("loadJson<ProductionCockpitContract>('../project/production-cockpit-v1.json')")) fail('CONTRACT_LOAD', 'App must load cockpit contract');
if (!appSource.includes("loadJson<CastCanonContract>('../project/cast-canon-v1.json')")) fail('CAST_CANON_LOAD', 'App must load cast canon contract');
if (!appSource.includes('<ProductionCockpit contract={cockpit} castCanon={castCanon}')) fail('COCKPIT_RENDER', 'App must render ProductionCockpit with cast canon');
if (!appSource.includes('Pilotvariante Ricco')) fail('VARIANT_NAV', 'pilot variant navigation must be explicit');
if (!appSource.includes('Expertenbereich')) fail('EXPERT_AREA', 'proof navigation must remain available');
if (!componentSource.includes('data-testid="production-cockpit"')) fail('TEST_ID', 'cockpit test id missing');
if (!componentSource.includes('data-testid="cast-canon-inventory"')) fail('CAST_UI', 'cast inventory must be visible');
if (!componentSource.includes('data-testid="variant-cast-inventory"')) fail('VARIANT_UI', 'variant inventory must be visible');
if (!componentSource.includes('data-testid="cockpit-current-task"')) fail('CURRENT_TASK_UI', 'current task must be visible');
if (!componentSource.includes('data-testid="cockpit-next-step"')) fail('NEXT_STEP_UI', 'next step must be visible');
if (!componentSource.includes('data-testid="cockpit-boundaries"')) fail('BOUNDARY_UI', 'boundaries must be visible');
if ((componentSource.match(/<button/g) || []).length !== 0) fail('EXECUTION_CONTROL', 'cockpit V1 may not contain executable buttons');
if (/<img|<canvas|<iframe/i.test(componentSource)) fail('MEDIA_SURFACE', 'cockpit V1 may not contain images, canvas or iframes');
if (!cssSource.includes('.cast-grid') || !cssSource.includes('.variant-strip')) fail('CAST_CSS', 'cast and variant styles missing');
if (!cssSource.includes('@media (max-width: 640px)')) fail('MOBILE_CSS', 'mobile breakpoint missing');

const report = {
  schemaVersion: 2,
  status: 'pass',
  repository: contract.repository,
  trackingIssue: contract.trackingIssue,
  route: contract.route,
  activeGate: contract.activeGate,
  currentTask: contract.currentTask.title,
  nextDecision: contract.nextAllowedStep.decision,
  sections: ids,
  counts,
  castCanonId: castCanon.canonId,
  activeCastIds: castCanon.activeCast.map((character) => character.id),
  variantCastIds: castCanon.variantCast.map((character) => character.id),
  boundaries,
  executableButtons: 0,
  mediaSurfaces: 0,
  generatedAt: new Date().toISOString()
};

await mkdir(path.join(root, 'output/production-cockpit'), { recursive: true });
await writeFile(path.join(root, 'output/production-cockpit/check.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
