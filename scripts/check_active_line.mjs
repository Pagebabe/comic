import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const fail = (code, message) => {
  throw new Error(`[ACTIVE_LINE:${code}] ${message}`);
};

const line = await readJson('project/active-line.json');

if (line.schemaVersion !== 1) fail('SCHEMA', 'schemaVersion must be 1');
if (line.repository !== 'Pagebabe/comic') fail('REPOSITORY', 'repository scope drifted');
if (line.authority !== 'current_operational_line') fail('AUTHORITY', 'operational authority missing');
if (line.trackingIssue !== 160) fail('TRACKING', 'line sync must stay bound to issue #160');

if (line.parentGate?.id !== 'LR5' || line.parentGate?.trackingIssue !== 82 || line.parentGate?.status !== 'ACTIVE') {
  fail('PARENT_GATE', 'LR5 issue #82 must remain the active parent gate');
}

if (line.strategicContract?.id !== 'LR5.1' || line.strategicContract?.trackingIssue !== 88 || line.strategicContract?.status !== 'CONTRACT_READY_REVIEW_REQUIRED') {
  fail('STRATEGIC_CONTRACT', 'LR5.1 issue #88 must remain the strategic Ricco contract');
}

if (line.completedAssetScan?.trackingIssue !== 123 || line.completedAssetScan?.status !== 'CLOSED_COMPLETED') {
  fail('ASSET_SCAN', 'issue #123 must remain the completed asset scan');
}
if (line.completedAssetScan.filesScanned !== 6215 || line.completedAssetScan.scanErrors !== 0 || line.completedAssetScan.duplicateGroups !== 249) {
  fail('SCAN_COUNTS', 'asset scan counts drifted');
}
if (line.completedAssetScan.characterSheetEntries !== 43 || line.completedAssetScan.loraDatasetEntries !== 17 || line.completedAssetScan.modelFiles !== 0) {
  fail('SCAN_CLASSIFICATION', 'asset scan classification drifted');
}
if (line.completedAssetScan.interpretation !== 'MODEL_FILES_ZERO_DOES_NOT_MEAN_CHARACTER_IMAGES_ZERO') {
  fail('SCAN_INTERPRETATION', 'model-files interpretation must remain explicit');
}

if (line.activeReviewGate?.trackingIssue !== 153 || line.activeReviewGate?.status !== 'EXISTING_ASSET_REVIEW_REQUIRED') {
  fail('ACTIVE_REVIEW', 'issue #153 must remain the active visual review gate');
}
if (line.executionTask?.trackingIssue !== 155 || line.executionTask?.status !== 'LOCAL_MAC_EVIDENCE_REQUIRED') {
  fail('EXECUTION_TASK', 'issue #155 must remain the local execution task');
}
if (line.executionTask?.toolingPullRequest !== 154 || line.executionTask?.toolingHead !== '19835df9fd3baaaa91d25ef58b2279ecf708e64c') {
  fail('TOOLING_PIN', 'review tooling pin drifted');
}
if (line.executionTask?.nextAction !== 'RUN_ISSUE_155_ON_LOCAL_M1') {
  fail('NEXT_ACTION', 'next action must stay local M1 execution');
}

const expectedSequence = [
  'LOCATE_EXACT_TARGET',
  'BUILD_LOCAL_REVIEW_PACKAGE',
  'OPEN_CONTACT_SHEET',
  'RECORD_HUMAN_DECISION_IN_ISSUE_153',
  'SYNCHRONIZE_PROJECT_TRUTH_AFTER_EVIDENCE'
];
if (JSON.stringify(line.requiredSequence) !== JSON.stringify(expectedSequence)) {
  fail('SEQUENCE', 'required operational sequence drifted');
}

for (const [key, value] of Object.entries(line.boundaries || {})) {
  if (value !== false) fail('BOUNDARY_OPEN', `${key} must remain false`);
}

const parked = new Map((line.parkedWork || []).map((item) => [item.pullRequest, item.reason]));
for (const pr of [150, 152, 157, 159]) {
  if (!parked.has(pr)) fail('PARKED_WORK', `PR #${pr} must remain explicitly parked`);
}

console.log(JSON.stringify({
  status: 'pass',
  parentGate: line.parentGate.trackingIssue,
  strategicContract: line.strategicContract.trackingIssue,
  activeReviewGate: line.activeReviewGate.trackingIssue,
  executionTask: line.executionTask.trackingIssue,
  nextAction: line.executionTask.nextAction,
  boundaries: line.boundaries
}));
