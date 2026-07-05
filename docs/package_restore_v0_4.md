# Ricco Package / Restore v0.4

Last updated: 2026-07-05

## What changed

Production packages now include more than images, jobs and reference reviews.

Version v0.4 also stores:

```text
letteringState
pipelineState
```

## Package version

```text
ricco-production-package-v4
```

## New package sections

### letteringState

Stores the current bubble/editor state from:

```text
src/domain/lettering/riccoLetteringLayout.ts
```

Includes:

- full layout state for all 8 panels
- edited panel count
- localStorage key
- restore support flag

### pipelineState

Stores a snapshot from:

```text
src/domain/workspace/riccoPipelineMap.ts
```

Includes:

- pipeline snapshot
- current stage id
- current stage label
- progress percentage

## Updated package page

```text
src/pages/RiccoPackage.tsx
```

Now reads:

- review images
- generation jobs
- reference review state
- lettering layout state

Then builds a v4 package.

## Updated restore page

```text
src/pages/RiccoImport.tsx
```

Now restores:

- images
- generation jobs
- reference review state
- lettering layout state

It also has buttons for:

- restore only lettering
- clear local lettering

## Updated tests

```text
tests/domain/package.spec.ts
tests/domain/packageNextSteps.spec.ts
```

Coverage now includes:

- package v4 shape
- lettering layout inside package
- pipeline snapshot inside package
- extracting lettering state from a package
- next-step routing after final images but before/after lettering edits

## Why this matters

A production package can now restore the editorial state, not just the rendered images. This makes the app closer to a real archive/restore workflow.
