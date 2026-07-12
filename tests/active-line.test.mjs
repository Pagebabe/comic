import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (file) => JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'));

const line = await readJson('project/active-line.json');

test('active line separates strategic contract from executable review task', () => {
  assert.equal(line.repository, 'Pagebabe/comic');
  assert.equal(line.authority, 'current_operational_line');
  assert.deepEqual(line.parentGate, {
    id: 'LR5',
    trackingIssue: 82,
    status: 'ACTIVE'
  });
  assert.equal(line.strategicContract.id, 'LR5.1');
  assert.equal(line.strategicContract.trackingIssue, 88);
  assert.equal(line.activeReviewGate.trackingIssue, 153);
  assert.equal(line.executionTask.trackingIssue, 155);
  assert.equal(line.executionTask.nextAction, 'RUN_ISSUE_155_ON_LOCAL_M1');
});

test('completed scan is represented without false no-image interpretation', () => {
  assert.equal(line.completedAssetScan.trackingIssue, 123);
  assert.equal(line.completedAssetScan.status, 'CLOSED_COMPLETED');
  assert.equal(line.completedAssetScan.filesScanned, 6215);
  assert.equal(line.completedAssetScan.scanErrors, 0);
  assert.equal(line.completedAssetScan.duplicateGroups, 249);
  assert.equal(line.completedAssetScan.characterSheetEntries, 43);
  assert.equal(line.completedAssetScan.loraDatasetEntries, 17);
  assert.equal(line.completedAssetScan.modelFiles, 0);
  assert.equal(line.completedAssetScan.interpretation, 'MODEL_FILES_ZERO_DOES_NOT_MEAN_CHARACTER_IMAGES_ZERO');
});

test('review tooling is pinned and creative execution remains blocked', () => {
  assert.equal(line.executionTask.toolingPullRequest, 154);
  assert.equal(line.executionTask.toolingHead, '19835df9fd3baaaa91d25ef58b2279ecf708e64c');
  assert.equal(line.strategicContract.candidateSheets, 0);
  assert.equal(line.strategicContract.masterApproved, false);
  assert.ok(Object.values(line.boundaries).every((value) => value === false));
});

test('non-current work remains explicitly parked', () => {
  assert.deepEqual(line.parkedWork.map((item) => item.pullRequest), [150, 152, 157, 159]);
  assert.equal(line.parkedWork.find((item) => item.pullRequest === 157)?.reason, 'BLOCKED_BY_ISSUES_153_AND_155');
  assert.equal(line.parkedWork.find((item) => item.pullRequest === 159)?.reason, 'PRELAUNCH_ONLY_NOT_CURRENT_PRODUCTION_LINE');
});
