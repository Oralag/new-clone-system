/**
 * 模糊匹配：输入的每个字符必须在 text 中按顺序出现（不要求连续）
 * 例：query="奶豆腐成品" 可匹配 "奶豆腐散装成品"
 */
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  let ti = 0
  for (let qi = 0; qi < q.length; qi++) {
    const idx = t.indexOf(q[qi], ti)
    if (idx === -1) return false
    ti = idx + 1
  }
  return true
}

/**
 * 商品模糊过滤 + 排序：
 * 规则1：成品（goods_type === 1）优先
 * 规则2：关键词在名称中出现位置越靠前越优先
 */
export function fuzzyFilterGoods<T extends { goods_name?: string; name?: string; goods_sn?: string; goods_type?: any }>(
  list: T[],
  query: string
): T[] {
  if (!query.trim()) return list
  const q = query.trim()
  const ql = q.toLowerCase()

  const filtered = list.filter(g =>
    fuzzyMatch(g.goods_name || g.name || '', q) ||
    fuzzyMatch(g.goods_sn || '', q)
  )

  return filtered.sort((a, b) => {
    const typeOrder = compareFinishedGoodsFirst(a, b)
    if (typeOrder !== 0) return typeOrder

    // 规则2：关键词在名称中首次匹配位置越靠前越优先
    const aName = (a.goods_name || a.name || '').toLowerCase()
    const bName = (b.goods_name || b.name || '').toLowerCase()
    const aPos = normalizeMatchPosition(aName.indexOf(ql[0]))
    const bPos = normalizeMatchPosition(bName.indexOf(ql[0]))
    return aPos - bPos
  })
}

export function compareFinishedGoodsFirst<T extends { goods_type?: any }>(a: T, b: T): number {
  const aType = Number(a.goods_type) === 1 ? 0 : 1
  const bType = Number(b.goods_type) === 1 ? 0 : 1
  return aType - bType
}

function normalizeMatchPosition(pos: number): number {
  return pos >= 0 ? pos : Number.MAX_SAFE_INTEGER
}
