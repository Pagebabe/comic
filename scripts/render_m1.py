#!/usr/bin/env python3
"""Render the M1 Ricco life-sign proof as a deterministic MP4.

This is a technical production proof, not the final series look. It uses the
locked manifests, a local eSpeak working voice, Pillow-controlled 2D frames,
FFmpeg for mastering and FFprobe for the machine-readable acceptance gate.
"""

from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
CHARACTER_PATH = ROOT / "series/ricco-im-haus/characters/ricco/character.json"
SCENE_PATH = ROOT / "series/ricco-im-haus/episodes/m1-life-sign/scene.json"
DEFAULT_OUTPUT = ROOT / "output/m1/ricco-life-sign.mp4"


def require_binary(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise RuntimeError(f"Required executable is missing: {name}")
    return path


def run(command: list[str]) -> None:
    completed = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if completed.returncode != 0:
        raise RuntimeError(
            f"Command failed ({completed.returncode}): {' '.join(command)}\n"
            f"STDOUT:\n{completed.stdout}\nSTDERR:\n{completed.stderr}"
        )


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def parse_hex(value: str) -> tuple[int, int, int]:
    clean = value.lstrip("#")
    if len(clean) != 6:
        raise ValueError(f"Expected six-digit hex color, got {value!r}")
    return tuple(int(clean[index : index + 2], 16) for index in (0, 2, 4))


def load_font(size: int, *, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def rounded(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int,
    fill: tuple[int, ...],
    outline: tuple[int, ...] | None = None,
    width: int = 1,
) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_room(image: Image.Image, progress: float) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    width, height = image.size
    draw.rectangle((0, 0, width, height), fill=(25, 29, 38, 255))
    horizon = int(1370 - progress * 18)
    draw.rectangle((0, horizon, width, height), fill=(18, 16, 18, 255))

    # Window and a deliberately generic Berlin-night suggestion.
    rounded(draw, (710, 185, 995, 695), 18, (10, 17, 32, 255), (72, 82, 102, 255), 7)
    draw.line((852, 193, 852, 687), fill=(60, 70, 90, 255), width=5)
    draw.line((718, 440, 987, 440), fill=(60, 70, 90, 255), width=5)
    for x, y in [(750, 330), (806, 390), (876, 288), (918, 472), (772, 580), (900, 610)]:
        draw.ellipse((x - 7, y - 7, x + 7, y + 7), fill=(244, 185, 66, 255))

    # Minimal room props. M1 proves a pipeline, not an interior-design degree.
    draw.rectangle((85, 965, 430, 1000), fill=(95, 69, 48, 255))
    draw.rectangle((105, 720, 335, 890), fill=(12, 15, 22, 255), outline=(76, 87, 104, 255), width=6)
    draw.rectangle((128, 745, 312, 860), fill=(42, 57, 82, 255))
    draw.ellipse((167, 778, 273, 835), fill=(244, 185, 66, 255))
    rounded(draw, (355, 785, 455, 960), 18, (18, 20, 27, 255), (65, 72, 84, 255), 4)
    draw.ellipse((379, 816, 431, 868), fill=(9, 10, 14, 255), outline=(90, 99, 112, 255), width=4)

    rounded(draw, (80, 180, 410, 590), 12, (42, 29, 35, 255), (83, 63, 72, 255), 5)
    draw.polygon([(130, 510), (245, 230), (360, 510)], fill=(244, 185, 66, 255))
    draw.ellipse((190, 320, 300, 430), fill=(24, 27, 35, 255))


def mouth_state(time_s: float) -> str:
    if time_s < 0.48 or time_s > 3.45:
        return "rest"
    phase = int((time_s - 0.48) * 8.5)
    pattern = ("open", "wide", "open", "rest", "open", "open", "wide", "rest")
    return pattern[phase % len(pattern)]


def draw_ricco(image: Image.Image, time_s: float, duration: float, palette: dict[str, str]) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    width, height = image.size
    progress = time_s / duration

    primary = parse_hex(palette["primary"])
    secondary = parse_hex(palette["secondary"])
    skin = parse_hex(palette["skin"])
    hair = parse_hex(palette["hair"])

    idle = math.sin(time_s * math.pi * 1.1) * 4
    nod = math.sin((time_s - 3.0) / 0.65 * math.pi) * 18 if 3.0 <= time_s <= 3.65 else 0
    scale = 1.0 + progress * 0.02
    cx = width // 2 - 34
    head_top = int(510 + idle + nod)
    head_w = int(390 * scale)
    head_h = int(455 * scale)
    left = cx - head_w // 2
    right = left + head_w
    bottom = head_top + head_h
    shoulder_y = bottom - 32

    rounded(draw, (cx - 365, shoulder_y, cx + 365, height + 60), 170, primary + (255,), (102, 74, 30, 255), 8)
    draw.polygon([(cx - 92, shoulder_y + 12), (cx, shoulder_y + 190), (cx + 92, shoulder_y + 12)], fill=secondary + (255,))
    draw.line((cx - 8, shoulder_y + 185, cx - 8, height), fill=(120, 85, 31, 255), width=8)

    rounded(draw, (cx - 72, bottom - 25, cx + 72, bottom + 115), 45, skin + (255,))
    draw.ellipse((left - 25, head_top + 176, left + 55, head_top + 298), fill=skin + (255,))
    draw.ellipse((right - 55, head_top + 176, right + 25, head_top + 298), fill=skin + (255,))
    rounded(draw, (left, head_top, right, bottom), 150, skin + (255,), (105, 63, 43, 255), 7)

    rounded(draw, (left - 8, head_top - 45, right + 8, head_top + 145), 115, hair + (255,))
    for offset_x, offset_y, radius in [(-130, 35, 58), (-58, 0, 68), (20, -8, 71), (102, 18, 62), (145, 70, 48)]:
        x = cx + offset_x
        y = head_top + offset_y
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=hair + (255,))

    # Black headphones are a locked identity anchor.
    draw.arc((left - 55, head_top - 85, right + 55, head_top + 265), start=195, end=345, fill=(15, 16, 20, 255), width=35)
    rounded(draw, (left - 46, head_top + 150, left + 28, head_top + 300), 28, (16, 17, 21, 255))
    rounded(draw, (right - 28, head_top + 150, right + 46, head_top + 300), 28, (16, 17, 21, 255))
    draw.line((left - 8, head_top + 205, left + 23, head_top + 205), fill=primary + (255,), width=8)
    draw.line((right - 23, head_top + 205, right + 8, head_top + 205), fill=primary + (255,), width=8)

    brow_lift = 18 if 1.05 <= time_s <= 1.55 else 0
    eye_y = head_top + 225
    gaze = int(-10 + min(1.0, time_s / 1.3) * 14)
    blink = 2.53 <= time_s <= 2.68
    draw.line((cx - 130, eye_y - 55 - brow_lift, cx - 52, eye_y - 62 - brow_lift), fill=hair + (255,), width=18)
    draw.line((cx + 52, eye_y - 62 - brow_lift, cx + 130, eye_y - 55 - brow_lift), fill=hair + (255,), width=18)

    if blink:
        draw.line((cx - 125, eye_y, cx - 48, eye_y + 2), fill=(43, 28, 24, 255), width=11)
        draw.line((cx + 48, eye_y + 2, cx + 125, eye_y), fill=(43, 28, 24, 255), width=11)
    else:
        draw.ellipse((cx - 132, eye_y - 24, cx - 42, eye_y + 34), fill=(245, 241, 226, 255))
        draw.ellipse((cx + 42, eye_y - 24, cx + 132, eye_y + 34), fill=(245, 241, 226, 255))
        draw.ellipse((cx - 93 + gaze, eye_y - 10, cx - 58 + gaze, eye_y + 27), fill=(24, 21, 20, 255))
        draw.ellipse((cx + 69 + gaze, eye_y - 10, cx + 104 + gaze, eye_y + 27), fill=(24, 21, 20, 255))

    draw.line((cx + 2, eye_y + 30, cx - 13, eye_y + 92), fill=(139, 79, 54, 255), width=8)
    draw.arc((cx - 34, eye_y + 75, cx + 28, eye_y + 115), start=15, end=160, fill=(139, 79, 54, 255), width=6)

    mouth_y = eye_y + 155
    state = mouth_state(time_s)
    if state == "rest":
        draw.arc((cx - 66, mouth_y - 10, cx + 66, mouth_y + 42), start=18, end=162, fill=(92, 38, 42, 255), width=10)
    elif state == "open":
        draw.ellipse((cx - 58, mouth_y - 2, cx + 58, mouth_y + 68), fill=(74, 26, 33, 255), outline=(91, 37, 42, 255), width=5)
        draw.arc((cx - 38, mouth_y + 24, cx + 38, mouth_y + 62), start=180, end=360, fill=(216, 98, 109, 255), width=8)
    else:
        draw.ellipse((cx - 78, mouth_y - 8, cx + 78, mouth_y + 78), fill=(72, 24, 31, 255), outline=(91, 37, 42, 255), width=5)
        draw.rectangle((cx - 56, mouth_y + 2, cx + 56, mouth_y + 20), fill=(246, 236, 218, 255))
        draw.arc((cx - 48, mouth_y + 34, cx + 48, mouth_y + 78), start=180, end=360, fill=(216, 98, 109, 255), width=10)

    draw.ellipse((cx + 180, shoulder_y + 130, cx + 235, shoulder_y + 185), fill=(21, 23, 28, 255))
    draw.line((cx - 240, shoulder_y + 170, cx - 150, shoulder_y + 260), fill=(202, 145, 50, 255), width=12)


def draw_subtitle(image: Image.Image, text: str) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    subtitle_font = load_font(58, bold=True)
    bbox = draw.textbbox((0, 0), text, font=subtitle_font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    box_width = min(980, text_width + 100)
    left = (image.width - box_width) // 2
    top = 1590
    rounded(draw, (left, top, left + box_width, top + text_height + 64), 28, (5, 7, 11, 218), (255, 255, 255, 45), 3)
    draw.text(((image.width - text_width) // 2, top + 25), text, font=subtitle_font, fill=(250, 247, 239, 255))


def render_frame(character: dict[str, Any], scene: dict[str, Any], frame_index: int) -> Image.Image:
    fmt = scene["format"]
    width = int(fmt["width"])
    height = int(fmt["height"])
    fps = int(fmt["fps"])
    duration = float(fmt["durationSeconds"])
    time_s = frame_index / fps

    image = Image.new("RGB", (width, height), (14, 16, 22))
    draw_room(image, time_s / duration)
    draw_ricco(image, time_s, duration, character["visual"]["palette"])
    draw_subtitle(image, scene["shot"]["subtitle"]["text"])

    fade = min(1.0, time_s / 0.18, max(0.0, (duration - time_s) / 0.22))
    if fade < 1.0:
        image = Image.blend(Image.new("RGB", image.size, (5, 6, 9)), image, fade)
    return image


def synthesize_voice(scene: dict[str, Any], temp_dir: Path) -> Path:
    espeak = require_binary("espeak-ng")
    ffmpeg = require_binary("ffmpeg")
    raw_voice = temp_dir / "voice-raw.wav"
    final_voice = temp_dir / "voice.wav"
    duration = float(scene["format"]["durationSeconds"])
    sample_rate = int(scene["format"]["audioSampleRateHz"])

    run([espeak, "-v", "de", "-s", "145", "-p", "46", "-a", "160", "-w", str(raw_voice), scene["shot"]["line"]])
    run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw_voice),
        "-af", f"adelay=450|450,apad=pad_dur={duration},atrim=0:{duration},aresample={sample_rate}",
        "-ar", str(sample_rate), "-ac", "1", str(final_voice),
    ])
    return final_voice


def render_silent_video(character: dict[str, Any], scene: dict[str, Any], output: Path, poster: Path) -> None:
    ffmpeg = require_binary("ffmpeg")
    fmt = scene["format"]
    width = int(fmt["width"])
    height = int(fmt["height"])
    fps = int(fmt["fps"])
    total_frames = int(round(fps * float(fmt["durationSeconds"])))

    command = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}", "-r", str(fps), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output),
    ]
    process = subprocess.Popen(command, cwd=ROOT, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    assert process.stdin is not None
    poster_frame = min(total_frames - 1, int(fps * 1.5))
    try:
        for index in range(total_frames):
            frame = render_frame(character, scene, index)
            if index == poster_frame:
                frame.save(poster, format="PNG", optimize=True)
            process.stdin.write(frame.tobytes())
    finally:
        process.stdin.close()
    stderr = process.stderr.read().decode("utf-8", errors="replace") if process.stderr else ""
    return_code = process.wait()
    if return_code != 0:
        raise RuntimeError(f"FFmpeg frame render failed ({return_code}):\n{stderr}")


def mux_master(silent_video: Path, voice: Path, output: Path, duration: float) -> None:
    ffmpeg = require_binary("ffmpeg")
    run([
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(silent_video), "-i", str(voice),
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
        "-t", str(duration), "-movflags", "+faststart", str(output),
    ])


def probe_master(output: Path, scene: dict[str, Any]) -> dict[str, Any]:
    ffprobe = require_binary("ffprobe")
    completed = subprocess.run([
        ffprobe, "-v", "error",
        "-show_entries", "format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate",
        "-of", "json", str(output),
    ], cwd=ROOT, text=True, capture_output=True, check=True)
    probe = json.loads(completed.stdout)
    streams = probe.get("streams", [])
    video = next((stream for stream in streams if stream.get("codec_type") == "video"), None)
    audio = next((stream for stream in streams if stream.get("codec_type") == "audio"), None)
    fmt = scene["format"]
    duration = float(probe["format"]["duration"])

    errors: list[str] = []
    if not video:
        errors.append("video stream missing")
    else:
        if video.get("codec_name") != "h264":
            errors.append(f"unexpected video codec {video.get('codec_name')}")
        if int(video.get("width", 0)) != int(fmt["width"]) or int(video.get("height", 0)) != int(fmt["height"]):
            errors.append(f"unexpected resolution {video.get('width')}x{video.get('height')}")
        if video.get("r_frame_rate") != f"{fmt['fps']}/1":
            errors.append(f"unexpected frame rate {video.get('r_frame_rate')}")
    if not audio:
        errors.append("audio stream missing")
    elif int(audio.get("sample_rate", 0)) != int(fmt["audioSampleRateHz"]):
        errors.append(f"unexpected audio sample rate {audio.get('sample_rate')}")
    if not 3.8 <= duration <= 4.2:
        errors.append(f"duration outside M1 gate: {duration:.3f}s")
    if errors:
        raise RuntimeError("M1 master validation failed: " + "; ".join(errors))

    return {
        "status": "passed",
        "file": str(output.relative_to(ROOT)),
        "durationSeconds": round(duration, 3),
        "width": int(video["width"]),
        "height": int(video["height"]),
        "fps": int(fmt["fps"]),
        "videoCodec": video["codec_name"],
        "audioCodec": audio["codec_name"],
        "audioSampleRateHz": int(audio["sample_rate"]),
        "workingVoice": "eSpeak NG German technical placeholder",
        "creativeStatus": "technical-proof-only",
        "sceneId": scene["id"],
        "characterId": scene["shot"]["character"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--poster", type=Path, default=ROOT / "output/m1/ricco-life-sign-poster.png")
    parser.add_argument("--report", type=Path, default=ROOT / "output/m1/render-report.json")
    args = parser.parse_args()

    character = load_json(CHARACTER_PATH)
    scene = load_json(SCENE_PATH)
    if scene["milestone"] != "M1" or scene["shot"]["character"] != character["id"]:
        raise RuntimeError("M1 scene and Ricco character manifest do not match")

    output = args.output.resolve()
    poster = args.poster.resolve()
    report_path = args.report.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="comic-m1-") as temporary:
        temp_dir = Path(temporary)
        voice = synthesize_voice(scene, temp_dir)
        silent = temp_dir / "silent.mp4"
        render_silent_video(character, scene, silent, poster)
        mux_master(silent, voice, output, float(scene["format"]["durationSeconds"]))

    report = probe_master(output, scene)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # command-line proof must fail loudly
        print(f"M1 render failed: {error}", file=sys.stderr)
        raise SystemExit(1)
