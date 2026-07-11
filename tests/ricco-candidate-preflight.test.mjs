import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const serialized = (value) => JSON.stringify(value);

test('Ricco one-candidate preflight is prepared but execution remains blocked', async () => {
  const preflight = await json('project/lr5-ricco-candidate-preflight.json');
  assert.equal(preflight.repository, 'Pagebabe/comic');
  assert.equal(preflight.gate, 'LR5');
  assert.equal(preflight.workPackage, 'LR5.1');
  assert.equal(preflight.trackingIssue, 88);
  assert.equal(preflight.status, 'PREPARED_EXECUTION_BLOCKED');
  assert.equal(preflight.requiredHumanDecision, 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE');
  assert.equal(preflight.humanApproval.recorded, false);
  assert.equal(preflight.humanApproval.decision, null);
});

test('execution boundary allows one later sheet and no prompt lottery', async () => {
  const preflight = await json('project/lr5-ricco-candidate-preflight.json');
  const boundary = preflight.executionBoundary;
  assert.equal(boundary.imageGenerationAllowedNow, false);
  assert.equal(boundary.providerExecutionAllowed, false);
  assert.equal(boundary.maximumCandidateSheets, 1);
  assert.equal(boundary.currentCandidateSheets, 0);
  assert.equal(boundary.batchGenerationAllowed, false);
  assert.equal(boundary.loraTrainingAllowed, false);
  assert.equal(boundary.automaticMasterAssignmentAllowed, false);
  assert.equal(boundary.generationCommand, null);
});

test('candidate and manifest template cannot overclaim output or approval', async () => {
  const [contract, preflight] = await Promise.all([
    json('project/lr5-ricco-master-contract.json'),
    json('project/lr5-ricco-candidate-preflight.json')
  ]);
  assert.equal(preflight.candidate.candidateId, contract.reviewSheet.candidateId);
  assert.equal(preflight.candidate.candidateVersion, contract.reviewSheet.candidateVersion);
  assert.equal(preflight.candidate.reviewStatus, 'REVIEW_REQUIRED');
  assert.equal(preflight.candidate.humanDecision, 'REVIEW_REQUIRED');
  assert.equal(preflight.candidate.artifactPresent, false);
  assert.equal(preflight.candidate.manifestPresent, false);
  assert.equal(preflight.candidate.imageBytesPresent, false);
  for (const field of contract.candidateManifestRequiredFields) {
    assert.ok(Object.hasOwn(preflight.manifestTemplate, field), `Missing manifest field: ${field}`);
  }
  assert.equal(preflight.manifestTemplate.artifactPath, null);
  assert.equal(preflight.manifestTemplate.artifactSha256, null);
  assert.equal(preflight.manifestTemplate.generatorName, null);
  assert.equal(preflight.manifestTemplate.executionId, null);
  assert.equal(preflight.manifestTemplate.reviewStatus, 'REVIEW_REQUIRED');
  assert.equal(preflight.manifestTemplate.humanDecision, 'REVIEW_REQUIRED');
});

test('activation requires exact project-owner approval and a separate later master decision', async () => {
  const preflight = await json('project/lr5-ricco-candidate-preflight.json');
  assert.ok(preflight.activationRules.some((rule) => rule.includes('Only the project owner')));
  assert.ok(preflight.activationRules.some((rule) => rule.includes('CONTRACT_APPROVED_FOR_ONE_CANDIDATE')));
  assert.ok(preflight.activationRules.some((rule) => rule.includes('not a master')));
  assert.ok(preflight.activationRules.some((rule) => rule.includes('separate human decision')));
  assert.match(preflight.nextAction, /Record the exact project-owner decision/);
});

test('preflight contains no hidden execution or final-state claim', async () => {
  const preflight = await json('project/lr5-ricco-candidate-preflight.json');
  const text = serialized(preflight);
  assert.doesNotMatch(text, /"imageGenerationAllowedNow":true/);
  assert.doesNotMatch(text, /"providerExecutionAllowed":true/);
  assert.doesNotMatch(text, /"batchGenerationAllowed":true/);
  assert.doesNotMatch(text, /"loraTrainingAllowed":true/);
  assert.doesNotMatch(text, /"automaticMasterAssignmentAllowed":true/);
  assert.doesNotMatch(text, /"artifactPresent":true/);
  assert.doesNotMatch(text, /"manifestPresent":true/);
  assert.doesNotMatch(text, /"humanDecision":"APPROVED_MASTER"/);
});
