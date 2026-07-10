import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const mergeBibleFiles = [
  'project/merge-bibles/ricco.json',
  'project/merge-bibles/basti-prenzl.json',
  'project/merge-bibles/jule.json',
  'project/merge-bibles/don-miau.json'
];

const required = [
  'index.html', 'app.js', 'styles.css', 'm1.css',
  'api/bot.mjs', 'api/health.mjs', 'lib/context.mjs', 'lib/browser-director.mjs',
  'project/project.json', 'project/canon.json', 'project/character-library.json',
  'project/character-production-sheets.json', 'project/lora-training-sheets.json',
  'project/cast-variants.json', 'project/cast-merge-decisions.json', ...mergeBibleFiles,
  'docs/MASTER_PLAN.md', 'docs/PROJECT_TRUTH_AUDIT.md', 'docs/ASSET_RECOVERY_CHECKLIST.md',
  'docs/LOCAL_ASSET_RECOVERY_RUNBOOK.md', 'work-packets/M1R-002-local-asset-recovery.md',
  'vercel.json', '.github/workflows/ci.yml', '.github/workflows/pages.yml',
  '.github/workflows/pages-outcome.yml', 'tests/bot.test.mjs',
  'tests/browser-director.test.mjs', 'tests/test_asset_recovery.py',
  'scripts/recover_assets.py', 'scripts/render_m1.py',
  'assets/characters/ricco.svg', 'assets/characters/basti.svg',
  'assets/characters/jule.svg', 'assets/characters/don-miau.svg',
  'series/ricco-im-haus/characters/ricco/character.json',
  'series/ricco-im-haus/episodes/m1-life-sign/scene.json',
  'docs/M1_PRODUCTION_BRIEF.md', 'docs/M1_RENDER_RUNBOOK.md'
];

for (const file of required) await access(new URL(`../${file}`, import.meta.url));

const project = JSON.parse(await readFile(new URL('../project/project.json', import.meta.url), 'utf8'));
const canon = JSON.parse(await readFile(new URL('../project/canon.json', import.meta.url), 'utf8'));
const characterLibrary = JSON.parse(await readFile(new URL('../project/character-library.json', import.meta.url), 'utf8'));
const productionSheets = JSON.parse(await readFile(new URL('../project/character-production-sheets.json', import.meta.url), 'utf8'));
const loraSheets = JSON.parse(await readFile(new URL('../project/lora-training-sheets.json', import.meta.url), 'utf8'));
const castVariants = JSON.parse(await readFile(new URL('../project/cast-variants.json', import.meta.url), 'utf8'));
const castDecisions = JSON.parse(await readFile(new URL('../project/cast-merge-decisions.json', import.meta.url), 'utf8'));
const mergeBibles = await Promise.all(mergeBibleFiles.map(async (file) => JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'))));

const active = project.milestones.filter((item) => item.state === 'active');
if (project.activeMilestone !== 'M1R') throw new Error('Active milestone must be M1R during canon and asset recovery.');
if (active.length !== 1 || active[0].id !== 'M1R') throw new Error('Exactly one active M1R milestone is required.');
if (project.milestones.find((item) => item.id === 'M0')?.state !== 'done') throw new Error('M0 must remain complete.');
if (project.milestones.find((item) => item.id === 'M1')?.state !== 'done') throw new Error('Technical M1 proof must remain recorded as complete.');
if (project.characters.length !== 4) throw new Error('The active pilot must expose exactly four core characters.');
if (project.inventory?.textCharacterBiblesLocked !== 4) throw new Error('Project state must expose four locked text character bibles.');
if (project.inventory?.visualCharacterMastersLocked !== 0) throw new Error('No visual character master may be claimed before asset recovery.');
if ((project.activeTasks || []).length < 8) throw new Error('M1R needs a concrete recovery task list.');
if (project.deployment?.status !== 'online') throw new Error('Verified dashboard deployment must be recorded.');
if (project.deployment?.url !== 'https://pagebabe.github.io/comic/') throw new Error('Unexpected dashboard URL.');
if (project.m1Spec?.status !== 'technical-proof-only') throw new Error('M1 must be labelled as a technical proof only.');
if (project.m1Spec?.testLine !== 'Bruder, endlich was Eigenes.') throw new Error('M1 test line must remain locked for reproducibility.');

if (canon.status !== 'recovery_active' || canon.activeGate !== 'M1R') throw new Error('Canon must record the active M1R recovery gate.');
if (canon.series?.title !== 'Ricco im Haus') throw new Error('Active series canon must remain Ricco im Haus.');
if (canon.pilot?.title !== 'Das Zimmer' || canon.pilot?.panelCount !== 8) throw new Error('Canonical pilot must remain Das Zimmer with eight beats.');
if (canon.pilot?.status !== 'canon_story_and_text_cast_locked_visual_assets_open') throw new Error('Pilot must disclose locked text canon and open visual assets.');
if (canon.coreCast?.length !== 4) throw new Error('Canon must define four active pilot characters.');
if (canon.extendedCast?.length !== 10) throw new Error('Canon must preserve ten future-library characters after migration mapping.');
if (canon.verifiedInventory?.lockedTextCharacterBibles !== 4) throw new Error('Canon inventory must expose four locked text bibles.');
if (!canon.stopRules?.some((item) => item.includes('No new character'))) throw new Error('M1R new-character stop rule is missing.');
if (!canon.technicalProof?.warning?.includes('must not be treated as canonical')) throw new Error('Technical proof warning must reject canonical design claims.');

const canonById = new Map(canon.coreCast.map((item) => [item.id, item]));
if (!canonById.get('char_ricco')?.role.includes('24-jähriger')) throw new Error('Ricco age and role must remain locked.');
if (!canonById.get('char_basti')?.role.includes('44-jähriger')) throw new Error('Basti age and role must remain locked.');
if (!canonById.get('char_jule')?.role.includes('29-jährige')) throw new Error('Jule age and role must remain locked.');
if (!canonById.get('char_don_miau')?.lockedDecisions?.includes('spricht niemals')) throw new Error('Don Miau must remain permanently silent.');
for (const character of canon.coreCast) {
  if (character.status !== 'text_canon_locked_visual_pending') throw new Error(`Core text canon not locked: ${character.id}`);
  if (!character.mergeBible) throw new Error(`Merge bible missing from canon: ${character.id}`);
}

if (castDecisions.status !== 'text_canon_locked_visual_pending' || castDecisions.decisions?.length !== 4) throw new Error('Cast merge decisions must lock four text characters.');
if (castDecisions.decisions.some((item) => item.visualStatus !== 'pending_master_reference')) throw new Error('All visual masters must remain pending.');
if (castVariants.status !== 'text_merge_locked_visual_pending' || castVariants.conflicts.length !== 3) throw new Error('Cast variants must expose three resolved text conflicts with a visual gate.');
if (castVariants.conflicts.some((item) => item.decision?.status !== 'text_locked_visual_pending')) throw new Error('Every cast conflict must be text-locked and visual-pending.');

const bibleById = new Map(mergeBibles.map((item) => [item.id, item]));
if (bibleById.size !== 4) throw new Error('Four unique merge bibles are required.');
if (bibleById.get('char_ricco')?.age !== 24) throw new Error('Ricco merge bible age drift.');
if (bibleById.get('char_basti')?.age !== 44) throw new Error('Basti merge bible age drift.');
if (bibleById.get('char_jule')?.age !== 29) throw new Error('Jule merge bible age drift.');
if (!bibleById.get('char_don_miau')?.speech?.rule?.includes('spricht niemals')) throw new Error('Don Miau speech rule drift.');
for (const bible of mergeBibles) {
  if (bible.status !== 'text_canon_locked_visual_pending') throw new Error(`Merge bible status invalid: ${bible.id}`);
  if (bible.visualLock?.masterReference !== null) throw new Error(`Unverified master reference claimed: ${bible.id}`);
  if (!bible.openItems?.length) throw new Error(`Open visual items must remain explicit: ${bible.id}`);
}

if (characterLibrary.length !== 13) throw new Error(`Expected 13 recovered legacy characters, found ${characterLibrary.length}.`);
if (productionSheets.length !== 9) throw new Error(`Expected 9 recovered production sheets, found ${productionSheets.length}.`);
if (loraSheets.length !== 6) throw new Error(`Expected 6 recovered LoRA sheets, found ${loraSheets.length}.`);
if (new Set(characterLibrary.map((item) => item.id)).size !== characterLibrary.length) throw new Error('Recovered character ids must be unique.');
for (const sheet of productionSheets) {
  if (!characterLibrary.some((character) => character.id === sheet.character_id)) throw new Error(`Production sheet has no recovered character: ${sheet.character_id}`);
}
for (const sheet of loraSheets) {
  if (!characterLibrary.some((character) => character.id === sheet.character_id)) throw new Error(`LoRA sheet has no recovered character: ${sheet.character_id}`);
  if (!sheet.trigger_token || !sheet.visual_lock) throw new Error(`LoRA sheet is incomplete: ${sheet.character_id}`);
}

for (const character of project.characters) {
  if (!character.portrait?.startsWith('./assets/characters/')) throw new Error(`Portrait path missing for ${character.id}.`);
  await access(new URL(`../${character.portrait.slice(2)}`, import.meta.url));
  const state = String(character.state || '').toLowerCase();
  if (!state.includes('text-canon gesperrt') || !state.includes('masterreferenz')) throw new Error(`Core character state must disclose locked text and unresolved visual canon: ${character.id}`);
}

const technicalCharacterManifest = JSON.parse(await readFile(new URL('../series/ricco-im-haus/characters/ricco/character.json', import.meta.url), 'utf8'));
if (technicalCharacterManifest.id !== 'ricco') throw new Error('Technical Ricco character manifest has the wrong id.');
const scene = JSON.parse(await readFile(new URL('../series/ricco-im-haus/episodes/m1-life-sign/scene.json', import.meta.url), 'utf8'));
if (scene.shot?.line !== project.m1Spec.testLine) throw new Error('Scene and project test lines differ.');
if (scene.format?.width !== 1080 || scene.format?.height !== 1920 || scene.format?.fps !== 30) throw new Error('M1 export contract is invalid.');
if (scene.format?.durationSeconds < 3 || scene.format?.durationSeconds > 5) throw new Error('M1 duration must stay between 3 and 5 seconds.');

for (const file of ['app.js', 'api/bot.mjs', 'api/health.mjs', 'lib/context.mjs', 'lib/browser-director.mjs', 'scripts/check.mjs', 'tests/bot.test.mjs', 'tests/browser-director.test.mjs']) {
  const result = spawnSync(process.execPath, ['--check', new URL(`../${file}`, import.meta.url).pathname], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Syntax check failed for ${file}: ${result.stderr}`);
}
for (const file of ['scripts/recover_assets.py', 'tests/test_asset_recovery.py']) {
  const result = spawnSync('python3', ['-m', 'py_compile', new URL(`../${file}`, import.meta.url).pathname], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Python syntax check failed for ${file}: ${result.stderr}`);
}

const renderScript = await readFile(new URL('../scripts/render_m1.py', import.meta.url), 'utf8');
for (const marker of ['Pillow', 'espeak-ng', 'ffmpeg', 'ffprobe', 'mouth_state', 'probe_master', 'technical-proof-only']) if (!renderScript.includes(marker)) throw new Error(`M1 renderer contract missing: ${marker}`);
const recoveryScanner = await readFile(new URL('../scripts/recover_assets.py', import.meta.url), 'utf8');
for (const marker of ['readOnlySourceScan', 'sha256', 'duplicateGroups', 'FORBIDDEN_PROJECT_TOKENS', 'chris-fact-radar-studio', 'followlinks=False', '_recovery_reports']) if (!recoveryScanner.includes(marker)) throw new Error(`Asset scanner safety marker missing: ${marker}`);
const recoveryTest = await readFile(new URL('../tests/test_asset_recovery.py', import.meta.url), 'utf8');
for (const marker of ['test_scan_is_read_only', 'test_forbidden_root_is_rejected', 'chris-fact-radar-studio', 'duplicateGroups']) if (!recoveryTest.includes(marker)) throw new Error(`Asset scanner test marker missing: ${marker}`);

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
for (const marker of ['id="metrics"', 'id="timeline"', 'id="chat"', 'id="characters"', 'id="tasks"', 'id="systemStatus"', 'id="apiUrl"', 'id="m1Video"', 'id="m1ProofStatus"', 'id="m1ProofMeta"', 'id="healthM1"', 'M1R · Canon & Asset Recovery', 'Keine neue Figur · kein neuer Pilot']) if (!index.includes(marker)) throw new Error(`Dashboard marker missing: ${marker}`);
for (const forbidden of ['Entwickle eine neue Nebenfigur', 'Schreibe ein 20-Sekunden-Drehbuch']) if (index.includes(forbidden)) throw new Error(`Dashboard still offers a forbidden M1R action: ${forbidden}`);
for (const relativeAsset of ['href="./styles.css"', 'href="./m1.css"', 'src="./app.js"', 'src="./media/m1/ricco-life-sign.mp4"']) if (!index.includes(relativeAsset)) throw new Error(`GitHub Pages relative asset missing: ${relativeAsset}`);

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
for (const marker of ["from './lib/browser-director.mjs'", "new URL('./project/project.json', import.meta.url)", "new URL('./project/canon.json', import.meta.url)", "new URL('./project/character-library.json', import.meta.url)", "new URL('./project/character-production-sheets.json', import.meta.url)", "new URL('./project/lora-training-sheets.json', import.meta.url)", "new URL('./media/m1/render-report.json', import.meta.url)", 'character.portrait', 'legacyCharacters.map']) if (!app.includes(marker)) throw new Error(`Dashboard data contract missing: ${marker}`);

const context = await readFile(new URL('../lib/context.mjs', import.meta.url), 'utf8');
for (const marker of ['M1R Canon & Asset Recovery', 'vier gesperrte Merge-Bibles', 'Ricco: 24', 'Basti Prenzl: 44', 'Jule: 29', 'Don Miau', 'spricht niemals', 'read-only-Asset-Scan', 'Keine neue Figur', 'Chris Fact Radar']) if (!context.includes(marker)) throw new Error(`Director context marker missing: ${marker}`);

const audit = await readFile(new URL('../docs/PROJECT_TRUTH_AUDIT.md', import.meta.url), 'utf8');
for (const marker of ['Rico gegen Berlin', 'Ricco im Haus', '33951d7', 'M1R – Canon & Asset Recovery', 'Tatsächliche visuelle Character-Sheet-Bilddateien']) if (!audit.includes(marker)) throw new Error(`Truth audit marker missing: ${marker}`);
const recovery = await readFile(new URL('../docs/ASSET_RECOVERY_CHECKLIST.md', import.meta.url), 'utf8');
for (const marker of ['kein `git clean`', '_recovery_reports', 'public/generated', 'CANON_CANDIDATE', 'Chris Fact Radar']) if (!recovery.includes(marker)) throw new Error(`Asset recovery safety marker missing: ${marker}`);
const localRecovery = await readFile(new URL('../docs/LOCAL_ASSET_RECOVERY_RUNBOOK.md', import.meta.url), 'utf8');
for (const marker of ['python3 scripts/recover_assets.py', 'asset-recovery-inventory.json', 'read-only', 'Chris Fact Radar', 'git status --short']) if (!localRecovery.includes(marker)) throw new Error(`Local recovery runbook marker missing: ${marker}`);

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
if (!packageJson.scripts?.test?.includes('test_asset_recovery.py')) throw new Error('Standard test command must include asset recovery safety tests.');
const gitignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8');
if (!gitignore.includes('_recovery_reports/')) throw new Error('Recovery reports must remain ignored by Git.');
const ciWorkflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
for (const marker of ['ffmpeg', 'espeak-ng', 'pillow==11.3.0', 'python scripts/render_m1.py', 'actions/upload-artifact', 'Verify read-only asset scanner independently', 'test_asset_recovery.py']) if (!ciWorkflow.includes(marker)) throw new Error(`CI contract marker missing: ${marker}`);
const pagesWorkflow = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
for (const marker of ['actions/configure-pages', 'actions/upload-pages-artifact', 'actions/deploy-pages', '_site/lib', 'cp -R assets _site/', 'python scripts/render_m1.py', '_site/media/m1', 'ricco-life-sign.mp4', 'render-report.json', 'm1.css', 'project/canon.json', 'project/cast-merge-decisions.json', 'project/merge-bibles', 'Verify published canon artifact before deployment']) if (!pagesWorkflow.includes(marker)) throw new Error(`Pages workflow marker missing: ${marker}`);
const outcomeWorkflow = await readFile(new URL('../.github/workflows/pages-outcome.yml', import.meta.url), 'utf8');
for (const marker of ['workflow_run', 'Deploy Comic Factory Dashboard', '[DEPLOY PROOF]', '[DEPLOY BLOCKER]', 'issues: write']) if (!outcomeWorkflow.includes(marker)) throw new Error(`Pages outcome marker missing: ${marker}`);

const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const securityHeaders = JSON.stringify(vercel.headers || []);
for (const header of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy']) if (!securityHeaders.includes(header)) throw new Error(`Security header missing: ${header}`);

console.log('Comic Factory checks passed: locked story and four text character bibles, visual recovery gate, recovered library, read-only scanner, project isolation, technical M1 proof, bot controls, CI, security and Pages publishing.');
