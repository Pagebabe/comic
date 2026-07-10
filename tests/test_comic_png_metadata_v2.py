from __future__ import annotations

import binascii
import json
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "inspect_comic_png_metadata_v2.py"


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", binascii.crc32(kind + data) & 0xFFFFFFFF)


def write_png(path: Path, prompt_graph: dict) -> None:
    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    raw = b"\x00\x00\x00\x00"
    metadata = b"prompt\x00" + json.dumps(prompt_graph).encode("utf-8")
    path.write_bytes(
        signature
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"tEXt", metadata)
        + png_chunk(b"IDAT", zlib.compress(raw))
        + png_chunk(b"IEND", b"")
    )


def comfy_graph(positive: str, negative: str = "") -> dict:
    return {
        "3": {
            "class_type": "KSampler",
            "inputs": {"positive": ["6", 0], "negative": ["7", 0]},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "_meta": {"title": "Positive Prompt"},
            "inputs": {"text": positive},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "_meta": {"title": "Negative Prompt"},
            "inputs": {"text": negative},
        },
    }


class StrictComicPngInspectorTest(unittest.TestCase):
    def test_positive_prompt_only_and_no_generic_fallback(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            influencer = root / "ComfyUI_influencer.png"
            comic = root / "ComfyUI_ricco.png"
            generic = root / "ComfyUI_kitchen.png"

            write_png(
                influencer,
                comfy_graph(
                    "instagram photo amateur, realistic skin, woman in a bedroom, EOS 5D, depth of field",
                    "cartoon, illustration, anime, low quality",
                ),
            )
            write_png(
                comic,
                comfy_graph(
                    "Ricco character sheet for Comic Factory, stylized 2D cartoon illustration, thick black outlines",
                    "photorealistic, photo, text",
                ),
            )
            write_png(
                generic,
                comfy_graph(
                    "cartoon illustration of a shared kitchen",
                    "photo",
                ),
            )

            files = []
            for path in (influencer, comic, generic):
                files.append({
                    "absolute_path": str(path),
                    "relative_path": path.name,
                    "extension": ".png",
                    "size_bytes": path.stat().st_size,
                    "modified_utc": "2026-07-10T00:00:00Z",
                })
            inventory = root / "inventory.json"
            inventory.write_text(json.dumps({"readOnlySourceScan": True, "files": files}), encoding="utf-8")
            output = root / "analysis"

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--inventory",
                    str(inventory),
                    "--output-dir",
                    str(output),
                ],
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stderr)

            report = json.loads((output / "comic-png-strict-report.json").read_text(encoding="utf-8"))
            self.assertFalse(report["automaticCanonApproval"])
            self.assertEqual(report["summary"]["eligibleCandidates"], 1)
            self.assertEqual(report["summary"]["bundleFiles"], 1)
            self.assertEqual(report["candidates"][0]["absolute_path"], str(comic))
            self.assertIn("character_ricco", report["candidates"][0]["matched_targets"])

            rejected = {Path(item["absolute_path"]).name: item["reason"] for item in report["rejections"]}
            self.assertEqual(rejected[influencer.name], "photographic_or_nsfw_prompt")
            self.assertEqual(rejected[generic.name], "missing_project_or_character_identity")

            with __import__("zipfile").ZipFile(output / "comic-visual-review-bundle-v2.zip") as archive:
                names = archive.namelist()
            self.assertIn("manifest.json", names)
            self.assertEqual(len([name for name in names if name.startswith("images/")]), 1)

    def test_non_read_only_inventory_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            inventory = root / "inventory.json"
            inventory.write_text(json.dumps({"readOnlySourceScan": False, "files": []}), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--inventory", str(inventory)],
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertEqual(result.returncode, 2)
            self.assertIn("read-only source scan", result.stderr)


if __name__ == "__main__":
    unittest.main()
