type AnyRow = Record<string, any>

export interface NormalizedFundFlowRow {
  id: string
  raw: AnyRow
  fund_name: string
  flow_type: 'income' | 'expense' | 'refund'
  source: string
  name: string
  order_no: string
  amount: number
  after_balance: number
  remark: string
  created_at: string
  date: string
}

function text(value: any): string {
  return String(value ?? '').trim()
}

function toNumber(value: any): number {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function normalizeFlowType(row: AnyRow): 'income' | 'expense' | 'refund' {
  const raw = text(row.flow_type || row.type || row.direction).toLowerCase()
  if (raw.includes('refund') || raw.includes('冲红')) return 'refund'
  if (raw.includes('income') || raw.includes('in') || raw.includes('收入')) return 'income'
  return 'expense'
}

function normalizeSourceLabel(row: AnyRow, flowType: 'income' | 'expense' | 'refund'): string {
  const raw = text(
    row.source_name ||
    row.source_type ||
    row.biz_type ||
    row.module_name ||
    row.trade_type ||
    row.scene ||
    row.contact_type
  ).toLowerCase()
  const remark = text(row.remark)

  if (remark.includes('预付款核销')) return '预付款核销'
  if (remark.includes('预付款充值')) return '预收款'
  if (raw.includes('retail') || raw.includes('零售')) return '零售单'
  if (raw.includes('recharge') || remark.includes('会员充值')) return '会员充值'
  if (raw.includes('expense') || raw.includes('费用') || raw.includes('报销')) return '费用'
  if (raw.includes('prepay') || raw.includes('预付')) return flowType === 'income' ? '预收款' : '供应商预付'
  if (raw.includes('collect') || raw.includes('receipt') || raw === 'customer') return flowType === 'income' ? '销售收款' : '客户退款'
  if (raw.includes('pay') || raw.includes('付款') || raw === 'supplier') return flowType === 'income' ? '供应商退款' : '采购付款'
  if (raw === 'other') return flowType === 'income' ? '其他收入' : '其他支出'
  if (raw === 'staff') return flowType === 'income' ? '员工还款' : '员工费用'
  if (remark.includes('零售')) return '零售单'
  if (remark.includes('采购')) return '采购付款'
  if (remark.includes('费用')) return '费用'
  if (remark.includes('退款')) return flowType === 'income' ? '供应商退款' : '客户退款'
  if (flowType === 'refund') return '冲红'
  return flowType === 'income' ? '资金收入' : '资金支出'
}

function normalizeName(row: AnyRow): string {
  return text(
    row.contact_name ||
    row.customer_name ||
    row.supplier_name ||
    row.member_name ||
    row.type_name ||
    row.expense_name ||
    row.target_name ||
    row.object_name ||
    row.name ||
    row.admin_name
  ) || '—'
}

function normalizeOrderNo(row: AnyRow): string {
  return text(
    row.order_no ||
    row.order_sn ||
    row.receipt_no ||
    row.prepay_no ||
    row.expense_no ||
    row.biz_no ||
    row.source_no ||
    row.sn
  )
}

function normalizeCreatedAt(row: AnyRow): string {
  return text(
    row.created_at ||
    row.create_time ||
    row.receipt_date ||
    row.pay_date ||
    row.order_date ||
    row.date
  )
}

function normalizeFundName(row: AnyRow): string {
  return text(row.fund_name || row.account_name || row.account || row.fund || '—')
}

export function normalizeFundFlowRows(rows: AnyRow[]): NormalizedFundFlowRow[] {
  const deduped = new Map<string, NormalizedFundFlowRow>()

  for (const row of rows || []) {
    const flowType = normalizeFlowType(row)
    const createdAt = normalizeCreatedAt(row)
    const amount = Math.max(0, toNumber(row.amount))
    if (amount <= 0) continue

    const normalized: NormalizedFundFlowRow = {
      id: text(row.id) || `${flowType}|${normalizeFundName(row)}|${amount}|${createdAt}|${text(row.remark)}`,
      raw: row,
      fund_name: normalizeFundName(row),
      flow_type: flowType,
      source: normalizeSourceLabel(row, flowType),
      name: normalizeName(row),
      order_no: normalizeOrderNo(row),
      amount,
      after_balance: toNumber(row.after_balance),
      remark: text(row.remark),
      created_at: createdAt,
      date: createdAt.slice(0, 10),
    }

    if (!deduped.has(normalized.id)) deduped.set(normalized.id, normalized)
  }

  return Array.from(deduped.values()).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
}

export function sumFundFlowIncome(rows: NormalizedFundFlowRow[]): number {
  return rows.reduce((sum, row) => sum + (row.flow_type === 'income' ? row.amount : 0), 0)
}

export function sumFundFlowExpense(rows: NormalizedFundFlowRow[]): number {
  return rows.reduce((sum, row) => sum + (row.flow_type === 'income' ? 0 : row.amount), 0)
}
