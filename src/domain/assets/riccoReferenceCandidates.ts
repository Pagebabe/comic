import { riccoCharacters, riccoLocations } from '../../data/riccoStudio';
import type { AssetStatus, GenerationJob } from '../../types/productionBackend';
import type { ReferenceCandidateType, RiccoPanelImage } from '../../types/riccoReview';
import {
  buildAssetLibraryItems,
  updateAssetStatus,
  type AssetLibraryItem
} from './riccoAssetLibrary';

export type ReferenceCandidateTarget = {
  type: ReferenceCandidateType;
  subjectId: string;
  label: string;
};

export type ReferenceCandidateItem = AssetLibraryItem & {
  targetType: ReferenceCandidateType | '';
  targetSubjectId: string;
  targetLabel: string;
  candidateNotes: string;
};

export type ReferenceCandidateSummary = {
  total: number;
  withTarget: number;
  missingTarget: number;
  characterCandidates: number;
  locationCandidates: number;
  styleCandidates: number;
  linkedToJobs: number;
};

export const REFERENCE_CANDIDATE_RESOLUTION_STATUSES: AssetStatus[] = [
  'approved_reference',
  'dataset_candidate',
  'rejected',
  'raw'
];

export const STYLE_REFERENCE_TARGET: ReferenceCandidateTarget = {
  type: 'style',
  subjectId: 'style_master_rih',
  label: 'Ricco im Haus Master Style'
};

export function buildReferenceCandidateTargets(): ReferenceCandidateTarget[] {
  return [
    ...riccoCharacters.map((character): ReferenceCandidateTarget => ({
      type: 'character',
      subjectId: character.id,
      label: character.name
    })),
    ...riccoLocations.map((location): ReferenceCandidateTarget => ({
      type: 'location',
      subjectId: location.id,
      label: location.name
    })),
    STYLE_REFERENCE_TARGET
  ];
}

export function targetLabelForCandidate(type: ReferenceCandidateType | undefined, subjectId: string | undefined) {
  if (!type || !subjectId) return 'No target set';
  const target = buildReferenceCandidateTargets().find((item) => item.type === type && item.subjectId === subjectId);
  return target?.label ?? subjectId;
}

export function buildReferenceCandidateItems(images: RiccoPanelImage[], generationJobs: GenerationJob[]): ReferenceCandidateItem[] {
  return buildAssetLibraryItems(images, generationJobs)
    .filter((item) => item.assetStatus === 'reference_candidate')
    .map((item): ReferenceCandidateItem => ({
      ...item,
      targetType: item.image.referenceCandidateType ?? '',
      targetSubjectId: item.image.referenceCandidateSubjectId ?? '',
      targetLabel: targetLabelForCandidate(item.image.referenceCandidateType, item.image.referenceCandidateSubjectId),
      candidateNotes: item.image.referenceCandidateNotes?.trim() || item.image.notes.trim() || 'No candidate notes yet.'
    }));
}

export function summarizeReferenceCandidates(items: ReferenceCandidateItem[]): ReferenceCandidateSummary {
  return {
    total: items.length,
    withTarget: items.filter((item) => item.targetType && item.targetSubjectId).length,
    missingTarget: items.filter((item) => !item.targetType || !item.targetSubjectId).length,
    characterCandidates: items.filter((item) => item.targetType === 'character').length,
    locationCandidates: items.filter((item) => item.targetType === 'location').length,
    styleCandidates: items.filter((item) => item.targetType === 'style').length,
    linkedToJobs: items.filter((item) => item.generationJob).length
  };
}

export function updateReferenceCandidateTarget(
  images: RiccoPanelImage[],
  imageId: string,
  patch: {
    type?: ReferenceCandidateType;
    subjectId?: string;
    notes?: string;
  },
  updatedAt = new Date().toISOString()
): RiccoPanelImage[] {
  return images.map((image): RiccoPanelImage => image.id === imageId ? {
    ...image,
    assetStatus: 'reference_candidate',
    assetStatusUpdatedAt: updatedAt,
    referenceCandidateType: patch.type ?? image.referenceCandidateType,
    referenceCandidateSubjectId: patch.subjectId ?? image.referenceCandidateSubjectId,
    referenceCandidateNotes: patch.notes ?? image.referenceCandidateNotes,
    referenceCandidateUpdatedAt: updatedAt
  } : image);
}

export function resolveReferenceCandidate(images: RiccoPanelImage[], imageId: string, status: AssetStatus, updatedAt = new Date().toISOString()): RiccoPanelImage[] {
  if (!REFERENCE_CANDIDATE_RESOLUTION_STATUSES.includes(status)) return images;
  return updateAssetStatus(images, imageId, status, updatedAt);
}

export function buildReferenceCandidateBrief(item: ReferenceCandidateItem) {
  return [
    'Ricco Reference Candidate Brief',
    `Image: ${item.image.id}`,
    `Panel: ${item.panelNumber} — ${item.panelTitle}`,
    `Target: ${item.targetLabel}`,
    `Target type: ${item.targetType || 'missing'}`,
    `Target subject id: ${item.targetSubjectId || 'missing'}`,
    `Source: ${item.image.source}`,
    `Rating: ${item.image.rating}`,
    `Continuity: ${item.image.continuityScore}`,
    `Generation job: ${item.generationJob?.id ?? 'none'}`,
    `Prompt id: ${item.image.promptId ?? 'none'}`,
    '',
    'Candidate notes:',
    item.candidateNotes,
    '',
    'Prompt used:',
    item.image.promptUsed || 'none'
  ].join('\n');
}

export function buildReferenceCandidateReport(items: ReferenceCandidateItem[]) {
  const summary = summarizeReferenceCandidates(items);

  return [
    'Ricco Reference Candidate Report',
    `Total candidates: ${summary.total}`,
    `With target: ${summary.withTarget}`,
    `Missing target: ${summary.missingTarget}`,
    `Characters: ${summary.characterCandidates}`,
    `Locations: ${summary.locationCandidates}`,
    `Style: ${summary.styleCandidates}`,
    `Linked to jobs: ${summary.linkedToJobs}`,
    '',
    'Candidates:',
    ...items.map((item) => `${item.image.id} — Panel ${item.panelNumber}: ${item.panelTitle} — ${item.targetLabel} — ${item.candidateNotes}`)
  ].join('\n');
}
