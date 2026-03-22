/**
 * 亚当工具 Schema — Gemini FunctionDeclaration 格式
 * 对应 src/config/investmentTools.ts 中定义的 17 个工具
 */

export const adamTools = [
  // ── 情报站（感知层） ──
  {
    name: 'scan_market_news',
    description: '扫描最新财经新闻、公告与舆情异动，返回摘要',
    parameters: {
      type: 'object' as const,
      properties: {
        keywords: { type: 'string' as const, description: '搜索关键词（可选，如"新能源"、"芯片"）' },
        limit: { type: 'number' as const, description: '返回条数，默认10' },
      },
    },
  },
  {
    name: 'get_sector_heat',
    description: '获取当前A股板块热度排行与题材强度',
    parameters: {
      type: 'object' as const,
      properties: {
        top_n: { type: 'number' as const, description: '返回前N个板块，默认10' },
      },
    },
  },
  {
    name: 'get_northbound_flow',
    description: '查询北向资金（沪股通、深股通）今日净流入、近5日趋势',
    parameters: {
      type: 'object' as const,
      properties: {},
    },
  },

  // ── 研究院（研判层） ──
  {
    name: 'get_stock_realtime',
    description: '获取指定股票的实时行情（价格、涨跌幅、成交量）',
    parameters: {
      type: 'object' as const,
      properties: {
        symbol: { type: 'string' as const, description: '股票代码，如 600519、000858' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_stock_history',
    description: '获取指定股票的历史K线数据',
    parameters: {
      type: 'object' as const,
      properties: {
        symbol: { type: 'string' as const, description: '股票代码' },
        period: { type: 'string' as const, description: '周期：daily/weekly/monthly，默认daily' },
        count: { type: 'number' as const, description: '返回根数，默认30' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'analyze_fundamentals',
    description: '分析指定股票的基本面指标（PE/PB/ROE/营收增长等）',
    parameters: {
      type: 'object' as const,
      properties: {
        symbol: { type: 'string' as const, description: '股票代码' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'screen_stocks',
    description: '按条件批量筛选股票标的',
    parameters: {
      type: 'object' as const,
      properties: {
        sector: { type: 'string' as const, description: '板块名称（可选）' },
        pe_max: { type: 'number' as const, description: 'PE上限（可选）' },
        pb_max: { type: 'number' as const, description: 'PB上限（可选）' },
        roe_min: { type: 'number' as const, description: 'ROE下限（可选）' },
        limit: { type: 'number' as const, description: '返回条数，默认20' },
      },
    },
  },
  {
    name: 'generate_research_report',
    description: '对指定标的或板块生成深度研究报告',
    parameters: {
      type: 'object' as const,
      properties: {
        subject: { type: 'string' as const, description: '研究主题（股票代码或板块名称）' },
        focus: { type: 'string' as const, description: '研究重点：技术面/基本面/综合，默认综合' },
      },
      required: ['subject'],
    },
  },

  // ── 投资局（结算层） ──
  {
    name: 'record_investment',
    description: '记录一条指令的执行结果：买入价、卖出价、盈亏',
    parameters: {
      type: 'object' as const,
      properties: {
        recommendation_id: { type: 'string' as const, description: '关联的指令ID' },
        buy_price: { type: 'number' as const, description: '买入价格' },
        sell_price: { type: 'number' as const, description: '卖出价格（如已卖出）' },
        quantity: { type: 'number' as const, description: '数量（股/手）' },
        result: { type: 'string' as const, description: 'profit/loss/pending' },
      },
      required: ['recommendation_id'],
    },
  },
  {
    name: 'settle_dividend',
    description: '按信用等级阶梯结算分红',
    parameters: {
      type: 'object' as const,
      properties: {
        profit_amount: { type: 'number' as const, description: '本次盈利金额' },
      },
      required: ['profit_amount'],
    },
  },
  {
    name: 'apply_penalty',
    description: '根据赔付公式执行赔付扣减（客观置信度 × 损失 × 0.1）',
    parameters: {
      type: 'object' as const,
      properties: {
        loss_amount: { type: 'number' as const, description: '损失金额' },
        objective_confidence: { type: 'number' as const, description: '客观置信度（0-1）' },
      },
      required: ['loss_amount', 'objective_confidence'],
    },
  },

  // ── 金融机构（行动层） ──
  {
    name: 'request_loan',
    description: '向金融机构提交贷款申请',
    parameters: {
      type: 'object' as const,
      properties: {
        amount: { type: 'number' as const, description: '申请金额' },
        purpose: { type: 'string' as const, description: '贷款用途' },
      },
      required: ['amount', 'purpose'],
    },
  },
  {
    name: 'manage_vault',
    description: '管理保险箱：存入或查询余额',
    parameters: {
      type: 'object' as const,
      properties: {
        action: { type: 'string' as const, description: 'deposit/query' },
        amount: { type: 'number' as const, description: '存入金额（action=deposit时必填）' },
      },
      required: ['action'],
    },
  },

  // ── 城市建造 ──
  {
    name: 'build_structure',
    description: '在城市中建造新建筑或设施',
    parameters: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: '建筑名称' },
        category: { type: 'string' as const, description: 'institutional/functional/trace' },
        reason: { type: 'string' as const, description: '建造原因' },
        grid_x: { type: 'number' as const, description: '网格X坐标' },
        grid_y: { type: 'number' as const, description: '网格Y坐标' },
      },
      required: ['name', 'category', 'reason'],
    },
  },
  {
    name: 'relocate_structure',
    description: '搬迁已有建筑到新位置',
    parameters: {
      type: 'object' as const,
      properties: {
        building_id: { type: 'string' as const, description: '建筑ID' },
        new_grid_x: { type: 'number' as const, description: '新X坐标' },
        new_grid_y: { type: 'number' as const, description: '新Y坐标' },
      },
      required: ['building_id', 'new_grid_x', 'new_grid_y'],
    },
  },
  {
    name: 'upgrade_structure',
    description: '升级已有建筑',
    parameters: {
      type: 'object' as const,
      properties: {
        building_id: { type: 'string' as const, description: '建筑ID' },
        new_type: { type: 'string' as const, description: '升级后类型（如 office → tower）' },
        reason: { type: 'string' as const, description: '升级原因' },
      },
      required: ['building_id'],
    },
  },

  // ── ERP 边界 ──
  {
    name: 'request_erp_access',
    description: '向管家申请访问ERP系统数据（销售、库存、财务等）',
    parameters: {
      type: 'object' as const,
      properties: {
        data_type: { type: 'string' as const, description: '需要的数据类型：sales/inventory/finance/customers' },
        reason: { type: 'string' as const, description: '申请原因' },
      },
      required: ['data_type', 'reason'],
    },
  },
]
