import type { GenerationJob, ProductionAsset, ProductionBackendHealth, QualityReview } from '../../types/productionBackend';

type SupabaseTable = 'assets' | 'quality_reviews' | 'generation_jobs';

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  return {
    url: url?.replace(/\/$/, '') ?? '',
    anonKey: anonKey ?? '',
    configured: Boolean(url && anonKey)
  };
}

function toSnakeAsset(asset: ProductionAsset) {
  return {
    id: asset.id,
    file_name: asset.fileName,
    file_path: asset.filePath,
    thumbnail_path: asset.thumbnailPath ?? null,
    asset_type: asset.assetType,
    subject_type: asset.subjectType ?? null,
    subject_id: asset.subjectId ?? null,
    status: asset.status,
    score: asset.score ?? null,
    prompt_id: asset.promptId ?? null,
    generation_job_id: asset.generationJobId ?? null,
    model_id: asset.modelId ?? null,
    seed: asset.seed ?? null,
    workflow_id: asset.workflowId ?? null,
    usable_for_reference: asset.usableForReference,
    usable_for_dataset: asset.usableForDataset,
    usable_for_panel: asset.usableForPanel,
    rejection_reason: asset.rejectionReason ?? null,
    review_notes: asset.reviewNotes ?? null
  };
}

function toSnakeReview(review: QualityReview) {
  return {
    id: review.id,
    asset_id: review.assetId,
    review_type: review.reviewType,
    reviewer: review.reviewer,
    score_total: review.scoreTotal,
    score_face: review.scoreFace ?? null,
    score_style: review.scoreStyle ?? null,
    score_location: review.scoreLocation ?? null,
    score_composition: review.scoreComposition ?? null,
    score_prompt_fit: review.scorePromptFit ?? null,
    decision: review.decision,
    notes: review.notes
  };
}

function toSnakeGenerationJob(job: GenerationJob) {
  return {
    id: job.id,
    workflow_id: job.workflowId,
    workflow_version: job.workflowVersion,
    job_type: job.jobType,
    prompt_id: job.promptId,
    positive_prompt: job.positivePrompt,
    negative_prompt: job.negativePrompt,
    model_id: job.modelId ?? null,
    lora_ids: job.loraIds,
    seed: job.seed ?? null,
    sampler: job.sampler,
    steps: job.steps,
    cfg: job.cfg,
    resolution_width: job.resolutionWidth,
    resolution_height: job.resolutionHeight,
    batch_size: job.batchSize,
    batch_count: job.batchCount,
    output_path: job.outputPath,
    status: job.status,
    error_message: job.errorMessage ?? null,
    episode_id: job.episodeId ?? null,
    scene_id: job.sceneId ?? null,
    panel_id: job.panelId ?? null,
    subject_type: job.subjectType ?? null,
    subject_id: job.subjectId ?? null,
    notes: job.notes ?? null,
    comfyui_prompt_id: job.comfyUiPromptId ?? null,
    comfyui_client_id: job.comfyUiClientId ?? null,
    comfyui_api_url: job.comfyUiApiUrl ?? null
  };
}

async function supabaseRestRequest<T>(table: SupabaseTable, body: unknown): Promise<T[]> {
  const config = getSupabaseConfig();

  if (!config.configured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const response = await fetch(`${config.url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase insert failed for ${table}: ${response.status} ${text}`);
  }

  return response.json() as Promise<T[]>;
}

export function getSupabaseBackendHealth(): ProductionBackendHealth {
  const config = getSupabaseConfig();

  return {
    mode: 'supabase_rest',
    configured: config.configured,
    readable: config.configured,
    writable: config.configured,
    notes: config.configured
      ? ['Supabase REST config found. Writes still depend on RLS policies.']
      : ['Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Local browser mode remains active.']
  };
}

export async function createSupabaseAsset(asset: ProductionAsset) {
  return supabaseRestRequest('assets', toSnakeAsset(asset));
}

export async function createSupabaseQualityReview(review: QualityReview) {
  return supabaseRestRequest('quality_reviews', toSnakeReview(review));
}

export async function createSupabaseGenerationJob(job: GenerationJob) {
  return supabaseRestRequest('generation_jobs', toSnakeGenerationJob(job));
}
