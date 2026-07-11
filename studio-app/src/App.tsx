import { useEffect, useMemo, useState } from 'react';
import { AcademyReadiness } from './AcademyReadiness';
import { ProductionAcademy, type ProductionAcademyContract } from './ProductionAcademy';
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
  if (window.location.hash === '#loop') return 'loop';
  if (window.location.hash === '#pilot-fire-test') return 'pilot';
  if (window.location.hash === '#lr5-ricco') return 'ricco';
  if (window.location.hash === '#academy') return 'academy';
  return 'foundation';
}

export default function App() {
  const [truth, setTruth] = useState<TruthState | null>(null);
  const [foundation, setFoundation] = useState<FoundationStatus | null>(null);
  const [loopClosure, setLoopClosure] = useState<LoopClosure | null>(null);
  const [pilotClosure, setPilotClosure] = useState<PilotClosure | null>(null);
  const [academy, setAcademy] = useState<ProductionAcademyContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState(currentView());

  useEffect(() => {
    Promise.all([
      loadJson<TruthState>('../project/truth-state.json'),
      loadJson<FoundationStatus>('../project/studio-foundation-status.json'),
      loadJson<LoopClosure>('../project/lr3-production-loop-closure.json'),
      loadJson<PilotClosure>('../project/lr4-selected-pilot-closure.json'),
      loadJson<ProductionAcademyContract>('../project/production-academy.json')
    ])
      .then(([truthData, foundationData, loopData, pilotData, academyData]) => {
        setTruth(truthData);
        setFoundation(foundationData);
        setLoopClosure(loopData);
        setPilotClosure(pilotData);
        setAcademy(academyData);
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

  if (!truth || !foundation || !loopClosure || !pilotClosure || !academy) {
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
          <a href="#academy" aria-current={view === 'academy' ? 'page' : undefined}>Serie starten</a>
          <a href="#loop" aria-current={view === 'loop' ? 'page' : undefined}>LR3 Proof Loop</a>
          <a href="#pilot-fire-test" aria-current={view === 'pilot' ? 'page' : undefined}>LR4 Das Zimmer</a>
          <a href="#lr5-ricco" aria-current={view === 'ricco' ? 'page' : undefined}>LR5.1 Ricco</a>
          <a href="../">Audit-Dashboard</a>
        </nav>
      </header>

      {view === 'loop' ? (
        <ProductionLoop />
      ) : view === 'pilot' ? (
        <SelectedPilotLoop />
      ) : view === 'ricco' ? (
        <RiccoMasterReview />
      ) : view === 'academy' ? (
        <>
          <ProductionAcademy contract={academy} />
          <main className="shell"><AcademyReadiness /></main>
        </>
      ) : (
        <main className="shell" id="foundation">
          <section className="hero">
            <div>
              <p className="eyebrow">LR4 GESCHLOSSEN · {activeGate?.id || 'LR5'} ISSUE #{activeGate?.trackingIssue || truth.trackingIssue}</p>
              <h1>Das Zimmer transportiert. Jetzt echte Master einzeln prüfen.</h1>
              <p className="lead">Der Ricco-Vertrag ist der aktive kreative Arbeitsblock. Die Production Academy führt durch zwölf kontrollierte Stufen und zeigt darunter zehn messbare Readiness-Gates. Sie dokumentiert Arbeit, öffnet aber weder Bildgenerierung noch kreative Freigaben.</p>
            </div>
            <div className="hero-state" data-testid="foundation-state">
              <span>LR4 PUBLICLY VERIFIED · LR5.1 CONTRACT READY</span>
              <strong>2/10 READINESS CLOSED</strong>
              <small>Academy technisch bewiesen · Anfänger-Abnahme offen · Character 0/4 · Locations 0/4 · Voices 0/3 · Episoden 0</small>
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
              <p className="eyebrow">LR5.1 · AKTIVER RICCO-VERTRAG</p>
              <h2>Erst Vertrag prüfen, dann genau ein Kandidat</h2>
              <ul className="check-list">
                <li><b>✓</b><span>7/7 Quellen inventarisiert und fünf Konflikte dokumentiert</span></li>
                <li><b>✓</b><span>zehn sichtbare Reviewtests und ein Kandidatenlimit von 1</span></li>
                <li><b>✓</b><span>Bildgenerierung, Batch und LoRA bleiben vor Freigabe blockiert</span></li>
                <li><b>✓</b><span>kein Bildbyte und keine automatische Masterzuweisung</span></li>
              </ul>
              <p className="boundary">Die Academy ändert diesen Vertrag nicht. Der nächste kreative Schritt bleibt eine ausdrückliche menschliche Vertragsentscheidung.</p>
              <a className="loop-link" href="#lr5-ricco">Ricco-Vertrag öffnen</a>
            </article>

            <article className="panel">
              <p className="eyebrow">PRODUCTION ACADEMY · ISSUES #94 UND #95</p>
              <h2>Morgen ohne Vorwissen strukturiert anfangen</h2>
              <ul className="check-list">
                <li><b>✓</b><span>zwölf gesperrte Stufen von Serienidee bis Production Handoff</span></li>
                <li><b>✓</b><span>Übungsmodus und Echtmodus mit Human Review</span></li>
                <li><b>✓</b><span>lokaler Resume-Status, Notizen und Fortschrittsexport</span></li>
                <li><b>✓</b><span>Rollen, Tagesplan, Handbuch, Video-Drehbuch und 13 Vorlagen</span></li>
                <li><b>!</b><span>beobachteter Nullwissen-Lauf und reale Episode noch offen</span></li>
              </ul>
              <p className="boundary">Academy technisch bewiesen. Beginner Ready und Production Ready bleiben ausdrücklich falsch, bis die fehlenden Readiness-Gates geschlossen sind.</p>
              <a className="loop-link" href="#academy">Serie starten und Readiness prüfen</a>
            </article>

            <article className="panel warning" data-testid="not-restored">
              <p className="eyebrow">LR5 · OFFENE PRODUKTIONSWAHRHEIT</p>
              <h2>Visual-, Set- und Voice-Locks</h2>
              <ul>
                <li>Ricco-Vertrag menschlich prüfen</li>
                <li>danach exakt einen versionierten Kandidaten erzeugen</li>
                <li>Ansichten, Ausdrücke und Wiederholbarkeit sichtbar reviewen</li>
                <li>erst danach weitere Figuren, Orte und Stimmen bearbeiten</li>
                <li>jede Freigabe auf exakt eine Version und einen Hash beziehen</li>
              </ul>
              <p className="boundary">Character-Master 0/4, Location-Master 0/4, Stimmen 0/3, fertige Episoden 0. Keine automatische Freigabe und kein Massenrendern.</p>
            </article>
          </section>
        </main>
      )}

      <footer>
        <span>Repository: {truth.repository}</span>
        <span>Route: {foundation.route}{view === 'loop' ? '#loop' : view === 'pilot' ? '#pilot-fire-test' : view === 'ricco' ? '#lr5-ricco' : view === 'academy' ? '#academy' : ''}</span>
        <span>Academy technisch bewiesen · Anfänger-Abnahme offen · kreative Master bleiben REVIEW_REQUIRED</span>
      </footer>
    </div>
  );
}
