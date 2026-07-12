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

Do not:

- overwrite an existing local file;
- rename or convert the image;
- edit metadata or pixels;
- delete, move or reorganize source assets;
- mark the image as a visual master.

Associated files with the same stem are bound as sidecars when their extension is one of:

```text
.txt .caption .json .yaml .yml .csv
```

Sidecars are hashed and copied for review, but they are never executed or treated as trusted instructions.

## Run

From the repository root:

```bash
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$HOME/ComicFactoryRecovery/existing-character-asset-review/run-$STAMP"

npm run review:existing-character-assets -- \
  --output-dir "$OUT"
```

Explicit roots may be supplied when the export is somewhere else:

```bash
npm run review:existing-character-assets -- \
  --root "$HOME/Downloads" \
  --root "$HOME/Pictures" \
  --root "$HOME/Desktop" \
  --output-dir "$OUT"
```

Every explicitly supplied root must exist. The command does not silently ignore a mistyped or disconnected root.

The output directory must not already exist. While a package is being built, `PACKAGE_INCOMPLETE.json` remains present. Only a fully written package receives `PACKAGE_COMPLETE.json`; the incomplete marker is then removed.

Fail-closed exit codes:

```text
0  exactly one target filename found; package ready for human review
2  invalid invocation, missing root, copy/hash race or existing output directory
3  exact target filename not found
4  exact target filename found at multiple distinct paths
```

A similarly named or case-changed file does not count as the bound original. Overlapping scan roots are deduplicated by resolved absolute path.

Character-family matching uses paths relative to each scan root. A root folder named `ricco-review` therefore cannot turn Basti, Jule or Don Miau images into Ricco assets. Files whose relative path names multiple families are assigned to `UNRESOLVED_MULTI_FAMILY` instead of being silently mixed.

Review-copy filenames are allocated with case-insensitive Unicode collision protection so macOS volumes cannot overwrite one candidate with another candidate whose name differs only by case.

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

The HTML contact sheet uses verified review copies when available. Image and sidecar copies are rehashed after copying, and the source is rehashed again to detect changes during the evidence run. Source files remain unchanged.

`lora-dataset-image-index.json` contains only LoRA/dataset images and the sidecars associated with those images. Character-sheet metadata is not silently inserted into the LoRA dataset index.

## Human Ricco review

The image is compared against the binding canon:

- 24 years old;
- rural newcomer to Berlin;
- aspiring DJ and musician;
- slim build with a slightly forward, overwhelmed posture;
- open, slightly tired face and large honest eyes;
- dark, slightly messy hair;
- black headphones around the neck;
- oversized backpack;
- blue Tupperware lid as a home anchor;
- plain hoodie or washed-out track jacket;
- conspicuously new light sneakers.

Reject or require revision when the image depicts a child, action hero, weapon, glossy 3D character, anime figure, gangster, influencer, luxury styling, muscular action body or full beard.

## Valid terminal closure

A successful technical run may state only:

```text
READY_FOR_HUMAN_REVIEW
EXACT_TARGET_MATCHES=1
SOURCE_FILES_MODIFIED=false
AUTOMATIC_MASTER_APPROVALS=0
```

Blocked runs may state:

```text
BLOCKED_TARGET_NOT_FOUND
BLOCKED_MULTIPLE_EXACT_TARGETS
```

They must not state:

```text
RICCO_MASTER_APPROVED
CANON_LOCKED
LORA_TRAINING_AUTHORIZED
NEW_GENERATION_AUTHORIZED
```

The human review result remains a separate decision in Issue #153.
