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
        goods_name: { type: 'string', description: '商品名称（必填，系统唯一不可重复）' },
        goods_sn: { type: 'string', description: '商品编码' },
        sell_price: { type: 'number', description: '售价' },
        cost_price: { type: 'number', description: '成本价' },
        unit_name: { type: 'string', description: '单位' },
        cate_name: { type: 'string', description: '分类' },
        spec: { type: 'string', description: '规格（单规格文本，如500g）' },
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
        admin_name: { type: 'string', description: '经办人/业务员姓名' },
        remark: { type: 'string', description: '备注' },
        items: {
          type: 'array',
          description: '商品明细列表',
          items: {
            type: 'object',
            properties: {
              goods_name: { type: 'string', description: '商品名称' },
              qty: { type: 'number', description: '数量' },
              price: { type: 'number', description: '单价' },
              unit_name: { type: 'string', description: '单位' },
            },
          },
        },
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
        admin_name: { type: 'string', description: '经办人/采购人姓名' },
        remark: { type: 'string', description: '备注' },
        items: {
          type: 'array',
          description: '商品明细列表',
          items: {
            type: 'object',
            properties: {
              goods_name: { type: 'string', description: '商品名称' },
              qty: { type: 'number', description: '数量' },
              price: { type: 'number', description: '单价' },
              unit_name: { type: 'string', description: '单位' },
            },
          },
        },
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
  {
    name: 'quick_sale',
    description: '一键销售：自动创建销售合同并审核、创建出库单并审核（含库存扣减）。支持优惠和运费',
    parameters: {
      type: 'object',
      properties: {
        customer_name: { type: 'string', description: '客户名称（必填）' },
        warehouse_name: { type: 'string', description: '仓库名称（默认"门店"）' },
        items: {
          type: 'array',
          description: '商品明细列表（必填）',
          items: {
            type: 'object',
            properties: {
              goods_name: { type: 'string', description: '商品名称' },
              num: { type: 'number', description: '数量' },
              price: { type: 'number', description: '单价（不填则用系统售价）' },
              unit_name: { type: 'string', description: '单位' },
            },
          },
        },
        discount: { type: 'number', description: '优惠金额（可选，默认0）' },
        freight: { type: 'number', description: '运费（可选，默认0）' },
        freight_payer: { type: 'string', enum: ['buyer', 'seller'], description: '运费承担方：buyer=对方承担（加到合计），seller=我方承担（不加到合计）。默认buyer' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['customer_name', 'items'],
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
  {
    name: 'delete_goods',
    description: '删除商品（需先用 query_goods 查到商品ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '商品ID（必填）' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_staff',
    description: '删除员工（需先用 query_staff 查到员工ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '员工ID（必填）' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_warehouse',
    description: '删除仓库（需先用 query_warehouses 查到仓库名）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '仓库ID（必填）' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_fund_account',
    description: '删除资金账户',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '资金账户ID（必填）' },
      },
      required: ['id'],
    },
  },
]

export const editTools: FunctionDeclaration[] = [
  {
    name: 'update_goods',
    description: '编辑商品信息（需先用 query_goods 查到商品ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '商品ID（必填）' },
        goods_name: { type: 'string', description: '商品名称' },
        goods_sn: { type: 'string', description: '商品编码' },
        sell_price: { type: 'number', description: '售价' },
        cost_price: { type: 'number', description: '成本价' },
        unit_name: { type: 'string', description: '单位' },
        cate_name: { type: 'string', description: '分类' },
        spec: { type: 'string', description: '规格（单规格文本）' },
        barcode: { type: 'string', description: '条码' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_customer',
    description: '编辑客户信息（需先用 query_customers 查到客户ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '客户ID（必填）' },
        nickname: { type: 'string', description: '客户名称' },
        mobile: { type: 'string', description: '手机号' },
        address: { type: 'string', description: '地址' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_supplier',
    description: '编辑供应商信息（需先用 query_suppliers 查到供应商ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '供应商ID（必填）' },
        name: { type: 'string', description: '供应商名称' },
        contact: { type: 'string', description: '联系人' },
        mobile: { type: 'string', description: '手机号' },
        address: { type: 'string', description: '地址' },
        bank: { type: 'string', description: '银行账户' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_goods_spec',
    description: '给商品添加规格（如颜色、尺寸、重量等）。需先用 query_goods 查到商品ID',
    parameters: {
      type: 'object',
      properties: {
        goods_id: { type: 'number', description: '商品ID（必填）' },
        goods_name: { type: 'string', description: '商品名称' },
        spec_name: { type: 'string', description: '规格名称（必填，如：重量、颜色、尺寸）' },
        spec_value: { type: 'string', description: '规格值列表（必填，逗号分隔，如：200g,500g,1斤）' },
      },
      required: ['goods_id', 'spec_name', 'spec_value'],
    },
  },
  {
    name: 'query_goods_spec',
    description: '查询商品的规格列表',
    parameters: {
      type: 'object',
      properties: {
        goods_id: { type: 'number', description: '商品ID（必填）' },
      },
      required: ['goods_id'],
    },
  },
  {
    name: 'delete_goods_spec',
    description: '删除商品的某个规格',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '规格ID（必填，先用 query_goods_spec 查到）' },
      },
      required: ['id'],
    },
  },
]

export const searchTools: FunctionDeclaration[] = [
  {
    name: 'web_search',
    description: '联网搜索最新信息，包括新闻、市场行情、商品价格、行业动态、政策法规等实时数据',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词（必填）' },
        max_results: { type: 'number', description: '返回结果数量，默认5' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_trending',
    description: '获取各平台实时热搜/热榜数据，可用于文案创作方向、选题参考、热点追踪。支持平台：douyin（抖音）、weibo（微博）、bilibili（B站）、zhihu（知乎）、xiaohongshu（小红书/今日头条替代）、kuaishou（快手）',
    parameters: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['douyin', 'weibo', 'bilibili', 'zhihu', 'xiaohongshu', 'kuaishou'],
          description: '平台名称，默认 douyin',
        },
      },
    },
  },
]

export const imageTools: FunctionDeclaration[] = [
  {
    name: 'generate_image',
    description: '使用 AI 生成图片。输入英文提示词，返回生成图片的 URL。适用于海报、Banner、社媒图、产品图等设计场景。',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '图片描述（英文），越详细越好，包含风格、色彩、构图等' },
        width: { type: 'number', description: '图片宽度（像素），默认1024' },
        height: { type: 'number', description: '图片高度（像素），默认1024' },
      },
      required: ['prompt'],
    },
  },
]

export const allTools: FunctionDeclaration[] = [...queryTools, ...createTools, ...editTools, ...deleteTools, ...navigateTools, ...searchTools, ...imageTools]
