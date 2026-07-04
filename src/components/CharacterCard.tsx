import type { Character } from '../types';
import { StatusBadge } from './StatusBadge';

export function CharacterCard({ character }: { character: Character }) {
  return (
    <article className="card character-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{character.role}</p>
          <h3>{character.name}</h3>
        </div>
        <StatusBadge status={character.status} />
      </div>
      <p className="body-copy">{character.personality}</p>
      <div className="spec-grid">
        <div><span>Look</span><p>{character.visual_description}</p></div>
        <div><span>Outfit</span><p>{character.outfit_rules}</p></div>
        <div><span>Face</span><p>{character.face_rules}</p></div>
      </div>
      <div className="chips">
        {character.catchphrases.map((line) => <span key={line}>{line}</span>)}
      </div>
    </article>
  );
}
