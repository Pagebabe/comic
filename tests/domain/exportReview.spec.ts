import { expect, test } from '@playwright/test';
import {
  buildRiccoExportReadiness,
  buildRiccoQAReportItems,
  summarizeRiccoQAItems
} from '../../src/domain/export/riccoExportState';
import {
  buildManualReviewImage,
  deleteRiccoReviewImage,
  getPanelReviewImages,
  selectFinalRiccoReviewImage,
  summarizeRiccoReviewImages,
  updateRiccoReviewImage
} from '../../src/domain/review/riccoReviewState';
import type { RiccoPanelImage } from '../../src/types/riccoReview';

function makeImage(input: Partial<RiccoPanelImage> = {}): RiccoPanelImage {
  return {
    id: input.id ?? 'img_1',
    panelId: input.panelId ?? 'panel_001',
    imageUrl: input.imageUrl ?? '/generated/panel_001.png',
    source: input.source ?? 'public_asset',
    promptUsed: input.promptUsed ?? '',
    rating: input.rating ?? 0,
    continuityScore: input.continuityScore ?? 0,
    notes: input.notes ?? '',
    selected: input.selected ?? false,
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z',
    generationJobId: input.generationJobId,
    promptId: input.promptId
  };
}

test('creates manual review images with clean defaults', () => {
  const image = buildManualReviewImage({
    id: 'img_manual',
    panelId: 'panel_001',
    imageUrl: ' /generated/panel_001.png ',
    source: 'manual_url',
    promptUsed: ' prompt ',
    createdAt: '2026-07-05T00:00:00.000Z'
  });

  expect(image).toMatchObject({
    id: 'img_manual',
    panelId: 'panel_001',
    imageUrl: '/generated/panel_001.png',
    promptUsed: 'prompt',
    rating: 0,
    continuityScore: 0,
    selected: false
  });
});

test('selects only one final image per panel', () => {
  const images = [
    makeImage({ id: 'a', panelId: 'panel_001', selected: true }),
    makeImage({ id: 'b', panelId: 'panel_001', selected: false }),
    makeImage({ id: 'c', panelId: 'panel_002', selected: true })
  ];

  const nextImages = selectFinalRiccoReviewImage(images, 'b');

  expect(nextImages.find((image) => image.id === 'a')?.selected).toBe(false);
  expect(nextImages.find((image) => image.id === 'b')?.selected).toBe(true);
  expect(nextImages.find((image) => image.id === 'c')?.selected).toBe(true);
});

test('summarizes review images and sorts selected panel images first', () => {
  const images = [
    makeImage({ id: 'open', panelId: 'panel_001', selected: false, generationJobId: 'job_1' }),
    makeImage({ id: 'final', panelId: 'panel_001', selected: true })
  ];

  const summary = summarizeRiccoReviewImages(images);
  const panelImages = getPanelReviewImages(images, 'panel_001');

  expect(summary.finalCount).toBe(1);
  expect(summary.generationLinkedCount).toBe(1);
  expect(panelImages.map((image) => image.id)).toEqual(['final', 'open']);
});

test('updates and deletes review images immutably', () => {
  const images = [makeImage({ id: 'a' }), makeImage({ id: 'b' })];
  const updated = updateRiccoReviewImage(images, 'a', { rating: 5, notes: 'keeper' });
  const deleted = deleteRiccoReviewImage(updated, 'b');

  expect(updated.find((image) => image.id === 'a')).toMatchObject({ rating: 5, notes: 'keeper' });
  expect(deleted.map((image) => image.id)).toEqual(['a']);
});

test('builds export readiness and QA summaries from final images', () => {
  const images = [
    makeImage({ id: 'a', panelId: 'panel_001', selected: true, rating: 5, continuityScore: 5, notes: 'good' }),
    makeImage({ id: 'b', panelId: 'panel_002', selected: true, rating: 2, continuityScore: 5, notes: 'weak rating' })
  ];

  const readiness = buildRiccoExportReadiness(images);
  const qaSummary = summarizeRiccoQAItems(buildRiccoQAReportItems(images));

  expect(readiness.finalCount).toBe(2);
  expect(readiness.isReady).toBe(false);
  expect(qaSummary.blockers.length).toBeGreaterThan(0);
  expect(qaSummary.warnings.length).toBe(1);
});
