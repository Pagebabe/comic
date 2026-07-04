import storyBible from '../data/storyBible.json';
import type { StoryBible as StoryBibleType } from '../types';

const story = storyBible as StoryBibleType;

function RuleBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card rule-card">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

export function StoryBible() {
  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Series Bible</p>
        <h2>{story.title}</h2>
        <p>{story.subtitle}</p>
        <p className="body-copy">{story.premise}</p>
      </div>

      <div className="grid two-col">
        <div className="card">
          <p className="eyebrow">Format</p>
          <h3>Comic-Video-Maschine</h3>
          <p className="body-copy">{story.format}</p>
        </div>
        <div className="card warning-card">
          <p className="eyebrow">Hard Rule</p>
          <h3>Keine Sprechblasen</h3>
          <p className="body-copy">{story.no_speech_bubble_rule}</p>
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Core Engine</p>
        <h3>Warum die Serie funktioniert</h3>
        <p className="body-copy">{story.core_engine}</p>
      </div>

      <div className="grid two-col">
        <RuleBlock title="Tone Rules" items={story.tone_rules} />
        <RuleBlock title="World Rules" items={story.world_rules} />
        <RuleBlock title="Recurring Conflicts" items={story.recurring_conflicts} />
        <RuleBlock title="Future Topics" items={story.future_topics} />
        <RuleBlock title="Forbidden Rules" items={story.forbidden_rules} />
      </div>
    </section>
  );
}
