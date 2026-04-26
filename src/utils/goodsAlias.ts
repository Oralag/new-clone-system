export const NAIDOUFU_CANONICAL = {
  id: 884,
  goods_sn: 'SP0000151',
  goods_name: '实惠/奶豆腐',
  unit_name: '个',
  cost_price: 12,
}

function compact(value: any): string {
  return String(value ?? '').trim().replace(/\s+/g, '')
}

export function isNaiDoufuAliasName(name: any): boolean {
  const text = compact(name)
  return text === '奶豆腐' || text === '实惠奶豆腐' || text === '实惠/奶豆腐'
}

export function itemAliasName(item: any): string {
  return String(item?.goods_name ?? item?.name ?? item?.product_name ?? item?.title ?? '').trim()
}

export function itemAliasSn(item: any): string {
  return String(item?.goods_sn ?? item?.sn ?? item?.goods_code ?? item?.code ?? item?.barcode ?? '').trim()
}

export function findNaiDoufuGoods(item: any, goodsList: any[]): any | null {
  const sn = itemAliasSn(item)
  const name = itemAliasName(item)
  if (sn !== NAIDOUFU_CANONICAL.goods_sn && !isNaiDoufuAliasName(name)) return null
  return goodsList.find(g => Number(g.id) === NAIDOUFU_CANONICAL.id)
    || goodsList.find(g => String(g.goods_sn || '').trim() === NAIDOUFU_CANONICAL.goods_sn)
    || goodsList.find(g => compact(g.goods_name) === compact(NAIDOUFU_CANONICAL.goods_name))
    || null
}
