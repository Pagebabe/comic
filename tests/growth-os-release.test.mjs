import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertReadOnlyReleaseHtml,
  buildActivationChecklist,
  buildDeploymentReadiness,
  buildPersistenceReadiness,
  buildReleaseManifest,
  buildTraceGraph,
  createModuleEvidence,
  evaluateFailureScenario,
  renderReleaseHtml,
  stableHash,
  verifyReleaseManifest
} from '../growth-os/release.mjs';

const contents = Object.fromEntries(Array.from({ length: 9 }, (_, index) => [`artifact-${index + 1}`, `evidence-${index + 1}`]));
const modules = Object.entries(contents).map(([path, content], index) => ({
  moduleId: `MKT0-${String(index + 1).padStart(3, '0')}`,
  ruleVersion: `mkt0-${String(index + 1).padStart(3, '0')}.v1`,
  state: 'PROVEN',
  ciRunId: `ci-${index + 1}`,
  claims: ['offline-shadow-proof'],
  artifacts: [{ path, sha256: stableHash(content) }]
}));
const manifest = () => buildReleaseManifest({ schemaVersion: 1, releaseId: 'mkt0-shadow-rc1', generatedAt: '2026-07-11T13:00:00.000Z', correlationId: 'corr-rc1', modules });
const sql = `create schema if not exists growth_os;\n${['tenants','projects','campaigns','content_items','social_variants','publish_jobs','metric_snapshots','comment_signals','trend_signals','hypotheses','experiments','production_briefs','events'].map((table) => `create table if not exists growth_os.${table} ();`).join('\n')}\ncreate function prevent_event_mutation() returns trigger language plpgsql as $$ begin return null; end $$;\ncreate trigger x before update or delete on growth_os.events execute function prevent_event_mutation();\n${['projects','campaigns','content_items','social_variants','publish_jobs','metric_snapshots','comment_signals','trend_signals','hypotheses','experiments','production_briefs','events'].map((table) => `alter table growth_os.${table} enable row level security;`).join('\n')}\nselect current_setting('app.tenant_id', true);\ncheck (mode = 'shadow');`;

test('module evidence is deterministic', () => assert.deepEqual(createModuleEvidence(modules[0]), createModuleEvidence(modules[0])));
test('credential values are rejected', () => assert.throws(() => createModuleEvidence({ ...modules[0], accessToken: 'forbidden' }), /credential material/));
test('all nine modules create shadow release ready manifest', () => assert.equal(manifest().releaseState, 'SHADOW_RELEASE_READY'));
test('missing module blocks release', () => assert.equal(buildReleaseManifest({ schemaVersion: 1, releaseId: 'x', generatedAt: '2026-07-11T13:00:00.000Z', correlationId: 'c', modules: modules.slice(0, 8) }).releaseState, 'BLOCKED'));
test('non-proven module blocks release', () => assert.equal(buildReleaseManifest({ schemaVersion: 1, releaseId: 'x', generatedAt: '2026-07-11T13:00:00.000Z', correlationId: 'c', modules: modules.map((module, index) => index === 2 ? { ...module, state: 'NOT_PROVEN' } : module) }).releaseState, 'BLOCKED'));
test('duplicate module is rejected', () => assert.throws(() => buildReleaseManifest({ schemaVersion: 1, releaseId: 'x', generatedAt: '2026-07-11T13:00:00.000Z', correlationId: 'c', modules: [...modules, modules[0]] }), /Duplicate/));
test('artifact hashes verify', () => assert.equal(verifyReleaseManifest(manifest(), contents).verified, true));
test('tampered artifact is rejected', () => assert.throws(() => verifyReleaseManifest(manifest(), { ...contents, 'artifact-2': 'tampered' }), /verification failed/));
test('tampered manifest is rejected', () => assert.throws(() => verifyReleaseManifest({ ...manifest(), releaseId: 'changed' }, contents), /hash mismatch/));
test('trace graph preserves causal order', () => assert.equal(buildTraceGraph({ correlationId: 'c', steps: [{ stepId: 's1', moduleId: 'MKT0-001', causationId: null, state: 'PASS', evidenceRef: 'e1' }, { stepId: 's2', moduleId: 'MKT0-002', causationId: 's1', state: 'PASS', evidenceRef: 'e2' }] }).steps[1].causationId, 's1'));
test('forward causation is rejected', () => assert.throws(() => buildTraceGraph({ correlationId: 'c', steps: [{ stepId: 's2', moduleId: 'MKT0-002', causationId: 's1', state: 'PASS', evidenceRef: 'e2' }] }), /causation/));
test('persistence contract proves local schema only', () => { const result = buildPersistenceReadiness(sql); assert.equal(result.state, 'PROVEN_LOCAL_CONTRACT'); assert.equal(result.runtimeRlsVerified, false); });
test('missing RLS blocks persistence contract', () => assert.equal(buildPersistenceReadiness(sql.replace('alter table growth_os.events enable row level security;', '')).state, 'NOT_PROVEN'));
test('readiness distinguishes shadow from live', () => { const result = buildDeploymentReadiness({ manifest: manifest(), persistence: buildPersistenceReadiness(sql) }); assert.equal(result.shadowReleaseReady, true); assert.equal(result.liveReady, false); assert.ok(result.blockedGateCount > 0); });
test('external proof requires human verification', () => assert.throws(() => buildDeploymentReadiness({ manifest: manifest(), persistence: buildPersistenceReadiness(sql), externalEvidence: { REMOTE_DATABASE: { state: 'PROVEN_EXTERNAL', evidenceRef: 'ticket', verifiedAt: '2026-07-11T13:00:00.000Z', verifiedByHuman: false } } }), /human verification/));
test('activation checklist forbids automatic completion', () => { const list = buildActivationChecklist(buildDeploymentReadiness({ manifest: manifest(), persistence: buildPersistenceReadiness(sql) })); assert.ok(list.items.every((item) => item.automaticCompletionAllowed === false)); assert.equal(list.liveActivationAllowed, false); });
test('all failure scenarios are safe', () => { for (const type of ['KILL_SWITCH','AUTH_NOT_READY','RATE_LIMIT','WEBHOOK_REPLAY','MANIFEST_TAMPER','INSUFFICIENT_METRICS','RLS_FAILURE','RESTORE_FAILURE']) { const result = evaluateFailureScenario({ type }); assert.match(result.outcome, /^SAFE_/); assert.equal(result.liveActionsExecuted, false); } });
test('unknown failure is rejected', () => assert.throws(() => evaluateFailureScenario({ type: 'SURPRISE' }), /Unknown/));
test('release HTML escapes and remains offline', () => { const m = { ...manifest(), releaseId: '<script>x</script>' }; const readiness = buildDeploymentReadiness({ manifest: m, persistence: buildPersistenceReadiness(sql) }); const html = renderReleaseHtml({ manifest: m, readiness }); assert.doesNotMatch(html, /<script>x/); assert.equal(assertReadOnlyReleaseHtml(html), true); });
test('release HTML rejects forms and URLs', () => assert.throws(() => assertReadOnlyReleaseHtml(`<meta http-equiv="Content-Security-Policy" content="default-src 'none'"><form action="https://x"></form>`), /not read-only/));
