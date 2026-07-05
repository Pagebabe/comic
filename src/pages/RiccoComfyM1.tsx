import { useMemo, useState } from 'react';
import { riccoEpisode, riccoPanels } from '../data/riccoStudio';

type Preset = {
  id: string;
  title: string;
  useCase: string;
  model: string;
  size: string;
  batch: string;
  steps: string;
  cfg: string;
  sampler: string;
  notes: string[];
};

const presets: Preset[] = [
  {
    id: 'm1-safe-sdxl',
    title: 'M1 Safe SDXL Comic',
    useCase: 'Standard für Ricco Panels auf M1 32 GB',
    model: 'SDXL Comic / Cartoon Checkpoint',
    size: '768x1024 oder 832x1216',
    batch: '1',
    steps: '20–28',
    cfg: '5.5–7',
    sampler: 'DPM++ 2M Karras oder Euler a',
    notes: [
      'Panel für Panel rendern, nicht als großer Batch.',
      'Keine Sprechblasen und keine lesbaren Texte ins Bild prompten.',
      'Nach jedem guten Ergebnis direkt sauber benennen und in Bulk Upload legen.'
    ]
  },
  {
    id: 'm1-fast-draft',
    title: 'M1 Fast Draft',
    useCase: 'Schnelle Varianten testen',
    model: 'SDXL Turbo / LCM / Lightning, falls vorhanden',
    size: '768x1024',
    batch: '1',
    steps: '6–12',
    cfg: '1.5–3.5 je nach Modell',
    sampler: 'Euler / DPM++ SDE je nach Workflow',
    notes: [
      'Nur für Komposition und grobe Character-Idee.',
      'Nicht als Finalbild nehmen, bevor Continuity sauber ist.',
      'Gute Drafts später mit Safe SDXL neu rendern.'
    ]
  },
  {
    id: 'm1-fix-pass',
    title: 'M1 Fix Pass',
    useCase: 'Gesicht, Hände, Schimmel, Props oder Hintergrund korrigieren',
    model: 'Gleiches SDXL Modell wie Hauptbild',
    size: 'Originalgröße oder leicht kleiner',
    batch: '1',
    steps: '14–22',
    cfg: '4.5–6',
    sampler: 'DPM++ 2M Karras',
    notes: [
      'Inpainting nur auf kleine Bereiche anwenden.',
      'Denoise niedrig bis mittel halten.',
      'Nach Fix erneut ins Image Review laden und Notiz setzen.'
    ]
  },
  {
    id: 'cloud-heavy',
    title: 'Cloud Heavy Pass',
    useCase: 'Nur wenn M1 zu langsam wird',
    model: 'Flux / große Upscaler / Video / Training',
    size: 'Je nach GPU',
    batch: '1–4 je nach VRAM',
    steps: '25–35',
    cfg: 'Modellabhängig',
    sampler: 'Workflow abhängig',
    notes: [
      'Für RunPod oder RTX Rechner gedacht.',
      'LoRA Training und Video nicht auf dem M1 erzwingen.',
      'Finale High-End Panels können später in der Cloud neu gerendert werden.'
    ]
  }
];

function buildNamingPlan() {
  return riccoPanels.map((panel) => `panel_${String(panel.panelNumber).padStart(3, '0')}_v1_${panel.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}.png`).join('\n');
}

function buildRenderChecklist() {
  return [
    `Ricco im Haus — Folge ${riccoEpisode.episodeNumber}: ${riccoEpisode.title}`,
    '',
    '1. Ricco Prompt Queue öffnen und Prompt für Panel kopieren.',
    '2. In ComfyUI Safe SDXL Comic Preset nutzen.',
    '3. Batch Size 1, Panel einzeln rendern.',
    '4. Keine Sprechblasen, keine lesbaren Texte, keine Fake-Logos.',
    '5. Ergebnis nach Schema speichern: panel_001_v1.png.',
    '6. Mehrere Varianten pro Panel erzeugen: v1, v2, v3.',
    '7. Bulk Upload öffnen und Dateien gesammelt importieren.',
    '8. Image Review: Rating, Continuity, Notiz, Finalbild wählen.',
    '',
    'Dateinamen:',
    buildNamingPlan()
  ].join('\n');
}

export function RiccoComfyM1() {
  const [copyStatus, setCopyStatus] = useState('');
  const namingPlan = useMemo(() => buildNamingPlan(), []);
  const checklist = useMemo(() => buildRenderChecklist(), []);

  async function copyChecklist() {
    await navigator.clipboard.writeText(checklist);
    setCopyStatus('ComfyUI Checkliste kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  async function copyNamingPlan() {
    await navigator.clipboard.writeText(namingPlan);
    setCopyStatus('Dateinamen kopiert');
    window.setTimeout(() => setCopyStatus(''), 1500);
  }

  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Ricco ComfyUI / M1 Presets v0.1</p>
        <h2>Lokaler Renderplan für M1 32 GB</h2>
        <p className="body-copy">
          Diese Seite ist der praktische Render-Spickzettel: SDXL statt schwerer Video-Workflows, Batch 1, klare Dateinamen und danach Bulk Upload / Image Review.
        </p>
        <div className="chips">
          <span>{presets.length} Presets</span>
          <span>{riccoPanels.length} Panel-Dateinamen</span>
          <span>M1 lokal</span>
          {copyStatus && <span>{copyStatus}</span>}
        </div>
        <div className="review-actions">
          <button className="primary-button" onClick={copyChecklist}>Render-Checkliste kopieren</button>
          <button className="ghost-button" onClick={copyNamingPlan}>Dateinamen kopieren</button>
          <a className="ghost-link" href="#/ricco-prompt-queue">Prompt Queue</a>
          <a className="ghost-link" href="#/ricco-bulk-upload">Bulk Upload</a>
        </div>
      </div>

      <div className="grid two-col">
        {presets.map((preset) => (
          <article className="card rule-card" key={preset.id}>
            <p className="eyebrow">{preset.id}</p>
            <h3>{preset.title}</h3>
            <p className="body-copy">{preset.useCase}</p>
            <div className="spec-grid">
              <div><span>Model</span><p>{preset.model}</p></div>
              <div><span>Size</span><p>{preset.size}</p></div>
              <div><span>Batch</span><p>{preset.batch}</p></div>
              <div><span>Steps</span><p>{preset.steps}</p></div>
              <div><span>CFG</span><p>{preset.cfg}</p></div>
              <div><span>Sampler</span><p>{preset.sampler}</p></div>
            </div>
            <ul>
              {preset.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </article>
        ))}
      </div>

      <div className="grid two-col">
        <section className="card prompt-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Naming</p>
              <h3>Dateinamen für Bulk Upload</h3>
            </div>
            <button className="ghost-button" onClick={copyNamingPlan}>Copy</button>
          </div>
          <textarea readOnly value={namingPlan} style={{ minHeight: 280 }} />
        </section>

        <section className="card prompt-card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Checklist</p>
              <h3>Render Ablauf</h3>
            </div>
            <button className="ghost-button" onClick={copyChecklist}>Copy</button>
          </div>
          <textarea readOnly value={checklist} style={{ minHeight: 280 }} />
        </section>
      </div>

      <section className="card rule-card">
        <p className="eyebrow">M1 Regel</p>
        <h3>Nicht gegen den Rechner kämpfen</h3>
        <ul>
          <li>SDXL Panels lokal sind realistisch.</li>
          <li>Flux, Video und Training sind Cloud-Kandidaten.</li>
          <li>Viele kleine saubere Varianten schlagen einen riesigen perfekten Render.</li>
          <li>Finale Qualität entsteht durch Review, Fix-Pass und Lettering, nicht durch einen Monster-Prompt.</li>
        </ul>
      </section>
    </section>
  );
}
