#!/usr/bin/env python3
"""Analyze a Comic Factory recovery inventory without approving any asset.

The analyzer reads the JSON produced by recover_assets.py and writes a ranked
review shortlist. It never edits source assets and never marks an item as
canonical. Ranking is filename/path metadata only; human visual review remains
mandatory.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path

ANALYZER_VERSION = "1.0.0"
FORBIDDEN_TOKENS = (
    "chris-fact-radar",
    "chris_fact_radar",
    "chris fact radar",
    "100k_operator_os",
    "firmen-os",
    "firmen_os",
)
PLACEHOLDER_TOKENS = (
    "m1-life-sign",
    "technical-proof",
    "technikplatzhalter",
    "/assets/characters/ricco.svg",
    "/assets/characters/basti.svg",
    "/assets/characters/jule.svg",
    "/assets/characters/don-miau.svg",
)

TARGETS = {
    "character_ricco": {
        "kind": "character",
        "label": "Ricco",
        "aliases": ("ricco", "rico", "bassmann", "rgbrico", "tupperware", "tupper", "backpack", "rucksack"),
    },
    "character_basti": {
        "kind": "character",
        "label": "Basti Prenzl",
        "aliases": ("basti", "prenzl", "falk", "reuter", "rgbfalk", "keepcup", "keychain", "schluessel", "schlüssel"),
    },
    "character_jule": {
        "kind": "character",
        "label": "Jule",
        "aliases": ("jule", "plenum", "activist", "aktivistin", "marker", "klebeband"),
    },
    "character_don_miau": {
        "kind": "character",
        "label": "Don Miau",
        "aliases": ("don-miau", "don_miau", "don miau", "kralle", "rgbkralle", "boss-cat", "bosscat", "bosskatze"),
    },
    "location_house_facade": {
        "kind": "location",
        "label": "Haus Nr. 13 / Hausfassade",
        "aliases": ("hausfassade", "fassade", "house-front", "exterior", "nr-13", "nr13", "nebenwirkung"),
    },
    "location_ricco_room": {
        "kind": "location",
        "label": "Riccos Zimmer",
        "aliases": ("ricco-zimmer", "rico-zimmer", "riccos-zimmer", "zimmer", "bedroom", "mattress", "matratze"),
    },
    "location_hallway": {
        "kind": "location",
        "label": "Flur / Treppenhaus",
        "aliases": ("flur", "treppenhaus", "stairwell", "hallway", "corridor", "stairs"),
    },
    "location_kitchen": {
        "kind": "location",
        "label": "Gemeinschaftsküche",
        "aliases": ("gemeinschaftskueche", "gemeinschaftsküche", "kueche", "küche", "kitchen", "fridge", "kuehlschrank", "kühlschrank"),
    },
}


@dataclass(frozen=True)
class RankedCandidate:
    target_id: str
    target_label: str
    target_kind: str
    absolute_path: str
    relative_path: str
    category: str
    media_kind: str
    size_bytes: int
    modified_utc: str
    sha256: str | None
    score: int
    reasons: list[str]
    placeholder_risk: bool
    decision: str = "REVIEW_REQUIRED"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalized(value: str) -> str:
    return value.lower().replace("\\", "/").replace("_", "-")


def contains_forbidden(value: str) -> bool:
    text = normalized(value)
    return any(token.replace("_", "-") in text for token in FORBIDDEN_TOKENS)


def token_match(text: str, alias: str) -> bool:
    normalized_alias = normalized(alias)
    if len(normalized_alias) <= 3:
        return re.search(rf"(^|[^a-z0-9]){re.escape(normalized_alias)}([^a-z0-9]|$)", text) is not None
    return normalized_alias in text


def score_record(record: dict, target: dict) -> tuple[int, list[str], bool]:
    path_text = normalized(f"{record.get('absolute_path', '')} {record.get('relative_path', '')}")
    category = str(record.get("category", ""))
    media_kind = str(record.get("media_kind", ""))
    score = 0
    reasons: list[str] = []

    matched_aliases = [alias for alias in target["aliases"] if token_match(path_text, alias)]
    if matched_aliases:
        alias_score = min(60, 18 + (len(matched_aliases) - 1) * 8)
        score += alias_score
        reasons.append(f"aliases: {', '.join(matched_aliases[:5])}")

    expected_category = "CHARACTER_SHEET" if target["kind"] == "character" else "LOCATION_SHEET"
    if category == expected_category:
        score += 35
        reasons.append(f"category: {expected_category}")
    elif category == "PANEL_OR_KEYFRAME":
        score += 12
        reasons.append("panel/keyframe context")
    elif category == "REVIEW_OR_MANIFEST":
        score += 8
        reasons.append("review/manifest context")

    if media_kind == "image":
        score += 22
        reasons.append("image asset")
    elif media_kind == "video":
        score += 8
        reasons.append("video reference")
    elif media_kind == "document":
        score += 4
        reasons.append("document metadata")
    elif media_kind == "model" and target["kind"] == "character":
        score += 10
        reasons.append("character model candidate")

    extension = str(record.get("extension", "")).lower()
    if extension in {".psd", ".kra"}:
        score += 8
        reasons.append("editable source")
    elif extension in {".png", ".webp"}:
        score += 4
        reasons.append("lossless/reference-friendly image")

    placeholder_risk = any(token in path_text for token in PLACEHOLDER_TOKENS)
    if placeholder_risk:
        score -= 70
        reasons.append("technical placeholder risk")

    if record.get("likely_candidate"):
        score += 5
        reasons.append("scanner candidate")

    if not matched_aliases:
        score -= 25
    return score, reasons, placeholder_risk


def load_inventory(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("readOnlySourceScan") is not True:
        raise ValueError("Inventory is not marked as a read-only source scan.")
    if not isinstance(payload.get("files"), list):
        raise ValueError("Inventory files list is missing.")
    return payload


def analyze(payload: dict, limit_per_target: int) -> tuple[dict[str, list[RankedCandidate]], list[str]]:
    ranked: dict[str, list[RankedCandidate]] = {target_id: [] for target_id in TARGETS}
    excluded: list[str] = []
    for record in payload["files"]:
        absolute_path = str(record.get("absolute_path", ""))
        if contains_forbidden(absolute_path):
            excluded.append(absolute_path)
            continue
        for target_id, target in TARGETS.items():
            score, reasons, placeholder_risk = score_record(record, target)
            if score < 20:
                continue
            ranked[target_id].append(RankedCandidate(
                target_id=target_id,
                target_label=target["label"],
                target_kind=target["kind"],
                absolute_path=absolute_path,
                relative_path=str(record.get("relative_path", "")),
                category=str(record.get("category", "")),
                media_kind=str(record.get("media_kind", "")),
                size_bytes=int(record.get("size_bytes", 0)),
                modified_utc=str(record.get("modified_utc", "")),
                sha256=record.get("sha256"),
                score=score,
                reasons=reasons,
                placeholder_risk=placeholder_risk,
            ))
    for target_id, items in ranked.items():
        items.sort(key=lambda item: (-item.score, item.placeholder_risk, -item.size_bytes, item.absolute_path.lower()))
        ranked[target_id] = items[:limit_per_target]
    return ranked, excluded


def write_outputs(inventory_path: Path, output_dir: Path, payload: dict, ranked: dict[str, list[RankedCandidate]], excluded: list[str]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    flat = [candidate for items in ranked.values() for candidate in items]
    result = {
        "schemaVersion": 1,
        "analyzerVersion": ANALYZER_VERSION,
        "generatedAt": utc_now(),
        "sourceInventory": str(inventory_path.resolve()),
        "automaticCanonApproval": False,
        "decisionRule": "Ranking uses path metadata only. Visual human review is mandatory before any masterReference field may be set.",
        "summary": {
            "targets": len(TARGETS),
            "rankedCandidates": len(flat),
            "targetsWithCandidates": sum(bool(items) for items in ranked.values()),
            "forbiddenPathsExcluded": len(excluded),
            "byTarget": {target_id: len(items) for target_id, items in ranked.items()},
        },
        "targets": {
            target_id: {
                "label": TARGETS[target_id]["label"],
                "kind": TARGETS[target_id]["kind"],
                "decision": "REVIEW_REQUIRED",
                "candidates": [asdict(candidate) for candidate in items],
            }
            for target_id, items in ranked.items()
        },
        "forbiddenPathsExcluded": excluded,
    }
    (output_dir / "visual-candidate-shortlist.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    with (output_dir / "visual-candidate-review.csv").open("w", newline="", encoding="utf-8") as handle:
        fields = [
            "target_id", "target_label", "target_kind", "score", "decision", "placeholder_risk",
            "absolute_path", "relative_path", "category", "media_kind", "size_bytes", "modified_utc", "sha256", "reasons",
        ]
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for candidate in flat:
            row = asdict(candidate)
            row["reasons"] = " | ".join(candidate.reasons)
            writer.writerow({field: row[field] for field in fields})

    lines = [
        "# Visual Candidate Review",
        "",
        f"- Generated: `{result['generatedAt']}`",
        f"- Inventory: `{result['sourceInventory']}`",
        "- Automatic Canon approval: **NO**",
        "- Rule: filenames and paths only prioritize review; they cannot prove visual consistency.",
        "",
    ]
    for target_id, target in TARGETS.items():
        items = ranked[target_id]
        lines.extend([f"## {target['label']}", ""])
        if not items:
            lines.append("- No candidate found. Do not generate a replacement until the remaining backups and roots are checked.")
        for candidate in items[:10]:
            risk = " · PLACEHOLDER RISK" if candidate.placeholder_risk else ""
            lines.append(f"- score **{candidate.score}**{risk} · `{candidate.absolute_path}`")
            lines.append(f"  - {', '.join(candidate.reasons)}")
        lines.extend(["", "Decision: `REVIEW_REQUIRED`", ""])
    if excluded:
        lines.extend(["## Excluded unrelated paths", ""])
        lines.extend(f"- `{path}`" for path in excluded)
        lines.append("")
    (output_dir / "visual-candidate-review.md").write_text("\n".join(lines), encoding="utf-8")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Rank Comic Factory recovery candidates without approving canon")
    parser.add_argument("--inventory", required=True, help="asset-recovery-inventory.json")
    parser.add_argument("--output-dir", help="Default: sibling directory named analysis")
    parser.add_argument("--limit-per-target", type=int, default=25)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        inventory_path = Path(args.inventory).expanduser().resolve()
        if not inventory_path.is_file():
            raise ValueError(f"Inventory file does not exist: {inventory_path}")
        output_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else inventory_path.parent / "analysis"
        if contains_forbidden(str(inventory_path)) or contains_forbidden(str(output_dir)):
            raise ValueError("Forbidden unrelated project path.")
        payload = load_inventory(inventory_path)
        ranked, excluded = analyze(payload, max(1, args.limit_per_target))
        write_outputs(inventory_path, output_dir, payload, ranked, excluded)
        print(json.dumps({
            "status": "ok",
            "analyzerVersion": ANALYZER_VERSION,
            "targets": len(TARGETS),
            "targetsWithCandidates": sum(bool(items) for items in ranked.values()),
            "rankedCandidates": sum(len(items) for items in ranked.values()),
            "outputDirectory": str(output_dir),
            "automaticCanonApproval": False,
        }, ensure_ascii=False))
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
