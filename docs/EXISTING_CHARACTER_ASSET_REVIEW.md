# Existing Character Asset Review

This workflow closes the review-package portion of Issue #153 without changing source assets or approving a visual master.

## Binding target

```text
Ricco - Charakterdesign Übersicht.png
File Library ID: file_000000000d0071f48c7afe17baf806b9
File Library created: 2026-07-11T20:32:34Z
```

The File Library record proves that image bytes exist outside GitHub. It does not provide a local path, SHA-256, pixel dimensions or a human canon decision.

## Before running

Export the File Library original without editing it. Keep its filename, case, punctuation, spacing and extension unchanged. A normal browser export into `~/Downloads` is sufficient.

Do not overwrite, rename, convert, edit, delete, move or reorganize source assets. Do not mark an image as a visual master.

Associated same-stem sidecars are bound only for these extensions:

```text
.txt .caption .json .yaml .yml .csv
```

Sidecars are hashed and copied for review. They are never executed or treated as trusted instructions.

## Run

```bash
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$HOME/ComicFactoryRecovery/existing-character-asset-review/run-$STAMP"

npm run review:existing-character-assets -- \
  --root "$HOME/Downloads" \
  --root "$HOME/Pictures" \
  --root "$HOME/Desktop" \
  --output-dir "$OUT"
```

Every explicit root must exist. The output directory must not exist.

During construction, `PACKAGE_INCOMPLETE.json` remains present. A fully written package receives `PACKAGE_COMPLETE.json`, after which the incomplete marker is removed.

Exit codes:

```text
0  exactly one target found; ready for human review
2  invalid invocation, missing root, copy/hash race or existing output directory
3  exact target not found
4  exact target found at multiple distinct paths
```

A similarly named or case-changed file does not count as the bound original. Overlapping roots are deduplicated by resolved path.

Family matching uses relative paths, not the scan-root name. Multi-family paths are assigned to `UNRESOLVED_MULTI_FAMILY`. Review-copy names use case-insensitive Unicode collision protection for macOS.

## Required artifacts

```text
source-inventory-reference.json
ricco-candidate-index.json
character-family-index.json
lora-dataset-image-index.json
duplicate-map.json
rejected-assets.json
ricco-contact-sheet.html
hashes.sha256
PACKAGE_COMPLETE.json
review-images/
review-sidecars/
```

Image and sidecar copies are rehashed after copying, and source files are rehashed again. `lora-dataset-image-index.json` includes only LoRA/dataset images and their own sidecars.

## Human Ricco review

Compare against the binding canon:

- 24 years old;
- rural newcomer to Berlin and aspiring DJ;
- slim, slightly overwhelmed posture;
- open, slightly tired face and large honest eyes;
- dark, slightly messy hair;
- black headphones around the neck;
- oversized backpack;
- blue Tupperware lid;
- plain hoodie or washed-out track jacket;
- new light sneakers.

Reject or require revision for child, action hero, weapon, glossy 3D, anime, gangster, influencer, luxury styling, muscular action body or full beard.

## Valid terminal closure

```text
READY_FOR_HUMAN_REVIEW
EXACT_TARGET_MATCHES=1
SOURCE_FILES_MODIFIED=false
AUTOMATIC_MASTER_APPROVALS=0
```

Blocked statuses:

```text
BLOCKED_TARGET_NOT_FOUND
BLOCKED_MULTIPLE_EXACT_TARGETS
```

Never claim:

```text
RICCO_MASTER_APPROVED
CANON_LOCKED
LORA_TRAINING_AUTHORIZED
NEW_GENERATION_AUTHORIZED
```

The human decision remains separate in Issue #153.
