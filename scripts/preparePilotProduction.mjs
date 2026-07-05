import { spawnSync } from 'node:child_process';

const steps = [
  ['setup:outputs', 'Create local output folders and base manifests'],
  ['create:keyframe-jobs', 'Create keyframe job JSON files'],
  ['create:repair-jobs', 'Create repair job JSON files from the fix queue'],
  ['create:review-manifests', 'Create TV review manifests'],
  ['create:voice-package', 'Create voice package, SRT and VTT'],
  ['create:sound-package', 'Create sound design package and cue sheet'],
  ['create:assembly-package', 'Create assembly readiness package']
];

for (const [script, description] of steps) {
  console.log(`\n▶ ${description}`);
  console.log(`npm run ${script}\n`);

  const result = spawnSync('npm', ['run', script], { stdio: 'inherit', shell: true });
  if (result.error || result.status !== 0) {
    console.error(`\nPipeline stopped at: ${script}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\nPilot production package prepared.');
console.log('Next: open /#/fix-queue, repair priority 1, then rerun npm run prepare:pilot.');
