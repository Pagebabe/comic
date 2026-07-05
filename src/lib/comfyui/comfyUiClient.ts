import type { GenerationJob } from '../../types/productionBackend';

export type ComfyUiSubmitResult = {
  apiUrl: string;
  clientId: string;
  promptId?: string;
  response: unknown;
};

export function getComfyUiBrowserConfig() {
  const apiUrl = (import.meta.env.VITE_COMFYUI_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
  const clientId = (import.meta.env.VITE_COMFYUI_CLIENT_ID as string | undefined) || 'ricco_factory_browser';

  return {
    apiUrl,
    clientId,
    configured: Boolean(apiUrl)
  };
}

export function buildMinimalComfyUiPayload(job: GenerationJob) {
  return {
    meta: {
      source: 'ricco-comic-factory',
      warning: 'This is an adapter payload, not a full ComfyUI graph. Use workflow mapping before real API submit.',
      jobId: job.id,
      panelId: job.panelId,
      promptId: job.promptId
    },
    positivePrompt: job.positivePrompt,
    negativePrompt: job.negativePrompt,
    settings: {
      workflowId: job.workflowId,
      modelId: job.modelId,
      loraIds: job.loraIds,
      seed: job.seed,
      sampler: job.sampler,
      steps: job.steps,
      cfg: job.cfg,
      width: job.resolutionWidth,
      height: job.resolutionHeight,
      batchSize: job.batchSize,
      batchCount: job.batchCount,
      outputPath: job.outputPath
    }
  };
}

export async function checkComfyUiHealth() {
  const config = getComfyUiBrowserConfig();

  if (!config.configured) {
    throw new Error('Missing VITE_COMFYUI_API_URL. Keep using manual ComfyUI workflow.');
  }

  const response = await fetch(`${config.apiUrl}/system_stats`);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ComfyUI health check failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function submitRawWorkflowToComfyUi(workflowPayload: Record<string, unknown>): Promise<ComfyUiSubmitResult> {
  const config = getComfyUiBrowserConfig();

  if (!config.configured) {
    throw new Error('Missing VITE_COMFYUI_API_URL.');
  }

  const response = await fetch(`${config.apiUrl}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: workflowPayload,
      client_id: config.clientId
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ComfyUI submit failed: ${response.status} ${text}`);
  }

  const json = await response.json();

  return {
    apiUrl: config.apiUrl,
    clientId: config.clientId,
    promptId: typeof json.prompt_id === 'string' ? json.prompt_id : undefined,
    response: json
  };
}
