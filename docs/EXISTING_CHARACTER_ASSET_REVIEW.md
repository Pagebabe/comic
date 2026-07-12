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

Export the File Library original without editing it. Keep its filename unchanged. A normal browser export into `~/Downloads` is sufficient.

Do not:

- overwrite an existing local file;
- rename or convert the image;
- edit metadata or pixels;
- delete, move or reorganize source assets;
- mark the image as a visual master.

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

The output directory must not already exist. The command fails closed with exit code `3` when the exact target filename is not found.

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
review-images/
```

The HTML contact sheet uses the local original paths so a human can visually compare the files. Candidate bytes are also copied into `review-images/`; source files remain unchanged.

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
SOURCE_FILES_MODIFIED=false
AUTOMATIC_MASTER_APPROVALS=0
```

It must not state:

```text
RICCO_MASTER_APPROVED
CANON_LOCKED
LORA_TRAINING_AUTHORIZED
NEW_GENERATION_AUTHORIZED
```

The human review result remains a separate decision in Issue #153.
