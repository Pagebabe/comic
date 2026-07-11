import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBulkApprovalBatch,
  buildCalendarProjection,
  buildDailyMarketingPlan,
  buildPublishJobEvent,
  buildWorkflowPlan,
  evaluateHumanGate,
  recordTaskFailure,
  resumeRetry,
  simulateScheduler,
  transitionWorkflowTask,
  unlockReadyTasks,
  validateCampaignPlan
} from '../growth-os/orchestrator.mjs';
import { createDomainEvent } from '../growth-os/data.mjs';

const campaign = (overrides = {}) => ({
  schemaVersion: 1,
  id: 'campaign_demo',
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  name: 'Launch Week',
  status: 'ACTIVE',
  timezone: 'Europe/Berlin',
  mode: 'shadow',
  automationTrustLevel: 3,
  contentPlans: [
    {
      id: 'content_a', variantId: 'variant_a', platform: 'tiktok', formatId: 'sketch_v1', knownFormat: true,
      packageReady: true, priority: 'HIGH', windowStart: '2026-07-12T08:00:00.000Z', windowEnd: '2026-07-12T10:00:00.000Z',
      dependencies: [], riskFlags: []
    },
    {
      id: 'content_b', variantId: 'variant_b', platform: 'instagram_reels', formatId: 'sketch_v2', knownFormat: false,
      packageReady: true, priority: 'NORMAL', windowStart: '2026-07-12T11:00:00.000Z', windowEnd: '2026-07-12T13:00:00.000Z',
      dependencies: ['content_a'], riskFlags: []
    }
  ],
  ...overrides
});

function completeUntilPublish(plan, contentId) {
  let tasks = plan.tasks;
  const order = ['PACKAGING', 'QA', 'APPROVAL', 'SCHEDULING'];
  for (const step of order) {
    tasks = unlockReadyTasks(tasks, '2026-07-12T07:00:00.000Z');
    tasks = tasks.map((task) => {
      if (task.contentId !== contentId || task.step !== step) return task;
      let next = task;
      if (next.state === 'READY') next = transitionWorkflowTask(next, next.requiresHuman ? 'WAITING_HUMAN' : 'RUNNING', '2026-07-12T07:01:00.000Z', 'START');
      if (next.state === 'WAITING_HUMAN') return transitionWorkflowTask(next, 'COMPLETED', '2026-07-12T07:02:00.000Z', 'HUMAN_APPROVED');
      return transitionWorkflowTask(next, 'COMPLETED', '2026-07-12T07:02:00.000Z', 'DONE');
    });
  }
  return unlockReadyTasks(tasks, '2026-07-12T07:03:00.000Z');
}

test('campaign validation and workflow planning are deterministic', () => {
  assert.deepEqual(buildWorkflowPlan(campaign()), buildWorkflowPlan(campaign()));
  assert.equal(buildWorkflowPlan(campaign()).tasks.length, 14);
});

test('invalid publishing windows are rejected', () => {
  const value = campaign();
  value.contentPlans[0].windowEnd = value.contentPlans[0].windowStart;
  assert.throws(() => validateCampaignPlan(value), /window end/);
});

test('dependency cycles are rejected', () => {
  const value = campaign();
  value.contentPlans[0].dependencies = ['content_b'];
  assert.throws(() => validateCampaignPlan(value), /cycle/);
});

test('new formats always require individual human approval', () => {
  const plan = buildWorkflowPlan(campaign());
  const approval = plan.tasks.find((task) => task.id === 'content_b:approval');
  assert.equal(approval.requiresHuman, true);
  assert.ok(approval.humanGateReasons.includes('NEW_FORMAT_REQUIRES_HUMAN'));
});

test('known safe formats can use auto shadow at trust level 3', () => {
  const content = validateCampaignPlan(campaign()).contentPlans[0];
  assert.equal(evaluateHumanGate(content, 3).approvalMode, 'AUTO_SHADOW');
  assert.equal(evaluateHumanGate(content, 3).publicActionAllowed, false);
});

test('rights and crisis flags always require human review', () => {
  const content = { knownFormat: true, riskFlags: ['RIGHTS_UNKNOWN', 'CRISIS'] };
  const gate = evaluateHumanGate(content, 4);
  assert.equal(gate.requiresHuman, true);
  assert.ok(gate.reasons.includes('RIGHTS_REVIEW_REQUIRED'));
  assert.ok(gate.reasons.includes('CRISIS_ESCALATION_REQUIRED'));
});

test('tasks unlock only after dependencies complete', () => {
  const plan = buildWorkflowPlan(campaign());
  const initialQa = plan.tasks.find((task) => task.id === 'content_a:qa');
  assert.equal(initialQa.state, 'BLOCKED');
  const packaged = plan.tasks.map((task) => task.id === 'content_a:packaging'
    ? transitionWorkflowTask(transitionWorkflowTask(task, 'RUNNING', '2026-07-12T06:00:00.000Z', 'START'), 'COMPLETED', '2026-07-12T06:01:00.000Z', 'DONE')
    : task);
  const unlocked = unlockReadyTasks(packaged, '2026-07-12T06:02:00.000Z');
  assert.equal(unlocked.find((task) => task.id === 'content_a:qa').state, 'READY');
});

test('invalid task transitions are rejected', () => {
  const task = buildWorkflowPlan(campaign()).tasks.find((item) => item.id === 'content_a:packaging');
  assert.throws(() => transitionWorkflowTask(task, 'COMPLETED', '2026-07-12T06:00:00.000Z', 'SKIP'), /Invalid workflow/);
});

test('failures use bounded retries and end in dead letter', () => {
  let task = buildWorkflowPlan(campaign()).tasks.find((item) => item.id === 'content_a:packaging');
  task = transitionWorkflowTask(task, 'RUNNING', '2026-07-12T06:00:00.000Z', 'START');
  task = recordTaskFailure(task, '2026-07-12T06:01:00.000Z', 'TEMP');
  assert.equal(task.state, 'RETRY_WAIT');
  assert.equal(resumeRetry(task, '2026-07-12T06:01:30.000Z').state, 'RETRY_WAIT');
  task = resumeRetry(task, '2026-07-12T06:02:00.000Z');
  task = transitionWorkflowTask(task, 'RUNNING', '2026-07-12T06:03:00.000Z', 'RETRY');
  task = recordTaskFailure(task, '2026-07-12T06:04:00.000Z', 'TEMP');
  task = resumeRetry(task, '2026-07-12T06:09:00.000Z');
  task = transitionWorkflowTask(task, 'RUNNING', '2026-07-12T06:10:00.000Z', 'RETRY');
  task = recordTaskFailure(task, '2026-07-12T06:11:00.000Z', 'PERM');
  assert.equal(task.state, 'DEAD_LETTER');
  assert.equal(task.attempts, 3);
});

test('scheduler creates one shadow job and suppresses duplicates', () => {
  const plan = buildWorkflowPlan(campaign());
  const tasks = completeUntilPublish(plan, 'content_a');
  const first = simulateScheduler({ workflowPlan: plan, tasks, asOf: '2026-07-12T08:30:00.000Z' });
  assert.equal(first.jobs.length, 1);
  assert.equal(first.jobs[0].publicActionAllowed, false);
  const second = simulateScheduler({ workflowPlan: plan, tasks, asOf: '2026-07-12T08:30:00.000Z', existingIdempotencyKeys: [first.jobs[0].idempotencyKey] });
  assert.equal(second.jobs.length, 0);
  assert.equal(second.skipped.find((item) => item.contentId === 'content_a').reason, 'IDEMPOTENT_DUPLICATE');
});

test('scheduler reports missed windows rather than silently publishing', () => {
  const plan = buildWorkflowPlan(campaign());
  const result = simulateScheduler({ workflowPlan: plan, tasks: plan.tasks, asOf: '2026-07-13T08:30:00.000Z' });
  assert.equal(result.jobs.length, 0);
  assert.equal(result.alerts.length, 2);
});

test('publish job events remain valid shadow records', () => {
  const plan = buildWorkflowPlan(campaign());
  const tasks = completeUntilPublish(plan, 'content_a');
  const job = simulateScheduler({ workflowPlan: plan, tasks, asOf: '2026-07-12T08:30:00.000Z' }).jobs[0];
  const event = buildPublishJobEvent(job, { occurredAt: '2026-07-12T08:30:01.000Z' });
  assert.doesNotThrow(() => createDomainEvent(event));
  assert.equal(event.payload.state, 'APPROVED_SHADOW');
  assert.equal(event.mode, 'shadow');
});

test('calendar projection respects campaign timezone', () => {
  const value = campaign({ contentPlans: [{
    id: 'late', variantId: 'v', platform: 'tiktok', formatId: 'f', knownFormat: true, packageReady: true,
    priority: 'NORMAL', windowStart: '2026-07-11T22:30:00.000Z', windowEnd: '2026-07-11T23:30:00.000Z', dependencies: [], riskFlags: []
  }] });
  assert.equal(buildCalendarProjection(buildWorkflowPlan(value)).days[0].date, '2026-07-12');
});

test('bulk approval includes only safe level-2 items', () => {
  const plan = buildWorkflowPlan(campaign({ automationTrustLevel: 2, contentPlans: [campaign().contentPlans[0]] }));
  const tasks = plan.tasks.map((task) => task.id === 'content_a:approval' ? { ...task, state: 'WAITING_HUMAN' } : task);
  const batch = buildBulkApprovalBatch(plan, tasks);
  assert.deepEqual(batch.taskIds, ['content_a:approval']);
  assert.equal(batch.publicActionAllowed, false);
});

test('daily plan exposes approvals, retries and bottlenecks without public actions', () => {
  const plan = buildWorkflowPlan(campaign());
  const tasks = plan.tasks.map((task) => task.id === 'content_b:approval' ? { ...task, state: 'WAITING_HUMAN' } : task);
  const daily = buildDailyMarketingPlan({ workflowPlan: plan, tasks, asOf: '2026-07-12T07:00:00.000Z' });
  assert.equal(daily.summary.plannedContent, 2);
  assert.equal(daily.summary.humanApprovals, 1);
  assert.equal(daily.publicActionsExecuted, false);
});
