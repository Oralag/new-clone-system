import http from '@/api/http'

export interface StockItem {
  goods_id: number | string
  goods_name?: string
  num: number | string
}

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
  const flowId = addRes.data?.id
  if (!flowId) throw new Error('创建出入库单失败')
  await http.post(`${endpoint}/audit`, { id: flowId, status: 1 })
}

// 反审核时删除原始 OtherOut 流水（根据 remark 标记 "零售出库#orderId"）
// 先反审核（恢复库存）再删除（清除流水），不产生任何新流水
export async function deleteRetailStockFlows(orderId: number): Promise<boolean> {
  const marker = `零售出库#${orderId}`
  const res = await http.get('/stock/OtherOut/index', { params: { list_rows: 1000 } })
  const rows: any[] = res.data?.rows ?? []
  const targets = rows.filter((r: any) => String(r.remark) === marker)
  if (!targets.length) return false
  for (const r of targets) {
    if (Number(r.status) === 1) {
      try { await http.post('/stock/OtherOut/audit', { id: r.id, status: 0 }) } catch { /* ignore */ }
    }
    await http.post('/stock/OtherOut/del', { id: r.id })
  }
  return true
}
