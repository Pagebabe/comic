import { expect, test } from '@playwright/test';
import {
  buildRiccoImageBlobId,
  buildRiccoImageStorageReport,
  createMemoryStorageLike,
  createRiccoStoragePort,
  hydrateRiccoImagesFromSplit,
  isRiccoLocalDataUrl,
  mimeTypeFromDataUrl,
  splitRiccoImageStorage
} from '../../src/lib/storage/riccoStoragePort';
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

const tinyPngDataUrl = 'data:image/png;base64,aGVsbG8=';

test('storage port safely reads writes json and removes values', () => {
  const storage = createMemoryStorageLike();
  const port = createRiccoStoragePort(storage);

  expect(port.readText('missing')).toBe('');
  expect(port.writeText('hello', 'world')).toBe(true);
  expect(port.readText('hello')).toBe('world');
  expect(port.writeJson('json', { ok: true })).toBe(true);
  expect(port.readJson('json', { ok: false })).toEqual({ ok: true });
  expect(port.readJson('broken', { fallback: true })).toEqual({ fallback: true });
  expect(port.remove('hello')).toBe(true);
  expect(port.readText('hello')).toBe('');
});

test('detects local data urls and mime types', () => {
  expect(isRiccoLocalDataUrl(tinyPngDataUrl)).toBe(true);
  expect(isRiccoLocalDataUrl('/generated/panel.png')).toBe(false);
  expect(mimeTypeFromDataUrl(tinyPngDataUrl)).toBe('image/png');
  expect(buildRiccoImageBlobId('img_1')).toBe('ricco-image-blob:img_1');
});

test('splits local data url images into metadata and blob records', () => {
  const split = splitRiccoImageStorage([
    makeImage({ id: 'local', imageUrl: tinyPngDataUrl }),
    makeImage({ id: 'url', imageUrl: '/generated/panel_002.png' })
  ], '2026-07-05T00:00:00.000Z');

  expect(split.summary.totalImages).toBe(2);
  expect(split.summary.localDataUrlImages).toBe(1);
  expect(split.summary.urlImages).toBe(1);
  expect(split.summary.blobRefImages).toBe(1);
  expect(split.imageBlobs).toHaveLength(1);
  expect(split.imageBlobs[0]).toMatchObject({ imageId: 'local', dataUrl: tinyPngDataUrl, mimeType: 'image/png' });
  expect(split.metadataImages.find((image) => image.id === 'local')).toMatchObject({
    imageUrl: 'ricco-image-blob:local',
    imageDataKind: 'blob_ref',
    imageDataRef: 'ricco-image-blob:local'
  });
  expect(split.metadataImages.find((image) => image.id === 'url')).toMatchObject({
    imageUrl: '/generated/panel_002.png',
    imageDataKind: 'url'
  });
});

test('hydrates split image metadata back into review images', () => {
  const original = [
    makeImage({ id: 'local', imageUrl: tinyPngDataUrl }),
    makeImage({ id: 'url', imageUrl: '/generated/panel_002.png' })
  ];
  const split = splitRiccoImageStorage(original, '2026-07-05T00:00:00.000Z');
  const hydrated = hydrateRiccoImagesFromSplit(split.metadataImages, split.imageBlobs);

  expect(hydrated).toHaveLength(2);
  expect(hydrated.find((image) => image.id === 'local')?.imageUrl).toBe(tinyPngDataUrl);
  expect(hydrated.find((image) => image.id === 'url')?.imageUrl).toBe('/generated/panel_002.png');
});

test('builds readable storage split report', () => {
  const split = splitRiccoImageStorage([makeImage({ id: 'local', imageUrl: tinyPngDataUrl })], '2026-07-05T00:00:00.000Z');
  const report = buildRiccoImageStorageReport(split);

  expect(report).toContain('Ricco Image Storage Split Report');
  expect(report).toContain('Total images: 1');
  expect(report).toContain('Local data-url images moved to blob records: 1');
});
