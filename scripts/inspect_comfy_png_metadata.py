#!/usr/bin/env python3
"""Inspect PNG metadata for lost Comic Factory assets and build a review bundle.

This script is read-only with respect to source files. It reads a recovery
inventory, extracts PNG tEXt/zTXt/iTXt metadata using only the Python standard
library, ranks Comic Factory evidence, and writes reports plus an optional ZIP
bundle under the recovery report directory.
"""
from __future__ import annotations

import argparse
import json
import re
import struct
import sys
import zipfile
import zlib
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

INSPECTOR_VERSION = "1.0.0"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

FORBIDDEN_TOKENS = (
    "chris-fact-radar", "chris_fact_radar", "chris fact radar",
    "100k_operator_os", "firmen-os", "firmen_os",
)
NOISE_TOKENS = (
    "/promax_apktool/", "/insta dump/", "/telegram desktop/chatexport_",
    "/pictures/pixelcybertheme/", "/pictures/screenshots-ai/",
    "enhanced chris", "/christianwolf/", "/test-results/",
)
TECHNICAL_PLACEHOLDERS = (
    "/assets/characters/ricco.svg", "/assets/characters/basti.svg",
    "/assets/characters/jule.svg", "/assets/characters/don-miau.svg",
)

TARGET_TERMS = {
    "character_ricco": ("ricco", "rico bassmann", "rgbrico", "tupperware", "rucksack"),
    "character_basti": ("basti prenzl", "falk reuter", "rgbfalk", "keepcup", "schlüsselbund", "schluesselbund"),
    "character_jule": ("jule", "hausaktivistin", "plenum", "klebeband"),
    "character_don_miau": ("don miau", "don-miau", "kralle", "rgbkralle", "bosskatze"),
    "location_house_facade": ("hausfassade", "haus nr. 13", "haus nebenwirkung", "building exterior"),
    "location_ricco_room": ("riccos zimmer", "ricos zimmer", "kaputtes zimmer", "mattress room", "matratze"),
    "location_hallway": ("treppenhaus", "flur", "stairwell", "hallway"),
    "location_kitchen": ("gemeinschaftsküche", "gemeinschaftskueche", "shared kitchen", "küche", "kueche"),
}
WORLD_TERMS = (
    "ricco im haus", "rico gegen berlin", "comic factory", "berlin absurd",
    "character sheet", "turnaround", "expression sheet", "storyboard",
    "dicke schwarze konturen", "thick black outlines", "motion comic",
)


@dataclass(frozen=True)
class PngEvidence:
    absolute_path: str
    relative_path: str
    size_bytes: int
    modified_utc: str
    width: int | None
    height: int | None
    metadata_keys: list[str]
    matched_targets: list[str]
    matched_terms: list[str]
    score: int
    metadata_excerpt: str
    review_status: str = "REVIEW_REQUIRED"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalized(value: str) -> str:
    return value.lower().replace("\\", "/").replace("_", "-")


def contains_any(value: str, tokens: tuple[str, ...]) -> bool:
    text = normalized(value)
    return any(normalized(token) in text for token in tokens)


def safe_decode(data: bytes) -> str:
    for encoding in ("utf-8", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def parse_png(path: Path) -> tuple[int | None, int | None, dict[str, str]]:
    metadata: dict[str, str] = {}
    width = height = None
    with path.open("rb") as handle:
        if handle.read(8) != PNG_SIGNATURE:
            raise ValueError("not a PNG file")
        while True:
            header = handle.read(8)
            if len(header) < 8:
                break
            length, chunk_type = struct.unpack(">I4s", header)
            if length > 64 * 1024 * 1024:
                raise ValueError("unreasonable PNG chunk size")
            data = handle.read(length)
            crc = handle.read(4)
            if len(data) != length or len(crc) != 4:
                raise ValueError("truncated PNG")
            if chunk_type == b"IHDR" and len(data) >= 8:
                width, height = struct.unpack(">II", data[:8])
            elif chunk_type == b"tEXt":
                key, sep, value = data.partition(b"\x00")
                if sep:
                    metadata[safe_decode(key)] = safe_decode(value)
            elif chunk_type == b"zTXt":
                key, sep, rest = data.partition(b"\x00")
                if sep and len(rest) >= 2:
                    try:
                        metadata[safe_decode(key)] = safe_decode(zlib.decompress(rest[1:]))
                    except zlib.error:
                        metadata[safe_decode(key)] = "<invalid compressed text>"
            elif chunk_type == b"iTXt":
                try:
                    key, rest = data.split(b"\x00", 1)
                    compression_flag = rest[0]
                    rest = rest[2:]
                    _language, rest = rest.split(b"\x00", 1)
                    _translated, text_data = rest.split(b"\x00", 1)
                    if compression_flag == 1:
                        text_data = zlib.decompress(text_data)
                    metadata[safe_decode(key)] = safe_decode(text_data)
                except (ValueError, IndexError, zlib.error):
                    metadata["iTXt_error"] = "<invalid international text>"
            if chunk_type == b"IEND":
                break
    return width, height, metadata


def is_generic_comfy_path(path: str) -> bool:
    text = normalized(path)
    name = Path(path).name.lower()
    return (
        "comfyui_" in name
        or "/comfyui/output/" in text
        or "/output/" in text
        or "/generated/" in text
        or "/telegram desktop/" in text
    )


def score_metadata(path: str, metadata: dict[str, str]) -> tuple[int, list[str], list[str], str]:
    combined = normalized(path + "\n" + "\n".join(f"{key}: {value}" for key, value in metadata.items()))
    matched_targets: list[str] = []
    matched_terms: list[str] = []
    score = 0

    for target_id, terms in TARGET_TERMS.items():
        hits = [term for term in terms if normalized(term) in combined]
        if hits:
            matched_targets.append(target_id)
            matched_terms.extend(hits)
            score += 70 + min(30, 10 * (len(hits) - 1))

    world_hits = [term for term in WORLD_TERMS if normalized(term) in combined]
    if world_hits:
        matched_terms.extend(world_hits)
        score += 30 + min(20, 5 * (len(world_hits) - 1))

    keys = {normalized(key) for key in metadata}
    if {"prompt", "workflow", "parameters"} & keys:
        score += 10

    excerpt_source = "\n".join(str(value) for value in metadata.values())
    excerpt_source = re.sub(r"\s+", " ", excerpt_source).strip()
    return score, sorted(set(matched_targets)), sorted(set(matched_terms)), excerpt_source[:1600]


def load_inventory(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("readOnlySourceScan") is not True:
        raise ValueError("Inventory is not marked as a read-only source scan.")
    if not isinstance(payload.get("files"), list):
        raise ValueError("Inventory files list is missing.")
    return payload


def inspect(payload: dict):
    evidence: list[PngEvidence] = []
    generic: list[dict] = []
    errors: list[str] = []
    skipped = {"forbidden": 0, "noise": 0, "not_png": 0, "missing": 0, "placeholder": 0}

    for record in payload["files"]:
        path_text = str(record.get("absolute_path", ""))
        if contains_any(path_text, FORBIDDEN_TOKENS):
            skipped["forbidden"] += 1
            continue
        if contains_any(path_text, NOISE_TOKENS):
            skipped["noise"] += 1
            continue
        if contains_any(path_text, TECHNICAL_PLACEHOLDERS):
            skipped["placeholder"] += 1
            continue
        if str(record.get("extension", "")).lower() != ".png":
            skipped["not_png"] += 1
            continue

        path = Path(path_text)
        if not path.is_file():
            skipped["missing"] += 1
            continue

        try:
            width, height, metadata = parse_png(path)
            score, matched_targets, matched_terms, excerpt = score_metadata(path_text, metadata)
            base = {
                "absolute_path": path_text,
                "relative_path": str(record.get("relative_path", "")),
                "size_bytes": int(record.get("size_bytes", 0)),
                "modified_utc": str(record.get("modified_utc", "")),
                "width": width,
                "height": height,
                "metadata_keys": sorted(metadata),
            }
            if score > 0:
                evidence.append(PngEvidence(
                    **base,
                    matched_targets=matched_targets,
                    matched_terms=matched_terms,
                    score=score,
                    metadata_excerpt=excerpt,
                ))
            elif is_generic_comfy_path(path_text):
                generic.append(base)
        except (OSError, ValueError) as exc:
            errors.append(f"{path_text}: {exc}")

    evidence.sort(key=lambda item: (-item.score, item.absolute_path.lower()))
    generic.sort(key=lambda item: (item.get("modified_utc", ""), item.get("absolute_path", "")), reverse=True)
    return evidence, generic, errors, skipped


def make_bundle(output_dir: Path, evidence: list[PngEvidence], generic: list[dict], max_files: int, max_bytes: int):
    selected: list[tuple[str, str, str]] = []
    seen_paths = set()
    total = 0

    def consider(path: str, label: str, reason: str):
        nonlocal total
        if path in seen_paths or len(selected) >= max_files:
            return
        source = Path(path)
        if not source.is_file():
            return
        size = source.stat().st_size
        if total + size > max_bytes:
            return
        seen_paths.add(path)
        selected.append((path, label, reason))
        total += size

    for item in evidence:
        consider(item.absolute_path, "metadata-match", ",".join(item.matched_targets) or "world-term")
    for item in generic:
        consider(str(item["absolute_path"]), "generic-comfy-fallback", "metadata stripped or no comic term")

    bundle_path = output_dir / "comic-visual-review-bundle.zip"
    manifest = {
        "schemaVersion": 1,
        "automaticCanonApproval": False,
        "reviewStatus": "REVIEW_REQUIRED",
        "files": [
            {
                "sourcePath": path,
                "bundleName": f"images/{index:03d}_{Path(path).name}",
                "selection": label,
                "reason": reason,
            }
            for index, (path, label, reason) in enumerate(selected, start=1)
        ],
    }
    with zipfile.ZipFile(bundle_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        for index, (path, _label, _reason) in enumerate(selected, start=1):
            archive.write(path, arcname=f"images/{index:03d}_{Path(path).name}")
    return bundle_path, manifest, total


def write_reports(inventory_path: Path, output_dir: Path, evidence, generic, errors, skipped, bundle_manifest, bundle_path, bundle_bytes):
    output_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "schemaVersion": 1,
        "inspectorVersion": INSPECTOR_VERSION,
        "generatedAt": utc_now(),
        "sourceInventory": str(inventory_path.resolve()),
        "automaticCanonApproval": False,
        "summary": {
            "metadataMatches": len(evidence),
            "genericComfyFallbackCandidates": len(generic),
            "bundleFiles": len(bundle_manifest["files"]),
            "bundleBytes": bundle_bytes,
            "errors": len(errors),
            "skipped": skipped,
        },
        "metadataMatches": [asdict(item) for item in evidence],
        "genericComfyFallbackCandidates": generic,
        "bundle": {
            "path": str(bundle_path),
            "reviewStatus": "REVIEW_REQUIRED",
            "files": bundle_manifest["files"],
        },
        "errors": errors,
    }
    (output_dir / "comfy-png-metadata-report.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    lines = [
        "# ComfyUI PNG Metadata Recovery", "",
        f"- Metadata matches: **{len(evidence)}**",
        f"- Generic ComfyUI fallback files found: **{len(generic)}**",
        f"- Files packed for visual review: **{len(bundle_manifest['files'])}**",
        f"- Bundle: `{bundle_path}`",
        "- Canon approval: **NO**", "",
    ]
    if evidence:
        lines.extend(["## Metadata matches", ""])
        for item in evidence:
            lines.append(f"- score **{item.score}** · `{item.absolute_path}`")
            lines.append(f"  - targets: {', '.join(item.matched_targets) or 'world-only'}")
            lines.append(f"  - terms: {', '.join(item.matched_terms)}")
    else:
        lines.extend([
            "## Metadata result", "",
            "- No Comic Factory terms were found in embedded PNG metadata.",
            "- This does not prove the images are irrelevant; Telegram or other exports may have stripped metadata.",
        ])
    lines.extend([
        "", "## Review rule", "",
        "Every bundled file remains `REVIEW_REQUIRED`. The script does not write canon files, move source assets or approve a master reference.",
    ])
    (output_dir / "comfy-png-metadata-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (output_dir / "comfy-png-metadata-errors.log").write_text("\n".join(errors) + ("\n" if errors else ""), encoding="utf-8")


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Inspect ComfyUI PNG metadata and prepare a review ZIP")
    parser.add_argument("--inventory", required=True)
    parser.add_argument("--output-dir")
    parser.add_argument("--bundle-max-files", type=int, default=20)
    parser.add_argument("--bundle-max-mb", type=int, default=100)
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    try:
        inventory_path = Path(args.inventory).expanduser().resolve()
        if not inventory_path.is_file():
            raise ValueError(f"Inventory file does not exist: {inventory_path}")
        output_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else inventory_path.parent / "analysis"
        if contains_any(str(inventory_path), FORBIDDEN_TOKENS) or contains_any(str(output_dir), FORBIDDEN_TOKENS):
            raise ValueError("Forbidden unrelated project path.")
        payload = load_inventory(inventory_path)
        evidence, generic, errors, skipped = inspect(payload)
        output_dir.mkdir(parents=True, exist_ok=True)
        bundle_path, manifest, bundle_bytes = make_bundle(
            output_dir,
            evidence,
            generic,
            max(1, args.bundle_max_files),
            max(1, args.bundle_max_mb) * 1024 * 1024,
        )
        write_reports(inventory_path, output_dir, evidence, generic, errors, skipped, manifest, bundle_path, bundle_bytes)
        print(json.dumps({
            "status": "ok",
            "inspectorVersion": INSPECTOR_VERSION,
            "metadataMatches": len(evidence),
            "genericComfyFallbackCandidates": len(generic),
            "bundleFiles": len(manifest["files"]),
            "bundlePath": str(bundle_path),
            "automaticCanonApproval": False,
        }, ensure_ascii=False))
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
