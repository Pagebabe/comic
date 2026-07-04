import shots from '../data/shots.json';
import type { Shot } from '../types';

const shotData = shots as Shot[];

const steps = [
  'Approve clean panel frames in Review',
  'Generate or record character voices from Voice/Subtitles',
  'Create subtitle timing per panel duration',
  'Apply small zooms, pans and cuts to still frames',
  'Layer music, room tone and sound cues',
  'Assemble 1080x1920 MP4 with FFmpeg',
  'Export panel pack, subtitle file and production PDF'
];

export function AssemblyPlan() {
  const totalSeconds = shotData.reduce((sum, shot) => sum + shot.duration, 0);

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Assembly Plan</p>
          <h2>From approved panels to finished comic video</h2>
        </div>
        <button className="primary-button">Build Assembly Job</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Panels</p><strong>{shotData.length}</strong><span>current queue</span></div></div>
        <div className="stat-card"><div><p>Runtime</p><strong>{totalSeconds}s</strong><span>estimated video length</span></div></div>
        <div className="stat-card"><div><p>Format</p><strong>9:16</strong><span>1080x1920 target</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Machine Output</p>
        <h2>Still panels, animated by editing</h2>
        <p className="body-copy">The first real version does not need full animation. It needs strong panels, small camera movement, good voice timing, subtitles and sound. That is enough for a repeatable comic-video pipeline.</p>
      </div>

      <div className="grid two-col">
        {steps.map((step, index) => (
          <article className="card" key={step}>
            <p className="eyebrow">Step {index + 1}</p>
            <h3>{step}</h3>
          </article>
        ))}
      </div>

      <div className="page-stack">
        {shotData.map((shot) => (
          <article className="card" key={shot.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">Panel {shot.shot_number} · {shot.duration}s</p>
                <h3>{shot.location}</h3>
              </div>
              <span className="status-badge">{shot.status}</span>
            </div>
            <div className="spec-grid">
              <div><span>Move</span><p>slow push-in or small handheld pan</p></div>
              <div><span>Audio</span><p>voice lines plus subtle room tone</p></div>
              <div><span>Subtitle</span><p>bottom safe area, added after image generation</p></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
