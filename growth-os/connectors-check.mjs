import { mkdirSync, writeFileSync } from 'node:fs';
import {
  buildCapabilityMatrix,
  buildConnectorPortfolioReadiness,
  buildRequestPlan,
  evaluateRateLimitBudget,
  normalizeMetricEnvelope,
  normalizePublishEnvelope,
  registerShadowPlan,
  simulateProviderRequest,
  validateWebhookEnvelope
} from './connectors.mjs';

const providers = [
  {
    schemaVersion: 1,
    providerId: 'postiz',
    displayName: 'Postiz Sandbox Slot',
    adapterClass: 'AGGREGATOR',
    authState: 'SANDBOX_READY',
    accountAlias: 'sandbox_postiz_primary',
    capabilities: ['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'WEBHOOKS'],
    secretRequirements: [
      { name: 'POSTIZ_API_TOKEN', required: true, status: 'AVAILABLE' }
    ]
  },
  {
    schemaVersion: 1,
    providerId: 'meta',
    displayName: 'Meta Sandbox Slot',
    adapterClass: 'DIRECT_PLATFORM',
    authState: 'SANDBOX_READY',
    accountAlias: 'sandbox_meta_primary',
    capabilities: ['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'REPLIES', 'WEBHOOKS'],
    secretRequirements: [
      { name: 'META_CLIENT_ID', required: true, status: 'AVAILABLE' },
      { name: 'META_CLIENT_SECRET', required: true, status: 'AVAILABLE' }
    ]
  },
  {
    schemaVersion: 1,
    providerId: 'tiktok',
    displayName: 'TikTok Sandbox Slot',
    adapterClass: 'DIRECT_PLATFORM',
    authState: 'UNCONFIGURED',
    accountAlias: 'sandbox_tiktok_primary',
    capabilities: ['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'WEBHOOKS'],
    secretRequirements: [
      { name: 'TIKTOK_CLIENT_KEY', required: true, status: 'MISSING' },
      { name: 'TIKTOK_CLIENT_SECRET', required: true, status: 'MISSING' }
    ]
  },
  {
    schemaVersion: 1,
    providerId: 'youtube',
    displayName: 'YouTube Sandbox Slot',
    adapterClass: 'DIRECT_PLATFORM',
    authState: 'UNCONFIGURED',
    accountAlias: 'sandbox_youtube_primary',
    capabilities: ['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'REPLIES', 'WEBHOOKS'],
    secretRequirements: [
      { name: 'YOUTUBE_CLIENT_ID', required: true, status: 'MISSING' },
      { name: 'YOUTUBE_CLIENT_SECRET', required: true, status: 'MISSING' }
    ]
  }
];

const capabilityMatrix = buildCapabilityMatrix(providers);
const requestPlan = buildRequestPlan({
  manifest: providers[1],
  capability: 'PUBLISH',
  method: 'POST',
  path: '/sandbox/media/publish',
  payload: { variantAlias: 'sandbox_variant_001', caption: 'Synthetic launch caption' },
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  requestedAt: '2026-07-11T12:00:00.000Z',
  idempotencySeed: 'campaign_demo:content_001'
});
const registration = registerShadowPlan(requestPlan, []);
const duplicateRegistration = registerShadowPlan(requestPlan, [requestPlan.idempotencyKey]);
const rateLimit = evaluateRateLimitBudget({
  limit: 100,
  used: 98,
  requestedUnits: 3,
  windowStartedAt: '2026-07-11T11:30:00.000Z',
  windowSeconds: 3600,
  asOf: '2026-07-11T12:00:00.000Z'
});
const simulation = simulateProviderRequest(requestPlan, { resultCode: 'SYNTHETIC_ACCEPTED' });
const publishEnvelope = normalizePublishEnvelope({
  providerId: 'meta',
  accountAlias: 'sandbox_meta_primary',
  sourceRequestId: requestPlan.id,
  observedAt: '2026-07-11T12:00:01.000Z',
  provenance: 'synthetic_fixture',
  remoteObjectAlias: 'sandbox_media_001',
  publishState: 'ACCEPTED_SHADOW'
});
const metricEnvelope = normalizeMetricEnvelope({
  providerId: 'meta',
  accountAlias: 'sandbox_meta_primary',
  sourceRequestId: requestPlan.id,
  observedAt: '2026-07-11T12:10:00.000Z',
  provenance: 'synthetic_fixture',
  remoteObjectAlias: 'sandbox_media_001',
  metrics: { views: 1200, likes: 130, comments: 14, shares: 21, watchSeconds: 18400 }
});
const webhook = validateWebhookEnvelope({
  providerId: 'meta',
  accountAlias: 'sandbox_meta_primary',
  eventId: 'sandbox_webhook_001',
  eventType: 'media.status.updated',
  occurredAt: '2026-07-11T12:00:10.000Z',
  receivedAt: '2026-07-11T12:00:12.000Z',
  signatureStatus: 'SIMULATED_VALID'
}, { asOf: '2026-07-11T12:01:00.000Z' });
const portfolio = buildConnectorPortfolioReadiness(providers);

if (requestPlan.state !== 'PLANNED_SHADOW') throw new Error('Request plan left PLANNED_SHADOW');
if (simulation.state !== 'SIMULATED') throw new Error('Provider simulation did not end in SIMULATED');
if (registration.accepted !== true || duplicateRegistration.accepted !== false) throw new Error('Idempotency registration failed');
if (rateLimit.decision !== 'BACKOFF') throw new Error('Expected deterministic rate-limit backoff');
if (webhook.accepted !== true) throw new Error('Synthetic webhook was not accepted');
if (portfolio.summary.liveReady !== 0) throw new Error('Connector portfolio claimed live readiness');

const output = {
  schemaVersion: 1,
  ruleVersion: 'mkt0-008.v1',
  provenance: 'synthetic_fixture',
  capabilityMatrix,
  requestPlan,
  registration,
  duplicateRegistration,
  rateLimit,
  simulation,
  publishEnvelope,
  metricEnvelope,
  webhook,
  portfolio,
  networkUsed: false,
  oauthConnected: false,
  credentialsIncluded: false,
  liveActionsExecuted: false,
  providerRuntimeVerified: false
};

mkdirSync('output/growth-os', { recursive: true });
writeFileSync('output/growth-os/mkt0-connector-sandbox.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  status: 'pass',
  ruleVersion: output.ruleVersion,
  providers: output.portfolio.summary.total,
  sandboxReady: output.portfolio.summary.sandboxReady,
  blocked: output.portfolio.summary.blocked,
  requestState: output.requestPlan.state,
  simulationState: output.simulation.state,
  rateLimitDecision: output.rateLimit.decision,
  networkUsed: output.networkUsed,
  liveActionsExecuted: output.liveActionsExecuted
}));
