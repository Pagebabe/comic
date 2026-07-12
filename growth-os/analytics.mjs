import { createHash } from 'node:crypto';

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`Missing or invalid object: ${field}`);
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`Missing or invalid string: ${field}`);
  return value.trim();
}

function requireTimestamp(value, field) {
  const text = requireString(value, field);
  if (!text.includes('T') || !Number.isFinite(Date.parse(text))) throw new TypeError(`Missing or invalid ISO timestamp: ${field}`);
  return text;
}

function hashId(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

export function buildDirectionPackage(analysis, { tenantId, projectId, occurredAt, actor = 'growth-radar' }) {
  requireObject(analysis, 'analysis');
  requireString(tenantId, 'tenantId');
  requireString(projectId, 'projectId');
  requireTimestamp(occurredAt, 'occurredAt');
  if (analysis.status !== 'ANALYZED' || !Array.isArray(analysis.recommendations) || analysis.recommendations.length === 0) return Object.freeze([]);
  const seed = hashId({ snapshotId: analysis.snapshotId, ruleVersion: analysis.ruleVersion, recommendations: analysis.recommendations });
  const hypothesisId = `hyp_${seed}`;
  const briefId = `brief_${seed}`;
  const statement = analysis.classification === 'OUTLIER'
    ? `The format behind ${analysis.snapshotId} is materially above its robust comparison baseline.`
    : `The measurable pattern behind ${analysis.snapshotId} requires a controlled follow-up test.`;
  return Object.freeze([
    Object.freeze({
      schemaVersion: 1,
      id: `evt_${hypothesisId}`,
      tenantId,
      projectId,
      stream: `hypothesis:${hypothesisId}`,
      sequence: 1,
      type: 'HYPOTHESIS_REGISTERED',
      occurredAt,
      actor,
      mode: 'shadow',
      payload: Object.freeze({ hypothesisId, statement, confidence: analysis.classification === 'OUTLIER' ? 0.75 : 0.55, status: 'TESTING' })
    }),
    Object.freeze({
      schemaVersion: 1,
      id: `evt_${briefId}`,
      tenantId,
      projectId,
      stream: `brief:${briefId}`,
      sequence: 1,
      type: 'PRODUCTION_BRIEF_REGISTERED',
      occurredAt,
      actor,
      mode: 'shadow',
      payload: Object.freeze({
        productionBriefId: briefId,
        sourceAnalysisId: analysis.snapshotId,
        priority: ['OUTLIER', 'WINNER'].includes(analysis.classification) ? 'HIGH' : 'NORMAL',
        recommendations: Object.freeze([...new Set([...analysis.recommendations.map((item) => item.code), 'NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL'])].sort())
      })
    })
  ]);
}
