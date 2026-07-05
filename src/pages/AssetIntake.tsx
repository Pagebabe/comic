import template from '../data/assetIntakeTemplate.json';

const intakeTemplate = template as {
  name: string;
  purpose: string;
  intake_root: string;
  fields: string[];
  allowed_status: string[];
  rules: string[];
};

function ListBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="dialogue-box">
      <p className="eyebrow">{title}</p>
      {items.map((item) => <p key={item}>• {item}</p>)}
    </div>
  );
}

export function AssetIntake() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Asset Intake</p>
          <h2>{intakeTemplate.name}</h2>
        </div>
        <button className="primary-button">Create Intake</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Root</p><strong>intake</strong><span>{intakeTemplate.intake_root}</span></div></div>
        <div className="stat-card"><div><p>Fields</p><strong>{intakeTemplate.fields.length}</strong><span>tracking keys</span></div></div>
        <div className="stat-card"><div><p>Status Types</p><strong>{intakeTemplate.allowed_status.length}</strong><span>review states</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>{intakeTemplate.purpose}</h2>
        <p className="body-copy">This is the bridge between generated files and TV Review. A file can exist and still be unapproved.</p>
      </div>

      <div className="grid two-col">
        <ListBox title="Fields" items={intakeTemplate.fields} />
        <ListBox title="Allowed Status" items={intakeTemplate.allowed_status} />
        <ListBox title="Rules" items={intakeTemplate.rules} />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Local Command</p>
            <h3>Create Asset Intake File</h3>
          </div>
        </div>
        <div className="prompt-box">npm run create:asset-intake</div>
        <p className="body-copy">Output: outputs/pilot/intake/ep001_asset_intake.json</p>
      </div>
    </section>
  );
}
