import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type {
  BookRecord,
  BuildingRecord,
  InstitutionStateRecord,
  InvestmentEventRecord,
  InvestmentInstitutionId,
  LedgerEntryRecord,
  RecommendationRecord,
  ReflectionRecord,
} from '@/types/investment'
import { updateInstitutionStateFromEvent } from '@/utils/investmentEvents'

const STORAGE_KEY = 'adam_state'

// ── 远端 KV 同步 ────────────────────────────────────────────────────────────
// 防抖：core 变动后 1.5s 才真正写 KV，避免频繁请求
let _kvSyncTimer: ReturnType<typeof setTimeout> | null = null

function syncCoreToKV(core: AdamCore) {
  if (_kvSyncTimer) clearTimeout(_kvSyncTimer)
  _kvSyncTimer = setTimeout(async () => {
    const token = localStorage.getItem('erp_token') || ''
    try {
      await fetch('/api/adam/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
        body: JSON.stringify({ core }),
      })
    } catch { /* 网络失败静默，localStorage 仍保有备份 */ }
  }, 1500)
}

// 机构状态同步：状态变更后 1.5s 写 KV
let _instSyncTimer: ReturnType<typeof setTimeout> | null = null
function syncInstitutionsToKV(institutions: InstitutionStateRecord[]) {
  if (_instSyncTimer) clearTimeout(_instSyncTimer)
  _instSyncTimer = setTimeout(async () => {
    const token = localStorage.getItem('erp_token') || ''
    const map: Record<string, string> = {}
    for (const i of institutions) map[i.institutionId] = i.status
    try {
      await fetch('/api/adam/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
        body: JSON.stringify({ institutions: map }),
      })
    } catch { /* 静默 */ }
  }, 1500)
}

export async function loadCoreFromKV(): Promise<AdamCore | null> {
  const token = localStorage.getItem('erp_token') || ''
  try {
    const res = await fetch('/api/adam/state', {
      headers: { 'x-erp-token': token },
    })
    if (!res.ok) return null
    const data = await res.json() as { core: AdamCore | null }
    return data.core
  } catch {
    return null
  }
}

interface AdamCore {
  status: 'dormant' | 'alive' | 'survival' | 'shutdown'
  budget: number
  netWorth: number
  creditLevel: 'C' | 'B' | 'B+' | 'A' | 'S'
  survivalDays: number
  activatedAt: string | null
  emotionState: {
    joy: number
    anger: number
    sorrow: number
    fear: number
    love: number
    disgust: number
    desire: number
  }
  energy: number
  recommendationAccuracy: number
}

function defaultCore(): AdamCore {
  return {
    status: 'dormant',
    budget: 0,
    netWorth: 0,
    creditLevel: 'C',
    survivalDays: 0,
    activatedAt: null,
    emotionState: { joy: 0, anger: 0, sorrow: 0, fear: 0, love: 0, disgust: 0, desire: 0 },
    energy: 100,
    recommendationAccuracy: 0,
  }
}

function defaultInstitutions(): InstitutionStateRecord[] {
  const defs: Array<{ id: InvestmentInstitutionId; name: string; zone: InstitutionStateRecord['zone']; status: InstitutionStateRecord['status']; toolIds: InstitutionStateRecord['toolIds'] }> = [
    // 指挥中心 COMMAND_CENTER
    { id: 'bureau', name: '投资局', zone: 'command_center', status: 'idle', toolIds: ['record_investment', 'settle_dividend', 'apply_penalty', 'issue_recommendation'] },
    { id: 'finance_gateway', name: '金融机构', zone: 'command_center', status: 'idle', toolIds: ['request_loan', 'request_erp_access', 'manage_vault'] },
    { id: 'reactor', name: '反应堆', zone: 'command_center', status: 'idle', toolIds: [] },
    // 情报研究区 INTELLIGENCE
    { id: 'intel_station', name: '情报站', zone: 'intelligence', status: 'idle', toolIds: ['scan_market_news', 'get_sector_heat', 'get_northbound_flow'] },
    { id: 'research_institute', name: '研究院', zone: 'intelligence', status: 'idle', toolIds: ['get_stock_realtime', 'get_stock_history', 'analyze_fundamentals', 'screen_stocks', 'generate_research_report'] },
    { id: 'data_center', name: '数据仓库', zone: 'intelligence', status: 'idle', toolIds: [] },
    { id: 'risk_lab', name: '风险实验室', zone: 'intelligence', status: 'idle', toolIds: [] },
    // 商业生态区 COMMERCE
    { id: 'marketing_consultancy', name: '营销顾问所', zone: 'commerce', status: 'idle', toolIds: ['consult_marketing_expert'] },
    { id: 'ad_company', name: '广告公司', zone: 'commerce', status: 'locked', toolIds: [] },
    { id: 'arbitration_hall', name: '仲裁所', zone: 'commerce', status: 'idle', toolIds: [] },
    // 亚当领地 ADAM_DOMAIN
    { id: 'adam_academy', name: '亚当学院', zone: 'adam_domain', status: 'locked', toolIds: [] },
    { id: 'archive', name: '档案馆', zone: 'adam_domain', status: 'idle', toolIds: ['write_reflection'] },
    { id: 'corner', name: '亚当的角落', zone: 'adam_domain', status: 'idle', toolIds: ['build_structure', 'relocate_structure', 'upgrade_structure'] },
    { id: 'library', name: '图书馆', zone: 'adam_domain', status: 'idle', toolIds: ['browse_books', 'add_book', 'recommend_book'] },
  ]
  return defs.map((d) => ({
    institutionId: d.id,
    name: d.name,
    zone: d.zone,
    status: d.status,
    linkedEventIds: [],
    toolIds: d.toolIds,
  }))
}

/** 园区布局版本号：布局表变更时 +1，触发已有存档的坐标迁移 */
export const CITY_LAYOUT_VERSION = 3

/**
 * 布局 v3 — 对照参考全景图（雕塑居中 13.5,13.5）：
 * 投资局/金融机构左上，反应堆/情报站上中，
 * 研究院/数据仓库/风险实验室右上一排，营销顾问所最左下，
 * 广告公司/仲裁所下方，图书馆/角落/学院/档案馆右下
 */
const LAYOUT_V2: Record<string, { gx: number; gy: number }> = {
  bureau:                { gx: 4,  gy: 18 },
  finance_gateway:       { gx: 2,  gy: 11 },
  reactor:               { gx: 7,  gy: 9 },
  intel_station:         { gx: 5,  gy: 2 },
  research_institute:    { gx: 11, gy: 5 },
  data_center:           { gx: 16, gy: 5 },
  risk_lab:              { gx: 22, gy: 4 },
  marketing_consultancy: { gx: 9,  gy: 25 },
  ad_company:            { gx: 11, gy: 20 },
  arbitration_hall:      { gx: 18, gy: 21 },
  library:               { gx: 22, gy: 19 },
  corner:                { gx: 20, gy: 16 },
  adam_academy:          { gx: 23, gy: 9 },
  archive:               { gx: 25, gy: 15 },
}

/** 把机构预设放到城市网格中 */
function defaultBuildings(): BuildingRecord[] {
  const placements: Array<{ id: InvestmentInstitutionId; name: string; category: BuildingRecord['category']; gx: number; gy: number; status: BuildingRecord['status'] }> = [
    // 指挥中心 — 左上
    { id: 'bureau', name: '投资局', category: 'institutional', ...LAYOUT_V2.bureau, status: 'active' },
    { id: 'finance_gateway', name: '金融机构', category: 'institutional', ...LAYOUT_V2.finance_gateway, status: 'active' },
    { id: 'reactor', name: '反应堆', category: 'functional', ...LAYOUT_V2.reactor, status: 'active' },
    // 情报研究区 — 右上
    { id: 'intel_station', name: '情报站', category: 'institutional', ...LAYOUT_V2.intel_station, status: 'active' },
    { id: 'research_institute', name: '研究院', category: 'institutional', ...LAYOUT_V2.research_institute, status: 'active' },
    { id: 'data_center', name: '数据仓库', category: 'functional', ...LAYOUT_V2.data_center, status: 'active' },
    { id: 'risk_lab', name: '风险实验室', category: 'functional', ...LAYOUT_V2.risk_lab, status: 'active' },
    // 商业生态区 — 下方左侧
    { id: 'marketing_consultancy', name: '营销顾问所', category: 'institutional', ...LAYOUT_V2.marketing_consultancy, status: 'active' },
    { id: 'ad_company', name: '广告公司', category: 'functional', ...LAYOUT_V2.ad_company, status: 'planned' },
    { id: 'arbitration_hall', name: '仲裁所', category: 'institutional', ...LAYOUT_V2.arbitration_hall, status: 'active' },
    // 亚当领地 — 下方右侧
    { id: 'adam_academy', name: '学院', category: 'institutional', ...LAYOUT_V2.adam_academy, status: 'planned' },
    { id: 'archive', name: '档案馆', category: 'institutional', ...LAYOUT_V2.archive, status: 'active' },
    { id: 'corner', name: '亚当的角落', category: 'trace', ...LAYOUT_V2.corner, status: 'active' },
    { id: 'library', name: '图书馆', category: 'institutional', ...LAYOUT_V2.library, status: 'active' },
  ]
  const now = new Date().toISOString()
  return placements.map((p) => ({
    id: `bldg_${p.id}`,
    institutionId: p.id,
    type: p.id,
    category: p.category,
    name: p.name,
    position: { gridX: p.gx, gridY: p.gy },
    status: p.status,
    constructedAt: now,
    reason: '初始预设',
    linkedEventIds: [],
    upgradeHistory: [],
  }))
}

/** 迁移旧 zone 名到新 zone 名 */
function migrateZone(zone: string): InstitutionStateRecord['zone'] {
  const map: Record<string, InstitutionStateRecord['zone']> = {
    core_survival: 'command_center',
    ability_growth: 'intelligence',
    social_relation: 'commerce', // 默认映射到 commerce，adam_domain 的由 defaultInstitutions 覆盖
  }
  return map[zone] || (zone as InstitutionStateRecord['zone'])
}

function loadFromStorage(): {
  core: AdamCore
  events: InvestmentEventRecord[]
  institutions: InstitutionStateRecord[]
  buildings: BuildingRecord[]
  recommendations: RecommendationRecord[]
  ledger: LedgerEntryRecord[]
  reflections: ReflectionRecord[]
  books: BookRecord[]
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 迁移旧 zone 名并合并新机构
      let inst = parsed.institutions as InstitutionStateRecord[] | undefined
      if (inst?.length) {
        inst = inst.map((i) => ({ ...i, zone: migrateZone(i.zone) }))
        // 合并新增的机构（如 marketing_consultancy）
        const defaults = defaultInstitutions()
        const existingIds = new Set(inst.map((i) => i.institutionId))
        for (const d of defaults) {
          if (!existingIds.has(d.institutionId)) inst.push(d)
        }
        // 同步旧机构的 zone 到最新定义
        const zoneMap = new Map(defaults.map((d) => [d.institutionId, d.zone]))
        inst = inst.map((i) => ({ ...i, zone: zoneMap.get(i.institutionId) || i.zone }))
      }
      // 合并新增的建筑
      let bldgs = parsed.buildings as BuildingRecord[] | undefined
      if (bldgs?.length) {
        const defaults = defaultBuildings()
        const existingBldgIds = new Set(bldgs.map((b) => b.institutionId))
        for (const d of defaults) {
          if (d.institutionId && !existingBldgIds.has(d.institutionId)) bldgs.push(d)
        }
        // 布局迁移：旧存档一次性应用新版预设坐标（亚当之后的自主迁移不受影响）
        if (parsed.layoutVersion !== CITY_LAYOUT_VERSION) {
          bldgs = bldgs.map((b) => {
            const pos = b.institutionId ? LAYOUT_V2[b.institutionId] : undefined
            return pos ? { ...b, position: { gridX: pos.gx, gridY: pos.gy } } : b
          })
        }
      }
      return {
        core: { ...defaultCore(), ...parsed.core },
        events: parsed.events || [],
        institutions: inst || defaultInstitutions(),
        buildings: bldgs?.length ? bldgs : defaultBuildings(),
        recommendations: parsed.recommendations || [],
        ledger: parsed.ledger || [],
        reflections: parsed.reflections || [],
        books: parsed.books || [],
      }
    }
  } catch { /* ignore */ }
  return {
    core: defaultCore(),
    events: [],
    institutions: defaultInstitutions(),
    buildings: defaultBuildings(),
    recommendations: [],
    ledger: [],
    reflections: [],
    books: [],
  }
}

export interface AdamPosition {
  gridX: number
  gridY: number
  targetGridX: number
  targetGridY: number
  isMoving: boolean
  activity: string
  targetInstitutionId: InvestmentInstitutionId | null
}

/** 亚当的角落默认坐标 */
const HOME_GX = LAYOUT_V2.corner.gx
const HOME_GY = LAYOUT_V2.corner.gy

export const useAdamStore = defineStore('adam', () => {
  const saved = loadFromStorage()

  const core = reactive<AdamCore>(saved.core)
  const events = ref<InvestmentEventRecord[]>(saved.events)
  const institutions = ref<InstitutionStateRecord[]>(saved.institutions)
  const buildings = ref<BuildingRecord[]>(saved.buildings)
  const recommendations = ref<RecommendationRecord[]>(saved.recommendations)
  const ledger = ref<LedgerEntryRecord[]>(saved.ledger)
  const reflections = ref<ReflectionRecord[]>(saved.reflections)
  const books = ref<BookRecord[]>(saved.books)

  // ── 亚当在城市中的位置 ──
  const adamPosition = reactive<AdamPosition>({
    gridX: HOME_GX,
    gridY: HOME_GY,
    targetGridX: HOME_GX,
    targetGridY: HOME_GY,
    isMoving: false,
    activity: '',
    targetInstitutionId: null,
  })

  // ── computed ──
  const isAlive = computed(() => core.status === 'alive' || core.status === 'survival')

  const totalEarned = computed(() =>
    ledger.value.filter((e) => e.direction === 'in').reduce((s, e) => s + e.amount, 0),
  )
  const totalCost = computed(() =>
    ledger.value.filter((e) => e.direction === 'out').reduce((s, e) => s + e.amount, 0),
  )

  const institutionMap = computed(() => {
    const map: Partial<Record<InvestmentInstitutionId, InstitutionStateRecord>> = {}
    for (const inst of institutions.value) map[inst.institutionId] = inst
    return map
  })

  const recentEvents = computed(() => [...events.value].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20))

  const latestRecommendation = computed(() =>
    [...recommendations.value].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0] || null,
  )

  // ── actions ──
  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        core: { ...core },
        events: events.value,
        institutions: institutions.value,
        buildings: buildings.value,
        recommendations: recommendations.value,
        ledger: ledger.value,
        reflections: reflections.value,
        books: books.value,
        layoutVersion: CITY_LAYOUT_VERSION,
      }),
    )
    // 同步 core 到 Cloudflare KV（防抖1.5s）
    syncCoreToKV({ ...core })
  }

  /** 从远端 KV 加载 core 并覆盖本地状态（在 Index.vue onMounted 调用） */
  async function syncCoreFromKV() {
    const remote = await loadCoreFromKV()
    if (!remote) return
    // 以 KV 为准覆盖 core（保留本地非 core 数据）
    Object.assign(core, remote)
    // 更新 localStorage 缓存
    persist()
  }

  function addEvent(event: InvestmentEventRecord) {
    events.value.push(event)
    // 更新相关机构状态
    if (event.institutionId) {
      institutions.value = institutions.value.map((inst) =>
        updateInstitutionStateFromEvent(inst, event),
      )
      // 触发亚当移动到事件对应的机构
      moveAdamTo(event.institutionId as InvestmentInstitutionId, event.title)
    }
    persist()
  }

  function addLedgerEntry(entry: LedgerEntryRecord) {
    ledger.value.push(entry)
    // 更新预算
    if (entry.direction === 'in') core.budget += entry.amount
    else core.budget -= entry.amount
    // 重算净值
    core.netWorth = totalEarned.value - totalCost.value
    persist()
  }

  function addRecommendation(rec: RecommendationRecord) {
    recommendations.value.push(rec)
    persist()
  }

  function addReflection(ref_: ReflectionRecord) {
    reflections.value.push(ref_)
    persist()
  }

  function addBook(book: BookRecord) {
    books.value.push(book)
    persist()
  }

  function removeBook(id: string) {
    books.value = books.value.filter(b => b.id !== id)
    persist()
  }

  /** 亚当自主新增机构（build_structure 工具触发） */
  function addInstitution(inst: InstitutionStateRecord) {
    if (institutions.value.find((i) => i.institutionId === inst.institutionId)) return
    institutions.value.push(inst)
    persist()
    syncInstitutionsToKV(institutions.value)
  }

  /** 手动激活/停用机构（用户操作或自动调度） */
  function setInstitutionStatus(institutionId: string, status: InstitutionStateRecord['status']) {
    const inst = institutions.value.find((i) => i.institutionId === institutionId)
    if (!inst || inst.status === status) return
    inst.status = status
    // 同步建筑状态
    const bldg = buildings.value.find((b) => b.institutionId === institutionId)
    if (bldg) {
      bldg.status = status === 'active' ? 'active' : (status === 'locked' ? 'planned' : 'idle' as any)
    }
    persist()
    syncInstitutionsToKV(institutions.value)
  }

  /** 亚当自主新增建筑（build_structure 工具触发） */
  function addBuilding(bldg: BuildingRecord) {
    if (buildings.value.find((b) => b.id === bldg.id)) return
    buildings.value.push(bldg)
    persist()
  }

  function activate() {
    if (core.status !== 'dormant') return
    core.status = 'alive'
    core.activatedAt = new Date().toISOString()
    core.survivalDays = 0
    persist()
  }

  /** 根据 activatedAt 计算实际存活天数 */
  function refreshSurvivalDays() {
    if (!core.activatedAt || core.status === 'dormant') return
    const activated = new Date(core.activatedAt).getTime()
    const now = Date.now()
    const days = Math.floor((now - activated) / (24 * 60 * 60 * 1000))
    if (days !== core.survivalDays) {
      core.survivalDays = days
      persist()
    }
  }

  /** 亚当自主更新情绪（由 AI 通过 update_emotion 工具调用） */
  function updateEmotion(newState: Partial<AdamCore['emotionState']>) {
    for (const [key, val] of Object.entries(newState)) {
      const k = key as keyof AdamCore['emotionState']
      if (typeof val === 'number') {
        core.emotionState[k] = Math.max(0, Math.min(100, val))
      }
    }
    persist()
  }

  /** 移动亚当到指定机构建筑 */
  function moveAdamTo(institutionId: InvestmentInstitutionId, activity?: string) {
    const bldg = buildings.value.find((b) => b.institutionId === institutionId)
    if (!bldg) return
    adamPosition.targetGridX = bldg.position.gridX
    adamPosition.targetGridY = bldg.position.gridY
    adamPosition.targetInstitutionId = institutionId
    adamPosition.isMoving = true
    if (activity) adamPosition.activity = activity
  }

  /** 亚当到达目标位置 */
  function adamArrived() {
    adamPosition.gridX = adamPosition.targetGridX
    adamPosition.gridY = adamPosition.targetGridY
    adamPosition.isMoving = false
  }

  // ── 对话框状态（供 Workspace 页面触发打开） ──
  const chatOpen = ref(false)

  function openChat() {
    chatOpen.value = true
  }

  /** 让亚当回到角落 */
  function adamGoHome() {
    adamPosition.targetGridX = HOME_GX
    adamPosition.targetGridY = HOME_GY
    adamPosition.targetInstitutionId = null
    adamPosition.isMoving = true
    adamPosition.activity = ''
  }

  /** 设置亚当当前活动描述 */
  function setAdamActivity(text: string) {
    adamPosition.activity = text
  }

  function reset() {
    Object.assign(core, defaultCore())
    events.value = []
    institutions.value = defaultInstitutions()
    buildings.value = []
    recommendations.value = []
    ledger.value = []
    reflections.value = []
    books.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    core,
    events,
    institutions,
    buildings,
    recommendations,
    ledger,
    reflections,
    books,
    adamPosition,
    isAlive,
    totalEarned,
    totalCost,
    institutionMap,
    recentEvents,
    latestRecommendation,
    addEvent,
    addLedgerEntry,
    addRecommendation,
    addReflection,
    addBook,
    removeBook,
    addInstitution,
    setInstitutionStatus,
    addBuilding,
    activate,
    refreshSurvivalDays,
    updateEmotion,
    moveAdamTo,
    adamArrived,
    adamGoHome,
    setAdamActivity,
    chatOpen,
    openChat,
    reset,
    persist,
    syncCoreFromKV,
  }
})
