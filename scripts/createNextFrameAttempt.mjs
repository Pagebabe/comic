import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import pilotShotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };

const root = process.cwd();
const qaPath = join(root, 'outputs', 'pilot', 'qa', 'ep001_frame_qa.json');
const outputPath = join(root, 'outputs', 'pilot', 'attempts', 'ep001_next_frame_attempts.json');
const briefByShot = new Map(pilotShotBriefs.map((item) => [item.tv_shot_id, item]));
const reviewByShot = new Map(tvReviewQueue.map((item) => [item.tv_shot_id, item]));

function riskAdditions(shotId) {
  if (shotId === 'ep001_tv_009') {
    return [
      'Sami is calm and tired, not threatening.',
      'plain dark hoodie without text',
      'blank coffee cup with no logo',
      'soft doorway comedy, not crime drama'
    ];
  }
  if (shotId === 'ep001_tv_007') {
    return [
      'Kralle is a real cat, not humanoid.',
      'damaged ear, boss-like posture, physically cat-like body',
      'Rico counts coins quietly',
      'no readable money details'
    ];
  }
  if (shotId === 'ep001_tv_006') {
    return [
      'blank or hidden paper only',
      'Falk keeps green jacket, scarf, thinning man-bun and keyring',
      'Rico stays clean naive village boy',
      'no caption bar or wall text'
    ];
  }
  return [];
}

function baseAdditions() {
  return [
    'absolutely no readable text anywhere',
    'no logos, no posters, no labels, no subtitles, no speech bubbles',
    'keep character identities locked to the series bible',
    'simple clean cartoon composition, not photorealistic'
  ];
}

let qaItems = [];
if (existsSync(qaPath)) {
  const qa = JSON.parse(readFileSync(qaPath, 'utf8'));
  qaItems = qa.qa_items ?? [];
}

const openShots = tvReviewQueue.filter((item) => item.status !== 'approved');
const sourceItems = qaItems.length > 0
  ? qaItems.filter((item) => item.suggested_decision !== 'approved_candidate')
  : openShots.map((item) => ({
      tv_shot_id: item.tv_shot_id,
      scene_id: item.scene_id,
      title: item.title,
      candidate_id: null,
      suggested_decision: item.status,
      shot_specific_risks: riskAdditions(item.tv_shot_id)
    }));

const attempts = sourceItems.map((item, index) => {
  const brief = briefByShot.get(item.tv_shot_id);
  const review = reviewByShot.get(item.tv_shot_id);
  const additions = [...baseAdditions(), ...riskAdditions(item.tv_shot_id), ...(item.shot_specific_risks ?? [])];
  const uniqueAdditions = [...new Set(additions)];
  const cleanPrompt = brief?.clean_prompt ?? `Create keyframe for ${item.tv_shot_id}: ${item.title}`;
  const strengthenedPrompt = `${cleanPrompt}\n\nHARD CONSTRAINTS:\n- ${uniqueAdditions.join('\n- ')}`;

  return {
    id: `attempt_${item.tv_shot_id}_${index + 1}`,
    episode_id: 'ep001',
    scene_id: item.scene_id ?? brief?.scene_id ?? review?.scene_id,
    tv_shot_id: item.tv_shot_id,
    title: item.title ?? brief?.title ?? review?.title,
    source_candidate_id: item.candidate_id ?? null,
    reason: item.suggested_decision ?? 'open_review_item',
    target_path: brief?.target_path ?? review?.asset_target ?? null,
    clean_prompt: strengthenedPrompt,
    negative_prompt: brief?.negative_prompt ?? 'readable text, logo, poster, label, subtitle, speech bubble, photorealism, character drift',
    next_commands: [
      `npm run register:candidate -- ${item.tv_shot_id} IMAGE_FILE --tool manual`,
      'npm run create:frame-qa'
    ]
  };
});

const report = {
  id: 'next_frame_attempts_v1',
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  count: attempts.length,
  attempts,
  next_step: attempts[0]
    ? `Use attempt ${attempts[0].tv_shot_id} first.`
    : 'No open frame attempts.'
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
console.log('wrote outputs/pilot/attempts/ep001_next_frame_attempts.json');
console.log(`Attempts: ${attempts.length}`);
if (attempts[0]) console.log(`Next: ${attempts[0].tv_shot_id}`);
