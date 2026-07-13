#!/usr/bin/env python3
"""Sanitize a character-review package for portable GitHub Actions delivery."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from urllib.parse import quote


def _portable_string(value: str, input_root: Path, package_dir: Path) -> str:
    mappings = (
        (str(package_dir), "."),
        (str(input_root), "${ASSET_ROOT}"),
    )
    for prefix, replacement in mappings:
        if value == prefix:
            return replacement
        if value.startswith(prefix + os.sep):
            relative = value[len(prefix) + 1 :].replace(os.sep, "/")
            return f"{replacement}/{relative}"
    return value


def _portable_value(value, input_root: Path, package_dir: Path):
    if isinstance(value, dict):
        return {key: _portable_value(item, input_root, package_dir) for key, item in value.items()}
    if isinstance(value, list):
        return [_portable_value(item, input_root, package_dir) for item in value]
    if isinstance(value, str):
        return _portable_string(value, input_root, package_dir)
    return value


def _load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_summary(package_dir: Path) -> dict:
    complete = _load_json(package_dir / "PACKAGE_COMPLETE.json")
    candidate_index = _load_json(package_dir / "ricco-candidate-index.json")
    family_index = _load_json(package_dir / "character-family-index.json")
    lora_index = _load_json(package_dir / "lora-dataset-image-index.json")
    duplicate_map = _load_json(package_dir / "duplicate-map.json")
    rejected = _load_json(package_dir / "rejected-assets.json")

    candidates = candidate_index.get("candidates", [])
    exact = [item for item in candidates if item.get("exactTargetName") is True]
    if candidate_index.get("status") != "READY_FOR_HUMAN_REVIEW":
        raise ValueError(f"Unexpected package status: {candidate_index.get('status')}")
    if len(exact) != 1:
        raise ValueError(f"Expected exactly one target candidate, found {len(exact)}")
    if complete.get("sourceFilesModified") is not False:
        raise ValueError("Package does not prove read-only source handling")
    if complete.get("automaticMasterApprovals") != 0:
        raise ValueError("Package contains an automatic master approval")

    target = exact[0]
    families = family_index.get("families", {})
    sidecars = [
        {
            "fileName": item.get("fileName"),
            "sha256": item.get("sha256"),
            "sizeBytes": item.get("sizeBytes"),
        }
        for item in target.get("sidecars", [])
    ]

    return {
        "schemaVersion": 1,
        "status": candidate_index.get("status"),
        "targetName": candidate_index.get("targetName"),
        "exactTargetMatches": candidate_index.get("exactTargetMatches"),
        "targetSha256": target.get("sha256"),
        "targetSizeBytes": target.get("sizeBytes"),
        "targetPixelWidth": target.get("pixelWidth"),
        "targetPixelHeight": target.get("pixelHeight"),
        "targetDimensionStatus": target.get("dimensionStatus"),
        "targetSidecars": sidecars,
        "riccoCandidateCount": candidate_index.get("riccoCandidates"),
        "characterFamilyCounts": {key: len(items) for key, items in sorted(families.items())},
        "loraImageCount": len(lora_index.get("images", [])),
        "loraSidecarCount": len(lora_index.get("sidecars", [])),
        "duplicateGroupCount": len(duplicate_map.get("duplicateGroups", [])),
        "rejectedAssetCount": len(rejected.get("assets", [])),
        "sourceAssetsModified": False,
        "sourceFilesMoved": 0,
        "sourceFilesDeleted": 0,
        "automaticMasterApprovals": 0,
        "humanReviewDecision": "OPEN",
        "contactSheet": "ricco-contact-sheet.html",
    }


def sanitize_package(package_dir: Path, input_root: Path) -> dict:
    package_dir = package_dir.resolve()
    input_root = input_root.resolve()
    if not package_dir.is_dir():
        raise ValueError(f"Package directory does not exist: {package_dir}")
    if not input_root.is_dir():
        raise ValueError(f"Input root does not exist: {input_root}")
    if not (package_dir / "PACKAGE_COMPLETE.json").is_file():
        raise ValueError("PACKAGE_COMPLETE.json is missing")
    if (package_dir / "PACKAGE_INCOMPLETE.json").exists():
        raise ValueError("PACKAGE_INCOMPLETE.json is still present")

    summary = build_summary(package_dir)

    for path in package_dir.glob("*.json"):
        payload = _load_json(path)
        _write_json(path, _portable_value(payload, input_root, package_dir))

    hashes_path = package_dir / "hashes.sha256"
    hashes = hashes_path.read_text(encoding="utf-8")
    hashes = hashes.replace(str(package_dir), ".").replace(str(input_root), "${ASSET_ROOT}")
    hashes_path.write_text(hashes, encoding="utf-8")

    contact_path = package_dir / "ricco-contact-sheet.html"
    contact = contact_path.read_text(encoding="utf-8")
    encoded_package = quote(str(package_dir))
    contact = contact.replace(f"file://{encoded_package}/review-images/", "review-images/")
    if "file://" in contact:
        raise ValueError("Contact sheet still contains non-portable file URLs")
    contact_path.write_text(contact, encoding="utf-8")

    portable_marker = {
        "schemaVersion": 1,
        "status": "CLOUD_REVIEW_PACKAGE_PORTABLE",
        "runnerPathsRemoved": True,
        "assetUrlRecorded": False,
        "sourceAssetsModified": False,
        "automaticMasterApprovals": 0,
    }
    _write_json(package_dir / "PACKAGE_CLOUD_PORTABLE.json", portable_marker)
    _write_json(package_dir / "cloud-review-summary.json", summary)
    return summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sanitize a cloud character-review package")
    parser.add_argument("--package-dir", required=True)
    parser.add_argument("--input-root", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        summary = sanitize_package(Path(args.package_dir), Path(args.input_root))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}")
        return 2
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
