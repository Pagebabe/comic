import galleryTemplate from '../data/assetGalleryTemplate.json';
import tvReviewQueue from '../data/tvReviewQueue.json';

type ReviewItem = {
  id: string;
  episode_id: string;
  scene_id: string;
  tv_shot_id: string;
  title: string;
  status: string;
  current_version: string;
  asset_target: string;
  known_issue: string;
  approval_checks: string[];
};

const items = tvReviewQueue as ReviewItem[];
const template = galleryTemplate as {
  name: string;
  purpose: string;
  local_rules: string[];
  actions: string[];
};

const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
}, {});

function commandFor(status: 'approved' | 'needs_fix', item: ReviewItem) {
  return `npm run review:set -- ${status} ${item.tv_shot_id} ${item.asset_target} "review note"`;
}

export function AssetPreviewGallery() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Asset Preview Gallery</p>
          <h2>{template.name}</h2>
        </div>
        <button className="primary-button">Review Next Shot</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Total Shots</p><strong>{items.length}</strong><span>TV review items</span></div></div>
        <div className="stat-card"><div><p>Approved</p><strong>{statusCounts.approved ?? 0}</strong><span>usable shots</span></div></div>
        <div className="stat-card"><div><p>Needs Fix</p><strong>{statusCounts.needs_fix ?? 0}</strong><span>blocked shots</span></div></div>
        <div className="stat-card"><div><p>Queued</p><strong>{statusCounts.queued ?? 0}</strong><span>missing shots</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>{template.purpose}</h2>
        <p className="body-copy">This page links each expected keyframe path to a review decision. File existence alone is not approval.</p>
      </div>

      <div className="page-stack">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{item.scene_id} · {item.current_version}</p>
                <h3>{item.tv_shot_id} · {item.title}</h3>
              </div>
              <span className="status-badge">{item.status}</span>
            </div>

            <div className="spec-grid">
              <div><span>Asset Target</span><p>{item.asset_target}</p></div>
              <div><span>Known Issue</span><p>{item.known_issue}</p></div>
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Approval Checks</p>
              {item.approval_checks.map((check) => <p key={check}>• {check}</p>)}
            </div>

            <div className="grid two-col">
              <div>
                <label>Approve Command</label>
                <textarea readOnly value={commandFor('approved', item)} />
              </div>
              <div>
                <label>Needs Fix Command</label>
                <textarea readOnly value={commandFor('needs_fix', item)} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
