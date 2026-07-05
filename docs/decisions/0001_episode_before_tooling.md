# Decision 0001 — Episode before tooling

Date: 2026-07-05

## Decision

The project will produce Episode 001 as a complete rough hand-test before adding more tooling features.

## Context

The project has grown into a strong local comic production control app:

```text
Control Room
Workspace Map
Asset Library
Fix Queue
Reference Candidates
Dataset Candidates
Approved Dataset Export
LoRA Training Plan
Image Review
QA
Lettering
Package / Restore
Storage Adapter
IndexedDB path
```

However, the product goal is not to have the most complete tool.

The product goal is to make repeatable comic episodes.

A tool-only loop creates the risk of building a perfect factory without a finished comic.

## Rule

Before Episode 001 is complete, allowed work is limited to:

```text
bug fixes
broken build fixes
small storage safety fixes
production documentation
actual episode production
```

Blocked until Episode 001 is complete:

```text
new pages
new automation
new backend rewrite
new LoRA automation
new export architecture
new ComfyUI API automation
```

## Consequence

The next real work is:

```text
Produce Episode 001 — Das Zimmer
```

not another system layer.

## Completion signal

This decision can be revisited after:

```text
8 final panels selected
lettering visible
rough PDF / image sequence / MP4 exists
package JSON saved
production notes written
```
