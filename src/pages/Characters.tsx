import characters from '../data/characters.json';
import characterProductionSheets from '../data/characterProductionSheets.json';
import loraTrainingSheets from '../data/loraTrainingSheets.json';
import { CharacterCard } from '../components/CharacterCard';
import type { Character, CharacterProductionSheet, LoraTrainingSheet } from '../types';

const characterData = characters as Character[];
const sheetData = characterProductionSheets as CharacterProductionSheet[];
const loraData = loraTrainingSheets as LoraTrainingSheet[];

export function Characters() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Character Bible</p>
          <h2>Recurring cast, locked rules</h2>
        </div>
        <button className="ghost-button">Add Character</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Production Sheets</p>
        <h2>{sheetData.length} video-ready sheets · {loraData.length} LoRA-ready sheets</h2>
        <p className="body-copy">Core figures now have generator prompts, voice direction, fatal error checks, trigger tokens, turnaround shots and dataset rules. Frames stay clean; voices and subtitles are added later.</p>
      </div>

      <div className="grid two-col">
        {characterData.map((character) => {
          const sheet = sheetData.find((item) => item.character_id === character.id);
          const lora = loraData.find((item) => item.character_id === character.id);
          return <CharacterCard key={character.id} character={character} sheet={sheet} lora={lora} />;
        })}
      </div>
    </section>
  );
}
