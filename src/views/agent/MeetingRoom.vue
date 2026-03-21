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
          :style="{ background: staff.color + '18', color: staff.color, borderColor: speakingAgent === key ? staff.color : 'transparent' }"
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
          :class="msg.role === 'captain' ? 'row-captain' : 'row-member'"
        >
          <!-- 头像 -->
          <div
            class="msg-avatar"
            :style="{ background: msg.agentColor + '18', color: msg.agentColor }"
          >{{ msg.agentEmoji }}</div>

          <!-- 气泡 -->
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
          :placeholder="meetingStore.phase === 'done' ? '输入新议题，重新开始会议…' : '输入会议议题，例如：策划新品上线内容方案'"
          rows="2"
          :disabled="meetingStore.isRunning"
          @keydown.enter.exact.prevent="handleStart"
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
import { useBrandStore } from '@/stores/brand'
import { useMeetingStore } from '@/stores/meeting'
import type { MeetingMessage } from '@/stores/meeting'

const brandStore = useBrandStore()
const meetingStore = useMeetingStore()

const messagesEl = ref<HTMLElement | null>(null)
const topicInput = ref('')
const typingAgent = ref<string | null>(null)
const speakingAgent = ref<string | null>(null)
const showSummaryPanel = ref(false)
let shouldStop = false

// 各专员定义（职位，不用实名）
const STAFF = {
  captain:    { title: 'Captain',  emoji: '🎯', color: '#6366f1' },
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
    idle: '待机', opening: '开场中', discussing: '讨论中', summarizing: '总结中', done: '已完成',
  }
  return map[meetingStore.phase] || ''
})

// 会议进度百分比（用于进度条展示）
const progressPct = computed(() => {
  const map: Record<string, number> = {
    idle: 0, opening: 15, discussing: 55, summarizing: 85, done: 100,
  }
  return map[meetingStore.phase] || 0
})

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 转义 HTML + 换行转 <br>
function renderContent(text: string) {
  return text
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
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], agentId, brandContext }),
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

// ── 主会议流程（串行AI调用） ──
async function runMeeting(topic: string) {
  shouldStop = false
  meetingStore.startMeeting(topic)

  const brand = brandStore.isConfigured ? brandStore.brand : null
  const brandContext = brandStore.isConfigured ? brandStore.systemPrompt : undefined
  const brandInfo = brand
    ? `品牌「${brand.name}」（${brand.industry}），目标受众：${brand.audienceDesc || '未指定'}`
    : '（品牌信息未配置，请根据通用内容输出）'

  try {
    // 1. Captain 开场
    meetingStore.setPhase('opening')
    await addStreamingMessage('captain',
      `你是一家广告公司的Captain总指挥，正在主持内容策划会议。\n议题：「${topic}」\n${brandInfo}\n\n请用简洁有力的开场白（150字以内）：\n1. 介绍今天的会议议题\n2. 说明会议目标\n3. 提出对各专员的期待\n语气专业、有激情。直接输出开场白，不加额外说明。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 2. Captain @情报专员
    await new Promise(r => setTimeout(r, 400))
    if (shouldStop) return finalizeMeeting()
    await addStreamingMessage('captain',
      `请情报专员分析一下与「${topic}」相关的市场热点趋势，给出选题方向。请用一句话点名，30字以内。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 3. 情报专员发言
    meetingStore.setPhase('discussing')
    await addStreamingMessage('trend',
      `你是广告公司的情报专员。Captain邀请你就议题「${topic}」分析市场趋势。\n${brandInfo}\n\n请从情报视角（200字以内）：\n- 点出2-3个当前最相关的社交媒体热点或趋势\n- 给出内容机会窗口判断\n- 推荐最适合的平台和话题方向\n语气专业务实，直接说分析，不要客套话。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 4. Captain @文案专员
    await new Promise(r => setTimeout(r, 400))
    if (shouldStop) return finalizeMeeting()
    await addStreamingMessage('captain',
      `感谢情报专员的洞察。现在请文案专员基于刚才的趋势，给出文案创作方向。30字以内点名。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 5. 文案专员发言
    await addStreamingMessage('copywriter',
      `你是广告公司的文案专员。\n议题：「${topic}」\n${brandInfo}\n\n基于情报专员的趋势分析，请输出（200字以内）：\n- 核心文案方向（1-2句提炼）\n- 推荐2-3个平台专属文案角度（如抖音/小红书/微博）\n- 一条示范标题（带emoji）\n语气有创意感，体现专业文案风格。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 6. 设计专员主动补充视觉方向
    await new Promise(r => setTimeout(r, 500))
    if (shouldStop) return finalizeMeeting()
    await addStreamingMessage('poster',
      `你是广告公司的设计专员。刚才情报专员和文案专员提出了内容方向，你补充视觉设计层面的建议。\n议题：「${topic}」\n${brandInfo}\n\n请输出（150字以内）：\n- 海报/视觉内容的设计风格建议\n- 1个最有创意的视觉表达方向\n- 色调/画面感参考\n语气有设计感，直接说建议。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 7. Captain 汇总 + 分配任务
    meetingStore.setPhase('summarizing')
    await new Promise(r => setTimeout(r, 400))
    if (shouldStop) return finalizeMeeting()

    const captainSummary = await addStreamingMessage('captain',
      `作为Captain，根据以上讨论，对「${topic}」进行最终汇总（200字以内）：\n\n1. 总结核心内容策略（2-3条）\n2. 明确分配任务：\n   - @文案专员：文案任务\n   - @视频专员：视频任务\n   - @设计专员：设计任务\n   - @发布专员：发布安排\n3. 强调品牌调性要点\n\n语气有决断力，体现总指挥风格。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 解析任务分配
    if (captainSummary.includes('文案')) meetingStore.assignTask('copywriter', `围绕「${topic}」创作多平台文案`)
    if (captainSummary.includes('视频')) meetingStore.assignTask('video', `制作「${topic}」短视频脚本`)
    if (captainSummary.includes('设计') || captainSummary.includes('海报')) meetingStore.assignTask('poster', `设计「${topic}」配套视觉海报`)
    if (captainSummary.includes('发布') || captainSummary.includes('排期')) meetingStore.assignTask('publisher', `安排「${topic}」内容发布排期`)

    // 8. 生成会议纪要（不作为消息）
    const summaryText = await callAgentAI('captain',
      `请为以下议题生成简洁的会议纪要：\n议题：「${topic}」\n${brandInfo}\n\n格式：\n【会议主题】\n【核心结论】（3条以内）\n【任务分配】（各专员各一条）\n【注意事项】（1条）\n\n100字以内，简洁专业。`,
      brandContext
    )

    finalizeMeeting(summaryText)
    showSummaryPanel.value = true
  } catch {
    finalizeMeeting('会议因异常中断，请重新开始。')
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
  runMeeting(t)
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

onUnmounted(() => { shouldStop = true })
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
  0%,100% { box-shadow: 0 0 0 2px rgba(255,255,255,.9), 0 0 0 4px currentColor; }
  50% { box-shadow: 0 0 0 2px rgba(255,255,255,.9), 0 0 0 7px color-mix(in srgb, currentColor 30%, transparent); }
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
.row-member { flex-direction: row-reverse; }
@keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

.msg-avatar {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; flex-shrink: 0; margin-top: 2px;
}
.row-captain .msg-avatar { width: 42px; height: 42px; border-radius: 12px; font-size: 20px; }

.msg-bubble-wrap { max-width: 70%; display: flex; flex-direction: column; gap: 4px; }
.row-captain .msg-bubble-wrap { max-width: 78%; }
.row-member .msg-bubble-wrap { align-items: flex-end; }

.msg-meta { display: flex; align-items: center; gap: 6px; padding: 0 4px; }
.row-member .msg-meta { flex-direction: row-reverse; }
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

/* ── 底部输入区 ── */
.meeting-input-area {
  border-top: 1px solid rgba(0,0,0,0.06);
  padding: 12px 20px;
  flex-shrink: 0;
  display: flex; flex-direction: column; gap: 10px;
}
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
