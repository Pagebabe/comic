import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));

const ledger = await readJson('project/historical-pr-evidence.json');
const closure = await readJson('project/evidence-closure.json');
const evidence = await readJson('project/evidence-chain.json');

if (ledger.repository !== 'Pagebabe/comic') throw new Error('Historical PR ledger belongs to the wrong repository.');
if (ledger.status !== 'coverage_closed') throw new Error('Historical PR ledger is not terminally closed.');
if (ledger.scope?.pullRequestsAudited !== 25 || ledger.scope?.prePullRequestBaselinesAudited !== 1 || ledger.scope?.historicalUnitsAudited !== 26) {
  throw new Error('Historical unit counts must remain 25 PRs + 1 pre-PR baseline = 26.');
}
if (ledger.summary?.coveragePercent !== 100 || ledger.summary?.pending !== 0 || ledger.summary?.total !== 26) {
  throw new Error('Historical PR coverage must remain 100 percent with zero pending entries.');
}

const expectedPrNumbers = [1, 3, 4, 5, 6, 8, 10, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const actualPrNumbers = (ledger.entries || []).filter((entry) => Number.isInteger(entry.prNumber)).map((entry) => entry.prNumber);
if (JSON.stringify(actualPrNumbers) !== JSON.stringify(expectedPrNumbers)) {
  throw new Error(`Historical PR sequence drifted: ${JSON.stringify(actualPrNumbers)}`);
}

const terminalStatuses = new Set(['proven', 'disproven', 'historically_unverifiable', 'superseded']);
const ids = new Set();
for (const entry of ledger.entries || []) {
  if (!entry.id || ids.has(entry.id)) throw new Error(`Duplicate or missing historical entry id: ${entry.id}`);
  ids.add(entry.id);
  if (!terminalStatuses.has(entry.terminalStatus)) throw new Error(`${entry.id} has a non-terminal status.`);
  for (const field of ['title', 'originalClaim', 'classificationReason', 'currentBoundary']) {
    if (!entry[field] || String(entry[field]).trim().length < 12) throw new Error(`${entry.id} lacks meaningful ${field}.`);
  }
  if (!Array.isArray(entry.sourceRefs) || entry.sourceRefs.length === 0) throw new Error(`${entry.id} lacks source references.`);
  if (!Array.isArray(entry.changeScope) || entry.changeScope.length === 0) throw new Error(`${entry.id} lacks a recorded change scope.`);
  if (!entry.visibleCountercheck?.state) throw new Error(`${entry.id} lacks a visible-countercheck classification.`);
}

const statusCounts = [...ids].reduce((counts, id) => {
  const status = ledger.entries.find((entry) => entry.id === id).terminalStatus;
  counts[status] = (counts[status] || 0) + 1;
  return counts;
}, {});
if (statusCounts.proven !== 15 || statusCounts.superseded !== 8 || statusCounts.historically_unverifiable !== 2 || statusCounts.disproven !== 1) {
  throw new Error(`Historical status counts drifted: ${JSON.stringify(statusCounts)}`);
}

const byPr = new Map(ledger.entries.filter((entry) => Number.isInteger(entry.prNumber)).map((entry) => [entry.prNumber, entry]));
for (const [pr, status] of [[1, 'superseded'], [3, 'historically_unverifiable'], [12, 'disproven'], [20, 'superseded'], [21, 'superseded'], [22, 'proven'], [30, 'proven']]) {
  if (byPr.get(pr)?.terminalStatus !== status) throw new Error(`PR #${pr} must remain ${status}.`);
}
if (ledger.entries.find((entry) => entry.id === 'HIST-000-pre-pr-baseline')?.terminalStatus !== 'historically_unverifiable') {
  throw new Error('Pre-PR baseline must remain historically_unverifiable.');
}
if (!ledger.scope?.numberingNote?.includes('issues and pull requests share')) {
  throw new Error('GitHub shared-numbering explanation is missing.');
}

if (closure.coverage?.trackedEntries !== 25 || closure.coverage?.terminallyClassified !== 25 || closure.coverage?.percent !== 100) {
  throw new Error('Main evidence closure must remain 25/25 at 100 percent.');
}
if (closure.coverage?.historicalUnitsAudited !== 26 || closure.coverage?.historicalPullRequestsAudited !== 25) {
  throw new Error('Closure manifest does not expose historical backfill counts.');
}
if (closure.classifications?.['CLAIM-016-complete-historical-pr-backfill'] !== 'proven') {
  throw new Error('CLAIM-016 historical PR backfill is not proven.');
}
const sourceClaim = evidence.claims?.find((claim) => claim.id === 'CLAIM-016-complete-historical-pr-backfill');
if (!sourceClaim || sourceClaim.status !== 'proven') throw new Error('Historical PR backfill source claim is missing or not proven.');

console.log(JSON.stringify({
  status: 'pass',
  repository: ledger.repository,
  pullRequestsAudited: ledger.scope.pullRequestsAudited,
  historicalUnitsAudited: ledger.scope.historicalUnitsAudited,
  coveragePercent: ledger.summary.coveragePercent,
  pending: ledger.summary.pending,
  terminalStatusCounts: statusCounts
}));
