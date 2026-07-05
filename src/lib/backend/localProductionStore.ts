import type { GenerationJob, ProductionAsset, QualityReview } from '../../types/productionBackend';
import { normalizeReferenceReviewState, type ReferenceReviewState } from '../../types/riccoReferenceReview';
import type { RiccoPanelImage } from '../../types/riccoReview';
import { readRiccoImageBlobsFromIndexedDb } from '../storage/riccoIndexedDbStorage';
import { resolveRiccoImageSources } from '../storage/riccoImageSourceResolver';
import {
  createBrowserRiccoStoragePort,
  hydrateRiccoImagesFromSplit,
  RICCO_IMAGE_BLOBS_STORAGE_KEY,
  RICCO_IMAGE_METADATA_STORAGE_KEY,
  splitRiccoImageStorage,
  type RiccoImageBlobRecord,
  type RiccoImageMetadataRecord,
  type RiccoImageStorageSplit
} from '../storage/riccoStoragePort';

export const RICCO_IMAGES_STORAGE_KEY = 'ricco-studio-images-v1';
export const RICCO_GENERATION_JOBS_STORAGE_KEY = 'ricco-generation-jobs-v1';
export const RICCO_REVIEWS_STORAGE_KEY = 'ricco-quality-reviews-v1';
export const RICCO_REFERENCE_REVIEW_STORAGE_KEY = 'ricco-reference-review-v1';

export type RiccoPreferredImageReadResult = {
  images: RiccoPanelImage[];
  source: 'legacy_localstorage' | 'split_localstorage' | 'split_indexeddb';
  metadataImageCount: number;
  indexedDbRecordCount: number;
  localSplitRecordCount: number;
  legacyImageCount: number;
  indexedDbHits: number;
  localSplitHits: number;
  legacyHits: number;
  missingRefs: number;
};

function storagePort() {
  return createBrowserRiccoStoragePort();
}

function safeRead(key: string) {
  return storagePort().readText(key);
}

function safeParseArray<T>(raw: string) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function readLocalGenerationJobs(): GenerationJob[] {
  return safeParseArray<GenerationJob>(safeRead(RICCO_GENERATION_JOBS_STORAGE_KEY));
}

export function writeLocalGenerationJobs(jobs: GenerationJob[]) {
  return storagePort().writeJson(RICCO_GENERATION_JOBS_STORAGE_KEY, jobs);
}

export function upsertLocalGenerationJob(job: GenerationJob) {
  const jobs = readLocalGenerationJobs();
  const existingIndex = jobs.findIndex((item) => item.id === job.id);
  const nextJob = { ...job, updatedAt: new Date().toISOString() };

  if (existingIndex >= 0) {
    jobs[existingIndex] = nextJob;
  } else {
    jobs.unshift(nextJob);
  }

  writeLocalGenerationJobs(jobs);
  return nextJob;
}

export function updateLocalGenerationJobStatus(jobId: string, status: GenerationJob['status'], notes?: string) {
  const jobs = readLocalGenerationJobs();
  const now = new Date().toISOString();

  const nextJobs = jobs.map((job) => {
    if (job.id !== jobId) return job;

    return {
      ...job,
      status,
      notes: notes || job.notes,
      updatedAt: now,
      completedAt: ['completed_manual', 'imported_as_asset', 'api_completed'].includes(status) ? now : job.completedAt
    } satisfies GenerationJob;
  });

  writeLocalGenerationJobs(nextJobs);
  return nextJobs.find((job) => job.id === jobId);
}

export function clearLocalGenerationJobs() {
  return writeLocalGenerationJobs([]);
}

export function readLocalAssets(): ProductionAsset[] {
  return safeParseArray<ProductionAsset>(safeRead(RICCO_IMAGES_STORAGE_KEY));
}

export function readLocalQualityReviews(): QualityReview[] {
  return safeParseArray<QualityReview>(safeRead(RICCO_REVIEWS_STORAGE_KEY));
}

export function readReferenceReviewStorage(): ReferenceReviewState {
  try {
    return normalizeReferenceReviewState(JSON.parse(safeRead(RICCO_REFERENCE_REVIEW_STORAGE_KEY) || '{}'));
  } catch {
    return {};
  }
}

export function writeReferenceReviewStorage(referenceReviewState: ReferenceReviewState) {
  return storagePort().writeJson(RICCO_REFERENCE_REVIEW_STORAGE_KEY, referenceReviewState);
}

export function readRiccoReviewImages(): RiccoPanelImage[] {
  return safeParseArray<RiccoPanelImage>(safeRead(RICCO_IMAGES_STORAGE_KEY));
}

export function writeRiccoReviewImages(images: RiccoPanelImage[]) {
  return storagePort().writeJson(RICCO_IMAGES_STORAGE_KEY, images);
}

export function buildRiccoImageStorageSplit(images: RiccoPanelImage[], updatedAt?: string): RiccoImageStorageSplit {
  return splitRiccoImageStorage(images, updatedAt);
}

export function writeRiccoImageStorageSplit(images: RiccoPanelImage[], updatedAt?: string) {
  const split = buildRiccoImageStorageSplit(images, updatedAt);
  const port = storagePort();
  const wroteMetadata = port.writeJson(RICCO_IMAGE_METADATA_STORAGE_KEY, split.metadataImages);
  const wroteBlobs = port.writeJson(RICCO_IMAGE_BLOBS_STORAGE_KEY, split.imageBlobs);

  return {
    ok: wroteMetadata && wroteBlobs,
    split
  };
}

export function readRiccoImagesFromStorageSplit(): RiccoPanelImage[] {
  const port = storagePort();
  const metadataImages = port.readJson<RiccoImageMetadataRecord[]>(RICCO_IMAGE_METADATA_STORAGE_KEY, []);
  const imageBlobs = port.readJson<RiccoImageBlobRecord[]>(RICCO_IMAGE_BLOBS_STORAGE_KEY, []);

  return hydrateRiccoImagesFromSplit(metadataImages, imageBlobs);
}

export async function readRiccoImagesPreferred(): Promise<RiccoPreferredImageReadResult> {
  const port = storagePort();
  const metadataImages = port.readJson<RiccoImageMetadataRecord[]>(RICCO_IMAGE_METADATA_STORAGE_KEY, []);
  const localSplitRecords = port.readJson<RiccoImageBlobRecord[]>(RICCO_IMAGE_BLOBS_STORAGE_KEY, []);
  const legacyImages = readRiccoReviewImages();

  if (metadataImages.length === 0) {
    return {
      images: legacyImages,
      source: 'legacy_localstorage',
      metadataImageCount: 0,
      indexedDbRecordCount: 0,
      localSplitRecordCount: localSplitRecords.length,
      legacyImageCount: legacyImages.length,
      indexedDbHits: 0,
      localSplitHits: 0,
      legacyHits: legacyImages.length,
      missingRefs: 0
    };
  }

  const indexedDbRecords = await readRiccoImageBlobsFromIndexedDb();
  const resolved = resolveRiccoImageSources({
    metadataImages,
    primaryRecords: indexedDbRecords,
    secondaryRecords: localSplitRecords,
    legacyImages
  });

  return {
    images: resolved.images,
    source: resolved.primaryHits > 0 ? 'split_indexeddb' : 'split_localstorage',
    metadataImageCount: metadataImages.length,
    indexedDbRecordCount: indexedDbRecords.length,
    localSplitRecordCount: localSplitRecords.length,
    legacyImageCount: legacyImages.length,
    indexedDbHits: resolved.primaryHits,
    localSplitHits: resolved.secondaryHits,
    legacyHits: resolved.legacyHits,
    missingRefs: resolved.missingRefs
  };
}

export function estimateStorageBytes() {
  return storagePort().estimateBytes([
    RICCO_IMAGES_STORAGE_KEY,
    RICCO_GENERATION_JOBS_STORAGE_KEY,
    RICCO_REVIEWS_STORAGE_KEY,
    RICCO_REFERENCE_REVIEW_STORAGE_KEY,
    RICCO_IMAGE_METADATA_STORAGE_KEY,
    RICCO_IMAGE_BLOBS_STORAGE_KEY
  ]);
}
