/**
 * 往来对账单统一计算口径。
 *
 * 对账单结构（行业通行三段式）：
 *   期初余额 + 本期发生额 − 本期收付额 = 期末余额
 *
 * 购销双向单位（既是客户又是供应商）用借贷双栏列示：
 *   应收侧（借方）= 销售合同 − 销售退货 − 收款单
 *   应付侧（贷方）= 采购订单 − 采购退货 − 付款单
 * 两侧各自独立结转，净额只作参考（当前为全额结算：该收的收、该付的付，各走各的）。
 *
 * ⚠️ 与 receivableCalc.ts / payableCalc.ts 的关系（不违反"统一口径"铁律）：
 * 那两个文件是**按客户/供应商聚合**的欠款口径，会主动丢弃已付清的单据
 * （payableCalc.ts:84 `if (unpaid <= 0 && feeUnpaid <= 0) continue`），
 * 而对账单必须列出期间内**全部**单据，含已结清的，所以不能直接调用聚合器。
 * 因此本文件只复用它们底层的**金额口径函数**，保证每张单据算出来的钱完全一致：
 *   - 销售合同金额  → calcSaleContractReceivable()   （receivableCalc 内部同款）
 *   - 有效合同判定  → isEffectiveSaleContract()      （status 1 已审核 / 4 已转单）
 *   - 采购订单金额  → after_discount ?? total_amount + getProcureFeeNeedPayAmount()（payableCalc:78/85 同款）
 *   - 付款单过滤    → filterManualPayRows()          （排除"审核自动生成"的系统预付记录）
 * 金额口径要改，仍然只改那两个文件。
 *
 * 铁律：所有单据必须 status===1（已审核，销售合同额外含 4 已转单）才进对账单。
 */
import { fmtDt } from './date'
import { isEffectiveSaleContract } from './saleContractStatus'
import { calcSaleContractReceivable } from './saleContractAmount'
import { getProcureFeeNeedPayAmount, buildProcureFeePaidByOrder } from './procureFeeFinance'
import { getProcureOrderSupplierId } from './supplierLabel'
import { filterManualPayRows } from './payableCalc'

/** 对账单明细行：一行一张单据，借贷双栏 */
export interface StatementLine {
  /** 业务日期 YYYY-MM-DD */
  date: string
  /** 所属栏目：recv=应收侧（我供货给他） pay=应付侧（我从他拿货） */
  side: 'recv' | 'pay'
  /** 单据类型：销售合同 / 销售退货 / 收款单 / 采购订单 / 采购退货 / 付款单 */
  type: string
  /** 单据编号 */
  order_sn: string
  /** 摘要 */
  summary: string
  /** 借方：对方欠我增加（销售合同） */
  debit: number
  /** 贷方：我欠对方增加（采购订单） */
  credit: number
  /** 我收到的钱（减少对方欠我） */
  collected: number
  /** 我付出的钱（减少我欠对方） */
  paid: number
  /** 冲减金额（退货） */
  offset: number
  /** 手工添加的行（生成后人工补的），保存时保留 */
  manual?: boolean
}

export interface StatementSummary {
  /** 期初：对方欠我 */
  opening_recv: number
  /** 期初：我欠对方 */
  opening_pay: number
  /** 期初净额（正=对方欠我） */
  opening_balance: number
  /** 本期我应收发生额（销售合同净额，已扣退货） */
  recv_amount: number
  /** 本期我应付发生额（采购订单净额，已扣退货） */
  pay_amount: number
  /** 本期已收 */
  collected_amount: number
  /** 本期已付 */
  paid_amount: number
  /** 期末：对方还欠我 */
  closing_recv: number
  /** 期末：我还欠对方 */
  closing_pay: number
  /** 期末净额（正=对方欠我，负=我欠对方），全额结算下仅作参考 */
  net_amount: number
}

export interface StatementResult {
  lines: StatementLine[]
  summary: StatementSummary
}

/** 生成对账单需要的原始单据（全部数据，不要按日期预过滤——期初要靠区间前的单据算） */
export interface StatementSource {
  /** 销售合同 /shop/ContractOrder/index */
  contracts?: any[]
  /** 销售退货 /stock/SaleReturnOrder/index */
  saleReturns?: any[]
  /** 收款单 /finance/CollectReceipt/index */
  collectReceipts?: any[]
  /** 采购订单 /stock/PurchaseOrder/index */
  purchaseOrders?: any[]
  /** 采购退货 /procure/ProcureReturn/index */
  procureReturns?: any[]
  /** 付款单 /finance/PayReceipt/index */
  payReceipts?: any[]
}

/** 往来单位：客户档案 + 可选的关联供应商档案 */
export interface StatementPartner {
  customer_id: number
  customer_name: string
  /** 购销双向单位才有 */
  supplier_id?: number
  supplier_name?: string
}

function money(v: any): number {
  return Math.round(Number(v || 0) * 100) / 100
}

/**
 * 只取日期部分。
 * fmtDt 在时间非 00:00 时会返回 'YYYY-MM-DD HH:MM'，直接拿去和区间端点做字符串比较
 * 会把区间最后一天带时间戳的单据判成"超出区间"而漏掉，必须截断到 10 位。
 */
function dateOnly(v: any): string {
  return fmtDt(v).slice(0, 10)
}

function nameEq(a: any, b: any): boolean {
  const x = String(a || '').trim()
  const y = String(b || '').trim()
  return Boolean(x) && x === y
}

/**
 * 把所有单据摊平成一条按日期排序的往来流水。
 * 不做日期过滤——期初余额需要区间之前的全部单据。
 */
function buildLedger(source: StatementSource, partner: StatementPartner): StatementLine[] {
  const lines: StatementLine[] = []
  const custId = Number(partner.customer_id || 0)
  const custName = partner.customer_name
  const supId = Number(partner.supplier_id || 0)
  const supName = partner.supplier_name || ''
  const hasSupplier = supId > 0 || Boolean(supName)

  const isThisCustomer = (r: any) =>
    (custId > 0 && Number(r.customer_id) === custId) || nameEq(r.customer_name, custName)
  const isThisSupplier = (r: any) =>
    (supId > 0 && Number(r.supplier_id) === supId) ||
    nameEq(r.supplier_name, supName) ||
    nameEq(r.contact_name, supName)

  // 单号 → 单据归属方。
  // 收付款单上的 customer_id/contact_name 存在串档（历史数据里有挂 A 名下、order_sn 却指向 B 的合同），
  // receivableCalc/payableCalc 的口径都是 **order_sn 优先**：钱算给单号对应单据的主人。
  // 这里必须对齐，否则同一笔钱会在两个单位的对账单里各算一次。
  const ownerBySn = (rows: any[], keep: (r: any) => boolean, idOf: (r: any) => number, nameOf: (r: any) => string) => {
    const map = new Map<string, { id: number; name: string }>()
    const kept = (rows || []).filter(keep)
    // 两遍：order_sn 先落位且不可被覆盖，order_no 只填补空位。
    // 生产数据里存在「A 单的 order_no 恰好等于 B 单的 order_sn」的脏数据
    // （如合同 #139 order_sn=XS202604038966 / order_no=XS202604038854），
    // 单遍写入会让后写的把真正的主人顶掉，钱就记到别人头上。
    for (const key of ['order_sn', 'order_no'] as const) {
      for (const r of kept) {
        const k = String(r[key] || '').trim()
        if (!k || map.has(k)) continue
        map.set(k, { id: idOf(r), name: String(nameOf(r) || '').trim() })
      }
    }
    return map
  }
  const contractOwnerBySn = ownerBySn(
    source.contracts || [], isEffectiveSaleContract,
    (c) => Number(c.customer_id || 0), (c) => c.customer_name,
  )
  const orderOwnerBySn = ownerBySn(
    source.purchaseOrders || [], (o) => Number(o.status) === 1,
    getProcureOrderSupplierId, (o) => o.supplier_name,
  )
  const isOwner = (owner: { id: number; name: string }, id: number, name: string) =>
    (id > 0 && owner.id === id) || nameEq(owner.name, name)

  // ── 应收侧（我供货给他）────────────────────────────────────────────────
  for (const c of source.contracts || []) {
    if (!isEffectiveSaleContract(c)) continue // status 1/4
    if (!isThisCustomer(c)) continue
    const amount = money(calcSaleContractReceivable(c))
    if (amount <= 0) continue
    lines.push({
      date: dateOnly(c.order_date || c.created_at),
      side: 'recv',
      type: '销售合同',
      order_sn: String(c.order_sn || c.order_no || ''),
      summary: String(c.remark || '') || '销售发货',
      debit: amount,
      credit: 0,
      collected: 0,
      paid: 0,
      offset: 0,
    })
  }

  for (const r of source.saleReturns || []) {
    if (Number(r.status) !== 1) continue
    if (!isThisCustomer(r)) continue
    const amount = money(r.return_amount ?? r.total_amount)
    if (amount <= 0) continue
    lines.push({
      date: dateOnly(r.return_date || r.created_at),
      side: 'recv',
      type: '销售退货',
      order_sn: String(r.order_sn || r.order_no || ''),
      summary: String(r.remark || r.reason || '') || '退货冲减应收',
      debit: 0,
      credit: 0,
      collected: 0,
      paid: 0,
      offset: amount,
    })
  }

  for (const r of source.collectReceipts || []) {
    // [other] 前缀是杂项收入，不是客户回款（与 receivableCalc.ts 口径一致）
    if (String(r.remark || '').startsWith('[other]')) continue
    // order_sn 能对上合同时以合同主人为准，对不上才回退到收款单自己的客户字段
    const owner = contractOwnerBySn.get(String(r.order_sn || '').trim())
    if (owner) {
      if (!isOwner(owner, custId, custName)) continue
    } else if (!isThisCustomer(r) && !nameEq(r.contact_name, custName)) continue
    const amount = money(r.amount)
    if (amount <= 0) continue
    lines.push({
      date: dateOnly(r.receipt_date || r.created_at),
      side: 'recv',
      type: '收款单',
      order_sn: String(r.receipt_no || r.order_sn || ''),
      summary: String(r.fund_name || '') || '收款',
      debit: 0,
      credit: 0,
      collected: amount,
      paid: 0,
      offset: 0,
    })
  }

  // ── 应付侧（我从他拿货）──────────────────────────────────────────────
  if (hasSupplier) {
    const feePaidByOrder = buildProcureFeePaidByOrder(filterManualPayRows(source.payReceipts || []))
    for (const o of source.purchaseOrders || []) {
      if (Number(o.status) !== 1) continue
      if (!isThisSupplier(o)) continue
      // 与 payableCalc.ts:78/85 同口径：订单金额 + 我方承担的附加费用
      const amount = money(Number(o.after_discount ?? o.total_amount ?? 0) + getProcureFeeNeedPayAmount(o))
      if (amount <= 0) continue
      const sn = String(o.order_sn || o.order_no || '')
      lines.push({
        date: dateOnly(o.order_date || o.created_at),
        side: 'pay',
        type: '采购订单',
        order_sn: sn,
        summary: String(o.remark || '') || '采购入库',
        debit: 0,
        credit: amount,
        collected: 0,
        paid: 0,
        offset: 0,
      })
      // 采购单本体已付：payableCalc 口径下 o.pay_amount 已经包含所有 order_sn 链接到本单的
      // 付款单（含"审核自动生成"的系统付款单），所以已付只认 o.pay_amount + 附加费用已付，
      // 链接型付款单不再单列，否则同一笔钱会算两次。
      const paidOnOrder = money(Number(o.pay_amount || 0) + (feePaidByOrder[o.id] || 0))
      if (paidOnOrder > 0) {
        lines.push({
          date: dateOnly(o.pay_date || o.order_date || o.created_at),
          side: 'pay',
          type: '采购付款',
          order_sn: sn,
          summary: '采购单付款',
          debit: 0,
          credit: 0,
          collected: 0,
          paid: paidOnOrder,
          offset: 0,
        })
      }
    }

    for (const r of source.procureReturns || []) {
      if (Number(r.status) !== 1) continue
      if (!isThisSupplier(r)) continue
      const amount = money(r.total_amount ?? r.return_amount)
      if (amount <= 0) continue
      lines.push({
        date: dateOnly(r.return_date || r.created_at),
        side: 'pay',
        type: '采购退货',
        order_sn: String(r.order_sn || r.order_no || ''),
        summary: String(r.remark || '') || '退货冲减应付',
        debit: 0,
        credit: 0,
        collected: 0,
        paid: 0,
        offset: amount,
      })
    }

    // 未链接到任何采购单的手工付款（从应付款页多订单路径付的钱，没有 order_sn）。
    // 排除"审核自动生成"的系统付款单，且 order_sn 能对上采购单的也跳过 —— 那些已计入上面的
    // 「采购付款」行（与 payableCalc.ts:50-51 同口径）。
    for (const r of filterManualPayRows(source.payReceipts || [])) {
      if (String(r.contact_type || '') !== 'supplier') continue
      if (orderOwnerBySn.has(String(r.order_sn || '').trim())) continue
      if (!isThisSupplier(r)) continue
      const amount = money(r.amount)
      if (amount <= 0) continue
      lines.push({
        date: dateOnly(r.pay_date || r.created_at),
        side: 'pay',
        type: '付款单',
        order_sn: String(r.receipt_no || r.order_sn || ''),
        summary: String(r.fund_name || '') || '付款',
        debit: 0,
        credit: 0,
        collected: 0,
        paid: amount,
        offset: 0,
      })
    }
  }

  return lines.sort((a, b) => (a.date === b.date ? a.side.localeCompare(b.side) : a.date.localeCompare(b.date)))
}

/**
 * 生成一张对账单：期初 / 本期明细 / 期末。
 *
 * @param source    全量单据（不要预过滤日期）
 * @param partner   往来单位
 * @param startDate 区间开始 YYYY-MM-DD（含）
 * @param endDate   区间结束 YYYY-MM-DD（含）
 */
export function buildStatement(
  source: StatementSource,
  partner: StatementPartner,
  startDate: string,
  endDate: string,
): StatementResult {
  const ledger = buildLedger(source, partner)
  const from = String(startDate || '')
  const to = String(endDate || '')

  // 期初：区间开始之前的全部往来
  let openingRecv = 0
  let openingPay = 0
  const lines: StatementLine[] = []

  for (const l of ledger) {
    if (from && l.date < from) {
      if (l.side === 'recv') openingRecv += l.debit - l.offset - l.collected
      else openingPay += l.credit - l.offset - l.paid
      continue
    }
    if (to && l.date > to) continue
    lines.push(l)
  }

  const sum = (pick: (l: StatementLine) => number, side?: 'recv' | 'pay') =>
    money(lines.filter((l) => !side || l.side === side).reduce((s, l) => s + pick(l), 0))

  const recvGross = sum((l) => l.debit, 'recv')
  const recvOffset = sum((l) => l.offset, 'recv')
  const payGross = sum((l) => l.credit, 'pay')
  const payOffset = sum((l) => l.offset, 'pay')
  const collected = sum((l) => l.collected, 'recv')
  const paid = sum((l) => l.paid, 'pay')

  const recvAmount = money(recvGross - recvOffset)
  const payAmount = money(payGross - payOffset)
  openingRecv = money(openingRecv)
  openingPay = money(openingPay)

  const closingRecv = money(openingRecv + recvAmount - collected)
  const closingPay = money(openingPay + payAmount - paid)

  return {
    lines,
    summary: {
      opening_recv: openingRecv,
      opening_pay: openingPay,
      opening_balance: money(openingRecv - openingPay),
      recv_amount: recvAmount,
      pay_amount: payAmount,
      collected_amount: collected,
      paid_amount: paid,
      closing_recv: closingRecv,
      closing_pay: closingPay,
      net_amount: money(closingRecv - closingPay),
    },
  }
}

/**
 * 给明细行算逐行滚动余额（打印用）。
 * 应收侧和应付侧各自独立滚动，起点是各自的期初。
 */
export function withRunningBalance(
  lines: StatementLine[],
  openingRecv: number,
  openingPay: number,
): (StatementLine & { balance: number })[] {
  let recv = Number(openingRecv || 0)
  let pay = Number(openingPay || 0)
  return lines.map((l) => {
    if (l.side === 'recv') {
      recv = money(recv + l.debit - l.offset - l.collected)
      return { ...l, balance: recv }
    }
    pay = money(pay + l.credit - l.offset - l.paid)
    return { ...l, balance: pay }
  })
}

/**
 * 状态 → i18n key 后缀（完整 key 为 `finance.statement.<后缀>`）。
 * 这里只给 key 不给文案：utils 是纯函数层，不引入 i18n 实例（见 CLAUDE.md 目录规范），
 * 由页面自己 t() 翻译，中英文界面都能正确显示。
 */
export const STATEMENT_STATUS_KEY: Record<number, string> = {
  0: 'statusDraft',
  1: 'statusSent',
  2: 'statusConfirmed',
  3: 'statusDisputed',
  4: 'statusSettled',
}

/** 状态号 → 完整 i18n key，供页面 t() 用 */
export function statementStatusKey(status: any): string {
  const k = STATEMENT_STATUS_KEY[Number(status)]
  return k ? `finance.statement.${k}` : ''
}

export const STATEMENT_STATUS_TYPE: Record<number, string> = {
  0: 'info',
  1: 'warning',
  2: 'success',
  3: 'danger',
  4: 'success',
}
