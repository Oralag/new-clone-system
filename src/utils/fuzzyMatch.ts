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
 * 商品模糊过滤：同时匹配商品名称和商品编码
 */
export function fuzzyFilterGoods<T extends { goods_name?: string; name?: string; goods_sn?: string }>(
  list: T[],
  query: string
): T[] {
  if (!query.trim()) return list
  const q = query.trim()
  return list.filter(g =>
    fuzzyMatch(g.goods_name || g.name || '', q) ||
    fuzzyMatch(g.goods_sn || '', q)
  )
}
