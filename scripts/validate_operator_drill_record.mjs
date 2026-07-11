import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const fail = (code) => {
  throw new Error(`[OPERATOR_DRILL:${code}]`);
};

const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const exactCommit = (value) => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);

export function validateOperatorDrillRecord(record) {
  if (!record || typeof record !== 'object') fail('RECORD_MISSING');
  if (record.schemaVersion !== 1) fail('SCHEMA');
  if (record.type !== 'comic-factory-operator-install-drill-record') fail('TYPE');
  if (record.repository !== 'Pagebabe/comic') fail('REPOSITORY');
  if (record.status === 'TEMPLATE_NOT_EXECUTED') fail('TEMPLATE_NOT_EXECUTED');
  if (record.status !== 'OBSERVED_DRILL_RECORDED') fail('STATUS');
  if (record.humanObservationRequired !== true) fail('HUMAN_OBSERVATION');
  if (record.secondPersonReviewRequired !== true) fail('SECOND_PERSON_REQUIREMENT');

  const environment = record.environment ?? {};
  if (!exactCommit(environment.testedCommit)) fail('EXACT_COMMIT');
  if (!nonEmpty(environment.operatorNameOrPseudonym)) fail('OPERATOR');
  if (!nonEmpty(environment.observerNameOrPseudonym)) fail('OBSERVER');
  if (environment.operatorNameOrPseudonym === environment.observerNameOrPseudonym) fail('OBSERVER_MUST_DIFFER');
  for (const key of [
    'startedAt',
    'completedAt',
    'operatingSystem',
    'operatingSystemVersion',
    'browser',
    'browserVersion',
    'device',
    'architecture',
    'publicOrLocalRoute'
  ]) {
    if (!nonEmpty(environment[key])) fail(`ENV_${key.toUpperCase()}`);
  }
  if (environment.freshMachine !== true) fail('FRESH_MACHINE_REQUIRED');

  const preflight = record.preflight ?? {};
  if (preflight.status !== 'READY_FOR_OBSERVED_DRILL') fail('PREFLIGHT_STATUS');
  if (!nonEmpty(preflight.reportPath)) fail('PREFLIGHT_REPORT');
  if (!Array.isArray(preflight.failedCheckIds) || preflight.failedCheckIds.length !== 0) fail('PREFLIGHT_FAILURES');
  if (preflight.mutatingActionsPerformed !== false) fail('PREFLIGHT_MUTATION');

  if (!Array.isArray(record.steps) || record.steps.length !== 10) fail('STEPS');
  const ids = new Set();
  for (const step of record.steps) {
    if (!nonEmpty(step.id) || ids.has(step.id)) fail('STEP_ID');
    ids.add(step.id);
    if (typeof step.passed !== 'boolean') fail(`STEP_${step.id}_PASS_STATE`);
    if (typeof step.helpRequired !== 'boolean') fail(`STEP_${step.id}_HELP_STATE`);
    if (!Array.isArray(step.evidence) || step.evidence.length === 0 || step.evidence.some((item) => !nonEmpty(item))) {
      fail(`STEP_${step.id}_EVIDENCE`);
    }
    if ((!step.passed || step.helpRequired) && !nonEmpty(step.notes)) fail(`STEP_${step.id}_NOTES`);
  }

  const expectedFailureStep = record.steps.find((step) => step.id === 'D08');
  if (!expectedFailureStep) fail('EXPECTED_FAILURE_STEP');
  if (typeof expectedFailureStep.expectedFailureObserved !== 'boolean') fail('EXPECTED_FAILURE_OBSERVED');
  if (typeof expectedFailureStep.recoveryExplained !== 'boolean') fail('RECOVERY_EXPLAINED');

  const result = record.result ?? {};
  const passedSteps = record.steps.filter((step) => step.passed).length;
  if (result.passedSteps !== passedSteps) fail('PASSED_STEP_COUNT');
  if (result.totalSteps !== 10) fail('TOTAL_STEP_COUNT');
  if (typeof result.undocumentedHelpUsed !== 'boolean') fail('UNDOCUMENTED_HELP_STATE');
  if (!Array.isArray(result.blockingFindings)) fail('BLOCKING_FINDINGS');
  if (!Array.isArray(result.requiredCorrections)) fail('REQUIRED_CORRECTIONS');
  if (result.secondPersonReviewed !== true) fail('SECOND_PERSON_REVIEW');

  const allowedDecisions = new Set(['OBSERVED_DRILL_PASSED', 'CORRECTIONS_REQUIRED', 'BLOCKED']);
  if (!allowedDecisions.has(result.decision)) fail('DECISION');

  const claims = record.claims ?? {};
  for (const key of [
    'productionReady',
    'beginnerReady',
    'creativeApprovalGranted',
    'imageGenerationAllowed',
    'growthOsIntegrated',
    'completeReviewedEpisodeExists'
  ]) {
    if (claims[key] !== false) fail(`FORBIDDEN_CLAIM_${key}`);
  }

  const drillPassed = result.decision === 'OBSERVED_DRILL_PASSED';
  if (drillPassed) {
    if (passedSteps !== 10) fail('PASSED_DECISION_WITH_FAILED_STEPS');
    if (record.steps.some((step) => step.helpRequired)) fail('PASSED_DECISION_WITH_HELP');
    if (result.undocumentedHelpUsed !== false) fail('PASSED_DECISION_WITH_UNDOCUMENTED_HELP');
    if (result.blockingFindings.length !== 0 || result.requiredCorrections.length !== 0) fail('PASSED_DECISION_WITH_FINDINGS');
    if (expectedFailureStep.expectedFailureObserved !== true || expectedFailureStep.recoveryExplained !== true) {
      fail('PASSED_DECISION_WITHOUT_FAILURE_RECOVERY');
    }
  } else if (result.requiredCorrections.length === 0 && result.blockingFindings.length === 0) {
    fail('FAILED_DECISION_WITHOUT_FINDINGS');
  }

  return {
    status: 'pass',
    recordStatus: record.status,
    decision: result.decision,
    drillPassed,
    testedCommit: environment.testedCommit,
    passedSteps,
    totalSteps: 10,
    secondPersonReviewed: true,
    readinessChanged: false,
    productionReady: false,
    beginnerReady: false,
    creativeApprovalGranted: false,
    imageGenerationAllowed: false,
    growthOsIntegrated: false,
    closureEligibleForSeparateReview: drillPassed
  };
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const recordPath = process.argv[2];
  if (!recordPath) {
    console.error('[OPERATOR_DRILL:PATH_REQUIRED]');
    process.exitCode = 1;
  } else {
    try {
      const record = JSON.parse(await readFile(recordPath, 'utf8'));
      console.log(JSON.stringify(validateOperatorDrillRecord(record), null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
