BEGIN;

CREATE TEMP FUNCTION fix_goods_unit(items jsonb, target_goods_id integer, old_unit text, new_unit text)
RETURNS jsonb
LANGUAGE sql
AS $$
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN (elem->>'goods_id') ~ '^[0-9]+$'
          AND (elem->>'goods_id')::integer = target_goods_id
          AND elem->>'unit_name' = old_unit
        THEN jsonb_set(elem, '{unit_name}', to_jsonb(new_unit), true)
        ELSE elem
      END
      ORDER BY ord
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(COALESCE(items, '[]'::jsonb)) WITH ORDINALITY AS e(elem, ord);
$$;

-- 奶油球：箱和件都是 400 个，补齐单位换算，避免 15 箱被当成 15 个。
INSERT INTO public.goods_unit_convert (goods_id, unit_name, ratio)
SELECT 1010, '箱', 400
WHERE NOT EXISTS (
  SELECT 1 FROM public.goods_unit_convert
  WHERE goods_id = 1010 AND unit_name = '箱'
);

-- 茶包/类腰封纸：导入时单位写成 3009，实际基础单位是张。
UPDATE public.procure_inhouse
SET goods_info = fix_goods_unit(goods_info, 984, '3009', '张')
WHERE goods_info::text LIKE '%"goods_id": 984%'
  AND goods_info::text LIKE '%"unit_name": "3009"%';

UPDATE public.purchase_order
SET goods_info = fix_goods_unit(goods_info, 984, '3009', '张')
WHERE goods_info::text LIKE '%"goods_id": 984%'
  AND goods_info::text LIKE '%"unit_name": "3009"%';

UPDATE public.stock_inventory
SET unit_name = '张'
WHERE goods_id = 984 AND unit_name = '3009';

-- 糖/阿润：导入时单位写成 4030，实际基础单位是斤。
UPDATE public.procure_inhouse
SET goods_info = fix_goods_unit(goods_info, 859, '4030', '斤')
WHERE goods_info::text LIKE '%"goods_id": 859%'
  AND goods_info::text LIKE '%"unit_name": "4030"%';

UPDATE public.purchase_order
SET goods_info = fix_goods_unit(goods_info, 859, '4030', '斤')
WHERE goods_info::text LIKE '%"goods_id": 859%'
  AND goods_info::text LIKE '%"unit_name": "4030"%';

UPDATE public.stock_inventory
SET unit_name = '斤'
WHERE goods_id = 859 AND unit_name = '4030';

-- 礼盒/2026：销售合同明细误写成张，商品基础单位是个；出库单继承了合同明细。
UPDATE public.sale_contracts
SET goods_info = fix_goods_unit(goods_info, 836, '张', '个')
WHERE goods_info::text LIKE '%"goods_id": 836%'
  AND goods_info::text LIKE '%"unit_name": "张"%';

UPDATE public.sale_out_order
SET goods_info = fix_goods_unit(goods_info, 836, '张', '个')
WHERE goods_info::text LIKE '%"goods_id": 836%'
  AND goods_info::text LIKE '%"unit_name": "张"%';

COMMIT;
