/**
 * 应付账款统一计算口径。
 *
 * 铁律：Payable.vue / Overview.vue / FundFlow.vue 的应付计算必须完全一致，
 * 全部通过本文件的函数计算，禁止在页面内各自复制实现。
 *
 * 口径要点：
 * - 只算已审核（status===1）采购单，前端过滤（后端忽略 status 参数）
 * - 订单金额用 after_discount ?? total_amount
 * - 订单本体已付直接用后端 o.pay_amount；附加费用已付从付款单备注匹配
 * - "审核自动生成"的付款单是系统预付记录，不计入应付欠款
 * - 未链接到具体采购单的手动付款（多订单路径）按供应商名在供应商层面扣减
 */
import { getProcureOrderSupplierLabel, getProcureOrderSupplierId } from './supplierLabel'
import { buildProcureFeePaidByOrder, getProcureFeeNeedPayAmount } from './procureFeeFinance'
import { fmtDt } from './date'

/** 排除"审核自动生成"的系统付款单，得到手动付款单 */
export function filterManualPayRows(payRows: any[]): any[] {
  return (payRows || []).filter((r: any) => !/审核自动生成/.test(String(r.remark || '')))
}

/**
 * 按供应商聚合已审核采购单的应付款（含附加费用）。
 * 返回聚合行（不做 un_pay_amount>0 过滤，由调用方决定）。
 */
export function buildSupplierPayableRows(
  orderRows: any[],
  payRows: any[],
  supplierRows: any[] = [],
  opts?: { dateFrom?: string; dateTo?: string },
): any[] {
  const manualPayList = filterManualPayRows(payRows)
  const procureFeePaidById = buildProcureFeePaidByOrder(manualPayList)

  const orders: any[] = (orderRows || []).filter((o: any) => Number(o.status) === 1)

  // 已关联采购单的 order_sn/order_no 集合（用于区分"已链接"和"未链接"付款）
  const orderSnSet = new Set(orders.map((o) => String(o.order_sn || '').trim()).filter(Boolean))
  const orderNoSet = new Set(orders.map((o) => String(o.order_no || '').trim()).filter(Boolean))

  // "未链接到具体采购单"的手动付款：按供应商名聚合
  // 场景：从应付款点"付款"→多订单路径，PayReceipt 没有 order_id，order_sn 为空
  const unlinkedPaidBySupplier: Record<string, number> = {}
  for (const r of manualPayList) {
    if (String(r.contact_type || '') !== 'supplier') continue
    const amt = Number(r.amount || 0)
    if (!amt) continue
    const sn = String(r.order_sn || '').trim()
    // 已通过 order_sn 链接到具体采购单的付款 → 已反映在 o.pay_amount 中，跳过
    if (sn && (orderSnSet.has(sn) || orderNoSet.has(sn))) continue
    const supplierName = String(r.contact_name || '').trim()
    if (supplierName) {
      unlinkedPaidBySupplier[supplierName] = (unlinkedPaidBySupplier[supplierName] || 0) + amt
    }
  }

  // 按供应商聚合采购订单
  const supplierMap = new Map<string, any>()
  for (const o of orders) {
    const displayName = getProcureOrderSupplierLabel(o, supplierRows || [])
    const resolvedSupplierId = getProcureOrderSupplierId(o)
    const key = displayName === '多供应商' ? `order:${o.id}` : (resolvedSupplierId ? `id:${resolvedSupplierId}` : `name:${String(displayName || '').trim()}`)
    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        supplier_id: displayName === '多供应商' ? 0 : resolvedSupplierId,
        supplier_name: displayName,
        contact_name: o.contact_name || '',
        contact_mobile: o.contact_mobile || '',
        order_amount: 0,
        paid_amount: 0,
        un_pay_amount: 0,
        prepay: 0,
        orders: [],
      })
    }
    const s = supplierMap.get(key)!
    const orderAmt = Number(o.after_discount ?? o.total_amount ?? 0)
    const paidAmt = Number(o.pay_amount || 0)
    const feeNeedPay = getProcureFeeNeedPayAmount(o)
    const feePaid = procureFeePaidById[o.id] || 0
    const feeUnpaid = Math.max(0, feeNeedPay - feePaid)
    const unpaid = orderAmt - paidAmt
    if (unpaid <= 0 && feeUnpaid <= 0) continue
    s.order_amount += orderAmt + feeNeedPay
    s.paid_amount += paidAmt + feePaid
    s.un_pay_amount += unpaid + feeUnpaid
    s.orders.push({
      order_id: o.id,
      order_sn: String(o.order_sn || '').trim(),
      order_no: o.order_no || o.order_sn || '',
      order_amount: orderAmt + feeNeedPay,
      paid_amount: paidAmt + feePaid,
      base_pay_amount: paidAmt, // 原始 pay_amount，用于付款后更新
      un_pay_amount: unpaid + feeUnpaid,
      due_date: fmtDt(o.order_date),
    })
  }

  // 日期过滤（前端）
  let aggregated = Array.from(supplierMap.values())
  if (opts?.dateFrom || opts?.dateTo) {
    for (const s of aggregated) {
      s.orders = s.orders.filter((o: any) => {
        if (opts.dateFrom && o.due_date < opts.dateFrom) return false
        if (opts.dateTo && o.due_date > opts.dateTo) return false
        return true
      })
      s.order_amount = s.orders.reduce((sum: number, o: any) => sum + o.order_amount, 0)
      s.paid_amount = s.orders.reduce((sum: number, o: any) => sum + o.paid_amount, 0)
      s.un_pay_amount = s.orders.reduce((sum: number, o: any) => sum + o.un_pay_amount, 0)
    }
    aggregated = aggregated.filter((s) => s.orders.length > 0)
  }

  // 把"未链接到具体采购单"的手动付款在供应商层面扣减应付
  for (const s of aggregated) {
    const extra = unlinkedPaidBySupplier[s.supplier_name] || 0
    if (extra > 0) {
      const deduct = Math.min(extra, s.un_pay_amount)
      s.paid_amount += deduct
      s.un_pay_amount -= deduct
    }
  }

  return aggregated
}

/** 销售合同附加费用（对方承担）应付行，按收款方名聚合，已过滤 un_pay_amount>0.001 */
export function buildContractFeePayableRows(contractRows: any[], payRows: any[]): any[] {
  const manualPayList = filterManualPayRows(payRows)
  const saleFeePaidMap: Record<string, number> = {}
  for (const r of manualPayList) {
    const m = String(r.remark || '').match(/销售订单附加费用\s*#(\d+):(.+?)(?:\s|\[|$)/)
    if (m) {
      const key = `${Number(m[1])}:${m[2].trim()}`
      saleFeePaidMap[key] = (saleFeePaidMap[key] || 0) + Number(r.amount || 0)
    }
  }
  const feeMap = new Map<string, { order_amount: number; paid_amount: number; orders: any[] }>()
  for (const c of contractRows || []) {
    let feeItems: any[] = []
    try {
      const raw = c.fee_items
      if (typeof raw === 'string' && raw && raw !== '[]') feeItems = JSON.parse(raw)
      else if (Array.isArray(raw)) feeItems = raw
    } catch { feeItems = [] }
    // 从 remark [FI:] 标签恢复（后端未持久化 fee_items 字段时的兜底）
    if (!feeItems.length) {
      try {
        const fiMatch = String(c.remark || '').match(/\[FI:([^\]]+)\]/)
        if (fiMatch) feeItems = JSON.parse(decodeURIComponent(atob(fiMatch[1])))
      } catch { /* ignore */ }
    }
    for (const f of feeItems) {
      if (f.bearer === 'buyer') continue // 我方承担走采购付款，合同附加费只收录对方承担的
      const amt = Number(f.amount || 0)
      if (!amt) continue
      const feeName = String(f.name || '费用').trim()
      const paid = saleFeePaidMap[`${c.id}:${feeName}`] || 0
      const unpaid = amt - paid
      if (unpaid <= 0.001) continue // 已付清，跳过
      const supplierName = String(f.supplier_name || '').trim() || `合同附加-${feeName}`
      if (!feeMap.has(supplierName)) feeMap.set(supplierName, { order_amount: 0, paid_amount: 0, orders: [] })
      const entry = feeMap.get(supplierName)!
      entry.order_amount += amt
      entry.paid_amount += paid
      entry.orders.push({
        order_id: c.id,
        order_no: c.order_sn || c.order_no || '',
        order_amount: amt,
        paid_amount: paid,
        un_pay_amount: unpaid,
        due_date: fmtDt(c.sign_date || c.order_date || c.created_at),
        source_name: `合同附加-${feeName}`,
      })
    }
  }
  return Array.from(feeMap.entries())
    .map(([supplierName, entry]) => ({
      supplier_id: 0,
      supplier_name: supplierName,
      contact_name: '',
      contact_mobile: '',
      order_amount: entry.order_amount,
      paid_amount: entry.paid_amount,
      un_pay_amount: entry.order_amount - entry.paid_amount,
      prepay: 0,
      orders: entry.orders,
      __payable_source: 'contract_fee',
      source_name: '合同附加费',
    }))
    .filter((r) => r.un_pay_amount > 0.001)
}

/** 零售附加费用（我方承担）应付行，按费用名聚合，已过滤 un_pay_amount>0.001 */
export function buildRetailFeePayableRows(retailRows: any[], payRows: any[]): any[] {
  const manualPayList = filterManualPayRows(payRows)
  const retailFeePaidMap: Record<string, number> = {}
  for (const r of manualPayList) {
    const m = String(r.remark || '').match(/零售附加费用\s*#(\d+):(.+?)(?:\s|$)/)
    if (m) {
      const key = `${m[1]}:${m[2].trim()}`
      retailFeePaidMap[key] = (retailFeePaidMap[key] || 0) + Number(r.amount || 0)
    }
  }
  // 后端列表接口不返回 fee_items，从 RetailOrder 页面写入的 localStorage 缓存读取
  let retailFeeCache: Record<string, any[]> = {}
  try { retailFeeCache = JSON.parse(localStorage.getItem('retail_fee_items_cache_v1') || '{}') } catch { /* ignore */ }

  const retailOrders: any[] = (retailRows || []).filter((o: any) => Number(o.status) === 1)
  const retailFeeMap = new Map<string, { order_amount: number; paid_amount: number; orders: any[] }>()
  for (const o of retailOrders) {
    let feeItems: any[] = []
    try {
      if (o.fee_items !== undefined && o.fee_items !== null) {
        feeItems = Array.isArray(o.fee_items) ? o.fee_items : JSON.parse(o.fee_items || '[]')
      } else {
        feeItems = retailFeeCache[String(o.id)] ?? []
      }
    } catch { feeItems = [] }
    for (const f of feeItems) {
      // 只有明确标记为 buyer（我方承担）才进应付；老数据未标记或其他值一律不算
      if (f.bearer !== 'buyer') continue
      const amt = Number(f.amount || 0)
      if (!amt) continue
      const feeName = String(f.name || '费用').trim()
      const paid = retailFeePaidMap[`${o.id}:${feeName}`] || 0
      const unpaid = amt - paid
      if (unpaid <= 0.001) continue
      if (!retailFeeMap.has(feeName)) retailFeeMap.set(feeName, { order_amount: 0, paid_amount: 0, orders: [] })
      const entry = retailFeeMap.get(feeName)!
      entry.order_amount += amt
      entry.paid_amount += paid
      entry.orders.push({
        order_id: o.id,
        order_no: o.order_sn || `LS${String(o.id).padStart(3, '0')}`,
        order_amount: amt,
        paid_amount: paid,
        un_pay_amount: unpaid,
        due_date: o.order_date || '',
        source_name: `零售-${feeName}`,
      })
    }
  }
  return Array.from(retailFeeMap.entries())
    .map(([feeName, entry]) => ({
      supplier_id: 0,
      supplier_name: feeName,
      contact_name: '',
      contact_mobile: '',
      order_amount: entry.order_amount,
      paid_amount: entry.paid_amount,
      un_pay_amount: entry.order_amount - entry.paid_amount,
      prepay: 0,
      orders: entry.orders,
      __payable_source: 'retail_fee',
      source_name: '零售附加费',
    }))
    .filter((r) => r.un_pay_amount > 0.001)
}
