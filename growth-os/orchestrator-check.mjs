import { mkdirSync, writeFileSync } from 'node:fs';
import {
  buildCalendarProjection,
  buildDailyMarketingPlan,
  buildPublishJobEvent,
  buildWorkflowPlan,
  simulateScheduler,
  transitionWorkflowTask,
  unlockReadyTasks
} from './orchestrator.mjs';
import { createDomainEvent } from './data.mjs';

const campaign = {
  schemaVersion: 1,
  id: 'campaign_launch_week',
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  name: 'Synthetic Launch Week',
  status: 'ACTIVE',
  timezone: 'Europe/Berlin',
  mode: 'shadow',
  automationTrustLevel: 3,
  contentPlans: [
    {
      id: 'content_dj_usb', variantId: 'variant_dj_usb_tiktok', platform: 'tiktok', formatId: 'short_conflict_v1',
      knownFormat: true, packageReady: true, priority: 'HIGH', windowStart: '2026-07-12T08:00:00.000Z', windowEnd: '2026-07-12T10:00:00.000Z',
      dependencies: [], riskFlags: []
    },
    {
      id: 'content_new_format', variantId: 'variant_new_format_ig', platform: 'instagram_reels', formatId: 'carousel_story_v1',
      knownFormat: false, packageReady: true, priority: 'NORMAL', windowStart: '2026-07-12T11:00:00.000Z', windowEnd: '2026-07-12T13:00:00.000Z',
      dependencies: [], riskFlags: []
    }
  ]
};

const workflowPlan = buildWorkflowPlan(campaign);
let tasks = workflowPlan.tasks;
for (const step of ['PACKAGING', 'QA', 'APPROVAL', 'SCHEDULING']) {
  tasks = unlockReadyTasks(tasks, '2026-07-12T07:00:00.000Z');
  tasks = tasks.map((task) => {
    if (task.contentId !== 'content_dj_usb' || task.step !== step) return task;
    const running = transitionWorkflowTask(task, 'RUNNING', '2026-07-12T07:01:00.000Z', 'SYNTHETIC_CHECK');
    return transitionWorkflowTask(running, 'COMPLETED', '2026-07-12T07:02:00.000Z', 'SYNTHETIC_CHECK_COMPLETE');
  });
}
tasks = unlockReadyTasks(tasks, '2026-07-12T07:03:00.000Z');
const scheduler = simulateScheduler({ workflowPlan, tasks, asOf: '2026-07-12T08:30:00.000Z' });
if (scheduler.jobs.length !== 1) throw new Error(`Expected one shadow job, got ${scheduler.jobs.length}`);
const event = createDomainEvent(buildPublishJobEvent(scheduler.jobs[0], { occurredAt: '2026-07-12T08:30:01.000Z' }));
const calendar = buildCalendarProjection(workflowPlan);
const dailyPlan = buildDailyMarketingPlan({ workflowPlan, tasks, asOf: '2026-07-12T08:30:00.000Z' });
const output = {
  schemaVersion: 1,
  ruleVersion: workflowPlan.ruleVersion,
  provenance: 'synthetic_fixture',
  campaignId: workflowPlan.campaign.id,
  taskCount: workflowPlan.tasks.length,
  calendarDays: calendar.days.length,
  shadowJobs: scheduler.jobs.length,
  publishJobEvent: event,
  dailyPlan,
  liveActionsExecuted: false,
  remoteServicesTouched: false
};
mkdirSync('output/growth-os', { recursive: true });
writeFileSync('output/growth-os/mkt0-orchestrator.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  status: 'pass',
  ruleVersion: output.ruleVersion,
  taskCount: output.taskCount,
  shadowJobs: output.shadowJobs,
  liveActionsExecuted: output.liveActionsExecuted,
  remoteServicesTouched: output.remoteServicesTouched
}));
