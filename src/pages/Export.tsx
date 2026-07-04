import { Captions, FileImage, FileText, Film, Mic2, PlaySquare } from 'lucide-react';

const exports = [
  { title: 'Final 9:16 Reel', helper: 'MP4, 1080x1920, 60 seconds', icon: PlaySquare },
  { title: '4-Panel Comic', helper: 'Static PNG grid for posts', icon: FileImage },
  { title: 'Instagram Carousel', helper: 'One panel per slide', icon: Film },
  { title: 'Voice Script', helper: 'Character-separated dialogue', icon: Mic2 },
  { title: 'Subtitles', helper: 'SRT / burned captions', icon: Captions },
  { title: 'Production PDF', helper: 'Episode bible + prompts', icon: FileText }
];

export function Export() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Export</p>
          <h2>Output targets for the pilot</h2>
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
        <p>Once shots are approved, a Python/FFmpeg worker can assemble images, voice tracks, subtitles, zooms and cuts into one finished Reel. This MVP keeps it visual and mock-based first.</p>
      </div>
    </section>
  );
}
