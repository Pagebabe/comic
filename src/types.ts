export type Status = 'draft' | 'generated' | 'needs_fix' | 'approved' | 'rejected' | 'assembled' | 'exported' | 'active';

export type RiskLevel = 'low' | 'medium' | 'high' | 'insane';

export interface Character {
  id: string;
  name: string;
  role: string;
  personality: string;
  visual_description: string;
  outfit_rules: string;
  face_rules: string;
  catchphrases: string[];
  status: Status;
}

export interface StyleGuide {
  id: string;
  name: string;
  line_style: string;
  color_palette: string[];
  character_rules: string[];
  background_rules: string[];
  camera_rules: string[];
  negative_rules: string[];
}

export interface DialogueLine {
  character: string;
  line: string;
}

export interface Episode {
  id: string;
  title: string;
  logline: string;
  hook: string;
  conflict: string;
  ending: string;
  status: Status;
  format: string;
  scenes: Scene[];
}

export interface Scene {
  scene_number: number;
  location: string;
  action: string;
  characters: string[];
  dialogue: string;
  emotion: string;
}

export interface ShotVariant {
  variant_id: string;
  image_url: string;
  status: Status;
  notes: string;
  auto_score: number;
}

export interface Shot {
  id: string;
  episode_id: string;
  scene_number: number;
  shot_number: number;
  duration: number;
  location: string;
  camera: string;
  characters: string[];
  action: string;
  dialogue: DialogueLine[];
  emotion: string;
  risk: RiskLevel;
  prompt: string;
  negative_prompt: string;
  seed: number;
  status: Status;
  continuity_score: number;
  variants: ShotVariant[];
}
