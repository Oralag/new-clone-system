#!/bin/bash
set -euo pipefail

cd /Users/oralagborjigin/new-clone-system

export NEON_URL='postgresql://neondb_owner:npg_u4JolQeAUK1W@ep-steep-dew-a1iir071.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/restore-snapshots /tmp

PG_DUMP_BIN="/opt/homebrew/opt/libpq/bin/pg_dump"
PSQL_BIN="/opt/homebrew/opt/libpq/bin/psql"
[ -x "$PG_DUMP_BIN" ] || PG_DUMP_BIN="pg_dump"
[ -x "$PSQL_BIN" ] || PSQL_BIN="psql"

echo "[1/4] backup current retail_orders ..."
"$PG_DUMP_BIN" "$NEON_URL" -F p -t public.retail_orders > "backups/restore-snapshots/retail_orders_before_restore_${TS}.sql"

echo "[2/4] build restore sql from backup 20260429 ..."
python3 - <<'PY'
from pathlib import Path
src = Path("backups/db/neon_backup_20260429_191706.sql")
out = Path("/tmp/restore_retail_orders_20260429.sql")
lines = src.read_text(encoding="utf-8", errors="ignore").splitlines()
s = e = None
setval = None
for i, l in enumerate(lines):
    if l.startswith("COPY public.retail_orders "):
        s = i
        continue
    if s is not None and e is None and l.strip() == r"\.":
        e = i
    if "setval('public.retail_orders_id_seq'" in l:
        setval = l
if s is None or e is None:
    raise SystemExit("retail_orders COPY block not found in backup file")
sql = ["BEGIN;", "TRUNCATE TABLE public.retail_orders RESTART IDENTITY;"] + lines[s:e+1] + ([setval] if setval else []) + ["COMMIT;"]
out.write_text("\n".join(sql) + "\n", encoding="utf-8")
print(out)
PY

echo "[3/4] restore retail_orders ..."
"$PSQL_BIN" "$NEON_URL" -v ON_ERROR_STOP=1 -f /tmp/restore_retail_orders_20260429.sql

echo "[4/4] verify ..."
"$PSQL_BIN" "$NEON_URL" -Atc "select 'rows='||count(*)||',max_created_at='||coalesce(max(created_at)::text,'null') from public.retail_orders;"

echo "DONE"
