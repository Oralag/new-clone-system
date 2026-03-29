#!/bin/bash
# 每天备份 Neon 数据库到 GitHub（backups/db/ 目录）

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$REPO_DIR/backups/db"
PG_DUMP="/opt/homebrew/opt/libpq/bin/pg_dump"
NEON_URL="postgresql://neondb_owner:npg_u4JolQeAUK1W@ep-steep-dew-a1iir071.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/db-backup.log"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR" "$LOG_DIR"

echo "[$(date)] 开始备份数据库..." >> "$LOG_FILE"

# 执行备份
BACKUP_FILE="$BACKUP_DIR/neon_backup_$DATE.sql"
"$PG_DUMP" "$NEON_URL" -F p --no-password > "$BACKUP_FILE" 2>> "$LOG_FILE"

if [ $? -ne 0 ]; then
  echo "[$(date)] 备份失败" >> "$LOG_FILE"
  exit 1
fi

# 只保留最近30个备份文件
ls -t "$BACKUP_DIR"/neon_backup_*.sql 2>/dev/null | tail -n +31 | xargs rm -f 2>/dev/null || true

# 提交到 Git
cd "$REPO_DIR"
git add backups/db/
git commit -m "db backup $DATE" --no-verify >> "$LOG_FILE" 2>&1 || true
git push origin HEAD >> "$LOG_FILE" 2>&1

echo "[$(date)] 备份完成: neon_backup_$DATE.sql" >> "$LOG_FILE"
