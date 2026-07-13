import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from urllib.parse import quote

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "sanitize_cloud_character_review_package.py"
SPEC = importlib.util.spec_from_file_location("cloud_review_sanitizer", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class CloudCharacterReviewPackageTests(unittest.TestCase):
    def make_fixture(self):
        temporary = tempfile.TemporaryDirectory()
        root = Path(temporary.name)
        input_root = root / "input"
        package = root / "package"
        input_root.mkdir()
        (package / "review-images").mkdir(parents=True)
        (package / "review-sidecars").mkdir()

        target_name = "Ricco - Charakterdesign Übersicht.png"
        source_path = input_root / target_name
        review_copy = package / "review-images" / target_name
        source_path.write_bytes(b"source")
        review_copy.write_bytes(b"source")

        target = {
            "absolutePath": str(source_path),
            "reviewCopy": str(review_copy),
            "fileName": target_name,
            "sha256": "a" * 64,
            "sizeBytes": 6,
            "pixelWidth": 1024,
            "pixelHeight": 1280,
            "dimensionStatus": "KNOWN",
            "exactTargetName": True,
            "family": "RICCO",
            "sidecars": [],
        }
        payloads = {
            "PACKAGE_COMPLETE.json": {"sourceFilesModified": False, "automaticMasterApprovals": 0},
            "source-inventory-reference.json": {"roots": [str(input_root)], "sourceFilesModified": False},
            "ricco-candidate-index.json": {
                "status": "READY_FOR_HUMAN_REVIEW",
                "targetName": target_name,
                "exactTargetMatches": 1,
                "riccoCandidates": 1,
                "exactTargetPaths": [str(source_path)],
                "candidates": [target],
            },
            "character-family-index.json": {"families": {"RICCO": [target]}},
            "lora-dataset-image-index.json": {"images": [], "sidecars": []},
            "duplicate-map.json": {"duplicateGroups": []},
            "rejected-assets.json": {"assets": []},
        }
        for name, payload in payloads.items():
            (package / name).write_text(json.dumps(payload), encoding="utf-8")

        (package / "hashes.sha256").write_text(
            f"{'a' * 64}  {source_path}\n{'a' * 64}  {review_copy}\n",
            encoding="utf-8",
        )
        encoded = quote(str(review_copy))
        (package / "ricco-contact-sheet.html").write_text(
            f'<html><img src="file://{encoded}"></html>', encoding="utf-8"
        )
        return temporary, input_root, package

    def test_sanitizes_paths_and_builds_a_portable_summary(self):
        temporary, input_root, package = self.make_fixture()
        self.addCleanup(temporary.cleanup)

        summary = MODULE.sanitize_package(package, input_root)

        self.assertEqual(summary["status"], "READY_FOR_HUMAN_REVIEW")
        self.assertEqual(summary["targetSha256"], "a" * 64)
        self.assertEqual(summary["targetPixelWidth"], 1024)
        self.assertEqual(summary["targetPixelHeight"], 1280)
        self.assertEqual(summary["automaticMasterApprovals"], 0)

        all_text = "\n".join(path.read_text(encoding="utf-8") for path in package.glob("*.json"))
        all_text += (package / "hashes.sha256").read_text(encoding="utf-8")
        self.assertNotIn(str(input_root), all_text)
        self.assertNotIn(str(package), all_text)
        self.assertIn("${ASSET_ROOT}", all_text)
        self.assertIn("./review-images/", all_text)

        contact = (package / "ricco-contact-sheet.html").read_text(encoding="utf-8")
        self.assertIn('src="review-images/', contact)
        self.assertNotIn("file://", contact)
        self.assertTrue((package / "PACKAGE_CLOUD_PORTABLE.json").is_file())
        self.assertTrue((package / "cloud-review-summary.json").is_file())

    def test_rejects_an_incomplete_package(self):
        temporary, input_root, package = self.make_fixture()
        self.addCleanup(temporary.cleanup)
        (package / "PACKAGE_INCOMPLETE.json").write_text("{}", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "PACKAGE_INCOMPLETE"):
            MODULE.sanitize_package(package, input_root)

    def test_rejects_automatic_master_approval(self):
        temporary, input_root, package = self.make_fixture()
        self.addCleanup(temporary.cleanup)
        complete = package / "PACKAGE_COMPLETE.json"
        payload = json.loads(complete.read_text(encoding="utf-8"))
        payload["automaticMasterApprovals"] = 1
        complete.write_text(json.dumps(payload), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "automatic master approval"):
            MODULE.sanitize_package(package, input_root)


if __name__ == "__main__":
    unittest.main()
