/**
 * 应收账款统一计算口径。
 *
 * 铁律：Receivable.vue / Overview.vue / FundFlow.vue 的应收计算必须完全一致，
 * 全部通过本文件的函数计算，禁止在页面内各自复制实现。
 *
 * 口径要点：
 * - 有效合同 = status 1（已审核）+ status 4（已转单），前端过滤
 * - 排除线上电商平台现收现结客户（不走应收账款）
 * - 收款单先按 order_sn 直接匹配合同（不用 order_no，会撞号），剩余按客户 FIFO 分配
 * - 收款单无记录时回退合同自身 receive_amount（与 Contract.vue getReceivedAmount 一致）
 */
import { isEffectiveSaleContract } from './saleContractStatus'
import { calcSaleContractReceivable } from './saleContractAmount'
import type { SaleReturnFinanceRow } from './saleReturnFinance'

/** 线上电商平台现收现结客户（不走应收账款） */
export const ONLINE_CUSTOMER_IDS = new Set([63, 10, 12, 7, 8, 11])

/**
 * 计算每份有效销售合同的应收/已收/未收。
 * 返回全部有效合同行（不做 un_pay_amount>0 过滤，由调用方决定）。
 */
export function buildContractReceivableItems(contractRows: any[], receiptRows: any[]): any[] {
  const audited = (contractRows || []).filter(
    (r: any) => isEffectiveSaleContract(r) && !ONLINE_CUSTOMER_IDS.has(Number(r.customer_id)),
  )
  // 单号 → 合同。
  // 只索引 order_sn，不索引 order_no：合同的 order_no 是另一套独立生成的号，
  // 会撞上别张合同的 order_sn（生产数据里合同#139 的 order_no == 合同#164 的 order_sn），
  // 撞上后收款会被记到错误的合同上、超出部分被 Math.max(0,…) 抹掉，钱凭空消失。
  // 已核实：没有任何一笔收款单是只能靠 order_no 才匹配得上合同的，去掉是安全的。
  const snToId = new Map<string, number>()
  for (const c of audited) {
    if (c.order_sn) snToId.set(String(c.order_sn), c.id)
  }

  const contractDirectPaid = new Map<number, number>()
  const custUnmatchedPaid = new Map<number, number>()
  for (const r of receiptRows || []) {
    if (String(r.remark || '').startsWith('[other]')) continue // 杂项收入，跳过
    const amount = Number(r.amount || 0)
    const rSn = String(r.order_sn || '').trim()
    const custId = Number(r.customer_id || 0)
    if (rSn && snToId.has(rSn)) {
      const cid = snToId.get(rSn)!
      contractDirectPaid.set(cid, (contractDirectPaid.get(cid) ?? 0) + amount)
    } else if (custId > 0) {
      custUnmatchedPaid.set(custId, (custUnmatchedPaid.get(custId) ?? 0) + amount)
    }
  }

  const byCustomer = new Map<number, any[]>()
  for (const r of audited) {
    const custId = Number(r.customer_id || 0)
    if (custId > 0 && custUnmatchedPaid.has(custId)) {
      if (!byCustomer.has(custId)) byCustomer.set(custId, [])
      byCustomer.get(custId)!.push(r)
    }
  }
  for (const contracts of byCustomer.values()) {
    contracts.sort((a: any, b: any) =>
      new Date(a.order_date || a.created_at).getTime() - new Date(b.order_date || b.created_at).getTime(),
    )
  }

  // FIFO 分配无合同引用的收款到剩余未付合同
  const contractFifoPaid = new Map<number, number>()
  for (const [custId, contracts] of byCustomer) {
    let remaining = custUnmatchedPaid.get(custId) ?? 0
    for (const c of contracts) {
      const total = calcSaleContractReceivable(c)
      const directPaid = contractDirectPaid.get(c.id) ?? 0
      const leftover = Math.max(0, total - directPaid)
      const applied = Math.min(remaining, leftover)
      if (applied > 0) contractFifoPaid.set(c.id, applied)
      remaining = Math.max(0, remaining - applied)
      if (remaining <= 0) break
    }
  }

  const contractPaid = new Map<number, number>()
  for (const id of new Set([...contractDirectPaid.keys(), ...contractFifoPaid.keys()])) {
    contractPaid.set(id, (contractDirectPaid.get(id) ?? 0) + (contractFifoPaid.get(id) ?? 0))
  }

  return audited.map((r: any) => {
    const receiptPaid = contractPaid.get(r.id)
    // 与 Contract.vue getReceivedAmount 一致：收款单有记录优先，否则用合同自身的 receive_amount
    const paid = receiptPaid !== undefined ? receiptPaid : Number(r.receive_amount || 0)
    const total = calcSaleContractReceivable(r)
    return {
      ...r,
      total_amount: total,
      paid_amount: paid,
      un_pay_amount: Math.max(0, total - paid),
      order_sn: r.order_sn || r.order_no || '',
      out_date: r.order_date || r.created_at,
    }
  })
}

/**
 * 按客户名把已审核销售退货金额从应收行的 un_pay_amount 中扣减（FIFO 余额扣减）。
 * 与 Overview.vue 应收卡片口径一致。返回扣减后的新数组（不修改入参）。
 */
export function deductSaleReturnsByCustomer(receivableRows: any[], normalizedReturns: SaleReturnFinanceRow[]): any[] {
  const returnByCustomerName = new Map<string, number>()
  for (const sr of normalizedReturns || []) {
    const key = sr.customer_name
    if (key) returnByCustomerName.set(key, (returnByCustomerName.get(key) ?? 0) + sr.return_amount)
  }
  const returnRemainder = new Map(returnByCustomerName)
  return (receivableRows || []).map((r: any) => {
    const key = String(r.customer_name || '').trim()
    const rem = returnRemainder.get(key) ?? 0
    if (rem <= 0) return r
    const deduct = Math.min(rem, Number(r.un_pay_amount || 0))
    returnRemainder.set(key, rem - deduct)
    return { ...r, un_pay_amount: Math.max(0, Number(r.un_pay_amount || 0) - deduct) }
  })
}
