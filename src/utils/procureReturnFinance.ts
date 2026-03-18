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
