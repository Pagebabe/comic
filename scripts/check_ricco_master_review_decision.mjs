import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const contractUrl = new URL('../project/ricco-master-review-decision.json', import.meta.url);

const fail = (code, detail = '') => {
  throw new Error(`[RICCO_MASTER_REVIEW:${code}]${detail ? ` ${detail}` : ''}`);
};

const assert = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};

export async function loadRiccoMasterReviewDecision() {
  return JSON.parse(await readFile(contractUrl, 'utf8'));
}

export function validateRiccoMasterReviewDecision(contract) {
  assert(contract.schemaVersion === 1, 'SCHEMA_VERSION');
  assert(contract.repository === 'Pagebabe/comic', 'REPOSITORY');
  assert(contract.status === 'REVISION_REQUIREMENTS_RECORDED_GENERATION_BLOCKED', 'STATUS');
  assert(contract.parentGate === 88, 'PARENT_GATE');
  assert(contract.trackingIssue === 181, 'TRACKING_ISSUE');

  const baseline = contract.baseline || {};
  assert(baseline.pullRequest === 178, 'BASELINE_PR');
  assert(/^[a-f0-9]{40}$/.test(baseline.headSha || ''), 'BASELINE_HEAD');
  assert(baseline.existingAssetReviewIssue === 153, 'ASSET_REVIEW_ISSUE');
  assert(baseline.cloudReviewRun === 29355551995, 'CLOUD_REVIEW_RUN');
  assert(baseline.artifactId === 8319961025, 'ARTIFACT_ID');
  assert(baseline.artifactName === 'ricco-existing-character-review-29355551995', 'ARTIFACT_NAME');
  assert(/^sha256:[a-f0-9]{64}$/.test(baseline.artifactDigest || ''), 'ARTIFACT_DIGEST');

  const candidate = contract.candidate || {};
  assert(candidate.characterId === 'char_ricco', 'CHARACTER_ID');
  assert(candidate.targetFilename === 'Ricco - Charakterdesign Übersicht.png', 'TARGET_FILENAME');
  assert(candidate.targetSha256 === '145941b9e6f2fcde7657d6cd147f3ab83e3754d82d40dce5c5de0f78cf212313', 'TARGET_SHA256');
  assert(candidate.targetSizeBytes === 1708575, 'TARGET_SIZE');
  assert(candidate.pixelWidth === 1448 && candidate.pixelHeight === 1086, 'TARGET_DIMENSIONS');
  assert(candidate.candidateSlotsUsed === 1 && candidate.candidateSlotsMaximum === 1, 'CANDIDATE_SLOT');
  assert(candidate.existingAssetReviewDecision === 'POSSIBLE_RICCO_REFERENCE', 'ASSET_REVIEW_DECISION');
  assert(candidate.masterReviewDecision === 'REVISION_REQUIRED', 'MASTER_REVIEW_DECISION');
  assert(candidate.approvedMaster === false, 'APPROVED_MASTER');
  assert(candidate.riccoMaster === false, 'RICCO_MASTER');

  const requirements = contract.revisionRequirements || [];
  assert(requirements.length === 6, 'REVISION_REQUIREMENT_COUNT', String(requirements.length));
  const ids = requirements.map((item) => item.id);
  assert(new Set(ids).size === ids.length, 'REVISION_REQUIREMENT_DUPLICATE');
  for (const required of [
    'REMOVE_READABLE_REVIEW_TEXT',
    'REDUCE_ANIME_YA_SIGNALS',
    'SIMPLIFY_LIMITED_2D_FORMS',
    'CLARIFY_BLUE_TUPPERWARE_LID',
    'STRENGTHEN_OUTLINES',
    'PRESERVE_IDENTITY_ANCHORS'
  ]) {
    assert(ids.includes(required), 'REVISION_REQUIREMENT_MISSING', required);
  }
  assert(requirements.every((item) => typeof item.requirement === 'string' && item.requirement.length >= 40), 'REVISION_REQUIREMENT_DETAIL');
  assert(Array.isArray(contract.hardConflictsObserved) && contract.hardConflictsObserved.length === 0, 'HARD_CONFLICTS');

  const authorization = contract.authorization || {};
  assert(authorization.documentationAllowed === true, 'DOCUMENTATION_NOT_ALLOWED');
  for (const key of [
    'imageGenerationAllowed',
    'automaticImageEditingAllowed',
    'consistencyViewsAllowed',
    'secondCandidateAllowed',
    'modelDownloadAllowed',
    'loraTrainingAllowed',
    'masterApprovalAllowed',
    'automaticMasterApprovalAllowed'
  ]) {
    assert(authorization[key] === false, 'UNSAFE_AUTHORIZATION', key);
  }

  assert(contract.nextGate?.issue === 88, 'NEXT_GATE');
  assert(contract.nextGate?.explicitAuthorizationRequired === true, 'EXPLICIT_AUTHORIZATION');
  assert(contract.nextGate?.permittedFutureAction === 'AUTHORIZE_EXACTLY_ONE_SOURCE_BOUND_REVISION_CANDIDATE', 'FUTURE_ACTION');
  assert(contract.nextGate?.currentlyAuthorized === false, 'FUTURE_ACTION_ALREADY_AUTHORIZED');

  assert(contract.truthCounters?.riccoReferenceCandidates === '1/1', 'REFERENCE_COUNTER');
  assert(contract.truthCounters?.riccoMasters === '0/1', 'RICCO_MASTER_COUNTER');
  assert(contract.truthCounters?.characterMasters === '0/4', 'CHARACTER_MASTER_COUNTER');
  assert(contract.truthCounters?.activeGenerationJobs === 0, 'ACTIVE_JOB_COUNTER');
  assert(contract.truthCounters?.imageBytesInRepository === 0, 'IMAGE_BYTES_COUNTER');
  assert(contract.truthCounters?.automaticMasterApprovals === 0, 'AUTO_APPROVAL_COUNTER');

  return {
    status: 'RICCO_MASTER_REVIEW_DECISION_VALID',
    existingAssetReviewDecision: candidate.existingAssetReviewDecision,
    masterReviewDecision: candidate.masterReviewDecision,
    revisionRequirements: requirements.length,
    approvedMaster: candidate.approvedMaster,
    activeGenerationJobs: contract.truthCounters.activeGenerationJobs,
    imageGenerationAllowed: authorization.imageGenerationAllowed,
    automaticMasterApprovals: contract.truthCounters.automaticMasterApprovals
  };
}

async function main() {
  const contract = await loadRiccoMasterReviewDecision();
  process.stdout.write(`${JSON.stringify(validateRiccoMasterReviewDecision(contract), null, 2)}\n`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
