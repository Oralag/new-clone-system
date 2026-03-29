import { fmtDt } from './date'

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

export interface SaleReturnFinanceRow {
  id: number
  customer_key: string
  customer_id: number
  customer_name: string
  order_key: string
  order_no: string
  return_amount: number
  date: string
  remark: string
}

export interface SaleReturnSettlementRow extends SaleReturnFinanceRow {
  deduct_amount: number
  refund_amount: number
}

export interface SaleReturnRefundAllocationRow {
  refund_allocated: number
  net_amount: number
}

export function normalizeSaleReturnFinanceRows(rows: AnyRow[]) {
  const list: SaleReturnFinanceRow[] = []

  for (const row of rows || []) {
    if (Number(row.status) !== 1) continue

    const returnAmount = roundMoney(row.return_amount ?? row.total_amount)
    if (returnAmount <= 0) continue

    const orderNo = text(row.order_sn || row.order_no)

    list.push({
      id: Number(row.id || 0),
      customer_key: row.customer_id ? `id:${row.customer_id}` : `name:${text(row.customer_name)}`,
      customer_id: Number(row.customer_id || 0),
      customer_name: text(row.customer_name),
      order_key: orderNo ? `no:${orderNo}` : `return:${row.id || Math.random()}`,
      order_no: orderNo,
      return_amount: returnAmount,
      date: fmtDt(text(row.return_date || row.create_time)),
      remark: text(row.remark || row.reason),
    })
  }

  return list
}

function aggregateReturns(returnRows: SaleReturnFinanceRow[]) {
  const orderMap = new Map<string, SaleReturnFinanceRow & { return_amount: number }>()

  for (const row of returnRows) {
    const current = orderMap.get(row.order_key)
    if (current) {
      current.return_amount = roundMoney(current.return_amount + row.return_amount)
      if (row.date > current.date) current.date = row.date
      if (!current.remark && row.remark) current.remark = row.remark
      if (!current.customer_name && row.customer_name) current.customer_name = row.customer_name
    } else {
      orderMap.set(row.order_key, { ...row })
    }
  }

  return Array.from(orderMap.values())
}

function getReceivableOrderKey(row: AnyRow) {
  const orderNo = text(row.order_sn || row.order_no)
  return orderNo ? `no:${orderNo}` : ''
}

export function buildSaleReturnSettlementRows(receivableRows: AnyRow[], returnRows: SaleReturnFinanceRow[]) {
  const receivableMap = new Map<string, AnyRow>()
  for (const row of receivableRows || []) {
    const orderKey = getReceivableOrderKey(row)
    if (orderKey) receivableMap.set(orderKey, row)
  }

  return aggregateReturns(returnRows).map((row) => {
    const receivable = receivableMap.get(row.order_key)
    const orderAmount = toNumber(receivable?.total_amount || receivable?.amount)
    const paidAmount = toNumber(receivable?.paid_amount)
    const unpaidAmount = receivable
      ? (
        receivable.un_pay_amount !== undefined && receivable.un_pay_amount !== null && receivable.un_pay_amount !== ''
          ? toNumber(receivable.un_pay_amount)
          : Math.max(0, roundMoney(orderAmount - paidAmount))
      )
      : 0

    const deductAmount = Math.min(row.return_amount, unpaidAmount)
    const refundAmount = Math.max(0, roundMoney(row.return_amount - deductAmount))

    return {
      ...row,
      deduct_amount: roundMoney(deductAmount),
      refund_amount: roundMoney(refundAmount),
    }
  })
}

export function applySaleReturnsToReceivableRows(receivableRows: AnyRow[], returnRows: SaleReturnFinanceRow[]) {
  const settlementMap = new Map(
    buildSaleReturnSettlementRows(receivableRows, returnRows).map((row) => [row.order_key, row])
  )

  return (receivableRows || []).map((row) => {
    const orderKey = getReceivableOrderKey(row)
    const saleReturn = settlementMap.get(orderKey)
    const returnAmount = roundMoney(saleReturn?.return_amount || 0)
    const refundAmount = roundMoney(saleReturn?.refund_amount || 0)
    const deductAmount = roundMoney(saleReturn?.deduct_amount || 0)
    const totalAmount = toNumber(row.total_amount || row.amount)
    const paidAmount = toNumber(row.paid_amount)
    const unpaidAmount = row.un_pay_amount !== undefined && row.un_pay_amount !== null && row.un_pay_amount !== ''
      ? toNumber(row.un_pay_amount)
      : Math.max(0, roundMoney(totalAmount - paidAmount))

    return {
      ...row,
      total_amount: Math.max(0, roundMoney(totalAmount - returnAmount)),
      paid_amount: Math.max(0, roundMoney(paidAmount - refundAmount)),
      un_pay_amount: Math.max(0, roundMoney(unpaidAmount - deductAmount)),
      return_amount: returnAmount,
      refund_amount: refundAmount,
    }
  })
}

function getOrderRefundMap(settlementRows: SaleReturnSettlementRow[]) {
  const map = new Map<string, number>()
  for (const row of settlementRows) {
    if (row.refund_amount <= 0) continue
    map.set(row.order_key, roundMoney((map.get(row.order_key) || 0) + row.refund_amount))
  }
  return map
}

function getCustomerRefundMap(settlementRows: SaleReturnSettlementRow[]) {
  const map = new Map<string, number>()
  for (const row of settlementRows) {
    if (row.refund_amount <= 0) continue
    map.set(row.customer_key, roundMoney((map.get(row.customer_key) || 0) + row.refund_amount))
  }
  return map
}

export function applySaleReturnsToCollectReceiptRows(
  collectRows: AnyRow[],
  returnRows: SaleReturnFinanceRow[],
  receivableRows: AnyRow[],
) {
  const settlementRows = buildSaleReturnSettlementRows(receivableRows, returnRows)
  const orderRefundMap = getOrderRefundMap(settlementRows)
  const customerRefundMap = getCustomerRefundMap(settlementRows)

  const rows = (collectRows || []).map((row) => ({ ...row }))
  const result: Array<AnyRow & SaleReturnRefundAllocationRow> = rows.map((row) => ({
    ...row,
    refund_allocated: 0,
    net_amount: roundMoney(row.amount),
  }))

  const getCustomerKey = (row: AnyRow) => (
    row.contact_id
      ? `id:${row.contact_id}`
      : row.customer_id
        ? `id:${row.customer_id}`
        : `name:${text(row.contact_name || row.customer_name)}`
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

  for (let index = 0; index < result.length; index++) {
    const row = result[index]
    if (String(row.contact_type || '') !== 'customer') continue
    const orderNo = text(row.order_sn || row.order_no || row.receipt_no)
    if (!orderNo) continue
    const orderKey = `no:${orderNo}`
    const remain = orderRefundMap.get(orderKey) || 0
    if (remain <= 0) continue
    const used = allocate(index, remain)
    orderRefundMap.set(orderKey, Math.max(0, roundMoney(remain - used)))
    if (used > 0) {
      const customerKey = getCustomerKey(row)
      customerRefundMap.set(customerKey, Math.max(0, roundMoney((customerRefundMap.get(customerKey) || 0) - used)))
    }
  }

  const customerIndexes = new Map<string, number[]>()
  result.forEach((row, index) => {
    if (String(row.contact_type || '') !== 'customer') return
    const customerKey = getCustomerKey(row)
    const list = customerIndexes.get(customerKey) || []
    list.push(index)
    customerIndexes.set(customerKey, list)
  })

  for (const indexes of customerIndexes.values()) {
    indexes.sort((a, b) => {
      const aDate = text(result[a].receipt_date || result[a].create_time)
      const bDate = text(result[b].receipt_date || result[b].create_time)
      return bDate.localeCompare(aDate)
    })
  }

  for (const [customerKey, indexes] of customerIndexes.entries()) {
    let remain = customerRefundMap.get(customerKey) || 0
    if (remain <= 0) continue

    for (const index of indexes) {
      if (remain <= 0) break
      const used = allocate(index, remain)
      remain = Math.max(0, roundMoney(remain - used))
    }
  }

  return result
}
