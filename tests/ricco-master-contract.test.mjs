import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const text = (value) => JSON.stringify(value);

test('LR5.1 source inventory pins seven sources and separates authority levels', async () => {
  const inventory = await json('project/lr5-ricco-master-source-inventory.json');
  assert.equal(inventory.repository, 'Pagebabe/comic');
  assert.equal(inventory.gate, 'LR5');
  assert.equal(inventory.workPackage, 'LR5.1');
  assert.equal(inventory.parentTrackingIssue, 82);
  assert.equal(inventory.trackingIssue, 88);
  assert.equal(inventory.publicBaseline.mergeCommit, '56a4e9da2d9c0ed6d56fdfda42ba10113a6c476f');
  assert.equal(inventory.publicBaseline.pagesRun, 29154561431);
  assert.equal(inventory.sources.length, 7);
  assert.deepEqual(inventory.sources.map((source) => source.blob), [
    '28f566db24245ad38e9a748a15a1c2929b473866',
    '39011644e108d0a3c2dd8ddda41a5f2c74369b23',
    '186ad510fd3a86d8dd3531f956eac6950f2ab929',
    'f68ea8bdd676705df8314d61b834d605cd5223e2',
    'a8f380c2e485705d3b94f9fd1503decd67a3b3fc',
    '6670c2bd5e5c704d890b9e4acbc6d653be1d806e',
    '5c4a95a738f1bdfabb1a5776078824a7aaa1717f'
  ]);
  assert.equal(inventory.sources.find((source) => source.path === 'assets/characters/ricco.svg').authority, 'NOT_A_MASTER_SOURCE');
  assert.equal(inventory.sources.find((source) => source.path === 'assets/characters/ricco.svg').usableForVisualContract, false);
  assert.ok(inventory.sources.every((source) => source.creativeApproval === false));
});

test('historical Ricco conflicts are explicit and resolved toward current authority', async () => {
  const inventory = await json('project/lr5-ricco-master-source-inventory.json');
  const conflicts = Object.fromEntries(inventory.resolvedConflicts.map((conflict) => [conflict.field, conflict]));
  assert.equal(conflicts.character_id.historicalValue, 'char_rico');
  assert.equal(conflicts.character_id.currentValue, 'char_ricco');
  assert.equal(conflicts.age.historicalValue, 20);
  assert.equal(conflicts.age.currentValue, 24);
  assert.equal(conflicts.visual_master_status.resolution, 'NO_MASTER_EXISTS');
  assert.equal(conflicts.style_prompting.resolution, 'DEPRECATE_NAMED_STYLE_PHRASE');
  assert.equal(conflicts.dashboard_svg.resolution, 'EXCLUDE_FROM_MASTER_INPUT');
});

test('Ricco contract allows only one later candidate and blocks execution now', async () => {
  const contract = await json('project/lr5-ricco-master-contract.json');
  assert.equal(contract.contractId, 'lr5-ricco-visual-master-v1');
  assert.equal(contract.status, 'CONTRACT_READY_REVIEW_REQUIRED');
  assert.equal(contract.subject.id, 'char_ricco');
  assert.equal(contract.subject.age, 24);
  assert.equal(contract.subject.masterReference, null);
  assert.equal(contract.subject.masterStatus, 'REVIEW_REQUIRED');
  assert.equal(contract.executionGate.contractHumanReviewRequired, true);
  assert.equal(contract.executionGate.imageGenerationAllowedNow, false);
  assert.equal(contract.executionGate.maximumCandidateSheetsAfterApproval, 1);
  assert.equal(contract.executionGate.batchGenerationAllowed, false);
  assert.equal(contract.executionGate.loraTrainingAllowed, false);
  assert.equal(contract.executionGate.automaticMasterAssignmentAllowed, false);
  assert.equal(contract.executionGate.requiredDecisionBeforeGeneration, 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE');
});

test('review sheet binds views expressions poses and one coherent identity', async () => {
  const contract = await json('project/lr5-ricco-master-contract.json');
  assert.equal(contract.reviewSheet.maximumArtifacts, 1);
  assert.equal(contract.reviewSheet.requiredViews.length, 5);
  assert.equal(contract.reviewSheet.requiredExpressions.length, 6);
  assert.equal(contract.reviewSheet.requiredPoseStudies.length, 4);
  assert.ok(contract.reviewSheet.requiredViews.includes('solid black silhouette'));
  assert.ok(contract.reviewSheet.requiredExpressions.includes('nervous half-smile'));
  assert.ok(contract.reviewSheet.requiredPoseStudies.includes('clutching blue-lid Tupperware'));
  assert.equal(contract.visualIdentity.paletteStatus, 'REVIEW_REQUIRED');
  assert.ok(contract.visualIdentity.requiredIdentifiers.includes('24-year-old young adult man'));
  assert.match(contract.visualIdentity.silhouette, /backpack and headphones/i);
});

test('prompt uses descriptive original traits and rejects named-style shortcuts', async () => {
  const contract = await json('project/lr5-ricco-master-contract.json');
  const prompt = contract.promptContract.positivePrompt;
  const negative = contract.promptContract.negativePrompt;
  assert.match(prompt, /24-year-old young adult man/);
  assert.match(prompt, /same face, body, outfit, props and palette/i);
  assert.match(prompt, /original limited 2D animated social-comedy design/i);
  for (const forbidden of ['Free-for-All', 'Simpsons', 'Family Guy', 'South Park', 'Pixar', 'Disney', 'Ghibli']) {
    assert.doesNotMatch(prompt, new RegExp(forbidden, 'i'));
  }
  assert.match(negative, /direct imitation of any existing series or artist/i);
  assert.match(negative, /multiple character alternatives/i);
});

test('ten review tests keep automatic approval impossible', async () => {
  const contract = await json('project/lr5-ricco-master-contract.json');
  assert.equal(contract.reviewTests.length, 10);
  assert.equal(contract.reviewTests.filter((review) => review.severity === 'BLOCKING').length, 9);
  assert.equal(contract.reviewTests.filter((review) => review.severity === 'REVIEW_REQUIRED').length, 1);
  assert.ok(contract.reviewTests.some((review) => review.id === 'identity-consistency'));
  assert.ok(contract.reviewTests.some((review) => review.id === 'originality-boundary'));
  assert.ok(contract.automaticRejectionTriggers.length >= 9);
  assert.equal(contract.humanDecision.current, 'REVIEW_REQUIRED');
  assert.deepEqual(contract.humanDecision.allowedValues, ['APPROVED_MASTER', 'REVISION_REQUIRED', 'REJECTED']);
  assert.match(contract.humanDecision.rule, /Only an explicit project-owner review/);
});

test('LR5.1 current state remains a truthful zero-image zero-master state', async () => {
  const [inventory, contract] = await Promise.all([
    json('project/lr5-ricco-master-source-inventory.json'),
    json('project/lr5-ricco-master-contract.json')
  ]);
  assert.equal(inventory.candidateBoundary.maximumCandidateSheets, 1);
  assert.equal(inventory.candidateBoundary.currentCandidateSheets, 0);
  assert.equal(inventory.candidateBoundary.imageBytesPresent, false);
  assert.equal(inventory.candidateBoundary.externalGeneratorExecutionUsed, false);
  assert.equal(inventory.candidateBoundary.masterApproved, false);
  assert.equal(inventory.candidateBoundary.automaticApprovalAllowed, false);
  assert.equal(contract.currentState.candidateSheets, 0);
  assert.equal(contract.currentState.imageBytesPresent, false);
  assert.equal(contract.currentState.externalExecutionUsed, false);
  assert.equal(contract.currentState.automaticTestsRun, false);
  assert.equal(contract.currentState.masterApproved, false);
  assert.equal(contract.currentState.characterMastersApproved, 0);
  assert.equal(contract.currentState.locationMastersApproved, 0);
  assert.equal(contract.currentState.voiceMastersApproved, 0);
  assert.doesNotMatch(text(contract), /"masterApproved":true/);
});

test('candidate manifest requires provenance hashes and human decision', async () => {
  const contract = await json('project/lr5-ricco-master-contract.json');
  for (const field of [
    'sourceInventorySha256',
    'contractSha256',
    'promptSha256',
    'negativePromptSha256',
    'generatorName',
    'generatorVersion',
    'executionId',
    'artifactPath',
    'artifactSha256',
    'reviewStatus',
    'automaticTests',
    'humanDecision'
  ]) assert.ok(contract.candidateManifestRequiredFields.includes(field), `Missing manifest field: ${field}`);
  assert.ok(contract.notProven.includes('Ricco master approval'));
  assert.ok(contract.notProven.includes('episode production readiness'));
});
