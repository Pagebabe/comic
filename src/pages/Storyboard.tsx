import episodes from '../data/episodes.json';
import shots from '../data/shots.json';
import { ShotCard } from '../components/ShotCard';
import type { Episode, Shot } from '../types';

const episodeData = episodes as Episode[];
const shotData = shots as Shot[];

export function Storyboard() {
  const episode = episodeData[0];
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Comic Video Board</p>
          <h2>{episode.title}</h2>
        </div>
        <button className="ghost-button">Split Into Panels</button>
      </div>
      <div className="hero-card warning-card">
        <p className="eyebrow">Production Rule</p>
        <h2>Kleine Comics, aber video-ready</h2>
        <p className="body-copy">Jede Folge besteht aus 4-8 klaren Panels/Shots. Bilder bleiben ohne Sprechblasen. Dialog wird als Voice/TTS, Subtitle und Schnitt-Layer produziert.</p>
      </div>
      <div className="timeline">
        {episode.scenes.map((scene) => {
          const sceneShots = shotData.filter((shot) => shot.scene_number === scene.scene_number);
          return (
            <div className="timeline-item" key={scene.scene_number}>
              <div className="timeline-marker">{scene.scene_number}</div>
              <div className="timeline-content">
                <div className="card">
                  <p className="eyebrow">{scene.location}</p>
                  <h3>{scene.action}</h3>
                  <p>{scene.dialogue}</p>
                </div>
                <div className="grid two-col">
                  {sceneShots.map((shot) => <ShotCard key={shot.id} shot={shot} compact />)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
