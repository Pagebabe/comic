import { computeStudioMkt0Integrity, STUDIO_MKT0_CONTRACT_ID } from './studio-mkt0-integration.mjs';
import { sha256 } from './handoff.mjs';

export function createStudioMkt0PackageFixture(overrides = {}) {
  const assetDigest = sha256('fixture:episode-001:master-short');
  const base = {
    schema_version: 1,
    contract_id: STUDIO_MKT0_CONTRACT_ID,
    mode: 'shadow',
    event_id: 'studio-mkt0:episode-001:asset-master-short:v1',
    project_id: 'comic-factory',
    episode_id: 'episode-001',
    asset_id: 'asset-master-short',
    production_status: 'PRODUCTION_COMPLETE',
    qa_status: 'QA_PASSED',
    approved_platforms: ['tiktok', 'instagram_reels', 'youtube_shorts'],
    format: { kind: 'short_video', aspect_ratio: '9:16', duration_seconds: 42 },
    caption_base: 'Rico dachte, das Zimmer sei frei. Das Zimmer hatte andere Pläne.',
    hook_variants: [
      { id: 'hook-a', text: 'Wenn dein neues Zimmer dich zuerst kündigt.' },
      { id: 'hook-b', text: 'Berliner Wohnungsbesichtigung, aber das Zimmer bewertet dich.' }
    ],
    publishing_window: {
      timezone: 'Europe/Berlin',
      earliest_at: '2026-07-13T10:00:00.000Z',
      latest_at: '2026-07-15T18:00:00.000Z'
    },
    policy_status: {
      status: 'PASSED',
      checks: ['SFW', 'RIGHTS_METADATA_PRESENT', 'NO_LIVE_ACCOUNT_REQUIRED']
    },
    human_review_status: {
      status: 'APPROVED',
      reviewed_by: 'fixture-human-reviewer',
      reviewed_at: '2026-07-12T07:30:00.000Z',
      evidence_ref: 'fixture-evidence:studio-mkt0-approval:v1'
    },
    version: '1.0.0',
    created_at: '2026-07-12T07:00:00.000Z',
    asset: {
      id: 'asset-master-short',
      role: 'MASTER_SHORT_VIDEO',
      ref: 'fixture://studio/episode-001/master-short.mp4',
      sha256: assetDigest,
      observed_sha256: assetDigest,
      mime_type: 'video/mp4',
      size_bytes: 8_388_608,
      provenance: {
        source_system: 'comic-studio-fixture',
        source_ref: 'fixture://studio/episode-001',
        evidence_ref: 'fixture-evidence:episode-001-export'
      }
    }
  };
  const merged = structuredClone({ ...base, ...overrides });
  merged.integrity = overrides.integrity ?? { algorithm: 'sha256', payload_sha256: computeStudioMkt0Integrity(merged) };
  return merged;
}

export function createGrowthAnalysisFixture(overrides = {}) {
  return Object.freeze({
    status: 'ANALYZED',
    snapshotId: 'snapshot-episode-001-tiktok',
    classification: 'WINNER',
    recommendations: Object.freeze([
      { code: 'CREATE_FOLLOW_UP' },
      { code: 'STRENGTHEN_SERIES_AND_CHARACTER_SIGNAL' }
    ]),
    ...overrides
  });
}
