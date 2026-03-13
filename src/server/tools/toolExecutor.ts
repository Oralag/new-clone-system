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
        result = `出货单 ${outRows.length} 条合计 ¥${outTotal.toFixed(2)}，销售合同 ${contractRows.length} 份合计 ¥${contractTotal.toFixed(2)}。出货明细：${JSON.stringify(outRows.slice(0, 10).map((r: any) => ({ 客户: r.customer_name, 金额: r.total_amount, 日期: String(r.out_date || r.created_at || '').slice(0, 10) })))}`
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
        result = `共 ${rows.length} 条采购订单，合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 供应商: r.supplier_name, 金额: r.total_amount, 日期: String(r.order_date || r.created_at || '').slice(0, 10) })))}`
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
        const res = await erpPost('/shop/ShopCustomer/add', input, token)
        result = res?.code === 1 ? `客户创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_supplier': {
        const res = await erpPost('/procure/supplier/add', input, token)
        result = res?.code === 1 ? `供应商创建成功！ID: ${res?.data?.id || '已生成'}` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_goods': {
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
            if (matched) input.customer_id = matched.id
          } catch { /* ignore */ }
        }
        const res = await erpPost('/shop/ContractOrder/add', input, token)
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
            if (matched) input.supplier_id = matched.id
          } catch { /* ignore */ }
        }
        const res = await erpPost('/stock/PurchaseOrder/add', input, token)
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
      case 'navigate_to': {
        result = `导航指令：${input.page}`
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
