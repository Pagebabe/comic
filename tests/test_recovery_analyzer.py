from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "analyze_recovery_inventory.py"


class RecoveryAnalyzerTest(unittest.TestCase):
    def make_inventory(self, path: Path) -> None:
        payload = {
            "schemaVersion": 1,
            "readOnlySourceScan": True,
            "files": [
                {
                    "absolute_path": "/comic/outputs/character_sheets/ricco_turnaround.png",
                    "relative_path": "outputs/character_sheets/ricco_turnaround.png",
                    "extension": ".png",
                    "size_bytes": 1200,
                    "modified_utc": "2026-07-01T12:00:00Z",
                    "sha256": "a" * 64,
                    "category": "CHARACTER_SHEET",
                    "media_kind": "image",
                    "likely_candidate": True,
                },
                {
                    "absolute_path": "/comic/outputs/character_sheets/falk_keepcup_front.png",
                    "relative_path": "outputs/character_sheets/falk_keepcup_front.png",
                    "extension": ".png",
                    "size_bytes": 1100,
                    "modified_utc": "2026-07-01T12:00:00Z",
                    "sha256": "b" * 64,
                    "category": "CHARACTER_SHEET",
                    "media_kind": "image",
                    "likely_candidate": True,
                },
                {
                    "absolute_path": "/comic/public/generated/treppenhaus_background.webp",
                    "relative_path": "public/generated/treppenhaus_background.webp",
                    "extension": ".webp",
                    "size_bytes": 900,
                    "modified_utc": "2026-07-01T12:00:00Z",
                    "sha256": "c" * 64,
                    "category": "LOCATION_SHEET",
                    "media_kind": "image",
                    "likely_candidate": True,
                },
                {
                    "absolute_path": "/comic/assets/characters/ricco.svg",
                    "relative_path": "assets/characters/ricco.svg",
                    "extension": ".svg",
                    "size_bytes": 200,
                    "modified_utc": "2026-07-01T12:00:00Z",
                    "sha256": "d" * 64,
                    "category": "CHARACTER_SHEET",
                    "media_kind": "image",
                    "likely_candidate": True,
                },
                {
                    "absolute_path": "/comic/chris-fact-radar-studio/ricco.png",
                    "relative_path": "chris-fact-radar-studio/ricco.png",
                    "extension": ".png",
                    "size_bytes": 999,
                    "modified_utc": "2026-07-01T12:00:00Z",
                    "sha256": "e" * 64,
                    "category": "CHARACTER_SHEET",
                    "media_kind": "image",
                    "likely_candidate": True,
                },
            ],
        }
        path.write_text(json.dumps(payload), encoding="utf-8")

    def test_analyzer_ranks_candidates_without_approving_canon(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            temp_path = Path(temp)
            inventory = temp_path / "asset-recovery-inventory.json"
            output = temp_path / "analysis"
            self.make_inventory(inventory)
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--inventory", str(inventory), "--output-dir", str(output)],
                check=False,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads((output / "visual-candidate-shortlist.json").read_text(encoding="utf-8"))
            self.assertFalse(payload["automaticCanonApproval"])
            self.assertGreater(payload["summary"]["targetsWithCandidates"], 0)
            self.assertEqual(payload["summary"]["forbiddenPathsExcluded"], 1)

            ricco = payload["targets"]["character_ricco"]["candidates"]
            self.assertEqual(ricco[0]["absolute_path"], "/comic/outputs/character_sheets/ricco_turnaround.png")
            self.assertEqual(ricco[0]["decision"], "REVIEW_REQUIRED")
            self.assertFalse(any(item["absolute_path"].endswith("assets/characters/ricco.svg") for item in ricco))

            basti = payload["targets"]["character_basti"]["candidates"]
            self.assertEqual(basti[0]["absolute_path"], "/comic/outputs/character_sheets/falk_keepcup_front.png")
            hallway = payload["targets"]["location_hallway"]["candidates"]
            self.assertEqual(hallway[0]["absolute_path"], "/comic/public/generated/treppenhaus_background.webp")

    def test_non_read_only_inventory_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            temp_path = Path(temp)
            inventory = temp_path / "bad.json"
            inventory.write_text(json.dumps({"readOnlySourceScan": False, "files": []}), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--inventory", str(inventory)],
                check=False,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("read-only source scan", result.stderr)


if __name__ == "__main__":
    unittest.main()
