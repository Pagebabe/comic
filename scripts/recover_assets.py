#!/usr/bin/env python3
"""Read-only Comic Factory asset recovery scanner.

The scanner never modifies source assets. It only writes reports into the
chosen report directory. Symlinks are not followed. Known unrelated projects,
especially Chris Fact Radar, are excluded and cannot be used as scan roots.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

SCANNER_VERSION = "1.0.0"

MEDIA_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".psd", ".kra",
    ".mp4", ".mov", ".mkv", ".webm", ".wav", ".mp3", ".m4a", ".flac",
    ".safetensors", ".ckpt", ".pt", ".pth", ".onnx",
}
MANIFEST_EXTENSIONS = {".json", ".yaml", ".yml", ".md", ".txt", ".csv"}
EXCLUDED_DIR_NAMES = {
    ".git", "node_modules", ".next", "dist", "build", ".cache", ".venv",
    "venv", "__pycache__", ".pytest_cache", ".mypy_cache", ".idea",
}
FORBIDDEN_PROJECT_TOKENS = {
    "chris-fact-radar", "chris_fact_radar", "chris fact radar",
    "chris-fact-radar-studio", "100k_operator_os", "firmen-os", "firmen_os",
}

CATEGORY_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("CHARACTER_SHEET", ("character", "char_", "turnaround", "expression", "pose", "portrait", "ricco", "rico", "basti", "falk", "jule", "miau", "kralle")),
    ("LOCATION_SHEET", ("location", "background", "room", "zimmer", "flur", "kueche", "küche", "haus", "späti", "spaeti", "club")),
    ("LORA_DATASET", ("lora", "dataset", "caption", "trigger_token", "training")),
    ("PANEL_OR_KEYFRAME", ("panel", "shot", "keyframe", "frame", "storyboard", "animatic")),
    ("REVIEW_OR_MANIFEST", ("review", "manifest", "selected", "approval", "final", "package", "backup", "export")),
]


@dataclass(frozen=True)
class AssetRecord:
    root_index: int
    absolute_path: str
    relative_path: str
    extension: str
    size_bytes: int
    modified_utc: str
    sha256: str | None
    hash_status: str
    category: str
    media_kind: str
    likely_candidate: bool


def utc_iso(timestamp: float | None = None) -> str:
    dt = datetime.fromtimestamp(timestamp, tz=timezone.utc) if timestamp is not None else datetime.now(timezone.utc)
    return dt.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalized_text(path: Path) -> str:
    return str(path).lower().replace("_", "-").replace("\\", "/")


def contains_forbidden_project(path: Path) -> bool:
    text = normalized_text(path)
    return any(token.replace("_", "-") in text for token in FORBIDDEN_PROJECT_TOKENS)


def validate_root(path: Path) -> Path:
    resolved = path.expanduser().resolve()
    if not resolved.exists() or not resolved.is_dir():
        raise ValueError(f"Scan root is not a directory: {resolved}")
    if contains_forbidden_project(resolved):
        raise ValueError(f"Forbidden unrelated project root: {resolved}")
    return resolved


def is_excluded(path: Path, report_dir: Path) -> bool:
    try:
        path.resolve().relative_to(report_dir.resolve())
        return True
    except ValueError:
        pass
    if contains_forbidden_project(path):
        return True
    return any(part in EXCLUDED_DIR_NAMES for part in path.parts)


def classify(path: Path) -> tuple[str, str, bool]:
    ext = path.suffix.lower()
    text = normalized_text(path)
    if ext in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".psd", ".kra"}:
        media_kind = "image"
    elif ext in {".mp4", ".mov", ".mkv", ".webm"}:
        media_kind = "video"
    elif ext in {".wav", ".mp3", ".m4a", ".flac"}:
        media_kind = "audio"
    elif ext in {".safetensors", ".ckpt", ".pt", ".pth", ".onnx"}:
        media_kind = "model"
    elif ext in MANIFEST_EXTENSIONS:
        media_kind = "document"
    else:
        media_kind = "other"

    for category, tokens in CATEGORY_RULES:
        if any(token in text for token in tokens):
            return category, media_kind, True

    if media_kind in {"image", "video", "audio", "model"}:
        return "OTHER_MEDIA", media_kind, False
    return "OTHER_MANIFEST", media_kind, False


def sha256_file(path: Path, hash_limit_bytes: int) -> tuple[str | None, str]:
    size = path.stat().st_size
    if size > hash_limit_bytes:
        return None, "SKIPPED_SIZE_LIMIT"
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest(), "HASHED"


def iter_files(root: Path, report_dir: Path) -> Iterable[Path]:
    for current, dirs, files in os.walk(root, followlinks=False):
        current_path = Path(current)
        dirs[:] = [
            name for name in dirs
            if not is_excluded(current_path / name, report_dir)
            and not (current_path / name).is_symlink()
        ]
        for name in files:
            candidate = current_path / name
            if candidate.is_symlink() or is_excluded(candidate, report_dir):
                continue
            ext = candidate.suffix.lower()
            if ext in MEDIA_EXTENSIONS or ext in MANIFEST_EXTENSIONS:
                yield candidate


def scan(roots: list[Path], report_dir: Path, hash_limit_bytes: int) -> tuple[list[AssetRecord], list[str]]:
    records: list[AssetRecord] = []
    errors: list[str] = []
    for root_index, root in enumerate(roots):
        for path in iter_files(root, report_dir):
            try:
                stat = path.stat()
                category, media_kind, likely = classify(path)
                digest, hash_status = sha256_file(path, hash_limit_bytes)
                records.append(AssetRecord(
                    root_index=root_index,
                    absolute_path=str(path.resolve()),
                    relative_path=str(path.resolve().relative_to(root)),
                    extension=path.suffix.lower(),
                    size_bytes=stat.st_size,
                    modified_utc=utc_iso(stat.st_mtime),
                    sha256=digest,
                    hash_status=hash_status,
                    category=category,
                    media_kind=media_kind,
                    likely_candidate=likely,
                ))
            except (OSError, ValueError) as exc:
                errors.append(f"{path}: {exc}")
    records.sort(key=lambda item: (item.root_index, item.relative_path.lower()))
    return records, errors


def duplicate_groups(records: list[AssetRecord]) -> list[dict[str, object]]:
    grouped: dict[str, list[AssetRecord]] = defaultdict(list)
    for record in records:
        if record.sha256:
            grouped[record.sha256].append(record)
    return [
        {
            "sha256": digest,
            "sizeBytes": group[0].size_bytes,
            "paths": [record.absolute_path for record in group],
        }
        for digest, group in sorted(grouped.items())
        if len(group) > 1
    ]


def write_reports(roots: list[Path], report_dir: Path, records: list[AssetRecord], errors: list[str], hash_limit_bytes: int) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    duplicates = duplicate_groups(records)
    category_counts = Counter(record.category for record in records)
    kind_counts = Counter(record.media_kind for record in records)

    payload = {
        "schemaVersion": 1,
        "scannerVersion": SCANNER_VERSION,
        "generatedAt": utc_iso(),
        "readOnlySourceScan": True,
        "roots": [str(root) for root in roots],
        "reportDirectory": str(report_dir.resolve()),
        "hashLimitBytes": hash_limit_bytes,
        "forbiddenProjectsExcluded": sorted(FORBIDDEN_PROJECT_TOKENS),
        "summary": {
            "files": len(records),
            "likelyCandidates": sum(record.likely_candidate for record in records),
            "errors": len(errors),
            "duplicateGroups": len(duplicates),
            "byCategory": dict(sorted(category_counts.items())),
            "byMediaKind": dict(sorted(kind_counts.items())),
        },
        "duplicates": duplicates,
        "files": [asdict(record) for record in records],
        "errors": errors,
    }
    (report_dir / "asset-recovery-inventory.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    with (report_dir / "asset-recovery-files.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(asdict(records[0]).keys()) if records else [
            "root_index", "absolute_path", "relative_path", "extension", "size_bytes", "modified_utc",
            "sha256", "hash_status", "category", "media_kind", "likely_candidate",
        ])
        writer.writeheader()
        for record in records:
            writer.writerow(asdict(record))

    lines = [
        "# Comic Factory Asset Recovery Summary",
        "",
        f"- Scanner: `{SCANNER_VERSION}`",
        f"- Generated: `{payload['generatedAt']}`",
        "- Source mode: **read-only**",
        f"- Roots: {len(roots)}",
        f"- Files inventoried: {len(records)}",
        f"- Likely candidates: {payload['summary']['likelyCandidates']}",
        f"- Duplicate groups: {len(duplicates)}",
        f"- Errors: {len(errors)}",
        "",
        "## Categories",
        "",
    ]
    for category, count in sorted(category_counts.items()):
        lines.append(f"- `{category}`: {count}")
    lines.extend(["", "## Highest-priority candidates", ""])
    candidates = [record for record in records if record.likely_candidate][:100]
    if candidates:
        for record in candidates:
            lines.append(f"- `{record.category}` · `{record.absolute_path}` · {record.size_bytes} bytes")
    else:
        lines.append("- No likely candidates found.")
    lines.extend(["", "## Safety", "", "No source file was created, modified, moved, renamed or deleted by this scanner. Only this report directory was written.", ""])
    (report_dir / "asset-recovery-summary.md").write_text("\n".join(lines), encoding="utf-8")
    (report_dir / "asset-recovery-errors.log").write_text("\n".join(errors) + ("\n" if errors else ""), encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Read-only Comic Factory asset recovery scanner")
    parser.add_argument("--root", action="append", required=True, help="Directory to scan. Repeat for multiple roots.")
    parser.add_argument("--report-dir", help="Report output directory. Default: <first-root>/_recovery_reports")
    parser.add_argument("--hash-limit-mb", type=int, default=2048, help="Do not hash individual files above this size. Default: 2048 MB")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        roots = [validate_root(Path(value)) for value in args.root]
        report_dir = Path(args.report_dir).expanduser().resolve() if args.report_dir else (roots[0] / "_recovery_reports").resolve()
        if contains_forbidden_project(report_dir):
            raise ValueError(f"Forbidden report path: {report_dir}")
        hash_limit_bytes = max(1, args.hash_limit_mb) * 1024 * 1024
        records, errors = scan(roots, report_dir, hash_limit_bytes)
        write_reports(roots, report_dir, records, errors, hash_limit_bytes)
        print(json.dumps({
            "status": "ok",
            "scannerVersion": SCANNER_VERSION,
            "files": len(records),
            "likelyCandidates": sum(record.likely_candidate for record in records),
            "errors": len(errors),
            "reportDirectory": str(report_dir),
        }, ensure_ascii=False))
        return 0
    except (OSError, ValueError) as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
