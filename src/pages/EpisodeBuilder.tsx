import episodes from '../data/episodes.json';
import builderScenes from '../data/episodeBuilderScenes.json';
import tvShots from '../data/tvShots.json';
import locations from '../data/locations.json';
import type { Episode, EpisodeBuilderScene, Location, SceneAction, TvShot } from '../types';

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

function NoteList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="dialogue-box">
      <p className="eyebrow">{title}</p>
      {items.map((item) => <p key={item}>• {item}</p>)}
    </div>
  );
}

function SceneActionCard({ action }: { action: SceneAction }) {
  return (
    <div className="card scene-card">
      <p className="eyebrow">{action.stage}</p>
      <h3>{action.label}</h3>
      <p>{action.description}</p>
      <small>Output: {action.output}</small>
      <button className="ghost-button">{action.label}</button>
    </div>
  );
}

export function EpisodeBuilder() {
  const activeEpisode = episodeData[0];
  const activeScenes = scenes.filter((scene) => scene.episode_id === activeEpisode.id);
  const totalShots = activeScenes.reduce((sum, scene) => sum + scene.tv_shot_ids.length, 0);
  const totalActions = activeScenes.reduce((sum, scene) => sum + scene.scene_actions.length, 0);

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
        <div className="stat-card"><div><p>Actions</p><strong>{totalActions}</strong><span>scene tasks</span></div></div>
        <div className="stat-card"><div><p>Format</p><strong>60s</strong><span>mini cartoon episode</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Builder Logic</p>
        <h2>Episode → Scenes → Actions → TV Shots → Keyframes → Animation</h2>
        <p className="body-copy">This page is the missing middle layer. Scenes define beat goal, setup, escalation, punchline, acting notes, editing notes, production actions and continuity checks before the machine generates keyframes or video shots.</p>
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
                <span className="status-badge">{linkedShots.length} TV shots · {scene.scene_actions.length} actions</span>
              </div>

              <div className="hero-card">
                <p className="eyebrow">Beat Goal</p>
                <h2>{scene.beat_goal}</h2>
              </div>

              <div className="spec-grid">
                <div><span>Story Function</span><p>{scene.story_function}</p></div>
                <div><span>Conflict</span><p>{scene.conflict}</p></div>
                <div><span>Emotional Turn</span><p>{scene.emotional_turn}</p></div>
              </div>

              <div className="spec-grid">
                <div><span>Setup</span><p>{scene.setup}</p></div>
                <div><span>Escalation</span><p>{scene.escalation}</p></div>
                <div><span>Punchline</span><p>{scene.punchline}</p></div>
              </div>

              <div className="spec-grid">
                <div><span>Opening Frame</span><p>{scene.opening_frame}</p></div>
                <div><span>Closing Frame</span><p>{scene.closing_frame}</p></div>
              </div>

              <div className="section-header">
                <div>
                  <p className="eyebrow">Scene Actions</p>
                  <h2>Production steps</h2>
                </div>
              </div>
              <div className="grid three-col">
                {scene.scene_actions.map((action) => <SceneActionCard key={action.id} action={action} />)}
              </div>

              <div className="grid two-col">
                <NoteList title="Required Assets" items={scene.required_assets} />
                <NoteList title="Actor Notes" items={scene.actor_notes} />
                <NoteList title="Editor Notes" items={scene.editor_notes} />
                <NoteList title="Generator Notes" items={scene.generator_notes} />
                <NoteList title="Continuity Checks" items={scene.continuity_checks} />
              </div>

              <div className="section-header">
                <div>
                  <p className="eyebrow">Linked TV Shots</p>
                  <h2>Scene {scene.scene_number} shot breakdown</h2>
                </div>
              </div>

              <div className="grid two-col">
                {linkedShots.map((shot) => (
                  <div className="card scene-card" key={shot.id}>
                    <p className="eyebrow">{shot.timecode} · {shot.shot_type} · {shot.duration}s</p>
                    <h3>{shot.action}</h3>
                    <p><strong>Camera:</strong> {shot.camera}</p>
                    <p><strong>Animation:</strong> {shot.animation}</p>
                    <small>{shot.sound.join(' · ')}</small>
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
