import episodes from '../data/episodes.json';
import shots from '../data/shots.json';
import characterProductionSheets from '../data/characterProductionSheets.json';
import type { CharacterProductionSheet, Episode, Shot } from '../types';

const episodeData = episodes as Episode[];
const shotData = shots as Shot[];
const sheetData = characterProductionSheets as CharacterProductionSheet[];

function getVoiceDirection(characterName: string) {
  const normalized = characterName.toLowerCase().replaceAll(' ', '_');
  const sheet = sheetData.find((item) => item.character_id.includes(normalized.split('_')[0]));
  return sheet?.voice_direction ?? 'Use natural delivery. Keep timing short and readable.';
}

export function VoiceSubtitles() {
  const totalLines = shotData.reduce((sum, shot) => sum + shot.dialogue.length, 0);

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Voice / Subtitles</p>
          <h2>Dialogue leaves the image and becomes audio timing</h2>
        </div>
        <button className="primary-button">Export Voice Script</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Episode</p><strong>{episodeData[0].title}</strong><span>active script</span></div></div>
        <div className="stat-card"><div><p>Panels</p><strong>{shotData.length}</strong><span>clean frame targets</span></div></div>
        <div className="stat-card"><div><p>Lines</p><strong>{totalLines}</strong><span>voice/subtitle lines</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Hard Rule</p>
        <h2>Text belongs here, not inside the image</h2>
        <p className="body-copy">This page is the source for TTS, subtitles and edit timing. Generated panels remain clean and reusable.</p>
      </div>

      <div className="page-stack">
        {shotData.map((shot) => (
          <article className="card" key={shot.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">Panel {shot.shot_number} · {shot.duration}s</p>
                <h3>{shot.location}</h3>
              </div>
              <span className="status-badge">{shot.dialogue.length} lines</span>
            </div>
            <div className="dialogue-box">
              {shot.dialogue.length === 0 ? <p>No voice line.</p> : shot.dialogue.map((line) => (
                <div key={`${shot.id}-${line.character}-${line.line}`}>
                  <p><strong>{line.character}:</strong> {line.line}</p>
                  <small>{getVoiceDirection(line.character)}</small>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
