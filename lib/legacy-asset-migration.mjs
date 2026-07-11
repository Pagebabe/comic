import { createHash } from 'node:crypto';
import { lstat } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

export const MIGRATION_SCHEMA_VERSION = 1;
export const MIGRATION_RULE_VERSION = 'legacy-asset-migration.v1';
export const DEFAULT_GENERATED_AT = '2026-07-11T00:00:00.000Z';

const CORE_TARGETS = Object.freeze([
  ['character_ricco', 'Ricco', 'character'],
  ['character_basti', 'Basti Prenzl', 'character'],
  ['character_jule', 'Jule', 'character'],
  ['character_don_miau', 'Don Miau', 'character'],
  ['location_house_facade', 'Haus Nr. 13 / Hausfassade', 'location'],
  ['location_ricco_room', 'Riccos Zimmer', 'location'],
  ['location_hallway', 'Flur / Treppenhaus', 'location'],
  ['location_kitchen', 'Gemeinschaftsküche', 'location']
]);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function hashObject(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function normalizePath(value) {
  return String(value || '').replaceAll('\\', '/').toLowerCase();
}

function exactIdInText(text, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9]|_)`, 'i').test(text);
}

function hasTraversal(relativePath) {
  const normalized = String(relativePath || '').replaceAll('\\', '/');
  return normalized.split('/').some((part) => part === '..') || normalized.startsWith('/');
}

function isInsideRoot(root, absolutePath) {
  const rootResolved = resolve(root);
  const pathResolved = resolve(absolutePath);
  const rel = relative(rootResolved, pathResolved);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function validSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
}

function detectEntity(record, contract) {
  const explicitLegacy = String(record.legacy_id || record.legacyId || '').trim().toLowerCase();
  if (explicitLegacy) {
    if (contract.legacyToCanonMapping[explicitLegacy]) {
      return { legacyId: explicitLegacy, canonId: contract.legacyToCanonMapping[explicitLegacy], mapping: 'EXPLICIT_LEGACY_MAPPING' };
    }
    if (contract.legacySupportUnmapped.includes(explicitLegacy)) {
      return { legacyId: explicitLegacy, canonId: null, mapping: 'LEGACY_SUPPORT_UNMAPPED' };
    }
  }

  const explicitTarget = String(record.target_id || record.targetId || '').trim();
  if (explicitTarget && contract.explicitCurrentTargets[explicitTarget]) {
    return { legacyId: null, canonId: contract.explicitCurrentTargets[explicitTarget], mapping: 'EXPLICIT_CURRENT_TARGET' };
  }

  const text = normalizePath(`${record.absolute_path || ''} ${record.relative_path || ''}`);
  for (const [legacyId, canonId] of Object.entries(contract.legacyToCanonMapping)) {
    if (exactIdInText(text, legacyId)) return { legacyId, canonId, mapping: 'EXACT_PATH_ID_MAPPING' };
  }
  for (const legacyId of contract.legacySupportUnmapped) {
    if (exactIdInText(text, legacyId)) return { legacyId, canonId: null, mapping: 'LEGACY_SUPPORT_UNMAPPED' };
  }
  return { legacyId: null, canonId: null, mapping: 'NONE' };
}

function isTechnicalPlaceholder(record, contract) {
  const text = normalizePath(`${record.absolute_path || ''} ${record.relative_path || ''}`);
  if (contract.technicalPlaceholderRules.pathTokens.some((token) => text.includes(normalizePath(token)))) return true;
  const extension = String(record.extension || '').toLowerCase();
  return contract.technicalPlaceholderRules.svgCharacterOrLocationIsPlaceholder === true
    && extension === '.svg'
    && ['CHARACTER_SHEET', 'LOCATION_SHEET'].includes(String(record.category || ''));
}

function assetNature(record, contract) {
  const extension = String(record.extension || '').toLowerCase();
  const pathText = normalizePath(`${record.absolute_path || ''} ${record.relative_path || ''}`);
  if (contract.modelByteExtensions.includes(extension)) return 'MODEL_BYTES';
  if (String(record.category || '') === 'LORA_DATASET' || contract.trainingPlanTokens.some((token) => pathText.includes(token))) {
    return 'TRAINING_PLAN';
  }
  if (record.media_kind === 'image') return 'IMAGE';
  if (record.media_kind === 'video') return 'VIDEO';
  if (record.media_kind === 'audio') return 'AUDIO';
  if (record.media_kind === 'document') return 'DOCUMENT';
  return String(record.media_kind || 'OTHER').toUpperCase();
}

function validateTopLevel(inventory, shortlist, contract) {
  if (inventory.schemaVersion !== contract.inputVersions.assetRecoveryInventory) throw new Error('LEGACY_INVENTORY_SCHEMA_UNSUPPORTED');
  if (inventory.readOnlySourceScan !== true) throw new Error('LEGACY_INVENTORY_NOT_READ_ONLY');
  if (!Array.isArray(inventory.roots) || !inventory.roots.length) throw new Error('LEGACY_INVENTORY_ROOTS_MISSING');
  if (!Array.isArray(inventory.files)) throw new Error('LEGACY_INVENTORY_FILES_MISSING');
  if (!inventory.scannerVersion || !inventory.generatedAt) throw new Error('LEGACY_INVENTORY_PROVENANCE_MISSING');
  if (shortlist.schemaVersion !== contract.inputVersions.visualCandidateShortlist) throw new Error('LEGACY_SHORTLIST_SCHEMA_UNSUPPORTED');
  if (shortlist.automaticCanonApproval !== false) throw new Error('LEGACY_SHORTLIST_AUTOMATIC_APPROVAL_FORBIDDEN');
  if (!shortlist.targets || typeof shortlist.targets !== 'object') throw new Error('LEGACY_SHORTLIST_TARGETS_MISSING');
}

function shortlistLookup(shortlist) {
  const byPath = new Map();
  const bySha = new Map();
  for (const [targetId, target] of Object.entries(shortlist.targets || {})) {
    for (const candidate of target.candidates || []) {
      const reference = { ...candidate, target_id: targetId, target_label: target.label, target_kind: target.kind };
      if (candidate.absolute_path) byPath.set(resolve(candidate.absolute_path), reference);
      if (validSha(candidate.sha256)) bySha.set(candidate.sha256.toLowerCase(), reference);
    }
  }
  return { byPath, bySha };
}

export async function inspectPathReadOnly(path) {
  try {
    const stat = await lstat(path);
    return { exists: true, isSymlink: stat.isSymbolicLink() };
  } catch (error) {
    if (error && error.code === 'ENOENT') return { exists: false, isSymlink: false };
    throw error;
  }
}

export function waitingPreview(contract, missingInputs, generatedAt = DEFAULT_GENERATED_AT) {
  const core = {
    schemaVersion: MIGRATION_SCHEMA_VERSION,
    ruleVersion: MIGRATION_RULE_VERSION,
    repository: contract.repository,
    trackingIssue: contract.trackingIssue,
    sourceIssue: contract.sourceIssue,
    generatedAt,
    state: contract.waitingStatus,
    input: {
      inventoryPresent: !missingInputs.includes('inventory'),
      shortlistPresent: !missingInputs.includes('shortlist'),
      missing: [...missingInputs].sort()
    },
    summary: {
      records: 0,
      importableBytes: 0,
      automaticMasterApprovals: 0,
      byStatus: {},
      byMediaKind: {},
      byAssetNature: {},
      duplicates: 0,
      missingLocalPaths: 0,
      mappedCanonRecords: 0,
      unmappedLegacySupport: 0,
      modelBytes: 0,
      trainingPlans: 0
    },
    mappings: Object.entries(contract.legacyToCanonMapping).map(([legacyId, canonId]) => ({ legacyId, canonId })),
    records: [],
    targets: CORE_TARGETS.map(([targetId, label, kind]) => ({
      targetId, label, kind, candidateCount: 0, decision: contract.waitingStatus
    })),
    boundaries: {
      readOnly: true,
      sourceMutationPerformed: false,
      sourceAssetScanExecuted: false,
      modelExecutionPerformed: false,
      loraTrainingPerformed: false,
      canonMutationPerformed: false,
      automaticMasterApprovals: 0
    }
  };
  return Object.freeze({ ...core, previewHash: hashObject(core) });
}

export async function buildMigrationPreview({ inventory, shortlist, contract, pathInspector = inspectPathReadOnly, generatedAt } = {}) {
  validateTopLevel(inventory, shortlist, contract);
  const lookup = shortlistLookup(shortlist);
  const roots = inventory.roots.map((root) => resolve(root));
  const raw = [];

  for (let index = 0; index < inventory.files.length; index += 1) {
    const source = inventory.files[index];
    const rootIndex = Number(source.root_index);
    if (!Number.isInteger(rootIndex) || rootIndex < 0 || rootIndex >= roots.length) throw new Error(`LEGACY_ROOT_INDEX_INVALID:${index}`);
    if (!source.absolute_path || !source.relative_path) throw new Error(`LEGACY_RECORD_PROVENANCE_MISSING:${index}`);
    if (hasTraversal(source.relative_path)) throw new Error(`LEGACY_PATH_TRAVERSAL_REJECTED:${source.relative_path}`);
    const absolutePath = resolve(source.absolute_path);
    if (!isInsideRoot(roots[rootIndex], absolutePath)) throw new Error(`LEGACY_PATH_OUTSIDE_ROOT:${absolutePath}`);

    const pathState = await pathInspector(absolutePath);
    const candidate = (validSha(source.sha256) && lookup.bySha.get(source.sha256.toLowerCase())) || lookup.byPath.get(absolutePath) || null;
    const entity = detectEntity({ ...source, ...(candidate || {}) }, contract);
    const nature = assetNature(source, contract);
    const provenanceIssues = [];
    if (!validSha(source.sha256) || source.hash_status !== contract.provenanceRequirements.hashStatusForImportableBytes) provenanceIssues.push('SHA256_PROVENANCE_MISSING');
    if (pathState.isSymlink) provenanceIssues.push('SYMLINK_NOT_ALLOWED');

    let status = 'FOUND';
    if (isTechnicalPlaceholder(source, contract)) status = 'TECHNICAL_PLACEHOLDER';
    else if (entity.mapping === 'LEGACY_SUPPORT_UNMAPPED') status = 'LEGACY_SUPPORT_UNMAPPED';
    else if (nature === 'TRAINING_PLAN') status = 'PLANNED_ONLY';
    else if (!pathState.exists) status = 'LOCAL_PATH_MISSING';
    else if (candidate || entity.canonId) status = 'REVIEW_REQUIRED';
    else if (provenanceIssues.length) status = 'REVIEW_REQUIRED';

    const importable = pathState.exists
      && !pathState.isSymlink
      && validSha(source.sha256)
      && source.hash_status === contract.provenanceRequirements.hashStatusForImportableBytes
      && !['TECHNICAL_PLACEHOLDER', 'PLANNED_ONLY', 'LEGACY_SUPPORT_UNMAPPED', 'LOCAL_PATH_MISSING'].includes(status);

    raw.push({
      recordId: `legacy-${String(index + 1).padStart(4, '0')}`,
      rootIndex,
      absolutePath,
      relativePath: String(source.relative_path),
      extension: String(source.extension || '').toLowerCase(),
      sizeBytes: Number(source.size_bytes || 0),
      modifiedUtc: String(source.modified_utc || ''),
      sha256: validSha(source.sha256) ? source.sha256.toLowerCase() : null,
      hashStatus: String(source.hash_status || ''),
      category: String(source.category || ''),
      mediaKind: String(source.media_kind || 'other'),
      assetNature: nature,
      status,
      importable,
      localPathExists: pathState.exists,
      symlink: pathState.isSymlink,
      legacyId: entity.legacyId,
      canonId: entity.canonId,
      mapping: entity.mapping,
      targetId: candidate?.target_id || null,
      targetLabel: candidate?.target_label || null,
      candidateScore: candidate ? Number(candidate.score || 0) : null,
      provenanceIssues,
      decision: status === 'REVIEW_REQUIRED' ? 'REVIEW_REQUIRED' : status,
      automaticMasterApproval: false
    });
  }

  const duplicateGroups = new Map();
  for (const record of raw) {
    if (!record.sha256) continue;
    if (!duplicateGroups.has(record.sha256)) duplicateGroups.set(record.sha256, []);
    duplicateGroups.get(record.sha256).push(record);
  }
  for (const group of duplicateGroups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.absolutePath.localeCompare(b.absolutePath));
    for (const duplicate of group.slice(1)) {
      duplicate.status = 'DUPLICATE';
      duplicate.decision = 'DUPLICATE';
      duplicate.importable = false;
      duplicate.duplicateOf = group[0].recordId;
    }
  }

  const byStatus = {};
  const byMediaKind = {};
  const byAssetNature = {};
  for (const record of raw) {
    byStatus[record.status] = (byStatus[record.status] || 0) + 1;
    byMediaKind[record.mediaKind] = (byMediaKind[record.mediaKind] || 0) + 1;
    byAssetNature[record.assetNature] = (byAssetNature[record.assetNature] || 0) + 1;
    if (record.automaticMasterApproval !== false || record.status === 'APPROVED_MASTER') throw new Error('LEGACY_AUTOMATIC_MASTER_APPROVAL_FORBIDDEN');
  }

  const targets = CORE_TARGETS.map(([targetId, label, kind]) => {
    const target = shortlist.targets[targetId];
    const candidates = raw.filter((record) => record.targetId === targetId && record.status !== 'DUPLICATE');
    return {
      targetId,
      label: target?.label || label,
      kind: target?.kind || kind,
      candidateCount: candidates.length,
      decision: candidates.length ? 'REVIEW_REQUIRED' : 'NO_TRUSTWORTHY_CANDIDATE'
    };
  });

  const core = {
    schemaVersion: MIGRATION_SCHEMA_VERSION,
    ruleVersion: MIGRATION_RULE_VERSION,
    repository: contract.repository,
    trackingIssue: contract.trackingIssue,
    sourceIssue: contract.sourceIssue,
    generatedAt: generatedAt || inventory.generatedAt || shortlist.generatedAt || DEFAULT_GENERATED_AT,
    state: 'MIGRATION_PREVIEW_READY_REVIEW_REQUIRED',
    input: {
      inventoryPresent: true,
      shortlistPresent: true,
      inventorySchemaVersion: inventory.schemaVersion,
      shortlistSchemaVersion: shortlist.schemaVersion,
      scannerVersion: inventory.scannerVersion,
      analyzerVersion: shortlist.analyzerVersion || null,
      roots: [...inventory.roots],
      sourceReadOnly: inventory.readOnlySourceScan === true
    },
    summary: {
      records: raw.length,
      importableBytes: raw.filter((record) => record.importable).length,
      automaticMasterApprovals: 0,
      byStatus: Object.fromEntries(Object.entries(byStatus).sort()),
      byMediaKind: Object.fromEntries(Object.entries(byMediaKind).sort()),
      byAssetNature: Object.fromEntries(Object.entries(byAssetNature).sort()),
      duplicates: raw.filter((record) => record.status === 'DUPLICATE').length,
      missingLocalPaths: raw.filter((record) => record.status === 'LOCAL_PATH_MISSING').length,
      mappedCanonRecords: raw.filter((record) => record.canonId).length,
      unmappedLegacySupport: raw.filter((record) => record.status === 'LEGACY_SUPPORT_UNMAPPED').length,
      modelBytes: raw.filter((record) => record.assetNature === 'MODEL_BYTES').length,
      trainingPlans: raw.filter((record) => record.assetNature === 'TRAINING_PLAN').length
    },
    mappings: Object.entries(contract.legacyToCanonMapping).map(([legacyId, canonId]) => ({ legacyId, canonId })),
    records: raw,
    targets,
    boundaries: {
      readOnly: true,
      sourceMutationPerformed: false,
      sourceAssetScanExecuted: false,
      modelExecutionPerformed: false,
      loraTrainingPerformed: false,
      canonMutationPerformed: false,
      automaticMasterApprovals: 0
    }
  };
  return Object.freeze({ ...core, previewHash: hashObject(core) });
}

export function validateMigrationPreview(preview, contract) {
  if (!preview || preview.schemaVersion !== MIGRATION_SCHEMA_VERSION) throw new Error('LEGACY_PREVIEW_SCHEMA_INVALID');
  if (preview.repository !== contract.repository || preview.trackingIssue !== contract.trackingIssue) throw new Error('LEGACY_PREVIEW_SCOPE_INVALID');
  if (preview.summary.automaticMasterApprovals !== 0 || preview.boundaries.automaticMasterApprovals !== 0) throw new Error('LEGACY_PREVIEW_MASTER_APPROVAL_INVALID');
  if (preview.records.some((record) => record.status === 'APPROVED_MASTER' || record.automaticMasterApproval !== false)) throw new Error('LEGACY_PREVIEW_APPROVED_MASTER_FORBIDDEN');
  if (preview.records.some((record) => !contract.allowedRecordStatuses.includes(record.status))) throw new Error('LEGACY_PREVIEW_STATUS_INVALID');
  if (preview.boundaries.readOnly !== true || preview.boundaries.sourceMutationPerformed !== false || preview.boundaries.modelExecutionPerformed !== false) throw new Error('LEGACY_PREVIEW_BOUNDARY_INVALID');
  const { previewHash, ...core } = preview;
  if (hashObject(core) !== previewHash) throw new Error('LEGACY_PREVIEW_HASH_MISMATCH');
  return true;
}

export function migrationPreviewToCsv(preview) {
  const fields = [
    'recordId', 'status', 'decision', 'mediaKind', 'assetNature', 'legacyId', 'canonId', 'mapping',
    'targetId', 'candidateScore', 'localPathExists', 'importable', 'sha256', 'relativePath', 'absolutePath', 'provenanceIssues'
  ];
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const lines = [fields.map(quote).join(',')];
  for (const record of preview.records) {
    const row = { ...record, provenanceIssues: record.provenanceIssues.join(' | ') };
    lines.push(fields.map((field) => quote(row[field])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function renderMigrationPreviewHtml(preview) {
  const statusRows = Object.entries(preview.summary.byStatus || {}).map(([status, count]) => `<li><span>${escapeHtml(status)}</span><strong>${count}</strong></li>`).join('');
  const targetRows = preview.targets.map((target) => `<tr><td>${escapeHtml(target.label)}</td><td>${escapeHtml(target.kind)}</td><td>${target.candidateCount}</td><td>${escapeHtml(target.decision)}</td></tr>`).join('');
  const recordRows = preview.records.map((record) => `<tr><td><code>${escapeHtml(record.recordId)}</code></td><td>${escapeHtml(record.status)}</td><td>${escapeHtml(record.mediaKind)}</td><td>${escapeHtml(record.assetNature)}</td><td>${escapeHtml(record.legacyId || '—')}</td><td>${escapeHtml(record.canonId || '—')}</td><td>${escapeHtml(record.relativePath)}</td></tr>`).join('');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; font-src 'none'; media-src 'none'; frame-src 'none'"><title>Legacy Asset Migration Preview</title><style>body{font-family:system-ui;background:#101116;color:#f3f4f6;margin:0;padding:24px}main{max-width:1240px;margin:auto}header,.panel{border:1px solid #343845;border-radius:16px;background:#181a22;padding:20px;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.metric{border:1px solid #343845;border-radius:12px;padding:14px}.metric strong{display:block;font-size:1.6rem}table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;border-bottom:1px solid #343845;padding:10px;vertical-align:top}th{color:#d1a957}code{color:#d1a957}ul{list-style:none;padding:0}li{display:flex;justify-content:space-between;border-bottom:1px solid #343845;padding:7px 0}.warning{color:#ffcf70}.ok{color:#9be7b1}</style></head><body><main><header><p>COMIC FACTORY · ISSUE #${preview.trackingIssue}</p><h1>Legacy-Asset-Migrationsvorschau</h1><p class="warning">${escapeHtml(preview.state)} · 0 automatische Masterfreigaben · ausschließlich read-only</p><code>${escapeHtml(preview.previewHash)}</code></header><section class="grid"><article class="metric"><span>Records</span><strong>${preview.summary.records}</strong></article><article class="metric"><span>Modellbytes</span><strong>${preview.summary.modelBytes}</strong></article><article class="metric"><span>Trainingspläne</span><strong>${preview.summary.trainingPlans}</strong></article><article class="metric"><span>Duplikate</span><strong>${preview.summary.duplicates}</strong></article><article class="metric"><span>Fehlende Pfade</span><strong>${preview.summary.missingLocalPaths}</strong></article><article class="metric"><span>Auto-Master</span><strong>0</strong></article></section><section class="panel"><h2>Status</h2><ul>${statusRows || '<li><span>Keine Eingabedaten</span><strong>WAITING</strong></li>'}</ul></section><section class="panel"><h2>Kernfiguren und Hauptlocations</h2><table><thead><tr><th>Ziel</th><th>Typ</th><th>Kandidaten</th><th>Entscheidung</th></tr></thead><tbody>${targetRows}</tbody></table></section><section class="panel"><h2>Read-only Datensätze</h2><table><thead><tr><th>ID</th><th>Status</th><th>Medium</th><th>Natur</th><th>Legacy</th><th>Canon</th><th>Pfad</th></tr></thead><tbody>${recordRows || '<tr><td colspan="7">Recovery-Reports ausstehend. Keine Assets erfunden.</td></tr>'}</tbody></table></section><footer><p class="ok">Quelle unverändert · keine Modelle ausgeführt · keine LoRA trainiert · kein Canon überschrieben</p></footer></main></body></html>`;
}
