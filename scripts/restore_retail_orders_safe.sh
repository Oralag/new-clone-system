#!/bin/bash
set -euo pipefail

cd /Users/oralagborjigin/new-clone-system

BACKUP_FILE="${1:-backups/db/neon_backup_20260501_020001.sql}"
NEON_URL="${NEON_URL:-postgresql://neondb_owner:npg_u4JolQeAUK1W@ep-steep-dew-a1iir071.ap-southeast-1.aws.neon.tech/neondb?sslmode=require}"
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/restore-snapshots /tmp

PG_DUMP_BIN="/opt/homebrew/opt/libpq/bin/pg_dump"
PSQL_BIN="/opt/homebrew/opt/libpq/bin/psql"
[ -x "$PG_DUMP_BIN" ] || PG_DUMP_BIN="pg_dump"
[ -x "$PSQL_BIN" ] || PSQL_BIN="psql"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[1/4] backup current retail_orders ..."
"$PG_DUMP_BIN" "$NEON_URL" -F p -t public.retail_orders > "backups/restore-snapshots/retail_orders_before_safe_restore_${TS}.sql"

echo "[2/4] build safe restore sql from ${BACKUP_FILE} ..."
python3 - "$BACKUP_FILE" <<'PY'
from pathlib import Path
import re
import sys

src = Path(sys.argv[1])
out = Path("/tmp/restore_retail_orders_safe.sql")
lines = src.read_text(encoding="utf-8", errors="ignore").splitlines()

s = e = None
copy_header = None
for i, l in enumerate(lines):
    if l.startswith("COPY public.retail_orders "):
        s = i
        copy_header = l
        continue
    if s is not None and e is None and l.strip() == r"\.":
        e = i
        break

if s is None or e is None or copy_header is None:
    raise SystemExit("retail_orders COPY block not found in backup file")

m = re.match(r"COPY public\.retail_orders \((.+)\) FROM stdin;", copy_header)
if not m:
    raise SystemExit("unable to parse retail_orders COPY header")

cols = [c.strip() for c in m.group(1).split(",")]
col_csv = ", ".join(cols)

sql = []
sql.append("BEGIN;")
sql.append("CREATE TEMP TABLE tmp_retail_orders AS SELECT * FROM public.retail_orders WITH NO DATA;")
sql.append(copy_header.replace("public.retail_orders", "tmp_retail_orders"))
sql.extend(lines[s + 1:e + 1])
sql.append(f"""
INSERT INTO public.retail_orders ({col_csv})
SELECT {col_csv}
FROM tmp_retail_orders t
WHERE NOT EXISTS (
  SELECT 1
  FROM public.retail_orders r
  WHERE r.id = t.id
     OR (COALESCE(t.order_sn, '') <> '' AND r.order_sn = t.order_sn)
);
""".strip())
sql.append("SELECT setval('public.retail_orders_id_seq', COALESCE((SELECT MAX(id) FROM public.retail_orders), 1), true);")
sql.append("COMMIT;")

out.write_text("\n".join(sql) + "\n", encoding="utf-8")
print(out)
PY

echo "[3/4] execute safe restore ..."
"$PSQL_BIN" "$NEON_URL" -v ON_ERROR_STOP=1 -f /tmp/restore_retail_orders_safe.sql

echo "[4/4] verify ..."
"$PSQL_BIN" "$NEON_URL" -Atc "select 'rows='||count(*)||',min_created_at='||coalesce(min(created_at)::text,'null')||',max_created_at='||coalesce(max(created_at)::text,'null') from public.retail_orders;"

echo "DONE (safe restore, no truncate)"
