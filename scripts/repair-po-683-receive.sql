-- 一次性补救：PO2026111513054946976（purchase_order id 683）
-- 只补这张已审核、已付款采购单的入库，不再付款、不改状态、不新建采购入库单。
--
-- 效果（幂等）：
--   牧区纯坊门店（warehouse_id 189）的「科尔沁/大奶豆腐」（goods_id 856）库存 +10
--   stock_flow 一条 type=procure_in、remark=purchase_order#683、qty=10
--   purchase_order.received_qty = 10
-- 如果这条流水已经在，脚本直接结束，不会再加一次。
--
-- 怎么跑（会写线上库，确认单号和数量后再执行）：
--   psql "$NEON_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/repair-po-683-receive.sql
--
-- 跑之前可以先只读看一眼：
--   SELECT id, order_no, status, pay_amount, received_qty
--   FROM purchase_order WHERE id = 683;
--   SELECT id, goods_id, qty, remark FROM stock_flow
--   WHERE remark = 'purchase_order#683';

ALTER TABLE public.purchase_order
  ADD COLUMN IF NOT EXISTS received_qty numeric NOT NULL DEFAULT 0;

DO $$
DECLARE
  v_po public.purchase_order%ROWTYPE;
  v_before numeric;
  v_count integer;
  v_elem record;
  v_goods jsonb;
  v_found boolean := false;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.stock_flow
    WHERE type = 'procure_in' AND remark = 'purchase_order#683' AND goods_id = 856
  ) THEN
    RAISE NOTICE 'PO 683 已经有入库流水，跳过';
    RETURN;
  END IF;

  SELECT * INTO v_po
  FROM public.purchase_order
  WHERE id = 683 AND order_no = 'PO2026111513054946976' AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到采购单 683 / PO2026111513054946976';
  END IF;
  IF v_po.status IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION '采购单 683 不是已审核状态，停止';
  END IF;
  IF COALESCE(v_po.warehouse_id, 0) <> 189 THEN
    RAISE EXCEPTION '采购单 683 的仓库不是牧区纯坊门店(189)，停止';
  END IF;

  v_goods := COALESCE(v_po.goods_info, '[]'::jsonb);
  IF jsonb_typeof(v_goods) = 'string' THEN
    v_goods := (v_goods #>> '{}')::jsonb;
  END IF;
  FOR v_elem IN SELECT value AS item FROM jsonb_array_elements(v_goods)
  LOOP
    IF COALESCE((v_elem.item->>'goods_id')::integer, 0) = 856
       AND COALESCE((v_elem.item->>'num')::numeric, 0) = 10 THEN
      v_found := true;
    END IF;
  END LOOP;
  IF NOT v_found THEN
    RAISE EXCEPTION '采购单 683 的明细不是商品 856 × 10，停止';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.stock_inventory
  WHERE goods_id = 856 AND warehouse_id = 189 AND shop_id = v_po.shop_id;
  IF v_count > 1 THEN
    RAISE EXCEPTION '商品 856 在仓库 189 有多条库存，停止';
  END IF;

  IF v_count = 1 THEN
    SELECT COALESCE(qty, 0) INTO v_before
    FROM public.stock_inventory
    WHERE goods_id = 856 AND warehouse_id = 189 AND shop_id = v_po.shop_id
    FOR UPDATE;
    UPDATE public.stock_inventory
    SET qty = round(v_before + 10, 4), update_time = NOW()
    WHERE goods_id = 856 AND warehouse_id = 189 AND shop_id = v_po.shop_id;
  ELSE
    v_before := 0;
    INSERT INTO public.stock_inventory (
      goods_id, goods_name, goods_code, unit_name, warehouse_id, warehouse_name, qty, shop_id
    ) VALUES (
      856, '科尔沁/大奶豆腐', 'SP0000179', '张', 189, '牧区纯坊门店', 10, v_po.shop_id
    );
  END IF;

  INSERT INTO public.stock_flow (
    goods_id, goods_name, warehouse_id, warehouse_name, type, qty,
    before_qty, after_qty, order_no, remark, shop_id, admin_id, admin_name
  ) VALUES (
    856, '科尔沁/大奶豆腐', 189, '牧区纯坊门店', 'procure_in', 10,
    v_before, round(v_before + 10, 4), v_po.order_no, 'purchase_order#683',
    v_po.shop_id, COALESCE(v_po.admin_id, 0), COALESCE(v_po.admin_name, '')
  );

  UPDATE public.purchase_order
  SET received_qty = 10
  WHERE id = 683 AND shop_id = v_po.shop_id;

  RAISE NOTICE 'PO 683 已补入库 +10，未改付款';
END $$;
