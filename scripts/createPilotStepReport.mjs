import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import nextFixQueue from '../src/data/nextFixQueue.json' assert { type: 'json' };
import pilotShotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };
import template from '../src/data/pilotStepTemplate.json' assert { type: 'json' };

const root = process.cwd();
const fixes = [...nextFixQueue].sort((a, b) => a.priority - b.priority);
const briefsByShot = new Map(pilotShotBriefs.map((brief) => [brief.tv_shot_id, brief]));

const reviewItems = tvReviewQueue.map((item) => {
  const assetExists = existsSync(join(root, item.asset_target));
  return {
    ...item,
    asset_exists: assetExists,
    brief: briefsByShot.get(item.tv_shot_id) ?? null
  };
});

const approvedMissingFile = reviewItems.find((item) => item.status === 'approved' && !item.asset_exists);
const firstFix = fixes[0] ?? null;
const queuedKeyframe = reviewItems.find((item) => item.status === 'queued');
const notApproved = reviewItems.filter((item) => item.status !== 'approved');
const allApproved = notApproved.length === 0;
const allApprovedAssetsExist = reviewItems.every((item) => item.status === 'approved' && item.asset_exists);

let currentStep;
if (approvedMissingFile) {
  currentStep = {
    type: 'approved_missing_file',
    title: `Place local file for ${approvedMissingFile.tv_shot_id}`,
    tv_shot_id: approvedMissingFile.tv_shot_id,
    target_path: approvedMissingFile.asset_target,
    command: `npm run place:keyframe -- ${approvedMissingFile.tv_shot_id} IMAGE_FILE`,
    after: ['npm run create:asset-intake', 'npm run sync:asset-previews', 'npm run create:review-summary']
  };
} else if (firstFix) {
  currentStep = {
    type: 'first_fix_queue_item',
    title: firstFix.title,
    tv_shot_id: firstFix.tv_shot_id,
    target_path: firstFix.output_target,
    command: `Use #/next-shot or #/shot-briefs, then npm run place:keyframe -- ${firstFix.tv_shot_id} IMAGE_FILE`,
    after: ['review the image', `npm run review:set -- approved ${firstFix.tv_shot_id} ${firstFix.output_target} "approved"`]
  };
} else if (queuedKeyframe) {
  currentStep = {
    type: 'queued_keyframe',
    title: `Create keyframe for ${queuedKeyframe.tv_shot_id}`,
    tv_shot_id: queuedKeyframe.tv_shot_id,
    target_path: queuedKeyframe.asset_target,
    command: `npm run place:keyframe -- ${queuedKeyframe.tv_shot_id} IMAGE_FILE`,
    after: ['review the image']
  };
} else if (!allApprovedAssetsExist) {
  currentStep = {
    type: 'pilot_file_check',
    title: 'Run pilot file check and resolve missing files',
    command: 'npm run check:pilot-ready',
    after: ['resolve blocked items from outputs/pilot/status/ep001_assembly_gate.json']
  };
} else if (allApproved) {
  currentStep = {
    type: 'motion_plan',
    title: 'Create motion jobs and camera notes',
    command: 'npm run create:motion-jobs && npm run create:camera-notes',
    after: ['open #/motion-jobs', 'open #/camera-notes']
  };
} else {
  currentStep = {
    type: 'assembly_plan',
    title: 'Create assembly package when ready',
    command: 'npm run create:assembly-package && npm run create:remotion-plan',
    after: ['open #/assembly', 'open #/remotion-adapter']
  };
}

const report = {
  id: template.id,
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  counts: {
    total: reviewItems.length,
    approved: reviewItems.filter((item) => item.status === 'approved').length,
    needs_fix: reviewItems.filter((item) => item.status === 'needs_fix').length,
    queued: reviewItems.filter((item) => item.status === 'queued').length,
    approved_missing_file: reviewItems.filter((item) => item.status === 'approved' && !item.asset_exists).length,
    fix_queue: fixes.length
  },
  current_step: currentStep,
  review_items: reviewItems.map((item) => ({
    tv_shot_id: item.tv_shot_id,
    scene_id: item.scene_id,
    title: item.title,
    status: item.status,
    current_version: item.current_version,
    asset_target: item.asset_target,
    asset_exists: item.asset_exists
  }))
};

const outputPath = join(root, template.output);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`wrote ${template.output}`);
console.log(`Current step: ${currentStep.type}`);
console.log(currentStep.title);
