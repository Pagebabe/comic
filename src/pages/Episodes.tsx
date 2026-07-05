import { episodes, scenes, panels, characters, locations } from '../data/pilotData';

export function Episodes() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Episode Builder</p>
          <h2>Typed pilot episode from Comic Factory seed data</h2>
        </div>
        <a className="ghost-link" href="#/panel-factory">Open Panels</a>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Format Lock</p>
        <h2>One pilot, six scenes, thirty panels</h2>
        <p className="body-copy">The current goal is not a full season. The goal is one clean pilot that can move from story data into prompts, review and export.</p>
      </div>

      {episodes.map((episode) => {
        const episodeScenes = scenes
          .filter((scene) => episode.sceneIds.includes(scene.id))
          .sort((a, b) => a.order - b.order);
        const episodePanels = panels.filter((panel) => episodeScenes.some((scene) => scene.id === panel.sceneId));
        const episodeCharacters = characters.filter((character) => episode.characterIds.includes(character.id));
        const episodeLocations = locations.filter((location) => episode.locationIds.includes(location.id));

        return (
          <article className="hero-card" key={episode.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{episode.seriesTitle} · {episode.status}</p>
                <h2>{episode.title}</h2>
              </div>
              <span className="status-badge status-active">{episodeScenes.length} scenes · {episodePanels.length} panels</span>
            </div>
            <p className="body-copy">{episode.logline}</p>
            <div className="chips">
              {episodeCharacters.map((character) => <span key={character.id}>{character.name}</span>)}
              {episodeLocations.map((location) => <span key={location.id}>{location.name}</span>)}
            </div>
          </article>
        );
      })}

      <div className="section-header">
        <div>
          <p className="eyebrow">Active Pilot Scenes</p>
          <h2>{episodes[0].title}</h2>
        </div>
      </div>

      <div className="grid three-col">
        {scenes
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((scene) => {
            const location = locations.find((item) => item.id === scene.locationId);
            const scenePanels = panels.filter((panel) => panel.sceneId === scene.id);
            const placeholders = scenePanels.filter((panel) => panel.visualDescription.includes('placeholder')).length;

            return (
              <div className="card scene-card" key={scene.id}>
                <p className="eyebrow">Scene {scene.order} · {location?.name ?? scene.locationId}</p>
                <h3>{scene.title}</h3>
                <p>{scene.summary}</p>
                <small><strong>Conflict:</strong> {scene.conflict}</small>
                <small><strong>Punchline:</strong> {scene.punchline}</small>
                <div className="chips">
                  <span>{scenePanels.length} panels</span>
                  <span>{placeholders} placeholders</span>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
