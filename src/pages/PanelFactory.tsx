import shots from '../data/shots.json';
import styleGuide from '../data/styleGuide.json';
import type { Shot, StyleGuide } from '../types';

const shotData = shots as Shot[];
const style = styleGuide as StyleGuide;

export function PanelFactory() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Panel Factory</p>
          <h2>Clean comic frames for video production</h2>
        </div>
        <button className="primary-button">Build Prompt Pack</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Factory Rule</p>
        <h2>One panel, one readable joke</h2>
        <p className="body-copy">Each panel becomes a clean vertical frame. Dialogue is only used for voice and subtitles, never as text inside the generated image.</p>
      </div>

      <div className="page-stack">
        {shotData.map((shot) => (
          <article className="card prompt-card" key={shot.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">Panel {shot.shot_number} · Scene {shot.scene_number} · Risk {shot.risk}</p>
                <h3>{shot.location}</h3>
              </div>
              <button className="ghost-button">Queue Variants</button>
            </div>

            <div className="spec-grid">
              <div><span>Action</span><p>{shot.action}</p></div>
              <div><span>Camera</span><p>{shot.camera}</p></div>
              <div><span>Emotion</span><p>{shot.emotion}</p></div>
            </div>

            <div className="dialogue-box">
              <p className="eyebrow">Voice / Subtitle Lines</p>
              {shot.dialogue.map((line) => <p key={`${shot.id}-${line.character}-${line.line}`}><strong>{line.character}:</strong> {line.line}</p>)}
            </div>

            <label>Positive Prompt</label>
            <textarea readOnly value={`${shot.prompt}\n\nStyle: ${style.name}.\nClean frame: no speech bubbles, no readable dialogue, no fake lettering.`} />

            <label>Negative Prompt</label>
            <textarea readOnly value={`${shot.negative_prompt}, speech bubbles, readable dialogue, fake lettering, fake subtitles`} />
          </article>
        ))}
      </div>
    </section>
  );
}
