import { riccoPanels } from '../../data/riccoStudio';
import type { GenerationJob } from '../../types/productionBackend';
import type { RiccoPanelImage } from '../../types/riccoReview';

export type AssetJobMatch = 'selected_job' | 'auto_panel_match' | 'none';

export type AssetImportRow = {
  id: string;
  rawPath: string;
  normalizedPath: string;
  panelId: string;
  generationJobId?: string;
  promptId?: string;
  valid: boolean;
  note: string;
  jobMatch: AssetJobMatch;
};

export const RICCO_ASSET_IMPORT_EXAMPLE_INPUT = [
  '/generated/panel_001_v1.png',
  '/generated/panel_001_v2.png',
  '/generated/panel_002_v1.webp',
  '/generated/p03_fix_face.jpg',
  '/generated/04_variant.png'
].join('\n');

export const RICCO_JOB_STATUS_PREFERENCE: GenerationJob['status'][] = [
  'completed_manual',
  'api_completed',
  'running_manual',
  'copied_to_comfyui',
  'queued',
  'imported_as_asset',
  'api_queued',
  'api_running',
  'failed',
  'api_failed',
  'cancelled'
];

export function createAssetImportRowId(now = Date.now(), randomPart = Math.random().toString(16).slice(2)) {
  return `asset_row_${now}_${randomPart}`;
}

export function createRiccoImageId(now = Date.now(), randomPart = Math.random().toString(16).slice(2)) {
  return `img_${now}_${randomPart}`;
}

export function normalizeAssetPath(value: string) {
  const clean = value.trim().replace(/^public\//, '').replace(/^\.\//, '');
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  return clean.startsWith('/') ? clean : `/${clean}`;
}

export function isSupportedImagePath(value: string) {
  return /\.(png|jpg|jpeg|webp|gif)$/i.test(value.split('?')[0]);
}

export function inferPanelIdFromAssetPath(filePath: string, fallbackPanelId: string) {
  const fileName = filePath.split('/').pop()?.toLowerCase() ?? filePath.toLowerCase();
  const matches = [
    fileName.match(/panel[_\-\s]?0?(\d{1,2})/),
    fileName.match(/p[_\-\s]?0?(\d{1,2})/),
    fileName.match(/^0?(\d{1,2})[_\-\s]/),
    fileName.match(/[_\-\s]0?(\d{1,2})[_\-\s]/)
  ].filter(Boolean) as RegExpMatchArray[];

  for (const match of matches) {
    const panelNumber = Number(match[1]);
    const panel = riccoPanels.find((item) => item.panelNumber === panelNumber);
    if (panel) return panel.id;
  }

  return fallbackPanelId;
}

export function generationJobTimestamp(job: GenerationJob) {
  return new Date(job.updatedAt ?? job.createdAt).getTime() || 0;
}

export function generationJobStatusRank(job: GenerationJob) {
  const rank = RICCO_JOB_STATUS_PREFERENCE.indexOf(job.status);
  return rank >= 0 ? rank : RICCO_JOB_STATUS_PREFERENCE.length;
}

export function findBestGenerationJobForPanel(panelId: string, generationJobs: GenerationJob[], selectedJob?: GenerationJob) {
  if (selectedJob?.panelId === panelId) {
    return { job: selectedJob, match: 'selected_job' as const };
  }

  const candidates = generationJobs.filter((job) => job.panelId === panelId);

  if (candidates.length === 0) {
    return { job: undefined, match: 'none' as const };
  }

  const [job] = [...candidates].sort((a, b) => {
    const rankDelta = generationJobStatusRank(a) - generationJobStatusRank(b);
    if (rankDelta !== 0) return rankDelta;
    return generationJobTimestamp(b) - generationJobTimestamp(a);
  });

  return { job, match: 'auto_panel_match' as const };
}

export function buildAssetImportRowNote(valid: boolean, generationJob: GenerationJob | undefined, match: AssetJobMatch) {
  if (!valid) return 'Kein erkannter Bildpfad.';

  if (!generationJob) {
    return 'Bereit zum Import. Kein passender Generation Job gefunden.';
  }

  if (match === 'selected_job') {
    return `Bereit zum Import. Manuell mit ${generationJob.id} verknüpft.`;
  }

  return `Bereit zum Import. Automatisch mit ${generationJob.id} verknüpft.`;
}

export function buildAssetImportRows(input: {
  rawInput: string;
  fallbackPanelId: string;
  generationJobs: GenerationJob[];
  selectedJob?: GenerationJob;
  createId?: () => string;
}): AssetImportRow[] {
  const panelFallback = input.selectedJob?.panelId ?? input.fallbackPanelId;
  const createId = input.createId ?? createAssetImportRowId;

  return input.rawInput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((rawPath) => {
      const normalizedPath = normalizeAssetPath(rawPath);
      const valid = Boolean(normalizedPath) && isSupportedImagePath(normalizedPath);
      const panelId = inferPanelIdFromAssetPath(normalizedPath, panelFallback);
      const { job, match } = valid
        ? findBestGenerationJobForPanel(panelId, input.generationJobs, input.selectedJob)
        : { job: undefined, match: 'none' as const };

      return {
        id: createId(),
        rawPath,
        normalizedPath,
        panelId,
        generationJobId: job?.id,
        promptId: job?.promptId,
        valid,
        note: buildAssetImportRowNote(valid, job, match),
        jobMatch: match
      };
    });
}

export function relinkAssetImportRow(input: {
  row: AssetImportRow;
  panelId: string;
  generationJobs: GenerationJob[];
  selectedJob?: GenerationJob;
}): AssetImportRow {
  const { job, match } = findBestGenerationJobForPanel(input.panelId, input.generationJobs, input.selectedJob);

  return {
    ...input.row,
    panelId: input.panelId,
    generationJobId: job?.id,
    promptId: job?.promptId,
    note: buildAssetImportRowNote(input.row.valid, job, match),
    jobMatch: match
  };
}

export function buildRiccoImagesFromAssetRows(input: {
  rows: AssetImportRow[];
  generationJobs: GenerationJob[];
  createdAt?: string;
  createId?: () => string;
}): RiccoPanelImage[] {
  const createId = input.createId ?? createRiccoImageId;
  const createdAt = input.createdAt ?? new Date().toISOString();

  return input.rows
    .filter((row) => row.valid)
    .map((row) => {
      const job = input.generationJobs.find((item) => item.id === row.generationJobId);

      return {
        id: createId(),
        panelId: row.panelId,
        imageUrl: row.normalizedPath,
        source: row.generationJobId ? 'generation_job_public_asset' : 'public_asset',
        promptUsed: job?.positivePrompt ?? '',
        rating: 0,
        continuityScore: 0,
        notes: row.generationJobId
          ? `Public Asset: ${row.normalizedPath}\nGeneration Job: ${row.generationJobId}\nPrompt: ${row.promptId ?? job?.promptId ?? '-'}\nJob Match: ${row.jobMatch}`
          : `Public Asset: ${row.normalizedPath}`,
        selected: false,
        createdAt,
        generationJobId: row.generationJobId,
        promptId: row.promptId ?? job?.promptId
      };
    });
}

export function importedGenerationJobIds(rows: AssetImportRow[]) {
  return Array.from(new Set(rows.map((row) => row.generationJobId).filter(Boolean) as string[]));
}
