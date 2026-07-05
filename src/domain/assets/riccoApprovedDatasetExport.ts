import type { GenerationJob } from '../../types/productionBackend';
import type { RiccoPanelImage } from '../../types/riccoReview';
import {
  buildDatasetCandidateTargets,
  buildDatasetManifest,
  summarizeDatasetCandidates,
  targetForDatasetCandidate,
  type DatasetCandidateItem,
  type DatasetManifest
} from './riccoDatasetCandidates';
import { buildAssetLibraryItems, type AssetLibraryItem } from './riccoAssetLibrary';

export type ApprovedDatasetItem = DatasetCandidateItem & {
  ready: boolean;
  warnings: string[];
};

export type ApprovedDatasetSummary = {
  total: number;
  ready: number;
  warnings: number;
  missingTarget: number;
  missingTrigger: number;
  missingCaption: number;
  characterLora: number;
  locationLora: number;
  styleLora: number;
};

export type ApprovedDatasetManifest = DatasetManifest & {
  manifestVersion: 'ricco-approved-dataset-manifest-v1';
  sourceManifestVersion: 'ricco-dataset-manifest-v1';
  readyItems: number;
  warningItems: number;
};

function datasetItemFromApprovedAsset(item: AssetLibraryItem): DatasetCandidateItem {
  const target = targetForDatasetCandidate(item.image.datasetCandidateTargetType, item.image.datasetCandidateTargetId);
  const triggerWord = item.image.datasetTriggerWord || target?.triggerWord || '';

  return {
    ...item,
    targetType: item.image.datasetCandidateTargetType ?? '',
    targetId: item.image.datasetCandidateTargetId ?? '',
    targetLabel: target?.label ?? 'No dataset target set',
    triggerWord,
    caption: item.image.datasetCaption?.trim() || '',
    datasetNotes: item.image.datasetNotes?.trim() || item.image.notes.trim() || 'No dataset notes yet.'
  };
}

export function validateApprovedDatasetItem(item: DatasetCandidateItem): string[] {
  const warnings: string[] = [];

  if (!item.targetType || !item.targetId) warnings.push('missing dataset target');
  if (!item.triggerWord.trim()) warnings.push('missing trigger word');
  if (!item.caption.trim()) warnings.push('missing caption');
  if (!item.image.imageUrl.trim()) warnings.push('missing image path');
  if ((item.image.rating || 0) < 4) warnings.push('rating below 4');
  if ((item.image.continuityScore || 0) < 4) warnings.push('continuity below 4');

  return warnings;
}

export function buildApprovedDatasetItems(images: RiccoPanelImage[], generationJobs: GenerationJob[]): ApprovedDatasetItem[] {
  return buildAssetLibraryItems(images, generationJobs)
    .filter((item) => item.assetStatus === 'approved_dataset')
    .map((item): ApprovedDatasetItem => {
      const datasetItem = datasetItemFromApprovedAsset(item);
      const warnings = validateApprovedDatasetItem(datasetItem);

      return {
        ...datasetItem,
        ready: warnings.length === 0,
        warnings
      };
    });
}

export function summarizeApprovedDataset(items: ApprovedDatasetItem[]): ApprovedDatasetSummary {
  const candidateSummary = summarizeDatasetCandidates(items);

  return {
    total: items.length,
    ready: items.filter((item) => item.ready).length,
    warnings: items.filter((item) => item.warnings.length > 0).length,
    missingTarget: candidateSummary.missingTarget,
    missingTrigger: items.filter((item) => !item.triggerWord.trim()).length,
    missingCaption: items.filter((item) => !item.caption.trim()).length,
    characterLora: candidateSummary.characterLora,
    locationLora: candidateSummary.locationLora,
    styleLora: candidateSummary.styleLora
  };
}

export function buildApprovedDatasetManifest(items: ApprovedDatasetItem[], generatedAt = new Date().toISOString()): ApprovedDatasetManifest {
  const baseManifest = buildDatasetManifest(items, generatedAt);
  const summary = summarizeApprovedDataset(items);

  return {
    ...baseManifest,
    manifestVersion: 'ricco-approved-dataset-manifest-v1',
    sourceManifestVersion: 'ricco-dataset-manifest-v1',
    readyItems: summary.ready,
    warningItems: summary.warnings,
    targets: buildDatasetCandidateTargets()
  };
}

export function buildApprovedDatasetManifestJson(items: ApprovedDatasetItem[]) {
  return JSON.stringify(buildApprovedDatasetManifest(items), null, 2);
}

export function buildApprovedDatasetCaptionFiles(items: ApprovedDatasetItem[]) {
  return items.map((item) => ({
    imageId: item.image.id,
    imagePath: item.image.imageUrl,
    captionFilePath: `${item.image.imageUrl.replace(/\.[a-z0-9]+$/i, '')}.txt`,
    caption: item.caption
  }));
}

export function buildApprovedDatasetReport(items: ApprovedDatasetItem[]) {
  const summary = summarizeApprovedDataset(items);

  return [
    'Ricco Approved Dataset Export Report',
    `Total approved dataset assets: ${summary.total}`,
    `Ready: ${summary.ready}`,
    `Warning items: ${summary.warnings}`,
    `Missing target: ${summary.missingTarget}`,
    `Missing trigger: ${summary.missingTrigger}`,
    `Missing caption: ${summary.missingCaption}`,
    `Character LoRA: ${summary.characterLora}`,
    `Location LoRA: ${summary.locationLora}`,
    `Style LoRA: ${summary.styleLora}`,
    '',
    'Items:',
    ...items.map((item) => `${item.ready ? 'READY' : 'WARN'} — ${item.image.id} — ${item.targetLabel} — ${item.triggerWord || 'no trigger'} — ${item.warnings.join(', ') || 'ok'}`)
  ].join('\n');
}
