import { riccoPanels } from '../../data/riccoStudio';
import type { GenerationJob } from '../../types/productionBackend';
import type { ImageSource, RiccoPanelImage } from '../../types/riccoReview';
import { isLocalDataUrlImage } from '../review/riccoReviewState';

export type AssetLibraryPanelFilter = 'all' | string;
export type AssetLibraryFinalFilter = 'all' | 'final' | 'variant';
export type AssetLibraryJobFilter = 'all' | 'linked' | 'unlinked';
export type AssetLibrarySourceFilter = 'all' | ImageSource;

export type AssetLibraryFilters = {
  panelId: AssetLibraryPanelFilter;
  finalFilter: AssetLibraryFinalFilter;
  jobFilter: AssetLibraryJobFilter;
  source: AssetLibrarySourceFilter;
  query: string;
};

export type AssetLibraryItem = {
  image: RiccoPanelImage;
  panelTitle: string;
  panelNumber: number;
  generationJob: GenerationJob | null;
  isLocal: boolean;
  isFinal: boolean;
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
};

export const DEFAULT_ASSET_LIBRARY_FILTERS: AssetLibraryFilters = {
  panelId: 'all',
  finalFilter: 'all',
  jobFilter: 'all',
  source: 'all',
  query: ''
};

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
      isFinal: image.selected
    };
  }).sort((a, b) => a.panelNumber - b.panelNumber || Number(b.isFinal) - Number(a.isFinal) || b.image.createdAt.localeCompare(a.image.createdAt));
}

export function summarizeAssetLibrary(items: AssetLibraryItem[]): AssetLibrarySummary {
  const sources = Array.from(new Set(items.map((item) => item.image.source))).sort();

  return {
    total: items.length,
    finals: items.filter((item) => item.isFinal).length,
    variants: items.filter((item) => !item.isFinal).length,
    localImages: items.filter((item) => item.isLocal).length,
    urlImages: items.filter((item) => !item.isLocal).length,
    linkedToJobs: items.filter((item) => item.generationJob).length,
    unlinked: items.filter((item) => !item.generationJob).length,
    sources
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

    if (!query) return true;

    const haystack = [
      item.image.id,
      item.image.panelId,
      item.panelTitle,
      item.image.source,
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
    '',
    'Assets:',
    ...items.map((item) => `Panel ${item.panelNumber}: ${item.panelTitle} — ${item.isFinal ? 'FINAL' : 'variant'} — ${item.image.source} — ${item.image.id}`)
  ].join('\n');
}
