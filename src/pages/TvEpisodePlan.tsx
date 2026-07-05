import tvShots from '../data/tvShots.json';
import type { TvShot } from '../types';

const shots = tvShots as TvShot[];
const totalDuration = shots.reduce((sum, shot) => sum + shot.duration, 0);

export function TvEpisodePlan() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">TV Episode Plan</p>
          <h2>Die Entkommerzialisierungsgebühr as a 60-second cartoon episode</h2>
        </div>
        <button className="primary-button">Build TV Shot Pack</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>TV Shots</p><strong>{shots.length}</strong><span>key moments</span></div></div>
        <div className="stat-card"><div><p>Runtime</p><strong>{totalDuration}s</strong><span>TV pilot target</span></div></div>
        <div className="stat-card"><div><p>Format</p><strong>9:16</strong><span>vertical cartoon episode</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">TV Feeling Rule</p>
        <h2>Not four still panels. Eleven directed shots.</h2>
        <p className="body-copy">Each shot has camera movement, animation notes, voice lines and sound cues. Keyframes stay clean: no speech bubbles, no readable image text and no fake subtitles.</p>
      </div>

      <div className="page-stack">
        {shots.map((shot) => (
          <article className="card" key={shot.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{shot.timecode} · {shot.shot_type} · {shot.duration}s</p>
                <h3>{shot.action}</h3>
              </div>
              <span className="status-badge">{shot.location}</span>
            </div>

            <div className="spec-grid">
              <div><span>Camera</span><p>{shot.camera}</p></div>
              <div><span>Animation</span><p>{shot.animation}</p></div>
              <div><span>Characters</span><p>{shot.characters.join(', ')}</p></div>
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Voice</p>
              {shot.voice.length === 0 ? <p>No line. Let the acting and sound carry it.</p> : shot.voice.map((line) => (
                <p key={`${shot.id}-${line.character}-${line.line}`}><strong>{line.character}:</strong> {line.line}</p>
              ))}
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Sound Design</p>
              {shot.sound.map((cue) => <p key={cue}>• {cue}</p>)}
            </div>

            <label>Keyframe Prompt</label>
            <textarea readOnly value={shot.prompt} />
            <label>Negative Prompt</label>
            <textarea readOnly value={shot.negative_prompt} />
          </article>
        ))}
      </div>
    </section>
  );
}
