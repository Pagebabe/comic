import { Captions, FileImage, FileText, Film, Mic2, PlaySquare } from 'lucide-react';

const exports = [
  { title: 'Final Comic Video', helper: 'MP4, 1080x1920, 30-90 seconds', icon: PlaySquare },
  { title: 'Clean Panel Pack', helper: 'Approved frames without speech bubbles', icon: FileImage },
  { title: 'Carousel Cutdown', helper: 'One clean panel per slide', icon: Film },
  { title: 'Voice Script', helper: 'Character-separated dialogue for TTS', icon: Mic2 },
  { title: 'Subtitle File', helper: 'SRT / VTT / burned captions', icon: Captions },
  { title: 'Production PDF', helper: 'Episode bible, prompts and review notes', icon: FileText }
];

const readiness = [
  'All panels approved in Review',
  'No generated frame contains speech bubbles or readable dialogue',
  'Voice lines checked on Voice/Subtitles page',
  'Subtitle safe area kept free in every panel',
  'Panel order matches Storyboard',
  'Runtime target stays under 90 seconds'
];

export function Export() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Export</p>
          <h2>Output targets for small comic videos</h2>
        </div>
        <button className="primary-button">Export Episode</button>
      </div>
      <div className="grid three-col export-grid">
        {exports.map((item) => {
          const Icon = item.icon;
          return (
            <article className="card export-card" key={item.title}>
              <div className="stat-icon"><Icon size={20} /></div>
              <h3>{item.title}</h3>
              <p>{item.helper}</p>
              <button className="ghost-button">Configure</button>
            </article>
          );
        })}
      </div>
      <div className="hero-card">
        <p className="eyebrow">Next integration</p>
        <h2>FFmpeg Assembly</h2>
        <p>Approved panels become one comic video: still frames, tiny zooms, cuts, voice tracks, subtitles and sound cues. The MVP keeps the frame pipeline clean first.</p>
      </div>
      <div className="card rule-card">
        <h3>Export Readiness Checklist</h3>
        <ul>
          {readiness.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </section>
  );
}
