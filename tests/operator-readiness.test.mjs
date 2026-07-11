import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  checkOperatorReadiness,
  validateOperatorReadiness
} from '../scripts/check_operator_readiness.mjs';

const readiness = JSON.parse(await readFile(new URL('../project/operator-readiness.json', import.meta.url), 'utf8'));
const academyStatus = JSON.parse(await readFile(new URL('../project/production-academy-status.json', import.meta.url), 'utf8'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('operator readiness repository checker passes', async () => {
  const report = await checkOperatorReadiness({ writeOutput: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.provenGateCount, 8);
  assert.equal(report.requiredGateCount, 10);
  assert.equal(report.technicalWorkflowReady, true);
  assert.equal(report.productionCreativeReady, false);
  assert.equal(report.externalNoviceAcceptanceComplete, false);
  assert.equal(report.overallReady, false);
});

test('all proven readiness gates carry the complete evidence tuple', () => {
  const required = ['source', 'test', 'artifact', 'runtimeProof', 'visualCountercheck'];
  for (const gate of readiness.gates.filter((candidate) => candidate.status === 'PROVEN')) {
    assert.ok(gate.evidence, gate.id);
    for (const field of required) {
      assert.equal(typeof gate.evidence[field], 'string', `${gate.id}.${field}`);
      assert.ok(gate.evidence[field].trim().length > 0, `${gate.id}.${field}`);
    }
  }
});

test('external novice acceptance cannot be promoted without real evidence', () => {
  const candidate = clone(readiness);
  candidate.gates[9].status = 'PROVEN';
  candidate.gates[9].evidence = {
    source: 'synthetic',
    test: 'simulated',
    artifact: 'none',
    runtimeProof: 'none',
    visualCountercheck: 'none'
  };
  candidate.summary.provenGateCount = 9;
  assert.throws(
    () => validateOperatorReadiness(candidate, academyStatus),
    /Gate 10 must remain EXTERNAL_INPUT_REQUIRED/
  );
});

test('overall readiness cannot be true while required gates remain open', () => {
  const candidate = clone(readiness);
  candidate.summary.overallReady = true;
  assert.throws(
    () => validateOperatorReadiness(candidate, academyStatus),
    /Overall readiness may not be true/
  );
});

test('a proven gate without full evidence is rejected', () => {
  const candidate = clone(readiness);
  delete candidate.gates[1].evidence.visualCountercheck;
  assert.throws(
    () => validateOperatorReadiness(candidate, academyStatus),
    /missing evidence\.visualCountercheck/
  );
});

test('creative progress cannot be invented by the operator readiness layer', () => {
  const candidate = clone(readiness);
  candidate.currentTruth.characterMastersApproved = 1;
  assert.throws(
    () => validateOperatorReadiness(candidate, academyStatus),
    /No character master may be claimed/
  );
});

test('reporter collision remains an explicit overall-readiness blocker', () => {
  const candidate = clone(readiness);
  candidate.operationalRisks[0].blocksOverallReady = false;
  assert.throws(
    () => validateOperatorReadiness(candidate, academyStatus),
    /must block overall readiness/
  );
});
