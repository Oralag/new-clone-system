export interface ProcureFeeItem {
  name: string
  amount: number
  bearer: string
}

export function isProcureExtraFeePayment(row: any): boolean {
  return /采购单据支出|采购运费|采购附加费用/.test(String(row?.remark || ''))
}

export function parseProcureFeeItems(row: any): ProcureFeeItem[] {
  let items: any[] = []
  try {
    items = Array.isArray(row?.fee_items) ? row.fee_items : JSON.parse(row?.fee_items || '[]')
  } catch {
    items = []
  }
  if (!items.length) {
    const freight = Number(row?.freight_amount || 0)
    const expense = Number(row?.expense_amount || 0)
    if (freight > 0) items.push({ name: '运费', amount: freight, bearer: row?.freight_bearer || 'buyer' })
    if (expense > 0) items.push({ name: '单据支出', amount: expense, bearer: 'buyer' })
  }
  return items
    .map((fee) => ({
      name: String(fee?.name || '').trim(),
      amount: Number(fee?.amount || 0),
      bearer: fee?.bearer || 'buyer',
    }))
    .filter((fee) => fee.name && fee.amount > 0)
}

export function getProcureFeeNeedPayAmount(row: any): number {
  return parseProcureFeeItems(row).reduce((sum, fee) => {
    if (fee.bearer === 'seller' || fee.bearer === 'free') return sum
    return sum + (fee.bearer === 'half' ? fee.amount / 2 : fee.amount)
  }, 0)
}

export function buildProcureFeePaidByOrder(payRows: any[]): Record<number, number> {
  const paid: Record<number, number> = {}
  const seen = new Set<string>()
  for (const row of payRows || []) {
    const amount = Number(row?.amount || 0)
    if (amount <= 0) continue
    const remark = String(row?.remark || '')
    const match = remark.match(/采购附加费用\s*#(\d+):/)
      || remark.match(/采购运费\s*#(\d+)/)
      || remark.match(/采购单据支出\s*#(\d+)/)
    if (!match) continue
    const orderId = Number(match[1])
    if (!orderId) continue
    const uniqueKey = `${orderId}|${amount}|${row?.pay_date || ''}|${row?.fund_id || ''}|${remark}`
    if (seen.has(uniqueKey)) continue
    seen.add(uniqueKey)
    paid[orderId] = (paid[orderId] || 0) + amount
  }
  return paid
}

