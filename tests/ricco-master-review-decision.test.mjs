import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadRiccoMasterReviewDecision,
  validateRiccoMasterReviewDecision
} from '../scripts/check_ricco_master_review_decision.mjs';

const clone = (value) => structuredClone(value);
const rejectsWith = (contract, code) => {
  assert.throws(
    () => validateRiccoMasterReviewDecision(contract),
    new RegExp(`\\[RICCO_MASTER_REVIEW:${code}\\]`)
  );
};

test('validates the source-bound Ricco revision decision', async () => {
  const contract = await loadRiccoMasterReviewDecision();
  assert.deepEqual(validateRiccoMasterReviewDecision(contract), {
    status: 'RICCO_MASTER_REVIEW_DECISION_VALID',
    existingAssetReviewDecision: 'POSSIBLE_RICCO_REFERENCE',
    masterReviewDecision: 'REVISION_REQUIRED',
    revisionRequirements: 6,
    approvedMaster: false,
    activeGenerationJobs: 0,
    imageGenerationAllowed: false,
    automaticMasterApprovals: 0
  });
});

test('rejects overwriting the earlier asset review decision', async () => {
  const contract = clone(await loadRiccoMasterReviewDecision());
  contract.candidate.existingAssetReviewDecision = 'REVISION_REQUIRED';
  rejectsWith(contract, 'ASSET_REVIEW_DECISION');
});

test('rejects silent master approval', async () => {
  const contract = clone(await loadRiccoMasterReviewDecision());
  contract.candidate.approvedMaster = true;
  rejectsWith(contract, 'APPROVED_MASTER');
});

test('rejects early image generation authorization', async () => {
  const contract = clone(await loadRiccoMasterReviewDecision());
  contract.authorization.imageGenerationAllowed = true;
  rejectsWith(contract, 'UNSAFE_AUTHORIZATION');
});

test('rejects a second candidate slot', async () => {
  const contract = clone(await loadRiccoMasterReviewDecision());
  contract.candidate.candidateSlotsMaximum = 2;
  rejectsWith(contract, 'CANDIDATE_SLOT');
});

test('rejects missing revision requirements', async () => {
  const contract = clone(await loadRiccoMasterReviewDecision());
  contract.revisionRequirements.pop();
  rejectsWith(contract, 'REVISION_REQUIREMENT_COUNT');
});

test('rejects pre-authorizing the future revision candidate', async () => {
  const contract = clone(await loadRiccoMasterReviewDecision());
  contract.nextGate.currentlyAuthorized = true;
  rejectsWith(contract, 'FUTURE_ACTION_ALREADY_AUTHORIZED');
});
