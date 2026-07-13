import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');
const contract = JSON.parse(await read('project/root-entry-v1.json'));
const activeLine = JSON.parse(await read('project/active-line.json'));
const root = await read('index.html');
const audit = await read('audit.html');
const css = await read('gateway.css');

test('root contract makes cockpit the primary public action', () => {
  assert.equal(contract.repository, 'Pagebabe/comic');
  assert.equal(contract.trackingIssue, 121);
  assert.equal(contract.parentIssue, 117);
  assert.equal(contract.status, 'ROOT_ENTRY_READY_FOR_PROOF');
  assert.deepEqual(contract.primaryAction, {
    label: 'Produktions-Cockpit öffnen',
    href: './studio/#cockpit',
  });
  assert.equal(contract.legacyAudit.preserved, true);
  assert.equal(contract.legacyAudit.route, '/audit.html');
});

test('root follows the current operational review line', () => {
  assert.equal(contract.currentState.parentGate, activeLine.parentGate.id);
  assert.equal(contract.currentState.parentIssue, activeLine.parentGate.trackingIssue);
  assert.equal(contract.currentState.strategicContract, activeLine.strategicContract.id);
  assert.equal(contract.currentState.strategicIssue, activeLine.strategicContract.trackingIssue);
  assert.equal(contract.currentState.activeReviewGate, activeLine.activeReviewGate.id);
  assert.equal(contract.currentState.activeReviewIssue, activeLine.activeReviewGate.trackingIssue);
  assert.equal(contract.currentState.localExecutionIssue, activeLine.executionTask.trackingIssue);
  assert.equal(contract.currentState.activeWorkspace, 'review');
  assert.equal(
    contract.currentState.nextDecision,
    'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED',
  );
});

test('root exposes cockpit, Academy, review and audit without stale LR1 copy', () => {
  assert.match(root, /data-testid="root-entry"/);
  assert.match(root, /data-testid="root-primary-action" href="\.\/studio\/#cockpit"/);
  assert.match(root, /href="\.\/studio\/#academy"/);
  assert.match(root, /Issues #153 und #155/);
  assert.match(root, /href="\.\/audit\.html"/);
  assert.doesNotMatch(root, /LR1 PILOTENTSCHEIDUNG/);
  assert.doesNotMatch(root, /Canon DECISION_REQUIRED/);
  assert.doesNotMatch(root, /Pilot menschlich auswählen/);
});

test('root keeps honest production zero state and boundaries', () => {
  for (const field of [
    'riccoCandidates',
    'characterMastersApproved',
    'locationMastersApproved',
    'voiceMastersApproved',
    'reviewedEpisodes',
  ]) {
    assert.equal(contract.currentState[field], 0, field);
  }
  assert.equal(contract.currentState.productionReady, false);
  assert.equal(contract.currentState.beginnerReady, false);
  assert.ok(Object.values(contract.boundaries).every((value) => value === false));
  assert.match(root, /PRODUKTIONSREIFE/);
  assert.match(root, /NICHT ERREICHT/);
  assert.match(root, /BILDGENERIERUNG/);
  assert.match(root, /GESPERRT/);
  assert.match(root, /GROWTH OS/);
  assert.match(root, /GETRENNT/);
});

test('legacy audit remains a complete executable page', () => {
  assert.match(audit, /id="evidenceChain"/);
  assert.match(audit, /src="\.\/app\.js"/);
  assert.match(audit, /src="\.\/audit-ui\.js"/);
  assert.match(audit, /src="\.\/lr1-ui\.js"/);
});

test('root gateway is responsive and execution-free', () => {
  assert.doesNotMatch(root, /<script/i);
  assert.doesNotMatch(root, /<button/i);
  assert.match(css, /@media \(max-width:900px\)/);
  assert.match(css, /@media \(max-width:620px\)/);
});
