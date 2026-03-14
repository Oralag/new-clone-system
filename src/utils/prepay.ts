type AnyRow = Record<string, any>

export interface PrepayRowStat {
  used_amount: number
  balance: number
}

export interface CustomerPrepayStat {
  customer_key: string
  customer_id: number | null
  customer_name: string
  total_amount: number
  used_amount: number
  balance: number
}

export interface PrepayBreakdown {
  customerStats: CustomerPrepayStat[]
  rowStats: Record<string, PrepayRowStat>
}

function toNumber(value: any): number {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function text(value: any): string {
  return String(value ?? '').trim()
}

function normalizeCustomerId(row: AnyRow): number | null {
  const id = Number(row?.customer_id ?? row?.contact_id ?? 0)
  return Number.isFinite(id) && id > 0 ? id : null
}

function normalizeCustomerName(row: AnyRow): string {
  return text(row?.customer_name || row?.contact_name || row?.nickname || row?.name || '')
}

function resolveCustomerKey(row: AnyRow, fallback: string): string {
  const customerId = normalizeCustomerId(row)
  if (customerId) return `id:${customerId}`
  const customerName = normalizeCustomerName(row)
  if (customerName) return `name:${customerName}`
  return fallback
}

function resolveRowDate(row: AnyRow): string {
  return text(row?.pay_date || row?.receipt_date || row?.create_time || row?.created_at || row?.date || '')
}

function sortRowsByDateAsc(a: AnyRow, b: AnyRow): number {
  const da = resolveRowDate(a)
  const db = resolveRowDate(b)
  if (da !== db) return da.localeCompare(db)

  const ia = text(a?.id)
  const ib = text(b?.id)
  if (ia !== ib) return ia.localeCompare(ib, 'zh-CN', { numeric: true, sensitivity: 'base' })

  const oa = text(a?.order_sn || a?.prepay_no || a?.receipt_no)
  const ob = text(b?.order_sn || b?.prepay_no || b?.receipt_no)
  return oa.localeCompare(ob, 'zh-CN', { numeric: true, sensitivity: 'base' })
}

export function getPrepayRowKey(row: AnyRow, index = 0): string {
  const id = text(row?.id)
  if (id) return `id:${id}`
  const orderSn = text(row?.order_sn || row?.prepay_no || row?.receipt_no)
  if (orderSn) return `sn:${orderSn}`
  return `idx:${index}`
}

export function buildCustomerPrepayBreakdown(prepayRows: AnyRow[], collectReceipts: AnyRow[]): PrepayBreakdown {
  const customerMap = new Map<string, {
    customer_key: string
    customer_id: number | null
    customer_name: string
    total_amount: number
    used_raw_amount: number
    rows: Array<{ row: AnyRow; rowKey: string }>
  }>()
  const rowStats: Record<string, PrepayRowStat> = {}

  prepayRows.forEach((row, index) => {
    const amount = Math.max(0, toNumber(row?.amount))
    const customer_key = resolveCustomerKey(row, `prepay:${index}`)
    const customer_id = normalizeCustomerId(row)
    const customer_name = normalizeCustomerName(row) || (customer_id ? `客户${customer_id}` : '未命名客户')
    const rowKey = getPrepayRowKey(row, index)

    if (!customerMap.has(customer_key)) {
      customerMap.set(customer_key, {
        customer_key,
        customer_id,
        customer_name,
        total_amount: 0,
        used_raw_amount: 0,
        rows: [],
      })
    }

    const stat = customerMap.get(customer_key)!
    if (!stat.customer_id && customer_id) stat.customer_id = customer_id
    if (!stat.customer_name && customer_name) stat.customer_name = customer_name
    stat.total_amount += amount
    stat.rows.push({ row, rowKey })
  })

  collectReceipts
    .filter(row => text(row?.remark).includes('预付款核销'))
    .forEach((row, index) => {
      const customer_key = resolveCustomerKey(row, `receipt:${index}`)
      const stat = customerMap.get(customer_key)
      if (!stat) return
      stat.used_raw_amount += Math.max(0, toNumber(row?.amount))
      if (!stat.customer_id) stat.customer_id = normalizeCustomerId(row)
      if (!stat.customer_name) stat.customer_name = normalizeCustomerName(row) || stat.customer_name
    })

  const customerStats: CustomerPrepayStat[] = []

  customerMap.forEach((stat) => {
    let remainingUsed = Math.max(0, stat.used_raw_amount)
    const sortedRows = [...stat.rows].sort((a, b) => sortRowsByDateAsc(a.row, b.row))

    for (const item of sortedRows) {
      const amount = Math.max(0, toNumber(item.row?.amount))
      const used = Math.min(amount, remainingUsed)
      const balance = Math.max(0, amount - used)
      rowStats[item.rowKey] = { used_amount: used, balance }
      remainingUsed -= used
    }

    const used_amount = sortedRows.reduce((sum, item) => sum + (rowStats[item.rowKey]?.used_amount ?? 0), 0)
    const balance = sortedRows.reduce((sum, item) => sum + (rowStats[item.rowKey]?.balance ?? Math.max(0, toNumber(item.row?.amount))), 0)

    customerStats.push({
      customer_key: stat.customer_key,
      customer_id: stat.customer_id,
      customer_name: stat.customer_name,
      total_amount: stat.total_amount,
      used_amount,
      balance,
    })
  })

  customerStats.sort((a, b) => b.total_amount - a.total_amount)

  return { customerStats, rowStats }
}
