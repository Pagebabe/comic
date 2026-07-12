#!/usr/bin/env python3
"""Build a review-only package for existing Comic Factory character assets.

The tool scans explicitly supplied local roots, hashes image files and associated
caption sidecars, separates known character families, detects duplicates and
creates an HTML contact sheet. Source assets are never changed, moved, renamed,
executed or approved as canon.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import struct
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

try:
    from PIL import Image
except ImportError:  # The exact bound target is PNG; stdlib fallbacks remain available.
    Image = None

SCHEMA_VERSION = 2
TOOL_VERSION = "1.1.0"
DEFAULT_TARGET_NAME = "Ricco - Charakterdesign Übersicht.png"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
SIDECAR_EXTENSIONS = {".txt", ".caption", ".json", ".yaml", ".yml", ".csv"}
NOISE_PARTS = {
    ".git", "node_modules", "dist", "playwright-report", "test-results",
    "comicfactoryrecovery", "__pycache__",
}

FAMILIES = {
    "RICCO": ("ricco", "rico", "bassmann", "rgbrico", "tupperware", "tupper", "rucksack"),
    "BASTI": ("basti", "prenzl", "falk", "reuter", "rgbfalk", "keepcup"),
    "JULE": ("jule", "plenum", "aktivistin", "klebeband"),
    "DON_MIAU": ("don miau", "don-miau", "don_miau", "kralle", "rgbkralle", "bosskatze"),
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalized(value: str) -> str:
    text = unicodedata.normalize("NFKC", value).lower().replace("\\", "/")
    for token in ("_", "-"):
        text = text.replace(token, " ")
    return " ".join(text.split())


def canonical_filename(value: str) -> str:
    """Normalize Unicode only; case, punctuation and spacing remain significant."""
    return unicodedata.normalize("NFC", value)


def token_match(text: str, alias: str) -> bool:
    alias_text = normalized(alias)
    if len(alias_text) <= 4:
        return re.search(rf"(^|[^a-z0-9]){re.escape(alias_text)}([^a-z0-9]|$)", text) is not None
    return alias_text in text


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def png_dimensions(path: Path) -> tuple[int | None, int | None]:
    with path.open("rb") as handle:
        header = handle.read(24)
    if len(header) >= 24 and header[:8] == b"\x89PNG\r\n\x1a\n" and header[12:16] == b"IHDR":
        return struct.unpack(">II", header[16:24])
    return None, None


def gif_dimensions(path: Path) -> tuple[int | None, int | None]:
    with path.open("rb") as handle:
        header = handle.read(10)
    if len(header) == 10 and header[:6] in {b"GIF87a", b"GIF89a"}:
        return struct.unpack("<HH", header[6:10])
    return None, None


def jpeg_dimensions(path: Path) -> tuple[int | None, int | None]:
    with path.open("rb") as handle:
        if handle.read(2) != b"\xff\xd8":
            return None, None
        while True:
            marker_start = handle.read(1)
            if not marker_start:
                return None, None
            if marker_start != b"\xff":
                continue
            marker = handle.read(1)
            while marker == b"\xff":
                marker = handle.read(1)
            if not marker or marker in {b"\xd8", b"\xd9"}:
                continue
            length_bytes = handle.read(2)
            if len(length_bytes) != 2:
                return None, None
            segment_length = struct.unpack(">H", length_bytes)[0]
            if segment_length < 2:
                return None, None
            if marker[0] in {
                0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF,
            }:
                payload = handle.read(5)
                if len(payload) != 5:
                    return None, None
                height, width = struct.unpack(">HH", payload[1:5])
                return width, height
            handle.seek(segment_length - 2, 1)


def image_dimensions(path: Path) -> tuple[int | None, int | None]:
    if Image is not None:
        try:
            with Image.open(path) as image:
                width, height = image.size
                return int(width), int(height)
        except (OSError, ValueError):
            pass
    try:
        suffix = path.suffix.lower()
        if suffix == ".png":
            return png_dimensions(path)
        if suffix in {".jpg", ".jpeg"}:
            return jpeg_dimensions(path)
        if suffix == ".gif":
            return gif_dimensions(path)
    except OSError:
        return None, None
    return None, None


def family_for(path: Path) -> str:
    text = normalized(str(path))
    for family, aliases in FAMILIES.items():
        if any(token_match(text, alias) for alias in aliases):
            return family
    return "UNRESOLVED"


def asset_class_for(path: Path, family: str, exact_target: bool) -> str:
    text = normalized(str(path))
    if "dashboard" in text or "status update" in text or "roadmap" in text:
        return "PLAN_OR_METADATA_ONLY"
    if "panel" in text or "keyframe" in text or "animatic" in text:
        return "PANEL_OR_KEYFRAME"
    if "lora" in text or "dataset" in text or "training" in text or "caption" in text:
        return "RICCO_LORA_TRAINING_IMAGE" if family == "RICCO" else "OTHER_CHARACTER_IMAGE"
    if exact_target or "character sheet" in text or "charakterdesign" in text or "turnaround" in text or "model sheet" in text:
        return "RICCO_CHARACTER_SHEET" if family == "RICCO" else "OTHER_CHARACTER_IMAGE"
    if family == "RICCO":
        return "RICCO_REFERENCE_IMAGE"
    if family != "UNRESOLVED":
        return "OTHER_CHARACTER_IMAGE"
    return "UNRELATED_OR_NOISE"


def is_noise(path: Path) -> bool:
    parts = {normalized(part) for part in path.parts}
    return any(normalized(noise) in parts for noise in NOISE_PARTS)


def is_relevant(path: Path, target_name: str) -> bool:
    text = normalized(str(path))
    if canonical_filename(path.name) == canonical_filename(target_name):
        return True
    aliases = [alias for values in FAMILIES.values() for alias in values]
    review_tokens = (
        "character sheet", "charakterdesign", "turnaround", "model sheet",
        "lora", "dataset", "training", "panel", "keyframe", "selected", "review",
    )
    return any(token_match(text, alias) for alias in aliases) or any(token in text for token in review_tokens)


def sidecars_for(image_path: Path) -> list[dict]:
    records = []
    for extension in sorted(SIDECAR_EXTENSIONS):
        path = image_path.with_suffix(extension)
        if not path.is_file() or path.is_symlink():
            continue
        stat = path.stat()
        records.append({
            "absolutePath": str(path.resolve()),
            "fileName": path.name,
            "extension": path.suffix.lower(),
            "sizeBytes": stat.st_size,
            "modifiedUtc": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "sha256": sha256_file(path),
            "sourceExecuted": False,
            "sourceModified": False,
        })
    return records


def path_uri(path: Path) -> str:
    return "file://" + quote(str(path.resolve()))


def scan_roots(roots: list[Path], target_name: str, output_dir: Path) -> tuple[list[dict], list[dict]]:
    records: list[dict] = []
    rejected: list[dict] = []
    target_filename = canonical_filename(target_name)
    seen_paths: set[str] = set()

    for root in roots:
        for path in root.rglob("*"):
            if path.is_symlink() or not path.is_file():
                continue
            resolved = path.resolve()
            resolved_text = str(resolved)
            if resolved_text in seen_paths:
                continue
            seen_paths.add(resolved_text)
            try:
                resolved.relative_to(output_dir.resolve())
                continue
            except ValueError:
                pass
            if path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            if is_noise(path):
                rejected.append({"path": resolved_text, "reason": "KNOWN_NOISE_PATH"})
                continue
            if not is_relevant(path, target_name):
                continue

            stat = path.stat()
            digest = sha256_file(path)
            width, height = image_dimensions(path)
            exact_target = canonical_filename(path.name) == target_filename
            family = family_for(path)
            if exact_target:
                family = "RICCO"
            asset_class = asset_class_for(path, family, exact_target)
            records.append({
                "absolutePath": resolved_text,
                "root": str(root.resolve()),
                "relativePath": str(resolved.relative_to(root.resolve())),
                "fileName": path.name,
                "extension": path.suffix.lower(),
                "sizeBytes": stat.st_size,
                "modifiedUtc": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                "sha256": digest,
                "pixelWidth": width,
                "pixelHeight": height,
                "dimensionStatus": "KNOWN" if width is not None and height is not None else "UNAVAILABLE",
                "family": family,
                "assetClass": asset_class,
                "exactTargetName": exact_target,
                "sidecars": sidecars_for(path),
                "automaticMasterApproval": False,
                "reviewStatus": "HUMAN_REVIEW_REQUIRED",
            })

    records.sort(key=lambda item: (not item["exactTargetName"], item["family"], item["absolutePath"].lower()))
    return records, rejected


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_contact_sheet(output_dir: Path, records: list[dict]) -> None:
    ricco = [item for item in records if item["family"] == "RICCO"]
    cards = []
    for item in ricco:
        width = item["pixelWidth"] if item["pixelWidth"] is not None else "unknown"
        height = item["pixelHeight"] if item["pixelHeight"] is not None else "unknown"
        display_path = Path(item.get("reviewCopy") or item["absolutePath"])
        sidecars = "<br>".join(
            html.escape(sidecar["fileName"]) for sidecar in item["sidecars"]
        ) or "none"
        cards.append(f"""
<article>
  <img src="{html.escape(path_uri(display_path))}" alt="{html.escape(item['fileName'])}">
  <h2>{html.escape(item['fileName'])}</h2>
  <dl>
    <dt>Class</dt><dd>{html.escape(item['assetClass'])}</dd>
    <dt>Dimensions</dt><dd>{width} × {height}</dd>
    <dt>Bytes</dt><dd>{item['sizeBytes']}</dd>
    <dt>SHA-256</dt><dd><code>{item['sha256']}</code></dd>
    <dt>Sidecars</dt><dd>{sidecars}</dd>
    <dt>Status</dt><dd>HUMAN_REVIEW_REQUIRED</dd>
  </dl>
</article>""")

    body = "\n".join(cards) if cards else "<p>No Ricco candidates found.</p>"
    document = f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Ricco Existing Asset Review</title>
<style>
body {{ font-family: system-ui, sans-serif; margin: 2rem; background: #111; color: #eee; }}
.warning {{ padding: 1rem; border: 2px solid #d9a500; background: #2a240d; }}
.grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }}
article {{ background: #1b1b1b; border: 1px solid #444; border-radius: 10px; padding: 1rem; }}
img {{ width: 100%; max-height: 620px; object-fit: contain; background: #2b2b2b; }}
dt {{ font-weight: 700; margin-top: .5rem; }}
dd {{ margin-left: 0; overflow-wrap: anywhere; }}
code {{ font-size: .8rem; }}
</style>
</head>
<body>
<h1>Ricco Existing Asset Review</h1>
<p class="warning"><strong>No automatic approval.</strong> Every image remains HUMAN_REVIEW_REQUIRED until a person compares it with the binding Ricco canon.</p>
<div class="grid">{body}</div>
</body>
</html>
"""
    (output_dir / "ricco-contact-sheet.html").write_text(document, encoding="utf-8")


def copy_and_verify(source: Path, destination: Path, expected_hash: str) -> str:
    shutil.copy2(source, destination)
    copy_hash = sha256_file(destination)
    source_after_copy_hash = sha256_file(source)
    if copy_hash != expected_hash or source_after_copy_hash != expected_hash:
        raise ValueError(f"Asset changed while copying review evidence: {source}")
    return copy_hash


def target_status(exact_count: int) -> str:
    if exact_count == 0:
        return "BLOCKED_TARGET_NOT_FOUND"
    if exact_count > 1:
        return "BLOCKED_MULTIPLE_EXACT_TARGETS"
    return "READY_FOR_HUMAN_REVIEW"


def build_package(roots: list[Path], output_dir: Path, target_name: str, copy_images: bool) -> dict:
    if output_dir.exists():
        raise ValueError(f"Output directory already exists: {output_dir}")
    output_dir.mkdir(parents=True)

    records, rejected = scan_roots(roots, target_name, output_dir)
    exact = [item for item in records if item["exactTargetName"]]
    ricco = [item for item in records if item["family"] == "RICCO"]
    by_family: dict[str, list[dict]] = defaultdict(list)
    for item in records:
        by_family[item["family"]].append(item)

    duplicate_groups = [
        {"sha256": digest, "count": len(items), "paths": [item["absolutePath"] for item in items]}
        for digest, items in sorted(
            ((digest, items) for digest, items in _group_by_hash(records).items() if len(items) > 1),
            key=lambda pair: pair[0],
        )
    ]

    if copy_images:
        copy_dir = output_dir / "review-images"
        sidecar_dir = output_dir / "review-sidecars"
        copy_dir.mkdir()
        sidecar_dir.mkdir()
        used_image_names: set[str] = set()
        used_sidecar_names: set[str] = set()
        copied_sidecars: dict[str, tuple[str, str]] = {}

        for item in records:
            source = Path(item["absolutePath"])
            name = source.name
            if name in used_image_names:
                name = f"{source.stem}-{item['sha256'][:12]}{source.suffix.lower()}"
            used_image_names.add(name)
            destination = copy_dir / name
            item["reviewCopySha256"] = copy_and_verify(source, destination, item["sha256"])
            item["reviewCopy"] = str(destination.resolve())

            for sidecar in item["sidecars"]:
                sidecar_source = Path(sidecar["absolutePath"])
                source_key = str(sidecar_source)
                if source_key in copied_sidecars:
                    copy_path, copy_hash = copied_sidecars[source_key]
                else:
                    sidecar_name = sidecar_source.name
                    if sidecar_name in used_sidecar_names:
                        sidecar_name = f"{sidecar_source.stem}-{sidecar['sha256'][:12]}{sidecar_source.suffix.lower()}"
                    used_sidecar_names.add(sidecar_name)
                    sidecar_destination = sidecar_dir / sidecar_name
                    copy_hash = copy_and_verify(sidecar_source, sidecar_destination, sidecar["sha256"])
                    copy_path = str(sidecar_destination.resolve())
                    copied_sidecars[source_key] = (copy_path, copy_hash)
                sidecar["reviewCopy"] = copy_path
                sidecar["reviewCopySha256"] = copy_hash

    generated = utc_now()
    status = target_status(len(exact))
    all_sidecars = _unique_sidecars(records)
    source_reference = {
        "schemaVersion": SCHEMA_VERSION,
        "toolVersion": TOOL_VERSION,
        "generatedAt": generated,
        "readOnlySourceScan": True,
        "sourceFilesModified": False,
        "sourceFilesMoved": 0,
        "sourceFilesDeleted": 0,
        "sourceFilesExecuted": 0,
        "automaticMasterApprovals": 0,
        "targetName": target_name,
        "roots": [str(root.resolve()) for root in roots],
        "imageFilesIndexed": len(records),
        "sidecarFilesIndexed": len(all_sidecars),
    }
    candidate_index = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": generated,
        "targetName": target_name,
        "status": status,
        "exactTargetMatches": len(exact),
        "exactTargetPaths": [item["absolutePath"] for item in exact],
        "riccoCandidates": len(ricco),
        "automaticMasterApproval": False,
        "decision": "HUMAN_REVIEW_REQUIRED",
        "candidates": ricco,
    }
    family_index = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": generated,
        "families": {family: items for family, items in sorted(by_family.items())},
        "mixedDatasetsAutomaticallyMerged": False,
    }
    lora_index = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": generated,
        "images": [
            item for item in records
            if "LORA_TRAINING" in item["assetClass"]
            or "lora" in normalized(item["absolutePath"])
            or "dataset" in normalized(item["absolutePath"])
        ],
        "sidecars": all_sidecars,
        "automaticTrainingAuthorization": False,
    }
    duplicate_map = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": generated,
        "duplicateGroups": duplicate_groups,
    }

    write_json(output_dir / "source-inventory-reference.json", source_reference)
    write_json(output_dir / "ricco-candidate-index.json", candidate_index)
    write_json(output_dir / "character-family-index.json", family_index)
    write_json(output_dir / "lora-dataset-image-index.json", lora_index)
    write_json(output_dir / "duplicate-map.json", duplicate_map)
    write_json(output_dir / "rejected-assets.json", {"schemaVersion": SCHEMA_VERSION, "generatedAt": generated, "assets": rejected})
    build_contact_sheet(output_dir, records)

    with (output_dir / "hashes.sha256").open("w", encoding="utf-8") as handle:
        for item in sorted(records, key=lambda record: record["absolutePath"].lower()):
            handle.write(f"{item['sha256']}  {item['absolutePath']}\n")
        for sidecar in sorted(all_sidecars, key=lambda record: record["absolutePath"].lower()):
            handle.write(f"{sidecar['sha256']}  {sidecar['absolutePath']}\n")

    return {
        "status": status,
        "outputDir": str(output_dir.resolve()),
        "filesIndexed": len(records),
        "sidecarsIndexed": len(all_sidecars),
        "exactTargetMatches": len(exact),
        "riccoCandidates": len(ricco),
        "duplicateGroups": len(duplicate_groups),
        "sourceFilesModified": False,
        "automaticMasterApprovals": 0,
    }


def _group_by_hash(records: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for item in records:
        grouped[item["sha256"]].append(item)
    return grouped


def _unique_sidecars(records: list[dict]) -> list[dict]:
    unique: dict[str, dict] = {}
    for item in records:
        for sidecar in item["sidecars"]:
            unique.setdefault(sidecar["absolutePath"], sidecar)
    return list(unique.values())


def default_roots() -> list[Path]:
    home = Path.home()
    candidates = [
        home / "Downloads",
        home / "Pictures",
        home / "Desktop",
        home / "ComfyUI" / "output",
        home / "AI" / "ComfyUI" / "output",
        home / "Documents" / "ComfyUI" / "output",
    ]
    unique = []
    seen = set()
    for path in candidates:
        if not path.is_dir():
            continue
        resolved = path.resolve()
        if str(resolved) in seen:
            continue
        seen.add(str(resolved))
        unique.append(resolved)
    return unique


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a read-only existing character asset review package")
    parser.add_argument("--root", action="append", default=[], help="Root to scan; repeat for multiple roots")
    parser.add_argument("--output-dir", required=True, help="New directory for review artifacts")
    parser.add_argument("--target-name", default=DEFAULT_TARGET_NAME)
    parser.add_argument("--no-copy-images", action="store_true", help="Do not copy candidate bytes or sidecars into the review package")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    roots = [Path(value).expanduser().resolve() for value in args.root] if args.root else default_roots()
    roots = list(dict.fromkeys(root for root in roots if root.is_dir()))
    if not roots:
        print("ERROR: no existing scan roots", file=sys.stderr)
        return 2
    try:
        result = build_package(
            roots=roots,
            output_dir=Path(args.output_dir).expanduser().resolve(),
            target_name=args.target_name,
            copy_images=not args.no_copy_images,
        )
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["status"] == "READY_FOR_HUMAN_REVIEW":
        return 0
    if result["status"] == "BLOCKED_MULTIPLE_EXACT_TARGETS":
        return 4
    return 3


if __name__ == "__main__":
    raise SystemExit(main())
