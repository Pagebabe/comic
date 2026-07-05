import type { ParsedRiccoProductionPackage } from './riccoProductionPackage';
import {
  extractGenerationJobsFromRiccoPackage,
  extractImagesFromRiccoPackage,
  extractLetteringLayoutStateFromRiccoPackage,
  extractReferenceReviewStateFromRiccoPackage,
  packageLooksLikeRiccoPackage
} from './riccoProductionPackage';
import { summarizeReferenceReviewState } from '../../types/riccoReferenceReview';

export type RiccoRestorePreview = {
  packageLooksValid: boolean;
  packageVersion: string;
  imageCount: number;
  finalImageCount: number;
  generationJobCount: number;
  referenceReviewCount: number;
  approvedReferenceCount: number;
  letteringLayoutCount: number;
  pipelineProgress: number;
  currentStageLabel: string;
  assetMetadataImageCount: number;
  referenceCandidateMetadataImageCount: number;
  datasetMetadataImageCount: number;
  datasetCandidateImageCount: number;
  approvedDatasetImageCount: number;
  needsFixImageCount: number;
  loraSnapshotPresent: boolean;
  loraReadyTargets: number;
  loraNeedsWorkTargets: number;
  loraTotalApprovedItems: number;
};

function numberOrZero(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function stringOrEmpty(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function buildRiccoRestorePreview(pkg: ParsedRiccoProductionPackage | null): RiccoRestorePreview {
  const images = pkg ? extractImagesFromRiccoPackage(pkg) : [];
  const generationJobs = pkg ? extractGenerationJobsFromRiccoPackage(pkg) : [];
  const referenceReviewState = pkg ? extractReferenceReviewStateFromRiccoPackage(pkg) : {};
  const referenceSummary = summarizeReferenceReviewState(referenceReviewState);
  const letteringLayoutState = pkg ? extractLetteringLayoutStateFromRiccoPackage(pkg) : {};
  const loraPlanState = pkg?.loraPlanState;

  return {
    packageLooksValid: packageLooksLikeRiccoPackage(pkg),
    packageVersion: stringOrEmpty(pkg?.packageVersion),
    imageCount: images.length,
    finalImageCount: images.filter((image) => image.selected).length,
    generationJobCount: generationJobs.length,
    referenceReviewCount: referenceSummary.total,
    approvedReferenceCount: referenceSummary.approved,
    letteringLayoutCount: Object.keys(letteringLayoutState).length,
    pipelineProgress: numberOrZero(pkg?.pipelineState?.progress),
    currentStageLabel: stringOrEmpty(pkg?.pipelineState?.currentStageLabel),
    assetMetadataImageCount: images.filter((image) => Boolean(image.assetStatus)).length,
    referenceCandidateMetadataImageCount: images.filter((image) => Boolean(image.referenceCandidateType || image.referenceCandidateSubjectId || image.referenceCandidateNotes)).length,
    datasetMetadataImageCount: images.filter((image) => Boolean(image.datasetCandidateTargetType || image.datasetCandidateTargetId || image.datasetTriggerWord || image.datasetCaption || image.datasetNotes)).length,
    datasetCandidateImageCount: images.filter((image) => image.assetStatus === 'dataset_candidate').length,
    approvedDatasetImageCount: images.filter((image) => image.assetStatus === 'approved_dataset').length,
    needsFixImageCount: images.filter((image) => image.assetStatus === 'needs_fix').length,
    loraSnapshotPresent: Boolean(loraPlanState?.snapshot || loraPlanState?.readyTargets || loraPlanState?.needsWorkTargets || loraPlanState?.totalApprovedItems),
    loraReadyTargets: numberOrZero(loraPlanState?.readyTargets),
    loraNeedsWorkTargets: numberOrZero(loraPlanState?.needsWorkTargets),
    loraTotalApprovedItems: numberOrZero(loraPlanState?.totalApprovedItems)
  };
}

export function buildRiccoRestoreStatusText(preview: RiccoRestorePreview) {
  return [
    `${preview.imageCount} Bilder`,
    `${preview.generationJobCount} Generation Jobs`,
    `${preview.referenceReviewCount} Reference Reviews`,
    `${preview.letteringLayoutCount} Lettering Layouts`,
    `${preview.assetMetadataImageCount} Asset-Metadaten`,
    `${preview.datasetMetadataImageCount} Dataset-Metadaten`,
    `${preview.approvedDatasetImageCount} approved_dataset`,
    `${preview.loraSnapshotPresent ? 'LoRA Snapshot vorhanden' : 'kein LoRA Snapshot'}`
  ].join(' · ');
}
