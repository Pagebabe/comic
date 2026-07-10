import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));

const evidence = await readJson('project/evidence-chain.json');
const closure = await readJson('project/evidence-closure.json');
const project = await readJson('project/project.json');
const canon = await readJson('project/canon.json');
const cast = await readJson('project/cast-merge-decisions.json');
const visualPrep = await readJson('project/visual-preproduction.json');

if (evidence.repository !== 'Pagebabe/comic' || closure.repository !== 'Pagebabe/comic') throw new Error('Evidence files belong to the wrong repository.');
if (closure.status !== 'coverage_closed' || closure.coverage?.percent !== 100) throw new Error('Evidence coverage is not closed at 100 percent.');
if (closure.coverage.trackedEntries !== closure.coverage.terminallyClassified) throw new Error('Not every evidence entry is terminally classified.');
if (closure.coverage.trackedEntries !== 23) throw new Error('Expected exactly 23 tracked evidence entries.');

const terminalStatuses = new Set(closure.terminalStatuses || []);
const expectedStatuses = new Set(['proven', 'disproven', 'not_yet_built', 'historically_unverifiable', 'superseded']);
if (terminalStatuses.size !== expectedStatuses.size || [...expectedStatuses].some((status) => !terminalStatuses.has(status))) throw new Error('Terminal evidence status contract drifted.');

const sourceIds = [...(evidence.workRules || []), ...(evidence.claims || [])].map((entry) => entry.id);
const classifiedIds = Object.keys(closure.classifications || {});
if (sourceIds.length !== 23 || new Set(sourceIds).size !== 23) throw new Error('Historical ledger must contain 23 unique entries.');
for (const id of sourceIds) {
  const status = closure.classifications[id];
  if (!terminalStatuses.has(status)) throw new Error(`${id} lacks a valid terminal classification.`);
}
for (const id of classifiedIds) if (!sourceIds.includes(id)) throw new Error(`Closure manifest contains unknown entry ${id}.`);

for (const id of ['CLAIM-011-visual-character-masters', 'CLAIM-012-location-masters', 'CLAIM-013-approved-voices', 'CLAIM-014-animatic-images', 'CLAIM-015-final-episode']) {
  if (closure.classifications[id] !== 'not_yet_built') throw new Error(`${id} must remain honestly classified as not_yet_built.`);
}
if (closure.classifications['CLAIM-010-character-portraits'] !== 'disproven') throw new Error('Technical portraits must remain disproven as canonical character representations.');
if (closure.classifications['RULE-006-repository-isolation'] !== 'historically_unverifiable') throw new Error('Historic cross-repository isolation must not be overstated.');
if (closure.classifications['RULE-007-ci-before-merge'] !== 'historically_unverifiable') throw new Error('Pre-gate CI history must not be overstated.');

const incidentClosures = closure.incidentClosures || {};
for (const id of ['INC-001-unapproved-character-portraits', 'INC-002-accidental-prs', 'INC-003-stale-backend-draft']) {
  if (!incidentClosures[id]?.startsWith('closed')) throw new Error(`${id} is not terminally closed.`);
}

if (project.inventory?.visualCharacterMastersLocked !== 0) throw new Error('Project must not claim a visual character master.');
if (project.inventory?.approvedVoiceSamples !== 0) throw new Error('Project must not claim an approved voice.');
if (project.inventory?.approvedAnimaticPanelImages !== 0) throw new Error('Project must not claim approved animatic images.');
if (canon.coreCast?.some((character) => character.status !== 'text_canon_locked_visual_pending')) throw new Error('Core cast visual status drifted.');
if (cast.decisions?.some((decision) => decision.visualStatus !== 'pending_master_reference')) throw new Error('A visual master was claimed without evidence.');
if (visualPrep.approvalGate?.humanReviewRequired !== true || visualPrep.approvalGate?.masterReferenceFieldsMustRemainNull !== true) throw new Error('Human visual approval gate is not enforced.');

for (const file of ['audit-ui.js', 'audit.css', 'docs/RETROACTIVE_EVIDENCE_AUDIT.md', 'scripts/build_visual_proof.mjs']) await access(new URL(file, root));
const auditUi = await readFile(new URL('audit-ui.js', root), 'utf8');
for (const marker of ['VISUAL OFFEN', 'Keine freigegebene Masterreferenz', '100%-Closure-Manifest', 'Runtime-Beweis']) if (!auditUi.includes(marker)) throw new Error(`Audit UI marker missing: ${marker}`);
const visualProof = await readFile(new URL('scripts/build_visual_proof.mjs', root), 'utf8');
for (const marker of ['dashboard-desktop.png', 'dashboard-mobile.png', 'visiblePortraitImages', 'horizontalOverflowPixels', 'evidenceCoveragePercent']) if (!visualProof.includes(marker)) throw new Error(`Visual proof marker missing: ${marker}`);

console.log(JSON.stringify({
  status: 'pass',
  repository: closure.repository,
  evidenceCoveragePercent: closure.coverage.percent,
  terminallyClassified: closure.coverage.terminallyClassified,
  trackedEntries: closure.coverage.trackedEntries,
  incidentsClosed: Object.keys(incidentClosures).length
}));
