import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const outRoot = join(root, 'outputs', 'prompt-packs');

function readSeedFile(path) {
  const source = readFileSync(join(root, path), 'utf8')
    .replace(/import type[^;]+;\n/g, '')
    .replace(/export const \w+: [^=]+ =/, 'globalThis.__value =');

  const sandbox = { globalThis: {} };
  vm.runInNewContext(source, sandbox, { filename: path });
  return sandbox.globalThis.__value;
}

const characters = readSeedFile('src/data/characters.ts');
const locations = readSeedFile('src/data/locations.ts');
const scenes = readSeedFile('src/data/scenes.ts');

const panelSources = [
  'src/data/panels.scene001.ts',
  'src/data/panels.scene002.ts',
  'src/data/panels.scene003.ts',
  'src/data/panel016Ready.ts',
  'src/data/panel017Ready.ts',
  'src/data/panelsRemaining.ts',
  'src/data/panel021.ts',
  'src/data/panel022.ts',
  'src/data/panel023.ts',
  'src/data/panel024.ts',
  'src/data/panel025.ts',
  'src/data/panel026.ts',
  'src/data/panel027.ts',
  'src/data/panel028.ts',
  'src/data/panel029.ts',
  'src/data/panel030.ts'
];

const panels = panelSources.flatMap((path) => {
  const value = readSeedFile(path);
  return Array.isArray(value) ? value : [value];
});

function getScene(panel) {
  return scenes.find((scene) => scene.id === panel.sceneId);
}

function getLocation(scene) {
  return scene ? locations.find((location) => location.id === scene.locationId) : undefined;
}

function getCharacters(scene) {
  return scene ? characters.filter((character) => scene.characterIds.includes(character.id)) : [];
}

function sortPanelsByScene(inputPanels) {
  return inputPanels.slice().sort((left, right) => {
    const leftScene = getScene(left);
    const rightScene = getScene(right);
    const sceneOrder = (leftScene?.order ?? 999) - (rightScene?.order ?? 999);
    return sceneOrder || left.order - right.order;
  });
}

function buildPanelPrompt(panel, scene, sceneCharacters, location) {
  const characterDescriptions = sceneCharacters
    .map((character) => [
      `Character: ${character.name}`,
      `Role: ${character.role}`,
      `Visual description: ${character.visualDescription}`,
      `Clothing: ${character.clothing}`,
      `Personality: ${character.personality}`,
      `Speech style: ${character.speechStyle}`
    ].join('\n'))
    .join('\n\n');

  return [
    'Cartoon panel for a satirical Berlin comic series.',
    'Style: gritty urban cartoon, clean readable shapes, expressive faces, consistent character design, dry social satire.',
    '',
    characterDescriptions,
    '',
    `Location: ${location.name}`,
    `Location description: ${location.description}`,
    `Visual rules: ${location.visualRules}`,
    '',
    `Scene: ${scene.title}`,
    `Scene summary: ${scene.summary}`,
    `Scene conflict: ${scene.conflict}`,
    '',
    `Shot type: ${panel.shotType}`,
    `Visual description: ${panel.visualDescription}`,
    `Action: ${panel.action}`,
    `Mood: ${panel.mood}`,
    '',
    'Composition rules:',
    '- No speech bubbles.',
    '- No readable text inside the image.',
    '- Leave clean space for dialogue placement later.',
    '- Keep the frame readable as a comic panel.',
    '- Keep character appearance consistent.',
    '- Avoid photorealism.',
    '- Avoid random extra characters unless requested.',
    '- Avoid distorted hands, broken faces, unreadable objects.',
    '',
    'Output: one finished clean comic panel illustration.'
  ].join('\n');
}

const promptPayload = sortPanelsByScene(panels).map((panel) => {
  const scene = getScene(panel);
  const location = getLocation(scene);
  const sceneCharacters = getCharacters(scene);
  const prompt = scene && location
    ? buildPanelPrompt(panel, scene, sceneCharacters, location)
    : 'Missing scene or location data.';

  return {
    panelId: panel.id,
    sceneId: panel.sceneId,
    sceneOrder: scene?.order ?? null,
    sceneTitle: scene?.title ?? null,
    location: location?.name ?? null,
    status: panel.status,
    shotType: panel.shotType,
    visualDescription: panel.visualDescription,
    action: panel.action,
    dialogue: panel.dialogue,
    mood: panel.mood,
    prompt
  };
});

const markdown = promptPayload
  .map((item) => [
    `## ${item.panelId}`,
    '',
    `Scene: ${item.sceneOrder ?? '?'} - ${item.sceneTitle ?? item.sceneId}`,
    `Status: ${item.status}`,
    `Shot: ${item.shotType}`,
    `Dialogue: ${item.dialogue || 'None'}`,
    '',
    '```text',
    item.prompt,
    '```'
  ].join('\n'))
  .join('\n\n---\n\n');

const index = {
  id: 'rico_gegen_berlin_pilot_prompt_pack',
  createdAt: new Date().toISOString(),
  outputRoot: 'outputs/prompt-packs',
  panels: promptPayload.length,
  promptReady: promptPayload.filter((item) => item.status === 'prompt_ready').length,
  files: {
    markdown: 'outputs/prompt-packs/pilot-prompts.md',
    json: 'outputs/prompt-packs/pilot-prompts.json'
  }
};

mkdirSync(outRoot, { recursive: true });
writeFileSync(join(outRoot, 'pilot-prompts.md'), markdown, 'utf8');
writeFileSync(join(outRoot, 'pilot-prompts.json'), JSON.stringify(promptPayload, null, 2), 'utf8');
writeFileSync(join(outRoot, 'index.json'), JSON.stringify(index, null, 2), 'utf8');

console.log(`wrote ${index.files.markdown}`);
console.log(`wrote ${index.files.json}`);
console.log(`panels: ${index.panels}`);
console.log(`prompt_ready: ${index.promptReady}`);
