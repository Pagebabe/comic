import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type ProductionPanel = {
  panelId: string;
  state: string;
  nextAction: string;
  sceneId: string | null;
  sceneTitle: string | null;
  shotType: string | null;
  dialogue: string | null;
  render: {
    queueItemId: string | null;
    status: string | null;
    promptId: string | null;
    readyForHistoryPolling: boolean;
    needsSend: boolean;
    outputPath: string | null;
  };
  history: {
    completed: boolean;
    imageCount: number;
    promptId: string | null;
  };
  review: {
    status: string | null;
    decision: string | null;
    primaryImage: string | null;
    manifestFile: string | null;
  };
  decision: {
    value: string;
    note: string;
    reviewer: string | null;
    decidedAt: string | null;
  } | null;
  fix: {
    jobCount: number;
    latestJobId: string | null;
    queueItemCount: number;
    latestQueueItemId: string | null;
    renderStatus: string | null;
    promptId: string | null;
    attempt: number | null;
    readyForHistoryPolling: boolean;
    historyCompleted: boolean;
    historyImageCount: number;
    latestMergePromptId: string | null;
    latestMergeAt: string | null;
  };
};

type ProductionStatus = {
  id: string;
  createdAt: string;
  episodeId: string;
  seriesTitle: string;
  panelCount: number;
  counts: Record<string, number>;
  sourceAvailability: Record<string, boolean>;
  panels: ProductionPanel[];
  nextStep: string;
};

const emptyStatus: ProductionStatus = {
  id: 'missing_status',
  createdAt: '',
  episodeId: 'episode_001',
  seriesTitle: 'Rico gegen Berlin',
  panelCount: 0,
  counts: {},
  sourceAvailability: {},
  panels: [],
  nextStep: 'Run node scripts/createPilotProductionStatus.mjs and node scripts/publishPilotStatusForUi.mjs.'
};

const stateOrder = [
  'prompt_ready',
  'ready_to_send',
  'waiting_history',
  'ready_for_review_manifest',
  'pending_review',
  'fix_needed',
  'fix_job_queued',
  'fix_ready_to_send',
  'fix_waiting_history',
  'fix_ready_to_merge',
  'fix_merged_pending_review',
  'approved',
  'rejected'
];

const stateLabels: Record<string, string> = {
  prompt_ready: 'Prompt Ready',
  ready_to_send: 'Ready To Send',
  waiting_history: 'Waiting History',
  ready_for_review_manifest: 'Ready For Review Manifest',
  pending_review: 'Pending Review',
  fix_needed: 'Fix Needed',
  fix_job_queued: 'Fix Job Queued',
  fix_ready_to_send: 'Fix Ready To Send',
  fix_waiting_history: 'Fix Waiting History',
  fix_ready_to_merge: 'Fix Ready To Merge',
  fix_merged_pending_review: 'Fix Merged · Review',
  approved: 'Approved',
  rejected: 'Rejected'
};

const stateTone: Record<string, { border: string; background: string; text: string }> = {
  prompt_ready: { border: '#3f4550', background: '#171b22', text: '#aab2c0' },
  ready_to_send: { border: '#2563eb', background: '#111b31', text: '#93c5fd' },
  waiting_history: { border: '#ca8a04', background: '#2a2110', text: '#fde68a' },
  ready_for_review_manifest: { border: '#d97706', background: '#2a1b0f', text: '#fdba74' },
  pending_review: { border: '#f59e0b', background: '#2b210f', text: '#fcd34d' },
  fix_needed: { border: '#dc2626', background: '#2a1010', text: '#fca5a5' },
  fix_job_queued: { border: '#9333ea', background: '#20112e', text: '#d8b4fe' },
  fix_ready_to_send: { border: '#7c3aed', background: '#1f1534', text: '#c4b5fd' },
  fix_waiting_history: { border: '#a855f7', background: '#221337', text: '#e9d5ff' },
  fix_ready_to_merge: { border: '#8b5cf6', background: '#221a38', text: '#ddd6fe' },
  fix_merged_pending_review: { border: '#f97316', background: '#2b180c', text: '#fed7aa' },
  approved: { border: '#16a34a', background: '#102417', text: '#86efac' },
  rejected: { border: '#111827', background: '#07080b', text: '#9ca3af' }
};

const styles: Record<string, CSSProperties> = {
  studioShell: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', gap: '1rem', alignItems: 'start' },
  panelBoard: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(156px, 1fr))', gap: '0.75rem' },
  inspector: { position: 'sticky', top: '1rem' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' },
  sceneHeader: { display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', margin: '1.25rem 0 0.75rem' },
  panelMeta: { display: 'grid', gap: '0.45rem', fontSize: '0.78rem' },
  thumbnail: { height: 88, border: '1px dashed rgba(255,255,255,0.14)', borderRadius: 12, display: 'grid', placeItems: 'center', margin: '0.75rem 0', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.03)' },
  filterRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' },
  command: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  smallMuted: { color: 'rgba(255,255,255,0.58)', fontSize: '0.78rem' }
};

function labelForState(state: string) {
  return stateLabels[state] ?? state;
}

function toneForState(state: string) {
  return stateTone[state] ?? stateTone.prompt_ready;
}

function commandRecipe(panel: ProductionPanel) {
  const base = [
    'node scripts/createPilotProductionStatus.mjs',
    'node scripts/publishPilotStatusForUi.mjs'
  ];

  const recipes: Record<string, string[]> = {
    prompt_ready: [
      'node scripts/createPilotPromptPack.mjs',
      'node scripts/createPilotRenderQueue.mjs',
      'node scripts/createPilotComfyBatch.mjs',
      'node scripts/checkPilotComfyBatch.mjs'
    ],
    ready_to_send: [
      'COMFYUI_URL=http://127.0.0.1:8188 node scripts/runPilotComfyRunner.mjs --health',
      'COMFYUI_URL=http://127.0.0.1:8188 COMFYUI_ALLOW_SEND=1 COMFYUI_CHECKPOINT=DEIN_MODEL.safetensors node scripts/runPilotComfyRunner.mjs --send --limit=1'
    ],
    waiting_history: [
      'node scripts/createPilotRenderStatus.mjs',
      'COMFYUI_URL=http://127.0.0.1:8188 COMFYUI_ALLOW_HISTORY=1 node scripts/pollPilotComfyHistory.mjs --poll'
    ],
    ready_for_review_manifest: ['node scripts/createPilotReviewManifests.mjs'],
    pending_review: [
      `node scripts/setPilotReviewDecision.mjs ${panel.panelId} approved`,
      `node scripts/setPilotReviewDecision.mjs ${panel.panelId} needs_fix "short review note"`
    ],
    fix_needed: ['node scripts/createPilotFixJobs.mjs'],
    fix_job_queued: [
      'node scripts/createPilotFixRenderQueue.mjs',
      'node scripts/createPilotFixComfyBatch.mjs',
      'node scripts/checkPilotFixComfyBatch.mjs'
    ],
    fix_ready_to_send: [
      'COMFYUI_URL=http://127.0.0.1:8188 node scripts/runPilotFixComfyRunner.mjs --health',
      'COMFYUI_URL=http://127.0.0.1:8188 COMFYUI_ALLOW_SEND=1 COMFYUI_CHECKPOINT=DEIN_MODEL.safetensors node scripts/runPilotFixComfyRunner.mjs --send --limit=1'
    ],
    fix_waiting_history: [
      'node scripts/createPilotFixRenderStatus.mjs',
      'COMFYUI_URL=http://127.0.0.1:8188 COMFYUI_ALLOW_HISTORY=1 node scripts/pollPilotFixComfyHistory.mjs --poll'
    ],
    fix_ready_to_merge: ['node scripts/mergePilotFixHistoryToReview.mjs'],
    fix_merged_pending_review: [
      `node scripts/setPilotReviewDecision.mjs ${panel.panelId} approved`,
      `node scripts/setPilotReviewDecision.mjs ${panel.panelId} needs_fix "remaining issue"`
    ],
    approved: ['node scripts/createPilotProductionStatus.mjs'],
    rejected: ['node scripts/createPilotProductionStatus.mjs']
  };

  return [...(recipes[panel.state] ?? []), ...base];
}

function groupPanelsByScene(panels: ProductionPanel[]) {
  return panels.reduce<Record<string, ProductionPanel[]>>((acc, panel) => {
    const key = `${panel.sceneId ?? 'unknown'} · ${panel.sceneTitle ?? 'Unsorted'}`;
    acc[key] = [...(acc[key] ?? []), panel];
    return acc;
  }, {});
}

function StatusBadge({ state }: { state: string }) {
  const tone = toneForState(state);
  return (
    <span style={{ border: `1px solid ${tone.border}`, background: tone.background, color: tone.text, borderRadius: 999, padding: '0.2rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>
      {labelForState(state)}
    </span>
  );
}

function PanelCard({ panel, active, onSelect }: { panel: ProductionPanel; active: boolean; onSelect: () => void }) {
  const tone = toneForState(panel.state);
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: 'left',
        border: `1px solid ${active ? tone.text : tone.border}`,
        background: active ? 'rgba(255,255,255,0.06)' : tone.background,
        color: 'inherit',
        borderRadius: 16,
        padding: '0.8rem',
        cursor: 'pointer',
        boxShadow: active ? `0 0 0 1px ${tone.border}` : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
        <strong>{panel.panelId.replace('panel_', 'P')}</strong>
        <StatusBadge state={panel.state} />
      </div>
      <div style={styles.thumbnail}>{panel.review.primaryImage ? 'IMAGE' : 'NO IMAGE'}</div>
      <div style={styles.panelMeta}>
        <span>{panel.shotType ?? 'shot n/a'} · {panel.sceneTitle ?? 'scene n/a'}</span>
        <span style={styles.smallMuted}>{panel.nextAction}</span>
      </div>
    </button>
  );
}

function CommandBox({ commands }: { commands: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <div className="page-stack">
      {commands.map((command) => (
        <div className="prompt-box" key={command} style={styles.command}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <span>{command}</span>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(command);
                setCopied(command);
              }}
            >
              {copied === command ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StudioControlRoom() {
  const [status, setStatus] = useState<ProductionStatus>(emptyStatus);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState('all');
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/status/pilot-production-status.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data: ProductionStatus) => {
        if (cancelled) return;
        setStatus(data);
        setSelectedPanelId(data.panels[0]?.panelId ?? null);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(String(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePanels = useMemo(() => {
    if (stateFilter === 'all') return status.panels;
    return status.panels.filter((panel) => panel.state === stateFilter);
  }, [stateFilter, status.panels]);

  const sceneGroups = useMemo(() => groupPanelsByScene(visiblePanels), [visiblePanels]);
  const selectedPanel = status.panels.find((panel) => panel.panelId === selectedPanelId) ?? status.panels[0];
  const commands = selectedPanel ? commandRecipe(selectedPanel) : ['node scripts/createPilotProductionStatus.mjs', 'node scripts/publishPilotStatusForUi.mjs'];
  const availableStates = stateOrder.filter((state) => status.counts[state]);

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Studio Control Room</p>
          <h2>{status.seriesTitle} · Pilot Production OS</h2>
          <p className="body-copy">Storyboard-style panel board, production tracking and AI render loop control from one published status file.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>
          Reload Status
        </button>
      </div>

      {loadError && (
        <div className="hero-card warning-card">
          <p className="eyebrow">Status file missing</p>
          <h3>Publish the production status before opening the Control Room.</h3>
          <div className="prompt-box" style={styles.command}>node scripts/createPilotProductionStatus.mjs{`\n`}node scripts/publishPilotStatusForUi.mjs</div>
          <p style={styles.smallMuted}>{loadError}</p>
        </div>
      )}

      <div style={styles.statGrid}>
        <div className="stat-card"><div><p>Total Panels</p><strong>{status.panelCount}</strong><span>{loading ? 'loading' : 'tracked'}</span></div></div>
        {availableStates.slice(0, 7).map((state) => (
          <div className="stat-card" key={state}>
            <div>
              <p>{labelForState(state)}</p>
              <strong>{status.counts[state]}</strong>
              <span>{state}</span>
            </div>
          </div>
        ))}
      </div>

      <article className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Filters</p>
            <h3>Production states</h3>
          </div>
          <span style={styles.smallMuted}>Updated: {status.createdAt || 'not published'}</span>
        </div>
        <div style={styles.filterRow}>
          <button className={stateFilter === 'all' ? 'primary-button' : 'ghost-button'} type="button" onClick={() => setStateFilter('all')}>All</button>
          {stateOrder.map((state) => (
            <button
              key={state}
              className={stateFilter === state ? 'primary-button' : 'ghost-button'}
              type="button"
              onClick={() => setStateFilter(state)}
              disabled={!status.counts[state]}
              style={{ opacity: status.counts[state] ? 1 : 0.38 }}
            >
              {labelForState(state)} · {status.counts[state] ?? 0}
            </button>
          ))}
        </div>
      </article>

      <div style={styles.studioShell}>
        <div className="page-stack">
          <article className="card">
            <div className="card-header">
              <div>
                <p className="eyebrow">Panel Board</p>
                <h3>Storyboard strip by scene</h3>
              </div>
              <span style={styles.smallMuted}>{visiblePanels.length} visible panels</span>
            </div>

            {Object.entries(sceneGroups).map(([scene, panels]) => (
              <div key={scene}>
                <div style={styles.sceneHeader}>
                  <div>
                    <p className="eyebrow">Scene</p>
                    <h3>{scene}</h3>
                  </div>
                  <span style={styles.smallMuted}>{panels.length} panels</span>
                </div>
                <div style={styles.panelBoard}>
                  {panels.map((panel) => (
                    <PanelCard
                      key={panel.panelId}
                      panel={panel}
                      active={panel.panelId === selectedPanel?.panelId}
                      onSelect={() => setSelectedPanelId(panel.panelId)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </article>
        </div>

        <aside className="page-stack" style={styles.inspector}>
          <article className="card">
            <div className="card-header">
              <div>
                <p className="eyebrow">Inspector</p>
                <h3>{selectedPanel?.panelId ?? 'No panel selected'}</h3>
              </div>
              {selectedPanel && <StatusBadge state={selectedPanel.state} />}
            </div>

            {selectedPanel ? (
              <div className="page-stack">
                <div className="dialogue-box">
                  <p className="eyebrow">Next Action</p>
                  <p>{selectedPanel.nextAction}</p>
                </div>

                <div className="grid two-col">
                  <div className="prompt-box"><p className="eyebrow">Scene</p><p>{selectedPanel.sceneTitle ?? 'n/a'}</p></div>
                  <div className="prompt-box"><p className="eyebrow">Shot</p><p>{selectedPanel.shotType ?? 'n/a'}</p></div>
                </div>

                <div className="prompt-box">
                  <p className="eyebrow">Dialogue</p>
                  <p>{selectedPanel.dialogue || 'No dialogue attached.'}</p>
                </div>

                <div className="prompt-box">
                  <p className="eyebrow">Render</p>
                  <p>Queue: {selectedPanel.render.queueItemId ?? 'n/a'}</p>
                  <p>Prompt ID: {selectedPanel.render.promptId ?? 'n/a'}</p>
                  <p>Output: {selectedPanel.render.outputPath ?? 'n/a'}</p>
                </div>

                <div className="prompt-box">
                  <p className="eyebrow">Review</p>
                  <p>Status: {selectedPanel.review.status ?? 'n/a'}</p>
                  <p>Decision: {selectedPanel.review.decision ?? selectedPanel.decision?.value ?? 'n/a'}</p>
                  <p>Manifest: {selectedPanel.review.manifestFile ?? 'n/a'}</p>
                  <p>Primary: {selectedPanel.review.primaryImage ?? 'n/a'}</p>
                </div>

                <div className="prompt-box">
                  <p className="eyebrow">Fix Loop</p>
                  <p>Jobs: {selectedPanel.fix.jobCount}</p>
                  <p>Latest job: {selectedPanel.fix.latestJobId ?? 'n/a'}</p>
                  <p>Attempt: {selectedPanel.fix.attempt ?? 'n/a'}</p>
                  <p>History images: {selectedPanel.fix.historyImageCount}</p>
                </div>
              </div>
            ) : (
              <p className="body-copy">No panel selected.</p>
            )}
          </article>

          <article className="card">
            <div className="card-header">
              <div>
                <p className="eyebrow">Command Dock</p>
                <h3>Copy-only local commands</h3>
              </div>
            </div>
            <CommandBox commands={commands} />
          </article>
        </aside>
      </div>
    </section>
  );
}
