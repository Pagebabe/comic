-- MKT0-010 · Persistence, RLS and deployment readiness
-- Contract only. This file must never be executed automatically or against a remote database.

create table if not exists growth_os.schema_migrations (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  checksum char(64) not null,
  applied_at timestamptz not null,
  applied_by text not null,
  provenance text not null check (provenance = 'authorized_migration_run'),
  unique (tenant_id, project_id, id)
);

create table if not exists growth_os.runtime_runs (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  trace_id text not null,
  correlation_id text not null,
  scenario text not null,
  state text not null check (state in ('PLANNED_SHADOW','RUNNING_SHADOW','COMPLETED_SHADOW','BLOCKED','QUARANTINED')),
  input_hash char(64) not null,
  journal_hash char(64),
  final_state_hash char(64),
  rule_version text not null,
  provenance text not null check (provenance in ('synthetic_fixture','authorized_runtime_import')),
  created_at timestamptz not null,
  completed_at timestamptz,
  unique (tenant_id, project_id, trace_id),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.runtime_checkpoints (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  runtime_run_id text not null references growth_os.runtime_runs(id) on delete restrict,
  sequence integer not null check (sequence > 0),
  checkpoint_type text not null,
  projected_state_hash char(64) not null,
  journal_head_hash char(64) not null,
  human_resume_required boolean not null default true,
  created_at timestamptz not null,
  unique (tenant_id, project_id, runtime_run_id, sequence),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.connector_plans (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  runtime_run_id text not null references growth_os.runtime_runs(id) on delete restrict,
  provider_id text not null,
  account_alias text not null check (account_alias like 'sandbox_%'),
  capability text not null,
  payload_hash char(64) not null,
  idempotency_key char(64) not null,
  state text not null check (state in ('PLANNED_SHADOW','SIMULATED','BLOCKED')),
  network_allowed boolean not null default false check (network_allowed = false),
  live_actions_allowed boolean not null default false check (live_actions_allowed = false),
  created_at timestamptz not null,
  unique (tenant_id, project_id, idempotency_key),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.evidence_records (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  runtime_run_id text references growth_os.runtime_runs(id) on delete restrict,
  evidence_type text not null,
  artifact_hash char(64) not null,
  previous_hash char(64) not null,
  evidence_hash char(64) not null,
  status text not null check (status in ('PENDING','PROVEN','REJECTED','SUPERSEDED')),
  provenance text not null check (provenance in ('synthetic_fixture','authorized_ci_run','authorized_runtime_import')),
  created_at timestamptz not null,
  unique (tenant_id, project_id, evidence_hash),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create table if not exists growth_os.deployment_manifests (
  id text primary key,
  tenant_id text not null,
  project_id text not null,
  environment text not null check (environment in ('preview','staging','production')),
  artifact_hash char(64) not null,
  schema_fingerprint char(64) not null,
  state text not null check (state in ('PLANNED','WAITING_HUMAN','BLOCKED','VERIFIED')),
  human_approval_required boolean not null default true,
  execution_allowed boolean not null default false check (execution_allowed = false),
  created_at timestamptz not null,
  unique (tenant_id, project_id, environment, artifact_hash),
  foreign key (tenant_id, project_id) references growth_os.projects(tenant_id, id) on delete restrict
);

create index if not exists growth_runtime_runs_scope_idx
  on growth_os.runtime_runs(tenant_id, project_id, created_at desc);
create index if not exists growth_runtime_checkpoints_run_idx
  on growth_os.runtime_checkpoints(tenant_id, project_id, runtime_run_id, sequence);
create index if not exists growth_connector_plans_runtime_idx
  on growth_os.connector_plans(tenant_id, project_id, runtime_run_id, created_at);
create index if not exists growth_evidence_records_runtime_idx
  on growth_os.evidence_records(tenant_id, project_id, runtime_run_id, created_at);
create index if not exists growth_deployment_manifests_scope_idx
  on growth_os.deployment_manifests(tenant_id, project_id, environment, created_at desc);

alter table growth_os.tenants enable row level security;
alter table growth_os.schema_migrations enable row level security;
alter table growth_os.runtime_runs enable row level security;
alter table growth_os.runtime_checkpoints enable row level security;
alter table growth_os.connector_plans enable row level security;
alter table growth_os.evidence_records enable row level security;
alter table growth_os.deployment_manifests enable row level security;

drop policy if exists growth_tenants_scope_isolation on growth_os.tenants;
create policy growth_tenants_scope_isolation on growth_os.tenants
  using (id = current_setting('app.tenant_id', true))
  with check (id = current_setting('app.tenant_id', true));

drop policy if exists growth_schema_migrations_scope_isolation on growth_os.schema_migrations;
create policy growth_schema_migrations_scope_isolation on growth_os.schema_migrations
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_runtime_runs_scope_isolation on growth_os.runtime_runs;
create policy growth_runtime_runs_scope_isolation on growth_os.runtime_runs
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_runtime_checkpoints_scope_isolation on growth_os.runtime_checkpoints;
create policy growth_runtime_checkpoints_scope_isolation on growth_os.runtime_checkpoints
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_connector_plans_scope_isolation on growth_os.connector_plans;
create policy growth_connector_plans_scope_isolation on growth_os.connector_plans
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_evidence_records_scope_isolation on growth_os.evidence_records;
create policy growth_evidence_records_scope_isolation on growth_os.evidence_records
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_deployment_manifests_scope_isolation on growth_os.deployment_manifests;
create policy growth_deployment_manifests_scope_isolation on growth_os.deployment_manifests
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

-- Harden existing project-scoped policies from MKT0-002 with project isolation.
drop policy if exists growth_projects_tenant_isolation on growth_os.projects;
create policy growth_projects_scope_isolation on growth_os.projects
  using (tenant_id = current_setting('app.tenant_id', true) and id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and id = current_setting('app.project_id', true));

drop policy if exists growth_campaigns_tenant_isolation on growth_os.campaigns;
create policy growth_campaigns_scope_isolation on growth_os.campaigns
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_content_tenant_isolation on growth_os.content_items;
create policy growth_content_scope_isolation on growth_os.content_items
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_variants_tenant_isolation on growth_os.social_variants;
create policy growth_variants_scope_isolation on growth_os.social_variants
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_jobs_tenant_isolation on growth_os.publish_jobs;
create policy growth_jobs_scope_isolation on growth_os.publish_jobs
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_metrics_tenant_isolation on growth_os.metric_snapshots;
create policy growth_metrics_scope_isolation on growth_os.metric_snapshots
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_comments_tenant_isolation on growth_os.comment_signals;
create policy growth_comments_scope_isolation on growth_os.comment_signals
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_trends_tenant_isolation on growth_os.trend_signals;
create policy growth_trends_scope_isolation on growth_os.trend_signals
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_hypotheses_tenant_isolation on growth_os.hypotheses;
create policy growth_hypotheses_scope_isolation on growth_os.hypotheses
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_experiments_tenant_isolation on growth_os.experiments;
create policy growth_experiments_scope_isolation on growth_os.experiments
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_briefs_tenant_isolation on growth_os.production_briefs;
create policy growth_briefs_scope_isolation on growth_os.production_briefs
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));

drop policy if exists growth_events_tenant_isolation on growth_os.events;
create policy growth_events_scope_isolation on growth_os.events
  using (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true))
  with check (tenant_id = current_setting('app.tenant_id', true) and project_id = current_setting('app.project_id', true));
