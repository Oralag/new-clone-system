/**
 * 商品零售价（展示用）：销售合同明细只存成交价（客户等级价），零售价按商品档案现取。
 * 商品档案的 sell_price 是基础单位价，明细换算单位时按 unit_ratio 折算，与成交价口径一致。
 */
export type RetailPriceMap = Map<number, number>

export function buildRetailPriceMap(goodsRows: any[]): RetailPriceMap {
  const map: RetailPriceMap = new Map()
  for (const g of goodsRows || []) {
    const id = Number(g?.id || 0)
    const price = Number(g?.sell_price ?? g?.sale_price ?? g?.price)
    if (id && price > 0) map.set(id, price)
  }
  return map
}

/** 明细行的零售价；查不到返回 null（界面显示 —） */
export function retailPriceOf(item: any, map: RetailPriceMap): number | null {
  const base = map.get(Number(item?.goods_id || 0))
  if (!base) return null
  const ratio = Number(item?.unit_ratio) > 0 ? Number(item.unit_ratio) : 1
  return Number((base * ratio).toFixed(4))
}
