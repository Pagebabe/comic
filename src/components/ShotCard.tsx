import type { Shot } from '../types';
import { StatusBadge } from './StatusBadge';

export function ShotCard({ shot, compact = false }: { shot: Shot; compact?: boolean }) {
  const approved = shot.variants.find((variant) => variant.status === 'approved');

  return (
    <article className={`card shot-card ${compact ? 'compact' : ''}`}>
      <div className="card-header">
        <div>
          <p className="eyebrow">Scene {shot.scene_number} · Shot {shot.shot_number} · {shot.duration}s</p>
          <h3>{shot.location}</h3>
        </div>
        <StatusBadge status={shot.status} />
      </div>
      <div className="shot-meta">
        <span>Risk: {shot.risk}</span>
        <span>Camera: {shot.camera}</span>
        <span>Continuity: {shot.continuity_score}%</span>
      </div>
      <p className="body-copy">{shot.action}</p>
      {!compact && (
        <>
          <div className="dialogue-box">
            {shot.dialogue.length === 0 ? <em>No dialogue in this shot.</em> : shot.dialogue.map((line) => (
              <p key={`${line.character}-${line.line}`}><strong>{line.character}:</strong> {line.line}</p>
            ))}
          </div>
          <div className="prompt-box">{shot.prompt}</div>
          <div className="variant-row">
            {shot.variants.map((variant) => (
              <div key={variant.variant_id} className={`variant-card ${variant.status}`}>
                <span>{variant.variant_id}</span>
                <strong>{variant.auto_score}%</strong>
                <small>{variant.notes}</small>
              </div>
            ))}
          </div>
        </>
      )}
      {approved && <p className="approved-note">Approved variant: {approved.variant_id}</p>}
    </article>
  );
}
