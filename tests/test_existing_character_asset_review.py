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
    def write_file(self, path: Path, payload: bytes) -> str:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload)
        return hashlib.sha256(payload).hexdigest()

    def write_png(self, path: Path, payload: bytes = PNG_1X1) -> str:
        return self.write_file(path, payload)

    def run_builder(self, roots: list[Path], output: Path, *extra: str) -> subprocess.CompletedProcess[str]:
        command = [sys.executable, str(SCRIPT)]
        for root in roots:
            command.extend(["--root", str(root)])
        command.extend(["--output-dir", str(output), *extra])
        return subprocess.run(command, check=False, text=True, capture_output=True)

    def test_exact_target_builds_review_only_evidence_package(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            downloads = root / "Downloads"
            pictures = root / "Pictures"
            output = root / "review-output"

            target = downloads / "Ricco - Charakterdesign Übersicht.png"
            target_hash = self.write_png(target)
            target_caption_hash = self.write_file(target.with_suffix(".txt"), b"ricco caption")
            target_json_hash = self.write_file(target.with_suffix(".json"), b'{"source":"file-library"}')

            duplicate = pictures / "ricco_turnaround_copy.png"
            self.write_png(duplicate)
            self.write_png(
                pictures / "Ricco_Charakterdesign_Übersicht.png",
                PNG_1X1 + b"renamed-not-original",
            )
            self.write_png(
                pictures / "ricco - Charakterdesign Übersicht.png",
                PNG_1X1 + b"case-changed-not-original",
            )
            basti_image = pictures / "basti_lora_dataset" / "basti_001.png"
            self.write_png(basti_image, PNG_1X1 + b"basti")
            basti_caption_hash = self.write_file(basti_image.with_suffix(".txt"), b"basti caption")
            self.write_png(pictures / "irrelevant-landscape.png", PNG_1X1 + b"noise")

            before = target.read_bytes()
            result = self.run_builder([downloads, pictures], output)

            self.assertEqual(result.returncode, 0, result.stderr)
            summary = json.loads(result.stdout)
            self.assertEqual(summary["status"], "READY_FOR_HUMAN_REVIEW")
            self.assertEqual(summary["exactTargetMatches"], 1)
            self.assertGreaterEqual(summary["sidecarsIndexed"], 3)
            self.assertFalse(summary["sourceFilesModified"])
            self.assertEqual(summary["automaticMasterApprovals"], 0)
            self.assertEqual(target.read_bytes(), before)

            source_reference = json.loads((output / "source-inventory-reference.json").read_text(encoding="utf-8"))
            self.assertTrue(source_reference["readOnlySourceScan"])
            self.assertFalse(source_reference["sourceFilesModified"])
            self.assertEqual(source_reference["sourceFilesDeleted"], 0)
            self.assertEqual(source_reference["sourceFilesMoved"], 0)
            self.assertEqual(source_reference["sourceFilesExecuted"], 0)
            self.assertGreaterEqual(source_reference["sidecarFilesIndexed"], 3)

            ricco = json.loads((output / "ricco-candidate-index.json").read_text(encoding="utf-8"))
            self.assertEqual(ricco["status"], "READY_FOR_HUMAN_REVIEW")
            self.assertEqual(ricco["exactTargetMatches"], 1)
            self.assertEqual(ricco["exactTargetPaths"], [str(target.resolve())])
            self.assertFalse(ricco["automaticMasterApproval"])
            exact = [item for item in ricco["candidates"] if item["exactTargetName"]]
            self.assertEqual(len(exact), 1)
            self.assertEqual(exact[0]["fileName"], target.name)
            self.assertEqual(exact[0]["sha256"], target_hash)
            self.assertEqual(exact[0]["reviewCopySha256"], target_hash)
            self.assertEqual(exact[0]["pixelWidth"], 1)
            self.assertEqual(exact[0]["pixelHeight"], 1)
            self.assertEqual(exact[0]["dimensionStatus"], "KNOWN")
            self.assertEqual(exact[0]["assetClass"], "RICCO_CHARACTER_SHEET")
            self.assertEqual(exact[0]["reviewStatus"], "HUMAN_REVIEW_REQUIRED")

            exact_sidecars = {item["extension"]: item for item in exact[0]["sidecars"]}
            self.assertEqual(exact_sidecars[".txt"]["sha256"], target_caption_hash)
            self.assertEqual(exact_sidecars[".txt"]["reviewCopySha256"], target_caption_hash)
            self.assertEqual(exact_sidecars[".json"]["sha256"], target_json_hash)
            self.assertEqual(exact_sidecars[".json"]["reviewCopySha256"], target_json_hash)
            self.assertFalse(exact_sidecars[".txt"]["sourceExecuted"])
            self.assertFalse(exact_sidecars[".txt"]["sourceModified"])

            not_exact_names = {
                item["fileName"]
                for item in ricco["candidates"]
                if not item["exactTargetName"]
            }
            self.assertIn("Ricco_Charakterdesign_Übersicht.png", not_exact_names)
            self.assertIn("ricco - Charakterdesign Übersicht.png", not_exact_names)

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
            sidecar_hashes = {item["sha256"] for item in lora["sidecars"]}
            self.assertIn(basti_caption_hash, sidecar_hashes)

            self.assertTrue((output / "ricco-contact-sheet.html").is_file())
            self.assertTrue((output / "hashes.sha256").is_file())
            copied_target = output / "review-images" / target.name
            self.assertTrue(copied_target.is_file())
            self.assertEqual(hashlib.sha256(copied_target.read_bytes()).hexdigest(), target_hash)
            self.assertTrue((output / "review-sidecars" / target.with_suffix(".txt").name).is_file())

            hash_manifest = (output / "hashes.sha256").read_text(encoding="utf-8")
            self.assertIn(target_hash, hash_manifest)
            self.assertIn(target_caption_hash, hash_manifest)
            self.assertIn(target_json_hash, hash_manifest)
            self.assertIn(basti_caption_hash, hash_manifest)
            self.assertNotIn("irrelevant-landscape", hash_manifest)

    def test_missing_exact_target_fails_closed_but_writes_inventory(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            assets = root / "assets"
            output = root / "review-output"
            self.write_png(assets / "ricco_reference.png")
            self.write_png(assets / "Ricco_Charakterdesign_Übersicht.png")

            result = self.run_builder([assets], output, "--no-copy-images")

            self.assertEqual(result.returncode, 3, result.stderr)
            summary = json.loads(result.stdout)
            self.assertEqual(summary["status"], "BLOCKED_TARGET_NOT_FOUND")
            candidate_index = json.loads((output / "ricco-candidate-index.json").read_text(encoding="utf-8"))
            self.assertEqual(candidate_index["exactTargetMatches"], 0)
            self.assertEqual(candidate_index["exactTargetPaths"], [])
            self.assertEqual(candidate_index["decision"], "HUMAN_REVIEW_REQUIRED")
            self.assertFalse(candidate_index["automaticMasterApproval"])

    def test_multiple_exact_targets_fail_closed(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            first = root / "Downloads"
            second = root / "Pictures"
            output = root / "review-output"
            target_name = "Ricco - Charakterdesign Übersicht.png"
            first_path = first / target_name
            second_path = second / target_name
            self.write_png(first_path, PNG_1X1 + b"first")
            self.write_png(second_path, PNG_1X1 + b"second")

            result = self.run_builder([first, second], output, "--no-copy-images")

            self.assertEqual(result.returncode, 4, result.stderr)
            summary = json.loads(result.stdout)
            self.assertEqual(summary["status"], "BLOCKED_MULTIPLE_EXACT_TARGETS")
            self.assertEqual(summary["exactTargetMatches"], 2)
            candidate_index = json.loads((output / "ricco-candidate-index.json").read_text(encoding="utf-8"))
            self.assertCountEqual(
                candidate_index["exactTargetPaths"],
                [str(first_path.resolve()), str(second_path.resolve())],
            )
            self.assertFalse(candidate_index["automaticMasterApproval"])

    def test_overlapping_roots_do_not_duplicate_same_source_path(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            nested = root / "Downloads"
            output = root / "review-output"
            target = nested / "Ricco - Charakterdesign Übersicht.png"
            self.write_png(target)

            result = self.run_builder([root, nested], output, "--no-copy-images")

            self.assertEqual(result.returncode, 0, result.stderr)
            summary = json.loads(result.stdout)
            self.assertEqual(summary["exactTargetMatches"], 1)
            self.assertEqual(summary["filesIndexed"], 1)

    def test_existing_output_directory_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            assets = root / "assets"
            output = root / "review-output"
            assets.mkdir()
            output.mkdir()

            result = self.run_builder([assets], output)

            self.assertEqual(result.returncode, 2)
            self.assertIn("already exists", result.stderr)


if __name__ == "__main__":
    unittest.main()
