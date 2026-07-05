import type { GenerationJob, ProductionAsset, QualityReview } from '../../types/productionBackend';

export const RICCO_IMAGES_STORAGE_KEY = 'ricco-studio-images-v1';
export const RICCO_GENERATION_JOBS_STORAGE_KEY = 'ricco-generation-jobs-v1';
export const RICCO_REVIEWS_STORAGE_KEY = 'ricco-quality-reviews-v1';
export const RICCO_REFERENCE_REVIEW_STORAGE_KEY = 'ricco-reference-review-v1';

function safeRead(key: string) {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function safeWrite(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
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
  return safeWrite(RICCO_GENERATION_JOBS_STORAGE_KEY, JSON.stringify(jobs, null, 2));
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

export function readReferenceReviewStorage() {
  try {
    const parsed = JSON.parse(safeRead(RICCO_REFERENCE_REVIEW_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function estimateStorageBytes() {
  const payload = [
    safeRead(RICCO_IMAGES_STORAGE_KEY),
    safeRead(RICCO_GENERATION_JOBS_STORAGE_KEY),
    safeRead(RICCO_REVIEWS_STORAGE_KEY),
    safeRead(RICCO_REFERENCE_REVIEW_STORAGE_KEY)
  ].join('');

  return new Blob([payload]).size;
}
