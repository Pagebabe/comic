import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));

const evidence = await readJson('project/evidence-chain.json');
const policyRules = await readJson('project/evidence-policy-rules.json');
const closure = await readJson('project/evidence-closure.json');
const history = await readJson('project/historical-pr-evidence.json');
const headingIncident = await readJson('project/incidents/INC-005-stale-evidence-heading.json');
const project = await readJson('project/project.json');
const canon = await readJson('project/canon.json');
const cast = await readJson('project/cast-merge-decisions.json');
const visualPrep = await readJson('project/visual-preproduction.json');

for (const file of [evidence, policyRules, closure, history, headingIncident]) {
  if (file.repository !== 'Pagebabe/comic') throw new Error('Evidence files belong to the wrong repository.');
}
if (policyRules.priority !== 0 || policyRules.status !== 'active') throw new Error('Evidence-first policy must remain active at priority 0.');
if (closure.status !== 'coverage_closed' || closure.coverage?.percent !== 100) throw new Error('Evidence coverage is not closed at 100 percent.');
if (closure.coverage.trackedEntries !== closure.coverage.terminallyClassified || closure.coverage.trackedEntries !== 25) throw new Error('Evidence ledger must remain 25/25.');
if (closure.coverage.historicalUnitsAudited !== 26 || closure.coverage.historicalPullRequestsAudited !== 25) throw new Error('Historical backfill counts must remain 26 units and 25 pull requests.');
if (history.status !== 'coverage_closed' || history.summary?.coveragePercent !== 100 || history.summary?.pending !== 0) throw new Error('Historical PR ledger is not fully closed.');

const terminalStatuses = new Set(closure.terminalStatuses || []);
const expectedStatuses = new Set(['proven', 'disproven', 'not_yet_built', 'historically_unverifiable', 'superseded']);
if (terminalStatuses.size !== expectedStatuses.size || [...expectedStatuses].some((status) => !terminalStatuses.has(status))) throw new Error('Terminal evidence status contract drifted.');

const allRules = [...(evidence.workRules || []), ...(policyRules.workRules || [])];
const sourceIds = [...allRules, ...(evidence.claims || [])].map((entry) => entry.id);
const classifiedIds = Object.keys(closure.classifications || {});
if (sourceIds.length !== 25 || new Set(sourceIds).size !== 25) throw new Error('Evidence ledger must contain 25 unique entries.');
for (const id of sourceIds) if (!terminalStatuses.has(closure.classifications[id])) throw new Error(`${id} lacks a valid terminal classification.`);
for (const id of classifiedIds) if (!sourceIds.includes(id)) throw new Error(`Closure manifest contains unknown entry ${id}.`);

const evidenceFirstRule = allRules.find((entry) => entry.id === 'RULE-009-evidence-first-pr-gate');
if (!evidenceFirstRule || evidenceFirstRule.status !== 'proven' || closure.classifications[evidenceFirstRule.id] !== 'proven') throw new Error('RULE-009 evidence-first PR gate is not proven.');
const historicalClaim = evidence.claims?.find((entry) => entry.id === 'CLAIM-016-complete-historical-pr-backfill');
if (!historicalClaim || historicalClaim.status !== 'proven' || closure.classifications[historicalClaim.id] !== 'proven') throw new Error('CLAIM-016 historical PR backfill is not proven.');

for (const id of ['CLAIM-011-visual-character-masters', 'CLAIM-012-location-masters', 'CLAIM-013-approved-voices', 'CLAIM-014-animatic-images', 'CLAIM-015-final-episode']) {
  if (closure.classifications[id] !== 'not_yet_built') throw new Error(`${id} must remain honestly classified as not_yet_built.`);
}
if (closure.classifications['CLAIM-010-character-portraits'] !== 'disproven') throw new Error('Technical portraits must remain disproven as canonical character representations.');
if (closure.classifications['RULE-006-repository-isolation'] !== 'historically_unverifiable') throw new Error('Historic cross-repository isolation must not be overstated.');
if (closure.classifications['RULE-007-ci-before-merge'] !== 'historically_unverifiable') throw new Error('Pre-gate CI history must not be overstated.');

const incidentClosures = closure.incidentClosures || {};
for (const id of ['INC-001-unapproved-character-portraits', 'INC-002-accidental-prs', 'INC-003-stale-backend-draft', 'INC-004-deploy-proof-overwrite', 'INC-005-stale-evidence-heading']) {
  if (!incidentClosures[id]?.startsWith('closed')) throw new Error(`${id} is not terminally closed.`);
}
if (headingIncident.status !== 'closed_verified_by_runtime_visual_proof') throw new Error('INC-005 incident file is not terminally closed.');
if (headingIncident.correctiveProof?.commit !== '24e63b3208bcb0e36e4b521d0c449a9d0dc994cb') throw new Error('INC-005 corrective commit drifted.');
if (headingIncident.correctiveProof?.runtimeChecks?.desktopStaleEvidenceCountPresent !== false || headingIncident.correctiveProof?.runtimeChecks?.mobileStaleEvidenceCountPresent !== false) throw new Error('INC-005 stale count is not proven absent.');

if (project.inventory?.visualCharacterMastersLocked !== 0) throw new Error('Project must not claim a visual character master.');
if (project.inventory?.approvedVoiceSamples !== 0) throw new Error('Project must not claim an approved voice.');
if (project.inventory?.approvedAnimaticPanelImages !== 0) throw new Error('Project must not claim approved animatic images.');
if (canon.coreCast?.some((character) => character.status !== 'text_canon_locked_visual_pending')) throw new Error('Core cast visual status drifted.');
if (cast.decisions?.some((decision) => decision.visualStatus !== 'pending_master_reference')) throw new Error('A visual master was claimed without evidence.');
if (visualPrep.approvalGate?.humanReviewRequired !== true || visualPrep.approvalGate?.masterReferenceFieldsMustRemainNull !== true) throw new Error('Human visual approval gate is not enforced.');

for (const file of [
  'audit-ui.js', 'audit.css', 'docs/RETROACTIVE_EVIDENCE_AUDIT.md', 'docs/EVIDENCE_FIRST_POLICY.md', 'docs/HISTORICAL_PR_EVIDENCE_BACKFILL.md',
  '.github/pull_request_template.md', 'scripts/build_visual_proof.mjs', 'scripts/check_pr_evidence.mjs', 'scripts/check_historical_pr_evidence.mjs',
  'tests/pr-evidence-policy.test.mjs', 'tests/historical-pr-evidence.test.mjs', 'tests/evidence-heading.test.mjs', 'project/incidents/INC-005-stale-evidence-heading.json'
]) await access(new URL(file, root));

const auditUi = await readFile(new URL('audit-ui.js', root), 'utf8');
for (const marker of ['VISUAL OFFEN', 'Keine freigegebene Masterreferenz', '100%-Closure-Manifest', 'Runtime-Beweis', 'Historischer PR-Backfill', 'Alle fünf Vorfälle terminal geschlossen']) if (!auditUi.includes(marker)) throw new Error(`Audit UI marker missing: ${marker}`);
const visualProof = await readFile(new URL('scripts/build_visual_proof.mjs', root), 'utf8');
for (const marker of ['dashboard-desktop.png', 'dashboard-mobile.png', 'visiblePortraitImages', 'horizontalOverflowPixels', 'historicalUnitsAudited', 'incidentClosureTextPresent']) if (!visualProof.includes(marker)) throw new Error(`Visual proof marker missing: ${marker}`);
const policy = await readFile(new URL('docs/EVIDENCE_FIRST_POLICY.md', root), 'utf8');
for (const marker of ['PRIORITY 0', 'Behauptung', 'sichtbare Gegenprüfung', 'PENDING_DEPLOY', 'Beweiskette\n> Canon', 'rückwirkend']) if (!policy.includes(marker)) throw new Error(`Evidence-first policy marker missing: ${marker}`);
const prTemplate = await readFile(new URL('.github/pull_request_template.md', root), 'utf8');
for (const marker of ['## Behauptung', '## Quelle', '## Test', '## Artefakt', '## Deployment oder Laufbeweis', '## Sichtprüfung', '## Aktueller Status', '## Nicht behauptet', '## Repository-Scope', '## Pflichtbestätigungen']) if (!prTemplate.includes(marker)) throw new Error(`Pull request evidence section missing: ${marker}`);
const ciWorkflow = await readFile(new URL('.github/workflows/ci.yml', root), 'utf8');
for (const marker of ['Verify pull request evidence packet', 'Verify complete historical PR backfill', 'node scripts/check_historical_pr_evidence.mjs']) if (!ciWorkflow.includes(marker)) throw new Error(`CI evidence gate marker missing: ${marker}`);

console.log(JSON.stringify({
  status: 'pass', repository: closure.repository, evidenceCoveragePercent: closure.coverage.percent,
  terminallyClassified: closure.coverage.terminallyClassified, trackedEntries: closure.coverage.trackedEntries,
  historicalPullRequestsAudited: closure.coverage.historicalPullRequestsAudited,
  historicalUnitsAudited: closure.coverage.historicalUnitsAudited,
  priorityZeroRule: evidenceFirstRule.id, historicalBackfillClaim: historicalClaim.id,
  incidentsClosed: Object.keys(incidentClosures).length
}));
