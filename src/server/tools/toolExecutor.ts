const ERP_BASE = 'https://erp-server-production-b1b6.up.railway.app/adminapi'

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

export async function executeTool(name: string, input: Record<string, any>, token: string): Promise<string> {
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
        const res = await erpGet(path, { list_rows: input.limit || 50 }, token)
        const rows = res?.data?.rows || []
        result = `${input.type} 共 ${rows.length} 条：${JSON.stringify(rows.slice(0, 20))}`
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
      default:
        result = `未知工具：${name}`
    }

    return result
  } catch (e: any) {
    return `工具执行出错：${e.message}`
  }
}
