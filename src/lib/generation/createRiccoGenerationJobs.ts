import { buildAllRiccoPanelPrompts, riccoEpisode, riccoPanels } from '../../data/riccoStudio';
import type { GenerationJob } from '../../types/productionBackend';

function makeJobId(panelId: string, index: number) {
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  return `gen_${panelId}_${String(index + 1).padStart(2, '0')}_${stamp}`;
}

function inferOutputPath(panelNumber: number) {
  return `public/generated/panel_${String(panelNumber).padStart(3, '0')}/`;
}

export function createRiccoPanelGenerationJobs(): GenerationJob[] {
  const prompts = buildAllRiccoPanelPrompts();
  const now = new Date().toISOString();

  return prompts.map((prompt, index) => {
    const panel = riccoPanels.find((item) => item.id === prompt.panelId);
    const panelNumber = panel?.panelNumber ?? index + 1;

    return {
      id: makeJobId(prompt.panelId, index),
      promptId: `prompt_${prompt.panelId}_v1`,
      panelId: prompt.panelId,
      episodeId: riccoEpisode.id,
      subjectType: 'panel',
      subjectId: prompt.panelId,
      workflowId: 'WF-006',
      workflowVersion: 'v1',
      jobType: 'manual_panel',
      positivePrompt: prompt.positivePrompt,
      negativePrompt: prompt.negativePrompt,
      modelId: 'model_sdxl_comic_v1',
      loraIds: [],
      seed: String(100000 + panelNumber),
      sampler: 'DPM++ 2M Karras',
      steps: 30,
      cfg: 7,
      resolutionWidth: 1216,
      resolutionHeight: 832,
      batchSize: 1,
      batchCount: 4,
      outputPath: inferOutputPath(panelNumber),
      status: 'queued',
      notes: `Panel ${panelNumber}: ${panel?.title ?? prompt.panelId}`,
      createdAt: now,
      updatedAt: now
    } satisfies GenerationJob;
  });
}

export function buildGenerationJobExport(jobs: GenerationJob[]) {
  return {
    exportType: 'ricco-generation-queue-v1',
    generatedAt: new Date().toISOString(),
    episode: {
      id: riccoEpisode.id,
      episodeNumber: riccoEpisode.episodeNumber,
      title: riccoEpisode.title,
      panelCount: riccoEpisode.panelCount
    },
    jobs
  };
}
