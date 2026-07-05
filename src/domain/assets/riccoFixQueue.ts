import type { AssetStatus, GenerationJob } from '../../types/productionBackend';
import type { RiccoPanelImage } from '../../types/riccoReview';
import {
  buildAssetLibraryItems,
  statusClassForAsset,
  updateAssetStatus,
  type AssetLibraryItem
} from './riccoAssetLibrary';

export type FixQueueItem = AssetLibraryItem & {
  fixReason: string;
  suggestedAction: string;
};

export type FixQueueSummary = {
  total: number;
  linkedToJobs: number;
  unlinked: number;
  panelsAffected: number;
  localImages: number;
  urlImages: number;
};

export const FIX_QUEUE_RESOLUTION_STATUSES: AssetStatus[] = ['fixed', 'approved_panel', 'rejected'];

export function buildFixQueueItems(images: RiccoPanelImage[], generationJobs: GenerationJob[]): FixQueueItem[] {
  return buildAssetLibraryItems(images, generationJobs)
    .filter((item) => item.assetStatus === 'needs_fix')
    .map((item) => ({
      ...item,
      fixReason: item.image.notes.trim() || 'Kein Fix-Grund notiert. In Image Review genauer beschreiben.',
      suggestedAction: item.generationJob
        ? 'Use the linked generation job and notes to create a repair attempt.'
        : 'Open Image Review, inspect the image and create a new generation job or manual fix.'
    }));
}

export function summarizeFixQueue(items: FixQueueItem[]): FixQueueSummary {
  return {
    total: items.length,
    linkedToJobs: items.filter((item) => item.generationJob).length,
    unlinked: items.filter((item) => !item.generationJob).length,
    panelsAffected: new Set(items.map((item) => item.image.panelId)).size,
    localImages: items.filter((item) => item.isLocal).length,
    urlImages: items.filter((item) => !item.isLocal).length
  };
}

export function buildFixQueueReport(items: FixQueueItem[]) {
  const summary = summarizeFixQueue(items);

  return [
    'Ricco Fix Queue Report',
    `Needs fix: ${summary.total}`,
    `Panels affected: ${summary.panelsAffected}`,
    `Linked to jobs: ${summary.linkedToJobs}`,
    `Unlinked: ${summary.unlinked}`,
    `Local images: ${summary.localImages}`,
    `URL/Public images: ${summary.urlImages}`,
    '',
    'Items:',
    ...items.map((item) => [
      `Panel ${item.panelNumber}: ${item.panelTitle}`,
      `Image: ${item.image.id}`,
      `Status: ${item.assetStatus}`,
      `Job: ${item.generationJob?.id ?? 'none'}`,
      `Reason: ${item.fixReason}`,
      `Action: ${item.suggestedAction}`
    ].join('\n'))
  ].join('\n\n---\n\n');
}

export function resolveFixQueueItem(images: RiccoPanelImage[], imageId: string, status: AssetStatus, updatedAt = new Date().toISOString()) {
  if (!FIX_QUEUE_RESOLUTION_STATUSES.includes(status)) {
    return images;
  }

  return updateAssetStatus(images, imageId, status, updatedAt);
}

export { statusClassForAsset };
