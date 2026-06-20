// Tool definitions — Anthropic input_schema format
export const opsTools: any[] = [
  {
    name: 'query_stock_warning',
    description: '查询当前库存低于预警值的商品，触发补货分析流程',
    parameters: {
      type: 'object',
      properties: {
        threshold: { type: 'number', description: '预警阈值（低于此数量则预警），默认10' },
        warehouse: { type: 'string', description: '仓库名称（可选）' },
      },
    },
  },
  {
    name: 'suggest_restock',
    description: '根据库存数据+历史销量，生成补货建议列表（包含商品、数量、建议理由）',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: '参考历史天数，默认30天' },
        min_urgency: { type: 'string', enum: ['all', 'medium', 'high'], description: '最小紧急度：all=全部, medium=中危以上, high=高危，默认为all' },
      },
    },
  },
  {
    name: 'create_purchase_draft',
    description: '创建采购单草稿（草稿状态需人工审核后才执行），用于补货专员生成补货单',
    parameters: {
      type: 'object',
      properties: {
        supplier_name: { type: 'string', description: '供应商名称（必填）' },
        items: {
          type: 'array',
          description: '采购商品明细列表',
          items: {
            type: 'object',
            properties: {
              goods_name: { type: 'string', description: '商品名称' },
              qty: { type: 'number', description: '采购数量' },
              price: { type: 'number', description: '采购单价' },
              unit_name: { type: 'string', description: '单位' },
            },
          },
        },
        remark: { type: 'string', description: '备注（如：补货原因）' },
        auto_audit: { type: 'boolean', description: '是否自动审核，默认false（草稿模式）' },
      },
      required: ['supplier_name', 'items'],
    },
  },
]

export const queryTools: any[] = [
  {
    name: 'query_customers',
    description: '查询客户列表。结果含客户ID，可配合 create_sale_order/update_customer/delete_customer 使用',
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
    description: '查询供应商列表。结果含供应商ID，可配合 create_procure_order/update_supplier/delete_supplier 使用',
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
    description: '查询商品列表。结果含商品ID，可配合 create_retail_order/update_goods/add_goods_spec/delete_goods 使用',
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
    name: 'query_retail_orders',
    description: '查询零售单列表，用于找到需要删除的零售单ID',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: '日期 YYYY-MM-DD，默认今天' },
        limit: { type: 'number', description: '返回条数，默认20' },
      },
    },
  },
  {
    name: 'query_purchases',
    description: '查询采购订单。可按供应商名或商品名搜索历史采购记录，返回包含商品明细的完整信息',
    parameters: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: '开始日期 YYYY-MM-DD' },
        end_date: { type: 'string', description: '结束日期 YYYY-MM-DD' },
        supplier: { type: 'string', description: '供应商名称' },
        goods_name: { type: 'string', description: '商品名称（按商品名搜索历史采购，如查某商品的供应商）' },
        limit: { type: 'number', description: '返回条数，默认50' },
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
    name: 'audit_finance',
    description: '财务数据逻辑审查：自动拉取ERP真实数据，检查未审核数据过滤、应付已付金额匹配、禁用接口、退货冲减等核心规则，输出问题报告。用户说审查财务、检查财务、财务有没有问题时调用。',
    parameters: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          description: '审查范围（可选）：all=全部, payable=应付, receivable=应收。默认 all',
        },
      },
    },
  },
  {
    name: 'query_ledger',
    description: '查询后台流水表（ledger_flow，单一可信财务数据源）。这是2026-06-15新建立的统一财务流水，触发器自动同步所有收款/付款/零售/合同/采购单据。用户问"账户余额"、"今天收入"、"这个月支出"、"流水"、"现金流"时，优先用这个工具而不是 query_finance。',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense'], description: '收入或支出（可选）' },
        flow_category: { type: 'string', enum: ['cash', 'receivable', 'payable'], description: 'cash=实收/实付现金, receivable=应收(销售合同), payable=应付(采购单)' },
        source: { type: 'string', description: '来源类型：零售单/收款单/付款单/销售合同/采购单/其他收入/其他支出' },
        start_date: { type: 'string', description: '开始日期 YYYY-MM-DD' },
        end_date: { type: 'string', description: '结束日期 YYYY-MM-DD' },
        contact_name: { type: 'string', description: '客户/供应商名称（模糊匹配）' },
        fund_name: { type: 'string', description: '资金账户名称' },
        limit: { type: 'number', description: '返回条数，默认50' },
      },
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

export const createTools: any[] = [
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
    description: '新增销售订单/订单',
    parameters: {
      type: 'object',
      properties: {
        customer_name: { type: 'string', description: '客户名称（必填）' },
        total_amount: { type: 'number', description: '金额' },
        admin_name: { type: 'string', description: '经办人/业务员姓名' },
        remark: { type: 'string', description: '备注' },
        pay_amount: { type: 'number', description: '本次收款金额（部分收款时填写，不填则为0）' },
        fund_name: { type: 'string', description: '收款账户名称，如"公司收入账号"、"现金"' },
        auto_audit: { type: 'boolean', description: '是否自动审核（默认false，审核后触发库存和财务）' },
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
        auto_audit: { type: 'boolean', description: '是否自动审核（默认false，审核后触发入库和财务）' },
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
    description: '一键销售：自动创建销售订单并审核、创建出库单并审核（含库存扣减）。支持优惠和运费',
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
  {
    name: 'create_retail_order',
    description: '创建零售单并自动审核（含库存扣减和资金账户更新）。适用于门店零售场景，不需要客户信息',
    parameters: {
      type: 'object',
      properties: {
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
        discount_amount: { type: 'number', description: '折扣金额（可选，默认0）' },
        pay_method: { type: 'string', enum: ['cash', 'wechat', 'alipay', 'balance', 'card'], description: '支付方式：cash=现金，wechat=微信，alipay=支付宝，balance=会员余额，card=银行卡。默认cash' },
        member_name: { type: 'string', description: '会员名称（可选）' },
        remark: { type: 'string', description: '备注' },
      },
      required: ['items'],
    },
  },
]

export const navigateTools: any[] = [
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

export const deleteTools: any[] = [
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
    description: '删除销售订单/订单（需先用 query_sales 查到订单ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '销售订单ID（必填）' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_retail_order',
    description: '删除零售单（需先用 query_retail_orders 查到订单ID）',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '零售单ID（必填）' },
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

export const editTools: any[] = [
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

export const searchTools: any[] = [
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

export const imageTools: any[] = [
  {
    name: 'render_image',
    description: '将 Remotion Still TSX 代码渲染成 PNG 图片，在服务器端执行渲染并返回可显示的图片。当你写完海报/Banner/社媒图代码后，调用此工具直接生成图片文件，无需用户手动执行命令。',
    parameters: {
      type: 'object',
      properties: {
        root_code: { type: 'string', description: 'Root.tsx 完整代码，包含 Still 注册（import Still from remotion + export const RemotionRoot）' },
        component_code: { type: 'string', description: '海报/图片主组件的完整 TSX 代码，保存为 Poster.tsx' },
        composition_id: { type: 'string', description: 'Still 的 id 属性值，如 "Poster"、"Banner"' },
        width: { type: 'number', description: '图片宽度（像素），默认 1080' },
        height: { type: 'number', description: '图片高度（像素），默认 1080。小红书封面1440，竖版海报1920，公众号头图500' },
      },
      required: ['root_code', 'component_code', 'composition_id'],
    },
  },
]

export const videoRenderTools: any[] = [
  {
    name: 'render_video',
    description: '将 Remotion TSX 代码渲染成 MP4 视频，在服务器端执行渲染并返回可播放视频。当你写完视频代码后，调用此工具直接生成视频文件，无需用户手动执行命令。',
    parameters: {
      type: 'object',
      properties: {
        root_code: { type: 'string', description: 'Root.tsx 完整代码，包含 Composition 注册（import + export const RemotionRoot）' },
        component_code: { type: 'string', description: '视频主组件的完整 TSX 代码（包含所有场景），保存为 Video.tsx' },
        composition_id: { type: 'string', description: 'Composition 的 id 属性值，如 "ErpAd"、"MyVideo"' },
        duration_frames: { type: 'number', description: '总帧数，30fps 下：15秒=450帧，30秒=900帧，60秒=1800帧' },
        width: { type: 'number', description: '视频宽度（像素），默认 1080' },
        height: { type: 'number', description: '视频高度（像素），竖屏默认 1920，横屏用 1080' },
      },
      required: ['root_code', 'component_code', 'composition_id'],
    },
  },
]

export const contentTools: any[] = [
  {
    name: 'record_content_performance',
    description: '记录内容发布后的效果数据，用于分析哪类内容效果最好，帮助优化后续创作方向',
    parameters: {
      type: 'object',
      properties: {
        content_title: { type: 'string', description: '内容标题' },
        platform: {
          type: 'string',
          enum: ['xiaohongshu', 'wechat', 'douyin', 'weibo', 'bilibili', 'other'],
          description: '发布平台',
        },
        publish_date: { type: 'string', description: '发布日期 YYYY-MM-DD' },
        content_type: {
          type: 'string',
          enum: ['图文', '短视频', '直播', '文章', '海报'],
          description: '内容类型',
        },
        views: { type: 'number', description: '浏览量/播放量' },
        likes: { type: 'number', description: '点赞数' },
        comments: { type: 'number', description: '评论数' },
        shares: { type: 'number', description: '转发/分享数' },
        saves: { type: 'number', description: '收藏数（小红书等平台）' },
        notes: { type: 'string', description: '备注，如：爆款原因分析、改进点等' },
      },
      required: ['content_title', 'platform', 'publish_date'],
    },
  },
  {
    name: 'query_content_performance',
    description: '查询历史内容效果数据，分析哪类内容效果好，输出规律总结和建议',
    parameters: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['xiaohongshu', 'wechat', 'douyin', 'weibo', 'bilibili', 'other', 'all'],
          description: '平台筛选，默认 all（全部）',
        },
        limit: { type: 'number', description: '返回条数，默认20' },
      },
    },
  },
]

export const publishTools: any[] = [
  {
    name: 'get_publish_queue',
    description: '获取当前发布队列（待发布内容列表）。Nova 每次对话开始时应主动调用此工具，了解有哪些内容等待发布。返回内容的索引、标题、平台、类型和正文预览。',
    parameters: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['xiaohongshu', 'douyin', 'weibo', 'bilibili', 'wechat', 'all'],
          description: '按平台筛选，默认 all（全部）',
        },
        status: {
          type: 'string',
          enum: ['pending', 'published', 'all'],
          description: '按状态筛选：pending=待发布，published=已发布，all=全部，默认 pending',
        },
      },
    },
  },
  {
    name: 'publish_content',
    description: '将指定内容发布到对应平台。目前支持小红书直接发布，其他平台返回"待接入"。发布前应先调用 get_publish_queue 确认内容，并征得用户同意后再执行。',
    parameters: {
      type: 'object',
      properties: {
        index: {
          type: 'number',
          description: '要发布的内容在队列中的索引（从 get_publish_queue 结果里获取）',
        },
        platform_override: {
          type: 'string',
          description: '可选，覆盖原定发布平台（如用户临时改变主意）',
        },
      },
      required: ['index'],
    },
  },
]

export const volcengineTools: any[] = [
  {
    name: 'generate_image_doubao',
    description: '使用豆包 Seedream 模型生成高质量图片，适合小红书封面图、产品图、场景图。比 generate_image 质量更好，优先使用此工具生成图片。',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '图片描述（中文或英文），越详细越好。包含：画面内容、风格、色调、构图、光线等',
        },
        ratio: {
          type: 'string',
          enum: ['1:1', '3:4', '4:3', '9:16', '16:9'],
          description: '图片比例。小红书封面用 3:4 或 1:1，横版用 16:9，默认 3:4',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'generate_video_jimeng',
    description: '使用即梦 AI 生成真实感短视频（文字→视频），适合小红书/抖音短视频内容。异步生成，调用后返回任务ID，需要用 check_video_status 工具轮询结果。',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '视频内容描述，越详细越好。包含：场景、人物动作、镜头运动、氛围、风格等',
        },
        duration: {
          type: 'number',
          enum: [5, 10],
          description: '视频时长（秒），5秒或10秒，默认5',
        },
        ratio: {
          type: 'string',
          enum: ['16:9', '9:16', '1:1'],
          description: '视频比例。竖屏短视频用 9:16，默认 9:16',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'check_video_status',
    description: '查询即梦视频生成任务的状态，获取生成结果。在调用 generate_video_jimeng 后使用此工具轮询，直到状态为 succeeded。',
    parameters: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'generate_video_jimeng 返回的任务ID',
        },
      },
      required: ['task_id'],
    },
  },
]

export const allTools: any[] = [...queryTools, ...createTools, ...editTools, ...deleteTools, ...navigateTools, ...searchTools, ...imageTools, ...videoRenderTools, ...contentTools, ...publishTools, ...volcengineTools, ...opsTools]
