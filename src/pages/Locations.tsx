import locations from '../data/locations.json';
import locationProductionSheets from '../data/locationProductionSheets.json';
import type { Location, LocationProductionSheet } from '../types';
import { StatusBadge } from '../components/StatusBadge';

const locationData = locations as Location[];
const sheetData = locationProductionSheets as LocationProductionSheet[];

export function Locations() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Location Bible</p>
          <h2>Berlin-Welt, Hauslogik und wiederkehrende Sets</h2>
        </div>
        <button className="ghost-button">Add Location</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Production Sheets</p>
        <h2>{sheetData.length} reusable set sheets</h2>
        <p className="body-copy">Core locations now have establishing prompts, detail prompts, continuity rules and reusable shot ideas for the comic video pipeline.</p>
      </div>

      <div className="grid two-col">
        {locationData.map((location) => (
          <article className="card character-card" key={location.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{location.type} · Risk {location.danger_level}</p>
                <h3>{location.name}</h3>
              </div>
              <StatusBadge status={location.status} />
            </div>
            <p className="body-copy">{location.description}</p>
            <div className="spec-grid">
              <div><span>Story Function</span><p>{location.story_function}</p></div>
              <div><span>Visual Rules</span><p>{location.visual_rules.join(' · ')}</p></div>
              <div><span>Recurring Props</span><p>{location.recurring_props.join(' · ')}</p></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
