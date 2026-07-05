import type { Character, Location, Panel, Scene } from '../types/comic';

export function buildPanelPrompt(
  panel: Panel,
  scene: Scene,
  characters: Character[],
  location: Location
): string {
  const characterDescriptions = characters
    .map((character) => {
      return [
        `Character: ${character.name}`,
        `Role: ${character.role}`,
        `Visual description: ${character.visualDescription}`,
        `Clothing: ${character.clothing}`,
        `Personality: ${character.personality}`,
        `Speech style: ${character.speechStyle}`
      ].join('\n');
    })
    .join('\n\n');

  return [
    'Cartoon panel for an adult satirical Berlin comic series.',
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
