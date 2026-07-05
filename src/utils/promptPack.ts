import type { Character, Location, Panel, Scene } from '../types/comic';
import { buildPanelPrompt } from './promptBuilder';

type PromptPackInput = {
  panels: Panel[];
  scenes: Scene[];
  characters: Character[];
  locations: Location[];
};

function getScene(panel: Panel, scenes: Scene[]): Scene | undefined {
  return scenes.find((scene) => scene.id === panel.sceneId);
}

function getLocation(scene: Scene | undefined, locations: Location[]): Location | undefined {
  return scene ? locations.find((location) => location.id === scene.locationId) : undefined;
}

function getCharacters(scene: Scene | undefined, characters: Character[]): Character[] {
  return scene ? characters.filter((character) => scene.characterIds.includes(character.id)) : [];
}

export function sortPanelsByScene(panels: Panel[], scenes: Scene[]): Panel[] {
  return panels.slice().sort((left, right) => {
    const leftScene = getScene(left, scenes);
    const rightScene = getScene(right, scenes);
    const sceneOrder = (leftScene?.order ?? 999) - (rightScene?.order ?? 999);
    return sceneOrder || left.order - right.order;
  });
}

export function buildPromptPackMarkdown({ panels, scenes, characters, locations }: PromptPackInput): string {
  return sortPanelsByScene(panels, scenes)
    .map((panel) => {
      const scene = getScene(panel, scenes);
      const location = getLocation(scene, locations);
      const sceneCharacters = getCharacters(scene, characters);
      const prompt = scene && location
        ? buildPanelPrompt(panel, scene, sceneCharacters, location)
        : 'Missing scene or location data.';

      return [
        `## ${panel.id}`,
        '',
        `Scene: ${scene?.order ?? '?'} - ${scene?.title ?? panel.sceneId}`,
        `Status: ${panel.status}`,
        `Shot: ${panel.shotType}`,
        `Dialogue: ${panel.dialogue || 'None'}`,
        '',
        '```text',
        prompt,
        '```'
      ].join('\n');
    })
    .join('\n\n---\n\n');
}

export function buildPromptPackJson({ panels, scenes, characters, locations }: PromptPackInput): string {
  const payload = sortPanelsByScene(panels, scenes).map((panel) => {
    const scene = getScene(panel, scenes);
    const location = getLocation(scene, locations);
    const sceneCharacters = getCharacters(scene, characters);

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
      prompt: scene && location
        ? buildPanelPrompt(panel, scene, sceneCharacters, location)
        : 'Missing scene or location data.'
    };
  });

  return JSON.stringify(payload, null, 2);
}
