import type { GenerationJob } from '../../types/productionBackend';
import type { DatasetCandidateTargetType, RiccoPanelImage } from '../../types/riccoReview';
import {
  buildApprovedDatasetCaptionFiles,
  buildApprovedDatasetItems,
  summarizeApprovedDataset,
  type ApprovedDatasetItem,
  type ApprovedDatasetSummary
} from '../assets/riccoApprovedDatasetExport';

export type LoraTrainingReadiness = 'ready' | 'needs_more_images' | 'needs_metadata' | 'empty';

export type LoraTrainingRequirement = {
  targetType: DatasetCandidateTargetType;
  minimumImages: number;
  recommendedImages: number;
};

export type LoraTrainingTargetPlan = {
  targetType: DatasetCandidateTargetType | '';
  targetId: string;
  targetLabel: string;
  triggerWord: string;
  itemCount: number;
  readyItemCount: number;
  warningItemCount: number;
  minimumImages: number;
  recommendedImages: number;
  readiness: LoraTrainingReadiness;
  warnings: string[];
  datasetFolder: string;
  captionFiles: ReturnType<typeof buildApprovedDatasetCaptionFiles>;
  items: ApprovedDatasetItem[];
};

export type LoraTrainingPlan = {
  generatedAt: string;
  totalApprovedItems: number;
  readyApprovedItems: number;
  warningApprovedItems: number;
  readyTargets: number;
  needsWorkTargets: number;
  approvedDatasetSummary: ApprovedDatasetSummary;
  targets: LoraTrainingTargetPlan[];
};

export const LORA_TRAINING_REQUIREMENTS: LoraTrainingRequirement[] = [
  { targetType: 'character_lora', minimumImages: 20, recommendedImages: 40 },
  { targetType: 'location_lora', minimumImages: 12, recommendedImages: 30 },
  { targetType: 'style_lora', minimumImages: 40, recommendedImages: 80 }
];

export function requirementForTargetType(targetType: DatasetCandidateTargetType | ''): LoraTrainingRequirement {
  return LORA_TRAINING_REQUIREMENTS.find((requirement) => requirement.targetType === targetType) ?? {
    targetType: 'style_lora',
    minimumImages: 20,
    recommendedImages: 40
  };
}

export function slugTrainingPath(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function groupApprovedDatasetItemsByTarget(items: ApprovedDatasetItem[]) {
  const groups = new Map<string, ApprovedDatasetItem[]>();

  for (const item of items) {
    const key = item.targetId || `missing-target:${item.image.id}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return groups;
}

export function buildLoraTrainingTargetPlan(targetId: string, items: ApprovedDatasetItem[]): LoraTrainingTargetPlan {
  const first = items[0];
  const targetType = first?.targetType ?? '';
  const targetLabel = first?.targetLabel ?? 'No target set';
  const triggerWords = Array.from(new Set(items.map((item) => item.triggerWord).filter(Boolean)));
  const triggerWord = triggerWords[0] ?? '';
  const requirement = requirementForTargetType(targetType);
  const warningItemCount = items.filter((item) => item.warnings.length > 0).length;
  const readyItemCount = items.filter((item) => item.ready).length;
  const warnings: string[] = [];

  if (!targetType || !targetId || targetId.startsWith('missing-target:')) warnings.push('missing LoRA target');
  if (!triggerWord) warnings.push('missing trigger word');
  if (triggerWords.length > 1) warnings.push('inconsistent trigger words');
  if (warningItemCount > 0) warnings.push(`${warningItemCount} approved dataset items still have warnings`);
  if (readyItemCount < requirement.minimumImages) warnings.push(`needs at least ${requirement.minimumImages} ready images`);

  let readiness: LoraTrainingReadiness = 'ready';
  if (items.length === 0) readiness = 'empty';
  else if (!targetType || !triggerWord || warningItemCount > 0 || triggerWords.length > 1) readiness = 'needs_metadata';
  else if (readyItemCount < requirement.minimumImages) readiness = 'needs_more_images';

  return {
    targetType,
    targetId,
    targetLabel,
    triggerWord,
    itemCount: items.length,
    readyItemCount,
    warningItemCount,
    minimumImages: requirement.minimumImages,
    recommendedImages: requirement.recommendedImages,
    readiness,
    warnings,
    datasetFolder: `datasets/ricco/${slugTrainingPath(targetId || targetLabel || 'missing-target')}`,
    captionFiles: buildApprovedDatasetCaptionFiles(items),
    items
  };
}

export function buildLoraTrainingPlan(images: RiccoPanelImage[], generationJobs: GenerationJob[], generatedAt = new Date().toISOString()): LoraTrainingPlan {
  const approvedItems = buildApprovedDatasetItems(images, generationJobs);
  const groups = groupApprovedDatasetItemsByTarget(approvedItems);
  const targets = Array.from(groups.entries())
    .map(([targetId, items]) => buildLoraTrainingTargetPlan(targetId, items))
    .sort((a, b) => a.targetLabel.localeCompare(b.targetLabel));
  const approvedDatasetSummary = summarizeApprovedDataset(approvedItems);

  return {
    generatedAt,
    totalApprovedItems: approvedDatasetSummary.total,
    readyApprovedItems: approvedDatasetSummary.ready,
    warningApprovedItems: approvedDatasetSummary.warnings,
    readyTargets: targets.filter((target) => target.readiness === 'ready').length,
    needsWorkTargets: targets.filter((target) => target.readiness !== 'ready').length,
    approvedDatasetSummary,
    targets
  };
}

export function readinessLabel(readiness: LoraTrainingReadiness) {
  if (readiness === 'ready') return 'READY';
  if (readiness === 'needs_more_images') return 'NEEDS MORE IMAGES';
  if (readiness === 'needs_metadata') return 'NEEDS METADATA';
  return 'EMPTY';
}

export function readinessStatusClass(readiness: LoraTrainingReadiness) {
  if (readiness === 'ready') return 'status-active';
  if (readiness === 'empty') return 'status-rejected';
  return 'status-needs_fix';
}

export function buildLoraTrainingChecklist(target: LoraTrainingTargetPlan) {
  return [
    `LoRA Target: ${target.targetLabel}`,
    `Target ID: ${target.targetId}`,
    `Target type: ${target.targetType || 'missing'}`,
    `Trigger word: ${target.triggerWord || 'missing'}`,
    `Dataset folder: ${target.datasetFolder}`,
    `Ready images: ${target.readyItemCount}/${target.minimumImages} minimum (${target.recommendedImages} recommended)`,
    `Warning items: ${target.warningItemCount}`,
    `Readiness: ${readinessLabel(target.readiness)}`,
    '',
    'Warnings:',
    ...(target.warnings.length > 0 ? target.warnings.map((warning) => `- ${warning}`) : ['- none']),
    '',
    'Caption files:',
    ...target.captionFiles.map((file) => `- ${file.captionFilePath}`)
  ].join('\n');
}

export function buildLoraTrainingPlanReport(plan: LoraTrainingPlan) {
  return [
    'Ricco LoRA Training Readiness Report',
    `Generated: ${plan.generatedAt}`,
    `Approved dataset items: ${plan.totalApprovedItems}`,
    `Ready approved items: ${plan.readyApprovedItems}`,
    `Warning approved items: ${plan.warningApprovedItems}`,
    `Ready targets: ${plan.readyTargets}`,
    `Needs work targets: ${plan.needsWorkTargets}`,
    '',
    'Targets:',
    ...plan.targets.map((target) => `${readinessLabel(target.readiness)} — ${target.targetLabel} — ${target.readyItemCount}/${target.minimumImages} ready — ${target.triggerWord || 'no trigger'}`)
  ].join('\n');
}
