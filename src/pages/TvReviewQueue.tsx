import reviewQueue from '../data/tvReviewQueue.json';

type ReviewStatus = 'approved' | 'needs_fix' | 'queued';

type TvReviewItem = {
  id: string;
  episode_id: string;
  scene_id: string;
  tv_shot_id: string;
  title: string;
  status: ReviewStatus;
  current_version: string;
  asset_target: string;
  known_issue: string;
  approval_checks: string[];
};

const items = reviewQueue as TvReviewItem[];

function count(status: ReviewStatus) {
  return items.filter((item) => item.status === status).length;
}

export function TvReviewQueue() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">TV Review Queue</p>
          <h2>Approval board for pilot TV keyframes</h2>
        </div>
        <button className="primary-button">Review Next Fix</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Approved</p><strong>{count('approved')}</strong><span>usable keyframes</span></div></div>
        <div className="stat-card"><div><p>Needs Fix</p><strong>{count('needs_fix')}</strong><span>must rebuild</span></div></div>
        <div className="stat-card"><div><p>Queued</p><strong>{count('queued')}</strong><span>not generated yet</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Approval Rule</p>
        <h2>No asset becomes canon until this queue says approved.</h2>
        <p className="body-copy">The most important fixes are Shot 006 clean paper and Shot 009 Sami punchline. Everything else can wait behind character, text and clarity checks.</p>
      </div>

      <div className="page-stack">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{item.scene_id} · {item.tv_shot_id} · {item.current_version}</p>
                <h3>{item.title}</h3>
              </div>
              <span className="status-badge">{item.status}</span>
            </div>

            <div className="spec-grid">
              <div><span>Known Issue</span><p>{item.known_issue}</p></div>
              <div><span>Asset Target</span><p>{item.asset_target}</p></div>
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Approval Checks</p>
              {item.approval_checks.map((check) => <p key={check}>• {check}</p>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
