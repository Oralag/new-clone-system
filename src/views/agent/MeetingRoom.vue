<template>
  <div class="meeting-room">

    <!-- ── 顶部：会议室标题 + 参与者头像 ── -->
    <div class="meeting-header">
      <div class="meeting-header-left">
        <div class="meeting-icon">💬</div>
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
      <!-- 参与者头像列表 -->
      <div class="participants">
        <div
          v-for="(staff, key) in STAFF"
          :key="key"
          class="participant-avatar"
          :class="{ speaking: speakingAgent === key }"
          :style="{ background: staff.color + '18', color: staff.color, borderColor: speakingAgent === key ? staff.color : 'transparent' }"
          :title="staff.name + ' · ' + staff.role"
        >{{ staff.emoji }}</div>
      </div>
    </div>

    <!-- ── 中部：消息流 ── -->
    <div class="messages-area" ref="messagesEl">
      <!-- 空状态引导 -->
      <div v-if="meetingStore.messages.length === 0" class="meeting-empty">
        <div class="empty-icon">🏢</div>
        <div class="empty-title">数字游牧传媒 · 会议室</div>
        <div class="empty-desc">输入会议议题，Captain 将主持会议，各部门专员依次发言</div>
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

        <!-- 气泡内容 -->
        <div class="msg-bubble-wrap">
          <div class="msg-meta">
            <span class="msg-name" :style="{ color: msg.agentColor }">{{ msg.agentName }}</span>
            <span class="msg-role-tag">{{ STAFF[msg.agentId as keyof typeof STAFF]?.role || '' }}</span>
            <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div
            class="msg-bubble"
            :class="{ 'bubble-captain': msg.role === 'captain', 'bubble-streaming': msg.isStreaming }"
            :style="{ '--mc': msg.agentColor }"
          >
            <!-- 消息内容（支持换行） -->
            <div class="msg-content" v-html="renderContent(msg.content)"></div>
            <!-- 流式输入光标 -->
            <span v-if="msg.isStreaming" class="typing-cursor">▍</span>
          </div>
          <!-- 分配任务标签 -->
          <div v-if="msg.taskAssigned" class="task-chip">
            📌 任务分配给 {{ msg.taskAssigned }}
          </div>
        </div>
      </div>

      <!-- 正在输入动画 -->
      <div v-if="typingAgent" class="typing-row">
        <div class="typing-avatar" :style="{ background: STAFF[typingAgent as keyof typeof STAFF]?.color + '18', color: STAFF[typingAgent as keyof typeof STAFF]?.color }">
          {{ STAFF[typingAgent as keyof typeof STAFF]?.emoji }}
        </div>
        <div class="typing-bubble">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-name">{{ STAFF[typingAgent as keyof typeof STAFF]?.name }} 正在输入…</span>
        </div>
      </div>
    </div>

    <!-- ── 底部：输入区 ── -->
    <div class="meeting-input-area">
      <!-- 品牌未配置警告 -->
      <div v-if="!brandStore.isConfigured" class="input-warn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>建议先<router-link to="/agent/brand" style="color:#0071e3;text-decoration:none;font-weight:600">配置品牌信息</router-link>，以获得更精准的会议内容</span>
      </div>

      <div class="input-row">
        <textarea
          v-model="topicInput"
          class="topic-input"
          :placeholder="meetingStore.phase === 'done' ? '输入新的议题，重新开始会议…' : '输入会议议题，例如：策划新品上线内容方案'"
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
            <span>开始会议</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
          <button
            v-if="meetingStore.isRunning"
            class="stop-btn"
            @click="handleStop"
          >停止会议</button>
          <button
            v-if="meetingStore.phase === 'done'"
            class="new-meeting-btn"
            @click="handleNewMeeting"
          >新会议</button>
          <button
            v-if="meetingStore.phase === 'done' && meetingStore.summary"
            class="export-btn"
            @click="handleExport"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            导出纪要
          </button>
        </div>
      </div>

      <!-- 会议纪要 -->
      <div v-if="meetingStore.summary && meetingStore.phase === 'done'" class="meeting-summary">
        <div class="summary-hd">
          <span class="summary-title">📋 会议纪要</span>
          <span class="summary-time">{{ new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>
        <div class="summary-content">{{ meetingStore.summary }}</div>
        <!-- 任务分配 -->
        <div v-if="Object.keys(meetingStore.assignedTasks).length > 0" class="assigned-tasks">
          <div class="tasks-title">任务分配：</div>
          <div v-for="(task, agentId) in meetingStore.assignedTasks" :key="agentId" class="task-item">
            <span class="task-agent" :style="{ color: STAFF[agentId as keyof typeof STAFF]?.color }">
              {{ STAFF[agentId as keyof typeof STAFF]?.emoji }} {{ STAFF[agentId as keyof typeof STAFF]?.name }}
            </span>
            <span class="task-desc">{{ task }}</span>
          </div>
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

// 消息区域 DOM 引用（用于滚动到底部）
const messagesEl = ref<HTMLElement | null>(null)
// 议题输入
const topicInput = ref('')
// 当前正在输入的专员（显示typing动画）
const typingAgent = ref<string | null>(null)
// 当前发言专员（头像高亮）
const speakingAgent = ref<string | null>(null)
// 控制终止的标志
let shouldStop = false

// 各专员信息定义
const STAFF = {
  captain: { name: 'Captain', emoji: '🎯', color: '#6366f1', role: '总指挥' },
  copywriter: { name: '林晓文', emoji: '✍️', color: '#f59e0b', role: '高级文案策划', dept: '内容部' },
  video: { name: '张明远', emoji: '🎬', color: '#ef4444', role: '视频内容总监', dept: '内容部' },
  poster: { name: '陈美琪', emoji: '🎨', color: '#ec4899', role: '首席设计师', dept: '创意部' },
  brand: { name: '王思远', emoji: '💎', color: '#8b5cf6', role: '品牌战略总监', dept: '品牌部' },
  trend: { name: '刘浩然', emoji: '📈', color: '#06b6d4', role: '市场情报总监', dept: '情报部' },
  publisher: { name: '赵欣然', emoji: '🚀', color: '#10b981', role: '发布运营总监', dept: '发布部' },
} as const

// 会议阶段说明文字
const meetingSteps = [
  'Captain 开场并介绍议题',
  '情报部分析相关热点趋势',
  '内容部提出文案方向',
  '视频专员补充视频策略',
  'Captain 汇总并分配任务',
]

// 阶段中文标签
const phaseLabel = computed(() => {
  const map: Record<string, string> = {
    idle: '待机',
    opening: '开场中',
    discussing: '讨论中',
    summarizing: '总结中',
    done: '已完成',
  }
  return map[meetingStore.phase] || ''
})

// 格式化时间戳
function formatTime(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 渲染消息内容（将换行转为 <br>，简单处理）
function renderContent(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

// 滚动到底部
async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

// 生成唯一 ID
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ── 核心：调用 AI 接口（复用 Brand.vue 的 callAgentAI 模式，支持 SSE 流式）──
async function callAgentAI(agentId: string, prompt: string, brandContext?: string): Promise<string> {
  const token = localStorage.getItem('erp_token') || ''
  const response = await fetch('/api/agent-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-erp-token': token,
      'x-agent-id': agentId,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      agentId,
      brandContext,
    }),
  })
  if (!response.ok) throw new Error(`Agent ${agentId} 请求失败 HTTP ${response.status}`)
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  if (!reader) throw new Error('无法读取响应流')

  let fullText = ''
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
        if (ev.type === 'text' && ev.text) {
          fullText += ev.text
        }
      } catch {}
    }
    if (shouldStop) break
  }
  return fullText
}

// ── 向会议室添加一条流式消息 ──
async function addStreamingMessage(agentId: keyof typeof STAFF, prompt: string, brandContext?: string) {
  if (shouldStop) return ''

  const staff = STAFF[agentId]
  // 显示 typing 动画
  typingAgent.value = agentId
  speakingAgent.value = agentId
  await scrollToBottom()

  // 等待短暂延迟，模拟真实输入节奏
  await new Promise(r => setTimeout(r, 600))
  if (shouldStop) { typingAgent.value = null; speakingAgent.value = null; return '' }

  // 创建流式消息占位
  const msgId = uid()
  const msg: MeetingMessage = {
    id: msgId,
    agentId,
    agentName: staff.name,
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

  // 调用 AI 并实时更新内容
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
        messages: [{ role: 'user', content: prompt }],
        agentId,
        brandContext,
      }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('无法读取响应')

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
  } catch (err) {
    // 网络失败时显示友好提示
    const errorMsg = '（网络异常，无法获取回复）'
    meetingStore.appendToLastMessage(agentId, errorMsg)
    meetingStore.finalizeLastMessage(agentId)
    speakingAgent.value = null
    await scrollToBottom()
    return errorMsg
  }
}

// ── 主会议流程（串行调用各专员 AI）──
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
      `你是数字游牧传媒的Captain总指挥，正在主持一场内部内容策划会议。\n会议议题：「${topic}」\n${brandInfo}\n\n请用简洁有力的开场白（150字以内）：\n1. 介绍今天的会议议题\n2. 说明会议目标\n3. 点明各部门专员的分工\n语气专业、有激情，体现总指挥风格。直接输出开场白，不要加任何额外说明。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 2. Captain 点名情报部
    await new Promise(r => setTimeout(r, 400))
    if (shouldStop) return finalizeMeeting()
    await addStreamingMessage('captain',
      `好，现在请情报部的刘浩然分析一下与「${topic}」相关的市场热点趋势。请用一句话点名并说明期望他分析的方向。直接输出这句话，30字以内。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 3. 情报部发言
    meetingStore.setPhase('discussing')
    await addStreamingMessage('trend',
      `你是数字游牧传媒情报部的刘浩然（市场情报总监）。\nCaptain 邀请你就议题「${topic}」分析市场趋势。\n${brandInfo}\n\n请从情报专员视角（200字以内）：\n- 点出2-3个当前最相关的社交媒体热点或趋势\n- 给出内容机会窗口判断\n- 推荐最适合的平台和话题方向\n语气专业务实，体现情报官风格。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 4. Captain 点名文案部
    await new Promise(r => setTimeout(r, 400))
    if (shouldStop) return finalizeMeeting()
    await addStreamingMessage('captain',
      `感谢刘浩然的情报分析。现在请内容部的林晓文基于刚才的趋势洞察，给出文案创作方向。请用一句话点名。30字以内。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 5. 文案部发言
    await addStreamingMessage('copywriter',
      `你是数字游牧传媒内容部的林晓文（高级文案策划）。\n议题：「${topic}」\n${brandInfo}\n\n基于情报部的趋势分析，请输出（200字以内）：\n- 核心文案方向（1-2句话提炼）\n- 推荐2-3个平台专属文案角度（如抖音/小红书/微博）\n- 一条示范标题（带emoji）\n语气有创意感，体现资深文案风格。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 6. 视频专员主动补充
    await new Promise(r => setTimeout(r, 500))
    if (shouldStop) return finalizeMeeting()
    await addStreamingMessage('video',
      `你是数字游牧传媒内容部的张明远（视频内容总监）。\n刚才文案部林晓文提出了文案方向，你主动补充视频层面的建议。\n议题：「${topic}」\n${brandInfo}\n\n请输出（150字以内）：\n- 短视频内容形式建议（口播/情景剧/开箱等）\n- 1个核心视频创意点（能引发互动的钩子）\n- 最佳发布时间段\n语气自信，体现视频策划专家风格。直接说建议，不用客套话。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 7. Captain 汇总并分配任务
    meetingStore.setPhase('summarizing')
    await new Promise(r => setTimeout(r, 400))
    if (shouldStop) return finalizeMeeting()

    const captainSummaryText = await addStreamingMessage('captain',
      `作为Captain，根据以上讨论，对「${topic}」进行最终汇总（200字以内）：\n\n1. 总结核心内容策略（2-3条）\n2. 明确分配任务：\n   - @林晓文：文案任务\n   - @张明远：视频任务\n   - @陈美琪：设计任务\n   - @赵欣然：发布安排\n3. 强调品牌调性要点\n\n语气有决断力，体现总指挥风格。`,
      brandContext
    )
    if (shouldStop) return finalizeMeeting()

    // 从汇总内容中提取任务分配（简单解析）
    if (captainSummaryText.includes('林晓文') || captainSummaryText.includes('文案')) {
      meetingStore.assignTask('copywriter', `围绕「${topic}」创作多平台文案`)
    }
    if (captainSummaryText.includes('张明远') || captainSummaryText.includes('视频')) {
      meetingStore.assignTask('video', `制作「${topic}」短视频脚本`)
    }
    if (captainSummaryText.includes('陈美琪') || captainSummaryText.includes('设计')) {
      meetingStore.assignTask('poster', `设计「${topic}」配套海报`)
    }
    if (captainSummaryText.includes('赵欣然') || captainSummaryText.includes('发布')) {
      meetingStore.assignTask('publisher', `安排「${topic}」内容排期发布`)
    }

    // 8. 生成会议纪要
    const summaryText = await callAgentAI('captain',
      `请为以下议题生成一份简洁的会议纪要：\n议题：「${topic}」\n${brandInfo}\n\n格式：\n【会议主题】\n【核心结论】（3条以内）\n【任务分配】（各专员各一条）\n【注意事项】（1条）\n\n100字以内，简洁专业。`,
      brandContext
    )

    finalizeMeeting(summaryText)
  } catch (err) {
    finalizeMeeting('会议因异常中断，请重新开始。')
  }
}

// 结束会议
function finalizeMeeting(summaryText?: string) {
  meetingStore.endMeeting(summaryText || '')
  typingAgent.value = null
  speakingAgent.value = null
  scrollToBottom()
}

// ── 用户操作 ──

// 开始会议
function handleStart() {
  const t = topicInput.value.trim()
  if (!t || meetingStore.isRunning) return
  runMeeting(t)
}

// 停止会议
function handleStop() {
  shouldStop = true
  finalizeMeeting('会议已手动结束。')
}

// 开始新会议
function handleNewMeeting() {
  meetingStore.resetMeeting()
  topicInput.value = ''
  shouldStop = false
}

// 导出会议纪要
function handleExport() {
  const content = [
    `# 会议纪要`,
    `**议题：** ${meetingStore.topic}`,
    `**时间：** ${new Date().toLocaleString('zh-CN')}`,
    ``,
    `## 会议记录`,
    ...meetingStore.messages.map(m =>
      `**${m.agentName}**（${STAFF[m.agentId as keyof typeof STAFF]?.role || ''}）\n${m.content}`
    ),
    ``,
    `## 会议纪要`,
    meetingStore.summary,
    ``,
    `## 任务分配`,
    ...Object.entries(meetingStore.assignedTasks).map(([id, task]) =>
      `- ${STAFF[id as keyof typeof STAFF]?.name || id}：${task}`
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

// 组件卸载时停止会议
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
  border-radius: 16px;
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
  gap: 14px;
  flex-wrap: wrap;
}
.meeting-header-left { display: flex; align-items: center; gap: 12px; }
.meeting-icon {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(99,102,241,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.meeting-title { font-size: 16px; font-weight: 800; color: var(--dark, #1d1d1f); margin: 0 0 3px; letter-spacing: -0.03em; }
.meeting-topic { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--mid, rgba(29,29,31,0.5)); }
.meeting-topic.empty { font-style: italic; }
.topic-label { font-weight: 600; }
.topic-text { font-weight: 500; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.phase-badge {
  padding: 2px 8px; border-radius: 20px;
  font-size: 10px; font-weight: 700;
  background: rgba(0,0,0,0.05); color: var(--mid, rgba(29,29,31,0.5));
}
.phase-opening, .phase-discussing { background: rgba(99,102,241,0.1); color: #6366f1; }
.phase-summarizing { background: rgba(245,158,11,0.1); color: #f59e0b; }
.phase-done { background: rgba(16,185,129,0.1); color: #10b981; }

/* 参与者头像列表 */
.participants { display: flex; align-items: center; gap: -4px; }
.participant-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  border: 2px solid transparent;
  margin-left: -4px;
  transition: border-color 0.3s, transform 0.2s;
  position: relative; z-index: 1;
}
.participant-avatar:first-child { margin-left: 0; }
.participant-avatar.speaking {
  transform: scale(1.18);
  z-index: 2;
  box-shadow: 0 0 0 3px rgba(255,255,255,0.8), 0 0 0 5px currentColor;
  animation: speakPulse 1.5s ease-in-out infinite;
}
@keyframes speakPulse {
  0%,100% { box-shadow: 0 0 0 3px rgba(255,255,255,0.8), 0 0 0 5px currentColor; }
  50% { box-shadow: 0 0 0 3px rgba(255,255,255,0.8), 0 0 0 8px color-mix(in srgb, currentColor 40%, transparent); }
}

/* ── 消息流 ── */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}
.messages-area::-webkit-scrollbar { width: 4px; }
.messages-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

/* 空状态 */
.meeting-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; flex: 1; padding: 40px 20px;
  text-align: center; gap: 12px;
}
.empty-icon { font-size: 48px; margin-bottom: 4px; }
.empty-title { font-size: 18px; font-weight: 800; color: var(--dark, #1d1d1f); letter-spacing: -0.03em; }
.empty-desc { font-size: 13px; color: var(--mid, rgba(29,29,31,0.5)); max-width: 360px; line-height: 1.6; }
.empty-steps {
  display: flex; flex-direction: column; gap: 8px;
  background: rgba(0,0,0,0.025); border-radius: 12px;
  padding: 14px 18px; margin-top: 8px; align-items: flex-start;
}
.empty-step {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--mid, rgba(29,29,31,0.5));
}
.step-num {
  width: 18px; height: 18px; border-radius: 50%;
  background: rgba(99,102,241,0.12); color: #6366f1;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

/* 消息行 */
.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: slideIn 0.25s ease both;
}
/* Captain 消息居左，大一点 */
.row-captain { flex-direction: row; }
/* 其他专员消息居右 */
.row-member { flex-direction: row-reverse; }
@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.msg-avatar {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; flex-shrink: 0;
  margin-top: 2px;
}
.row-captain .msg-avatar { width: 42px; height: 42px; border-radius: 12px; font-size: 20px; }

.msg-bubble-wrap {
  max-width: 70%;
  display: flex; flex-direction: column; gap: 4px;
}
.row-captain .msg-bubble-wrap { max-width: 75%; }
.row-member .msg-bubble-wrap { align-items: flex-end; }

.msg-meta {
  display: flex; align-items: center; gap: 6px;
  padding: 0 4px;
}
.row-member .msg-meta { flex-direction: row-reverse; }
.msg-name { font-size: 12px; font-weight: 700; }
.msg-role-tag {
  font-size: 10px; color: var(--dim, rgba(29,29,31,0.3));
  background: rgba(0,0,0,0.04); padding: 1px 7px; border-radius: 10px;
}
.msg-time { font-size: 10px; color: var(--dim, rgba(29,29,31,0.25)); }

.msg-bubble {
  padding: 11px 14px;
  border-radius: 14px;
  font-size: 13px; line-height: 1.65;
  color: var(--dark, #1d1d1f);
  background: #f5f5f7;
  border: 1px solid rgba(0,0,0,0.05);
  word-break: break-word;
  position: relative;
}
/* Captain 气泡特殊样式 */
.bubble-captain {
  background: rgba(99,102,241,0.06);
  border-color: rgba(99,102,241,0.15);
  border-left: 3px solid #6366f1;
  font-size: 13.5px;
}
/* 其他成员气泡颜色 */
.row-member .msg-bubble {
  background: color-mix(in srgb, var(--mc, #888) 7%, white);
  border-color: color-mix(in srgb, var(--mc, #888) 15%, white);
}
.bubble-streaming { animation: streamingPulse 1.5s ease-in-out infinite; }
@keyframes streamingPulse {
  0%,100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.typing-cursor {
  display: inline-block;
  animation: cursorBlink 0.8s ease-in-out infinite;
  margin-left: 2px; color: #6366f1;
}
@keyframes cursorBlink {
  0%,100% { opacity: 1; }
  50% { opacity: 0; }
}

.task-chip {
  font-size: 11px; color: #6366f1;
  background: rgba(99,102,241,0.07);
  border: 1px solid rgba(99,102,241,0.15);
  padding: 3px 10px; border-radius: 20px;
  display: inline-flex; align-items: center; gap: 4px;
}

/* 正在输入动画 */
.typing-row {
  display: flex; align-items: center; gap: 10px;
  animation: slideIn 0.2s ease both;
}
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
@keyframes typingBounce {
  0%,80%,100% { transform: translateY(0); opacity: 0.3; }
  40% { transform: translateY(-5px); opacity: 1; }
}
.typing-name { font-size: 11px; color: var(--dim, rgba(29,29,31,0.35)); margin-left: 4px; }

/* ── 底部输入区 ── */
.meeting-input-area {
  border-top: 1px solid rgba(0,0,0,0.06);
  padding: 14px 20px;
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

.input-row {
  display: flex; align-items: flex-end; gap: 10px;
}
.topic-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  font-size: 13.5px; font-family: inherit;
  color: var(--dark, #1d1d1f);
  background: var(--gray, #f5f5f7);
  resize: none; line-height: 1.5;
  transition: border-color 0.15s;
  outline: none;
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
  padding: 10px 18px;
  background: rgba(239,68,68,0.1); color: #ef4444;
  border: 1px solid rgba(239,68,68,0.2); border-radius: 12px;
  font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: background 0.15s;
}
.stop-btn:hover { background: rgba(239,68,68,0.15); }

.new-meeting-btn {
  padding: 10px 18px;
  background: rgba(99,102,241,0.08); color: #6366f1;
  border: 1px solid rgba(99,102,241,0.2); border-radius: 12px;
  font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; transition: background 0.15s;
}
.new-meeting-btn:hover { background: rgba(99,102,241,0.14); }

.export-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 10px 16px;
  background: #f5f5f7; color: rgba(29,29,31,0.6);
  border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
  font-size: 13px; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: all 0.15s;
}
.export-btn:hover { background: #ebebed; color: #1d1d1f; }

/* 会议纪要 */
.meeting-summary {
  background: rgba(99,102,241,0.04);
  border: 1px solid rgba(99,102,241,0.12);
  border-radius: 12px;
  padding: 14px 16px;
}
.summary-hd {
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
}
.summary-title { font-size: 13px; font-weight: 700; color: #6366f1; }
.summary-time { font-size: 11px; color: var(--dim, rgba(29,29,31,0.3)); margin-left: auto; }
.summary-content {
  font-size: 12.5px; color: var(--dark, #1d1d1f);
  line-height: 1.7; white-space: pre-wrap;
}
.assigned-tasks { margin-top: 12px; border-top: 1px solid rgba(99,102,241,0.1); padding-top: 10px; }
.tasks-title { font-size: 11px; font-weight: 700; color: var(--dim, rgba(29,29,31,0.4)); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
.task-item { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 5px; }
.task-agent { font-size: 12px; font-weight: 700; white-space: nowrap; }
.task-desc { font-size: 12px; color: var(--dark, #1d1d1f); }

/* 暗色模式 */
:global([data-theme='dark']) .meeting-room { background: #111827; border-color: #1f2937; }
:global([data-theme='dark']) .meeting-header { border-bottom-color: #1f2937; }
:global([data-theme='dark']) .meeting-title { color: #f8fafc; }
:global([data-theme='dark']) .msg-bubble { background: #1e293b; border-color: #334155; color: #e2e8f0; }
:global([data-theme='dark']) .bubble-captain { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.2); }
:global([data-theme='dark']) .row-member .msg-bubble { background: color-mix(in srgb, var(--mc, #888) 12%, #1e293b); }
:global([data-theme='dark']) .typing-bubble { background: #1e293b; border-color: #334155; }
:global([data-theme='dark']) .topic-input { background: #1e293b; border-color: #334155; color: #e2e8f0; }
:global([data-theme='dark']) .topic-input:focus { border-color: #6366f1; background: #1e293b; }
:global([data-theme='dark']) .empty-steps { background: rgba(255,255,255,0.03); }
:global([data-theme='dark']) .meeting-input-area { border-top-color: #1f2937; }
:global([data-theme='dark']) .export-btn { background: #1e293b; border-color: #334155; color: #94a3b8; }
:global([data-theme='dark']) .export-btn:hover { background: #273549; color: #e2e8f0; }
:global([data-theme='dark']) .meeting-summary { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.2); }
:global([data-theme='dark']) .summary-content { color: #e2e8f0; }
:global([data-theme='dark']) .task-desc { color: #e2e8f0; }

/* 响应式 */
@media (max-width: 768px) {
  .meeting-room { height: auto; min-height: 100vh; border-radius: 12px; }
  .messages-area { min-height: 50vh; }
  .participants { display: none; }
  .msg-bubble-wrap { max-width: 85%; }
  .row-captain .msg-bubble-wrap { max-width: 90%; }
}
</style>
