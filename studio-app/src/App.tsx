import { useEffect, useMemo, useState } from 'react';
import { ProductionLoop } from './ProductionLoop';
import { SelectedPilotLoop } from './SelectedPilotLoop';

type TruthState = {
  repository: string;
  trackingIssue: number;
  canon: { selectedPilot: string | null; selectedTitle?: string; status: string };
  productArchitecture: {
    currentMain: { type: string };
    productionFoundation: { branch: string; status: string };
  };
  nextSequence: Array<{ id: string; title: string; status: string; doneWhen: string; trackingIssue?: number; proof?: string }>;
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

type LoopClosure = {
  status: string;
  implementedBy: { pullRequest: number; ciRun: number; mergeCommit: string };
  publicProof: { pagesRun: number; route: string; publicVerificationPassed: boolean };
  proof: {
    stationsPassed: number;
    deleteCountercheckPassed: boolean;
    deleteRestoreHashMatch: boolean;
    stateHash: string;
    packageHash: string;
    imageBytesUsed: boolean;
    externalExecutionUsed: boolean;
    creativeApprovalGranted: boolean;
  };
  nextGate: { id: string; title: string; trackingIssue: number; status: string };
};

const loadJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
};

function currentView() {
  if (window.location.hash === '#loop') return 'loop';
  if (window.location.hash === '#pilot-fire-test') return 'pilot';
  return 'foundation';
}

export default function App() {
  const [truth, setTruth] = useState<TruthState | null>(null);
  const [foundation, setFoundation] = useState<FoundationStatus | null>(null);
  const [loopClosure, setLoopClosure] = useState<LoopClosure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState(currentView());

  useEffect(() => {
    Promise.all([
      loadJson<TruthState>('../project/truth-state.json'),
      loadJson<FoundationStatus>('../project/studio-foundation-status.json'),
      loadJson<LoopClosure>('../project/lr3-production-loop-closure.json')
    ])
      .then(([truthData, foundationData, closureData]) => {
        setTruth(truthData);
        setFoundation(foundationData);
        setLoopClosure(closureData);
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
          <p className="eyebrow">STUDIO · LOAD BLOCKED</p>
          <h1>Studio konnte seinen belegten Truth State nicht laden.</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!truth || !foundation || !loopClosure) {
    return <main className="loading" aria-live="polite">Studio lädt den belegten Projektstand …</main>;
  }

  const selectedTitle = truth.canon.selectedTitle || (truth.canon.selectedPilot === 'pilot-das-zimmer' ? 'Das Zimmer' : 'nicht gesetzt');
  const capabilityCount = Object.values(foundation.capabilities).filter(Boolean).length;

  return (
    <div className="app" data-testid="studio-foundation">
      <header className="topbar">
        <div>
          <p className="eyebrow">COMIC FACTORY · RECOVERY LINE</p>
          <strong>Production Studio</strong>
        </div>
        <nav aria-label="Studio-Navigation">
          <a href="#foundation" aria-current={view === 'foundation' ? 'page' : undefined}>Status</a>
          <a href="#loop" aria-current={view === 'loop' ? 'page' : undefined}>LR3 Proof Loop</a>
          <a href="#pilot-fire-test" aria-current={view === 'pilot' ? 'page' : undefined}>LR4 Das Zimmer</a>
          <a href="../">Audit-Dashboard</a>
        </nav>
      </header>

      {view === 'loop' ? (
        <ProductionLoop />
      ) : view === 'pilot' ? (
        <SelectedPilotLoop />
      ) : (
        <main className="shell" id="foundation">
          <section className="hero">
            <div>
              <p className="eyebrow">LR3 GESCHLOSSEN · {activeGate?.id || 'LR4'} ISSUE #{activeGate?.trackingIssue || truth.trackingIssue}</p>
              <h1>Neutraler Loop bewiesen. Das Zimmer als Nächstes.</h1>
              <p className="lead">Die öffentliche Studio-Foundation und der neutrale Control-bis-Restore-Pfad sind nachweislich zurückgeführt. Das aktive Gate ist LR4: Das ausgewählte Das-Zimmer-Paket muss denselben Fire Test bestehen, ohne Dialoge, Timing, Bilder oder Stimmen automatisch freizugeben.</p>
            </div>
            <div className="hero-state" data-testid="foundation-state">
              <span>LR3 PUBLICLY VERIFIED</span>
              <strong>DELETE + RESTORE PASS</strong>
              <small>Selected-Pilot-Fire-Test noch offen</small>
            </div>
          </section>

          <section className="cards" aria-label="Recovery-Wahrheitsstatus">
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
              <span>LR3 BEWEIS</span>
              <strong>{loopClosure.proof.stationsPassed}/9 · HASH MATCH</strong>
              <p>Pages {loopClosure.publicProof.pagesRun}<br /><code>{loopClosure.implementedBy.mergeCommit.slice(0, 12)}</code></p>
            </article>
            <article>
              <span>FOUNDATION</span>
              <strong>{capabilityCount}/{Object.keys(foundation.capabilities).length}</strong>
              <p>Build, Route, Truth-State-Anbindung, Responsive Shell und öffentlicher Hashbeweis.</p>
            </article>
          </section>

          <section className="status-grid" id="status">
            <article className="panel">
              <p className="eyebrow">LR3 · BEWIESENER LOOP</p>
              <h2>Was öffentlich funktioniert</h2>
              <ul className="check-list">
                <li><b>✓</b><span>Control → Studio → Prompt Queue</span></li>
                <li><b>✓</b><span>Import → Review → QA → Lettering</span></li>
                <li><b>✓</b><span>Package → tatsächliche Zustandslöschung → Restore</span></li>
                <li><b>✓</b><span>identischer SHA-256-Zustand vor Löschung und nach Restore</span></li>
                <li><b>✓</b><span>Desktop und Mobil ohne Bildbytes oder externe Ausführung</span></li>
              </ul>
              <p className="boundary">State <code>{loopClosure.proof.stateHash.slice(0, 16)}…</code><br />Package <code>{loopClosure.proof.packageHash.slice(0, 16)}…</code></p>
            </article>
            <article className="panel warning" data-testid="not-restored">
              <p className="eyebrow">LR4 · AKTIVER ARBEITSBEREICH</p>
              <h2>Selected-Pilot-Fire-Test</h2>
              <ul>
                <li>Das-Zimmer-Quellen einzeln binden</li>
                <li>SelectedPilotEpisodePackage versionieren</li>
                <li>alle Details als REVIEW_REQUIRED führen</li>
                <li>Import, Review, QA, Lettering und Export ausführen</li>
                <li>Zustand löschen und hashgleich restaurieren</li>
              </ul>
              <p className="boundary">Keine Bildgenerierung, keine Stimmenfreigabe, kein Detail-Canon-Lock und keine fertige Episode. LR4 beweist Transport, nicht kreative Qualität.</p>
              <a className="loop-link" href="#pilot-fire-test">LR4 Fire Test öffnen</a>
            </article>
          </section>
        </main>
      )}

      <footer>
        <span>Repository: {truth.repository}</span>
        <span>Route: {foundation.route}{view === 'loop' ? '#loop' : view === 'pilot' ? '#pilot-fire-test' : ''}</span>
        <span>LR3 geschlossen · LR4 aktiv · Selected-Pilot-Fire-Test noch nicht öffentlich bewiesen</span>
      </footer>
    </div>
  );
}
