import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCapabilityMatrix,
  buildConnectorPortfolioReadiness,
  buildConnectorReadiness,
  buildRequestPlan,
  classifyConnectorError,
  createProviderManifest,
  evaluateRateLimitBudget,
  normalizeCommunityEnvelope,
  normalizeMetricEnvelope,
  normalizePublishEnvelope,
  normalizeStatusEnvelope,
  registerShadowPlan,
  simulateProviderRequest,
  validateWebhookEnvelope
} from '../growth-os/connectors.mjs';

const manifest = (overrides = {}) => ({
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
  ],
  ...overrides
});

const planInput = (overrides = {}) => ({
  manifest: manifest(),
  capability: 'PUBLISH',
  method: 'POST',
  path: '/sandbox/media/publish',
  payload: { variantAlias: 'sandbox_variant_001', caption: 'Synthetic caption' },
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  requestedAt: '2026-07-11T11:00:00.000Z',
  idempotencySeed: 'campaign_demo:content_001',
  ...overrides
});

test('provider manifest normalization is deterministic', () => {
  assert.deepEqual(createProviderManifest(manifest()), createProviderManifest(manifest()));
});

test('provider slot rejects undeclared capabilities', () => {
  assert.throws(() => createProviderManifest(manifest({ providerId: 'postiz', capabilities: ['REPLIES'] })), /not declared/);
});

test('secret and credential values are forbidden', () => {
  assert.throws(() => createProviderManifest(manifest({ accessToken: 'forbidden' })), /Secret or credential value/);
  assert.throws(() => buildRequestPlan(planInput({ payload: { authorization: 'Bearer nope' } })), /Secret or credential value/);
});

test('real-looking account ids are rejected', () => {
  assert.throws(() => createProviderManifest(manifest({ accountAlias: 'sandbox_account_123456' })), /synthetic sandbox aliases/);
});

test('capability matrix exposes support without executability', () => {
  const matrix = buildCapabilityMatrix([manifest()]);
  const publish = matrix.providers[0].capabilities.find((item) => item.capability === 'PUBLISH');
  assert.equal(publish.supported, true);
  assert.equal(publish.sandboxPlannable, true);
  assert.equal(publish.executable, false);
  assert.equal(matrix.networkAllowed, false);
});

test('connector readiness blocks missing required secret status', () => {
  const readiness = buildConnectorReadiness(manifest({ secretRequirements: [{ name: 'META_CLIENT_ID', required: true, status: 'MISSING' }] }));
  assert.equal(readiness.status, 'BLOCKED');
  assert.deepEqual(readiness.missingRequiredSecretNames, ['META_CLIENT_ID']);
  assert.equal(readiness.credentialValuesIncluded, false);
});

test('connector readiness never claims live readiness', () => {
  const readiness = buildConnectorReadiness(manifest());
  assert.equal(readiness.status, 'SANDBOX_READY');
  assert.equal(readiness.providerRuntimeVerified, false);
  assert.equal(readiness.liveReady, false);
});

test('request plans are deterministic and shadow only', () => {
  const left = buildRequestPlan(planInput());
  const right = buildRequestPlan(planInput());
  assert.deepEqual(left, right);
  assert.equal(left.state, 'PLANNED_SHADOW');
  assert.equal(left.endpointBase, null);
  assert.equal(left.networkAllowed, false);
  assert.equal(left.executionAllowed, false);
  assert.equal(left.liveActionsAllowed, false);
});

test('request plan rejects unsupported capabilities', () => {
  const limited = manifest({ capabilities: ['STATUS'] });
  assert.throws(() => buildRequestPlan(planInput({ manifest: limited })), /not supported/);
});

test('request plan blocks connectors without sandbox readiness', () => {
  assert.throws(() => buildRequestPlan(planInput({ manifest: manifest({ authState: 'DISCONNECTED' }) })), /not sandbox ready/);
});

test('request plan rejects absolute urls and invalid methods', () => {
  assert.throws(() => buildRequestPlan(planInput({ path: 'https://example.com/publish' })), /relative sandbox request paths/);
  assert.throws(() => buildRequestPlan(planInput({ method: 'GET' })), /not allowed for capability/);
});

test('idempotency prevents duplicate shadow registration', () => {
  const plan = buildRequestPlan(planInput());
  assert.equal(registerShadowPlan(plan, []).accepted, true);
  const duplicate = registerShadowPlan(plan, [plan.idempotencyKey]);
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.reason, 'IDEMPOTENT_DUPLICATE');
  assert.equal(duplicate.executionPerformed, false);
});

test('rate limit allows requests inside budget', () => {
  const result = evaluateRateLimitBudget({
    limit: 10, used: 4, requestedUnits: 2,
    windowStartedAt: '2026-07-11T10:00:00.000Z', windowSeconds: 3600,
    asOf: '2026-07-11T10:30:00.000Z'
  });
  assert.equal(result.decision, 'ALLOW_SHADOW_PLAN');
  assert.equal(result.remaining, 4);
  assert.equal(result.executionAllowed, false);
});

test('rate limit produces deterministic backoff when exhausted', () => {
  const result = evaluateRateLimitBudget({
    limit: 10, used: 10, requestedUnits: 1,
    windowStartedAt: '2026-07-11T10:00:00.000Z', windowSeconds: 3600,
    asOf: '2026-07-11T10:30:00.000Z'
  });
  assert.equal(result.decision, 'BACKOFF');
  assert.equal(result.retryAfterSeconds, 1800);
});

test('expired rate window resets effective usage', () => {
  const result = evaluateRateLimitBudget({
    limit: 10, used: 10, requestedUnits: 1,
    windowStartedAt: '2026-07-11T10:00:00.000Z', windowSeconds: 3600,
    asOf: '2026-07-11T11:00:00.000Z'
  });
  assert.equal(result.decision, 'ALLOW_SHADOW_PLAN');
  assert.equal(result.effectiveUsed, 0);
});

test('connector errors are classified predictably', () => {
  assert.equal(classifyConnectorError({ status: 401 }), 'AUTH');
  assert.equal(classifyConnectorError({ status: 429 }), 'RATE_LIMIT');
  assert.equal(classifyConnectorError({ status: 422 }), 'VALIDATION');
  assert.equal(classifyConnectorError({ status: 503 }), 'RETRYABLE');
  assert.equal(classifyConnectorError({ status: 404 }), 'PERMANENT');
  assert.equal(classifyConnectorError({ code: 'something_new' }), 'UNKNOWN');
});

test('normalized provider envelopes remain simulated and synthetic', () => {
  const common = {
    providerId: 'meta', accountAlias: 'sandbox_meta_primary', sourceRequestId: 'request_001',
    observedAt: '2026-07-11T11:01:00.000Z', provenance: 'synthetic_fixture'
  };
  const publish = normalizePublishEnvelope({ ...common, remoteObjectAlias: 'sandbox_media_001', publishState: 'ACCEPTED_SHADOW' });
  const status = normalizeStatusEnvelope({ ...common, remoteObjectAlias: 'sandbox_media_001', status: 'READY_SHADOW' });
  const metrics = normalizeMetricEnvelope({ ...common, remoteObjectAlias: 'sandbox_media_001', metrics: { views: 100, likes: 10, comments: 2, shares: 3, watchSeconds: 1200 } });
  assert.equal(publish.state, 'SIMULATED');
  assert.equal(status.state, 'SIMULATED');
  assert.equal(metrics.state, 'SIMULATED');
  assert.equal(metrics.realAccountIdIncluded, false);
});

test('community envelope contains categories but no raw text or profiles', () => {
  const result = normalizeCommunityEnvelope({
    providerId: 'youtube', accountAlias: 'sandbox_youtube_primary', sourceRequestId: 'request_community_001',
    observedAt: '2026-07-11T11:02:00.000Z', provenance: 'synthetic_fixture',
    items: [{ itemAlias: 'sandbox_comment_001', category: 'IDEA', sentiment: 'POSITIVE' }]
  });
  assert.equal(result.items[0].rawTextIncluded, false);
  assert.equal(result.items[0].personalProfileIncluded, false);
  assert.equal(JSON.stringify(result).includes('messageBody'), false);
});

test('valid webhook envelope is accepted only as simulated', () => {
  const result = validateWebhookEnvelope({
    providerId: 'tiktok', accountAlias: 'sandbox_tiktok_primary', eventId: 'evt_001', eventType: 'status.updated',
    occurredAt: '2026-07-11T11:00:00.000Z', receivedAt: '2026-07-11T11:00:05.000Z', signatureStatus: 'SIMULATED_VALID'
  }, { asOf: '2026-07-11T11:01:00.000Z' });
  assert.equal(result.accepted, true);
  assert.equal(result.state, 'SIMULATED');
  assert.equal(result.networkUsed, false);
});

test('webhook replay, stale and future events are rejected', () => {
  const base = {
    providerId: 'tiktok', accountAlias: 'sandbox_tiktok_primary', eventId: 'evt_001', eventType: 'status.updated',
    occurredAt: '2026-07-11T11:00:00.000Z', receivedAt: '2026-07-11T11:00:05.000Z', signatureStatus: 'SIMULATED_VALID'
  };
  assert.throws(() => validateWebhookEnvelope(base, { asOf: '2026-07-11T11:01:00.000Z', seenEventIds: ['evt_001'] }), /replay/);
  assert.throws(() => validateWebhookEnvelope(base, { asOf: '2026-07-11T12:00:00.000Z', maxAgeSeconds: 900 }), /stale/);
  assert.throws(() => validateWebhookEnvelope({ ...base, occurredAt: '2026-07-11T11:10:00.000Z' }, { asOf: '2026-07-11T11:01:00.000Z' }), /future/);
});

test('provider sandbox simulates without network or execution', () => {
  const plan = buildRequestPlan(planInput());
  const result = simulateProviderRequest(plan, { resultCode: 'SYNTHETIC_ACCEPTED' });
  assert.equal(result.state, 'SIMULATED');
  assert.equal(result.networkUsed, false);
  assert.equal(result.executionPerformed, false);
  assert.equal(result.liveActionPerformed, false);
});

test('portfolio readiness reports zero live connectors', () => {
  const portfolio = buildConnectorPortfolioReadiness([
    manifest(),
    manifest({ providerId: 'youtube', displayName: 'YouTube Sandbox Slot', accountAlias: 'sandbox_youtube_primary', authState: 'UNCONFIGURED', secretRequirements: [] })
  ]);
  assert.equal(portfolio.summary.total, 2);
  assert.equal(portfolio.summary.sandboxReady, 1);
  assert.equal(portfolio.summary.blocked, 1);
  assert.equal(portfolio.summary.liveReady, 0);
  assert.equal(portfolio.liveActionsAllowed, false);
});
