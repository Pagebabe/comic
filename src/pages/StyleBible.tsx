import styleGuide from '../data/styleGuide.json';
import type { StyleGuide } from '../types';

const style = styleGuide as StyleGuide;

function RuleList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card rule-card">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

export function StyleBible() {
  return (
    <section className="page-stack">
      <div className="hero-card warning-card">
        <p className="eyebrow">Style Bible</p>
        <h2>{style.name}</h2>
        <p>{style.line_style}</p>
        <strong>Own cartoon DNA only. No direct copy of existing shows, artists or protected characters.</strong>
      </div>

      <div className="card">
        <h3>Color Palette</h3>
        <div className="chips color-chips">
          {style.color_palette.map((color) => <span key={color}>{color}</span>)}
        </div>
      </div>

      <div className="grid two-col">
        <RuleList title="Character Rules" items={style.character_rules} />
        <RuleList title="Background Rules" items={style.background_rules} />
        <RuleList title="Camera Rules" items={style.camera_rules} />
        <RuleList title="Negative Rules" items={style.negative_rules} />
      </div>
    </section>
  );
}
