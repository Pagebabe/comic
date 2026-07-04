import productionJobs from '../data/productionJobs.json';
import type { ProductionJob } from '../types';

const jobs = productionJobs as ProductionJob[];

export function Jobs() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Production Jobs</p>
          <h2>Machine roadmap from reference sheets to final MP4</h2>
        </div>
        <button className="primary-button">Run Next Job</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Automation Boundary</p>
        <h2>Human approves. Machine repeats.</h2>
        <p className="body-copy">The machine can generate variants, prepare scripts and assemble video. Human review decides what becomes canon.</p>
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
    </section>
  );
}
