#!/bin/zsh
set -euo pipefail

REPO_DIR="/Users/oralagborjigin/new-clone-system"
BACKUP_BRANCH="backup/auto-sync"
TMP_INDEX="$(mktemp "${TMPDIR:-/tmp}/new-clone-system-backup-index.XXXXXX")"
TMP_REF="refs/heads/__auto_backup_tmp"

cleanup() {
  unset GIT_INDEX_FILE
  rm -f "$TMP_INDEX"
  git update-ref -d "$TMP_REF" >/dev/null 2>&1 || true
}

trap cleanup EXIT

cd "$REPO_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] auto backup start"

export GIT_INDEX_FILE="$TMP_INDEX"
git read-tree HEAD
git add -A

if git diff --cached --quiet; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] no changes"
  exit 0
fi

if git show-ref --verify --quiet "refs/heads/${BACKUP_BRANCH}"; then
  PARENT_REF="refs/heads/${BACKUP_BRANCH}"
elif git show-ref --verify --quiet "refs/remotes/origin/${BACKUP_BRANCH}"; then
  PARENT_REF="refs/remotes/origin/${BACKUP_BRANCH}"
else
  PARENT_REF="HEAD"
fi

TREE_ID="$(git write-tree)"
COMMIT_ID="$(printf 'auto-backup: %s\n' "$(date '+%Y-%m-%d %H:%M')" | git commit-tree "$TREE_ID" -p "$PARENT_REF")"

git update-ref "$TMP_REF" "$COMMIT_ID"
git push origin "${TMP_REF}:refs/heads/${BACKUP_BRANCH}"
git update-ref "refs/heads/${BACKUP_BRANCH}" "$COMMIT_ID"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] pushed to ${BACKUP_BRANCH}"
