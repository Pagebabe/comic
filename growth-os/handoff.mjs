import { createHash } from 'node:crypto';

export const HANDOFF_SCHEMA_VERSION = 1;
export const HANDOFF_CONTRACT_VERSION = 'comic-growth-os.factory-handoff.v1';
export const HANDOFF_MODE = 'shadow';

export const HANDOFF_STATES = Object.freeze([
  'WAITING_FOR_FACTORY_EXPORT',
  'INVALID_EXPORT',
  'RIGHTS_REVIEW_REQUIRED',
  'PRODUCTION_APPROVAL_REQUIRED',
  'HASH_MISMATCH',
  'READY_FOR_SHADOW_INGEST',
  'SHADOW_INGESTED',
  'QUARANTINED'
]);

const SOURCE_KINDS = new Set(['synthetic_fixture', 'studio_export']);
const ASSET_ROLES = new Set(['MASTER_VIDEO', 'SUBTITLES', 'THUMBNAIL', 'TRANSCRIPT']);
const RIGHTS_STATUSES = new Set(['CLEARED', 'NOT_USED', 'UNKNOWN', 'RESTRICTED']);
const ALLOWED_REF_PREFIXES = ['fixture://', 'studio-export://'];
const PLACEHOLDER_TAGS = new Set(['technical_placeholder', 'dashboard_placeholder', 'test_only_visual']);
const SENSITIVE_FLAGS = new Set(['politics', 'medical', 'legal', 'minor', 'crisis', 'rights_dispute']);
const FORBIDDEN_ACTIONS = Object.freeze([
  'live_publish',
  'live_reply',
  'live_delete',
  'live_dm',
  'network_request',
  'oauth_exchange',
  'secret_write',
  'canon_mutation',
  'production_mutation'
]);

export class HandoffValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'HandoffValidationError';
    this.details = details;
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HandoffValidationError(`Missing or invalid object: ${field}`, { field });
  }
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HandoffValidationError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function optionalString(value, field) {
  if (value == null || value === '') return null;
  return requireString(value, field);
}

function requireNumber(value, field, { min = 0 } = {}) {
  if (!Number.isFinite(value) || value < min) {
    throw new HandoffValidationError(`Missing or invalid number: ${field}`, { field, value });
  }
  return value;
}

function requireSha(value, field) {
  const normalized = requireString(value, field).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new HandoffValidationError(`Invalid SHA-256: ${field}`, { field, value });
  }
  return normalized;
}

function validateRef(value, field) {
  const ref = requireString(value, field);
  const lower = ref.toLowerCase();
  if (lower.includes('../') || lower.includes('..\\')) {
    throw new HandoffValidationError(`Path traversal is forbidden: ${field}`, { field, ref });
  }
  if (/^https?:\/\//i.test(ref) || /^file:\/\//i.test(ref)) {
    throw new HandoffValidationError(`Network and file references are forbidden: ${field}`, { field, ref });
  }
  if (!ALLOWED_REF_PREFIXES.some((prefix) => ref.startsWith(prefix))) {
    throw new HandoffValidationError(`Unsupported asset reference: ${field}`, { field, ref });
  }
  return ref;
}

function normalizeStringList(value, field) {
  if (value == null) return Object.freeze([]);
  if (!Array.isArray(value)) throw new HandoffValidationError(`Invalid array: ${field}`, { field });
  return Object.freeze([...new Set(value.map((item) => requireString(item, `${field}[]`).toLowerCase()))].sort());
}

function normalizeAsset(asset, index) {
  const raw = requireObject(asset, `assets[${index}]`);
  const role = requireString(raw.role, `assets[${index}].role`).toUpperCase();
  if (!ASSET_ROLES.has(role)) throw new HandoffValidationError('Unsupported asset role', { role, index });
  const ref = validateRef(raw.ref, `assets[${index}].ref`);
  const sha = requireSha(raw.sha256, `assets[${index}].sha256`);
  const observedSha = raw.observedSha256 == null ? sha : requireSha(raw.observedSha256, `assets[${index}].observedSha256`);
  const mimeType = requireString(raw.mimeType, `assets[${index}].mimeType`).toLowerCase();
  const sizeBytes = requireNumber(raw.sizeBytes, `assets[${index}].sizeBytes`, { min: 1 });
  const provenance = requireObject(raw.provenance, `assets[${index}].provenance`);
  const tags = normalizeStringList(raw.tags, `assets[${index}].tags`);
  return Object.freeze({
    role,
    ref,
    sha256: sha,
    observedSha256: observedSha,
    mimeType,
    sizeBytes,
    provenance: Object.freeze({
      sourceSystem: requireString(provenance.sourceSystem, `assets[${index}].provenance.sourceSystem`),
      sourceRef: requireString(provenance.sourceRef, `assets[${index}].provenance.sourceRef`),
      evidenceRef: requireString(provenance.evidenceRef, `assets[${index}].provenance.evidenceRef`)
    }),
    tags
  });
}

export function validateFactoryExport(input) {
  const raw = requireObject(input, 'FactoryExport');
  if (raw.schemaVersion !== HANDOFF_SCHEMA_VERSION) {
    throw new HandoffValidationError('Unsupported FactoryExport schemaVersion', { schemaVersion: raw.schemaVersion });
  }
  if (raw.contractVersion !== HANDOFF_CONTRACT_VERSION) {
    throw new HandoffValidationError('Unsupported FactoryExport contractVersion', { contractVersion: raw.contractVersion });
  }

  const source = requireObject(raw.source, 'source');
  const sourceKind = requireString(source.kind, 'source.kind');
  if (!SOURCE_KINDS.has(sourceKind)) throw new HandoffValidationError('Unsupported source.kind', { sourceKind });

  const packageInfo = requireObject(raw.package, 'package');
  if (!Array.isArray(raw.assets) || raw.assets.length === 0) {
    throw new HandoffValidationError('FactoryExport assets must be a non-empty array');
  }
  const assets = raw.assets.map(normalizeAsset).sort((left, right) => left.role.localeCompare(right.role) || left.ref.localeCompare(right.ref));
  const roles = assets.map((asset) => asset.role);
  if (!roles.includes('MASTER_VIDEO')) throw new HandoffValidationError('MASTER_VIDEO asset is required');
  if (new Set(roles).size !== roles.length) throw new HandoffValidationError('Asset roles must be unique', { roles });
  const master = assets.find((asset) => asset.role === 'MASTER_VIDEO');
  if (!master.mimeType.startsWith('video/')) throw new HandoffValidationError('MASTER_VIDEO must use a video MIME type');

  const approval = raw.approval && typeof raw.approval === 'object' ? raw.approval : {};
  const rights = raw.rights && typeof raw.rights === 'object' ? raw.rights : {};
  const content = raw.content && typeof raw.content === 'object' ? raw.content : {};

  return Object.freeze({
    schemaVersion: HANDOFF_SCHEMA_VERSION,
    contractVersion: HANDOFF_CONTRACT_VERSION,
    exportId: requireString(raw.exportId, 'exportId'),
    projectId: requireString(raw.projectId, 'projectId'),
    seriesId: requireString(raw.seriesId, 'seriesId'),
    episodeId: requireString(raw.episodeId, 'episodeId'),
    title: requireString(raw.title, 'title'),
    durationSeconds: requireNumber(raw.durationSeconds, 'durationSeconds', { min: 1 }),
    source: Object.freeze({
      kind: sourceKind,
      sourceRef: requireString(source.sourceRef, 'source.sourceRef'),
      synthetic: sourceKind === 'synthetic_fixture'
    }),
    package: Object.freeze({
      packageRef: requireString(packageInfo.packageRef, 'package.packageRef'),
      packageHash: requireSha(packageInfo.packageHash, 'package.packageHash'),
      canonRef: requireString(packageInfo.canonRef, 'package.canonRef')
    }),
    assets: Object.freeze(assets),
    approval: Object.freeze({
      status: optionalString(approval.status, 'approval.status'),
      approvedBy: optionalString(approval.approvedBy, 'approval.approvedBy'),
      approvedAt: optionalString(approval.approvedAt, 'approval.approvedAt'),
      evidenceRef: optionalString(approval.evidenceRef, 'approval.evidenceRef')
    }),
    rights: Object.freeze({
      visual: optionalString(rights.visual, 'rights.visual'),
      music: optionalString(rights.music, 'rights.music'),
      voice: optionalString(rights.voice, 'rights.voice'),
      thirdParty: optionalString(rights.thirdParty, 'rights.thirdParty')
    }),
    content: Object.freeze({
      tags: normalizeStringList(content.tags, 'content.tags'),
      warnings: normalizeStringList(content.warnings, 'content.warnings'),
      sensitiveFlags: normalizeStringList(content.sensitiveFlags, 'content.sensitiveFlags')
    }),
    exportedAt: requireString(raw.exportedAt, 'exportedAt'),
    toolVersion: requireString(raw.toolVersion, 'toolVersion')
  });
}

function makeResult(core) {
  const reportHash = sha256(core);
  return Object.freeze({ ...core, reportHash });
}

function waitingResult(checkedAt) {
  return makeResult({
    schemaVersion: HANDOFF_SCHEMA_VERSION,
    contractVersion: HANDOFF_CONTRACT_VERSION,
    trackingIssue: 130,
    mode: HANDOFF_MODE,
    checkedAt,
    state: 'WAITING_FOR_FACTORY_EXPORT',
    reasons: Object.freeze(['FACTORY_EXPORT_NOT_PROVIDED']),
    humanReviewRequired: false,
    export: null,
    ingestPlan: null,
    domainEvents: Object.freeze([]),
    forbiddenActions: FORBIDDEN_ACTIONS,
    boundaries: Object.freeze({
      mainIntegrationAllowed: false,
      livePublishingAllowed: false,
      networkUsed: false,
      sourceMutationPerformed: false,
      canonMutationPerformed: false,
      productionMutationPerformed: false,
      automaticCreativeApproval: false
    })
  });
}

export function inspectFactoryExport(input, {
  checkedAt = '2026-07-11T00:00:00.000Z',
  knownExportIds = [],
  knownPackageHashes = []
} = {}) {
  if (input == null) return waitingResult(checkedAt);

  let value;
  try {
    value = validateFactoryExport(input);
  } catch (error) {
    if (!(error instanceof HandoffValidationError)) throw error;
    return makeResult({
      schemaVersion: HANDOFF_SCHEMA_VERSION,
      contractVersion: HANDOFF_CONTRACT_VERSION,
      trackingIssue: 130,
      mode: HANDOFF_MODE,
      checkedAt,
      state: 'INVALID_EXPORT',
      reasons: Object.freeze([error.message]),
      validationDetails: Object.freeze(error.details),
      humanReviewRequired: true,
      export: null,
      ingestPlan: null,
      domainEvents: Object.freeze([]),
      forbiddenActions: FORBIDDEN_ACTIONS,
      boundaries: Object.freeze({
        mainIntegrationAllowed: false,
        livePublishingAllowed: false,
        networkUsed: false,
        sourceMutationPerformed: false,
        canonMutationPerformed: false,
        productionMutationPerformed: false,
        automaticCreativeApproval: false
      })
    });
  }

  const reasons = [];
  let state = 'READY_FOR_SHADOW_INGEST';
  let humanReviewRequired = false;

  const mismatches = value.assets.filter((asset) => asset.sha256 !== asset.observedSha256);
  if (mismatches.length > 0) {
    state = 'HASH_MISMATCH';
    humanReviewRequired = true;
    reasons.push(...mismatches.map((asset) => `HASH_MISMATCH:${asset.role}`));
  }

  const duplicateExport = knownExportIds.includes(value.exportId);
  const duplicatePackage = knownPackageHashes.includes(value.package.packageHash);
  if (state === 'READY_FOR_SHADOW_INGEST' && (duplicateExport || duplicatePackage)) {
    state = 'QUARANTINED';
    humanReviewRequired = true;
    if (duplicateExport) reasons.push('DUPLICATE_EXPORT_ID');
    if (duplicatePackage) reasons.push('DUPLICATE_PACKAGE_HASH');
  }

  const placeholderAssets = value.assets.filter((asset) => {
    const extensionBlocked = asset.ref.toLowerCase().endsWith('.svg');
    const tagBlocked = asset.tags.some((tag) => PLACEHOLDER_TAGS.has(tag));
    return extensionBlocked || tagBlocked;
  });
  if (state === 'READY_FOR_SHADOW_INGEST' && placeholderAssets.length > 0) {
    state = 'QUARANTINED';
    humanReviewRequired = true;
    reasons.push(...placeholderAssets.map((asset) => `TECHNICAL_PLACEHOLDER:${asset.role}`));
  }

  const expectedApproval = value.source.synthetic ? 'APPROVED_FOR_SHADOW_DEMO' : 'PRODUCTION_APPROVED';
  const approvalComplete = value.approval.status === expectedApproval && value.approval.approvedBy && value.approval.approvedAt && value.approval.evidenceRef;
  if (state === 'READY_FOR_SHADOW_INGEST' && !approvalComplete) {
    state = 'PRODUCTION_APPROVAL_REQUIRED';
    humanReviewRequired = true;
    reasons.push('PRODUCTION_APPROVAL_INCOMPLETE');
  }

  const rightsValues = Object.entries(value.rights);
  const invalidRights = rightsValues.filter(([, status]) => status != null && !RIGHTS_STATUSES.has(status));
  if (invalidRights.length > 0) {
    state = 'INVALID_EXPORT';
    humanReviewRequired = true;
    reasons.push(...invalidRights.map(([domain]) => `INVALID_RIGHTS_STATUS:${domain}`));
  } else {
    const openRights = rightsValues.filter(([, status]) => status == null || status === 'UNKNOWN' || status === 'RESTRICTED');
    if (state === 'READY_FOR_SHADOW_INGEST' && openRights.length > 0) {
      state = 'RIGHTS_REVIEW_REQUIRED';
      humanReviewRequired = true;
      reasons.push(...openRights.map(([domain]) => `RIGHTS_REVIEW_REQUIRED:${domain}`));
    }
  }

  const sensitive = value.content.sensitiveFlags.filter((flag) => SENSITIVE_FLAGS.has(flag));
  if (state === 'READY_FOR_SHADOW_INGEST' && sensitive.length > 0) {
    state = 'QUARANTINED';
    humanReviewRequired = true;
    reasons.push(...sensitive.map((flag) => `SENSITIVE_CONTENT_REVIEW_REQUIRED:${flag}`));
  }

  if (reasons.length === 0) reasons.push('FACTORY_EXPORT_VALID_FOR_SHADOW_ONLY');

  const exportDigest = sha256(value);
  const ingestPlan = state === 'READY_FOR_SHADOW_INGEST'
    ? Object.freeze({
        planId: `shadow-ingest:${value.exportId}`,
        mode: HANDOFF_MODE,
        exportId: value.exportId,
        exportDigest,
        packageHash: value.package.packageHash,
        assetCount: value.assets.length,
        allowedActions: Object.freeze(['append_shadow_domain_events', 'create_shadow_episode_projection', 'plan_social_variants']),
        forbiddenActions: FORBIDDEN_ACTIONS,
        requiresHumanExecutionApproval: true,
        liveReady: false,
        publishAllowed: false
      })
    : null;

  const domainEvents = Object.freeze([
    Object.freeze({
      type: state === 'READY_FOR_SHADOW_INGEST' ? 'FACTORY_HANDOFF_READY' : 'FACTORY_HANDOFF_BLOCKED',
      aggregateId: value.exportId,
      occurredAt: checkedAt,
      mode: HANDOFF_MODE,
      state,
      exportDigest,
      reasons: Object.freeze([...new Set(reasons)].sort())
    })
  ]);

  return makeResult({
    schemaVersion: HANDOFF_SCHEMA_VERSION,
    contractVersion: HANDOFF_CONTRACT_VERSION,
    trackingIssue: 130,
    mode: HANDOFF_MODE,
    checkedAt,
    state,
    reasons: Object.freeze([...new Set(reasons)].sort()),
    humanReviewRequired,
    export: value,
    exportDigest,
    ingestPlan,
    domainEvents,
    forbiddenActions: FORBIDDEN_ACTIONS,
    boundaries: Object.freeze({
      mainIntegrationAllowed: false,
      livePublishingAllowed: false,
      networkUsed: false,
      sourceMutationPerformed: false,
      canonMutationPerformed: false,
      productionMutationPerformed: false,
      automaticCreativeApproval: false
    })
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function renderHandoffHtml(report) {
  const assets = report.export?.assets ?? [];
  const assetRows = assets.map((asset) => `<tr><td>${escapeHtml(asset.role)}</td><td>${escapeHtml(asset.mimeType)}</td><td>${escapeHtml(asset.sizeBytes)}</td><td><code>${escapeHtml(asset.sha256)}</code></td></tr>`).join('');
  const reasons = report.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'"><title>Comic Growth OS · Factory Handoff</title><style>body{font-family:system-ui;background:#101114;color:#f2f2f2;margin:0;padding:24px}main{max-width:1100px;margin:auto}section{border:1px solid #3a3d45;border-radius:16px;padding:18px;margin:14px 0;background:#181a20}h1{margin:.2em 0}code{overflow-wrap:anywhere;color:#f4bd55}table{width:100%;border-collapse:collapse}td,th{padding:10px;border-bottom:1px solid #333;text-align:left}.boundary{font-weight:700;color:#f4bd55}</style></head><body><main><p>COMIC GROWTH OS · MKT1-001 · SHADOW ONLY</p><h1>${escapeHtml(report.state)}</h1><p>Factory-Export wird ausschließlich geprüft. Keine Live-Aktion, keine Canon- oder Produktionsmutation.</p><section><h2>Entscheidung</h2><ul>${reasons}</ul><p>Human Review: ${report.humanReviewRequired ? 'ERFORDERLICH' : 'NICHT FÜR DIESEN SYNTHETISCHEN CHECK'}</p></section><section><h2>Export</h2><p>${report.export ? `${escapeHtml(report.export.exportId)} · ${escapeHtml(report.export.title)}` : 'Kein Factory-Export vorhanden.'}</p><table><thead><tr><th>Rolle</th><th>MIME</th><th>Bytes</th><th>SHA-256</th></tr></thead><tbody>${assetRows}</tbody></table></section><section><h2>Grenzen</h2><p class="boundary">LIVE READY: NEIN · PUBLISHING: NEIN · MAIN-INTEGRATION: NEIN</p><p>Source Mutation: NEIN · Canon Mutation: NEIN · Production Mutation: NEIN · automatische kreative Freigabe: NEIN</p></section><footer><p>Report <code>${escapeHtml(report.reportHash)}</code></p></footer></main></body></html>`;
}
