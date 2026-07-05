import { expect, test } from '@playwright/test';
import {
  buildReferenceCandidateBrief,
  buildReferenceCandidateItems,
  buildReferenceCandidateReport,
  buildReferenceCandidateTargets,
  resolveReferenceCandidate,
  summarizeReferenceCandidates,
  updateReferenceCandidateTarget
} from '../../src/domain/assets/riccoReferenceCandidates';
import type { GenerationJob } from '../../src/types/productionBackend';
import type { RiccoPanelImage } from '../../src/types/riccoReview';

function makeImage(input: Partial<RiccoPanelImage> = {}): RiccoPanelImage {
  return {
    id: input.id ?? 'img_1',
    panelId: input.panelId ?? 'panel_001',
    imageUrl: input.imageUrl ?? '/generated/panel_001.png',
    source: input.source ?? 'public_asset',
    promptUsed: input.promptUsed ?? 'prompt text',
    rating: input.rating ?? 5,
    continuityScore: input.continuityScore ?? 5,
    notes: input.notes ?? 'good face reference',
    selected: input.selected ?? false,
    createdAt: input.createdAt ?? '2026-07-05T00:00:00.000Z',
    generationJobId: input.generationJobId,
    promptId: input.promptId,
    assetStatus: input.assetStatus,
    assetStatusUpdatedAt: input.assetStatusUpdatedAt,
    referenceCandidateType: input.referenceCandidateType,
    referenceCandidateSubjectId: input.referenceCandidateSubjectId,
    referenceCandidateNotes: input.referenceCandidateNotes,
    referenceCandidateUpdatedAt: input.referenceCandidateUpdatedAt
  };
}

function makeJob(input: Partial<GenerationJob> = {}): GenerationJob {
  return {
    id: input.id ?? 'job_1',
    jobType: 'manual_panel',
    subjectType: 'panel',
    subjectId: input.subjectId ?? 'panel_001',
    episodeId: 'ep_001',
    panelId: input.panelId ?? 'panel_001',
    promptId: input.promptId ?? 'prompt_001',
    workflowId: input.workflowId ?? 'WF-006',
    workflowVersion: input.workflowVersion ?? 'v1',
    positivePrompt: 'positive',
    negativePrompt: 'negative',
    modelId: 'model_sdxl_comic_v1',
    loraIds: [],
    seed: 100001,
    sampler: 'DPM++ 2M Karras',
    steps: 30,
    cfg: 7,
    resolutionWidth: 1216,
    resolutionHeight: 832,
    batchSize: 1,
    batchCount: 4,
    outputPath: '/generated/panel_001/',
    status: input.status ?? 'completed_manual',
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-05T00:00:00.000Z'
  };
}

test('builds reference candidate targets for characters locations and style', () => {
  const targets = buildReferenceCandidateTargets();

  expect(targets.some((target) => target.type === 'character' && target.label === 'Ricco')).toBe(true);
  expect(targets.some((target) => target.type === 'location')).toBe(true);
  expect(targets.some((target) => target.type === 'style')).toBe(true);
});

test('builds candidate items only from reference_candidate assets', () => {
  const items = buildReferenceCandidateItems([
    makeImage({ id: 'candidate', assetStatus: 'reference_candidate', generationJobId: 'job_1' }),
    makeImage({ id: 'raw', assetStatus: 'raw' })
  ], [makeJob({ id: 'job_1' })]);

  expect(items).toHaveLength(1);
  expect(items[0].image.id).toBe('candidate');
  expect(items[0].targetLabel).toBe('No target set');
  expect(items[0].generationJob?.id).toBe('job_1');
});

test('updates target metadata and candidate notes', () => {
  const images = [makeImage({ id: 'candidate', assetStatus: 'reference_candidate' })];
  const updated = updateReferenceCandidateTarget(images, 'candidate', {
    type: 'character',
    subjectId: 'char_ricco',
    notes: 'best ricco face'
  }, '2026-07-05T00:00:00.000Z');

  expect(updated[0]).toMatchObject({
    assetStatus: 'reference_candidate',
    referenceCandidateType: 'character',
    referenceCandidateSubjectId: 'char_ricco',
    referenceCandidateNotes: 'best ricco face',
    referenceCandidateUpdatedAt: '2026-07-05T00:00:00.000Z'
  });
});

test('summarizes candidates by target type and target completeness', () => {
  const items = buildReferenceCandidateItems([
    makeImage({ id: 'character', assetStatus: 'reference_candidate', referenceCandidateType: 'character', referenceCandidateSubjectId: 'char_ricco' }),
    makeImage({ id: 'location', assetStatus: 'reference_candidate', referenceCandidateType: 'location', referenceCandidateSubjectId: 'loc_riccos_zimmer' }),
    makeImage({ id: 'style', assetStatus: 'reference_candidate', referenceCandidateType: 'style', referenceCandidateSubjectId: 'style_master_rih', generationJobId: 'job_1' }),
    makeImage({ id: 'missing', assetStatus: 'reference_candidate' })
  ], [makeJob({ id: 'job_1' })]);

  expect(summarizeReferenceCandidates(items)).toEqual({
    total: 4,
    withTarget: 3,
    missingTarget: 1,
    characterCandidates: 1,
    locationCandidates: 1,
    styleCandidates: 1,
    linkedToJobs: 1
  });
});

test('builds candidate brief and report', () => {
  const items = buildReferenceCandidateItems([
    makeImage({ id: 'candidate', assetStatus: 'reference_candidate', referenceCandidateType: 'character', referenceCandidateSubjectId: 'char_ricco', referenceCandidateNotes: 'use as front ref' })
  ], []);

  expect(buildReferenceCandidateBrief(items[0])).toContain('Ricco Reference Candidate Brief');
  expect(buildReferenceCandidateBrief(items[0])).toContain('Ricco');
  expect(buildReferenceCandidateReport(items)).toContain('Total candidates: 1');
  expect(buildReferenceCandidateReport(items)).toContain('use as front ref');
});

test('resolves candidates only to allowed statuses', () => {
  const images = [makeImage({ id: 'candidate', assetStatus: 'reference_candidate' })];
  const approved = resolveReferenceCandidate(images, 'candidate', 'approved_reference', '2026-07-05T00:00:00.000Z');
  const ignored = resolveReferenceCandidate(images, 'candidate', 'needs_fix', '2026-07-05T00:00:00.000Z');

  expect(approved[0]).toMatchObject({ assetStatus: 'approved_reference', assetStatusUpdatedAt: '2026-07-05T00:00:00.000Z' });
  expect(ignored[0].assetStatus).toBe('reference_candidate');
});
