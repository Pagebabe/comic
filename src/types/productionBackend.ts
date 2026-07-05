export type AssetStatus =
  | 'raw'
  | 'maybe'
  | 'selected'
  | 'rejected'
  | 'reference_candidate'
  | 'approved_reference'
  | 'dataset_candidate'
  | 'approved_dataset'
  | 'needs_fix'
  | 'fixed'
  | 'approved_panel';

export type GenerationJobStatus =
  | 'queued'
  | 'copied_to_comfyui'
  | 'running_manual'
  | 'completed_manual'
  | 'failed'
  | 'cancelled'
  | 'imported_as_asset'
  | 'api_queued'
  | 'api_running'
  | 'api_completed'
  | 'api_failed';

export type ProductionSubjectType =
  | 'character'
  | 'location'
  | 'style'
  | 'episode'
  | 'scene'
  | 'panel'
  | 'prop'
  | 'lora';

export type ProductionAsset = {
  id: string;
  fileName: string;
  filePath: string;
  thumbnailPath?: string;
  assetType: string;
  subjectType?: ProductionSubjectType;
  subjectId?: string;
  status: AssetStatus;
  score?: number;
  promptId?: string;
  generationJobId?: string;
  modelId?: string;
  seed?: string;
  workflowId?: string;
  usableForReference: boolean;
  usableForDataset: boolean;
  usableForPanel: boolean;
  rejectionReason?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt?: string;
};

export type QualityReview = {
  id: string;
  assetId: string;
  reviewType: 'character' | 'location' | 'style' | 'panel' | 'dataset_candidate';
  reviewer: string;
  scoreTotal: number;
  scoreFace?: number;
  scoreStyle?: number;
  scoreLocation?: number;
  scoreComposition?: number;
  scorePromptFit?: number;
  decision: AssetStatus;
  notes: string;
  createdAt: string;
};

export type GenerationJob = {
  id: string;
  promptId: string;
  panelId?: string;
  episodeId?: string;
  sceneId?: string;
  subjectType?: ProductionSubjectType;
  subjectId?: string;
  workflowId: string;
  workflowVersion: string;
  jobType: 'manual_panel' | 'manual_character' | 'manual_location' | 'manual_reference' | 'api_panel';
  positivePrompt: string;
  negativePrompt: string;
  modelId?: string;
  loraIds: string[];
  seed?: string;
  sampler: string;
  steps: number;
  cfg: number;
  resolutionWidth: number;
  resolutionHeight: number;
  batchSize: number;
  batchCount: number;
  outputPath: string;
  status: GenerationJobStatus;
  errorMessage?: string;
  comfyUiPromptId?: string;
  comfyUiClientId?: string;
  comfyUiApiUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
};

export type BackendMode = 'local_browser' | 'supabase_rest';

export type ProductionBackendHealth = {
  mode: BackendMode;
  configured: boolean;
  readable: boolean;
  writable: boolean;
  notes: string[];
};
