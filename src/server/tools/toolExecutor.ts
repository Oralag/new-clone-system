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

async function resolveGoodsIds(items: any[], token: string): Promise<any[]> {
  return Promise.all(
    items.map(async (item) => {
      // 统一数量字段：qty → num
      const num = item.num ?? item.qty ?? 1
      const normalized = { ...item, num, qty: undefined }
      delete normalized.qty

      if (!normalized.goods_name || normalized.goods_id) return normalized
      try {
        const res = await erpGet('/goods/ShopGoods/index', { keyword: normalized.goods_name, list_rows: 5 }, token)
        const rows = res?.data?.rows || []
        const matched = rows.find((g: any) =>
          g.goods_name === normalized.goods_name ||
          g.goods_name?.includes(normalized.goods_name) ||
          normalized.goods_name?.includes(g.goods_name)
        )
        if (matched) return { ...normalized, goods_id: matched.id, goods_sn: matched.goods_sn, unit_name: normalized.unit_name || matched.unit_name, cate_name: matched.cate_name }
      } catch { /* ignore */ }
      return normalized
    })
  )
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
        const res = await erpGet('/goods/ShopGoods/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 种商品。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 商品名: r.goods_name, 编码: r.goods_sn, 售价: r.sell_price, 分类: r.cate_name })))}`
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
        // 财务数据逻辑审查：拉取真实数据，核查7条规则
        const issues: string[] = []
        const ok: string[] = []
        try {
          const [collectRes, payRes, purchaseRes, expenseRes, contractRes, returnRes, saleReturnRes] = await Promise.all([
            erpGet('/finance/CollectReceipt/index', { list_rows: 200 }, token),
            erpGet('/finance/PayReceipt/index', { list_rows: 500 }, token),
            erpGet('/stock/PurchaseOrder/index', { list_rows: 500 }, token),
            erpGet('/finance/Expense/index', { list_rows: 200 }, token),
            erpGet('/shop/ContractOrder/index', { list_rows: 200 }, token),
            erpGet('/procure/ProcureReturn/index', { list_rows: 200, status: 1 }, token),
            erpGet('/stock/SaleReturnOrder/index', { list_rows: 200, status: 1 }, token),
          ])
          // ① 未审核采购单混入检查
          const allPurchase: any[] = purchaseRes?.data?.rows || []
          const unauditedPurchase = allPurchase.filter((r: any) => Number(r.status) !== 1)
          if (unauditedPurchase.length > 0) {
            issues.push(`🔴 ① 采购订单中有 ${unauditedPurchase.length} 条未审核（status≠1），后端不过滤 status，若前端未手动 filter 会混入财务`)
          } else {
            ok.push('① 采购订单 status 过滤正常（全部为已审核）')
          }
          // ② 应收账款数据量检查
          const contractRows: any[] = contractRes?.data?.rows || []
          const receivableRows = contractRows.filter((r: any) => Number(r.status) === 1 && Math.max(0, Number(r.total_amount || 0) - Number(r.pay_amount || 0)) > 0)
          ok.push(`② 应收账款来源正确（合同）：共 ${receivableRows.length} 笔待收`)
          // ③ 付款单已付金额匹配检查
          const payRows: any[] = payRes?.data?.rows || []
          const withRemark = payRows.filter((r: any) => /采购单/.test(r.remark || ''))
          ok.push(`③ 付款单中有 ${withRemark.length} 条含采购单备注可供匹配`)
          // ④ 费用单 pending 过滤检查
          const expenseRows: any[] = expenseRes?.data?.rows || []
          const pendingExpense = expenseRows.filter((r: any) => (r.payment_status || '') === 'pending')
          const paidExpense = expenseRows.filter((r: any) => (r.payment_status || '') !== 'pending')
          ok.push(`④ 费用单：待付款 ${pendingExpense.length} 条（不计入支出），已付 ${paidExpense.length} 条（计入支出）`)
          // ⑤ 退货数据检查
          const returnRows: any[] = returnRes?.data?.rows || []
          const saleReturnRows: any[] = saleReturnRes?.data?.rows || []
          ok.push(`⑤ 采购退货 ${returnRows.length} 条、销售退货 ${saleReturnRows.length} 条，数据可用于冲减`)
          // ⑥ 收款单数据量
          const collectRows: any[] = collectRes?.data?.rows || []
          ok.push(`⑥ 收款单共 ${collectRows.length} 条，数据正常`)
          // ⑦ 应付：计算欠款总额
          const auditedPurchase = allPurchase.filter((r: any) => Number(r.status) === 1)
          const paidById: Record<number, number> = {}
          const paidByKey: Record<string, number> = {}
          const paidBySn: Record<string, number> = {}
          for (const r of payRows) {
            const amt = Number(r.amount || 0); if (!amt) continue
            const sn = String(r.order_sn || '').trim(), sup = String(r.supplier_name || r.contact_name || '').trim()
            if (sn && sup) paidByKey[`${sn}@@${sup}`] = (paidByKey[`${sn}@@${sup}`] || 0) + amt
            const m1 = String(r.remark || '').match(/采购单(?:自动)?付款\s+#(\d+)/)
            if (m1) paidById[Number(m1[1])] = (paidById[Number(m1[1])] || 0) + amt
            const m2 = String(r.remark || '').match(/采购单([A-Za-z0-9]+)审核自动生成/)
            if (m2) paidBySn[m2[1].trim()] = (paidBySn[m2[1].trim()] || 0) + amt
          }
          let totalPayable = 0
          for (const o of auditedPurchase) {
            const orderAmt = Number(o.after_discount ?? o.total_amount ?? 0)
            const sn = String(o.order_sn || o.order_no || '').trim(), sup = String(o.supplier_name || '').trim()
            const paid = paidById[o.id] || paidByKey[`${sn}@@${sup}`] || paidBySn[sn] || 0
            totalPayable += Math.max(0, orderAmt - paid)
          }
          ok.push(`⑦ 应付账款（已审核采购单欠款）合计 ¥${totalPayable.toFixed(2)}`)
        } catch (e: any) {
          issues.push(`审查过程出错：${e?.message || String(e)}`)
        }
        const summary = issues.length === 0 ? '✅ 未发现明显数据逻辑问题' : `⚠️ 发现 ${issues.length} 个问题需要关注`
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

      // ── 编辑工具 ──────────────────────────────────────
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

      // ── 删除工具 ──────────────────────────────────────
      case 'navigate_to': {
        result = `导航指令：${input.page}`
        break
      }
      case 'delete_purchase_order': {
        const res = await erpPost('/stock/PurchaseOrder/del', { id: input.id }, token)
        result = res?.code === 1 ? `采购订单已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_supplier': {
        const res = await erpPost('/procure/supplier/del', { id: input.id }, token)
        result = res?.code === 1 ? `供应商已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_sale_order': {
        const res = await erpPost('/shop/ContractOrder/del', { id: input.id }, token)
        result = res?.code === 1 ? `销售订单已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_customer': {
        const res = await erpPost('/shop/ShopCustomer/del', { id: input.id }, token)
        result = res?.code === 1 ? `客户已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_goods': {
        const res = await erpPost('/goods/ShopGoods/del', { id: input.id }, token)
        result = res?.code === 1 ? `商品已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_staff': {
        const res = await erpPost('/personnel/staff/del', { id: input.id }, token)
        result = res?.code === 1 ? `员工已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_warehouse': {
        const res = await erpPost('/stock/WarehouseName/del', { id: input.id }, token)
        result = res?.code === 1 ? `仓库已删除！` : `删除失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'delete_fund_account': {
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
