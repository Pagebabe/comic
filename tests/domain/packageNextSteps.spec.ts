import { expect, test } from '@playwright/test';
import { buildRiccoPackageNextSteps } from '../../src/domain/package/riccoProductionPackage';

test('sends packages with dataset candidates to dataset manifest review first', () => {
  expect(buildRiccoPackageNextSteps({
    finalCount: 8,
    referenceApprovedCount: 4,
    generationJobCount: 8,
    editedLetteringPanelCount: 1,
    datasetCandidateCount: 2
  })).toEqual(['Open Ricco Dataset Candidates', 'Review captions and trigger words', 'Download dataset manifest if needed']);
});

test('sends completed packages without edited lettering to lettering editor', () => {
  expect(buildRiccoPackageNextSteps({
    finalCount: 8,
    referenceApprovedCount: 4,
    generationJobCount: 8,
    editedLetteringPanelCount: 0
  })).toEqual(['Open Ricco Lettering Editor', 'Set bubble layout', 'Then download final package']);
});

test('sends completed packages with edited lettering to final package download', () => {
  expect(buildRiccoPackageNextSteps({
    finalCount: 8,
    referenceApprovedCount: 4,
    generationJobCount: 8,
    editedLetteringPanelCount: 1
  })).toEqual(['Open Ricco Package', 'Download final production package', 'Archive or restore later']);
});

test('sends packages without approved references to reference packs first', () => {
  expect(buildRiccoPackageNextSteps({
    finalCount: 0,
    referenceApprovedCount: 0,
    generationJobCount: 0
  })).toEqual(['Open Ricco Reference Packs', 'Generate and approve references', 'Then render pilot panels']);
});

test('sends packages with references but no jobs to generation queue', () => {
  expect(buildRiccoPackageNextSteps({
    finalCount: 0,
    referenceApprovedCount: 1,
    generationJobCount: 0
  })).toEqual(['Open Ricco Generation Queue', 'Create render jobs from prompt queue', 'Render and import panel images']);
});

test('sends in-progress packages with jobs to image review', () => {
  expect(buildRiccoPackageNextSteps({
    finalCount: 3,
    referenceApprovedCount: 1,
    generationJobCount: 8
  })).toEqual(['Open Ricco Image Review', 'Add missing generated images', 'Select one final image per panel']);
});
