#!/bin/bash
set -euo pipefail

cd /Users/oralagborjigin/new-clone-system

NEON_URL="${NEON_URL:-postgresql://neondb_owner:npg_u4JolQeAUK1W@ep-steep-dew-a1iir071.ap-southeast-1.aws.neon.tech/neondb?sslmode=require}"
TS=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/restore-snapshots /tmp

PG_DUMP_BIN="/opt/homebrew/opt/libpq/bin/pg_dump"
PSQL_BIN="/opt/homebrew/opt/libpq/bin/psql"
[ -x "$PG_DUMP_BIN" ] || PG_DUMP_BIN="pg_dump"
[ -x "$PSQL_BIN" ] || PSQL_BIN="psql"

echo "[1/5] backup current stock_flow and stock_inventory ..."
"$PG_DUMP_BIN" "$NEON_URL" -F p -t public.stock_flow > "backups/restore-snapshots/stock_flow_before_reverse_cleanup_${TS}.sql"
"$PG_DUMP_BIN" "$NEON_URL" -F p -t public.stock_inventory > "backups/restore-snapshots/stock_inventory_before_reverse_cleanup_${TS}.sql"

echo "[2/5] count dirty stock_flow rows ..."
DIRTY_COUNT=$("$PSQL_BIN" "$NEON_URL" -Atc "
  select count(*)
  from public.stock_flow
  where type ~ 'reverse'
     or remark ~ '(反审核|撤销|作废|取消)'
")
echo "dirty_rows=${DIRTY_COUNT}"

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "[dry-run] stop here"
  exit 0
fi

echo "[3/5] delete dirty stock_flow rows ..."
"$PSQL_BIN" "$NEON_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
WITH dirty AS (
  SELECT id
  FROM public.stock_flow
  WHERE type ~ 'reverse'
     OR remark ~ '(反审核|撤销|作废|取消)'
)
DELETE FROM public.stock_flow s
USING dirty d
WHERE s.id = d.id;
COMMIT;
SQL

echo "[4/5] recalculate stock_inventory qty from remaining stock_flow ..."
"$PSQL_BIN" "$NEON_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
WITH flow_sum AS (
  SELECT
    goods_id,
    warehouse_id,
    SUM(qty) AS qty,
    MAX(created_at) AS update_time
  FROM public.stock_flow
  GROUP BY goods_id, warehouse_id
)
UPDATE public.stock_inventory si
SET
  qty = COALESCE(fs.qty, 0),
  update_time = COALESCE(fs.update_time, si.update_time)
FROM flow_sum fs
WHERE si.goods_id = fs.goods_id
  AND si.warehouse_id = fs.warehouse_id;

UPDATE public.stock_inventory si
SET qty = 0
WHERE NOT EXISTS (
  SELECT 1
  FROM public.stock_flow sf
  WHERE sf.goods_id = si.goods_id
    AND sf.warehouse_id = si.warehouse_id
);
COMMIT;
SQL

echo "[5/5] verify ..."
"$PSQL_BIN" "$NEON_URL" -Atc "
  select 'remaining_dirty='||count(*)
  from public.stock_flow
  where type ~ 'reverse'
     or remark ~ '(反审核|撤销|作废|取消)';
  select 'inventory_rows='||count(*)
  from public.stock_inventory;
"

echo "DONE"
