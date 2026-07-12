import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStudioGrowthBrief,
  computeStudioMkt0Integrity,
  inspectStudioMkt0Package,
  LIVE_GATES_BLOCKED,
  markShadowIngested,
  validateStudioMkt0Package
} from '../growth-os/studio-mkt0-integration.mjs';
import {
  createGrowthAnalysisFixture,
  createStudioMkt0PackageFixture
} from '../growth-os/studio-mkt0-integration-fixture.mjs';

test('contract contains every required studio-to-MKT0 field', () => {
  const value = validateStudioMkt0Package(createStudioMkt0PackageFixture());
  for (const field of [
    'project_id', 'episode_id', 'asset_id', 'production_status', 'qa_status',
    'approved_platforms', 'format', 'caption_base', 'hook_variants',
    'publishing_window', 'policy_status', 'human_review_status', 'version',
    'created_at', 'integrity'
  ]) assert.ok(field in value, field);
});

test('approved package reaches READY_FOR_SHADOW only', () => {
  const report = inspectStudioMkt0Package(createStudioMkt0PackageFixture());
  assert.equal(report.state, 'READY_FOR_SHADOW');
  assert.equal(report.shadow_plan.jobs.length, 3);
  assert.ok(report.shadow_plan.jobs.every((job) => !job.publish_allowed && !job.network_allowed && job.execution_mode === 'shadow'));
});

test('shadow ingest records state without publication', () => {
  const ingested = markShadowIngested(inspectStudioMkt0Package(createStudioMkt0PackageFixture()));
  assert.equal(ingested.state, 'SHADOW_INGESTED');
  assert.equal(ingested.shadow_plan.publishing_enabled, false);
});

test('incomplete production is blocked', () => {
  const pkg = createStudioMkt0PackageFixture({ production_status: 'DRAFT' });
  pkg.integrity.payload_sha256 = computeStudioMkt0Integrity(pkg);
  assert.equal(inspectStudioMkt0Package(pkg).state, 'PRODUCTION_NOT_COMPLETE');
});

test('QA human review state is stopped', () => {
  const pkg = createStudioMkt0PackageFixture({ qa_status: 'HUMAN_REVIEW_REQUIRED' });
  pkg.integrity.payload_sha256 = computeStudioMkt0Integrity(pkg);
  assert.equal(inspectStudioMkt0Package(pkg).state, 'HUMAN_REVIEW_REQUIRED');
});

test('missing asset is invalid', () => {
  const pkg = createStudioMkt0PackageFixture();
  delete pkg.asset;
  pkg.integrity.payload_sha256 = computeStudioMkt0Integrity(pkg);
  assert.equal(inspectStudioMkt0Package(pkg).state, 'INVALID_PACKAGE');
});

test('invalid checksum is detected', () => {
  const pkg = createStudioMkt0PackageFixture();
  pkg.integrity.payload_sha256 = '0'.repeat(64);
  assert.equal(inspectStudioMkt0Package(pkg).state, 'INTEGRITY_FAILURE');
});

test('duplicate event does not create duplicate jobs', () => {
  const pkg = createStudioMkt0PackageFixture();
  const report = inspectStudioMkt0Package(pkg, { processed_event_ids: [pkg.event_id] });
  assert.equal(report.state, 'DUPLICATE_IGNORED');
  assert.equal(report.shadow_plan, null);
});

test('duplicate integrity hash is idempotently ignored', () => {
  const pkg = createStudioMkt0PackageFixture();
  const report = inspectStudioMkt0Package(pkg, {
    processed_integrity_hashes: [computeStudioMkt0Integrity(pkg)]
  });
  assert.equal(report.state, 'DUPLICATE_IGNORED');
  assert.equal(report.shadow_plan, null);
});

test('repeated inspection is deterministic', () => {
  const pkg = createStudioMkt0PackageFixture();
  assert.deepEqual(inspectStudioMkt0Package(pkg), inspectStudioMkt0Package(pkg));
});

test('missing explicit human approval blocks package', () => {
  const pkg = createStudioMkt0PackageFixture({ human_review_status: { status: 'PENDING' } });
  pkg.integrity.payload_sha256 = computeStudioMkt0Integrity(pkg);
  assert.equal(inspectStudioMkt0Package(pkg).state, 'HUMAN_REVIEW_REQUIRED');
});

test('unapproved platform scope is blocked', () => {
  const pkg = createStudioMkt0PackageFixture({ approved_platforms: ['tiktok'] });
  pkg.integrity.payload_sha256 = computeStudioMkt0Integrity(pkg);
  assert.equal(
    inspectStudioMkt0Package(pkg, { requested_platforms: ['youtube_shorts'] }).state,
    'PLATFORM_SCOPE_BLOCKED'
  );
});

test('any relaxed live gate fails closed', () => {
  const report = inspectStudioMkt0Package(createStudioMkt0PackageFixture(), {
    live_gates: { ...LIVE_GATES_BLOCKED, oauth_authorized: true }
  });
  assert.equal(report.state, 'LIVE_GATE_VIOLATION');
  assert.equal(report.shadow_plan, null);
});

test('analytics fixture creates a constrained production briefing', () => {
  const brief = buildStudioGrowthBrief(
    createGrowthAnalysisFixture(),
    createStudioMkt0PackageFixture()
  );
  assert.equal(brief.state, 'PRODUCTION_BRIEF_READY');
  assert.equal(brief.episode_id, 'episode-001');
  assert.equal(brief.canon_change_allowed, false);
  assert.ok(brief.recommendations.includes('CREATE_FOLLOW_UP'));
  assert.ok(brief.recommendations.includes('NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL'));
});
