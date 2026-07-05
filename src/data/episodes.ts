import type { Episode } from '../types/comic';

export const episodes: Episode[] = [
  {
    id: 'episode_001',
    seriesTitle: 'Rico gegen Berlin',
    title: 'Die Entkommerzialisierungsgebuehr',
    logline:
      'Rico zieht in ein alternatives Berliner Haus und merkt langsam, dass der fruehere Hausbesetzer, der ihm das Zimmer vermittelt, inzwischen selbst wie ein ueberteuerter Vermieter handelt.',
    status: 'storyboard',
    characterIds: ['rico', 'vermieter', 'goerli_cats'],
    locationIds: ['haus_nebenwirkung', 'prenzlauer_berg_flat', 'goerlitzer_park'],
    sceneIds: [
      'scene_001',
      'scene_002',
      'scene_003',
      'scene_004',
      'scene_005',
      'scene_006'
    ]
  }
];
