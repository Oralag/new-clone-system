const ERP_BASE = 'https://erp-server-xsji.onrender.com/adminapi'

// 内容效果数据内存存储（进程级别，重启清空）
const contentPerformanceStore: Array<Record<string, any>> = []

async function erpGet(path: string, params: Record<string, any>, token: string) {
  const url = new URL(ERP_BASE + path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })
  const res = await fetch(url.toString(), {
    headers: { token, 'Content-Type': 'application/json' },
  })
  return res.json()
}

async function erpPost(path: string, body: Record<string, any>, token: string) {
  const res = await fetch(ERP_BASE + path, {
    method: 'POST',
    headers: { token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

// 删除权限检查：只有管理员（role_name 含"管理"）才能删除，非管理员返回拒绝消息
async function checkDeletePermission(token: string): Promise<string | null> {
  try {
    const res = await fetch(ERP_BASE + '/setting/admin/my', {
      headers: { token, 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (data?.code !== 1) return '无法验证身份，请重新登录'
    const role = data?.data?.role_name || data?.data?.role_type || ''
    // 管理员角色：包含"管理"关键字即为管理员
    if (typeof role === 'string' && role.includes('管理')) return null // 允许删除
    return `⛔ 删除操作需要管理员权限。当前账号角色为「${role || '未知'}」，无权删除。请联系管理员操作。`
  } catch {
    return '无法验证身份，请重新登录'
  }
}

// 过滤掉包装/原材料类商品（用户没有明确说"袋""标签""专用"等词时不显示）
const PACKAGING_KEYWORDS = ['袋', '盒装', '标签', '不干胶', '塑膜', '专用', '包装', '纸箱', '封口', '捆', '膜']
function isPackagingGoods(name: string): boolean {
  return PACKAGING_KEYWORDS.some(kw => name.includes(kw)) && !name.includes('成品')
}

// 计算两个字符串的字符重叠率（用于语音识别模糊匹配）
function charSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const setA = new Set(a)
  let overlap = 0
  for (const ch of setA) if (b.includes(ch)) overlap++
  return overlap / Math.max(setA.size, new Set(b).size)
}

async function resolveGoodsIds(items: any[], token: string): Promise<any[]> {
  return Promise.all(
    items.map(async (item) => {
      // 统一数量字段：qty → num
      const num = item.num ?? item.qty ?? 1
      const normalized = { ...item, num, qty: undefined }
      delete normalized.qty

      if (!normalized.goods_name || normalized.goods_id) return normalized
      try {
        // 第一次：精确关键词搜索
        const res = await erpGet('/goods/ShopGoods/index', { keyword: normalized.goods_name, list_rows: 10 }, token)
        let rows = res?.data?.rows || []
        let matched = rows.find((g: any) =>
          g.goods_name === normalized.goods_name ||
          g.goods_name?.includes(normalized.goods_name) ||
          normalized.goods_name?.includes(g.goods_name)
        )

        // 第二次：精确匹配失败，取前2字模糊搜索 + 字符相似度
        if (!matched && normalized.goods_name.length >= 2) {
          const fuzzyKeyword = normalized.goods_name.slice(0, 2)
          const res2 = await erpGet('/goods/ShopGoods/index', { keyword: fuzzyKeyword, list_rows: 30 }, token)
          const rows2 = res2?.data?.rows || []
          let bestScore = 0
          let bestMatch = null
          for (const g of rows2) {
            const score = charSimilarity(normalized.goods_name, g.goods_name)
            if (score > bestScore) { bestScore = score; bestMatch = g }
          }
          if (bestScore >= 0.6) {
            matched = bestMatch
            normalized._fuzzy_matched = `语音识别已纠正：「${normalized.goods_name}」→「${matched.goods_name}」`
            normalized.goods_name = matched.goods_name
          } else {
            // 完全匹配失败：返回候选列表（过滤包装/原材料），供用户选择
            const candidates = rows2.filter((g: any) => !isPackagingGoods(g.goods_name))
              .slice(0, 8)
              .map((g: any) => ({ id: g.id, name: g.goods_name, unit: g.unit_name, price: g.sell_price }))
            if (candidates.length > 0) {
              normalized._unresolved = true
              normalized._candidates = candidates
            }
          }
        }

        if (matched) return { ...normalized, goods_id: matched.id, goods_sn: matched.goods_sn, unit_name: normalized.unit_name || matched.unit_name, cate_name: matched.cate_name }
      } catch { /* ignore */ }
      return normalized
    })
  )
}

// Volcengine HMAC-SHA256 request signing (compatible with AWS SigV4 style)
async function volcSign(
  accessKeyId: string,
  secretAccessKey: string,
  method: string,
  path: string,
  query: string,
  body: string,
  host: string,
  service: string
): Promise<Record<string, string>> {
  const { createHmac, createHash } = await import('crypto')

  const now = new Date()
  const datestamp = now.toISOString().slice(0, 10).replace(/-/g, '')   // YYYYMMDD
  const amzdate  = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z' // YYYYMMDDTHHmmssZ

  const payloadHash = createHash('sha256').update(body).digest('hex')

  // Canonical headers (must be sorted)
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-date:${amzdate}\n`
  const signedHeaders = 'content-type;host;x-date'

  const canonicalRequest = [
    method,
    path,
    query,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const credentialScope = `${datestamp}/${service}/request`
  const stringToSign = [
    'HMAC-SHA256',
    amzdate,
    credentialScope,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n')

  const sign = (key: Buffer | string, msg: string) =>
    createHmac('sha256', key).update(msg).digest()

  const signingKey = sign(sign(sign(sign('volc' + secretAccessKey, datestamp), service), 'request'), 'aws4_request')
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex')

  const authorization = `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    'Content-Type': 'application/json',
    'Host': host,
    'X-Date': amzdate,
    'Authorization': authorization,
  }
}

export interface ToolContext {
  flowResults?: Array<{
    platform: string
    platformName: string
    topic: string
    type: string
    content: string
    imageUrl?: string
    published?: boolean
  }>
  onPublished?: (index: number) => void
}

export async function executeTool(name: string, input: Record<string, any>, token: string, context?: ToolContext): Promise<string> {
  try {
    let result: string

    switch (name) {
      case 'query_customers': {
        const res = await erpGet('/shop/ShopCustomer/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 位客户。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.nickname || r.name, 手机: r.mobile, 余额: r.balance })))}`
        break
      }
      case 'query_suppliers': {
        const res = await erpGet('/procure/supplier/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 家供应商。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.name, 联系人: r.contact, 手机: r.mobile })))}`
        break
      }
      case 'query_goods': {
        const NON_SALE_CATES = new Set(['塑料袋', '袋子', '亚克力', '广告物料', '标签纸', '设备', '其他成本', '样品采购'])
        const res = await erpGet('/goods/ShopGoods/index', { list_rows: input.limit || 50, keyword: input.keyword }, token)
        const rows = (res?.data?.rows || []).filter((r: any) => !NON_SALE_CATES.has(r.cate_name))
        result = `共 ${rows.length} 种商品。${JSON.stringify(rows.slice(0, 50).map((r: any) => ({ id: r.id, 商品名: r.goods_name, 编码: r.goods_sn, 售价: r.sell_price, 分类: r.cate_name })))}`
        break
      }
      case 'query_inventory': {
        const res = await erpGet('/stock/StockAll/index', { list_rows: 100, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        const totalVal = rows.reduce((s: number, r: any) => s + Number(r.qty || 0) * Number(r.avg_price || 0), 0)
        result = `共 ${rows.length} 种商品，库存总价值约 ¥${totalVal.toFixed(2)}。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ 商品: r.goods_name, 库存: r.qty, 单位: r.unit_name, 仓库: r.warehouse_name, 均价: r.avg_price })))}`
        break
      }
      case 'query_sales': {
        const params: any = { list_rows: input.limit || 20 }
        if (input.start_date) params.start_time = input.start_date
        if (input.end_date) params.end_time = input.end_date
        if (input.customer) params.customer_name = input.customer
        const [outRes, contractRes] = await Promise.all([
          erpGet('/stock/SaleOutOrder/index', params, token),
          erpGet('/shop/ContractOrder/index', params, token),
        ])
        const outRows = outRes?.data?.rows || []
        const outTotal = outRows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        const contractRows = contractRes?.data?.rows || []
        const contractTotal = contractRows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        result = `出货单 ${outRows.length} 条合计 ¥${outTotal.toFixed(2)}，销售合同 ${contractRows.length} 份合计 ¥${contractTotal.toFixed(2)}。出货明细：${JSON.stringify(outRows.slice(0, 10).map((r: any) => ({ id: r.id, 客户: r.customer_name, 金额: r.total_amount, 日期: String(r.out_date || r.created_at || '').slice(0, 10) })))}`
        break
      }
      case 'query_purchases': {
        const params: any = { list_rows: input.limit || 20 }
        if (input.start_date) params.start_time = input.start_date
        if (input.end_date) params.end_time = input.end_date
        if (input.supplier) params.supplier_name = input.supplier
        const res = await erpGet('/stock/PurchaseOrder/index', params, token)
        const rows = res?.data?.rows || []
        const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        result = `共 ${rows.length} 条采购订单，合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ id: r.id, 供应商: r.supplier_name, 金额: r.total_amount, 日期: String(r.order_date || r.created_at || '').slice(0, 10) })))}`
        break
      }
      case 'query_finance': {
        // ⚠️ 注意：/finance/CollectAccounts 和 /finance/PayAccounts 后端返回空，禁止使用
        // 应收 → 已签合同（前端过滤 un_pay_amount > 0）
        // 应付 → 采购订单（前端过滤 status===1，从付款单匹配已付金额）
        if (input.type === 'receivable') {
          const res = await erpGet('/shop/ContractOrder/index', { list_rows: input.limit || 100, status: 1 }, token)
          const rows = (res?.data?.rows || []).map((r: any) => ({
            ...r,
            un_pay_amount: Math.max(0, Number(r.total_amount || 0) - Number(r.pay_amount || 0)),
          })).filter((r: any) => r.un_pay_amount > 0)
          const total = rows.reduce((s: number, r: any) => s + r.un_pay_amount, 0)
          result = `应收账款共 ${rows.length} 笔，待收合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 客户: r.customer_name, 合同金额: r.total_amount, 已收: r.pay_amount, 待收: r.un_pay_amount, 日期: String(r.order_date || r.created_at || '').slice(0, 10) })))}`
          break
        }
        if (input.type === 'payable') {
          const [purchaseRes, payRes] = await Promise.all([
            erpGet('/stock/PurchaseOrder/index', { list_rows: 500 }, token),
            erpGet('/finance/PayReceipt/index', { list_rows: 1000 }, token),
          ])
          const payRows: any[] = payRes?.data?.rows || []
          // 构建已付 Map（3种匹配方式）
          const paidById: Record<number, number> = {}
          const paidByKey: Record<string, number> = {}
          const paidBySn: Record<string, number> = {}
          for (const r of payRows) {
            const amt = Number(r.amount || 0)
            if (!amt) continue
            const sn = String(r.order_sn || '').trim()
            const sup = String(r.supplier_name || r.contact_name || '').trim()
            if (sn && sup) paidByKey[`${sn}@@${sup}`] = (paidByKey[`${sn}@@${sup}`] || 0) + amt
            const m1 = String(r.remark || '').match(/采购单(?:自动)?付款\s+#(\d+)/)
            if (m1) paidById[Number(m1[1])] = (paidById[Number(m1[1])] || 0) + amt
            const m2 = String(r.remark || '').match(/采购单([A-Za-z0-9]+)审核自动生成/)
            if (m2) paidBySn[m2[1].trim()] = (paidBySn[m2[1].trim()] || 0) + amt
          }
          // 只取已审核采购单（前端过滤 status===1）
          const purchaseRows = (purchaseRes?.data?.rows || []).filter((r: any) => Number(r.status) === 1)
          const supplierMap: Record<string, any> = {}
          for (const o of purchaseRows) {
            const key = o.supplier_id ? `id:${o.supplier_id}` : `name:${String(o.supplier_name || '').trim()}`
            if (!supplierMap[key]) supplierMap[key] = { supplier_name: o.supplier_name || '—', order_amount: 0, paid_amount: 0, un_pay_amount: 0 }
            const s = supplierMap[key]
            const orderAmt = Number(o.after_discount ?? o.total_amount ?? 0)
            const sn = String(o.order_sn || o.order_no || '').trim()
            const sup = String(o.supplier_name || '').trim()
            const paid = paidById[o.id] || paidByKey[`${sn}@@${sup}`] || paidBySn[sn] || 0
            s.order_amount += orderAmt
            s.paid_amount += paid
            s.un_pay_amount += Math.max(0, orderAmt - paid)
          }
          const rows = Object.values(supplierMap).filter((r: any) => r.un_pay_amount > 0)
          const total = rows.reduce((s: number, r: any) => s + r.un_pay_amount, 0)
          result = `应付账款共 ${rows.length} 家供应商有欠款，合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 20))}`
          break
        }
        const typeMap: Record<string, string> = {
          collect: '/finance/CollectReceipt/index',
          pay: '/finance/PayReceipt/index',
          fund: '/finance/Fund/index',
          prepay: '/finance/Prepay/index',
        }
        const path = typeMap[input.type]
        if (!path) { result = '未知财务类型'; break }
        const res = await erpGet(path, { list_rows: input.limit || 50 }, token)
        const rows = res?.data?.rows || []
        result = `${input.type} 共 ${rows.length} 条：${JSON.stringify(rows.slice(0, 20))}`
        break
      }
      case 'audit_finance': {
        // 财务数据逻辑审查：7条完整审查框架
        const issues: string[] = []
        const ok: string[] = []
        try {
          const [collectRes, payRes, purchaseRes, contractRes, fundRes, procureReturnRes, saleReturnRes] = await Promise.all([
            erpGet('/finance/CollectReceipt/index', { list_rows: 200 }, token),
            erpGet('/finance/PayReceipt/index', { list_rows: 500 }, token),
            erpGet('/stock/PurchaseOrder/index', { list_rows: 500 }, token),
            erpGet('/shop/ContractOrder/index', { list_rows: 200 }, token),
            erpGet('/finance/Fund/index', { list_rows: 50 }, token),
            erpGet('/procure/ProcureReturn/index', { list_rows: 200, status: 1 }, token),
            erpGet('/stock/SaleReturnOrder/index', { list_rows: 200, status: 1 }, token),
          ])

          const allPurchase: any[] = purchaseRes?.data?.rows || []
          const auditedPurchase = allPurchase.filter((r: any) => Number(r.status) === 1)
          const payRows: any[] = payRes?.data?.rows || []
          const collectRows: any[] = collectRes?.data?.rows || []
          const allContracts: any[] = contractRes?.data?.rows || []
          const auditedContracts = allContracts.filter((r: any) => Number(r.status) === 1)
          const fundRows: any[] = fundRes?.data?.rows || []
          const procureReturnRows: any[] = procureReturnRes?.data?.rows || []
          const saleReturnRows: any[] = saleReturnRes?.data?.rows || []

          // 构建付款单匹配索引（3种方式）
          const paidById: Record<number, number> = {}
          const paidByKey: Record<string, number> = {}
          const paidBySn: Record<string, number> = {}
          for (const r of payRows) {
            const amt = Number(r.amount || 0); if (!amt) continue
            const sn = String(r.order_sn || '').trim()
            const sup = String(r.supplier_name || r.contact_name || '').trim()
            if (sn && sup) paidByKey[`${sn}@@${sup}`] = (paidByKey[`${sn}@@${sup}`] || 0) + amt
            const m1 = String(r.remark || '').match(/采购单(?:自动)?付款\s+#(\d+)/)
            if (m1) paidById[Number(m1[1])] = (paidById[Number(m1[1])] || 0) + amt
            const m2 = String(r.remark || '').match(/采购单([A-Za-z0-9]+)审核自动生成/)
            if (m2) paidBySn[m2[1].trim()] = (paidBySn[m2[1].trim()] || 0) + amt
          }

          // ① 应付账款核查：已审核采购单合计 - 供应商付款合计 - 退货冲减 = 应付总额
          const totalPurchaseAmt = auditedPurchase.reduce((s: number, o: any) => s + Number(o.after_discount ?? o.total_amount ?? 0), 0)
          const supplierPayRows = payRows.filter((r: any) => (r.contact_type || '') === 'supplier')
          const totalSupplierPaid = supplierPayRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
          const totalProcureReturn = procureReturnRows.reduce((s: number, r: any) => s + Number(r.total_amount || r.amount || 0), 0)
          const calcPayable = totalPurchaseAmt - totalSupplierPaid - totalProcureReturn
          let totalPayable = 0
          for (const o of auditedPurchase) {
            const orderAmt = Number(o.after_discount ?? o.total_amount ?? 0)
            const sn = String(o.order_sn || o.order_no || '').trim()
            const sup = String(o.supplier_name || '').trim()
            const paid = paidById[o.id] || paidByKey[`${sn}@@${sup}`] || paidBySn[sn] || 0
            totalPayable += Math.max(0, orderAmt - paid)
          }
          ok.push(`① 应付账款核查：采购合计 ¥${totalPurchaseAmt.toFixed(2)} - 供应商付款 ¥${totalSupplierPaid.toFixed(2)} - 退货冲减 ¥${totalProcureReturn.toFixed(2)} = 应付 ¥${calcPayable.toFixed(2)}（逐单计算应付 ¥${totalPayable.toFixed(2)}）`)

          // ② 供应商付款单匹配：contact_type=supplier 的付款单必须能匹配到采购单
          const unmatchedSupplierPay: any[] = []
          for (const r of supplierPayRows) {
            const amt = Number(r.amount || 0); if (!amt) continue
            const sn = String(r.order_sn || '').trim()
            const sup = String(r.supplier_name || r.contact_name || '').trim()
            const remark = String(r.remark || '')
            const matchById = remark.match(/采购单(?:自动)?付款\s+#(\d+)/)
            const matchBySn = remark.match(/采购单([A-Za-z0-9]+)审核自动生成/)
            const matchByKey = sn && sup && auditedPurchase.some((o: any) => {
              const osn = String(o.order_sn || o.order_no || '').trim()
              const osup = String(o.supplier_name || '').trim()
              return osn === sn && osup === sup
            })
            const matchByIdFound = matchById && auditedPurchase.some((o: any) => o.id === Number(matchById[1]))
            const matchBySnFound = matchBySn && auditedPurchase.some((o: any) => {
              const osn = String(o.order_sn || o.order_no || '').trim()
              return osn === matchBySn[1].trim()
            })
            if (!matchByKey && !matchByIdFound && !matchBySnFound) {
              unmatchedSupplierPay.push(r)
            }
          }
          if (unmatchedSupplierPay.length > 0) {
            issues.push(`🔴 ② 有 ${unmatchedSupplierPay.length} 条供应商付款单无法匹配到任何采购单（ID: ${unmatchedSupplierPay.slice(0, 5).map((r: any) => r.id).join('、')}${unmatchedSupplierPay.length > 5 ? '...' : ''}）`)
          } else {
            ok.push(`② 供应商付款单匹配正常：${supplierPayRows.length} 条全部可匹配到采购单`)
          }

          // ③ 已全额付款采购单展示逻辑
          const fullyPaidOrders = auditedPurchase.filter((o: any) => {
            const unpay = Number(o.un_pay_amount ?? -1)
            return unpay <= 0 && unpay !== -1
          })
          const hasUnPayField = auditedPurchase.some((o: any) => o.un_pay_amount !== undefined)
          if (hasUnPayField && fullyPaidOrders.length > 0) {
            ok.push(`③ 已全额付款采购单：共 ${fullyPaidOrders.length} 条（un_pay_amount≤0），前端应在应付账款页过滤隐藏`)
          } else {
            ok.push(`③ 已审核采购单 ${auditedPurchase.length} 条（un_pay_amount 字段${hasUnPayField ? '存在' : '不存在'}）`)
          }

          // ④ 应收账款核查：已审核合同合计 - 收款金额 - 销售退货冲减 = 应收总额
          const totalContractAmt = auditedContracts.reduce((s: number, c: any) => s + Number(c.total_amount || 0), 0)
          const customerCollectRows = collectRows.filter((r: any) => (r.contact_type || '') === 'customer')
          const totalCollected = customerCollectRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
          const totalSaleReturn = saleReturnRows.reduce((s: number, r: any) => s + Number(r.total_amount || r.amount || 0), 0)
          const calcReceivable = totalContractAmt - totalCollected - totalSaleReturn
          ok.push(`④ 应收账款核查：合同合计 ¥${totalContractAmt.toFixed(2)} - 客户收款 ¥${totalCollected.toFixed(2)} - 销售退货 ¥${totalSaleReturn.toFixed(2)} = 应收 ¥${calcReceivable.toFixed(2)}`)
          // 收款单匹配合同检查
          const unmatchedCollect: any[] = []
          for (const r of customerCollectRows) {
            const amt = Number(r.amount || 0); if (!amt) continue
            const contactId = r.contact_id || r.customer_id
            const contactName = String(r.contact_name || r.customer_name || '').trim()
            const matched = auditedContracts.some((c: any) => {
              const cid = c.customer_id || c.contact_id
              const cname = String(c.customer_name || c.contact_name || '').trim()
              return (contactId && cid && String(contactId) === String(cid)) || (contactName && cname && contactName === cname)
            })
            if (!matched) unmatchedCollect.push(r)
          }
          if (unmatchedCollect.length > 0) {
            issues.push(`🟡 ④ 有 ${unmatchedCollect.length} 条客户收款单无法匹配到已审核合同（ID: ${unmatchedCollect.slice(0, 5).map((r: any) => r.id).join('、')}${unmatchedCollect.length > 5 ? '...' : ''}）`)
          }

          // ⑤ 账户余额核查：系统余额 vs 收款-付款流水差额
          const fundIssues: string[] = []
          for (const fund of fundRows) {
            const fid = fund.id
            const sysBalance = Number(fund.balance || fund.amount || 0)
            const inAmt = collectRows.filter((r: any) => String(r.fund_id) === String(fid)).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
            const outAmt = payRows.filter((r: any) => String(r.fund_id) === String(fid)).reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
            const calcBalance = inAmt - outAmt
            const diff = Math.abs(sysBalance - calcBalance)
            if (diff > 1) {
              fundIssues.push(`账户「${fund.name}」系统余额 ¥${sysBalance.toFixed(2)} vs 流水计算 ¥${calcBalance.toFixed(2)}，差额 ¥${diff.toFixed(2)}`)
            }
          }
          if (fundIssues.length > 0) {
            issues.push(`🔴 ⑤ 账户余额异常：\n   ${fundIssues.join('\n   ')}`)
          } else {
            ok.push(`⑤ 账户余额核查正常：${fundRows.length} 个账户系统余额与流水吻合`)
          }

          // ⑥ 流水归类核查：contact_type 不能为空且必须是合法值
          const validContactTypes = new Set(['supplier', 'customer', 'staff', 'other'])
          const badPay = payRows.filter((r: any) => !r.contact_type || !validContactTypes.has(r.contact_type))
          const badCollect = collectRows.filter((r: any) => !r.contact_type || !validContactTypes.has(r.contact_type))
          if (badPay.length > 0 || badCollect.length > 0) {
            issues.push(`🟡 ⑥ 流水归类异常：付款单 ${badPay.length} 条 contact_type 为空或非法，收款单 ${badCollect.length} 条 contact_type 为空或非法`)
          } else {
            ok.push(`⑥ 流水归类正常：付款单和收款单 contact_type 均为合法值`)
          }

          // ⑦ 退货异常：退货金额不应超过原始订单金额
          const returnOverflow: string[] = []
          for (const ret of procureReturnRows) {
            const retAmt = Number(ret.total_amount || ret.amount || 0)
            const origSn = String(ret.order_sn || ret.purchase_order_sn || '').trim()
            if (!origSn) continue
            const orig = auditedPurchase.find((o: any) => String(o.order_sn || o.order_no || '').trim() === origSn)
            if (orig) {
              const origAmt = Number(orig.after_discount ?? orig.total_amount ?? 0)
              if (retAmt > origAmt + 0.01) {
                returnOverflow.push(`采购退货 #${ret.id} ¥${retAmt.toFixed(2)} > 原单 ${origSn} ¥${origAmt.toFixed(2)}`)
              }
            }
          }
          for (const ret of saleReturnRows) {
            const retAmt = Number(ret.total_amount || ret.amount || 0)
            const origSn = String(ret.order_sn || ret.sale_order_sn || '').trim()
            if (!origSn) continue
            const orig = auditedContracts.find((c: any) => String(c.order_sn || c.order_no || '').trim() === origSn)
            if (orig) {
              const origAmt = Number(orig.total_amount || 0)
              if (retAmt > origAmt + 0.01) {
                returnOverflow.push(`销售退货 #${ret.id} ¥${retAmt.toFixed(2)} > 原单 ${origSn} ¥${origAmt.toFixed(2)}`)
              }
            }
          }
          if (returnOverflow.length > 0) {
            issues.push(`🔴 ⑦ 退货金额异常（超过原始订单）：\n   ${returnOverflow.join('\n   ')}`)
          } else {
            ok.push(`⑦ 退货金额正常：采购退货 ${procureReturnRows.length} 条、销售退货 ${saleReturnRows.length} 条均未超原单金额`)
          }

        } catch (e: any) {
          issues.push(`审查过程出错：${e?.message || String(e)}`)
        }
        const summary = issues.length === 0 ? '✅ 未发现问题' : `⚠️ 发现 ${issues.length} 个问题`
        result = `【财务数据审查报告】\n${summary}\n\n${issues.length > 0 ? '问题：\n' + issues.join('\n') + '\n\n' : ''}正常项：\n${ok.join('\n')}`
        break
      }
      case 'query_staff': {
        const res = await erpGet('/personnel/staff/index', { list_rows: 100, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 名员工。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 姓名: r.name, 手机: r.mobile, 部门: r.dept, 职位: r.jobs })))}`
        break
      }
      case 'query_warehouses': {
        const res = await erpGet('/stock/WarehouseName/index', { list_rows: 50 }, token)
        const rows = res?.data?.rows || []
        result = `共 ${rows.length} 个仓库：${rows.map((r: any) => r.name).join('、')}`
        break
      }
      case 'create_customer': {
        // 重名检查：先查询是否已存在同名客户
        const custName = (input.nickname || input.name || '').trim()
        if (custName) {
          try {
            const checkRes = await erpGet('/shop/ShopCustomer/index', { keyword: custName, list_rows: 50 }, token)
            const existing = (checkRes?.data?.rows || []).find((r: any) => (r.nickname || r.name)?.trim() === custName)
            if (existing) {
              result = `客户"${custName}"已存在（ID: ${existing.id}），请勿重复创建。如需修改请使用编辑功能。`
              break
            }
          } catch { /* 查询失败不阻塞创建 */ }
        }
        const res = await erpPost('/shop/ShopCustomer/add', input, token)
        result = res?.code === 1 ? `客户创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_supplier': {
        // 重名检查：先查询是否已存在同名供应商
        const suppName = (input.name || '').trim()
        if (suppName) {
          try {
            const checkRes = await erpGet('/procure/supplier/index', { keyword: suppName, list_rows: 50 }, token)
            const existing = (checkRes?.data?.rows || []).find((r: any) => r.name?.trim() === suppName)
            if (existing) {
              result = `供应商"${suppName}"已存在（ID: ${existing.id}），请勿重复创建。如需修改请使用编辑功能。`
              break
            }
          } catch { /* 查询失败不阻塞创建 */ }
        }
        const res = await erpPost('/procure/supplier/add', input, token)
        result = res?.code === 1 ? `供应商创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_goods': {
        // 重名检查：先查询是否已存在同名商品
        const goodsName = (input.goods_name || '').trim()
        if (goodsName) {
          try {
            const checkRes = await erpGet('/goods/ShopGoods/index', { keyword: goodsName, list_rows: 50 }, token)
            const existing = (checkRes?.data?.rows || []).find((r: any) => r.goods_name?.trim() === goodsName)
            if (existing) {
              result = `商品"${goodsName}"已存在（ID: ${existing.id}），请勿重复创建。如需修改请使用编辑功能。`
              break
            }
          } catch { /* 查询失败不阻塞创建 */ }
        }
        const res = await erpPost('/goods/ShopGoods/add', input, token)
        result = res?.code === 1 ? `商品创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_sale_order': {
        // 自动根据 customer_name 查找 customer_id
        if (input.customer_name && !input.customer_id) {
          try {
            const cRes = await erpGet('/shop/ShopCustomer/index', { keyword: input.customer_name, list_rows: 5 }, token)
            const customers = cRes?.data?.rows || []
            const matched = customers.find((c: any) => (c.nickname || c.name) === input.customer_name || (c.nickname || c.name)?.includes(input.customer_name))
            if (matched) {
              input.customer_id = matched.id
              input.customer_name = matched.nickname || matched.name
            }
          } catch { /* ignore */ }
        }
        // 自动根据 goods_name 查找 goods_id，并序列化为 goods_info
        const rawItems = Array.isArray(input.items) ? input.items : []
        const resolvedItems = rawItems.length > 0 ? await resolveGoodsIds(rawItems, token) : []
        const payload: Record<string, any> = {
          customer_id: input.customer_id,
          customer_name: input.customer_name,
          total_amount: input.total_amount,
          admin_name: input.admin_name || '',
          remark: input.remark || '',
          goods_info: JSON.stringify(resolvedItems),
        }
        const res = await erpPost('/shop/ContractOrder/add', payload, token)
        result = res?.code === 1 ? `销售订单创建成功！单号: ${res?.data?.order_sn || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_procure_order': {
        // 自动根据 supplier_name 查找 supplier_id
        if (input.supplier_name && !input.supplier_id) {
          try {
            const sRes = await erpGet('/procure/supplier/index', { keyword: input.supplier_name, list_rows: 5 }, token)
            const suppliers = sRes?.data?.rows || []
            const matched = suppliers.find((s: any) => s.name === input.supplier_name || s.name?.includes(input.supplier_name))
            if (matched) {
              input.supplier_id = matched.id
              input.supplier_name = matched.name  // 回填标准名称
            }
          } catch { /* ignore */ }
        }
        // 自动根据 goods_name 查找 goods_id，并序列化为 goods_info
        const rawItems = Array.isArray(input.items) ? input.items : []
        const resolvedItems = rawItems.length > 0 ? await resolveGoodsIds(rawItems, token) : []
        const payload: Record<string, any> = {
          supplier_id: input.supplier_id,
          supplier_name: input.supplier_name,
          total_amount: input.total_amount,
          admin_name: input.admin_name || '',
          remark: input.remark || '',
          goods_info: JSON.stringify(resolvedItems),
        }
        const res = await erpPost('/stock/PurchaseOrder/add', payload, token)
        result = res?.code === 1 ? `采购订单创建成功！单号: ${res?.data?.order_sn || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_collect_receipt': {
        const res = await erpPost('/finance/CollectReceipt/add', input, token)
        result = res?.code === 1 ? `收款单创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_pay_receipt': {
        const res = await erpPost('/finance/PayReceipt/add', input, token)
        result = res?.code === 1 ? `付款单创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_prepay': {
        if (!input.pay_type) input.pay_type = input.customer_name ? 'customer' : 'supplier'
        const res = await erpPost('/finance/Prepay/create', input, token)
        result = res?.code === 1 ? `预付款创建成功！单号: ${res?.data?.order_sn || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_staff': {
        const res = await erpPost('/personnel/staff/add', input, token)
        result = res?.code === 1 ? `员工创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_warehouse': {
        const res = await erpPost('/stock/WarehouseName/add', input, token)
        result = res?.code === 1 ? `仓库创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_fund_account': {
        const res = await erpPost('/finance/Fund/add', input, token)
        result = res?.code === 1 ? `资金账户创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }

      // ── 一键销售 ──────────────────────────────────────
      case 'quick_sale': {
        // 1. 查找客户
        const custRes = await erpGet('/shop/ShopCustomer/index', { keyword: input.customer_name, list_rows: 5 }, token)
        const customers = custRes?.data?.rows || []
        const cust = customers.find((c: any) => (c.nickname || c.name) === input.customer_name || (c.nickname || c.name)?.includes(input.customer_name))
        if (!cust) { result = `未找到客户"${input.customer_name}"，请先创建客户`; break }
        const customerId = cust.id
        const customerName = cust.nickname || cust.name

        // 2. 查找仓库
        const whName = input.warehouse_name || '门店'
        const whRes = await erpGet('/stock/WarehouseName/index', { list_rows: 50 }, token)
        const warehouses = whRes?.data?.rows || []
        const wh = warehouses.find((w: any) => w.name === whName || w.name?.includes(whName))
        if (!wh) { result = `未找到仓库"${whName}"，可用仓库：${warehouses.map((w: any) => w.name).join('、')}`; break }

        // 3. 解析商品明细
        const rawItems = Array.isArray(input.items) ? input.items : []
        if (!rawItems.length) { result = '请提供商品明细'; break }
        const resolvedItems = await resolveGoodsIds(rawItems, token)
        // 补充 sell_price / cost_price
        for (const item of resolvedItems) {
          if (item.goods_id && !item.price) {
            try {
              const gRes = await erpGet('/goods/ShopGoods/index', { keyword: item.goods_name, list_rows: 5 }, token)
              const g = (gRes?.data?.rows || []).find((r: any) => r.id === item.goods_id)
              if (g) {
                item.price = Number(g.sell_price) || 0
                item.cost_price = Number(g.cost_price) || 0
              }
            } catch { /* ignore */ }
          }
          if (!item.price) item.price = 0
          if (!item.cost_price) item.cost_price = 0
        }

        // 4. 计算金额
        const goodsTotal = resolvedItems.reduce((s: number, r: any) => s + (r.num || 1) * (r.price || 0), 0)
        const discount = Number(input.discount) || 0
        const freight = Number(input.freight) || 0
        const freightPayer = input.freight_payer || 'buyer'
        const freightAdd = freightPayer === 'buyer' ? freight : 0
        const finalTotal = Math.max(0, goodsTotal - discount + freightAdd)

        const goodsInfo = JSON.stringify(resolvedItems.map((i: any) => ({
          goods_id: i.goods_id, goods_name: i.goods_name, goods_sn: i.goods_sn || '',
          spec: i.spec || '', unit_name: i.unit_name || '',
          num: i.num || 1, price: i.price, price_no_tax: i.price,
          tax_rate: 0, cost_price: i.cost_price || 0, remark: '',
        })))
        const today = new Date().toISOString().slice(0, 10)

        // 5. 创建合同
        const contractRes = await erpPost('/shop/ContractOrder/add', {
          customer_id: customerId, customer_name: customerName, admin_name: '',
          contract_date: today, sign_date: today,
          total_amount: goodsTotal, after_discount: finalTotal,
          discount_type: discount > 0 ? 'amount' : 'none', discount_value: discount,
          freight_amount: freight, freight_bearer: freightPayer,
          remark: input.remark || '',
          goods_info: goodsInfo,
        }, token)
        const contractId = contractRes?.data?.id || contractRes?.data?.lastId
        if (!contractId) { result = `合同创建失败：${contractRes?.msg || JSON.stringify(contractRes)}`; break }

        // 6. 审核合同
        await erpPost('/shop/ContractOrder/audit', { id: contractId, status: 1 }, token)

        // 7. 创建出库单
        const saleOutRes = await erpPost('/stock/SaleOutOrder/add', {
          customer_id: customerId, customer_name: customerName, admin_name: '',
          out_date: today,
          warehouse_id: wh.id, warehouse_name: wh.name,
          total_amount: goodsTotal, after_discount: finalTotal,
          discount_amount: discount, freight_amount: freight, freight_bearer: freightPayer,
          remark: input.remark || '来自一键销售', goods_info: goodsInfo,
        }, token)
        const saleOutId = saleOutRes?.data?.id || saleOutRes?.data?.lastId
        if (!saleOutId) { result = `出库单创建失败：${saleOutRes?.msg || JSON.stringify(saleOutRes)}`; break }

        // 8. 审核出库单（触发库存扣减）
        await erpPost('/stock/SaleOutOrder/audit', { id: saleOutId, status: 1 }, token)

        const itemsSummary = resolvedItems.map((i: any) => `${i.goods_name}×${i.num || 1}`).join('、')
        let totalDetail = `商品合计 ¥${goodsTotal.toFixed(2)}`
        if (discount > 0) totalDetail += `，优惠 -¥${discount.toFixed(2)}`
        if (freight > 0) totalDetail += `，运费 +¥${freight.toFixed(2)}（${freightPayer === 'seller' ? '我方承担，不计入' : '对方承担'}）`
        result = `一键销售完成！\n客户：${customerName}\n仓库：${wh.name}\n商品：${itemsSummary}\n${totalDetail}\n应收合计：¥${finalTotal.toFixed(2)}\n合同+出库已自动审核，库存已扣减。`
        break
      }

      // ── 零售单 ──────────────────────────────────────
      case 'create_retail_order': {
        // 1. 解析商品明细
        const rawItems = Array.isArray(input.items) ? input.items : []
        if (!rawItems.length) { result = '请提供商品明细'; break }
        const resolvedItems = await resolveGoodsIds(rawItems, token)

        // 有商品未匹配：返回候选列表供用户选择，不创建订单
        const unresolved = resolvedItems.filter((i: any) => i._unresolved)
        if (unresolved.length > 0) {
          const picks = unresolved.map((i: any) => {
            const list = (i._candidates || []).map((c: any) => `[[PICK:${c.name}|${c.unit}|${c.price}]]`).join('')
            return `「${i.goods_name}」找不到，请选择：\n${list}`
          }).join('\n\n')
          result = picks
          break
        }

        // 补充售价
        for (const item of resolvedItems) {
          if (item.goods_id && !item.price) {
            try {
              const gRes = await erpGet('/goods/ShopGoods/index', { keyword: item.goods_name, list_rows: 5 }, token)
              const g = (gRes?.data?.rows || []).find((r: any) => r.id === item.goods_id)
              if (g) item.price = Number(g.sell_price) || 0
            } catch { /* ignore */ }
          }
          if (!item.price) item.price = 0
        }

        // 2. 计算金额
        const today = new Date().toISOString().slice(0, 10) // 强制用服务器今天，忽略 AI 可能传入的 order_date
        const goodsTotal = resolvedItems.reduce((s: number, r: any) => s + (r.num || 1) * (r.price || 0), 0)
        const discountAmt = Number(input.discount_amount) || 0
        const payAmount = Math.max(0, goodsTotal - discountAmt)
        const orderSn = `LS${today.replace(/-/g, '')}${String(Date.now()).slice(-3)}`

        // 2.5 重复录入检测：5分钟内同金额+同商品数量的零售单视为重复
        try {
          const existRes = await erpGet('/retail/order/index', { list_rows: 20, page: 1 }, token)
          const existRows = existRes?.data?.rows || []
          const fiveMinAgo = Date.now() - 5 * 60 * 1000
          const duplicate = existRows.find((r: any) => {
            const createdAt = new Date(r.create_time || r.order_date).getTime()
            if (createdAt < fiveMinAgo) return false
            if (Math.abs(Number(r.pay_amount) - payAmount) > 0.01) return false
            // 商品数量也相同（通过 goods_info 条数判断）
            try {
              const gi = JSON.parse(r.goods_info || '[]')
              if (gi.length === resolvedItems.length) return true
            } catch { return false }
            return false
          })
          if (duplicate) {
            result = `⚠️ 检测到重复录入！5分钟内已存在相同金额(¥${payAmount})的零售单(ID:${duplicate.id})，本次取消创建。如需重新录请先删除旧单。`
            break
          }
        } catch { /* 检测失败不阻断，继续创建 */ }

        // 3. 创建零售单（status=0 未审核）
        const goodsInfo = JSON.stringify(resolvedItems.map((i: any) => ({
          goods_id: i.goods_id, goods_name: i.goods_name, goods_sn: i.goods_sn || '',
          unit_name: i.unit_name || '', num: i.num || 1, price: i.price,
        })))
        const createRes = await erpPost('/retail/order/add', {
          store_id: null, store_name: '',
          member_id: null, member_name: input.member_name || '',
          order_date: today, order_sn: orderSn,
          pay_type: input.pay_method || input.pay_type || 'cash',
          remark: input.remark || '',
          status: 0,
          goods_info: goodsInfo,
          total_amount: goodsTotal,
          discount_amount: discountAmt,
          pay_amount: payAmount,
        }, token)
        const retailOrderId = createRes?.data?.id || createRes?.data?.lastId
        if (!retailOrderId) { result = `零售单创建失败：${createRes?.msg || JSON.stringify(createRes)}`; break }

        // 4. 审核零售单
        await erpPost('/retail/order/audit', { id: retailOrderId, status: 1 }, token)

        // 5. 扣减库存（取第一个仓库）
        try {
          const whRes = await erpGet('/stock/WarehouseName/index', { list_rows: 1 }, token)
          const defaultWh = whRes?.data?.rows?.[0]
          if (defaultWh) {
            for (const item of resolvedItems) {
              if (!item.goods_id || !item.num) continue
              const stockRes = await erpGet('/stock/StockAll/index', { goods_id: item.goods_id, warehouse_id: defaultWh.id, list_rows: 10 }, token)
              const stock = stockRes?.data?.rows?.[0]
              if (stock) {
                const newQty = Math.max(0, Number(stock.qty || 0) - Number(item.num))
                await erpPost('/stock/StockAll/edit', { id: stock.id, qty: newQty }, token)
              }
            }
          }
        } catch { /* 库存扣减失败不中断 */ }

        // 6. 更新零售收款账户
        try {
          const fundRes = await erpGet('/finance/Fund/index', { list_rows: 100 }, token)
          const funds: any[] = fundRes?.data?.rows || []
          const retailFund = funds.find((f: any) => f.name === '零售收款账户')
          if (retailFund) {
            await erpPost('/finance/Fund/edit', { id: retailFund.id, name: retailFund.name, balance: Number(retailFund.balance || 0) + payAmount }, token)
          } else {
            await erpPost('/finance/Fund/add', { name: '零售收款账户', type: 2, balance: payAmount, remark: '零售单自动累计' }, token)
          }
        } catch { /* 财务更新失败不中断 */ }

        const itemsSummary = resolvedItems.map((i: any) => `@ ${i.goods_name} × ${i.num || 1} ¥${((i.num || 1) * (i.price || 0)).toFixed(2)}`).join('\n')
        result = `零售单录入完成！\n单号：${orderSn}\n${itemsSummary}${discountAmt > 0 ? `\n折扣 -¥${discountAmt.toFixed(2)}` : ''}\n合计：¥${payAmount.toFixed(2)}\n支付方式：${input.pay_method || 'cash'}\n已自动审核，库存和账户已更新。`
        break
      }
      case 'update_goods': {
        const res = await erpPost('/goods/ShopGoods/edit', input, token)
        result = res?.code === 1 ? `商品编辑成功！` : `编辑失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'update_customer': {
        const res = await erpPost('/shop/ShopCustomer/edit', input, token)
        result = res?.code === 1 ? `客户编辑成功！` : `编辑失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'update_supplier': {
        const res = await erpPost('/procure/supplier/edit', input, token)
        result = res?.code === 1 ? `供应商编辑成功！` : `编辑失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'add_goods_spec': {
        // 先启用商品的多规格标记
        if (input.goods_id) {
          try {
            await erpPost('/goods/ShopGoods/edit', { id: input.goods_id, multi_spec: 1 }, token)
          } catch { /* ignore */ }
        }
        const res = await erpPost('/goods/ShopSpec/add', {
          goods_id: input.goods_id,
          goods_name: input.goods_name || '',
          spec_name: input.spec_name,
          spec_value: input.spec_value,
        }, token)
        result = res?.code === 1 ? `规格"${input.spec_name}"添加成功！值：${input.spec_value}` : `添加失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'query_goods_spec': {
        const res = await erpGet('/goods/ShopSpec/index', { goods_id: input.goods_id, list_rows: 200 }, token)
        const rows = res?.data?.rows || []
        if (rows.length === 0) {
          result = '该商品暂无规格信息。'
        } else {
          result = `共 ${rows.length} 个规格：${JSON.stringify(rows.map((r: any) => ({ id: r.id, 规格名: r.spec_name, 规格值: r.spec_value })))}`
        }
        break
      }
      case 'delete_goods_spec': {
        const res = await erpPost('/goods/ShopSpec/del', { id: input.id }, token)
        result = res?.code === 1 ? `规格已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }

      // ── 删除工具（需要管理员权限）────────────────────────
      case 'navigate_to': {
        result = `导航指令：${input.page}`
        break
      }
      case 'delete_purchase_order': {
        const denied = await checkDeletePermission(token)
        if (denied) { result = denied; break }
        const res = await erpPost('/stock/PurchaseOrder/del', { id: input.id }, token)
        result = res?.code === 1 ? `采购订单已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_supplier': {
        const denied = await checkDeletePermission(token)
        if (denied) { result = denied; break }
        const res = await erpPost('/procure/supplier/del', { id: input.id }, token)
        result = res?.code === 1 ? `供应商已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_sale_order': {
        const denied = await checkDeletePermission(token)
        if (denied) { result = denied; break }
        const res = await erpPost('/shop/ContractOrder/del', { id: input.id }, token)
        result = res?.code === 1 ? `销售订单已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_customer': {
        const denied = await checkDeletePermission(token)
        if (denied) { result = denied; break }
        const res = await erpPost('/shop/ShopCustomer/del', { id: input.id }, token)
        result = res?.code === 1 ? `客户已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_goods': {
        const denied = await checkDeletePermission(token)
        if (denied) { result = denied; break }
        const res = await erpPost('/goods/ShopGoods/del', { id: input.id }, token)
        result = res?.code === 1 ? `商品已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_staff': {
        const denied = await checkDeletePermission(token)
        if (denied) { result = denied; break }
        const res = await erpPost('/personnel/staff/del', { id: input.id }, token)
        result = res?.code === 1 ? `员工已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_warehouse': {
        const denied = await checkDeletePermission(token)
        if (denied) { result = denied; break }
        const res = await erpPost('/stock/WarehouseName/del', { id: input.id }, token)
        result = res?.code === 1 ? `仓库已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_fund_account': {
        const denied = await checkDeletePermission(token)
        if (denied) { result = denied; break }
        const res = await erpPost('/finance/Fund/del', { id: input.id }, token)
        result = res?.code === 1 ? `资金账户已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'web_search': {
        const tavilyKey = process.env.TAVILY_API_KEY
        if (!tavilyKey || tavilyKey === 'tvly-') {
          result = '搜索功能未配置：请在 .env 文件中设置 TAVILY_API_KEY'
          break
        }
        const searchRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: input.query,
            max_results: input.max_results || 5,
            search_depth: 'basic',
          }),
        })
        const searchData = await searchRes.json() as { results?: Array<{ title: string; url: string; content: string; score: number }> }
        const items = searchData?.results || []
        if (items.length === 0) {
          result = `未找到"${input.query}"的相关结果`
        } else {
          const summary = items.map((r, i) =>
            `${i + 1}. **${r.title}**\n   ${r.content?.slice(0, 200)}...\n   来源：${r.url}`
          ).join('\n\n')
          result = `搜索"${input.query}"，找到 ${items.length} 条结果：\n\n${summary}`
        }
        break
      }
      case 'get_trending': {
        const platform = input.platform || 'douyin'
        const ROUTE_MAP: Record<string, string> = {
          douyin: 'douyin', weibo: 'weibo', bilibili: 'bilibili',
          zhihu: 'zhihu', xiaohongshu: 'toutiao', kuaishou: 'toutiao',
        }
        const LABEL_MAP: Record<string, string> = {
          douyin: '抖音', weibo: '微博', bilibili: 'B站',
          zhihu: '知乎', xiaohongshu: '今日头条（小红书替代）', kuaishou: '今日头条（快手替代）',
        }
        const routeName = ROUTE_MAP[platform]
        if (!routeName) { result = `不支持的平台：${platform}`; break }
        try {
          const { handleRoute } = await import(`dailyhot-api/dist/routes/${routeName}.js`)
          const resp = await handleRoute({ req: { query: () => undefined } }, true)
          const items: Array<{ title: string; heat: string }> = (resp.data || []).slice(0, 20).map((item: any) => ({
            title: item.title || '',
            heat: typeof item.hot === 'number'
              ? (item.hot >= 10000 ? `${(item.hot / 10000).toFixed(0)}万` : String(item.hot))
              : item.hot || '热门',
          }))
          if (items.length === 0) { result = `${LABEL_MAP[platform] || platform}热榜数据为空`; break }
          const list = items.map((item, i) => `${i + 1}. ${item.title}（热度：${item.heat}）`).join('\n')
          result = `${LABEL_MAP[platform] || platform} 实时热榜 Top${items.length}：\n\n${list}`
        } catch (e: any) {
          result = `获取${LABEL_MAP[platform] || platform}热榜失败：${e.message}`
        }
        break
      }
      case 'generate_image': {
        const prompt = encodeURIComponent(input.prompt || '')
        const width = input.width || 1024
        const height = input.height || 1024
        const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&nologo=true&model=flux`
        result = `IMAGE_URL:${imageUrl}\n图片已成功生成，URL：${imageUrl}`
        break
      }
      case 'render_image': {
        const resp = await erpPost('/image/render', {
          root_code: input.root_code,
          component_code: input.component_code,
          composition_id: input.composition_id || 'Poster',
          width: input.width || 1080,
          height: input.height || 1080,
        }, token)
        if (resp?.code === 1 && resp?.data?.base64) {
          result = `IMAGE_BASE64:${resp.data.base64}`
        } else {
          result = `图片渲染失败：${resp?.message || '未知错误'}`
        }
        break
      }
      case 'render_video': {
        const resp = await erpPost('/video/render', {
          root_code: input.root_code,
          component_code: input.component_code,
          composition_id: input.composition_id || 'MyVideo',
          width: input.width || 1080,
          height: input.height || 1920,
          fps: 30,
          duration_frames: input.duration_frames || 900,
        }, token)
        if (resp?.code === 1 && resp?.data?.base64) {
          result = `VIDEO_BASE64:${resp.data.base64}`
        } else {
          result = `渲染失败：${resp?.message || '未知错误'}`
        }
        break
      }
      case 'record_content_performance': {
        // 内容效果数据存储在内存（进程级别，重启清空），生产建议写DB
        const record = {
          id: Date.now(),
          content_title: input.content_title,
          platform: input.platform,
          publish_date: input.publish_date,
          content_type: input.content_type || '图文',
          views: input.views || 0,
          likes: input.likes || 0,
          comments: input.comments || 0,
          shares: input.shares || 0,
          saves: input.saves || 0,
          notes: input.notes || '',
          created_at: new Date().toISOString(),
        }
        contentPerformanceStore.push(record)
        const engagement = record.views > 0
          ? ((record.likes + record.comments + record.shares + record.saves) / record.views * 100).toFixed(2)
          : '0'
        result = `✅ 内容效果已记录\n标题：${record.content_title}\n平台：${record.platform}\n发布日期：${record.publish_date}\n浏览量：${record.views.toLocaleString()} | 点赞：${record.likes} | 评论：${record.comments} | 转发：${record.shares} | 收藏：${record.saves}\n互动率：${engagement}%`
        break
      }
      case 'query_content_performance': {
        const platform = input.platform || 'all'
        const limit = input.limit || 20
        let records = platform === 'all'
          ? contentPerformanceStore
          : contentPerformanceStore.filter(r => r.platform === platform)
        records = records.slice(-limit).reverse()
        if (records.length === 0) {
          result = `暂无${platform === 'all' ? '' : platform + '平台的'}内容效果数据。请先使用 record_content_performance 工具录入数据。`
          break
        }
        const totalViews = records.reduce((s, r) => s + r.views, 0)
        const avgEngagement = records.map(r => r.views > 0 ? (r.likes + r.comments + r.shares + r.saves) / r.views * 100 : 0)
        const avgEngRate = (avgEngagement.reduce((s, v) => s + v, 0) / records.length).toFixed(2)
        const topByViews = [...records].sort((a, b) => b.views - a.views)[0]
        const topByEng = [...records].sort((a, b) => {
          const ea = a.views > 0 ? (a.likes + a.comments + a.shares + a.saves) / a.views : 0
          const eb = b.views > 0 ? (b.likes + b.comments + b.shares + b.saves) / b.views : 0
          return eb - ea
        })[0]
        const list = records.slice(0, 10).map((r, i) => {
          const eng = r.views > 0 ? ((r.likes + r.comments + r.shares + r.saves) / r.views * 100).toFixed(1) : '0'
          return `${i + 1}. [${r.platform}] ${r.content_title}\n   ${r.publish_date} | 浏览${r.views.toLocaleString()} | 互动率${eng}%${r.notes ? ` | ${r.notes}` : ''}`
        }).join('\n')
        result = `📊 内容效果分析（共${records.length}条）\n\n总浏览量：${totalViews.toLocaleString()}\n平均互动率：${avgEngRate}%\n\n🏆 最高浏览：${topByViews?.content_title}（${topByViews?.views?.toLocaleString()}次）\n🔥 最高互动率：${topByEng?.content_title}\n\n近期内容列表：\n${list}`
        break
      }
      case 'generate_image_doubao': {
        const akId = process.env.VOLC_ACCESS_KEY_ID
        const akSecret = process.env.VOLC_SECRET_KEY
        if (!akId || !akSecret) { result = '❌ 未配置 VOLC_ACCESS_KEY_ID / VOLC_SECRET_KEY'; break }

        const ratioMap: Record<string, { width: number; height: number }> = {
          '1:1':  { width: 1024, height: 1024 },
          '3:4':  { width: 768,  height: 1024 },
          '4:3':  { width: 1024, height: 768  },
          '9:16': { width: 576,  height: 1024 },
          '16:9': { width: 1024, height: 576  },
        }
        const size = ratioMap[input.ratio || '3:4']
        const body = JSON.stringify({
          req_key: 'seedream_3_0_t2i_to_image',
          prompt: input.prompt,
          width: size.width,
          height: size.height,
          return_url: true,
        })

        try {
          const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVProcess&Version=2022-08-31', body, 'visual.volcengineapi.com', 'cv')
          const resp = await fetch('https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31', { method: 'POST', headers, body })
          const data = await resp.json() as any
          if (data?.code === 10000 && data?.data?.image_urls?.[0]) {
            result = `IMAGE_URL:${data.data.image_urls[0]}\n✅ 豆包图片生成成功`
          } else {
            const encodedPrompt = encodeURIComponent(input.prompt || '')
            const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${size.width}&height=${size.height}&nologo=true&model=flux`
            result = `IMAGE_URL:${fallbackUrl}\n⚠️ 豆包暂不可用（${data?.message || JSON.stringify(data)}），已用备用生成`
          }
        } catch (e: any) {
          const encodedPrompt = encodeURIComponent(input.prompt || '')
          const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${size.width}&height=${size.height}&nologo=true&model=flux`
          result = `IMAGE_URL:${fallbackUrl}\n⚠️ 豆包请求异常（${e.message}），已用备用生成`
        }
        break
      }
      case 'generate_video_jimeng': {
        const akId = process.env.VOLC_ACCESS_KEY_ID
        const akSecret = process.env.VOLC_SECRET_KEY
        if (!akId || !akSecret) { result = '❌ 未配置 VOLC_ACCESS_KEY_ID / VOLC_SECRET_KEY'; break }

        const ratioMap: Record<string, string> = { '16:9': '1280x720', '9:16': '720x1280', '1:1': '720x720' }
        const body = JSON.stringify({
          req_key: 'jimeng_video_t2v_async',
          prompt: input.prompt,
          duration: input.duration || 5,
          resolution: ratioMap[input.ratio || '9:16'] || '720x1280',
          return_url: true,
        })

        try {
          const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVProcess&Version=2022-08-31', body, 'visual.volcengineapi.com', 'cv')
          const resp = await fetch('https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31', { method: 'POST', headers, body })
          const data = await resp.json() as any
          if (data?.code === 10000 && data?.data?.task_id) {
            result = `✅ 视频任务已提交\ntask_id: ${data.data.task_id}\n请用 check_video_status 工具查询进度（通常1-3分钟）`
          } else {
            result = `❌ 提交失败：${data?.message || JSON.stringify(data)}`
          }
        } catch (e: any) {
          result = `❌ 请求异常：${e.message}`
        }
        break
      }
      case 'check_video_status': {
        const akId = process.env.VOLC_ACCESS_KEY_ID
        const akSecret = process.env.VOLC_SECRET_KEY
        if (!akId || !akSecret) { result = '❌ 未配置 VOLC_ACCESS_KEY_ID / VOLC_SECRET_KEY'; break }

        const body = JSON.stringify({ req_key: 'jimeng_video_t2v_async_result', task_id: input.task_id })

        try {
          const headers = await volcSign(akId, akSecret, 'POST', '/', 'Action=CVProcess&Version=2022-08-31', body, 'visual.volcengineapi.com', 'cv')
          const resp = await fetch('https://visual.volcengineapi.com/?Action=CVProcess&Version=2022-08-31', { method: 'POST', headers, body })
          const data = await resp.json() as any
          const status = data?.data?.status
          if (status === 'succeeded' && data?.data?.video_url) {
            result = `VIDEO_URL:${data.data.video_url}\n✅ 视频生成完成！`
          } else if (status === 'processing' || status === 'pending') {
            result = `⏳ 仍在生成中（${status}），请稍后再查询`
          } else if (status === 'failed') {
            result = `❌ 生成失败：${data?.data?.message || '未知错误'}`
          } else {
            result = `查询结果：${JSON.stringify(data?.data || data)}`
          }
        } catch (e: any) {
          result = `❌ 请求异常：${e.message}`
        }
        break
      }
      case 'get_publish_queue': {
        const items = context?.flowResults || []
        const filterPlatform = input.platform && input.platform !== 'all' ? input.platform : null
        const filterStatus = input.status || 'pending'

        const filtered = items.filter((item, _i) => {
          if (filterPlatform && item.platform !== filterPlatform) return false
          if (filterStatus === 'pending') return !item.published
          if (filterStatus === 'published') return !!item.published
          return true
        })

        if (filtered.length === 0) {
          result = filterStatus === 'pending'
            ? '📭 当前没有待发布的内容。请先在会议室或文案/设计页生成内容，内容会自动进入发布队列。'
            : '📭 暂无内容记录。'
          break
        }

        const PLATFORM_NAMES: Record<string, string> = {
          xiaohongshu: '小红书', douyin: '抖音', weibo: '微博',
          bilibili: 'B站', wechat: '微信公众号',
        }
        const TYPE_NAMES: Record<string, string> = {
          copy: '图文文案', poster: '图文海报', video_script: '视频脚本',
        }

        const lines = filtered.map((item, i) => {
          // 找到真实 index（用于 publish_content 调用）
          const realIdx = items.indexOf(item)
          const preview = item.content?.slice(0, 60).replace(/\n/g, ' ').replace(/#+\s*/g, '') || ''
          const status = item.published ? '✅ 已发布' : '⏳ 待发布'
          return `[${realIdx}] ${status} | ${PLATFORM_NAMES[item.platform] || item.platform} | ${TYPE_NAMES[item.type] || item.type}\n    主题：${item.topic || '（无主题）'}\n    预览：${preview}…`
        })

        const pendingCount = items.filter(i => !i.published).length
        const publishedCount = items.filter(i => i.published).length
        result = `📋 发布队列（待发布 ${pendingCount} 条 / 已发布 ${publishedCount} 条）\n\n${lines.join('\n\n')}`
        break
      }
      case 'publish_content': {
        const items = context?.flowResults || []
        const idx = Number(input.index)

        if (isNaN(idx) || idx < 0 || idx >= items.length) {
          result = `❌ 无效的内容索引 ${input.index}，请先调用 get_publish_queue 确认索引。`
          break
        }

        const item = items[idx]
        if (item.published) {
          result = `⚠️ 该内容已经发布过了（索引 ${idx}：${item.topic || item.content?.slice(0, 30)}）`
          break
        }

        const platform = input.platform_override || item.platform

        if (platform !== 'xiaohongshu') {
          result = `⏳「${item.platformName || platform}」平台暂未接入自动发布，请手动复制内容发布。`
          break
        }

        // 提取正文（去掉配图建议等策划内容）
        let publishText = item.content || ''
        const cutPatterns = [
          /\n\n?配图建议[（(（].*?[）)）][:：]/,
          /\n\n?📸\s*配图建议/,
          /\n\n?视频脚本方向[（(（].*?[）)）][:：]/,
          /\n\n?🎬\s*视频脚本/,
        ]
        for (const pat of cutPatterns) {
          const match = publishText.search(pat)
          if (match > 0) { publishText = publishText.slice(0, match).trim(); break }
        }

        // 第一行为标题
        const firstLine = publishText.split('\n')[0].replace(/^#+\s*/, '').replace(/\*\*/g, '').trim()
        const title = firstLine || item.topic || '新内容'
        const bodyLines = publishText.split('\n').slice(1).join('\n').trim()
        const content = bodyLines || publishText
        const images: string[] = item.imageUrl ? [item.imageUrl] : []

        try {
          const { writeFileSync, mkdirSync, existsSync } = await import('fs')
          const { spawnSync } = await import('child_process')
          const { homedir } = await import('os')
          const home = homedir()

          const tmpDir = '/tmp/xhs_publish'
          mkdirSync(tmpDir, { recursive: true })
          writeFileSync(`${tmpDir}/title.txt`, title, 'utf-8')
          writeFileSync(`${tmpDir}/content.txt`, content, 'utf-8')

          const localImages: string[] = []
          if (images.length > 0) {
            for (let i = 0; i < images.length; i++) {
              const img = images[i]
              if (img.startsWith('http')) {
                const imgPath = `${tmpDir}/img_${i}.jpg`
                const imgResp = await fetch(img)
                writeFileSync(imgPath, Buffer.from(await imgResp.arrayBuffer()))
                localImages.push(imgPath)
              } else {
                localImages.push(img)
              }
            }
          } else {
            const blankImg = `${tmpDir}/blank.jpg`
            if (!existsSync(blankImg)) {
              writeFileSync(blankImg, Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=', 'base64'))
            }
            localImages.push(blankImg)
          }

          const args = ['run', 'python', 'scripts/cli.py', 'publish',
            '--title-file', `${tmpDir}/title.txt`,
            '--content-file', `${tmpDir}/content.txt`,
            ...localImages.flatMap(img => ['--images', img]),
          ]

          const proc = spawnSync(`${home}/.local/bin/uv`, args, {
            cwd: `${home}/.agents/skills/xiaohongshu-skills`,
            encoding: 'utf-8',
            timeout: 60000,
          })

          if (proc.status === 0) {
            context?.onPublished?.(idx)
            result = `✅ 发布成功！\n标题：${title}\n平台：小红书\n内容预览：${content.slice(0, 80)}…`
          } else {
            result = `❌ 发布失败：${(proc.stderr || proc.stdout || '未知错误').slice(0, 300)}`
          }
        } catch (e: any) {
          result = `❌ 发布出错：${e.message}`
        }
        break
      }
      default:
        result = `未知工具：${name}`
    }

    return result
  } catch (e: any) {
    return `工具执行出错：${e.message}`
  }
}
