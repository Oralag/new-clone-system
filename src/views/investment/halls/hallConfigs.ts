// 生态园区 — 建筑大厅配置
// 每栋建筑的室内大厅：配色、陈设、可交互柜台、NPC职员

export interface HallProp {
  /** 陈设类型（对应 HallView 里的像素精灵） */
  type:
    | 'counter' | 'desk' | 'screen' | 'shelf' | 'cabinet' | 'vault'
    | 'plant' | 'sofa' | 'board' | 'globe' | 'lamp' | 'clock' | 'banner'
  /** 水平位置（场景宽度百分比 0-100） */
  x: number
  /** 贴墙(wall)还是落地(floor)，默认按类型推断 */
  layer?: 'wall' | 'floor'
  /** 可交互柜台：点击打开对应业务面板 */
  panel?: string
  /** 柜台标签 */
  label?: string
}

export interface HallNpc {
  name: string
  /** 制服颜色 */
  coat: string
  skin?: string
  /** 站位（百分比） */
  x: number
  /** 闲聊台词（轮播） */
  lines: string[]
}

export interface HallConfig {
  id: string
  name: string
  subtitle: string
  /** 配色 */
  wall: string
  wallDark: string
  wallTrim: string
  floorA: string
  floorB: string
  accent: string
  glow: string
  props: HallProp[]
  npcs: HallNpc[]
  /** 业务面板（panel key → 标题），由 HallView 渲染具体内容 */
  panels: Record<string, string>
  /** 默认打开的面板 */
  defaultPanel?: string
}

export const HALL_CONFIGS: Record<string, HallConfig> = {
  // ── 投资局：资金账户 / 流水 / 记录投资 ──
  bureau: {
    id: 'bureau',
    name: '投资局',
    subtitle: 'INVESTMENT BUREAU · 资金与指令中枢',
    wall: '#3a3424', wallDark: '#2a2518', wallTrim: '#f0c040',
    floorA: '#4a4030', floorB: '#3e3628', accent: '#f0c040', glow: '#ffe890',
    props: [
      { type: 'banner', x: 50 },
      { type: 'clock', x: 14 },
      { type: 'board', x: 82, panel: 'ledger', label: '资金流水' },
      { type: 'plant', x: 4 },
      { type: 'counter', x: 30, panel: 'fund', label: '资金账户柜台' },
      { type: 'desk', x: 62, panel: 'invest', label: '投资登记台' },
      { type: 'sofa', x: 88 },
      { type: 'lamp', x: 96 },
    ],
    npcs: [
      { name: '出纳员·金', coat: '#b08820', x: 27, lines: ['需要充值或查账吗？', '每一笔流水都有据可查。', '亚当的预算由这里拨付。'] },
      { name: '登记官·禾', coat: '#8a6a18', x: 59, lines: ['买入卖出都要登记在册。', '投资有风险，记录要诚实。'] },
    ],
    panels: { fund: '资金账户', ledger: '资金流水', invest: '记录投资' },
    defaultPanel: 'fund',
  },

  // ── 金融机构：贷款审批 / 金库 ──
  finance_gateway: {
    id: 'finance_gateway',
    name: '金融机构',
    subtitle: 'FINANCE GATEWAY · 信贷与金库',
    wall: '#26303e', wallDark: '#1b232e', wallTrim: '#f0c040',
    floorA: '#2e3a4a', floorB: '#27313e', accent: '#f0c040', glow: '#ffd860',
    props: [
      { type: 'clock', x: 50 },
      { type: 'banner', x: 18 },
      { type: 'counter', x: 32, panel: 'loans', label: '信贷窗口' },
      { type: 'vault', x: 74, panel: 'vault', label: '金库' },
      { type: 'plant', x: 8 },
      { type: 'lamp', x: 94 },
      { type: 'sofa', x: 52 },
    ],
    npcs: [
      { name: '信贷员·穆', coat: '#2a5a8a', x: 29, lines: ['贷款申请要看信用等级。', '亚当的信用记录还不错。', '批贷要谨慎，收贷要及时。'] },
      { name: '金库守卫', coat: '#3a3a44', x: 80, lines: ['金库重地，闲人免进。', '保险箱资产受全额保护。'] },
    ],
    panels: { loans: '贷款审批', vault: '金库资产' },
    defaultPanel: 'loans',
  },

  // ── 研究院：研报陈列 / 投资建议 ──
  research_institute: {
    id: 'research_institute',
    name: '研究院',
    subtitle: 'RESEARCH INSTITUTE · 研报与策略',
    wall: '#243a42', wallDark: '#1a2b32', wallTrim: '#58b8cc',
    floorA: '#2c4750', floorB: '#253c44', accent: '#58b8cc', glow: '#a8ecff',
    props: [
      { type: 'screen', x: 50, panel: 'reports', label: '研报数据墙' },
      { type: 'globe', x: 10 },
      { type: 'desk', x: 26, panel: 'recs', label: '策略研究台' },
      { type: 'desk', x: 72 },
      { type: 'shelf', x: 90 },
      { type: 'plant', x: 4 },
    ],
    npcs: [
      { name: '研究员·星', coat: '#2c7a8e', x: 68, lines: ['基本面和技术面都要看。', '研报写完要经得起回测。', '北向资金今天有点意思…'] },
    ],
    panels: { reports: '研究报告', recs: '投资建议' },
    defaultPanel: 'reports',
  },

  // ── 情报站：市场信号大屏 ──
  intel_station: {
    id: 'intel_station',
    name: '情报站',
    subtitle: 'INTEL STATION · 市场信号监听',
    wall: '#1c2e36', wallDark: '#142228', wallTrim: '#40c0d0',
    floorA: '#22383f', floorB: '#1c2f35', accent: '#40c0d0', glow: '#70e8f8',
    props: [
      { type: 'screen', x: 30, panel: 'signals', label: '信号监控屏' },
      { type: 'screen', x: 70, panel: 'feed', label: '事件流' },
      { type: 'desk', x: 50 },
      { type: 'lamp', x: 6 },
      { type: 'plant', x: 94 },
    ],
    npcs: [
      { name: '监听员·岚', coat: '#1e6878', x: 47, lines: ['市场的风吹草动都逃不过。', '新闻扫描每小时跑一轮。', '板块热度正在更新…'] },
    ],
    panels: { signals: '市场信号', feed: '情报事件流' },
    defaultPanel: 'signals',
  },

  // ── 图书馆：书架 / 投书 ──
  library: {
    id: 'library',
    name: '图书馆',
    subtitle: 'LIBRARY · 亚当的知识库',
    wall: '#3a2e1e', wallDark: '#2c2316', wallTrim: '#b08858',
    floorA: '#4a3a26', floorB: '#3e311f', accent: '#c89858', glow: '#ffe090',
    props: [
      { type: 'shelf', x: 14, panel: 'shelf', label: '书架·甲' },
      { type: 'shelf', x: 32, panel: 'shelf', label: '书架·乙' },
      { type: 'clock', x: 50 },
      { type: 'counter', x: 64, panel: 'donate', label: '投书台' },
      { type: 'sofa', x: 86 },
      { type: 'lamp', x: 96 },
      { type: 'plant', x: 46 },
    ],
    npcs: [
      { name: '管理员·叶', coat: '#6a5230', x: 61, lines: ['嘘——保持安静。', '亚当常来这里看书。', '想给亚当投喂一本书吗？'] },
    ],
    panels: { shelf: '书架', donate: '投喂书籍' },
    defaultPanel: 'shelf',
  },

  // ── 档案馆：反思卷宗 / 大事记 ──
  archive: {
    id: 'archive',
    name: '档案馆',
    subtitle: 'ARCHIVE · 记忆与卷宗',
    wall: '#322a20', wallDark: '#262017', wallTrim: '#8a6444',
    floorA: '#42382a', floorB: '#372e22', accent: '#a8805c', glow: '#ffcf70',
    props: [
      { type: 'cabinet', x: 12, panel: 'reflections', label: '反思卷宗柜' },
      { type: 'cabinet', x: 28, panel: 'reflections', label: '反思卷宗柜' },
      { type: 'board', x: 50, panel: 'chronicle', label: '园区大事记' },
      { type: 'desk', x: 70 },
      { type: 'lamp', x: 88 },
      { type: 'plant', x: 96 },
    ],
    npcs: [
      { name: '档案员·尘', coat: '#5a4632', x: 66, lines: ['所有发生过的，都记着。', '亚当的每一次反思都归档了。', '历史不会说谎。'] },
    ],
    panels: { reflections: '反思卷宗', chronicle: '园区大事记' },
    defaultPanel: 'reflections',
  },
}

/** 其余建筑的通用大厅 */
export function genericHall(id: string, name: string): HallConfig {
  return {
    id,
    name,
    subtitle: 'ECO PARK · 园区机构',
    wall: '#2c2c34', wallDark: '#212128', wallTrim: '#8a8a98',
    floorA: '#383844', floorB: '#2f2f3a', accent: '#9090a8', glow: '#d0d0e8',
    props: [
      { type: 'counter', x: 36, panel: 'info', label: '前台' },
      { type: 'board', x: 70, panel: 'info', label: '机构公告' },
      { type: 'plant', x: 8 },
      { type: 'lamp', x: 92 },
      { type: 'sofa', x: 54 },
    ],
    npcs: [
      { name: '前台·小柒', coat: '#4a5568', x: 33, lines: ['欢迎光临，这里还在筹备中。', '有什么可以帮你的吗？'] },
    ],
    panels: { info: '机构信息' },
    defaultPanel: 'info',
  }
}
