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
          <div v-if="selectedBuilding.upgradeHistory?.length" class="detail-row">
            <span class="detail-label">升级</span>
            <span class="detail-value mono">LV.{{ selectedBuilding.upgradeHistory.length }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">建造</span>
            <span class="detail-value mono">{{ formatDate(selectedBuilding.constructedAt) }}</span>
          </div>
        </div>

        <!-- 投资局专属：资金账户 -->
        <div v-if="selectedInst.institutionId === 'bureau'" class="detail-section fund-section">
          <div class="detail-section-title">
            FUND_ACCOUNT
            <button class="fund-deposit-btn" @click="showDepositDialog = true">+ 充值</button>
          </div>
          <div class="fund-balance-row">
            <div class="fund-balance-block">
              <span class="fund-balance-label">可用余额</span>
              <span class="fund-balance-val">¥{{ adamStore.core.budget.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="fund-balance-block">
              <span class="fund-balance-label">累计入账</span>
              <span class="fund-balance-val positive">¥{{ adamStore.totalEarned.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</span>
            </div>
            <div class="fund-balance-block">
              <span class="fund-balance-label">累计支出</span>
              <span class="fund-balance-val negative">¥{{ adamStore.totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>

          <!-- 待执行转账指令 -->
          <div v-if="pendingTransfers.length > 0" class="fund-pending">
            <div class="fund-sub-title">⚡ 待执行指令</div>
            <div v-for="t in pendingTransfers" :key="t.id" class="transfer-card">
              <div class="transfer-info">
                <span class="transfer-to">→ {{ t.to }}</span>
                <span class="transfer-amount">¥{{ t.amount.toLocaleString() }}</span>
                <span class="transfer-note">{{ t.note }}</span>
              </div>
              <div class="transfer-actions">
                <button class="btn-gold btn-sm" @click="confirmTransfer(t.id)">已执行</button>
                <button class="btn-ghost btn-sm" @click="rejectTransfer(t.id)">拒绝</button>
              </div>
            </div>
          </div>

          <!-- 资金流水 -->
          <div class="fund-sub-title" style="margin-top:8px">资金流水</div>
          <div v-if="adamStore.ledger.length === 0" class="detail-empty">暂无流水</div>
          <div v-for="entry in [...adamStore.ledger].reverse().slice(0, 8)" :key="entry.id" class="ledger-row">
            <span class="ledger-dir" :class="entry.direction">{{ entry.direction === 'in' ? '↑' : '↓' }}</span>
            <span class="ledger-desc">{{ entry.title }}</span>
            <span class="ledger-amount" :class="entry.direction">{{ entry.direction === 'in' ? '+' : '-' }}¥{{ entry.amount.toLocaleString() }}</span>
            <span class="ledger-time">{{ formatTime(entry.at) }}</span>
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

        <!-- 贷款审批（仅金融机构显示） -->
        <div v-if="selectedId === 'finance_gateway' && pendingLoans.length" class="detail-section">
          <div class="detail-section-title">PENDING_LOANS <span class="tool-count">{{ pendingLoans.length }}</span></div>
          <div v-for="loan in pendingLoans" :key="loan.id" class="loan-item">
            <div class="loan-info">
              <span class="loan-amount">¥{{ loan.metadata?.amount }}</span>
              <span class="loan-purpose">{{ loan.metadata?.purpose }}</span>
            </div>
            <div class="loan-actions">
              <button class="loan-btn approve" @click="approveLoan(loan)">批准</button>
              <button class="loan-btn reject" @click="rejectLoan(loan)">拒绝</button>
            </div>
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
          @click="adamSelected = false"
          @contextmenu.prevent
          @touchstart.passive="onTouchStart"
        >
          <!-- 区域标签 -->
          <div class="zone-labels">
            <span class="zone-float-label command">COMMAND_CENTER</span>
            <span class="zone-float-label intelligence">INTELLIGENCE</span>
            <span class="zone-float-label commerce">COMMERCE</span>
            <span class="zone-float-label adam">ADAM_DOMAIN</span>
          </div>

          <div class="iso-scene" :style="sceneStyle">
            <!-- 地面网格：草地/路面三面立体地砖 -->
            <div
              v-for="cell in groundCells"
              :key="cell.key"
              class="iso-ground"
              :class="cell.type"
              :style="cell.style"
            >
              <div class="ground-top"></div>
              <div class="ground-left"></div>
              <div class="ground-right"></div>
            </div>
            <!-- 装饰树木 -->
            <div
              v-for="tree in decorTrees"
              :key="tree.key"
              class="deco-tree"
              :class="tree.size"
              :style="{ left: tree.x + 'px', top: tree.y + 'px' }"
            >
              <div class="tree-canopy"></div>
              <div class="tree-trunk"></div>
            </div>
            <!-- 建筑物 -->
            <div
              v-for="b in sortedBuildings"
              :key="b.key"
              class="iso-bldg"
              :class="{ locked: b.locked, selected: selectedId === b.instId }"
              :style="b.posStyle"
              :title="b.name"
              @click.stop="selectedId = b.instId; adamSelected = false"
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

            <!-- ═══ 亚当角色 ═══ -->
            <div
              v-if="adamStore.core.status !== 'shutdown'"
              class="adam-character"
              :class="{
                moving: adamStore.adamPosition.isMoving,
                dormant: adamStore.core.status === 'dormant',
                survival: adamStore.core.status === 'survival',
                working: adamWorking,
                selected: adamSelected,
              }"
              :style="adamCharStyle"
              @click.stop="selectAdam()"
            >
              <!-- 拖尾粒子 -->
              <div v-if="adamStore.adamPosition.isMoving" class="adam-trail">
                <span class="trail-dot" v-for="i in 3" :key="i" :style="{ animationDelay: (i * 0.15) + 's' }"></span>
              </div>
              <!-- 地面阴影 -->
              <svg class="adam-shadow" width="70" height="24" viewBox="0 0 70 24">
                <ellipse cx="35" cy="12" rx="30" ry="10" :fill="adamGlowColor" opacity="0.35" filter="url(#adamBlur)"/>
                <defs><filter id="adamBlur"><feGaussianBlur stdDeviation="4"/></filter></defs>
              </svg>
              <!-- SVG人物主体 — 卡通亚当 -->
              <img :src="adamAvatarUrl" class="adam-body-svg" alt="亚当" />
              <!-- 状态气泡（未选中时显示活动） -->
              <div v-if="!adamSelected && adamStore.adamPosition.activity" class="adam-bubble">
                <span class="bubble-text">{{ adamStore.adamPosition.activity }}</span>
              </div>
              <!-- 浮动状态卡片（点击后展开） -->
              <div v-if="adamSelected" class="adam-popup" @click.stop>
                <button class="adam-popup-close" @click.stop="clearSelection()">×</button>
                <div class="adam-popup-header">
                  <span class="adam-popup-name">ADAM #1</span>
                  <span class="adam-popup-tag" :class="adamStore.core.status">{{ adamStatusLabel }}</span>
                </div>
                <!-- 核心指标行 -->
                <div class="adam-popup-metrics">
                  <div class="adam-metric">
                    <span class="adam-metric-label">预算</span>
                    <span class="adam-metric-val" :class="{ warn: adamStore.core.budget <= 0 }">¥{{ adamStore.core.budget.toLocaleString() }}</span>
                  </div>
                  <div class="adam-metric">
                    <span class="adam-metric-label">信用</span>
                    <span class="adam-metric-val" :style="{ color: creditColorMap[adamStore.core.creditLevel] }">{{ adamStore.core.creditLevel }}</span>
                  </div>
                  <div class="adam-metric">
                    <span class="adam-metric-label">能量</span>
                    <span class="adam-metric-val">{{ adamStore.core.energy }}%</span>
                  </div>
                  <div class="adam-metric">
                    <span class="adam-metric-label">存活</span>
                    <span class="adam-metric-val">{{ adamStore.core.survivalDays }}天</span>
                  </div>
                </div>
                <!-- 情绪条 -->
                <div class="adam-popup-section">
                  <span class="adam-popup-section-title">EMOTION</span>
                  <div class="adam-popup-emotions">
                    <div v-for="(val, key) in adamStore.core.emotionState" :key="key" class="adam-emo-item">
                      <span class="adam-emo-label">{{ emotionLabelMap[key] }}</span>
                      <div class="adam-emo-track"><div class="adam-emo-fill" :style="{ width: val + '%', background: emotionColorMap[key] }"></div></div>
                    </div>
                  </div>
                </div>
                <!-- 最近留言 -->
                <div class="adam-popup-section">
                  <span class="adam-popup-section-title">MESSAGES</span>
                  <div v-if="latestReflections.length" class="adam-popup-messages">
                    <div v-for="r in latestReflections" :key="r.id" class="adam-msg-item">
                      <span class="adam-msg-time">{{ formatTime(r.at) }}</span>
                      <span class="adam-msg-text">{{ r.content }}</span>
                    </div>
                  </div>
                  <div v-else class="adam-msg-empty">还没有留言...</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 状态 HUD -->
          <div class="iso-hud">
            <span class="hud-item">
              <span class="hud-dot" :class="adamStore.core.status"></span>
              {{ adamHudText }}
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

  <!-- 充值弹窗 -->
  <div v-if="showDepositDialog" class="dialog-mask" @click.self="showDepositDialog = false">
    <div class="dialog-box">
      <div class="dialog-title">充值到亚当账户</div>
      <div class="dialog-desc">线下转账后，在此确认入账金额</div>
      <input v-model="depositAmount" type="number" class="dialog-input" placeholder="金额（元）" min="0" />
      <input v-model="depositNote" type="text" class="dialog-input" placeholder="备注（可选）" />
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showDepositDialog = false">取消</button>
        <button class="btn-gold" @click="handleDeposit">确认入账</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAdamStore } from '@/stores/adam'
import type { InvestmentInstitutionId, InvestmentToolId } from '@/types/investment'
import adamAvatarUrl from '@/assets/adam-avatar.png'

const adamStore = useAdamStore()

// ── 选中状态 ──
const selectedId = ref<InvestmentInstitutionId | null>(null)
const adamSelected = ref(false)

function selectAdam() {
  adamSelected.value = true
  selectedId.value = null
}
function clearSelection() {
  adamSelected.value = false
  selectedId.value = null
}

// ── 亚当行为状态 ──
const adamWorking = ref(false)
let workTimer: ReturnType<typeof setTimeout> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let moveDoneTimer: ReturnType<typeof setTimeout> | null = null

// ── 亚当 SVG 属性 ──
const creditColorMap: Record<string, string> = {
  C: '#8E99A4',
  B: '#5B8DEF',
  'B+': '#4FC3F7',
  A: '#F5A623',
  S: '#E040FB',
}

const adamCoatColor = computed(() => creditColorMap[adamStore.core.creditLevel] || '#8E99A4')
const adamHeadColor = computed(() => {
  const joy = adamStore.core.emotionState.joy
  if (joy > 60) return '#FFE0B2'
  if (adamStore.core.emotionState.fear > 60) return '#E8D5E0'
  return '#F5E6D3'
})
const adamEyeColor = computed(() => {
  const { joy, anger, sorrow, fear } = adamStore.core.emotionState
  if (anger > 60) return '#FF4D4D'
  if (joy > 60) return '#00E5A0'
  if (sorrow > 60) return '#5B8DEF'
  if (fear > 60) return '#F5A623'
  return '#00D4FF'
})
const adamGlowColor = computed(() => {
  if (adamStore.core.status === 'survival') return '#FF4D4D'
  return adamEyeColor.value
})
const adamLegColor = computed(() => {
  const coat = adamCoatColor.value
  // darken coat color slightly for legs
  return coat + 'CC'
})
const adamMouth = computed(() => {
  const { joy, sorrow, anger, fear } = adamStore.core.emotionState
  if (joy > 50) return 'smile'
  if (sorrow > 50 || fear > 50) return 'sad'
  return 'neutral'
})

const adamHudText = computed(() => {
  const status = adamStore.core.status
  if (status === 'dormant') return 'COGNITIVE: DORMANT'
  if (status === 'shutdown') return 'COGNITIVE: SHUTDOWN'
  if (adamStore.adamPosition.isMoving) return 'COGNITIVE: MOVING'
  if (adamWorking.value) return 'COGNITIVE: WORKING'
  return 'COGNITIVE: OBSERVING'
})

const adamStatusLabel = computed(() => {
  const map: Record<string, string> = { dormant: 'DORMANT', alive: 'ALIVE', survival: 'SURVIVAL', shutdown: 'SHUTDOWN' }
  return map[adamStore.core.status] || adamStore.core.status.toUpperCase()
})

const emotionLabelMap: Record<string, string> = {
  joy: '喜悦', anger: '愤怒', sorrow: '悲伤', fear: '恐惧',
  love: '热爱', disgust: '厌恶', desire: '渴望',
}
const emotionColorMap: Record<string, string> = {
  joy: '#00E5A0', anger: '#FF4D4D', sorrow: '#5B8DEF', fear: '#F5A623',
  love: '#E040FB', disgust: '#8E99A4', desire: '#FF6B35',
}

const latestReflections = computed(() =>
  [...adamStore.reflections].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5),
)

// ── 亚当位置 (等距坐标 → 屏幕坐标) ──
const adamCharStyle = computed(() => {
  const pos = adamStore.adamPosition
  // 当移动时使用目标坐标（CSS transition会平滑过渡）
  const gx = pos.isMoving ? pos.targetGridX : pos.gridX
  const gy = pos.isMoving ? pos.targetGridY : pos.gridY
  const { x, y } = isoToScreen(gx, gy)
  const dist = Math.abs(pos.targetGridX - pos.gridX) + Math.abs(pos.targetGridY - pos.gridY)
  const duration = Math.max(1, Math.min(4, dist * 0.3))
  return {
    left: x + 'px',
    top: y + 'px',
    zIndex: String(gx + gy + 1),
    transitionDuration: pos.isMoving ? `${duration}s` : '0.3s',
  }
})

// ── 监听移动：CSS transition 结束时标记到达 ──
watch(
  () => adamStore.adamPosition.isMoving,
  (moving) => {
    if (moving) {
      adamWorking.value = false
      // 计算移动时间，到达后触发
      const pos = adamStore.adamPosition
      const dist = Math.abs(pos.targetGridX - pos.gridX) + Math.abs(pos.targetGridY - pos.gridY)
      const duration = Math.max(1, Math.min(4, dist * 0.3)) * 1000
      if (moveDoneTimer) clearTimeout(moveDoneTimer)
      moveDoneTimer = setTimeout(() => {
        adamStore.adamArrived()
        // 到达后进入工作状态
        adamWorking.value = true
        if (workTimer) clearTimeout(workTimer)
        workTimer = setTimeout(() => {
          adamWorking.value = false
          adamStore.setAdamActivity('')
          // 工作完成后，一段时间后回到角落
          startIdleTimer()
        }, 4000)
      }, duration)
    }
  },
)

// ── 空闲计时器：空闲一段时间后回角落 ──
function startIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (!adamStore.adamPosition.isMoving && !adamWorking.value) {
      adamStore.adamGoHome()
      // 回家的移动也要处理到达
      const pos = adamStore.adamPosition
      const dist = Math.abs(pos.targetGridX - pos.gridX) + Math.abs(pos.targetGridY - pos.gridY)
      if (dist > 0) {
        const duration = Math.max(1, Math.min(4, dist * 0.3)) * 1000
        if (moveDoneTimer) clearTimeout(moveDoneTimer)
        moveDoneTimer = setTimeout(() => {
          adamStore.adamArrived()
        }, duration)
      }
    }
  }, 8000)
}

// ── 监听事件变化 ──
const eventCount = computed(() => adamStore.events.length)
watch(eventCount, () => {
  // 新事件会在 addEvent 中触发 moveAdamTo，这里不需要额外处理
  // 但要清除空闲计时器
  if (idleTimer) clearTimeout(idleTimer)
})

// ── 页面加载时启动空闲行为 ──
onMounted(() => {
  startIdleTimer()
})

onUnmounted(() => {
  if (workTimer) clearTimeout(workTimer)
  if (idleTimer) clearTimeout(idleTimer)
  if (moveDoneTimer) clearTimeout(moveDoneTimer)
})

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
        books: adamStore.books,
      }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result = ''
    let streamDone = false

    while (reader && !streamDone) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') { streamDone = true; break }
        try {
          const data = JSON.parse(payload)
          if (data.type === 'text') result += data.text
          else if (data.type === 'tool_result') {
            result += data.result || ''
            // build_structure：解析结果并写入 store
            if (tid === 'build_structure' && data.result) {
              try {
                const r = JSON.parse(data.result)
                if (r.institution && r.building) {
                  adamStore.addInstitution(r.institution)
                  adamStore.addBuilding(r.building)
                }
              } catch { /* ignore */ }
            }
          }
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

// ── 待审批贷款 ──
const pendingLoans = computed(() =>
  adamStore.events.filter(
    (e) => e.institutionId === 'finance_gateway' && e.metadata?.loanStatus === 'pending_approval',
  ),
)

function approveLoan(event: any) {
  const amount = Number(event.metadata?.amount) || 0
  const now = new Date().toISOString()
  const idStr = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  // 打钱进预算
  adamStore.addLedgerEntry({
    id: `led_loan_${idStr}`,
    at: now,
    kind: 'loan',
    amount,
    direction: 'in',
    title: `贷款到账 ¥${amount}（${event.metadata?.purpose || ''}）`,
    linkedEventIds: [event.id],
  })
  // 标记已审批
  event.metadata.loanStatus = 'approved'
  adamStore.persist()
}

function rejectLoan(event: any) {
  event.metadata.loanStatus = 'rejected'
  adamStore.persist()
}

// ── 左侧状态栏：按区域分组的机构 ──
const zoneList = computed(() => [
  { key: 'command', label: '指挥中心', items: adamStore.institutions.filter((i) => i.zone === 'command_center') },
  { key: 'intelligence', label: '情报研究区', items: adamStore.institutions.filter((i) => i.zone === 'intelligence') },
  { key: 'commerce', label: '商业生态区', items: adamStore.institutions.filter((i) => i.zone === 'commerce') },
  { key: 'adam', label: '亚当领地', items: adamStore.institutions.filter((i) => i.zone === 'adam_domain') },
])

const emojiMap: Record<string, string> = {
  bureau: '🏛', finance_gateway: '🏦', reactor: '⚡',
  intel_station: '📡', research_institute: '🔬', adam_academy: '🎓',
  data_center: '💾', risk_lab: '⚗️', arbitration_hall: '⚖️',
  ad_company: '📺', archive: '📚', corner: '🏠',
  marketing_consultancy: '📊', library: '📖',
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
  issue_recommendation: '发出指令',
  write_reflection: '写日记',
  consult_marketing_expert: '咨询营销顾问',
  browse_books: '查阅书架',
  add_book: '写书',
  recommend_book: '推荐书',
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

// ── 资金账户 ──────────────────────────────────────────
interface PendingTransfer {
  id: string
  to: string
  amount: number
  note: string
  createdAt: string
}

const showDepositDialog = ref(false)
const depositAmount = ref('')
const depositNote = ref('')
const pendingTransfers = ref<PendingTransfer[]>([])

function handleDeposit() {
  const amount = parseFloat(depositAmount.value)
  if (!amount || amount <= 0) return
  adamStore.addLedgerEntry({
    id: `ledger_${Date.now()}`,
    direction: 'in',
    amount,
    title: depositNote.value || '手动充值',
    kind: 'earning',
    at: new Date().toISOString(),
    linkedEventIds: [],
  })
  depositAmount.value = ''
  depositNote.value = ''
  showDepositDialog.value = false
}

function confirmTransfer(id: string) {
  const t = pendingTransfers.value.find(x => x.id === id)
  if (!t) return
  adamStore.addLedgerEntry({
    id: `ledger_${Date.now()}`,
    direction: 'out',
    amount: t.amount,
    title: `转账给 ${t.to}：${t.note}`,
    kind: 'cost',
    at: new Date().toISOString(),
    linkedEventIds: [],
  })
  pendingTransfers.value = pendingTransfers.value.filter(x => x.id !== id)
}

function rejectTransfer(id: string) {
  pendingTransfers.value = pendingTransfers.value.filter(x => x.id !== id)
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
  bureau:             { emoji: '🏛', h: 56, top: '#E8F4FD', left: '#B8D4E8', right: '#92BAD8' },
  finance_gateway:    { emoji: '🏦', h: 64, top: '#FFF3CD', left: '#F0CC70', right: '#D4A840' },
  reactor:            { emoji: '⚡', h: 68, top: '#FFE0CC', left: '#F4A460', right: '#D4844A' },
  intel_station:      { emoji: '📡', h: 72, top: '#D0F4FF', left: '#78CCEA', right: '#4AAED0' },
  research_institute: { emoji: '🔬', h: 60, top: '#E0F7FA', left: '#80DEEA', right: '#4DB6C8' },
  adam_academy:       { emoji: '🎓', h: 52, top: '#F3E5F5', left: '#CE93D8', right: '#AB5DBE' },
  data_center:        { emoji: '💾', h: 44, top: '#E0F2F1', left: '#80CBC4', right: '#4DB6AC' },
  risk_lab:           { emoji: '⚗️', h: 48, top: '#FFEBEE', left: '#EF9A9A', right: '#E57373' },
  arbitration_hall:   { emoji: '⚖️', h: 54, top: '#FFFDE7', left: '#FFF176', right: '#F9D900' },
  ad_company:         { emoji: '📺', h: 46, top: '#FCE4EC', left: '#F48FB1', right: '#E91E8C' },
  archive:            { emoji: '📚', h: 40, top: '#EFEBE9', left: '#BCAAA4', right: '#8D6E63' },
  corner:             { emoji: '🏠', h: 34, top: '#F1F8E9', left: '#AED581', right: '#8BC34A' },
  marketing_consultancy: { emoji: '📊', h: 58, top: '#E8F5E9', left: '#81C784', right: '#4CAF50' },
  library:               { emoji: '📖', h: 50, top: '#FFF8E1', left: '#FFD54F', right: '#FFC107' },
}
const defaultDef: BldgDef = { emoji: '🏗️', h: 36, top: '#F5F5F5', left: '#E0E0E0', right: '#BDBDBD' }

// 等轴测坐标转屏幕坐标
function isoToScreen(gx: number, gy: number) {
  const x = (gx - gy) * (TILE_W / 2)
  const y = (gx + gy) * (TILE_H / 2)
  return { x, y }
}

// 地面格子 — 全量铺满整个地图（避免空洞），区分草地/路面
const groundCells = computed(() => {
  const cells: Array<{ key: string; style: Record<string, string>; type: 'grass' | 'road' | 'path' }> = []

  // 建筑坐标集合
  const bldgCoords = new Set(adamStore.buildings.map(b => `${b.position.gridX},${b.position.gridY}`))
  // 路径集合：所有建筑周围1格
  const pathCoords = new Set<string>()
  for (const b of adamStore.buildings) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        pathCoords.add(`${b.position.gridX + dx},${b.position.gridY + dy}`)
      }
    }
  }

  // 计算需要渲染的范围（所有建筑的包围盒 + padding）
  if (adamStore.buildings.length === 0) return cells
  let minX = 999, minY = 999, maxX = 0, maxY = 0
  for (const b of adamStore.buildings) {
    minX = Math.min(minX, b.position.gridX)
    minY = Math.min(minY, b.position.gridY)
    maxX = Math.max(maxX, b.position.gridX)
    maxY = Math.max(maxY, b.position.gridY)
  }
  const PAD = 5
  minX = Math.max(0, minX - PAD)
  minY = Math.max(0, minY - PAD)
  maxX = Math.min(GROUND_SIZE - 1, maxX + PAD)
  maxY = Math.min(GROUND_SIZE - 1, maxY + PAD)

  for (let gx = minX; gx <= maxX; gx++) {
    for (let gy = minY; gy <= maxY; gy++) {
      const k = `${gx},${gy}`
      const { x, y } = isoToScreen(gx, gy)
      const type = bldgCoords.has(k) ? 'road' : pathCoords.has(k) ? 'path' : 'grass'
      cells.push({
        key: `g${gx}_${gy}`,
        type,
        style: {
          left: x + 'px',
          top: y + 'px',
          width: TILE_W + 'px',
          height: TILE_H + 'px',
        },
      })
    }
  }
  return cells
})

// 装饰树木 — 建筑之间的空隙随机放树
const decorTrees = computed(() => {
  const trees: Array<{ key: string; x: number; y: number; size: 'sm' | 'md' }> = []
  const bldgKeys = new Set(adamStore.buildings.map(b => `${b.position.gridX},${b.position.gridY}`))
  // 在已渲染格子里找草地角落种树（固定规律，不用随机，避免响应式重算）
  const treeSpots = [
    [2, 2], [6, 2], [2, 6], [10, 2], [2, 10],
    [4, 8], [8, 4], [12, 6], [6, 12], [14, 3],
    [3, 14], [16, 8], [8, 16], [18, 4], [4, 18],
  ]
  for (const [gx, gy] of treeSpots) {
    if (bldgKeys.has(`${gx},${gy}`)) continue
    const { x, y } = isoToScreen(gx, gy)
    trees.push({
      key: `tree_${gx}_${gy}`,
      x,
      y,
      size: (gx + gy) % 3 === 0 ? 'md' : 'sm',
    })
  }
  return trees
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
.zone-indicator.command { background: #F5A623; }
.zone-indicator.intelligence { background: #00D4FF; }
.zone-indicator.commerce { background: #059669; }
.zone-indicator.adam { background: #A78BFA; }

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
.loan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}
.loan-item:last-child { border-bottom: none; }
.loan-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.loan-amount { font-size: 13px; font-weight: 600; color: var(--bright); font-family: monospace; }
.loan-purpose { font-size: 10px; color: var(--dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loan-actions { display: flex; gap: 4px; flex-shrink: 0; }
.loan-btn {
  padding: 3px 10px;
  border-radius: 4px;
  border: none;
  font-size: 11px;
  cursor: pointer;
  font-weight: 600;
}
.loan-btn.approve { background: rgba(0, 229, 160, 0.15); color: #00E5A0; }
.loan-btn.approve:hover { background: rgba(0, 229, 160, 0.3); }
.loan-btn.reject { background: rgba(255, 77, 77, 0.1); color: #FF6B6B; }
.loan-btn.reject:hover { background: rgba(255, 77, 77, 0.2); }

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
  filter: drop-shadow(2px 4px 4px rgba(80,100,60,0.18))
          brightness(1.12)
          drop-shadow(0 0 12px rgba(255,200,50,0.7));
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
    radial-gradient(ellipse at 40% 35%, #deeeff 0%, #e8f4f8 40%, #f0f6ef 100%);
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
.zone-float-label.command { top: 12px; left: 16px; color: #c07000; }
.zone-float-label.intelligence { top: 12px; right: 16px; color: #0077aa; }
.zone-float-label.commerce { bottom: 40px; left: 16px; color: #2e7d32; }
.zone-float-label.adam { bottom: 40px; right: 16px; color: #6a1b9a; }

.iso-scene {
  position: relative;
  left: 50%;
  top: 60px;
  width: 0;
  height: 0;
  transform-origin: 0 0;
  transition: transform 0.05s linear;
}

/* ── 地面三面立体地砖 ── */
.iso-ground {
  position: absolute;
  pointer-events: none;
  width: 80px;
  height: 40px;
}

/* 顶面 — 等距菱形 */
.ground-top {
  position: absolute;
  left: 0; top: 0;
  width: 80px;
  height: 40px;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}
/* 左侧面 — 平行四边形，贴菱形左下边 */
.ground-left {
  position: absolute;
  left: 0;
  top: 20px;
  width: 40px;
  height: 12px;
  clip-path: polygon(0% 0%, 100% 0%, 50% 100%, -50% 100%);
  transform: skewY(26.565deg);
  transform-origin: top left;
}
/* 右侧面 */
.ground-right {
  position: absolute;
  right: 0;
  top: 20px;
  width: 40px;
  height: 12px;
  clip-path: polygon(0% 0%, 100% 0%, 150% 100%, 50% 100%);
  transform: skewY(-26.565deg);
  transform-origin: top right;
}

/* 草地配色 */
.iso-ground.grass .ground-top    { background: #7CB342; }
.iso-ground.grass .ground-left   { background: #4a7a1e; }
.iso-ground.grass .ground-right  { background: #5d8f28; }

/* 路径（建筑周边1格） */
.iso-ground.path .ground-top    { background: #AED581; }
.iso-ground.path .ground-left   { background: #6a8f3a; }
.iso-ground.path .ground-right  { background: #80a848; }

/* 道路（建筑正下方） */
.iso-ground.road .ground-top    { background: #CFD8DC; }
.iso-ground.road .ground-left   { background: #90A4AE; }
.iso-ground.road .ground-right  { background: #B0BEC5; }

/* ── 等轴测建筑 ── */
.iso-bldg {
  position: absolute;
  width: 64px;
  height: 32px;
  cursor: pointer;
  transition: filter 0.2s;
  filter: drop-shadow(2px 4px 4px rgba(80,100,60,0.18));
}
.iso-bldg:hover {
  filter: drop-shadow(2px 4px 4px rgba(80,100,60,0.18))
          brightness(1.08)
          drop-shadow(0 0 8px rgba(255,255,255,0.5));
}
.iso-bldg.locked { opacity: 0.4; filter: saturate(0.15) brightness(0.85); }

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
  border-right: 1px solid rgba(0,0,0,0.08);
  box-shadow: inset -1px 0 0 rgba(255,255,255,0.25);
}

/* 右墙 */
.wall-right {
  right: 0;
  transform-origin: bottom right;
  transform: skewY(-26.565deg);
  border-left: 1px solid rgba(0,0,0,0.06);
}

/* 窗户 */
.windows {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 100%;
  padding: 8px 4px;
}
.win-row { display: flex; gap: 4px; }
.win {
  width: 7px;
  height: 6px;
  background: rgba(255,255,240,0.70);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 1px;
}
.wall-right .win {
  background: rgba(255,255,240,0.45);
  border-color: rgba(255,255,255,0.3);
}

/* 屋顶 — 菱形 */
.roof {
  position: absolute;
  left: 0;
  width: 64px;
  height: 32px;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow:
    inset 0 3px 0 rgba(255,255,255,0.55),
    inset 0 -1px 0 rgba(0,0,0,0.08);
}

/* 图标浮在屋顶上方 */
.bldg-icon {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  line-height: 1;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25));
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
  color: #3d4a2e;
  white-space: nowrap;
  text-shadow: 0 1px 0 rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.8);
  opacity: 0.7;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.03em;
  transition: opacity 0.2s;
}
.iso-bldg:hover .bldg-name { opacity: 1; }
.iso-bldg.selected .bldg-name { opacity: 1; color: #c07000; }

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
  color: #3d5030;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.6;
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
  color: #4a5a3a;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
  opacity: 0.45;
}

/* ── 装饰树木 ── */
.deco-tree {
  position: absolute;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-10px) translateY(-52px);
  z-index: 5;
}
.deco-tree.md { transform: translateX(-14px) translateY(-64px); }

.tree-canopy {
  width: 28px;
  height: 28px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: radial-gradient(circle at 40% 35%, #8BC34A, #558B2F);
  box-shadow: inset -3px -2px 0 rgba(0,0,0,0.12), 2px 3px 4px rgba(60,80,30,0.2);
}
.deco-tree.md .tree-canopy {
  width: 36px;
  height: 36px;
}

.tree-trunk {
  width: 6px;
  height: 10px;
  background: #8D6E63;
  border-radius: 1px;
  box-shadow: inset -1px 0 0 rgba(0,0,0,0.2);
}
.deco-tree.md .tree-trunk {
  width: 8px;
  height: 13px;
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

/* ═══════════════════════════════════════════
   亚当角色 — SVG 数字少年
   ═══════════════════════════════════════════ */

.adam-character {
  position: absolute;
  width: 80px;
  height: 120px;
  cursor: pointer;
  transition-property: left, top;
  transition-timing-function: ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-8px) translateY(-120px);
}
.adam-character:hover {
  filter: brightness(1.15) drop-shadow(0 0 8px rgba(0,212,255,0.4));
}
.adam-character.selected {
  filter: brightness(1.2) drop-shadow(0 0 12px rgba(245,166,35,0.6));
}

.adam-character.dormant {
  opacity: 0.7;
  filter: saturate(0.3) brightness(0.9);
}

.adam-character.survival .adam-body-svg {
  animation: survivalFlash 1.2s ease-in-out infinite;
}
@keyframes survivalFlash {
  0%, 100% { filter: none; }
  50% { filter: brightness(1.5) drop-shadow(0 0 6px rgba(255,77,77,0.8)); }
}

/* 行走动画 */
.adam-character.moving .adam-leg-l {
  animation: walkLegL 0.5s ease-in-out infinite;
  transform-origin: 33px 78px;
}
.adam-character.moving .adam-leg-r {
  animation: walkLegR 0.5s ease-in-out infinite;
  transform-origin: 47px 78px;
}
@keyframes walkLegL {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
}
@keyframes walkLegR {
  0%, 100% { transform: rotate(8deg); }
  50% { transform: rotate(-8deg); }
}

/* 行走时手臂摆动 */
.adam-character.moving .adam-arm-l {
  animation: walkArmL 0.5s ease-in-out infinite;
  transform-origin: 25px 42px;
}
.adam-character.moving .adam-arm-r {
  animation: walkArmR 0.5s ease-in-out infinite;
  transform-origin: 55px 42px;
}
@keyframes walkArmL {
  0%, 100% { transform: rotate(6deg); }
  50% { transform: rotate(-6deg); }
}
@keyframes walkArmR {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}

/* 行走时上下弹跳 */
.adam-character.moving .adam-body-svg {
  animation: walkBounce 0.25s ease-in-out infinite;
}
@keyframes walkBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* 工作动画 */
.adam-character.working .adam-arm-l {
  animation: workArm 0.8s ease-in-out infinite;
  transform-origin: 25px 42px;
}
.adam-character.working .adam-arm-r {
  animation: workArm 0.8s ease-in-out infinite reverse;
  transform-origin: 55px 42px;
}
@keyframes workArm {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-15deg); }
}

/* 空闲呼吸动画 */
.adam-character:not(.moving):not(.working) .adam-body-svg {
  animation: idleBreathe 3s ease-in-out infinite;
}
@keyframes idleBreathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
}

/* 地面阴影 */
.adam-shadow {
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
}
.adam-character.moving .adam-shadow {
  animation: shadowPulse 0.5s ease-in-out infinite;
}
@keyframes shadowPulse {
  0%, 100% { transform: translateX(-50%) scaleX(1); }
  50% { transform: translateX(-50%) scaleX(0.8); }
}

/* SVG 主体 */
.adam-body-svg {
  position: relative;
  z-index: 2;
  width: 80px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

/* 拖尾粒子 */
.adam-trail {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 3px;
  z-index: 0;
}
.trail-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
  animation: trailFade 0.6s ease-out forwards;
}
@keyframes trailFade {
  0% { opacity: 0.6; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(-8px); }
}

/* 状态气泡 */
.adam-bubble {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 6px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 3px 8px;
  white-space: nowrap;
  z-index: 100;
  animation: bubbleIn 0.3s ease-out;
}
.bubble-text {
  font-size: 8px;
  font-weight: 600;
  color: #fff;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.03em;
}
.adam-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.75);
}
@keyframes bubbleIn {
  0% { opacity: 0; transform: translateX(-50%) translateY(4px); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* ═══════════════════════════════════════════
   亚当浮动状态卡片
   ═══════════════════════════════════════════ */
.adam-popup {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  width: 260px;
  background: rgba(15, 15, 20, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 12px;
  z-index: 200;
  animation: popupIn 0.25s ease-out;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.adam-popup::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(15, 15, 20, 0.92);
}
@keyframes popupIn {
  0% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

.adam-popup-close {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.4);
  font-size: 14px;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.adam-popup-close:hover { color: #fff; background: rgba(255,255,255,0.1); }

.adam-popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.adam-popup-name {
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
}
.adam-popup-tag {
  font-size: 8px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
}
.adam-popup-tag.alive { background: rgba(0,229,160,0.15); color: #00E5A0; }
.adam-popup-tag.dormant { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
.adam-popup-tag.survival { background: rgba(255,77,77,0.15); color: #FF4D4D; }

.adam-popup-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 10px;
}
.adam-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: rgba(255,255,255,0.04);
  border-radius: 4px;
}
.adam-metric-label {
  font-size: 9px;
  color: rgba(255,255,255,0.4);
}
.adam-metric-val {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.adam-metric-val.warn { color: #FF4D4D; }

.adam-popup-section {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 8px;
  margin-top: 8px;
}
.adam-popup-section-title {
  font-size: 8px;
  font-weight: 700;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  margin-bottom: 6px;
  display: block;
}

/* 情绪迷你条 */
.adam-popup-emotions {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.adam-emo-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.adam-emo-label {
  font-size: 8px;
  color: rgba(255,255,255,0.35);
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}
.adam-emo-track {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
}
.adam-emo-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* 留言列表 */
.adam-popup-messages {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.adam-msg-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 6px;
  background: rgba(255,255,255,0.03);
  border-radius: 4px;
  border-left: 2px solid rgba(0,212,255,0.3);
}
.adam-msg-time {
  font-size: 7px;
  color: rgba(255,255,255,0.25);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.adam-msg-text {
  font-size: 10px;
  color: rgba(255,255,255,0.75);
  line-height: 1.4;
  word-break: break-all;
}
.adam-msg-empty {
  font-size: 9px;
  color: rgba(255,255,255,0.2);
  font-style: italic;
}

/* ── 资金账户 ── */
.fund-section { display: flex; flex-direction: column; gap: 8px; }
.fund-deposit-btn { margin-left: auto; padding: 2px 8px; font-size: 10px; background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.3); border-radius: 4px; color: #F5A623; cursor: pointer; }
.fund-deposit-btn:hover { background: rgba(245,166,35,0.2); }
.fund-balance-row { display: flex; gap: 16px; flex-wrap: wrap; }
.fund-balance-block { display: flex; flex-direction: column; gap: 2px; }
.fund-balance-label { font-size: 9px; color: var(--muted); letter-spacing: 0.08em; }
.fund-balance-val { font-size: 14px; font-weight: 700; color: #e8e8e0; font-family: 'SF Mono', monospace; }
.fund-balance-val.positive { color: #00E5A0; }
.fund-balance-val.negative { color: #FF4D4D; }
.fund-sub-title { font-size: 9px; color: var(--muted); letter-spacing: 0.1em; }
.fund-pending { display: flex; flex-direction: column; gap: 4px; }
.transfer-card { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: rgba(245,166,35,0.05); border: 1px solid rgba(245,166,35,0.15); border-radius: 4px; }
.transfer-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.transfer-to { font-size: 11px; color: #e8e8e0; font-family: 'SF Mono', monospace; }
.transfer-amount { font-size: 12px; font-weight: 700; color: #F5A623; font-family: 'SF Mono', monospace; }
.transfer-note { font-size: 10px; color: var(--muted); }
.transfer-actions { display: flex; gap: 4px; }
.btn-sm { padding: 2px 8px !important; font-size: 10px !important; }
.ledger-row { display: flex; align-items: center; gap: 6px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 11px; }
.ledger-dir { font-size: 12px; width: 12px; text-align: center; }
.ledger-dir.in { color: #00E5A0; }
.ledger-dir.out { color: #FF4D4D; }
.ledger-desc { flex: 1; color: #c8c8c0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ledger-amount { font-family: 'SF Mono', monospace; font-weight: 600; white-space: nowrap; }
.ledger-amount.in { color: #00E5A0; }
.ledger-amount.out { color: #FF4D4D; }
.ledger-time { color: var(--muted); font-size: 10px; font-family: 'SF Mono', monospace; white-space: nowrap; }

/* ── 充值弹窗 ── */
.dialog-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.dialog-box { background: #1a1a1e; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 24px; width: 300px; display: flex; flex-direction: column; gap: 12px; }
.dialog-title { font-size: 13px; font-weight: 700; color: #e8e8e0; letter-spacing: 0.05em; }
.dialog-desc { font-size: 11px; color: var(--muted); }
.dialog-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px 10px; color: #e8e8e0; font-size: 13px; outline: none; }
.dialog-input:focus { border-color: rgba(245,166,35,0.4); }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-gold { padding: 5px 14px; background: rgba(245,166,35,0.15); border: 1px solid rgba(245,166,35,0.4); border-radius: 5px; color: #F5A623; font-size: 12px; cursor: pointer; }
.btn-gold:hover { background: rgba(245,166,35,0.25); }
.btn-ghost { padding: 5px 14px; background: transparent; border: 1px solid rgba(255,255,255,0.15); border-radius: 5px; color: #888; font-size: 12px; cursor: pointer; }
.btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #aaa; }
</style>
