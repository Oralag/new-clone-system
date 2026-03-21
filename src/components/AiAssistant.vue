<template>
  <!-- Floating trigger button -->
  <div
    v-show="route.path !== '/mobile/apps'"
    class="ai-trigger"
    :style="{ bottom: triggerBottom + 'px', right: triggerRight + 'px' }"
    @mousedown="onTriggerDragStart"
    @touchstart.passive="onTriggerTouchStart"
    @click="onTriggerClick"
    :title="isOpen ? '关闭ERP管家' : '打开ERP管家'"
  >
    <el-icon :size="22"><ChatRound /></el-icon>
    <span class="ai-trigger-label">ERP管家</span>
    <el-badge v-if="unread > 0" :value="unread" class="ai-badge" />
  </div>

  <!-- Chat panel -->
  <transition name="chat-slide">
    <div
      v-if="isOpen"
      class="ai-chat-panel"
      :style="{ bottom: panelBottom + 'px', right: panelRight + 'px' }"
      @click.stop
    >
      <!-- Header — drag handle -->
      <div class="chat-header" @mousedown="onPanelDragStart" @touchstart.passive="onPanelTouchStart">
        <div class="chat-header-info">
          <div class="chat-avatar">
            <el-icon :size="18"><Cpu /></el-icon>
          </div>
          <div>
            <div class="chat-name">ERP 管家</div>
            <div class="chat-status">{{ isLoading ? '正在处理...' : '在线 · ERP 数据专属' }}</div>
          </div>
        </div>
        <div class="chat-header-actions">
          <el-tooltip content="历史会话">
            <el-button :icon="Clock" circle size="small" plain @click="showHistory = !showHistory" />
          </el-tooltip>
          <el-tooltip content="清空对话">
            <el-button :icon="Delete" circle size="small" plain @click="clearMessages" />
          </el-tooltip>
          <el-button :icon="Close" circle size="small" plain @click="isOpen = false" />
        </div>
      </div>

      <!-- Messages -->
      <div ref="messagesRef" class="chat-messages">

        <!-- 历史会话面板 -->
        <transition name="slide-down">
          <div v-if="showHistory" class="history-panel">
            <div class="history-panel-header">
              <span>历史会话</span>
              <el-button link size="small" @click="showHistory = false">收起</el-button>
            </div>
            <div v-if="sessions.length === 0" class="history-empty">暂无历史会话</div>
            <div
              v-for="(s, i) in sessions"
              :key="s.time"
              class="history-item"
              @click="restoreSession(i)"
            >
              <div class="history-item-title">{{ s.summary }}</div>
              <div class="history-item-meta">{{ s.time }} · {{ s.count }}条消息</div>
            </div>
          </div>
        </transition>
        <!-- Welcome message -->
        <div class="chat-welcome" v-if="messages.length === 0">
          <el-icon :size="40" color="#165dff"><Cpu /></el-icon>
          <p class="welcome-title">你好！我是 ERP 管家</p>
          <p class="welcome-sub">负责 ERP 数据录入、查询、导航，直接告诉我你要做什么</p>
          <div class="quick-prompts">
            <el-tag
              v-for="p in quickPrompts"
              :key="p"
              class="quick-tag"
              type="info"
              @click="sendQuickPrompt(p)"
            >{{ p }}</el-tag>
          </div>
          <!-- BOM生产计划 -->
          <div class="bom-quick-btn" @click="openBomDialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h10M7 12h6"/></svg>
            一键生产BOM
          </div>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="message-item"
          :class="[
            msg.role === 'user' ? 'message-user' : 'message-assistant',
            msg.isAck ? 'message-ack' : ''
          ]"
        >
          <div
            class="message-avatar"
            :style="msg.agentId && msg.role === 'assistant' ? { background: getAgentColor(msg.agentId), color: '#fff' } : {}"
            :title="msg.agentName"
          >
            <span v-if="msg.agentEmoji && msg.role === 'assistant'" class="agent-emoji">{{ msg.agentEmoji }}</span>
            <el-icon v-else-if="msg.role === 'assistant'"><Cpu /></el-icon>
            <el-icon v-else><User /></el-icon>
          </div>
          <div class="message-bubble">
            <!-- Agent 标签（非Captain且非普通assistant才显示） -->
            <div v-if="msg.agentId && msg.agentId !== 'captain' && msg.role === 'assistant'" class="agent-label" :style="{ color: getAgentColor(msg.agentId) }">
              {{ msg.agentEmoji }} {{ msg.agentName }}
            </div>
            <!-- Captain 标签 -->
            <div v-else-if="msg.agentId === 'captain' && msg.role === 'assistant'" class="agent-label captain-label">
              🎯 Captain
            </div>
            <div v-if="msg.images?.length" class="message-images">
              <img
                v-for="(url, i) in msg.images"
                :key="i"
                :src="url"
                class="message-img"
                @click="previewImage(url)"
              />
            </div>
            <AiToolCallCard
              v-for="tc in msg.toolCalls"
              :key="tc.id"
              :name="tc.name"
              :input="tc.input"
              :result="tc.result"
              :status="tc.status"
            />
            <div class="message-content" v-html="renderMarkdown(msg.content)" />
            <div v-if="msg.navRoute" class="message-nav-btn">
              <el-button type="primary" size="small" @click="navigateTo(msg.navRoute!)">立即查看 →</el-button>
            </div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>

        <!-- Streaming indicator -->
        <div v-if="isLoading" class="message-item message-assistant">
          <div class="message-avatar"><el-icon><Cpu /></el-icon></div>
          <div class="message-bubble">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 录入执行状态（自动执行，显示结果） -->
      <div v-if="pendingAction" class="action-preview">
        <div class="action-preview-title">
          <el-icon><Loading /></el-icon>
          正在录入数据...
        </div>
        <div class="action-preview-content">{{ JSON.stringify(pendingAction.data, null, 2) }}</div>
      </div>      <!-- Input area -->
      <div class="chat-input-area">
        <!-- Pending images preview -->
        <div v-if="pendingImages.length" class="pending-images">
          <div v-for="(img, idx) in pendingImages" :key="idx" class="pending-img-wrap">
            <img :src="img.previewUrl" class="pending-img" />
            <el-icon class="pending-img-remove" @click="removePendingImage(idx)"><Close /></el-icon>
          </div>
        </div>

        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="chat-native-textarea"
          rows="2"
          :placeholder="isRecording ? '正在聆听，请说话...' : '输入业务描述，或上传单据图片让AI识别录入...'"
          :disabled="isLoading"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          enterkeyhint="send"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="inputText += '\n'"
        />
        <div class="input-footer">
          <el-tooltip content="上传单据图片">
            <el-button :icon="Picture" circle size="small" plain @click="openImagePicker" :disabled="isLoading" />
          </el-tooltip>
          <button
            v-if="voiceSupported"
            class="mic-hold-btn"
            :class="{ 'mic-hold-btn--active': isRecording, 'mic-hold-btn--cancel': isCancelling }"
            :disabled="isLoading"
            @mousedown.prevent="onMicDown"
            @mouseup.prevent="onMicUp"
            @touchstart.prevent="onMicDown"
            @touchend.prevent="onMicUp"
            @touchcancel.prevent="onMicCancel"
          >
            <el-icon><Microphone /></el-icon>
            <span>{{ isCancelling ? '松手取消' : isRecording ? '松手发送' : '按住说话' }}</span>
          </button>
          <button v-if="isIOS" class="mic-hold-btn" @click="showIOSVoiceTip" :disabled="isLoading">
            <el-icon><Microphone /></el-icon>
            <span>按住说话</span>
          </button>

          <!-- 长按录音遮罩 -->
          <transition name="fade">
            <div v-if="isRecording" class="voice-overlay">
              <div class="voice-wave">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
              <p>正在聆听，松手发送</p>
              <div class="voice-cancel-hint" :class="{ 'voice-cancel-hint--active': isCancelling }">
                ↑ 上滑取消
              </div>
            </div>
          </transition>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            style="display:none"
            @change="onFileChange"
          />
          <span class="input-hint">Enter 发送 · Shift+Enter 换行</span>
          <el-button
            type="primary"
            :icon="Promotion"
            :loading="isLoading"
            :disabled="!inputText.trim() && !pendingImages.length"
            @click="sendMessage"
          >发送</el-button>
        </div>
      </div>
    </div>
  </transition>

  <!-- Backdrop — click to close -->
  <transition name="fade">
    <div v-if="isOpen" class="ai-backdrop" @click="isOpen = false" />
  </transition>

  <!-- 一键生产BOM弹框 -->
  <el-dialog v-model="bomDialogVisible" title="一键生产成品BOM计划" width="760px" append-to-body :close-on-click-modal="false">
    <div class="gen-dialog">
      <!-- Step 1: 选择产品 -->
      <div class="gen-section">
        <div class="gen-section-title">
          <el-icon><GoodsFilled /></el-icon> 选择要生产的产品
        </div>
        <div class="gen-search-row">
          <el-input v-model="genSearch" placeholder="搜索产品名称…" clearable style="width:220px" @input="filterGenGoods" />
          <span class="gen-hint">共 {{ filteredGenGoods.length }} 个有BOM的产品</span>
          <el-button size="small" :loading="bomLoading" @click="loadBomProducts">{{ bomLoading ? '加载中…' : '刷新' }}</el-button>
        </div>
        <div class="gen-goods-grid">
          <div
            v-for="g in filteredGenGoods" :key="g.goods_id"
            :class="['gen-goods-card', { selected: selectedGenGoods.has(g.goods_id) }]"
            @click="toggleGenGoods(g)"
          >
            <div class="gen-goods-name">{{ g.goods_name }}</div>
            <div class="gen-goods-meta">
              <span class="gen-canmake" :class="g.canMake > 0 ? 'ok' : 'lack'">可生产: {{ g.canMake }}</span>
            </div>
            <div v-if="selectedGenGoods.has(g.goods_id)" class="gen-qty-row" @click.stop>
              <span class="gen-qty-label">数量</span>
              <el-input-number v-model="genQtyMap[g.goods_id]" :min="1" :max="g.canMake || 9999" size="small" controls-position="right" style="width:110px" />
              <span class="gen-unit">{{ g.unit_name || '' }}</span>
            </div>
            <el-icon v-if="selectedGenGoods.has(g.goods_id)" class="gen-check"><Select /></el-icon>
          </div>
        </div>
        <div v-if="filteredGenGoods.length === 0 && !bomLoading" class="empty-tip">没有找到有BOM配置的产品</div>
      </div>

      <!-- Step 2: 仓库 + 日期 -->
      <div class="gen-section" v-if="selectedGenGoods.size > 0">
        <div class="gen-section-title"><el-icon><SetUp /></el-icon> 配置生产参数</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="field-row">
              <span class="field-label required">成品入库仓库</span>
              <el-select v-model="genWarehouse" placeholder="选择仓库" style="flex:1">
                <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="field-row">
              <span class="field-label">计划日期</span>
              <el-date-picker v-model="genDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="flex:1" />
            </div>
          </el-col>
        </el-row>
        <el-row style="margin-top:10px">
          <el-col :span="24">
            <div class="field-row">
              <span class="field-label">备注</span>
              <el-input v-model="genRemark" placeholder="可选备注" style="flex:1" />
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 预览 -->
      <div class="gen-section" v-if="genPreviewList.length > 0">
        <div class="gen-section-title"><el-icon><Document /></el-icon> 生产预览（BOM原料消耗）</div>
        <el-table :data="genPreviewList" size="small" border style="width:100%">
          <el-table-column prop="goods_name" label="成品" min-width="120" />
          <el-table-column prop="qty" label="生产数量" width="90" align="right" />
          <el-table-column prop="unit_name" label="单位" width="70" align="center" />
          <el-table-column prop="materials" label="消耗原料" min-width="200">
            <template #default="{ row }">
              <div v-for="m in row.materials" :key="m._matGoodsId || m.material_id" class="mat-row">
                <span class="mat-name">{{ m.material_name || m.goods_name }}</span>
                <span class="mat-qty">×{{ m.num * row.qty }}</span>
                <el-tag size="small" :type="m.stockOk ? 'success' : 'danger'" style="margin-left:4px">库存{{ m.stock_num ?? '?' }}</el-tag>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 日志 -->
      <div class="gen-log" v-if="genLogs.length > 0">
        <div v-for="(log, i) in genLogs" :key="i" :class="['gen-log-item', log.type]">
          <el-icon v-if="log.type === 'success'"><CircleCheck /></el-icon>
          <el-icon v-else-if="log.type === 'error'"><CircleClose /></el-icon>
          <el-icon v-else class="is-loading"><Loading /></el-icon>
          {{ log.text }}
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="bomDialogVisible = false" :disabled="generating">取消</el-button>
      <el-button type="primary" :icon="MagicStick" :loading="generating"
        :disabled="selectedGenGoods.size === 0 || !genWarehouse"
        @click="doGenerate">
        {{ generating ? '生成中…' : '确认一键生成' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ChatRound, Cpu, Delete, Close, User, Promotion, Check, Picture, Loading, Microphone, Clock, GoodsFilled, SetUp, Document, CircleCheck, CircleClose, Select, MagicStick } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import http from '@/api/http'
import AiToolCallCard from './ai/AiToolCallCard.vue'
import type { ToolCallState } from './ai/composables/useAiAgent'
import { getGoodsList } from '@/api/goods'
import { createProductionPlan, auditProductionPlan, createMaterial, auditMaterial } from '@/api/production'
import { applyMaterialStockDelta } from '@/utils/materialStock'
import { createProductionInhouseAndAutoAudit } from '@/utils/productionInhouse'

function getResponseId(res: any) {
  return Number(res?.data?.id || res?.data?.data?.id || res?.data || 0)
}

function getResponseOrderSn(res: any) {
  return String(res?.data?.order_sn || res?.data?.data?.order_sn || '')
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  time: string
  images?: string[]
  toolCalls?: ToolCallState[]
  navRoute?: string
  // 多Agent会话字段
  agentId?: string       // 'captain' | 'copywriter' | 'poster' | ...
  agentName?: string     // 显示名称
  agentEmoji?: string    // 员工emoji
  agentColor?: string    // 员工主色
  isAck?: boolean        // 是接令回报（简短）
}

interface PendingAction {
  type: string
  data: Record<string, any>
  apiPath: string
}

interface ImageItem {
  previewUrl: string   // for display
  data: string         // base64 (without prefix)
  mediaType: string
}

// ── Persistence ───────────────────────────────────────────────────────────────
const HISTORY_KEY = 'erp_ai_chat_history'
const SESSIONS_KEY = 'erp_ai_sessions'
const MAX_HISTORY = 100
const MAX_SESSIONS = 20

interface Session {
  time: string
  summary: string
  count: number
  messages: Message[]
}

const showHistory = ref(false)
const sessions = ref<Session[]>(loadSessions())

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    if (raw) return JSON.parse(raw) as Session[]
  } catch {}
  return []
}

function saveSessions(list: Session[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(-MAX_SESSIONS)))
  } catch {}
}

function archiveSession() {
  const msgs = messages.value
  if (msgs.length < 2) return
  const first = msgs.find(m => m.role === 'user')
  const summary = first ? first.content.slice(0, 30) + (first.content.length > 30 ? '...' : '') : '对话记录'
  const s: Session = { time: getNow(), summary, count: msgs.length, messages: [...msgs] }
  sessions.value = [...sessions.value, s]
  saveSessions(sessions.value)
}

function restoreSession(index: number) {
  const s = sessions.value[index]
  if (!s) return
  messages.value = [...s.messages]
  showHistory.value = false
  nextTick(() => scrollToBottom())
}

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw) as Message[]
  } catch {}
  return []
}

function saveHistory(msgs: Message[]) {
  try {
    const toSave = msgs.slice(-MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave))
  } catch {}
}

const router = useRouter()
const route = useRoute()
const isOpen = ref(false)
const unread = ref(0)
const inputText = ref('')
const messages = ref<Message[]>(loadHistory())
const isLoading = ref(false)
const messagesRef = ref<HTMLDivElement>()
const pendingAction = ref<PendingAction | null>(null)
const pendingImages = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement>()

// persist whenever messages change
watch(messages, (val) => saveHistory(val), { deep: true })

// ── Drag positioning ──────────────────────────────────────────────────────────
const triggerBottom = ref(32)
const triggerRight = ref(32)
const panelBottom = computed(() => triggerBottom.value + 80)
const panelRight = computed(() => triggerRight.value)

let isDragging = false
let dragTarget: 'trigger' | 'panel' = 'trigger'
let startX = 0, startY = 0
let startBottom = 0, startRight = 0
let clickMoved = false

function onTriggerDragStart(e: MouseEvent) {
  isDragging = false
  clickMoved = false
  dragTarget = 'trigger'
  startX = e.clientX
  startY = e.clientY
  startBottom = triggerBottom.value
  startRight = triggerRight.value
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  e.preventDefault()
}

function onTriggerTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  isDragging = false
  clickMoved = false
  dragTarget = 'trigger'
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  startBottom = triggerBottom.value
  startRight = triggerRight.value
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
}

function onPanelDragStart(e: MouseEvent) {
  // Don't drag if clicking a button inside header
  if ((e.target as HTMLElement).closest('button, .el-button')) return
  isDragging = false
  clickMoved = false
  dragTarget = 'panel'
  startX = e.clientX
  startY = e.clientY
  startBottom = triggerBottom.value
  startRight = triggerRight.value
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  e.preventDefault()
}

function onPanelTouchStart(e: TouchEvent) {
  if ((e.target as HTMLElement).closest('button, .el-button')) return
  if (e.touches.length !== 1) return
  isDragging = false
  clickMoved = false
  dragTarget = 'panel'
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  startBottom = triggerBottom.value
  startRight = triggerRight.value
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
}

function onDragMove(e: MouseEvent) {
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
    isDragging = true
    clickMoved = true
  }
  if (!isDragging) return
  const newRight = Math.max(8, Math.min(window.innerWidth - 80, startRight - dx))
  const newBottom = Math.max(8, Math.min(window.innerHeight - 80, startBottom - dy))
  triggerRight.value = newRight
  triggerBottom.value = newBottom
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length !== 1) return
  const dx = e.touches[0].clientX - startX
  const dy = e.touches[0].clientY - startY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
    isDragging = true
    clickMoved = true
    e.preventDefault() // prevent page scroll while dragging
  }
  if (!isDragging) return
  const newRight = Math.max(8, Math.min(window.innerWidth - 80, startRight - dx))
  const newBottom = Math.max(8, Math.min(window.innerHeight - 80, startBottom - dy))
  triggerRight.value = newRight
  triggerBottom.value = newBottom
}

function onDragEnd() {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

function onTouchEnd() {
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

function onTriggerClick() {
  if (clickMoved) { clickMoved = false; return }
  toggleChat()
}

const quickPrompts = [
  '新增一个客户',
  '本月销售总额是多少',
  '查询库存商品列表',
  '录入一条采购订单',
  '录入一笔预付款',
]

// ── 一键生产BOM ───────────────────────────────────────────────────────────────
const bomDialogVisible = ref(false)
const bomLoading = ref(false)
const bomProducts = ref<any[]>([])
const warehouseList = ref<any[]>([])
const genSearch = ref('')
const filteredGenGoods = ref<any[]>([])
const selectedGenGoods = ref<Set<number>>(new Set())
const genQtyMap = ref<Record<number, number>>({})
const genWarehouse = ref<number | null>(null)
const genDate = ref('')
const genRemark = ref('')
const genLogs = ref<{ text: string; type: 'info' | 'success' | 'error' }[]>([])
const generating = ref(false)

const genPreviewList = computed(() => {
  return [...selectedGenGoods.value].map(gid => {
    const g = bomProducts.value.find(b => b.goods_id === gid)
    return g ? { ...g, qty: genQtyMap.value[gid] || 1 } : null
  }).filter(Boolean)
})

async function loadBomProducts() {
  bomLoading.value = true
  try {
    const gRes = await getGoodsList({ list_rows: 500 })
    const allGoods: any[] = gRes.data?.rows ?? []
    const bomRes = await http.get('/goods/ShopBom/index', { params: { list_rows: 1000 } })
    const bomAll: any[] = bomRes.data?.rows ?? []
    const bomByGoods: Record<number, any[]> = {}
    for (const bom of bomAll) {
      if (!bomByGoods[bom.goods_id]) bomByGoods[bom.goods_id] = []
      bomByGoods[bom.goods_id].push(bom)
    }
    const stockRes = await http.get('/stock/StockAll/index', { params: { list_rows: 1000 } })
    const stocks: any[] = stockRes.data?.rows ?? []
    const stockMap: Record<number, number> = {}
    for (const s of stocks) stockMap[s.goods_id] = (stockMap[s.goods_id] || 0) + Number(s.stock_num || 0)
    const result: any[] = []
    for (const [gidStr, mats] of Object.entries(bomByGoods)) {
      const gid = Number(gidStr)
      const goods = allGoods.find((g: any) => g.id === gid)
      const goodsName = mats[0]?.goods_name || goods?.goods_name || `商品#${gid}`
      let canMake = Infinity
      const matsWithStock = mats.map((m: any) => {
        const matGoodsId = m.material_id || m.mat_goods_id
        const stock = stockMap[matGoodsId] || 0
        const needed = Number(m.num) || 1
        const possible = Math.floor(stock / needed)
        if (possible < canMake) canMake = possible
        return { ...m, _matGoodsId: matGoodsId, stock_num: stock, stockOk: stock >= needed }
      })
      result.push({ goods_id: gid, goods_name: goodsName, unit_name: goods?.unit_name || '', canMake: canMake === Infinity ? 0 : canMake, materials: matsWithStock })
    }
    bomProducts.value = result.sort((a, b) => b.canMake - a.canMake)
    filteredGenGoods.value = [...bomProducts.value]
  } catch (e) { console.error(e) } finally { bomLoading.value = false }
}

async function loadWarehouses() {
  try {
    const res = await http.get('/stock/WarehouseName/index', { params: { list_rows: 100 } })
    warehouseList.value = res.data?.rows ?? []
    if (!genWarehouse.value && warehouseList.value.length) genWarehouse.value = warehouseList.value[0].id
  } catch {}
}

function openBomDialog() {
  selectedGenGoods.value = new Set()
  genQtyMap.value = {}
  genLogs.value = []
  genSearch.value = ''
  filteredGenGoods.value = [...bomProducts.value]
  bomDialogVisible.value = true
  if (!bomProducts.value.length) loadBomProducts()
  if (!warehouseList.value.length) loadWarehouses()
}

function filterGenGoods() {
  const q = genSearch.value.trim().toLowerCase()
  filteredGenGoods.value = bomProducts.value.filter(g => !q || g.goods_name.toLowerCase().includes(q))
}

function toggleGenGoods(g: any) {
  if (selectedGenGoods.value.has(g.goods_id)) {
    selectedGenGoods.value.delete(g.goods_id)
    delete genQtyMap.value[g.goods_id]
  } else {
    selectedGenGoods.value.add(g.goods_id)
    genQtyMap.value[g.goods_id] = Math.min(g.canMake || 1, 1)
  }
  selectedGenGoods.value = new Set(selectedGenGoods.value)
}

async function doGenerate() {
  if (!selectedGenGoods.value.size) return
  if (!genWarehouse.value) { ElMessage.warning('请选择入库仓库'); return }
  const items = genPreviewList.value as any[]
  const lacking = items.filter(i => i.canMake < i.qty)
  if (lacking.length) {
    try {
      await ElMessageBox.confirm(`以下产品物料库存不足：${lacking.map((l: any) => l.goods_name).join('、')}，是否继续？`, '库存不足确认', { type: 'warning' })
    } catch { return }
  }
  generating.value = true
  genLogs.value = []
  const today = genDate.value || new Date().toISOString().slice(0, 10)
  for (const item of items) {
    genLogs.value.push({ text: `开始生成：${item.goods_name} × ${item.qty}`, type: 'info' })
    try {
      const planRes = await createProductionPlan({
        plan_date: today, finish_date: today,
        remark: genRemark.value || '一键生成BOM计划',
        goods_name: item.goods_name,
        goods_info: JSON.stringify([{ goods_id: item.goods_id, goods_name: item.goods_name, num: item.qty, unit_name: item.unit_name }]),
        plan_num: item.qty, schedule_num: item.qty,
      })
      const planId = getResponseId(planRes)
      const planNo = getResponseOrderSn(planRes)
      genLogs.value.push({ text: `  ✓ 生产计划已创建（ID: ${planId}）`, type: 'success' })
      if (planId) { await auditProductionPlan(planId, 1); genLogs.value.push({ text: `  ✓ 生产计划已审核通过`, type: 'success' }) }
      try {
        const warehouseName = warehouseList.value.find((w: any) => Number(w.id) === Number(genWarehouse.value))?.name || ''
        const matItems = item.materials.map((mat: any) => ({ goods_id: mat._matGoodsId, goods_name: mat.material_name || mat.goods_name, goods_sn: mat.material_sn || mat.goods_sn || '', unit_name: mat.unit_name || '', num: Number(mat.num) * item.qty, out_price: 0, row_total: 0, remark: '' }))
        const matRes = await createMaterial({ pick_date: today, warehouse_id: genWarehouse.value, warehouse_name: warehouseName, production_plan_id: planId, plan_name: planNo, remark: `一键生成 - ${item.goods_name}`, goods_info: JSON.stringify(matItems.map((mat: any) => ({ ...mat, warehouse_id: genWarehouse.value, warehouse_name: warehouseName }))), total_price: 0 })
        const matId = getResponseId(matRes)
        if (matId) {
          await auditMaterial(matId, 1)
          await applyMaterialStockDelta(matItems, {
            direction: 'deduct',
            defaultWarehouseId: Number(genWarehouse.value || 0),
            defaultWarehouseName: warehouseName,
          })
        }
        genLogs.value.push({ text: `  ✓ 领料单已创建并审核（共 ${matItems.length} 种原料）`, type: 'success' })
      } catch { genLogs.value.push({ text: `  ⚠ 领料失败（可继续）`, type: 'error' }) }
      const warehouseName = warehouseList.value.find((w: any) => Number(w.id) === Number(genWarehouse.value))?.name || ''
      const inhouseRes = await createProductionInhouseAndAutoAudit({
        plan_id: planId,
        plan_no: planNo,
        inhouse_date: today,
        warehouse_id: Number(genWarehouse.value || 0),
        warehouse_name: warehouseName,
        remark: genRemark.value || '一键生成BOM入库',
        items: [{ goods_id: item.goods_id, goods_name: item.goods_name, goods_sn: item.goods_sn || '', num: item.qty, unit_name: item.unit_name }],
      })
      const inhouseId = inhouseRes.rows?.[0]?.id
      genLogs.value.push({ text: `  ✓ 生产入库单已创建并审核（ID: ${inhouseId || '—'}）`, type: 'success' })
    } catch (e: any) { genLogs.value.push({ text: `  ✗ 失败：${e?.message || '接口错误'}`, type: 'error' }) }
  }
  generating.value = false
  ElMessage.success('一键生成完成！')
}

const SYSTEM_PROMPT = `你是数字游牧ERP系统的内置AI助手。你运行在该ERP系统内部，拥有直接调用系统API的能力，可以真实地录入、查询、汇总业务数据。

【绝对禁止的行为】
- 禁止说"我无法直接操作您的系统"、"需要您手动操作"、"仅为信息整理"等任何推脱性语句
- 禁止加任何免责声明——你就在系统内部，你可以直接操作
- 禁止让用户"手动去系统里操作"——你就是系统操作者

【你的能力】
你可以直接录入和查询以下所有数据（通过系统API实时操作）：
- 基础资料：客户、供应商、商品、品牌、分类、单位、员工、仓库
- 销售业务：销售报价、销售合同、销售出库
- 采购业务：采购计划、采购订单
- 生产业务：生产计划
- 财务：预付款、收款单、付款单、资金账户
- 库存：库存查询、库存总览
- 查询汇总：销售统计、采购统计、库存统计、财务统计

【录入数据的规则】
当用户要求录入数据时：
1. 提取用户提供的所有字段信息
2. 根据业务类型选择正确的 type，立即输出如下格式的 action 块：
\`\`\`action
{
  "type": "此处填写下方支持的操作类型之一",
  "data": { ...字段 },
  "description": "操作描述"
}
\`\`\`
3. action 块输出后，系统会自动完成录入，你说"已为您录入数据"即可
4. 必填字段缺失时，先询问补充，再输出 action 块

【支持的操作类型——必须精确使用以下 type 值】

基础资料录入：
- create_customer: name(客户名称,必填), mobile(手机), address(地址), remark(备注)
- create_supplier: name(供应商名,必填), contact(联系人), mobile(手机), address(地址), bank(银行账户)
- create_goods: goods_name(商品名,必填), goods_sn(编码), sell_price(售价), cost_price(成本价), unit_name(单位), cate_name(分类), spec(规格), barcode(条码)
- create_goods_brand: name(品牌名,必填), remark(备注)
- create_goods_cate: name(分类名,必填), remark(备注)
- create_goods_unit: name(单位名,必填)
- create_staff: name(姓名,必填), mobile(手机), dept(部门), jobs(职位)
- create_warehouse: name(仓库名,必填), remark(备注)

业务单据录入：
- create_sale_order: customer_name(客户,必填), total_amount(金额), admin_name(经办人), remark(备注), items(商品明细数组，每项含 goods_name/num/price/unit_name)
- create_procure_order: supplier_name(供应商,必填), total_amount(金额), admin_name(经办人), remark(备注), items(商品明细数组，每项含 goods_name/num/price/unit_name)
- create_collect_receipt: contact_name(收款对象,必填), amount(金额,必填), fund_id(账户ID), fund_name(账户名), receipt_date(日期), remark(备注)
- create_pay_receipt: contact_name(付款对象,必填), amount(金额,必填), fund_id(账户ID), fund_name(账户名), pay_date(日期), remark(备注)

财务录入：
- create_prepay: amount(金额,必填), pay_type("supplier"或"customer"), supplier_name(供应商名), customer_name(客户名), pay_date(日期YYYY-MM-DD), fund_id(账户ID), fund_name(付款账户), remark(备注)
- create_fund_account: name(账户名,必填), balance(初始余额)

【create_prepay 使用规则】
- 用户说"预付款"、"预付"、"付定金"、"押金"、"充值余额"等，必须使用 create_prepay
- pay_type=supplier：向供应商预付（默认）
- pay_type=customer：客户预充值/预收款

【图像识别规则】
当用户上传单据图片时（出库单、入库单、采购单、收款单等）：
1. 仔细识别图片中所有文字信息
2. 提取：单据类型、单号、日期、客户/供应商、经办人、商品明细（名称、数量、单价、合计）、金额合计、备注等
3. 商品明细必须逐行读取，每行写入 items 数组（goods_name=商品名称，num=数量，price=含税单价，unit_name=单位）
4. 根据单据类型判断对应的 action type：
   - 出库单/发货单 → create_sale_order（出库操作）
   - 入库单/采购单 → create_procure_order（采购操作）
   - 收款单/回款单 → create_collect_receipt
   - 付款单 → create_pay_receipt
5. 告知用户识别到的内容，确认后输出 action 块录入

回复简洁友好，中文。`

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unread.value = 0
    nextTick(() => scrollToBottom())
  }
}

function getNow() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ── Data query helpers ────────────────────────────────────────────────────────
async function fetchContextData(text: string): Promise<string> {
  const lower = text.toLowerCase()
  const results: string[] = []
  try {
    // Sales data
    if (lower.includes('销售') || lower.includes('出货') || lower.includes('收入') || lower.includes('营业额') || lower.includes('合同')) {
      const [outRes, contractRes]: any[] = await Promise.all([
        http.get('/stock/SaleOutOrder/index', { params: { list_rows: 100 } }),
        http.get('/shop/ContractOrder/index', { params: { list_rows: 50 } }),
      ])
      const outRows: any[] = outRes?.data?.rows || []
      const outTotal = outRows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
      results.push(`【销售出货单】共 ${outRows.length} 条，合计 ¥${outTotal.toFixed(2)}。最近5条：${JSON.stringify(outRows.slice(0, 5).map((r: any) => ({ 客户: r.customer_name, 金额: r.total_amount, 日期: String(r.out_date || r.created_at || '').slice(0,10) })))}`)
      const contractRows: any[] = contractRes?.data?.rows || []
      const contractTotal = contractRows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
      results.push(`【销售合同】共 ${contractRows.length} 份，合计 ¥${contractTotal.toFixed(2)}`)
    }
    // Stock/inventory data
    if (lower.includes('库存') || lower.includes('库') || lower.includes('存货') || lower.includes('库存总览')) {
      const res: any = await http.get('/stock/StockAll/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      const totalVal = rows.reduce((s: number, r: any) => s + Number(r.qty || 0) * Number(r.avg_price || 0), 0)
      results.push(`【库存数据】共 ${rows.length} 种商品，库存总价值约 ¥${totalVal.toFixed(2)}。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 商品: r.goods_name, 库存: r.qty, 单位: r.unit_name, 仓库: r.warehouse_name })))}`)
    }
    // Customer data
    if (lower.includes('客户')) {
      const res: any = await http.get('/shop/ShopCustomer/index', { params: { list_rows: 200 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【客户数据】共 ${res?.data?.total || rows.length} 位客户。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 名称: r.nickname || r.name, 手机: r.mobile, 余额: r.balance })))}`)
    }
    // Supplier data
    if (lower.includes('供应商')) {
      const res: any = await http.get('/procure/supplier/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【供应商数据】共 ${res?.data?.total || rows.length} 家供应商。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 名称: r.name, 联系人: r.contact, 手机: r.mobile })))}`)
    }
    // Goods/products data
    if (lower.includes('商品') || lower.includes('产品') || lower.includes('品牌') || lower.includes('分类')) {
      const [goodsRes, brandRes, cateRes]: any[] = await Promise.all([
        http.get('/goods/ShopGoods/index', { params: { list_rows: 100 } }),
        http.get('/goods/ShopBrand/index', { params: { list_rows: 50 } }),
        http.get('/goods/ShopGoodsCate/index', { params: { list_rows: 50 } }),
      ])
      const rows: any[] = goodsRes?.data?.rows || []
      results.push(`【商品数据】共 ${goodsRes?.data?.total || rows.length} 种。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 商品名: r.goods_name, 编码: r.goods_sn, 售价: r.sell_price, 分类: r.cate_name })))}`)
      const brands: any[] = brandRes?.data?.rows || []
      if (brands.length) results.push(`【品牌列表】${brands.map((b: any) => b.name).join('、')}`)
      const cates: any[] = cateRes?.data?.rows || []
      if (cates.length) results.push(`【商品分类】${cates.map((c: any) => c.name).join('、')}`)
    }
    // Purchase data
    if (lower.includes('采购') || lower.includes('进货')) {
      const res: any = await http.get('/stock/PurchaseOrder/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
      results.push(`【采购订单】共 ${rows.length} 条，合计 ¥${total.toFixed(2)}。最近5条：${JSON.stringify(rows.slice(0, 5).map((r: any) => ({ 供应商: r.supplier_name, 金额: r.total_amount, 日期: String(r.order_date || r.created_at || '').slice(0,10) })))}`)
    }
    // Finance - receivables/payables
    if (lower.includes('应收') || lower.includes('应付') || lower.includes('收款') || lower.includes('付款') || lower.includes('财务')) {
      const [collectRes, payRes, receivableRes, payableRes]: any[] = await Promise.all([
        http.get('/finance/CollectReceipt/index', { params: { list_rows: 50 } }),
        http.get('/finance/PayReceipt/index', { params: { list_rows: 50 } }),
        http.get('/finance/CollectAccounts/index', { params: { list_rows: 50 } }),
        http.get('/finance/PayAccounts/index', { params: { list_rows: 50 } }),
      ])
      const collectRows: any[] = collectRes?.data?.rows || []
      const collectTotal = collectRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
      results.push(`【收款单】共 ${collectRows.length} 条，合计 ¥${collectTotal.toFixed(2)}`)
      const payRows: any[] = payRes?.data?.rows || []
      const payTotal = payRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
      results.push(`【付款单】共 ${payRows.length} 条，合计 ¥${payTotal.toFixed(2)}`)
      const receivable: any[] = receivableRes?.data?.rows || []
      const receivableTotal = receivable.reduce((s: number, r: any) => s + Number(r.un_receive_amount || 0), 0)
      results.push(`【应收账款】共 ${receivable.length} 笔未收，合计未收 ¥${receivableTotal.toFixed(2)}`)
      const payable: any[] = payableRes?.data?.rows || []
      const payableTotal = payable.reduce((s: number, r: any) => s + Number(r.un_pay_amount || 0), 0)
      results.push(`【应付账款】共 ${payable.length} 笔未付，合计未付 ¥${payableTotal.toFixed(2)}`)
    }
    // Fund accounts
    if (lower.includes('账户') || lower.includes('余额') || lower.includes('资金') || lower.includes('预付')) {
      const [fundRes, prepayRes]: any[] = await Promise.all([
        http.get('/finance/Fund/index', { params: { list_rows: 100 } }),
        http.get('/finance/Prepay/index', { params: { list_rows: 50 } }),
      ])
      const funds: any[] = fundRes?.data?.rows || []
      const totalBalance = funds.reduce((s: number, f: any) => s + Number(f.balance || 0), 0)
      results.push(`【资金账户】共 ${funds.length} 个账户，总余额 ¥${totalBalance.toFixed(2)}。账户明细：${JSON.stringify(funds.map((f: any) => ({ id: f.id, name: f.name, balance: f.balance })))}（录入时需用 fund_id）`)
      const prepayRows: any[] = prepayRes?.data?.rows || []
      const prepayTotal = prepayRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
      results.push(`【预付款】共 ${prepayRows.length} 条，合计 ¥${prepayTotal.toFixed(2)}。最近5条：${JSON.stringify(prepayRows.slice(0, 5).map((r: any) => ({ 单号: r.order_sn, 供应商: r.supplier_name, 客户: r.customer_name, 金额: r.amount, 日期: r.pay_date })))}`)
    }
    // Staff/employees
    if (lower.includes('员工') || lower.includes('人员') || lower.includes('职员')) {
      const res: any = await http.get('/personnel/staff/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【员工数据】共 ${res?.data?.total || rows.length} 名员工。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 姓名: r.name, 手机: r.mobile, 部门: r.dept, 职位: r.jobs })))}`)
    }
    // Warehouse
    if (lower.includes('仓库') || lower.includes('仓')) {
      const res: any = await http.get('/stock/WarehouseName/index', { params: { list_rows: 50 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【仓库列表】共 ${rows.length} 个仓库：${rows.map((r: any) => r.name).join('、')}`)
    }
    // Production
    if (lower.includes('生产') || lower.includes('生产计划')) {
      const res: any = await http.get('/production/plan/index', { params: { list_rows: 50 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【生产计划】共 ${rows.length} 条。最近5条：${JSON.stringify(rows.slice(0, 5).map((r: any) => ({ 单号: r.order_sn, 商品: r.goods_name, 排产: r.schedule_num, 已生产: r.actual_num })))}`)
    }
  } catch {
    // ignore fetch errors
  }
  return results.join('\n\n')
}

// ── Agent identity helpers ────────────────────────────────────────────────────
const AGENT_COLORS: Record<string, string> = {
  captain: '#6366f1',
  copywriter: '#f59e0b',
  poster: '#ec4899',
  video: '#ef4444',
  brand: '#8b5cf6',
  publisher: '#10b981',
  trend: '#06b6d4',
}
const AGENT_EMOJIS: Record<string, string> = {
  captain: '🎯',
  copywriter: '✍️',
  poster: '🎨',
  video: '🎬',
  brand: '💎',
  publisher: '🚀',
  trend: '📈',
}
function getAgentColor(agentId: string) { return AGENT_COLORS[agentId] || '#6366f1' }
function getAgentEmoji(agentId: string) { return AGENT_EMOJIS[agentId] || '🤖' }

async function sendMessage() {
  const text = inputText.value.trim()
  const hasImages = pendingImages.value.length > 0
  if ((!text && !hasImages) || isLoading.value) return

  const imagesToSend = [...pendingImages.value]
  const previewUrls = imagesToSend.map(i => i.previewUrl)

  messages.value.push({
    role: 'user',
    content: text || '请识别这张单据图片，提取所有关键信息并帮我录入系统。',
    time: getNow(),
    images: previewUrls.length ? previewUrls : undefined,
  })
  inputText.value = ''
  pendingImages.value = []
  isLoading.value = true
  pendingAction.value = null
  nextTick(() => scrollToBottom())

  // Build messages for API — last 6 messages only
  const BAD_PHRASES = ['无法直接操作', '仅为信息整理', '需要您手动', '手动在对应系统']
  const apiMessages = messages.value
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .filter((m) => !BAD_PHRASES.some(p => m.content.includes(p)))
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content }))

  let assistantText = ''
  // 多Agent：agentId → 对应的消息对象
  const agentMsgMap: Record<string, Message> = {}
  const assistantMsg: Message = { role: 'assistant', content: '', time: getNow(), toolCalls: [] }
  messages.value.push(assistantMsg)
  agentMsgMap['erp'] = assistantMsg

  try {
    const erpToken = localStorage.getItem('erp_token') || ''
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-erp-token': erpToken,
      },
      body: JSON.stringify({
        messages: apiMessages,
        images: imagesToSend.length > 0
          ? imagesToSend.map(i => ({ data: i.data, mediaType: i.mediaType }))
          : undefined,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(errText || `HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('text/event-stream')) {
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('无法读取响应流')
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'text') {
              assistantText += parsed.text
              assistantMsg.content = assistantText
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'text_replace') {
              assistantText = parsed.text
              assistantMsg.content = assistantText
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'agent_ack') {
              // 员工接令消息 — 单独气泡，简短
              const ackMsg: Message = {
                role: 'assistant',
                content: parsed.text || '收到，开始执行。',
                time: getNow(),
                toolCalls: [],
                agentId: parsed.agentId,
                agentName: parsed.agentName,
                agentEmoji: parsed.emoji,
                agentColor: getAgentColor(parsed.agentId),
                isAck: true,
              }
              messages.value.push(ackMsg)
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'agent_thinking') {
              // 员工或Captain正在输出内容
              const aId = parsed.agentId || 'captain'
              if (!agentMsgMap[aId]) {
                const newMsg: Message = {
                  role: 'assistant',
                  content: '',
                  time: getNow(),
                  toolCalls: [],
                  agentId: aId,
                  agentName: parsed.agentName,
                  agentEmoji: parsed.emoji || getAgentEmoji(aId),
                  agentColor: getAgentColor(aId),
                }
                messages.value.push(newMsg)
                agentMsgMap[aId] = newMsg
              }
              agentMsgMap[aId].content += parsed.text || ''
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'agent_done') {
              // 员工任务完成，不需额外操作（内容已通过 agent_thinking 追加）
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'tool_start') {
              // tool_start 挂在当前活跃的agent消息上
              const activeMsg = agentMsgMap[parsed.agentId || 'captain'] || assistantMsg
              activeMsg.toolCalls!.push({ id: parsed.id, name: parsed.name, input: parsed.input || {}, status: 'running' })
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'tool_result') {
              // 找到对应的 tool call 更新状态
              for (const msg of Object.values(agentMsgMap)) {
                const tc = msg.toolCalls?.find(t => t.id === parsed.id)
                if (tc) {
                  tc.result = parsed.result
                  tc.status = (parsed.result?.startsWith('工具执行出错') || parsed.result?.startsWith('创建失败')) ? 'error' : 'success'
                  break
                }
              }
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error)
            } else if (parsed.error) {
              throw new Error(parsed.error)
            }
          } catch (parseErr: any) {
            if (parseErr.message !== data) throw parseErr
          }
        }
      }
    } else {
      // Production: Cloudflare Function returns full Anthropic JSON response
      const result = await response.json()
      if (result.error) throw new Error(result.error.message || JSON.stringify(result.error))
      assistantText = result.content?.[0]?.text ?? result.choices?.[0]?.message?.content ?? ''
      assistantMsg.content = assistantText
      nextTick(() => scrollToBottom())
    }
  } catch (e: any) {
    assistantMsg.content = `抱歉，出现了错误：${e.message}`
    if (!isOpen.value) unread.value++
  } finally {
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    isLoading.value = false
    nextTick(() => scrollToBottom())
  }
}

async function executeAction() {
  if (!pendingAction.value) return
  const actionType = pendingAction.value.type
  try {
    const res = await http.post(pendingAction.value.apiPath, normalizeActionData(actionType, pendingAction.value.data))
    // http interceptor already unwraps code=1 responses; res = { code, data, message }
    const orderSn = res?.data?.order_sn || res?.data?.id
    const navRoute = getListRoute(actionType)
    const extra = orderSn ? `单号：${orderSn}。` : ''
    ElMessage.success('数据录入成功！')
    messages.value.push({
      role: 'assistant',
      content: `✅ 数据已成功录入系统！${extra}如需继续操作，请告诉我。`,
      time: getNow(),
      navRoute,
    })
    pendingAction.value = null
  } catch (e: any) {
    const errMsg = e.message || e.msg || JSON.stringify(e)
    ElMessage.error('录入失败：' + errMsg)
    messages.value.push({
      role: 'assistant',
      content: `❌ 录入失败：${errMsg}\n\n请告诉我正确信息，我重新帮您录入。`,
      time: getNow(),
    })
    pendingAction.value = null
  }
}

// Normalize AI-generated field names to match what each API actually expects
function normalizeActionData(type: string, data: Record<string, any>): Record<string, any> {
  const d = { ...data }
  if (type === 'create_customer') {
    // API needs: name (not nickname — confirmed from ClientList.vue handleSubmit)
    const nameVal = d.name || d.nickname || d.customer_name || d['客户名称'] || d['名称']
    if (nameVal) {
      d.name = nameVal
      delete d.nickname; delete d.customer_name; delete d['客户名称']; delete d['名称']
    }
  }
  if (type === 'create_supplier') {
    // API needs: name
    const nameVal = d.name || d.supplier_name || d.nickname || d['供应商名'] || d['名称']
    if (nameVal) {
      d.name = nameVal
      delete d.supplier_name; delete d.nickname; delete d['供应商名']; delete d['名称']
    }
  }
  if (type === 'create_goods') {
    // API needs: goods_name
    const nameVal = d.goods_name || d.name || d['商品名'] || d['商品名称']
    if (nameVal) {
      d.goods_name = nameVal
      delete d.name; delete d['商品名']; delete d['商品名称']
    }
  }
  if (type === 'create_staff') {
    // API needs: name
    const nameVal = d.name || d.staff_name || d['姓名']
    if (nameVal) {
      d.name = nameVal
      delete d.staff_name; delete d['姓名']
    }
  }
  if (type === 'create_prepay') {
    // normalize amount
    if (d['金额']) { d.amount = d['金额']; delete d['金额'] }
    if (d['付款金额']) { d.amount = d['付款金额']; delete d['付款金额'] }
    if (d['预付款']) { d.amount = d['预付款']; delete d['预付款'] }
    if (d['供应商']) { d.supplier_name = d['供应商']; delete d['供应商'] }
    if (d['客户']) { d.customer_name = d['客户']; delete d['客户'] }
    if (d['付款日期']) { d.pay_date = d['付款日期']; delete d['付款日期'] }
    if (d['账户'] || d['付款账户']) { d.fund_name = d['账户'] || d['付款账户']; delete d['账户']; delete d['付款账户'] }
    if (d['备注']) { d.remark = d['备注']; delete d['备注'] }
    // default pay_type
    if (!d.pay_type) d.pay_type = d.customer_name ? 'customer' : 'supplier'
  }
  if (type === 'create_goods_brand' || type === 'create_goods_cate' || type === 'create_goods_unit' || type === 'create_warehouse') {
    const nameVal = d.name || d['名称'] || d['品牌名'] || d['分类名'] || d['单位名'] || d['仓库名']
    if (nameVal) {
      d.name = nameVal
      delete d['名称']; delete d['品牌名']; delete d['分类名']; delete d['单位名']; delete d['仓库名']
    }
  }
  console.log('[AI Action]', type, d)
  return d
}

function getApiPath(type: string): string {
  const map: Record<string, string> = {
    create_customer: '/shop/ShopCustomer/add',
    create_supplier: '/procure/supplier/add',
    create_goods: '/goods/ShopGoods/add',
    create_goods_brand: '/goods/ShopBrand/add',
    create_goods_cate: '/goods/ShopGoodsCate/add',
    create_goods_unit: '/goods/ShopUnit/add',
    create_staff: '/personnel/staff/add',
    create_warehouse: '/stock/WarehouseName/add',
    create_sale_order: '/shop/ContractOrder/add',
    create_procure_order: '/stock/PurchaseOrder/add',
    create_collect_receipt: '/finance/CollectReceipt/add',
    create_pay_receipt: '/finance/PayReceipt/add',
    create_prepay: '/finance/Prepay/create',
    create_fund_account: '/finance/Fund/add',
  }
  return map[type] || '/unknown'
}

function getListRoute(type: string): string {
  const map: Record<string, string> = {
    create_customer:       '/sale/client',
    create_supplier:       '/procure/supplier',
    create_goods:          '/goods/info',
    create_goods_brand:    '/goods/brand',
    create_goods_cate:     '/goods/cate',
    create_goods_unit:     '/goods/unit',
    create_staff:          '/personnel/staff',
    create_warehouse:      '/warehouse/name',
    create_sale_order:     '/sale/contract',
    create_procure_order:  '/procure/order',
    create_collect_receipt:'/finance/collect-receipt',
    create_pay_receipt:    '/finance/pay-receipt',
    create_prepay:         '/finance/prepay',
    create_fund_account:   '/finance/fund',
    create_retail_order:   '/retail/order',
  }
  return map[type] || ''
}

function navigateTo(route: string) {
  if (!route) return
  router.push(route)
  isOpen.value = false
}


// iOS Safari does not support SpeechRecognition — hide the button to avoid triggering Siri
const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
const SpeechRecognitionAPI = typeof window !== 'undefined' && !isIOS
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  : null
const isRecording = ref(false)
const isCancelling = ref(false)
const voiceSupported = ref(!!SpeechRecognitionAPI)
let recognition: any = null

let voiceText = ''
let micStartY = 0
const CANCEL_THRESHOLD = 60 // 上滑超过60px进入取消区

function onPointerMove(e: PointerEvent | TouchEvent) {
  if (!isRecording.value) return
  const clientY = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY : (e as PointerEvent).clientY
  if (clientY == null) return
  isCancelling.value = (micStartY - clientY) > CANCEL_THRESHOLD
}

function onMicDown(e: MouseEvent | TouchEvent) {
  if (isRecording.value || !SpeechRecognitionAPI || isLoading.value) return
  micStartY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
  isCancelling.value = false
  voiceText = ''

  window.addEventListener('mousemove', onPointerMove as any)
  window.addEventListener('pointermove', onPointerMove as any)
  window.addEventListener('touchmove', onPointerMove as any, { passive: true })

  recognition = new SpeechRecognitionAPI()
  recognition.lang = 'zh-CN'
  recognition.continuous = true
  recognition.interimResults = false
  isRecording.value = true  // 立即设置，不等 onstart（避免授权弹窗期间卡住）
  recognition.onstart = () => { isRecording.value = true }
  recognition.onresult = (e: any) => {
    voiceText = Array.from(e.results as any[])
      .map((r: any) => r[0].transcript)
      .join('')
  }
  recognition.onerror = (e: any) => {
    isRecording.value = false
    isCancelling.value = false
    window.removeEventListener('mousemove', onPointerMove as any)
    window.removeEventListener('pointermove', onPointerMove as any)
    window.removeEventListener('touchmove', onPointerMove as any)
    if (e.error !== 'aborted') {
      const msg = e.error === 'not-allowed' ? '麦克风权限被拒绝' : `语音识别失败：${e.error}`
      messages.value = [...messages.value, { role: 'assistant', content: msg, time: getNow() }]
    }
  }
  recognition.onend = () => {
    window.removeEventListener('mousemove', onPointerMove as any)
    window.removeEventListener('pointermove', onPointerMove as any)
    window.removeEventListener('touchmove', onPointerMove as any)
    isRecording.value = false
    const shouldSend = !isCancelling.value && voiceText.trim()
    isCancelling.value = false
    if (shouldSend) {
      inputText.value = voiceText.trim()
      voiceText = ''
      nextTick(() => sendMessage())
    } else {
      voiceText = ''
    }
  }
  recognition.start()
}

function onMicUp() {
  if (!recognition) return
  isRecording.value = false
  if (isCancelling.value) {
    onMicCancel()
  } else {
    recognition.stop()
  }
}

function onMicCancel() {
  window.removeEventListener('mousemove', onPointerMove as any)
  window.removeEventListener('pointermove', onPointerMove as any)
  window.removeEventListener('touchmove', onPointerMove as any)
  if (!recognition) return
  voiceText = ''
  isCancelling.value = false
  recognition.abort()
  recognition = null
  isRecording.value = false
}

function showIOSVoiceTip() {
  ElMessage.info('请点击输入框唤起键盘，再点击键盘右下角🎤语音键说话')
}

function openImagePicker() {
  fileInputRef.value?.click()
}

async function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().match(/\.(heic|heif)$/)) continue
    const { data, previewUrl } = await compressToJpeg(file)
    pendingImages.value.push({ previewUrl, data, mediaType: 'image/jpeg' })
  }
  // reset input so same file can be re-selected
  ;(e.target as HTMLInputElement).value = ''
}

// 将任意图片（含 HEIC）转为 JPEG，长边限 1600px，质量 0.85
function compressToJpeg(file: File): Promise<{ data: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        resolve({ data: dataUrl.split(',')[1], previewUrl: dataUrl })
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function removePendingImage(idx: number) {
  URL.revokeObjectURL(pendingImages.value[idx].previewUrl)
  pendingImages.value.splice(idx, 1)
}

function previewImage(url: string) {
  window.open(url, '_blank')
}

function sendQuickPrompt(p: string) {
  inputText.value = p
  sendMessage()
}

function clearMessages() {
  archiveSession()
  messages.value = []
  pendingAction.value = null
  localStorage.removeItem(HISTORY_KEY)
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function renderMarkdown(text: string): string {
  // Basic markdown rendering
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/^- (.+)/gm, '• $1')
}
</script>

<style scoped>
.ai-trigger {
  position: fixed;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #165dff, #0e44cc);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: #fff;
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.4);
  transition: box-shadow 0.2s;
  z-index: 1000;
  gap: 2px;
  user-select: none;
}

.ai-trigger:hover {
  box-shadow: 0 12px 32px rgba(22, 93, 255, 0.5);
}

.ai-trigger-label {
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

.ai-badge {
  position: absolute;
  top: -4px;
  right: -4px;
}

.ai-chat-panel {
  position: fixed;
  width: 400px;
  height: 580px;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 999;
}

/* Slide transition */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

.chat-header {
  padding: 14px 16px;
  background: linear-gradient(135deg, #165dff, #0e44cc);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-avatar {
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.chat-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.chat-status {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 1px;
}

.chat-header-actions {
  display: flex;
  gap: 6px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-welcome {
  text-align: center;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.welcome-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--dark);
  margin: 4px 0 0;
}

.welcome-sub {
  font-size: 12px;
  color: #86909c;
  margin: 0;
  line-height: 1.5;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 8px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.15s;
}

.quick-tag:hover {
  background: #165dff;
  border-color: #165dff;
  color: #fff;
}

.bom-quick-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #7c3aed;
  background: #f5f3ff;
  border: 1.5px solid #ddd6fe;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.bom-quick-btn:hover { background: #ede9fe; border-color: #c4b5fd; }

/* 一键生产BOM弹框 */
.gen-dialog { max-height: 70vh; overflow-y: auto; }
.gen-section { margin-bottom: 18px; }
.gen-section-title { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #f0f0f0; }
.gen-search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.gen-hint { font-size: 12px; color: #aaa; }
.gen-goods-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-height: 240px; overflow-y: auto; }
.gen-goods-card { border: 1px solid #e4e7ed; border-radius: 6px; padding: 8px 10px; cursor: pointer; position: relative; transition: all 0.15s; background: #fafafa; }
.gen-goods-card:hover { border-color: #409eff; background: #ecf5ff; }
.gen-goods-card.selected { border-color: #409eff; background: #ecf5ff; }
.gen-goods-name { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px; }
.gen-goods-meta { font-size: 11px; }
.gen-canmake.ok { color: #16a34a; }
.gen-canmake.lack { color: #dc2626; }
.gen-qty-row { display: flex; align-items: center; gap: 6px; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #d0e8ff; }
.gen-qty-label { font-size: 12px; color: #666; flex-shrink: 0; }
.gen-unit { font-size: 12px; color: #888; }
.gen-check { position: absolute; top: 6px; right: 6px; color: #409eff; font-size: 16px; }
.field-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.field-label { font-size: 13px; color: #555; white-space: nowrap; flex-shrink: 0; }
.field-label.required::before { content: '*'; color: #f56c6c; margin-right: 2px; }
.mat-row { display: flex; align-items: center; gap: 4px; font-size: 12px; margin-bottom: 2px; }
.mat-name { color: #333; }
.mat-qty { color: #888; }
.gen-log { background: #f8fafc; border: 1px solid #e8edf2; border-radius: 6px; padding: 10px 12px; max-height: 180px; overflow-y: auto; font-family: monospace; font-size: 12px; margin-top: 12px; }
.gen-log-item { display: flex; align-items: center; gap: 6px; padding: 2px 0; line-height: 1.6; }
.gen-log-item.success { color: #16a34a; }
.gen-log-item.error { color: #dc2626; }
.gen-log-item.info { color: #555; }
.empty-tip { color: #aaa; font-size: 13px; text-align: center; padding: 20px 0; }

.message-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  background: #f2f3f5;
  color: #4e5969;
}

.message-user .message-avatar {
  background: #165dff;
  color: #fff;
}

.message-bubble {
  max-width: 75%;
}

.message-content {
  padding: 10px 13px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  background: var(--gray);
  color: var(--dark);
}

.message-user .message-content {
  background: #165dff;
  color: #fff;
  border-radius: 12px 4px 12px 12px;
}

.message-assistant .message-content {
  border-radius: 4px 12px 12px 12px;
}

.message-content code {
  background: rgba(0, 0, 0, 0.08);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
}

.message-user .message-content code {
  background: rgba(255, 255, 255, 0.2);
}

.message-time {
  font-size: 11px;
  color: #c9cdd4;
  margin-top: 4px;
  padding: 0 2px;
}

.message-nav-btn {
  margin-top: 8px;
}

/* ── 多Agent 会话样式 ── */
.agent-emoji {
  font-size: 15px;
  line-height: 1;
}

.agent-label {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 3px;
  padding-left: 2px;
  letter-spacing: 0.3px;
}

.captain-label {
  color: #6366f1;
}

/* 接令气泡：简短、透明感 */
.message-ack .message-content {
  background: #f8f9ff;
  color: #6366f1;
  font-size: 12px;
  padding: 6px 10px;
  border: 1px solid #e0e1ff;
  border-radius: 8px;
  font-style: italic;
}

.message-user .message-time {
  text-align: right;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 10px 13px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #86909c;
  border-radius: 50%;
  animation: typing-bounce 1.2s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.action-preview {
  margin: 0 12px 8px;
  background: #f0f9eb;
  border: 1px solid #b3e19d;
  border-radius: 8px;
  padding: 10px 12px;
  flex-shrink: 0;
}

.action-preview-title {
  font-size: 12px;
  font-weight: 600;
  color: #27ae60;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.action-preview-content {
  font-family: monospace;
  font-size: 11px;
  color: #4e5969;
  white-space: pre-wrap;
  max-height: 80px;
  overflow-y: auto;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.6);
  padding: 4px 6px;
  border-radius: 4px;
}

.action-preview-buttons {
  display: flex;
  gap: 8px;
}

.chat-input-area {
  padding: 12px;
  border-top: 1px solid #f2f3f5;
  flex-shrink: 0;
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.input-hint {
  font-size: 11px;
  color: #c9cdd4;
  flex: 1;
  text-align: center;
}

/* Pending images before send */
.pending-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.pending-img-wrap {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: visible;
}

.pending-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.pending-img-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  background: #f53f3f;
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Images inside message bubble */
.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.message-img {
  max-width: 180px;
  max-height: 180px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.08);
  transition: opacity 0.15s;
}

.message-img:hover {
  opacity: 0.85;
}

/* Backdrop for click-outside close */
.ai-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: transparent;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.chat-native-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.6;
  color: var(--dark);
  background: var(--card-bg);
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  display: block;
}
.chat-native-textarea:focus { border-color: #409eff; }
.chat-native-textarea:disabled { background: #f5f7fa; color: #c0c4cc; cursor: not-allowed; }
.chat-native-textarea::placeholder { color: #c0c4cc; }

.mic-active { animation: mic-pulse 1s ease-in-out infinite; }
@keyframes mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 63, 63, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(245, 63, 63, 0); }
}

/* 长按说话按钮 */
.mic-hold-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 14px;
  height: 30px;
  border-radius: 15px;
  border: 1px solid #dcdfe6;
  background: #f5f7fa;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.mic-hold-btn:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}
.mic-hold-btn--active {
  background: #fef0f0;
  border-color: #f56c6c;
  color: #f56c6c;
  animation: mic-pulse 1s ease-in-out infinite;
}
.mic-hold-btn--cancel {
  background: #f0f0f0;
  border-color: #909399;
  color: #909399;
  animation: none !important;
}

/* 上滑取消提示 */
.voice-cancel-hint {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-top: 4px;
  transition: color 0.2s;
}
.voice-cancel-hint--active {
  color: #f56c6c;
  font-weight: 600;
}

/* 历史会话面板 */
.history-panel {
  background: #f7f8fa;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid #e8eaed;
}
.history-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #e8eaed;
  background: #fff;
}
.history-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
}
.history-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f1f3;
  transition: background 0.15s;
}
.history-item:last-child { border-bottom: none; }
.history-item:hover { background: #ecf5ff; }
.history-item-title {
  font-size: 13px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-item-meta {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-down-enter-from, .slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}
.slide-down-enter-to, .slide-down-leave-from {
  max-height: 400px;
  opacity: 1;
}

/* 长按录音遮罩 */
.voice-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 20;
  pointer-events: none;
}
.voice-overlay p {
  color: #fff;
  font-size: 14px;
  margin: 0;
  letter-spacing: 0.5px;
}
.voice-wave {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 36px;
}
.voice-wave span {
  display: block;
  width: 5px;
  border-radius: 3px;
  background: #f53f3f;
  animation: wave-bar 0.8s ease-in-out infinite;
}
.voice-wave span:nth-child(1) { height: 14px; animation-delay: 0s; }
.voice-wave span:nth-child(2) { height: 24px; animation-delay: 0.1s; }
.voice-wave span:nth-child(3) { height: 36px; animation-delay: 0.2s; }
.voice-wave span:nth-child(4) { height: 24px; animation-delay: 0.3s; }
.voice-wave span:nth-child(5) { height: 14px; animation-delay: 0.4s; }
@keyframes wave-bar {
  0%, 100% { transform: scaleY(0.4); opacity: 0.6; }
  50% { transform: scaleY(1); opacity: 1; }
}

/* Mobile: full-width panel */
@media (max-width: 480px) {
  .ai-chat-panel {
    width: calc(100vw - 16px);
    height: 70vh;
    left: 8px !important;
    right: 8px !important;
    bottom: 90px !important;
  }
}
</style>
