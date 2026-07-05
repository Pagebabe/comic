import type { Panel } from '../types/comic';
import { scene001Panels } from './panels.scene001';
import { scene002Panels } from './panels.scene002';
import { scene003Panels } from './panels.scene003';
import { scene004Panels } from './panelsScene004';
import { panel017 } from './panel017';

function makePlaceholderPanel(panelNumber: number, sceneId: string, order: number): Panel {
  return {
    id: `panel_${String(panelNumber).padStart(3, '0')}`,
    sceneId,
    order,
    shotType: 'medium',
    visualDescription: 'Seed placeholder panel for the pilot storyboard. Replace with final visual beat before render.',
    action: 'Storyboard beat placeholder.',
    dialogue: '',
    mood: 'draft',
    imageIds: [],
    status: 'draft'
  };
}

const remainingPanels: Panel[] = [
  makePlaceholderPanel(18, 'scene_004', 3),
  makePlaceholderPanel(19, 'scene_004', 4),
  makePlaceholderPanel(20, 'scene_004', 5),
  makePlaceholderPanel(21, 'scene_005', 1),
  makePlaceholderPanel(22, 'scene_005', 2),
  makePlaceholderPanel(23, 'scene_005', 3),
  makePlaceholderPanel(24, 'scene_005', 4),
  makePlaceholderPanel(25, 'scene_005', 5),
  makePlaceholderPanel(26, 'scene_006', 1),
  makePlaceholderPanel(27, 'scene_006', 2),
  makePlaceholderPanel(28, 'scene_006', 3),
  makePlaceholderPanel(29, 'scene_006', 4),
  makePlaceholderPanel(30, 'scene_006', 5)
];

export const panels: Panel[] = [
  ...scene001Panels,
  ...scene002Panels,
  ...scene003Panels,
  ...scene004Panels,
  panel017,
  ...remainingPanels
];
