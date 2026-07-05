import productionJobs from '../data/productionJobs.json';
import jobTemplates from '../data/jobTemplates.json';
import type { JobTemplate, ProductionJob } from '../types';

const jobs = productionJobs as ProductionJob[];
const templates = jobTemplates as JobTemplate[];

export function Jobs() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Production Jobs</p>
          <h2>Machine roadmap from scene actions to final MP4</h2>
        </div>
        <button className="primary-button">Run Next Job</button>
      </div>

      <div className="grid stats-grid">
        <div className="stat-card"><div><p>Active Jobs</p><strong>{jobs.length}</strong><span>roadmap cards</span></div></div>
        <div className="stat-card"><div><p>Templates</p><strong>{templates.length}</strong><span>reusable actions</span></div></div>
        <div className="stat-card"><div><p>Assembly</p><strong>Blocked</strong><span>needs approved shots</span></div></div>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Automation Boundary</p>
        <h2>Human approves. Machine repeats.</h2>
        <p className="body-copy">The machine can generate keyframes, prepare scripts and assemble video. Human review decides what becomes canon.</p>
      </div>

      <div className="section-header">
        <div>
          <p className="eyebrow">Active Production Jobs</p>
          <h2>Pilot episode roadmap</h2>
        </div>
      </div>

      <div className="page-stack">
        {jobs.map((job) => (
          <article className="card" key={job.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{job.stage} · {job.owner}</p>
                <h3>{job.title}</h3>
              </div>
              <span className="status-badge">{job.status}</span>
            </div>
            <div className="spec-grid">
              <div><span>Input</span><p>{job.input}</p></div>
              <div><span>Output</span><p>{job.output}</p></div>
            </div>
            <div className="dialogue-box">
              <p className="eyebrow">Checklist</p>
              {job.checklist.map((item) => <p key={item}>• {item}</p>)}
            </div>
          </article>
        ))}
      </div>

      <div className="section-header">
        <div>
          <p className="eyebrow">Job Templates</p>
          <h2>Reusable scene action blueprints</h2>
        </div>
      </div>

      <div className="grid two-col">
        {templates.map((template) => (
          <article className="card" key={template.id}>
            <div className="card-header">
              <div>
                <p className="eyebrow">{template.stage}</p>
                <h3>{template.label}</h3>
              </div>
              <button className="ghost-button">Use Template</button>
            </div>
            <p className="body-copy">{template.description}</p>
            <div className="dialogue-box">
              <p className="eyebrow">Input Sources</p>
              {template.input_sources.map((source) => <p key={source}>• {source}</p>)}
            </div>
            <div className="prompt-box">{template.output_folder}</div>
            <div className="dialogue-box">
              <p className="eyebrow">Checklist</p>
              {template.checklist.map((item) => <p key={item}>• {item}</p>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
