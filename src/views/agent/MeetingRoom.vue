<template>
  <div class="meeting-room">

    <!-- ── 顶部：会议室标题 + 参与者头像 ── -->
    <div class="meeting-header">
      <div class="meeting-header-left">
        <div class="meeting-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round">
            <rect x="2" y="3" width="16" height="11" rx="2.5"/>
            <path d="M7 17h6M10 14v3"/>
            <circle cx="5.5" cy="8.5" r="1.3" fill="#6366f1" opacity=".7"/>
            <circle cx="10" cy="8.5" r="1.3" fill="#6366f1" opacity=".7"/>
            <circle cx="14.5" cy="8.5" r="1.3" fill="#6366f1" opacity=".7"/>
          </svg>
        </div>
        <div class="meeting-meta">
          <h2 class="meeting-title">会议室</h2>
          <div class="meeting-topic" v-if="meetingStore.topic">
            <span class="topic-label">议题：</span>
            <span class="topic-text">{{ meetingStore.topic }}</span>
            <span class="phase-badge" :class="'phase-' + meetingStore.phase">{{ phaseLabel }}</span>
          </div>
          <div class="meeting-topic empty" v-else>等待开始会议…</div>
        </div>
      </div>

      <!-- 参与者头像列表（职位标识） -->
      <div class="participants">
        <div
          v-for="(staff, key) in STAFF"
          :key="key"
          class="participant-avatar"
          :class="{ speaking: speakingAgent === key }"
          :style="{ background: staff.color + '18', color: staff.color, borderColor: speakingAgent === key ? staff.color : 'transparent', '--speak-color': staff.color }"
          :title="staff.title"
        >{{ staff.emoji }}</div>
      </div>

      <!-- 会议纪要面板切换按钮 -->
      <button
        v-if="meetingStore.phase === 'done' && meetingStore.summary"
        class="summary-toggle-btn"
        @click="showSummaryPanel = !showSummaryPanel"
        :title="showSummaryPanel ? '收起纪要' : '展开纪要'"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <rect x="1" y="1" width="12" height="12" rx="2"/>
          <path d="M4 4.5h6M4 7h6M4 9.5h4"/>
        </svg>
        会议纪要
        <span class="summary-badge">●</span>
      </button>
    </div>

    <!-- ── 流水线步骤条（执行阶段显示） ── -->
    <div v-if="meetingStore.phase === 'executing' || meetingStore.phase === 'done'" class="pipeline-bar">
      <div
        v-for="(step, i) in pipelineSteps"
        :key="i"
        class="pb-step"
        :class="{
          'pb-done':    i < pipelineCurrentStep,
          'pb-active':  i === pipelineCurrentStep && meetingStore.phase === 'executing',
          'pb-pending': i > pipelineCurrentStep
        }"
      >
        <div class="pb-dot">
          <svg v-if="i < pipelineCurrentStep" width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4l2 2 3-3" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <span v-else-if="i === pipelineCurrentStep && meetingStore.phase === 'executing'" class="pb-pulse"></span>
        </div>
        <span class="pb-label">{{ step.label }}</span>
        <div v-if="i < pipelineSteps.length - 1" class="pb-line" :class="{ done: i < pipelineCurrentStep }"></div>
      </div>
    </div>

    <!-- ── 主体区域（消息流 + 可选纪要面板） ── -->
    <div class="meeting-body" :class="{ 'has-summary': showSummaryPanel }">

      <!-- 消息流 -->
      <div class="messages-area" ref="messagesEl">
        <!-- 空状态引导 -->
        <div v-if="meetingStore.messages.length === 0" class="meeting-empty">
          <div class="empty-hero">
            <div class="empty-staff-row">
              <div
                v-for="(s, k) in STAFF"
                :key="k"
                class="empty-staff-avatar"
                :style="{ background: s.color + '18', color: s.color }"
                :title="s.title"
              >{{ s.emoji }}</div>
            </div>
            <div class="empty-title">数字广告部门全员就绪</div>
            <div class="empty-desc">输入会议议题，Captain 将主持，各专员依次发言讨论内容策略</div>
          </div>
          <div class="empty-steps">
            <div class="empty-step" v-for="(s, i) in meetingSteps" :key="i">
              <span class="step-num">{{ i + 1 }}</span>
              <span>{{ s }}</span>
            </div>
          </div>
        </div>

        <!-- 消息气泡 -->
        <div
          v-for="msg in meetingStore.messages"
          :key="msg.id"
          class="message-row"
          :class="msg.role === 'user' ? 'row-user' : msg.role === 'captain' ? 'row-captain' : 'row-member'"
        >
          <!-- 用户插话（右侧简洁气泡） -->
          <template v-if="msg.role === 'user'">
            <div class="msg-bubble-wrap user-wrap">
              <div class="msg-meta" style="justify-content:flex-end">
                <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
                <span class="msg-name" style="color:#0071e3">你</span>
              </div>
              <div class="msg-bubble bubble-user">
                <div class="msg-content" v-html="renderContent(msg.content)"></div>
              </div>
            </div>
          </template>

          <!-- Agent / Captain 消息 -->
          <template v-else>
            <div
              class="msg-avatar"
              :style="{ background: msg.agentColor + '18', color: msg.agentColor }"
            >{{ msg.agentEmoji }}</div>
            <div class="msg-bubble-wrap">
              <div class="msg-meta">
                <span class="msg-name" :style="{ color: msg.agentColor }">{{ msg.agentName }}</span>
                <span class="msg-role-tag">{{ STAFF[msg.agentId as keyof typeof STAFF]?.title || '' }}</span>
                <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
              <div
                class="msg-bubble"
                :class="{ 'bubble-captain': msg.role === 'captain', 'bubble-streaming': msg.isStreaming }"
                :style="{ '--mc': msg.agentColor }"
              >
                <div class="msg-content" v-html="renderContent(msg.content)"></div>
                <span v-if="msg.isStreaming" class="typing-cursor">▍</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 正在输入动画 -->
        <div v-if="typingAgent" class="typing-row">
          <div
            class="typing-avatar"
            :style="{ background: STAFF[typingAgent as keyof typeof STAFF]?.color + '18', color: STAFF[typingAgent as keyof typeof STAFF]?.color }"
          >
            {{ STAFF[typingAgent as keyof typeof STAFF]?.emoji }}
          </div>
          <div class="typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-name">{{ STAFF[typingAgent as keyof typeof STAFF]?.title }} 正在输入…</span>
          </div>
        </div>

        <!-- 执行进度面板 -->
        <div v-if="meetingStore.phase === 'executing' && Object.keys(meetingStore.executionStatus).length > 0" class="exec-progress">
          <div class="exec-header">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round">
              <circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 1"/>
            </svg>
            <span>任务执行中</span>
          </div>
          <div v-for="(status, agentId) in meetingStore.executionStatus" :key="agentId" class="exec-row">
            <span class="exec-emoji">{{ STAFF[agentId as keyof typeof STAFF]?.emoji || '⚙️' }}</span>
            <span class="exec-name">{{ STAFF[agentId as keyof typeof STAFF]?.title || agentId }}</span>
            <span class="exec-status" :class="'exec-' + status">
              {{ status === 'pending' ? '排队中' : status === 'running' ? '执行中' : status === 'done' ? '完成' : '出错' }}
            </span>
          </div>
        </div>

        <!-- 完成后跳转按钮 -->
        <div v-if="meetingStore.phase === 'done' && agentStore.flowResults.length > 0" class="goto-publish">
          <button class="goto-publish-btn" @click="router.push('/agent/publish')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 7h8M8 4l3 3-3 3"/>
            </svg>
            前往发布部 · 查看内容
          </button>
        </div>
      </div>

      <!-- 右侧纪要面板（可收起） -->
      <div v-if="showSummaryPanel" class="summary-panel">
        <div class="summary-panel-hd">
          <span>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round">
              <rect x="1" y="1" width="11" height="11" rx="1.5"/>
              <path d="M3.5 4.5h6M3.5 7h6M3.5 9.5h4"/>
            </svg>
            会议纪要
          </span>
          <button class="panel-close-btn" @click="showSummaryPanel = false">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M2 2l8 8M10 2l-8 8"/>
            </svg>
          </button>
        </div>
        <div class="summary-panel-time">
          {{ new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
        </div>
        <div class="summary-panel-content">{{ meetingStore.summary }}</div>
        <!-- 任务分配 -->
        <div v-if="Object.keys(meetingStore.assignedTasks).length > 0" class="summary-tasks">
          <div class="summary-tasks-title">任务分配</div>
          <div v-for="(task, agentId) in meetingStore.assignedTasks" :key="agentId" class="summary-task-item">
            <span class="summary-task-who" :style="{ color: STAFF[agentId as keyof typeof STAFF]?.color }">
              {{ STAFF[agentId as keyof typeof STAFF]?.emoji }}
              {{ STAFF[agentId as keyof typeof STAFF]?.title }}
            </span>
            <span class="summary-task-desc">{{ task }}</span>
          </div>
        </div>
        <button class="export-btn" @click="handleExport">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M6.5 1v8M4 6l2.5 3L9 6"/>
            <path d="M1.5 10v2h10v-2"/>
          </svg>
          导出纪要
        </button>
      </div>
    </div>

    <!-- ── 底部：输入区 ── -->
    <div class="meeting-input-area">
      <!-- 品牌选择器 -->
      <div class="brand-selector-row">
        <span class="brand-selector-label">品牌档案：</span>
        <div class="brand-selector-tabs">
          <span v-if="brandStore.profiles.length === 0" class="brand-selector-empty">暂无品牌档案</span>
          <div
            v-for="b in brandStore.profiles"
            :key="b.id"
            class="brand-selector-tab"
            :class="{ active: brandStore.activeId === b.id }"
            @click="brandStore.setActive(b.id)"
          >{{ b.name || '未命名' }}</div>
        </div>
        <router-link to="/agent/brand" class="brand-selector-link">管理</router-link>
      </div>

      <!-- 品牌未配置提示 -->
      <div v-if="!brandStore.isConfigured" class="input-warn">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#b45309" stroke-width="1.5" stroke-linecap="round">
          <circle cx="6.5" cy="6.5" r="5.5"/><path d="M6.5 4v3.5M6.5 9v.5"/>
        </svg>
        <span>建议先<router-link to="/agent/brand" style="color:#0071e3;text-decoration:none;font-weight:600">配置品牌信息</router-link>，获得更精准的会议内容</span>
      </div>

      <!-- 进度条（会议进行中） -->
      <div v-if="meetingStore.isRunning" class="meeting-progress">
        <div class="progress-label">会议进行中 · {{ phaseLabel }}</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
      </div>

      <div class="input-row">
        <textarea
          v-model="topicInput"
          class="topic-input"
          :placeholder="meetingStore.isRunning ? '会议进行中，输入内容可插话补充…' : meetingStore.phase === 'done' ? '输入新议题，重新开始会议…' : '输入会议议题，例如：策划新品上线内容方案'"
          :disabled="meetingStore.phase === 'executing'"
          rows="2"
          @keydown.enter.exact.prevent="meetingStore.isRunning ? handleInterject() : handleStart()"
        ></textarea>
        <div class="input-btns">
          <button
            v-if="!meetingStore.isRunning && meetingStore.phase !== 'done'"
            class="start-btn"
            :disabled="!topicInput.trim()"
            @click="handleStart"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 7h8M8 4l3 3-3 3"/>
            </svg>
            召开会议
          </button>
          <!-- 会议进行中：发送 + 结束 -->
          <button v-if="meetingStore.isRunning && topicInput.trim()" class="interject-btn" @click="handleInterject">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
            发送
          </button>
          <button v-if="meetingStore.isRunning" class="stop-btn" @click="handleStop">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <rect x="2" y="2" width="9" height="9" rx="1.5"/>
            </svg>
            结束会议
          </button>
          <button v-if="meetingStore.phase === 'done'" class="new-meeting-btn" @click="handleNewMeeting">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M1.5 6.5A5 5 0 116.5 11.5"/><path d="M1.5 3.5v3h3"/>
            </svg>
            新会议
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useBrandStore } from '@/stores/brand'
import { useMeetingStore } from '@/stores/meeting'
import { useTrendingStore } from '@/stores/agent'
import type { MeetingMessage } from '@/stores/meeting'
import type { FlowResult } from '@/stores/agent'

const router = useRouter()
const brandStore = useBrandStore()
const meetingStore = useMeetingStore()
const agentStore = useTrendingStore()

const messagesEl = ref<HTMLElement | null>(null)
const topicInput = ref('')
const typingAgent = ref<string | null>(null)
const speakingAgent = ref<string | null>(null)
const showSummaryPanel = ref(false)
let shouldStop = false
const interjections = ref<string[]>([]) // 用户插话队列

// 各专员定义（职位，不用实名）
const STAFF = {
  captain:    { title: 'Captain',  emoji: '🎯', color: '#6366f1' },
  briefer:    { title: '秘书',     emoji: '🗂️', color: '#64748b' },
  copywriter: { title: '文案专员', emoji: '✍️', color: '#f59e0b' },
  video:      { title: '视频专员', emoji: '🎬', color: '#ef4444' },
  poster:     { title: '设计专员', emoji: '🎨', color: '#ec4899' },
  brand:      { title: '品牌专员', emoji: '💎', color: '#8b5cf6' },
  trend:      { title: '情报专员', emoji: '📈', color: '#06b6d4' },
  publisher:  { title: '发布专员', emoji: '🚀', color: '#10b981' },
} as const

// 会议步骤说明（空状态用）
const meetingSteps = [
  'Captain 开场介绍议题与会议目标',
  '情报专员分析相关热点趋势',
  '文案专员给出内容创作方向',
  '视频专员补充视频内容策略',
  'Captain 汇总并向各专员分配任务',
]

// 阶段中文标签
const phaseLabel = computed(() => {
  const map: Record<string, string> = {
    idle: '待机', opening: '开场中', discussing: '讨论中', summarizing: '总结中', executing: '执行中', done: '已完成',
  }
  return map[meetingStore.phase] || ''
})

// 会议进度百分比（用于进度条展示）
const progressPct = computed(() => {
  const map: Record<string, number> = {
    idle: 0, opening: 15, discussing: 45, summarizing: 65, executing: 85, done: 100,
  }
  return map[meetingStore.phase] || 0
})

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 流水线步骤条数据
const pipelineSteps = [
  { label: '情报' },
  { label: '文案' },
  { label: '海报' },
  { label: '审核' },
  { label: '发布' },
]
const pipelineCurrentStep = computed(() => {
  const status = meetingStore.executionStatus as Record<string, string>
  const order = ['trend', 'copywriter', 'poster', 'captain', 'publisher']
  let last = 0
  for (let i = 0; i < order.length; i++) {
    if (status[order[i]] === 'done') last = i + 1
    else if (status[order[i]] === 'running') { last = i; break }
  }
  if (meetingStore.phase === 'done') return pipelineSteps.length
  return last
})

// 转义 HTML + 换行转 <br>，同时隐藏 @@DISPATCH:...@@ 指令行
function renderContent(text: string) {
  return text
    .replace(/@@DISPATCH:[\w,]+@@/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

// ── 核心：流式消息（typing动画 → 真实SSE流） ──
async function addStreamingMessage(agentId: keyof typeof STAFF, prompt: string, brandContext?: string): Promise<string> {
  if (shouldStop) return ''

  // 消费用户插话，追加到 prompt
  if (interjections.value.length > 0) {
    const extra = interjections.value.map(t => `「${t}」`).join('；')
    prompt += `\n\n【老板插话补充】：${extra}\n请在回答中考虑老板的补充意见。`
    interjections.value = []
  }

  // 把前面所有消息作为上下文（最多保留最近8条，避免太长）
  const history = meetingStore.messages
    .filter(m => !m.isStreaming && m.content && !m.content.includes('网络异常'))
    .slice(-8)
    .map(m => ({ role: 'assistant' as const, content: `【${m.agentName}】：${m.content}` }))

  const staff = STAFF[agentId]
  typingAgent.value = agentId
  speakingAgent.value = agentId
  await scrollToBottom()

  // 短暂延迟模拟真实节奏
  await new Promise(r => setTimeout(r, 600))
  if (shouldStop) { typingAgent.value = null; speakingAgent.value = null; return '' }

  // 添加空流式消息占位
  const msg: MeetingMessage = {
    id: uid(),
    agentId,
    agentName: staff.title,
    agentEmoji: staff.emoji,
    agentColor: staff.color,
    role: agentId === 'captain' ? 'captain' : 'member',
    content: '',
    timestamp: Date.now(),
    isStreaming: true,
  }
  meetingStore.addMessage(msg)
  typingAgent.value = null
  await scrollToBottom()

  // 调用 AI SSE 流
  try {
    const token = localStorage.getItem('erp_token') || ''
    const response = await fetch('/api/agent-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-erp-token': token,
        'x-agent-id': agentId,
      },
      body: JSON.stringify({
        messages: [...history, { role: 'user', content: prompt }],
        agentId,
        brandContext,
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('无法读取响应流')

    let buffer = ''
    let fullText = ''
    while (true) {
      if (shouldStop) { reader.cancel(); break }
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break
        try {
          const ev = JSON.parse(raw)
          if (ev.type === 'text' && ev.text) {
            fullText += ev.text
            meetingStore.appendToLastMessage(agentId, ev.text)
            await scrollToBottom()
          }
        } catch {}
      }
    }
    meetingStore.finalizeLastMessage(agentId)
    speakingAgent.value = null
    await scrollToBottom()
    return fullText
  } catch {
    const errorMsg = '（网络异常，无法获取回复）'
    meetingStore.appendToLastMessage(agentId, errorMsg)
    meetingStore.finalizeLastMessage(agentId)
    speakingAgent.value = null
    await scrollToBottom()
    return errorMsg
  }
}

// 生成会议纪要（不展示为消息，直接存储）
async function callAgentAI(agentId: string, prompt: string, brandContext?: string): Promise<string> {
  const token = localStorage.getItem('erp_token') || ''
  const response = await fetch('/api/agent-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-erp-token': token, 'x-agent-id': agentId },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], agentId, brandContext }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  if (!reader) return ''
  let text = ''
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') break
      try {
        const ev = JSON.parse(raw)
        if (ev.type === 'text' && ev.text) text += ev.text
      } catch {}
    }
    if (shouldStop) break
  }
  return text.trim()
}

// ── 判断是否为有效会议议题 ──
function isValidTopic(text: string): boolean {
  const t = text.trim()
  // 太短且像闲聊的直接过滤
  if (t.length <= 5) {
    const chatPatterns = /^(你好|hello|hi|嗨|在吗|大家在吗|在不在|有人吗|哈喽|喂|嘿|测试|test|哈哈|ok|好的|嗯|666|牛|厉害|谢谢|感谢|拜拜|再见|晚安|早安)$/i
    if (chatPatterns.test(t)) return false
  }
  return true
}

// ── 把用户输入显示为消息 ──
function addUserMessage(text: string) {
  meetingStore.addMessage({
    id: uid(),
    agentId: 'user',
    agentName: '你',
    agentEmoji: '👤',
    agentColor: '#0071e3',
    role: 'user',
    content: text,
    timestamp: Date.now(),
    isStreaming: false,
  })
}

// ── 闲聊时 Captain 直接回复，不启动会议 ──
async function handleCasualChat(text: string) {
  meetingStore.startMeeting(text)
  addUserMessage(text)
  meetingStore.setPhase('opening')
  await addStreamingMessage('captain',
    `你是数字游牧广告公司的Captain总指挥，你在会议室里。有人说了："${text}"。\n\n这不是正式议题，是闲聊/打招呼。请用你的风格简短回应（50字以内），然后引导对方提出正式的会议议题。\n语气自信、简洁，不要客套。`,
  )
  finalizeMeeting()
}

// ── 议题类型判断 ──
async function classifyTopic(topic: string, brandContext?: string): Promise<'content' | 'strategy' | 'qa'> {
  // 关键词快速判断，避免 AI 误判
  const t = topic
  const contentKeywords = ['文案', '推广', '海报', '视频', '脚本', '内容', '小红书', '抖音', '朋友圈', '广告', '创作', '图文', '种草', '发布', '写']
  const strategyKeywords = ['策略', '规划', '计划', '分析', '竞品', '定位', '方向', '市场', 'swot', '营销方案', '品牌战略']
  const qaKeywords = ['你好', '你是', '介绍', '了解', '知道吗', '什么是', '怎么样', '如何看']

  if (contentKeywords.some(k => t.includes(k))) return 'content'
  if (qaKeywords.some(k => t.includes(k))) return 'qa'
  if (strategyKeywords.some(k => t.includes(k))) return 'strategy'

  // 兜底用 AI 判断
  try {
    const result = await callAgentAI('captain',
      `有人在会议室提出了一个议题：「${topic}」\n\n判断类型，只回复一个单词：\n- content：需要产出内容（文案/海报/视频脚本等创作任务）\n- strategy：讨论策略/方案/规划（营销计划、竞品分析、品牌策略等）\n- qa：提问了解（询问信息、打招呼等非创作非策略）\n\n只回复 content、strategy 或 qa。`,
      brandContext
    )
    const r = result.trim().toLowerCase()
    if (r.includes('content')) return 'content'
    if (r.includes('strategy')) return 'strategy'
    return 'qa'
  } catch {
    return 'content'
  }
}

// ── 解析 Captain 开场白里的 @@DISPATCH:...@@ 指令 ──
const VALID_AGENTS = ['trend', 'copywriter', 'poster', 'video', 'publisher'] as const
function parseDispatch(text: string): string[] {
  const match = text.match(/@@DISPATCH:([\w,]+)@@/)
  if (!match) return ['trend', 'copywriter'] // 兜底：默认情报+文案
  return match[1]
    .split(',')
    .map(s => s.trim())
    .filter(s => (VALID_AGENTS as readonly string[]).includes(s))
}

// ── 主会议流程（串行AI调用） ──
async function runMeeting(topic: string) {
  // 先判断是不是有效议题
  if (!isValidTopic(topic)) {
    await handleCasualChat(topic)
    return
  }

  shouldStop = false
  meetingStore.startMeeting(topic)
  addUserMessage(topic)

  const brand = brandStore.isConfigured ? brandStore.brand : null
  const brandContext = brandStore.isConfigured ? brandStore.systemPrompt : undefined
  const brandInfo = brand
    ? `品牌「${brand.name}」（${brand.industry}），目标受众：${brand.audienceDesc || '未指定'}`
    : '（品牌信息未配置，请根据通用内容输出）'

  try {
    // 判断议题类型，决定走哪条流程
    const topicType = await classifyTopic(topic, brandContext)
    if (shouldStop) return finalizeMeeting()

    if (topicType === 'qa') {
      // 问答类：Captain 直接回答，不开正式会议
      meetingStore.setPhase('opening')
      await addStreamingMessage('captain',
        `你是数字游牧广告公司的Captain总指挥，有人在会议室问你：「${topic}」\n${brandInfo}\n\n请直接、专业地回答这个问题（300字以内）。如果是关于公司/品牌/产品的问题，结合已有信息回答；如果是开放性问题，给出你的判断。回答后，引导对方提出下一步的内容创作或策略需求。\n语气自信直接，不客套。`,
        brandContext
      )
      finalizeMeeting()
      return
    }

    if (topicType === 'strategy') {
      // 策略类：Captain 先开场定调 → 秘书补充背景 → Captain 派发指令
      meetingStore.setPhase('opening')

      // Captain 先开场
      await addStreamingMessage('captain',
        `你是广告公司的Captain总指挥。今天的策略议题是：「${topic}」\n${brandInfo}\n\n请做简短有力的开场白（80字以内）：\n- 说清楚今天这个议题为什么重要\n- 会议目标是什么\n- 语气自信、有决断力，像在主持高效决策会议`,
        brandContext
      )
      if (shouldStop) return finalizeMeeting()
      await new Promise(r => setTimeout(r, 300))

      // 秘书补充背景和约束
      const strategyBrieferPrompt = brand
        ? `你是会议室的秘书。Captain刚开完场，现在你补充背景资料。\n\n完整品牌档案：\n${brandContext}\n\n策略议题：「${topic}」\n\n请做情报简报（150字以内）：\n1. 品牌当前最需要解决的核心问题（结合议题）\n2. 竞争格局速览（竞品优劣势）\n3. 关键约束（资源、调性、禁忌）\n语气：秘书协助主持，简洁客观，直达重点。`
        : `你是会议室的秘书。Captain刚开完场。策略议题：「${topic}」\n请补充简要背景分析（80字以内），语气简洁客观。`

      await addStreamingMessage('briefer', strategyBrieferPrompt, brandContext)
      if (shouldStop) return finalizeMeeting()
      await new Promise(r => setTimeout(r, 300))

      // Captain 看完秘书简报后发出正式指令
      const strategyOpening = await addStreamingMessage('captain',
        `你是广告公司的Captain总指挥。秘书刚补充了背景简报。\n策略议题：「${topic}」\n${brandInfo}\n\n现在发出正式策略指令（100字以内）：\n- 不写背景，直接说判断和命令\n- 明确今天要解决什么核心问题\n- 点名哪些专员参与、各自的分析角度\n- 语气简短有力，是在发号施令\n\n【重要】指令最后一行必须是派发指令：\n@@DISPATCH:专员1,专员2,...@@\n可选专员：trend（营销/情报）、copywriter（文案）、poster（设计）、video（视频）、publisher（发布）\n例如策略类议题通常需要：@@DISPATCH:trend,copywriter@@`,
        brandContext
      )
      if (shouldStop) return finalizeMeeting()

      // 解析 Captain 派发的专员列表
      const strategyAgents = parseDispatch(strategyOpening)

      meetingStore.setPhase('discussing')

      // 各专员的 prompt 模板
      const strategyPrompts: Record<string, string> = {
        trend: `你是广告公司的情报专员。Captain命令你就「${topic}」做营销策略分析。\n${brandContext || brandInfo}\n\n请从情报视角（200字以内）：\n- 核心问题诊断：品牌目前面临什么真实挑战\n- 2-3个可选策略方向及优劣势（结合品牌调性和竞品）\n- 优先推荐哪个方向，理由\n语气专业、有说服力，直接说分析，不客套。`,
        copywriter: `你是广告公司的文案专员。针对策略议题「${topic}」，给出内容层面的落地方案（150字以内）。\n${brandContext || brandInfo}\n- 核心传播信息（符合品牌调性和禁忌）\n- 推荐的内容形式和平台\n- 一个示范标题`,
        poster: `你是广告公司的设计专员。针对策略议题「${topic}」，给出视觉方向建议（150字以内）。\n${brandContext || brandInfo}\n- 视觉风格定位（符合品牌调性）\n- 关键视觉元素建议\n- 色调参考`,
        video: `你是广告公司的视频专员。针对策略议题「${topic}」，给出视频内容策略（150字以内）。\n${brandContext || brandInfo}\n- 视频形式和时长建议\n- 核心叙事方向\n- 开头钩子设计`,
        publisher: `你是广告公司的发布专员。针对策略议题「${topic}」，给出发布策略建议（150字以内）。\n${brandContext || brandInfo}\n- 平台优先级（结合品牌主要平台）\n- 发布时机建议\n- 话题标签策略`,
      }

      for (const agentId of strategyAgents) {
        if (shouldStop) return finalizeMeeting()
        const prompt = strategyPrompts[agentId]
        if (!prompt) continue
        await new Promise(r => setTimeout(r, 400))
        await addStreamingMessage(agentId as keyof typeof STAFF, prompt, brandContext)
      }
      if (shouldStop) return finalizeMeeting()

      meetingStore.setPhase('summarizing')
      await new Promise(r => setTimeout(r, 400))
      const strategyHistory = meetingStore.messages
        .filter(m => m.role !== 'user' && !m.isStreaming && m.content)
        .map(m => `【${m.agentName}】：${m.content}`)
        .join('\n\n')
      const captainSummary = await addStreamingMessage('captain',
        `刚才的策略讨论内容如下：\n\n${strategyHistory}\n\n---\n议题：「${topic}」\n\n请作为Captain汇总（150字以内）：\n1. 明确推荐的策略方向\n2. 根据议题只分配真正需要的专员（不要全派）：需要文案才@文案专员，需要视频才@视频专员，需要图文/设计才@设计专员，需要排期才@发布专员\n3. 关键成功指标\n语气有决断力。`,
        brandContext
      )
      if (shouldStop) return finalizeMeeting()

      if (captainSummary.includes('@文案专员')) meetingStore.assignTask('copywriter', `围绕「${topic}」策略落地创作文案`)
      if (captainSummary.includes('@视频专员')) meetingStore.assignTask('video', `制作「${topic}」相关视频脚本`)
      if (captainSummary.includes('@设计专员')) meetingStore.assignTask('poster', `设计「${topic}」配套视觉物料`)
      if (captainSummary.includes('@发布专员')) meetingStore.assignTask('publisher', `安排「${topic}」内容发布计划`)

      if (Object.keys(meetingStore.assignedTasks).length > 0 && !shouldStop) {
        await executeAssignedTasks(topic, brandInfo, brandContext)
      } else {
        finalizeMeeting()
      }
      return
    }

    // content 类：Captain 先开场 → 秘书补充背景和安排 → Captain 派发作战命令
    meetingStore.setPhase('opening')

    // Captain 先开场定调
    await addStreamingMessage('captain',
      `你是广告公司的Captain总指挥。今天的创作议题是：「${topic}」\n${brandInfo}\n\n请做简短有力的开场白（80字以内）：\n- 说清楚今天要产出什么\n- 这次创作的核心目标和方向\n- 语气自信直接，像在主持高效创作会议`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()
    await new Promise(r => setTimeout(r, 300))

    // 秘书补充品牌背景和具体安排
    const brieferPrompt = brand
      ? `你是会议室的秘书。Captain刚做了开场，现在你补充背景资料和会议安排。\n\n以下是完整品牌档案：\n${brandContext}\n\n本次议题：「${topic}」\n\n请做一份简洁的背景简报（200字以内），包含：\n1. 品牌现状速览（产品、目标受众、核心卖点各一句）\n2. 本次任务的核心挑战是什么（针对议题分析，不要泛泛而谈）\n3. 关键限制（调性禁忌、竞争对手、违禁词等）\n\n语气：秘书协助主持，简洁、客观、有料，不废话。`
      : `你是会议室的秘书。Captain刚做了开场。本次议题：「${topic}」\n\n品牌信息未配置，请补充简要的任务背景（100字以内）：目标平台、核心受众、主要挑战。语气简洁客观。`

    await addStreamingMessage('briefer', brieferPrompt, brandContext)
    if (shouldStop) return finalizeMeeting()

    await new Promise(r => setTimeout(r, 300))

    // Captain 看完秘书简报后发作战命令
    const contentOpening = await addStreamingMessage('captain',
      `你是广告公司的Captain总指挥。秘书刚才补充了背景资料。\n议题：「${topic}」\n${brandInfo}\n\n现在直接发出作战命令（150字以内）：\n- 不写背景、不写会议目标、不解释为什么\n- 直接点名各专员，每条命令格式：「专员名，[动词]+[具体要求]+[交付标准]」\n- 语气短促、有压迫感，像战场指挥\n\n示例风格（不要照抄，根据议题发真实命令）：\n「情报，摸清小红书数字游牧赛道热点，给我前3个切入口，附品牌相关度评分。\n文案，基于情报报告出2套标题，小红书风格，情绪要强，不要废话。\n设计，配合文案出封面方案，1080×1440，给我设计方向不是废话。」\n\n【重要】命令最后一行必须是派发指令：\n@@DISPATCH:专员1,专员2,...@@\n可选专员：trend（情报/热点）、copywriter（文案）、poster（设计）、video（视频）、publisher（发布）`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 解析 Captain 派发的专员列表
    const contentAgents = parseDispatch(contentOpening)

    meetingStore.setPhase('discussing')

    // 各专员的 prompt 模板
    const contentPrompts: Record<string, string> = {
      trend: `你是广告公司的情报专员。Captain命令你就议题「${topic}」分析市场趋势。\n${brandContext || brandInfo}\n\n请从情报视角（200字以内）：\n- 当前最相关的2-3个社交媒体热点或趋势\n- 内容机会窗口判断（结合品牌trendingFilters和主要平台）\n- 推荐最适合的平台和话题方向\n语气专业务实，直接说分析，不要客套话。`,
      copywriter: `你是广告公司的文案专员。\n议题：「${topic}」\n${brandContext || brandInfo}\n\n基于前面的分析，请输出（200字以内）：\n- 核心文案方向（严格遵守品牌调性、禁忌词、禁用词）\n- 推荐2-3个平台专属文案角度\n- 一条示范标题（带emoji，符合品牌keywords）\n语气有创意感，体现专业文案风格。`,
      poster: `你是广告公司的设计专员。\n议题：「${topic}」\n${brandContext || brandInfo}\n\n请输出视觉设计建议（150字以内）：\n- 海报/视觉内容的设计风格（符合品牌调性）\n- 1个最有创意的视觉表达方向\n- 色调/画面感参考\n语气有设计感，直接说建议。`,
      video: `你是广告公司的视频专员。\n议题：「${topic}」\n${brandContext || brandInfo}\n\n请输出视频内容方向（150字以内）：\n- 短视频形式和时长建议（针对品牌主要平台）\n- 前3秒钩子设计\n- 核心叙事节奏\n语气有节奏感，直接说方向。`,
      publisher: `你是广告公司的发布专员。\n议题：「${topic}」\n${brandContext || brandInfo}\n\n请输出发布策略（150字以内）：\n- 平台优先级排序（参考品牌mainPlatforms和publishFreq）\n- 最佳发布时间建议\n- 话题标签策略\n语气实操性强。`,
    }

    for (const agentId of contentAgents) {
      if (shouldStop) return finalizeMeeting()
      const prompt = contentPrompts[agentId]
      if (!prompt) continue
      await new Promise(r => setTimeout(r, 400))
      await addStreamingMessage(agentId as keyof typeof STAFF, prompt, brandContext)
    }
    if (shouldStop) return finalizeMeeting()

    meetingStore.setPhase('summarizing')
    await new Promise(r => setTimeout(r, 400))
    if (shouldStop) return finalizeMeeting()

    const discussionHistory = meetingStore.messages
      .filter(m => m.role !== 'user' && !m.isStreaming && m.content)
      .map(m => `【${m.agentName}】：${m.content}`)
      .join('\n\n')
    const captainSummary = await addStreamingMessage('captain',
      `刚才的会议讨论内容如下：\n\n${discussionHistory}\n\n---\n议题：「${topic}」\n\n请作为Captain进行最终汇总（200字以内）：\n1. 总结核心内容策略（2-3条）\n2. 根据议题需求，只分配真正需要的专员（不要全派）：\n   - 需要写文案才 @文案专员\n   - 需要视频脚本才 @视频专员\n   - 需要图文/海报/设计才 @设计专员\n   - 需要发布排期才 @发布专员\n   例如"小红书图文"只需要 @文案专员 和 @设计专员\n3. 强调品牌调性要点\n\n语气有决断力，体现总指挥风格。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    if (captainSummary.includes('@文案专员')) meetingStore.assignTask('copywriter', `围绕「${topic}」创作文案`)
    if (captainSummary.includes('@视频专员')) meetingStore.assignTask('video', `制作「${topic}」短视频脚本`)
    if (captainSummary.includes('@设计专员')) meetingStore.assignTask('poster', `设计「${topic}」配套视觉方案`)
    if (captainSummary.includes('@发布专员')) meetingStore.assignTask('publisher', `安排「${topic}」内容发布排期`)

    if (Object.keys(meetingStore.assignedTasks).length > 0 && !shouldStop) {
      await executeAssignedTasks(topic, brandInfo, brandContext)
    } else {
      finalizeMeeting()
    }
  } catch {
    finalizeMeeting('会议因异常中断，请重新开始。')
  }
}

// ── 执行阶段：各专员并行生成内容 ──
const EXEC_PROMPTS: Record<string, (topic: string, brandInfo: string) => string> = {
  copywriter: (topic, brandInfo) =>
    `你是广告公司文案专员，Captain已指示你执行任务。\n议题：「${topic}」\n${brandInfo}\n\n请直接输出一篇完整的小红书图文文案（300-500字），包含：\n- 吸引人的标题（带emoji）\n- 正文（有痛点→解决方案→产品植入的结构）\n- 5个精准话题标签\n\n不要解释，直接输出可发布的文案。`,
  poster: (topic, brandInfo) =>
    `你是广告公司设计专员，Captain已指示你执行任务。\n议题：「${topic}」\n${brandInfo}\n\n请输出3张配图的详细描述方案：\n- 图1：封面图（描述画面构图、主体、文字、色调）\n- 图2：功能展示图（描述具体展示什么功能/场景）\n- 图3：金句图（描述背景+文案排版方式）\n\n每张图描述50-80字，要具体到可以直接用AI生图。`,
  video: (topic, brandInfo) =>
    `你是广告公司视频专员，Captain已指示你执行任务。\n议题：「${topic}」\n${brandInfo}\n\n请输出一个30秒短视频脚本，包含：\n- 开头钩子（前3秒）\n- 分镜头描述（5-6个镜头，每个标注时长和画面）\n- 口播文案\n- BGM建议\n\n按时长严格控制，直接输出脚本。`,
  publisher: (topic, brandInfo) =>
    `你是广告公司发布专员，Captain已指示你执行任务。\n议题：「${topic}」\n${brandInfo}\n\n请直接输出一份完整的发布计划卡片，格式如下（可直接复制使用，不要有任何解释或提示词）：\n\n📅 发布计划\n\n平台优先级：\n1. [平台名] — [理由]\n2. [平台名] — [理由]\n3. [平台名] — [理由]\n\n⏰ 发布时间表：\n· [日期/时间] [平台] — [内容类型]\n· [日期/时间] [平台] — [内容类型]\n· [日期/时间] [平台] — [内容类型]\n\n🏷️ 话题标签（直接复制使用）：\n#[话题1] #[话题2] #[话题3] #[话题4] #[话题5]\n\n📊 预期效果：\n· 曝光量目标：[具体数字]\n· 互动率目标：[具体数字]\n· 转化目标：[具体描述]\n\n💡 互动引导语：\n[一句可直接用于评论区互动的引导语]\n\n请根据议题和品牌信息填入真实内容，所有内容都要具体可执行，不要留空或写示例。`,
}

const PLATFORM_NAMES: Record<string, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  weibo: '微博',
  bilibili: 'B站',
  wechat: '微信公众号',
  kuaishou: '快手',
}

const AGENT_TO_TYPE: Record<string, FlowResult['type']> = {
  copywriter: 'copy',
  poster: 'poster',
  video: 'video_script',
}

// 清理 AI 输出中的前言/思考过程，只保留实际内容
function cleanAgentOutput(raw: string): string {
  let text = raw.trim()
  // 去掉开头的"好的，..."、"我来..."、"让我..."等前言（到第一个换行或分隔符为止）
  const preamblePatterns = [
    /^(?:好的|OK|没问题|收到|了解|明白)[，,。！!～~\s]*(?:我(?:来|先|马上|立刻|现在)[^。！\n]*[。！\n])/,
    /^(?:我(?:需要|先|来|去)[^。！\n]*[。！\n])/,
    /^(?:让我[^。！\n]*[。！\n])/,
  ]
  for (const pat of preamblePatterns) {
    text = text.replace(pat, '').trim()
  }
  // 如果以 --- 开头（markdown分隔符），去掉
  text = text.replace(/^---+\s*/, '').trim()
  return text || raw.trim()
}

async function executeAssignedTasks(topic: string, brandInfo: string, brandContext?: string) {
  meetingStore.setPhase('executing')

  // Captain 宣布进入执行阶段
  await addStreamingMessage('captain',
    `会议讨论结束。现在进入执行阶段。各专员立即按分配的任务开始产出内容。我在这里监督。\n\n请用一句话宣布进入执行阶段（30字以内），语气果断。`,
    brandContext
  )

  const tasks = { ...meetingStore.assignedTasks }
  // 初始化执行状态
  for (const agentId of Object.keys(tasks)) {
    meetingStore.setExecutionStatus(agentId, 'pending')
  }

  // 串行执行各专员（避免并发SSE问题）
  for (const [agentId, task] of Object.entries(tasks)) {
    if (shouldStop) break

    meetingStore.setExecutionStatus(agentId, 'running')
    const promptFn = EXEC_PROMPTS[agentId]
    const prompt = promptFn ? promptFn(topic, brandInfo) : `执行任务：${task}。议题：${topic}。${brandInfo}`

    const output = await addStreamingMessage(agentId as keyof typeof STAFF, prompt, brandContext)

    // 写入 flowResults（发布专员除外，它的产出是计划而非内容）
    const resultType = AGENT_TO_TYPE[agentId]
    if (resultType && output && !output.includes('网络异常')) {
      const activeBrand = brandStore.activeBrand
      const platformId = activeBrand?.mainPlatforms?.[0] || 'xiaohongshu'
      const result: FlowResult = {
        platform: platformId,
        platformName: PLATFORM_NAMES[platformId] || platformId,
        topic,
        type: resultType,
        content: cleanAgentOutput(output),
      }
      const existing = [...agentStore.flowResults]
      existing.push(result)
      agentStore.setFlowResults(existing)
    }

    meetingStore.setExecutionStatus(agentId, 'done')
    await scrollToBottom()
  }

  // Captain 总结
  if (!shouldStop) {
    await addStreamingMessage('captain',
      `所有专员已完成产出。请用简短有力的一句话收尾（30字以内），告知老板内容已就绪，可以前往发布部查看和发布。`,
      brandContext
    )
  }

  finalizeMeeting('任务执行完毕，内容已送达发布部。')
  showSummaryPanel.value = false

  const savedCount = Object.keys(tasks).filter(id => AGENT_TO_TYPE[id]).length
  if (savedCount > 0) {
    ElMessage({
      message: `${savedCount} 条内容已存入发布页`,
      type: 'success',
      duration: 3000,
      onClick: () => router.push('/agent/publish'),
    })
  }
}

function finalizeMeeting(summaryText?: string) {
  meetingStore.endMeeting(summaryText || '')
  typingAgent.value = null
  speakingAgent.value = null
  scrollToBottom()
}

function handleStart() {
  const t = topicInput.value.trim()
  if (!t || meetingStore.isRunning) return
  topicInput.value = ''
  runMeeting(t)
}

// ── 后台会议：提交给服务端异步跑，前端可离开 ──
let pollTimer: ReturnType<typeof setInterval> | null = null

async function startBackgroundMeeting(topic: string) {
  if (!isValidTopic(topic)) {
    await handleCasualChat(topic)
    return
  }

  const brand = brandStore.isConfigured ? brandStore.brand : null
  const brandContext = brandStore.isConfigured ? brandStore.systemPrompt : undefined
  const brandInfo = brand
    ? `品牌「${brand.name}」（${brand.industry}），目标受众：${brand.audienceDesc || '未指定'}`
    : '（品牌信息未配置，请根据通用内容输出）'

  shouldStop = false
  meetingStore.startMeeting(topic)
  addUserMessage(topic)
  meetingStore.setPhase('opening')

  // 显示"后台运行"提示消息
  meetingStore.addMessage({
    id: uid(),
    agentId: 'captain',
    agentName: 'Captain',
    agentEmoji: '🎯',
    agentColor: '#6366f1',
    role: 'captain',
    content: `收到。「${topic}」——团队开始执行，你可以先去做别的事，完成后我会通知你结果已存入发布页。`,
    timestamp: Date.now(),
    isStreaming: false,
  })

  const token = localStorage.getItem('erp_token') || ''
  let jobId = ''
  try {
    const res = await fetch('/api/meeting-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ topic, brandInfo, brandContext }),
    })
    const data = await res.json() as any
    jobId = data.jobId
  } catch (e: any) {
    ElMessage.error('会议启动失败：' + e.message)
    meetingStore.endMeeting('')
    return
  }

  if (!jobId) {
    ElMessage.error('会议启动失败')
    meetingStore.endMeeting('')
    return
  }

  const EMOJI_MAP: Record<string, string> = { captain: '🎯', trend: '📈', copywriter: '✍️', poster: '🎨', video: '🎬', publisher: '🚀', marketing: '📊' }
  const COLOR_MAP: Record<string, string> = { captain: '#6366f1', trend: '#06b6d4', copywriter: '#f59e0b', poster: '#ec4899', video: '#ef4444', publisher: '#10b981', marketing: '#059669' }

  function appendLog(msg: { agentId: string; agentName: string; content: string }) {
    meetingStore.addMessage({
      id: uid(),
      agentId: msg.agentId,
      agentName: msg.agentName,
      agentEmoji: EMOJI_MAP[msg.agentId] || '🤖',
      agentColor: COLOR_MAP[msg.agentId] || '#888',
      role: msg.agentId === 'captain' ? 'captain' : 'member',
      content: msg.content,
      timestamp: Date.now(),
      isStreaming: false,
    })
    scrollToBottom()
  }

  // 轮询结果（每3秒一次，实时追加新消息）
  let shownCount = 0
  let attempts = 0
  pollTimer = setInterval(async () => {
    attempts++
    if (attempts > 200) {
      clearInterval(pollTimer!)
      pollTimer = null
      ElMessage.error('会议超时，请重新发起')
      meetingStore.endMeeting('')
      return
    }
    try {
      const res = await fetch(`/api/meeting-run?jobId=${jobId}`)
      const data = await res.json() as any

      // 实时更新进度阶段
      if (data.phase && data.phase !== meetingStore.phase) {
        meetingStore.setPhase(data.phase as any)
      }

      // 实时追加新增的消息（增量显示）
      const log: any[] = data.log || []
      for (let i = shownCount; i < log.length; i++) {
        appendLog(log[i])
      }
      shownCount = log.length

      if (data.status === 'done') {
        clearInterval(pollTimer!)
        pollTimer = null

        if (data.flowResults?.length > 0) {
          agentStore.setFlowResults([...agentStore.flowResults, ...data.flowResults])
          ElMessage({
            message: `✅ 会议完成，${data.flowResults.length} 条内容已存入发布页`,
            type: 'success',
            duration: 4000,
            onClick: () => router.push('/agent/publish'),
          })
        }

        meetingStore.endMeeting('任务执行完毕，内容已送达发布部。')
        scrollToBottom()

      } else if (data.status === 'error') {
        clearInterval(pollTimer!)
        pollTimer = null
        ElMessage.error('会议执行失败：' + data.error)
        meetingStore.endMeeting('')
      }
    } catch {}
  }, 3000)
}

function handleInterject() {
  const text = topicInput.value.trim()
  if (!text) return
  topicInput.value = ''
  // 添加用户消息到消息流
  const msg: MeetingMessage = {
    id: uid(),
    agentId: 'user',
    agentName: '你',
    agentEmoji: '👤',
    agentColor: '#0071e3',
    role: 'user',
    content: text,
    timestamp: Date.now(),
    isStreaming: false,
  }
  meetingStore.addMessage(msg)
  // 存入插话队列，下一个 agent 发言时会参考
  interjections.value.push(text)
  scrollToBottom()
}

function handleStop() {
  shouldStop = true
  finalizeMeeting('会议已手动结束。')
}

function handleNewMeeting() {
  meetingStore.resetMeeting()
  topicInput.value = ''
  shouldStop = false
  showSummaryPanel.value = false
}

function handleExport() {
  const content = [
    `# 会议纪要`,
    `**议题：** ${meetingStore.topic}`,
    `**时间：** ${new Date().toLocaleString('zh-CN')}`,
    ``,
    `## 会议记录`,
    ...meetingStore.messages.map(m =>
      `**${m.agentName}**（${STAFF[m.agentId as keyof typeof STAFF]?.title || ''}）\n${m.content}`
    ),
    ``,
    `## 会议纪要`,
    meetingStore.summary,
    ``,
    `## 任务分配`,
    ...Object.entries(meetingStore.assignedTasks).map(([id, task]) =>
      `- ${STAFF[id as keyof typeof STAFF]?.title || id}：${task}`
    ),
  ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `会议纪要_${meetingStore.topic.slice(0, 10)}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

onUnmounted(() => {
  shouldStop = true
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
})
</script>

<style scoped>
.meeting-room {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
  min-height: 500px;
  background: var(--card-bg, #fff);
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 18px;
  overflow: hidden;
}

/* ── 流水线步骤条 ── */
.pipeline-bar {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background: #F8F8F6;
  border-bottom: 1px solid #E8E8E8;
  flex-shrink: 0;
  gap: 0;
}
.pb-step {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
}
.pb-step:last-child { flex: 0; }
.pb-dot {
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.3s;
  position: relative;
}
.pb-step.pb-done   .pb-dot { background: #34d399; }
.pb-step.pb-active .pb-dot { background: #0071e3; }
.pb-step.pb-pending .pb-dot { background: #E8E8E8; }
.pb-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: white;
  animation: pbpulse 1.2s ease-in-out infinite;
}
@keyframes pbpulse {
  0%,100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.7); opacity: 0.6; }
}
.pb-label {
  font-size: 10px; font-weight: 600;
  margin-left: 5px;
  white-space: nowrap;
}
.pb-step.pb-done    .pb-label { color: #059669; }
.pb-step.pb-active  .pb-label { color: #0071e3; }
.pb-step.pb-pending .pb-label { color: #CCCCCC; }
.pb-line {
  flex: 1; height: 2px;
  background: #E8E8E8;
  margin: 0 4px;
  transition: background 0.3s;
}
.pb-line.done { background: #34d399; }

/* ── 顶部 ── */
.meeting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  flex-shrink: 0;
  gap: 12px;
  flex-wrap: wrap;
}
.meeting-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.meeting-icon {
  width: 40px; height: 40px; border-radius: 11px;
  background: rgba(99,102,241,0.08);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.meeting-title { font-size: 16px; font-weight: 800; color: var(--dark, #1d1d1f); margin: 0 0 3px; letter-spacing: -0.03em; }
.meeting-topic { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--mid, rgba(29,29,31,0.5)); flex-wrap: wrap; }
.meeting-topic.empty { font-style: italic; }
.topic-label { font-weight: 600; }
.topic-text { font-weight: 500; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.phase-badge {
  padding: 2px 8px; border-radius: 20px;
  font-size: 10px; font-weight: 700;
  background: rgba(0,0,0,0.05); color: var(--mid, rgba(29,29,31,0.5));
}
.phase-opening, .phase-discussing { background: rgba(99,102,241,0.1); color: #6366f1; }
.phase-summarizing { background: rgba(245,158,11,0.1); color: #f59e0b; }
.phase-executing { background: rgba(79,70,229,0.1); color: #6366f1; animation: blink 1.2s ease-in-out infinite; }
@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
.phase-done { background: rgba(16,185,129,0.1); color: #10b981; }

/* 参与者头像 */
.participants { display: flex; align-items: center; }
.participant-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  border: 2px solid transparent;
  margin-left: -5px;
  transition: border-color 0.3s, transform 0.2s;
  position: relative; z-index: 1;
}
.participant-avatar:first-child { margin-left: 0; }
.participant-avatar.speaking {
  transform: scale(1.22);
  z-index: 2;
  animation: speakPulse 1.5s ease-in-out infinite;
}
@keyframes speakPulse {
  0%,100% { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--speak-color, #6366f1); }
  50%      { box-shadow: 0 0 0 2px #fff, 0 0 0 8px color-mix(in srgb, var(--speak-color, #6366f1) 25%, transparent); }
}

/* 纪要面板切换按钮 */
.summary-toggle-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 13px;
  background: rgba(99,102,241,0.07); color: #6366f1;
  border: 1px solid rgba(99,102,241,0.18); border-radius: 10px;
  font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}
.summary-toggle-btn:hover { background: rgba(99,102,241,0.12); }
.summary-badge { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; }

/* ── 主体区域 ── */
.meeting-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* 消息流 */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}
.messages-area::-webkit-scrollbar { width: 3px; }
.messages-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }

/* 空状态 */
.meeting-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; flex: 1; padding: 32px 20px;
  text-align: center; gap: 14px;
}
.empty-hero { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-staff-row { display: flex; gap: -6px; }
.empty-staff-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  border: 2px solid #fff;
  margin-left: -6px;
}
.empty-staff-avatar:first-child { margin-left: 0; }
.empty-title { font-size: 17px; font-weight: 800; color: var(--dark, #1d1d1f); letter-spacing: -0.03em; }
.empty-desc { font-size: 13px; color: var(--mid, rgba(29,29,31,0.5)); max-width: 340px; line-height: 1.6; }
.empty-steps {
  display: flex; flex-direction: column; gap: 8px;
  background: rgba(0,0,0,0.025); border-radius: 12px;
  padding: 14px 18px; align-items: flex-start; width: 100%; max-width: 340px;
}
.empty-step { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--mid, rgba(29,29,31,0.5)); }
.step-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(99,102,241,0.12); color: #6366f1;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

/* 消息行 */
.message-row { display: flex; align-items: flex-start; gap: 10px; animation: slideIn 0.25s ease both; }
.row-captain { flex-direction: row; }
.row-member { flex-direction: row; }
.row-user { flex-direction: row-reverse; }
@keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

/* 用户插话气泡 */
.user-wrap { align-items: flex-end; }
.bubble-user {
  background: #0071e3 !important;
  color: #fff !important;
  border-color: transparent !important;
  border-radius: 14px 14px 4px 14px !important;
}

.msg-avatar {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; flex-shrink: 0; margin-top: 2px;
}
.row-captain .msg-avatar { width: 42px; height: 42px; border-radius: 12px; font-size: 20px; }

.msg-bubble-wrap { max-width: 70%; display: flex; flex-direction: column; gap: 4px; }
.row-captain .msg-bubble-wrap { max-width: 78%; }

.msg-meta { display: flex; align-items: center; gap: 6px; padding: 0 4px; }
.msg-name { font-size: 12px; font-weight: 700; }
.msg-role-tag { font-size: 10px; color: var(--dim, rgba(29,29,31,0.3)); background: rgba(0,0,0,0.04); padding: 1px 7px; border-radius: 10px; }
.msg-time { font-size: 10px; color: var(--dim, rgba(29,29,31,0.25)); }

.msg-bubble {
  padding: 11px 14px; border-radius: 14px;
  font-size: 13px; line-height: 1.65;
  color: var(--dark, #1d1d1f);
  background: #f5f5f7;
  border: 1px solid rgba(0,0,0,0.05);
  word-break: break-word; position: relative;
}
.bubble-captain {
  background: rgba(99,102,241,0.06);
  border-color: rgba(99,102,241,0.15);
  border-left: 3px solid #6366f1;
  font-size: 13.5px;
}
.row-member .msg-bubble {
  background: color-mix(in srgb, var(--mc, #888) 7%, white);
  border-color: color-mix(in srgb, var(--mc, #888) 14%, white);
  border-left: 3px solid var(--mc, #888);
}
.bubble-streaming { animation: streamPulse 1.5s ease-in-out infinite; }
@keyframes streamPulse { 0%,100% { opacity:1; } 50% { opacity:0.85; } }

.typing-cursor { display: inline-block; animation: cursorBlink 0.8s ease-in-out infinite; margin-left: 2px; color: #6366f1; }
@keyframes cursorBlink { 0%,100% { opacity:1; } 50% { opacity:0; } }

/* 正在输入动画 */
.typing-row { display: flex; align-items: center; gap: 10px; animation: slideIn 0.2s ease both; }
.typing-avatar {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.typing-bubble {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 12px;
  background: #f5f5f7; border: 1px solid rgba(0,0,0,0.05);
}
.typing-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(0,0,0,0.2);
  animation: typingBounce 1s ease-in-out infinite;
}
.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.15s; }
.typing-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes typingBounce { 0%,80%,100% { transform:translateY(0); opacity:0.3; } 40% { transform:translateY(-5px); opacity:1; } }
.typing-name { font-size: 11px; color: var(--dim, rgba(29,29,31,0.35)); margin-left: 4px; }

/* 右侧纪要面板 */
.summary-panel {
  width: 260px;
  flex-shrink: 0;
  border-left: 1px solid rgba(0,0,0,0.07);
  padding: 14px 16px;
  overflow-y: auto;
  background: rgba(99,102,241,0.02);
  display: flex; flex-direction: column; gap: 10px;
}
.summary-panel-hd {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; font-weight: 700; color: #6366f1;
  gap: 6px;
}
.summary-panel-hd > span { display: flex; align-items: center; gap: 6px; }
.panel-close-btn { background: none; border: none; padding: 4px; cursor: pointer; color: rgba(29,29,31,0.35); display: flex; align-items: center; border-radius: 5px; }
.panel-close-btn:hover { background: rgba(0,0,0,0.06); color: #1d1d1f; }
.summary-panel-time { font-size: 10.5px; color: rgba(29,29,31,0.3); }
.summary-panel-content { font-size: 12px; color: var(--dark, #1d1d1f); line-height: 1.7; white-space: pre-wrap; }
.summary-tasks { border-top: 1px solid rgba(99,102,241,0.1); padding-top: 10px; }
.summary-tasks-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(29,29,31,0.35); margin-bottom: 8px; }
.summary-task-item { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
.summary-task-who { font-size: 12px; font-weight: 700; }
.summary-task-desc { font-size: 11.5px; color: var(--dark, #1d1d1f); line-height: 1.4; }

.export-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: rgba(99,102,241,0.07); color: #6366f1;
  border: 1px solid rgba(99,102,241,0.18); border-radius: 9px;
  font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer;
  transition: background 0.15s; margin-top: auto;
}
.export-btn:hover { background: rgba(99,102,241,0.12); }

/* 执行进度面板 */
.exec-progress {
  background: rgba(99,102,241,0.04);
  border: 1px solid rgba(99,102,241,0.12);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex; flex-direction: column; gap: 8px;
  animation: slideIn 0.25s ease both;
}
.exec-header {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 700; color: #6366f1;
}
.exec-row {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; padding: 4px 0;
}
.exec-emoji { font-size: 14px; }
.exec-name { font-weight: 600; color: var(--dark, #1d1d1f); flex: 1; }
.exec-status {
  font-size: 11px; font-weight: 700;
  padding: 2px 10px; border-radius: 20px;
}
.exec-pending { background: rgba(0,0,0,0.05); color: rgba(29,29,31,0.4); }
.exec-running { background: rgba(99,102,241,0.1); color: #6366f1; animation: blink 1.2s ease-in-out infinite; }
.exec-done { background: rgba(16,185,129,0.1); color: #10b981; }
.exec-error { background: rgba(239,68,68,0.1); color: #ef4444; }

/* 跳转发布部按钮 */
.goto-publish {
  display: flex; justify-content: center; padding: 8px 0;
  animation: slideIn 0.3s ease both;
}
.goto-publish-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border: none; border-radius: 12px;
  font-size: 14px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: opacity 0.15s, transform 0.1s;
  box-shadow: 0 4px 14px rgba(99,102,241,0.3);
}
.goto-publish-btn:hover { opacity: 0.9; }
.goto-publish-btn:active { transform: scale(0.97); }

/* ── 底部输入区 ── */
.meeting-input-area {
  border-top: 1px solid rgba(0,0,0,0.06);
  padding: 12px 20px;
  flex-shrink: 0;
  display: flex; flex-direction: column; gap: 10px;
}
/* 品牌选择器 */
.brand-selector-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.brand-selector-label { font-size: 12px; color: #94a3b8; flex-shrink: 0; }
.brand-selector-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.brand-selector-empty { font-size: 12px; color: #cbd5e1; font-style: italic; }
.brand-selector-tab {
  padding: 3px 12px; border-radius: 12px; font-size: 12px; cursor: pointer;
  background: #f1f5f9; color: #64748b; border: 1px solid transparent;
  transition: all 0.15s;
}
.brand-selector-tab.active {
  background: #ede9fe; color: #5b21b6; border-color: #a78bfa;
}
.brand-selector-link {
  font-size: 12px; color: #6366f1; text-decoration: none; margin-left: auto; flex-shrink: 0;
}
.brand-selector-link:hover { text-decoration: underline; }

.input-warn {
  display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; color: #b45309;
  background: rgba(245,158,11,0.07);
  border: 1px solid rgba(245,158,11,0.2);
  padding: 7px 12px; border-radius: 8px;
}

/* 进度条 */
.meeting-progress { display: flex; flex-direction: column; gap: 5px; }
.progress-label { font-size: 11px; font-weight: 600; color: #6366f1; }
.progress-bar { height: 3px; background: rgba(99,102,241,0.1); border-radius: 3px; overflow: hidden; }
.progress-fill {
  height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 3px; transition: width 0.8s ease;
}

.input-row { display: flex; align-items: flex-end; gap: 10px; }
.topic-input {
  flex: 1; padding: 10px 14px;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 12px;
  font-size: 13.5px; font-family: inherit;
  color: var(--dark, #1d1d1f); background: var(--gray, #f5f5f7);
  resize: none; line-height: 1.5; outline: none;
  transition: border-color 0.15s;
}
.topic-input:focus { border-color: #6366f1; background: #fff; }
.topic-input:disabled { opacity: 0.5; cursor: not-allowed; }
.topic-input::placeholder { color: rgba(29,29,31,0.3); }

.input-btns { display: flex; gap: 7px; align-items: flex-end; flex-shrink: 0; }
.start-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px;
  background: #6366f1; color: #fff;
  border: none; border-radius: 12px;
  font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; white-space: nowrap;
  transition: opacity 0.15s, transform 0.1s;
}
.start-btn:hover { opacity: 0.9; }
.start-btn:active { transform: scale(0.97); }
.start-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.interject-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px;
  background: #0071e3; color: #fff;
  border: none; border-radius: 12px;
  font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: opacity 0.15s;
  white-space: nowrap;
}
.interject-btn:hover { opacity: 0.85; }

.stop-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px;
  background: rgba(239,68,68,0.08); color: #ef4444;
  border: 1px solid rgba(239,68,68,0.2); border-radius: 12px;
  font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: background 0.15s;
}
.stop-btn:hover { background: rgba(239,68,68,0.14); }

.new-meeting-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px;
  background: rgba(99,102,241,0.08); color: #6366f1;
  border: 1px solid rgba(99,102,241,0.2); border-radius: 12px;
  font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: background 0.15s;
}
.new-meeting-btn:hover { background: rgba(99,102,241,0.14); }

/* 暗色模式 */
:global([data-theme='dark']) .meeting-room { background: #111827; border-color: #1f2937; }
:global([data-theme='dark']) .meeting-header { border-bottom-color: #1f2937; }
:global([data-theme='dark']) .meeting-title { color: #f8fafc; }
:global([data-theme='dark']) .msg-bubble { background: #1e293b; border-color: #334155; color: #e2e8f0; }
:global([data-theme='dark']) .bubble-captain { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.2); border-left-color: #6366f1; }
:global([data-theme='dark']) .row-member .msg-bubble { background: color-mix(in srgb, var(--mc, #888) 12%, #1e293b); }
:global([data-theme='dark']) .typing-bubble { background: #1e293b; border-color: #334155; }
:global([data-theme='dark']) .topic-input { background: #1e293b; border-color: #334155; color: #e2e8f0; }
:global([data-theme='dark']) .summary-panel { background: rgba(99,102,241,0.05); border-left-color: #1f2937; }
:global([data-theme='dark']) .summary-panel-content { color: #e2e8f0; }
:global([data-theme='dark']) .summary-task-desc { color: #e2e8f0; }
:global([data-theme='dark']) .empty-steps { background: rgba(255,255,255,0.03); }

/* 响应式 */
@media (max-width: 768px) {
  .meeting-room { height: auto; min-height: 100vh; border-radius: 12px; }
  .messages-area { min-height: 50vh; }
  .participants { display: none; }
  .msg-bubble-wrap { max-width: 88%; }
  .summary-panel { display: none; }
  .has-summary .messages-area { flex: 1; }
}
</style>
