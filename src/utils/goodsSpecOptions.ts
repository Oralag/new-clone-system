// 单据明细「规格型号」下拉的选项：只取该商品自己的规格。
// 注意：/goods/ShopSpec/index 是全店共用的规格模板表，后端不按 goods_id 过滤，
// 不能拿它当某个商品的规格（否则每个商品都会冒出「原味/甜味」等别的商品的规格）。
// 多规格商品的规格存在 goods.spec 的 JSON 里：{ attrs: [{name, values}], skus: {...} }
export function parseGoodsSpecOptions(spec: string | undefined | null): string[] {
  const s = String(spec ?? '').trim()
  if (!s.startsWith('{')) return []
  try {
    const attrs: any[] = (JSON.parse(s).attrs ?? []).filter((a: any) => Array.isArray(a?.values) && a.values.length > 0)
    if (!attrs.length) return []
    if (attrs.length === 1) return [...new Set(attrs[0].values.map((v: any) => String(v).trim()).filter(Boolean))] as string[]
    // 多个属性（如 口味×重量）→ 组合成「原味 · 250克」
    let combos: string[] = ['']
    for (const a of attrs) {
      const vals = a.values.map((v: any) => String(v).trim()).filter(Boolean)
      combos = combos.flatMap(c => vals.map((v: string) => (c ? `${c} · ${v}` : v)))
    }
    return combos
  } catch {
    return []
  }
}

