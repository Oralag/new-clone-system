type AnyRow = Record<string, any>

function toNumber(value: any): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function roundMoney(value: any): number {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100
}

function text(value: any): string {
  return String(value ?? '').trim()
}

function parseRemarkTag(remark: any, tag: string): string {
  const m = text(remark).match(new RegExp(`\\[${tag}:([^\\]]*)\\]`))
  return m ? text(m[1]) : ''
}

function getReceiptCustomerKey(row: AnyRow): string {
  const id = Number(row?.customer_id || row?.contact_id || 0)
  if (id > 0) return `id:${id}`
  const name = text(row?.customer_name || row?.contact_name)
  return name ? `name:${name}` : ''
}

function getContractCustomerKeys(row: AnyRow): string[] {
  const keys: string[] = []
  const id = Number(row?.customer_id || 0)
  if (id > 0) keys.push(`id:${id}`)
  const name = text(row?.customer_name)
  if (name) keys.push(`name:${name}`)
  return keys
}

function getContractDate(row: AnyRow): string {
  return text(row?.sign_date || row?.contract_date || row?.order_date || row?.created_at || row?.create_time)
}

export function getSaleReceiptOrderNo(row: AnyRow): string {
  return text(row?.order_sn || row?.order_no)
}

export function isSaleCustomerReceipt(row: AnyRow): boolean {
  const remark = text(row?.remark)
  if (/^\[supplier\]|^\[staff\]|^\[other\]/i.test(remark)) return false
  if (/^预付款充值/.test(remark)) return false

  const type = text(row?.contact_type).toLowerCase()
  if (type && type !== 'customer') return false

  return Boolean(row?.customer_id || row?.customer_name || row?.contact_id || row?.contact_name || getSaleReceiptOrderNo(row))
}

export function getSaleReceiptAmount(row: AnyRow): number {
  return roundMoney(row?.net_amount ?? row?.amount)
}

export function getSaleReceiptDate(row: AnyRow): string {
  return text(row?.receipt_date || row?.pay_date || row?.created_at || row?.create_time)
}

export function getSaleReceiptCustomerName(row: AnyRow): string {
  return text(row?.customer_name || row?.contact_name || row?.nickname || row?.name)
}

export function getSaleContractOrderNo(row: AnyRow): string {
  return text(
    parseRemarkTag(row?.remark, 'NO')
    || row?.order_sn
    || row?.order_no
    || row?.contract_no
    || (row?.id ? `HT${String(row.id).padStart(4, '0')}` : ''),
  )
}

export function getSaleContractAmount(row: AnyRow): number {
  const total = toNumber(row?.total_amount)
  const discType = text(row?.discount_type || 'none')
  const discVal = toNumber(row?.discount_value)
  const afterDisc = Number(row?.after_discount)
  const freight = toNumber(row?.freight_amount)
  const bearer = text(row?.freight_bearer || 'seller')
  const income = toNumber(row?.income_amount)

  let base = total
  if (Number.isFinite(afterDisc) && afterDisc > 0) base = afterDisc
  else if (discType === 'amount' && discVal > 0) base = Math.max(0, total - discVal)
  else if (discType === 'percent' && discVal > 0) base = Math.max(0, total * (1 - discVal / 100))

  const freightCharge = bearer === 'buyer' ? freight : bearer === 'half' ? freight / 2 : 0
  return roundMoney(Math.max(0, base + freightCharge - income))
}

export function applySaleReceiptPayments(contractRows: AnyRow[], receiptRows: AnyRow[]): AnyRow[] {
  const contracts = contractRows || []
  const contractById = new Map<number, AnyRow>()
  const contractByOrderNo = new Map<string, AnyRow>()

  for (const row of contracts) {
    const id = Number(row?.id || 0)
    if (id > 0) contractById.set(id, row)

    const keys = [
      getSaleContractOrderNo(row),
      text(row?.order_sn),
      text(row?.order_no),
      text(row?.contract_no),
    ].filter(Boolean)

    for (const key of keys) {
      if (!contractByOrderNo.has(key)) contractByOrderNo.set(key, row)
    }
  }

  const directPaid = new Map<number, number>()
  const customerPool = new Map<string, number>()

  for (const receipt of receiptRows || []) {
    if (!isSaleCustomerReceipt(receipt)) continue

    const amount = getSaleReceiptAmount(receipt)
    if (amount <= 0) continue

    const orderNo = getSaleReceiptOrderNo(receipt)
    const idMatch = text(receipt?.remark).match(/#(\d+)/)
    const matchedByNo = orderNo ? contractByOrderNo.get(orderNo) : null
    const matchedById = idMatch ? contractById.get(Number(idMatch[1])) : null
    const matched = matchedByNo || matchedById

    if (matched?.id) {
      const id = Number(matched.id)
      directPaid.set(id, roundMoney((directPaid.get(id) || 0) + amount))
      continue
    }

    if (orderNo || idMatch) continue

    const customerKey = getReceiptCustomerKey(receipt)
    if (customerKey) customerPool.set(customerKey, roundMoney((customerPool.get(customerKey) || 0) + amount))
  }

  const basePaid = new Map<number, number>()
  for (const row of contracts) {
    const id = Number(row?.id || 0)
    if (id <= 0) continue

    const direct = directPaid.get(id)
    const legacy = Math.max(0, toNumber(row?.receive_amount ?? row?.paid_amount))
    basePaid.set(id, direct !== undefined ? Math.max(direct, legacy) : legacy)
  }

  const fifoPaid = new Map<number, number>()
  for (const [customerKey, poolAmount] of customerPool) {
    let remaining = poolAmount
    const customerContracts = contracts
      .filter(row => getContractCustomerKeys(row).includes(customerKey))
      .sort((a, b) => {
        const da = getContractDate(a)
        const db = getContractDate(b)
        if (da !== db) return da.localeCompare(db)
        return text(a?.id).localeCompare(text(b?.id), 'zh-CN', { numeric: true, sensitivity: 'base' })
      })

    for (const row of customerContracts) {
      if (remaining <= 0.005) break

      const id = Number(row?.id || 0)
      if (id <= 0) continue

      const total = getSaleContractAmount(row)
      const alreadyPaid = basePaid.get(id) || 0
      const unpaid = Math.max(0, total - alreadyPaid)
      if (unpaid <= 0.005) continue

      const applied = Math.min(unpaid, remaining)
      fifoPaid.set(id, roundMoney((fifoPaid.get(id) || 0) + applied))
      remaining = roundMoney(remaining - applied)
    }
  }

  return contracts.map(row => {
    const id = Number(row?.id || 0)
    const total = getSaleContractAmount(row)
    const paid = Math.min(total, roundMoney((basePaid.get(id) || 0) + (fifoPaid.get(id) || 0)))
    const unpaid = Math.max(0, roundMoney(total - paid))

    return {
      ...row,
      finance_total_amount: total,
      receive_amount: paid,
      paid_amount: paid,
      un_pay_amount: unpaid,
    }
  })
}
