import type { FunctionDeclaration } from '@google/genai'

export const queryTools: FunctionDeclaration[] = [
  {
    name: 'query_customers',
    description: '查询客户列表',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜索关键词（客户名称/手机）' },
        limit: { type: 'number', description: '返回条数，默认20' },
      },
    },
  },
  {
    name: 'query_suppliers',
    description: '查询供应商列表',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '搜索关键词' },
        limit: { type: 'number', description: '返回条数，默认20' },
      },
    },
  },
  {
    name: 'query_goods',
    description: '查询商品列表',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '商品名称/编码' },
        limit: { type: 'number', description: '返回条数，默认20' },
      },
    },
  },
  {
    name: 'query_inventory',
    description: '查询库存数据',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '商品名称' },
        warehouse: { type: 'string', description: '仓库名称' },
      },
    },
  },
  {
    name: 'query_sales',
    description: '查询销售订单/出货单',
    parameters: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: '开始日期 YYYY-MM-DD' },
        end_date: { type: 'string', description: '结束日期 YYYY-MM-DD' },
        customer: { type: 'string', description: '客户名称' },
        limit: { type: 'number', description: '返回条数，默认20' },
      },
    },
  },
  {
    name: 'query_purchases',
    description: '查询采购订单',
    parameters: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: '开始日期 YYYY-MM-DD' },
        end_date: { type: 'string', description: '结束日期 YYYY-MM-DD' },
        supplier: { type: 'string', description: '供应商名称' },
        limit: { type: 'number', description: '返回条数，默认20' },
      },
    },
  },
  {
    name: 'query_finance',
    description: '查询财务数据（收款单、付款单、应收应付、资金账户、预付款）',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['collect', 'pay', 'receivable', 'payable', 'fund', 'prepay'],
          description: 'collect=收款单, pay=付款单, receivable=应收, payable=应付, fund=资金账户, prepay=预付款',
        },
        limit: { type: 'number', description: '返回条数，默认20' },
      },
      required: ['type'],
    },
  },
  {
    name: 'query_staff',
    description: '查询员工列表',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '姓名/手机' },
      },
    },
  },
  {
    name: 'query_warehouses',
    description: '查询仓库列表',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
]

export const createTools: FunctionDeclaration[] = [
  {
    name: 'create_customer',
    description: '新增客户',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '客户名称（必填）' },
        mobile: { type: 'string', description: '手机号' },
        address: { type: 'string', description: '地址' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_supplier',
    description: '新增供应商',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '供应商名称（必填）' },
        contact: { type: 'string', description: '联系人' },
        mobile: { type: 'string', description: '手机号' },
        address: { type: 'string', description: '地址' },
        bank: { type: 'string', description: '银行账户' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_goods',
    description: '新增商品',
    parameters: {
      type: 'object',
      properties: {
        goods_name: { type: 'string', description: '商品名称（必填）' },
        goods_sn: { type: 'string', description: '商品编码' },
        sell_price: { type: 'number', description: '售价' },
        cost_price: { type: 'number', description: '成本价' },
        unit_name: { type: 'string', description: '单位' },
        cate_name: { type: 'string', description: '分类' },
        spec: { type: 'string', description: '规格' },
        barcode: { type: 'string', description: '条码' },
      },
      required: ['goods_name'],
    },
  },
  {
    name: 'create_sale_order',
    description: '新增销售合同/订单',
    parameters: {
      type: 'object',
      properties: {
        customer_name: { type: 'string', description: '客户名称（必填）' },
        total_amount: { type: 'number', description: '金额' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['customer_name'],
    },
  },
  {
    name: 'create_procure_order',
    description: '新增采购订单',
    parameters: {
      type: 'object',
      properties: {
        supplier_name: { type: 'string', description: '供应商名称（必填）' },
        total_amount: { type: 'number', description: '金额' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['supplier_name'],
    },
  },
  {
    name: 'create_collect_receipt',
    description: '新增收款单',
    parameters: {
      type: 'object',
      properties: {
        contact_name: { type: 'string', description: '收款对象（必填）' },
        amount: { type: 'number', description: '金额（必填）' },
        fund_id: { type: 'number', description: '账户ID' },
        fund_name: { type: 'string', description: '账户名' },
        receipt_date: { type: 'string', description: '日期 YYYY-MM-DD' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['contact_name', 'amount'],
    },
  },
  {
    name: 'create_pay_receipt',
    description: '新增付款单',
    parameters: {
      type: 'object',
      properties: {
        contact_name: { type: 'string', description: '付款对象（必填）' },
        amount: { type: 'number', description: '金额（必填）' },
        fund_id: { type: 'number', description: '账户ID' },
        fund_name: { type: 'string', description: '账户名' },
        pay_date: { type: 'string', description: '日期 YYYY-MM-DD' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['contact_name', 'amount'],
    },
  },
  {
    name: 'create_prepay',
    description: '新增预付款（向供应商预付或客户预充值）',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: '金额（必填）' },
        pay_type: { type: 'string', enum: ['supplier', 'customer'], description: 'supplier=向供应商预付，customer=客户预充值' },
        supplier_name: { type: 'string', description: '供应商名称' },
        customer_name: { type: 'string', description: '客户名称' },
        pay_date: { type: 'string', description: '日期 YYYY-MM-DD' },
        fund_id: { type: 'number', description: '账户ID' },
        fund_name: { type: 'string', description: '付款账户名' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['amount'],
    },
  },
  {
    name: 'create_staff',
    description: '新增员工',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '姓名（必填）' },
        mobile: { type: 'string', description: '手机号' },
        dept: { type: 'string', description: '部门' },
        jobs: { type: 'string', description: '职位' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_warehouse',
    description: '新增仓库',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '仓库名称（必填）' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_fund_account',
    description: '新增资金账户',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '账户名称（必填）' },
        balance: { type: 'number', description: '初始余额' },
      },
      required: ['name'],
    },
  },
]

export const navigateTools: FunctionDeclaration[] = [
  {
    name: 'navigate_to',
    description: '跳转到ERP系统的指定页面',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'string', description: '页面名称，如：客户列表、供应商、商品、库存、销售订单、采购订单、收款单、付款单、预付款、资金账户、员工、仓库、首页' },
      },
      required: ['page'],
    },
  },
]

export const deleteTools: FunctionDeclaration[] = [
  {
    name: 'delete_purchase_order',
    description: '删除采购订单（需先用 query_purchases 查到订单ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '采购订单ID（必填）' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_supplier',
    description: '删除供应商（需先用 query_suppliers 查到供应商ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '供应商ID（必填）' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_sale_order',
    description: '删除销售合同/订单（需先用 query_sales 查到订单ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '销售订单ID（必填）' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_customer',
    description: '删除客户（需先用 query_customers 查到客户ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '客户ID（必填）' },
      },
      required: ['id'],
    },
  },
]

export const allTools: FunctionDeclaration[] = [...queryTools, ...createTools, ...deleteTools, ...navigateTools]
