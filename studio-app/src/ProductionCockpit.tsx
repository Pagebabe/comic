import './production-cockpit.css';

export type CastCanonContract = {
  schemaVersion: number;
  canonId: string;
  repository: string;
  status: string;
  selectedPilot: { id: string; title: string; status: string };
  counts: {
    seriesUniverseCharacters: number;
    activePilotCastCharacters: number;
    legacyAssetInventoryCharacters: number;
    productionSheetsAvailable: number;
    productionSheetsMissing: number;
    loraTrainingSheetsAvailable: number;
    loraTrainingSheetsMissing: number;
    verifiedReferenceImages: number;
    approvedVisualMasters: number;
    trustedVisualMasters: number;
  };
  seriesUniverse: Array<{
    id: string;
    name: string;
    status: string;
    productionSheet: { status: 'present' | 'missing'; source: string | null; recordId: string | null };
    loraTrainingSheet: { status: 'present' | 'missing'; source: string | null; recordId: string | null };
    referenceImages: { status: 'unverified'; refs: string[] };
    visualMaster: { status: 'not_approved' };
  }>;
  activePilotCast: Array<{
    id: string;
    name: string;
    status: string;
    pilotId: string;
    pilotTitle: string;
    seriesUniverseReference: { status: string; referencedCharacterIds: string[] };
    characterMaster: { status: 'not_approved' };
    referenceImages: { status: 'unverified'; refs: string[] };
  }>;
  legacyAssetInventory: {
    status: string;
    characterCount: number;
    characterIds: string[];
    productionSheetCharacterIds: string[];
    loraTrainingSheetCharacterIds: string[];
    referenceImageStatus: string;
    verifiedReferenceImageCount: number;
  };
  approvedVisualMasters: Array<unknown>;
  technicalProofs: Array<{ id: string; status: string; characterLockGranted: boolean; visualMasterGranted: boolean }>;
};

export type ProductionCockpitContract = {
  schemaVersion: number;
  repository: string;
  trackingIssue: number;
  status: string;
  route: string;
  title: string;
  activeGate: { id: string; trackingIssue: number; title: string; status: string };
  currentTask: { title: string; summary: string; primaryHref: string; primaryLabel: string };
  nextAllowedStep: { decision: string; summary: string };
  counts: {
    seriesUniverseCharacters: number;
    activePilotCastCharacters: number;
    legacyAssetInventoryCharacters: number;
    productionSheetsAvailable: number;
    productionSheetsMissing: number;
    loraTrainingSheetsAvailable: number;
    loraTrainingSheetsMissing: number;
    verifiedReferenceImages: number;
    approvedVisualMasters: number;
    characterMastersApproved: number;
    characterMastersRequired: number;
    locationMastersApproved: number;
    locationMastersRequired: number;
    voiceMastersApproved: number;
    voiceMastersRequired: number;
    riccoCandidates: number;
    riccoCandidateLimit: number;
    reviewedEpisodes: number;
  };
  sections: Array<{ id: string; title: string; status: string; summary: string; href: string; blocker: string }>;
  quickLinks: Array<{ id: string; label: string; href: string }>;
  boundaries: {
    imageGenerationAllowed: boolean;
    providerExecutionAllowed: boolean;
    batchAllowed: boolean;
    loraTrainingAllowed: boolean;
    automaticMasterApprovalAllowed: boolean;
    growthOsIntegrated: boolean;
    livePublishingAllowed: boolean;
    productionReady: boolean;
    beginnerReady: boolean;
  };
};

type Props = {
  contract: ProductionCockpitContract;
  castCanon: CastCanonContract;
  selectedTitle: string;
  activeSection?: string;
};

const statusLabel = (status: string) => {
  if (status === 'ACTIVE_REVIEW_GATE') return 'AKTIV';
  if (status === 'READY_FOR_FUTURE_CANDIDATE') return 'VORBEREITET';
  if (status === 'PLANNED_REVIEW_REQUIRED') return 'GEPLANT';
  return 'GESPERRT';
};

const assetStatus = (status: string) => status === 'present' ? 'vorhanden' : 'fehlend';

export function ProductionCockpit({ contract, castCanon, selectedTitle, activeSection = 'cockpit' }: Props) {
  const { counts, boundaries } = contract;
  const section = contract.sections.find((item) => item.id === activeSection);

  return <main className="shell cockpit-shell" data-testid="production-cockpit" data-active-section={activeSection}>
    <section className="cockpit-hero">
      <div className="cockpit-hero-copy">
        <p className="eyebrow">COMIC FACTORY · PRODUKTIONS-COCKPIT</p>
        <h1>Wahrheiten trennen.<br />Dann produzieren.</h1>
        <p className="lead">Der 13er-Bestand ist das dokumentierte Serienuniversum und Legacy-Assetinventar. Ricco, Basti Prenzl, Jule und Don Miau bleiben der aktive Produktionscast für den ausgewählten Pilot Das Zimmer.</p>
        <div className="cockpit-actions" aria-label="Schnellzugriffe">
          <a className="primary-action" href={contract.currentTask.primaryHref}>{contract.currentTask.primaryLabel}</a>
          <a className="secondary-action" href="#academy">Geführt starten</a>
        </div>
      </div>
      <aside className="cockpit-now" data-testid="cockpit-current-task">
        <span>AKTUELLE AUFGABE</span>
        <strong>{contract.currentTask.title}</strong>
        <p>{contract.currentTask.summary}</p>
        <small>{contract.activeGate.id} · Issue #{contract.activeGate.trackingIssue} · {contract.activeGate.status}</small>
      </aside>
    </section>

    <section className="cockpit-next" data-testid="cockpit-next-step">
      <div>
        <p className="eyebrow">NÄCHSTER ERLAUBTER SCHRITT</p>
        <h2>{contract.nextAllowedStep.decision}</h2>
        <p>{contract.nextAllowedStep.summary}</p>
      </div>
      <div className="stop-rule">
        <span>STOP-REGEL</span>
        <strong>Dokumentieren, referenzieren, nichts automatisch freigeben.</strong>
        <small>Kein Character-, Visual-, Location- oder Voice-Master ohne ausdrückliche menschliche Entscheidung.</small>
      </div>
    </section>

    <section className="cockpit-metrics" aria-label="Produktionsstand" data-testid="canon-stock-counts">
      <article><span>SERIENUNIVERSUM</span><strong>{counts.seriesUniverseCharacters}</strong><small>dokumentierte Figuren</small></article>
      <article><span>AKTIVER PILOTCAST</span><strong>{counts.activePilotCastCharacters}</strong><small>{selectedTitle}</small></article>
      <article><span>LEGACY PRODUKTIONSSHEETS</span><strong>{counts.productionSheetsAvailable}/{counts.legacyAssetInventoryCharacters}</strong><small>{counts.productionSheetsMissing} fehlen</small></article>
      <article><span>LEGACY LORA-SHEETS</span><strong>{counts.loraTrainingSheetsAvailable}/{counts.legacyAssetInventoryCharacters}</strong><small>{counts.loraTrainingSheetsMissing} fehlen</small></article>
      <article><span>VISUAL MASTER</span><strong>{counts.characterMastersApproved}/{counts.characterMastersRequired}</strong><small>automatisch freigegeben: 0</small></article>
      <article><span>REFERENZBILDER</span><strong>{counts.verifiedReferenceImages}</strong><small>geprüft und belegt</small></article>
    </section>

    {section && activeSection !== 'cockpit' ? <section className="cockpit-focus" data-testid="cockpit-focused-section">
      <div><p className="eyebrow">ARBEITSBEREICH · {section.title.toUpperCase()}</p><h2>{section.summary}</h2><p>{section.blocker}</p></div>
      <span data-status={section.status}>{statusLabel(section.status)}</span>
    </section> : null}

    <section className="cockpit-panel cast-panel" data-testid="active-pilot-cast-inventory">
      <div className="section-title-row">
        <div><p className="eyebrow">AKTIVER PILOTCAST · {castCanon.selectedPilot.title}</p><h2>Vier Figuren in Produktion</h2></div>
        <span className="issue-pill">0/4 Character-Master</span>
      </div>
      <div className="cast-grid">
        {castCanon.activePilotCast.map((character) => <article key={character.id} data-testid={`pilot-cast-${character.id}`}>
          <div className="cast-card-head"><strong>{character.name}</strong><code>{character.id}</code></div>
          <span className="canon-badge">AKTIVER PILOTCAST</span>
          <dl>
            <div><dt>Pilot</dt><dd>{character.pilotTitle}</dd></div>
            <div><dt>Canon-Referenz</dt><dd>{character.seriesUniverseReference.status}</dd></div>
            <div><dt>Character-Master</dt><dd data-status={character.characterMaster.status}>{character.characterMaster.status}</dd></div>
            <div><dt>Referenzbilder</dt><dd data-status={character.referenceImages.status}>{character.referenceImages.status}</dd></div>
          </dl>
        </article>)}
      </div>
    </section>

    <section className="cockpit-panel cast-panel" data-testid="series-universe-inventory">
      <div className="section-title-row">
        <div><p className="eyebrow">SERIENUNIVERSUM</p><h2>13 dokumentierte Figuren</h2></div>
        <span className="issue-pill">Legacy- und Assetbestand</span>
      </div>
      <div className="cast-grid">
        {castCanon.seriesUniverse.map((character) => <article key={character.id} data-testid={`series-${character.id}`}>
          <div className="cast-card-head"><strong>{character.name}</strong><code>{character.id}</code></div>
          <span className="canon-badge">SERIENUNIVERSUM</span>
          <dl>
            <div><dt>Produktionssheet</dt><dd data-status={character.productionSheet.status}>{assetStatus(character.productionSheet.status)}</dd></div>
            <div><dt>LoRA-Sheet</dt><dd data-status={character.loraTrainingSheet.status}>{assetStatus(character.loraTrainingSheet.status)}</dd></div>
            <div><dt>Referenzbilder</dt><dd data-status={character.referenceImages.status}>{character.referenceImages.status}</dd></div>
            <div><dt>Visual-Master</dt><dd data-status={character.visualMaster.status}>{character.visualMaster.status}</dd></div>
          </dl>
        </article>)}
      </div>
      <div className="variant-strip" data-testid="legacy-asset-inventory">
        <div><strong>LEGACY- UND ASSETBESTAND</strong><span>13 Datensätze bleiben erhalten, aber werden nicht als aktiver Pilotcast ausgegeben.</span></div>
        <ul>
          <li><span>Produktionssheets</span><code>{counts.productionSheetsAvailable}/13</code></li>
          <li><span>LoRA-Sheets</span><code>{counts.loraTrainingSheetsAvailable}/13</code></li>
          <li><span>Geprüfte Referenzbilder</span><code>0</code></li>
          <li><span>Approved Visual Masters</span><code>{castCanon.approvedVisualMasters.length}</code></li>
        </ul>
      </div>
    </section>

    <section className="cockpit-layout">
      <div className="cockpit-main-column">
        <section className="cockpit-panel today-panel">
          <div className="section-title-row"><div><p className="eyebrow">HEUTE</p><h2>Eine Linie. Drei Prüfungen.</h2></div><span className="issue-pill">LR5.1</span></div>
          <ol className="today-list">
            <li><span>01</span><div><strong>Aktiven Pilotcast prüfen</strong><p>Ricco, Basti Prenzl, Jule und Don Miau bleiben an Das Zimmer gebunden.</p></div><a href="#characters">Öffnen</a></li>
            <li><span>02</span><div><strong>Legacybestand getrennt halten</strong><p>13 Figuren, neun Produktionssheets und sechs LoRA-Sheets bleiben dokumentiert, ohne den Pilotcast zu ersetzen.</p></div><em>REVIEW</em></li>
            <li><span>03</span><div><strong>Nullzustände schützen</strong><p>Character-, Visual-, Location- und Voice-Master bleiben bei null, bis Menschen tatsächlich entscheiden.</p></div><a href="#lr5-ricco">Ansehen</a></li>
          </ol>
        </section>

        <section className="workspace-grid" aria-label="Produktionsbereiche" data-testid="cockpit-workspaces">
          {contract.sections.map((item) => <article key={item.id} id={item.id} data-status={item.status} className={activeSection === item.id ? 'active' : undefined}>
            <div className="workspace-head"><span>{statusLabel(item.status)}</span><small>{item.id.toUpperCase()}</small></div>
            <h3>{item.title}</h3><p>{item.summary}</p>
            <div className="workspace-blocker"><strong>Blocker</strong><span>{item.blocker}</span></div>
            <a href={item.href}>{item.status === 'ACTIVE_REVIEW_GATE' ? 'Arbeitsbereich öffnen' : 'Status ansehen'}</a>
          </article>)}
        </section>
      </div>

      <aside className="cockpit-side-column">
        <section className="cockpit-panel quick-panel">
          <p className="eyebrow">SCHNELLSTART</p><h2>Direkt zur Arbeit</h2>
          <nav aria-label="Cockpit-Schnellstart">{contract.quickLinks.map((item) => <a key={item.id} href={item.href}><strong>{item.label}</strong><span>→</span></a>)}</nav>
        </section>

        <section className="cockpit-panel boundary-panel" data-testid="cockpit-boundaries">
          <p className="eyebrow">SICHERHEITSGRENZEN</p><h2>Bleibt gesperrt</h2>
          <ul>
            <li><span>Bildgenerierung</span><strong>{boundaries.imageGenerationAllowed ? 'AN' : 'AUS'}</strong></li>
            <li><span>Provider-Ausführung</span><strong>{boundaries.providerExecutionAllowed ? 'AN' : 'AUS'}</strong></li>
            <li><span>Batch / LoRA</span><strong>{boundaries.batchAllowed || boundaries.loraTrainingAllowed ? 'AN' : 'AUS'}</strong></li>
            <li><span>Auto-Master</span><strong>{boundaries.automaticMasterApprovalAllowed ? 'AN' : 'AUS'}</strong></li>
            <li><span>Growth OS</span><strong>{boundaries.growthOsIntegrated ? 'INTEGRIERT' : 'GETRENNT'}</strong></li>
            <li><span>Live Publishing</span><strong>{boundaries.livePublishingAllowed ? 'AN' : 'AUS'}</strong></li>
          </ul>
        </section>

        <section className="cockpit-panel expert-panel" id="proof">
          <p className="eyebrow">EXPERTENBEREICH</p><h2>Beweise und Recovery</h2>
          <p>LR3, LR4, Hashes, Readiness und öffentlicher Deploy bleiben erreichbar, aber außerhalb des täglichen Primärwegs.</p>
          <div className="expert-proof-summary" data-testid="cockpit-foundation-summary">
            <strong>Production Studio · FOUNDATION</strong>
            <span>LR4 GESCHLOSSEN · LR4 PUBLICLY VERIFIED · SELECTED PILOT HASH MATCH</span>
            <span>LR5 aktiv · Issue #82 · LR5.1 Issue #88</span>
            <span>Character-Master 0/4 · Location-Master 0/4 · Stimmen 0/3</span>
            <span>Keine automatische Freigabe</span>
            <strong>CAST SCOPE · SEPARATED</strong>
            <span>Serienuniversum {counts.seriesUniverseCharacters} · aktiver Pilotcast {counts.activePilotCastCharacters}</span>
            <span>Legacy Produktionssheets {counts.productionSheetsAvailable} · LoRA-Sheets {counts.loraTrainingSheetsAvailable}</span>
            <span>Approved Visual Masters {counts.approvedVisualMasters} · geprüfte Referenzbilder {counts.verifiedReferenceImages}</span>
            <span>M1-Life-Sign ist nur Technikbeweis</span>
          </div>
          <div className="expert-links"><a href="#foundation">Systemstatus</a><a href="#loop">LR3 Proof Loop</a><a href="#pilot-fire-test">LR4 Das Zimmer</a><a href="../">Öffentliches Audit</a></div>
        </section>
      </aside>
    </section>
  </main>;
}
