import { riccoPanels } from '../../data/riccoStudio';
import type { RiccoPanelImage } from '../../types/riccoReview';

export type BeginnerPanelStatus = 'FINAL' | 'REVIEW' | 'TODO';

export type BeginnerNextAction = {
  title: string;
  route: string;
  button: string;
  helper: string;
};

export type BeginnerEpisodeReport = {
  finalCount: number;
  progress: number;
  firstMissingPanelNumber: number;
  nextAction: BeginnerNextAction;
};

export function getBeginnerPanelStatus(panelId: string, images: RiccoPanelImage[]): BeginnerPanelStatus {
  const panelImages = images.filter((image) => image.panelId === panelId);
  if (panelImages.some((image) => image.selected)) return 'FINAL';
  if (panelImages.length > 0) return 'REVIEW';
  return 'TODO';
}

export function beginnerPanelStatusClass(status: BeginnerPanelStatus) {
  if (status === 'FINAL') return 'status-active';
  if (status === 'REVIEW') return 'status-needs_fix';
  return 'status-rejected';
}

export function buildBeginnerEpisodeReport(images: RiccoPanelImage[]): BeginnerEpisodeReport {
  const finalPanelIds = new Set(images.filter((image) => image.selected).map((image) => image.panelId));
  const firstMissing = riccoPanels.find((panel) => !finalPanelIds.has(panel.id)) ?? riccoPanels[0];
  const finalCount = finalPanelIds.size;
  const progress = Math.round((finalCount / riccoPanels.length) * 100);

  if (images.length === 0) {
    return {
      finalCount,
      progress,
      firstMissingPanelNumber: firstMissing.panelNumber,
      nextAction: {
        title: 'Make the first images',
        route: '#/ricco-prompt-queue',
        button: 'Make Images for Panel 1',
        helper: `Start with Panel ${firstMissing.panelNumber}: ${firstMissing.title}. Make 2-4 rough variants.`
      }
    };
  }

  if (finalCount < riccoPanels.length) {
    return {
      finalCount,
      progress,
      firstMissingPanelNumber: firstMissing.panelNumber,
      nextAction: {
        title: 'Choose final images',
        route: '#/ricco-image-review',
        button: `Choose Final for Panel ${firstMissing.panelNumber}`,
        helper: `Panel ${firstMissing.panelNumber}: ${firstMissing.title} still needs one final image.`
      }
    };
  }

  return {
    finalCount,
    progress: 100,
    firstMissingPanelNumber: firstMissing.panelNumber,
    nextAction: {
      title: 'Add dialogue text',
      route: '#/ricco-lettering',
      button: 'Add Text',
      helper: 'All panels have final images. Add dialogue and prepare export.'
    }
  };
}
