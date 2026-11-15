/**
 * 采购单审核的唯一写入入口。函数体在 PostgreSQL 里是一个事务：
 * 任何 RAISE 都会回滚库存、流水、付款和状态。
 * 不写入 procure_inhouse，历史入库单保持原样。
 */
export const INSTALL_PURCHASE_AUDIT_SQL = `
ALTER TABLE public.purchase_order
  ADD COLUMN IF NOT EXISTS received_qty numeric NOT NULL DEFAULT 0;
`

export const AUDIT_PURCHASE_ORDER_SQL = `
CREATE OR REPLACE FUNCTION public.audit_purchase_order(
  p_id integer,
  p_status integer,
  p_shop_id integer,
  p_admin_id integer
) RETURNS jsonb
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_po public.purchase_order%ROWTYPE;
  v_goods jsonb;
  v_elem record;
  v_map jsonb := '{}'::jsonb;
  v_key text;
  v_line jsonb;
  v_gid integer;
  v_num numeric;
  v_ratio numeric;
  v_base numeric;
  v_total numeric := 0;
  v_wh integer;
  v_before numeric;
  v_after numeric;
  v_inv_count integer;
  v_unit text;
  v_goods_name text;
  v_goods_sn text;
  v_has_stock boolean;
  v_marker text;
  v_main_count integer;
  v_amount numeric;
  v_flow public.stock_flow%ROWTYPE;
  v_rec public.pay_receipt%ROWTYPE;
  v_order_sn text;
  v_changed boolean := false;
BEGIN
  IF p_status IS NULL OR p_status NOT IN (0, 1) THEN
    RAISE EXCEPTION 'status必须是0或1';
  END IF;

  SELECT * INTO v_po
  FROM public.purchase_order
  WHERE id = p_id AND shop_id = p_shop_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION '单据不存在';
  END IF;

  v_marker := '(采购单(自动)?付款|Purchase Order Payment|采购单据支出|Purchase Document Expense|采购运费|Purchase Freight|采购附加费用|Purchase Addon Fee)[[:space:]]*#'
    || p_id::text || '([^0-9]|$)';

  SELECT EXISTS (
    SELECT 1 FROM public.stock_flow
    WHERE shop_id = p_shop_id
      AND type = 'procure_in'
      AND remark = 'purchase_order#' || p_id::text
  ) INTO v_has_stock;

  -- 已经审核过的单子再请求一次：不入库、不付款、不改状态。
  IF p_status = 1 AND v_po.status = 1 THEN
    RETURN jsonb_build_object(
      'ok', true,
      'changed', false,
      'already', true,
      'received_qty', COALESCE(v_po.received_qty, 0)
    );
  END IF;

  IF p_status = 0 AND v_po.status = 0 AND NOT v_has_stock THEN
    RETURN jsonb_build_object(
      'ok', true,
      'changed', false,
      'already', true,
      'received_qty', COALESCE(v_po.received_qty, 0)
    );
  END IF;

  IF p_status = 1 THEN
    v_wh := COALESCE(v_po.warehouse_id, 0);
    IF v_wh <= 0 THEN
      RAISE EXCEPTION '请选择入库仓库';
    END IF;
    v_amount := COALESCE(v_po.pay_amount, 0);
    IF v_amount > 0 AND COALESCE(v_po.fund_id, 0) <= 0 THEN
      RAISE EXCEPTION '请先在采购单中选择资金账户再审核';
    END IF;

    v_goods := COALESCE(v_po.goods_info, '[]'::jsonb);
    IF jsonb_typeof(v_goods) = 'string' THEN
      v_goods := (v_goods #>> '{}')::jsonb;
    END IF;
    IF jsonb_typeof(v_goods) IS DISTINCT FROM 'array' THEN
      v_goods := '[]'::jsonb;
    END IF;

    FOR v_elem IN SELECT value AS item FROM jsonb_array_elements(v_goods)
    LOOP
      v_gid := COALESCE((v_elem.item->>'goods_id')::integer, 0);
      v_num := COALESCE((v_elem.item->>'num')::numeric, 0);
      v_ratio := COALESCE((v_elem.item->>'unit_ratio')::numeric, 1);
      IF v_ratio <= 0 THEN
        v_ratio := 1;
      END IF;
      IF v_gid <= 0 OR v_num <= 0 THEN
        CONTINUE;
      END IF;
      v_base := round(v_num * v_ratio, 4);
      v_key := v_gid::text;
      IF v_map ? v_key THEN
        v_map := jsonb_set(
          v_map,
          ARRAY[v_key, 'qty'],
          to_jsonb(round(((v_map->v_key->>'qty')::numeric + v_base), 4))
        );
      ELSE
        v_map := v_map || jsonb_build_object(v_key, jsonb_build_object(
          'qty', v_base,
          'goods_name', COALESCE(v_elem.item->>'goods_name', ''),
          'goods_sn', COALESCE(v_elem.item->>'goods_sn', ''),
          'unit_name', COALESCE(v_elem.item->>'unit_name', '')
        ));
      END IF;
      v_total := v_total + v_base;
    END LOOP;

    IF v_total <= 0 THEN
      RAISE EXCEPTION '采购明细里没有可入库的商品';
    END IF;

    -- 同一张采购单只入库一次。标记还在时不再加库存。
    IF NOT v_has_stock THEN
      FOR v_key, v_line IN
        SELECT key, value FROM jsonb_each(v_map) ORDER BY key::integer
      LOOP
        v_gid := v_key::integer;
        v_base := (v_line->>'qty')::numeric;
        v_goods_name := COALESCE(v_line->>'goods_name', '');
        v_goods_sn := COALESCE(v_line->>'goods_sn', '');

        SELECT count(*) INTO v_inv_count
        FROM public.stock_inventory
        WHERE goods_id = v_gid AND warehouse_id = v_wh AND shop_id = p_shop_id;
        IF v_inv_count > 1 THEN
          RAISE EXCEPTION '同一商品仓库存在重复库存记录，请先核对';
        END IF;

        SELECT unit_name INTO v_unit FROM public.goods WHERE id = v_gid LIMIT 1;
        IF v_unit IS NULL OR v_unit = '' THEN
          v_unit := COALESCE(v_line->>'unit_name', '');
        END IF;

        IF v_inv_count = 1 THEN
          SELECT COALESCE(qty, 0) INTO v_before
          FROM public.stock_inventory
          WHERE goods_id = v_gid AND warehouse_id = v_wh AND shop_id = p_shop_id
          FOR UPDATE;
          v_after := round(v_before + v_base, 4);
          UPDATE public.stock_inventory
          SET qty = v_after,
              goods_name = COALESCE(NULLIF(v_goods_name, ''), goods_name),
              unit_name = COALESCE(NULLIF(v_unit, ''), unit_name),
              update_time = NOW()
          WHERE goods_id = v_gid AND warehouse_id = v_wh AND shop_id = p_shop_id;
        ELSE
          v_before := 0;
          v_after := v_base;
          INSERT INTO public.stock_inventory (
            goods_id, goods_name, goods_code, unit_name, warehouse_id, warehouse_name, qty, shop_id
          ) VALUES (
            v_gid, v_goods_name, v_goods_sn, v_unit, v_wh, COALESCE(v_po.warehouse_name, ''), v_after, p_shop_id
          );
        END IF;

        INSERT INTO public.stock_flow (
          goods_id, goods_name, warehouse_id, warehouse_name, type, qty,
          before_qty, after_qty, order_no, remark, shop_id, admin_id, admin_name
        ) VALUES (
          v_gid, v_goods_name, v_wh, COALESCE(v_po.warehouse_name, ''), 'procure_in', v_base,
          v_before, v_after, COALESCE(v_po.order_no, v_po.order_sn, ''),
          'purchase_order#' || p_id::text, p_shop_id, COALESCE(p_admin_id, 0), COALESCE(v_po.admin_name, '')
        );
      END LOOP;
      v_changed := true;
    END IF;

    IF v_amount > 0 THEN
      SELECT count(*) INTO v_main_count
      FROM public.pay_receipt
      WHERE shop_id = p_shop_id
        AND deleted_at IS NULL
        AND (
          (order_sn <> '' AND order_sn = ANY(ARRAY[COALESCE(v_po.order_no, ''), COALESCE(v_po.order_sn, '')]))
          OR remark ~ v_marker
        )
        AND COALESCE(remark, '') !~ '(附加费用|Addon Fee|运费|Freight|单据支出|Document Expense)';
      IF v_main_count = 0 THEN
        UPDATE public.finance_funds
        SET balance = COALESCE(balance, 0) - v_amount, update_time = NOW()
        WHERE id = v_po.fund_id AND shop_id = p_shop_id AND deleted_at IS NULL;
        IF NOT FOUND THEN
          RAISE EXCEPTION '资金账户不存在或不属于当前公司';
        END IF;
        v_order_sn := COALESCE(NULLIF(v_po.order_no, ''), NULLIF(v_po.order_sn, ''), '');
        INSERT INTO public.pay_receipt (
          receipt_no, order_sn, contact_type, contact_name, amount, pay_date,
          fund_id, fund_name, remark, status, shop_id, admin_id
        ) VALUES (
          'FK' || (floor(extract(epoch FROM clock_timestamp()) * 1000))::bigint || p_id::text,
          v_order_sn, 'supplier', COALESCE(v_po.supplier_name, ''), v_amount,
          COALESCE(v_po.order_date, CURRENT_DATE),
          v_po.fund_id, COALESCE(v_po.fund_name, ''),
          '采购单付款 #' || p_id::text, 1, p_shop_id, COALESCE(p_admin_id, 0)
        );
        v_changed := true;
      END IF;
    END IF;

    UPDATE public.purchase_order
    SET status = 1,
        received_qty = CASE WHEN v_has_stock THEN received_qty ELSE v_total END
    WHERE id = p_id AND shop_id = p_shop_id;
    v_changed := true;

    RETURN jsonb_build_object(
      'ok', true,
      'changed', v_changed,
      'already', false,
      'received_qty', CASE WHEN v_has_stock THEN COALESCE(v_po.received_qty, 0) ELSE v_total END
    );
  END IF;

  -- 反审核：删掉这张采购单自己的入库流水，并把付款按原账户退回。不改历史采购入库单。
  FOR v_flow IN
    SELECT * FROM public.stock_flow
    WHERE shop_id = p_shop_id AND type = 'procure_in' AND remark = 'purchase_order#' || p_id::text
    ORDER BY goods_id, id
    FOR UPDATE
  LOOP
    SELECT count(*) INTO v_inv_count
    FROM public.stock_inventory
    WHERE goods_id = v_flow.goods_id AND warehouse_id = v_flow.warehouse_id AND shop_id = p_shop_id;
    IF v_inv_count <> 1 THEN
      RAISE EXCEPTION '找不到对应库存记录，无法安全反审核';
    END IF;
    UPDATE public.stock_inventory
    SET qty = round(COALESCE(qty, 0) - v_flow.qty, 4), update_time = NOW()
    WHERE goods_id = v_flow.goods_id AND warehouse_id = v_flow.warehouse_id AND shop_id = p_shop_id;
    DELETE FROM public.stock_flow WHERE id = v_flow.id AND shop_id = p_shop_id;
    v_changed := true;
  END LOOP;

  FOR v_rec IN
    SELECT * FROM public.pay_receipt
    WHERE shop_id = p_shop_id
      AND deleted_at IS NULL
      AND (
        (order_sn <> '' AND order_sn = ANY(ARRAY[COALESCE(v_po.order_no, ''), COALESCE(v_po.order_sn, '')]))
        OR remark ~ v_marker
      )
    ORDER BY id
    FOR UPDATE
  LOOP
    IF COALESCE(v_rec.fund_id, 0) > 0 AND COALESCE(v_rec.status, 0) = 1 THEN
      UPDATE public.finance_funds
      SET balance = COALESCE(balance, 0) + v_rec.amount, update_time = NOW()
      WHERE id = v_rec.fund_id AND shop_id = p_shop_id AND deleted_at IS NULL;
      IF NOT FOUND THEN
        RAISE EXCEPTION '资金账户不存在或不属于当前公司';
      END IF;
    END IF;
    UPDATE public.pay_receipt SET deleted_at = NOW() WHERE id = v_rec.id AND shop_id = p_shop_id;
    v_changed := true;
  END LOOP;

  UPDATE public.purchase_order
  SET status = 0, received_qty = 0
  WHERE id = p_id AND shop_id = p_shop_id;

  RETURN jsonb_build_object('ok', true, 'changed', true, 'already', false, 'received_qty', 0);
END;
$fn$;
`
