import {
  buildAllRiccoPanelPrompts,
  riccoCharacters,
  riccoEpisode,
  riccoLocations,
  riccoPanels,
  riccoSeries
} from '../../data/riccoStudio';
import { RICCO_REFERENCE_REVIEW_STORAGE_KEY } from '../../lib/backend/localProductionStore';
import type { GenerationJob } from '../../types/productionBackend';
import {
  normalizeReferenceReviewState,
  summarizeReferenceReviewState,
  type ReferenceReviewState,
  type ReferenceReviewSummary
} from '../../types/riccoReferenceReview';
import type { RiccoPanelImage } from '../../types/riccoReview';
import {
  buildAssetLibraryItems,
  summarizeAssetLibrary,
  type AssetLibrarySummary
} from '../assets/riccoAssetLibrary';
import {
  buildDatasetCandidateItems,
  buildDatasetManifest,
  summarizeDatasetCandidates,
  type DatasetCandidateSummary,
  type DatasetManifest
} from '../assets/riccoDatasetCandidates';
import {
  buildFixQueueItems,
  summarizeFixQueue,
  type FixQueueSummary
} from '../assets/riccoFixQueue';
import {
  buildReferenceCandidateItems,
  summarizeReferenceCandidates,
  type ReferenceCandidateSummary
} from '../assets/riccoReferenceCandidates';
import {
  countEditedLetteringPanels,
  buildRiccoPipelineMap,
  type RiccoPipelineMap
} from '../workspace/riccoPipelineMap';
import {
  normalizeRiccoLetteringLayoutState,
  RICCO_LETTERING_STORAGE_KEY,
  type RiccoLetteringLayoutState
} from '../lettering/riccoLetteringLayout';

export const RICCO_PRODUCTION_PACKAGE_VERSION = 'ricco-production-package-v5';

export type RiccoPackagePanel = (typeof riccoPanels)[number] & {
  prompt?: ReturnType<typeof buildAllRiccoPanelPrompts>[number];
  generationJobs: GenerationJob[];
  finalImage: RiccoPanelImage | null;
  exportReady: boolean;
  productionNotes: string;
};

export type RiccoProductionPackage = {
  packageVersion: string;
  generatedAt: string;
  appRoute: string;
  series: typeof riccoSeries;
  episode: typeof riccoEpisode;
  characters: typeof riccoCharacters;
  locations: typeof riccoLocations;
  panels: RiccoPackagePanel[];
  generationState: {
    generationJobs: GenerationJob[];
    totalJobs: number;
    importedJobCount: number;
  };
  referenceState: {
    referenceReviewState: ReferenceReviewState;
    referenceReviewSummary: ReferenceReviewSummary;
    localStorageKey: string;
    restoreSupported: boolean;
  };
  reviewState: {
    storedImages: RiccoPanelImage[];
    finalImageCount: number;
    totalPanels: number;
    exportReady: boolean;
  };
  assetWorkflowState: {
    assetSummary: AssetLibrarySummary;
    fixQueueSummary: FixQueueSummary;
    referenceCandidateSummary: ReferenceCandidateSummary;
    datasetCandidateSummary: DatasetCandidateSummary;
    statusMetadataImageCount: number;
    referenceMetadataImageCount: number;
    datasetMetadataImageCount: number;
    restoreSupported: boolean;
  };
  letteringState: {
    layoutState: RiccoLetteringLayoutState;
    totalLayouts: number;
    editedPanelCount: number;
    localStorageKey: string;
    restoreSupported: boolean;
  };
  datasetState: {
    manifest: DatasetManifest;
    manifestVersion: DatasetManifest['manifestVersion'];
    totalItems: number;
    restoreSupported: boolean;
  };
  pipelineState: {
    snapshot: RiccoPipelineMap;
    currentStageId: string;
    currentStageLabel: string;
    progress: number;
  };
  nextSteps: string[];
};

export type ParsedRiccoProductionPackage = Partial<RiccoProductionPackage> & {
  packageVersion?: string;
  generatedAt?: string;
  panels?: Array<Partial<RiccoPackagePanel>>;
  generationState?: Partial<RiccoProductionPackage['generationState']>;
  referenceState?: Partial<RiccoProductionPackage['referenceState']> & {
    referenceReviewState?: unknown;
  };
  reviewState?: Partial<RiccoProductionPackage['reviewState']>;
  assetWorkflowState?: Partial<RiccoProductionPackage['assetWorkflowState']>;
  letteringState?: Partial<RiccoProductionPackage['letteringState']> & {
    layoutState?: unknown;
  };
  datasetState?: Partial<RiccoProductionPackage['datasetState']>;
  pipelineState?: Partial<RiccoProductionPackage['pipelineState']>;
};

export function isRiccoPanelImage(value: unknown): value is RiccoPanelImage {
  if (!value || typeof value !== 'object') return false;
  const image = value as Partial<RiccoPanelImage>;

  return (
    typeof image.id === 'string' &&
    typeof image.panelId === 'string' &&
    typeof image.imageUrl === 'string' &&
    typeof image.source === 'string' &&
    typeof image.selected === 'boolean'
  );
}

export function isRiccoGenerationJob(value: unknown): value is GenerationJob {
  if (!value || typeof value !== 'object') return false;
  const job = value as Partial<GenerationJob>;

  return (
    typeof job.id === 'string' &&
    typeof job.promptId === 'string' &&
    typeof job.workflowId === 'string' &&
    typeof job.positivePrompt === 'string' &&
    typeof job.negativePrompt === 'string' &&
    typeof job.status === 'string'
  );
}

export function buildRiccoPackageFileName(date = new Date()) {
  return `ricco-im-haus-episode-001-package-${date.toISOString().slice(0, 10)}.json`;
}

export function buildRiccoProductionPackage(input: {
  images: RiccoPanelImage[];
  generationJobs: GenerationJob[];
  referenceReviewState: ReferenceReviewState;
  letteringLayoutState?: RiccoLetteringLayoutState;
  generatedAt?: string;
}): RiccoProductionPackage {
  const { images, generationJobs, referenceReviewState } = input;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const letteringLayoutState = normalizeRiccoLetteringLayoutState(input.letteringLayoutState ?? {});
  const prompts = buildAllRiccoPanelPrompts();
  const promptsByPanelId = new Map(prompts.map((prompt) => [prompt.panelId, prompt]));
  const finalImagesByPanelId = new Map(images.filter((image) => image.selected).map((image) => [image.panelId, image]));
  const jobsByPanelId = new Map<string, GenerationJob[]>();
  const referenceReviewSummary = summarizeReferenceReviewState(referenceReviewState);
  const editedPanelCount = countEditedLetteringPanels(letteringLayoutState);
  const assetLibraryItems = buildAssetLibraryItems(images, generationJobs);
  const fixQueueItems = buildFixQueueItems(images, generationJobs);
  const referenceCandidateItems = buildReferenceCandidateItems(images, generationJobs);
  const datasetCandidateItems = buildDatasetCandidateItems(images, generationJobs);
  const datasetManifest = buildDatasetManifest(datasetCandidateItems, generatedAt);
  const pipelineSnapshot = buildRiccoPipelineMap({
    referenceReviewState,
    generationJobs,
    images,
    letteringLayoutState
  });

  for (const job of generationJobs) {
    if (!job.panelId) continue;
    const jobs = jobsByPanelId.get(job.panelId) ?? [];
    jobs.push(job);
    jobsByPanelId.set(job.panelId, jobs);
  }

  const panels = riccoPanels.map((panel) => {
    const prompt = promptsByPanelId.get(panel.id);
    const finalImage = finalImagesByPanelId.get(panel.id) ?? null;
    const panelJobs = jobsByPanelId.get(panel.id) ?? [];

    return {
      ...panel,
      prompt,
      generationJobs: panelJobs,
      finalImage,
      exportReady: Boolean(finalImage),
      productionNotes: finalImage?.notes ?? ''
    };
  });

  const finalCount = panels.filter((panel) => panel.exportReady).length;
  const importedJobCount = generationJobs.filter((job) => job.status === 'imported_as_asset').length;

  return {
    packageVersion: RICCO_PRODUCTION_PACKAGE_VERSION,
    generatedAt,
    appRoute: '#/ricco-package',
    series: riccoSeries,
    episode: riccoEpisode,
    characters: riccoCharacters,
    locations: riccoLocations,
    panels,
    generationState: {
      generationJobs,
      totalJobs: generationJobs.length,
      importedJobCount
    },
    referenceState: {
      referenceReviewState,
      referenceReviewSummary,
      localStorageKey: RICCO_REFERENCE_REVIEW_STORAGE_KEY,
      restoreSupported: true
    },
    reviewState: {
      storedImages: images,
      finalImageCount: finalCount,
      totalPanels: riccoPanels.length,
      exportReady: finalCount === riccoPanels.length
    },
    assetWorkflowState: {
      assetSummary: summarizeAssetLibrary(assetLibraryItems),
      fixQueueSummary: summarizeFixQueue(fixQueueItems),
      referenceCandidateSummary: summarizeReferenceCandidates(referenceCandidateItems),
      datasetCandidateSummary: summarizeDatasetCandidates(datasetCandidateItems),
      statusMetadataImageCount: images.filter((image) => Boolean(image.assetStatus)).length,
      referenceMetadataImageCount: images.filter((image) => Boolean(image.referenceCandidateType || image.referenceCandidateSubjectId || image.referenceCandidateNotes)).length,
      datasetMetadataImageCount: images.filter((image) => Boolean(image.datasetCandidateTargetType || image.datasetCandidateTargetId || image.datasetTriggerWord || image.datasetCaption || image.datasetNotes)).length,
      restoreSupported: true
    },
    letteringState: {
      layoutState: letteringLayoutState,
      totalLayouts: Object.keys(letteringLayoutState).length,
      editedPanelCount,
      localStorageKey: RICCO_LETTERING_STORAGE_KEY,
      restoreSupported: true
    },
    datasetState: {
      manifest: datasetManifest,
      manifestVersion: datasetManifest.manifestVersion,
      totalItems: datasetManifest.totalItems,
      restoreSupported: true
    },
    pipelineState: {
      snapshot: pipelineSnapshot,
      currentStageId: pipelineSnapshot.currentStage.id,
      currentStageLabel: pipelineSnapshot.currentStage.label,
      progress: pipelineSnapshot.progress
    },
    nextSteps: buildRiccoPackageNextSteps({
      finalCount,
      referenceApprovedCount: referenceReviewSummary.approved,
      generationJobCount: generationJobs.length,
      editedLetteringPanelCount: editedPanelCount,
      datasetCandidateCount: datasetManifest.totalItems
    })
  };
}

export function buildRiccoPackageNextSteps(input: {
  finalCount: number;
  referenceApprovedCount: number;
  generationJobCount: number;
  editedLetteringPanelCount?: number;
  datasetCandidateCount?: number;
}) {
  if ((input.datasetCandidateCount ?? 0) > 0) {
    return ['Open Ricco Dataset Candidates', 'Review captions and trigger words', 'Download dataset manifest if needed'];
  }

  if (input.finalCount === riccoPanels.length && (input.editedLetteringPanelCount ?? 0) > 0) {
    return ['Open Ricco Package', 'Download final production package', 'Archive or restore later'];
  }

  if (input.finalCount === riccoPanels.length) {
    return ['Open Ricco Lettering Editor', 'Set bubble layout', 'Then download final package'];
  }

  if (input.referenceApprovedCount === 0) {
    return ['Open Ricco Reference Packs', 'Generate and approve references', 'Then render pilot panels'];
  }

  if (input.generationJobCount === 0) {
    return ['Open Ricco Generation Queue', 'Create render jobs from prompt queue', 'Render and import panel images'];
  }

  return ['Open Ricco Image Review', 'Add missing generated images', 'Select one final image per panel'];
}

export function parseRiccoProductionPackage(rawJson: string): ParsedRiccoProductionPackage | null {
  try {
    const parsed = JSON.parse(rawJson) as ParsedRiccoProductionPackage;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function packageLooksLikeRiccoPackage(pkg: ParsedRiccoProductionPackage | null) {
  return Boolean(pkg?.packageVersion || pkg?.reviewState || pkg?.panels || pkg?.generationState || pkg?.referenceState || pkg?.assetWorkflowState || pkg?.letteringState || pkg?.datasetState || pkg?.pipelineState);
}

export function extractImagesFromRiccoPackage(pkg: ParsedRiccoProductionPackage) {
  const storedImages = Array.isArray(pkg.reviewState?.storedImages) ? pkg.reviewState.storedImages : [];
  const finalImagesFromPanels = (pkg.panels ?? [])
    .map((panel) => panel.finalImage)
    .filter(isRiccoPanelImage);

  const merged = new Map<string, RiccoPanelImage>();

  for (const image of storedImages) {
    if (isRiccoPanelImage(image)) merged.set(image.id, image);
  }

  for (const image of finalImagesFromPanels) {
    merged.set(image.id, image);
  }

  return Array.from(merged.values());
}

export function extractGenerationJobsFromRiccoPackage(pkg: ParsedRiccoProductionPackage) {
  const directJobs = Array.isArray(pkg.generationState?.generationJobs) ? pkg.generationState.generationJobs : [];
  const panelJobs = (pkg.panels ?? []).flatMap((panel) => Array.isArray(panel.generationJobs) ? panel.generationJobs : []);
  const merged = new Map<string, GenerationJob>();

  for (const job of directJobs) {
    if (isRiccoGenerationJob(job)) merged.set(job.id, job);
  }

  for (const job of panelJobs) {
    if (isRiccoGenerationJob(job)) merged.set(job.id, job);
  }

  return Array.from(merged.values());
}

export function extractReferenceReviewStateFromRiccoPackage(pkg: ParsedRiccoProductionPackage): ReferenceReviewState {
  return normalizeReferenceReviewState(pkg.referenceState?.referenceReviewState);
}

export function extractLetteringLayoutStateFromRiccoPackage(pkg: ParsedRiccoProductionPackage): RiccoLetteringLayoutState {
  return normalizeRiccoLetteringLayoutState(pkg.letteringState?.layoutState ?? {});
}
