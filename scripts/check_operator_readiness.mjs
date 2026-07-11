import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const READINESS_PATH = path.join(ROOT, 'project', 'operator-readiness.json');
const ACADEMY_STATUS_PATH = path.join(ROOT, 'project', 'production-academy-status.json');
const OUTPUT_PATH = path.join(ROOT, 'output', 'operator-readiness', 'readiness-check.json');

const EXPECTED_GATE_IDS = [
  'installation_reproducible',
  'beginner_onboarding',
  'canon_and_approval_boundaries',
  'master_workflows_guided',
  'episode_workflow_guided',
  'qa_and_visible_reviews',
  'backup_delete_restore',
  'failure_diagnosis_and_recovery',
  'export_and_handoff_reproducible',
  'external_novice_acceptance'
];

const ALLOWED_STATUSES = new Set([
  'PROVEN',
  'IN_PROGRESS',
  'HUMAN_APPROVAL_REQUIRED',
  'EXTERNAL_INPUT_REQUIRED',
  'BLOCKED',
  'NOT_STARTED',
  'NOT_APPLICABLE'
]);

const REQUIRED_EVIDENCE_FIELDS = [
  'source',
  'test',
  'artifact',
  'runtimeProof',
  'visualCountercheck'
];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateOperatorReadiness(readiness, academyStatus) {
  assert(readiness.schemaVersion === 1, 'Operator readiness schemaVersion must be 1.');
  assert(readiness.repository === 'Pagebabe/comic', 'Operator readiness repository is invalid.');
  assert(readiness.programIssue === 101, 'Operator readiness must link to program Issue #101.');
  assert(readiness.operatorIssue === 95, 'Operator readiness must link to operator Issue #95.');
  assert(readiness.trackingIssue === 102, 'Operator readiness must link to tracking Issue #102.');

  assert(Array.isArray(readiness.statusVocabulary), 'Status vocabulary is required.');
  assert(readiness.statusVocabulary.length === ALLOWED_STATUSES.size, 'Status vocabulary count changed.');
  for (const status of readiness.statusVocabulary) {
    assert(ALLOWED_STATUSES.has(status), `Unknown status vocabulary value: ${status}`);
  }

  assert(Array.isArray(readiness.gates) && readiness.gates.length === 10, 'Exactly ten readiness gates are required.');
  assert(
    JSON.stringify(readiness.gates.map((gate) => gate.id)) === JSON.stringify(EXPECTED_GATE_IDS),
    'Readiness gate order or IDs changed.'
  );
  assert(new Set(readiness.gates.map((gate) => gate.id)).size === 10, 'Readiness gate IDs must be unique.');

  for (const [index, gate] of readiness.gates.entries()) {
    assert(gate.number === index + 1, `Readiness gate ${gate.id} has an invalid number.`);
    assert(isNonEmptyString(gate.title), `Readiness gate ${gate.id} needs a title.`);
    assert(ALLOWED_STATUSES.has(gate.status), `Readiness gate ${gate.id} has an invalid status.`);
    assert(isNonEmptyString(gate.scope), `Readiness gate ${gate.id} needs a scope.`);

    if (gate.status === 'PROVEN') {
      assert(gate.evidence && typeof gate.evidence === 'object', `PROVEN gate ${gate.id} needs evidence.`);
      for (const field of REQUIRED_EVIDENCE_FIELDS) {
        assert(isNonEmptyString(gate.evidence[field]), `PROVEN gate ${gate.id} is missing evidence.${field}.`);
      }
    } else {
      assert(isNonEmptyString(gate.blocker), `Open gate ${gate.id} needs a blocker.`);
      assert(isNonEmptyString(gate.nextAction), `Open gate ${gate.id} needs a nextAction.`);
    }
  }

  const installationGate = readiness.gates[0];
  const noviceGate = readiness.gates[9];
  assert(installationGate.status === 'IN_PROGRESS', 'Installation may not be PROVEN before an independent fresh installation run.');
  assert(noviceGate.status === 'EXTERNAL_INPUT_REQUIRED', 'Gate 10 must remain EXTERNAL_INPUT_REQUIRED before a real novice test.');
  assert(!noviceGate.evidence, 'Gate 10 may not carry fake evidence before the external novice test.');

  const provenGateCount = readiness.gates.filter((gate) => gate.status === 'PROVEN').length;
  assert(provenGateCount === 8, `Expected eight technically proven gates, found ${provenGateCount}.`);
  assert(readiness.summary?.provenGateCount === provenGateCount, 'Summary provenGateCount does not match gates.');
  assert(readiness.summary?.requiredGateCount === 10, 'Summary requiredGateCount must be 10.');
  assert(readiness.summary?.technicalWorkflowReady === true, 'Technical workflow must remain marked ready.');
  assert(readiness.summary?.productionCreativeReady === false, 'Creative production may not be marked ready.');
  assert(readiness.summary?.externalNoviceAcceptanceComplete === false, 'External novice acceptance may not be marked complete.');
  assert(readiness.summary?.overallReady === false, 'Overall readiness may not be true while required gates are open.');

  const truth = readiness.currentTruth;
  assert(truth?.activeGate === 'LR5.1', 'Active creative gate must remain LR5.1.');
  assert(truth?.riccoContractStatus === 'CONTRACT_READY_REVIEW_REQUIRED', 'Ricco contract status drifted.');
  assert(truth?.riccoContractApproved === false, 'Ricco contract may not be automatically approved.');
  assert(truth?.riccoCandidates === 0, 'No Ricco candidate may be claimed.');
  assert(truth?.riccoCandidateLimit === 1, 'Ricco candidate limit must remain one.');
  assert(truth?.imageGenerationAllowed === false, 'Image generation must remain blocked.');
  assert(truth?.characterMastersApproved === 0, 'No character master may be claimed.');
  assert(truth?.locationMastersApproved === 0, 'No location master may be claimed.');
  assert(truth?.voiceMastersApproved === 0, 'No voice master may be claimed.');
  assert(truth?.finishedEpisodes === 0, 'No finished episode may be claimed.');
  assert(truth?.growthOsMerged === false, 'Growth OS may not be claimed as merged.');
  assert(truth?.livePublishingEnabled === false, 'Live publishing may not be enabled.');

  assert(academyStatus.schemaVersion === 2, 'Production Academy status schemaVersion must be 2.');
  assert(academyStatus.status === 'publicly_proven_production_enablement_ready', 'Academy status is not publicly proven.');
  assert(academyStatus.provenHead === readiness.evaluatedAgainst.mainCommit, 'Readiness commit does not match Academy status.');
  assert(academyStatus.provenWorkflowRun === readiness.evaluatedAgainst.academyPagesRun, 'Readiness Pages run does not match Academy status.');
  assert(academyStatus.proof?.artifactId === readiness.evaluatedAgainst.academyArtifactId, 'Readiness artifact ID does not match Academy status.');
  assert(academyStatus.proof?.artifactDigest === readiness.evaluatedAgainst.academyArtifactDigest, 'Readiness artifact digest does not match Academy status.');

  const academyTruth = academyStatus.currentCreativeTruth;
  for (const field of [
    'riccoContractApproved',
    'riccoCandidates',
    'riccoCandidateLimit',
    'imageGenerationAllowed',
    'characterMastersApproved',
    'locationMastersApproved',
    'voiceMastersApproved',
    'finishedEpisodes'
  ]) {
    assert(academyTruth?.[field] === truth?.[field], `Academy and readiness truth differ at ${field}.`);
  }

  assert(Array.isArray(readiness.operationalRisks) && readiness.operationalRisks.length >= 1, 'Operational risks are required.');
  const reporterRisk = readiness.operationalRisks.find((risk) => risk.id === 'deploy-proof-reporter-collision');
  assert(reporterRisk?.issue === 103, 'Reporter collision must link to Issue #103.');
  assert(reporterRisk?.status === 'OPEN', 'Reporter collision must remain open until fixed and tested.');
  assert(reporterRisk?.blocksOverallReady === true, 'Reporter collision must block overall readiness.');

  assert(readiness.nextHumanGate?.issue === 88, 'Next human gate must remain Issue #88.');
  assert(readiness.nextHumanGate?.requiredDecision === 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'Required Ricco decision changed.');

  return {
    schemaVersion: 1,
    status: 'pass',
    repository: readiness.repository,
    programIssue: readiness.programIssue,
    trackingIssue: readiness.trackingIssue,
    provenGateCount,
    requiredGateCount: readiness.gates.length,
    technicalWorkflowReady: readiness.summary.technicalWorkflowReady,
    productionCreativeReady: readiness.summary.productionCreativeReady,
    externalNoviceAcceptanceComplete: readiness.summary.externalNoviceAcceptanceComplete,
    overallReady: readiness.summary.overallReady,
    activeCreativeGate: truth.activeGate,
    riccoCandidates: truth.riccoCandidates,
    characterMastersApproved: truth.characterMastersApproved,
    locationMastersApproved: truth.locationMastersApproved,
    voiceMastersApproved: truth.voiceMastersApproved,
    finishedEpisodes: truth.finishedEpisodes,
    openOperationalRisks: readiness.operationalRisks.filter((risk) => risk.status === 'OPEN').length,
    evaluatedCommit: readiness.evaluatedAgainst.mainCommit,
    evaluatedPagesRun: readiness.evaluatedAgainst.academyPagesRun
  };
}

export async function checkOperatorReadiness({ writeOutput = true } = {}) {
  const readiness = JSON.parse(await readFile(READINESS_PATH, 'utf8'));
  const academyStatus = JSON.parse(await readFile(ACADEMY_STATUS_PATH, 'utf8'));

  for (const relativePath of [
    'docs/OPERATOR_READINESS_STATUS.md',
    'docs/NULLWISSEN_ACCEPTANCE_PROTOCOL_DE.md'
  ]) {
    const absolutePath = path.join(ROOT, relativePath);
    await access(absolutePath);
    const text = await readFile(absolutePath, 'utf8');
    assert(text.length >= 1500, `${relativePath} is unexpectedly short.`);
  }

  const readinessDoc = await readFile(path.join(ROOT, 'docs', 'OPERATOR_READINESS_STATUS.md'), 'utf8');
  const noviceProtocol = await readFile(path.join(ROOT, 'docs', 'NULLWISSEN_ACCEPTANCE_PROTOCOL_DE.md'), 'utf8');
  assert(readinessDoc.includes('OVERALL_READY_FALSE'), 'Readiness document must expose the overall false boundary.');
  assert(readinessDoc.includes('CONTRACT_APPROVED_FOR_ONE_CANDIDATE'), 'Readiness document must expose the next human decision.');
  assert(noviceProtocol.includes('EXTERNAL_INPUT_REQUIRED'), 'Novice protocol must remain externally gated.');
  assert(noviceProtocol.includes('Ein simuliertes LLM'), 'Novice protocol must reject simulated testers.');

  const report = {
    ...validateOperatorReadiness(readiness, academyStatus),
    checkedAt: new Date().toISOString()
  };

  if (writeOutput) {
    await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  }

  return report;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    console.log(JSON.stringify(await checkOperatorReadiness()));
  } catch (error) {
    console.error(JSON.stringify({ status: 'error', message: error.message }));
    process.exitCode = 1;
  }
}
