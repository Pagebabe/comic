export type ComicStatus =
  | 'idea'
  | 'writing'
  | 'storyboard'
  | 'prompting'
  | 'rendering'
  | 'review'
  | 'done';

export type PanelStatus =
  | 'draft'
  | 'prompt_ready'
  | 'rendered'
  | 'needs_fix'
  | 'approved';

export type ShotType = 'wide' | 'medium' | 'closeup' | 'detail';

export type Character = {
  id: string;
  name: string;
  role: string;
  visualDescription: string;
  clothing: string;
  personality: string;
  speechStyle: string;
  runningGags: string[];
  relationships: string[];
  referenceImages: string[];
};

export type Location = {
  id: string;
  name: string;
  description: string;
  visualRules: string;
  recurringDetails: string[];
  referenceImages: string[];
};

export type Episode = {
  id: string;
  seriesTitle: string;
  title: string;
  logline: string;
  status: ComicStatus;
  characterIds: string[];
  locationIds: string[];
  sceneIds: string[];
};

export type Scene = {
  id: string;
  episodeId: string;
  title: string;
  order: number;
  locationId: string;
  characterIds: string[];
  summary: string;
  conflict: string;
  punchline: string;
  panelIds: string[];
};

export type Panel = {
  id: string;
  sceneId: string;
  order: number;
  shotType: ShotType;
  visualDescription: string;
  action: string;
  dialogue: string;
  mood: string;
  prompt?: string;
  imageIds: string[];
  selectedImageId?: string;
  status: PanelStatus;
};

export type Asset = {
  id: string;
  type: 'character_reference' | 'location_reference' | 'panel_render' | 'export';
  url: string;
  linkedToId: string;
  rating?: number;
  notes?: string;
};
