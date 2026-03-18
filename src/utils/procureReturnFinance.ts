type AnyRow = Record<string, any>

function toNumber(value: any) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function roundMoney(value: any) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100
}

function text(value: any) {
  return String(value ?? '').trim()
}

function parseMeta(goodsInfo: any): AnyRow {
  try {
    return (JSON.parse(goodsInfo || '[]') as AnyRow[]).find(item => item._meta) ?? {}
  } catch {
    return {}
  }
}

function parseItems(goodsInfo: any): AnyRow[] {
  try {
    return (JSON.parse(goodsInfo || '[]') as AnyRow[]).filter(item => !item._meta)
  } catch {
    return []
  }
}

export interface ProcureReturnFinanceRow {
  id: number
  supplier_key: string
  supplier_id: number
  supplier_name: string
  order_key: string
  order_id: number
  order_no: string
  return_amount: number
  deduct_amount: number
  refund_amount: number
  fund_id: number
  fund_name: string
  date: string
  remark: string
}

export interface ProcureRefundAllocationRow {
  refund_allocated: number
  net_amount: number
}

export function normalizeProcureReturnFinanceRows(
  rows: AnyRow[],
  fundNameMap?: Map<number, string>,
) {
  const list: ProcureReturnFinanceRow[] = []

  for (const row of rows || []) {
    if (Number(row.status) !== 1) continue

    const meta = parseMeta(row.goods_info)
    const items = parseItems(row.goods_info)
    const returnAmount = roundMoney(
      meta.total_amount ?? items.reduce((sum, item) => sum + toNumber(item.num) * toNumber(item.price), 0)
    )
    if (returnAmount <= 0) continue

    const unpaidSnapshot = Math.max(0, roundMoney(toNumber(meta.order_total_amount) - toNumber(meta.order_pay_amount)))
    const deductAmount = Math.min(returnAmount, unpaidSnapshot)
    const refundAmount = Math.max(0, roundMoney(returnAmount - deductAmount))
    const fundId = Number(meta.fund_id || row.fund_id || 0)

    list.push({
      id: Number(row.id || 0),
      supplier_key: row.supplier_id ? `id:${row.supplier_id}` : `name:${text(row.supplier_name)}`,
      supplier_id: Number(row.supplier_id || 0),
      supplier_name: text(row.supplier_name),
      order_key: meta.order_id ? `id:${meta.order_id}` : `no:${text(meta.order_sn || row.order_sn || row.order_no)}`,
      order_id: Number(meta.order_id || row.order_id || 0),
      order_no: text(meta.order_sn || row.order_sn || row.order_no),
      return_amount: returnAmount,
      deduct_amount: roundMoney(deductAmount),
      refund_amount: roundMoney(refundAmount),
      fund_id: fundId,
      fund_name: text(row.fund_name || row.account_name || fundNameMap?.get(fundId) || ''),
      date: text(row.return_date || row.create_time).slice(0, 10),
      remark: text(row.remark),
    })
  }

  return list
}

function aggregateReturns(returnRows: ProcureReturnFinanceRow[]) {
  const supplierMap = new Map<string, {
    return_amount: number
    deduct_amount: number
    refund_amount: number
  }>()
  const orderMap = new Map<string, {
    return_amount: number
    deduct_amount: number
    refund_amount: number
  }>()

  for (const row of returnRows) {
    const supplier = supplierMap.get(row.supplier_key) ?? { return_amount: 0, deduct_amount: 0, refund_amount: 0 }
    supplier.return_amount = roundMoney(supplier.return_amount + row.return_amount)
    supplier.deduct_amount = roundMoney(supplier.deduct_amount + row.deduct_amount)
    supplier.refund_amount = roundMoney(supplier.refund_amount + row.refund_amount)
    supplierMap.set(row.supplier_key, supplier)

    const order = orderMap.get(row.order_key) ?? { return_amount: 0, deduct_amount: 0, refund_amount: 0 }
    order.return_amount = roundMoney(order.return_amount + row.return_amount)
    order.deduct_amount = roundMoney(order.deduct_amount + row.deduct_amount)
    order.refund_amount = roundMoney(order.refund_amount + row.refund_amount)
    orderMap.set(row.order_key, order)
  }

  return { supplierMap, orderMap }
}

export function applyProcureReturnsToPayableRows(payableRows: AnyRow[], returnRows: ProcureReturnFinanceRow[]) {
  const { supplierMap, orderMap } = aggregateReturns(returnRows)

  return (payableRows || []).map((row) => {
    const supplierKey = row.supplier_id ? `id:${row.supplier_id}` : `name:${text(row.supplier_name)}`
    const supplierAgg = supplierMap.get(supplierKey) ?? { return_amount: 0, deduct_amount: 0, refund_amount: 0 }
    const baseOrderAmount = toNumber(row.order_amount || row.total_amount)
    const basePaidAmount = toNumber(row.paid_amount || row.pay_amount)
    const baseUnpaidAmount = row.un_pay_amount !== undefined && row.un_pay_amount !== null && row.un_pay_amount !== ''
      ? toNumber(row.un_pay_amount)
      : Math.max(0, roundMoney(baseOrderAmount - basePaidAmount))

    const orders = Array.isArray(row.orders)
      ? row.orders.map((order: AnyRow) => {
        const orderKey = order.order_id ? `id:${order.order_id}` : `no:${text(order.order_no || order.order_sn)}`
        const orderAgg = orderMap.get(orderKey) ?? { return_amount: 0, deduct_amount: 0, refund_amount: 0 }
        const orderAmount = toNumber(order.order_amount || order.total_amount)
        const paidAmount = toNumber(order.paid_amount || order.pay_amount)
        const unpaidAmount = order.un_pay_amount !== undefined && order.un_pay_amount !== null && order.un_pay_amount !== ''
          ? toNumber(order.un_pay_amount)
          : Math.max(0, roundMoney(orderAmount - paidAmount))

        return {
          ...order,
          order_amount: Math.max(0, roundMoney(orderAmount - orderAgg.return_amount)),
          paid_amount: Math.max(0, roundMoney(paidAmount - orderAgg.refund_amount)),
          un_pay_amount: Math.max(0, roundMoney(unpaidAmount - orderAgg.deduct_amount)),
          return_amount: roundMoney(orderAgg.return_amount),
        }
      })
      : row.orders

    return {
      ...row,
      order_amount: Math.max(0, roundMoney(baseOrderAmount - supplierAgg.return_amount)),
      paid_amount: Math.max(0, roundMoney(basePaidAmount - supplierAgg.refund_amount)),
      un_pay_amount: Math.max(0, roundMoney(baseUnpaidAmount - supplierAgg.deduct_amount)),
      return_amount: roundMoney(supplierAgg.return_amount),
      orders,
    }
  })
}

function getOrderRefundMap(returnRows: ProcureReturnFinanceRow[]) {
  const map = new Map<string, number>()
  for (const row of returnRows) {
    if (row.refund_amount <= 0) continue
    const current = map.get(row.order_key) || 0
    map.set(row.order_key, roundMoney(current + row.refund_amount))
  }
  return map
}

function getSupplierRefundMap(returnRows: ProcureReturnFinanceRow[]) {
  const map = new Map<string, number>()
  for (const row of returnRows) {
    if (row.refund_amount <= 0) continue
    const current = map.get(row.supplier_key) || 0
    map.set(row.supplier_key, roundMoney(current + row.refund_amount))
  }
  return map
}

export function applyProcureReturnsToPayReceiptRows(paymentRows: AnyRow[], returnRows: ProcureReturnFinanceRow[]) {
  const rows = (paymentRows || []).map((row) => ({ ...row }))
  const result: Array<AnyRow & ProcureRefundAllocationRow> = rows.map((row) => ({
    ...row,
    refund_allocated: 0,
    net_amount: roundMoney(row.amount),
  }))

  const supplierRefundMap = getSupplierRefundMap(returnRows)
  const orderRefundMap = getOrderRefundMap(returnRows)
  const getSupplierKey = (row: AnyRow) => (
    row.contact_id
      ? `id:${row.contact_id}`
      : row.supplier_id
        ? `id:${row.supplier_id}`
        : `name:${text(row.contact_name || row.supplier_name)}`
  )

  const allocate = (index: number, amount: number) => {
    const current = result[index]
    const rawAmount = toNumber(current.amount)
    const available = Math.max(0, roundMoney(rawAmount - current.refund_allocated))
    if (available <= 0 || amount <= 0) return 0
    const used = Math.min(available, amount)
    current.refund_allocated = roundMoney(current.refund_allocated + used)
    current.net_amount = Math.max(0, roundMoney(rawAmount - current.refund_allocated))
    return used
  }

  // 1) 优先按采购单号匹配退款到付款记录
  for (let index = 0; index < result.length; index++) {
    const row = result[index]
    if (String(row.contact_type || '') !== 'supplier') continue
    const orderNo = text(row.order_sn || row.order_no || row.receipt_no)
    if (!orderNo) continue
    const orderKey = `no:${orderNo}`
    const remain = orderRefundMap.get(orderKey) || 0
    if (remain <= 0) continue
    const used = allocate(index, remain)
    orderRefundMap.set(orderKey, Math.max(0, roundMoney(remain - used)))
    if (used > 0) {
      const supplierKey = getSupplierKey(row)
      supplierRefundMap.set(supplierKey, Math.max(0, roundMoney((supplierRefundMap.get(supplierKey) || 0) - used)))
    }
  }

  // 2) 剩余退款按供应商分摊到最近的供应商付款
  const supplierIndexes = new Map<string, number[]>()
  result.forEach((row, index) => {
    if (String(row.contact_type || '') !== 'supplier') return
    const supplierKey = getSupplierKey(row)
    const list = supplierIndexes.get(supplierKey) || []
    list.push(index)
    supplierIndexes.set(supplierKey, list)
  })

  for (const indexes of supplierIndexes.values()) {
    indexes.sort((a, b) => {
      const aDate = text(result[a].pay_date || result[a].create_time)
      const bDate = text(result[b].pay_date || result[b].create_time)
      return bDate.localeCompare(aDate)
    })
  }

  for (const [supplierKey, indexes] of supplierIndexes.entries()) {
    let remain = supplierRefundMap.get(supplierKey) || 0
    if (remain <= 0) continue

    for (const index of indexes) {
      if (remain <= 0) break
      const used = allocate(index, remain)
      remain = Math.max(0, roundMoney(remain - used))
    }
  }

  return result
}

export function applyProcureReturnsToFundRows(fundRows: AnyRow[], returnRows: ProcureReturnFinanceRow[]) {
  const refundByFundId = new Map<number, number>()
  const refundByFundNameOnly = new Map<string, number>()

  for (const row of returnRows) {
    const refundAmount = roundMoney(row.refund_amount)
    if (refundAmount <= 0) continue

    const fundId = Number(row.fund_id || 0)
    const fundName = text(row.fund_name)

    if (fundId > 0) {
      refundByFundId.set(fundId, roundMoney((refundByFundId.get(fundId) || 0) + refundAmount))
    } else if (fundName) {
      refundByFundNameOnly.set(fundName, roundMoney((refundByFundNameOnly.get(fundName) || 0) + refundAmount))
    }
  }

  return (fundRows || []).map((row) => {
    const rawBalance = roundMoney(toNumber(row.balance))
    const fundId = Number(row.id || 0)
    const fundName = text(row.name)
    const refundById = fundId > 0 ? (refundByFundId.get(fundId) || 0) : 0
    const refundByName = fundName ? (refundByFundNameOnly.get(fundName) || 0) : 0
    const refundAmount = roundMoney(refundById + refundByName)

    return {
      ...row,
      raw_balance: rawBalance,
      refund_amount: refundAmount,
      display_balance: roundMoney(rawBalance + refundAmount),
    }
  })
}
