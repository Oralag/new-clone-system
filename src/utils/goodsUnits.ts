import http from '@/api/http'
import { getUnitConvert } from '@/api/goods'

export interface UnitRow { unit_name: string; ratio: number }

// 整理单位换算行：基础单位永远排第一且 ratio=1；去掉重名；
// 换算表里没有基础单位时，ratio=1 的那行是改基础单位前留下的旧基础行，丢掉。
export function normalizeUnitRows(rows: any[], baseUnitName: string): UnitRow[] {
  const base = String(baseUnitName || '').trim()
  const list = (Array.isArray(rows) ? rows : [])
    .map(r => ({ unit_name: String(r?.unit_name || '').trim(), ratio: Number(r?.ratio) }))
    .filter(r => r.unit_name && r.ratio > 0)
  if (!base) {
    const seen = new Set<string>()
    return list.filter(r => !seen.has(r.unit_name) && seen.add(r.unit_name))
  }
  const hasBase = list.some(r => r.unit_name === base)
  const out: UnitRow[] = [{ unit_name: base, ratio: 1 }]
  const seen = new Set<string>([base])
  // 同名多行时优先保留 ratio≠1 的（ratio=1 那行多半是旧基础行）
  const sorted = [...list].sort((a, b) => Number(a.ratio === 1) - Number(b.ratio === 1))
  for (const r of sorted) {
    if (seen.has(r.unit_name)) continue
    if (!hasBase && r.ratio === 1) continue
    seen.add(r.unit_name)
    out.push(r)
  }
  // 保持原来的顺序（基础单位在首位）
  const order = new Map(list.map((r, i) => [r.unit_name, i]))
  return [out[0], ...out.slice(1).sort((a, b) => (order.get(a.unit_name) ?? 0) - (order.get(b.unit_name) ?? 0))]
}

const baseUnitCache: Record<number, Promise<string>> = {}
export function getGoodsBaseUnit(goodsId: number): Promise<string> {
  if (!baseUnitCache[goodsId]) {
    baseUnitCache[goodsId] = http.get('/goods/ShopGoods/detail', { params: { id: goodsId } })
      .then((res: any) => String(res?.data?.unit_name || '').trim())
      .catch(() => { delete baseUnitCache[goodsId]; return '' })
  }
  return baseUnitCache[goodsId]
}

// 读商品的单位换算（基础单位取商品档案，不信单据行上的单位）
export async function loadGoodsUnitRows(goodsId: number, fallbackBaseUnit = ''): Promise<UnitRow[]> {
  const [res, base] = await Promise.all([getUnitConvert(goodsId), getGoodsBaseUnit(goodsId)])
  const rows: any[] = (res as any)?.data?.rows ?? (res as any)?.data ?? []
  return normalizeUnitRows(rows, base || fallbackBaseUnit)
}
