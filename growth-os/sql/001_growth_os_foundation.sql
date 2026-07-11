-- MKT0-002 · Growth OS foundation schema
-- Contract only. Not executed against any remote database.

create schema if not exists growth_os;

create table if not exists growth_os.tenants (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists growth_os.projects (
  id text primary key,
  tenant_id text not null references growth_os.tenants(id) on delete restrict,
  name text not null,
  mode text not null default 'shadow' check (mode = 'shadow'),
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create table if not exists growth_os.campaigns (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  name text not null,
  status text not null check (status in ('DRAFT','ACTIVE','PAUSED','COMPLETED')),
  created_at timestamptz not null,
  unique (tenant_id, project_id, id),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.content_items (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  campaign_id text,
  episode_package_id text not null,
  title text not null,
  status text not null check (status in ('READY','ARCHIVED')),
  created_at timestamptz not null,
  unique (tenant_id, project_id, id),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict,
  foreign key (campaign_id) references growth_os.campaigns(id) on delete restrict
);

create table if not exists growth_os.social_variants (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  content_id text not null references growth_os.content_items(id) on delete restrict,
  platform text not null check (platform in ('tiktok','instagram_reels','youtube_shorts')),
  status text not null check (status in ('PLANNED','READY','ARCHIVED')),
  created_at timestamptz not null,
  unique (tenant_id, project_id, id),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.publish_jobs (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  variant_id text not null references growth_os.social_variants(id) on delete restrict,
  state text not null check (state in ('DRAFT','POLICY_CHECK','WAITING_HUMAN','APPROVED_SHADOW','SIMULATED','FAILED','CANCELLED')),
  mode text not null default 'shadow' check (mode = 'shadow'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (tenant_id, project_id, id),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.metric_snapshots (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  variant_id text not null references growth_os.social_variants(id) on delete restrict,
  platform text not null check (platform in ('tiktok','instagram_reels','youtube_shorts')),
  captured_at timestamptz not null,
  metrics jsonb not null check (jsonb_typeof(metrics) = 'object'),
  provenance text not null default 'synthetic_fixture' check (provenance in ('synthetic_fixture','authorized_platform_import')),
  unique (tenant_id, project_id, variant_id, captured_at),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.comment_signals (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  variant_id text not null references growth_os.social_variants(id) on delete restrict,
  platform text not null,
  category text not null check (category in ('FAN_REACTION','QUESTION','EPISODE_IDEA','CRITICISM','RIGHTS','COLLAB','SPAM','CRISIS')),
  urgency text not null check (urgency in ('LOW','NORMAL','HIGH','CRITICAL')),
  source_ref text,
  created_at timestamptz not null,
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.trend_signals (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  source text not null,
  topic text not null,
  velocity numeric(5,2) not null check (velocity between 0 and 100),
  brand_fit numeric(5,2) not null check (brand_fit between 0 and 100),
  observed_at timestamptz not null,
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.hypotheses (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  statement text not null,
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  status text not null check (status in ('OBSERVED','TESTING','SUPPORTED','REJECTED','EXPIRED')),
  created_at timestamptz not null,
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.experiments (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  hypothesis_id text not null references growth_os.hypotheses(id) on delete restrict,
  changed_variable text not null,
  status text not null check (status in ('PLANNED','RUNNING','COMPLETED','CANCELLED')),
  created_at timestamptz not null,
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.production_briefs (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  source_analysis_id text not null,
  priority text not null check (priority in ('LOW','NORMAL','HIGH','CRITICAL')),
  recommendations jsonb not null check (jsonb_typeof(recommendations) = 'array'),
  human_approval_required boolean not null default true,
  created_at timestamptz not null,
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.events (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  stream text not null,
  sequence integer not null check (sequence > 0),
  type text not null,
  occurred_at timestamptz not null,
  actor text not null,
  mode text not null default 'shadow' check (mode = 'shadow'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  previous_hash char(64) not null,
  hash char(64) not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, project_id, stream, sequence),
  unique (tenant_id, project_id, hash),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create index if not exists growth_events_scope_idx on growth_os.events(tenant_id, project_id, occurred_at);
create index if not exists growth_metrics_variant_idx on growth_os.metric_snapshots(tenant_id, project_id, variant_id, captured_at desc);
create index if not exists growth_comments_priority_idx on growth_os.comment_signals(tenant_id, project_id, urgency, created_at desc);
create index if not exists growth_trends_velocity_idx on growth_os.trend_signals(tenant_id, project_id, velocity desc, observed_at desc);

create or replace function growth_os.prevent_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'growth_os.events is append-only';
end;
$$;

drop trigger if exists growth_events_no_update on growth_os.events;
create trigger growth_events_no_update
before update or delete on growth_os.events
for each row execute function growth_os.prevent_event_mutation();

alter table growth_os.projects enable row level security;
alter table growth_os.campaigns enable row level security;
alter table growth_os.content_items enable row level security;
alter table growth_os.social_variants enable row level security;
alter table growth_os.publish_jobs enable row level security;
alter table growth_os.metric_snapshots enable row level security;
alter table growth_os.comment_signals enable row level security;
alter table growth_os.trend_signals enable row level security;
alter table growth_os.hypotheses enable row level security;
alter table growth_os.experiments enable row level security;
alter table growth_os.production_briefs enable row level security;
alter table growth_os.events enable row level security;

-- Runtime must set app.tenant_id in a trusted server-side transaction.
create policy growth_projects_tenant_isolation on growth_os.projects
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_campaigns_tenant_isolation on growth_os.campaigns
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_content_tenant_isolation on growth_os.content_items
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_variants_tenant_isolation on growth_os.social_variants
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_jobs_tenant_isolation on growth_os.publish_jobs
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_metrics_tenant_isolation on growth_os.metric_snapshots
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_comments_tenant_isolation on growth_os.comment_signals
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_trends_tenant_isolation on growth_os.trend_signals
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_hypotheses_tenant_isolation on growth_os.hypotheses
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_experiments_tenant_isolation on growth_os.experiments
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_briefs_tenant_isolation on growth_os.production_briefs
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
create policy growth_events_tenant_isolation on growth_os.events
  using (tenant_id = current_setting('app.tenant_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true));
