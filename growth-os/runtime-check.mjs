import { mkdir, writeFile } from 'node:fs/promises';
import { compareRuntimeBundles, replayRuntimeEvidence, runIntegratedShadowRuntime } from './runtime.mjs';
import { compareFullRuntimeBundles, replayFullRuntimeEvidence, runFullShadowRuntime } from './runtime-full.mjs';
import { buildRuntimeFixture } from './runtime-fixture.mjs';

const scenarios = ['HAPPY_PATH', 'RATE_LIMIT', 'AUTH_BLOCKED', 'WEBHOOK_REPLAY', 'INCIDENT_LOCKDOWN'];
const expectedStatuses = Object.freeze({
  HAPPY_PATH: 'COMPLETED',
  RATE_LIMIT: 'COMPLETED_WITH_BACKOFF',
  AUTH_BLOCKED: 'BLOCKED_AUTH',
  WEBHOOK_REPLAY: 'QUARANTINED',
  INCIDENT_LOCKDOWN: 'BLOCKED_INCIDENT'
});

const canonicalBase = runIntegratedShadowRuntime(buildRuntimeFixture('HAPPY_PATH'));
const repeatedBase = runIntegratedShadowRuntime(buildRuntimeFixture('HAPPY_PATH'));
const canonicalFull = runFullShadowRuntime(buildRuntimeFixture('HAPPY_PATH'));
const repeatedFull = runFullShadowRuntime(buildRuntimeFixture('HAPPY_PATH'));

if (!compareRuntimeBundles(canonicalBase, repeatedBase).deterministic) throw new Error('Base runtime is not deterministic');
if (!compareFullRuntimeBundles(canonicalFull, repeatedFull).deterministic) throw new Error('Full runtime is not deterministic');
if (!replayRuntimeEvidence(canonicalBase).replayMatched) throw new Error('Base runtime replay mismatch');
if (!replayFullRuntimeEvidence(canonicalFull).replayMatched) throw new Error('Full runtime replay mismatch');

const scenarioReports = scenarios.map((scenario) => {
  const full = runFullShadowRuntime(buildRuntimeFixture(scenario));
  const replay = replayFullRuntimeEvidence(full);
  if (full.finalState.status !== expectedStatuses[scenario]) throw new Error(`Unexpected terminal status for ${scenario}: ${full.finalState.status}`);
  if (!replay.replayMatched) throw new Error(`Replay mismatch for ${scenario}`);
  if (full.externalActions.networkUsed || full.externalActions.oauthConnected || full.externalActions.livePublishing) {
    throw new Error(`External action flag changed for ${scenario}`);
  }
  return Object.freeze({
    scenario,
    status: full.finalState.status,
    traceId: full.traceId,
    journalEntries: full.journal.length,
    journalHash: full.journalHash,
    finalStateHash: full.finalStateHash,
    analyticsHash: full.analyticsHash,
    bundleHash: full.bundleHash,
    analyticsClassification: full.finalState.analyticsClassification,
    connectorPlans: full.finalState.connectorPlanCount,
    simulations: full.finalState.simulationCount,
    backoffs: full.finalState.backoffCount,
    authBlocks: full.finalState.authBlockedCount,
    webhookReplayDetected: full.finalState.webhookReplayDetected,
    replayMatched: replay.replayMatched,
    externalActionsExecuted: false
  });
});

const evidence = Object.freeze({
  schemaVersion: 1,
  ruleVersion: 'mkt0-009.full.v1',
  provenance: 'synthetic_fixture',
  generatedFromHiddenClock: false,
  scenarios: scenarioReports,
  canonicalHappyPath: canonicalFull,
  determinism: Object.freeze({
    base: compareRuntimeBundles(canonicalBase, repeatedBase),
    full: compareFullRuntimeBundles(canonicalFull, repeatedFull)
  }),
  replay: Object.freeze({
    base: replayRuntimeEvidence(canonicalBase),
    full: replayFullRuntimeEvidence(canonicalFull)
  }),
  externalActions: Object.freeze({
    networkUsed: false,
    oauthConnected: false,
    livePublishing: false,
    publicReplies: false,
    deletes: false,
    directMessages: false,
    realImports: false
  }),
  nonClaims: Object.freeze([
    'NO_PROVIDER_RUNTIME_VERIFIED',
    'NO_REAL_PLATFORM_DATA',
    'NO_OAUTH_CONNECTED',
    'NO_LIVE_ACTION_EXECUTED',
    'NO_PRODUCTION_OR_CANON_CHANGE',
    'NO_REMOTE_DATABASE_OR_STORAGE_USED'
  ])
});

await mkdir(new URL('../output/growth-os/', import.meta.url), { recursive: true });
await writeFile(new URL('../output/growth-os/mkt0-shadow-runtime.json', import.meta.url), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(JSON.stringify({
  status: 'pass',
  ruleVersion: evidence.ruleVersion,
  scenarios: scenarioReports.map((item) => ({ scenario: item.scenario, status: item.status, replayMatched: item.replayMatched })),
  baseDeterministic: evidence.determinism.base.deterministic,
  fullDeterministic: evidence.determinism.full.deterministic,
  baseReplayMatched: evidence.replay.base.replayMatched,
  fullReplayMatched: evidence.replay.full.replayMatched,
  analyticsRadarCompleted: canonicalFull.finalState.analyticsRadarCompleted,
  networkUsed: false,
  oauthConnected: false,
  liveActionsExecuted: false,
  artifact: 'output/growth-os/mkt0-shadow-runtime.json'
}, null, 2));
