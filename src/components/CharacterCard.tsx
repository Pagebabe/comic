import type { Character, CharacterProductionSheet, LoraTrainingSheet } from '../types';
import { StatusBadge } from './StatusBadge';

export function CharacterCard({ character, sheet, lora }: { character: Character; sheet?: CharacterProductionSheet; lora?: LoraTrainingSheet }) {
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
      {lora && (
        <div className="page-stack production-sheet">
          <div className="dialogue-box">
            <p className="eyebrow">LoRA Readiness</p>
            <p><strong>{lora.trigger_token}</strong> · {lora.dataset_target} · {lora.priority}</p>
            <p>{lora.visual_lock}</p>
          </div>
          <div className="dialogue-box">
            <p className="eyebrow">Turnaround Shots</p>
            {lora.turnaround_shots.slice(0, 5).map((item) => <p key={item}>• {item}</p>)}
          </div>
          <div className="dialogue-box">
            <p className="eyebrow">Caption Template</p>
            <p>{lora.caption_template}</p>
          </div>
        </div>
      )}
    </article>
  );
}
