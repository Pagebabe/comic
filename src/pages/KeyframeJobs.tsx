import scenes from '../data/episodeBuilderScenes.json';
import tvShots from '../data/tvShots.json';
import type { EpisodeBuilderScene, TvShot } from '../types';

const builderScenes = scenes as EpisodeBuilderScene[];
const shots = tvShots as TvShot[];

function getSceneShots(scene: EpisodeBuilderScene) {
  return scene.tv_shot_ids.map((id) => shots.find((shot) => shot.id === id)).filter(Boolean) as TvShot[];
}

function getJobPath(sceneId: string, shotId: string) {
  return `outputs/pilot/jobs/keyframes/${sceneId}/keyframe_${shotId}.json`;
}

function getOutputTarget(scene: EpisodeBuilderScene, shot: TvShot) {
  return `outputs/pilot/keyframes/${scene.id}/${scene.episode_id}_${scene.id}_${shot.id}_keyframe_v1.png`;
}

export function KeyframeJobs() {
  const totalJobs = builderScenes.reduce((sum, scene) => sum + scene.tv_shot_ids.length, 0);

  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Keyframe Jobs</p>
          <h2>Concrete image jobs generated from scenes and TV shots</h2>
        </div>
        <button className="primary-button">Create Keyframe Jobs</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Scenes</p><strong>{builderScenes.length}</strong><span>pilot blocks</span></div></div>
        <div className="stat-card"><div><p>Keyframe Jobs</p><strong>{totalJobs}</strong><span>one per TV shot</span></div></div>
        <div className="stat-card"><div><p>Script</p><strong>npm</strong><span>run create:keyframe-jobs</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Agent Contract</p>
        <h2>One JSON job = one clean keyframe candidate.</h2>
        <p className="body-copy">Each job carries the shot prompt, negative prompt, beat goal, continuity checks, output target and manifest target. An image agent should complete the job, save the image, then update review metadata.</p>
      </div>

      <div className="page-stack">
        {builderScenes.map((scene) => {
          const linkedShots = getSceneShots(scene);
          return (
            <article className="card" key={scene.id}>
              <div className="card-header">
                <div>
                  <p className="eyebrow">{scene.id}</p>
                  <h3>{scene.title}</h3>
                </div>
                <span className="status-badge">{linkedShots.length} jobs</span>
              </div>

              <div className="dialogue-box">
                <p className="eyebrow">Beat Goal</p>
                <p>{scene.beat_goal}</p>
              </div>

              <div className="grid two-col">
                {linkedShots.map((shot) => (
                  <div className="card scene-card" key={shot.id}>
                    <p className="eyebrow">{shot.timecode} · {shot.shot_type}</p>
                    <h3>{shot.id}</h3>
                    <p>{shot.action}</p>
                    <div className="prompt-box">{getJobPath(scene.id, shot.id)}</div>
                    <label>Output Target</label>
                    <textarea readOnly value={getOutputTarget(scene, shot)} />
                    <label>Prompt</label>
                    <textarea readOnly value={shot.prompt} />
                    <label>Negative Prompt</label>
                    <textarea readOnly value={shot.negative_prompt} />
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
