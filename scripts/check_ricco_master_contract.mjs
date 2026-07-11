import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const text = (value) => JSON.stringify(value);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const path of [
  'project/truth-state.json',
  'project/pilot-decision-record.json',
  'project/merge-bibles/ricco.json',
  'project/visual-preproduction.json',
  'project/character-production-sheets.json',
  'project/lora-training-sheets.json',
  'assets/characters/ricco.svg',
  'project/lr5-ricco-master-source-inventory.json',
  'project/lr5-ricco-master-contract.json',
  'studio-app/src/RiccoMasterReview.tsx'
]) await access(new URL(path, root));

const [truth, decision, bible, visualPrep, productionSheets, loraSheets, inventory, contract, reviewUi] = await Promise.all([
  json('project/truth-state.json'),
  json('project/pilot-decision-record.json'),
  json('project/merge-bibles/ricco.json'),
  json('project/visual-preproduction.json'),
  json('project/character-production-sheets.json'),
  json('project/lora-training-sheets.json'),
  json('project/lr5-ricco-master-source-inventory.json'),
  json('project/lr5-ricco-master-contract.json'),
  readFile(new URL('studio-app/src/RiccoMasterReview.tsx', root), 'utf8')
]);

assert(truth.repository === 'Pagebabe/comic', 'Repository scope drifted.');
assert(truth.trackingIssue === 82, 'LR5 parent gate is not Issue #82.');
assert(truth.nextSequence.find((item) => item.id === 'LR4')?.status === 'done', 'LR4 is not closed.');
assert(truth.nextSequence.find((item) => item.id === 'LR5')?.status === 'active_recovery_gate', 'LR5 is not the active gate.');
assert(decision.selectedCandidateId === 'pilot-das-zimmer', 'Das Zimmer is not the selected pilot.');

assert(bible.id === 'char_ricco', 'Current Ricco id drifted.');
assert(bible.age === 24, 'Current Ricco age drifted.');
assert(bible.visualLock?.masterReference === null, 'A Ricco master reference was silently assigned.');
assert(bible.openItems?.includes('visuelle Masterreferenz'), 'Ricco visual master must remain open.');

const visualSheet = visualPrep.characterSheets.find((sheet) => sheet.id === 'char_ricco');
assert(Boolean(visualSheet), 'Current Ricco visual-preproduction sheet is missing.');
assert(visualSheet.status === 'brief_locked_image_pending', 'Ricco visual-preproduction status drifted.');
assert(visualSheet.requiredViews.length === 5, 'Current Ricco brief must contain five views.');
assert(visualSheet.requiredExpressions.length === 6, 'Current Ricco brief must contain six expressions.');
assert(visualPrep.approvalGate?.humanReviewRequired === true, 'Human review is not required.');
assert(visualPrep.approvalGate?.noBatchExpansionBeforeRiccoLock === true, 'Batch expansion was enabled before Ricco lock.');
assert(visualPrep.approvalGate?.masterReferenceFieldsMustRemainNull === true, 'Master-reference fields are not protected.');

const historicalProduction = productionSheets.find((sheet) => sheet.character_id === 'char_rico');
const historicalLora = loraSheets.find((sheet) => sheet.character_id === 'char_rico');
assert(Boolean(historicalProduction), 'Historical char_rico production sheet is missing.');
assert(Boolean(historicalLora), 'Historical char_rico LoRA sheet is missing.');
assert(/20-year-old/.test(historicalProduction.generator_prompt), 'Historical age conflict is no longer observable.');
assert(historicalLora.dataset_target === '40-60 curated images', 'Historical LoRA batch target drifted.');

assert(inventory.gate === 'LR5' && inventory.workPackage === 'LR5.1', 'Inventory gate identity drifted.');
assert(inventory.parentTrackingIssue === 82 && inventory.trackingIssue === 88, 'LR5.1 tracking drifted.');
assert(inventory.sources.length === 7, 'Exactly seven Ricco source records are required.');
assert(inventory.sources.every((source) => source.creativeApproval === false), 'A source record granted creative approval.');
assert(inventory.sources.find((source) => source.path === 'assets/characters/ricco.svg')?.authority === 'NOT_A_MASTER_SOURCE', 'Dashboard SVG became a master source.');
assert(inventory.resolvedConflicts.find((conflict) => conflict.field === 'character_id')?.currentValue === 'char_ricco', 'Character id conflict is unresolved.');
assert(inventory.resolvedConflicts.find((conflict) => conflict.field === 'age')?.currentValue === 24, 'Age conflict is unresolved.');
assert(inventory.resolvedConflicts.find((conflict) => conflict.field === 'style_prompting')?.resolution === 'DEPRECATE_NAMED_STYLE_PHRASE', 'Named-style prompt conflict is unresolved.');

assert(contract.contractId === 'lr5-ricco-visual-master-v1', 'Ricco contract id drifted.');
assert(contract.status === 'CONTRACT_READY_REVIEW_REQUIRED', 'Ricco contract status drifted.');
assert(contract.subject.id === 'char_ricco' && contract.subject.age === 24, 'Ricco contract identity drifted.');
assert(contract.subject.masterReference === null && contract.subject.masterStatus === 'REVIEW_REQUIRED', 'Ricco contract overclaims a master.');
assert(contract.executionGate.imageGenerationAllowedNow === false, 'Image generation was enabled before contract review.');
assert(contract.executionGate.maximumCandidateSheetsAfterApproval === 1, 'Candidate limit must remain exactly one.');
assert(contract.executionGate.batchGenerationAllowed === false, 'Batch generation was enabled.');
assert(contract.executionGate.loraTrainingAllowed === false, 'LoRA training was enabled before master approval.');
assert(contract.executionGate.automaticMasterAssignmentAllowed === false, 'Automatic master assignment was enabled.');
assert(contract.reviewSheet.requiredViews.length === visualSheet.requiredViews.length, 'Required-view count diverged from current visual brief.');
assert(contract.reviewSheet.requiredExpressions.length === visualSheet.requiredExpressions.length, 'Expression count diverged from current visual brief.');
assert(contract.reviewTests.length === 10, 'Ricco contract must define ten review tests.');
assert(contract.reviewTests.filter((review) => review.severity === 'BLOCKING').length === 9, 'Ricco contract must define nine blocking tests.');
assert(contract.humanDecision.current === 'REVIEW_REQUIRED', 'Human decision was prefilled.');
assert(contract.currentState.candidateSheets === 0, 'A candidate sheet was claimed without an artifact.');
assert(contract.currentState.imageBytesPresent === false, 'Image bytes were claimed without an artifact.');
assert(contract.currentState.externalExecutionUsed === false, 'External execution was claimed.');
assert(contract.currentState.masterApproved === false, 'Ricco master was automatically approved.');
assert(contract.currentState.characterMastersApproved === 0, 'Character master counter drifted.');
assert(contract.currentState.locationMastersApproved === 0, 'Location master counter drifted.');
assert(contract.currentState.voiceMastersApproved === 0, 'Voice master counter drifted.');

for (const forbidden of ['Free-for-All', 'Simpsons', 'Family Guy', 'South Park', 'Pixar', 'Disney', 'Ghibli']) {
  assert(!new RegExp(forbidden, 'i').test(contract.promptContract.positivePrompt), `Named style leaked into positive prompt: ${forbidden}`);
}
assert(/direct imitation of any existing series or artist/i.test(contract.promptContract.negativePrompt), 'Originality boundary is missing from the negative prompt.');
assert(!text(contract).includes('"masterApproved":true'), 'Contract contains a hidden automatic approval.');

for (const marker of [
  'data-testid="ricco-master-review"',
  'EXECUTION BLOCKED',
  '0/1 Kandidaten',
  'REVIEW_REQUIRED',
  'data-testid="ricco-source-count"',
  'data-testid="ricco-review-tests"',
  'data-testid="ricco-zero-state"'
]) assert(reviewUi.includes(marker), `Ricco review UI marker missing: ${marker}`);
assert(!reviewUi.includes('<img'), 'Ricco contract route must not contain image bytes or image elements before a candidate exists.');

console.log(JSON.stringify({
  status: 'pass',
  repository: truth.repository,
  gate: 'LR5',
  workPackage: 'LR5.1',
  parentTrackingIssue: 82,
  trackingIssue: 88,
  subject: 'char_ricco',
  sourceCount: inventory.sources.length,
  conflictCount: inventory.resolvedConflicts.length,
  requiredViews: contract.reviewSheet.requiredViews.length,
  requiredExpressions: contract.reviewSheet.requiredExpressions.length,
  reviewTests: contract.reviewTests.length,
  blockingTests: contract.reviewTests.filter((review) => review.severity === 'BLOCKING').length,
  candidateSheets: 0,
  imageBytesPresent: false,
  externalExecutionUsed: false,
  masterApproved: false,
  executionStatus: 'BLOCKED_PENDING_HUMAN_CONTRACT_REVIEW'
}, null, 2));
