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

/** 把机构预设放到城市网格中 */
function defaultBuildings(): BuildingRecord[] {
  // 四大区域散布在 32x32 大世界里，每栋建筑间隔 3-5 格
  // 指挥中心(command_center): 左上区域 (2~10, 2~12)
  // 情报研究区(intelligence): 右上区域 (16~26, 1~10)
  // 商业生态区(commerce): 下方左侧 (6~16, 18~26)
  // 亚当领地(adam_domain): 下方右侧 (18~26, 18~26)
  const placements: Array<{ id: InvestmentInstitutionId; name: string; category: BuildingRecord['category']; gx: number; gy: number; status: BuildingRecord['status'] }> = [
    // 指挥中心 — 左上
    { id: 'bureau', name: '投资局', category: 'institutional', gx: 4, gy: 4, status: 'active' },
    { id: 'finance_gateway', name: '金融机构', category: 'institutional', gx: 8, gy: 2, status: 'active' },
    { id: 'reactor', name: '反应堆', category: 'functional', gx: 6, gy: 10, status: 'active' },
    // 情报研究区 — 右上
    { id: 'intel_station', name: '情报站', category: 'institutional', gx: 18, gy: 2, status: 'active' },
    { id: 'research_institute', name: '研究院', category: 'institutional', gx: 22, gy: 5, status: 'active' },
    { id: 'data_center', name: '数据仓库', category: 'functional', gx: 19, gy: 8, status: 'active' },
    { id: 'risk_lab', name: '风险实验室', category: 'functional', gx: 25, gy: 8, status: 'active' },
    // 商业生态区 — 下方左侧
    { id: 'marketing_consultancy', name: '营销顾问所', category: 'institutional', gx: 8, gy: 18, status: 'active' },
    { id: 'ad_company', name: '广告公司', category: 'functional', gx: 12, gy: 22, status: 'planned' },
    { id: 'arbitration_hall', name: '仲裁所', category: 'institutional', gx: 6, gy: 24, status: 'active' },
    // 亚当领地 — 下方右侧
    { id: 'adam_academy', name: '学院', category: 'institutional', gx: 22, gy: 18, status: 'planned' },
    { id: 'archive', name: '档案馆', category: 'institutional', gx: 18, gy: 22, status: 'active' },
    { id: 'corner', name: '亚当的角落', category: 'trace', gx: 24, gy: 22, status: 'active' },
    { id: 'library', name: '图书馆', category: 'institutional', gx: 20, gy: 20, status: 'active' },
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
const HOME_GX = 24
const HOME_GY = 22

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
      }),
    )
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
    addBuilding,
    activate,
    refreshSurvivalDays,
    updateEmotion,
    moveAdamTo,
    adamArrived,
    adamGoHome,
    setAdamActivity,
    reset,
    persist,
  }
})
