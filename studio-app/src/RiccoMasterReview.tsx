import { useEffect, useMemo, useState } from 'react';

type SourceInventory = {
  status: string;
  trackingIssue: number;
  parentTrackingIssue: number;
  subject: {
    id: string;
    canonicalName: string;
    currentAge: number;
    visualMasterReference: null;
    reviewStatus: string;
  };
  sources: Array<{
    path: string;
    blob: string;
    role: string;
    authority: string;
    usableForVisualContract: boolean | string;
    creativeApproval: boolean;
  }>;
  resolvedConflicts: Array<{
    field: string;
    historicalValue: string | number;
    currentValue: string | number;
    resolution: string;
  }>;
  candidateBoundary: {
    maximumCandidateSheets: number;
    currentCandidateSheets: number;
    imageBytesPresent: boolean;
    externalGeneratorExecutionUsed: boolean;
    masterApproved: boolean;
    automaticApprovalAllowed: boolean;
    loraTrainingAllowed: boolean;
    batchExpansionAllowed: boolean;
  };
};

type MasterContract = {
  contractId: string;
  status: string;
  trackingIssue: number;
  subject: {
    id: string;
    name: string;
    age: number;
    masterReference: null;
    masterStatus: string;
  };
  executionGate: {
    contractHumanReviewRequired: boolean;
    imageGenerationAllowedNow: boolean;
    maximumCandidateSheetsAfterApproval: number;
    batchGenerationAllowed: boolean;
    loraTrainingAllowed: boolean;
    automaticMasterAssignmentAllowed: boolean;
    requiredDecisionBeforeGeneration: string;
  };
  reviewSheet: {
    candidateId: string;
    candidateVersion: string;
    maximumArtifacts: number;
    requiredViews: string[];
    requiredExpressions: string[];
    requiredPoseStudies: string[];
  };
  visualIdentity: {
    requiredIdentifiers: string[];
    silhouette: string;
    paletteStatus: string;
    paletteRules: string[];
  };
  styleContract: {
    positiveTraits: string[];
    forbiddenTraits: string[];
  };
  reviewTests: Array<{
    id: string;
    severity: string;
    passCondition: string;
  }>;
  humanDecision: {
    current: string;
    allowedValues: string[];
    rule: string;
  };
  currentState: {
    candidateSheets: number;
    imageBytesPresent: boolean;
    externalExecutionUsed: boolean;
    automaticTestsRun: boolean;
    masterApproved: boolean;
    characterMastersApproved: number;
    locationMastersApproved: number;
    voiceMastersApproved: number;
  };
  nextAction: string;
};

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export function RiccoMasterReview() {
  const [inventory, setInventory] = useState<SourceInventory | null>(null);
  const [contract, setContract] = useState<MasterContract | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      loadJson<SourceInventory>('../project/lr5-ricco-master-source-inventory.json'),
      loadJson<MasterContract>('../project/lr5-ricco-master-contract.json')
    ])
      .then(([inventoryData, contractData]) => {
        setInventory(inventoryData);
        setContract(contractData);
      })
      .catch((loadError) => setError(String(loadError)));
  }, []);

  const blockingTests = useMemo(
    () => contract?.reviewTests.filter((test) => test.severity === 'BLOCKING').length || 0,
    [contract]
  );

  if (error) {
    return (
      <main className="shell" data-testid="ricco-master-review-error">
        <section className="hero error-card">
          <p className="eyebrow">LR5.1 · CONTRACT LOAD BLOCKED</p>
          <h1>Ricco-Vertrag konnte nicht geladen werden.</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!inventory || !contract) {
    return <main className="loading" aria-live="polite">Ricco-Mastervertrag wird geladen …</main>;
  }

  const candidateCount = contract.currentState.candidateSheets;
  const candidateLimit = contract.executionGate.maximumCandidateSheetsAfterApproval;
  const executionBlocked = !contract.executionGate.imageGenerationAllowedNow;

  return (
    <main className="shell loop-shell" data-testid="ricco-master-review">
      <section className="hero loop-hero">
        <div>
          <p className="eyebrow">LR5.1 · ISSUE #{contract.trackingIssue} · RICCO MASTER CONTRACT</p>
          <h1>Ein Ricco.<br />Kein Bilderroulette.</h1>
          <p className="lead">Sieben Quellen sind gepinnt, historische Konflikte sind offen dokumentiert und genau ein späterer Review-Sheet-Kandidat ist erlaubt. Bis zur ausdrücklichen menschlichen Vertragsfreigabe bleibt jede Bildausführung gesperrt.</p>
        </div>
        <div className="hero-state" data-testid="ricco-contract-state">
          <span>{contract.status}</span>
          <strong>{executionBlocked ? 'EXECUTION BLOCKED' : 'ONE CANDIDATE ALLOWED'}</strong>
          <small>{candidateCount}/{candidateLimit} Kandidaten · {contract.humanDecision.current}</small>
        </div>
      </section>

      <section className="cards" aria-label="Ricco-Master-Vertragsstatus">
        <article>
          <span>SUBJEKT</span>
          <strong>{contract.subject.name} · {contract.subject.age}</strong>
          <p>{contract.subject.id} · Masterreferenz null</p>
        </article>
        <article>
          <span>QUELLEN</span>
          <strong data-testid="ricco-source-count">{inventory.sources.length}/7</strong>
          <p>Primärquellen, Altquellen und Platzhalter getrennt</p>
        </article>
        <article>
          <span>KANDIDATENSLOT</span>
          <strong data-testid="ricco-candidate-count">{candidateCount}/{candidateLimit}</strong>
          <p>kein Batch · keine Alternative Designs</p>
        </article>
        <article>
          <span>MASTERSTATUS</span>
          <strong data-testid="ricco-review-status">{contract.humanDecision.current}</strong>
          <p>nur Mensch darf freigeben</p>
        </article>
      </section>

      <section className="status-grid">
        <article className="panel" data-testid="ricco-source-hierarchy">
          <p className="eyebrow">QUELLENHIERARCHIE</p>
          <h2>Aktuelle Autorität schlägt Altmaterial</h2>
          <ul className="check-list">
            {inventory.sources.map((source) => (
              <li key={source.path}>
                <b>{source.authority.startsWith('PRIMARY') ? '✓' : source.authority === 'NOT_A_MASTER_SOURCE' ? '×' : '·'}</b>
                <span><code>{source.path}</code><br />{source.role} · {source.authority}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel warning" data-testid="ricco-conflicts">
          <p className="eyebrow">KONFLIKTE AUFGELÖST</p>
          <h2>Altlasten bleiben sichtbar, aber verlieren das Lenkrad</h2>
          <ul>
            {inventory.resolvedConflicts.map((conflict) => (
              <li key={conflict.field}>
                <strong>{conflict.field}</strong>: {String(conflict.historicalValue)} → {String(conflict.currentValue)} · {conflict.resolution}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="status-grid">
        <article className="panel" data-testid="ricco-sheet-contract">
          <p className="eyebrow">EIN REVIEW-SHEET</p>
          <h2>5 Ansichten · 6 Expressions · 4 Posen</h2>
          <h3>Pflichtansichten</h3>
          <ul>{contract.reviewSheet.requiredViews.map((view) => <li key={view}>{view}</li>)}</ul>
          <h3>Expressions</h3>
          <ul>{contract.reviewSheet.requiredExpressions.map((expression) => <li key={expression}>{expression}</li>)}</ul>
          <p className="boundary">Kandidat: {contract.reviewSheet.candidateId} · Version {contract.reviewSheet.candidateVersion}</p>
        </article>

        <article className="panel" data-testid="ricco-identity-contract">
          <p className="eyebrow">IDENTITÄTSLOCK</p>
          <h2>Wiedererkennbar, nicht glamourös</h2>
          <ul className="check-list">
            {contract.visualIdentity.requiredIdentifiers.map((identifier) => (
              <li key={identifier}><b>✓</b><span>{identifier}</span></li>
            ))}
          </ul>
          <p className="boundary">Silhouette: {contract.visualIdentity.silhouette}</p>
        </article>
      </section>

      <section className="panel" data-testid="ricco-review-tests">
        <p className="eyebrow">REVIEWVERTRAG</p>
        <h2>{contract.reviewTests.length} Tests · {blockingTests} blockierend</h2>
        <div className="loop-stations">
          {contract.reviewTests.map((test, index) => (
            <article key={test.id} data-status="review-required">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{test.id}</strong>
              <p>{test.passCondition}</p>
              <em>{test.severity}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="status-grid">
        <article className="panel warning" data-testid="ricco-execution-boundary">
          <p className="eyebrow">AUSFÜHRUNGSGRENZE</p>
          <h2>Bildgenerierung noch gesperrt</h2>
          <ul>
            <li>Vertragsreview erforderlich: {String(contract.executionGate.contractHumanReviewRequired)}</li>
            <li>Bildgenerierung jetzt erlaubt: {String(contract.executionGate.imageGenerationAllowedNow)}</li>
            <li>Batch erlaubt: {String(contract.executionGate.batchGenerationAllowed)}</li>
            <li>LoRA-Training erlaubt: {String(contract.executionGate.loraTrainingAllowed)}</li>
            <li>Automatische Masterfreigabe: {String(contract.executionGate.automaticMasterAssignmentAllowed)}</li>
          </ul>
          <p className="boundary">Benötigte Entscheidung: <strong>{contract.executionGate.requiredDecisionBeforeGeneration}</strong></p>
        </article>

        <article className="panel" data-testid="ricco-human-decision">
          <p className="eyebrow">MENSCHLICHE ENTSCHEIDUNG</p>
          <h2>{contract.humanDecision.current}</h2>
          <ul>{contract.humanDecision.allowedValues.map((value) => <li key={value}>{value}</li>)}</ul>
          <p className="boundary">{contract.humanDecision.rule}</p>
        </article>
      </section>

      <section className="hash-grid" data-testid="ricco-zero-state">
        <article><span>KANDIDATEN</span><strong>{candidateCount}</strong></article>
        <article><span>BILDBYTES</span><strong>{contract.currentState.imageBytesPresent ? 'JA' : 'NEIN'}</strong></article>
        <article><span>EXTERNE AUSFÜHRUNG</span><strong>{contract.currentState.externalExecutionUsed ? 'JA' : 'NEIN'}</strong></article>
        <article><span>CHARACTER-MASTER</span><strong>{contract.currentState.characterMastersApproved}/4</strong></article>
      </section>

      <p className="boundary" data-testid="ricco-next-action">Nächster Schritt: {contract.nextAction}</p>
    </main>
  );
}
