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
PNG_1X1 = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXcAAAAASUVORK5CYII=")


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
            self.write_png(pictures / "ricco_turnaround_copy.png")
            self.write_png(pictures / "Ricco_Charakterdesign_Übersicht.png", PNG_1X1 + b"renamed")
            self.write_png(pictures / "ricco - Charakterdesign Übersicht.png", PNG_1X1 + b"case")
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
            self.assertFalse(summary["sourceFilesModified"])
            self.assertEqual(target.read_bytes(), before)
            self.assertTrue((output / "PACKAGE_COMPLETE.json").is_file())
            self.assertFalse((output / "PACKAGE_INCOMPLETE.json").exists())

            ricco = json.loads((output / "ricco-candidate-index.json").read_text())
            exact = [item for item in ricco["candidates"] if item["exactTargetName"]]
            self.assertEqual(len(exact), 1)
            self.assertEqual(exact[0]["sha256"], target_hash)
            self.assertEqual(exact[0]["reviewCopySha256"], target_hash)
            self.assertEqual(exact[0]["pixelWidth"], 1)
            self.assertEqual(exact[0]["pixelHeight"], 1)
            exact_sidecars = {item["extension"]: item for item in exact[0]["sidecars"]}
            self.assertEqual(exact_sidecars[".txt"]["sha256"], target_caption_hash)
            self.assertEqual(exact_sidecars[".json"]["sha256"], target_json_hash)

            copies = [item["reviewCopy"] for item in ricco["candidates"]]
            self.assertEqual(len({Path(path).name.casefold() for path in copies}), len(copies))

            families = json.loads((output / "character-family-index.json").read_text())
            self.assertIn("RICCO", families["families"])
            self.assertIn("BASTI", families["families"])
            self.assertFalse(families["mixedDatasetsAutomaticallyMerged"])

            duplicates = json.loads((output / "duplicate-map.json").read_text())
            self.assertEqual(len(duplicates["duplicateGroups"]), 1)
            self.assertEqual(duplicates["duplicateGroups"][0]["sha256"], target_hash)

            lora = json.loads((output / "lora-dataset-image-index.json").read_text())
            self.assertEqual(len(lora["images"]), 1)
            self.assertEqual(lora["images"][0]["family"], "BASTI")
            self.assertEqual({item["sha256"] for item in lora["sidecars"]}, {basti_caption_hash})
            self.assertNotIn(target_caption_hash, {item["sha256"] for item in lora["sidecars"]})

            manifest = (output / "hashes.sha256").read_text()
            for digest in (target_hash, target_caption_hash, target_json_hash, basti_caption_hash):
                self.assertIn(digest, manifest)
            self.assertNotIn("irrelevant-landscape", manifest)

    def test_root_name_does_not_contaminate_character_family(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "ricco-review-export"
            output = Path(temp) / "out"
            self.write_png(root / "basti_lora_dataset" / "basti_001.png")
            result = self.run_builder([root], output, "--no-copy-images")
            self.assertEqual(result.returncode, 3, result.stderr)
            families = json.loads((output / "character-family-index.json").read_text())["families"]
            self.assertIn("BASTI", families)
            self.assertNotIn("RICCO", families)

    def test_multi_family_path_is_not_silently_assigned(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "assets"
            output = Path(temp) / "out"
            self.write_png(root / "ricco_basti" / "turnaround.png")
            result = self.run_builder([root], output, "--no-copy-images")
            self.assertEqual(result.returncode, 3, result.stderr)
            families = json.loads((output / "character-family-index.json").read_text())["families"]
            self.assertIn("UNRESOLVED_MULTI_FAMILY", families)
            self.assertCountEqual(families["UNRESOLVED_MULTI_FAMILY"][0]["familyMatches"], ["RICCO", "BASTI"])

    def test_missing_exact_target_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "assets"
            output = Path(temp) / "out"
            self.write_png(root / "ricco_reference.png")
            self.write_png(root / "Ricco_Charakterdesign_Übersicht.png")
            result = self.run_builder([root], output, "--no-copy-images")
            self.assertEqual(result.returncode, 3, result.stderr)
            self.assertEqual(json.loads(result.stdout)["status"], "BLOCKED_TARGET_NOT_FOUND")

    def test_multiple_exact_targets_fail_closed(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            first, second, output = root / "Downloads", root / "Pictures", root / "out"
            name = "Ricco - Charakterdesign Übersicht.png"
            self.write_png(first / name, PNG_1X1 + b"first")
            self.write_png(second / name, PNG_1X1 + b"second")
            result = self.run_builder([first, second], output, "--no-copy-images")
            self.assertEqual(result.returncode, 4, result.stderr)
            self.assertEqual(json.loads(result.stdout)["exactTargetMatches"], 2)

    def test_overlapping_roots_do_not_duplicate_source(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            nested, output = root / "Downloads", root / "out"
            self.write_png(nested / "Ricco - Charakterdesign Übersicht.png")
            result = self.run_builder([root, nested], output, "--no-copy-images")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout)["filesIndexed"], 1)

    def test_missing_explicit_root_is_rejected_before_output(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            output = root / "out"
            result = self.run_builder([root / "missing"], output)
            self.assertEqual(result.returncode, 2)
            self.assertIn("do not exist", result.stderr)
            self.assertFalse(output.exists())

    def test_existing_output_directory_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            assets, output = root / "assets", root / "out"
            assets.mkdir(); output.mkdir()
            result = self.run_builder([assets], output)
            self.assertEqual(result.returncode, 2)
            self.assertIn("already exists", result.stderr)


if __name__ == "__main__":
    unittest.main()
