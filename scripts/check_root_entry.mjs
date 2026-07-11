import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const read = (file) => readFile(path.join(rootDir, file), 'utf8');
const fail = (code, message) => { throw new Error(`[ROOT_ENTRY:${code}] ${message}`); };

const [contractText, index, audit, css] = await Promise.all([
  read('project/root-entry-v1.json'),
  read('index.html'),
  read('audit.html'),
  read('gateway.css')
]);
const contract = JSON.parse(contractText);

if (contract.repository !== 'Pagebabe/comic') fail('REPOSITORY', 'scope drifted');
if (contract.trackingIssue !== 121 || contract.parentIssue !== 117) fail('ISSUES', 'tracking chain drifted');
if (contract.status !== 'ROOT_ENTRY_READY_FOR_PROOF') fail('STATUS', 'unexpected root status');
if (contract.primaryAction?.href !== './studio/#cockpit') fail('PRIMARY_ACTION', 'cockpit is not primary');
if (contract.legacyAudit?.preserved !== true || contract.legacyAudit?.route !== '/audit.html') fail('AUDIT', 'audit route not preserved');
if (contract.currentState?.activeGate !== 'LR5.1' || contract.currentState?.activeIssue !== 88) fail('ACTIVE_GATE', 'LR5.1 issue #88 must remain active');
for (const field of ['riccoCandidates','characterMastersApproved','locationMastersApproved','voiceMastersApproved','reviewedEpisodes']) if (contract.currentState?.[field] !== 0) fail('FALSE_PROGRESS', `${field} must remain zero`);
if (contract.currentState.productionReady || contract.currentState.beginnerReady) fail('READINESS_OVERCLAIM', 'readiness must remain false');
for (const [key, value] of Object.entries(contract.boundaries || {})) if (value !== false) fail('BOUNDARY_OPEN', `${key} must remain false`);

for (const marker of ['data-testid="root-entry"','data-testid="root-primary-action" href="./studio/#cockpit"','href="./studio/#academy"','href="./studio/#lr5-ricco"','href="./audit.html"']) if (!index.includes(marker)) fail('ROOT_MARKER', marker);
for (const stale of ['LR1 PILOTENTSCHEIDUNG','Canon DECISION_REQUIRED','Pilot menschlich auswählen']) if (index.includes(stale)) fail('STALE_ROOT_COPY', stale);
if (/<script|<button/i.test(index)) fail('EXECUTION_SURFACE', 'root must remain script- and button-free');
for (const marker of ['id="evidenceChain"','src="./app.js"','src="./audit-ui.js"','src="./lr1-ui.js"']) if (!audit.includes(marker)) fail('AUDIT_INCOMPLETE', marker);
if (!css.includes('@media (max-width: 620px)')) fail('MOBILE_CSS', 'mobile breakpoint missing');

const report = {
  schemaVersion: 1,
  status: 'pass',
  repository: contract.repository,
  trackingIssue: contract.trackingIssue,
  parentIssue: contract.parentIssue,
  route: contract.route,
  primaryAction: contract.primaryAction,
  auditRoute: contract.legacyAudit.route,
  activeGate: contract.currentState.activeGate,
  riccoCandidates: 0,
  productionReady: false,
  beginnerReady: false,
  boundaries: contract.boundaries,
  generatedAt: new Date().toISOString()
};
await mkdir(path.join(rootDir, 'output/root-entry'), { recursive: true });
await writeFile(path.join(rootDir, 'output/root-entry/check.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
