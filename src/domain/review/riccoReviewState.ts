import { riccoPanels } from '../../data/riccoStudio';
import type { GenerationJob } from '../../types/productionBackend';
import type { ImageSource, RiccoPanelImage } from '../../types/riccoReview';

export const MAX_LOCAL_FILE_BYTES = 3_500_000;
export const STORAGE_WARNING_BYTES = 3_500_000;
export const STORAGE_DANGER_BYTES = 4_500_000;

export type RiccoReviewSummary = {
  finalImages: RiccoPanelImage[];
  finalPanelIds: Set<string>;
  finalCount: number;
  progress: number;
  generationLinkedCount: number;
};

export type RiccoStorageLevel = 'ok' | 'warning' | 'danger';

export type RiccoStoragePanelReport = {
  panel: (typeof riccoPanels)[number];
  images: RiccoPanelImage[];
  finals: RiccoPanelImage[];
  variants: RiccoPanelImage[];
  jobs: GenerationJob[];
};

export type RiccoStorageReport = {
  finalImages: RiccoPanelImage[];
  localImages: RiccoPanelImage[];
  urlImages: RiccoPanelImage[];
  generationLinkedImages: RiccoPanelImage[];
  nonFinalImages: RiccoPanelImage[];
  missingFinals: typeof riccoPanels;
  importedJobs: GenerationJob[];
  byPanel: RiccoStoragePanelReport[];
  totalBytes: number;
  level: RiccoStorageLevel;
};

export function createRiccoReviewImageId(now = Date.now(), randomPart = Math.random().toString(16).slice(2)) {
  return `img_${now}_${randomPart}`;
}

export function buildManualReviewImage(input: {
  panelId: string;
  imageUrl: string;
  source: ImageSource;
  promptUsed?: string;
  createdAt?: string;
  id?: string;
}): RiccoPanelImage {
  return {
    id: input.id ?? createRiccoReviewImageId(),
    panelId: input.panelId,
    imageUrl: input.imageUrl.trim(),
    source: input.source,
    promptUsed: input.promptUsed?.trim() ?? '',
    rating: 0,
    continuityScore: 0,
    notes: '',
    selected: false,
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function buildLocalFileReviewImage(input: {
  panelId: string;
  dataUrl: string;
  fileName: string;
  promptUsed?: string;
  createdAt?: string;
  id?: string;
}): RiccoPanelImage {
  return {
    id: input.id ?? createRiccoReviewImageId(),
    panelId: input.panelId,
    imageUrl: input.dataUrl,
    source: 'local_file',
    promptUsed: input.promptUsed?.trim() ?? '',
    rating: 0,
    continuityScore: 0,
    notes: `Lokale Datei: ${input.fileName}`,
    selected: false,
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function getPanelReviewImages(images: RiccoPanelImage[], panelId: string) {
  return images
    .filter((image) => image.panelId === panelId)
    .sort((a, b) => Number(b.selected) - Number(a.selected));
}

export function summarizeRiccoReviewImages(images: RiccoPanelImage[]): RiccoReviewSummary {
  const finalImages = images.filter((image) => image.selected);
  const finalPanelIds = new Set(finalImages.map((image) => image.panelId));
  const finalCount = riccoPanels.filter((panel) => finalPanelIds.has(panel.id)).length;
  const generationLinkedCount = images.filter((image) => image.generationJobId).length;

  return {
    finalImages,
    finalPanelIds,
    finalCount,
    progress: Math.round((finalCount / riccoPanels.length) * 100),
    generationLinkedCount
  };
}

export function updateRiccoReviewImage(images: RiccoPanelImage[], imageId: string, patch: Partial<RiccoPanelImage>) {
  return images.map((image) => (image.id === imageId ? { ...image, ...patch } : image));
}

export function selectFinalRiccoReviewImage(images: RiccoPanelImage[], imageId: string) {
  const target = images.find((image) => image.id === imageId);
  if (!target) return images;

  return images.map((image) => {
    if (image.panelId !== target.panelId) return image;
    return { ...image, selected: image.id === imageId };
  });
}

export function deleteRiccoReviewImage(images: RiccoPanelImage[], imageId: string) {
  return images.filter((image) => image.id !== imageId);
}

export function isLocalDataUrlImage(image: RiccoPanelImage) {
  return image.imageUrl.startsWith('data:image/');
}

export function bytesFromText(value: string) {
  return new Blob([value]).size;
}

export function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

export function storageLevel(bytes: number): RiccoStorageLevel {
  if (bytes >= STORAGE_DANGER_BYTES) return 'danger';
  if (bytes >= STORAGE_WARNING_BYTES) return 'warning';
  return 'ok';
}

export function buildRiccoStorageReport(input: {
  images: RiccoPanelImage[];
  generationJobs: GenerationJob[];
  rawBytes: number;
  generationJobBytes: number;
}): RiccoStorageReport {
  const { images, generationJobs, rawBytes, generationJobBytes } = input;
  const finalImages = images.filter((image) => image.selected);
  const localImages = images.filter(isLocalDataUrlImage);
  const urlImages = images.filter((image) => !isLocalDataUrlImage(image));
  const generationLinkedImages = images.filter((image) => image.generationJobId);
  const nonFinalImages = images.filter((image) => !image.selected);
  const finalPanelIds = new Set(finalImages.map((image) => image.panelId));
  const missingFinals = riccoPanels.filter((panel) => !finalPanelIds.has(panel.id));
  const totalBytes = rawBytes + generationJobBytes;
  const importedJobs = generationJobs.filter((job) => job.status === 'imported_as_asset');

  const byPanel = riccoPanels.map((panel) => ({
    panel,
    images: images.filter((image) => image.panelId === panel.id),
    finals: images.filter((image) => image.panelId === panel.id && image.selected),
    variants: images.filter((image) => image.panelId === panel.id && !image.selected),
    jobs: generationJobs.filter((job) => job.panelId === panel.id)
  }));

  return {
    finalImages,
    localImages,
    urlImages,
    generationLinkedImages,
    nonFinalImages,
    missingFinals,
    importedJobs,
    byPanel,
    totalBytes,
    level: storageLevel(totalBytes)
  };
}

export function keepOnlyFinalReviewImages(images: RiccoPanelImage[]) {
  return images.filter((image) => image.selected);
}

export function removeLocalNonFinalReviewImages(images: RiccoPanelImage[]) {
  return images.filter((image) => image.selected || !isLocalDataUrlImage(image));
}

export function buildRiccoStorageReportText(input: {
  report: RiccoStorageReport;
  rawBytes: number;
  generationJobBytes: number;
  imageCount: number;
  generationJobCount: number;
}) {
  const { report, rawBytes, generationJobBytes, imageCount, generationJobCount } = input;

  return [
    'Ricco Storage Report',
    `Total storage: ${formatBytes(report.totalBytes)} (${report.level})`,
    `Image storage: ${formatBytes(rawBytes)}`,
    `Generation job storage: ${formatBytes(generationJobBytes)}`,
    `Images: ${imageCount}`,
    `Generation jobs: ${generationJobCount}`,
    `Imported jobs: ${report.importedJobs.length}`,
    `Generation-linked images: ${report.generationLinkedImages.length}`,
    `Final images: ${report.finalImages.length}`,
    `Local Data-URL images: ${report.localImages.length}`,
    `URL images: ${report.urlImages.length}`,
    `Non-final variants: ${report.nonFinalImages.length}`,
    `Missing finals: ${report.missingFinals.map((panel) => `Panel ${panel.panelNumber}`).join(', ') || 'none'}`,
    '',
    'By panel:',
    ...report.byPanel.map((item) => `Panel ${item.panel.panelNumber}: ${item.panel.title} — ${item.images.length} images, ${item.finals.length} final, ${item.variants.length} variants, ${item.jobs.length} jobs`)
  ].join('\n');
}
