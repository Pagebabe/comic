import { CheckCircle2, Clapperboard, Layers3, Map, ShieldAlert } from 'lucide-react';
import characters from '../data/characters.json';
import episodes from '../data/episodes.json';
import locations from '../data/locations.json';
import characterProductionSheets from '../data/characterProductionSheets.json';
import locationProductionSheets from '../data/locationProductionSheets.json';
import { StatCard } from '../components/StatCard';
import { ShotCard } from '../components/ShotCard';
import { useShotStore } from '../hooks/useShotStore';
import type { Character, CharacterProductionSheet, Episode, Location, LocationProductionSheet } from '../types';

const characterData = characters as Character[];
const episodeData = episodes as Episode[];
const locationData = locations as Location[];
const characterSheets = characterProductionSheets as CharacterProductionSheet[];
const locationSheets = locationProductionSheets as LocationProductionSheet[];

export function Dashboard() {
  const { shots } = useShotStore();
  const approvedPanels = shots.filter((shot) => shot.status === 'approved').length;
  const needsFix = shots.filter((shot) => shot.status === 'needs_fix').length;

  return (
    <section className="page-stack">
      <div className="grid stats-grid">
        <StatCard label="Characters" value={characterData.length} helper={`${characterSheets.length} production sheets`} icon={Layers3} />
        <StatCard label="Locations" value={locationData.length} helper={`${locationSheets.length} reusable set sheets`} icon={Map} />
        <StatCard label="Episodes" value={episodeData.length} helper="season roadmap" icon={Clapperboard} />
        <StatCard label="Approved Panels" value={approvedPanels} helper="ready for assembly" icon={CheckCircle2} />
        <StatCard label="Needs Fix" value={needsFix} helper="human review required" icon={ShieldAlert} />
      </div>

      <div className="hero-card">
        <p className="eyebrow">Current Production</p>
        <h2>{episodeData[0].title}</h2>
        <p>{episodeData[0].logline}</p>
        <div className="pipeline-bar">
          <span>Story</span><span>Panels</span><span>Clean Frames</span><span>Voice/Subs</span><span>Export</span>
        </div>
      </div>

      <div className="section-header">
        <div>
          <p className="eyebrow">Panel Queue</p>
          <h2>Active comic-video production cards</h2>
        </div>
        <a className="ghost-link" href="#/review">Open Review</a>
      </div>
      <div className="grid two-col">
        {shots.slice(0, 4).map((shot) => <ShotCard key={shot.id} shot={shot} compact />)}
      </div>
    </section>
  );
}
