import shots from '../data/shots.json';
import { ShotCard } from '../components/ShotCard';
import { StatusBadge } from '../components/StatusBadge';
import type { Shot } from '../types';

const shotData = shots as Shot[];

export function Review() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Continuity Check</p>
          <h2>Approve only what survives the eye test</h2>
        </div>
        <button className="primary-button">Assemble Approved Shots</button>
      </div>
      <div className="review-board">
        {shotData.map((shot) => (
          <div className="review-row" key={shot.id}>
            <div className="mock-preview">
              <span>Shot {shot.shot_number}</span>
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
              <div className="review-actions">
                <button className="ghost-button">Reject</button>
                <button className="ghost-button">Regenerate</button>
                <button className="primary-button">Approve</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="page-stack">
        {shotData.filter((shot) => shot.risk === 'insane').map((shot) => <ShotCard key={shot.id} shot={shot} />)}
      </div>
    </section>
  );
}
