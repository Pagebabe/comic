export type Status = 'draft' | 'generated' | 'needs_fix' | 'approved' | 'rejected' | 'assembled' | 'exported' | 'active';

export type RiskLevel = 'low' | 'medium' | 'high' | 'insane';

export type JobStatus = 'queued' | 'running' | 'blocked' | 'done';

export interface RendererAdapter {
  id: string;
  name: string;
  type: string;
  best_for: string;
  input: string;
  output: string;
  pros: string[];
  cons: string[];
}

export interface LoraTrainingSheet {
  character_id: string;
  trigger_token: string;
  dataset_target: string;
  priority: string;
  visual_lock: string;
  turnaround_shots: string[];
  expression_set: string[];
  outfit_variants: string[];
  required_props: string[];
  caption_template: string;
  negative_training_notes: string[];
}

export interface EpisodeBuilderScene {
  id: string;
  episode_id: string;
  scene_number: number;
  title: string;
  story_function: string;
  location_id: string;
  characters: string[];
  emotional_turn: string;
  conflict: string;
  punchline: string;
  tv_shot_ids: string[];
  required_assets: string[];
  continuity_checks: string[];
}

export interface TvShot {
  id: string;
  episode_id: string;
  timecode: string;
  duration: number;
  shot_type: string;
  location: string;
  characters: string[];
  action: string;
  camera: string;
  animation: string;
  voice: DialogueLine[];
  sound: string[];
  prompt: string;
  negative_prompt: string;
}

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

export interface CharacterProductionSheet {
  character_id: string;
  video_function: string;
  voice_direction: string;
  animation_notes: string[];
  generator_prompt: string;
  negative_prompt: string;
  fatal_errors: string[];
}

export interface LocationProductionSheet {
  location_id: string;
  video_function: string;
  establishing_prompt: string;
  detail_prompt: string;
  negative_prompt: string;
  continuity_rules: string[];
  reusable_shots: string[];
}

export interface ProductionJob {
  id: string;
  title: string;
  stage: string;
  owner: 'human' | 'machine';
  status: JobStatus;
  input: string;
  output: string;
  checklist: string[];
}

export interface StoryBible {
  id: string;
  title: string;
  subtitle: string;
  premise: string;
  format: string;
  core_engine: string;
  no_speech_bubble_rule: string;
  tone_rules: string[];
  world_rules: string[];
  recurring_conflicts: string[];
  future_topics: string[];
  forbidden_rules: string[];
}

export interface Location {
  id: string;
  name: string;
  type: string;
  description: string;
  visual_rules: string[];
  recurring_props: string[];
  story_function: string;
  danger_level: RiskLevel;
  status: Status;
}

export interface StyleGuide {
  id: string;
  name: string;
  line_style: string;
  color_palette: string[];
  exaggeration_rules: string[];
  real_world_reference_rules: string[];
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
