from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "recover_assets.py"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class AssetRecoveryScannerTest(unittest.TestCase):
    def test_scan_is_read_only_and_excludes_unrelated_projects(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "comic"
            report = root / "_recovery_reports"
            (root / "outputs" / "character_sheets").mkdir(parents=True)
            (root / "public" / "generated").mkdir(parents=True)
            forbidden = root / "chris-fact-radar-studio"
            forbidden.mkdir(parents=True)

            sheet = root / "outputs" / "character_sheets" / "ricco_turnaround.png"
            duplicate = root / "public" / "generated" / "ricco_turnaround_copy.png"
            manifest = root / "public" / "generated" / "review_manifest.json"
            secret = forbidden / "secret_character.png"
            sheet.write_bytes(b"same-image")
            duplicate.write_bytes(b"same-image")
            manifest.write_text('{"selected":"ricco"}', encoding="utf-8")
            secret.write_bytes(b"must-not-scan")

            before = {path: digest(path) for path in (sheet, duplicate, manifest, secret)}
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--root", str(root), "--report-dir", str(report)],
                check=False,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads((report / "asset-recovery-inventory.json").read_text(encoding="utf-8"))
            paths = {entry["absolute_path"] for entry in payload["files"]}
            self.assertIn(str(sheet.resolve()), paths)
            self.assertIn(str(duplicate.resolve()), paths)
            self.assertNotIn(str(secret.resolve()), paths)
            self.assertEqual(payload["summary"]["duplicateGroups"], 1)
            self.assertTrue(payload["readOnlySourceScan"])
            after = {path: digest(path) for path in (sheet, duplicate, manifest, secret)}
            self.assertEqual(before, after)

    def test_forbidden_root_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "chris-fact-radar-studio"
            root.mkdir()
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--root", str(root)],
                check=False,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("Forbidden unrelated project root", result.stderr)


if __name__ == "__main__":
    unittest.main()
