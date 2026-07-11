import { useEffect, useMemo, useState } from 'react';

export type AcademyStage = {
  id: string;
  number: number;
  phase: string;
  title: string;
  objective: string;
  beginnerExplanation: string;
  deliverables: string[];
  tools: string[];
  gateType: string;
  automaticApprovalAllowed: boolean;
  doneWhen: string;
  template: string;
};

export type ProductionAcademyContract = {
  schemaVersion: number;
  id: string;
  status: string;
  trackingIssue: number;
  title: string;
  summary: string;
  modes: Array<{ id: 'training' | 'production'; title: string; description: string }>;
  roles: Array<{ id: string; title: string; owns: string[] }>;
  stages: AcademyStage[];
  dayOnePlan: Array<{ time: string; task: string; stageId: string }>;
  safetyRules: string[];
};

type StageStatus = 'not_started' | 'in_progress' | 'training_complete' | 'completed' | 'review_required';

type StageProgress = {
  status: StageStatus;
  note: string;
  updatedAt: string | null;
};

type AcademyProgress = {
  schemaVersion: 1;
  mode: 'training' | 'production';
  explanationLevel: 'beginner' | 'professional';
  activeStageId: string;
  stages: Record<string, StageProgress>;
};

const STORAGE_KEY = 'comic-production-academy-progress-v1';

function emptyProgress(contract: ProductionAcademyContract): AcademyProgress {
  return {
    schemaVersion: 1,
    mode: 'training',
    explanationLevel: 'beginner',
    activeStageId: contract.stages[0]?.id ?? '',
    stages: Object.fromEntries(contract.stages.map((stage) => [stage.id, {
      status: 'not_started' as StageStatus,
      note: '',
      updatedAt: null
    }]))
  };
}

function restoreProgress(contract: ProductionAcademyContract): AcademyProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress(contract);
    const parsed = JSON.parse(raw) as AcademyProgress;
    if (parsed.schemaVersion !== 1 || !contract.stages.some((stage) => stage.id === parsed.activeStageId)) return emptyProgress(contract);
    const clean = emptyProgress(contract);
    return {
      ...clean,
      mode: parsed.mode === 'production' ? 'production' : 'training',
      explanationLevel: parsed.explanationLevel === 'professional' ? 'professional' : 'beginner',
      activeStageId: parsed.activeStageId,
      stages: Object.fromEntries(contract.stages.map((stage) => {
        const candidate = parsed.stages?.[stage.id];
        const allowed: StageStatus[] = ['not_started', 'in_progress', 'training_complete', 'completed', 'review_required'];
        return [stage.id, candidate && allowed.includes(candidate.status)
          ? { status: candidate.status, note: String(candidate.note ?? ''), updatedAt: candidate.updatedAt ?? null }
          : clean.stages[stage.id]];
      }))
    };
  } catch {
    return emptyProgress(contract);
  }
}

function statusLabel(status: StageStatus) {
  return ({
    not_started: 'OFFEN',
    in_progress: 'IN ARBEIT',
    training_complete: 'TRAINING ONLY',
    completed: 'TECHNISCH ERLEDIGT',
    review_required: 'HUMAN REVIEW'
  } as const)[status];
}

function canOpenStage(contract: ProductionAcademyContract, progress: AcademyProgress, stageIndex: number) {
  if (stageIndex === 0) return true;
  const previous = contract.stages[stageIndex - 1];
  const status = progress.stages[previous.id]?.status;
  return status === 'training_complete' || status === 'completed' || status === 'review_required';
}

function exportProgress(contract: ProductionAcademyContract, progress: AcademyProgress) {
  const payload = {
    schemaVersion: 1,
    type: 'comic-factory-production-academy-progress',
    exportedAt: new Date().toISOString(),
    contract: { id: contract.id, schemaVersion: contract.schemaVersion, trackingIssue: contract.trackingIssue },
    progress,
    boundaries: {
      trainingIsProductionApproval: false,
      humanGatesAutomaticallyApproved: false,
      finalEpisodeAutomaticallyApproved: false
    }
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `comic-factory-academy-progress-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ProductionAcademy({ contract }: { contract: ProductionAcademyContract }) {
  const [progress, setProgress] = useState(() => restoreProgress(contract));

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const activeIndex = Math.max(0, contract.stages.findIndex((stage) => stage.id === progress.activeStageId));
  const activeStage = contract.stages[activeIndex];
  const completedCount = useMemo(() => Object.values(progress.stages).filter((stage) =>
    stage.status === 'training_complete' || stage.status === 'completed' || stage.status === 'review_required').length, [progress]);
  const percent = Math.round((completedCount / contract.stages.length) * 100);

  function updateStage(stageId: string, patch: Partial<StageProgress>) {
    setProgress((current) => ({
      ...current,
      stages: {
        ...current.stages,
        [stageId]: {
          ...current.stages[stageId],
          ...patch,
          updatedAt: new Date().toISOString()
        }
      }
    }));
  }

  function activate(stageId: string) {
    const index = contract.stages.findIndex((stage) => stage.id === stageId);
    if (!canOpenStage(contract, progress, index)) return;
    setProgress((current) => ({ ...current, activeStageId: stageId }));
    if (progress.stages[stageId]?.status === 'not_started') updateStage(stageId, { status: 'in_progress' });
  }

  function advance() {
    const humanGate = !activeStage.automaticApprovalAllowed;
    const nextStatus: StageStatus = progress.mode === 'training'
      ? 'training_complete'
      : humanGate
        ? 'review_required'
        : 'completed';
    updateStage(activeStage.id, { status: nextStatus });
    const next = contract.stages[activeIndex + 1];
    if (next) {
      setProgress((current) => ({
        ...current,
        activeStageId: next.id,
        stages: {
          ...current.stages,
          [next.id]: current.stages[next.id].status === 'not_started'
            ? { ...current.stages[next.id], status: 'in_progress', updatedAt: new Date().toISOString() }
            : current.stages[next.id]
        }
      }));
    }
  }

  function setMode(mode: 'training' | 'production') {
    setProgress((current) => ({ ...current, mode }));
  }

  function reset() {
    const fresh = emptyProgress(contract);
    window.localStorage.removeItem(STORAGE_KEY);
    setProgress(fresh);
  }

  return (
    <main className="shell academy-shell" data-testid="production-academy">
      <section className="hero academy-hero">
        <div>
          <p className="eyebrow">PRODUKTIONS-AKADEMIE · ISSUE #{contract.trackingIssue}</p>
          <h1>Von null zur produzierbaren Episode.</h1>
          <p className="lead">{contract.summary}</p>
        </div>
        <div className="hero-state academy-progress" data-testid="academy-progress">
          <span>{progress.mode === 'training' ? 'ÜBUNGSMODUS' : 'ECHTE PRODUKTION'}</span>
          <strong>{completedCount}/{contract.stages.length} STUFEN · {percent}%</strong>
          <small>Human Gates bleiben REVIEW_REQUIRED, bis ein Mensch exakt diese Version freigibt.</small>
        </div>
      </section>

      <section className="academy-toolbar" aria-label="Akademie-Steuerung">
        <div className="segmented" data-testid="academy-mode">
          {contract.modes.map((mode) => (
            <button key={mode.id} type="button" className={progress.mode === mode.id ? 'active' : ''} onClick={() => setMode(mode.id)}>
              {mode.title}
            </button>
          ))}
        </div>
        <div className="segmented" data-testid="academy-explanation-level">
          <button type="button" className={progress.explanationLevel === 'beginner' ? 'active' : ''} onClick={() => setProgress((current) => ({ ...current, explanationLevel: 'beginner' }))}>Anfänger</button>
          <button type="button" className={progress.explanationLevel === 'professional' ? 'active' : ''} onClick={() => setProgress((current) => ({ ...current, explanationLevel: 'professional' }))}>Profi</button>
        </div>
        <button className="ghost-control" type="button" onClick={() => exportProgress(contract, progress)}>Fortschritt exportieren</button>
        <button className="ghost-control" data-testid="academy-reset" type="button" onClick={reset}>Zurücksetzen</button>
      </section>

      <section className="academy-layout">
        <aside className="academy-rail" aria-label="Produktionsstufen">
          {contract.stages.map((stage, index) => {
            const unlocked = canOpenStage(contract, progress, index);
            const stageProgress = progress.stages[stage.id];
            return (
              <button
                key={stage.id}
                type="button"
                className={activeStage.id === stage.id ? 'active' : ''}
                disabled={!unlocked}
                data-status={stageProgress.status}
                data-testid={`academy-stage-${stage.id}`}
                onClick={() => activate(stage.id)}
              >
                <span>{String(stage.number).padStart(2, '0')}</span>
                <strong>{stage.title}</strong>
                <em>{statusLabel(stageProgress.status)}</em>
              </button>
            );
          })}
        </aside>

        <div className="academy-workspace">
          <article className="panel academy-stage-card" data-testid="academy-active-stage">
            <p className="eyebrow">STUFE {activeStage.number} · {activeStage.phase.toUpperCase()}</p>
            <h2>{activeStage.title}</h2>
            <p className="academy-objective">{activeStage.objective}</p>

            <div className="academy-explanation">
              <strong>{progress.explanationLevel === 'beginner' ? 'Einfach erklärt' : 'Produktionsdefinition'}</strong>
              <p>{progress.explanationLevel === 'beginner' ? activeStage.beginnerExplanation : activeStage.doneWhen}</p>
            </div>

            <div className="academy-detail-grid">
              <div>
                <h3>Pflicht-Ergebnisse</h3>
                <ul className="check-list compact">
                  {activeStage.deliverables.map((item) => <li key={item}><b>□</b><span>{item}</span></li>)}
                </ul>
              </div>
              <div>
                <h3>Werkzeuge</h3>
                <ul>{activeStage.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul>
                <h3>Gate</h3>
                <p className="gate-badge">{activeStage.gateType}</p>
              </div>
            </div>

            <label className="academy-notes">
              Arbeitsnotiz / Blocker
              <textarea
                value={progress.stages[activeStage.id].note}
                onChange={(event) => updateStage(activeStage.id, { note: event.target.value })}
                placeholder="Was wurde gemacht, was fehlt, welche Datei oder Entscheidung blockiert?"
              />
            </label>

            <div className="academy-actions">
              <a href={`../${activeStage.template}`} target="_blank" rel="noreferrer">Vorlage öffnen</a>
              <button type="button" data-testid="academy-advance" onClick={advance}>
                {progress.mode === 'training'
                  ? 'Trainingsstufe abschließen'
                  : activeStage.automaticApprovalAllowed
                    ? 'Technisch abschließen'
                    : 'Zur menschlichen Prüfung einreichen'}
              </button>
            </div>
            <p className="boundary">{activeStage.doneWhen}</p>
          </article>

          <article className="panel day-one-plan">
            <p className="eyebrow">MORGEN STARTEN</p>
            <h2>Ein Arbeitstag bis zum technischen Übungspaket</h2>
            <ol>
              {contract.dayOnePlan.map((item) => (
                <li key={`${item.time}-${item.task}`}>
                  <time>{item.time}</time>
                  <span>{item.task}</span>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="academy-reference-grid">
        <article className="panel">
          <p className="eyebrow">ROLLEN</p>
          <h2>Wer entscheidet was?</h2>
          {contract.roles.map((role) => (
            <div className="role-row" key={role.id}>
              <strong>{role.title}</strong>
              <span>{role.owns.join(' · ')}</span>
            </div>
          ))}
        </article>
        <article className="panel warning">
          <p className="eyebrow">STOP-REGELN</p>
          <h2>Was die Maschine nie behaupten darf</h2>
          <ul>{contract.safetyRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        </article>
      </section>
    </main>
  );
}
