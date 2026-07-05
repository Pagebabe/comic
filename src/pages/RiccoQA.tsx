import { useEffect, useMemo, useState } from 'react';
import { riccoEpisode, riccoPanels } from '../data/riccoStudio';

type RiccoPanelImage = {
  id: string;
  panelId: string;
  imageUrl: string;
  source: string;
  promptUsed: string;
  rating: number;
  continuityScore: number;
  notes: string;
  selected: boolean;
  createdAt: string;
};

type QASeverity = 'blocker' | 'warning' | 'ok';

type QAItem = {
  panelId: string;
  panelNumber: number;
  title: string;
  severity: QASeverity;
  message: string;
  fix: string;
};

const STORAGE_KEY = 'ricco-studio-images-v1';
const MIN_RATING = 4;
const MIN_CONTINUITY = 4;

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
}

function buildQaReport(images: RiccoPanelImage[]): QAItem[] {
  const finalImagesByPanelId = new Map<string, RiccoPanelImage>();

  for (const image of images) {
    if (image.selected) {
      finalImagesByPanelId.set(image.panelId, image);
    }
  }

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

function severityLabel(severity: QASeverity) {
  if (severity === 'blocker') return 'BLOCKER';
  if (severity === 'warning') return 'WARNING';
  return 'OK';
}

function severityClass(severity: QASeverity) {
  if (severity === 'blocker') return 'status-rejected';
  if (severity === 'warning') return 'status-needs_fix';
  return 'status-active';
}

export function RiccoQA() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
  }, []);

  const qaItems = useMemo(() => buildQaReport(images), [images]);
  const blockers = qaItems.filter((item) => item.severity === 'blocker');
  const warnings = qaItems.filter((item) => item.severity === 'warning');
  const okItems = qaItems.filter((item) => item.severity === 'ok');
  const passed = blockers.length === 0 && warnings.length === 0;

  const reportText = useMemo(() => {
    return [
      `Ricco QA Report — Folge ${riccoEpisode.episodeNumber}: ${riccoEpisode.title}`,
      `Status: ${passed ? 'PASSED' : 'NEEDS FIX'}`,
      `Blocker: ${blockers.length}`,
      `Warnings: ${warnings.length}`,
      `OK: ${okItems.length}`,
      '',
      ...qaItems.map((item) => [
        `Panel ${item.panelNumber}: ${item.title}`,
        `Severity: ${severityLabel(item.severity)}`,
        `Issue: ${item.message}`,
        `Fix: ${item.fix}`
      ].join('\n'))
    ].join('\n\n---\n\n');
  }, [blockers.length, okItems.length, passed, qaItems, warnings.length]);

  async function copyReport() {
    await navigator.clipboard.writeText(reportText);
    setCopyStatus('QA Report kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  function refreshState() {
    setImages(readStoredImages());
    setCopyStatus('Neu geladen');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className={passed ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco QA Gate v0.1</p>
        <h2>{passed ? 'QA bestanden' : 'QA braucht Nacharbeit'}</h2>
        <p className="body-copy">
          Prüft Finalbilder vor Lettering und Package: fehlende Bilder, schwaches Rating, schwache Continuity und fehlende Review-Notizen.
        </p>
        <div className="chips">
          <span>{blockers.length} Blocker</span>
          <span>{warnings.length} Warnings</span>
          <span>{okItems.length}/{riccoPanels.length} OK</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <button className="ghost-button" onClick={refreshState}>Review-Stand neu laden</button>
          <button className="primary-button" onClick={copyReport}>QA Report kopieren</button>
          <a className="ghost-link" href="#/ricco-image-review">Fix in Image Review</a>
          <a className="ghost-link" href="#/ricco-lettering">Lettering öffnen</a>
        </div>
      </div>

      <div className="grid three-col">
        <div className="card">
          <p className="eyebrow">Blocker</p>
          <h3>{blockers.length}</h3>
          <p className="body-copy">Müssen vor Export gelöst werden.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Warnings</p>
          <h3>{warnings.length}</h3>
          <p className="body-copy">Bewusst entscheiden oder verbessern.</p>
        </div>
        <div className="card">
          <p className="eyebrow">QA OK</p>
          <h3>{okItems.length}/{riccoPanels.length}</h3>
          <p className="body-copy">Finalbild, Rating, Continuity und Notiz vorhanden.</p>
        </div>
      </div>

      <section className="page-stack compact-stack">
        {qaItems.map((item) => (
          <article className="card" key={item.panelId}>
            <div className="card-header">
              <div>
                <p className="eyebrow">Panel {item.panelNumber}</p>
                <h3>{item.title}</h3>
              </div>
              <span className={`status-badge ${severityClass(item.severity)}`}>
                {severityLabel(item.severity)}
              </span>
            </div>
            <div className="grid two-col">
              <div className="dialogue-box">
                <p className="eyebrow">Issue</p>
                <p>{item.message}</p>
              </div>
              <div className="dialogue-box">
                <p className="eyebrow">Fix</p>
                <p>{item.fix}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
