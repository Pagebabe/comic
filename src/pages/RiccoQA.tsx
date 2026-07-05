import { useEffect, useMemo, useState } from 'react';
import { riccoPanels } from '../data/riccoStudio';
import {
  buildRiccoQAReportItems,
  buildRiccoQAReportText,
  qaSeverityClass,
  qaSeverityLabel,
  summarizeRiccoQAItems
} from '../domain/export/riccoExportState';
import { RICCO_IMAGES_STORAGE_KEY } from '../lib/backend/localProductionStore';
import type { RiccoPanelImage } from '../types/riccoReview';

function readStoredImages(): RiccoPanelImage[] {
  try {
    const raw = window.localStorage.getItem(RICCO_IMAGES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RiccoPanelImage[];
  } catch {
    return [];
  }
}

export function RiccoQA() {
  const [images, setImages] = useState<RiccoPanelImage[]>([]);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setImages(readStoredImages());
  }, []);

  const qaItems = useMemo(() => buildRiccoQAReportItems(images), [images]);
  const qaSummary = useMemo(() => summarizeRiccoQAItems(qaItems), [qaItems]);
  const reportText = useMemo(() => buildRiccoQAReportText(qaItems), [qaItems]);

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
      <div className={qaSummary.passed ? 'hero-card' : 'hero-card warning-card'}>
        <p className="eyebrow">Ricco QA Gate v0.2</p>
        <h2>{qaSummary.passed ? 'QA bestanden' : 'QA braucht Nacharbeit'}</h2>
        <p className="body-copy">
          Prüft Finalbilder vor Lettering und Package: fehlende Bilder, schwaches Rating, schwache Continuity und fehlende Review-Notizen. Version 0.2 nutzt die gemeinsame Export-Domain-Schicht.
        </p>
        <div className="chips">
          <span>{qaSummary.blockers.length} Blocker</span>
          <span>{qaSummary.warnings.length} Warnings</span>
          <span>{qaSummary.okItems.length}/{riccoPanels.length} OK</span>
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
          <h3>{qaSummary.blockers.length}</h3>
          <p className="body-copy">Müssen vor Export gelöst werden.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Warnings</p>
          <h3>{qaSummary.warnings.length}</h3>
          <p className="body-copy">Bewusst entscheiden oder verbessern.</p>
        </div>
        <div className="card">
          <p className="eyebrow">QA OK</p>
          <h3>{qaSummary.okItems.length}/{riccoPanels.length}</h3>
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
              <span className={`status-badge ${qaSeverityClass(item.severity)}`}>
                {qaSeverityLabel(item.severity)}
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
