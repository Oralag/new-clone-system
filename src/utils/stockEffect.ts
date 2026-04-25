import http from '@/api/http'

export interface StockItem {
  goods_id: number | string
  goods_name?: string
  num: number | string
}

/**
 * Mutate stock via OtherOut (deduct) or OtherIn (restore).
 * Replaces the broken StockAll/edit pattern across the codebase.
 */
export async function stockEffect(
  items: StockItem[],
  mode: 'deduct' | 'restore',
  warehouseId?: number,
  remark?: string
): Promise<void> {
  const validItems = items.filter(i => i.goods_id && Number(i.num) > 0)
  if (!validItems.length) return

  let whId = warehouseId
  if (!whId) {
    const whRes = await http.get('/stock/WarehouseName/index', { params: { list_rows: 1 } })
    whId = whRes.data?.rows?.[0]?.id
    if (!whId) throw new Error('找不到仓库')
  }

  const goodsInfo = validItems.map(i => ({
    goods_id: Number(i.goods_id),
    num: Number(i.num),
    goods_name: i.goods_name || '',
  }))

  const endpoint = mode === 'deduct' ? '/stock/OtherOut' : '/stock/OtherIn'
  const addRes = await http.post(`${endpoint}/add`, {
    warehouse_id: whId,
    goods_info: goodsInfo,
    remark: remark || (mode === 'deduct' ? '出库' : '入库'),
  })
  const orderId = addRes.data?.id
  if (!orderId) throw new Error('创建出入库单失败')
  await http.post(`${endpoint}/audit`, { id: orderId, status: 1 })
}
