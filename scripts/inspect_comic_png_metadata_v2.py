#!/usr/bin/env python3
"""Strictly inspect PNG metadata for Comic Factory assets.

The script reads a read-only recovery inventory, extracts embedded PNG metadata,
separates positive from negative ComfyUI prompt branches, and only bundles files
with explicit Comic Factory identity plus comic-production style evidence.

It never edits source files and never approves canon automatically.
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
import zipfile
import zlib
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

INSPECTOR_VERSION = "2.0.0"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

FORBIDDEN_PATH_TOKENS = (
    "chris-fact-radar",
    "chris_fact_radar",
    "chris fact radar",
    "100k_operator_os",
    "firmen-os",
    "firmen_os",
)

NOISE_PATH_TOKENS = (
    "/promax_apktool/",
    "/insta dump/",
    "/telegram desktop/chatexport_",
    "/pictures/pixelcybertheme/",
    "/pictures/screenshots-ai/",
    "enhanced chris",
    "/christianwolf/",
    "/test-results/",
)

PROJECT_IDENTITY_TERMS = (
    "comic factory",
    "ricco im haus",
    "rico gegen berlin",
    "haus nr. 13",
    "haus nebenwirkung",
    "berlin absurd",
)

STYLE_TERMS = (
    "comic",
    "cartoon",
    "illustration",
    "character sheet",
    "turnaround",
    "expression sheet",
    "storyboard",
    "panel",
    "motion comic",
    "2d animation",
    "thick black outlines",
    "dicke schwarze konturen",
    "cel shading",
)

PHOTO_OR_NSFW_REJECT_TERMS = (
    "instagram photo",
    "amateur photo",
    "photorealistic",
    "photo realistic",
    "realistic skin",
    "skin imperfections",
    "selfie",
    "influencer",
    "social media photo",
    "eos 5d",
    "aperture",
    "shutter speed",
    "depth of field",
    "camera lens",
    "bikini",
    "lingerie",
    "breasts",
    "nude",
    "naked",
    "nsfw",
)

TARGET_TERMS = {
    "character_ricco": (
        "ricco",
        "rico bassmann",
        "rgbrico",
        "tupperware",
    ),
    "character_basti": (
        "basti prenzl",
        "falk reuter",
        "rgbfalk",
        "keepcup",
        "schlüsselbund",
        "schluesselbund",
    ),
    "character_jule": (
        "jule",
        "hausaktivistin",
        "plenum-machtzentrum",
    ),
    "character_don_miau": (
        "don miau",
        "don-miau",
        "kralle",
        "rgbkralle",
        "bosskatze",
    ),
    "location_house_facade": (
        "haus nr. 13",
        "haus nebenwirkung",
        "hausfassade",
    ),
    "location_ricco_room": (
        "riccos zimmer",
        "ricos zimmer",
        "kaputtes zimmer",
    ),
    "location_hallway": (
        "treppenhaus",
        "flur im haus nr. 13",
        "hallway house no. 13",
    ),
    "location_kitchen": (
        "gemeinschaftsküche",
        "gemeinschaftskueche",
        "shared kitchen house no. 13",
    ),
}

CHARACTER_TARGETS = {
    "character_ricco",
    "character_basti",
    "character_jule",
    "character_don_miau",
}


@dataclass(frozen=True)
class Candidate:
    absolute_path: str
    relative_path: str
    width: int | None
    height: int | None
    size_bytes: int
    modified_utc: str
    matched_targets: list[str]
    matched_identity_terms: list[str]
    matched_style_terms: list[str]
    positive_prompt_excerpt: str
    review_status: str = "REVIEW_REQUIRED"


@dataclass(frozen=True)
class Rejection:
    absolute_path: str
    reason: str
    matched_terms: list[str]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalized(value: str) -> str:
    return value.lower().replace("\\", "/").replace("_", "-")


def contains_any(value: str, tokens: tuple[str, ...]) -> list[str]:
    text = normalized(value)
    return [token for token in tokens if normalized(token) in text]


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


def node_reference(value) -> str | None:
    if isinstance(value, list) and value and isinstance(value[0], (str, int)):
        return str(value[0])
    return None


def collect_text_from_node(graph: dict, node_id: str, visited: set[str]) -> list[str]:
    if node_id in visited:
        return []
    visited.add(node_id)
    node = graph.get(str(node_id))
    if not isinstance(node, dict):
        return []
    inputs = node.get("inputs", {})
    if not isinstance(inputs, dict):
        return []
    texts: list[str] = []
    for key, value in inputs.items():
        if key.lower() == "negative":
            continue
        if key.lower() in {"text", "prompt", "positive"} and isinstance(value, str):
            texts.append(value)
        ref = node_reference(value)
        if ref is not None:
            texts.extend(collect_text_from_node(graph, ref, visited))
    return texts


def positive_text_from_comfy_prompt(raw: str) -> str:
    try:
        graph = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return ""
    if not isinstance(graph, dict):
        return ""

    texts: list[str] = []
    for node_id, node in graph.items():
        if not isinstance(node, dict):
            continue
        class_type = str(node.get("class_type", "")).lower()
        if "ksampler" not in class_type:
            continue
        positive_ref = node_reference(node.get("inputs", {}).get("positive"))
        if positive_ref:
            texts.extend(collect_text_from_node(graph, positive_ref, set()))

    if texts:
        return "\n".join(texts)

    for node in graph.values():
        if not isinstance(node, dict):
            continue
        class_type = str(node.get("class_type", "")).lower()
        title = str(node.get("_meta", {}).get("title", "")).lower()
        if "cliptextencode" in class_type and "negative" not in title:
            value = node.get("inputs", {}).get("text")
            if isinstance(value, str):
                texts.append(value)
    return "\n".join(texts)


def positive_prompt(metadata: dict[str, str]) -> str:
    prompt_raw = metadata.get("prompt") or metadata.get("Prompt")
    if prompt_raw:
        extracted = positive_text_from_comfy_prompt(prompt_raw)
        if extracted:
            return extracted

    parameters = metadata.get("parameters") or metadata.get("Parameters")
    if parameters:
        marker = "Negative prompt:"
        return parameters.split(marker, 1)[0].strip()

    positive = metadata.get("positive") or metadata.get("Positive")
    return positive if isinstance(positive, str) else ""


def classify_prompt(prompt: str) -> tuple[bool, list[str], list[str], list[str], str]:
    clean = normalized(prompt)
    reject_hits = contains_any(clean, PHOTO_OR_NSFW_REJECT_TERMS)
    if reject_hits:
        return False, [], [], reject_hits, "photographic_or_nsfw_prompt"

    style_hits = contains_any(clean, STYLE_TERMS)
    identity_hits = contains_any(clean, PROJECT_IDENTITY_TERMS)
    matched_targets = [
        target_id
        for target_id, terms in TARGET_TERMS.items()
        if contains_any(clean, terms)
    ]

    character_identity = any(target_id in CHARACTER_TARGETS for target_id in matched_targets)
    explicit_project = bool(identity_hits)
    eligible = bool(style_hits) and (explicit_project or character_identity)

    if not style_hits:
        return False, matched_targets, identity_hits, [], "missing_comic_style_evidence"
    if not explicit_project and not character_identity:
        return False, matched_targets, identity_hits, [], "missing_project_or_character_identity"
    return eligible, matched_targets, identity_hits, style_hits, "eligible"


def load_inventory(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("readOnlySourceScan") is not True:
        raise ValueError("Inventory is not marked as a read-only source scan.")
    if not isinstance(payload.get("files"), list):
        raise ValueError("Inventory files list is missing.")
    return payload


def inspect(payload: dict) -> tuple[list[Candidate], list[Rejection], list[str]]:
    candidates: list[Candidate] = []
    rejections: list[Rejection] = []
    errors: list[str] = []

    for record in payload["files"]:
        path_text = str(record.get("absolute_path", ""))
        if contains_any(path_text, FORBIDDEN_PATH_TOKENS):
            continue
        if contains_any(path_text, NOISE_PATH_TOKENS):
            continue
        if str(record.get("extension", "")).lower() != ".png":
            continue

        path = Path(path_text)
        if not path.is_file():
            continue

        try:
            width, height, metadata = parse_png(path)
            prompt = positive_prompt(metadata)
            if not prompt:
                rejections.append(Rejection(path_text, "no_positive_prompt_metadata", []))
                continue
            eligible, targets, identity_hits, evidence_hits, reason = classify_prompt(prompt)
            if not eligible:
                rejections.append(Rejection(path_text, reason, evidence_hits))
                continue
            candidates.append(Candidate(
                absolute_path=path_text,
                relative_path=str(record.get("relative_path", "")),
                width=width,
                height=height,
                size_bytes=int(record.get("size_bytes", 0)),
                modified_utc=str(record.get("modified_utc", "")),
                matched_targets=targets,
                matched_identity_terms=identity_hits,
                matched_style_terms=evidence_hits,
                positive_prompt_excerpt=" ".join(prompt.split())[:1200],
            ))
        except (OSError, ValueError) as exc:
            errors.append(f"{path_text}: {exc}")

    candidates.sort(key=lambda item: (item.matched_targets, item.absolute_path.lower()))
    rejections.sort(key=lambda item: (item.reason, item.absolute_path.lower()))
    return candidates, rejections, errors


def write_outputs(inventory_path: Path, output_dir: Path, candidates: list[Candidate], rejections: list[Rejection], errors: list[str], max_files: int, max_bytes: int) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    selected: list[Candidate] = []
    total_bytes = 0
    for item in candidates:
        if len(selected) >= max_files:
            break
        source = Path(item.absolute_path)
        size = source.stat().st_size
        if total_bytes + size > max_bytes:
            continue
        selected.append(item)
        total_bytes += size

    bundle_path = output_dir / "comic-visual-review-bundle-v2.zip"
    manifest = {
        "schemaVersion": 2,
        "inspectorVersion": INSPECTOR_VERSION,
        "automaticCanonApproval": False,
        "reviewStatus": "REVIEW_REQUIRED",
        "files": [
            {
                "sourcePath": item.absolute_path,
                "bundleName": f"images/{index:03d}_{Path(item.absolute_path).name}",
                "matchedTargets": item.matched_targets,
                "matchedIdentityTerms": item.matched_identity_terms,
                "matchedStyleTerms": item.matched_style_terms,
            }
            for index, item in enumerate(selected, start=1)
        ],
    }
    with zipfile.ZipFile(bundle_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        for index, item in enumerate(selected, start=1):
            archive.write(item.absolute_path, arcname=f"images/{index:03d}_{Path(item.absolute_path).name}")

    report = {
        "schemaVersion": 2,
        "inspectorVersion": INSPECTOR_VERSION,
        "generatedAt": utc_now(),
        "sourceInventory": str(inventory_path.resolve()),
        "automaticCanonApproval": False,
        "summary": {
            "eligibleCandidates": len(candidates),
            "rejectedFiles": len(rejections),
            "bundleFiles": len(selected),
            "bundleBytes": total_bytes,
            "errors": len(errors),
        },
        "candidates": [asdict(item) for item in candidates],
        "rejections": [asdict(item) for item in rejections],
        "bundle": manifest,
        "errors": errors,
    }
    (output_dir / "comic-png-strict-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "comic-png-strict-errors.log").write_text(
        "\n".join(errors) + ("\n" if errors else ""),
        encoding="utf-8",
    )
    return bundle_path


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Strict Comic Factory PNG metadata inspection")
    parser.add_argument("--inventory", required=True)
    parser.add_argument("--output-dir")
    parser.add_argument("--bundle-max-files", type=int, default=20)
    parser.add_argument("--bundle-max-mb", type=int, default=100)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        inventory_path = Path(args.inventory).expanduser().resolve()
        if not inventory_path.is_file():
            raise ValueError(f"Inventory file does not exist: {inventory_path}")
        output_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else inventory_path.parent / "analysis"
        if contains_any(str(inventory_path), FORBIDDEN_PATH_TOKENS) or contains_any(str(output_dir), FORBIDDEN_PATH_TOKENS):
            raise ValueError("Forbidden unrelated project path.")
        payload = load_inventory(inventory_path)
        candidates, rejections, errors = inspect(payload)
        bundle_path = write_outputs(
            inventory_path,
            output_dir,
            candidates,
            rejections,
            errors,
            max(1, args.bundle_max_files),
            max(1, args.bundle_max_mb) * 1024 * 1024,
        )
        print(json.dumps({
            "status": "ok",
            "inspectorVersion": INSPECTOR_VERSION,
            "eligibleCandidates": len(candidates),
            "rejectedFiles": len(rejections),
            "bundlePath": str(bundle_path),
            "automaticCanonApproval": False,
        }, ensure_ascii=False))
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
