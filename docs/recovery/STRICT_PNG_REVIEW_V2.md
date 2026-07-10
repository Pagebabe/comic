# Strict PNG Review V2

## Purpose

Use this only after `scripts/recover_assets.py` has produced a read-only inventory.

The V2 inspector:

- reads positive ComfyUI prompt branches only
- ignores negative prompts when looking for comic evidence
- requires project/character identity plus comic-production style evidence
- rejects photorealistic, influencer, selfie and NSFW prompts
- disables generic fallback image bundles
- accepts zero candidates as a valid result
- never modifies source images or canon files

## Command

```bash
python3 scripts/inspect_comic_png_metadata_v2.py \
  --inventory "$PWD/_recovery_reports/asset-recovery-inventory.json" \
  --bundle-max-files 20 \
  --bundle-max-mb 100
```

## Outputs

```text
_recovery_reports/analysis/comic-png-strict-report.json
_recovery_reports/analysis/comic-png-strict-errors.log
_recovery_reports/analysis/comic-visual-review-bundle-v2.zip
```

The ZIP may contain only `manifest.json` when no trustworthy candidate exists. That is preferable to bundling unrelated material.

## Review states

Eligible files remain:

```text
REVIEW_REQUIRED
```

The script never writes `CANON_APPROVED`, never selects a master reference, and never copies images into the series asset tree.

## Project boundary

Only Comic Factory recovery data may be inspected. Chris Fact Radar and other repositories remain excluded.
