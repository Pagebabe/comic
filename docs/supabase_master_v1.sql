-- ============================================================
-- RICCO COMIC FACTORY / VOMIC
-- SUPABASE MASTER SQL V1
-- Schema + base seed data for the next backend stage
-- ============================================================

-- Safe to run more than once during MVP setup.

create table if not exists characters (
  id text primary key,
  name text not null,
  slug text unique not null,
  role text,
  description text,
  visual_description text,
  personality text,
  fixed_traits jsonb default '[]',
  no_go jsonb default '[]',
  trigger_word text,
  default_outfit_id text,
  status text default 'draft',
  version text default 'v1',
  reference_pack_path text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists character_outfits (
  id text primary key,
  character_id text references characters(id) on delete cascade,
  name text not null,
  slug text not null,
  token text,
  description text,
  prompt_block text,
  status text default 'draft',
  version text default 'v1',
  reference_asset_ids jsonb default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists locations (
  id text primary key,
  name text not null,
  slug text unique not null,
  token text,
  type text,
  description text,
  visual_description text,
  fixed_elements jsonb default '[]',
  color_palette jsonb default '[]',
  lighting_default text,
  no_go jsonb default '[]',
  status text default 'draft',
  version text default 'v1',
  reference_pack_path text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists styles (
  id text primary key,
  name text not null,
  slug text unique not null,
  token text,
  description text,
  style_prompt text,
  negative_prompt text,
  line_style text,
  color_style text,
  background_style text,
  no_go jsonb default '[]',
  status text default 'draft',
  version text default 'v1',
  reference_asset_ids jsonb default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists props (
  id text primary key,
  name text not null,
  slug text unique not null,
  description text,
  visual_description text,
  prompt_block text,
  owner_character_id text references characters(id),
  location_id text references locations(id),
  status text default 'draft',
  version text default 'v1',
  reference_asset_ids jsonb default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists prompt_blocks (
  id text primary key,
  name text not null,
  slug text unique not null,
  type text not null,
  content text not null,
  version text default 'v1',
  status text default 'testing',
  file_path text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists prompt_templates (
  id text primary key,
  name text not null,
  slug text unique not null,
  type text not null,
  template_structure text not null,
  required_blocks jsonb default '[]',
  optional_blocks jsonb default '[]',
  negative_template_id text,
  version text default 'v1',
  status text default 'testing',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists episodes (
  id text primary key,
  episode_number int,
  title text not null,
  slug text unique not null,
  logline text,
  summary text,
  status text default 'idea',
  version text default 'v1',
  main_character_ids jsonb default '[]',
  location_ids jsonb default '[]',
  theme_tags jsonb default '[]',
  outline_path text,
  export_path text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists scenes (
  id text primary key,
  episode_id text references episodes(id) on delete cascade,
  scene_number int,
  title text not null,
  slug text not null,
  summary text,
  location_id text references locations(id),
  character_ids jsonb default '[]',
  status text default 'draft',
  version text default 'v1',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists prompts (
  id text primary key,
  prompt_template_id text references prompt_templates(id),
  name text not null,
  slug text unique not null,
  positive_prompt text not null,
  negative_prompt text,
  style_id text references styles(id),
  character_ids jsonb default '[]',
  location_id text references locations(id),
  prop_ids jsonb default '[]',
  episode_id text references episodes(id),
  scene_id text references scenes(id),
  panel_id text,
  version text default 'v1',
  status text default 'testing',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists generation_jobs (
  id text primary key,
  workflow_id text,
  workflow_version text default 'v1',
  job_type text,
  prompt_id text references prompts(id),
  positive_prompt text,
  negative_prompt text,
  model_id text,
  lora_ids jsonb default '[]',
  seed text,
  sampler text,
  steps int,
  cfg numeric,
  resolution_width int,
  resolution_height int,
  batch_size int,
  batch_count int,
  output_path text,
  status text default 'queued',
  error_message text,
  episode_id text references episodes(id),
  scene_id text references scenes(id),
  panel_id text,
  subject_type text,
  subject_id text,
  notes text,
  comfyui_prompt_id text,
  comfyui_client_id text,
  comfyui_api_url text,
  comfyui_response jsonb default '{}',
  workflow_payload jsonb default '{}',
  api_submitted_at timestamptz,
  api_checked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists assets (
  id text primary key,
  file_name text not null,
  file_path text not null,
  thumbnail_path text,
  asset_type text not null,
  subject_type text,
  subject_id text,
  status text default 'raw',
  score int,
  version text default 'v1',
  width int,
  height int,
  format text,
  prompt_id text references prompts(id),
  generation_job_id text references generation_jobs(id),
  model_id text,
  seed text,
  workflow_id text,
  usable_for_reference boolean default false,
  usable_for_dataset boolean default false,
  usable_for_panel boolean default false,
  rejection_reason text,
  review_notes text,
  approved_for jsonb default '[]',
  metadata jsonb default '{}',
  source text default 'manual_import',
  imported_at timestamptz default now(),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists panels (
  id text primary key,
  episode_id text references episodes(id) on delete cascade,
  scene_id text references scenes(id) on delete cascade,
  panel_number int,
  title text,
  slug text,
  description text,
  panel_type text,
  location_id text references locations(id),
  character_ids jsonb default '[]',
  prop_ids jsonb default '[]',
  dialogue_ids jsonb default '[]',
  prompt_id text references prompts(id),
  approved_asset_id text references assets(id),
  status text default 'draft',
  version text default 'v1',
  continuity_notes text,
  layout_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists dialogues (
  id text primary key,
  episode_id text references episodes(id) on delete cascade,
  scene_id text references scenes(id) on delete cascade,
  panel_id text references panels(id) on delete cascade,
  character_id text references characters(id),
  dialogue_type text,
  text text not null,
  position_hint text,
  status text default 'draft',
  version text default 'v1',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists quality_reviews (
  id text primary key,
  asset_id text references assets(id) on delete cascade,
  review_type text not null,
  reviewer text,
  score_total int,
  score_face int,
  score_style int,
  score_location int,
  score_composition int,
  score_prompt_fit int,
  score_dataset_fit int,
  decision text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists exports (
  id text primary key,
  episode_id text references episodes(id) on delete cascade,
  export_type text not null,
  file_path text,
  version text default 'v1',
  status text default 'draft',
  width int,
  height int,
  format text,
  included_panel_ids jsonb default '[]',
  notes text,
  created_at timestamptz default now()
);

create table if not exists loras (
  id text primary key,
  name text not null,
  slug text unique not null,
  type text,
  subject_id text,
  trigger_word text,
  base_model_id text,
  version text default 'v1',
  file_path text,
  dataset_path text,
  training_notes_path text,
  evaluation_report_path text,
  recommended_weight_min numeric,
  recommended_weight_max numeric,
  status text default 'not_started',
  known_strengths jsonb default '[]',
  known_weaknesses jsonb default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists models (
  id text primary key,
  name text not null,
  type text,
  file_name text,
  file_path text,
  base_family text,
  version text default 'v1',
  use_case text,
  status text default 'testing',
  strengths jsonb default '[]',
  weaknesses jsonb default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists workflows (
  id text primary key,
  name text not null,
  slug text unique not null,
  workflow_type text,
  version text default 'v1',
  file_path text,
  description text,
  input_schema jsonb default '{}',
  output_path_default text,
  status text default 'testing',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists issues (
  id text primary key,
  title text not null,
  area text,
  severity text,
  status text default 'open',
  description text,
  cause text,
  fix_plan text,
  related_asset_ids jsonb default '[]',
  related_character_ids jsonb default '[]',
  related_location_ids jsonb default '[]',
  related_lora_ids jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz
);

create table if not exists decisions (
  id text primary key,
  title text not null,
  status text default 'accepted',
  decision text,
  reason text,
  consequence text,
  date date default current_date,
  related_entities jsonb default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_assets_status on assets(status);
create index if not exists idx_assets_subject on assets(subject_type, subject_id);
create index if not exists idx_assets_asset_type on assets(asset_type);
create index if not exists idx_assets_score on assets(score);
create index if not exists idx_assets_prompt_id on assets(prompt_id);
create index if not exists idx_quality_reviews_asset_id on quality_reviews(asset_id);
create index if not exists idx_panels_episode_id on panels(episode_id);
create index if not exists idx_panels_scene_id on panels(scene_id);
create index if not exists idx_prompts_episode_id on prompts(episode_id);
create index if not exists idx_prompts_panel_id on prompts(panel_id);
create index if not exists idx_dialogues_panel_id on dialogues(panel_id);
create index if not exists idx_generation_jobs_status on generation_jobs(status);
create index if not exists idx_generation_jobs_prompt_id on generation_jobs(prompt_id);
create index if not exists idx_generation_jobs_panel_id on generation_jobs(panel_id);
create index if not exists idx_generation_jobs_subject on generation_jobs(subject_type, subject_id);
create index if not exists idx_generation_jobs_comfyui_prompt_id on generation_jobs(comfyui_prompt_id);

-- ------------------------------------------------------------
-- Base seed data aligned with the current Vite/React app
-- ------------------------------------------------------------

insert into characters (id, name, slug, role, description, visual_description, personality, fixed_traits, no_go, trigger_word, status, version, notes) values
('char_ricco', 'Ricco', 'ricco', 'main_character', 'Chaotischer Musiker und neuer Bewohner im Haus.', 'Schlank, müde Augen, zerzauste dunkle Haare, abgetragener Hoodie, Kopfhörer um den Hals.', 'Kreativ, impulsiv, konfliktscheu, charmant-chaotisch.', '["headphones around neck", "tired eyes", "messy dark hair", "worn hoodie", "never polished"]', '["luxury fashion", "perfect skin", "anime", "photorealistic", "AI influencer look"]', 'riccochar', 'testing', 'v1', 'Main production priority.'),
('char_basti', 'Basti Prenzl', 'basti_prenzl', 'antagonist', 'Illegaler Vermieter, Ex-Hausbesetzer und gentrifizierter Szene-Heuchler.', 'Mitte 40, runde Brille, gepflegter Bart, saubere Outdoorjacke, Jutebeutel, Coffee-to-go.', 'Pseudo-moralisch, weich redend, manipulativ, sehr gut im Rechtfertigen.', '["round glasses", "clean outdoor jacket", "tote bag", "moral smile", "looks cleaner than the house"]', '["criminal gangster", "CEO suit", "aggressive villain", "homeless punk"]', 'bastichar', 'testing', 'v1', 'Core hypocrisy antagonist.'),
('char_jule', 'Jule', 'jule', 'house_activist', 'Hausaktivistin und Plenum-Machtzentrum.', 'Messy Bob, kritischer Blick, Oversized-Pullover, Worker-Hose, Boots, Marker und Tape.', 'Dauerempört, kontrollierend, intelligent, moralisch bequem.', '["critical eyes", "oversized sweater", "worker pants", "boots", "marker or tape"]', '["glamour influencer", "office woman", "anime schoolgirl", "luxury fashion model"]', 'julechar', 'testing', 'v1', 'House politics pressure character.'),
('char_don_miau', 'Don Miau', 'don_miau', 'cat_boss', 'Boss der Katzen-Gang und heimlicher Besitzer des Hauses.', 'Dicke alte Katze, halb geschlossene gelbe Augen, Narbe am Ohr, schwerer Körper, struppiges dunkles Fell.', 'Ruhig, dominant, territorial, bedrohlich-komisch.', '["fat old cat", "half-closed yellow eyes", "scarred ear", "heavy sitting posture", "appears like he owns the place"]', '["cute kitten", "magical cat", "cartoon mascot", "talking mouth"]', 'donmiauchar', 'testing', 'v1', 'Silent recurring visual symbol.')
on conflict (id) do update set name = excluded.name, updated_at = now();

insert into locations (id, name, slug, token, type, description, visual_description, fixed_elements, color_palette, lighting_default, no_go, status, version, notes) values
('loc_haus_fassade', 'Hausfassade', 'haus_fassade', 'hausfassade', 'exterior', 'Außenansicht von Haus Nr. 13.', 'Alte Berliner Mietshausfassade mit Rissen, Graffiti, politischen Stickern, kaputten Klingelschildern und Fahrradleichen.', '["graffiti", "political stickers", "broken bicycles", "cracked facade", "dirty windows"]', '["dirty grey", "old beige", "rust", "washed green"]', 'cloudy Berlin daylight', '["luxury facade", "modern clean building", "suburban house"]', 'testing', 'v1', 'Opening location.'),
('loc_riccos_zimmer', 'Riccos Zimmer', 'riccos_zimmer', 'riccoszimmer', 'interior', 'Riccos kleines überteuertes Zimmer.', 'Winziges Zimmer mit Palettenmatratze, Schimmel, kaputtem Fenster, Kabeln und billigem Musik-Setup.', '["pallet mattress", "laptop", "cables", "cheap microphone", "mold", "broken window"]', '["dirty grey", "brown", "warm yellow", "blue laptop glow"]', 'small lamp plus laptop glow', '["luxury loft", "clean studio", "modern bedroom"]', 'testing', 'v1', 'Main room location.'),
('loc_flur', 'Flur / Treppenhaus', 'flur_treppenhaus', 'flurtreppenhaus', 'interior', 'Enges dunkles Treppenhaus voller Zettel und Hausregeln.', 'Schmutziger enger Flur mit politischen Stickern, alten Flyern, Schuhen und gelblichem Licht.', '["handwritten notes", "political stickers", "bad yellow light", "crooked doors", "shoes"]', '["dirty yellow", "grey", "brown", "rust"]', 'bad yellow stairwell light', '["hotel corridor", "modern clean hallway", "luxury lobby"]', 'testing', 'v1', 'Core conflict location.'),
('loc_kueche', 'Gemeinschaftsküche', 'gemeinschaftskueche', 'gemeinschaftskueche', 'interior', 'Chaotische Hausküche und sozialer Kriegsschauplatz.', 'Dreckige Pfannen, leere Hafermilch, Kühlschrankzettel, überquellender Müll und Katzen auf der Arbeitsplatte.', '["dirty pans", "oat milk", "fridge notes", "overflowing trash", "cats on counter"]', '["dirty white", "greasy yellow", "dark green", "grey"]', 'dirty kitchen daylight', '["designer kitchen", "luxury kitchen", "clean family kitchen"]', 'testing', 'v1', 'Recurring kitchen location.')
on conflict (id) do update set name = excluded.name, updated_at = now();

insert into styles (id, name, slug, token, description, style_prompt, negative_prompt, line_style, color_style, background_style, no_go, status, version, notes) values
('style_ricco_v1', 'Ricco Style V1', 'ricco_style_v1', 'riccostyle', 'Gritty adult satirical cartoon.', 'Gritty adult satirical cartoon set in a run-down Berlin squat house, bold black outlines, exaggerated but grounded character designs, muted dirty urban color palette, expressive faces, imperfect proportions, detailed messy backgrounds, political stickers, graffiti, handwritten notes, lived-in chaos, bittersweet social satire, cinematic comic panel composition, rough urban texture.', 'photorealistic, hyperrealistic, glossy 3D render, clean corporate illustration, anime, manga, children cartoon, cute mascot, luxury lifestyle, perfect skin, beauty influencer style, sterile modern interior, fantasy armor, superhero costume, over-polished digital art, generic stock image, empty background, symmetrical perfect faces, bright toy-like colors, realistic photo, cinematic live action still, AI influencer look, watermark, signature', 'bold black outlines', 'muted dirty urban palette', 'messy Berlin squat backgrounds', '["Simpsons clone", "Hotze clone", "anime", "AI influencer look", "Disney/Pixar look"]', 'testing', 'v1', 'Main series look.')
on conflict (id) do update set style_prompt = excluded.style_prompt, updated_at = now();

insert into episodes (id, episode_number, title, slug, logline, summary, status, version, main_character_ids, location_ids, theme_tags, notes) values
('ep_001', 1, 'Das Zimmer', 'das_zimmer', 'Ricco zieht in sein neues günstiges Zimmer ein und merkt, dass er nicht in eine solidarische Wohnform geraten ist, sondern in eine sehr teure Absurdität mit politischem Anstrich.', 'Pilotfolge mit Ricco, Basti, Jule und Don Miau im Haus Nr. 13.', 'panels_ready', 'v1', '["char_ricco", "char_basti", "char_jule", "char_don_miau"]', '["loc_haus_fassade", "loc_riccos_zimmer", "loc_flur", "loc_kueche"]', '["housing", "scene_hypocrisy", "catgang", "gentrification"]', 'Aligned with src/data/riccoStudio.ts.')
on conflict (id) do update set title = excluded.title, updated_at = now();

insert into workflows (id, name, slug, workflow_type, version, file_path, description, output_path_default, status, notes) values
('WF-001', 'Style Test Generator', 'style_test_generator', 'style_test', 'v1', 'workflows/comfyui/wf001_style_test_generator_v1.json', 'Generates style test frames.', 'public/generated/style_tests/', 'planned', null),
('WF-002', 'Character Reference Generator', 'character_reference_generator', 'character_reference', 'v1', 'workflows/comfyui/wf002_character_reference_generator_v1.json', 'Generates character reference images.', 'public/generated/characters/', 'planned', null),
('WF-004', 'Location Reference Generator', 'location_reference_generator', 'location_reference', 'v1', 'workflows/comfyui/wf004_location_reference_generator_v1.json', 'Generates location reference images.', 'public/generated/locations/', 'planned', null),
('WF-006', 'Panel Generator', 'panel_generator', 'panel', 'v1', 'workflows/comfyui/wf006_panel_generator_v1.json', 'Generates final or candidate panel images.', 'public/generated/panels/', 'planned', null)
on conflict (id) do update set status = excluded.status, updated_at = now();

insert into decisions (id, title, status, decision, reason, consequence, related_entities, notes) values
('DEC-001', 'Comic Factory is not AI Influencer Dashboard', 'accepted', 'This repository remains a focused Comic Factory for Ricco im Haus.', 'Avoid mixing influencer funnel logic back into the comic production app.', 'No DM automation, social warmup, fan CRM or revenue funnel in this repo.', '["project", "repo"]', null),
('DEC-002', 'Keep current Vite app as production surface', 'accepted', 'The active app is Vite/React on port 3100, not a Next.js rewrite.', 'Current repo already has Ricco control room, asset import, review, storage and export routes.', 'Supabase/API work must adapt to the existing Vite architecture.', '["vite", "react", "ricco-control"]', null),
('DEC-003', 'Supabase is next backend stage, not forced immediately', 'accepted', 'Use this SQL as the backend migration target after local workflow is stable.', 'The current app uses typed seed data and browser storage successfully.', 'Move to Supabase after manual production loop proves stable.', '["supabase", "assets", "reviews"]', null)
on conflict (id) do update set decision = excluded.decision, updated_at = now();
