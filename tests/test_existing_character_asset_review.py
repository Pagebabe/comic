from __future__ import annotations

import base64
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build_existing_character_asset_review.py"
PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXcAAAAASUVORK5CYII="
)


class ExistingCharacterAssetReviewTest(unittest.TestCase):
    def write_png(self, path: Path, payload: bytes = PNG_1X1) -> str:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload)
        return hashlib.sha256(payload).hexdigest()

    def test_exact_target_builds_review_only_evidence_package(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            downloads = root / "Downloads"
            pictures = root / "Pictures"
            output = root / "review-output"

            target = downloads / "Ricco - Charakterdesign Übersicht.png"
            target_hash = self.write_png(target)
            duplicate = pictures / "ricco_turnaround_copy.png"
            self.write_png(duplicate)
            self.write_png(pictures / "basti_lora_dataset" / "basti_001.png", PNG_1X1 + b"basti")
            self.write_png(pictures / "irrelevant-landscape.png", PNG_1X1 + b"noise")

            before = target.read_bytes()
            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--root",
                    str(downloads),
                    "--root",
                    str(pictures),
                    "--output-dir",
                    str(output),
                ],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            summary = json.loads(result.stdout)
            self.assertEqual(summary["status"], "READY_FOR_HUMAN_REVIEW")
            self.assertFalse(summary["sourceFilesModified"])
            self.assertEqual(summary["automaticMasterApprovals"], 0)
            self.assertEqual(target.read_bytes(), before)

            source_reference = json.loads((output / "source-inventory-reference.json").read_text(encoding="utf-8"))
            self.assertTrue(source_reference["readOnlySourceScan"])
            self.assertFalse(source_reference["sourceFilesModified"])
            self.assertEqual(source_reference["sourceFilesDeleted"], 0)
            self.assertEqual(source_reference["sourceFilesMoved"], 0)

            ricco = json.loads((output / "ricco-candidate-index.json").read_text(encoding="utf-8"))
            self.assertEqual(ricco["status"], "READY_FOR_HUMAN_REVIEW")
            self.assertEqual(ricco["exactTargetMatches"], 1)
            self.assertFalse(ricco["automaticMasterApproval"])
            exact = [item for item in ricco["candidates"] if item["exactTargetName"]]
            self.assertEqual(len(exact), 1)
            self.assertEqual(exact[0]["sha256"], target_hash)
            self.assertEqual(exact[0]["pixelWidth"], 1)
            self.assertEqual(exact[0]["pixelHeight"], 1)
            self.assertEqual(exact[0]["assetClass"], "RICCO_CHARACTER_SHEET")
            self.assertEqual(exact[0]["reviewStatus"], "HUMAN_REVIEW_REQUIRED")

            families = json.loads((output / "character-family-index.json").read_text(encoding="utf-8"))
            self.assertIn("RICCO", families["families"])
            self.assertIn("BASTI", families["families"])
            self.assertFalse(families["mixedDatasetsAutomaticallyMerged"])

            duplicates = json.loads((output / "duplicate-map.json").read_text(encoding="utf-8"))
            self.assertEqual(len(duplicates["duplicateGroups"]), 1)
            self.assertEqual(duplicates["duplicateGroups"][0]["sha256"], target_hash)
            self.assertEqual(duplicates["duplicateGroups"][0]["count"], 2)

            lora = json.loads((output / "lora-dataset-image-index.json").read_text(encoding="utf-8"))
            self.assertEqual(len(lora["images"]), 1)
            self.assertEqual(lora["images"][0]["family"], "BASTI")
            self.assertFalse(lora["automaticTrainingAuthorization"])

            self.assertTrue((output / "ricco-contact-sheet.html").is_file())
            self.assertTrue((output / "hashes.sha256").is_file())
            self.assertTrue((output / "review-images" / target.name).is_file())
            self.assertFalse(any("irrelevant-landscape" in line for line in (output / "hashes.sha256").read_text(encoding="utf-8").splitlines()))

    def test_missing_exact_target_fails_closed_but_writes_inventory(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            assets = root / "assets"
            output = root / "review-output"
            self.write_png(assets / "ricco_reference.png")

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--root",
                    str(assets),
                    "--output-dir",
                    str(output),
                    "--no-copy-images",
                ],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 3, result.stderr)
            summary = json.loads(result.stdout)
            self.assertEqual(summary["status"], "BLOCKED_TARGET_NOT_FOUND")
            candidate_index = json.loads((output / "ricco-candidate-index.json").read_text(encoding="utf-8"))
            self.assertEqual(candidate_index["exactTargetMatches"], 0)
            self.assertEqual(candidate_index["decision"], "HUMAN_REVIEW_REQUIRED")
            self.assertFalse(candidate_index["automaticMasterApproval"])

    def test_existing_output_directory_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            assets = root / "assets"
            output = root / "review-output"
            assets.mkdir()
            output.mkdir()

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--root",
                    str(assets),
                    "--output-dir",
                    str(output),
                ],
                check=False,
                text=True,
                capture_output=True,
            )

            self.assertEqual(result.returncode, 2)
            self.assertIn("already exists", result.stderr)


if __name__ == "__main__":
    unittest.main()
