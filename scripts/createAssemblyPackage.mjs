import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import tvShots from '../src/data/tvShots.json' assert { type: 'json' };

const root = process.cwd();
const reviewRoot = join(root, 'outputs', 'pilot', 'review');
const assemblyRoot = join(root, 'outputs', 'pilot', 'assembly');
const exportsRoot = join(root, 'outputs', 'pilot', 'exports');
const sceneIds = ['ep001_scene_001', 'ep001_scene_002', 'ep001_scene_003', 'ep001_scene_004'];

function readManifest(sceneId) {
  const path = join(reviewRoot, sceneId, 'review.manifest.json');
  if (!existsSync(path)) {
    return { scene_id: sceneId, missing: true, items: [] };
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

const reviewManifests = sceneIds.map(readManifest);
const reviewItems = reviewManifests.flatMap((manifest) => manifest.items ?? []);
const approvedItems = reviewItems.filter((item) => item.status === 'approved');
const blockedItems = reviewItems.filter((item) => item.status !== 'approved');
const missingManifests = reviewManifests.filter((manifest) => manifest.missing).map((manifest) => manifest.scene_id);

mkdirSync(assemblyRoot, { recursive: true });
mkdirSync(exportsRoot, { recursive: true });

const timeline = tvShots.map((shot, index) => {
  const review = reviewItems.find((item) => item.tv_shot_id === shot.id);
  return {
    order: index + 1,
    tv_shot_id: shot.id,
    timecode: shot.timecode,
    duration: shot.duration,
    action: shot.action,
    approved: review?.status === 'approved',
    asset_target: review?.asset_target ?? null,
    review_status: review?.status ?? 'missing_review',
    voice: shot.voice,
    sound: shot.sound,
    animation: shot.animation
  };
});

const packageData = {
  episode_id: 'ep001',
  title: 'Die Entkommerzialisierungsgebühr',
  stage: 'assembly_readiness',
  ready_for_assembly: blockedItems.length === 0 && missingManifests.length === 0 && reviewItems.length === tvShots.length,
  counts: {
    tv_shots: tvShots.length,
    reviewed: reviewItems.length,
    approved: approvedItems.length,
    blocked: blockedItems.length,
    missing_manifests: missingManifests.length
  },
  missing_manifests: missingManifests,
  blockers: blockedItems.map((item) => ({
    tv_shot_id: item.tv_shot_id,
    scene_id: item.scene_id,
    status: item.status,
    issue: item.known_issue
  })),
  timeline,
  output_target: 'outputs/pilot/exports/ep001_pilot_tv_episode_v1.mp4'
};

const packagePath = join(assemblyRoot, 'ep001_assembly_package.json');
writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');

console.log(`wrote outputs/pilot/assembly/ep001_assembly_package.json`);
if (packageData.ready_for_assembly) {
  console.log('Assembly is ready.');
} else {
  console.log('Assembly is blocked.');
  for (const blocker of packageData.blockers) {
    console.log(`- ${blocker.tv_shot_id}: ${blocker.status} — ${blocker.issue}`);
  }
  for (const sceneId of missingManifests) {
    console.log(`- missing review manifest: ${sceneId}`);
  }
}
