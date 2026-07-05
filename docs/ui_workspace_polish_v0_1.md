# UI / Workspace Polish v0.1

Last updated: 2026-07-05
Branch: `backend-adapters`

## Why

The Comic Factory workflow had the right pages, but the sidebar was starting to feel like a flat tool list instead of a production workspace.

The app needs to feel like a studio control surface:

```text
What am I producing?
What is blocked?
What do I open next?
What is system/admin noise?
```

## Changed

`src/components/Sidebar.tsx`

- Added explicit navigation groups.
- Kept the same route coverage.
- Moved the app away from one long unstructured menu.

New groups:

```text
Production
Assets
Training
Output
System
Legacy
```

## Group intent

### Production

The main episode-making loop:

```text
Control Room
Workspace Map
Studio
Prompt Queue
Generation Queue
ComfyUI M1
Image Review
QA Gate
```

### Assets

Everything that creates, imports, classifies or repairs visual material:

```text
Reference Packs
Reference Candidates
Asset Import
Asset Library
Fix Queue
Bulk Upload
```

### Training

Dataset and later LoRA preparation:

```text
Dataset Candidates
Approved Dataset
LoRA Training Plan
```

### Output

Anything that belongs after final panel approval:

```text
Export Gate
Lettering
```

### System

Storage, backup and restore:

```text
Storage
Package Backup
Restore
```

### Legacy

Older generic Comic Factory surfaces retained for continuity but no longer treated as the main Ricco workflow.

## Style updates

`src/styles.css`

- Sidebar now supports grouped navigation.
- Navigation scrolls inside the fixed-height sidebar.
- Group labels are uppercase studio-section labels.
- Mobile layout keeps the groups in a two-column grid.

## Product effect

Before:

```text
Long sidebar with many equal-looking tools.
```

After:

```text
Studio workspace with clear production areas.
```

This improves the first impression without changing the core app architecture.

## Next recommended UI pass

The next useful improvement is the Control Room first screen:

```text
1. Large current stage card
2. One primary next-action button
3. Blockers separated from metrics
4. Episode panel strip for Panel 1-8
5. Visual thumbnail placeholders for missing/final panels
```

The goal is to make the app answer one question immediately:

```text
What do I do next to finish Episode 1?
```
