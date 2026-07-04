import episodes from '../data/episodes.json';
import { EpisodeCard } from '../components/EpisodeCard';
import type { Episode } from '../types';

const episodeData = episodes as Episode[];

export function Episodes() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Episode Builder</p>
          <h2>Season roadmap for small comic videos</h2>
        </div>
        <button className="ghost-button">New Episode</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Format Lock</p>
        <h2>4-8 panels per episode</h2>
        <p className="body-copy">Each episode should stay short, readable and repeatable: one Berlin problem, one Rico misunderstanding, one escalation, one punchline.</p>
      </div>

      {episodeData.map((episode) => <EpisodeCard key={episode.id} episode={episode} />)}

      <div className="section-header">
        <div>
          <p className="eyebrow">Active Pilot Scenes</p>
          <h2>{episodeData[0].title}</h2>
        </div>
      </div>
      <div className="grid four-col">
        {episodeData[0].scenes.map((scene) => (
          <div className="card scene-card" key={scene.scene_number}>
            <p className="eyebrow">Scene {scene.scene_number}</p>
            <h3>{scene.location}</h3>
            <p>{scene.action}</p>
            <small>{scene.dialogue}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
