import type { Scene } from '../types/comic';

export const scenes: Scene[] = [
  {
    id: 'scene_001',
    episodeId: 'episode_001',
    title: 'Ankunft am Haus Nebenwirkung',
    order: 1,
    locationId: 'haus_nebenwirkung',
    characterIds: ['rico'],
    summary:
      'Rico kommt mit Rucksack am Haus Nebenwirkung an und glaubt, endlich bezahlbaren alternativen Wohnraum gefunden zu haben.',
    conflict:
      'Das Haus wirkt rebellisch und antikapitalistisch, aber ueberall haengen schon absurde Zahlungsforderungen.',
    punchline:
      'Auf dem Schild steht: Wohnraum ist keine Ware - Besichtigung 20 Euro bar.',
    panelIds: ['panel_001', 'panel_002', 'panel_003', 'panel_004', 'panel_005']
  },
  {
    id: 'scene_002',
    episodeId: 'episode_001',
    title: 'Der Vermittler erscheint',
    order: 2,
    locationId: 'haus_nebenwirkung',
    characterIds: ['rico', 'vermieter'],
    summary:
      'Der Vermittler oeffnet die Tuer und stellt sich als frueherer Aktivist und heutiger Raumkoordinator vor.',
    conflict:
      'Er redet wie ein Aktivist, verhaelt sich aber wie ein Makler.',
    punchline:
      'Er sagt, er wohne nicht mehr dort, sondern im Prenzlauer Berg wegen Work-Life-Balance.',
    panelIds: ['panel_006', 'panel_007', 'panel_008', 'panel_009', 'panel_010']
  },
  {
    id: 'scene_003',
    episodeId: 'episode_001',
    title: 'Die Zimmerbesichtigung',
    order: 3,
    locationId: 'haus_nebenwirkung',
    characterIds: ['rico', 'vermieter'],
    summary:
      'Rico sieht sein zukuenftiges Zimmer: klein, kaputt, feucht und trotzdem teuer.',
    conflict:
      'Jeder Mangel wird vom Vermittler politisch schoengeredet.',
    punchline: 'Waerme ist ein buergerliches Konstrukt.',
    panelIds: ['panel_011', 'panel_012', 'panel_013', 'panel_014', 'panel_015']
  },
  {
    id: 'scene_004',
    episodeId: 'episode_001',
    title: 'Die Kostenaufstellung',
    order: 4,
    locationId: 'haus_nebenwirkung',
    characterIds: ['rico', 'vermieter'],
    summary:
      'In der Kueche erklaert der Vermittler die monatlichen Kosten.',
    conflict:
      'Die Miete wird durch absurde Gebuehrennamen verschleiert.',
    punchline:
      'Der Vermittler nennt das Wort Miete ein Gewaltwort.',
    panelIds: ['panel_016', 'panel_017', 'panel_018', 'panel_019', 'panel_020']
  },
  {
    id: 'scene_005',
    episodeId: 'episode_001',
    title: 'Die Wahrheit im Flur',
    order: 5,
    locationId: 'haus_nebenwirkung',
    characterIds: ['rico', 'vermieter'],
    summary:
      'Ein Mitbewohner erklaert Rico, dass der Vermittler selbst gar nicht mehr im Haus wohnt.',
    conflict:
      'Rico versteht langsam, dass das Zimmer ueberteuert weitergegeben wird.',
    punchline:
      'Grosse Parolen, kleiner Schluesselbund.',
    panelIds: ['panel_021', 'panel_022', 'panel_023', 'panel_024', 'panel_025']
  },
  {
    id: 'scene_006',
    episodeId: 'episode_001',
    title: 'Willkommen im Widerstand',
    order: 6,
    locationId: 'haus_nebenwirkung',
    characterIds: ['rico', 'vermieter', 'goerli_cats'],
    summary:
      'Rico merkt, dass der Deal mies ist, unterschreibt aber trotzdem, weil er ein Zimmer braucht.',
    conflict:
      'Rico hat keine gute Alternative auf dem Berliner Wohnungsmarkt.',
    punchline:
      'Die Goerli-Katzen kommentieren seine Entscheidung trocken von der Seite.',
    panelIds: ['panel_026', 'panel_027', 'panel_028', 'panel_029', 'panel_030']
  }
];
