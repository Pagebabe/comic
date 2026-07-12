import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HANDOFF_CONTRACT_VERSION,
  HANDOFF_MODE,
  HANDOFF_STATES,
  inspectFactoryExport,
  renderHandoffHtml,
  validateFactoryExport
} from '../growth-os/handoff.mjs';
import { createFactoryHandoffFixture } from '../growth-os/handoff-fixture.mjs';

const checkedAt = '2026-07-11T00:00:00.000Z';
const inspect = (input, options = {}) => inspectFactoryExport(input, { checkedAt, ...options });

test('contract exposes only shadow handoff states and no publish state', () => {
  assert.equal(HANDOFF_CONTRACT_VERSION, 'comic-growth-os.factory-handoff.v1');
  assert.equal(HANDOFF_MODE, 'shadow');
  assert.equal(HANDOFF_STATES.length, 8);
  assert.ok(!HANDOFF_STATES.includes('LIVE_READY'));
  assert.ok(!HANDOFF_STATES.includes('PUBLISHED'));
  assert.ok(!HANDOFF_STATES.includes('APPROVED_MASTER'));
});

test('valid synthetic factory export becomes ready for shadow ingest only', () => {
  const report = inspect(createFactoryHandoffFixture());
  assert.equal(report.state, 'READY_FOR_SHADOW_INGEST');
  assert.equal(report.ingestPlan.mode, 'shadow');
  assert.equal(report.ingestPlan.liveReady, false);
  assert.equal(report.ingestPlan.publishAllowed, false);
  assert.equal(report.boundaries.mainIntegrationAllowed, false);
  assert.equal(report.boundaries.sourceMutationPerformed, false);
  assert.match(report.reportHash, /^[0-9a-f]{64}$/);
});

test('missing factory export remains honestly waiting', () => {
  const report = inspect(null);
  assert.equal(report.state, 'WAITING_FOR_FACTORY_EXPORT');
  assert.equal(report.export, null);
  assert.equal(report.ingestPlan, null);
  assert.deepEqual(report.domainEvents, []);
});

test('missing production approval blocks ingest', () => {
  const fixture = createFactoryHandoffFixture({ approval: {} });
  const report = inspect(fixture);
  assert.equal(report.state, 'PRODUCTION_APPROVAL_REQUIRED');
  assert.equal(report.humanReviewRequired, true);
  assert.equal(report.ingestPlan, null);
});

test('unknown rights require human rights review', () => {
  const fixture = createFactoryHandoffFixture({
    rights: { visual: 'CLEARED', music: 'UNKNOWN', voice: 'CLEARED', thirdParty: 'NOT_USED' }
  });
  const report = inspect(fixture);
  assert.equal(report.state, 'RIGHTS_REVIEW_REQUIRED');
  assert.ok(report.reasons.includes('RIGHTS_REVIEW_REQUIRED:music'));
});

test('invalid SHA-256 is rejected as invalid export', () => {
  const fixture = createFactoryHandoffFixture();
  fixture.assets[0].sha256 = 'not-a-sha';
  const report = inspect(fixture);
  assert.equal(report.state, 'INVALID_EXPORT');
  assert.match(report.reasons[0], /Invalid SHA-256/);
});

test('missing asset provenance blocks validation', () => {
  const fixture = createFactoryHandoffFixture();
  delete fixture.assets[0].provenance;
  const report = inspect(fixture);
  assert.equal(report.state, 'INVALID_EXPORT');
  assert.match(report.reasons[0], /provenance/);
});

test('observed asset hash mismatch is fail-closed', () => {
  const fixture = createFactoryHandoffFixture();
  fixture.assets[0].observedSha256 = 'f'.repeat(64);
  const report = inspect(fixture);
  assert.equal(report.state, 'HASH_MISMATCH');
  assert.ok(report.reasons.includes('HASH_MISMATCH:MASTER_VIDEO'));
});

test('duplicate export id is quarantined', () => {
  const fixture = createFactoryHandoffFixture();
  const report = inspect(fixture, { knownExportIds: [fixture.exportId] });
  assert.equal(report.state, 'QUARANTINED');
  assert.ok(report.reasons.includes('DUPLICATE_EXPORT_ID'));
});

test('duplicate package hash is quarantined', () => {
  const fixture = createFactoryHandoffFixture();
  const report = inspect(fixture, { knownPackageHashes: [fixture.package.packageHash] });
  assert.equal(report.state, 'QUARANTINED');
  assert.ok(report.reasons.includes('DUPLICATE_PACKAGE_HASH'));
});

test('unsupported schema version becomes invalid export', () => {
  const fixture = createFactoryHandoffFixture({ schemaVersion: 99 });
  const report = inspect(fixture);
  assert.equal(report.state, 'INVALID_EXPORT');
  assert.match(report.reasons[0], /schemaVersion/);
});

test('sensitive content is quarantined for human review', () => {
  const fixture = createFactoryHandoffFixture({
    content: { tags: ['comedy'], warnings: [], sensitiveFlags: ['minor'] }
  });
  const report = inspect(fixture);
  assert.equal(report.state, 'QUARANTINED');
  assert.ok(report.reasons.includes('SENSITIVE_CONTENT_REVIEW_REQUIRED:minor'));
});

test('technical placeholder asset is quarantined', () => {
  const fixture = createFactoryHandoffFixture();
  fixture.assets[2].ref = 'fixture://exports/pilot-das-zimmer/dashboard-placeholder.svg';
  fixture.assets[2].mimeType = 'image/svg+xml';
  fixture.assets[2].tags = ['dashboard_placeholder'];
  const report = inspect(fixture);
  assert.equal(report.state, 'QUARANTINED');
  assert.ok(report.reasons.includes('TECHNICAL_PLACEHOLDER:THUMBNAIL'));
});

test('path traversal and network references are rejected', () => {
  const traversal = createFactoryHandoffFixture();
  traversal.assets[0].ref = 'fixture://exports/../secret.mp4';
  assert.equal(inspect(traversal).state, 'INVALID_EXPORT');

  const network = createFactoryHandoffFixture();
  network.assets[0].ref = 'https://example.com/video.mp4';
  assert.equal(inspect(network).state, 'INVALID_EXPORT');
});

test('live actions remain impossible in every accepted result', () => {
  const report = inspect(createFactoryHandoffFixture());
  for (const action of ['live_publish', 'live_reply', 'live_delete', 'live_dm']) {
    assert.ok(report.forbiddenActions.includes(action));
    assert.ok(report.ingestPlan.forbiddenActions.includes(action));
  }
  assert.equal(report.boundaries.livePublishingAllowed, false);
  assert.equal(report.boundaries.networkUsed, false);
});

test('validation and report generation are deterministic', () => {
  const fixture = createFactoryHandoffFixture();
  const first = inspect(fixture);
  const second = inspect(createFactoryHandoffFixture());
  assert.deepEqual(first, second);
  assert.deepEqual(validateFactoryExport(fixture), validateFactoryExport(createFactoryHandoffFixture()));
});

test('no fixture can create creative, canon or production approval', () => {
  const report = inspect(createFactoryHandoffFixture());
  assert.equal(report.boundaries.automaticCreativeApproval, false);
  assert.equal(report.boundaries.canonMutationPerformed, false);
  assert.equal(report.boundaries.productionMutationPerformed, false);
  assert.doesNotMatch(JSON.stringify(report), /APPROVED_MASTER|CANON_APPROVED|LIVE_READY|PUBLISHED/);
});

test('HTML report is static, escaped, CSP sealed and offline', () => {
  const fixture = createFactoryHandoffFixture({ title: '<script>alert(1)</script>' });
  const report = inspect(fixture);
  const html = renderHandoffHtml(report);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.match(html, /LIVE READY: NEIN/);
  assert.match(html, /MAIN-INTEGRATION: NEIN/);
  assert.match(html, new RegExp(report.reportHash));
});
