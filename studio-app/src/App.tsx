import { useEffect, useMemo, useState } from 'react';
import { ProductionLoop } from './ProductionLoop';

type TruthState = {
  repository: string;
  trackingIssue: number;
  canon: { selectedPilot: string | null; selectedTitle?: string; status: string };
  productArchitecture: {
    currentMain: { type: string };
    productionFoundation: { branch: string; status: string };
  };
  nextSequence: Array<{ id: string; title: string; status: string; doneWhen: string; trackingIssue?: number }>;
};

type FoundationStatus = {
  status: string;
  route: string;
  sourceArchive: { branch: string; commit: string };
  capabilities: Record<string, boolean>;
  notRestored: string[];
  publicProof?: { pagesRun: number; mergeCommit: string; url: string };
  nextGate?: { id: string; trackingIssue: number; title: string };
};

const loadJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
};

function currentView() {
  return window.location.hash === '#loop' ? 'loop' : 'foundation';
}

export default function App() {
  const [truth, setTruth] = useState<TruthState | null>(null);
  const [foundation, setFoundation] = useState<FoundationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState(currentView());

  useEffect(() => {
    Promise.all([
      loadJson<TruthState>('../project/truth-state.json'),
      loadJson<FoundationStatus>('../project/studio-foundation-status.json')
    ])
      .then(([truthData, foundationData]) => {
        setTruth(truthData);
        setFoundation(foundationData);
      })
      .catch((loadError) => setError(String(loadError)));
  }, []);

  useEffect(() => {
    const onHashChange = () => setView(currentView());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const activeGate = useMemo(
    () => truth?.nextSequence.find((item) => item.status.startsWith('active')),
    [truth]
  );

  if (error) {
    return (
      <main className="shell" data-testid="studio-foundation-error">
        <section className="hero error-card">
          <p className="eyebrow">STUDIO FOUNDATION · LOAD BLOCKED</p>
          <h1>Studio Foundation konnte ihren Truth State nicht laden.</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!truth || !foundation) {
    return <main className="loading" aria-live="polite">Studio Foundation lädt den belegten Projektstand …</main>;
  }

  const selectedTitle = truth.canon.selectedTitle || (truth.canon.selectedPilot === 'pilot-das-zimmer' ? 'Das Zimmer' : 'nicht gesetzt');
  const capabilityCount = Object.values(foundation.capabilities).filter(Boolean).length;

  return (
    <div className="app" data-testid="studio-foundation">
      <header className="topbar">
        <div>
          <p className="eyebrow">COMIC FACTORY · RECOVERY LINE</p>
          <strong>Studio Foundation</strong>
        </div>
        <nav aria-label="Studio-Navigation">
          <a href="#foundation" aria-current={view === 'foundation' ? 'page' : undefined}>Foundation</a>
          <a href="#loop" aria-current={view === 'loop' ? 'page' : undefined}>LR3 Production Loop</a>
          <a href="../">Audit-Dashboard</a>
        </nav>
      </header>

      {view === 'loop' ? (
        <ProductionLoop />
      ) : (
        <main className="shell" id="foundation">
          <section className="hero">
            <div>
              <p className="eyebrow">LR2 GESCHLOSSEN · {activeGate?.id || 'LR3'} ISSUE #{activeGate?.trackingIssue || truth.trackingIssue}</p>
              <h1>Foundation bewiesen. Produktionsloop als Nächstes.</h1>
              <p className="lead">Vite, React, TypeScript und die öffentliche Studio-Route sind nachweislich zurückgeführt. Das aktive Gate ist jetzt LR3: Control, Queue, Import, Review, QA, Lettering, Package und Restore müssen noch als ein neutraler Testpfad funktionieren.</p>
            </div>
            <div className="hero-state" data-testid="foundation-state">
              <span>FOUNDATION PUBLICLY VERIFIED</span>
              <strong>{foundation.status}</strong>
              <small>Produktionsloop noch nicht gerettet</small>
            </div>
          </section>

          <section className="cards" aria-label="Foundation-Wahrheitsstatus">
            <article>
              <span>PILOT</span>
              <strong data-testid="selected-pilot">{selectedTitle}</strong>
              <p>Menschlich ausgewählt. Detail-, Visual- und Voice-Gates bleiben offen.</p>
            </article>
            <article>
              <span>AKTIVES GATE</span>
              <strong data-testid="active-gate">{activeGate?.id || 'unbekannt'}</strong>
              <p>{activeGate?.title || 'Kein aktives Gate gefunden'} · Issue #{activeGate?.trackingIssue || truth.trackingIssue}</p>
            </article>
            <article>
              <span>LR2 BEWEIS</span>
              <strong>PUBLIC BUILD PROVEN</strong>
              <p>Pages {foundation.publicProof?.pagesRun || 29148728164}<br /><code>{(foundation.publicProof?.mergeCommit || '').slice(0, 12)}</code></p>
            </article>
            <article>
              <span>FOUNDATION</span>
              <strong>{capabilityCount}/{Object.keys(foundation.capabilities).length}</strong>
              <p>Build, Route, Truth-State-Anbindung, Responsive Shell und öffentlicher Hashbeweis.</p>
            </article>
          </section>

          <section className="status-grid" id="status">
            <article className="panel">
              <p className="eyebrow">LR2 · BEWIESENER SLICE</p>
              <h2>Was öffentlich funktioniert</h2>
              <ul className="check-list">
                {Object.entries(foundation.capabilities).map(([key, value]) => (
                  <li key={key}><b>{value ? '✓' : '!'}</b><span>{key}</span></li>
                ))}
              </ul>
            </article>
            <article className="panel warning" data-testid="not-restored">
              <p className="eyebrow">LR3 · NOCH NICHT GERETTET</p>
              <h2>Produktionsloop bleibt offen</h2>
              <ul>
                {foundation.notRestored.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="boundary">Keine Bildgenerierung, keine Stimmenfreigabe, kein Blind-Merge und keine fertige Episode. LR3 muss einen neutralen Delete-and-Restore-Test beweisen.</p>
              <a className="loop-link" href="#loop">Neutralen LR3-Testpfad öffnen</a>
            </article>
          </section>
        </main>
      )}

      <footer>
        <span>Repository: {truth.repository}</span>
        <span>Route: {foundation.route}{view === 'loop' ? '#loop' : ''}</span>
        <span>LR2 geschlossen · LR3 aktiv · Produktionsloop noch nicht öffentlich bewiesen</span>
      </footer>
    </div>
  );
}
