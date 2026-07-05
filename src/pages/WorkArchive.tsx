const archiveFiles = [
  'outputs/pilot/work-packet/archive/ep001_work_packet_archive.json',
  'outputs/pilot/work-packet/archive/SHOT_ID_TIMESTAMP.json'
];

export function WorkArchive() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Work Archive</p>
          <h2>Close Finished Work Packets</h2>
        </div>
        <button className="primary-button">Archive Packet</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Keep each finished shot packet as production history.</h2>
        <p className="body-copy">When all packet steps are done, archive the packet and progress file before Studio Next moves on to the next shot.</p>
      </div>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Normal Archive</p><h3>Use when all steps are done</h3></div></div>
          <div className="prompt-box">npm run archive:work-packet</div>
          <p className="body-copy">Studio Next suggests this automatically when work_progress.overall_status is done.</p>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Force Archive</p><h3>Use only for manual cleanup</h3></div></div>
          <div className="prompt-box">npm run archive:work-packet -- --force</div>
          <p className="body-copy">This archives even if some steps are still open or blocked.</p>
        </article>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Archive Files</p><h3>Local outputs</h3></div></div>
        <div className="page-stack">
          {archiveFiles.map((file) => (
            <div className="dialogue-box" key={file}>{file}</div>
          ))}
        </div>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Close Loop</p><h3>Recommended order</h3></div></div>
        <div className="page-stack">
          <div className="dialogue-box">1. Mark all steps done with npm run work:step.</div>
          <div className="dialogue-box">2. Run npm run studio:next.</div>
          <div className="dialogue-box">3. If Studio Next says archive, run npm run archive:work-packet.</div>
          <div className="dialogue-box">4. Run npm run studio:next again to prepare the next packet.</div>
        </div>
      </article>
    </section>
  );
}
