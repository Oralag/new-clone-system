<template>
  <div class="city-page">
    <!-- 左侧状态栏 -->
    <aside class="city-sidebar">
      <!-- 详情面板（选中机构时） -->
      <div v-if="selectedInst" class="detail-panel">
        <div class="detail-header">
          <span class="detail-emoji">{{ getEmoji(selectedInst.institutionId) }}</span>
          <div class="detail-title-wrap">
            <span class="detail-name">{{ selectedInst.name }}</span>
            <span class="detail-status-tag" :class="selectedInst.status">{{ statusLabel(selectedInst.status) }}</span>
          </div>
          <button class="detail-close" @click="selectedId = null">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M1 1l8 8M9 1l-8 8"/>
            </svg>
          </button>
        </div>

        <!-- 建筑信息 -->
        <div v-if="selectedBuilding" class="detail-section">
          <div class="detail-section-title">BUILDING_INFO</div>
          <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="detail-value" :class="selectedBuilding.status">{{ buildingStatusLabel(selectedBuilding.status) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">坐标</span>
            <span class="detail-value mono">({{ selectedBuilding.position.gridX }}, {{ selectedBuilding.position.gridY }})</span>
          </div>
          <div v-if="selectedBuilding.upgradeHistory.length" class="detail-row">
            <span class="detail-label">升级</span>
            <span class="detail-value mono">LV.{{ selectedBuilding.upgradeHistory.length }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">建造</span>
            <span class="detail-value mono">{{ formatDate(selectedBuilding.constructedAt) }}</span>
          </div>
        </div>

        <!-- 工具列表 -->
        <div class="detail-section">
          <div class="detail-section-title">TOOLS <span class="tool-count">{{ selectedInst.toolIds.length }}</span></div>
          <div v-if="selectedInst.toolIds.length" class="tool-grid">
            <button
              v-for="tid in selectedInst.toolIds"
              :key="tid"
              class="tool-chip"
              :class="{ running: toolRunning === tid, done: toolResults[tid] !== undefined && toolRunning !== tid }"
              :disabled="!!toolRunning"
              @click="executeTool(tid)"
            >
              <span class="tool-indicator" :class="{ spin: toolRunning === tid }"></span>
              {{ toolNameMap[tid] || tid }}
            </button>
          </div>
          <span v-else class="detail-empty">NO_TOOLS_AVAILABLE</span>
          <!-- 工具执行结果 -->
          <div v-if="toolResultDisplay" class="tool-result-panel">
            <div class="tool-result-head">
              <span class="tool-result-name">{{ toolNameMap[toolResultId] || toolResultId }}</span>
              <button class="tool-result-close" @click="toolResultDisplay = ''">×</button>
            </div>
            <pre class="tool-result-body">{{ toolResultDisplay }}</pre>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="detail-section">
          <div class="detail-section-title">RECENT_ACTIVITY</div>
          <div v-if="selectedInst.recentTrace" class="detail-trace">
            <span class="trace-indicator"></span>
            {{ selectedInst.recentTrace }}
          </div>
          <div v-else class="detail-empty">IDLE</div>
          <div v-if="relatedEvents.length" class="detail-events">
            <div v-for="ev in relatedEvents" :key="ev.id" class="detail-event-item">
              <span class="detail-event-dot" :class="ev.stage"></span>
              <span class="detail-event-time">{{ formatTime(ev.at) }}</span>
              <span class="detail-event-text">{{ ev.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 机构列表（未选中时） -->
      <div v-show="!selectedInst" class="inst-list-wrap">
        <div class="sidebar-title-bar">
          <span class="sidebar-title">INSTITUTIONS</span>
          <span class="sidebar-count">{{ adamStore.institutions.length }}</span>
        </div>
        <div class="sidebar-section" v-for="zone in zoneList" :key="zone.key">
          <div class="sidebar-section-title">
            <span class="zone-indicator" :class="zone.key"></span>
            {{ zone.label }}
          </div>
          <div
            v-for="inst in zone.items"
            :key="inst.institutionId"
            class="inst-item"
            :class="[inst.status, { selected: selectedId === inst.institutionId }]"
            @click="selectedId = inst.institutionId"
          >
            <span class="inst-emoji">{{ getEmoji(inst.institutionId) }}</span>
            <div class="inst-info">
              <span class="inst-name">{{ inst.name }}</span>
              <span class="inst-status-label">{{ statusLabel(inst.status) }}</span>
            </div>
            <span class="inst-dot" :class="inst.status"></span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧像素城市 -->
    <div class="city-main">
      <div class="panel panel-observatory">
        <div class="panel-head">
          <span class="panel-icon">◈</span>
          <span class="panel-title">PHYSICAL_REPRESENTATION</span>
          <span class="panel-badge">32x32</span>
          <span class="panel-badge phase">Phase 1</span>
        </div>
        <div
          ref="viewportRef"
          class="iso-viewport"
          @wheel.prevent="onWheel"
          @mousedown="onDragStart"
          @contextmenu.prevent
          @touchstart.passive="onTouchStart"
        >
          <!-- 区域标签 -->
          <div class="zone-labels">
            <span class="zone-float-label core">CORE_SURVIVAL</span>
            <span class="zone-float-label growth">ABILITY_GROWTH</span>
            <span class="zone-float-label social">SOCIAL_RELATION</span>
          </div>

          <div class="iso-scene" :style="sceneStyle">
            <!-- 地面网格 -->
            <div
              v-for="cell in groundCells"
              :key="cell.key"
              class="iso-ground"
              :style="cell.style"
            ></div>
            <!-- 建筑物 -->
            <div
              v-for="b in sortedBuildings"
              :key="b.key"
              class="iso-bldg"
              :class="{ locked: b.locked, selected: selectedId === b.instId }"
              :style="b.posStyle"
              :title="b.name"
              @click.stop="selectedId = b.instId"
            >
              <div class="wall wall-left" :style="{ height: b.wallH + 'px', background: b.colorLeft }">
                <div class="windows" v-if="b.wallH > 20">
                  <span v-for="w in b.windowRows" :key="w" class="win-row">
                    <span class="win"></span><span class="win"></span>
                  </span>
                </div>
              </div>
              <div class="wall wall-right" :style="{ height: b.wallH + 'px', background: b.colorRight }">
                <div class="windows" v-if="b.wallH > 20">
                  <span v-for="w in b.windowRows" :key="w" class="win-row">
                    <span class="win"></span><span class="win"></span>
                  </span>
                </div>
              </div>
              <div class="roof" :style="{ background: b.colorTop, bottom: b.wallH + 'px' }"></div>
              <span class="bldg-icon" :style="{ bottom: (b.wallH + 4) + 'px' }">{{ b.emoji }}</span>
              <span class="bldg-name">{{ b.name }}</span>
            </div>
          </div>

          <!-- 状态 HUD -->
          <div class="iso-hud">
            <span class="hud-item">
              <span class="hud-dot" :class="adamStore.core.status"></span>
              {{ adamStore.core.status === 'dormant' ? 'COGNITIVE: DORMANT' : 'COGNITIVE: OBSERVING' }}
            </span>
          </div>
          <div class="iso-controls">
            <span>SCROLL:ZOOM</span>
            <span>L-DRAG:PAN</span>
            <span>R-DRAG:ROTATE</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useAdamStore } from '@/stores/adam'
import type { InvestmentInstitutionId, InvestmentToolId } from '@/types/investment'

const adamStore = useAdamStore()

// ── 选中状态 ──
const selectedId = ref<InvestmentInstitutionId | null>(null)

// ── 工具执行 ──
const toolRunning = ref<string | null>(null)
const toolResults = ref<Record<string, string>>({})
const toolResultDisplay = ref('')
const toolResultId = ref('')

async function executeTool(tid: string) {
  if (toolRunning.value) return
  toolRunning.value = tid
  toolResultDisplay.value = ''
  toolResultId.value = tid

  try {
    const token = localStorage.getItem('erp_token') || ''
    const res = await fetch('/api/adam-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `请执行工具: ${tid}` }],
        adamState: { ...adamStore.core },
      }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result = ''

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') break
        try {
          const data = JSON.parse(payload)
          if (data.type === 'text') result += data.text
          else if (data.type === 'tool_result') result += data.result || ''
        } catch { /* ignore */ }
      }
    }

    toolResults.value[tid] = result || '执行完成'
    toolResultDisplay.value = result || '执行完成'
  } catch (e: any) {
    toolResults.value[tid] = `错误: ${e.message}`
    toolResultDisplay.value = `错误: ${e.message}`
  } finally {
    toolRunning.value = null
  }
}

const selectedInst = computed(() =>
  selectedId.value ? adamStore.institutions.find((i) => i.institutionId === selectedId.value) || null : null,
)

const selectedBuilding = computed(() =>
  selectedId.value ? adamStore.buildings.find((b) => b.institutionId === selectedId.value) || null : null,
)

const relatedEvents = computed(() => {
  if (!selectedInst.value) return []
  return adamStore.events
    .filter((e) => e.institutionId === selectedId.value)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5)
})

// ── 左侧状态栏：按区域分组的机构 ──
const zoneList = computed(() => [
  { key: 'core', label: '核心生存区', items: adamStore.institutions.filter((i) => i.zone === 'core_survival') },
  { key: 'growth', label: '能力成长区', items: adamStore.institutions.filter((i) => i.zone === 'ability_growth') },
  { key: 'social', label: '社会关系区', items: adamStore.institutions.filter((i) => i.zone === 'social_relation') },
])

const emojiMap: Record<string, string> = {
  bureau: '🏛', finance_gateway: '🏦', reactor: '⚡',
  intel_station: '📡', research_institute: '🔬', adam_academy: '🎓',
  data_center: '💾', risk_lab: '⚗️', arbitration_hall: '⚖️',
  ad_company: '📺', archive: '📚', corner: '🏠',
}
function getEmoji(id: string) { return emojiMap[id] || '🏗️' }

function statusLabel(status: string) {
  const map: Record<string, string> = { idle: 'IDLE', active: 'ACTIVE', locked: 'LOCKED', cooldown: 'COOLDOWN', disabled: 'DISABLED', urgent: 'URGENT' }
  return map[status] || status.toUpperCase()
}

function buildingStatusLabel(status: string) {
  const map: Record<string, string> = { planned: '规划中', active: '已建成', upgrading: '升级中', disabled: '停用', memorial: '纪念碑' }
  return map[status] || status
}

const toolNameMap: Record<string, string> = {
  scan_market_news: '扫描市场新闻',
  get_stock_realtime: '实时行情',
  get_stock_history: '历史行情',
  analyze_fundamentals: '基本面分析',
  screen_stocks: '选股筛选',
  get_northbound_flow: '北向资金',
  get_sector_heat: '板块热度',
  generate_research_report: '研报生成',
  record_investment: '记录投资',
  settle_dividend: '结算分红',
  apply_penalty: '执行赔付',
  request_loan: '申请贷款',
  manage_vault: '保险箱管理',
  build_structure: '建造',
  relocate_structure: '迁移',
  upgrade_structure: '升级建筑',
  request_erp_access: '请求ERP权限',
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hour = d.getHours().toString().padStart(2, '0')
    const min = d.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hour}:${min}`
  } catch { return '--/-- --:--' }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
  } catch { return '--' }
}

// ── 等轴测参数 ──
const TILE_W = 80
const TILE_H = 40
const GROUND_SIZE = 32

// 视角角度
const rotateAngle = ref(0)
const tiltAngle = ref(0)

// 建筑配色与高度
interface BldgDef {
  emoji: string
  h: number
  top: string
  left: string
  right: string
}
const bldgDefs: Record<string, BldgDef> = {
  bureau:             { emoji: '🏛', h: 48, top: '#5B8DEF', left: '#3D6BC7', right: '#2C529E' },
  finance_gateway:    { emoji: '🏦', h: 56, top: '#F5A623', left: '#C7851A', right: '#9E6A14' },
  reactor:            { emoji: '⚡', h: 60, top: '#FF6B35', left: '#CC5529', right: '#993F1E' },
  intel_station:      { emoji: '📡', h: 64, top: '#00D4FF', left: '#00A3C7', right: '#007A99' },
  research_institute: { emoji: '🔬', h: 52, top: '#4FC3F7', left: '#3A9BC7', right: '#2A7399' },
  adam_academy:       { emoji: '🎓', h: 44, top: '#CE93D8', left: '#A070B0', right: '#7A5088' },
  data_center:        { emoji: '💾', h: 36, top: '#4DB6AC', left: '#3A8E85', right: '#2A6B64' },
  risk_lab:           { emoji: '⚗️', h: 40, top: '#EF5350', left: '#C73E3C', right: '#992E2D' },
  arbitration_hall:   { emoji: '⚖️', h: 46, top: '#FFD54F', left: '#C7A63C', right: '#99802E' },
  ad_company:         { emoji: '📺', h: 38, top: '#E040FB', left: '#B030C7', right: '#882399' },
  archive:            { emoji: '📚', h: 34, top: '#A1887F', left: '#7E6B63', right: '#5F504A' },
  corner:             { emoji: '🏠', h: 28, top: '#66BB6A', left: '#4F9452', right: '#3A6F3E' },
}
const defaultDef: BldgDef = { emoji: '🏗️', h: 30, top: '#999', left: '#777', right: '#555' }

// 等轴测坐标转屏幕坐标
function isoToScreen(gx: number, gy: number) {
  const x = (gx - gy) * (TILE_W / 2)
  const y = (gx + gy) * (TILE_H / 2)
  return { x, y }
}

// 地面格子 — 只渲染每栋建筑周围 3 格的地砖
const groundCells = computed(() => {
  const cells: Array<{ key: string; style: Record<string, string> }> = []
  const occupied = new Set<string>()
  const R = 3
  for (const b of adamStore.buildings) {
    const cx = b.position.gridX
    const cy = b.position.gridY
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const gx = cx + dx
        const gy = cy + dy
        if (gx < 0 || gy < 0 || gx >= GROUND_SIZE || gy >= GROUND_SIZE) continue
        const k = `${gx},${gy}`
        if (occupied.has(k)) continue
        occupied.add(k)
        const { x, y } = isoToScreen(gx, gy)
        cells.push({
          key: `g${gx}_${gy}`,
          style: {
            left: x + 'px',
            top: y + 'px',
            width: TILE_W + 'px',
            height: TILE_H + 'px',
          },
        })
      }
    }
  }
  return cells
})

// 建筑物（排序：y+x 大的后渲染 = 前面覆盖后面）
const sortedBuildings = computed(() => {
  const list: Array<{
    key: string; name: string; emoji: string; locked: boolean
    instId: string
    wallH: number; windowRows: number[]
    colorTop: string; colorLeft: string; colorRight: string
    posStyle: Record<string, string>
  }> = []

  for (const b of adamStore.buildings) {
    const def = bldgDefs[b.type] || defaultDef
    const isLocked = b.status === 'planned'
    const wallH = isLocked ? Math.round(def.h * 0.5) : def.h
    const { x, y } = isoToScreen(b.position.gridX, b.position.gridY)
    const rows = Math.max(0, Math.floor((wallH - 10) / 10))

    list.push({
      key: b.id,
      name: b.name,
      emoji: def.emoji,
      locked: isLocked,
      instId: b.institutionId || b.type,
      wallH,
      windowRows: Array.from({ length: rows }, (_, i) => i),
      colorTop: def.top,
      colorLeft: def.left,
      colorRight: def.right,
      posStyle: {
        left: x + 'px',
        top: y + 'px',
        zIndex: String(b.position.gridX + b.position.gridY),
      },
    })
  }

  list.sort((a, b) => parseInt(a.posStyle.zIndex) - parseInt(b.posStyle.zIndex))
  return list
})

// ── 视口控制：缩放 + 拖拽平移 + 右键旋转 ──
const viewportRef = ref<HTMLDivElement>()
const scale = ref(0.7)
const centerIso = isoToScreen(14, 13)
const panX = ref(-centerIso.x)
const panY = ref(-centerIso.y + 120)

const sceneStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value}) rotate(${rotateAngle.value}deg) perspective(800px) rotateX(${tiltAngle.value}deg)`,
}))

function onWheel(e: WheelEvent) {
  const d = e.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.max(0.3, Math.min(3, scale.value + d))
}

let dragging = false
let rotating = false
let dragStartX = 0
let dragStartY = 0
let panStartX = 0
let panStartY = 0
let rotateStart = 0
let tiltStart = 0

function onDragStart(e: MouseEvent) {
  if (e.button === 2) {
    rotating = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    rotateStart = rotateAngle.value
    tiltStart = tiltAngle.value
    window.addEventListener('mousemove', onRotateMove)
    window.addEventListener('mouseup', onRotateEnd)
  } else {
    dragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    panStartX = panX.value
    panStartY = panY.value
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
  }
}
function onDragMove(e: MouseEvent) {
  if (!dragging) return
  panX.value = panStartX + (e.clientX - dragStartX)
  panY.value = panStartY + (e.clientY - dragStartY)
}
function onDragEnd() {
  dragging = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

function onRotateMove(e: MouseEvent) {
  if (!rotating) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  rotateAngle.value = rotateStart + dx * 0.3
  tiltAngle.value = Math.max(-30, Math.min(30, tiltStart + dy * 0.3))
}
function onRotateEnd() {
  rotating = false
  window.removeEventListener('mousemove', onRotateMove)
  window.removeEventListener('mouseup', onRotateEnd)
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    pinchDist0 = getTouchDist(e)
    pinchScale0 = scale.value
    return
  }
  const t = e.touches[0]
  dragging = true
  dragStartX = t.clientX
  dragStartY = t.clientY
  panStartX = panX.value
  panStartY = panY.value
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd)
}
let pinchDist0 = 0
let pinchScale0 = 1
function getTouchDist(e: TouchEvent) {
  const [a, b] = [e.touches[0], e.touches[1]]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}
function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    const d = getTouchDist(e)
    scale.value = Math.max(0.3, Math.min(3, pinchScale0 * (d / (pinchDist0 || 1))))
    return
  }
  if (!dragging) return
  const t = e.touches[0]
  panX.value = panStartX + (t.clientX - dragStartX)
  panY.value = panStartY + (t.clientY - dragStartY)
}
function onTouchEnd() {
  dragging = false
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('mousemove', onRotateMove)
  window.removeEventListener('mouseup', onRotateEnd)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   生态园区 — City.vue
   Observatory-grade isometric pixel city
   ═══════════════════════════════════════════════════ */

.city-page {
  height: 100%;
  display: flex;
  gap: 0;
}

/* ── 左侧状态栏 ── */
.city-sidebar {
  width: 230px;
  flex-shrink: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow-y: auto;
  margin-right: 16px;
  scrollbar-width: thin;
}

.sidebar-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  border-bottom: 1px solid var(--border);
}
.sidebar-title {
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.sidebar-count {
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  background: var(--faint);
  padding: 1px 6px;
  border-radius: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.sidebar-section {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}
.sidebar-section:last-child { border-bottom: none; }
.sidebar-section-title {
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  margin-bottom: 8px;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.zone-indicator {
  width: 3px;
  height: 10px;
  border-radius: 1px;
}
.zone-indicator.core { background: #F5A623; }
.zone-indicator.growth { background: #00D4FF; }
.zone-indicator.social { background: #A78BFA; }

.inst-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  margin-bottom: 2px;
  transition: all 0.15s;
  cursor: pointer;
  border: 1px solid transparent;
}
.inst-item:hover {
  background: var(--faint);
  border-color: var(--border);
}
.inst-item.locked { opacity: 0.40; }
.inst-item.selected {
  background: rgba(245,166,35,0.06);
  border-color: rgba(245,166,35,0.20);
}
.inst-emoji { font-size: 15px; flex-shrink: 0; }
.inst-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.inst-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.inst-status-label {
  font-size: 8px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
}
.inst-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.inst-dot.idle { background: var(--dim); opacity: 0.5; }
.inst-dot.active { background: #00E5A0; box-shadow: 0 0 4px rgba(0,229,160,0.4); }
.inst-dot.locked { background: var(--border); }
.inst-dot.busy { background: #F5A623; animation: dotPulse 1.5s ease-in-out infinite; }
.inst-dot.error { background: #FF4D4D; }
@keyframes dotPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

/* ── 详情面板 ── */
.detail-panel {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail-emoji { font-size: 22px; }
.detail-title-wrap { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.detail-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark);
}
.detail-status-tag {
  display: inline-block;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  width: fit-content;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
}
.detail-status-tag.idle { background: var(--faint); color: var(--dim); }
.detail-status-tag.active { background: rgba(0,229,160,0.08); color: #00E5A0; }
.detail-status-tag.locked { background: var(--faint); color: var(--dim); }
.detail-status-tag.cooldown { background: rgba(0,212,255,0.08); color: #00D4FF; }
.detail-status-tag.urgent { background: rgba(255,77,77,0.08); color: #FF4D4D; }
.detail-close {
  width: 22px; height: 22px; border: 1px solid var(--border); background: transparent;
  border-radius: 4px; cursor: pointer; color: var(--dim);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: all 0.15s;
}
.detail-close:hover { border-color: var(--mid); color: var(--dark); }

.detail-section {
  border-top: 1px solid var(--border);
  padding-top: 10px;
}
.detail-section-title {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  margin-bottom: 8px;
  letter-spacing: 0.1em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  display: flex;
  align-items: center;
  gap: 6px;
}
.tool-count {
  background: var(--faint);
  padding: 0 4px;
  border-radius: 3px;
  font-size: 8px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
}
.detail-label { font-size: 11px; color: var(--dim); }
.detail-value {
  font-size: 11px;
  font-weight: 600;
  color: var(--dark);
}
.detail-value.mono { font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.03em; }
.detail-value.active { color: #00E5A0; }
.detail-value.planned { color: var(--dim); }

/* 工具网格 */
.tool-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tool-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 4px;
  background: var(--faint);
  color: var(--mid);
  border: 1px solid var(--border);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.tool-chip:hover:not(:disabled) {
  background: rgba(245,166,35,0.06);
  border-color: rgba(245,166,35,0.25);
  color: #F5A623;
}
.tool-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.tool-chip.running {
  border-color: rgba(0,212,255,0.3);
  color: #00D4FF;
  background: rgba(0,212,255,0.05);
}
.tool-chip.done {
  border-color: rgba(0,229,160,0.2);
  color: #00E5A0;
}
.tool-indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #00D4FF;
  opacity: 0.5;
  flex-shrink: 0;
}
.tool-chip:hover:not(:disabled) .tool-indicator { background: #F5A623; opacity: 1; }
.tool-chip.running .tool-indicator {
  background: #00D4FF;
  opacity: 1;
  animation: toolSpin 0.8s linear infinite;
}
.tool-chip.done .tool-indicator { background: #00E5A0; opacity: 1; }
@keyframes toolSpin {
  0% { box-shadow: 0 0 0 0 rgba(0,212,255,0.4); }
  50% { box-shadow: 0 0 0 3px rgba(0,212,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(0,212,255,0.4); }
}

/* 工具执行结果面板 */
.tool-result-panel {
  margin-top: 8px;
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.tool-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(0,212,255,0.03) 0%, transparent 100%);
}
.tool-result-name {
  font-size: 9px;
  font-weight: 700;
  color: #00D4FF;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
}
.tool-result-close {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--dim);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.1s;
}
.tool-result-close:hover { background: var(--border); color: var(--dark); }
.tool-result-body {
  padding: 8px;
  font-size: 10px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--mid);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow-y: auto;
  margin: 0;
  scrollbar-width: thin;
}

.detail-trace {
  font-size: 11px;
  color: var(--mid);
  line-height: 1.5;
  padding: 6px 8px;
  background: var(--faint);
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 2px solid rgba(245,166,35,0.3);
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.trace-indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #F5A623;
  flex-shrink: 0;
  margin-top: 5px;
}
.detail-empty {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
  opacity: 0.5;
}
.detail-events {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-event-item {
  display: flex;
  gap: 6px;
  align-items: center;
}
.detail-event-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  flex-shrink: 0;
}
.detail-event-dot.sense { background: #00D4FF; }
.detail-event-dot.judge { background: #F5A623; }
.detail-event-dot.act { background: #00E5A0; }
.detail-event-dot.settle { background: #A78BFA; }
.detail-event-dot.archive { background: var(--dim); }
.detail-event-time {
  font-size: 8px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  min-width: 68px;
  flex-shrink: 0;
}
.detail-event-text {
  font-size: 10px;
  color: var(--mid);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 建筑选中高亮 ── */
.iso-bldg.selected {
  filter: brightness(1.3) drop-shadow(0 0 10px rgba(245,166,35,0.6));
}

/* ── 右侧城市 ── */
.city-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.panel {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(245,166,35,0.02) 0%, transparent 100%);
}
.panel-icon {
  font-size: 10px;
  color: #F5A623;
  opacity: 0.6;
}
.panel-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.panel-badge {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  border: 1px solid var(--border);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
  margin-left: auto;
}
.panel-badge.phase { margin-left: 4px; }

/* ═══════════════════════════════════════════
   像素风等轴测城市
   ═══════════════════════════════════════════ */
.iso-viewport {
  position: relative;
  flex: 1;
  min-height: 400px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  background:
    radial-gradient(ellipse at center, rgba(245,166,35,0.02) 0%, transparent 60%),
    radial-gradient(ellipse at 30% 40%, rgba(0,212,255,0.015) 0%, transparent 50%);
}
.iso-viewport:active { cursor: grabbing; }

/* 区域浮动标签 */
.zone-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}
.zone-float-label {
  position: absolute;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.15em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  opacity: 0.15;
}
.zone-float-label.core { top: 12px; left: 16px; color: #F5A623; }
.zone-float-label.growth { top: 12px; right: 16px; color: #00D4FF; }
.zone-float-label.social { bottom: 40px; left: 50%; transform: translateX(-50%); color: #A78BFA; }

.iso-scene {
  position: relative;
  left: 50%;
  top: 60px;
  width: 0;
  height: 0;
  transform-origin: 0 0;
  transition: transform 0.05s linear;
}

/* ── 地面菱形 ── */
.iso-ground {
  position: absolute;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  background: var(--faint);
  border: none;
  box-shadow: inset 0 0 0 1px var(--border);
}

/* ── 等轴测建筑 ── */
.iso-bldg {
  position: absolute;
  width: 64px;
  height: 32px;
  cursor: pointer;
  transition: filter 0.2s;
}
.iso-bldg:hover { filter: brightness(1.2) drop-shadow(0 0 6px rgba(255,255,255,0.1)); }
.iso-bldg.locked { opacity: 0.35; filter: saturate(0.2) brightness(0.8); }

/* 墙体公共 */
.wall {
  position: absolute;
  bottom: 0;
  width: 32px;
}

/* 左墙 */
.wall-left {
  left: 0;
  transform-origin: bottom left;
  transform: skewY(26.565deg);
  border-right: 1px solid rgba(0,0,0,0.1);
}

/* 右墙 */
.wall-right {
  right: 0;
  transform-origin: bottom right;
  transform: skewY(-26.565deg);
  border-left: 1px solid rgba(0,0,0,0.05);
}

/* 窗户 */
.windows {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  padding: 6px 3px;
}
.win-row { display: flex; gap: 4px; }
.win {
  width: 6px;
  height: 5px;
  background: rgba(255,255,200,0.35);
  border: 1px solid rgba(255,255,200,0.15);
  image-rendering: pixelated;
}
.wall-right .win {
  background: rgba(255,255,200,0.2);
  border-color: rgba(255,255,200,0.1);
}

/* 屋顶 — 菱形 */
.roof {
  position: absolute;
  left: 0;
  width: 64px;
  height: 32px;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,0.2),
    0 -2px 8px rgba(0,0,0,0.15);
}

/* 图标浮在屋顶上方 */
.bldg-icon {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  line-height: 1;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
  z-index: 10;
}

/* 名字在建筑下方 — 始终显示 */
.bldg-name {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 2px;
  font-size: 8px;
  font-weight: 700;
  color: var(--dark);
  white-space: nowrap;
  text-shadow: 0 1px 2px var(--card-bg), 0 0 4px var(--card-bg);
  opacity: 0.6;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.03em;
  transition: opacity 0.2s;
}
.iso-bldg:hover .bldg-name { opacity: 1; }
.iso-bldg.selected .bldg-name { opacity: 1; color: #F5A623; }

/* HUD 叠加 */
.iso-hud {
  position: absolute;
  top: 10px;
  left: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}
.hud-item {
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.5;
}
.hud-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.hud-dot.alive { background: #00E5A0; box-shadow: 0 0 4px rgba(0,229,160,0.4); }
.hud-dot.dormant { background: var(--dim); }
.hud-dot.survival { background: #FF4D4D; animation: dotPulse 1s infinite; }
.hud-dot.shutdown { background: var(--dim); opacity: 0.3; }

.iso-controls {
  position: absolute;
  bottom: 10px;
  right: 14px;
  display: flex;
  gap: 10px;
  z-index: 10;
}
.iso-controls span {
  font-size: 8px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
  opacity: 0.35;
}

@media (max-width: 767px) {
  .city-page { flex-direction: column; }
  .city-sidebar { width: 100%; margin-right: 0; margin-bottom: 12px; border-radius: 8px; max-height: 200px; }
  .sidebar-section { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 10px; }
  .sidebar-section-title { width: 100%; margin-bottom: 4px; }
  .inst-item { padding: 4px 6px; }
  .iso-viewport { min-height: 300px; }
  .bldg-icon { font-size: 16px; }
  .zone-labels { display: none; }
}
</style>
