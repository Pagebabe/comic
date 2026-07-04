import renderers from '../data/renderers.json';
import type { RendererAdapter } from '../types';

const rendererData = renderers as RendererAdapter[];

export function Renderers() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Renderers</p>
          <h2>Choose how panel jobs become images</h2>
        </div>
        <button className="primary-button">Select Renderer</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Renderer-Neutral</p>
        <h2>The dashboard is the brain, not the image model</h2>
        <p className="body-copy">Panel Factory creates jobs. A renderer creates image variants. Review decides what becomes canon. ComfyUI is optional, not the whole product.</p>
      </div>

      <div className="grid three-col">
        {rendererData.map((renderer) => (
          <article className="card" key={renderer.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{renderer.type}</p>
                <h3>{renderer.name}</h3>
              </div>
            </div>
            <p className="body-copy">{renderer.best_for}</p>
            <div className="spec-grid">
              <div><span>Input</span><p>{renderer.input}</p></div>
              <div><span>Output</span><p>{renderer.output}</p></div>
            </div>
            <div className="dialogue-box">
              <p className="eyebrow">Pros</p>
              {renderer.pros.map((item) => <p key={item}>• {item}</p>)}
            </div>
            <div className="dialogue-box">
              <p className="eyebrow">Cons</p>
              {renderer.cons.map((item) => <p key={item}>• {item}</p>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
