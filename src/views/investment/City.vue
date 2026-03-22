<template>
  <div class="city-page">
    <!-- 左侧状态栏 -->
    <aside class="city-sidebar">
      <div class="sidebar-section">
        <div class="sidebar-section-title">核心生存区</div>
        <div
          v-for="inst in coreInstitutions"
          :key="inst.institutionId"
          class="inst-item"
          :class="inst.status"
        >
          <span class="inst-emoji">{{ getEmoji(inst.institutionId) }}</span>
          <div class="inst-info">
            <span class="inst-name">{{ inst.name }}</span>
            <span class="inst-status-label">{{ statusLabel(inst.status) }}</span>
          </div>
          <span class="inst-dot" :class="inst.status"></span>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title">能力成长区</div>
        <div
          v-for="inst in growthInstitutions"
          :key="inst.institutionId"
          class="inst-item"
          :class="inst.status"
        >
          <span class="inst-emoji">{{ getEmoji(inst.institutionId) }}</span>
          <div class="inst-info">
            <span class="inst-name">{{ inst.name }}</span>
            <span class="inst-status-label">{{ statusLabel(inst.status) }}</span>
          </div>
          <span class="inst-dot" :class="inst.status"></span>
        </div>
      </div>
      <div class="sidebar-section">
        <div class="sidebar-section-title">社会关系区</div>
        <div
          v-for="inst in socialInstitutions"
          :key="inst.institutionId"
          class="inst-item"
          :class="inst.status"
        >
          <span class="inst-emoji">{{ getEmoji(inst.institutionId) }}</span>
          <div class="inst-info">
            <span class="inst-name">{{ inst.name }}</span>
            <span class="inst-status-label">{{ statusLabel(inst.status) }}</span>
          </div>
          <span class="inst-dot" :class="inst.status"></span>
        </div>
      </div>
    </aside>

    <!-- 右侧像素城市 -->
    <div class="city-main">
      <div class="panel panel-observatory">
        <div class="panel-header">
          <span class="panel-title">亚当的世界</span>
          <span class="panel-badge">Phase 1</span>
        </div>
        <div
          ref="viewportRef"
          class="iso-viewport"
          @wheel.prevent="onWheel"
          @mousedown="onDragStart"
          @contextmenu.prevent
          @touchstart.passive="onTouchStart"
        >
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
              :class="{ locked: b.locked }"
              :style="b.posStyle"
              :title="b.name"
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
          <div class="iso-hint">
            <span>{{ adamStore.core.status === 'dormant' ? '认知：休眠中' : '认知：观测中' }}</span>
            <span>滚轮缩放 · 左键平移 · 右键旋转</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useAdamStore } from '@/stores/adam'

const adamStore = useAdamStore()

// ── 左侧状态栏：按区域分组的机构 ──
const coreInstitutions = computed(() =>
  adamStore.institutions.filter((i) => i.zone === 'core_survival'),
)
const growthInstitutions = computed(() =>
  adamStore.institutions.filter((i) => i.zone === 'ability_growth'),
)
const socialInstitutions = computed(() =>
  adamStore.institutions.filter((i) => i.zone === 'social_relation'),
)

const emojiMap: Record<string, string> = {
  bureau: '🏛', finance_gateway: '🏦', vault: '🔐', reactor: '⚡',
  intel_station: '📡', research_institute: '🔬', adam_academy: '🎓',
  data_center: '💾', risk_lab: '⚗️', arbitration_hall: '⚖️',
  ad_company: '📺', archive: '📚', corner: '🏠',
}
function getEmoji(id: string) { return emojiMap[id] || '🏗️' }

function statusLabel(status: string) {
  const map: Record<string, string> = { idle: '待命', active: '运行中', locked: '未解锁', busy: '忙碌', error: '异常' }
  return map[status] || status
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
  vault:              { emoji: '🔐', h: 32, top: '#A78BFA', left: '#7C5FC7', right: '#5B4399' },
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
.city-page {
  height: 100%;
  display: flex;
  gap: 0;
}

/* ── 左侧状态栏 ── */
.city-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow-y: auto;
  margin-right: 16px;
  scrollbar-width: thin;
}
.sidebar-section {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}
.sidebar-section:last-child { border-bottom: none; }
.sidebar-section-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  margin-bottom: 10px;
  letter-spacing: 0.05em;
}
.inst-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  margin-bottom: 2px;
  transition: background 0.15s;
  cursor: default;
}
.inst-item:hover { background: var(--faint); }
.inst-item.locked { opacity: 0.45; }
.inst-emoji { font-size: 16px; flex-shrink: 0; }
.inst-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.inst-name { font-size: 12px; font-weight: 600; color: var(--dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.inst-status-label { font-size: 9px; color: var(--dim); }
.inst-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.inst-dot.idle { background: var(--dim); }
.inst-dot.active { background: #00E5A0; }
.inst-dot.locked { background: var(--border); }
.inst-dot.busy { background: #F5A623; animation: instpulse 1.5s ease-in-out infinite; }
.inst-dot.error { background: #FF4D4D; }
@keyframes instpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

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
  border-radius: 10px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.panel-title { font-size: 12px; font-weight: 700; color: var(--dark); }
.panel-badge {
  font-size: 9px; font-weight: 600; color: var(--dim);
  border: 1px solid var(--border); padding: 2px 6px;
  border-radius: 4px; font-family: 'SF Mono', 'Fira Code', monospace;
}

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
    radial-gradient(ellipse at center, var(--faint) 0%, transparent 70%);
}
.iso-viewport:active { cursor: grabbing; }

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
.iso-bldg:hover { filter: brightness(1.2); }
.iso-bldg.locked { opacity: 0.4; filter: saturate(0.3); }

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
  font-size: 20px;
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
  font-size: 9px;
  font-weight: 700;
  color: var(--dark);
  white-space: nowrap;
  text-shadow: 0 1px 2px var(--card-bg), 0 0 4px var(--card-bg);
  opacity: 0.75;
  transition: opacity 0.2s;
}
.iso-bldg:hover .bldg-name { opacity: 1; }

/* 提示文字 */
.iso-hint {
  position: absolute;
  bottom: 10px;
  right: 14px;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.iso-hint span {
  font-size: 9px;
  color: var(--dim);
}

@media (max-width: 767px) {
  .city-page { flex-direction: column; }
  .city-sidebar { width: 100%; margin-right: 0; margin-bottom: 12px; border-radius: 10px; max-height: 200px; }
  .sidebar-section { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 10px; }
  .sidebar-section-title { width: 100%; margin-bottom: 4px; }
  .inst-item { padding: 4px 6px; }
  .iso-viewport { min-height: 300px; }
  .bldg-icon { font-size: 16px; }
}
</style>
