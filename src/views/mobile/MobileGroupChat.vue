<template>
  <div class="m-gc">
    <!-- 顶部栏 -->
    <div class="m-gc-topbar">
      <button class="m-gc-back" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <div class="m-gc-title-area" @click="showGroupInfo = true">
        <div class="m-gc-title">{{ chatTitle }}</div>
        <div v-if="members.length > 2" class="m-gc-sub">{{ members.length }} 人</div>
      </div>
      <button class="m-gc-more" @click="showGroupInfo = true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
    </div>

    <!-- 消息列表 -->
    <div ref="msgListRef" class="m-gc-messages" @scroll="onScroll">
      <!-- 加载更多 -->
      <div v-if="loadingMore" class="m-gc-loading-more">加载更多...</div>

      <!-- 日期分隔线 -->
      <div v-for="(group, date) in groupedMessages" :key="date" class="m-gc-date-group">
        <div class="m-gc-date-divider">{{ formatDateLabel(date) }}</div>
        <div v-for="msg in group" :key="msg.id" class="m-gc-msg-row" :class="{ own: msg.sender_id === authStore.userInfo?.id }">
          <!-- 系统消息 -->
          <div v-if="msg.type === 'system'" class="m-gc-system">
            <span>{{ msg.content }}</span>
          </div>

          <!-- 普通消息 -->
          <template v-else>
            <div v-if="msg.sender_id !== authStore.userInfo?.id" class="m-gc-avatar">
              {{ msg.sender_name?.[0] || '?' }}
            </div>
            <div class="m-gc-msg-col">
              <div v-if="msg.sender_id !== authStore.userInfo?.id" class="m-gc-sender-name">{{ msg.sender_name }}</div>
              <div class="m-gc-bubble" :class="{ own: msg.sender_id === authStore.userInfo?.id }">
                <!-- AI 回复卡片 -->
                <div v-if="msg.type === 'ai_reply'" class="m-gc-ai-card">
                  <div class="m-gc-ai-card-header">
                    <div class="m-gc-ai-avatar">🦢</div>
                    <span class="m-gc-ai-name">管家</span>
                    <span class="m-gc-ai-conf" :class="getConfidenceClass(msg.metadata)">{{ getConfidenceLabel(msg.metadata) }}</span>
                  </div>
                  <div class="m-gc-ai-card-body" v-html="renderAIContent(msg.content)" />
                  <div v-if="msg.metadata?.parsed" class="m-gc-ai-card-actions">
                    <button class="m-gc-ai-confirm" :disabled="msg._confirming" @click="confirmAIMessage(msg)">
                      {{ msg._confirming ? '录入中...' : '确认录入' }}
                    </button>
                    <button class="m-gc-ai-cancel" @click="cancelAIMessage(msg)">取消</button>
                  </div>
                  <div v-if="msg.metadata?.confirmed" class="m-gc-ai-confirmed">
                    ✅ 已录入系统，等待审核
                  </div>
                </div>
                <!-- 普通文本 -->
                <div v-else v-html="renderContent(msg.content)" />
              </div>
              <div class="m-gc-msg-time">{{ formatMsgTime(msg.created_at) }}</div>
            </div>
          </template>
        </div>
      </div>

      <div ref="bottomRef" />
    </div>

    <!-- 输入区 -->
    <div class="m-gc-input-area">
      <!-- @成员选择器 -->
      <div v-if="showAtPicker" class="m-gc-at-picker">
        <div class="m-gc-at-header">选择成员</div>
        <div class="m-gc-at-list">
          <div v-for="m in members" :key="m.id" class="m-gc-at-item" @click="insertAt(m)">
            <div class="m-gc-at-avatar">{{ m.name?.[0] || '?' }}</div>
            <span>{{ m.name }}</span>
          </div>
        </div>
      </div>

      <div class="m-gc-input-row">
        <button class="m-gc-at-btn" @click="showAtPicker = !showAtPicker">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2">
            <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
          </svg>
        </button>
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="m-gc-textarea"
          :placeholder="aiMode ? '@管家 + 描述业务，如：录销售单给老王，奶茶5箱' : '输入消息...'"
          rows="1"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
        />
        <button class="m-gc-send-btn" :disabled="!inputText.trim() || sending" @click="sendMessage">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 群详情/设置 -->
    <div v-if="showGroupInfo" class="m-modal-mask" @click.self="showGroupInfo = false">
      <div class="m-modal-sheet m-modal-sheet-tall">
        <div class="m-modal-header">
          <span>群设置</span>
          <button class="m-modal-close" @click="showGroupInfo = false">关闭</button>
        </div>
        <div class="m-modal-body">
          <div class="m-group-info">
            <div class="m-group-avatar">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="m-group-name">{{ group?.name }}</div>
          </div>

          <div class="m-group-members">
            <div class="m-group-members-title">成员 ({{ members.length }})</div>
            <div class="m-group-member-list">
              <div v-for="m in members" :key="m.id" class="m-group-member-item">
                <div class="m-group-member-avatar">{{ m.name?.[0] || '?' }}</div>
                <span class="m-group-member-name">{{ m.name }}</span>
                <span v-if="m.role === 'owner'" class="m-group-member-role">群主</span>
              </div>
            </div>
            <button class="m-group-add-member" @click="showAddMember = true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              添加成员
            </button>
          </div>

          <!-- 消息清理 -->
          <div class="m-group-danger">
            <div class="m-group-danger-title">消息管理</div>
            <div class="m-group-cleanup-row">
              <div class="m-group-cleanup-info">
                <div class="m-group-cleanup-label">清理历史消息</div>
                <div class="m-group-cleanup-sub">清理后不可恢复，确定要清理吗？</div>
              </div>
              <button class="m-group-cleanup-btn" @click="showCleanupConfirm = true">清理</button>
            </div>
          </div>

          <!-- 退群 -->
          <div v-if="group?.can_quit !== false" class="m-group-danger">
            <button class="m-group-quit-btn" @click="quitGroup">退出群聊</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加成员弹窗 -->
    <div v-if="showAddMember" class="m-modal-mask" @click.self="showAddMember = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>添加成员</span>
          <button class="m-modal-close" @click="showAddMember = false">取消</button>
        </div>
        <div class="m-modal-body">
          <div class="m-pick-search">
            <input v-model="addMemberSearch" class="m-input" placeholder="搜索成员..." />
          </div>
          <div class="m-pick-list">
            <div v-for="m in addableMembers" :key="m.id" class="m-pick-item" @click="addMember(m)">
              <div class="m-pick-avatar">{{ m.name?.[0] || '?' }}</div>
              <div class="m-pick-info">
                <div class="m-pick-name">{{ m.name }}</div>
                <div class="m-pick-sub">{{ m.position || '成员' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 清理确认 -->
    <div v-if="showCleanupConfirm" class="m-modal-mask" @click.self="showCleanupConfirm = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>清理消息</span>
          <button class="m-modal-close" @click="showCleanupConfirm = false">取消</button>
        </div>
        <div class="m-modal-body">
          <div class="m-form-item">
            <label>保留最近</label>
            <div class="m-form-tags">
              <span :class="['m-form-tag', cleanupDays === 30 ? 'active' : '']" @click="cleanupDays = 30">1个月</span>
              <span :class="['m-form-tag', cleanupDays === 90 ? 'active' : '']" @click="cleanupDays = 90">3个月</span>
              <span :class="['m-form-tag', cleanupDays === 180 ? 'active' : '']" @click="cleanupDays = 180">6个月</span>
            </div>
          </div>
          <p style="font-size:13px;color:#86909c;margin-top:8px">清理后无法恢复，请谨慎操作。</p>
        </div>
        <div class="m-modal-footer">
          <button class="m-btn-danger" :disabled="cleaning" @click="cleanupMessages">
            {{ cleaning ? '清理中...' : '确认清理' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import http from '@/api/http'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const groupId = computed(() => Number(route.params.id))

const messages = ref<any[]>([])
const group = ref<any>(null)
const members = ref<any[]>([])

// 私聊时标题显示对方名字，群聊显示群名
const chatTitle = computed(() => {
  if (!members.value.length) return group.value?.name || '加载中...'
  // 2人=私聊，取对方名字
  if (members.value.length <= 2) {
    const other = members.value.find((m: any) => String(m.id) !== String(authStore.userInfo?.id))
    return other?.name || group.value?.name || '聊天'
  }
  return group.value?.name || '群聊'
})

const inputText = ref('')
const sending = ref(false)
const loadingMore = ref(false)
const showGroupInfo = ref(false)
const showAddMember = ref(false)
const showCleanupConfirm = ref(false)
const showAtPicker = ref(false)
const addMemberSearch = ref('')
const cleanupDays = ref(180)
const cleaning = ref(false)
const aiMode = ref(false)

const msgListRef = ref<HTMLElement>()
const bottomRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()

let pollTimer: ReturnType<typeof setInterval> | null = null
let lastMessageId = 0

const addableMembers = computed(() => {
  const existingIds = new Set(members.value.map((m: any) => m.id))
  const all = members.value // 复用已有成员数据
  if (!addMemberSearch.value) return all.filter((m: any) => !existingIds.has(m.id))
  const q = addMemberSearch.value.toLowerCase()
  return all.filter((m: any) => !existingIds.has(m.id) && m.name?.toLowerCase().includes(q))
})

const groupedMessages = computed(() => {
  const groups: Record<string, any[]> = {}
  messages.value.forEach(m => {
    const date = (m.created_at || '').slice(0, 10)
    if (!groups[date]) groups[date] = []
    groups[date].push(m)
  })
  return groups
})

function renderContent(content: string) {
  // 检测@提醒
  return content.replace(/@(\S+)/g, '<span class="m-gc-at-highlight">@$1</span>')
}

function renderAIContent(content: string) {
  return content.replace(/\n/g, '<br>')
}

function getConfidenceClass(metadata: any) {
  const c = metadata?.confidence || 0
  if (c >= 0.85) return 'high'
  if (c >= 0.6) return 'med'
  return 'low'
}

function getConfidenceLabel(metadata: any) {
  const c = metadata?.confidence || 0
  if (c >= 0.85) return `置信度 ${Math.round(c * 100)}%`
  if (c >= 0.6) return `置信度 ${Math.round(c * 100)}%（请核对）`
  return '置信度低，请补充信息'
}

function formatMsgTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateLabel(date: string) {
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.getTime() === today.getTime()) return '今天'
  if (d.getTime() === yesterday.getTime()) return '昨天'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function autoResize() {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
  inputRef.value.style.height = Math.min(inputRef.value.scrollHeight, 120) + 'px'
}

function insertAt(member: any) {
  inputText.value += `@${member.name} `
  showAtPicker.value = false
  inputRef.value?.focus()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || sending.value) return
  inputText.value = ''
  if (inputRef.value) inputRef.value.style.height = 'auto'
  sending.value = true

  // 检查群里是否有 Agent（captain, copywriter, poster 等）
  const agentInGroup = members.value.find((m: any) => 
    ['captain', 'copywriter', 'poster', 'video', 'brand', 'trend', 'publisher', 'designer', 'marketing'].includes(String(m.id))
  )
  const agentId = agentInGroup ? String(agentInGroup.id) : null

  // 本地先加一条消息，优化体验
  const localMsg = {
    id: `local-${Date.now()}`,
    group_id: groupId.value,
    sender_id: authStore.userInfo?.id,
    sender_name: authStore.userInfo?.name || authStore.userInfo?.account,
    content: text,
    type: 'text',
    created_at: new Date().toISOString(),
    _pending: true,
  }
  messages.value.push(localMsg)
  await scrollToBottom()

  try {
    // 1. 先发送用户消息到群
    const res = await http.post(`/chat/groups/${groupId.value}/messages`, { content: text })
    const sent = res?.data ?? res
    // 替换本地消息
    const idx = messages.value.findIndex(m => m.id === localMsg.id)
    if (idx !== -1) messages.value.splice(idx, 1, sent)
    lastMessageId = sent.id

    // 2. 如果群里有 Agent，调用 Agent API 获取 AI 回复
    if (agentId) {
      try {
        // 调用 /api/agent-chat 获取 AI 回复（流式API）
        const aiRes = await fetch('/api/agent-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId,
            messages: [{ role: 'user', content: text }],
          }),
        })
        
        // 处理流式响应
        const reader = aiRes.body?.getReader()
        const decoder = new TextDecoder()
        let aiText = ''
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            // 解析 SSE 格式: data: {...}\n\n
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.type === 'text' && data.text) {
                    aiText += data.text
                  }
                } catch {}
              }
            }
          }
        }
        
        // 添加 AI 回复到消息列表
        if (aiText) {
          messages.value.push({
            id: `ai-${Date.now()}`,
            sender_id: agentId,
            sender_name: agentInGroup.name,
            content: aiText,
            type: 'ai_reply',
            created_at: new Date().toISOString(),
          })
          await scrollToBottom()
        }
      } catch (aiErr) {
        console.error('AI 回复失败', aiErr)
      }
    }
  } catch (e: any) {
    ElMessage.error('发送失败')
    const idx = messages.value.findIndex(m => m.id === localMsg.id)
    if (idx !== -1) messages.value.splice(idx, 1)
  } finally {
    sending.value = false
  }
}

async function confirmAIMessage(msg: any) {
  msg._confirming = true
  try {
    const parsed = msg.metadata?.parsed
    if (!parsed) return
    const res = await http.post('/ai/confirm-order', {
      parsed,
      message_id: msg.id,
      group_id: groupId.value,
    })
    msg.metadata = { ...msg.metadata, confirmed: true }
    ElMessage.success('已录入系统，等待审核')
    // 更新消息内容
    const idx = messages.value.findIndex(m => m.id === msg.id)
    if (idx !== -1) {
      messages.value[idx] = { ...messages.value[idx] }
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '录入失败')
  } finally {
    msg._confirming = false
  }
}

function cancelAIMessage(msg: any) {
  // 删除这条AI消息
  messages.value = messages.value.filter(m => m.id !== msg.id)
}

async function addMember(m: any) {
  try {
    await http.post(`/chat/groups/${groupId.value}/members`, { user_id: m.id })
    members.value.push(m)
    showAddMember.value = false
    ElMessage.success(`已添加 ${m.name}`)
  } catch {
    ElMessage.error('添加失败')
  }
}

async function quitGroup() {
  try {
    await ElMessageBox.confirm('确定退出该群聊？', '退出群聊', { type: 'warning' })
    await http.delete(`/chat/groups/${groupId.value}/members/${authStore.userInfo?.id}`)
    ElMessage.success('已退出群聊')
    showGroupInfo.value = false
    router.back()
  } catch { /* 取消 */ }
}

async function cleanupMessages() {
  cleaning.value = true
  try {
    await http.post(`/chat/groups/${groupId.value}/cleanup`, { days: cleanupDays.value })
    ElMessage.success('清理成功')
    messages.value = []
    showCleanupConfirm.value = false
    showGroupInfo.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '清理失败')
  } finally {
    cleaning.value = false
  }
}

async function scrollToBottom() {
  await nextTick()
  bottomRef.value?.scrollIntoView({ behavior: 'smooth' })
}

async function loadMessages(reset = false) {
  if (reset) {
    messages.value = []
    lastMessageId = 0
  }
  try {
    const res = await http.get(`/chat/groups/${groupId.value}/messages`, {
      params: { list_rows: 50, before_id: reset ? undefined : lastMessageId || undefined }
    })
    const rows = res?.data?.rows ?? res?.rows ?? []
    if (reset) {
      messages.value = rows
    } else if (rows.length > 0) {
      messages.value.unshift(...rows)
    }
    if (rows.length > 0) lastMessageId = rows[rows.length - 1].id
  } catch { /* 忽略 */ }
}

async function loadGroup() {
  try {
    const [groupRes, memberRes] = await Promise.allSettled([
      http.get(`/chat/groups/${groupId.value}`),
      http.get(`/chat/groups/${groupId.value}/members`),
    ])
    if (groupRes.status === 'fulfilled') group.value = groupRes.value?.data ?? groupRes.value
    if (memberRes.status === 'fulfilled') members.value = memberRes.value?.data?.rows ?? memberRes.value?.rows ?? []
  } catch { /* 忽略 */ }
}

function onScroll() {
  if (!msgListRef.value) return
  if (msgListRef.value.scrollTop < 50 && !loadingMore.value && messages.value.length > 0) {
    loadingMore.value = true
    loadMessages(false).finally(() => { loadingMore.value = false })
  }
}

onMounted(async () => {
  await Promise.all([loadGroup(), loadMessages(true)])
  await scrollToBottom()

  // 轮询新消息（每 5 秒）
  pollTimer = setInterval(async () => {
    try {
      const res = await http.get(`/chat/groups/${groupId.value}/messages`, {
        params: { list_rows: 50 }
      })
      const rows = res?.data?.rows ?? res?.rows ?? []
      // 找出比 lastMessageId 更新的消息
      const newMsgs = rows.filter((m: any) => m.id > lastMessageId)
      if (newMsgs.length > 0) {
        messages.value.push(...newMsgs)
        lastMessageId = newMsgs[newMsgs.length - 1].id
        await scrollToBottom()
      }
    } catch { /* 忽略 */ }
  }, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.m-gc {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: #f5f5f7;
}

/* ── 顶部栏 ── */
.m-gc-topbar {
  height: 52px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid #e5e6eb;
  flex-shrink: 0;
  z-index: 5;
}
.m-gc-back {
  width: 36px; height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #4e5969;
}
.m-gc-title-area {
  flex: 1;
  text-align: center;
  cursor: pointer;
}
.m-gc-title { font-size: 16px; font-weight: 700; color: #1d2129; }
.m-gc-sub { font-size: 11px; color: #86909c; }
.m-gc-more {
  width: 36px; height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #4e5969;
}

/* ── 消息列表 ── */
.m-gc-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px;
  -webkit-overflow-scrolling: touch;
}
.m-gc-loading-more {
  text-align: center;
  font-size: 12px;
  color: #86909c;
  padding: 8px;
}
.m-gc-date-group { margin-bottom: 16px; }
.m-gc-date-divider {
  text-align: center;
  font-size: 11px;
  color: #86909c;
  margin-bottom: 12px;
  font-weight: 600;
}

/* ── 消息行 ── */
.m-gc-msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}
.m-gc-msg-row.own { flex-direction: row-reverse; }
.m-gc-avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, #0071e3, #005bb5);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.m-gc-msg-col { display: flex; flex-direction: column; gap: 2px; max-width: 75%; }
.m-gc-msg-row.own .m-gc-msg-col { align-items: flex-end; }
.m-gc-sender-name { font-size: 11px; font-weight: 600; color: #86909c; padding-left: 4px; }
.m-gc-bubble {
  background: #fff;
  border-radius: 14px 14px 14px 4px;
  padding: 10px 13px;
  font-size: 15px;
  color: #1d2129;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.m-gc-bubble.own {
  background: #0071e3;
  color: #fff;
  border-radius: 14px 14px 4px 14px;
}
.m-gc-msg-time { font-size: 10px; color: #86909c; padding-left: 4px; }
.m-gc-msg-row.own .m-gc-msg-time { padding-right: 4px; }

/* ── 系统消息 ── */
.m-gc-system {
  text-align: center;
  width: 100%;
  font-size: 12px;
  color: #86909c;
  margin: 4px 0;
}
.m-gc-system span {
  background: rgba(0,0,0,0.05);
  padding: 3px 10px;
  border-radius: 999px;
}

/* ── AI 卡片 ── */
.m-gc-ai-card {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  overflow: hidden;
  min-width: 220px;
}
.m-gc-ai-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid #bfdbfe;
}
.m-gc-ai-avatar { font-size: 18px; }
.m-gc-ai-name { font-size: 13px; font-weight: 700; color: #1d2129; flex: 1; }
.m-gc-ai-conf {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}
.m-gc-ai-conf.high { background: #dcfce7; color: #16a34a; }
.m-gc-ai-conf.med { background: #fef9c3; color: #ca8a04; }
.m-gc-ai-conf.low { background: #fee2e2; color: #dc2626; }
.m-gc-ai-card-body {
  padding: 10px 12px;
  font-size: 14px;
  color: #1d2129;
  line-height: 1.6;
}
.m-gc-ai-card-actions {
  display: flex;
  gap: 8px;
  padding: 8px 12px 10px;
}
.m-gc-ai-confirm {
  flex: 1;
  height: 34px;
  background: #0071e3;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.m-gc-ai-confirm:disabled { background: #a0cfff; cursor: not-allowed; }
.m-gc-ai-cancel {
  height: 34px;
  padding: 0 12px;
  background: #f2f3f5;
  border: none;
  border-radius: 8px;
  color: #4e5969;
  font-size: 13px;
  cursor: pointer;
}
.m-gc-ai-confirmed {
  text-align: center;
  font-size: 12px;
  color: #16a34a;
  font-weight: 600;
  padding: 6px 12px 10px;
}

/* ── 输入区 ── */
.m-gc-input-area {
  background: #fff;
  border-top: 1px solid #e5e6eb;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom, 0px));
  flex-shrink: 0;
}
.m-gc-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.m-gc-at-btn {
  width: 36px; height: 36px;
  border: none;
  background: #f5f5f7;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.m-gc-textarea {
  flex: 1;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 18px;
  padding: 8px 14px;
  font-size: 15px;
  color: #1d2129;
  outline: none;
  resize: none;
  line-height: 1.5;
  max-height: 120px;
  font-family: inherit;
  transition: border 0.15s;
}
.m-gc-textarea:focus { border-color: #0071e3; background: #fff; }
.m-gc-send-btn {
  width: 36px; height: 36px;
  background: #0071e3;
  border: none;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.m-gc-send-btn:disabled { background: #d1d5db; cursor: not-allowed; }

/* ── @选择器 ── */
.m-gc-at-picker {
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  margin-bottom: 8px;
  max-height: 180px;
  overflow-y: auto;
}
.m-gc-at-header {
  font-size: 11px;
  font-weight: 600;
  color: #86909c;
  padding: 8px 12px 4px;
  text-transform: uppercase;
}
.m-gc-at-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-gc-at-item:active { background: #f5f5f7; }
.m-gc-at-avatar {
  width: 28px; height: 28px;
  background: #0071e3;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

/* ── 弹窗通用 ── */
.m-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.m-modal-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  height: 80vh;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
  box-sizing: border-box;
}
.m-modal-sheet-tall { height: 80vh; max-height: 85vh; }
.m-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
  flex-shrink: 0;
}
.m-modal-close { border: none; background: transparent; color: #0071e3; font-size: 14px; cursor: pointer; }
.m-modal-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; touch-action: pan-y; -webkit-overflow-scrolling: touch; }
.m-modal-footer { padding: 14px 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom, 20px)); border-top: 1px solid #f2f3f5; flex-shrink: 0; }

.m-group-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 16px;
}
.m-group-avatar {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, #0071e3, #005bb5);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 10px;
}
.m-group-name { font-size: 18px; font-weight: 700; color: #1d2129; }
.m-group-members-title { font-size: 14px; font-weight: 700; color: #1d2129; margin-bottom: 10px; }
.m-group-member-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.m-group-member-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.m-group-member-avatar {
  width: 32px; height: 32px;
  background: #0071e3;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.m-group-member-name { flex: 1; font-size: 14px; color: #1d2129; }
.m-group-member-role { font-size: 11px; color: #86909c; background: #f2f3f5; padding: 2px 8px; border-radius: 999px; }
.m-group-add-member {
  width: 100%;
  height: 40px;
  border: 1px dashed #0071e3;
  background: transparent;
  border-radius: 10px;
  color: #0071e3;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}
.m-group-danger { margin-top: 16px; padding-top: 16px; border-top: 1px solid #f2f3f5; }
.m-group-danger-title { font-size: 13px; font-weight: 600; color: #86909c; margin-bottom: 10px; }
.m-group-cleanup-row { display: flex; align-items: center; justify-content: space-between; }
.m-group-cleanup-label { font-size: 14px; font-weight: 600; color: #1d2129; }
.m-group-cleanup-sub { font-size: 12px; color: #86909c; margin-top: 2px; }
.m-group-cleanup-btn {
  padding: 6px 16px;
  background: #f53f3f;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.m-group-quit-btn {
  width: 100%;
  height: 44px;
  background: #fff;
  border: 1px solid #f53f3f;
  border-radius: 10px;
  color: #f53f3f;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.m-pick-search { margin-bottom: 12px; }
.m-pick-list { display: flex; flex-direction: column; }
.m-pick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #f2f3f5;
}
.m-pick-avatar {
  width: 36px; height: 36px;
  background: #0071e3;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}
.m-pick-info { flex: 1; }
.m-pick-name { font-size: 14px; font-weight: 600; color: #1d2129; }
.m-pick-sub { font-size: 12px; color: #86909c; }
.m-input {
  width: 100%;
  height: 44px;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 15px;
  color: #1d2129;
  outline: none;
  box-sizing: border-box;
}
.m-form-item { margin-bottom: 8px; }
.m-form-item label { display: block; font-size: 13px; font-weight: 600; color: #4e5969; margin-bottom: 8px; }
.m-form-tags { display: flex; gap: 8px; }
.m-form-tag {
  padding: 6px 14px;
  background: #f5f5f7;
  border-radius: 999px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
}
.m-form-tag.active { background: #0071e3; color: #fff; }
.m-btn-danger {
  width: 100%;
  height: 48px;
  background: #f53f3f;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}
.m-btn-danger:disabled { background: #fca5a5; cursor: not-allowed; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
