import type { Episode } from '../types';
import { StatusBadge } from './StatusBadge';

export function EpisodeCard({ episode }: { episode: Episode }) {
  return (
    <article className="card episode-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">{episode.format}</p>
          <h3>{episode.title}</h3>
        </div>
        <StatusBadge status={episode.status} />
      </div>
      <p className="body-copy">{episode.logline}</p>
      <div className="three-col">
        <div><span>Hook</span><p>{episode.hook}</p></div>
        <div><span>Conflict</span><p>{episode.conflict}</p></div>
        <div><span>Ending</span><p>{episode.ending}</p></div>
      </div>
      <button className="ghost-button">Generate 4 Scenes</button>
    </article>
  );
}
