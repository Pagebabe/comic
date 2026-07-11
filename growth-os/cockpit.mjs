export const COCKPIT_SCHEMA_VERSION = 1;
export const COCKPIT_RULE_VERSION = 'mkt0-006.v1';
export const COCKPIT_MODE = 'read_only_shadow';
export const UNKNOWN = 'UNKNOWN';
export const NOT_AVAILABLE = 'NOT_AVAILABLE';

const ALLOWED_PROVENANCE = Object.freeze([
  'synthetic_fixture',
  'authorized_platform_import',
  'manual_public_observation',
  'synthetic_or_authorized_input_only'
]);

const FORBIDDEN_KEYS = new Set([
  'password',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'email',
  'phone',
  'authorRef',
  'rawText',
  'rawTexts',
  'messageBody'
]);

const SECTIONS = Object.freeze([
  ['today', 'Heute'],
  ['growth', 'Wachstum'],
  ['content', 'Content'],
  ['community', 'Community'],
  ['radar', 'Radar'],
  ['learning', 'Lernen'],
  ['system', 'System'],
  ['audit', 'Audit']
]);

export class CockpitValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'CockpitValidationError';
    this.details = details;
  }
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CockpitValidationError(`Missing or invalid object: ${field}`, { field });
  }
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CockpitValidationError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function requireTimestamp(value, field) {
  const text = requireString(value, field);
  if (!text.includes('T') || !Number.isFinite(Date.parse(text))) {
    throw new CockpitValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
  }
  return text;
}

function cloneSafe(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(cloneSafe));
  if (value && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cloneSafe(child)])));
  }
  return value;
}

function inspectForbiddenKeys(value, path = 'input') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectForbiddenKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new CockpitValidationError('Forbidden sensitive or raw-data field in cockpit input', { path: `${path}.${key}` });
    }
    inspectForbiddenKeys(child, `${path}.${key}`);
  }
}

function optionalNumber(value) {
  return Number.isFinite(value) ? value : UNKNOWN;
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : UNKNOWN;
}

function optionalArray(value) {
  return Array.isArray(value) ? value : [];
}

function provenanceFrom(value) {
  const provenance = value?.provenance;
  if (!provenance) return UNKNOWN;
  if (!ALLOWED_PROVENANCE.includes(provenance)) {
    throw new CockpitValidationError('Unsupported provenance', { provenance });
  }
  return provenance;
}

function stateFor(value) {
  return value && typeof value === 'object' ? 'AVAILABLE' : UNKNOWN;
}

function statusMetric(label, value, source = UNKNOWN) {
  return Object.freeze({ label, value: value ?? UNKNOWN, source });
}

function normalizeAnalysis(item) {
  requireObject(item, 'analysis');
  return Object.freeze({
    snapshotId: optionalString(item.snapshotId),
    variantId: optionalString(item.variantId),
    platform: optionalString(item.platform),
    seriesId: optionalString(item.seriesId),
    status: optionalString(item.status),
    score: optionalNumber(item.score),
    classification: optionalString(item.classification),
    warnings: Object.freeze(optionalArray(item.quality?.warnings).map(String).sort()),
    critical: Object.freeze(optionalArray(item.quality?.critical).map(String).sort()),
    anomalies: Object.freeze(optionalArray(item.anomalies).map(String).sort()),
    recommendations: Object.freeze(optionalArray(item.recommendations)
      .map((entry) => Object.freeze({
        code: optionalString(entry?.code),
        priority: optionalString(entry?.priority),
        ruleId: optionalString(entry?.ruleId),
        reason: optionalString(entry?.reason)
      }))
      .sort((a, b) => String(a.code).localeCompare(String(b.code))))
  });
}

function normalizeOpportunity(item) {
  requireObject(item, 'opportunity');
  return Object.freeze({
    opportunityId: optionalString(item.opportunityId),
    topic: optionalString(item.topic),
    score: optionalNumber(item.score),
    trendScore: optionalNumber(item.trendScore),
    communityDemand: optionalNumber(item.communityDemand),
    decision: optionalString(item.decision),
    humanReviewRequired: item.humanReviewRequired === true,
    reasons: Object.freeze(optionalArray(item.reasons).map(String).sort()),
    sourceSignalIds: Object.freeze(optionalArray(item.sourceSignalIds).map(String).sort())
  });
}

function normalizeHypothesis(item) {
  requireObject(item, 'hypothesis');
  return Object.freeze({
    hypothesisId: optionalString(item.hypothesisId),
    statement: optionalString(item.statement),
    confidence: optionalNumber(item.confidence),
    status: optionalString(item.status),
    sourceRef: optionalString(item.sourceRef)
  });
}

function normalizeAuditEntry(item) {
  requireObject(item, 'auditEntry');
  return Object.freeze({
    id: optionalString(item.id),
    occurredAt: optionalString(item.occurredAt),
    status: optionalString(item.status),
    code: optionalString(item.code),
    reference: optionalString(item.reference),
    hash: optionalString(item.hash)
  });
}

function buildTodaySection(dailyPlan) {
  return Object.freeze({
    dataState: stateFor(dailyPlan),
    date: optionalString(dailyPlan?.date),
    summary: Object.freeze({
      plannedContent: optionalNumber(dailyPlan?.summary?.plannedContent),
      humanApprovals: optionalNumber(dailyPlan?.summary?.humanApprovals),
      readyTasks: optionalNumber(dailyPlan?.summary?.readyTasks),
      retries: optionalNumber(dailyPlan?.summary?.retries),
      deadLetters: optionalNumber(dailyPlan?.summary?.deadLetters)
    }),
    contentToday: Object.freeze(optionalArray(dailyPlan?.contentToday).map((item) => Object.freeze({
      contentId: optionalString(item?.contentId),
      platform: optionalString(item?.platform),
      windowStart: optionalString(item?.windowStart),
      priority: optionalString(item?.priority)
    }))),
    approvalsRequired: Object.freeze(optionalArray(dailyPlan?.approvalsRequired).map(String).sort()),
    readyTasks: Object.freeze(optionalArray(dailyPlan?.readyTasks).map(String).sort()),
    retries: Object.freeze(optionalArray(dailyPlan?.retries).map((item) => Object.freeze({
      taskId: optionalString(item?.taskId),
      retryAt: optionalString(item?.retryAt)
    }))),
    deadLetters: Object.freeze(optionalArray(dailyPlan?.deadLetters).map(String).sort()),
    publicActionsExecuted: false
  });
}

function buildGrowthSection(growthBrief, analyses) {
  const normalized = analyses.map(normalizeAnalysis)
    .sort((a, b) => (Number.isFinite(b.score) ? b.score : -1) - (Number.isFinite(a.score) ? a.score : -1) || String(a.snapshotId).localeCompare(String(b.snapshotId)));
  return Object.freeze({
    dataState: growthBrief || analyses.length ? 'AVAILABLE' : UNKNOWN,
    provenance: provenanceFrom(growthBrief),
    ruleVersion: optionalString(growthBrief?.ruleVersion),
    metrics: Object.freeze([
      statusMetric('Follower gesamt', NOT_AVAILABLE, 'platform-import-required'),
      statusMetric('7-Tage-Wachstum', NOT_AVAILABLE, 'platform-import-required'),
      statusMetric('30-Tage-Wachstum', NOT_AVAILABLE, 'platform-import-required'),
      statusMetric('Analysierte Posts', optionalNumber(growthBrief?.counts?.analyzed), 'growth-brief'),
      statusMetric('Gewinner', optionalNumber(growthBrief?.counts?.winners), 'growth-brief'),
      statusMetric('Gehaltene Datensätze', optionalNumber(growthBrief?.counts?.held), 'growth-brief')
    ]),
    topWinners: Object.freeze(optionalArray(growthBrief?.topWinners).map((item) => Object.freeze({
      snapshotId: optionalString(item?.snapshotId),
      score: optionalNumber(item?.score),
      classification: optionalString(item?.classification)
    }))),
    alerts: Object.freeze(optionalArray(growthBrief?.alerts).map(String).sort()),
    recommendations: Object.freeze(optionalArray(growthBrief?.recommendations).map(String).sort()),
    analyses: Object.freeze(normalized)
  });
}

function buildCommunitySection(signalBrief) {
  return Object.freeze({
    dataState: stateFor(signalBrief),
    provenance: provenanceFrom(signalBrief),
    ruleVersion: optionalString(signalBrief?.ruleVersion),
    signalCount: optionalNumber(signalBrief?.community?.signalCount),
    replyMode: optionalString(signalBrief?.replyMode),
    alerts: Object.freeze(optionalArray(signalBrief?.community?.highPriorityAlerts).map((item) => Object.freeze({
      signalId: optionalString(item?.signalId),
      category: optionalString(item?.category),
      urgency: optionalString(item?.urgency),
      action: optionalString(item?.action)
    }))),
    episodeIdeas: Object.freeze(optionalArray(signalBrief?.community?.episodeIdeaCandidates).map((item) => Object.freeze({
      value: optionalString(item?.value),
      count: optionalNumber(item?.count)
    }))),
    topTopics: Object.freeze(optionalArray(signalBrief?.community?.topTopics).map((item) => Object.freeze({
      value: optionalString(item?.value),
      count: optionalNumber(item?.count)
    }))),
    topCharacters: Object.freeze(optionalArray(signalBrief?.community?.topCharacters).map((item) => Object.freeze({
      value: optionalString(item?.value),
      count: optionalNumber(item?.count)
    }))),
    rawTextsIncluded: false,
    personalProfilesBuilt: false,
    publicActionsExecuted: false
  });
}

function buildRadarSection(signalBrief, opportunities) {
  const source = opportunities.length ? opportunities : optionalArray(signalBrief?.opportunities);
  return Object.freeze({
    dataState: signalBrief || source.length ? 'AVAILABLE' : UNKNOWN,
    opportunities: Object.freeze(source.map(normalizeOpportunity)
      .sort((a, b) => (Number.isFinite(b.score) ? b.score : -1) - (Number.isFinite(a.score) ? a.score : -1) || String(a.opportunityId).localeCompare(String(b.opportunityId)))),
    liveTrendSourceConnected: false,
    competitorScraperActive: false,
    publicActionsExecuted: false
  });
}

function buildSystemSection(dailyPlan, systemHealth) {
  const components = optionalArray(systemHealth?.components).map((item) => Object.freeze({
    component: optionalString(item?.component),
    status: optionalString(item?.status),
    checkedAt: optionalString(item?.checkedAt),
    evidenceRef: optionalString(item?.evidenceRef)
  })).sort((a, b) => String(a.component).localeCompare(String(b.component)));
  return Object.freeze({
    dataState: dailyPlan || systemHealth ? 'AVAILABLE' : UNKNOWN,
    mode: COCKPIT_MODE,
    livePublishing: 'BLOCKED',
    remoteDatabase: 'NOT_CONNECTED',
    oauth: 'NOT_CONNECTED',
    externalTracking: false,
    components: Object.freeze(components),
    bottlenecks: cloneSafe(dailyPlan?.bottlenecks?.bottlenecks ?? []),
    criticalCount: optionalNumber(dailyPlan?.bottlenecks?.criticalCount),
    humanQueueCount: optionalNumber(dailyPlan?.bottlenecks?.humanQueueCount)
  });
}

function sourceCard(name, value) {
  return Object.freeze({
    name,
    dataState: stateFor(value),
    provenance: provenanceFrom(value),
    ruleVersion: optionalString(value?.ruleVersion),
    asOf: optionalString(value?.asOf)
  });
}

export function buildCockpitViewModel(input) {
  requireObject(input, 'input');
  inspectForbiddenKeys(input);
  const asOf = requireTimestamp(input.asOf, 'asOf');
  const scope = requireObject(input.scope, 'scope');
  const tenantId = requireString(scope.tenantId, 'scope.tenantId');
  const projectId = requireString(scope.projectId, 'scope.projectId');
  const analyses = optionalArray(input.analyses);
  const opportunities = optionalArray(input.opportunities);
  const hypotheses = optionalArray(input.hypotheses).map(normalizeHypothesis)
    .sort((a, b) => String(a.hypothesisId).localeCompare(String(b.hypothesisId)));
  const auditEntries = optionalArray(input.auditEntries).map(normalizeAuditEntry)
    .sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)) || String(a.id).localeCompare(String(b.id)));

  return Object.freeze({
    schemaVersion: COCKPIT_SCHEMA_VERSION,
    ruleVersion: COCKPIT_RULE_VERSION,
    mode: COCKPIT_MODE,
    title: 'Comic Growth OS',
    subtitle: 'Read-only Marketing Control Plane',
    asOf,
    scope: Object.freeze({ tenantId, projectId }),
    provenanceBanner: Object.freeze({
      label: 'SHADOW DATA',
      message: 'Synthetische oder ausdrücklich autorisierte Daten. Keine Live-Aktion ist möglich.',
      realWorldClaimsAllowed: false
    }),
    navigation: Object.freeze(SECTIONS.map(([id, label]) => Object.freeze({ id, label }))),
    today: buildTodaySection(input.dailyPlan),
    growth: buildGrowthSection(input.growthBrief, analyses),
    content: Object.freeze({
      dataState: analyses.length ? 'AVAILABLE' : UNKNOWN,
      items: Object.freeze(analyses.map(normalizeAnalysis)
        .sort((a, b) => String(a.snapshotId).localeCompare(String(b.snapshotId))))
    }),
    community: buildCommunitySection(input.signalBrief),
    radar: buildRadarSection(input.signalBrief, opportunities),
    learning: Object.freeze({
      dataState: hypotheses.length ? 'AVAILABLE' : UNKNOWN,
      hypotheses: Object.freeze(hypotheses),
      canonChangesAllowed: false,
      humanApprovalRequired: true
    }),
    system: buildSystemSection(input.dailyPlan, input.systemHealth),
    audit: Object.freeze({
      dataState: auditEntries.length ? 'AVAILABLE' : UNKNOWN,
      entries: Object.freeze(auditEntries),
      evidenceRefs: Object.freeze([
        'growth-os/evidence/MKT0-001.md',
        'growth-os/evidence/MKT0-002.md',
        'growth-os/evidence/MKT0-003.md',
        'growth-os/evidence/MKT0-004.md',
        'growth-os/evidence/MKT0-005.md',
        'growth-os/evidence/MKT0-006.md'
      ]),
      sources: Object.freeze([
        sourceCard('growthBrief', input.growthBrief),
        sourceCard('signalBrief', input.signalBrief),
        sourceCard('dailyPlan', input.dailyPlan),
        sourceCard('systemHealth', input.systemHealth)
      ]),
      immutableExternalAnchor: NOT_AVAILABLE
    }),
    capabilities: Object.freeze({
      readOnly: true,
      forms: false,
      mutations: false,
      networkRequests: false,
      publishing: false,
      replies: false,
      approvals: false,
      tracking: false
    })
  });
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function display(value) {
  if (value === UNKNOWN || value === NOT_AVAILABLE || value == null) return `<span class="unknown">${escapeHtml(value ?? UNKNOWN)}</span>`;
  if (typeof value === 'boolean') return value ? 'JA' : 'NEIN';
  return escapeHtml(value);
}

function badge(value) {
  const slug = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `<span class="badge badge-${escapeHtml(slug)}">${display(value)}</span>`;
}

function list(items, renderItem, empty = UNKNOWN) {
  if (!items.length) return `<p class="empty">${display(empty)}</p>`;
  return `<ul>${items.map((item) => `<li>${renderItem(item)}</li>`).join('')}</ul>`;
}

function metricCards(metrics) {
  return `<div class="metric-grid">${metrics.map((metric) => `<article class="metric"><h3>${escapeHtml(metric.label)}</h3><strong>${display(metric.value)}</strong><small>${display(metric.source)}</small></article>`).join('')}</div>`;
}

function renderToday(model) {
  return `<section id="today"><div class="section-head"><h2>Heute</h2>${badge(model.today.dataState)}</div>${metricCards([
    statusMetric('Geplanter Content', model.today.summary.plannedContent),
    statusMetric('Freigaben', model.today.summary.humanApprovals),
    statusMetric('Bereite Tasks', model.today.summary.readyTasks),
    statusMetric('Retries', model.today.summary.retries),
    statusMetric('Dead Letter', model.today.summary.deadLetters)
  ])}<div class="two-col"><article><h3>Content heute</h3>${list(model.today.contentToday, (item) => `<strong>${display(item.contentId)}</strong><br><small>${display(item.platform)} · ${display(item.windowStart)} · ${display(item.priority)}</small>`)}</article><article><h3>Menschliche Freigaben</h3>${list(model.today.approvalsRequired, display)}</article></div></section>`;
}

function renderGrowth(model) {
  return `<section id="growth"><div class="section-head"><h2>Wachstum</h2>${badge(model.growth.dataState)}</div>${metricCards(model.growth.metrics)}<div class="two-col"><article><h3>Gewinner</h3>${list(model.growth.topWinners, (item) => `<strong>${display(item.snapshotId)}</strong> ${badge(item.classification)}<br><small>Score ${display(item.score)}</small>`)}</article><article><h3>Empfehlungen</h3>${list(model.growth.recommendations, display)}</article></div></section>`;
}

function renderContent(model) {
  return `<section id="content"><div class="section-head"><h2>Content</h2>${badge(model.content.dataState)}</div><div class="card-grid">${model.content.items.length ? model.content.items.map((item) => `<article class="card"><h3>${display(item.snapshotId)}</h3><p>${badge(item.classification)} ${badge(item.status)}</p><dl><dt>Plattform</dt><dd>${display(item.platform)}</dd><dt>Serie</dt><dd>${display(item.seriesId)}</dd><dt>Score</dt><dd>${display(item.score)}</dd></dl>${list(item.recommendations, (entry) => `${display(entry.code)} <small>${display(entry.ruleId)}</small>`)}</article>`).join('') : `<p class="empty">${display(UNKNOWN)}</p>`}</div></section>`;
}

function renderCommunity(model) {
  return `<section id="community"><div class="section-head"><h2>Community</h2>${badge(model.community.dataState)}</div>${metricCards([
    statusMetric('Signale', model.community.signalCount),
    statusMetric('Antwortmodus', model.community.replyMode),
    statusMetric('Rohtexte gespeichert', model.community.rawTextsIncluded),
    statusMetric('Personenprofile', model.community.personalProfilesBuilt)
  ])}<div class="two-col"><article><h3>Kritische Fälle</h3>${list(model.community.alerts, (item) => `${badge(item.urgency)} ${display(item.category)} · ${display(item.action)}`)}</article><article><h3>Episodenideen</h3>${list(model.community.episodeIdeas, (item) => `${display(item.value)} <strong>${display(item.count)}</strong>`)}</article></div></section>`;
}

function renderRadar(model) {
  return `<section id="radar"><div class="section-head"><h2>Radar</h2>${badge(model.radar.dataState)}</div><div class="card-grid">${model.radar.opportunities.length ? model.radar.opportunities.map((item) => `<article class="card"><h3>${display(item.topic)}</h3><p>${badge(item.decision)} ${badge(item.score)}</p><dl><dt>Community-Nachfrage</dt><dd>${display(item.communityDemand)}</dd><dt>Menschliche Prüfung</dt><dd>${display(item.humanReviewRequired)}</dd></dl>${list(item.reasons, display)}</article>`).join('') : `<p class="empty">${display(UNKNOWN)}</p>`}</div></section>`;
}

function renderLearning(model) {
  return `<section id="learning"><div class="section-head"><h2>Lernen</h2>${badge(model.learning.dataState)}</div><div class="card-grid">${model.learning.hypotheses.length ? model.learning.hypotheses.map((item) => `<article class="card"><h3>${display(item.hypothesisId)}</h3><p>${display(item.statement)}</p><dl><dt>Status</dt><dd>${display(item.status)}</dd><dt>Confidence</dt><dd>${display(item.confidence)}</dd><dt>Quelle</dt><dd>${display(item.sourceRef)}</dd></dl></article>`).join('') : `<p class="empty">${display(UNKNOWN)}</p>`}</div></section>`;
}

function renderSystem(model) {
  return `<section id="system"><div class="section-head"><h2>System</h2>${badge(model.system.dataState)}</div>${metricCards([
    statusMetric('Live-Publishing', model.system.livePublishing),
    statusMetric('OAuth', model.system.oauth),
    statusMetric('Remote-Datenbank', model.system.remoteDatabase),
    statusMetric('Tracking', model.system.externalTracking),
    statusMetric('Kritische Jobs', model.system.criticalCount),
    statusMetric('Human Queue', model.system.humanQueueCount)
  ])}<article><h3>Komponenten</h3>${list(model.system.components, (item) => `<strong>${display(item.component)}</strong> ${badge(item.status)}<br><small>${display(item.checkedAt)} · ${display(item.evidenceRef)}</small>`)}</article></section>`;
}

function renderAudit(model) {
  return `<section id="audit"><div class="section-head"><h2>Audit</h2>${badge(model.audit.dataState)}</div><div class="two-col"><article><h3>Einträge</h3>${list(model.audit.entries, (item) => `<strong>${display(item.code)}</strong> ${badge(item.status)}<br><small>${display(item.occurredAt)} · ${display(item.reference)} · ${display(item.hash)}</small>`)}</article><article><h3>Evidence</h3>${list(model.audit.evidenceRefs, display)}</article></div><article><h3>Datenquellen</h3>${list(model.audit.sources, (item) => `<strong>${display(item.name)}</strong> ${badge(item.dataState)}<br><small>${display(item.provenance)} · ${display(item.ruleVersion)} · ${display(item.asOf)}</small>`)}</article></section>`;
}

export function renderCockpitHtml(viewModel) {
  const model = requireObject(viewModel, 'viewModel');
  if (model.schemaVersion !== COCKPIT_SCHEMA_VERSION || model.mode !== COCKPIT_MODE || model.capabilities?.readOnly !== true) {
    throw new CockpitValidationError('Invalid or non-read-only cockpit model');
  }
  inspectForbiddenKeys(model, 'viewModel');
  const nav = model.navigation.map((item) => `<a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`).join('');
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; script-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(model.title)}</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color-scheme:dark;--bg:#0b0d12;--panel:#151923;--line:#293142;--text:#f3f5f8;--muted:#9ca7b8;--accent:#9ce2c3;--warn:#f0c674;--danger:#ff8d8d}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);line-height:1.5}header{padding:2rem clamp(1rem,4vw,4rem);border-bottom:1px solid var(--line);background:linear-gradient(135deg,#111722,#0b0d12)}header h1{margin:0;font-size:clamp(2rem,5vw,4rem)}header p{color:var(--muted);max-width:65ch}.banner{display:inline-block;padding:.45rem .7rem;border:1px solid var(--warn);color:var(--warn);border-radius:999px;font-weight:700}nav{position:sticky;top:0;z-index:2;display:flex;gap:.5rem;overflow:auto;padding:.75rem clamp(1rem,4vw,4rem);background:rgba(11,13,18,.96);border-bottom:1px solid var(--line)}nav a{color:var(--text);text-decoration:none;padding:.45rem .7rem;border:1px solid var(--line);border-radius:999px;white-space:nowrap}main{width:min(1400px,100%);margin:auto;padding:0 clamp(1rem,3vw,3rem) 4rem}section{padding:3rem 0;border-bottom:1px solid var(--line)}.section-head{display:flex;align-items:center;justify-content:space-between;gap:1rem}.metric-grid,.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem}.metric,.card,article{background:var(--panel);border:1px solid var(--line);border-radius:1rem;padding:1rem}.metric strong{display:block;font-size:1.7rem}.metric small,small,.unknown,.empty{color:var(--muted)}.metric h3,.card h3{margin-top:0}.two-col{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:1rem}.badge{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:.15rem .5rem;font-size:.78rem}.badge-winner,.badge-outlier,.badge-available,.badge-analyzed{color:var(--accent);border-color:var(--accent)}.badge-critical,.badge-dead-letter,.badge-underperformer{color:var(--danger);border-color:var(--danger)}.badge-high,.badge-hold,.badge-waiting-human{color:var(--warn);border-color:var(--warn)}dl{display:grid;grid-template-columns:auto 1fr;gap:.35rem .8rem}dt{color:var(--muted)}dd{margin:0}ul{padding-left:1.2rem}footer{padding:2rem clamp(1rem,4vw,4rem);color:var(--muted)}@media(max-width:720px){.two-col{grid-template-columns:1fr}section{padding:2rem 0}.metric-grid,.card-grid{grid-template-columns:1fr}header{padding-top:1.4rem}}
</style>
</head>
<body>
<header><span class="banner">${escapeHtml(model.provenanceBanner.label)}</span><h1>${escapeHtml(model.title)}</h1><p>${escapeHtml(model.subtitle)}</p><p>${escapeHtml(model.provenanceBanner.message)}</p><small>Stand ${escapeHtml(model.asOf)} · Tenant ${escapeHtml(model.scope.tenantId)} · Projekt ${escapeHtml(model.scope.projectId)}</small></header>
<nav aria-label="Cockpit Navigation">${nav}</nav>
<main>${renderToday(model)}${renderGrowth(model)}${renderContent(model)}${renderCommunity(model)}${renderRadar(model)}${renderLearning(model)}${renderSystem(model)}${renderAudit(model)}</main>
<footer>Read-only Shadow Control Plane · Keine Formulare · Keine Netzwerkaufrufe · Keine öffentliche Aktion</footer>
</body>
</html>`;
}

export function assertReadOnlyCockpitArtifact(html) {
  const value = requireString(html, 'html');
  const forbidden = [
    /<script\b/i,
    /<form\b/i,
    /<button\b/i,
    /<input\b/i,
    /<textarea\b/i,
    /<select\b/i,
    /fetch\s*\(/i,
    /XMLHttpRequest/i,
    /https?:\/\//i,
    /on(?:click|submit|load|error)\s*=/i
  ];
  const matches = forbidden.filter((pattern) => pattern.test(value)).map(String);
  if (matches.length) throw new CockpitValidationError('Cockpit artifact contains mutating or network-capable markup', { matches });
  if (!value.includes("default-src 'none'")) throw new CockpitValidationError('Cockpit artifact lacks restrictive CSP');
  if (!value.includes('Read-only Shadow Control Plane')) throw new CockpitValidationError('Cockpit artifact lacks read-only marker');
  return true;
}
