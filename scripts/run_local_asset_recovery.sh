#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=false
EXTRA_ROOTS=()

usage() {
  cat <<'EOF'
Usage: bash scripts/run_local_asset_recovery.sh [--dry-run] [--root PATH ...]

Runs the Comic Factory asset scanner and candidate analyzer without modifying
source assets. Reports are written to a new timestamped directory outside the
scanned repository so later runs cannot re-ingest earlier reports.

Environment overrides:
  REPORT_BASE  Parent directory for reports and archives.
  REPORT_DIR   Explicit report directory. Must not already exist.
  ZIP_PATH     Explicit ZIP output path. Must not already exist.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --root)
      [[ $# -ge 2 ]] || { echo "ERROR: --root requires a path" >&2; exit 2; }
      EXTRA_ROOTS+=("$2")
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(git -C "$SCRIPT_DIR/.." rev-parse --show-toplevel)"
SCANNER="$REPO_ROOT/scripts/recover_assets.py"
ANALYZER="$REPO_ROOT/scripts/analyze_recovery_inventory.py"

[[ -f "$SCANNER" ]] || { echo "ERROR: scanner missing: $SCANNER" >&2; exit 2; }
[[ -f "$ANALYZER" ]] || { echo "ERROR: analyzer missing: $ANALYZER" >&2; exit 2; }

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_BASE="${REPORT_BASE:-$HOME/ComicFactoryRecovery}"
REPORT_DIR="${REPORT_DIR:-$REPORT_BASE/reports/run-$TIMESTAMP}"
ZIP_PATH="${ZIP_PATH:-$REPORT_BASE/archives/comic-local-asset-recovery-$TIMESTAMP.zip}"

if [[ -e "$REPORT_DIR" ]]; then
  echo "ERROR: report directory already exists: $REPORT_DIR" >&2
  exit 2
fi
if [[ -e "$ZIP_PATH" ]]; then
  echo "ERROR: ZIP path already exists: $ZIP_PATH" >&2
  exit 2
fi

ROOTS=()
MISSING_ROOTS=()

add_root() {
  local candidate="$1"
  local resolved=""
  local existing=""

  if [[ ! -d "$candidate" ]]; then
    MISSING_ROOTS+=("$candidate")
    return 0
  fi

  resolved="$(cd "$candidate" && pwd -P)"
  for existing in "${ROOTS[@]:-}"; do
    [[ "$existing" == "$resolved" ]] && return 0
  done
  ROOTS+=("$resolved")
}

add_root "$REPO_ROOT"

AUTO_ROOTS=(
  "$HOME/ComfyUI/output"
  "$HOME/ComfyUI/input"
  "$HOME/ComfyUI/models/loras"
  "$HOME/AI/ComfyUI/output"
  "$HOME/AI/ComfyUI/input"
  "$HOME/AI/ComfyUI/models/loras"
  "$HOME/Documents/ComfyUI/output"
  "$HOME/Documents/ComfyUI/input"
  "$HOME/Documents/ComfyUI/models/loras"
  "$HOME/stable-diffusion-webui/models/Lora"
  "$HOME/AI/stable-diffusion-webui/models/Lora"
  "$HOME/Downloads"
  "$HOME/Pictures"
)

for candidate in "${AUTO_ROOTS[@]}"; do
  add_root "$candidate"
done
for candidate in "${EXTRA_ROOTS[@]:-}"; do
  add_root "$candidate"
done

echo "Comic Factory local asset recovery"
echo "Repository: $REPO_ROOT"
echo "Report directory: $REPORT_DIR"
echo "ZIP path: $ZIP_PATH"
echo
echo "Scan roots (${#ROOTS[@]}):"
for root in "${ROOTS[@]}"; do
  echo "  + $root"
done

echo
echo "Missing optional roots (${#MISSING_ROOTS[@]}):"
for root in "${MISSING_ROOTS[@]:-}"; do
  [[ -n "$root" ]] && echo "  - $root"
done

if [[ "$DRY_RUN" == true ]]; then
  echo
  echo "DRY_RUN_COMPLETE: no reports written"
  exit 0
fi

command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 not found" >&2; exit 2; }
command -v zip >/dev/null 2>&1 || { echo "ERROR: zip not found" >&2; exit 2; }

mkdir -p "$(dirname "$REPORT_DIR")" "$(dirname "$ZIP_PATH")"
mkdir "$REPORT_DIR"

SCAN_CMD=(python3 "$SCANNER" --report-dir "$REPORT_DIR")
for root in "${ROOTS[@]}"; do
  SCAN_CMD+=(--root "$root")
done

"${SCAN_CMD[@]}"

INVENTORY_PATH="$REPORT_DIR/asset-recovery-inventory.json"
ANALYSIS_DIR="$REPORT_DIR/analysis"
SHORTLIST_PATH="$ANALYSIS_DIR/visual-candidate-shortlist.json"

[[ -f "$INVENTORY_PATH" ]] || { echo "ERROR: inventory missing after scan" >&2; exit 3; }
python3 "$ANALYZER" --inventory "$INVENTORY_PATH" --output-dir "$ANALYSIS_DIR"
[[ -f "$SHORTLIST_PATH" ]] || { echo "ERROR: shortlist missing after analysis" >&2; exit 3; }

REPORT_PARENT="$(cd "$(dirname "$REPORT_DIR")" && pwd -P)"
REPORT_NAME="$(basename "$REPORT_DIR")"
(
  cd "$REPORT_PARENT"
  zip -rq "$ZIP_PATH" "$REPORT_NAME"
)

[[ -f "$ZIP_PATH" ]] || { echo "ERROR: ZIP was not created" >&2; exit 3; }

echo
echo "STATUS: READY_FOR_REVIEW"
echo "SCANNED_ROOTS: ${#ROOTS[@]}"
echo "MISSING_ROOTS: ${#MISSING_ROOTS[@]}"
echo "REPORT_DIR: $REPORT_DIR"
echo "INVENTORY_PATH: $INVENTORY_PATH"
echo "SHORTLIST_PATH: $SHORTLIST_PATH"
echo "ZIP_PATH: $ZIP_PATH"
echo "SOURCE_ASSETS_MODIFIED: false"
echo "AUTOMATIC_MASTER_APPROVALS: 0"
