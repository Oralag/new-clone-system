#!/bin/zsh
set -euo pipefail

REPO_DIR="/Users/oralagborjigin/new-clone-system"
BACKUP_BRANCH="backup/auto-sync"

cd "$REPO_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] auto backup start"

git add -A

if git diff --cached --quiet; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] no changes"
  exit 0
fi

git commit -m "auto-backup: $(date '+%Y-%m-%d %H:%M')"
git push origin HEAD:"refs/heads/${BACKUP_BRANCH}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] pushed to ${BACKUP_BRANCH}"
