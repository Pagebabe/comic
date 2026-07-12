import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  buildStudioGrowthBrief,
  computeStudioMkt0Integrity,
  inspectStudioMkt0Package,
  LIVE_GATES_BLOCKED,
  markShadowIngested
} from './studio-mkt0-integration.mjs';
import {
  createGrowthAnalysisFixture,
  createStudioMkt0PackageFixture
} from './studio-mkt0-integration-fixture.mjs';
import { sha256 } from './handoff.mjs';

const OUTPUT_JSON = 'output/growth-os/studio-mkt0-shadow-integration.json';
const OUTPUT_HTML = 'output/growth-os/studio-mkt0-shadow-integration.html';

const studioPackage = createStudioMkt0PackageFixture();
const ready = inspectStudioMkt0Package(studioPackage);
const ingested = markShadowIngested(ready);
const duplicate = inspectStudioMkt0Package(studioPackage, {
  processed_event_ids: [studioPackage.event_id]
});
const invalidIntegrityPackage = createStudioMkt0PackageFixture();
invalidIntegrityPackage.integrity.payload_sha256 = '0'.repeat(64);
const integrityFailure = inspectStudioMkt0Package(invalidIntegrityPackage);
const relaxedLiveGate = inspectStudioMkt0Package(studioPackage, {
  live_gates: { ...LIVE_GATES_BLOCKED, live_publishing_enabled: true }
});
const restrictedPlatformPackage = createStudioMkt0PackageFixture({
  approved_platforms: ['tiktok']
});
restrictedPlatformPackage.integrity.payload_sha256 = computeStudioMkt0Integrity(restrictedPlatformPackage);
const platformBlocked = inspectStudioMkt0Package(restrictedPlatformPackage, {
  requested_platforms: ['youtube_shorts']
});
const productionBrief = buildStudioGrowthBrief(
  createGrowthAnalysisFixture(),
  studioPackage
);

const expectations = [
  [ready.state, 'READY_FOR_SHADOW'],
  [ingested.state, 'SHADOW_INGESTED'],
  [duplicate.state, 'DUPLICATE_IGNORED'],
  [integrityFailure.state, 'INTEGRITY_FAILURE'],
  [relaxedLiveGate.state, 'LIVE_GATE_VIOLATION'],
  [platformBlocked.state, 'PLATFORM_SCOPE_BLOCKED'],
  [productionBrief.state, 'PRODUCTION_BRIEF_READY']
];
for (const [actual, expected] of expectations) {
  if (actual !== expected) throw new Error(`Expected ${expected}, received ${actual}`);
}
if (ready.shadow_plan.jobs.some((job) => job.publish_allowed || job.network_allowed || job.oauth_allowed)) {
  throw new Error('Shadow plan contains a forbidden live capability');
}
if (duplicate.shadow_plan !== null) throw new Error('Duplicate package produced a second plan');
if (productionBrief.canon_change_allowed || productionBrief.production_mutation_allowed) {
  throw new Error('Growth brief permits an automatic production mutation');
}

const core = {
  schema_version: 1,
  contract_id: 'comic-growth-os.studio-mkt0-integration-proof.v1',
  generated_at: '2026-07-12T09:15:00.000Z',
  mode: 'shadow',
  status: 'STUDIO_MKT0_SHADOW_INTEGRATION_PROVEN',
  source_package: {
    event_id: studioPackage.event_id,
    project_id: studioPackage.project_id,
    episode_id: studioPackage.episode_id,
    asset_id: studioPackage.asset_id,
    integrity_sha256: computeStudioMkt0Integrity(studioPackage)
  },
  results: {
    approved_package: ready.state,
    shadow_ingest: ingested.state,
    duplicate_event: duplicate.state,
    integrity_failure: integrityFailure.state,
    live_gate_relaxation: relaxedLiveGate.state,
    platform_restriction: platformBlocked.state,
    growth_feedback: productionBrief.state
  },
  shadow_jobs: ready.shadow_plan.jobs,
  production_brief: productionBrief,
  live_boundaries: LIVE_GATES_BLOCKED,
  assertions: {
    live_ready: false,
    publishing_executed: false,
    network_used: false,
    oauth_used: false,
    social_accounts_connected: false,
    source_mutated: false,
    canon_mutated: false,
    production_mutated: false
  }
};
const report = Object.freeze({ ...core, report_hash: sha256(core) });

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

const rows = Object.entries(report.results)
  .map(([name, state]) => `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(state)}</td></tr>`)
  .join('');
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'"><title>Studio MKT0 Shadow Integration</title><style>body{font-family:system-ui;background:#111;color:#eee;padding:24px}main{max-width:1000px;margin:auto}section{border:1px solid #444;border-radius:14px;padding:16px;margin:14px 0}table{width:100%;border-collapse:collapse}td,th{padding:9px;border-bottom:1px solid #333;text-align:left}.blocked{font-weight:800;color:#f0b85a}code{overflow-wrap:anywhere}</style></head><body><main><p>COMIC GROWTH OS · SHADOW ONLY</p><h1>${escapeHtml(report.status)}</h1><section><h2>End-to-End-Ergebnis</h2><table><tbody>${rows}</tbody></table></section><section><h2>Live-Grenzen</h2><p class="blocked">LIVE READY: NEIN · PUBLISHING: NEIN · OAUTH: NEIN · NETZWERK: NEIN</p><p>Konten verbunden: NEIN · automatische Kommentare: NEIN · automatische Community-Antworten: NEIN</p></section><section><h2>Growth-Rückgabe</h2><p>${escapeHtml(report.production_brief.state)} · ${escapeHtml(report.production_brief.recommendations.join(', '))}</p></section><footer><code>${escapeHtml(report.report_hash)}</code></footer></main></body></html>`;

for (const target of [OUTPUT_JSON, OUTPUT_HTML]) mkdirSync(dirname(target), { recursive: true });
writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(OUTPUT_HTML, html, 'utf8');

console.log(JSON.stringify({
  status: report.status,
  report_hash: report.report_hash,
  json: OUTPUT_JSON,
  html: OUTPUT_HTML,
  live_ready: false,
  publishing_executed: false
}, null, 2));
