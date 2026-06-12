<template>
  <div class="workspace-root">

    <!-- ═══ 上半：像素场景 ═══ -->
    <div class="ws-scene" @click.self="handleSceneClick">
      <!-- 背景墙 -->
      <div class="ws-wall ws-wall-left"></div>
      <div class="ws-wall ws-wall-right"></div>
      <div class="ws-floor"></div>

      <!-- 左上：分析台 -->
      <div class="ws-item ws-desk-map" @click="goTo('/investment/market')" title="市场分析台">
        <svg width="96" height="80" viewBox="0 0 96 80" class="pixel-svg">
          <rect x="8" y="32" width="80" height="8" fill="#6B4C2A"/>
          <rect x="8" y="40" width="8" height="32" fill="#5A3D20"/>
          <rect x="80" y="40" width="8" height="32" fill="#5A3D20"/>
          <rect x="16" y="16" width="64" height="16" fill="#D4A96A" rx="2"/>
          <rect x="18" y="18" width="60" height="12" fill="#C8974A"/>
          <line x1="24" y1="22" x2="40" y2="26" stroke="#8B6914" stroke-width="1"/>
          <line x1="40" y1="26" x2="56" y2="20" stroke="#8B6914" stroke-width="1"/>
          <line x1="56" y1="20" x2="68" y2="24" stroke="#8B6914" stroke-width="1"/>
          <rect x="60" y="24" width="12" height="8" fill="#4A7C59"/>
          <rect x="62" y="25" width="8" height="6" fill="#3D6B4A"/>
          <rect x="12" y="28" width="6" height="4" fill="#7A4F2E"/>
          <ellipse cx="15" cy="26" rx="6" ry="5" fill="#4A8C3F"/>
          <ellipse cx="12" cy="24" rx="4" ry="4" fill="#3D7A32"/>
          <ellipse cx="18" cy="23" rx="4" ry="4" fill="#56A044"/>
        </svg>
        <div class="ws-label">市场分析台</div>
      </div>

      <!-- 中上：咖啡角（点击唤起对话） -->
      <div class="ws-item ws-coffee ws-item--clickable" @click="handleTalkToAdam" title="和亚当说话">
        <svg width="80" height="72" viewBox="0 0 80 72" class="pixel-svg">
          <rect x="4" y="32" width="72" height="8" fill="#8B6340"/>
          <rect x="4" y="40" width="72" height="4" fill="#7A5230"/>
          <rect x="28" y="12" width="24" height="20" fill="#2A2A2A" rx="2"/>
          <rect x="30" y="14" width="20" height="12" fill="#1A1A1A"/>
          <circle cx="40" cy="20" r="4" fill="#C8844A"/>
          <rect x="36" y="24" width="8" height="4" fill="#3A3A3A"/>
          <rect x="52" y="24" width="10" height="8" fill="#E8E0D0" rx="1"/>
          <rect x="53" y="25" width="8" height="6" fill="#C8A87A"/>
          <rect x="62" y="26" width="3" height="4" fill="#E8E0D0" rx="1"/>
          <rect x="10" y="26" width="6" height="6" fill="#6B4C2A"/>
          <ellipse cx="13" cy="24" rx="5" ry="5" fill="#4A8C3F"/>
          <ellipse cx="10" cy="22" rx="3" ry="3" fill="#3D7A32"/>
          <rect x="18" y="24" width="8" height="8" fill="#B8743A" rx="1"/>
          <rect x="20" y="22" width="4" height="2" fill="#A06430"/>
        </svg>
        <div class="ws-label">☕ 点击与亚当对话</div>
      </div>

      <!-- 右上：服务器 -->
      <div class="ws-item ws-server" @mouseenter="showServerTooltip = true" @mouseleave="showServerTooltip = false" title="Agent 集群">
        <svg width="80" height="88" viewBox="0 0 80 88" class="pixel-svg">
          <rect x="8" y="8" width="64" height="72" fill="#1A1A2E" rx="2"/>
          <rect x="10" y="10" width="60" height="68" fill="#16213E" rx="1"/>
          <rect x="14" y="14" width="52" height="8" fill="#0F3460" rx="1"/>
          <rect x="14" y="24" width="52" height="8" fill="#0F3460" rx="1"/>
          <rect x="14" y="34" width="52" height="8" fill="#0F3460" rx="1"/>
          <rect x="14" y="44" width="52" height="8" fill="#0F3460" rx="1"/>
          <rect x="14" y="54" width="52" height="8" fill="#0F3460" rx="1"/>
          <circle cx="60" cy="18" r="2" :fill="serverLights[0]" class="blink-light"/>
          <circle cx="60" cy="28" r="2" :fill="serverLights[1]" class="blink-light blink-delay-1"/>
          <circle cx="60" cy="38" r="2" :fill="serverLights[2]" class="blink-light blink-delay-2"/>
          <circle cx="60" cy="48" r="2" :fill="serverLights[3]" class="blink-light blink-delay-1"/>
          <circle cx="60" cy="58" r="2" :fill="serverLights[4]" class="blink-light"/>
          <rect x="16" y="16" width="20" height="2" fill="#00E5A0" opacity="0.6"/>
          <rect x="16" y="26" width="28" height="2" fill="#F5A623" opacity="0.6"/>
          <rect x="16" y="36" width="16" height="2" fill="#00D4FF" opacity="0.6"/>
          <rect x="16" y="46" width="24" height="2" fill="#00E5A0" opacity="0.6"/>
          <rect x="16" y="56" width="20" height="2" fill="#F5A623" opacity="0.5"/>
          <ellipse cx="68" cy="74" rx="8" ry="12" fill="#2D7A1F"/>
          <ellipse cx="64" cy="70" rx="6" ry="10" fill="#3A9626"/>
          <rect x="66" y="78" width="4" height="6" fill="#6B4C2A"/>
        </svg>
        <div v-if="showServerTooltip" class="ws-server-tooltip">
          <div class="tooltip-title">⚡ Agent 集群</div>
          <div v-for="w in workers" :key="w.name" class="tooltip-row">
            <span class="tooltip-dot" :style="{ background: w.active ? '#00E5A0' : '#555' }"></span>
            <span>{{ w.name }}</span>
          </div>
        </div>
        <div class="ws-label">Agent 集群</div>
      </div>

      <!-- 左下：电脑桌 -->
      <div class="ws-item ws-computer" @click="goTo('/investment')" title="观测舱">
        <svg width="88" height="80" viewBox="0 0 88 80" class="pixel-svg">
          <rect x="4" y="44" width="80" height="8" fill="#8B6340"/>
          <rect x="4" y="52" width="8" height="24" fill="#7A5230"/>
          <rect x="76" y="52" width="8" height="24" fill="#7A5230"/>
          <rect x="20" y="12" width="48" height="32" fill="#1A1A2E" rx="3"/>
          <rect x="22" y="14" width="44" height="28" fill="#0D0D1A"/>
          <polyline points="26,36 30,28 34,32 38,22 42,26 46,18 50,22 54,30 58,24 62,28" fill="none" stroke="#00E5A0" stroke-width="1.5"/>
          <line x1="26" y1="38" x2="62" y2="38" stroke="#333" stroke-width="0.5"/>
          <rect x="40" y="44" width="8" height="4" fill="#2A2A2A"/>
          <rect x="36" y="48" width="16" height="2" fill="#2A2A2A"/>
          <rect x="16" y="52" width="40" height="8" fill="#2A2A2A" rx="1"/>
          <rect x="18" y="53" width="36" height="4" fill="#333"/>
          <rect x="60" y="53" width="10" height="8" fill="#2A2A2A" rx="2"/>
          <line x1="65" y1="53" x2="65" y2="57" stroke="#444" stroke-width="1"/>
          <rect x="72" y="38" width="6" height="6" fill="#7A4F2E" rx="1"/>
          <ellipse cx="75" cy="36" rx="4" ry="4" fill="#4A8C3F"/>
        </svg>
        <div class="ws-label">观测舱</div>
      </div>

      <!-- 中间：水晶球 -->
      <div class="ws-item ws-orb">
        <div class="ws-orb-status">{{ orbStatusText }}</div>
        <svg width="80" height="96" viewBox="0 0 80 96" class="pixel-svg">
          <ellipse cx="40" cy="88" rx="24" ry="6" fill="#3A2810"/>
          <ellipse cx="40" cy="82" rx="16" ry="4" fill="#5A3D20"/>
          <rect x="32" y="72" width="16" height="12" fill="#4A2E14"/>
          <circle cx="40" cy="44" r="28" fill="#1A0A3E" opacity="0.9"/>
          <circle cx="40" cy="44" r="28" fill="url(#orbGrad)" opacity="0.8"/>
          <circle cx="32" cy="36" r="8" fill="#7B4FDE" opacity="0.5"/>
          <circle cx="48" cy="50" r="6" fill="#4A2FAA" opacity="0.4"/>
          <circle cx="36" cy="52" r="4" fill="#9B6FEE" opacity="0.6"/>
          <ellipse cx="32" cy="32" rx="8" ry="5" fill="white" opacity="0.15"/>
          <circle cx="44" cy="38" r="1" fill="#FFD700" opacity="0.8"/>
          <circle cx="50" cy="44" r="1.5" fill="#C0A0FF" opacity="0.9"/>
          <circle cx="38" cy="48" r="1" fill="#80C0FF" opacity="0.7"/>
          <defs>
            <radialGradient id="orbGrad" cx="40%" cy="35%">
              <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.8"/>
              <stop offset="60%" stop-color="#4C1D95" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#1A0A3E" stop-opacity="0.9"/>
            </radialGradient>
          </defs>
        </svg>
      </div>

      <!-- 右下：书架 -->
      <div class="ws-item ws-bookshelf" @click="goTo('/investment/library')" title="图书馆">
        <svg width="80" height="96" viewBox="0 0 80 96" class="pixel-svg">
          <rect x="4" y="4" width="72" height="88" fill="#6B4C2A" rx="2"/>
          <rect x="8" y="8" width="64" height="80" fill="#8B6340"/>
          <rect x="6" y="36" width="68" height="4" fill="#6B4C2A"/>
          <rect x="6" y="64" width="68" height="4" fill="#6B4C2A"/>
          <rect x="10" y="12" width="8" height="24" fill="#C0392B"/>
          <rect x="19" y="14" width="6" height="22" fill="#2980B9"/>
          <rect x="26" y="11" width="9" height="25" fill="#27AE60"/>
          <rect x="36" y="13" width="7" height="23" fill="#8E44AD"/>
          <rect x="44" y="12" width="8" height="24" fill="#E67E22"/>
          <rect x="53" y="14" width="6" height="22" fill="#16A085"/>
          <rect x="60" y="11" width="10" height="25" fill="#2C3E50"/>
          <rect x="10" y="40" width="7" height="24" fill="#E74C3C"/>
          <rect x="18" y="42" width="9" height="22" fill="#3498DB"/>
          <rect x="28" y="40" width="6" height="24" fill="#F39C12"/>
          <rect x="35" y="41" width="8" height="23" fill="#1ABC9C"/>
          <rect x="44" y="40" width="7" height="24" fill="#9B59B6"/>
          <rect x="52" y="42" width="10" height="22" fill="#E67E22"/>
          <rect x="63" y="40" width="7" height="24" fill="#2ECC71"/>
          <rect x="10" y="68" width="6" height="20" fill="#C0392B"/>
          <rect x="17" y="70" width="8" height="18" fill="#2980B9"/>
          <rect x="26" y="68" width="7" height="20" fill="#27AE60"/>
          <rect x="36" y="72" width="6" height="12" fill="#A0D4F0" rx="1"/>
          <rect x="38" y="70" width="2" height="2" fill="#80B4D0"/>
          <rect x="48" y="80" width="4" height="8" fill="#C8A878"/>
          <ellipse cx="52" cy="76" rx="10" ry="6" fill="#F5E070" opacity="0.9"/>
          <rect x="60" y="78" width="8" height="8" fill="#6B4C2A" rx="1"/>
          <ellipse cx="64" cy="74" rx="7" ry="7" fill="#4A8C3F"/>
          <ellipse cx="61" cy="71" rx="5" ry="5" fill="#3D7A32"/>
        </svg>
        <div class="ws-label">图书馆</div>
      </div>

      <!-- 亚当像素小人 -->
      <div class="ws-adam" :class="[`adam-anim-${adamAnim}`, `adam-pos-${adamPos}`]" @click="handleTalkToAdam" title="点击和亚当对话">
        <svg width="32" height="48" viewBox="0 0 32 48" class="pixel-svg adam-sprite">
          <rect x="10" y="2" width="12" height="4" fill="#2A1A08"/>
          <rect x="8" y="4" width="16" height="2" fill="#2A1A08"/>
          <rect x="8" y="6" width="16" height="12" fill="#F5C18A"/>
          <rect x="10" y="10" width="3" height="3" fill="#1A1A1A"/>
          <rect x="19" y="10" width="3" height="3" fill="#1A1A1A"/>
          <rect x="11" y="10" width="1" height="1" fill="white"/>
          <rect x="20" y="10" width="1" height="1" fill="white"/>
          <rect x="13" y="15" width="6" height="2" fill="#C87050"/>
          <rect x="12" y="14" width="2" height="2" fill="#C87050"/>
          <rect x="18" y="14" width="2" height="2" fill="#C87050"/>
          <rect x="6" y="10" width="2" height="4" fill="#F0B070"/>
          <rect x="24" y="10" width="2" height="4" fill="#F0B070"/>
          <rect x="8" y="18" width="16" height="14" fill="#F5A623"/>
          <rect x="6" y="18" width="4" height="12" fill="#E08B14"/>
          <rect x="22" y="18" width="4" height="12" fill="#E08B14"/>
          <rect x="14" y="18" width="4" height="14" fill="#D4901A"/>
          <rect x="12" y="17" width="8" height="3" fill="#F0F0F0"/>
          <rect x="4" y="24" width="4" height="4" fill="#F5C18A"/>
          <rect x="24" y="24" width="4" height="4" fill="#F5C18A"/>
          <rect x="8" y="32" width="7" height="12" fill="#2A3A5A"/>
          <rect x="17" y="32" width="7" height="12" fill="#2A3A5A"/>
          <rect x="6" y="44" width="10" height="3" fill="#1A1A1A"/>
          <rect x="16" y="44" width="10" height="3" fill="#1A1A1A"/>
        </svg>
        <div v-if="showBubble" class="adam-bubble">{{ bubbleText }}</div>
      </div>

      <!-- 底部状态条 -->
      <div class="ws-statusbar">
        <div class="ws-status-dot-wrap">
          <span class="ws-status-dot" :class="statusDotClass"></span>
        </div>
        <span class="ws-status-name">亚当</span>
        <span class="ws-status-sep">|</span>
        <span class="ws-status-text">{{ statusLabel }}</span>
        <div class="ws-status-right">
          <span class="ws-stat">💰 {{ formatBudget(adamStore.core.budget) }}</span>
          <span class="ws-stat">⚡ {{ adamStore.core.energy }}%</span>
          <span class="ws-credit" :class="`credit-${adamStore.core.creditLevel.replace('+','p')}`">{{ adamStore.core.creditLevel }}</span>
        </div>
      </div>
    </div>

    <!-- ═══ 下半：对话框（参考图风格，固定在底部） ═══ -->
    <div class="ws-chat-panel">
      <!-- 头部：标签 + 状态 -->
      <div class="wcp-head">
        <span class="wcp-icon">⟐</span>
        <span class="wcp-title">COMM_CHANNEL</span>
        <span class="wcp-desc">与亚当通讯</span>
        <span class="wcp-status" :class="{ online: adamStore.isAlive }">
          {{ adamStore.isAlive ? 'CONNECTED' : 'OFFLINE' }}
        </span>
      </div>

      <!-- 消息区 -->
      <div ref="messagesDiv" class="wcp-messages">
        <div v-if="messages.length === 0" class="wcp-empty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.25"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <p>可以描述任务或提问任何问题...</p>
        </div>
        <div v-for="msg in messages" :key="msg.id" class="wcp-msg" :class="msg.role">
          <span class="wcp-avatar" :class="msg.role">
            <img v-if="msg.role === 'assistant'" :src="adamAvatarUrl" class="wcp-avatar-img" alt="亚当"/>
            <template v-else>U</template>
          </span>
          <div class="wcp-msg-body">
            <div class="wcp-msg-meta">
              <span class="wcp-sender">{{ msg.role === 'user' ? 'OPERATOR' : 'ADAM' }}</span>
              <span class="wcp-time">{{ msg.time }}</span>
            </div>
            <div class="wcp-content" v-html="renderMarkdown(msg.content)"></div>
            <div v-if="msg.images?.length" class="wcp-images">
              <img v-for="(url, i) in msg.images" :key="i" :src="url" class="wcp-img-thumb"/>
            </div>
            <div v-if="msg.toolCalls?.length" class="wcp-tools">
              <div v-for="call in msg.toolCalls" :key="call.id" class="wcp-tool-card" :class="call.status">
                <span class="wcp-tool-dot"></span>
                <span class="wcp-tool-name">{{ call.name }}</span>
                <span class="wcp-tool-status">{{ call.status === 'running' ? 'EXECUTING' : call.status === 'success' ? 'DONE' : 'FAILED' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="isLoading" class="wcp-msg assistant">
          <span class="wcp-avatar assistant"><img :src="adamAvatarUrl" class="wcp-avatar-img" alt="亚当"/></span>
          <div class="wcp-msg-body">
            <div class="wcp-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区（参考图风格） -->
      <div class="wcp-input-area">
        <div v-if="pendingImages.length" class="wcp-pending-imgs">
          <div v-for="(img, idx) in pendingImages" :key="idx" class="wcp-pending-img-wrap">
            <img :src="img.previewUrl" class="wcp-pending-img"/>
            <button class="wcp-pending-remove" @click="removePendingImage(idx)">×</button>
          </div>
        </div>
        <div class="wcp-input-row">
          <button class="wcp-img-btn" title="发送图片" @click="openImagePicker" :disabled="isLoading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <textarea
            ref="inputRef"
            v-model="inputText"
            class="wcp-input"
            placeholder="可以描述任务或提问任何问题，按 Enter 发送..."
            rows="1"
            @keydown.enter.exact.prevent="handleSend"
            @input="autoResize"
            @paste="onPaste"
          />
          <button class="wcp-send-btn" :disabled="(!inputText.trim() && !pendingImages.length) || isLoading" @click="handleSend">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/>
            </svg>
          </button>
        </div>
        <input ref="fileInputRef" type="file" accept="image/*" multiple style="display:none" @change="onFileChange"/>
        <div style="font-size:9px;color:#888;text-align:right;padding:2px 8px 0;opacity:0.5;">v2026-06-08c</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdamStore } from '@/stores/adam'
import { applyToolResult } from '@/utils/adamToolSync'
import { marked } from 'marked'
import adamAvatarUrl from '@/assets/adam-avatar.png'

marked.setOptions({ breaks: true, gfm: true })

const router = useRouter()
const adamStore = useAdamStore()

// ── 场景状态 ──
const showServerTooltip = ref(false)
const showBubble = ref(false)
const bubbleText = ref('')
const adamAnim = ref<'idle' | 'working' | 'walk'>('idle')
const adamPos = ref<'coffee' | 'center' | 'desk'>('coffee')

const bubbles = ['分析中...', '市场有异动', '发现机会', '在看数据', '研报更新了', '嗯...', '这个值得关注']
let bubbleTimer: number | undefined
let animTimer: number | undefined

onMounted(() => {
  loadHistoryFromStorage()
  if (adamStore.core.status === 'alive') pollMessages()

  bubbleTimer = window.setInterval(() => {
    if (Math.random() > 0.6) {
      bubbleText.value = bubbles[Math.floor(Math.random() * bubbles.length)]
      showBubble.value = true
      setTimeout(() => { showBubble.value = false }, 2800)
    }
  }, 6000)
  animTimer = window.setInterval(() => {
    const states: typeof adamAnim.value[] = ['idle', 'idle', 'idle', 'working', 'walk']
    adamAnim.value = states[Math.floor(Math.random() * states.length)]
    setTimeout(() => { adamAnim.value = 'idle' }, 1200)
  }, 4000)
})

onUnmounted(() => {
  clearInterval(bubbleTimer)
  clearInterval(animTimer)
  if (pollTimer) clearInterval(pollTimer)
})

function handleTalkToAdam() {
  showBubble.value = true
  bubbleText.value = '嗯，说吧。'
  setTimeout(() => { showBubble.value = false }, 2500)
  nextTick(() => inputRef.value?.focus())
}

function handleSceneClick() {
  adamPos.value = 'center'
  adamAnim.value = 'walk'
  setTimeout(() => { adamAnim.value = 'idle' }, 800)
}

function goTo(path: string) { router.push(path) }

const serverLights = computed(() => {
  const alive = adamStore.isAlive
  return [
    alive ? '#00E5A0' : '#334', alive ? '#F5A623' : '#334',
    alive ? '#00D4FF' : '#334', alive ? '#00E5A0' : '#334',
    alive ? '#F5A623' : '#334',
  ]
})

const workers = [
  { name: 'market-scanner', active: true },
  { name: 'message-worker', active: true },
  { name: 'budget-settler', active: false },
  { name: 'personality-updater', active: true },
]

const statusLabel = computed(() => {
  const s = adamStore.core.status
  return s === 'dormant' ? '待命中...' : s === 'alive' ? '运行中' : s === 'survival' ? '存活模式' : '已关闭'
})
const statusDotClass = computed(() => {
  const s = adamStore.core.status
  return s === 'alive' ? 'dot-alive' : s === 'survival' ? 'dot-survival' : s === 'shutdown' ? 'dot-shutdown' : 'dot-dormant'
})
const orbStatusText = computed(() => {
  if (adamStore.latestRecommendation) {
    const r = adamStore.latestRecommendation
    return `${r.ticker || ''} ${r.action || ''}`
  }
  return adamStore.core.status === 'alive' ? '观察中' : '沉眠'
})
function formatBudget(v: number) {
  return v >= 10000 ? `${(v / 10000).toFixed(1)}w` : `${v}`
}

// ── 对话逻辑（复用 AdamChat 的核心逻辑） ──
const HISTORY_KEY = 'adam_chat_history'
const HISTORY_VERSION = 'adam_chat_v2'
const MAX_HISTORY = 80

// 首次加载时若版本不匹配，清除旧的污染历史
if (!localStorage.getItem(HISTORY_VERSION)) {
  localStorage.removeItem(HISTORY_KEY)
  localStorage.setItem(HISTORY_VERSION, '1')
}

interface ToolCallState { id: string; name: string; input: Record<string, any>; status: 'running' | 'success' | 'error'; result?: string }
interface ImageItem { previewUrl: string; data: string; mediaType: string }
interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; time: string; images?: string[]; toolCalls?: ToolCallState[] }

const messagesDiv = ref<HTMLDivElement>()
const inputRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isLoading = ref(false)
const pendingImages = ref<ImageItem[]>([])
let pollTimer: number | undefined

function isCleanContent(content: unknown): boolean {
  const c = String(content ?? '').trim()
  return !!c && !/^(\s*undefined\s*)+$/i.test(c) && !/^undefined/i.test(c) && c.toLowerCase() !== 'null'
}

function getEventText(ev: any): string {
  const text = ev?.text ?? ev?.content
  return isCleanContent(text) ? String(text) : ''
}

function sanitizeMessages(raw: any[]): ChatMessage[] {
  return (Array.isArray(raw) ? raw : [])
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && isCleanContent(m.content))
    .map((m: any) => ({
      ...m,
      content: String(m.content),
      toolCalls: Array.isArray(m.toolCalls) ? m.toolCalls : undefined,
    }))
}

function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      messages.value = sanitizeMessages(parsed)
    }
  } catch { /* ignore */ }
}

function persistHistory() {
  try {
    const trimmed = sanitizeMessages(messages.value).slice(-MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  } catch { /* ignore */ }
}

function renderMarkdown(content: string): string {
  const clean = isCleanContent(content) ? String(content) : ''
  try { return marked(clean) as string } catch { return clean }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesDiv.value) messagesDiv.value.scrollTop = messagesDiv.value.scrollHeight
  })
}

function autoResize() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
}

async function pollMessages() {
  const token = localStorage.getItem('erp_token') || ''
  try {
    const res = await fetch('/api/adam/messages', { headers: { 'x-erp-token': token } })
    if (!res.ok) return
    const data = await res.json() as { messages?: Array<{ content: string; time: string }> }
    if (data.messages?.length) {
      for (const m of data.messages) {
        if (!isCleanContent(m.content)) continue
        messages.value.push({ id: Date.now() + Math.random() + '', role: 'assistant', content: String(m.content), time: m.time })
      }
      scrollToBottom()
      persistHistory()
    }
  } catch { /* ignore */ }
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text && !pendingImages.value.length) return
  if (isLoading.value) return

  const userMsg: ChatMessage = {
    id: Date.now() + '',
    role: 'user',
    content: text,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    images: pendingImages.value.map(i => i.previewUrl),
  }
  messages.value.push(userMsg)
  const sentImages = [...pendingImages.value]
  const previewUrls = sentImages.map(i => i.previewUrl)
  inputText.value = ''
  pendingImages.value = []
  if (inputRef.value) inputRef.value.style.height = 'auto'
  isLoading.value = true
  scrollToBottom()

  const token = localStorage.getItem('erp_token') || ''
  const assistantMsg: ChatMessage = {
    id: Date.now() + '_a',
    role: 'assistant',
    content: '',
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    toolCalls: [],
  }

  try {
    const cleanHistory = messages.value
      .filter(m => (m.role === 'user' || m.role === 'assistant') && isCleanContent(m.content))
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))
    const body: any = { message: text, history: cleanHistory }
    if (sentImages.length) body.images = sentImages.map(i => ({ data: i.data, mediaType: i.mediaType }))

    const res = await fetch('/api/adam-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (!res.body) throw new Error('No body')

    messages.value.push(assistantMsg)
    scrollToBottom()

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break
        try {
          const ev = JSON.parse(raw)
          if (ev.type === 'text') {
            const text = getEventText(ev)
            if (text) {
              assistantMsg.content += text
              scrollToBottom()
            }
          } else if (ev.type === 'tool_start') {
            assistantMsg.toolCalls!.push({ id: ev.id, name: ev.name, input: ev.input, status: 'running' })
            scrollToBottom()
          } else if (ev.type === 'tool_result') {
            const tc = assistantMsg.toolCalls!.find(t => t.id === ev.id)
            if (tc) { tc.status = ev.isError ? 'error' : 'success'; tc.result = ev.result ?? ev.content }
            if (!ev.isError) applyToolResult(adamStore, ev.name, ev.result ?? ev.content ?? '')
            scrollToBottom()
          } else if (ev.type === 'error') {
            assistantMsg.content += `\n[错误: ${ev.error}]`
            scrollToBottom()
          }
        } catch { /* ignore parse */ }
      }
    }
  } catch (e: any) {
    if (!assistantMsg.content) assistantMsg.content = `CONNECTION_FAILED: ${e.message}`
    if (!messages.value.includes(assistantMsg)) messages.value.push(assistantMsg)
  } finally {
    if (!isCleanContent(assistantMsg.content)) {
      assistantMsg.content = assistantMsg.toolCalls?.length
        ? '我刚才完成了工具检查，但没有组织出完整回复。请再发一次问题，我会直接给结论。'
        : '我在，但这次没有生成有效回复。请再发一次。'
    }
    isLoading.value = false
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    persistHistory()
    scrollToBottom()
  }
}

function openImagePicker() { fileInputRef.value?.click() }

function compressToJpeg(file: File): Promise<{ data: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1600; let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const data = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
        resolve({ data, previewUrl: URL.createObjectURL(file) })
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject; reader.readAsDataURL(file)
  })
}

async function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    const { data, previewUrl } = await compressToJpeg(file)
    pendingImages.value.push({ previewUrl, data, mediaType: 'image/jpeg' })
  }
  ;(e.target as HTMLInputElement).value = ''
}

async function onPaste(e: ClipboardEvent) {
  const items = Array.from(e.clipboardData?.items ?? []).filter(i => i.type.startsWith('image/'))
  for (const item of items) {
    const file = item.getAsFile(); if (!file) continue
    const { data, previewUrl } = await compressToJpeg(file)
    pendingImages.value.push({ previewUrl, data, mediaType: 'image/jpeg' })
  }
}

function removePendingImage(idx: number) {
  URL.revokeObjectURL(pendingImages.value[idx].previewUrl)
  pendingImages.value.splice(idx, 1)
}
</script>

<style scoped>
.workspace-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1A1208;
  font-family: 'SF Mono', 'Fira Code', monospace;
  overflow: hidden;
}

/* ════════════════════════════
   上半：像素场景
════════════════════════════ */
.ws-scene {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.ws-wall { position: absolute; top: 0; width: 50%; height: 58%; }
.ws-wall-left {
  left: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(60,40,20,0.4) 23px, rgba(60,40,20,0.4) 24px),
    repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(60,40,20,0.3) 31px, rgba(60,40,20,0.3) 32px),
    #2A1E12;
}
.ws-wall-right {
  right: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(40,30,15,0.4) 23px, rgba(40,30,15,0.4) 24px),
    repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(40,30,15,0.3) 31px, rgba(40,30,15,0.3) 32px),
    #241A0E;
}
.ws-floor {
  position: absolute; bottom: 36px; left: 0; right: 0; height: 42%;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(80,55,25,0.3) 15px, rgba(80,55,25,0.3) 16px),
    repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(80,55,25,0.2) 23px, rgba(80,55,25,0.2) 24px),
    #1E1408;
}

.ws-item {
  position: absolute; display: flex; flex-direction: column; align-items: center;
  cursor: pointer; transition: transform 0.15s;
}
.ws-item:hover { transform: scale(1.04) translateY(-2px); }
.ws-item:hover .ws-label { color: #F5A623; }
.ws-item--clickable { cursor: pointer; }
.ws-label { font-size: 10px; color: #8B7355; margin-top: 4px; white-space: nowrap; transition: color 0.15s; }
.pixel-svg { image-rendering: pixelated; }

.ws-desk-map  { left: 2%;  top: 3%; }
.ws-coffee    { left: 36%; top: 1%; }
.ws-server    { right: 1%; top: 1%; }
.ws-computer  { left: 1%;  bottom: 52px; }
.ws-orb       { left: 50%; transform: translateX(-50%); bottom: 36px; cursor: default; }
.ws-orb:hover { transform: translateX(-50%) !important; }
.ws-bookshelf { right: 1%; bottom: 44px; }

.ws-orb-status {
  position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
  font-size: 9px; color: #C0A0FF; white-space: nowrap;
  text-shadow: 0 0 8px #8B5CF6; letter-spacing: 1px;
  animation: orb-pulse 3s ease-in-out infinite;
}
@keyframes orb-pulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; text-shadow: 0 0 14px #8B5CF6; } }

.ws-server-tooltip {
  position: absolute; top: 8px; right: 88px;
  background: rgba(10,10,30,0.96); border: 1px solid #2A3A5A;
  border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #A0B0C0;
  white-space: nowrap; z-index: 10; pointer-events: none;
}
.tooltip-title { color: #F5A623; font-size: 10px; margin-bottom: 5px; letter-spacing: 1px; }
.tooltip-row { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.tooltip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

.blink-light { animation: blink-anim 2.4s ease-in-out infinite; }
.blink-delay-1 { animation-delay: 0.8s; } .blink-delay-2 { animation-delay: 1.6s; }
@keyframes blink-anim { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

/* 亚当小人 */
.ws-adam {
  position: absolute; z-index: 5; cursor: pointer;
  transition: left 0.8s ease, bottom 0.8s ease;
}
.adam-pos-coffee { left: 43%; bottom: 120px; }
.adam-pos-center { left: 48%; bottom: 90px; }
.adam-pos-desk   { left: 15%; bottom: 100px; }

.adam-anim-idle .adam-sprite    { animation: adam-idle 2s ease-in-out infinite; }
.adam-anim-working .adam-sprite { animation: adam-work 0.3s steps(2) infinite; }
.adam-anim-walk .adam-sprite    { animation: adam-walk 0.25s steps(2) infinite; }
@keyframes adam-idle    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes adam-work    { 0% { transform: translateY(0) rotate(-2deg); } 100% { transform: translateY(-1px) rotate(2deg); } }
@keyframes adam-walk    { 0% { transform: translateY(0); } 100% { transform: translateY(-2px); } }

.adam-bubble {
  position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%);
  background: rgba(20,14,6,0.95); border: 1px solid #F5A623;
  border-radius: 8px 8px 8px 0; padding: 5px 10px;
  font-size: 11px; color: #F5C87A; white-space: nowrap;
  pointer-events: none; animation: bubble-in 0.2s ease; z-index: 10;
}
.adam-bubble::after {
  content: ''; position: absolute; bottom: -5px; left: 8px;
  border-left: 5px solid transparent; border-right: 5px solid transparent;
  border-top: 5px solid #F5A623;
}
@keyframes bubble-in { from { opacity: 0; transform: translateX(-50%) scale(0.8); } to { opacity: 1; transform: translateX(-50%) scale(1); } }

/* 底部状态条 */
.ws-statusbar {
  position: absolute; bottom: 0; left: 0; right: 0; height: 36px;
  background: rgba(12,8,2,0.96); border-top: 1px solid #2A1E10;
  display: flex; align-items: center; gap: 8px; padding: 0 14px; z-index: 6;
}
.ws-status-dot-wrap { width: 22px; height: 22px; border-radius: 50%; background: #2A1E10; border: 1px solid #4A3020; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ws-status-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-alive    { background: #00E5A0; box-shadow: 0 0 6px #00E5A0; animation: pulse-dot 2s infinite; }
.dot-dormant  { background: #888; }
.dot-survival { background: #F5A623; box-shadow: 0 0 6px #F5A623; animation: pulse-dot 1s infinite; }
.dot-shutdown { background: #FF4D4D; }
@keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.ws-status-name { font-size: 11px; color: #F5A623; font-weight: 700; }
.ws-status-sep  { color: #3A2810; }
.ws-status-text { font-size: 10px; color: #8B7355; flex: 1; }
.ws-status-right { display: flex; align-items: center; gap: 8px; }
.ws-stat { font-size: 10px; color: #A08060; }
.ws-credit { padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 700; border: 1px solid; }
.credit-C  { color: #888;    border-color: #888; }
.credit-B  { color: #4A8CFF; border-color: #4A8CFF; }
.credit-Bp { color: #00D4FF; border-color: #00D4FF; }
.credit-A  { color: #F5A623; border-color: #F5A623; }
.credit-S  { color: #FFD700; border-color: #FFD700; }

/* ════════════════════════════
   下半：对话框（参考图底栏风格）
════════════════════════════ */
.ws-chat-panel {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--card-bg, #181210);
  border-top: 1px solid #2A1E10;
  height: 280px;
}

.wcp-head {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-bottom: 1px solid #2A1E10;
  background: rgba(245,166,35,0.02);
  flex-shrink: 0;
}
.wcp-icon { font-size: 10px; color: #00D4FF; }
.wcp-title { font-size: 10px; font-weight: 700; color: #8B7355; letter-spacing: 0.12em; }
.wcp-desc  { font-size: 10px; color: #8B7355; opacity: 0.5; }
.wcp-status {
  margin-left: auto; font-size: 8px; font-weight: 700; letter-spacing: 0.1em;
  padding: 2px 7px; border-radius: 3px; background: #2A1E10; color: #666;
}
.wcp-status.online { color: #00E5A0; background: rgba(0,229,160,0.06); }

.wcp-messages {
  flex: 1; overflow-y: auto; padding: 10px 16px;
  scrollbar-width: thin; scrollbar-color: #2A1E10 transparent;
  min-height: 0;
}
.wcp-empty {
  height: 100%; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; color: #5A4A30; opacity: 0.6;
}
.wcp-empty p { font-size: 11px; margin: 0; }

.wcp-msg { display: flex; gap: 8px; padding: 6px 0; }
.wcp-msg + .wcp-msg { border-top: 1px solid rgba(42,30,16,0.6); }
.wcp-avatar {
  width: 20px; height: 20px; border-radius: 4px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 800; overflow: hidden;
}
.wcp-avatar.user      { background: #2A1E10; color: #8B7355; border: 1px solid #3A2810; }
.wcp-avatar.assistant { background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.2); padding: 0; }
.wcp-avatar-img { width: 100%; height: 100%; object-fit: contain; display: block; }
.wcp-msg-body { flex: 1; min-width: 0; }
.wcp-msg-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.wcp-sender { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; }
.wcp-msg.user      .wcp-sender { color: #8B7355; }
.wcp-msg.assistant .wcp-sender { color: #F5A623; }
.wcp-time { font-size: 8px; color: #5A4A30; opacity: 0.6; }
.wcp-content {
  font-size: 12px; line-height: 1.6; color: var(--dark, #C8B090);
  font-family: 'Inter', 'PingFang SC', sans-serif;
}
.wcp-msg.user .wcp-content { color: #A09070; }
.wcp-content :deep(p) { margin: 0 0 4px; }
.wcp-content :deep(p:last-child) { margin-bottom: 0; }
.wcp-content :deep(code) { font-family: 'SF Mono', monospace; font-size: 11px; background: #2A1E10; padding: 1px 4px; border-radius: 3px; color: #F5A623; }
.wcp-content :deep(strong) { color: #D4A878; }

.wcp-images { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.wcp-img-thumb { max-width: 160px; max-height: 120px; border-radius: 4px; object-fit: cover; border: 1px solid #2A1E10; }

.wcp-tools { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
.wcp-tool-card {
  display: flex; align-items: center; gap: 6px;
  background: #1A1208; border: 1px solid #2A1E10; border-radius: 4px;
  padding: 5px 8px; font-size: 10px;
}
.wcp-tool-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.wcp-tool-card.running .wcp-tool-dot  { background: #00D4FF; animation: indicatorPulse 1s infinite; }
.wcp-tool-card.success .wcp-tool-dot  { background: #00E5A0; }
.wcp-tool-card.error   .wcp-tool-dot  { background: #FF4D4D; }
.wcp-tool-name { color: #8B7355; }
.wcp-tool-status { margin-left: auto; font-size: 8px; font-weight: 700; letter-spacing: 0.08em; }
.wcp-tool-card.running .wcp-tool-status { color: #00D4FF; }
.wcp-tool-card.success .wcp-tool-status { color: #00E5A0; }
.wcp-tool-card.error   .wcp-tool-status { color: #FF4D4D; }
@keyframes indicatorPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.2; } }

.wcp-typing { display: flex; gap: 4px; padding: 4px 0; }
.wcp-typing span { width: 5px; height: 5px; border-radius: 50%; background: #F5A623; animation: typing 1.2s ease-in-out infinite; }
.wcp-typing span:nth-child(2) { animation-delay: 0.2s; }
.wcp-typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%,60%,100% { opacity: 0.15; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-4px); } }

/* 输入区 */
.wcp-input-area {
  border-top: 1px solid #2A1E10; padding: 10px 16px 12px;
  background: rgba(20,14,6,0.8); flex-shrink: 0;
}
.wcp-pending-imgs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.wcp-pending-img-wrap { position: relative; }
.wcp-pending-img { width: 48px; height: 48px; border-radius: 4px; object-fit: cover; border: 1px solid #3A2810; }
.wcp-pending-remove {
  position: absolute; top: -4px; right: -4px; width: 14px; height: 14px;
  border-radius: 50%; background: #FF4D4D; border: none; color: white;
  font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
}

.wcp-input-row {
  display: flex; align-items: flex-end; gap: 8px;
  background: #1A1208; border: 1px solid #2A1E10; border-radius: 8px;
  padding: 6px 8px;
}
.wcp-img-btn {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 5px;
  border: 1px solid #2A1E10; background: transparent; color: #5A4A30;
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.15s;
}
.wcp-img-btn:hover:not(:disabled) { color: #F5A623; border-color: #F5A623; }
.wcp-img-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.wcp-input {
  flex: 1; background: transparent; border: none; outline: none;
  resize: none; color: #C8B090; font-size: 12px; line-height: 1.5;
  font-family: 'Inter', 'PingFang SC', sans-serif;
  min-height: 24px; max-height: 100px;
}
.wcp-input::placeholder { color: #5A4A30; }
.wcp-send-btn {
  flex-shrink: 0; width: 32px; height: 32px; border-radius: 6px;
  background: #F5A623; border: none; color: #1A1208;
  cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.wcp-send-btn:hover:not(:disabled) { background: #FFB84D; }
.wcp-send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
