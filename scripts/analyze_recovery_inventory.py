#!/usr/bin/env python3
"""Strictly rank Comic Factory visual recovery candidates.

The analyzer reads asset-recovery-inventory.json and writes review-only outputs.
It never edits source assets and never approves canon. Visual candidates must
contain target-specific evidence in their path; broad category labels alone are
not enough.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

ANALYZER_VERSION = "1.1.0"

FORBIDDEN_TOKENS = (
    "chris-fact-radar", "chris_fact_radar", "chris fact radar",
    "100k_operator_os", "firmen-os", "firmen_os",
)

PLACEHOLDER_TOKENS = (
    "m1-life-sign", "technical-proof", "technikplatzhalter",
    "/assets/characters/ricco.svg", "/assets/characters/basti.svg",
    "/assets/characters/jule.svg", "/assets/characters/don-miau.svg",
)

NON_PROJECT_NOISE_TOKENS = (
    "/test-results/", "/playwright-report/", "/node_modules/", "/dist/",
    "/promax_apktool/", "/insta dump/", "/telegram desktop/chatexport_",
    "/pictures/pixelcybertheme/", "/pictures/screenshots-ai/",
    "enhanced chris", "/christianwolf/",
)

TARGETS = {
    "character_ricco": {
        "kind": "character", "label": "Ricco",
        "aliases": ("ricco", "rico", "bassmann", "rgbrico", "tupperware", "tupper", "rucksack"),
    },
    "character_basti": {
        "kind": "character", "label": "Basti Prenzl",
        "aliases": ("basti", "prenzl", "falk", "reuter", "rgbfalk", "keepcup", "schluessel", "schlüssel"),
    },
    "character_jule": {
        "kind": "character", "label": "Jule",
        "aliases": ("jule", "plenum", "aktivistin", "klebeband"),
    },
    "character_don_miau": {
        "kind": "character", "label": "Don Miau",
        "aliases": ("don-miau", "don_miau", "don miau", "kralle", "rgbkralle", "bosskatze"),
    },
    "location_house_facade": {
        "kind": "location", "label": "Haus Nr. 13 / Hausfassade",
        "aliases": ("hausfassade", "fassade", "house-front", "nr-13", "nr13", "nebenwirkung"),
    },
    "location_ricco_room": {
        "kind": "location", "label": "Riccos Zimmer",
        "aliases": ("ricco-zimmer", "rico-zimmer", "riccos-zimmer", "zimmer", "bedroom", "matratze"),
    },
    "location_hallway": {
        "kind": "location", "label": "Flur / Treppenhaus",
        "aliases": ("flur", "treppenhaus", "stairwell", "hallway", "corridor"),
    },
    "location_kitchen": {
        "kind": "location", "label": "Gemeinschaftsküche",
        "aliases": ("gemeinschaftskueche", "gemeinschaftsküche", "kueche", "küche", "kitchen", "kuehlschrank", "kühlschrank"),
    },
}

VISUAL_MEDIA_KINDS = {"image", "video", "model"}


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
    matched_aliases: list[str]
    reasons: list[str]
    placeholder_risk: bool
    decision: str = "REVIEW_REQUIRED"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalized(value: str) -> str:
    return value.lower().replace("\\", "/").replace("_", "-")


def contains_any(value: str, tokens: tuple[str, ...]) -> bool:
    text = normalized(value)
    return any(normalized(token) in text for token in tokens)


def token_match(text: str, alias: str) -> bool:
    alias_text = normalized(alias)
    if len(alias_text) <= 3:
        return re.search(rf"(^|[^a-z0-9]){re.escape(alias_text)}([^a-z0-9]|$)", text) is not None
    return alias_text in text


def score_record(record: dict, target: dict) -> tuple[int, list[str], list[str], bool]:
    path_text = normalized(f"{record.get('absolute_path', '')} {record.get('relative_path', '')}")
    matched_aliases = [alias for alias in target["aliases"] if token_match(path_text, alias)]
    placeholder_risk = contains_any(path_text, PLACEHOLDER_TOKENS)
    if not matched_aliases:
        return -999, [], [], placeholder_risk

    score = min(70, 40 + (len(matched_aliases) - 1) * 10)
    reasons = [f"target aliases: {', '.join(matched_aliases[:5])}"]

    expected_category = "CHARACTER_SHEET" if target["kind"] == "character" else "LOCATION_SHEET"
    category = str(record.get("category", ""))
    media_kind = str(record.get("media_kind", ""))

    if category == expected_category:
        score += 20
        reasons.append(f"category: {expected_category}")
    elif category == "PANEL_OR_KEYFRAME":
        score += 8
        reasons.append("panel/keyframe context")

    if media_kind == "image":
        score += 20
        reasons.append("image asset")
    elif media_kind == "video":
        score += 6
        reasons.append("video reference")
    elif media_kind == "model" and target["kind"] == "character":
        score += 10
        reasons.append("character model candidate")

    extension = str(record.get("extension", "")).lower()
    if extension in {".psd", ".kra"}:
        score += 8
        reasons.append("editable source")
    elif extension in {".png", ".webp"}:
        score += 4
        reasons.append("reference-friendly image")

    if record.get("likely_candidate"):
        score += 4
        reasons.append("scanner candidate")

    return score, matched_aliases, reasons, placeholder_risk


def load_inventory(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("readOnlySourceScan") is not True:
        raise ValueError("Inventory is not marked as a read-only source scan.")
    if not isinstance(payload.get("files"), list):
        raise ValueError("Inventory files list is missing.")
    return payload


def analyze(payload: dict, limit_per_target: int):
    ranked = {target_id: [] for target_id in TARGETS}
    excluded = []
    rejected = Counter()

    for record in payload["files"]:
        absolute_path = str(record.get("absolute_path", ""))
        path_text = normalized(absolute_path)

        if contains_any(path_text, FORBIDDEN_TOKENS):
            excluded.append(absolute_path)
            rejected["forbidden_project"] += 1
            continue
        if contains_any(path_text, NON_PROJECT_NOISE_TOKENS):
            rejected["known_noise_path"] += 1
            continue
        if contains_any(path_text, PLACEHOLDER_TOKENS):
            rejected["technical_placeholder"] += 1
            continue
        if str(record.get("media_kind", "")) not in VISUAL_MEDIA_KINDS:
            rejected["non_visual_record"] += 1
            continue

        any_alias = False
        for target_id, target in TARGETS.items():
            score, matched_aliases, reasons, placeholder_risk = score_record(record, target)
            if not matched_aliases:
                continue
            any_alias = True
            if score < 40:
                rejected["below_threshold"] += 1
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
                matched_aliases=matched_aliases,
                reasons=reasons,
                placeholder_risk=placeholder_risk,
            ))
        if not any_alias:
            rejected["no_target_evidence"] += 1

    for target_id, items in ranked.items():
        items.sort(key=lambda item: (-item.score, -item.size_bytes, item.absolute_path.lower()))
        seen_hashes = set()
        unique = []
        for item in items:
            key = item.sha256 or item.absolute_path
            if key in seen_hashes:
                continue
            seen_hashes.add(key)
            unique.append(item)
        ranked[target_id] = unique[:limit_per_target]

    return ranked, excluded, dict(sorted(rejected.items()))


def write_outputs(inventory_path: Path, output_dir: Path, ranked, excluded, rejected):
    output_dir.mkdir(parents=True, exist_ok=True)
    flat = [candidate for items in ranked.values() for candidate in items]
    result = {
        "schemaVersion": 2,
        "analyzerVersion": ANALYZER_VERSION,
        "generatedAt": utc_now(),
        "sourceInventory": str(inventory_path.resolve()),
        "automaticCanonApproval": False,
        "decisionRule": "Only target-specific visual path evidence is ranked. Category labels alone never create candidates. Human visual review is mandatory.",
        "summary": {
            "targets": len(TARGETS),
            "rankedCandidates": len(flat),
            "targetsWithCandidates": sum(bool(items) for items in ranked.values()),
            "forbiddenPathsExcluded": len(excluded),
            "rejected": rejected,
            "byTarget": {target_id: len(items) for target_id, items in ranked.items()},
        },
        "targets": {
            target_id: {
                "label": TARGETS[target_id]["label"],
                "kind": TARGETS[target_id]["kind"],
                "decision": "REVIEW_REQUIRED" if items else "NO_TRUSTWORTHY_CANDIDATE",
                "candidates": [asdict(candidate) for candidate in items],
            }
            for target_id, items in ranked.items()
        },
        "forbiddenPathsExcluded": excluded,
    }
    (output_dir / "visual-candidate-shortlist.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    fields = [
        "target_id", "target_label", "target_kind", "score", "decision",
        "placeholder_risk", "matched_aliases", "absolute_path", "relative_path",
        "category", "media_kind", "size_bytes", "modified_utc", "sha256", "reasons",
    ]
    with (output_dir / "visual-candidate-review.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for candidate in flat:
            row = asdict(candidate)
            row["matched_aliases"] = " | ".join(candidate.matched_aliases)
            row["reasons"] = " | ".join(candidate.reasons)
            writer.writerow({field: row[field] for field in fields})

    lines = [
        "# Strict Visual Candidate Review", "",
        f"- Generated: `{result['generatedAt']}`",
        f"- Inventory: `{result['sourceInventory']}`",
        "- Automatic Canon approval: **NO**",
        "- Rule: a visual file needs target-specific path evidence. Generic downloads, documents, test output and technical placeholders are rejected.",
        f"- Trustworthy ranked candidates: **{len(flat)}**", "",
    ]
    for target_id, target in TARGETS.items():
        items = ranked[target_id]
        lines.extend([f"## {target['label']}", ""])
        if not items:
            lines.append("- `NO_TRUSTWORTHY_CANDIDATE`")
        for candidate in items[:10]:
            lines.append(f"- score **{candidate.score}** · `{candidate.absolute_path}`")
            lines.append(f"  - {', '.join(candidate.reasons)}")
        lines.extend(["", f"Decision: `{'REVIEW_REQUIRED' if items else 'NO_TRUSTWORTHY_CANDIDATE'}`", ""])
    lines.extend(["## Rejected records", ""])
    for reason, count in rejected.items():
        lines.append(f"- `{reason}`: {count}")
    (output_dir / "visual-candidate-review.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Strictly rank Comic Factory visual candidates")
    parser.add_argument("--inventory", required=True)
    parser.add_argument("--output-dir")
    parser.add_argument("--limit-per-target", type=int, default=25)
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
        ranked, excluded, rejected = analyze(payload, max(1, args.limit_per_target))
        write_outputs(inventory_path, output_dir, ranked, excluded, rejected)
        print(json.dumps({
            "status": "ok",
            "analyzerVersion": ANALYZER_VERSION,
            "targets": len(TARGETS),
            "targetsWithCandidates": sum(bool(items) for items in ranked.values()),
            "rankedCandidates": sum(len(items) for items in ranked.values()),
            "automaticCanonApproval": False,
            "outputDirectory": str(output_dir),
        }, ensure_ascii=False))
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
