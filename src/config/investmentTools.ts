import type { InvestmentInstitutionId, InvestmentToolId } from '@/types/investment'

export interface InvestmentToolDefinition {
  id: InvestmentToolId
  label: string
  institutionId: InvestmentInstitutionId
  stage: 'sense' | 'judge' | 'act' | 'settle' | 'archive'
  description: string
  traceTemplate: string
}

export const investmentToolDefinitions: InvestmentToolDefinition[] = [
  {
    id: 'scan_market_news',
    label: '扫描市场新闻',
    institutionId: 'intel_station',
    stage: 'sense',
    description: '扫描财经新闻、公告与舆情异动',
    traceTemplate: '情报站刚刚完成一次市场新闻扫描',
  },
  {
    id: 'get_sector_heat',
    label: '获取板块热度',
    institutionId: 'intel_station',
    stage: 'sense',
    description: '读取板块热度与题材强度',
    traceTemplate: '情报站更新了一次板块热度排行',
  },
  {
    id: 'get_northbound_flow',
    label: '获取北向资金',
    institutionId: 'intel_station',
    stage: 'sense',
    description: '查询北向资金流向与趋势',
    traceTemplate: '情报站记录了一次北向资金变化',
  },
  {
    id: 'get_stock_realtime',
    label: '获取实时行情',
    institutionId: 'research_institute',
    stage: 'judge',
    description: '读取个股实时行情',
    traceTemplate: '研究院拉取了一次实时行情',
  },
  {
    id: 'get_stock_history',
    label: '获取历史K线',
    institutionId: 'research_institute',
    stage: 'judge',
    description: '读取历史K线与价格序列',
    traceTemplate: '研究院完成了一次历史K线读取',
  },
  {
    id: 'analyze_fundamentals',
    label: '分析基本面',
    institutionId: 'research_institute',
    stage: 'judge',
    description: '对PE/PB/ROE等基础指标进行分析',
    traceTemplate: '研究院完成了一次基本面分析',
  },
  {
    id: 'screen_stocks',
    label: '筛选股票',
    institutionId: 'research_institute',
    stage: 'judge',
    description: '按条件批量筛选标的',
    traceTemplate: '研究院刚刚完成一轮选股筛查',
  },
  {
    id: 'generate_research_report',
    label: '生成研究报告',
    institutionId: 'research_institute',
    stage: 'judge',
    description: '输出研报、结论与风险摘要',
    traceTemplate: '研究院生成了一份新的研究报告',
  },
  {
    id: 'record_investment',
    label: '记录投资结果',
    institutionId: 'bureau',
    stage: 'settle',
    description: '记录指令执行、盈亏与结算结果',
    traceTemplate: '投资局新增了一条投资结算记录',
  },
  {
    id: 'settle_dividend',
    label: '结算分红',
    institutionId: 'bureau',
    stage: 'settle',
    description: '按规则结算用户与亚当分红',
    traceTemplate: '投资局完成了一次分红结算',
  },
  {
    id: 'apply_penalty',
    label: '执行赔付',
    institutionId: 'bureau',
    stage: 'settle',
    description: '根据规则执行赔付扣减',
    traceTemplate: '投资局执行了一次赔付扣减',
  },
  {
    id: 'request_loan',
    label: '申请贷款',
    institutionId: 'finance_gateway',
    stage: 'act',
    description: '向金融机构发起贷款申请',
    traceTemplate: '金融机构收到一份新的贷款申请',
  },
  {
    id: 'manage_vault',
    label: '管理保险箱',
    institutionId: 'vault',
    stage: 'act',
    description: '存入或释放保险箱资金',
    traceTemplate: '保险箱状态刚刚发生变化',
  },
  {
    id: 'build_structure',
    label: '建造建筑',
    institutionId: 'corner',
    stage: 'act',
    description: '在城市中建造新的建筑或设施',
    traceTemplate: '城市里新出现了一栋建筑',
  },
  {
    id: 'relocate_structure',
    label: '搬迁建筑',
    institutionId: 'corner',
    stage: 'act',
    description: '调整建筑位置',
    traceTemplate: '城市建筑完成了一次搬迁',
  },
  {
    id: 'upgrade_structure',
    label: '升级建筑',
    institutionId: 'corner',
    stage: 'act',
    description: '升级已有建筑',
    traceTemplate: '城市里一栋建筑刚刚完成升级',
  },
  {
    id: 'request_erp_access',
    label: '申请ERP访问',
    institutionId: 'finance_gateway',
    stage: 'act',
    description: '向管家申请 ERP 数据访问或操作',
    traceTemplate: '金融机构记录了一次 ERP 访问申请',
  },
]

export const investmentToolMap = Object.fromEntries(
  investmentToolDefinitions.map((tool) => [tool.id, tool]),
) as Record<InvestmentToolId, InvestmentToolDefinition>
