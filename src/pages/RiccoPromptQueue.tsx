import { useMemo, useState } from 'react';
import { buildAllRiccoPanelPrompts, riccoEpisode, riccoPanels, riccoSeries } from '../data/riccoStudio';

function buildFileName(extension: 'json' | 'txt' | 'csv') {
  const date = new Date().toISOString().slice(0, 10);
  return `ricco-im-haus-episode-001-prompt-queue-${date}.${extension}`;
}

function downloadText(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function RiccoPromptQueue() {
  const [copyStatus, setCopyStatus] = useState('');

  const queue = useMemo(() => {
    const prompts = buildAllRiccoPanelPrompts();

    return prompts.map((prompt) => {
      const panel = riccoPanels.find((item) => item.id === prompt.panelId);

      return {
        id: prompt.panelId,
        panelNumber: panel?.panelNumber ?? 0,
        title: panel?.title ?? prompt.panelId,
        action: panel?.action ?? '',
        camera: panel?.camera ?? '',
        mood: panel?.mood ?? '',
        positivePrompt: prompt.positivePrompt,
        negativePrompt: prompt.negativePrompt,
        dialogueOverlay: prompt.dialogueOverlay,
        continuityChecklist: prompt.continuityChecklist,
        status: 'ready_for_external_generation'
      };
    });
  }, []);

  const jsonExport = useMemo(() => JSON.stringify({
    exportType: 'ricco-prompt-queue-v1',
    generatedAt: new Date().toISOString(),
    series: riccoSeries.title,
    episode: {
      id: riccoEpisode.id,
      episodeNumber: riccoEpisode.episodeNumber,
      title: riccoEpisode.title,
      logline: riccoEpisode.logline
    },
    queue
  }, null, 2), [queue]);

  const textExport = useMemo(() => {
    return queue.map((item) => [
      `PANEL ${item.panelNumber}: ${item.title}`,
      '',
      'POSITIVE PROMPT:',
      item.positivePrompt,
      '',
      'NEGATIVE PROMPT:',
      item.negativePrompt,
      '',
      'DIALOGUE OVERLAY:',
      item.dialogueOverlay,
      '',
      'CONTINUITY:',
      item.continuityChecklist.join(', ')
    ].join('\n')).join('\n\n==============================\n\n');
  }, [queue]);

  const csvExport = useMemo(() => {
    const header = ['panelNumber', 'title', 'positivePrompt', 'negativePrompt', 'dialogueOverlay', 'continuityChecklist'];
    const rows = queue.map((item) => [
      String(item.panelNumber),
      item.title,
      item.positivePrompt,
      item.negativePrompt,
      item.dialogueOverlay,
      item.continuityChecklist.join(' | ')
    ].map(escapeCsv).join(','));

    return [header.join(','), ...rows].join('\n');
  }, [queue]);

  async function copyAllPositivePrompts() {
    const all = queue.map((item) => `Panel ${item.panelNumber}: ${item.title}\n${item.positivePrompt}`).join('\n\n---\n\n');
    await navigator.clipboard.writeText(all);
    setCopyStatus('Alle Positive Prompts kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function copyQueueJson() {
    await navigator.clipboard.writeText(jsonExport);
    setCopyStatus('Prompt Queue JSON kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco Prompt Queue v0.1</p>
        <h2>{riccoEpisode.title} · Batch für Bildgenerierung</h2>
        <p className="body-copy">
          Alle Panel-Prompts als saubere Queue für externe Generatoren. Erst hier exportieren, dann Bilder generieren und danach im Image Review eintragen.
        </p>
        <div className="chips">
          <span>{queue.length} Panel Prompts</span>
          <span>JSON</span>
          <span>TXT</span>
          <span>CSV</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={copyAllPositivePrompts}>Alle Positive Prompts kopieren</button>
          <button className="ghost-button" onClick={copyQueueJson}>JSON kopieren</button>
          <button className="ghost-button" onClick={() => downloadText(jsonExport, buildFileName('json'), 'application/json')}>JSON herunterladen</button>
          <button className="ghost-button" onClick={() => downloadText(textExport, buildFileName('txt'), 'text/plain')}>TXT herunterladen</button>
          <button className="ghost-button" onClick={() => downloadText(csvExport, buildFileName('csv'), 'text/csv')}>CSV herunterladen</button>
          <a className="ghost-link" href="#/ricco-image-review">Image Review öffnen</a>
        </div>
      </div>

      <div className="grid two-col">
        <section className="card rule-card">
          <p className="eyebrow">Workflow</p>
          <h3>So nutzt du die Queue</h3>
          <ul>
            <li>Prompts exportieren oder kopieren.</li>
            <li>Pro Panel mehrere Bildvarianten extern generieren.</li>
            <li>Keine Sprechblasen im Bild erzeugen.</li>
            <li>Bild-URLs danach in Ricco Image Review speichern.</li>
          </ul>
        </section>

        <section className="card rule-card">
          <p className="eyebrow">Regel</p>
          <h3>Bild bleibt clean</h3>
          <ul>
            <li>Dialog bleibt im Overlay.</li>
            <li>Keine lesbaren Texte im Bild.</li>
            <li>Keine Wasserzeichen.</li>
            <li>Keine zufälligen Buchstaben oder Logos.</li>
          </ul>
        </section>
      </div>

      <section className="page-stack compact-stack">
        {queue.map((item) => (
          <article className="card prompt-card" key={item.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">Panel {item.panelNumber}</p>
                <h3>{item.title}</h3>
              </div>
              <span className="status-badge status-active">ready</span>
            </div>
            <div className="shot-meta">
              <span>{item.camera}</span>
              <span>{item.mood}</span>
              <span>{item.status}</span>
            </div>
            <p className="body-copy">{item.action}</p>
            <label>Positive Prompt</label>
            <textarea readOnly value={item.positivePrompt} />
            <label>Negative Prompt</label>
            <textarea readOnly value={item.negativePrompt} />
            <div className="dialogue-box">
              <p className="eyebrow">Dialogue Overlay</p>
              <p>{item.dialogueOverlay}</p>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
