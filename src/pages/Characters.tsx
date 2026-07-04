import characters from '../data/characters.json';
import { CharacterCard } from '../components/CharacterCard';
import type { Character } from '../types';

const characterData = characters as Character[];

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
      <div className="grid two-col">
        {characterData.map((character) => <CharacterCard key={character.id} character={character} />)}
      </div>
    </section>
  );
}
