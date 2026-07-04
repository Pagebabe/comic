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
          <h2>Story first. Panels later.</h2>
        </div>
        <button className="ghost-button">New Episode</button>
      </div>
      {episodeData.map((episode) => <EpisodeCard key={episode.id} episode={episode} />)}
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
