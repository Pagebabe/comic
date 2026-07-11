import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRACT_PATH = path.join(ROOT, 'project', 'production-academy.json');
const OUTPUT_PATH = path.join(ROOT, 'output', 'production-academy', 'academy-check.json');

const EXPECTED_STAGE_IDS = [
  'series_brief',
  'series_bible',
  'character_masters',
  'location_masters',
  'voice_masters',
  'episode_brief',
  'script_lock',
  'shot_animatic',
  'asset_production',
  'audio_post',
  'qa_package',
  'release_handoff'
];

const REQUIRED_DOCS = [
  'docs/AUTOMATION_80_PERCENT_MODEL.md',
  'docs/QUICKSTART_DAY_ONE.md',
  'docs/PRODUCTION_HANDBOOK_DE.md',
  'docs/VIDEO_TUTORIAL_SCRIPT_DE.md'
];

function fail(message) {
  throw new Error(message);
}

export async function checkProductionAcademy({ writeOutput = true } = {}) {
  const contract = JSON.parse(await readFile(CONTRACT_PATH, 'utf8'));
  if (contract.schemaVersion !== 1) fail('Production academy schemaVersion must be 1.');
  if (contract.trackingIssue !== 94) fail('Production academy must remain linked to Issue #94.');
  if (!Array.isArray(contract.stages) || contract.stages.length !== 12) fail('Exactly twelve production stages are required.');
  if (JSON.stringify(contract.stages.map((stage) => stage.id)) !== JSON.stringify(EXPECTED_STAGE_IDS)) fail('Production stage order changed.');
  if (new Set(contract.stages.map((stage) => stage.id)).size !== 12) fail('Production stage IDs must be unique.');
  if (contract.stages.some((stage, index) => stage.number !== index + 1)) fail('Production stage numbers must be sequential.');
  if (contract.stages.some((stage) => !stage.title || !stage.objective || !stage.beginnerExplanation || !stage.doneWhen)) fail('Every stage needs title, objective, beginner explanation and doneWhen.');
  if (contract.stages.some((stage) => !Array.isArray(stage.deliverables) || stage.deliverables.length < 4)) fail('Every stage needs at least four deliverables.');
  if (contract.stages.some((stage) => !Array.isArray(stage.tools) || stage.tools.length < 1)) fail('Every stage needs at least one tool.');
  if (contract.stages.slice(1).some((stage) => stage.automaticApprovalAllowed !== false)) fail('Creative and downstream gates may not be automatically approved.');
  if (contract.stages[0].automaticApprovalAllowed !== true) fail('Only the technical Series Brief stage may auto-complete.');
  if (contract.modes?.map((mode) => mode.id).join(',') !== 'training,production') fail('Training and production modes are required.');
  if (!contract.safetyRules?.some((rule) => rule.includes('Human Gates'))) fail('Human-gate safety rule is missing.');
  if (!contract.safetyRules?.some((rule) => rule.includes('Dialog'))) fail('Dialogue approval boundary is missing.');
  if (!contract.safetyRules?.some((rule) => rule.includes('Episode'))) fail('Final episode boundary is missing.');
  if (!Array.isArray(contract.dayOnePlan) || contract.dayOnePlan.length < 8) fail('Day-one plan must contain at least eight checkpoints.');
  if (contract.dayOnePlan.some((item) => !EXPECTED_STAGE_IDS.includes(item.stageId))) fail('Day-one plan references an unknown stage.');

  const templates = [];
  for (const stage of contract.stages) {
    const absolute = path.join(ROOT, stage.template);
    await access(absolute);
    const text = await readFile(absolute, 'utf8');
    if (!text.includes('REVIEW_REQUIRED')) fail(`${stage.template} must expose REVIEW_REQUIRED.`);
    if (text.includes('automatic creative approval')) fail(`${stage.template} contains a forbidden automatic approval claim.`);
    templates.push({ path: stage.template, bytes: Buffer.byteLength(text) });
  }

  const documents = [];
  for (const relative of REQUIRED_DOCS) {
    const absolute = path.join(ROOT, relative);
    await access(absolute);
    const text = await readFile(absolute, 'utf8');
    if (text.length < 1000) fail(`${relative} is unexpectedly short.`);
    documents.push({ path: relative, bytes: Buffer.byteLength(text) });
  }

  const handbook = await readFile(path.join(ROOT, 'docs', 'PRODUCTION_HANDBOOK_DE.md'), 'utf8');
  const video = await readFile(path.join(ROOT, 'docs', 'VIDEO_TUTORIAL_SCRIPT_DE.md'), 'utf8');
  const automation = await readFile(path.join(ROOT, 'docs', 'AUTOMATION_80_PERCENT_MODEL.md'), 'utf8');
  if (!handbook.includes('sourceBoundCandidateLine')) fail('Handbook must use sourceBoundCandidateLine for unapproved dialogue.');
  if (!video.includes('30-Minuten') && !video.includes('30:30')) fail('Video tutorial needs a complete timecoded path.');
  if (!automation.includes('80 Prozent')) fail('Automation operating model must define the 80-percent target.');
  const episodeApprovalIsHuman = /finale[nr]? Episode/i.test(automation) && /(Mensch|Showrunner|menschlich)/i.test(automation);
  if (!episodeApprovalIsHuman) fail('Automation model must retain final human episode approval.');

  const report = {
    schemaVersion: 1,
    status: 'pass',
    repository: 'Pagebabe/comic',
    trackingIssue: 94,
    stageCount: contract.stages.length,
    roleCount: contract.roles.length,
    templateCount: templates.length,
    documentCount: documents.length,
    trainingModeAvailable: true,
    productionModeAvailable: true,
    automaticCreativeApprovalAllowed: false,
    finalEpisodeAutomaticallyApproved: false,
    templates,
    documents,
    checkedAt: new Date().toISOString()
  };

  if (writeOutput) {
    await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    console.log(JSON.stringify(await checkProductionAcademy()));
  } catch (error) {
    console.error(JSON.stringify({ status: 'error', message: error.message }));
    process.exitCode = 1;
  }
}
