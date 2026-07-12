import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const contract = JSON.parse(await readFile(new URL('../project/operator-recovery-contract.json', import.meta.url), 'utf8'));

test('operator recovery contract keeps dynamic workflow evidence outside static JSON', () => {
  const policy = contract.automatedProofPolicy;
  assert.equal(policy.status, 'PR_BOUND_EVIDENCE_REQUIRED');
  assert.equal(policy.exactHeadRequired, true);
  assert.equal(policy.requiredConclusion, 'success');
  assert.equal(policy.embeddedRunIdsAllowed, false);
  assert.equal(policy.embeddedCommitShasAllowed, false);
  assert.equal(policy.embeddedArtifactIdsAllowed, false);
  assert.deepEqual(policy.requiredWorkflows, [
    'Operator Recovery Drill',
    'Comic Factory CI',
    'Fresh Install Drill'
  ]);
});

test('contract rejects the previous stale proof shape by construction', () => {
  const serialized = JSON.stringify(contract);
  for (const field of [
    'workflowRun',
    'branchHead',
    'checkedMergeCommit',
    'artifactId',
    'artifactDigest',
    'freshInstallRun',
    'comicFactoryCiRun'
  ]) {
    assert.doesNotMatch(serialized, new RegExp(`"${field}"`));
  }
  assert.doesNotMatch(serialized, /HISTORICAL_PROOF_REBASE_PENDING/);
  assert.doesNotMatch(serialized, /READY_FOR_REVIEW/);
});
