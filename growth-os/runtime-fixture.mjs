import { syntheticBaseline, syntheticEpisodePackage, syntheticMetrics } from './fixture.mjs';

export const RUNTIME_FIXED_TIMESTAMP = '2026-07-11T12:00:00.000Z';

export const runtimeRetentionPolicies = Object.freeze([
  Object.freeze({ retentionClass: 'EPHEMERAL_7D', days: 7, deletionMode: 'EXPIRE_METADATA_ONLY', humanApprovalRequired: false }),
  Object.freeze({ retentionClass: 'OPERATIONAL_30D', days: 30, deletionMode: 'DELETE_AFTER_VERIFIED_BACKUP', humanApprovalRequired: true }),
  Object.freeze({ retentionClass: 'AUDIT_365D', days: 365, deletionMode: 'MANUAL_REVIEW', humanApprovalRequired: true }),
  Object.freeze({ retentionClass: 'LEGAL_HOLD', deletionMode: 'NO_AUTOMATIC_DELETION', humanApprovalRequired: true })
]);

export const runtimeOperationsConfig = Object.freeze({
  schemaVersion: 1,
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  mode: 'SHADOW',
  globalKillSwitch: false,
  moduleSwitches: Object.freeze({
    core: true,
    data: true,
    analytics: true,
    signals: true,
    orchestrator: true,
    cockpit: true
  }),
  recoveryObjectives: Object.freeze({
    rpoMinutesTarget: 60,
    rtoMinutesTarget: 120,
    evidenceStatus: 'NOT_PROVEN'
  }),
  retentionPolicies: runtimeRetentionPolicies
});

export const runtimeProviderManifests = Object.freeze([
  Object.freeze({
    schemaVersion: 1,
    providerId: 'meta',
    displayName: 'Meta Sandbox Slot',
    adapterClass: 'DIRECT_PLATFORM',
    authState: 'SANDBOX_READY',
    accountAlias: 'sandbox_meta_primary',
    capabilities: Object.freeze(['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'REPLIES', 'WEBHOOKS']),
    secretRequirements: Object.freeze([
      Object.freeze({ name: 'META_CLIENT_ID', required: true, status: 'AVAILABLE' }),
      Object.freeze({ name: 'META_CLIENT_SECRET', required: true, status: 'AVAILABLE' })
    ])
  }),
  Object.freeze({
    schemaVersion: 1,
    providerId: 'tiktok',
    displayName: 'TikTok Sandbox Slot',
    adapterClass: 'DIRECT_PLATFORM',
    authState: 'SANDBOX_READY',
    accountAlias: 'sandbox_tiktok_primary',
    capabilities: Object.freeze(['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'WEBHOOKS']),
    secretRequirements: Object.freeze([
      Object.freeze({ name: 'TIKTOK_CLIENT_KEY', required: true, status: 'AVAILABLE' }),
      Object.freeze({ name: 'TIKTOK_CLIENT_SECRET', required: true, status: 'AVAILABLE' })
    ])
  }),
  Object.freeze({
    schemaVersion: 1,
    providerId: 'youtube',
    displayName: 'YouTube Sandbox Slot',
    adapterClass: 'DIRECT_PLATFORM',
    authState: 'SANDBOX_READY',
    accountAlias: 'sandbox_youtube_primary',
    capabilities: Object.freeze(['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'REPLIES', 'WEBHOOKS']),
    secretRequirements: Object.freeze([
      Object.freeze({ name: 'YOUTUBE_CLIENT_ID', required: true, status: 'AVAILABLE' }),
      Object.freeze({ name: 'YOUTUBE_CLIENT_SECRET', required: true, status: 'AVAILABLE' })
    ])
  })
]);

export function buildRuntimeFixture(scenario = 'HAPPY_PATH', overrides = {}) {
  return {
    schemaVersion: 1,
    runId: `runtime_${scenario.toLowerCase()}`,
    tenantId: 'tenant_demo',
    projectId: 'comic_factory',
    scenario,
    timestamp: RUNTIME_FIXED_TIMESTAMP,
    episodePackage: syntheticEpisodePackage,
    metrics: syntheticMetrics,
    baseline: syntheticBaseline,
    providerManifests: runtimeProviderManifests,
    operationsConfig: runtimeOperationsConfig,
    incidents: [],
    faultFixture: null,
    ...overrides
  };
}
