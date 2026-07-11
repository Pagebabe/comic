import { useEffect, useMemo, useState } from 'react';

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
};

const loadJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
};

export default function App() {
  const [truth, setTruth] = useState<TruthState | null>(null);
  const [foundation, setFoundation] = useState<FoundationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const activeGate = useMemo(
    () => truth?.nextSequence.find((item) => item.status.startsWith('active')),
    [truth]
  );

  if (error) {
    return (
      <main className="shell" data-testid="studio-foundation-error">
        <section className="hero error-card">
          <p className="eyebrow">LR2 · LOAD BLOCKED</p>
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
          <a href="#foundation">Foundation</a>
          <a href="#status">Status</a>
          <a href="../">Audit-Dashboard</a>
        </nav>
      </header>

      <main className="shell">
        <section className="hero" id="foundation">
          <div>
            <p className="eyebrow">LR2 · ISSUE #{truth.trackingIssue}</p>
            <h1>Neutrale Produktionsbasis zurück im Browser.</h1>
            <p className="lead">Vite, React, TypeScript und eine getestete Studio-Route sind als kleinster atomarer Slice aus der archivierten Produktionsbasis zurückgeführt. Der Produktionsloop bleibt absichtlich noch draußen.</p>
          </div>
          <div className="hero-state" data-testid="foundation-state">
            <span>FOUNDATION CANDIDATE</span>
            <strong>{foundation.status}</strong>
            <small>kein Production-Ready-Claim</small>
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
            <span>QUELLE</span>
            <strong>Archiv bewahrt</strong>
            <p>{foundation.sourceArchive.branch}<br /><code>{foundation.sourceArchive.commit.slice(0, 12)}</code></p>
          </article>
          <article>
            <span>FOUNDATION</span>
            <strong>{capabilityCount}/{Object.keys(foundation.capabilities).length}</strong>
            <p>Build, Route, Truth-State-Anbindung und Responsive Shell.</p>
          </article>
        </section>

        <section className="status-grid" id="status">
          <article className="panel">
            <p className="eyebrow">BEWIESENER SLICE</p>
            <h2>Was diese Route leisten muss</h2>
            <ul className="check-list">
              {Object.entries(foundation.capabilities).map(([key, value]) => (
                <li key={key}><b>{value ? '✓' : '!'}</b><span>{key}</span></li>
              ))}
            </ul>
          </article>
          <article className="panel warning" data-testid="not-restored">
            <p className="eyebrow">NOCH NICHT GERETTET</p>
            <h2>Produktionsloop bleibt gesperrt</h2>
            <ul>
              {foundation.notRestored.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="boundary">Keine Bildgenerierung, keine Stimmenfreigabe, kein Blind-Merge und keine fertige Episode.</p>
          </article>
        </section>
      </main>

      <footer>
        <span>Repository: {truth.repository}</span>
        <span>Route: {foundation.route}</span>
        <span>Produktionsloop noch nicht gerettet</span>
      </footer>
    </div>
  );
}
