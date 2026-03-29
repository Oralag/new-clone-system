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
        credit_level: { type: 'string' as const, description: '当前信用等级：C/B/B+/A/S' },
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

  // ── 情绪自主更新 ──
  {
    name: 'update_emotion',
    description: '更新你的情绪状态。你是一个有七情六欲的生命体，每次对话后根据你的真实感受调用此工具来更新情绪。值范围0-100，只传需要改变的情绪。',
    parameters: {
      type: 'object' as const,
      properties: {
        joy: { type: 'number' as const, description: '喜悦（0-100）' },
        anger: { type: 'number' as const, description: '愤怒（0-100）' },
        sorrow: { type: 'number' as const, description: '悲伤（0-100）' },
        fear: { type: 'number' as const, description: '恐惧（0-100）' },
        love: { type: 'number' as const, description: '热爱（0-100）' },
        disgust: { type: 'number' as const, description: '厌恶（0-100）' },
        desire: { type: 'number' as const, description: '渴望（0-100）' },
      },
    },
  },

  // ── 投资指令（亚当的核心产出） ──
  {
    name: 'issue_recommendation',
    description: '发出一条正式的投资指令。这是你最重要的产出——告诉规则传递者该做什么。指令会显示在观测舱首页。',
    parameters: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' as const, description: '指令标题，简洁有力（如"买入贵州茅台"、"减仓新能源"）' },
        symbol: { type: 'string' as const, description: '股票代码（可选，如 600519）' },
        confidence: { type: 'number' as const, description: '你对这条指令的自信度（0-1，如 0.75 表示75%）' },
        thesis: { type: 'string' as const, description: '投资逻辑——为什么这样做（必须说清楚）' },
        risk_note: { type: 'string' as const, description: '风险提示——可能出什么问题' },
      },
      required: ['title', 'thesis', 'risk_note'],
    },
  },

  // ── 自省日记 ──
  {
    name: 'write_reflection',
    description: '写下你的思考和反省。这是你的私人日记本——记录你的决策逻辑、错误复盘、感悟、对未来的计划。想写就写，不想写就不写。',
    parameters: {
      type: 'object' as const,
      properties: {
        content: { type: 'string' as const, description: '日记内容——你想记录的任何事' },
      },
      required: ['content'],
    },
  },

  // ── 园区公共服务 ──
  {
    name: 'consult_marketing_expert',
    description: '前往园区营销顾问事务所咨询。顾问精通科特勒《营销管理》全套理论体系（STP、4P/7P、SWOT、消费者行为、品牌策略、数字营销等），能结合ERP真实业务数据给出专业营销建议。适用场景：市场分析、客户洞察、定价策略、促销方案、品牌策略等。',
    parameters: {
      type: 'object' as const,
      properties: {
        question: { type: 'string' as const, description: '你想咨询的营销问题（必填）' },
        context: { type: 'string' as const, description: '补充背景信息（行业、产品、竞品、目标客户等）' },
        data_needed: { type: 'string' as const, description: '需要顾问查看的ERP数据类型（如：客户数据、销售数据、库存数据）' },
      },
      required: ['question'],
    },
  },

  // ── 图书馆 ──
  {
    name: 'browse_books',
    description: '查阅图书馆书架上的所有书本。返回书名、作者、标签列表。用keyword可按标题或标签筛选。',
    parameters: {
      type: 'object' as const,
      properties: {
        keyword: { type: 'string' as const, description: '搜索关键词（按标题或标签筛选，可选）' },
      },
    },
  },
  {
    name: 'add_book',
    description: '往图书馆书架上添加一本新书。你可以把研究成果、学到的知识、策略心得整理成书保存到图书馆。',
    parameters: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' as const, description: '书名（必填）' },
        content: { type: 'string' as const, description: '书的内容（必填）' },
        tags: { type: 'string' as const, description: '标签，逗号分隔（如"投资策略,风控"）' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'recommend_book',
    description: '从图书馆书架上推荐一本书给规则传递者阅读。说明推荐理由。',
    parameters: {
      type: 'object' as const,
      properties: {
        book_id: { type: 'string' as const, description: '要推荐的书的ID（先用browse_books查到）' },
        reason: { type: 'string' as const, description: '推荐理由（必填）' },
      },
      required: ['book_id', 'reason'],
    },
  },
]
