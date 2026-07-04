import { CheckCircle2, Clapperboard, Layers3, ShieldAlert } from 'lucide-react';
import characters from '../data/characters.json';
import episodes from '../data/episodes.json';
import { StatCard } from '../components/StatCard';
import { ShotCard } from '../components/ShotCard';
import { useShotStore } from '../hooks/useShotStore';
import type { Character, Episode } from '../types';

const characterData = characters as Character[];
const episodeData = episodes as Episode[];

export function Dashboard() {
  const { shots } = useShotStore();
  const approvedShots = shots.filter((shot) => shot.status === 'approved').length;
  const needsFix = shots.filter((shot) => shot.status === 'needs_fix').length;

  return (
    <section className="page-stack">
      <div className="grid stats-grid">
        <StatCard label="Characters" value={characterData.length} helper="locked into bible" icon={Layers3} />
        <StatCard label="Episodes" value={episodeData.length} helper="pilot in draft" icon={Clapperboard} />
        <StatCard label="Approved Shots" value={approvedShots} helper="ready for assembly" icon={CheckCircle2} />
        <StatCard label="Needs Fix" value={needsFix} helper="human review required" icon={ShieldAlert} />
      </div>

      <div className="hero-card">
        <p className="eyebrow">Current Production</p>
        <h2>{episodeData[0].title}</h2>
        <p>{episodeData[0].logline}</p>
        <div className="pipeline-bar">
          <span>Script</span><span>Shots</span><span>Variants</span><span>Review</span><span>Export</span>
        </div>
      </div>

      <div className="section-header">
        <div>
          <p className="eyebrow">Shot Queue</p>
          <h2>Active production cards</h2>
        </div>
        <a className="ghost-link" href="#/review">Open Review</a>
      </div>
      <div className="grid two-col">
        {shots.slice(0, 4).map((shot) => <ShotCard key={shot.id} shot={shot} compact />)}
      </div>
    </section>
  );
}
