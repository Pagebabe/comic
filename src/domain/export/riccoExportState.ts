import { riccoEpisode, riccoPanels } from '../../data/riccoStudio';
import type { RiccoPanelImage } from '../../types/riccoReview';

export type QASeverity = 'blocker' | 'warning' | 'ok';

export type QAItem = {
  panelId: string;
  panelNumber: number;
  title: string;
  severity: QASeverity;
  message: string;
  fix: string;
};

export type RiccoExportPanelState = {
  panel: (typeof riccoPanels)[number];
  finalImage: RiccoPanelImage | null;
  ready: boolean;
};

export type RiccoExportReadiness = {
  panelStates: RiccoExportPanelState[];
  finalImagesByPanelId: Map<string, RiccoPanelImage>;
  finalCount: number;
  missingCount: number;
  totalPanels: number;
  isReady: boolean;
  progress: number;
};

export const MIN_RATING = 4;
export const MIN_CONTINUITY = 4;

export function buildFinalImagesByPanelId(images: RiccoPanelImage[]) {
  const map = new Map<string, RiccoPanelImage>();

  for (const image of images) {
    if (image.selected) {
      map.set(image.panelId, image);
    }
  }

  return map;
}

export function buildRiccoExportReadiness(images: RiccoPanelImage[]): RiccoExportReadiness {
  const finalImagesByPanelId = buildFinalImagesByPanelId(images);
  const panelStates = riccoPanels.map((panel) => {
    const finalImage = finalImagesByPanelId.get(panel.id) ?? null;

    return {
      panel,
      finalImage,
      ready: Boolean(finalImage)
    };
  });
  const finalCount = panelStates.filter((item) => item.ready).length;
  const totalPanels = riccoPanels.length;
  const missingCount = totalPanels - finalCount;

  return {
    panelStates,
    finalImagesByPanelId,
    finalCount,
    missingCount,
    totalPanels,
    isReady: finalCount === totalPanels,
    progress: Math.round((finalCount / totalPanels) * 100)
  };
}

export function buildRiccoDialogueScript() {
  return riccoPanels
    .map((panel) => `Panel ${panel.panelNumber}: ${panel.title}\n${panel.dialogue}`)
    .join('\n\n---\n\n');
}

export function buildRiccoQAReportItems(images: RiccoPanelImage[]): QAItem[] {
  const finalImagesByPanelId = buildFinalImagesByPanelId(images);

  return riccoPanels.map((panel) => {
    const finalImage = finalImagesByPanelId.get(panel.id);

    if (!finalImage) {
      return {
        panelId: panel.id,
        panelNumber: panel.panelNumber,
        title: panel.title,
        severity: 'blocker',
        message: 'Kein Finalbild gewählt.',
        fix: 'In Ricco Image Review eine Bildvariante als final auswählen.'
      };
    }

    if ((finalImage.rating || 0) < MIN_RATING) {
      return {
        panelId: panel.id,
        panelNumber: panel.panelNumber,
        title: panel.title,
        severity: 'warning',
        message: `Rating ist ${finalImage.rating || 0}/5.`,
        fix: 'Bildvariante verbessern oder bewusst trotzdem verwenden.'
      };
    }

    if ((finalImage.continuityScore || 0) < MIN_CONTINUITY) {
      return {
        panelId: panel.id,
        panelNumber: panel.panelNumber,
        title: panel.title,
        severity: 'warning',
        message: `Continuity ist ${finalImage.continuityScore || 0}/5.`,
        fix: 'Character/Location-Konstanz prüfen und gegebenenfalls neu generieren.'
      };
    }

    if (!finalImage.notes.trim()) {
      return {
        panelId: panel.id,
        panelNumber: panel.panelNumber,
        title: panel.title,
        severity: 'warning',
        message: 'Finalbild hat keine Review-Notiz.',
        fix: 'Kurz notieren, warum diese Variante final ist oder was noch stört.'
      };
    }

    return {
      panelId: panel.id,
      panelNumber: panel.panelNumber,
      title: panel.title,
      severity: 'ok',
      message: 'Panel ist QA-ready.',
      fix: 'Kein Fix nötig.'
    };
  });
}

export function summarizeRiccoQAItems(qaItems: QAItem[]) {
  const blockers = qaItems.filter((item) => item.severity === 'blocker');
  const warnings = qaItems.filter((item) => item.severity === 'warning');
  const okItems = qaItems.filter((item) => item.severity === 'ok');
  const passed = blockers.length === 0 && warnings.length === 0;

  return {
    blockers,
    warnings,
    okItems,
    passed
  };
}

export function qaSeverityLabel(severity: QASeverity) {
  if (severity === 'blocker') return 'BLOCKER';
  if (severity === 'warning') return 'WARNING';
  return 'OK';
}

export function qaSeverityClass(severity: QASeverity) {
  if (severity === 'blocker') return 'status-rejected';
  if (severity === 'warning') return 'status-needs_fix';
  return 'status-active';
}

export function buildRiccoQAReportText(qaItems: QAItem[]) {
  const { blockers, warnings, okItems, passed } = summarizeRiccoQAItems(qaItems);

  return [
    `Ricco QA Report — Folge ${riccoEpisode.episodeNumber}: ${riccoEpisode.title}`,
    `Status: ${passed ? 'PASSED' : 'NEEDS FIX'}`,
    `Blocker: ${blockers.length}`,
    `Warnings: ${warnings.length}`,
    `OK: ${okItems.length}`,
    '',
    ...qaItems.map((item) => [
      `Panel ${item.panelNumber}: ${item.title}`,
      `Severity: ${qaSeverityLabel(item.severity)}`,
      `Issue: ${item.message}`,
      `Fix: ${item.fix}`
    ].join('\n'))
  ].join('\n\n---\n\n');
}
