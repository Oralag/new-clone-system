/**
 * 利润计算共享模块 — 全系统唯一口径
 *
 * 背景：利润相关计算曾在 reports/Profit.vue、reports/Finance.vue、reports/Overview.vue、
 * finance/Overview.vue 各自复制一份，算法互相矛盾（成本是否含多单位换算/BOM物料均价、
 * 销售额是否防 "0.00" 字符串短路、费用是否排除采购单据支出等），导致各页利润对不上。
 *
 * 本模块以 reports/Profit.vue 的算法为基准（最完善的一版）：
 * - 成本 = 采购入库移动加权均价（含多单位换算 + 脏数据校验），BOM成品 = 物料均价合成，兜底商品档案成本价
 * - 合同销售额 = after_discount（仅当 0 < after_discount ≤ total 时认，防过期数据）→ total → 行金额合计 → 数量×单价
 * - 零售销售额 = total − discount（应收口径）→ 行金额合计 → pay_amount
 * - 利润费用 = 排除 pending（未付）与「采购单据支出 #ID」（货款已按商品成本计入，再扣即双重扣减）
 *
 * 铁律：任何利润口径调整只改这里，所有页面引用本模块，禁止再复制算法。
 */

// ── 基础取值 ────────────────────────────────────────────────────────────────

/** 依次尝试字段，只接受 > 0 的数值（避免 "0.00" 字符串在 || 链中短路） */
export function toNum(...values: any[]): number {
  for (const v of values) {
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

export function toText(...values: any[]): string {
  for (const v of values) {
    const s = String(v ?? '').trim()
    if (s) return s
  }
  return ''
}

/** 解析单据 goods_info（兼容数组 / 对象 / JSON字符串 / 双重序列化） */
export function parseItems(info: any): any[] {
  if (!info) return []
  if (Array.isArray(info)) return info
  if (typeof info === 'object') {
    if (Array.isArray(info.goods_info)) return info.goods_info
    if (Array.isArray(info.items)) return info.items
    return []
  }
  try {
    const parsed = JSON.parse(info)
    return parseItems(parsed)
  } catch {
    return []
  }
}

export function itemQty(item: any): number {
  return toNum(item?.num, item?.qty, item?.quantity, item?.goods_num, item?.number, item?.count)
}

export function itemPrice(item: any): number {
  return toNum(item?.price, item?.sell_price, item?.sale_price, item?.unit_price, item?.retail_price, item?.amount_price)
}

export function itemLineAmount(item: any): number {
  return toNum(item?.line_amount)
}

export function itemCost(item: any): number {
  return toNum(item?.cost_price, item?.cost, item?.costPrice, item?.purchase_price, item?.in_price, item?.avg_price)
}

export function itemName(item: any): string {
  return toText(item?.goods_name, item?.name, item?.product_name, item?.title)
}

export function itemSn(item: any): string {
  return toText(item?.goods_sn, item?.sn, item?.goods_code, item?.code, item?.barcode)
}

// ── 单位换算 ────────────────────────────────────────────────────────────────

/**
 * 从 spec 字段解析大单位→基础单位的换算比
 * 格式1: "400/箱/0.423/球" 或 "24/盒" → 首段为纯整数
 * 格式2: "450g/25袋" → 某段为 "N+基础单位名"（如 "25袋" 且基础单位=袋）
 */
export function parseSpecRatio(spec: string, baseUnit = ''): number {
  if (!spec) return 1
  const segments = spec.split('/')
  if (baseUnit) {
    for (const seg of segments) {
      const m = seg.trim().match(/^(\d+)(.+)$/)
      if (m) {
        const n = Number(m[1])
        if (n > 1 && m[2].includes(baseUnit)) return n
      }
    }
  }
  const first = (segments[0] || '').trim()
  const n = Number(first)
  return Number.isInteger(n) && n > 1 ? n : 1
}

/** GoodsUnitConvert 行 → goods_id -> { unit_name -> ratio } */
export function buildUnitConvertMap(rows: any[]): Record<number, Record<string, number>> {
  const m: Record<number, Record<string, number>> = {}
  for (const r of rows || []) {
    const gid = Number(r.goods_id)
    const ratio = Number(r.ratio)
    if (!gid || !r.unit_name || !ratio) continue
    if (!m[gid]) m[gid] = {}
    m[gid][r.unit_name] = ratio
  }
  return m
}

// ── 成本上下文 ──────────────────────────────────────────────────────────────

export interface BomItemFlat {
  /** 成品编码 */
  finished_sn: string
  /** 物料编码 */
  goods_sn: string
  num: number
  /** BOM 配置价（无采购记录时兜底） */
  price: number
}

export interface ProfitCostContext {
  goodsList: any[]
  /** goods_id -> 基础单位成本 */
  costMap: Record<number, number>
  unitConvertMap: Record<number, Record<string, number>>
  hasBomSet: Set<number>
  /** 是否有采购入库数据（仅影响成本来源文案） */
  hasInhouseData: boolean
}

/**
 * goods_id -> 移动加权平均价（采购入库 + BOM物料成本），兜底商品 cost_price
 * 统一存基础单位（ratio=1）的成本，避免"斤"成本被当成"块"成本乘以数量
 */
function buildGoodsCostMap(
  goodsList: any[],
  inhouseList: any[],
  bomItems: BomItemFlat[],
  unitConvertMap: Record<number, Record<string, number>>,
): Record<number, number> {
  const m: Record<number, number> = {}
  const goodsBySn: Record<string, any> = {}
  for (const g of goodsList) { if (g.goods_sn) goodsBySn[g.goods_sn] = g }

  for (const g of goodsList) {
    const rawCost = toNum(g.cost_price, g.purchase_price, g.avg_price, g.in_price)
    // 若 goods.unit_name 在换算表中 ratio>1，说明它是大单位，需折算为基础单位
    const goodsUnitRatio = (g.unit_name && unitConvertMap[g.id])
      ? (unitConvertMap[g.id][g.unit_name] ?? 1)
      : 1
    m[g.id] = goodsUnitRatio > 1 ? rawCost / goodsUnitRatio : rawCost
  }

  // 预扫描：unit_ratio 明确设置(>1)的记录 → 每个(sn,单位)的显式均价
  // 给 unit_ratio=null 的老记录提供参考价，过滤单位录错的脏数据
  const snUnitExplicitAvg: Record<string, Record<string, number>> = {}
  for (const ih of inhouseList) {
    if (Number(ih.status) !== 1) continue
    try {
      const snUnitCost: Record<string, Record<string, number>> = {}
      const snUnitQty: Record<string, Record<string, number>> = {}
      for (const item of parseItems(ih.goods_info)) {
        const sn = itemSn(item)
        if (!sn) continue
        const explicitRatio = item.unit_ratio != null ? Number(item.unit_ratio) : null
        if (!explicitRatio || explicitRatio <= 1) continue
        const unitName = String(item.unit_name || '')
        const qty = itemQty(item)
        const price = toNum(item.price, item.price_no_tax, item.cost_price, item.in_price, item.avg_price)
        if (!unitName || qty <= 0 || price <= 0) continue
        if (!snUnitCost[sn]) { snUnitCost[sn] = {}; snUnitQty[sn] = {} }
        snUnitCost[sn][unitName] = (snUnitCost[sn][unitName] || 0) + qty * price
        snUnitQty[sn][unitName] = (snUnitQty[sn][unitName] || 0) + qty
      }
      for (const [sn, units] of Object.entries(snUnitCost)) {
        if (!snUnitExplicitAvg[sn]) snUnitExplicitAvg[sn] = {}
        for (const [u, cost] of Object.entries(units)) {
          const q = snUnitQty[sn][u]
          if (q > 0) snUnitExplicitAvg[sn][u] = cost / q
        }
      }
    } catch {}
  }

  const snTotalCost: Record<string, number> = {}
  const snTotalQty: Record<string, number> = {}
  for (const ih of inhouseList) {
    if (Number(ih.status) !== 1) continue
    try {
      for (const item of parseItems(ih.goods_info)) {
        const sn = itemSn(item)
        if (!sn) continue
        const qty = itemQty(item)
        const price = toNum(item.price, item.price_no_tax, item.cost_price, item.in_price, item.avg_price)
        if (qty > 0 && price > 0) {
          const goodsId = Number(item.goods_id || goodsBySn[sn]?.id || 0)
          const unitName = String(item.unit_name || '')
          const baseUnit = goodsBySn[sn]?.unit_name || ''
          const convertRatio = goodsId && unitName ? (unitConvertMap[goodsId]?.[unitName] ?? 0) : 0
          const explicitRatio = item.unit_ratio != null ? Number(item.unit_ratio) : null
          let ratio: number
          if (explicitRatio != null && explicitRatio > 1) {
            ratio = explicitRatio
          } else if (convertRatio > 1) {
            // explicit=null 或 ≤1（录入错误/老数据）：用显式均价验证
            // 价格远低于同单位显式均价 × 0.25 → 是基础单位价格录错了单位
            const explicitAvg = snUnitExplicitAvg[sn]?.[unitName]
            if (explicitAvg != null && price < explicitAvg * 0.25) {
              ratio = 1
            } else {
              ratio = convertRatio
            }
          } else {
            ratio = Math.max(1, parseSpecRatio(item.spec || goodsBySn[sn]?.spec || '', baseUnit))
          }
          if (unitName && baseUnit && unitName !== baseUnit && ratio === 1) continue
          snTotalCost[sn] = (snTotalCost[sn] || 0) + qty * price
          snTotalQty[sn] = (snTotalQty[sn] || 0) + qty * ratio
        }
      }
    } catch {}
  }

  // 物料移动均价（BOM 成本计算优先于 BOM 配置价）
  const snAvgPrice: Record<string, number> = {}
  for (const sn in snTotalQty) {
    if (snTotalQty[sn] > 0) snAvgPrice[sn] = snTotalCost[sn] / snTotalQty[sn]
  }
  // 非 BOM 商品：采购均价覆盖 goods.cost_price
  for (const g of goodsList) {
    const sn = g.goods_sn
    if (sn && snTotalQty[sn] > 0) {
      m[g.id] = snTotalCost[sn] / snTotalQty[sn]
    }
  }
  // BOM 成品：成本 = sum(物料用量 × 采购移动均价，无采购记录时兜底BOM配置价)
  const bomItemsByFinished: Record<string, BomItemFlat[]> = {}
  for (const item of bomItems) {
    if (!item.finished_sn) continue
    ;(bomItemsByFinished[item.finished_sn] ??= []).push(item)
  }
  for (const [fsn, items] of Object.entries(bomItemsByFinished)) {
    const cost = items.reduce((s, mat) => {
      const price = snAvgPrice[mat.goods_sn] || mat.price || 0
      return s + mat.num * price
    }, 0)
    if (cost > 0) {
      const g = goodsList.find(x => x.goods_sn === fsn)
      if (g) m[g.id] = cost
    }
  }
  return m
}

/**
 * 构建成本上下文。
 * BOM API 约定（已实测）：/goods/BomGoods/index 只返回成品头（goods_name/goods_sn），
 * 物料必须走 /goods/BomGoods/detail 的 items；BOM 头的 goods_id 恒为 0，只能按 goods_sn 匹配成品。
 */
export function createProfitCostContext(opts: {
  goodsList: any[]
  inhouseList: any[]
  /** BOM 头（/goods/BomGoods/index 的 list） */
  bomHeaders: any[]
  /** BOM 物料明细（loadBomItems 的结果），可空 */
  bomItems?: BomItemFlat[]
  /** GoodsUnitConvert 行（loadUnitConvertRows 的结果），可空 */
  unitConvertRows?: any[]
}): ProfitCostContext {
  const goodsList = opts.goodsList || []
  const inhouseList = opts.inhouseList || []
  const unitConvertMap = buildUnitConvertMap(opts.unitConvertRows || [])
  const costMap = buildGoodsCostMap(goodsList, inhouseList, opts.bomItems || [], unitConvertMap)
  const bomSnSet = new Set((opts.bomHeaders || []).map((b: any) => b.goods_sn).filter(Boolean))
  const hasBomSet = new Set<number>()
  for (const g of goodsList) {
    if (g.goods_sn && bomSnSet.has(g.goods_sn)) hasBomSet.add(Number(g.id))
  }
  return { goodsList, costMap, unitConvertMap, hasBomSet, hasInhouseData: inhouseList.length > 0 }
}

// ── 数据加载辅助（只读接口，不做任何写操作） ────────────────────────────────

type HttpLike = { get: (url: string, config?: any) => Promise<any> }

/** GoodsUnitConvert 不支持全量查询（不带 goods_id 返回空），必须按多单位商品逐个查 */
export async function loadUnitConvertRows(http: HttpLike, goodsList: any[]): Promise<any[]> {
  const multiUnitGoods = (goodsList || []).filter((g: any) => g.multi_unit)
  const results = await Promise.allSettled(multiUnitGoods.map((g: any) =>
    http.get('/goods/GoodsUnitConvert/index', { params: { goods_id: g.id, list_rows: 50 } })
  ))
  const rows: any[] = []
  for (const res of results) {
    if (res.status === 'fulfilled') rows.push(...((res.value as any)?.data?.rows ?? []))
  }
  return rows
}

/** 拉取每个 BOM 头的物料明细并展平 */
export async function loadBomItems(http: HttpLike, bomHeaders: any[]): Promise<BomItemFlat[]> {
  const results = await Promise.allSettled((bomHeaders || []).map((bom: any) =>
    http.get('/goods/BomGoods/detail', { params: { id: bom.id } })
  ))
  const flat: BomItemFlat[] = []
  results.forEach((res, i) => {
    if (res.status !== 'fulfilled') return
    const header = bomHeaders[i]
    for (const mat of ((res.value as any)?.data?.items ?? [])) {
      flat.push({
        finished_sn: header.goods_sn,
        goods_sn: mat.goods_sn || '',
        num: Number(mat.num || 0),
        price: Number(mat.price || 0),
      })
    }
  })
  return flat
}

// ── 单条商品行成本 ──────────────────────────────────────────────────────────

export function resolveGoodsId(item: any, goodsList: any[], aliasResolver?: (item: any, goodsList: any[]) => any): number {
  const id = Number(item?.goods_id || item?.id || item?.product_id || item?.shop_goods_id || 0)
  if (aliasResolver) {
    const canonical = aliasResolver(item, goodsList)
    if (canonical?.id) return Number(canonical.id)
  }
  if (id > 0) return id
  const sn = itemSn(item)
  const name = itemName(item)
  const matched = goodsList.find(g =>
    (sn && String(g.goods_sn || '').trim() === sn) ||
    (sn && String(g.barcode || '').trim() === sn) ||
    (name && String(g.goods_name || '').trim() === name)
  )
  return Number(matched?.id || 0)
}

export interface UnitCostResult {
  unitCost: number
  hasBom: boolean
  costSource: string
}

/**
 * costMap 存基础单位成本；按订单行实际单位放大。
 * 只有订单行明确 unit_ratio>1 才放大；unit_ratio=null 且单位是大单位时保守不放大（老数据单位标签可能录错）。
 */
function getUnitCostById(goodsId: number, ctx: ProfitCostContext, itemUnit = '', unitRatioHint: number | null = null): UnitCostResult {
  const baseCost = ctx.costMap[goodsId] || 0
  const convertRatio = (itemUnit && goodsId && ctx.unitConvertMap[goodsId])
    ? (ctx.unitConvertMap[goodsId][itemUnit] ?? 1)
    : 1
  const itemUnitRatio = (unitRatioHint != null && unitRatioHint > 1)
    ? unitRatioHint
    : (convertRatio > 1 && unitRatioHint == null) ? 1
    : convertRatio
  const c = baseCost * itemUnitRatio
  const hasBom = ctx.hasBomSet.has(goodsId)
  return {
    unitCost: c,
    hasBom,
    costSource: c > 0 ? `${ctx.hasInhouseData ? '采购均价' : '采购价'} ¥${c.toFixed(2)}${hasBom ? '（含BOM）' : ''}` : '未设置成本价',
  }
}

/** 订单/合同/零售商品行的单位成本：BOM优先 → 采购均价 → 单据自带成本价兜底 */
export function getItemUnitCost(item: any, ctx: ProfitCostContext, aliasResolver?: (item: any, goodsList: any[]) => any): UnitCostResult {
  const goodsId = resolveGoodsId(item, ctx.goodsList, aliasResolver)
  const itemUnit = toText(item?.unit_name, item?.unit)
  const unitRatioHint = item?.unit_ratio != null ? Number(item.unit_ratio) : null
  const byId = getUnitCostById(goodsId, ctx, itemUnit, unitRatioHint)
  if (byId.hasBom && byId.unitCost > 0) return byId
  if (byId.unitCost > 0) return byId
  const direct = itemCost(item)
  if (direct > 0) return { unitCost: direct, hasBom: false, costSource: `单据成本 ¥${direct.toFixed(2)}` }
  return byId
}

// ── 销售额口径 ──────────────────────────────────────────────────────────────

/**
 * 合同销售额（唯一口径）：
 * after_discount 仅当 0 < after_discount ≤ total 时采用（after_discount > total 是编辑后未同步的过期数据）；
 * 然后 total / goods_amount / contract_amount / amount；再兜底行金额合计、数量×单价合计。
 */
export function calcContractSaleAmount(c: any): number {
  const total = toNum(c?.total_amount)
  const afterDisc = Number(c?.after_discount)
  if (Number.isFinite(afterDisc) && afterDisc > 0 && (total <= 0 || afterDisc <= total)) return afterDisc
  const direct = toNum(total, c?.goods_amount, c?.contract_amount, c?.amount)
  if (direct > 0) return direct
  const items = parseItems(c?.goods_info)
  const lineSum = items.reduce((s, g) => s + itemLineAmount(g), 0)
  if (lineSum > 0) return lineSum
  return items.reduce((s, g) => s + itemQty(g) * itemPrice(g), 0)
}

/**
 * 零售单销售额（唯一口径，应收口径）：
 * total − discount（避免欠款未付时把实收当销售额）→ 行金额合计 → pay_amount 兜底
 */
export function calcRetailSaleAmount(r: any): number {
  const afterDiscount = Number(r?.total_amount || 0) - Number(r?.discount_amount || 0)
  if (afterDiscount > 0) return afterDiscount
  const items = parseItems(r?.goods_info)
  const lineSum = items.reduce((s, g) => s + (itemLineAmount(g) || itemQty(g) * itemPrice(g)), 0)
  if (lineSum > 0) return lineSum
  return toNum(r?.pay_amount, r?.after_discount)
}

// ── 运费 / 费用 / 日期 ──────────────────────────────────────────────────────

/** 我方承担的运费：seller 全付 / half 各半 / buyer、free 不计 */
export function myFreightShare(row: any): number {
  const f = Number(row?.freight_amount || 0)
  if (!f) return 0
  if (row?.freight_bearer === 'seller') return f
  if (row?.freight_bearer === 'half') return f / 2
  return 0
}

/** 「采购单据支出 #ID」费用行 = 采购货款付款，货款已按商品成本计入利润，费用侧必须排除 */
export function isDocPaymentExpense(row: any): boolean {
  return /采购单据支出\s*#\d+/.test(String(row?.remark || ''))
}

/** 利润口径的费用：排除未付(pending)和采购单据支出（防双重扣减） */
export function filterProfitExpenses(rows: any[]): any[] {
  return (rows || []).filter(r =>
    r?.payment_status !== 'pending' &&
    Number(r?.amount || 0) > 0 &&
    !isDocPaymentExpense(r)
  )
}

/** 合同归属日期（分月/分日统一用这个，避免各页用不同字段导致月份对不上） */
export function contractDateOf(c: any): string {
  return String(c?.contract_date || c?.sign_date || c?.order_date || c?.create_time || c?.created_at || '')
}

export function retailDateOf(r: any): string {
  return String(r?.order_date || r?.create_time || r?.created_at || '')
}

export function expenseDateOf(e: any): string {
  return String(e?.expense_date || e?.create_time || e?.created_at || '')
}

// ── 订单级 / 商品级利润 ─────────────────────────────────────────────────────

export interface OrderProfitItem {
  key: string
  goods_id: number
  goods_name: string
  goods_sn: string
  unit_name: string
  qty: number
  sale_amount: number
  unit_cost: number
  cost_amount: number
  profit: number
  profit_rate: number
  has_bom: boolean
  cost_source: string
}

/** 把一张单的商品行按整单销售额折算出每行销售额/成本/利润 */
export function buildOrderItems(
  goodsInfo: any,
  saleAmount: number,
  ctx: ProfitCostContext,
  aliasResolver?: (item: any, goodsList: any[]) => any,
): OrderProfitItem[] {
  const items = parseItems(goodsInfo)
  const rawTotal = items.reduce((s, g) => s + itemQty(g) * itemPrice(g), 0)
  const totalQty = items.reduce((s, g) => s + itemQty(g), 0)
  const ratio = rawTotal > 0 ? saleAmount / rawTotal : 1

  return items.map((g, index) => {
    const qty = itemQty(g)
    const goodsId = resolveGoodsId(g, ctx.goodsList, aliasResolver)
    const goods = ctx.goodsList.find(x => x.id === goodsId)
    const cost = getItemUnitCost(g, ctx, aliasResolver)
    const lineSale = rawTotal > 0
      ? qty * itemPrice(g) * ratio
      : (totalQty > 0 ? saleAmount * qty / totalQty : 0)
    const costAmount = qty * cost.unitCost
    const profit = lineSale - costAmount
    return {
      key: `${goodsId || itemSn(g) || itemName(g) || index}_${index}`,
      goods_id: goodsId,
      goods_name: goods?.goods_name || itemName(g) || '-',
      goods_sn: goods?.goods_sn || itemSn(g) || '',
      unit_name: toText(g?.unit_name, g?.unit, goods?.unit_name),
      qty,
      sale_amount: lineSale,
      unit_cost: cost.unitCost,
      cost_amount: costAmount,
      profit,
      profit_rate: lineSale > 0 ? (profit / lineSale * 100) : 0,
      has_bom: cost.hasBom,
      cost_source: cost.costSource,
    }
  })
}

export interface GoodsProfitRow {
  goods_name: string
  goods_id: number
  num: number
  sale_amount: number
  unit_cost: number
  has_bom: boolean
  cost_source: string
  source: string
  cost_amount: number
  profit: number
  profit_rate: number
}

/**
 * 按单品聚合利润。docs = 各单据 { goodsInfo, source, saleAmount }（saleAmount 用 calcContractSaleAmount / calcRetailSaleAmount 算好传入）
 * keyWithSource=true 时同一商品按来源分行（合同/零售各一行）
 */
export function aggregateGoodsProfit(
  docs: Array<{ goodsInfo: any; source: string; saleAmount: number }>,
  ctx: ProfitCostContext,
  opts: { keyWithSource?: boolean; aliasResolver?: (item: any, goodsList: any[]) => any } = {},
): GoodsProfitRow[] {
  const map: Record<string, Omit<GoodsProfitRow, 'cost_amount' | 'profit' | 'profit_rate'>> = {}
  for (const doc of docs) {
    const items = parseItems(doc.goodsInfo)
    if (!items.length) continue
    const rawTotal = items.reduce((s, g) => s + itemQty(g) * itemPrice(g), 0)
    const totalQty = items.reduce((s, g) => s + itemQty(g), 0)
    const ratio = rawTotal > 0 ? doc.saleAmount / rawTotal : 1
    try {
      for (const g of items) {
        const goodsId = resolveGoodsId(g, ctx.goodsList, opts.aliasResolver)
        const goodsName = ctx.goodsList.find(x => x.id === goodsId)?.goods_name || itemName(g) || '-'
        const baseKey = `${goodsId || itemSn(g) || goodsName}`
        const key = opts.keyWithSource ? `${baseKey}_${doc.source}` : baseKey
        const { unitCost, hasBom, costSource } = getItemUnitCost(g, ctx, opts.aliasResolver)
        if (!map[key]) {
          map[key] = {
            goods_name: goodsName, goods_id: goodsId,
            num: 0, sale_amount: 0,
            unit_cost: unitCost, has_bom: hasBom, cost_source: costSource, source: doc.source,
          }
        } else if (!opts.keyWithSource && !map[key].source.includes(doc.source)) {
          map[key].source += '+' + doc.source
        }
        const qty = itemQty(g)
        const lineAmount = itemLineAmount(g)
        const price = lineAmount > 0
          ? lineAmount / Math.max(qty, 1)
          : (rawTotal > 0 ? itemPrice(g) * ratio : (totalQty > 0 ? doc.saleAmount / totalQty : 0))
        map[key].num += qty
        map[key].sale_amount += qty * price
      }
    } catch {}
  }
  return Object.values(map)
    .map(r => ({
      ...r,
      cost_amount: r.num * r.unit_cost,
      profit: r.sale_amount - r.num * r.unit_cost,
      profit_rate: r.sale_amount > 0
        ? ((r.sale_amount - r.num * r.unit_cost) / r.sale_amount * 100) : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
}

/** 整单商品成本合计 */
export function calcOrderCost(goodsInfo: any, ctx: ProfitCostContext, aliasResolver?: (item: any, goodsList: any[]) => any): number {
  let cost = 0
  for (const g of parseItems(goodsInfo)) cost += itemQty(g) * getItemUnitCost(g, ctx, aliasResolver).unitCost
  return cost
}

// ── 按月利润 ────────────────────────────────────────────────────────────────

export interface MonthProfitRow {
  month: string
  revenue: number
  cost: number
  expense: number
  freight: number
  /** 单据附加费（采购单/合同 expense_amount，不在商品成本里，需单独扣） */
  docExpense: number
  grossProfit: number
  grossRate: number
  netProfit: number
  netRate: number
}

/**
 * 按月利润（唯一口径）：
 * 净利 = 毛利 − 我方运费 − 经营费用(filterProfitExpenses) − 单据附加费(docExpense)
 */
export function aggregateMonthProfit(
  input: {
    contracts: any[]
    retails: any[]
    expenses: any[]
    /** 已审核采购单（expense_amount 计入 docExpense），可空 */
    procureOrders?: any[]
    /** 已审核换货单，可空 */
    exchanges?: any[]
  },
  ctx: ProfitCostContext,
  aliasResolver?: (item: any, goodsList: any[]) => any,
): MonthProfitRow[] {
  const map: Record<string, { month: string; revenue: number; cost: number; expense: number; freight: number; docExpense: number }> = {}
  const ensure = (m: string) => { if (!map[m]) map[m] = { month: m, revenue: 0, cost: 0, expense: 0, freight: 0, docExpense: 0 } }

  for (const c of input.contracts || []) {
    const m = contractDateOf(c).slice(0, 7)
    if (!m) continue
    ensure(m)
    map[m].revenue += calcContractSaleAmount(c)
    map[m].cost += calcOrderCost(c.goods_info, ctx, aliasResolver)
    map[m].freight += myFreightShare(c)
    map[m].docExpense += Number(c.expense_amount || 0)
  }
  for (const r of input.retails || []) {
    const m = retailDateOf(r).slice(0, 7)
    if (!m) continue
    ensure(m)
    map[m].revenue += calcRetailSaleAmount(r)
    map[m].cost += calcOrderCost(r.goods_info, ctx, aliasResolver)
  }
  for (const e of filterProfitExpenses(input.expenses || [])) {
    const m = expenseDateOf(e).slice(0, 7)
    if (!m) continue
    ensure(m)
    map[m].expense += Number(e.amount || 0)
  }
  for (const o of input.procureOrders || []) {
    const m = String(o.order_date || o.create_time || '').slice(0, 7)
    if (!m) continue
    ensure(m)
    map[m].docExpense += Number(o.expense_amount || 0)
  }
  for (const ex of input.exchanges || []) {
    const m = String(ex.exchange_date || ex.created_at || '').slice(0, 7)
    if (!m) continue
    ensure(m)
    // 换货净收入 = 换出金额 - 退货金额
    map[m].revenue += Number(ex.exchange_amount || 0) - Number(ex.return_amount || 0)
    // 换出商品成本（净额：换出成本，退回成本在原合同里已计入，这里不重复扣回）
    map[m].cost += calcOrderCost(ex.exchange_goods_info, ctx, aliasResolver)
    map[m].freight += myFreightShare(ex)
    // 只计我方承担的费用项，对方承担的是应收不是我方成本
    const feeItems: any[] = Array.isArray(ex.fee_items) ? ex.fee_items : []
    const myFees = feeItems.length > 0
      ? feeItems.filter((f: any) => f.bearer === 'buyer').reduce((s: number, f: any) => s + (Number(f.amount) || 0), 0)
      : Number(ex.expense_amount || 0)
    map[m].docExpense += myFees
  }
  return Object.values(map).map(r => {
    const grossProfit = r.revenue - r.cost
    const netProfit = grossProfit - r.expense - r.freight - r.docExpense
    return {
      ...r, grossProfit, netProfit,
      grossRate: r.revenue > 0 ? (grossProfit / r.revenue * 100) : 0,
      netRate: r.revenue > 0 ? (netProfit / r.revenue * 100) : 0,
    }
  }).sort((a, b) => b.month.localeCompare(a.month))
}
