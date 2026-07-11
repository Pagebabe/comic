import { useEffect, useMemo, useState } from 'react';
import { AcademyReadiness } from './AcademyReadiness';
import { ProductionAcademy, type ProductionAcademyContract } from './ProductionAcademy';
import { ProductionCockpit, type ProductionCockpitContract } from './ProductionCockpit';
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

type StudioView = 'cockpit' | 'academy' | 'ricco' | 'characters' | 'sets' | 'voices' | 'episode' | 'review' | 'export' | 'proof' | 'loop' | 'pilot';

const loadJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
};

function currentView(): StudioView {
  const hash = window.location.hash;
  if (hash === '#academy') return 'academy';
  if (hash === '#lr5-ricco') return 'ricco';
  if (hash === '#characters') return 'characters';
  if (hash === '#sets') return 'sets';
  if (hash === '#voices') return 'voices';
  if (hash === '#episode') return 'episode';
  if (hash === '#review') return 'review';
  if (hash === '#export') return 'export';
  if (hash === '#proof' || hash === '#foundation') return 'proof';
  if (hash === '#loop') return 'loop';
  if (hash === '#pilot-fire-test') return 'pilot';
  return 'cockpit';
}

const cockpitViews: StudioView[] = ['cockpit', 'characters', 'sets', 'voices', 'episode', 'review', 'export'];

export default function App() {
  const [truth, setTruth] = useState<TruthState | null>(null);
  const [foundation, setFoundation] = useState<FoundationStatus | null>(null);
  const [loopClosure, setLoopClosure] = useState<LoopClosure | null>(null);
  const [pilotClosure, setPilotClosure] = useState<PilotClosure | null>(null);
  const [academy, setAcademy] = useState<ProductionAcademyContract | null>(null);
  const [cockpit, setCockpit] = useState<ProductionCockpitContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<StudioView>(currentView());

  useEffect(() => {
    Promise.all([
      loadJson<TruthState>('../project/truth-state.json'),
      loadJson<FoundationStatus>('../project/studio-foundation-status.json'),
      loadJson<LoopClosure>('../project/lr3-production-loop-closure.json'),
      loadJson<PilotClosure>('../project/lr4-selected-pilot-closure.json'),
      loadJson<ProductionAcademyContract>('../project/production-academy.json'),
      loadJson<ProductionCockpitContract>('../project/production-cockpit-v1.json')
    ])
      .then(([truthData, foundationData, loopData, pilotData, academyData, cockpitData]) => {
        setTruth(truthData);
        setFoundation(foundationData);
        setLoopClosure(loopData);
        setPilotClosure(pilotData);
        setAcademy(academyData);
        setCockpit(cockpitData);
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
    return <main className="shell" data-testid="studio-foundation-error"><section className="hero error-card"><p className="eyebrow">STUDIO · LOAD BLOCKED</p><h1>Studio konnte seinen belegten Truth State nicht laden.</h1><p>{error}</p></section></main>;
  }

  if (!truth || !foundation || !loopClosure || !pilotClosure || !academy || !cockpit) {
    return <main className="loading" aria-live="polite">Produktions-Cockpit lädt den belegten Projektstand …</main>;
  }

  const selectedTitle = truth.canon.selectedTitle || (truth.canon.selectedPilot === 'pilot-das-zimmer' ? 'Das Zimmer' : 'nicht gesetzt');
  const capabilityCount = Object.values(foundation.capabilities).filter(Boolean).length;
  const isCockpitView = cockpitViews.includes(view);

  return <div className="app" data-testid="studio-foundation">
    <header className="topbar">
      <div><p className="eyebrow">COMIC FACTORY · DAILY PRODUCTION</p><strong>Produktions-Cockpit</strong></div>
      <nav aria-label="Studio-Navigation">
        <a href="#cockpit" aria-current={view === 'cockpit' ? 'page' : undefined}>Cockpit</a>
        <a href="#academy" aria-current={view === 'academy' ? 'page' : undefined}>Serie starten</a>
        <a href="#characters" aria-current={view === 'characters' || view === 'ricco' ? 'page' : undefined}>Figuren</a>
        <a href="#episode" aria-current={view === 'episode' ? 'page' : undefined}>Episode</a>
        <a href="#review" aria-current={view === 'review' ? 'page' : undefined}>Review</a>
        <a href="#export" aria-current={view === 'export' ? 'page' : undefined}>Export</a>
        <a href="#lr5-ricco" aria-current={view === 'ricco' ? 'page' : undefined}>Ricco</a>
        <a href="#proof" aria-current={view === 'proof' || view === 'loop' || view === 'pilot' ? 'page' : undefined}>Expertenbereich</a>
      </nav>
    </header>

    {isCockpitView ? <ProductionCockpit contract={cockpit} selectedTitle={selectedTitle} activeSection={view} />
      : view === 'loop' ? <ProductionLoop />
      : view === 'pilot' ? <SelectedPilotLoop />
      : view === 'ricco' ? <RiccoMasterReview />
      : view === 'academy' ? <><ProductionAcademy contract={academy} /><main className="shell"><AcademyReadiness /></main></>
      : <main className="shell" id="foundation" data-testid="expert-proof-area">
        <section className="hero">
          <div>
            <p className="eyebrow">EXPERTENBEREICH · LR4 GESCHLOSSEN · {activeGate?.id || 'LR5'} ISSUE #{activeGate?.trackingIssue || truth.trackingIssue}</p>
            <h1>Beweise, Recovery und technische Gegenprüfung.</h1>
            <p className="lead">Hier bleiben LR3, LR4, Hashes, Pages-Beweise und Foundation-Status vollständig erhalten. Der tägliche Produktionsweg beginnt dagegen im Cockpit.</p>
          </div>
          <div className="hero-state" data-testid="foundation-state"><span>LR4 PUBLICLY VERIFIED · SELECTED PILOT HASH MATCH · LR5.1 CONTRACT READY</span><strong>2/10 READINESS CLOSED</strong><small>Academy technisch bewiesen · Anfänger-Abnahme offen · Character 0/4 · Locations 0/4 · Voices 0/3 · Episoden 0</small></div>
        </section>

        <section className="cards" aria-label="Recovery-Wahrheitsstatus">
          <article><span>PILOT</span><strong data-testid="selected-pilot">{selectedTitle}</strong><p>Ausgewählt und transporttechnisch bewiesen. Detail-, Visual- und Voice-Gates bleiben offen.</p></article>
          <article><span>AKTIVES GATE</span><strong data-testid="active-gate">{activeGate?.id || 'unbekannt'}</strong><p>{activeGate?.title || 'Kein aktives Gate gefunden'} · Issue #{activeGate?.trackingIssue || truth.trackingIssue}</p></article>
          <article><span>LR4 BEWEIS</span><strong>{pilotClosure.proof.stationsPassed}/9 · HASH MATCH</strong><p>Pages {pilotClosure.publicProof.pagesRun}<br /><code>{pilotClosure.implementedBy.mergeCommit.slice(0, 12)}</code></p></article>
          <article><span>FOUNDATION</span><strong>{capabilityCount}/{Object.keys(foundation.capabilities).length}</strong><p>Build, Route, Truth-State-Anbindung, Responsive Shell und öffentliche Hashbeweise.</p></article>
        </section>

        <section className="status-grid" id="status">
          <article className="panel"><p className="eyebrow">LR5.1 · AKTIVER RICCO-VERTRAG</p><h2>Erst Vertrag prüfen, dann genau ein Kandidat</h2><ul className="check-list"><li><b>✓</b><span>7/7 Quellen und fünf Konflikte dokumentiert</span></li><li><b>✓</b><span>zehn Reviewtests und Kandidatenlimit 1</span></li><li><b>✓</b><span>Bildgenerierung, Batch und LoRA blockiert</span></li><li><b>✓</b><span>keine automatische Masterzuweisung</span></li></ul><p className="boundary">Der nächste kreative Schritt bleibt eine ausdrückliche menschliche Entscheidung.</p><a className="loop-link" href="#lr5-ricco">Ricco-Vertrag öffnen</a></article>
          <article className="panel"><p className="eyebrow">PRODUCTION ACADEMY · ISSUES #94 UND #95</p><h2>Geführter Lern- und Produktionspfad</h2><ul className="check-list"><li><b>✓</b><span>zwölf gesperrte Stufen</span></li><li><b>✓</b><span>Übungs- und Echtmodus mit Human Review</span></li><li><b>✓</b><span>Resume, Notizen und Fortschrittsexport</span></li><li><b>✓</b><span>Handbuch, Video-Drehbuch und 13 Vorlagen</span></li><li><b>!</b><span>beobachteter Nullwissen-Lauf und reale Episode offen</span></li></ul><p className="boundary">Academy technisch bewiesen. Anfänger-Abnahme und Produktionsreife bleiben offen.</p><a className="loop-link" href="#academy">Academy öffnen</a></article>
          <article className="panel warning" data-testid="not-restored"><p className="eyebrow">RECOVERY UND PROOF</p><h2>Technische Gegenprüfungen</h2><ul><li><a href="#loop">LR3 neutraler Produktionsloop</a></li><li><a href="#pilot-fire-test">LR4 Das-Zimmer-Fire-Test</a></li><li><a href="../">öffentliches Audit-Dashboard</a></li><li><a href="../project/production-readiness-v1.json">Readiness-Vertrag</a></li></ul><p className="boundary">Diese Ansichten beweisen Technik. Sie ersetzen weder kreative Arbeit noch menschliche Freigabe.</p></article>
        </section>
      </main>}

    <footer><span>Repository: {truth.repository}</span><span>Route: {foundation.route}{view === 'cockpit' ? '#cockpit' : view === 'loop' ? '#loop' : view === 'pilot' ? '#pilot-fire-test' : view === 'ricco' ? '#lr5-ricco' : view === 'academy' ? '#academy' : view === 'proof' ? '#proof' : `#${view}`}</span><span>Cockpit aktiv · kreative Master bleiben REVIEW_REQUIRED · Growth OS getrennt</span></footer>
  </div>;
}
