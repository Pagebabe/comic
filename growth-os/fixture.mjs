import { runShadowPipeline } from './core.mjs';

export const FIXED_TIMESTAMP = '2026-07-11T08:00:00.000Z';

export const syntheticEpisodePackage = Object.freeze({
  schemaVersion: 1,
  id: 'synthetic:ricco-shadow-001',
  projectId: 'comic-factory',
  seriesId: 'ricco-im-haus',
  episodeId: 'shadow-fixture-001',
  title: 'Synthetischer MKT0-Demofall',
  durationSeconds: 24,
  source: { kind: 'synthetic_fixture', sourceRef: 'growth-os/fixture.mjs' },
  assets: {
    masterVideo: 'fixtures/nonexistent-shadow-master.mp4',
    subtitles: 'fixtures/nonexistent-shadow-subtitles.srt'
  },
  rights: { musicStatus: 'not_used' },
  approval: {
    status: 'APPROVED_FOR_SHADOW_DEMO',
    approvedBy: 'fixture',
    approvedAt: FIXED_TIMESTAMP
  },
  contentTags: ['comedy', 'dj', 'berlin'],
  characters: ['char_ricco']
});

export const syntheticMetrics = Object.freeze({
  views: 125000,
  holdRate3s: 0.78,
  completionRate: 0.62,
  averageWatchSeconds: 18.4,
  shares: 3900,
  saves: 1700,
  comments: 950,
  followersGained: 2100,
  profileVisits: 9600,
  productionHours: 7.5
});

export const syntheticBaseline = Object.freeze({
  holdRate3s: 0.61,
  completionRate: 0.44,
  watchRatio: 0.58,
  shareRate: 0.012,
  saveRate: 0.006,
  commentRate: 0.004,
  followerConversionRate: 0.12,
  productionEfficiency: 9000
});

export function runSyntheticShadowDemo() {
  return runShadowPipeline({
    episodePackage: syntheticEpisodePackage,
    metrics: syntheticMetrics,
    baseline: syntheticBaseline,
    timestamp: FIXED_TIMESTAMP
  });
}
