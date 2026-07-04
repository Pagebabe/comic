import characters from '../data/characters.json';
import characterProductionSheets from '../data/characterProductionSheets.json';
import { CharacterCard } from '../components/CharacterCard';
import type { Character, CharacterProductionSheet } from '../types';

const characterData = characters as Character[];
const sheetData = characterProductionSheets as CharacterProductionSheet[];

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
        <h2>{sheetData.length} video-ready character sheets</h2>
        <p className="body-copy">Core figures now have generator prompts, voice direction, animation notes and fatal error checks. Frames stay clean; voices and subtitles are added later.</p>
      </div>

      <div className="grid two-col">
        {characterData.map((character) => <CharacterCard key={character.id} character={character} />)}
      </div>
    </section>
  );
}
