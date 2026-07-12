import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyLivePages } from '../scripts/check_live_pages.mjs';

const commit = 'a'.repeat(40);

const response = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body
});

const fixtureFetch = async (input) => {
  const url = String(input);
  if (url.endsWith('/studio/')) return response('<html></html>');
  if (url.endsWith('/project/active-line.json')) return response({
    authority: 'current_operational_line',
    parentGate: { trackingIssue: 82 },
    strategicContract: { trackingIssue: 88 },
    completedAssetScan: { trackingIssue: 123 },
    activeReviewGate: { trackingIssue: 153 },
    executionTask: { trackingIssue: 155, toolingPullRequest: 154 },
    boundaries: {
      imageGenerationAllowed: false,
      modelDownloadAllowed: false,
      loraTrainingAllowed: false,
      automaticMasterApprovalAllowed: false,
      sourceAssetMutationAllowed: false,
      mainMergeAllowed: false,
      livePublishingAllowed: false
    }
  });
  if (url.endsWith('/project/production-cockpit-v1.json')) return response({
    status: 'WORKING_COCKPIT_V1',
    activeGate: { trackingIssue: 153 },
    currentTask: { primaryHref: 'https://github.com/Pagebabe/comic/issues/155' },
    nextAllowedStep: { decision: 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED' }
  });
  if (url.endsWith('/proof/cockpit/production-cockpit-runtime-evidence.json')) return response({
    status: 'pass',
    commit,
    activeParentTrackingIssue: 82,
    strategicContractTrackingIssue: 88,
    completedAssetScan: 123,
    activeReviewGate: 153,
    localExecutionTask: 155,
    toolingPullRequest: 154,
    activeWorkspace: 'review',
    nextDecision: 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED',
    imageGenerationAllowed: false,
    creativeApprovalGranted: false,
    productionReady: false
  });
  return response({}, 404);
};

test('live Pages verifier proves the deployed operational line', async () => {
  const result = await verifyLivePages({
    baseUrl: 'https://pagebabe.github.io/comic/',
    expectedCommit: commit,
    fetchImpl: fixtureFetch,
    attempts: 1,
    delayMs: 0
  });
  assert.equal(result.status, 'pass');
  assert.equal(result.studioUrl, 'https://pagebabe.github.io/comic/studio/');
  assert.equal(result.activeReviewGate, 153);
  assert.equal(result.localExecutionTask, 155);
  assert.equal(result.activeWorkspace, 'review');
  assert.equal(result.imageGenerationAllowed, false);
});

test('live Pages verifier rejects a stale deployed commit', async () => {
  await assert.rejects(
    verifyLivePages({
      baseUrl: 'https://pagebabe.github.io/comic/',
      expectedCommit: 'b'.repeat(40),
      fetchImpl: fixtureFetch,
      attempts: 1,
      delayMs: 0
    }),
    /runtime proof commit/
  );
});
