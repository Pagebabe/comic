import './production-cockpit.css';

export type ProductionCockpitContract = {
  schemaVersion: number;
  repository: string;
  trackingIssue: number;
  status: string;
  route: string;
  title: string;
  activeGate: {
    id: string;
    trackingIssue: number;
    title: string;
    status: string;
  };
  currentTask: {
    title: string;
    summary: string;
    primaryHref: string;
    primaryLabel: string;
  };
  nextAllowedStep: {
    decision: string;
    summary: string;
  };
  counts: {
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
  sections: Array<{
    id: string;
    title: string;
    status: string;
    summary: string;
    href: string;
    blocker: string;
  }>;
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
  selectedTitle: string;
  activeSection?: string;
};

const statusLabel = (status: string) => {
  if (status === 'ACTIVE_REVIEW_GATE') return 'AKTIV';
  if (status === 'READY_FOR_FUTURE_CANDIDATE') return 'VORBEREITET';
  if (status === 'PLANNED_REVIEW_REQUIRED') return 'GEPLANT';
  return 'GESPERRT';
};

export function ProductionCockpit({ contract, selectedTitle, activeSection = 'cockpit' }: Props) {
  const { counts, boundaries } = contract;
  const section = contract.sections.find((item) => item.id === activeSection);

  return <main className="shell cockpit-shell" data-testid="production-cockpit" data-active-section={activeSection}>
    <section className="cockpit-hero">
      <div className="cockpit-hero-copy">
        <p className="eyebrow">COMIC FACTORY · PRODUKTIONS-COCKPIT</p>
        <h1>Heute produzieren.<br />Nicht im Audit wohnen.</h1>
        <p className="lead">Der tägliche Arbeitsweg bündelt Serie, Figuren, Sets, Stimmen, Episode, Review und Export. Beweise bleiben erreichbar, dominieren aber nicht länger die Arbeit.</p>
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
        <strong>Ohne exakte Freigabe bleibt Kandidat 0/1.</strong>
        <small>Kein Bild, kein Batch, kein LoRA, kein automatischer Master.</small>
      </div>
    </section>

    <section className="cockpit-metrics" aria-label="Produktionsstand">
      <article><span>PILOT</span><strong>{selectedTitle}</strong><small>ausgewählt · Details Review Required</small></article>
      <article><span>FIGUREN</span><strong>{counts.characterMastersApproved}/{counts.characterMastersRequired}</strong><small>Ricco aktiv · drei weitere gesperrt</small></article>
      <article><span>SETS</span><strong>{counts.locationMastersApproved}/{counts.locationMastersRequired}</strong><small>wartet auf ersten Character-Master</small></article>
      <article><span>STIMMEN</span><strong>{counts.voiceMastersApproved}/{counts.voiceMastersRequired}</strong><small>Hörtest und Versionierung offen</small></article>
      <article><span>EPISODEN</span><strong>{counts.reviewedEpisodes}</strong><small>keine vollständig geprüfte Folge</small></article>
    </section>

    {section && activeSection !== 'cockpit' ? <section className="cockpit-focus" data-testid="cockpit-focused-section">
      <div>
        <p className="eyebrow">ARBEITSBEREICH · {section.title.toUpperCase()}</p>
        <h2>{section.summary}</h2>
        <p>{section.blocker}</p>
      </div>
      <span data-status={section.status}>{statusLabel(section.status)}</span>
    </section> : null}

    <section className="cockpit-layout">
      <div className="cockpit-main-column">
        <section className="cockpit-panel today-panel">
          <div className="section-title-row"><div><p className="eyebrow">HEUTE</p><h2>Eine Linie. Drei Schritte.</h2></div><span className="issue-pill">Issue #117</span></div>
          <ol className="today-list">
            <li><span>01</span><div><strong>Ricco-Vertrag öffnen</strong><p>Sieben Quellen, fünf Konflikte, Ansichten, Expressions und zehn Tests sichtbar prüfen.</p></div><a href="#lr5-ricco">Öffnen</a></li>
            <li><span>02</span><div><strong>Entscheidung bewusst treffen</strong><p>Nur die exakte Freigabe öffnet genau einen Kandidatenslot.</p></div><em>HUMAN GATE</em></li>
            <li><span>03</span><div><strong>Kandidatenlauf später prüfen</strong><p>Ein späterer Kandidat bleibt Review Required, bis du ihn sichtbar bewertest.</p></div><em>BLOCKED</em></li>
          </ol>
        </section>

        <section className="workspace-grid" aria-label="Produktionsbereiche" data-testid="cockpit-workspaces">
          {contract.sections.map((item) => <article key={item.id} id={item.id} data-status={item.status} className={activeSection === item.id ? 'active' : undefined}>
            <div className="workspace-head"><span>{statusLabel(item.status)}</span><small>{item.id.toUpperCase()}</small></div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <div className="workspace-blocker"><strong>Blocker</strong><span>{item.blocker}</span></div>
            <a href={item.href}>{item.status === 'ACTIVE_REVIEW_GATE' ? 'Arbeitsbereich öffnen' : 'Status ansehen'}</a>
          </article>)}
        </section>
      </div>

      <aside className="cockpit-side-column">
        <section className="cockpit-panel quick-panel">
          <p className="eyebrow">SCHNELLSTART</p>
          <h2>Direkt zur Arbeit</h2>
          <nav aria-label="Cockpit-Schnellstart">
            {contract.quickLinks.map((item) => <a key={item.id} href={item.href}><strong>{item.label}</strong><span>→</span></a>)}
          </nav>
        </section>

        <section className="cockpit-panel boundary-panel" data-testid="cockpit-boundaries">
          <p className="eyebrow">SICHERHEITSGRENZEN</p>
          <h2>Bleibt gesperrt</h2>
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
          <p className="eyebrow">EXPERTENBEREICH</p>
          <h2>Beweise und Recovery</h2>
          <p>LR3, LR4, Hashes, Readiness und öffentlicher Deploy bleiben vollständig erreichbar, aber außerhalb des täglichen Primärwegs.</p>
          <div className="expert-links"><a href="#foundation">Systemstatus</a><a href="#loop">LR3 Proof Loop</a><a href="#pilot-fire-test">LR4 Das Zimmer</a><a href="../">Öffentliches Audit</a></div>
        </section>
      </aside>
    </section>
  </main>;
}
