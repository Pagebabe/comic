import { expect, test } from '@playwright/test';
import { resolveRiccoImageSources } from '../../src/lib/storage/riccoImageSourceResolver';
import { buildRiccoImageBlobId, splitRiccoImageStorage, type RiccoImageBlobRecord } from '../../src/lib/storage/riccoStoragePort';
import type { RiccoPanelImage } from '../../src/types/riccoReview';

function makeImage(input: Partial<RiccoPanelImage> = {}): RiccoPanelImage {
  return {
    id: input.id ?? 'img_1',
    panelId: input.panelId ?? 'panel_001',
    imageUrl: input.imageUrl ?? '/generated/panel_001.png',
    source: input.source ?? 'public_asset',
    promptUsed: input.promptUsed ?? 'prompt text',
    rating: input.rating ?? 5,
    continuityScore: input.continuityScore ?? 5,
    notes: input.notes ?? 'keeper',
    selected: input.selected ?? false,
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z'
  };
}

function makeBlob(imageId: string, dataUrl: string): RiccoImageBlobRecord {
  return {
    imageId,
    dataUrl,
    mimeType: 'image/png',
    sizeBytes: dataUrl.length,
    updatedAt: '2026-07-05T00:00:00.000Z'
  };
}

const legacyDataUrl = 'data:image/png;base64,bGVnYWN5';
const splitDataUrl = 'data:image/png;base64,c3BsaXQ=';
const indexedDbDataUrl = 'data:image/png;base64,aW5kZXhlZGRi';

test('keeps normal url metadata untouched', () => {
  const split = splitRiccoImageStorage([makeImage({ id: 'url', imageUrl: '/generated/panel.png' })]);
  const result = resolveRiccoImageSources({
    metadataImages: split.metadataImages,
    primaryRecords: [],
    secondaryRecords: [],
    legacyImages: []
  });

  expect(result.images[0].imageUrl).toBe('/generated/panel.png');
  expect(result.primaryHits).toBe(0);
  expect(result.secondaryHits).toBe(0);
  expect(result.legacyHits).toBe(0);
  expect(result.missingRefs).toBe(0);
});

test('prefers primary records over local split and legacy images', () => {
  const split = splitRiccoImageStorage([makeImage({ id: 'local', imageUrl: legacyDataUrl })]);
  const result = resolveRiccoImageSources({
    metadataImages: split.metadataImages,
    primaryRecords: [makeBlob('local', indexedDbDataUrl)],
    secondaryRecords: [makeBlob('local', splitDataUrl)],
    legacyImages: [makeImage({ id: 'local', imageUrl: legacyDataUrl })]
  });

  expect(result.images[0].imageUrl).toBe(indexedDbDataUrl);
  expect(result.primaryHits).toBe(1);
  expect(result.secondaryHits).toBe(0);
  expect(result.legacyHits).toBe(0);
  expect(result.missingRefs).toBe(0);
});

test('falls back to secondary records when primary is missing', () => {
  const split = splitRiccoImageStorage([makeImage({ id: 'local', imageUrl: legacyDataUrl })]);
  const result = resolveRiccoImageSources({
    metadataImages: split.metadataImages,
    primaryRecords: [],
    secondaryRecords: [makeBlob('local', splitDataUrl)],
    legacyImages: [makeImage({ id: 'local', imageUrl: legacyDataUrl })]
  });

  expect(result.images[0].imageUrl).toBe(splitDataUrl);
  expect(result.primaryHits).toBe(0);
  expect(result.secondaryHits).toBe(1);
  expect(result.legacyHits).toBe(0);
});

test('falls back to legacy data url when records are missing', () => {
  const split = splitRiccoImageStorage([makeImage({ id: 'local', imageUrl: legacyDataUrl })]);
  const result = resolveRiccoImageSources({
    metadataImages: split.metadataImages,
    primaryRecords: [],
    secondaryRecords: [],
    legacyImages: [makeImage({ id: 'local', imageUrl: legacyDataUrl })]
  });

  expect(result.images[0].imageUrl).toBe(legacyDataUrl);
  expect(result.legacyHits).toBe(1);
  expect(result.missingRefs).toBe(0);
});

test('reports unresolved blob refs when no source exists', () => {
  const split = splitRiccoImageStorage([makeImage({ id: 'local', imageUrl: legacyDataUrl })]);
  const result = resolveRiccoImageSources({
    metadataImages: split.metadataImages,
    primaryRecords: [],
    secondaryRecords: [],
    legacyImages: []
  });

  expect(result.images[0].imageUrl).toBe(buildRiccoImageBlobId('local'));
  expect(result.missingRefs).toBe(1);
});
