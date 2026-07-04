import { ShotCard } from '../components/ShotCard';
import { StatusBadge } from '../components/StatusBadge';
import { useShotStore } from '../hooks/useShotStore';

export function Review() {
  const { shots, approveShot, rejectShot, markNeedsFix, resetShots } = useShotStore();
  const approvedCount = shots.filter((shot) => shot.status === 'approved').length;

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Panel Continuity Check</p>
          <h2>Approve only clean comic-video frames</h2>
        </div>
        <div className="review-actions">
          <button className="ghost-button" onClick={resetShots}>Reset Local State</button>
          <button className="primary-button">Assemble {approvedCount} Approved Panels</button>
        </div>
      </div>
      <div className="hero-card warning-card">
        <p className="eyebrow">Review Rule</p>
        <h2>Bild sauber, Stimmen später</h2>
        <p className="body-copy">Ein Panel wird nur approved, wenn Figur, Ort, Stil und Gag lesbar sind. Dialog darf nicht im Bild hängen. Voice und Untertitel kommen später im Export.</p>
      </div>
      <div className="review-board">
        {shots.map((shot) => (
          <div className="review-row" key={shot.id}>
            <div className="mock-preview">
              <span>Panel {shot.shot_number}</span>
              <strong>{shot.risk}</strong>
            </div>
            <div className="review-details">
              <div className="card-header">
                <div>
                  <p className="eyebrow">{shot.characters.join(' · ')}</p>
                  <h3>{shot.action}</h3>
                </div>
                <StatusBadge status={shot.status} />
              </div>
              <div className="score-bars">
                <div><span>Character</span><progress value={shot.continuity_score} max="100" /></div>
                <div><span>Style</span><progress value={Math.min(100, shot.continuity_score + 6)} max="100" /></div>
                <div><span>Scene Clarity</span><progress value={Math.max(25, shot.continuity_score - 12)} max="100" /></div>
              </div>
              <div className="variant-row compact-variants">
                {shot.variants.map((variant) => (
                  <div key={variant.variant_id} className={`variant-card ${variant.status}`}>
                    <span>{variant.variant_id}</span>
                    <strong>{variant.auto_score}%</strong>
                    <small>{variant.status}</small>
                  </div>
                ))}
              </div>
              <div className="review-actions">
                <button className="ghost-button" onClick={() => rejectShot(shot.id)}>Reject</button>
                <button className="ghost-button" onClick={() => markNeedsFix(shot.id)}>Needs Fix</button>
                <button className="primary-button" onClick={() => approveShot(shot.id)}>Approve</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="page-stack">
        {shots.filter((shot) => shot.risk === 'insane').map((shot) => <ShotCard key={shot.id} shot={shot} />)}
      </div>
    </section>
  );
}
