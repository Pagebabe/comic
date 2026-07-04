import type { Character, CharacterProductionSheet } from '../types';
import { StatusBadge } from './StatusBadge';

export function CharacterCard({ character, sheet }: { character: Character; sheet?: CharacterProductionSheet }) {
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
      {sheet && (
        <div className="page-stack production-sheet">
          <div className="dialogue-box">
            <p className="eyebrow">Video Function</p>
            <p>{sheet.video_function}</p>
          </div>
          <div className="dialogue-box">
            <p className="eyebrow">Voice Direction</p>
            <p>{sheet.voice_direction}</p>
          </div>
          <div className="prompt-box">{sheet.generator_prompt}</div>
          <div className="dialogue-box">
            <p className="eyebrow">Fatal Errors</p>
            {sheet.fatal_errors.map((error) => <p key={error}>• {error}</p>)}
          </div>
        </div>
      )}
    </article>
  );
}
