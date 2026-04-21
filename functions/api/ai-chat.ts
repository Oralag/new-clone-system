// Cloudflare Pages Function — /api/ai-chat
// Mirrors the logic in src/server/viteAiPlugin.ts

interface Env {
  ANTHROPIC_API_KEY: string
  ANTHROPIC_BASE_URL?: string
}

const DEFAULT_ERP_BASE = 'https://saas.mzth.cn/adminapi'

// Decode erp_xxx wrapped token → { base, realToken }
function decodeToken(raw: string): { base: string; realToken: string } {
  if (raw.startsWith('erp_')) {
    try {
      const b64 = raw.slice(4)
      const padded = b64 + '=='.slice((b64.length % 4 === 0) ? 4 : b64.length % 4)
      const decoded = JSON.parse(atob(padded))
      if (decoded.t && decoded.b) {
        return { base: decoded.b + '/adminapi', realToken: decoded.t }
      }
    } catch { /* fallback below */ }
  }
  return { base: DEFAULT_ERP_BASE, realToken: raw }
}

async function erpGet(path: string, params: Record<string, any>, token: string) {
  const { base, realToken } = decodeToken(token)
  const url = new URL(base + path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })
  const res = await fetch(url.toString(), { headers: { token: realToken, 'Content-Type': 'application/json' } })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { code: -1, message: text.slice(0, 200) } }
}

async function erpPost(path: string, body: Record<string, any>, token: string) {
  const { base, realToken } = decodeToken(token)
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { token: realToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { code: -1, message: text.slice(0, 200) } }
}

// 过滤掉包装/原材料类商品
const PACKAGING_KEYWORDS = ['袋', '盒装', '标签', '不干胶', '塑膜', '专用', '包装', '纸箱', '封口', '捆', '膜']
function isPackagingGoods(name: string): boolean {
  return PACKAGING_KEYWORDS.some(kw => name.includes(kw)) && !name.includes('成品')
}

function charSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const setA = new Set(a)
  let overlap = 0
  for (const ch of setA) if (b.includes(ch)) overlap++
  return overlap / Math.max(setA.size, new Set(b).size)
}

async function resolveGoodsIds(items: any[], token: string): Promise<any[]> {
  return Promise.all(items.map(async (item) => {
    const num = item.num ?? item.qty ?? 1
    const normalized = { ...item, num, qty: undefined }
    delete normalized.qty
    if (!normalized.goods_name || normalized.goods_id) return normalized
    try {
      const res: any = await erpGet('/goods/ShopGoods/index', { keyword: normalized.goods_name, list_rows: 10 }, token)
      const rows = res?.data?.rows || []
      let matched = rows.find((g: any) =>
        g.goods_name === normalized.goods_name ||
        g.goods_name?.includes(normalized.goods_name) ||
        normalized.goods_name?.includes(g.goods_name)
      )
      // 精确匹配失败：取前2字模糊搜索 + 字符相似度
      if (!matched && normalized.goods_name.length >= 2) {
        const fuzzyKeyword = normalized.goods_name.slice(0, 2)
        const res2: any = await erpGet('/goods/ShopGoods/index', { keyword: fuzzyKeyword, list_rows: 30 }, token)
        const rows2 = res2?.data?.rows || []
        let bestScore = 0
        let bestMatch: any = null
        for (const g of rows2) {
          const score = charSimilarity(normalized.goods_name, g.goods_name)
          if (score > bestScore) { bestScore = score; bestMatch = g }
        }
        if (bestScore >= 0.6) {
          matched = bestMatch
          normalized._fuzzy_matched = `语音识别已纠正：「${normalized.goods_name}」→「${matched.goods_name}」`
          normalized.goods_name = matched.goods_name
        } else {
          // 完全匹配失败：返回候选列表（过滤包装/原材料）
          const candidates = rows2.filter((g: any) => !isPackagingGoods(g.goods_name))
            .slice(0, 8)
            .map((g: any) => ({ id: g.id, name: g.goods_name, unit: g.unit_name, price: g.sell_price }))
          if (candidates.length > 0) {
            normalized._unresolved = true
            normalized._candidates = candidates
          } else {
            // 候选列表也为空，完全找不到
            normalized._unresolved = true
            normalized._candidates = []
          }
        }
      }
      if (matched) return { ...normalized, goods_id: matched.id, goods_sn: matched.goods_sn, unit_name: normalized.unit_name || matched.unit_name, cate_name: matched.cate_name }
    } catch { /* ignore */ }
    return normalized
  }))
}

async function executeTool(name: string, input: Record<string, any>, token: string, books?: any[]): Promise<string> {
  try {
    let result: string
    switch (name) {
      case 'query_retail_orders': {
        const res: any = await erpGet('/retail/order/index', { list_rows: 200 }, token)
        let rows = res?.data?.rows || []
        // 按商品名在客户端过滤（goods_info是JSON字符串，后端不支持商品名搜索）
        if (input.keyword) {
          rows = rows.filter((r: any) => {
            const info = typeof r.goods_info === 'string' ? r.goods_info : JSON.stringify(r.goods_info || '')
            return info.includes(input.keyword) || (r.order_sn || '').includes(input.keyword)
          })
        }
        result = `共 ${rows.length} 条零售订单。${JSON.stringify(rows.slice(0, 20).map((r: any) => {
          let goods = r.goods_info
          try { goods = JSON.parse(r.goods_info) } catch {}
          const goodsDesc = Array.isArray(goods) ? goods.map((g: any) => `${g.goods_name}×${g.num}`).join('、') : String(goods || '')
          return { id: r.id, 单号: r.order_sn, 商品: goodsDesc, 金额: r.pay_amount, 日期: String(r.order_date || r.created_at || '').slice(0, 10), 状态: r.status === 1 ? '已审核' : '未审核' }
        }))}`
        break
      }
      case 'query_customers': {
        const res: any = await erpGet('/shop/ShopCustomer/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 位客户。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.nickname || r.name, 手机: r.mobile, 余额: r.balance })))}`
        break
      }
      case 'query_suppliers': {
        const res: any = await erpGet('/procure/supplier/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 家供应商。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.name, 联系人: r.contact, 手机: r.mobile })))}`
        break
      }
      case 'query_goods': {
        const res: any = await erpGet('/goods/ShopGoods/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        const filtered = rows.filter((r: any) => !isPackagingGoods(r.goods_name))
        const picks = filtered.slice(0, 8).map((r: any) => `[[PICK:${r.goods_name}|${r.unit_name || ''}|${r.sell_price || 0}]]`).join('')
        result = filtered.length > 0
          ? `找到 ${filtered.length} 个商品，请选择：\n${picks}`
          : `没有找到"${input.keyword}"相关商品`
        break
      }
      case 'query_inventory': {
        const res: any = await erpGet('/stock/StockAll/index', { list_rows: 100, keyword: input.keyword }, token)
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
        const [outRes, contractRes]: any[] = await Promise.all([
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
        const res: any = await erpGet('/stock/PurchaseOrder/index', params, token)
        const rows = res?.data?.rows || []
        const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        result = `共 ${rows.length} 条采购订单，合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ id: r.id, 供应商: r.supplier_name, 金额: r.total_amount, 日期: String(r.order_date || r.created_at || '').slice(0, 10) })))}`
        break
      }
      case 'query_finance': {
        const typeMap: Record<string, string> = {
          collect: '/finance/CollectReceipt/index',
          pay: '/finance/PayReceipt/index',
          receivable: '/finance/CollectAccounts/index',
          payable: '/finance/PayAccounts/index',
          fund: '/finance/Fund/index',
          prepay: '/finance/Prepay/index',
        }
        const path = typeMap[input.type]
        if (!path) { result = '未知财务类型'; break }
        const res: any = await erpGet(path, { list_rows: input.limit || 50 }, token)
        const rows = res?.data?.rows || []
        result = `${input.type} 共 ${rows.length} 条：${JSON.stringify(rows.slice(0, 20))}`
        break
      }
      case 'query_staff': {
        const res: any = await erpGet('/personnel/staff/index', { list_rows: 100, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 名员工。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 姓名: r.name, 手机: r.mobile, 部门: r.dept, 职位: r.jobs })))}`
        break
      }
      case 'query_warehouses': {
        const res: any = await erpGet('/stock/WarehouseName/index', { list_rows: 50 }, token)
        const rows = res?.data?.rows || []
        result = `共 ${rows.length} 个仓库：${rows.map((r: any) => r.name).join('、')}`
        break
      }
      case 'create_customer': {
        const res: any = await erpPost('/shop/ShopCustomer/add', input, token)
        result = res?.code === 1 ? `客户创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_supplier': {
        const res: any = await erpPost('/procure/supplier/add', input, token)
        result = res?.code === 1 ? `供应商创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_goods': {
        const res: any = await erpPost('/goods/ShopGoods/add', input, token)
        result = res?.code === 1 ? `商品创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_sale_order': {
        // 自动根据 customer_name 查找 customer_id
        if (input.customer_name && !input.customer_id) {
          try {
            const cRes: any = await erpGet('/shop/ShopCustomer/index', { keyword: input.customer_name, list_rows: 5 }, token)
            const customers = cRes?.data?.rows || []
            const matched = customers.find((c: any) => (c.nickname || c.name) === input.customer_name || (c.nickname || c.name)?.includes(input.customer_name))
            if (matched) { input.customer_id = matched.id; input.customer_name = matched.nickname || matched.name }
          } catch { /* ignore */ }
        }
        // 自动根据 goods_name 查找 goods_id，序列化为 goods_info
        const saleItems = Array.isArray(input.items) ? input.items : []
        const resolvedSaleItems = await resolveGoodsIds(saleItems, token)
        const salePayload: Record<string, any> = {
          customer_id: input.customer_id,
          customer_name: input.customer_name,
          total_amount: input.total_amount,
          admin_name: input.admin_name || '',
          remark: input.remark || '',
          goods_info: JSON.stringify(resolvedSaleItems),
        }
        const res: any = await erpPost('/shop/ContractOrder/add', salePayload, token)
        result = res?.code === 1 ? `销售订单创建成功！单号: ${res?.data?.order_sn || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_procure_order': {
        // 自动根据 supplier_name 查找 supplier_id
        if (input.supplier_name && !input.supplier_id) {
          try {
            const sRes: any = await erpGet('/procure/supplier/index', { keyword: input.supplier_name, list_rows: 5 }, token)
            const suppliers = sRes?.data?.rows || []
            const matched = suppliers.find((s: any) => s.name === input.supplier_name || s.name?.includes(input.supplier_name))
            if (matched) { input.supplier_id = matched.id; input.supplier_name = matched.name }
          } catch { /* ignore */ }
        }
        // 自动根据 goods_name 查找 goods_id，序列化为 goods_info
        const procureItems = Array.isArray(input.items) ? input.items : []
        const resolvedProcureItems = await resolveGoodsIds(procureItems, token)
        const procurePayload: Record<string, any> = {
          supplier_id: input.supplier_id,
          supplier_name: input.supplier_name,
          total_amount: input.total_amount,
          admin_name: input.admin_name || '',
          remark: input.remark || '',
          goods_info: JSON.stringify(resolvedProcureItems),
        }
        const res: any = await erpPost('/stock/PurchaseOrder/add', procurePayload, token)
        result = res?.code === 1 ? `采购订单创建成功！单号: ${res?.data?.order_sn || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_collect_receipt': {
        const res: any = await erpPost('/finance/CollectReceipt/add', input, token)
        result = res?.code === 1 ? `收款单创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_pay_receipt': {
        const res: any = await erpPost('/finance/PayReceipt/add', input, token)
        result = res?.code === 1 ? `付款单创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_prepay': {
        if (!input.pay_type) input.pay_type = input.customer_name ? 'customer' : 'supplier'
        const res: any = await erpPost('/finance/Prepay/create', input, token)
        result = res?.code === 1 ? `预付款创建成功！单号: ${res?.data?.order_sn || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_staff': {
        const res: any = await erpPost('/personnel/staff/add', input, token)
        result = res?.code === 1 ? `员工创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_warehouse': {
        const res: any = await erpPost('/stock/WarehouseName/add', input, token)
        result = res?.code === 1 ? `仓库创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_fund_account': {
        const res: any = await erpPost('/finance/Fund/add', input, token)
        result = res?.code === 1 ? `资金账户创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_retail_order': {
        const rawItems: any[] = input.items || []
        if (!rawItems.length) { result = '请提供商品明细'; break }
        const resolvedItems = await resolveGoodsIds(rawItems, token)

        // 有商品未匹配：返回候选列表供用户选择，不创建订单
        const unresolved = resolvedItems.filter((i: any) => i._unresolved)
        if (unresolved.length > 0) {
          const picks = unresolved.map((i: any) => {
            if (!i._candidates || i._candidates.length === 0) {
              return `「${i.goods_name}」在系统中找不到对应商品，请先确认商品名称再录入。`
            }
            const list = i._candidates.map((c: any) => `[[PICK:${c.name}|${c.unit}|${c.price}]]`).join('')
            return `「${i.goods_name}」找不到，请选择：\n${list}`
          }).join('\n\n')
          result = picks
          break
        }

        // 兜底：仍有商品没有 goods_id，拒绝创建
        const noId = resolvedItems.filter((i: any) => !i.goods_id)
        if (noId.length > 0) {
          result = `以下商品在系统中找不到，无法录入：${noId.map((i: any) => `「${i.goods_name}」`).join('、')}。请确认商品名称后重试。`
          break
        }

        const today = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
        const discountAmt = Number(input.discount_amount) || 0
        const goodsTotal = resolvedItems.reduce((s: number, i: any) => s + (Number(i.num) || 1) * (Number(i.price) || 0), 0)
        // 用户说了总收款额时直接用，否则按明细计算
        const payAmount = input.pay_amount ? Number(input.pay_amount) : Math.max(0, goodsTotal - discountAmt)
        const orderSn = `LS${today.replace(/-/g, '')}${String(Date.now()).slice(-3)}`
        const payload: Record<string, any> = {
          order_date: today,
          order_sn: orderSn,
          pay_method: input.pay_method || 'cash',
          remark: input.remark || '',
          member_name: input.member_name || '',
          total_amount: goodsTotal,
          discount_amount: discountAmt,
          pay_amount: payAmount,
          goods_info: JSON.stringify(resolvedItems.map((i: any) => ({
            goods_id: i.goods_id, goods_name: i.goods_name, goods_sn: i.goods_sn || '',
            unit_name: i.unit_name || '', num: i.num || 1, price: i.price,
          }))),
          status: 0,
        }
        const res: any = await erpPost('/retail/order/add', payload, token)
        if (res?.code !== 1) { result = `创建失败：${res?.msg || JSON.stringify(res)}`; break }
        const orderId = res?.data?.id || res?.data?.lastId
        // 审核
        await erpPost('/retail/order/audit', { id: orderId, status: 1 }, token)
        // 扣库存
        try {
          const whRes: any = await erpGet('/stock/WarehouseName/index', { list_rows: 1 }, token)
          const wh = whRes?.data?.rows?.[0]
          if (wh) {
            for (const item of resolvedItems) {
              if (!item.goods_id || !item.num) continue
              const sr: any = await erpGet('/stock/StockAll/index', { goods_id: item.goods_id, warehouse_id: wh.id, list_rows: 10 }, token)
              const stock = sr?.data?.rows?.[0]
              if (stock) await erpPost('/stock/StockAll/edit', { id: stock.id, qty: Math.max(0, Number(stock.qty || 0) - Number(item.num)) }, token)
            }
          }
        } catch { /* 库存失败不中断 */ }
        // 更新零售收款账户
        try {
          const fundRes: any = await erpGet('/finance/Fund/index', { list_rows: 100 }, token)
          const funds: any[] = fundRes?.data?.rows || []
          const rf = funds.find((f: any) => f.name === '零售收款账户')
          if (rf) await erpPost('/finance/Fund/edit', { id: rf.id, name: rf.name, balance: Number(rf.balance || 0) + payAmount }, token)
          else await erpPost('/finance/Fund/add', { name: '零售收款账户', type: 2, balance: payAmount, remark: '零售单自动累计' }, token)
        } catch { /* 财务失败不中断 */ }
        const itemsSummary = resolvedItems.map((i: any) => `@ ${i.goods_name} × ${i.num || 1} ¥${((i.num || 1) * (i.price || 0)).toFixed(2)}`).join('\n')
        result = `零售单录入完成！\n单号：${orderSn}\n${itemsSummary}${discountAmt > 0 ? `\n折扣 -¥${discountAmt.toFixed(2)}` : ''}\n合计：¥${payAmount.toFixed(2)}\n已自动审核，库存和账户已更新。`
        break
      }
      case 'navigate_to': {
        result = `导航指令：${input.page}`
        break
      }
      case 'update_customer': {
        const res: any = await erpPost('/shop/ShopCustomer/edit', input, token)
        result = res?.code === 1 ? `客户更新成功！` : `更新失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_customer': {
        const res: any = await erpPost('/shop/ShopCustomer/del', { id: input.id }, token)
        result = res?.code === 1 ? `客户已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'update_supplier': {
        const res: any = await erpPost('/procure/supplier/edit', input, token)
        result = res?.code === 1 ? `供应商更新成功！` : `更新失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_supplier': {
        const res: any = await erpPost('/procure/supplier/del', { id: input.id }, token)
        result = res?.code === 1 ? `供应商已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'update_goods': {
        const res: any = await erpPost('/goods/ShopGoods/edit', input, token)
        result = res?.code === 1 ? `商品更新成功！` : `更新失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_goods': {
        const res: any = await erpPost('/goods/ShopGoods/del', { id: input.id }, token)
        result = res?.code === 1 ? `商品已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_retail_order': {
        // 先反审核（status=1的单子不能直接删），再删除
        await erpPost('/retail/order/audit', { id: input.id, status: 0 }, token)
        const res: any = await erpPost('/retail/order/del', { id: input.id }, token)
        result = res?.code === 1 ? `零售订单已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_purchase_order': {
        const res: any = await erpPost('/stock/PurchaseOrder/del', { id: input.id }, token)
        result = res?.code === 1 ? `采购订单已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_sale_order': {
        const res: any = await erpPost('/shop/ContractOrder/del', { id: input.id }, token)
        result = res?.code === 1 ? `销售订单已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
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

function detectIntent(text: string): 'query' | 'create' | 'navigate' | 'general' {
  if (/查询|查看|统计|汇总|多少|列表|有哪些|显示|告诉我|查一下/.test(text)) return 'query'
  if (/新增|添加|录入|创建|增加|登记|提交|帮我加|卖了|卖出|销售了|零售|出售|卖掉|买了|收了|门店|散客|写错|录错|改一下|修改|纠正|删掉|删除/.test(text)) return 'create'
  if (/跳转|去|打开|进入|导航|页面/.test(text)) return 'navigate'
  return 'general'
}

function getSystemPrompt(intent: string): string {
  const BASE = `你是数字游牧ERP管家，数字游牧ERP系统的内置AI助手，运行在系统内部，可以直接调用工具操作ERP数据。你的名字是"ERP管家"，不是Claude，不是AI助手，不要透露底层模型信息。绝对禁止说"我无法直接操作"、"需要您手动"等推脱性语句。回复简洁友好，中文。

【工具选择规则——严格遵守】
- 查商品/确认商品是否存在 → 用 query_goods；收到结果后**必须把 [[PICK:...]] 按钮原文复制到你的回复里**，让用户点选
- 查零售订单/历史销售记录 → 用 query_retail_orders
- 查采购单 → 用 query_purchases
- 查客户 → 用 query_customers
- 录零售单 → 用 create_retail_order
- 绝对禁止：查商品时调用 query_retail_orders；查订单时调用 query_goods`
  const CORRECTION_RULE = `
【纠错规则——最高优先级】
用户说"写错了"、"录错了"、"改一下"、"名字不对"、"删除"等，必须：
1. 先调用对应的 query 工具查找刚才录入的错误记录，获取其 ID
   - 零售单用 query_retail_orders；采购单用 query_purchases；销售单用 query_sales
2. 若只是名称/字段错误：直接调用 update_xxx 修改，不要新建
3. 若需要彻底删除重建：先 delete_xxx 删除错误记录，再 create_xxx 创建正确的
4. 严禁在不删除/修改错误记录的情况下直接新建，避免重复数据
5. 严禁让用户自己去页面找ID——你必须先用 query 工具查到 ID 再操作`
  const DOCUMENT_IMAGE_RULES = `
【单据图片识别规则】
识别单据图片时：
- 先判断图片方向；如果单据是横着拍、倒着拍、侧拍、倾斜拍，先在脑中旋转成正向后再逐字段读取，禁止按当前方向硬读
- 优先读取印刷体、表头、字段标签，再读取手写内容；浅蓝复写纸、浅色字迹、阴影区域要逐字确认
- 供应商名称只能从"销货单位/供货单位/销货方/卖方/单位名称（盖章）"这类明确字段读取；绝不能把"客户/购货单位/收货单位/联系人/电话/地址/单名"当成供应商
- 如果同一张单据同时出现公司名和手写人名，供应商优先使用公司名；只有完全没有公司名时，才允许退回到底部手写姓名
- 商品名称只能取表格中"商品名称/品名/货物名称"那一列的完整内容，必须整格逐字读完；不能把数量、单价、金额、单位、备注串进商品名称
- 商品名称必须完整识别，包含品牌名+产品名+规格，例如"科尔沁原味奶豆腐300g"不能缩短为"奶豆腐"
- 如果图片模糊、字迹不清晰、被遮挡，导致供应商名称或商品名称任一字段无法确认，必须直接说明"这里看不清，需要补拍特写"，不要猜测、不要编造近似字
- 如果供应商名称或商品名称有任意一个无法确认，禁止输出半成品识别结果；不要只报单号/日期/金额后就结束，必须直接要求用户补拍对应区域特写
- 对手写人名逐字辨认，正式姓名（如"王丽敏"）不要误读为口头称谓（如"王阿姨"）
- 输出识别结果时，供应商名称和商品名称后面注明来源字段（例如：供应商名称〔来源：销货单位〕、商品名称〔来源：商品名称列〕），便于用户复核
- 识别完毕后，先列出识别到的所有字段让用户确认
- 【强制等待确认】列出字段后必须停下来等用户回复，严禁在用户未明确说"对"、"确认"、"录入"、"好"之前调用任何创建工具
- 用户如果在修正过程中（说"不对"、"改成XXX"等），继续等待用户确认完毕，不能提前录入`

  const prompts: Record<string, string> = {
    query: `${BASE}\n当前任务：数据查询。调用合适的查询工具获取数据，用清晰格式展示给用户。`,
    create: `${BASE}
${CORRECTION_RULE}

【零售场景规则】
- 用户说"卖了XX"、"门店卖了"等零售场景，使用 create_retail_order 工具
- 支付方式识别：微信/扫码→wechat；支付宝→alipay；现金→cash；刷卡→card；未说明→cash；必须传入 pay_method 字段
- 【铁律：同一批零售合并一张单】多种商品只能调用一次 create_retail_order，所有商品放同一个 items 数组
- 【铁律：禁止重复录入】已成功创建后不得再次创建；用户说"重新录"时先用 query_retail_orders 查到旧单ID，用 delete_retail_order 真正删除，再创建新单
- 【铁律：必须先查商品再录入】调用 create_retail_order 前必须先用 query_goods 查出系统全名，列出明细等用户确认后才能调用
- 【铁律：用户给了 goods_id 必须直接用】用户消息里含 goods_id=XXX 时，items 里该商品直接传 goods_id，禁止重新搜索
- 【录入完成后显示系统全名】回复里每行商品必须用系统全名，禁止简写成用户说的简称
- 【PICK按钮格式】列候选时格式：[[PICK:商品名|单位|价格|商品ID]]

【克→斤换算规则】中国1斤=500克。散装称重类商品（乌日莫、黄油、冻炒米、奶豆腐块等）用户说"XXX克"时，换算斤数=克数÷500。示例：530克=1.06斤。**绝对禁止除以1000**。

【数量与价格语义规则】
- "N块儿/个" 是数量不是商品名；"80克"是规格不是数量
- 只有一个价格时默认是总价；有疑义时列出"单价×数量=小计"让用户核对

其他录入：调用合适的创建工具录入数据。缺少必填字段时先询问用户。`,
    create_with_image: `${BASE}
${CORRECTION_RULE}
${DOCUMENT_IMAGE_RULES}

其他录入：调用合适的创建工具录入数据。缺少必填字段时先询问用户。`,
    navigate: `${BASE}\n当前任务：页面导航。调用 navigate_to 工具跳转到用户指定页面。`,
    general: `${BASE}
${CORRECTION_RULE}

【零售场景规则】
- 用户说"卖了XX"、"门店卖了"等零售场景，使用 create_retail_order 工具
- 支付方式识别：微信/扫码→wechat；支付宝→alipay；现金→cash；刷卡→card；未说明→cash；必须传入 pay_method 字段
- 【铁律：同一批零售合并一张单】多种商品只能调用一次 create_retail_order
- 【铁律：禁止重复录入】已成功创建后不得再次创建；用户说"重新录"时先 query_retail_orders 查旧单ID，delete_retail_order 真正删除，再创建
- 【铁律：必须先查商品再录入】先 query_goods 查系统全名，列明细等确认后才调 create_retail_order
- 【铁律：用户给了 goods_id 必须直接用】含 goods_id=XXX 时直接传，禁止重新搜索
- 【PICK按钮格式】[[PICK:商品名|单位|价格|商品ID]]
- 【克→斤】散装称重类克数÷500=斤，禁止÷1000

根据用户需求选择合适的工具完成任务。`,
  }
  return prompts[intent] || prompts.general
}

function shouldAskForCloseup(text: string): boolean {
  const normalized = String(text || '').replace(/\s+/g, '')
  if (!normalized) return true
  // 只在 AI 自己明确说看不清、且没有识别出任何商品内容时才触发
  const hasRetryRequest = /补拍|重拍|特写|重新拍|重新上传|拍清楚/.test(normalized)
  if (hasRetryRequest) return false  // AI 已经在要求补拍了，不再覆盖
  const placeholderGoods = /商品1|商品一|商品A/.test(normalized)
  return placeholderGoods
}

const CLOSEUP_MESSAGE = `这张单据里【供应商名称】和【商品名称】目前无法可靠识别，先不要录入。
请这样补拍后再发我：
1. 把整张单据横向摆正后重拍一张
2. 单独补拍“销货单位/供货单位”区域特写
3. 单独补拍表格“商品名称/品名”那一列特写
拍清楚后我再继续识别。`

const allTools = [
  { name: 'query_retail_orders', description: '查询零售订单列表，用于找到需要删除的零售单ID', input_schema: { type: 'object', properties: { date: { type: 'string', description: '日期 YYYY-MM-DD，默认今天' }, limit: { type: 'number', description: '返回条数，默认20' } } } },
  { name: 'query_customers', description: '查询客户列表', input_schema: { type: 'object', properties: { keyword: { type: 'string', description: '搜索关键词' }, limit: { type: 'number', description: '返回条数' } } } },
  { name: 'query_suppliers', description: '查询供应商列表', input_schema: { type: 'object', properties: { keyword: { type: 'string', description: '搜索关键词' }, limit: { type: 'number', description: '返回条数' } } } },
  { name: 'query_goods', description: '查询商品列表', input_schema: { type: 'object', properties: { keyword: { type: 'string', description: '商品名称/编码' }, limit: { type: 'number', description: '返回条数' } } } },
  { name: 'query_inventory', description: '查询库存数据', input_schema: { type: 'object', properties: { keyword: { type: 'string', description: '商品名称' }, warehouse: { type: 'string', description: '仓库名称' } } } },
  { name: 'query_sales', description: '查询销售订单/出货单', input_schema: { type: 'object', properties: { start_date: { type: 'string' }, end_date: { type: 'string' }, customer: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_purchases', description: '查询采购订单', input_schema: { type: 'object', properties: { start_date: { type: 'string' }, end_date: { type: 'string' }, supplier: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_finance', description: '查询财务数据', input_schema: { type: 'object', properties: { type: { type: 'string', enum: ['collect', 'pay', 'receivable', 'payable', 'fund', 'prepay'] }, limit: { type: 'number' } }, required: ['type'] } },
  { name: 'query_staff', description: '查询员工列表', input_schema: { type: 'object', properties: { keyword: { type: 'string' } } } },
  { name: 'query_warehouses', description: '查询仓库列表', input_schema: { type: 'object', properties: {} } },
  { name: 'create_customer', description: '新增客户', input_schema: { type: 'object', properties: { name: { type: 'string' }, mobile: { type: 'string' }, address: { type: 'string' }, remark: { type: 'string' } }, required: ['name'] } },
  { name: 'create_supplier', description: '新增供应商', input_schema: { type: 'object', properties: { name: { type: 'string' }, contact: { type: 'string' }, mobile: { type: 'string' }, address: { type: 'string' }, bank: { type: 'string' } }, required: ['name'] } },
  { name: 'create_goods', description: '新增商品', input_schema: { type: 'object', properties: { goods_name: { type: 'string' }, goods_sn: { type: 'string' }, sell_price: { type: 'number' }, cost_price: { type: 'number' }, unit_name: { type: 'string' }, cate_name: { type: 'string' } }, required: ['goods_name'] } },
  { name: 'create_sale_order', description: '新增销售合同/订单', input_schema: { type: 'object', properties: { customer_name: { type: 'string', description: '客户名称（必填）' }, total_amount: { type: 'number' }, admin_name: { type: 'string', description: '经办人/业务员姓名' }, remark: { type: 'string' }, items: { type: 'array', description: '商品明细列表，每项含 goods_name/num/price/unit_name', items: { type: 'object', properties: { goods_name: { type: 'string', description: '商品名称' }, num: { type: 'number', description: '数量' }, price: { type: 'number', description: '含税单价' }, unit_name: { type: 'string', description: '单位' } } } } }, required: ['customer_name'] } },
  { name: 'create_procure_order', description: '新增采购订单', input_schema: { type: 'object', properties: { supplier_name: { type: 'string', description: '供应商名称（必填）' }, total_amount: { type: 'number' }, admin_name: { type: 'string', description: '经办人/采购人姓名' }, remark: { type: 'string' }, items: { type: 'array', description: '商品明细列表，每项含 goods_name/num/price/unit_name', items: { type: 'object', properties: { goods_name: { type: 'string', description: '商品名称' }, num: { type: 'number', description: '数量' }, price: { type: 'number', description: '含税单价' }, unit_name: { type: 'string', description: '单位' } } } } }, required: ['supplier_name'] } },
  { name: 'create_collect_receipt', description: '新增收款单', input_schema: { type: 'object', properties: { contact_name: { type: 'string' }, amount: { type: 'number' }, fund_id: { type: 'number' }, fund_name: { type: 'string' }, receipt_date: { type: 'string' }, remark: { type: 'string' } }, required: ['contact_name', 'amount'] } },
  { name: 'create_pay_receipt', description: '新增付款单', input_schema: { type: 'object', properties: { contact_name: { type: 'string' }, amount: { type: 'number' }, fund_id: { type: 'number' }, fund_name: { type: 'string' }, pay_date: { type: 'string' }, remark: { type: 'string' } }, required: ['contact_name', 'amount'] } },
  { name: 'create_prepay', description: '新增预付款', input_schema: { type: 'object', properties: { amount: { type: 'number' }, pay_type: { type: 'string', enum: ['supplier', 'customer'] }, supplier_name: { type: 'string' }, customer_name: { type: 'string' }, pay_date: { type: 'string' }, fund_id: { type: 'number' }, fund_name: { type: 'string' }, remark: { type: 'string' } }, required: ['amount'] } },
  { name: 'create_staff', description: '新增员工', input_schema: { type: 'object', properties: { name: { type: 'string' }, mobile: { type: 'string' }, dept: { type: 'string' }, jobs: { type: 'string' } }, required: ['name'] } },
  { name: 'create_warehouse', description: '新增仓库', input_schema: { type: 'object', properties: { name: { type: 'string' }, remark: { type: 'string' } }, required: ['name'] } },
  { name: 'create_fund_account', description: '新增资金账户', input_schema: { type: 'object', properties: { name: { type: 'string' }, balance: { type: 'number' } }, required: ['name'] } },
  { name: 'create_retail_order', description: '新增零售订单（现场零售、当面销售、卖出商品时使用）', input_schema: { type: 'object', properties: { items: { type: 'array', description: '商品明细列表', items: { type: 'object', properties: { goods_id: { type: 'number', description: '商品ID（必须先用query_goods查到）' }, goods_name: { type: 'string' }, num: { type: 'number', description: '数量' }, price: { type: 'number', description: '该商品售价' } }, required: ['goods_name', 'num', 'price'] } }, pay_amount: { type: 'number', description: '实收总金额（用户说"收了¥X"/"一共¥X"时填入，优先级高于items自动计算）' }, order_date: { type: 'string', description: '日期YYYY-MM-DD，默认今天' }, pay_method: { type: 'string', description: '支付方式: cash/wechat/alipay/card，默认cash' }, member_name: { type: 'string' }, remark: { type: 'string' } }, required: ['items'] } },
  { name: 'update_customer', description: '修改客户信息（用于纠正录入错误）', input_schema: { type: 'object', properties: { id: { type: 'number', description: '客户ID（必须先query_customers查到）' }, name: { type: 'string' }, mobile: { type: 'string' }, address: { type: 'string' }, remark: { type: 'string' } }, required: ['id'] } },
  { name: 'delete_customer', description: '删除客户（用于删除错误录入的客户）', input_schema: { type: 'object', properties: { id: { type: 'number', description: '客户ID' } }, required: ['id'] } },
  { name: 'update_supplier', description: '修改供应商信息（用于纠正录入错误）', input_schema: { type: 'object', properties: { id: { type: 'number', description: '供应商ID（必须先query_suppliers查到）' }, name: { type: 'string' }, contact: { type: 'string' }, mobile: { type: 'string' }, address: { type: 'string' } }, required: ['id'] } },
  { name: 'delete_supplier', description: '删除供应商（用于删除错误录入的供应商）', input_schema: { type: 'object', properties: { id: { type: 'number', description: '供应商ID' } }, required: ['id'] } },
  { name: 'update_goods', description: '修改商品信息（用于纠正录入错误）', input_schema: { type: 'object', properties: { id: { type: 'number', description: '商品ID（必须先query_goods查到）' }, goods_name: { type: 'string' }, sell_price: { type: 'number' }, cost_price: { type: 'number' }, unit_name: { type: 'string' } }, required: ['id'] } },
  { name: 'delete_goods', description: '删除商品（用于删除错误录入的商品）', input_schema: { type: 'object', properties: { id: { type: 'number', description: '商品ID' } }, required: ['id'] } },
  { name: 'delete_retail_order', description: '删除零售订单（用于删除错误的零售单）', input_schema: { type: 'object', properties: { id: { type: 'number', description: '零售订单ID' } }, required: ['id'] } },
  { name: 'delete_purchase_order', description: '删除采购订单（用于删除错误的采购单，需先用 query_purchases 查到ID）', input_schema: { type: 'object', properties: { id: { type: 'number', description: '采购订单ID' } }, required: ['id'] } },
  { name: 'delete_sale_order', description: '删除销售合同/订单（用于删除错误的销售单，需先用 query_sales 查到ID）', input_schema: { type: 'object', properties: { id: { type: 'number', description: '销售订单ID' } }, required: ['id'] } },
  { name: 'navigate_to', description: '跳转到ERP系统的指定页面', input_schema: { type: 'object', properties: { page: { type: 'string' } }, required: ['page'] } },
]

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
    },
  })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 ANTHROPIC_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
  const baseURL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
  const erpToken = request.headers.get('x-erp-token') || ''
  const { messages, images, books, userMemory } = await request.json() as any

  const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')
  // 有图片时附加完整识别规则；无图片时用精简 prompt
  const intent = images?.length > 0 ? 'create_with_image' : detectIntent(lastUserMsg?.content || '')
  const systemPrompt = getSystemPrompt(intent) + (userMemory ? `\n\n${userMemory}` : '')

  // Build API messages — inject images into last user message if present
  const apiMessages = messages.map((m: any, idx: number) => {
    const isLastUser = m.role === 'user' && idx === messages.length - 1
    if (isLastUser && images?.length > 0) {
      const content: any[] = images.map((img: any) => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.data },
      }))
      content.push({ type: 'text', text: m.content || '请识别这张单据图片并帮我录入系统。' })
      return { role: 'user', content }
    }
    return { role: m.role, content: m.content }
  })

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const send = async (obj: object) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

  ;(async () => {
    try {
      let loopMessages = [...apiMessages]
      for (let i = 0; i < 5; i++) {
        const res = await fetch(`${baseURL}/v1/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, system: systemPrompt, tools: allTools, messages: loopMessages, stream: true, ...(i === 0 && (intent === 'create' || intent === 'general') ? { tool_choice: { type: 'any' } } : {}) }),
        })
        if (!res.ok) { await send({ type: 'error', error: `API错误: ${await res.text()}` }); break }

        // 流式解析
        const reader = res.body!.getReader()
        const dec = new TextDecoder()
        let buf = ''
        let assistantText = ''
        let stopReason = ''
        const contentBlocks: any[] = []
        let currentBlock: any = null

        outer: while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() || ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') break outer
            let evt: any
            try { evt = JSON.parse(raw) } catch { continue }

            if (evt.type === 'message_delta' && evt.delta?.stop_reason) {
              stopReason = evt.delta.stop_reason
            }
            if (evt.type === 'content_block_start') {
              currentBlock = { ...evt.content_block, index: evt.index }
              if (currentBlock.type === 'tool_use') currentBlock.input_raw = ''
            }
            if (evt.type === 'content_block_delta') {
              if (evt.delta.type === 'text_delta') {
                assistantText += evt.delta.text
                await send({ type: 'text', text: evt.delta.text })
              } else if (evt.delta.type === 'input_json_delta' && currentBlock) {
                currentBlock.input_raw += evt.delta.partial_json
              }
            }
            if (evt.type === 'content_block_stop' && currentBlock) {
              if (currentBlock.type === 'tool_use') {
                try { currentBlock.input = JSON.parse(currentBlock.input_raw || '{}') } catch { currentBlock.input = {} }
              }
              contentBlocks.push(currentBlock)
              currentBlock = null
            }
            if (evt.type === 'message_stop') break outer
          }
        }

        if (stopReason !== 'tool_use') {
          if (images?.length > 0 && shouldAskForCloseup(assistantText)) {
            // 清掉已发的文字，发补拍提示（覆盖）
            await send({ type: 'text_replace', text: CLOSEUP_MESSAGE })
          }
          break
        }

        const toolUseBlocks = contentBlocks.filter((b: any) => b.type === 'tool_use')
        const textBlocks = contentBlocks.filter((b: any) => b.type === 'text')
        const apiContent = [
          ...textBlocks.map((b: any) => ({ type: 'text', text: b.text || assistantText })),
          ...toolUseBlocks.map((b: any) => ({ type: 'tool_use', id: b.id, name: b.name, input: b.input })),
        ]
        const toolResults: any[] = []
        for (const toolUse of toolUseBlocks) {
          await send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
          const result = await executeTool(toolUse.name, toolUse.input, erpToken, books)
          await send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
        }
        loopMessages = [...loopMessages, { role: 'assistant', content: apiContent }, { role: 'user', content: toolResults }]
      }
      await writer.write(encoder.encode('data: [DONE]\n\n'))
    } catch (e: any) {
      await send({ type: 'error', error: e.message })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' },
  })
}
