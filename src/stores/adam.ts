import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type {
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
    { id: 'bureau', name: '投资局', zone: 'core_survival', status: 'idle', toolIds: ['record_investment', 'settle_dividend', 'apply_penalty'] },
    { id: 'finance_gateway', name: '金融机构', zone: 'core_survival', status: 'idle', toolIds: ['request_loan', 'request_erp_access', 'manage_vault'] },
    { id: 'reactor', name: '反应堆', zone: 'core_survival', status: 'idle', toolIds: [] },
    { id: 'intel_station', name: '情报站', zone: 'ability_growth', status: 'idle', toolIds: ['scan_market_news', 'get_sector_heat', 'get_northbound_flow'] },
    { id: 'research_institute', name: '研究院', zone: 'ability_growth', status: 'idle', toolIds: ['get_stock_realtime', 'get_stock_history', 'analyze_fundamentals', 'screen_stocks', 'generate_research_report'] },
    { id: 'adam_academy', name: '亚当学院', zone: 'ability_growth', status: 'locked', toolIds: [] },
    { id: 'data_center', name: '数据仓库', zone: 'ability_growth', status: 'idle', toolIds: [] },
    { id: 'risk_lab', name: '风险实验室', zone: 'ability_growth', status: 'idle', toolIds: [] },
    { id: 'arbitration_hall', name: '仲裁所', zone: 'social_relation', status: 'idle', toolIds: [] },
    { id: 'ad_company', name: '广告公司', zone: 'social_relation', status: 'locked', toolIds: [] },
    { id: 'archive', name: '档案馆', zone: 'social_relation', status: 'idle', toolIds: [] },
    { id: 'corner', name: '亚当的角落', zone: 'social_relation', status: 'idle', toolIds: ['build_structure', 'relocate_structure', 'upgrade_structure'] },
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

/** 把 13 个机构预设放到城市网格中 */
function defaultBuildings(): BuildingRecord[] {
  // 三大区域散布在 32x32 大世界里，每栋建筑间隔 3-5 格
  // 核心生存区(core_survival): 左上区域 (2~10, 2~12)
  // 能力成长区(ability_growth): 右上区域 (16~26, 1~10)
  // 社会关系区(social_relation): 下方中央 (6~22, 18~26)
  const placements: Array<{ id: InvestmentInstitutionId; name: string; category: BuildingRecord['category']; gx: number; gy: number; status: BuildingRecord['status'] }> = [
    // 核心生存区 — 左上
    { id: 'bureau', name: '投资局', category: 'institutional', gx: 4, gy: 4, status: 'active' },
    { id: 'finance_gateway', name: '金融机构', category: 'institutional', gx: 8, gy: 2, status: 'active' },
    { id: 'reactor', name: '反应堆', category: 'functional', gx: 6, gy: 10, status: 'active' },
    // 能力成长区 — 右上
    { id: 'intel_station', name: '情报站', category: 'institutional', gx: 18, gy: 2, status: 'active' },
    { id: 'research_institute', name: '研究院', category: 'institutional', gx: 22, gy: 5, status: 'active' },
    { id: 'adam_academy', name: '学院', category: 'institutional', gx: 26, gy: 2, status: 'planned' },
    { id: 'data_center', name: '数据仓库', category: 'functional', gx: 19, gy: 8, status: 'active' },
    { id: 'risk_lab', name: '风险实验室', category: 'functional', gx: 25, gy: 8, status: 'active' },
    // 社会关系区 — 下方中央
    { id: 'arbitration_hall', name: '仲裁所', category: 'institutional', gx: 8, gy: 20, status: 'active' },
    { id: 'ad_company', name: '广告公司', category: 'functional', gx: 14, gy: 24, status: 'planned' },
    { id: 'archive', name: '档案馆', category: 'institutional', gx: 6, gy: 24, status: 'active' },
    { id: 'corner', name: '亚当的角落', category: 'trace', gx: 20, gy: 20, status: 'active' },
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

function loadFromStorage(): {
  core: AdamCore
  events: InvestmentEventRecord[]
  institutions: InstitutionStateRecord[]
  buildings: BuildingRecord[]
  recommendations: RecommendationRecord[]
  ledger: LedgerEntryRecord[]
  reflections: ReflectionRecord[]
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        core: { ...defaultCore(), ...parsed.core },
        events: parsed.events || [],
        institutions: parsed.institutions || defaultInstitutions(),
        buildings: parsed.buildings?.length ? parsed.buildings : defaultBuildings(),
        recommendations: parsed.recommendations || [],
        ledger: parsed.ledger || [],
        reflections: parsed.reflections || [],
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
  }
}

export const useAdamStore = defineStore('adam', () => {
  const saved = loadFromStorage()

  const core = reactive<AdamCore>(saved.core)
  const events = ref<InvestmentEventRecord[]>(saved.events)
  const institutions = ref<InstitutionStateRecord[]>(saved.institutions)
  const buildings = ref<BuildingRecord[]>(saved.buildings)
  const recommendations = ref<RecommendationRecord[]>(saved.recommendations)
  const ledger = ref<LedgerEntryRecord[]>(saved.ledger)
  const reflections = ref<ReflectionRecord[]>(saved.reflections)

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

  function activate() {
    if (core.status !== 'dormant') return
    core.status = 'alive'
    core.activatedAt = new Date().toISOString()
    core.survivalDays = 0
    persist()
  }

  function reset() {
    Object.assign(core, defaultCore())
    events.value = []
    institutions.value = defaultInstitutions()
    buildings.value = []
    recommendations.value = []
    ledger.value = []
    reflections.value = []
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
    activate,
    reset,
    persist,
  }
})
