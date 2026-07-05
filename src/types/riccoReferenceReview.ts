export type ReferenceReviewStatus = 'raw' | 'candidate' | 'approved_reference' | 'needs_redraw' | 'rejected';

export type ReferenceAssetReview = {
  status: ReferenceReviewStatus;
  imagePath: string;
  notes: string;
  updatedAt: string;
};

export type ReferenceReviewState = Record<string, ReferenceAssetReview>;

export type ReferenceReviewSummary = {
  total: number;
  approved: number;
  candidate: number;
  needsRedraw: number;
  rejected: number;
  raw: number;
};

export function emptyReferenceReviewSummary(): ReferenceReviewSummary {
  return {
    total: 0,
    approved: 0,
    candidate: 0,
    needsRedraw: 0,
    rejected: 0,
    raw: 0
  };
}

export function isReferenceAssetReview(value: unknown): value is ReferenceAssetReview {
  if (!value || typeof value !== 'object') return false;

  const review = value as Partial<ReferenceAssetReview>;

  return (
    typeof review.status === 'string' &&
    ['raw', 'candidate', 'approved_reference', 'needs_redraw', 'rejected'].includes(review.status) &&
    typeof review.imagePath === 'string' &&
    typeof review.notes === 'string' &&
    typeof review.updatedAt === 'string'
  );
}

export function normalizeReferenceReviewState(value: unknown): ReferenceReviewState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, review]) => isReferenceAssetReview(review));

  return Object.fromEntries(entries) as ReferenceReviewState;
}

export function summarizeReferenceReviewState(referenceReviewState: ReferenceReviewState): ReferenceReviewSummary {
  const summary = emptyReferenceReviewSummary();

  for (const review of Object.values(referenceReviewState)) {
    summary.total += 1;

    if (review.status === 'approved_reference') summary.approved += 1;
    else if (review.status === 'candidate') summary.candidate += 1;
    else if (review.status === 'needs_redraw') summary.needsRedraw += 1;
    else if (review.status === 'rejected') summary.rejected += 1;
    else summary.raw += 1;
  }

  return summary;
}
