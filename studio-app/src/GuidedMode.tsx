import { useEffect, useMemo, useState } from 'react';

type GuideStep = {
  id: string;
  title: string;
  mousePath: string;
  command?: string;
  expected: string;
  stopRule: string;
};

type GuideChapter = {
  id: string;
  order: number;
  title: string;
  manual: string;
  durationMinutes: number;
  steps: GuideStep[];
};

type OperatorGuide = {
  status: string;
  route: string;
  claimBoundary: {
    productionReady: boolean;
    beginnerReady: boolean;
    creativeApprovalGranted: boolean;
    imageGenerationAllowed: boolean;
    growthOsIntegrated: boolean;
  };
  concepts: Array<{ id: string; label: string; definition: string }>;
  chapters: GuideChapter[];
  acceptance: {
    requiredScore: number;
    questions: string[];
    completionStorageKey: string;
    humanObservationRequired: boolean;
  };
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
  gates: Array<{ id: string; title: string; status: string; doneWhen: string }>;
  parallelLineBoundary: {
    growthOsStatus: string;
    liveReady: boolean;
    mainIntegrationAllowed: boolean;
  };
};

const loadJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(new URL(path, window.location.href), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
};

function readProgress(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

export function GuidedMode() {
  const [guide, setGuide] = useState<OperatorGuide | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeChapter, setActiveChapter] = useState('orientation');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      loadJson<OperatorGuide>('../project/operator-guide-v1.json'),
      loadJson<Readiness>('../project/production-readiness-v1.json')
    ])
      .then(([guideData, readinessData]) => {
        setGuide(guideData);
        setReadiness(readinessData);
        setCompleted(readProgress(guideData.acceptance.completionStorageKey));
      })
      .catch((loadError) => setError(String(loadError)));
  }, []);

  const active = useMemo(
    () => guide?.chapters.find((chapter) => chapter.id === activeChapter) || guide?.chapters[0],
    [guide, activeChapter]
  );

  const completedChapters = useMemo(() => {
    if (!guide) return 0;
    return guide.chapters.filter((chapter) => chapter.steps.every((step) => completed.has(step.id))).length;
  }, [guide, completed]);

  function toggleStep(stepId: string) {
    if (!guide) return;
    const next = new Set(completed);
    if (next.has(stepId)) next.delete(stepId);
    else next.add(stepId);
    setCompleted(next);
    window.localStorage.setItem(guide.acceptance.completionStorageKey, JSON.stringify([...next].sort()));
  }

  function resetProgress() {
    if (!guide) return;
    window.localStorage.removeItem(guide.acceptance.completionStorageKey);
    setCompleted(new Set());
  }

  if (error) {
    return (
      <main className="shell" data-testid="guided-mode-error">
        <section className="hero error-card">
          <p className="eyebrow">OPS1 · GUIDE LOAD BLOCKED</p>
          <h1>Guided Mode konnte seine belegten Verträge nicht laden.</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!guide || !readiness || !active) {
    return <main className="loading" aria-live="polite">Guided Mode lädt Handbuch und Readiness-Vertrag …</main>;
  }

  return (
    <main className="shell guided-shell" data-testid="guided-mode">
      <section className="hero guided-hero">
        <div>
          <p className="eyebrow">OPS1 · BEGINNER GUIDED MODE · ISSUE #95</p>
          <h1>Von null Ahnung zum sicheren Produktionsablauf.</h1>
          <p className="lead">Dieser Modus erklärt jeden Schritt mit Mausweg, erwartetem Ergebnis und Stop-Regel. Er speichert nur Lernfortschritt im Browser und löst keine Bildgenerierung, Provideraktion, kreative Freigabe oder Growth-OS-Integration aus.</p>
        </div>
        <div className="hero-state" data-testid="guided-readiness">
          <span>{readiness.status}</span>
          <strong>{readiness.currentScore.display}</strong>
          <small>{completedChapters}/{guide.chapters.length} Lernkapitel lokal abgeschlossen</small>
        </div>
      </section>

      <section className="guided-boundaries" aria-label="Guided-Mode-Grenzen">
        <article><span>PRODUCTION READY</span><strong>{guide.claimBoundary.productionReady ? 'JA' : 'NEIN'}</strong></article>
        <article><span>BEGINNER READY</span><strong>{guide.claimBoundary.beginnerReady ? 'JA' : 'NOCH NICHT'}</strong></article>
        <article><span>BILDGENERIERUNG</span><strong>{guide.claimBoundary.imageGenerationAllowed ? 'ERLAUBT' : 'GESPERRT'}</strong></article>
        <article><span>CREATIVE APPROVAL</span><strong>{guide.claimBoundary.creativeApprovalGranted ? 'ERTEILT' : 'NEIN'}</strong></article>
        <article><span>GROWTH OS</span><strong>{guide.claimBoundary.growthOsIntegrated ? 'INTEGRIERT' : 'GETRENNT'}</strong></article>
      </section>

      <section className="guided-concepts panel">
        <p className="eyebrow">DIE FÜNF PFLICHTBEGRIFFE</p>
        <div className="concept-grid">
          {guide.concepts.map((concept) => (
            <article key={concept.id}>
              <strong>{concept.label}</strong>
              <p>{concept.definition}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="guided-layout">
        <aside className="guided-chapters panel" aria-label="Lernkapitel">
          <p className="eyebrow">KAPITEL</p>
          {guide.chapters.map((chapter) => {
            const chapterDone = chapter.steps.every((step) => completed.has(step.id));
            return (
              <button
                key={chapter.id}
                className={active.id === chapter.id ? 'active' : ''}
                data-chapter={chapter.id}
                onClick={() => setActiveChapter(chapter.id)}
              >
                <span>{chapter.order}</span>
                <div><strong>{chapter.title}</strong><small>{chapter.durationMinutes} Min · {chapterDone ? 'abgeschlossen' : 'offen'}</small></div>
              </button>
            );
          })}
          <button className="ghost" data-testid="guided-reset" onClick={resetProgress}>Fortschritt zurücksetzen</button>
        </aside>

        <section className="guided-content panel" data-testid="guided-active-chapter">
          <p className="eyebrow">KAPITEL {active.order}</p>
          <h2>{active.title}</h2>
          <a className="manual-link" href={active.manual}>Kapitel im Handbuch öffnen</a>

          <div className="guided-steps">
            {active.steps.map((step, index) => {
              const done = completed.has(step.id);
              return (
                <article key={step.id} data-status={done ? 'done' : 'open'}>
                  <button
                    className="step-check"
                    aria-label={`${step.title} ${done ? 'als offen markieren' : 'als erledigt markieren'}`}
                    onClick={() => toggleStep(step.id)}
                  >{done ? '✓' : String(index + 1).padStart(2, '0')}</button>
                  <div>
                    <h3>{step.title}</h3>
                    <dl>
                      <div><dt>Mausweg</dt><dd>{step.mousePath}</dd></div>
                      {step.command && <div><dt>Befehl</dt><dd><code>{step.command}</code></dd></div>}
                      <div><dt>Erwartet</dt><dd>{step.expected}</dd></div>
                      <div className="stop"><dt>Stop-Regel</dt><dd>{step.stopRule}</dd></div>
                    </dl>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <section className="panel readiness-panel" data-testid="readiness-gates">
        <p className="eyebrow">PRODUCTION-READINESS · 10 MESSBARE GATES</p>
        <h2>10/10 erst bei zehnmal CLOSED_VERIFIED.</h2>
        <div className="readiness-grid">
          {readiness.gates.map((gate) => (
            <article key={gate.id} data-status={gate.status}>
              <span>{gate.id}</span>
              <strong>{gate.title}</strong>
              <em>{gate.status}</em>
              <p>{gate.doneWhen}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel acceptance-panel" data-testid="novice-acceptance">
        <p className="eyebrow">NULLWISSEN-ABNAHME</p>
        <h2>{guide.acceptance.questions.length} Fragen · menschliche Beobachtung erforderlich</h2>
        <ol>{guide.acceptance.questions.map((question) => <li key={question}>{question}</li>)}</ol>
        <p className="boundary">Selbst angeklickter Fortschritt schließt kein Readiness-Gate. PR2 und PR10 bleiben offen, bis ein beobachteter Anfänger-Lauf dokumentiert und separat geschlossen wurde.</p>
        <div className="guide-links">
          <a href="../docs/OPERATOR_MANUAL_V1.md">Gesamtes Operator-Handbuch</a>
          <a href="../docs/VIDEO_TUTORIAL_SCRIPT_V1.md">Video-Drehbuch</a>
          <a href="../project/production-readiness-v1.json">Readiness-Vertrag</a>
        </div>
      </section>

      <section className="panel growth-boundary" data-testid="growth-boundary">
        <p className="eyebrow">PARALLELE LINIE</p>
        <h2>Growth OS bleibt isoliert.</h2>
        <p>Status: <strong>{readiness.parallelLineBoundary.growthOsStatus}</strong> · Live Ready: <strong>{readiness.parallelLineBoundary.liveReady ? 'ja' : 'nein'}</strong> · Integration in main: <strong>{readiness.parallelLineBoundary.mainIntegrationAllowed ? 'erlaubt' : 'gesperrt'}</strong></p>
      </section>
    </main>
  );
}
