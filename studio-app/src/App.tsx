import { useEffect, useMemo, useState } from 'react';
import { AcademyReadiness } from './AcademyReadiness';
import { ProductionAcademy, type ProductionAcademyContract } from './ProductionAcademy';
import { ProductionCockpit, type CastCanonContract, type ProductionCockpitContract } from './ProductionCockpit';
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
  const [castCanon, setCastCanon] = useState<CastCanonContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<StudioView>(currentView());

  useEffect(() => {
    Promise.all([
      loadJson<TruthState>('../project/truth-state.json'),
      loadJson<FoundationStatus>('../project/studio-foundation-status.json'),
      loadJson<LoopClosure>('../project/lr3-production-loop-closure.json'),
      loadJson<PilotClosure>('../project/lr4-selected-pilot-closure.json'),
      loadJson<ProductionAcademyContract>('../project/production-academy.json'),
      loadJson<ProductionCockpitContract>('../project/production-cockpit-v1.json'),
      loadJson<CastCanonContract>('../project/cast-canon-v1.json')
    ])
      .then(([truthData, foundationData, loopData, pilotData, academyData, cockpitData, castCanonData]) => {
        setTruth(truthData);
        setFoundation(foundationData);
        setLoopClosure(loopData);
        setPilotClosure(pilotData);
        setAcademy(academyData);
        setCockpit(cockpitData);
        setCastCanon(castCanonData);
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

  if (!truth || !foundation || !loopClosure || !pilotClosure || !academy || !cockpit || !castCanon) {
    return <main className="loading" aria-live="polite">Produktions-Cockpit lädt den belegten Projektstand …</main>;
  }

  const selectedTitle = truth.canon.selectedTitle || (truth.canon.selectedPilot === 'pilot-das-zimmer' ? 'Das Zimmer' : 'nicht gesetzt');
  const capabilityCount = Object.values(foundation.capabilities).filter(Boolean).length;
  const isCockpitView = cockpitViews.includes(view);
  const isExpertView = view === 'proof' || view === 'loop' || view === 'pilot';

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
        <a href="#lr5-ricco" aria-current={view === 'ricco' ? 'page' : undefined}>Aktiver Pilotcast Ricco</a>
        <a href="#proof" aria-current={isExpertView ? 'page' : undefined}>Expertenbereich</a>
        {isExpertView ? <><a href="#loop" aria-current={view === 'loop' ? 'page' : undefined}>LR3 Proof</a><a href="#pilot-fire-test" aria-current={view === 'pilot' ? 'page' : undefined}>LR4 Das Zimmer</a></> : null}
      </nav>
    </header>

    {isCockpitView ? <ProductionCockpit contract={cockpit} castCanon={castCanon} selectedTitle={selectedTitle} activeSection={view} />
      : view === 'loop' ? <ProductionLoop />
      : view === 'pilot' ? <SelectedPilotLoop />
      : view === 'ricco' ? <RiccoMasterReview />
      : view === 'academy' ? <><ProductionAcademy contract={academy} /><main className="shell"><AcademyReadiness /></main></>
      : <main className="shell" id="foundation" data-testid="expert-proof-area">
        <section className="hero">
          <div>
            <p className="eyebrow">EXPERTENBEREICH · CAST SCOPE SEPARATED · {activeGate?.id || 'LR5'} ISSUE #{activeGate?.trackingIssue || truth.trackingIssue}</p>
            <h1>Beweise, Recovery und technische Gegenprüfung.</h1>
            <p className="lead">Das Serienuniversum umfasst 13 dokumentierte Legacy- und Assetdatensätze. Der aktive Produktionscast für Das Zimmer bleibt Ricco, Basti Prenzl, Jule und Don Miau.</p>
            <p className="boundary">LR4 GESCHLOSSEN · LR4 PUBLICLY VERIFIED · SELECTED PILOT HASH MATCH</p>
            <p className="boundary">LR5 · LR5.1 Ricco · Visual-, Set- und Voice-Locks · Issue #{activeGate?.trackingIssue || truth.trackingIssue}</p>
            <p className="boundary">Character-Master 0/4 · Location-Master 0/4 · Stimmen 0/3 · Keine automatische Freigabe</p>
            <p className="boundary">2/10 READINESS CLOSED · Anfänger-Abnahme offen</p>
          </div>
          <div className="hero-state" data-testid="foundation-state"><span>13 SERIES UNIVERSE · 4 ACTIVE PILOT CAST · 9 LEGACY PRODUCTION SHEETS · 6 LEGACY LORA SHEETS</span><strong>0 APPROVED VISUAL MASTERS</strong><small>M1-Clip nur Technikbeweis · Referenzbilder unverified · keine automatische Freigabe</small></div>
        </section>

        <section className="cards" aria-label="Recovery-Wahrheitsstatus">
          <article><span>PILOT</span><strong data-testid="selected-pilot">{selectedTitle}</strong><p>Ausgewählt und transporttechnisch bewiesen. Der aktive Produktionscast besteht aus Ricco, Basti Prenzl, Jule und Don Miau.</p></article>
          <article><span>SERIENUNIVERSUM</span><strong data-testid="series-universe-count">{castCanon.counts.seriesUniverseCharacters} FIGUREN</strong><p>{castCanon.counts.productionSheetsAvailable} Legacy-Produktionssheets · {castCanon.counts.loraTrainingSheetsAvailable} Legacy-LoRA-Sheets · 0 Visual Masters.</p></article>
          <article><span>LR4 BEWEIS</span><strong>{pilotClosure.proof.stationsPassed}/9 · HASH MATCH</strong><p>Pages {pilotClosure.publicProof.pagesRun}<br /><code>{pilotClosure.implementedBy.mergeCommit.slice(0, 12)}</code></p></article>
          <article><span>FOUNDATION</span><strong>{capabilityCount}/{Object.keys(foundation.capabilities).length}</strong><p>Build, Route, Truth-State-Anbindung, Responsive Shell und öffentliche Hashbeweise.</p></article>
        </section>

        <section className="status-grid" id="status">
          <article className="panel"><p className="eyebrow">CAST SCOPE · VERBINDLICH</p><h2>13 Serienfiguren, vier aktive Pilotfiguren</h2><ul className="check-list"><li><b>✓</b><span>13 dokumentierte Serienuniversum- und Legacy-IDs</span></li><li><b>✓</b><span>Vier aktive Pilotcast-IDs für Das Zimmer</span></li><li><b>✓</b><span>9 Produktionssheets und 6 LoRA-Sheets als Legacybestand</span></li><li><b>!</b><span>Referenzbilder und Visual Masters weiterhin offen</span></li></ul><p className="boundary">Kein Scope ersetzt oder fusioniert den anderen automatisch.</p><a className="loop-link" href="#characters">Cast-Trennung öffnen</a></article>
          <article className="panel"><p className="eyebrow">AKTIVER PILOTCAST · DAS ZIMMER</p><h2>Ricco, Basti, Jule und Don Miau</h2><ul className="check-list"><li><b>✓</b><span>Ausgewählter Produktionscast bleibt erhalten</span></li><li><b>✓</b><span>Pilot- und Visual-Briefs bleiben prüfbar</span></li><li><b>!</b><span>Keine Character- oder Masterfreigabe</span></li></ul><p className="boundary">Der M1-Clip beweist nur die Pipeline.</p><a className="loop-link" href="#lr5-ricco">Ricco-Vertrag öffnen</a></article>
          <article className="panel warning" data-testid="not-restored"><p className="eyebrow">RECOVERY UND PROOF</p><h2>Technische Gegenprüfungen</h2><ul><li><a href="#loop">LR3 neutraler Produktionsloop</a></li><li><a href="#pilot-fire-test">LR4 Das-Zimmer-Fire-Test</a></li><li><a href="../">öffentliches Audit-Dashboard</a></li><li><a href="../project/production-readiness-v1.json">Readiness-Vertrag</a></li></ul><p className="boundary">Diese Ansichten beweisen Technik. Sie ersetzen weder kreative Arbeit noch menschliche Freigabe.</p></article>
        </section>
      </main>}

    <footer><span>Repository: {truth.repository}</span><span>Route: {foundation.route}{view === 'cockpit' ? '#cockpit' : view === 'loop' ? '#loop' : view === 'pilot' ? '#pilot-fire-test' : view === 'ricco' ? '#lr5-ricco' : view === 'academy' ? '#academy' : view === 'proof' ? '#proof' : `#${view}`}</span><span>13er-Serienuniversum dokumentiert · Vierer-Pilotcast aktiv · Growth OS getrennt</span></footer>
  </div>;
}
