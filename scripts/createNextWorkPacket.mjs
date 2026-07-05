import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pilotShotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };

const root = process.cwd();
const outDir = join(root, 'outputs', 'pilot', 'work-packet');
const jsonPath = join(outDir, 'ep001_next_work_packet.json');
const markdownPath = join(outDir, 'ep001_next_work_packet.md');
const commandsPath = join(outDir, 'ep001_next_commands.txt');

function readJson(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    return null;
  }
}

const episodeState = readJson('outputs/pilot/status/ep001_episode_state.json');
const framePlan = readJson('outputs/pilot/attempts/ep001_next_frame_attempts.json');
const stateCheck = readJson('outputs/pilot/status/ep001_episode_state_check.json');

const reviewByShot = new Map(tvReviewQueue.map((item) => [item.tv_shot_id, item]));
const briefByShot = new Map(pilotShotBriefs.map((item) => [item.tv_shot_id, item]));
const firstBlockedShotId = episodeState?.next_shot?.id ?? framePlan?.attempts?.[0]?.tv_shot_id ?? pilotShotBriefs[0]?.tv_shot_id;
const brief = briefByShot.get(firstBlockedShotId) ?? pilotShotBriefs[0];
const review = reviewByShot.get(firstBlockedShotId);
const attempt = framePlan?.attempts?.find((item) => item.tv_shot_id === firstBlockedShotId) ?? framePlan?.attempts?.[0];

function hardRules(shotId) {
  const base = [
    'absolutely no readable text anywhere',
    'no logos, no posters, no labels, no subtitles, no speech bubbles',
    'keep character identities locked to the series bible',
    'simple clean cartoon composition, not photorealistic'
  ];
  if (shotId === 'ep001_tv_009') {
    return [...base, 'Sami is tired and calm, not threatening', 'blank coffee cup with no logo', 'plain dark hoodie with no text', 'soft doorway comedy, not crime drama'];
  }
  if (shotId === 'ep001_tv_007') {
    return [...base, 'Kralle is a real cat, not humanoid', 'damaged ear, boss-like posture, physically cat-like body', 'Rico counts coins quietly'];
  }
  if (shotId === 'ep001_tv_006') {
    return [...base, 'paper blank or hidden', 'Falk green jacket, scarf, thinning man-bun and keyring', 'no caption bar or wall text'];
  }
  return base;
}

if (!brief) {
  console.error('No shot brief found for next work packet.');
  process.exit(1);
}

const shotId = brief.tv_shot_id;
const cleanPrompt = attempt?.clean_prompt ?? brief.clean_prompt ?? `Create clean keyframe for ${shotId}`;
const negativePrompt = attempt?.negative_prompt ?? brief.negative_prompt ?? 'readable text, logo, subtitle, speech bubble, photorealism, character drift';
const targetPath = brief.target_path ?? review?.asset_target;

const commands = {
  create_plan: 'npm run create:frame-plan',
  register_candidate: `npm run register:candidate -- ${shotId} IMAGE_FILE --tool manual`,
  create_qa: 'npm run create:frame-qa',
  approve_candidate: `npm run qa:set -- ${shotId} approved_candidate 85 "checked clean frame"`,
  promote_candidate: `npm run promote:candidate -- ${shotId} --note approved`,
  refresh_assets: 'npm run create:asset-intake && npm run sync:asset-previews',
  approve_review: `npm run review:set -- approved ${shotId} ${targetPath} "approved clean frame"`,
  refresh_state: 'npm run studio:next'
};

const packet = {
  id: 'next_work_packet_v2',
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  source: {
    episode_state_next_shot: episodeState?.next_shot ?? null,
    state_check_next_message: stateCheck?.next_message ?? null,
    frame_plan_attempt_id: attempt?.id ?? null
  },
  shot: {
    tv_shot_id: shotId,
    scene_id: brief.scene_id,
    title: brief.title,
    review_status: review?.status ?? 'missing_review',
    target_path: targetPath
  },
  prompt: {
    clean_prompt: cleanPrompt,
    negative_prompt: negativePrompt,
    hard_rules: hardRules(shotId)
  },
  commands,
  workflow: [
    commands.create_plan,
    commands.register_candidate,
    commands.create_qa,
    commands.approve_candidate,
    commands.promote_candidate,
    commands.refresh_assets,
    commands.approve_review,
    commands.refresh_state
  ],
  files: {
    json: 'outputs/pilot/work-packet/ep001_next_work_packet.json',
    markdown: 'outputs/pilot/work-packet/ep001_next_work_packet.md',
    commands: 'outputs/pilot/work-packet/ep001_next_commands.txt'
  }
};

const md = `# Next Work Packet · ${packet.shot.tv_shot_id}\n\n## Shot\n\n- Scene: ${packet.shot.scene_id}\n- Title: ${packet.shot.title}\n- Review: ${packet.shot.review_status}\n- Target: ${packet.shot.target_path}\n\n## Clean Prompt\n\n${packet.prompt.clean_prompt}\n\n## Negative Prompt\n\n${packet.prompt.negative_prompt}\n\n## Hard Rules\n\n${packet.prompt.hard_rules.map((rule) => `- ${rule}`).join('\n')}\n\n## Workflow\n\n${packet.workflow.map((command, index) => `${index + 1}. \`${command}\``).join('\n')}\n`;

const commandsTxt = `# Next commands for ${shotId}\n# 1) Create or export your image manually first.\n# 2) Replace IMAGE_FILE below with the real local path.\n\n${commands.create_plan}\n${commands.register_candidate}\n${commands.create_qa}\n${commands.approve_candidate}\n${commands.promote_candidate}\n${commands.refresh_assets}\n${commands.approve_review}\n${commands.refresh_state}\n`;

mkdirSync(outDir, { recursive: true });
writeFileSync(jsonPath, JSON.stringify(packet, null, 2), 'utf8');
writeFileSync(markdownPath, md, 'utf8');
writeFileSync(commandsPath, commandsTxt, 'utf8');
console.log('wrote outputs/pilot/work-packet/ep001_next_work_packet.json');
console.log('wrote outputs/pilot/work-packet/ep001_next_work_packet.md');
console.log('wrote outputs/pilot/work-packet/ep001_next_commands.txt');
console.log(`Next shot: ${shotId}`);
console.log(commands.register_candidate);
