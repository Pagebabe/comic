import { describe, expect, it } from '@jest/globals';
import { riccoPanels } from '../../src/data/riccoStudio';
import {
  buildBeginnerEpisodeReport,
  getBeginnerPanelStatus
} from '../../src/domain/episode/riccoBeginnerFlow';
import type { RiccoPanelImage } from '../../src/types/riccoReview';

function image(panelId: string, selected = false): RiccoPanelImage {
  return {
    id: `${panelId}-${selected ? 'final' : 'variant'}`,
    panelId,
    imageUrl: '/test.png',
    source: 'manual_url',
    promptUsed: '',
    rating: 4,
    continuityScore: 4,
    notes: 'usable',
    selected,
    createdAt: '2026-07-06T00:00:00.000Z'
  };
}

describe('ricco beginner flow', () => {
  it('starts with making images when no images exist', () => {
    const report = buildBeginnerEpisodeReport([]);

    expect(report.finalCount).toBe(0);
    expect(report.nextAction.route).toBe('#/ricco-prompt-queue');
  });

  it('moves to image review when images exist but finals are missing', () => {
    const report = buildBeginnerEpisodeReport([image(riccoPanels[0].id)]);

    expect(report.finalCount).toBe(0);
    expect(report.nextAction.route).toBe('#/ricco-image-review');
  });

  it('moves to lettering when all panels have final images', () => {
    const allFinals = riccoPanels.map((panel) => image(panel.id, true));
    const report = buildBeginnerEpisodeReport(allFinals);

    expect(report.finalCount).toBe(riccoPanels.length);
    expect(report.nextAction.route).toBe('#/ricco-lettering');
  });

  it('reports panel review status', () => {
    const panelId = riccoPanels[0].id;

    expect(getBeginnerPanelStatus(panelId, [])).toBe('TODO');
    expect(getBeginnerPanelStatus(panelId, [image(panelId)])).toBe('REVIEW');
    expect(getBeginnerPanelStatus(panelId, [image(panelId, true)])).toBe('FINAL');
  });
});
