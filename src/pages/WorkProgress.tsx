const defaultSteps = [
  {
    id: 'step_01',
    title: 'Create frame plan',
    command: 'npm run create:frame-plan'
  },
  {
    id: 'step_02',
    title: 'Register candidate',
    command: 'npm run register:candidate -- SHOT_ID IMAGE_FILE --tool manual'
  },
  {
    id: 'step_03',
    title: 'Create QA report',
    command: 'npm run create:frame-qa'
  },
  {
    id: 'step_04',
    title: 'Set QA decision',
    command: 'npm run qa:set -- SHOT_ID approved_candidate 85 "checked clean frame"'
  },
  {
    id: 'step_05',
    title: 'Promote candidate',
    command: 'npm run promote:candidate -- SHOT_ID --note approved'
  },
  {
    id: 'step_06',
    title: 'Refresh asset previews',
    command: 'npm run create:asset-intake && npm run sync:asset-previews'
  },
  {
    id: 'step_07',
    title: 'Approve review',
    command: 'npm run review:set -- approved SHOT_ID TARGET_PATH "approved clean frame"'
  },
  {
    id: 'step_08',
    title: 'Refresh studio state',
    command: 'npm run studio:next'
  }
];

export function WorkProgress() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Work Progress</p>
          <h2>Track the Current Packet Step by Step</h2>
        </div>
        <button className="primary-button">Update Progress</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>The packet now has memory.</h2>
        <p className="body-copy">Use this page with the progress JSON to mark each packet step as open, done or blocked. Studio Next will continue from the next unfinished step.</p>
      </div>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Create Progress</p><h3>Build status file from packet</h3></div></div>
          <div className="prompt-box">npm run create:work-progress</div>
          <p className="body-copy">Output: outputs/pilot/work-packet/ep001_work_packet_progress.json</p>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Main Loop</p><h3>Let Studio Next refresh it</h3></div></div>
          <div className="prompt-box">npm run studio:next</div>
          <p className="body-copy">studio:next now creates packet, progress and next command together.</p>
        </article>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Mark Steps</p><h3>Use step ids</h3></div></div>
        <div className="grid two-col">
          <div className="dialogue-box">npm run work:step -- step_01 done "frame plan created"</div>
          <div className="dialogue-box">npm run work:step -- step_02 done "candidate registered"</div>
          <div className="dialogue-box">npm run work:step -- step_02 blocked "image still has text"</div>
          <div className="dialogue-box">npm run work:step -- step_02 open</div>
        </div>
      </article>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Default Steps</p><h3>Packet progress order</h3></div></div>
        <div className="page-stack">
          {defaultSteps.map((step) => (
            <div className="dialogue-box" key={step.id}>
              <p className="eyebrow">{step.id}</p>
              <p>{step.title}</p>
              <p>{step.command}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
