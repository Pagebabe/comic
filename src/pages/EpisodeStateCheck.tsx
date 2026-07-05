const issueCodes = [
  {
    code: 'approved_asset_missing',
    level: 'issue',
    meaning: 'Review is approved but the official keyframe file is missing.',
    fix: 'Promote a candidate again or place the keyframe file manually.'
  },
  {
    code: 'promoted_asset_missing',
    level: 'issue',
    meaning: 'A candidate was promoted but the official target file is missing.',
    fix: 'Run promote:candidate again for that shot.'
  },
  {
    code: 'approved_candidate_not_promoted',
    level: 'warning',
    meaning: 'QA approved a candidate, but it is not official yet.',
    fix: 'Run promote:candidate for that shot.'
  },
  {
    code: 'official_file_waiting_for_review',
    level: 'warning',
    meaning: 'A keyframe file exists but review status is not approved.',
    fix: 'Use review:set after visual approval.'
  },
  {
    code: 'ready_but_fix_queue_present',
    level: 'warning',
    meaning: 'A shot looks ready but still has a fix queue item.',
    fix: 'Check whether nextFixQueue still needs that item.'
  },
  {
    code: 'candidate_without_qa_decision',
    level: 'warning',
    meaning: 'Candidates exist but no QA decision was recorded.',
    fix: 'Run qa:set with approved_candidate, needs_fix, retry_with_stronger_prompt or discard.'
  }
];

export function EpisodeStateCheck() {
  return (
    <section className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Episode State Check</p>
          <h2>Production Consistency Doctor</h2>
        </div>
        <button className="primary-button">Check State</button>
      </div>

      <div className="hero-card warning-card">
        <p className="eyebrow">Purpose</p>
        <h2>Find contradictions before the factory moves forward.</h2>
        <p className="body-copy">This checks the central episode state for broken or suspicious combinations like approved-but-missing, promoted-but-missing, or candidate-without-QA.</p>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Local Command</p><h3>Create consistency report</h3></div></div>
        <div className="prompt-box">npm run create:frame-lifecycle</div>
        <div className="prompt-box">npm run create:episode-state</div>
        <div className="prompt-box">npm run check:episode-state</div>
        <p className="body-copy">Output: outputs/pilot/status/ep001_episode_state_check.json</p>
      </article>

      <div className="grid two-col">
        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Fast Path</p><h3>Main orchestrator</h3></div></div>
          <div className="prompt-box">npm run studio:next</div>
          <p className="body-copy">studio:next now runs this state check automatically and surfaces the next command.</p>
        </article>

        <article className="card">
          <div className="card-header"><div><p className="eyebrow">Result</p><h3>Read these fields</h3></div></div>
          <div className="page-stack">
            <div className="dialogue-box">ok</div>
            <div className="dialogue-box">counts.issues</div>
            <div className="dialogue-box">counts.warnings</div>
            <div className="dialogue-box">next_command</div>
            <div className="dialogue-box">next_message</div>
          </div>
        </article>
      </div>

      <article className="card">
        <div className="card-header"><div><p className="eyebrow">Checks</p><h3>Known issue and warning codes</h3></div></div>
        <div className="page-stack">
          {issueCodes.map((item) => (
            <div className="dialogue-box" key={item.code}>
              <p className="eyebrow">{item.level}</p>
              <p>{item.code}</p>
              <p>{item.meaning}</p>
              <p>Fix: {item.fix}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
