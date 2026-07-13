#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== Comic Factory Cloud Workbench ==="
echo "Repository: $REPO_ROOT"
echo "Branch: $(git branch --show-current)"
echo "HEAD: $(git rev-parse HEAD)"

node --version
npm --version
python3 --version
if command -v gh >/dev/null 2>&1; then
  gh --version | head -n 1
else
  echo "GitHub CLI fehlt" >&2
  exit 2
fi

if [[ ! -f studio-app/package-lock.json ]]; then
  echo "studio-app/package-lock.json fehlt" >&2
  exit 3
fi

npm --prefix studio-app ci
node scripts/check_cloud_workbench.mjs
npm run build:studio

cat <<'EOF'

CLOUD_WORKBENCH_READY

Studio starten:
  npm --prefix studio-app run dev

Danach den weitergeleiteten Port 3100 öffnen.

Für neue Arbeit immer einen eigenen Branch erstellen:
  git switch -c worker/<kurzer-name>
  git push -u origin HEAD
EOF
