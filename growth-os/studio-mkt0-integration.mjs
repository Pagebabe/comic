import { canonicalJson, sha256 } from './handoff.mjs';
import { buildDirectionPackage } from './analytics.mjs';

export const STUDIO_MKT0_SCHEMA_VERSION = 1;
export const STUDIO_MKT0_CONTRACT_ID = 'comic-growth-os.studio-mkt0-handoff.v1';
export const STUDIO_MKT0_MODE = 'shadow';

export const STUDIO_MKT0_STATES = Object.freeze([
  'INVALID_PACKAGE',
  'INTEGRITY_FAILURE',
  'PRODUCTION_NOT_COMPLETE',
  'QA_BLOCKED',
  'HUMAN_REVIEW_REQUIRED',
  'POLICY_BLOCKED',
  'PLATFORM_SCOPE_BLOCKED',
  'DUPLICATE_IGNORED',
  'LIVE_GATE_VIOLATION',
  'READY_FOR_SHADOW',
  'SHADOW_INGESTED'
]);

export const LIVE_GATES_BLOCKED = Object.freeze({
  execution_mode: 'shadow',
  live_publishing_enabled: false,
  oauth_authorized: false,
  platform_accounts_connected: 0,
  human_live_approval: false,
  kill_switch: 'LIVE_PUBLISHING_DISABLED',
  publishing_adapter: 'ABSENT'
});

const ALLOWED_PLATFORMS = new Set(['tiktok', 'instagram_reels', 'youtube_shorts']);
const ALLOWED_ASPECT_RATIOS = new Set(['9:16', '1:1', '4:5', '16:9']);
const ALLOWED_FORMATS = new Set(['short_video', 'carousel_video']);
const ALLOWED_REF_PREFIXES = ['fixture://', 'studio-export://'];

export class StudioMkt0ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'StudioMkt0ValidationError';
    this.details = details;
  }
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new StudioMkt0ValidationError(`Missing or invalid object: ${field}`, { field });
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new StudioMkt0ValidationError(`Missing or invalid string: ${field}`, { field });
  return value.trim();
}

function requireNumber(value, field, { min = 0 } = {}) {
  if (!Number.isFinite(value) || value < min) throw new StudioMkt0ValidationError(`Missing or invalid number: ${field}`, { field, value });
  return value;
}

function requireTimestamp(value, field) {
  const text = requireString(value, field);
  if (!text.includes('T') || !Number.isFinite(Date.parse(text))) throw new StudioMkt0ValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
  return text;
}

function requireSha(value, field) {
  const digest = requireString(value, field).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(digest)) throw new StudioMkt0ValidationError(`Invalid SHA-256: ${field}`, { field, value });
  return digest;
}

function requireEnum(value, field, allowed) {
  const text = requireString(value, field);
  if (!allowed.has(text)) throw new StudioMkt0ValidationError(`Unsupported value: ${field}`, { field, value: text, allowed: [...allowed] });
  return text;
}

function requireRef(value, field) {
  const ref = requireString(value, field);
  const lower = ref.toLowerCase();
  if (lower.includes('../') || lower.includes('..\\')) throw new StudioMkt0ValidationError(`Path traversal is forbidden: ${field}`, { field, ref });
  if (/^(https?|file):\/\//i.test(ref)) throw new StudioMkt0ValidationError(`Network and file references are forbidden: ${field}`, { field, ref });
  if (!ALLOWED_REF_PREFIXES.some((prefix) => ref.startsWith(prefix))) throw new StudioMkt0ValidationError(`Unsupported asset reference: ${field}`, { field, ref });
  return ref;
}

function normalizePlatforms(value) {
  if (!Array.isArray(value) || value.length === 0) throw new StudioMkt0ValidationError('approved_platforms must be a non-empty array');
  return Object.freeze([...new Set(value.map((platform) => requireEnum(platform, 'approved_platforms[]', ALLOWED_PLATFORMS)))].sort());
}

function normalizeHooks(value) {
  if (!Array.isArray(value) || value.length === 0) throw new StudioMkt0ValidationError('hook_variants must be a non-empty array');
  const hooks = value.map((entry, index) => {
    const hook = requireObject(entry, `hook_variants[${index}]`);
    return Object.freeze({ id: requireString(hook.id, `hook_variants[${index}].id`), text: requireString(hook.text, `hook_variants[${index}].text`) });
  });
  if (new Set(hooks.map((hook) => hook.id)).size !== hooks.length) throw new StudioMkt0ValidationError('hook_variants ids must be unique');
  return Object.freeze(hooks.sort((a, b) => a.id.localeCompare(b.id)));
}

export function packagePayloadForIntegrity(input) {
  const payload = structuredClone(requireObject(input, 'StudioMkt0Package'));
  delete payload.integrity;
  return payload;
}

export function computeStudioMkt0Integrity(input) {
  return sha256(packagePayloadForIntegrity(input));
}

export function validateStudioMkt0Package(input) {
  const raw = requireObject(input, 'StudioMkt0Package');
  if (raw.schema_version !== STUDIO_MKT0_SCHEMA_VERSION) throw new StudioMkt0ValidationError('Unsupported schema_version', { schema_version: raw.schema_version });
  if (raw.contract_id !== STUDIO_MKT0_CONTRACT_ID) throw new StudioMkt0ValidationError('Unsupported contract_id', { contract_id: raw.contract_id });
  if (raw.mode !== STUDIO_MKT0_MODE) throw new StudioMkt0ValidationError('Only shadow mode is allowed', { mode: raw.mode });

  const format = requireObject(raw.format, 'format');
  const window = requireObject(raw.publishing_window, 'publishing_window');
  const policy = requireObject(raw.policy_status, 'policy_status');
  const review = requireObject(raw.human_review_status, 'human_review_status');
  const asset = requireObject(raw.asset, 'asset');
  const provenance = requireObject(asset.provenance, 'asset.provenance');
  const integrity = requireObject(raw.integrity, 'integrity');
  const earliest = requireTimestamp(window.earliest_at, 'publishing_window.earliest_at');
  const latest = requireTimestamp(window.latest_at, 'publishing_window.latest_at');
  if (Date.parse(earliest) >= Date.parse(latest)) throw new StudioMkt0ValidationError('publishing_window earliest_at must be before latest_at');
  const assetId = requireString(raw.asset_id, 'asset_id');
  const nestedAssetId = requireString(asset.id, 'asset.id');
  if (assetId !== nestedAssetId) throw new StudioMkt0ValidationError('asset_id must match asset.id');

  return Object.freeze({
    schema_version: STUDIO_MKT0_SCHEMA_VERSION,
    contract_id: STUDIO_MKT0_CONTRACT_ID,
    mode: STUDIO_MKT0_MODE,
    event_id: requireString(raw.event_id, 'event_id'),
    project_id: requireString(raw.project_id, 'project_id'),
    episode_id: requireString(raw.episode_id, 'episode_id'),
    asset_id: assetId,
    production_status: requireString(raw.production_status, 'production_status'),
    qa_status: requireString(raw.qa_status, 'qa_status'),
    approved_platforms: normalizePlatforms(raw.approved_platforms),
    format: Object.freeze({
      kind: requireEnum(format.kind, 'format.kind', ALLOWED_FORMATS),
      aspect_ratio: requireEnum(format.aspect_ratio, 'format.aspect_ratio', ALLOWED_ASPECT_RATIOS),
      duration_seconds: requireNumber(format.duration_seconds, 'format.duration_seconds', { min: 1 })
    }),
    caption_base: requireString(raw.caption_base, 'caption_base'),
    hook_variants: normalizeHooks(raw.hook_variants),
    publishing_window: Object.freeze({ timezone: requireString(window.timezone, 'publishing_window.timezone'), earliest_at: earliest, latest_at: latest }),
    policy_status: Object.freeze({ status: requireString(policy.status, 'policy_status.status'), checks: Object.freeze([...(policy.checks ?? [])].map((item) => requireString(item, 'policy_status.checks[]')).sort()) }),
    human_review_status: Object.freeze({
      status: requireString(review.status, 'human_review_status.status'),
      reviewed_by: review.reviewed_by == null ? null : requireString(review.reviewed_by, 'human_review_status.reviewed_by'),
      reviewed_at: review.reviewed_at == null ? null : requireTimestamp(review.reviewed_at, 'human_review_status.reviewed_at'),
      evidence_ref: review.evidence_ref == null ? null : requireString(review.evidence_ref, 'human_review_status.evidence_ref')
    }),
    version: requireString(raw.version, 'version'),
    created_at: requireTimestamp(raw.created_at, 'created_at'),
    asset: Object.freeze({
      id: nestedAssetId,
      role: requireString(asset.role, 'asset.role'),
      ref: requireRef(asset.ref, 'asset.ref'),
      sha256: requireSha(asset.sha256, 'asset.sha256'),
      observed_sha256: requireSha(asset.observed_sha256, 'asset.observed_sha256'),
      mime_type: requireString(asset.mime_type, 'asset.mime_type').toLowerCase(),
      size_bytes: requireNumber(asset.size_bytes, 'asset.size_bytes', { min: 1 }),
      provenance: Object.freeze({ source_system: requireString(provenance.source_system, 'asset.provenance.source_system'), source_ref: requireString(provenance.source_ref, 'asset.provenance.source_ref'), evidence_ref: requireString(provenance.evidence_ref, 'asset.provenance.evidence_ref') })
    }),
    integrity: Object.freeze({ algorithm: requireString(integrity.algorithm, 'integrity.algorithm'), payload_sha256: requireSha(integrity.payload_sha256, 'integrity.payload_sha256') })
  });
}

function safeLiveGates(gates) {
  return canonicalJson(gates) === canonicalJson(LIVE_GATES_BLOCKED);
}

function result(core) {
  return Object.freeze({ ...core, report_hash: sha256(core) });
}

export function inspectStudioMkt0Package(input, {
  checked_at = '2026-07-12T08:00:00.000Z',
  processed_event_ids = [],
  processed_integrity_hashes = [],
  requested_platforms = null,
  live_gates = LIVE_GATES_BLOCKED
} = {}) {
  if (!safeLiveGates(live_gates)) return result({ state: 'LIVE_GATE_VIOLATION', checked_at, reasons: Object.freeze(['ALL_LIVE_GATES_MUST_REMAIN_BLOCKED']), human_review_required: true, package: null, shadow_plan: null, events: Object.freeze([]), live_gates: Object.freeze({ ...live_gates }) });

  let value;
  try {
    value = validateStudioMkt0Package(input);
  } catch (error) {
    if (!(error instanceof StudioMkt0ValidationError)) throw error;
    return result({ state: 'INVALID_PACKAGE', checked_at, reasons: Object.freeze([error.message]), details: Object.freeze(error.details), human_review_required: true, package: null, shadow_plan: null, events: Object.freeze([]), live_gates: LIVE_GATES_BLOCKED });
  }

  const actualIntegrity = computeStudioMkt0Integrity(input);
  if (value.integrity.algorithm !== 'sha256' || value.integrity.payload_sha256 !== actualIntegrity || value.asset.sha256 !== value.asset.observed_sha256) {
    return result({ state: 'INTEGRITY_FAILURE', checked_at, reasons: Object.freeze(['PACKAGE_OR_ASSET_SHA256_MISMATCH']), human_review_required: true, package: value, shadow_plan: null, events: Object.freeze([]), live_gates: LIVE_GATES_BLOCKED });
  }

  if (processed_event_ids.includes(value.event_id) || processed_integrity_hashes.includes(actualIntegrity)) {
    return result({ state: 'DUPLICATE_IGNORED', checked_at, reasons: Object.freeze(['IDEMPOTENCY_KEY_ALREADY_PROCESSED']), human_review_required: false, package: value, shadow_plan: null, events: Object.freeze([{ type: 'STUDIO_MKT0_DUPLICATE_IGNORED', aggregate_id: value.event_id, occurred_at: checked_at, mode: 'shadow' }]), live_gates: LIVE_GATES_BLOCKED });
  }
  if (value.production_status !== 'PRODUCTION_COMPLETE') return result({ state: 'PRODUCTION_NOT_COMPLETE', checked_at, reasons: Object.freeze(['PRODUCTION_COMPLETE_REQUIRED']), human_review_required: true, package: value, shadow_plan: null, events: Object.freeze([]), live_gates: LIVE_GATES_BLOCKED });
  if (value.qa_status === 'HUMAN_REVIEW_REQUIRED') return result({ state: 'HUMAN_REVIEW_REQUIRED', checked_at, reasons: Object.freeze(['QA_REQUIRES_HUMAN_REVIEW']), human_review_required: true, package: value, shadow_plan: null, events: Object.freeze([]), live_gates: LIVE_GATES_BLOCKED });
  if (value.qa_status !== 'QA_PASSED') return result({ state: 'QA_BLOCKED', checked_at, reasons: Object.freeze(['QA_PASSED_REQUIRED']), human_review_required: true, package: value, shadow_plan: null, events: Object.freeze([]), live_gates: LIVE_GATES_BLOCKED });
  if (value.policy_status.status !== 'PASSED') return result({ state: 'POLICY_BLOCKED', checked_at, reasons: Object.freeze(['POLICY_STATUS_PASSED_REQUIRED']), human_review_required: true, package: value, shadow_plan: null, events: Object.freeze([]), live_gates: LIVE_GATES_BLOCKED });
  const reviewComplete = value.human_review_status.status === 'APPROVED' && value.human_review_status.reviewed_by && value.human_review_status.reviewed_at && value.human_review_status.evidence_ref;
  if (!reviewComplete) return result({ state: 'HUMAN_REVIEW_REQUIRED', checked_at, reasons: Object.freeze(['EXPLICIT_HUMAN_APPROVAL_REQUIRED']), human_review_required: true, package: value, shadow_plan: null, events: Object.freeze([]), live_gates: LIVE_GATES_BLOCKED });

  const requested = requested_platforms == null ? value.approved_platforms : [...new Set(requested_platforms.map((item) => requireEnum(item, 'requested_platforms[]', ALLOWED_PLATFORMS)))].sort();
  const blocked = requested.filter((platform) => !value.approved_platforms.includes(platform));
  if (blocked.length) return result({ state: 'PLATFORM_SCOPE_BLOCKED', checked_at, reasons: Object.freeze(blocked.map((platform) => `PLATFORM_NOT_APPROVED:${platform}`)), human_review_required: true, package: value, shadow_plan: null, events: Object.freeze([]), live_gates: LIVE_GATES_BLOCKED });

  const jobs = Object.freeze(requested.map((platform) => Object.freeze({
    job_id: `shadow:${value.event_id}:${platform}`,
    platform,
    execution_mode: 'shadow',
    action: 'PLAN_VARIANT_ONLY',
    publish_allowed: false,
    network_allowed: false,
    oauth_allowed: false,
    account_required: false,
    asset_id: value.asset_id,
    format: value.format,
    caption_base: value.caption_base,
    hook_variants: value.hook_variants,
    publishing_window: value.publishing_window
  })));

  const shadowPlan = Object.freeze({ plan_id: `shadow-plan:${value.event_id}`, package_integrity: actualIntegrity, jobs, live_ready: false, publishing_enabled: false, human_execution_approval_required: true });
  return result({
    state: 'READY_FOR_SHADOW', checked_at, reasons: Object.freeze(['STUDIO_PACKAGE_VALID_FOR_SHADOW_ONLY']), human_review_required: false, package: value, shadow_plan: shadowPlan,
    events: Object.freeze([{ type: 'STUDIO_MKT0_SHADOW_READY', aggregate_id: value.event_id, occurred_at: checked_at, mode: 'shadow', integrity: actualIntegrity }]), live_gates: LIVE_GATES_BLOCKED
  });
}

export function markShadowIngested(inspection, { ingested_at = '2026-07-12T08:01:00.000Z' } = {}) {
  if (inspection?.state !== 'READY_FOR_SHADOW' || !inspection.shadow_plan) throw new StudioMkt0ValidationError('Only READY_FOR_SHADOW can be ingested');
  return result({ ...inspection, state: 'SHADOW_INGESTED', checked_at: ingested_at, reasons: Object.freeze(['SHADOW_PLAN_RECORDED_NO_PUBLICATION']), events: Object.freeze([...inspection.events, { type: 'STUDIO_MKT0_SHADOW_INGESTED', aggregate_id: inspection.package.event_id, occurred_at: ingested_at, mode: 'shadow' }]) });
}

export function buildStudioGrowthBrief(analysis, studioPackage, {
  tenant_id = 'comic-growth-os',
  generated_at = '2026-07-12T09:00:00.000Z'
} = {}) {
  const value = validateStudioMkt0Package(studioPackage);
  const direction = buildDirectionPackage(analysis, { tenantId: tenant_id, projectId: value.project_id, occurredAt: generated_at, actor: 'growth-intelligence-shadow' });
  const event = direction.find((entry) => entry.type === 'PRODUCTION_BRIEF_REGISTERED');
  if (!event) return Object.freeze({ state: 'NO_ACTIONABLE_BRIEF', project_id: value.project_id, episode_id: value.episode_id, asset_id: value.asset_id, generated_at, recommendations: Object.freeze([]), canon_change_allowed: false, human_review_required: true });
  const core = {
    state: 'PRODUCTION_BRIEF_READY', schema_version: 1, project_id: value.project_id, episode_id: value.episode_id, asset_id: value.asset_id,
    source_analysis_id: event.payload.sourceAnalysisId, priority: event.payload.priority, generated_at, recommendations: Object.freeze([...event.payload.recommendations]),
    constraints: Object.freeze(['NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL', 'NO_AUTOMATIC_PRODUCTION_MUTATION', 'SHADOW_RECOMMENDATION_ONLY']), canon_change_allowed: false, production_mutation_allowed: false, human_review_required: true
  };
  return Object.freeze({ ...core, integrity_sha256: sha256(core) });
}
