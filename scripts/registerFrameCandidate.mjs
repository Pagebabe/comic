import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import pilotShotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };
import template from '../src/data/frameCandidateTemplate.json' assert { type: 'json' };

const root = process.cwd();
const args = process.argv.slice(2);
const shotId = args[0];
const inputPath = args[1];
const promote = args.includes('--promote');
const toolFlagIndex = args.indexOf('--tool');
const noteFlagIndex = args.indexOf('--note');
const sourceTool = toolFlagIndex >= 0 ? args[toolFlagIndex + 1] : 'manual';
const note = noteFlagIndex >= 0 ? args.slice(noteFlagIndex + 1).join(' ') : '';

if (!shotId || !inputPath) {
  console.error('Usage: npm run register:candidate -- ep001_tv_009 IMAGE_FILE [--tool manual] [--promote] [--note text]');
  process.exit(1);
}

const sourcePath = inputPath.startsWith('/') ? inputPath : join(root, inputPath);
const ext = extname(sourcePath).toLowerCase();
const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp']);
if (!allowedExt.has(ext)) {
  console.error(`Unsupported file type: ${ext}`);
  process.exit(1);
}
if (!existsSync(sourcePath)) {
  console.error(`Input image not found: ${inputPath}`);
  process.exit(1);
}

const review = tvReviewQueue.find((item) => item.tv_shot_id === shotId);
const brief = pilotShotBriefs.find((item) => item.tv_shot_id === shotId);
if (!review && !brief) {
  console.error(`Unknown shot id: ${shotId}`);
  process.exit(1);
}

const sceneId = brief?.scene_id ?? review?.scene_id;
const title = brief?.title ?? review?.title;
const officialTarget = brief?.target_path ?? review?.asset_target;
const registryPath = join(root, template.output);
const registry = existsSync(registryPath)
  ? JSON.parse(readFileSync(registryPath, 'utf8'))
  : { episode_id: 'ep001', candidates: [] };

const existingForShot = registry.candidates.filter((item) => item.tv_shot_id === shotId);
const versionNumber = existingForShot.length + 1;
const version = `candidate_v${versionNumber}`;
const candidateDir = join(root, 'outputs', 'pilot', 'candidates', sceneId, shotId);
const candidateFile = `${shotId}_${version}${ext}`;
const candidatePath = join(candidateDir, candidateFile);

mkdirSync(candidateDir, { recursive: true });
copyFileSync(sourcePath, candidatePath);

let promotedTarget = null;
if (promote && officialTarget) {
  const absoluteTarget = join(root, officialTarget);
  mkdirSync(dirname(absoluteTarget), { recursive: true });
  copyFileSync(candidatePath, absoluteTarget);
  promotedTarget = officialTarget;
}

const candidate = {
  id: `candidate_${shotId}_${Date.now()}`,
  episode_id: 'ep001',
  scene_id: sceneId,
  tv_shot_id: shotId,
  title,
  version,
  source_tool: sourceTool,
  source_file: inputPath,
  candidate_file: candidatePath.replace(`${root}/`, ''),
  official_target: officialTarget ?? null,
  promoted_target: promotedTarget,
  status: promote ? 'promoted' : 'ready_for_review',
  note,
  created_at: new Date().toISOString(),
  next_commands: promote
    ? ['npm run create:asset-intake', 'npm run sync:asset-previews', 'npm run create:review-summary']
    : [`npm run place:keyframe -- ${shotId} ${candidatePath.replace(`${root}/`, '')}`]
};

registry.candidates.push(candidate);
registry.updated_at = new Date().toISOString();
registry.count = registry.candidates.length;
mkdirSync(dirname(registryPath), { recursive: true });
writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');

console.log(`registered ${shotId} ${version}`);
console.log(`candidate ${candidate.candidate_file}`);
console.log(`status ${candidate.status}`);
if (promotedTarget) console.log(`promoted ${promotedTarget}`);
