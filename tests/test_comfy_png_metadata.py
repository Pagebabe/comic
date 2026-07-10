from __future__ import annotations

import binascii
import json
import struct
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "inspect_comfy_png_metadata.py"


def chunk(kind: bytes, data: bytes) -> bytes:
    crc = binascii.crc32(kind + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", crc)


def write_png(path: Path, metadata: dict[str, str] | None = None) -> None:
    payload = bytearray(b"\x89PNG\r\n\x1a\n")
    payload += chunk(b"IHDR", struct.pack(">IIBBBBB", 512, 512, 8, 2, 0, 0, 0))
    for key, value in (metadata or {}).items():
        payload += chunk(b"tEXt", key.encode("utf-8") + b"\x00" + value.encode("utf-8"))
    payload += chunk(b"IEND", b"")
    path.write_bytes(payload)


class ComfyPngMetadataTest(unittest.TestCase):
    def test_metadata_match_and_generic_fallback_are_bundled_for_review(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            match = root / "ComfyUI_001.png"
            generic = root / "ComfyUI_002.png"
            forbidden = root / "chris-fact-radar-studio" / "ComfyUI_003.png"
            forbidden.parent.mkdir()
            write_png(match, {"prompt": "Ricco character sheet turnaround, thick black outlines, Berlin"})
            write_png(generic)
            write_png(forbidden, {"prompt": "Ricco character sheet"})

            inventory = root / "asset-recovery-inventory.json"
            inventory.write_text(json.dumps({
                "readOnlySourceScan": True,
                "files": [
                    {
                        "absolute_path": str(match), "relative_path": match.name,
                        "extension": ".png", "size_bytes": match.stat().st_size,
                        "modified_utc": "2026-07-01T10:00:00Z",
                    },
                    {
                        "absolute_path": str(generic), "relative_path": generic.name,
                        "extension": ".png", "size_bytes": generic.stat().st_size,
                        "modified_utc": "2026-07-02T10:00:00Z",
                    },
                    {
                        "absolute_path": str(forbidden), "relative_path": forbidden.name,
                        "extension": ".png", "size_bytes": forbidden.stat().st_size,
                        "modified_utc": "2026-07-03T10:00:00Z",
                    },
                ],
            }), encoding="utf-8")

            output = root / "analysis"
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--inventory", str(inventory), "--output-dir", str(output)],
                check=False, text=True, capture_output=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            report = json.loads((output / "comfy-png-metadata-report.json").read_text(encoding="utf-8"))
            self.assertFalse(report["automaticCanonApproval"])
            self.assertEqual(report["summary"]["metadataMatches"], 1)
            self.assertEqual(report["summary"]["genericComfyFallbackCandidates"], 1)
            self.assertEqual(report["summary"]["bundleFiles"], 2)
            evidence = report["metadataMatches"][0]
            self.assertIn("character_ricco", evidence["matched_targets"])
            self.assertEqual(evidence["review_status"], "REVIEW_REQUIRED")

            with zipfile.ZipFile(output / "comic-visual-review-bundle.zip") as archive:
                names = archive.namelist()
                self.assertIn("manifest.json", names)
                self.assertEqual(len([name for name in names if name.startswith("images/")]), 2)
                manifest = json.loads(archive.read("manifest.json"))
                self.assertFalse(manifest["automaticCanonApproval"])
                self.assertEqual(manifest["reviewStatus"], "REVIEW_REQUIRED")
                self.assertFalse(any("chris-fact-radar" in item["sourcePath"] for item in manifest["files"]))

    def test_non_read_only_inventory_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            inventory = Path(temp) / "bad.json"
            inventory.write_text(json.dumps({"readOnlySourceScan": False, "files": []}), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--inventory", str(inventory)],
                check=False, text=True, capture_output=True,
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("read-only source scan", result.stderr)


if __name__ == "__main__":
    unittest.main()
