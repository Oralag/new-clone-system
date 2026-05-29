import http from '@/api/http'

export interface StockItem {
  goods_id: number | string
  goods_name?: string
  num: number | string
  unit_ratio?: number  // 1销售单位 = unit_ratio 基础单位，默认1
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
    num: Math.round(Number(i.num) * (Number(i.unit_ratio) || 1) * 10000) / 10000,
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

async function annulOtherOutByMarker(marker: string): Promise<boolean> {
  const res = await http.get('/stock/OtherOut/index', { params: { list_rows: 1000 } })
  const rows: any[] = res.data?.rows ?? []
  const targets = rows.filter((r: any) => String(r.remark) === marker)
  if (!targets.length) return false
  for (const r of targets) {
    await http.post('/stock/OtherOut/annul', { id: r.id })
  }
  return true
}

export async function deleteRetailStockFlows(orderId: number): Promise<boolean> {
  return annulOtherOutByMarker(`零售出库#${orderId}`)
}

export async function deleteSaleOutStockFlows(orderId: number): Promise<boolean> {
  return annulOtherOutByMarker(`销售出库#${orderId}`)
}
