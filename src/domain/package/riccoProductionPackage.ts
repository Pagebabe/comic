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

export const RICCO_PRODUCTION_PACKAGE_VERSION = 'ricco-production-package-v3';

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
  generatedAt?: string;
}): RiccoProductionPackage {
  const { images, generationJobs, referenceReviewState } = input;
  const prompts = buildAllRiccoPanelPrompts();
  const promptsByPanelId = new Map(prompts.map((prompt) => [prompt.panelId, prompt]));
  const finalImagesByPanelId = new Map(images.filter((image) => image.selected).map((image) => [image.panelId, image]));
  const jobsByPanelId = new Map<string, GenerationJob[]>();
  const referenceReviewSummary = summarizeReferenceReviewState(referenceReviewState);

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
    generatedAt: input.generatedAt ?? new Date().toISOString(),
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
    nextSteps: buildRiccoPackageNextSteps({
      finalCount,
      referenceApprovedCount: referenceReviewSummary.approved,
      generationJobCount: generationJobs.length
    })
  };
}

export function buildRiccoPackageNextSteps(input: {
  finalCount: number;
  referenceApprovedCount: number;
  generationJobCount: number;
}) {
  if (input.finalCount === riccoPanels.length) {
    return ['Open Ricco Lettering Preview', 'Check dialogue layout', 'Use Browser Print / PDF'];
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
  return Boolean(pkg?.packageVersion || pkg?.reviewState || pkg?.panels || pkg?.generationState || pkg?.referenceState);
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
