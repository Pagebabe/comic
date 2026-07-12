#!/usr/bin/env python3
"""Build a read-only review package for existing Comic Factory character assets."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
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
except ImportError:
    Image = None

SCHEMA_VERSION = 3
TOOL_VERSION = "1.2.0"
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
    return " ".join(text.replace("_", " ").replace("-", " ").split())


def canonical_filename(value: str) -> str:
    """Normalize Unicode only. Case, punctuation and spacing remain significant."""
    return unicodedata.normalize("NFC", value)


def collision_key(value: str) -> str:
    """Approximate the default case-insensitive Unicode behavior of macOS volumes."""
    return unicodedata.normalize("NFC", value).casefold()


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


def _png_dimensions(path: Path) -> tuple[int | None, int | None]:
    with path.open("rb") as handle:
        header = handle.read(24)
    if len(header) >= 24 and header[:8] == b"\x89PNG\r\n\x1a\n" and header[12:16] == b"IHDR":
        return struct.unpack(">II", header[16:24])
    return None, None


def _gif_dimensions(path: Path) -> tuple[int | None, int | None]:
    with path.open("rb") as handle:
        header = handle.read(10)
    if len(header) == 10 and header[:6] in {b"GIF87a", b"GIF89a"}:
        return struct.unpack("<HH", header[6:10])
    return None, None


def _jpeg_dimensions(path: Path) -> tuple[int | None, int | None]:
    with path.open("rb") as handle:
        if handle.read(2) != b"\xff\xd8":
            return None, None
        while True:
            prefix = handle.read(1)
            if not prefix:
                return None, None
            if prefix != b"\xff":
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
                return int(image.width), int(image.height)
        except (OSError, ValueError):
            pass
    try:
        if path.suffix.lower() == ".png":
            return _png_dimensions(path)
        if path.suffix.lower() in {".jpg", ".jpeg"}:
            return _jpeg_dimensions(path)
        if path.suffix.lower() == ".gif":
            return _gif_dimensions(path)
    except OSError:
        pass
    return None, None


def matching_families(relative_path: Path) -> list[str]:
    text = normalized(str(relative_path))
    return [
        family for family, aliases in FAMILIES.items()
        if any(token_match(text, alias) for alias in aliases)
    ]


def family_for(relative_path: Path) -> str:
    matches = matching_families(relative_path)
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        return "UNRESOLVED_MULTI_FAMILY"
    return "UNRESOLVED"


def asset_class_for(relative_path: Path, family: str, exact_target: bool) -> str:
    text = normalized(str(relative_path))
    if any(token in text for token in ("dashboard", "status update", "roadmap")):
        return "PLAN_OR_METADATA_ONLY"
    if any(token in text for token in ("panel", "keyframe", "animatic")):
        return "PANEL_OR_KEYFRAME"
    if any(token in text for token in ("lora", "dataset", "training", "caption")):
        return "RICCO_LORA_TRAINING_IMAGE" if family == "RICCO" else "OTHER_CHARACTER_IMAGE"
    if exact_target or any(token in text for token in ("character sheet", "charakterdesign", "turnaround", "model sheet")):
        return "RICCO_CHARACTER_SHEET" if family == "RICCO" else "OTHER_CHARACTER_IMAGE"
    if family == "RICCO":
        return "RICCO_REFERENCE_IMAGE"
    if family in FAMILIES:
        return "OTHER_CHARACTER_IMAGE"
    return "UNRELATED_OR_NOISE"


def is_noise(path: Path) -> bool:
    parts = {normalized(part) for part in path.parts}
    return any(normalized(noise) in parts for noise in NOISE_PARTS)


def is_relevant(relative_path: Path, target_name: str) -> bool:
    if canonical_filename(relative_path.name) == canonical_filename(target_name):
        return True
    text = normalized(str(relative_path))
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
        root_resolved = root.resolve()
        for path in root_resolved.rglob("*"):
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
            relative = resolved.relative_to(root_resolved)
            if not is_relevant(relative, target_name):
                continue

            stat = path.stat()
            digest = sha256_file(path)
            width, height = image_dimensions(path)
            exact_target = canonical_filename(path.name) == target_filename
            family = "RICCO" if exact_target else family_for(relative)
            records.append({
                "absolutePath": resolved_text,
                "root": str(root_resolved),
                "relativePath": str(relative),
                "fileName": path.name,
                "extension": path.suffix.lower(),
                "sizeBytes": stat.st_size,
                "modifiedUtc": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                "sha256": digest,
                "pixelWidth": width,
                "pixelHeight": height,
                "dimensionStatus": "KNOWN" if width is not None and height is not None else "UNAVAILABLE",
                "family": family,
                "familyMatches": matching_families(relative),
                "assetClass": asset_class_for(relative, family, exact_target),
                "exactTargetName": exact_target,
                "sidecars": sidecars_for(path),
                "automaticMasterApproval": False,
                "reviewStatus": "HUMAN_REVIEW_REQUIRED",
            })

    records.sort(key=lambda item: (not item["exactTargetName"], item["family"], item["absolutePath"].lower()))
    return records, rejected


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def allocate_copy_name(source: Path, digest: str, used_keys: set[str]) -> str:
    candidate = source.name
    key = collision_key(candidate)
    if key in used_keys:
        candidate = f"{source.stem}-{digest[:12]}{source.suffix.lower()}"
        key = collision_key(candidate)
    counter = 2
    while key in used_keys:
        candidate = f"{source.stem}-{digest[:12]}-{counter}{source.suffix.lower()}"
        key = collision_key(candidate)
        counter += 1
    used_keys.add(key)
    return candidate


def copy_and_verify(source: Path, destination: Path, expected_hash: str) -> str:
    shutil.copy2(source, destination)
    copy_hash = sha256_file(destination)
    source_after_hash = sha256_file(source)
    if copy_hash != expected_hash or source_after_hash != expected_hash:
        raise ValueError(f"Asset changed while copying review evidence: {source}")
    return copy_hash


def target_status(exact_count: int) -> str:
    if exact_count == 0:
        return "BLOCKED_TARGET_NOT_FOUND"
    if exact_count > 1:
        return "BLOCKED_MULTIPLE_EXACT_TARGETS"
    return "READY_FOR_HUMAN_REVIEW"


def unique_sidecars(records: list[dict]) -> list[dict]:
    result: dict[str, dict] = {}
    for item in records:
        for sidecar in item["sidecars"]:
            result.setdefault(sidecar["absolutePath"], sidecar)
    return list(result.values())


def duplicate_groups(records: list[dict]) -> list[dict]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for item in records:
        groups[item["sha256"]].append(item)
    return [
        {"sha256": digest, "count": len(items), "paths": [item["absolutePath"] for item in items]}
        for digest, items in sorted(groups.items()) if len(items) > 1
    ]


def build_contact_sheet(output_dir: Path, records: list[dict]) -> None:
    cards = []
    for item in [record for record in records if record["family"] == "RICCO"]:
        width = item["pixelWidth"] if item["pixelWidth"] is not None else "unknown"
        height = item["pixelHeight"] if item["pixelHeight"] is not None else "unknown"
        display_path = Path(item.get("reviewCopy") or item["absolutePath"])
        sidecars = "<br>".join(html.escape(sidecar["fileName"]) for sidecar in item["sidecars"]) or "none"
        cards.append(f"""<article>
<img src="{html.escape(path_uri(display_path))}" alt="{html.escape(item['fileName'])}">
<h2>{html.escape(item['fileName'])}</h2>
<dl><dt>Class</dt><dd>{html.escape(item['assetClass'])}</dd>
<dt>Dimensions</dt><dd>{width} × {height}</dd><dt>Bytes</dt><dd>{item['sizeBytes']}</dd>
<dt>SHA-256</dt><dd><code>{item['sha256']}</code></dd><dt>Sidecars</dt><dd>{sidecars}</dd>
<dt>Status</dt><dd>HUMAN_REVIEW_REQUIRED</dd></dl></article>""")
    body = "\n".join(cards) if cards else "<p>No Ricco candidates found.</p>"
    document = f"""<!doctype html><html lang="de"><head><meta charset="utf-8">
<title>Ricco Existing Asset Review</title><style>
body{{font-family:system-ui,sans-serif;margin:2rem;background:#111;color:#eee}}
.warning{{padding:1rem;border:2px solid #d9a500;background:#2a240d}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1rem}}
article{{background:#1b1b1b;border:1px solid #444;border-radius:10px;padding:1rem}}
img{{width:100%;max-height:620px;object-fit:contain;background:#2b2b2b}}
dt{{font-weight:700;margin-top:.5rem}}dd{{margin-left:0;overflow-wrap:anywhere}}code{{font-size:.8rem}}
</style></head><body><h1>Ricco Existing Asset Review</h1>
<p class="warning"><strong>No automatic approval.</strong> Every image remains HUMAN_REVIEW_REQUIRED.</p>
<div class="grid">{body}</div></body></html>"""
    (output_dir / "ricco-contact-sheet.html").write_text(document, encoding="utf-8")


def build_package(roots: list[Path], output_dir: Path, target_name: str, copy_images: bool) -> dict:
    if output_dir.exists():
        raise ValueError(f"Output directory already exists: {output_dir}")
    output_dir.mkdir(parents=True)
    incomplete_marker = output_dir / "PACKAGE_INCOMPLETE.json"
    write_json(incomplete_marker, {"status": "INCOMPLETE", "createdAt": utc_now(), "processId": os.getpid()})

    records, rejected = scan_roots(roots, target_name, output_dir)
    exact = [item for item in records if item["exactTargetName"]]
    ricco = [item for item in records if item["family"] == "RICCO"]
    by_family: dict[str, list[dict]] = defaultdict(list)
    for item in records:
        by_family[item["family"]].append(item)

    if copy_images:
        image_dir = output_dir / "review-images"
        sidecar_dir = output_dir / "review-sidecars"
        image_dir.mkdir()
        sidecar_dir.mkdir()
        used_image_keys: set[str] = set()
        used_sidecar_keys: set[str] = set()
        copied_sidecars: dict[str, tuple[str, str]] = {}
        for item in records:
            source = Path(item["absolutePath"])
            image_name = allocate_copy_name(source, item["sha256"], used_image_keys)
            destination = image_dir / image_name
            item["reviewCopySha256"] = copy_and_verify(source, destination, item["sha256"])
            item["reviewCopy"] = str(destination.resolve())
            for sidecar in item["sidecars"]:
                sidecar_source = Path(sidecar["absolutePath"])
                source_key = str(sidecar_source)
                if source_key not in copied_sidecars:
                    sidecar_name = allocate_copy_name(sidecar_source, sidecar["sha256"], used_sidecar_keys)
                    sidecar_destination = sidecar_dir / sidecar_name
                    copied_sidecars[source_key] = (
                        str(sidecar_destination.resolve()),
                        copy_and_verify(sidecar_source, sidecar_destination, sidecar["sha256"]),
                    )
                sidecar["reviewCopy"], sidecar["reviewCopySha256"] = copied_sidecars[source_key]

    generated = utc_now()
    status = target_status(len(exact))
    all_sidecars = unique_sidecars(records)
    lora_images = [
        item for item in records
        if "LORA_TRAINING" in item["assetClass"]
        or "lora" in normalized(item["relativePath"])
        or "dataset" in normalized(item["relativePath"])
    ]
    lora_sidecars = unique_sidecars(lora_images)

    source_reference = {
        "schemaVersion": SCHEMA_VERSION, "toolVersion": TOOL_VERSION, "generatedAt": generated,
        "readOnlySourceScan": True, "sourceFilesModified": False, "sourceFilesMoved": 0,
        "sourceFilesDeleted": 0, "sourceFilesExecuted": 0, "automaticMasterApprovals": 0,
        "targetName": target_name, "roots": [str(root.resolve()) for root in roots],
        "imageFilesIndexed": len(records), "sidecarFilesIndexed": len(all_sidecars),
    }
    candidate_index = {
        "schemaVersion": SCHEMA_VERSION, "generatedAt": generated, "targetName": target_name,
        "status": status, "exactTargetMatches": len(exact),
        "exactTargetPaths": [item["absolutePath"] for item in exact],
        "riccoCandidates": len(ricco), "automaticMasterApproval": False,
        "decision": "HUMAN_REVIEW_REQUIRED", "candidates": ricco,
    }
    family_index = {
        "schemaVersion": SCHEMA_VERSION, "generatedAt": generated,
        "families": {family: items for family, items in sorted(by_family.items())},
        "mixedDatasetsAutomaticallyMerged": False,
    }
    lora_index = {
        "schemaVersion": SCHEMA_VERSION, "generatedAt": generated,
        "images": lora_images, "sidecars": lora_sidecars,
        "automaticTrainingAuthorization": False,
    }
    duplicate_map = {
        "schemaVersion": SCHEMA_VERSION, "generatedAt": generated,
        "duplicateGroups": duplicate_groups(records),
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

    write_json(output_dir / "PACKAGE_COMPLETE.json", {
        "schemaVersion": SCHEMA_VERSION, "status": status, "completedAt": utc_now(),
        "sourceFilesModified": False, "automaticMasterApprovals": 0,
    })
    incomplete_marker.unlink()
    return {
        "status": status, "outputDir": str(output_dir.resolve()), "filesIndexed": len(records),
        "sidecarsIndexed": len(all_sidecars), "exactTargetMatches": len(exact),
        "riccoCandidates": len(ricco), "duplicateGroups": len(duplicate_map["duplicateGroups"]),
        "sourceFilesModified": False, "automaticMasterApprovals": 0,
    }


def default_roots() -> list[Path]:
    home = Path.home()
    candidates = [
        home / "Downloads", home / "Pictures", home / "Desktop",
        home / "ComfyUI" / "output", home / "AI" / "ComfyUI" / "output",
        home / "Documents" / "ComfyUI" / "output",
    ]
    result, seen = [], set()
    for path in candidates:
        if not path.is_dir():
            continue
        resolved = path.resolve()
        if str(resolved) not in seen:
            seen.add(str(resolved))
            result.append(resolved)
    return result


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a read-only existing character asset review package")
    parser.add_argument("--root", action="append", default=[], help="Existing root to scan; repeat for multiple roots")
    parser.add_argument("--output-dir", required=True, help="New directory for review artifacts")
    parser.add_argument("--target-name", default=DEFAULT_TARGET_NAME)
    parser.add_argument("--no-copy-images", action="store_true", help="Do not copy candidate bytes or sidecars")
    return parser.parse_args(argv)


def resolve_roots(values: list[str]) -> list[Path]:
    if not values:
        return default_roots()
    requested = [Path(value).expanduser() for value in values]
    missing = [str(path) for path in requested if not path.is_dir()]
    if missing:
        raise ValueError(f"Explicit scan roots do not exist: {', '.join(missing)}")
    result, seen = [], set()
    for path in requested:
        resolved = path.resolve()
        if str(resolved) not in seen:
            seen.add(str(resolved))
            result.append(resolved)
    return result


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        roots = resolve_roots(args.root)
        if not roots:
            raise ValueError("no existing scan roots")
        result = build_package(
            roots, Path(args.output_dir).expanduser().resolve(),
            args.target_name, not args.no_copy_images,
        )
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return {"READY_FOR_HUMAN_REVIEW": 0, "BLOCKED_MULTIPLE_EXACT_TARGETS": 4}.get(result["status"], 3)


if __name__ == "__main__":
    raise SystemExit(main())
