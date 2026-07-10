import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

test('historical PR ledger covers every discovered pull request and the pre-PR baseline', async () => {
  const ledger = await readJson('project/historical-pr-evidence.json');
  assert.equal(ledger.repository, 'Pagebabe/comic');
  assert.equal(ledger.status, 'coverage_closed');
  assert.equal(ledger.scope.pullRequestsAudited, 25);
  assert.equal(ledger.scope.prePullRequestBaselinesAudited, 1);
  assert.equal(ledger.scope.historicalUnitsAudited, 26);
  assert.equal(ledger.summary.pending, 0);
  assert.equal(ledger.summary.coveragePercent, 100);
});

test('historical correction statuses cannot drift', async () => {
  const ledger = await readJson('project/historical-pr-evidence.json');
  const byPr = new Map(ledger.entries.filter((entry) => entry.prNumber).map((entry) => [entry.prNumber, entry]));
  assert.equal(byPr.get(1).terminalStatus, 'superseded');
  assert.equal(byPr.get(3).terminalStatus, 'historically_unverifiable');
  assert.equal(byPr.get(12).terminalStatus, 'disproven');
  assert.equal(byPr.get(20).terminalStatus, 'superseded');
  assert.equal(byPr.get(21).terminalStatus, 'superseded');
  assert.equal(byPr.get(22).terminalStatus, 'proven');
  assert.equal(byPr.get(30).terminalStatus, 'proven');
});

test('all historical entries have evidence, a boundary and a terminal status', async () => {
  const ledger = await readJson('project/historical-pr-evidence.json');
  const terminal = new Set(['proven', 'disproven', 'historically_unverifiable', 'superseded']);
  assert.equal(new Set(ledger.entries.map((entry) => entry.id)).size, 26);
  for (const entry of ledger.entries) {
    assert.ok(terminal.has(entry.terminalStatus), `${entry.id} status`);
    assert.ok(entry.sourceRefs.length > 0, `${entry.id} sources`);
    assert.ok(entry.changeScope.length > 0, `${entry.id} scope`);
    assert.ok(entry.classificationReason.length > 10, `${entry.id} reason`);
    assert.ok(entry.currentBoundary.length > 10, `${entry.id} boundary`);
    assert.ok(entry.visibleCountercheck.state, `${entry.id} visible countercheck`);
  }
});

test('main closure includes the historical backfill claim', async () => {
  const closure = await readJson('project/evidence-closure.json');
  assert.equal(closure.coverage.trackedEntries, 25);
  assert.equal(closure.coverage.terminallyClassified, 25);
  assert.equal(closure.coverage.historicalUnitsAudited, 26);
  assert.equal(closure.classifications['CLAIM-016-complete-historical-pr-backfill'], 'proven');
});
