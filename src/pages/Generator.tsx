import shots from '../data/shots.json';
import styleGuide from '../data/styleGuide.json';
import type { Shot, StyleGuide } from '../types';

const shotData = shots as Shot[];
const style = styleGuide as StyleGuide;

export function Generator() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Panel / Shot Generator</p>
          <h2>Editable prompt cards</h2>
        </div>
        <button className="primary-button">Generate Variants</button>
      </div>
      <div className="generator-layout">
        <div className="card sticky-card">
          <h3>Prompt Ingredients</h3>
          <p><strong>Style:</strong> {style.name}</p>
          <p><strong>Output:</strong> 1080x1920 vertical frame</p>
          <p><strong>Method:</strong> one shot = 4–20 variants, depending on risk</p>
          <div className="chips">
            <span>Character Bible</span>
            <span>Style Bible</span>
            <span>Camera</span>
            <span>Risk Score</span>
          </div>
        </div>
        <div className="page-stack">
          {shotData.map((shot) => (
            <article className="card prompt-card" key={shot.id}>
              <div className="card-header">
                <div>
                  <p className="eyebrow">Shot {shot.shot_number} · Risk {shot.risk}</p>
                  <h3>{shot.location}</h3>
                </div>
                <button className="ghost-button">Edit Prompt</button>
              </div>
              <label>Positive Prompt</label>
              <textarea value={shot.prompt} readOnly />
              <label>Negative Prompt</label>
              <textarea value={shot.negative_prompt} readOnly />
              <div className="shot-meta">
                <span>Seed: {shot.seed}</span>
                <span>Camera: {shot.camera}</span>
                <span>Characters: {shot.characters.join(', ')}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
