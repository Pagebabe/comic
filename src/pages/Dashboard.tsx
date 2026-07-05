import { CheckCircle2, Clapperboard, Layers3, ListChecks, Map, ShieldAlert } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { characters, episodes, locations, panels, scenes } from '../data/pilotData';

export function Dashboard() {
  const approvedPanels = panels.filter((panel) => panel.status === 'approved').length;
  const needsFixPanels = panels.filter((panel) => panel.status === 'needs_fix').length;
  const renderedPanels = panels.filter((panel) => panel.status === 'rendered').length;
  const draftPanels = panels.filter((panel) => panel.status === 'draft').length;
  const promptReadyPanels = panels.filter((panel) => panel.status === 'prompt_ready').length;
  const activeEpisode = episodes[0];

  return (
    <section className="page-stack">
      <div className="grid stats-grid">
        <StatCard label="Characters" value={characters.length} helper="typed pilot cast" icon={Layers3} />
        <StatCard label="Locations" value={locations.length} helper="locked recurring sets" icon={Map} />
        <StatCard label="Episodes" value={episodes.length} helper="active seed pilot" icon={Clapperboard} />
        <StatCard label="Scenes" value={scenes.length} helper={`${panels.length} storyboard panels`} icon={ListChecks} />
        <StatCard label="Approved Panels" value={approvedPanels} helper={`${renderedPanels} rendered`} icon={CheckCircle2} />
        <StatCard label="Needs Fix" value={needsFixPanels} helper={`${draftPanels} draft · ${promptReadyPanels} prompt ready`} icon={ShieldAlert} />
      </div>

      <div className="hero-card">
        <p className="eyebrow">Current Production</p>
        <h2>{activeEpisode.seriesTitle}: {activeEpisode.title}</h2>
        <p>{activeEpisode.logline}</p>
        <div className="pipeline-bar">
          <span>Story</span><span>Scenes</span><span>Panels</span><span>Prompts</span><span>Export</span>
        </div>
      </div>

      <div className="section-header">
        <div>
          <p className="eyebrow">Pilot Seed Status</p>
          <h2>Comic Factory data is now the source</h2>
        </div>
        <a className="ghost-link" href="#/panel-factory">Open Panel Factory</a>
      </div>

      <div className="grid three-col">
        <div className="card">
          <p className="eyebrow">Cast</p>
          <h3>{characters.map((character) => character.name).join(' · ')}</h3>
          <p className="body-copy">Small MVP cast for the first production loop. More characters come after this pilot works end to end.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Storyboard</p>
          <h3>{scenes.length} scenes · {panels.length} panels</h3>
          <p className="body-copy">The board is intentionally local and typed. Render APIs stay out until the panel workflow is clean.</p>
        </div>
        <div className="card">
          <p className="eyebrow">Next Gate</p>
          <h3>Replace placeholders</h3>
          <p className="body-copy">Panels 18-30 are marked draft placeholders. They must be locked before real image generation.</p>
        </div>
      </div>
    </section>
  );
}
