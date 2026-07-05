import { riccoCharacters, riccoLocations, riccoPanels, riccoSeries } from '../../data/riccoStudio';
import type { AssetStatus, GenerationJob } from '../../types/productionBackend';
import type { DatasetCandidateTargetType, RiccoPanelImage } from '../../types/riccoReview';
import {
  buildAssetLibraryItems,
  updateAssetStatus,
  type AssetLibraryItem
} from './riccoAssetLibrary';

export type DatasetCandidateTarget = {
  type: DatasetCandidateTargetType;
  targetId: string;
  label: string;
  triggerWord: string;
};

export type DatasetCandidateItem = AssetLibraryItem & {
  targetType: DatasetCandidateTargetType | '';
  targetId: string;
  targetLabel: string;
  triggerWord: string;
  caption: string;
  datasetNotes: string;
};

export type DatasetCandidateSummary = {
  total: number;
  withTarget: number;
  missingTarget: number;
  characterLora: number;
  locationLora: number;
  styleLora: number;
  linkedToJobs: number;
  captioned: number;
};

export type DatasetManifestItem = {
  imageId: string;
  imagePath: string;
  panelId: string;
  panelTitle: string;
  targetType: DatasetCandidateTargetType | '';
  targetId: string;
  targetLabel: string;
  triggerWord: string;
  caption: string;
  source: string;
  generationJobId: string | null;
  promptId: string | null;
  rating: number;
  continuityScore: number;
  notes: string;
};

export type DatasetManifest = {
  manifestVersion: 'ricco-dataset-manifest-v1';
  generatedAt: string;
  seriesId: string;
  seriesTitle: string;
  totalItems: number;
  targets: DatasetCandidateTarget[];
  items: DatasetManifestItem[];
};

export const DATASET_CANDIDATE_RESOLUTION_STATUSES: AssetStatus[] = [
  'approved_dataset',
  'approved_reference',
  'needs_fix',
  'rejected',
  'raw'
];

export const STYLE_DATASET_TARGET: DatasetCandidateTarget = {
  type: 'style_lora',
  targetId: 'style_rih_gritty_cartoon',
  label: 'Ricco im Haus gritty cartoon style',
  triggerWord: 'rih_gritty_cartoon'
};

export function slugTriggerWord(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildDatasetCandidateTargets(): DatasetCandidateTarget[] {
  return [
    ...riccoCharacters.map((character): DatasetCandidateTarget => ({
      type: 'character_lora',
      targetId: `lora_${character.id}`,
      label: `${character.name} character LoRA`,
      triggerWord: `${slugTriggerWord(character.name)}_rih`
    })),
    ...riccoLocations.map((location): DatasetCandidateTarget => ({
      type: 'location_lora',
      targetId: `lora_${location.id}`,
      label: `${location.name} location LoRA`,
      triggerWord: `${slugTriggerWord(location.name)}_rih`
    })),
    STYLE_DATASET_TARGET
  ];
}

export function targetForDatasetCandidate(type: DatasetCandidateTargetType | undefined, targetId: string | undefined) {
  if (!type || !targetId) return null;
  return buildDatasetCandidateTargets().find((target) => target.type === type && target.targetId === targetId) ?? null;
}

export function defaultDatasetCaption(item: AssetLibraryItem, target: DatasetCandidateTarget | null) {
  const panel = riccoPanels.find((panelItem) => panelItem.id === item.image.panelId);
  const trigger = item.image.datasetTriggerWord || target?.triggerWord || 'rih_gritty_cartoon';
  const parts = [
    trigger,
    'gritty adult cartoon',
    panel?.title ? `panel ${panel.panelNumber} ${panel.title}` : item.image.panelId,
    item.panelTitle,
    item.image.notes.trim()
  ].filter(Boolean);

  return parts.join(', ');
}

export function buildDatasetCandidateItems(images: RiccoPanelImage[], generationJobs: GenerationJob[]): DatasetCandidateItem[] {
  return buildAssetLibraryItems(images, generationJobs)
    .filter((item) => item.assetStatus === 'dataset_candidate')
    .map((item): DatasetCandidateItem => {
      const target = targetForDatasetCandidate(item.image.datasetCandidateTargetType, item.image.datasetCandidateTargetId);
      const triggerWord = item.image.datasetTriggerWord || target?.triggerWord || '';

      return {
        ...item,
        targetType: item.image.datasetCandidateTargetType ?? '',
        targetId: item.image.datasetCandidateTargetId ?? '',
        targetLabel: target?.label ?? 'No dataset target set',
        triggerWord,
        caption: item.image.datasetCaption?.trim() || defaultDatasetCaption(item, target),
        datasetNotes: item.image.datasetNotes?.trim() || item.image.notes.trim() || 'No dataset notes yet.'
      };
    });
}

export function summarizeDatasetCandidates(items: DatasetCandidateItem[]): DatasetCandidateSummary {
  return {
    total: items.length,
    withTarget: items.filter((item) => item.targetType && item.targetId).length,
    missingTarget: items.filter((item) => !item.targetType || !item.targetId).length,
    characterLora: items.filter((item) => item.targetType === 'character_lora').length,
    locationLora: items.filter((item) => item.targetType === 'location_lora').length,
    styleLora: items.filter((item) => item.targetType === 'style_lora').length,
    linkedToJobs: items.filter((item) => item.generationJob).length,
    captioned: items.filter((item) => item.caption.trim().length > 0).length
  };
}

export function updateDatasetCandidateMetadata(
  images: RiccoPanelImage[],
  imageId: string,
  patch: {
    targetType?: DatasetCandidateTargetType;
    targetId?: string;
    triggerWord?: string;
    caption?: string;
    notes?: string;
  },
  updatedAt = new Date().toISOString()
): RiccoPanelImage[] {
  return images.map((image): RiccoPanelImage => image.id === imageId ? {
    ...image,
    assetStatus: 'dataset_candidate',
    assetStatusUpdatedAt: updatedAt,
    datasetCandidateTargetType: patch.targetType ?? image.datasetCandidateTargetType,
    datasetCandidateTargetId: patch.targetId ?? image.datasetCandidateTargetId,
    datasetTriggerWord: patch.triggerWord ?? image.datasetTriggerWord,
    datasetCaption: patch.caption ?? image.datasetCaption,
    datasetNotes: patch.notes ?? image.datasetNotes,
    datasetUpdatedAt: updatedAt
  } : image);
}

export function resolveDatasetCandidate(images: RiccoPanelImage[], imageId: string, status: AssetStatus, updatedAt = new Date().toISOString()): RiccoPanelImage[] {
  if (!DATASET_CANDIDATE_RESOLUTION_STATUSES.includes(status)) return images;
  return updateAssetStatus(images, imageId, status, updatedAt);
}

export function buildDatasetManifest(items: DatasetCandidateItem[], generatedAt = new Date().toISOString()): DatasetManifest {
  return {
    manifestVersion: 'ricco-dataset-manifest-v1',
    generatedAt,
    seriesId: riccoSeries.id,
    seriesTitle: riccoSeries.title,
    totalItems: items.length,
    targets: buildDatasetCandidateTargets(),
    items: items.map((item): DatasetManifestItem => ({
      imageId: item.image.id,
      imagePath: item.image.imageUrl,
      panelId: item.image.panelId,
      panelTitle: item.panelTitle,
      targetType: item.targetType,
      targetId: item.targetId,
      targetLabel: item.targetLabel,
      triggerWord: item.triggerWord,
      caption: item.caption,
      source: item.image.source,
      generationJobId: item.image.generationJobId ?? null,
      promptId: item.image.promptId ?? null,
      rating: item.image.rating,
      continuityScore: item.image.continuityScore,
      notes: item.datasetNotes
    }))
  };
}

export function buildDatasetManifestJson(items: DatasetCandidateItem[]) {
  return JSON.stringify(buildDatasetManifest(items), null, 2);
}

export function buildDatasetCandidateReport(items: DatasetCandidateItem[]) {
  const summary = summarizeDatasetCandidates(items);

  return [
    'Ricco Dataset Candidate Report',
    `Total candidates: ${summary.total}`,
    `With target: ${summary.withTarget}`,
    `Missing target: ${summary.missingTarget}`,
    `Character LoRA: ${summary.characterLora}`,
    `Location LoRA: ${summary.locationLora}`,
    `Style LoRA: ${summary.styleLora}`,
    `Linked to jobs: ${summary.linkedToJobs}`,
    `Captioned: ${summary.captioned}`,
    '',
    'Candidates:',
    ...items.map((item) => `${item.image.id} — ${item.targetLabel} — ${item.triggerWord || 'no trigger'} — ${item.caption}`)
  ].join('\n');
}
