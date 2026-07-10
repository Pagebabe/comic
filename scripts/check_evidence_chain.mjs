import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));

const evidence = await readJson('project/evidence-chain.json');
const project = await readJson('project/project.json');
const canon = await readJson('project/canon.json');
const cast = await readJson('project/cast-merge-decisions.json');
const visualPrep = await readJson('project/visual-preproduction.json');

const allowedStatuses = new Set(['proven', 'partially_proven', 'unproven', 'reclassified', 'superseded']);
const visualCheckStates = new Set(['pass', 'pending', 'fail', 'not_applicable']);

if (evidence.repository !== 'Pagebabe/comic') throw new Error('Evidence chain belongs to the wrong repository.');
if (evidence.status !== 'retroactive_audit_active') throw new Error('Retroactive audit must remain active until all historic gaps are closed.');
if (!Array.isArray(evidence.proofRule?.sequence) || evidence.proofRule.sequence.join('>') !== 'claim>source>test>artifact>deployment>visibleCountercheck>status') {
  throw new Error('Proof-chain order drifted.');
}

const validateEntry = (entry, type) => {
  if (!entry.id || !entry.title) throw new Error(`${type} entry lacks id or title.`);
  if (!allowedStatuses.has(entry.status)) throw new Error(`${entry.id} has invalid status ${entry.status}.`);
  for (const key of ['sourceRefs', 'testRefs', 'artifactRefs', 'deployRefs']) {
    if (!Array.isArray(entry[key])) throw new Error(`${entry.id} lacks ${key}.`);
  }
  if (!entry.visibleCheck || !visualCheckStates.has(entry.visibleCheck.state)) throw new Error(`${entry.id} lacks a valid visible countercheck.`);
  if (!Array.isArray(entry.gaps)) throw new Error(`${entry.id} lacks a gaps array.`);
  if (entry.status === 'proven') {
    if (!entry.sourceRefs.length || !entry.testRefs.length || !entry.artifactRefs.length || !entry.deployRefs.length) {
      throw new Error(`${entry.id} is marked proven without a complete source, test, artifact and deployment chain.`);
    }
    if (!['pass', 'not_applicable'].includes(entry.visibleCheck.state)) throw new Error(`${entry.id} is proven without a passed or justified visible check.`);
    if (entry.gaps.length) throw new Error(`${entry.id} is proven but still lists gaps.`);
  }
  if (['partially_proven', 'unproven'].includes(entry.status) && !entry.gaps.length) throw new Error(`${entry.id} must disclose at least one gap.`);
  if (entry.status === 'reclassified' && !entry.correction) throw new Error(`${entry.id} is reclassified without a corrective action.`);
};

for (const rule of evidence.workRules || []) validateEntry(rule, 'Rule');
for (const claim of evidence.claims || []) validateEntry(claim, 'Claim');

const claims = new Map(evidence.claims.map((claim) => [claim.id, claim]));
for (const id of ['CLAIM-011-visual-character-masters', 'CLAIM-012-location-masters', 'CLAIM-013-approved-voices', 'CLAIM-014-animatic-images', 'CLAIM-015-final-episode']) {
  if (claims.get(id)?.status !== 'unproven') throw new Error(`${id} must remain unproven.`);
}
if (claims.get('CLAIM-010-character-portraits')?.status !== 'reclassified') throw new Error('Technical character portraits must remain reclassified.');
if (!claims.get('CLAIM-010-character-portraits')?.visibleCheck?.detail?.includes('Ricco SVG lacks')) throw new Error('Ricco portrait mismatch is not explicitly recorded.');

const incidentIds = new Set((evidence.incidents || []).map((incident) => incident.id));
for (const id of ['INC-001-unapproved-character-portraits', 'INC-002-accidental-prs', 'INC-003-stale-backend-draft']) {
  if (!incidentIds.has(id)) throw new Error(`Historic incident missing: ${id}`);
}

if (project.inventory?.visualCharacterMastersLocked !== 0) throw new Error('Project must not claim a visual character master.');
if (project.inventory?.approvedVoiceSamples !== 0) throw new Error('Project must not claim an approved voice.');
if (project.inventory?.approvedAnimaticPanelImages !== 0) throw new Error('Project must not claim approved animatic images.');
if (canon.coreCast?.some((character) => character.status !== 'text_canon_locked_visual_pending')) throw new Error('Core cast visual status drifted.');
if (cast.decisions?.some((decision) => decision.visualStatus !== 'pending_master_reference')) throw new Error('A visual master was claimed without evidence.');
if (visualPrep.approvalGate?.humanReviewRequired !== true || visualPrep.approvalGate?.masterReferenceFieldsMustRemainNull !== true) {
  throw new Error('Human visual approval gate is not enforced.');
}

for (const file of ['audit-ui.js', 'audit.css', 'docs/RETROACTIVE_EVIDENCE_AUDIT.md']) await access(new URL(file, root));
const auditUi = await readFile(new URL('audit-ui.js', root), 'utf8');
for (const marker of ['VISUAL OFFEN', 'Keine freigegebene Masterreferenz', 'project/evidence-chain.json', 'INC-001-unapproved-character-portraits']) {
  if (!auditUi.includes(marker)) throw new Error(`Audit UI marker missing: ${marker}`);
}
const index = await readFile(new URL('index.html', root), 'utf8');
for (const marker of ['id="evidenceChain"', 'href="./audit.css"', 'src="./audit-ui.js"']) {
  if (!index.includes(marker)) throw new Error(`Dashboard audit marker missing: ${marker}`);
}

const summary = evidence.claims.reduce((counts, claim) => {
  counts[claim.status] = (counts[claim.status] || 0) + 1;
  return counts;
}, {});
console.log(JSON.stringify({ status: 'pass', repository: evidence.repository, auditedThroughCommit: evidence.auditedThroughCommit, claims: summary, incidents: evidence.incidents.length }));
