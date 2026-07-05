import { riccoPanels } from '../../data/riccoStudio';
import type { AssetStatus, GenerationJob } from '../../types/productionBackend';
import type { ImageSource, RiccoPanelImage } from '../../types/riccoReview';
import { isLocalDataUrlImage } from '../review/riccoReviewState';

export type AssetLibraryPanelFilter = 'all' | string;
export type AssetLibraryFinalFilter = 'all' | 'final' | 'variant';
export type AssetLibraryJobFilter = 'all' | 'linked' | 'unlinked';
export type AssetLibrarySourceFilter = 'all' | ImageSource;
export type AssetLibraryStatusFilter = 'all' | AssetStatus;

export type AssetLibraryFilters = {
  panelId: AssetLibraryPanelFilter;
  finalFilter: AssetLibraryFinalFilter;
  jobFilter: AssetLibraryJobFilter;
  source: AssetLibrarySourceFilter;
  status: AssetLibraryStatusFilter;
  query: string;
};

export type AssetLibraryItem = {
  image: RiccoPanelImage;
  panelTitle: string;
  panelNumber: number;
  generationJob: GenerationJob | null;
  isLocal: boolean;
  isFinal: boolean;
  assetStatus: AssetStatus;
};

export type AssetLibrarySummary = {
  total: number;
  finals: number;
  variants: number;
  localImages: number;
  urlImages: number;
  linkedToJobs: number;
  unlinked: number;
  sources: string[];
  statusCounts: Record<AssetStatus, number>;
};

export const ASSET_STATUS_OPTIONS: AssetStatus[] = [
  'raw',
  'maybe',
  'selected',
  'rejected',
  'reference_candidate',
  'approved_reference',
  'dataset_candidate',
  'approved_dataset',
  'needs_fix',
  'fixed',
  'approved_panel'
];

export const DEFAULT_ASSET_LIBRARY_FILTERS: AssetLibraryFilters = {
  panelId: 'all',
  finalFilter: 'all',
  jobFilter: 'all',
  source: 'all',
  status: 'all',
  query: ''
};

export function statusForAsset(image: RiccoPanelImage): AssetStatus {
  if (image.assetStatus) return image.assetStatus;
  if (image.selected) return 'approved_panel';
  return 'raw';
}

export function statusClassForAsset(status: AssetStatus) {
  if (['approved_panel', 'approved_reference', 'approved_dataset', 'selected', 'fixed'].includes(status)) return 'status-active';
  if (['needs_fix', 'rejected'].includes(status)) return 'status-rejected';
  return 'status-needs_fix';
}

export function updateAssetStatus(images: RiccoPanelImage[], imageId: string, status: AssetStatus, updatedAt = new Date().toISOString()) {
  return images.map((image) => image.id === imageId ? { ...image, assetStatus: status, assetStatusUpdatedAt: updatedAt } : image);
}

export function buildAssetLibraryItems(images: RiccoPanelImage[], generationJobs: GenerationJob[]): AssetLibraryItem[] {
  const jobsById = new Map(generationJobs.map((job) => [job.id, job]));

  return images.map((image) => {
    const panel = riccoPanels.find((item) => item.id === image.panelId);

    return {
      image,
      panelTitle: panel?.title ?? image.panelId,
      panelNumber: panel?.panelNumber ?? 999,
      generationJob: image.generationJobId ? jobsById.get(image.generationJobId) ?? null : null,
      isLocal: isLocalDataUrlImage(image),
      isFinal: image.selected,
      assetStatus: statusForAsset(image)
    };
  }).sort((a, b) => a.panelNumber - b.panelNumber || Number(b.isFinal) - Number(a.isFinal) || b.image.createdAt.localeCompare(a.image.createdAt));
}

export function summarizeAssetLibrary(items: AssetLibraryItem[]): AssetLibrarySummary {
  const sources = Array.from(new Set(items.map((item) => item.image.source))).sort();
  const statusCounts = Object.fromEntries(ASSET_STATUS_OPTIONS.map((status) => [status, 0])) as Record<AssetStatus, number>;

  for (const item of items) {
    statusCounts[item.assetStatus] += 1;
  }

  return {
    total: items.length,
    finals: items.filter((item) => item.isFinal).length,
    variants: items.filter((item) => !item.isFinal).length,
    localImages: items.filter((item) => item.isLocal).length,
    urlImages: items.filter((item) => !item.isLocal).length,
    linkedToJobs: items.filter((item) => item.generationJob).length,
    unlinked: items.filter((item) => !item.generationJob).length,
    sources,
    statusCounts
  };
}

export function filterAssetLibraryItems(items: AssetLibraryItem[], filters: AssetLibraryFilters): AssetLibraryItem[] {
  const query = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.panelId !== 'all' && item.image.panelId !== filters.panelId) return false;
    if (filters.finalFilter === 'final' && !item.isFinal) return false;
    if (filters.finalFilter === 'variant' && item.isFinal) return false;
    if (filters.jobFilter === 'linked' && !item.generationJob) return false;
    if (filters.jobFilter === 'unlinked' && item.generationJob) return false;
    if (filters.source !== 'all' && item.image.source !== filters.source) return false;
    if (filters.status !== 'all' && item.assetStatus !== filters.status) return false;

    if (!query) return true;

    const haystack = [
      item.image.id,
      item.image.panelId,
      item.panelTitle,
      item.image.source,
      item.assetStatus,
      item.image.notes,
      item.image.promptUsed,
      item.image.generationJobId ?? '',
      item.image.promptId ?? '',
      item.generationJob?.status ?? '',
      item.generationJob?.workflowId ?? ''
    ].join(' ').toLowerCase();

    return haystack.includes(query);
  });
}

export function buildAssetLibraryReport(items: AssetLibraryItem[]) {
  const summary = summarizeAssetLibrary(items);
  const nonZeroStatusLines = ASSET_STATUS_OPTIONS
    .filter((status) => summary.statusCounts[status] > 0)
    .map((status) => `${status}: ${summary.statusCounts[status]}`);

  return [
    'Ricco Asset Library Report',
    `Total assets: ${summary.total}`,
    `Finals: ${summary.finals}`,
    `Variants: ${summary.variants}`,
    `Local images: ${summary.localImages}`,
    `URL/Public images: ${summary.urlImages}`,
    `Linked to jobs: ${summary.linkedToJobs}`,
    `Unlinked: ${summary.unlinked}`,
    `Sources: ${summary.sources.join(', ') || 'none'}`,
    `Status: ${nonZeroStatusLines.join(', ') || 'none'}`,
    '',
    'Assets:',
    ...items.map((item) => `Panel ${item.panelNumber}: ${item.panelTitle} — ${item.isFinal ? 'FINAL' : 'variant'} — ${item.assetStatus} — ${item.image.source} — ${item.image.id}`)
  ].join('\n');
}
