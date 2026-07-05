# Lean Code Rules

Last updated: 2026-07-06

## Goal

Keep the Comic Factory codebase small, readable and easy to change.

## Main rule

Do not solve UI problems by adding more pages, more routes or more duplicated JSX.

## Rules

```text
Small changes only.
One purpose per commit.
One primary action per page.
No duplicate helper copy in many files.
No hidden business logic inside JSX.
Move repeated UI into small components.
Move repeated decisions into small functions.
Keep advanced features out of the beginner path.
Prefer data-driven configuration over hardcoded menus.
Do not add automation before the manual episode loop works.
```

## Page size rule

If a page becomes hard to scan, split it into:

```text
small helper functions
small presentational components
small domain functions
```

Do not split too early.

Only extract when the same pattern appears at least twice or the page becomes difficult to read.

## UI component candidates

```text
PageIntro
NextActionCard
HelpBox
PanelStatusCard
ScoreSelect
EmptyState
DangerZone
```

## Domain function candidates

```text
getPanelStatus
getNextEpisodeAction
summarizeEpisodeProgress
validateReviewReadiness
```

## Forbidden

```text
copy pasted page sections
large rewrites without need
new dashboard pages for every idea
technical labels in beginner UI
feature work that does not help Episode 001
```

## Current priority

Finish the beginner flow first:

```text
Start
Episode Board
Make Images
Choose Images
Add Text
Export
Save Backup
```

Then clean code by extracting shared UI pieces.
