import { useEffect, useState } from 'react';
import './academy-readiness.css';

type ReadinessGate = {
  id: string;
  title: string;
  status: 'CLOSED_VERIFIED' | 'PARTIAL' | 'OPEN';
  existingProof: string[];
  missingProof: string[];
};

type Readiness = {
  status: string;
  currentScore: {
    closedVerified: number;
    partial: number;
    open: number;
    total: number;
    display: string;
  };
  academyBoundary: {
    academyStatus: string;
    productionReady: boolean;
    beginnerReady: boolean;
    creativeApprovalGranted: boolean;
    imageGenerationAllowed: boolean;
    growthOsIntegrated: boolean;
  };
  parallelLineBoundary: {
    growthOsStatus: string;
    liveReady: boolean;
    mainIntegrationAllowed: boolean;
    sharedIntegrationSmokePassed: boolean;
  };
  gates: ReadinessGate[];
};

type AcceptanceTemplate = {
  status: string;
  requiredScore: number;
  humanObservationRequired: boolean;
  tasks: Array<{ id: string; prompt: string }>;
  result: { decision: string };
  closureRule: string;
};

const loadJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
};

export function AcademyReadiness() {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [acceptance, setAcceptance] = useState<AcceptanceTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      loadJson<Readiness>('../project/production-readiness-v1.json'),
      loadJson<AcceptanceTemplate>('../project/novice-acceptance-template.json')
    ])
      .then(([readinessData, acceptanceData]) => {
        setReadiness(readinessData);
        setAcceptance(acceptanceData);
      })
      .catch((loadError) => setError(String(loadError)));
  }, []);

  if (error) {
    return <section className="panel warning academy-readiness-error" data-testid="academy-readiness-error">Readiness-Vertrag konnte nicht geladen werden: {error}</section>;
  }

  if (!readiness || !acceptance) {
    return <section className="panel academy-readiness-loading">Readiness und Anfänger-Abnahme werden geladen …</section>;
  }

  return (
    <section className="academy-readiness" data-testid="academy-readiness">
      <div className="academy-readiness-head panel">
        <div>
          <p className="eyebrow">OPS1 · PRODUCTION-READINESS · ISSUE #95</p>
          <h2>Geführt und technisch bewiesen. Noch nicht produktionsreif.</h2>
          <p>Die Academy macht den Prozess bedienbar. Produktionsreife verlangt zusätzlich reale Master, eine vollständig geprüfte Episode und einen beobachteten Nullwissen-Lauf.</p>
        </div>
        <div className="academy-readiness-score" data-testid="academy-readiness-score">
          <span>{readiness.status}</span>
          <strong>{readiness.currentScore.display}</strong>
          <small>10/10 erst bei zehnmal CLOSED_VERIFIED</small>
        </div>
      </div>

      <div className="academy-boundary-cards" aria-label="Readiness-Grenzen">
        <article><span>PRODUCTION READY</span><strong>{readiness.academyBoundary.productionReady ? 'JA' : 'NEIN'}</strong></article>
        <article><span>BEGINNER READY</span><strong>{readiness.academyBoundary.beginnerReady ? 'JA' : 'NOCH NICHT'}</strong></article>
        <article><span>BILDGENERIERUNG</span><strong>{readiness.academyBoundary.imageGenerationAllowed ? 'ERLAUBT' : 'GESPERRT'}</strong></article>
        <article><span>CREATIVE APPROVAL</span><strong>{readiness.academyBoundary.creativeApprovalGranted ? 'ERTEILT' : 'NEIN'}</strong></article>
        <article><span>GROWTH OS</span><strong>{readiness.academyBoundary.growthOsIntegrated ? 'INTEGRIERT' : 'GETRENNT'}</strong></article>
      </div>

      <div className="academy-readiness-grid" data-testid="academy-readiness-gates">
        {readiness.gates.map((gate) => (
          <article key={gate.id} data-status={gate.status}>
            <header>
              <span>{gate.id}</span>
              <strong>{gate.title}</strong>
              <em>{gate.status}</em>
            </header>
            <p><b>Belegt:</b> {gate.existingProof.length ? gate.existingProof.join(' · ') : 'noch kein Abschlussbeweis'}</p>
            <p><b>Fehlt:</b> {gate.missingProof.length ? gate.missingProof.join(' · ') : 'nichts'}</p>
          </article>
        ))}
      </div>

      <div className="academy-acceptance panel" data-testid="academy-novice-acceptance">
        <div>
          <p className="eyebrow">NULLWISSEN-ABNAHME · {acceptance.status}</p>
          <h2>{acceptance.tasks.length} Aufgaben · {acceptance.requiredScore}/{acceptance.requiredScore} erforderlich</h2>
          <p>Die Testperson muss den Ablauf ohne undokumentierte Hilfe durchführen. Eine echte beobachtende Person ist Pflicht: <strong>{acceptance.humanObservationRequired ? 'ja' : 'nein'}</strong>.</p>
        </div>
        <ol>{acceptance.tasks.map((task) => <li key={task.id}><b>{task.id}</b> {task.prompt}</li>)}</ol>
        <p className="boundary">{acceptance.closureRule}</p>
        <div className="academy-readiness-links">
          <a href="../docs/NOVICE_ACCEPTANCE_PROTOCOL.md">Abnahmeprotokoll öffnen</a>
          <a href="../project/novice-acceptance-template.json">Record-Vorlage öffnen</a>
          <a href="../project/production-readiness-v1.json">10-Gate-Matrix öffnen</a>
        </div>
      </div>

      <div className="panel academy-growth-boundary" data-testid="academy-growth-boundary">
        <p className="eyebrow">PARALLELE MARKETING-LINIE</p>
        <h2>Growth OS bleibt isoliert.</h2>
        <p>Status: <strong>{readiness.parallelLineBoundary.growthOsStatus}</strong> · Live Ready: <strong>{readiness.parallelLineBoundary.liveReady ? 'ja' : 'nein'}</strong> · gemeinsamer Integrations-Smoke: <strong>{readiness.parallelLineBoundary.sharedIntegrationSmokePassed ? 'bestanden' : 'offen'}</strong> · Integration in main: <strong>{readiness.parallelLineBoundary.mainIntegrationAllowed ? 'erlaubt' : 'gesperrt'}</strong>.</p>
      </div>
    </section>
  );
}
