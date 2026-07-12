import { readFile } from 'node:fs/promises';

const contract = JSON.parse(await readFile(new URL('../project/operator-recovery-contract.json', import.meta.url), 'utf8'));
const serialized = JSON.stringify(contract);
const ok = (condition, code) => {
  if (!condition) throw new Error(`[OPERATOR_RECOVERY_PROOF_POLICY:${code}]`);
};

ok(contract.repository === 'Pagebabe/comic', 'REPOSITORY');
ok(contract.trackingIssue === 118, 'TRACKING');
ok(contract.automatedProofPolicy?.status === 'PR_BOUND_EVIDENCE_REQUIRED', 'POLICY_STATUS');
ok(contract.automatedProofPolicy?.exactHeadRequired === true, 'EXACT_HEAD');
ok(contract.automatedProofPolicy?.requiredConclusion === 'success', 'SUCCESS_REQUIRED');
ok(contract.automatedProofPolicy?.embeddedRunIdsAllowed === false, 'NO_EMBEDDED_RUN_IDS');
ok(contract.automatedProofPolicy?.embeddedCommitShasAllowed === false, 'NO_EMBEDDED_COMMIT_SHAS');
ok(contract.automatedProofPolicy?.embeddedArtifactIdsAllowed === false, 'NO_EMBEDDED_ARTIFACT_IDS');
ok(contract.automatedProofPolicy?.requiredWorkflows?.length === 3, 'WORKFLOW_COUNT');
ok(contract.automatedProofPolicy.requiredWorkflows.includes('Operator Recovery Drill'), 'RECOVERY_WORKFLOW');
ok(contract.automatedProofPolicy.requiredWorkflows.includes('Comic Factory CI'), 'FACTORY_WORKFLOW');
ok(contract.automatedProofPolicy.requiredWorkflows.includes('Fresh Install Drill'), 'FRESH_INSTALL_WORKFLOW');

for (const forbiddenField of ['workflowRun', 'branchHead', 'checkedMergeCommit', 'artifactId', 'artifactDigest', 'freshInstallRun', 'comicFactoryCiRun']) {
  ok(!serialized.includes(`"${forbiddenField}"`), `STALE_DYNAMIC_FIELD_${forbiddenField}`);
}
ok(!serialized.includes('HISTORICAL_PROOF_REBASE_PENDING'), 'STALE_PENDING_STATUS');
ok(!serialized.includes('READY_FOR_REVIEW'), 'STATIC_CONTRACT_MUST_NOT_CLAIM_REVIEW_STATE');

console.log(JSON.stringify({
  status: 'pass',
  repository: contract.repository,
  proofPolicy: contract.automatedProofPolicy.status,
  exactHeadRequired: true,
  dynamicEvidenceStoredInContract: false,
  workflows: contract.automatedProofPolicy.requiredWorkflows
}, null, 2));
