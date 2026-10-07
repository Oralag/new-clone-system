// 合并同款：主商品 goods.spec 的 skus 里某个规格挂了别的商品（goods_id），那个商品就「并入」了主商品。
// 被并入的商品库存/单据照旧，只是在商品列表、收银台里折叠到主商品下面。
import { specMeta } from './goodsSpec'

export interface MergeIndex {
  /** 被并入的商品 id → 主商品 + 它在主商品里的规格名 */
  parentOf: Map<number, { parentId: number; parentName: string; label: string }>
  /** 主商品 id → 并入的规格（不含本商品自己那一项） */
  childrenOf: Map<number, { id: number; label: string }[]>
}

export function buildMergeIndex(rows: any[]): MergeIndex {
  const parentOf: MergeIndex['parentOf'] = new Map()
  const childrenOf: MergeIndex['childrenOf'] = new Map()
  const alive = new Set(rows.map(r => Number(r.id)))
  for (const g of rows) {
    const pid = Number(g.id)
    const skus = specMeta(g.spec).skus
    if (!skus || typeof skus !== 'object') continue
    for (const [key, sku] of Object.entries<any>(skus)) {
      const cid = Number(sku?.goods_id) || 0
      if (!cid || cid === pid || !alive.has(cid) || parentOf.has(cid)) continue
      parentOf.set(cid, { parentId: pid, parentName: g.goods_name || '', label: key.split('|').join(' / ') })
      if (!childrenOf.has(pid)) childrenOf.set(pid, [])
      childrenOf.get(pid)!.push({ id: cid, label: key.split('|').join(' / ') })
    }
  }
  return { parentOf, childrenOf }
}

/**
 * 列表折叠：去掉被并入的商品；搜到的是被并入商品时换成它的主商品（不重复）。
 * allRows 用来找主商品那一行。
 */
export function foldMergedRows(rows: any[], index: MergeIndex, allRows: any[]): any[] {
  const byId = new Map(allRows.map(r => [Number(r.id), r]))
  const out: any[] = []
  const seen = new Set<number>()
  for (const r of rows) {
    const p = index.parentOf.get(Number(r.id))
    const row = p ? byId.get(p.parentId) : r
    if (!row || seen.has(Number(row.id))) continue
    seen.add(Number(row.id))
    out.push(row)
  }
  return out
}
