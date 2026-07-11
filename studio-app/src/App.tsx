import { useEffect, useMemo, useState } from 'react';
import { GuidedMode } from './GuidedMode';
import { ProductionLoop } from './ProductionLoop';
import { RiccoMasterReview } from './RiccoMasterReview';
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

type PilotClosure = {
  status: string;
  selectedPilot: { id: string; title: string; detailStatus: string };
  implementedBy: { pullRequest: number; ciRun: number; mergeCommit: string };
  publicProof: { pagesRun: number; route: string; publicVerificationPassed: boolean };
  proof: {
    stationsPassed: number;
    panelCount: number;
    dialogueCueCount: number;
    candidateDurationSeconds: number;
    stateActuallyDeleted: boolean;
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
  if (window.location.hash === '#guided') return 'guided';
  if (window.location.hash === '#loop') return 'loop';
  if (window.location.hash === '#pilot-fire-test') return 'pilot';
  if (window.location.hash === '#lr5-ricco') return 'ricco';
  return 'foundation';
}

export default function App() {
  const [truth, setTruth] = useState<TruthState | null>(null);
  const [foundation, setFoundation] = useState<FoundationStatus | null>(null);
  const [loopClosure, setLoopClosure] = useState<LoopClosure | null>(null);
  const [pilotClosure, setPilotClosure] = useState<PilotClosure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState(currentView());

  useEffect(() => {
    Promise.all([
      loadJson<TruthState>('../project/truth-state.json'),
      loadJson<FoundationStatus>('../project/studio-foundation-status.json'),
      loadJson<LoopClosure>('../project/lr3-production-loop-closure.json'),
      loadJson<PilotClosure>('../project/lr4-selected-pilot-closure.json')
    ])
      .then(([truthData, foundationData, loopData, pilotData]) => {
        setTruth(truthData);
        setFoundation(foundationData);
        setLoopClosure(loopData);
        setPilotClosure(pilotData);
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

  if (!truth || !foundation || !loopClosure || !pilotClosure) {
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
          <a href="#guided" aria-current={view === 'guided' ? 'page' : undefined}>Guided Mode</a>
          <a href="#loop" aria-current={view === 'loop' ? 'page' : undefined}>LR3 Proof Loop</a>
          <a href="#pilot-fire-test" aria-current={view === 'pilot' ? 'page' : undefined}>LR4 Das Zimmer</a>
          <a href="#lr5-ricco" aria-current={view === 'ricco' ? 'page' : undefined}>LR5.1 Ricco</a>
          <a href="../">Audit-Dashboard</a>
        </nav>
      </header>

      {view === 'guided' ? (
        <GuidedMode />
      ) : view === 'loop' ? (
        <ProductionLoop />
      ) : view === 'pilot' ? (
        <SelectedPilotLoop />
      ) : view === 'ricco' ? (
        <RiccoMasterReview />
      ) : (
        <main className="shell" id="foundation">
          <section className="hero">
            <div>
              <p className="eyebrow">LR4 GESCHLOSSEN · {activeGate?.id || 'LR5'} ISSUE #{activeGate?.trackingIssue || truth.trackingIssue}</p>
              <h1>Das Zimmer transportiert. Jetzt echte Master einzeln prüfen.</h1>
              <p className="lead">Studio Foundation, neutraler Produktionsloop und Selected-Pilot-Fire-Test sind öffentlich bewiesen. Das aktive Gate ist LR5. Der Guided Mode erklärt den sicheren Ablauf, während LR5.1 genau einen möglichen Ricco-Kandidaten vorbereitet. Kein technischer Erfolg wird automatisch zur kreativen Freigabe.</p>
            </div>
            <div className="hero-state" data-testid="foundation-state">
              <span>LR4 PUBLICLY VERIFIED</span>
              <strong>SELECTED PILOT HASH MATCH</strong>
              <small>LR5 Master-Reviews offen · 0/4 Characters · 0/4 Sets · 0/3 Voices</small>
            </div>
          </section>

          <section className="cards" aria-label="Recovery-Wahrheitsstatus">
            <article>
              <span>PILOT</span>
              <strong data-testid="selected-pilot">{selectedTitle}</strong>
              <p>Ausgewählt und transporttechnisch bewiesen. Detail-, Visual- und Voice-Gates bleiben offen.</p>
            </article>
            <article>
              <span>AKTIVES GATE</span>
              <strong data-testid="active-gate">{activeGate?.id || 'unbekannt'}</strong>
              <p>{activeGate?.title || 'Kein aktives Gate gefunden'} · Issue #{activeGate?.trackingIssue || truth.trackingIssue}</p>
            </article>
            <article>
              <span>LR4 BEWEIS</span>
              <strong>{pilotClosure.proof.stationsPassed}/9 · HASH MATCH</strong>
              <p>Pages {pilotClosure.publicProof.pagesRun}<br /><code>{pilotClosure.implementedBy.mergeCommit.slice(0, 12)}</code></p>
            </article>
            <article>
              <span>FOUNDATION</span>
              <strong>{capabilityCount}/{Object.keys(foundation.capabilities).length}</strong>
              <p>Build, Route, Truth-State-Anbindung, Responsive Shell und öffentliche Hashbeweise.</p>
            </article>
          </section>

          <section className="status-grid" id="status">
            <article className="panel">
              <p className="eyebrow">OPS1 · ANFÄNGER- UND BETRIEBSSCHICHT</p>
              <h2>Sicher starten, bevor produziert wird</h2>
              <ul className="check-list">
                <li><b>✓</b><span>fünf geführte Kapitel</span></li>
                <li><b>✓</b><span>Mauswege, erwartete Ergebnisse und Stop-Regeln</span></li>
                <li><b>✓</b><span>Handbuch, Video-Drehbuch und Readiness-Matrix</span></li>
                <li><b>✓</b><span>lokaler Lernfortschritt ohne Produktionsaktionen</span></li>
                <li><b>!</b><span>Anfänger-Abnahme und echte Master weiterhin offen</span></li>
              </ul>
              <a className="loop-link" href="#guided">Guided Mode öffnen</a>
            </article>
            <article className="panel warning" data-testid="not-restored">
              <p className="eyebrow">LR5 · AKTIVER ARBEITSBEREICH</p>
              <h2>Visual-, Set- und Voice-Locks</h2>
              <ul>
                <li>Ricco-Vertrag menschlich prüfen</li>
                <li>genau einen versionierten Ricco-Master-Kandidaten erlauben</li>
                <li>Ansichten, Ausdrücke und Wiederholbarkeit sichtbar reviewen</li>
                <li>danach Figuren, Orte und Stimmen einzeln bearbeiten</li>
                <li>jede Freigabe ausdrücklich menschlich dokumentieren</li>
              </ul>
              <p className="boundary">Character-Master 0/4, Location-Master 0/4, Stimmen 0/3. Keine automatische Freigabe, kein Massenrendern und keine fertige Episode.</p>
              <a className="loop-link" href="#lr5-ricco">LR5.1 Ricco-Vertrag öffnen</a>
            </article>
          </section>
        </main>
      )}

      <footer>
        <span>Repository: {truth.repository}</span>
        <span>Route: {foundation.route}{view === 'guided' ? '#guided' : view === 'loop' ? '#loop' : view === 'pilot' ? '#pilot-fire-test' : view === 'ricco' ? '#lr5-ricco' : ''}</span>
        <span>OPS1 erklärt und prüft Bedienung · kreative Freigaben bleiben menschlich und getrennt</span>
      </footer>
    </div>
  );
}
