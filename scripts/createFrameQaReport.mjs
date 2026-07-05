import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import template from '../src/data/frameQaTemplate.json' assert { type: 'json' };
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import pilotShotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };

const root = process.cwd();
const candidatePath = join(root, 'outputs', 'pilot', 'candidates', 'ep001_frame_candidates.json');
const outputPath = join(root, template.output);

if (!existsSync(candidatePath)) {
  const empty = {
    id: template.id,
    episode_id: 'ep001',
    created_at: new Date().toISOString(),
    count: 0,
    qa_items: [],
    next_step: 'No frame candidates found. Register a candidate first.'
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(empty, null, 2), 'utf8');
  console.log('No frame candidates found.');
  console.log(`wrote ${template.output}`);
  process.exit(0);
}

const registry = JSON.parse(readFileSync(candidatePath, 'utf8'));
const reviewByShot = new Map(tvReviewQueue.map((item) => [item.tv_shot_id, item]));
const briefByShot = new Map(pilotShotBriefs.map((item) => [item.tv_shot_id, item]));

function shotSpecificRisks(shotId) {
  if (shotId === 'ep001_tv_009') {
    return [
      'Sami must read as tired Späti oracle, not crime figure.',
      'No logo on coffee cup.',
      'No text on hoodie.',
      'Deadpan, not threatening.'
    ];
  }
  if (shotId === 'ep001_tv_007') {
    return [
      'Kralle must stay physically cat-like, not humanoid.',
      'Rico should be counting coins.',
      'No readable money or paper details.'
    ];
  }
  if (shotId === 'ep001_tv_006') {
    return [
      'Paper must remain blank or hidden.',
      'No caption bar or fake wall text.',
      'Falk must keep green jacket, scarf and man-bun.'
    ];
  }
  return [];
}

const qaItems = registry.candidates.map((candidate) => {
  const review = reviewByShot.get(candidate.tv_shot_id);
  const brief = briefByShot.get(candidate.tv_shot_id);
  const candidateExists = existsSync(join(root, candidate.candidate_file));
  const checks = template.checks.map((check) => ({
    ...check,
    status: 'needs_visual_check',
    score: null,
    note: ''
  }));

  return {
    id: `qa_${candidate.id}`,
    episode_id: candidate.episode_id,
    scene_id: candidate.scene_id,
    tv_shot_id: candidate.tv_shot_id,
    title: candidate.title,
    candidate_id: candidate.id,
    candidate_file: candidate.candidate_file,
    candidate_exists: candidateExists,
    official_target: candidate.official_target,
    current_review_status: review?.status ?? 'missing_review',
    expected_target: brief?.target_path ?? review?.asset_target ?? null,
    checks,
    shot_specific_risks: shotSpecificRisks(candidate.tv_shot_id),
    suggested_decision: candidateExists ? 'needs_visual_check' : 'candidate_file_missing',
    next_step: candidateExists
      ? 'Open candidate file and fill QA scores or run visual QA agent later.'
      : 'Candidate file is missing.'
  };
});

const report = {
  id: template.id,
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  count: qaItems.length,
  min_approval_score: template.scoring.min_approval_score,
  qa_items: qaItems,
  next_step: qaItems.length > 0
    ? 'Review newest candidate first, then approve, retry or discard.'
    : 'No QA items.'
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`wrote ${template.output}`);
console.log(`QA items: ${qaItems.length}`);
