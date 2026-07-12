#!/usr/bin/env python3
"""Build a review-only package for existing Comic Factory character assets.

The tool scans explicitly supplied local roots, hashes image files, separates known
character families, detects duplicates and creates an HTML contact sheet. Source
assets are never changed, moved, renamed or approved as canon.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import shutil
import struct
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

SCHEMA_VERSION = 1
TOOL_VERSION = "1.0.0"
DEFAULT_TARGET_NAME = "Ricco - Charakterdesign Übersicht.png"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
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
            if marker[0] in {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}:
                payload = handle.read(5)
                if len(payload) != 5:
                    return None, None
                height, width = struct.unpack(">HH", payload[1:5])
                return width, height
            handle.seek(segment_length - 2, 1)


def image_dimensions(path: Path) -> tuple[int | None, int | None]:
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
        if any(normalized(alias) in text for alias in aliases):
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
    target = normalized(target_name)
    if normalized(path.name) == target:
        return True
    aliases = [alias for values in FAMILIES.values() for alias in values]
    review_tokens = ("character sheet", "charakterdesign", "turnaround", "model sheet", "lora", "dataset", "training", "panel", "keyframe", "selected", "review")
    return any(normalized(alias) in text for alias in aliases) or any(token in text for token in review_tokens)


def path_uri(path: Path) -> str:
    return "file://" + quote(str(path.resolve()))


def scan_roots(roots: list[Path], target_name: str, output_dir: Path) -> tuple[list[dict], list[dict]]:
    records: list[dict] = []
    rejected: list[dict] = []
    target_normalized = normalized(target_name)

    for root in roots:
        for path in root.rglob("*"):
            if path.is_symlink() or not path.is_file():
                continue
            try:
                path.resolve().relative_to(output_dir.resolve())
                continue
            except ValueError:
                pass
            if path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            if is_noise(path):
                rejected.append({"path": str(path.resolve()), "reason": "KNOWN_NOISE_PATH"})
                continue
            if not is_relevant(path, target_name):
                continue

            stat = path.stat()
            digest = sha256_file(path)
            width, height = image_dimensions(path)
            exact_target = normalized(path.name) == target_normalized
            family = family_for(path)
            if exact_target:
                family = "RICCO"
            asset_class = asset_class_for(path, family, exact_target)
            records.append({
                "absolutePath": str(path.resolve()),
                "root": str(root.resolve()),
                "relativePath": str(path.resolve().relative_to(root.resolve())),
                "fileName": path.name,
                "extension": path.suffix.lower(),
                "sizeBytes": stat.st_size,
                "modifiedUtc": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                "sha256": digest,
                "pixelWidth": width,
                "pixelHeight": height,
                "family": family,
                "assetClass": asset_class,
                "exactTargetName": exact_target,
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
        cards.append(f"""
<article>
  <img src="{html.escape(path_uri(Path(item['absolutePath'])))}" alt="{html.escape(item['fileName'])}">
  <h2>{html.escape(item['fileName'])}</h2>
  <dl>
    <dt>Class</dt><dd>{html.escape(item['assetClass'])}</dd>
    <dt>Dimensions</dt><dd>{width} × {height}</dd>
    <dt>Bytes</dt><dd>{item['sizeBytes']}</dd>
    <dt>SHA-256</dt><dd><code>{item['sha256']}</code></dd>
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
        copy_dir.mkdir()
        used_names: set[str] = set()
        for item in records:
            source = Path(item["absolutePath"])
            name = source.name
            if name in used_names:
                name = f"{source.stem}-{item['sha256'][:12]}{source.suffix.lower()}"
            used_names.add(name)
            destination = copy_dir / name
            shutil.copy2(source, destination)
            item["reviewCopy"] = str(destination.resolve())

    generated = utc_now()
    source_reference = {
        "schemaVersion": SCHEMA_VERSION,
        "toolVersion": TOOL_VERSION,
        "generatedAt": generated,
        "readOnlySourceScan": True,
        "sourceFilesModified": False,
        "sourceFilesMoved": 0,
        "sourceFilesDeleted": 0,
        "automaticMasterApprovals": 0,
        "targetName": target_name,
        "roots": [str(root.resolve()) for root in roots],
    }
    candidate_index = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": generated,
        "targetName": target_name,
        "status": "READY_FOR_HUMAN_REVIEW" if exact else "BLOCKED_TARGET_NOT_FOUND",
        "exactTargetMatches": len(exact),
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
        "images": [item for item in records if "LORA_TRAINING" in item["assetClass"] or "lora" in normalized(item["absolutePath"]) or "dataset" in normalized(item["absolutePath"])],
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

    return {
        "status": candidate_index["status"],
        "outputDir": str(output_dir.resolve()),
        "filesIndexed": len(records),
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
    return [path.resolve() for path in candidates if path.is_dir()]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a read-only existing character asset review package")
    parser.add_argument("--root", action="append", default=[], help="Root to scan; repeat for multiple roots")
    parser.add_argument("--output-dir", required=True, help="New directory for review artifacts")
    parser.add_argument("--target-name", default=DEFAULT_TARGET_NAME)
    parser.add_argument("--no-copy-images", action="store_true", help="Do not copy candidate bytes into the review package")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    roots = [Path(value).expanduser().resolve() for value in args.root] if args.root else default_roots()
    roots = [root for root in roots if root.is_dir()]
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
    return 0 if result["status"] == "READY_FOR_HUMAN_REVIEW" else 3


if __name__ == "__main__":
    raise SystemExit(main())
