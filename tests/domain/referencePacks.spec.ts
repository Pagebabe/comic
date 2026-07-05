import { expect, test } from '@playwright/test';
import {
  assetStorageKey,
  buildAllReferencePacksCopyText,
  buildPackCopyText,
  buildReferenceReviewReport,
  countReferenceAssets,
  expectedReferenceAssetPath,
  filterReferencePacks,
  getReferenceAssetReview,
  riccoReferencePacks,
  slugifyReferenceName
} from '../../src/domain/referencePacks/riccoReferencePacks';
import type { ReferenceReviewState } from '../../src/types/riccoReferenceReview';

test('builds core Ricco reference packs', () => {
  expect(riccoReferencePacks.length).toBeGreaterThanOrEqual(9);
  expect(riccoReferencePacks.some((pack) => pack.title === 'Ricco')).toBe(true);
  expect(riccoReferencePacks.some((pack) => pack.type === 'style')).toBe(true);
  expect(countReferenceAssets(riccoReferencePacks)).toBeGreaterThan(40);
});

test('slugifies German names for reference folders', () => {
  expect(slugifyReferenceName('Flur / Treppenhaus')).toBe('flur-treppenhaus');
  expect(slugifyReferenceName('Gemeinschaftsküche')).toBe('gemeinschaftskuche');
});

test('filters packs by type', () => {
  expect(filterReferencePacks(riccoReferencePacks, 'character').every((pack) => pack.type === 'character')).toBe(true);
  expect(filterReferencePacks(riccoReferencePacks, 'location').every((pack) => pack.type === 'location')).toBe(true);
  expect(filterReferencePacks(riccoReferencePacks, 'all')).toHaveLength(riccoReferencePacks.length);
});

test('builds expected asset paths and storage keys', () => {
  const pack = riccoReferencePacks.find((item) => item.title === 'Ricco');
  expect(pack).toBeTruthy();
  const asset = pack!.assets.find((item) => item.fileName === 'front_v1.png');
  expect(asset).toBeTruthy();

  expect(expectedReferenceAssetPath(pack!, asset!)).toBe('public/references/characters/ricco/front_v1.png');
  expect(assetStorageKey(pack!, asset!)).toContain('::');
});

test('returns default review state for untouched assets', () => {
  const pack = riccoReferencePacks[0];
  const asset = pack.assets[0];
  const review = getReferenceAssetReview({}, pack, asset);

  expect(review).toMatchObject({ status: 'raw', imagePath: '', notes: '' });
});

test('includes review state in copy text and report', () => {
  const pack = riccoReferencePacks.find((item) => item.title === 'Ricco')!;
  const asset = pack.assets[0];
  const state: ReferenceReviewState = {
    [assetStorageKey(pack, asset)]: {
      status: 'approved_reference',
      imagePath: expectedReferenceAssetPath(pack, asset),
      notes: 'identity locked',
      updatedAt: '2026-07-05T00:00:00.000Z'
    }
  };

  const packText = buildPackCopyText(pack, state);
  const allText = buildAllReferencePacksCopyText([pack], state);
  const report = buildReferenceReviewReport([pack], state, '2026-07-05T00:00:00.000Z');

  expect(packText).toContain('approved_reference');
  expect(packText).toContain('identity locked');
  expect(allText).toContain('REFERENCE PACK: Ricco');
  expect(report).toContain('Ricco Reference Review Report');
  expect(report).toContain('approved_reference');
});
