import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const path of [
  'project/lr5-ricco-master-contract.json',
  'project/lr5-ricco-master-source-inventory.json',
  'project/lr5-ricco-candidate-preflight.json',
  'docs/LR5_RICCO_ONE_CANDIDATE_PREFLIGHT.md'
]) await access(new URL(path, root));

const [contract, inventory, preflight] = await Promise.all([
  json('project/lr5-ricco-master-contract.json'),
  json('project/lr5-ricco-master-source-inventory.json'),
  json('project/lr5-ricco-candidate-preflight.json')
]);

assert(preflight.repository === 'Pagebabe/comic', 'Repository scope drifted.');
assert(preflight.gate === 'LR5' && preflight.workPackage === 'LR5.1', 'Ricco gate identity drifted.');
assert(preflight.trackingIssue === 88, 'Ricco tracking issue drifted.');
assert(preflight.contractId === contract.contractId, 'Preflight contract id diverged from the active contract.');
assert(preflight.contractPath === 'project/lr5-ricco-master-contract.json', 'Contract path drifted.');
assert(preflight.sourceInventoryPath === 'project/lr5-ricco-master-source-inventory.json', 'Source inventory path drifted.');
assert(inventory.sources.length === 7, 'The source inventory must still contain exactly seven records.');

assert(contract.status === 'CONTRACT_READY_REVIEW_REQUIRED', 'The source contract is no longer awaiting human review.');
assert(contract.executionGate.imageGenerationAllowedNow === false, 'The source contract enabled image generation early.');
assert(contract.executionGate.requiredDecisionBeforeGeneration === 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'The required human decision drifted.');
assert(contract.currentState.candidateSheets === 0, 'The source contract already claims a candidate.');
assert(contract.currentState.imageBytesPresent === false, 'The source contract already claims image bytes.');

assert(preflight.status === 'PREPARED_EXECUTION_BLOCKED', 'Preflight must remain prepared but blocked.');
assert(preflight.requiredHumanDecision === 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'Preflight approval token drifted.');
assert(preflight.humanApproval.recorded === false, 'Human approval was silently recorded.');
assert(preflight.humanApproval.decision === null, 'Human approval decision must remain null.');
assert(preflight.humanApproval.decidedBy === null && preflight.humanApproval.decidedAt === null, 'Approval provenance was fabricated.');

const boundary = preflight.executionBoundary;
assert(boundary.imageGenerationAllowedNow === false, 'Preflight enabled image generation.');
assert(boundary.providerExecutionAllowed === false, 'Preflight enabled provider execution.');
assert(boundary.maximumCandidateSheets === 1, 'Exactly one candidate sheet must remain the maximum.');
assert(boundary.currentCandidateSheets === 0, 'Preflight claims an existing candidate.');
assert(boundary.batchGenerationAllowed === false, 'Batch generation was enabled.');
assert(boundary.loraTrainingAllowed === false, 'LoRA training was enabled.');
assert(boundary.automaticMasterAssignmentAllowed === false, 'Automatic master assignment was enabled.');
assert(boundary.generationCommand === null, 'A generation command was armed before approval.');

const candidate = preflight.candidate;
assert(candidate.candidateId === contract.reviewSheet.candidateId, 'Candidate id drifted from the contract.');
assert(candidate.candidateVersion === contract.reviewSheet.candidateVersion, 'Candidate version drifted from the contract.');
assert(candidate.artifactType === contract.reviewSheet.artifactType, 'Candidate artifact type drifted.');
assert(candidate.reviewStatus === 'REVIEW_REQUIRED' && candidate.humanDecision === 'REVIEW_REQUIRED', 'Candidate was pre-approved.');
assert(candidate.artifactPresent === false && candidate.manifestPresent === false && candidate.imageBytesPresent === false, 'Preflight claims output that does not exist.');

for (const field of contract.candidateManifestRequiredFields) {
  assert(Object.hasOwn(preflight.manifestTemplate, field), `Manifest template is missing required field: ${field}`);
}
assert(preflight.manifestTemplate.reviewStatus === 'REVIEW_REQUIRED', 'Manifest template review status drifted.');
assert(preflight.manifestTemplate.humanDecision === 'REVIEW_REQUIRED', 'Manifest template human decision drifted.');
assert(preflight.manifestTemplate.artifactPath === null && preflight.manifestTemplate.artifactSha256 === null, 'Manifest template claims an artifact.');
assert(preflight.manifestTemplate.generatorName === null && preflight.manifestTemplate.executionId === null, 'Manifest template claims provider execution.');
assert(Array.isArray(preflight.manifestTemplate.automaticTests) && preflight.manifestTemplate.automaticTests.length === 0, 'Automatic tests were fabricated.');

assert(preflight.activationRules.some((rule) => rule.includes('Only the project owner')), 'Project-owner approval boundary is missing.');
assert(preflight.activationRules.some((rule) => rule.includes('not a master')), 'Candidate-versus-master boundary is missing.');
assert(preflight.stopRules.some((rule) => rule.includes('No image, GPU or provider execution')), 'Execution stop rule is missing.');
assert(preflight.stopRules.some((rule) => rule.includes('No batch alternatives')), 'No-batch stop rule is missing.');
assert(preflight.stopRules.some((rule) => rule.includes('No LoRA training')), 'LoRA stop rule is missing.');

console.log(JSON.stringify({
  status: 'pass',
  repository: preflight.repository,
  gate: preflight.gate,
  workPackage: preflight.workPackage,
  trackingIssue: preflight.trackingIssue,
  preflightStatus: preflight.status,
  requiredHumanDecision: preflight.requiredHumanDecision,
  humanApprovalRecorded: false,
  candidateLimit: boundary.maximumCandidateSheets,
  candidateSheets: boundary.currentCandidateSheets,
  imageGenerationAllowedNow: false,
  providerExecutionAllowed: false,
  batchGenerationAllowed: false,
  loraTrainingAllowed: false,
  automaticMasterAssignmentAllowed: false,
  artifactPresent: false,
  manifestPresent: false,
  nextAction: 'PROJECT_OWNER_DECISION_REQUIRED'
}, null, 2));
