import { sha256 } from './handoff.mjs';

const asset = ({ role, ref, mimeType, sizeBytes, seed, tags = [] }) => {
  const digest = sha256(`fixture-asset:${seed}`);
  return Object.freeze({
    role,
    ref,
    sha256: digest,
    observedSha256: digest,
    mimeType,
    sizeBytes,
    provenance: Object.freeze({
      sourceSystem: 'comic-factory-fixture',
      sourceRef: `fixture-source:${seed}`,
      evidenceRef: `fixture-evidence:${seed}`
    }),
    tags: Object.freeze(tags)
  });
};

export function createFactoryHandoffFixture(overrides = {}) {
  const assets = overrides.assets ?? [
    asset({
      role: 'MASTER_VIDEO',
      ref: 'fixture://exports/pilot-das-zimmer/master-video.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 12_345_678,
      seed: 'master-video'
    }),
    asset({
      role: 'SUBTITLES',
      ref: 'fixture://exports/pilot-das-zimmer/subtitles.srt',
      mimeType: 'text/plain',
      sizeBytes: 4_096,
      seed: 'subtitles'
    }),
    asset({
      role: 'THUMBNAIL',
      ref: 'fixture://exports/pilot-das-zimmer/thumbnail.webp',
      mimeType: 'image/webp',
      sizeBytes: 245_760,
      seed: 'thumbnail'
    }),
    asset({
      role: 'TRANSCRIPT',
      ref: 'fixture://exports/pilot-das-zimmer/transcript.json',
      mimeType: 'application/json',
      sizeBytes: 8_192,
      seed: 'transcript'
    })
  ];

  const packageCore = {
    packageRef: 'fixture-package:pilot-das-zimmer:v1',
    canonRef: 'fixture-canon:pilot-das-zimmer:v1',
    assets: assets.map(({ role, sha256: digest }) => ({ role, sha256: digest }))
  };

  const base = {
    schemaVersion: 1,
    contractVersion: 'comic-growth-os.factory-handoff.v1',
    exportId: 'factory-export:pilot-das-zimmer:v1',
    projectId: 'comic-factory',
    seriesId: 'series-nebenwirkung',
    episodeId: 'pilot-das-zimmer',
    title: 'Das Zimmer · synthetischer Handoff-Test',
    durationSeconds: 45.5,
    source: {
      kind: 'synthetic_fixture',
      sourceRef: 'fixture://factory/pilot-das-zimmer'
    },
    package: {
      packageRef: packageCore.packageRef,
      packageHash: sha256(packageCore),
      canonRef: packageCore.canonRef
    },
    assets,
    approval: {
      status: 'APPROVED_FOR_SHADOW_DEMO',
      approvedBy: 'fixture-human-reviewer',
      approvedAt: '2026-07-11T00:00:00.000Z',
      evidenceRef: 'fixture-evidence:shadow-demo-approval'
    },
    rights: {
      visual: 'CLEARED',
      music: 'NOT_USED',
      voice: 'CLEARED',
      thirdParty: 'NOT_USED'
    },
    content: {
      tags: ['comedy', 'pilot', 'berlin'],
      warnings: [],
      sensitiveFlags: []
    },
    exportedAt: '2026-07-11T00:00:00.000Z',
    toolVersion: 'comic-factory-fixture.v1'
  };

  return structuredClone({ ...base, ...overrides });
}
