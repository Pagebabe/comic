import episodes from '../data/episodes.json';
import builderScenes from '../data/episodeBuilderScenes.json';
import tvShots from '../data/tvShots.json';
import locations from '../data/locations.json';
import type { Episode, EpisodeBuilderScene, Location, TvShot } from '../types';

const episodeData = episodes as Episode[];
const scenes = builderScenes as EpisodeBuilderScene[];
const shots = tvShots as TvShot[];
const locationData = locations as Location[];

function getSceneShots(scene: EpisodeBuilderScene) {
  return scene.tv_shot_ids.map((id) => shots.find((shot) => shot.id === id)).filter(Boolean) as TvShot[];
}

function getLocationName(locationId: string) {
  return locationData.find((location) => location.id === locationId)?.name ?? locationId;
}

export function EpisodeBuilder() {
  const activeEpisode = episodeData[0];
  const activeScenes = scenes.filter((scene) => scene.episode_id === activeEpisode.id);
  const totalShots = activeScenes.reduce((sum, scene) => sum + scene.tv_shot_ids.length, 0);

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Episode Builder</p>
          <h2>{activeEpisode.title}</h2>
        </div>
        <button className="primary-button">Create New Scene</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Scenes</p><strong>{activeScenes.length}</strong><span>story blocks</span></div></div>
        <div className="stat-card"><div><p>TV Shots</p><strong>{totalShots}</strong><span>directed shots</span></div></div>
        <div className="stat-card"><div><p>Format</p><strong>60s</strong><span>mini cartoon episode</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Builder Logic</p>
        <h2>Episode → Scenes → TV Shots → Keyframes → Animation</h2>
        <p className="body-copy">This page is the missing middle layer. Scenes define story function, conflict, punchline, required assets and continuity checks before the machine generates keyframes or video shots.</p>
      </div>

      <div className="page-stack">
        {activeScenes.map((scene) => {
          const linkedShots = getSceneShots(scene);
          return (
            <article className="card" key={scene.id}>
              <div className="card-header">
                <div>
                  <p className="eyebrow">Scene {scene.scene_number} · {getLocationName(scene.location_id)}</p>
                  <h3>{scene.title}</h3>
                </div>
                <span className="status-badge">{linkedShots.length} TV shots</span>
              </div>

              <div className="spec-grid">
                <div><span>Story Function</span><p>{scene.story_function}</p></div>
                <div><span>Conflict</span><p>{scene.conflict}</p></div>
                <div><span>Punchline</span><p>{scene.punchline}</p></div>
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Emotional Turn</p>
                <p>{scene.emotional_turn}</p>
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Required Assets</p>
                {scene.required_assets.map((asset) => <p key={asset}>• {asset}</p>)}
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Continuity Checks</p>
                {scene.continuity_checks.map((check) => <p key={check}>• {check}</p>)}
              </div>

              <div className="grid two-col">
                {linkedShots.map((shot) => (
                  <div className="card scene-card" key={shot.id}>
                    <p className="eyebrow">{shot.timecode} · {shot.shot_type}</p>
                    <h3>{shot.action}</h3>
                    <p>{shot.camera}</p>
                    <small>{shot.animation}</small>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
