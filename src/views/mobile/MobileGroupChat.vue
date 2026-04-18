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
    <!-- 聊天设置（微信风格） -->
    <div v-if="showGroupInfo" class="m-gs-mask" @click.self="showGroupInfo = false">
      <div class="m-gs-sheet">
        <div class="m-gs-header">
          <span class="m-gs-back" @click="showGroupInfo = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </span>
          <span>聊天信息</span>
        </div>
        <div class="m-gs-body">

          <!-- ========== 群聊顶部 ========== -->
          <template v-if="isGroupChat">
            <div class="m-gs-top">
              <div class="m-gs-top-avatar" :style="{ background: getAvatarColor(groupId.value || 'group') }">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="m-gs-top-info">
                <div class="m-gs-top-name" @click="startRename">{{ group?.name }}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" style="vertical-align:middle;margin-left:4px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
                <div class="m-gs-top-sub">{{ members.length }} 人</div>
              </div>
              <div class="m-gs-add-btn-large" @click="showAddMember = true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
            </div>

            <!-- 群成员列表（横向滚动） -->
            <div class="m-gs-members-scroll">
              <div v-for="m in members" :key="m.id" class="m-gs-member-inline" @click="openMemberAction(m)">
                <div class="m-gs-avatar-sm" :style="{ background: getAvatarColor(m.id) }">{{ m.name?.[0] || '?' }}</div>
                <span class="m-gs-member-inline-name">{{ m.name }}</span>
              </div>
            </div>
          </template>

          <!-- ========== 私聊顶部 ========== -->
          <template v-else>
            <div class="m-gs-top">
              <div class="m-gs-top-avatar" :style="{ background: getAvatarColor(otherUser?.id || 'user') }">
                {{ otherUser?.name?.[0] || '?' }}
              </div>
              <div class="m-gs-top-info">
                <div class="m-gs-top-name">{{ otherUser?.name || '未知用户' }}</div>
                <div class="m-gs-top-sub">{{ otherUser?.position || '' }}</div>
              </div>
            </div>
          </template>

          <!-- 置顶开关（有后端API） -->
          <div class="m-gs-section">
            <div class="m-gs-row">
              <span class="m-gs-row-label">置顶聊天</span>
              <div class="m-gs-switch" :class="{ active: pinEnabled }" @click="togglePin">
                <div class="m-gs-switch-dot"></div>
              </div>
            </div>
          </div>

          <!-- 危险操作 -->
          <div class="m-gs-section">
            <div class="m-gs-row danger" @click="showCleanupConfirm = true">
              <span>清空聊天记录</span>
            </div>
            <div v-if="isGroupChat" class="m-gs-row danger" @click="quitGroup">
              <span>退出群聊</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加成员弹窗 -->
    <!-- 微信风格选择联系人 -->
    <div v-if="showAddMember" class="m-pick-overlay">
      <div class="m-pick-topbar">
        <button class="m-pick-close" @click="cancelAddMember">✕</button>
        <span class="m-pick-title">选择联系人</span>
        <span class="m-pick-count">[{{ allContacts.length }}]</span>
        <span v-if="addSelectedIds.size > 0" class="m-pick-count">{{ addSelectedIds.size }}</span>
      </div>
      <div class="m-pick-search-bar">
        <input v-model="addMemberSearch" class="m-pick-search-input" placeholder="搜索" />
      </div>
      <div class="m-pick-body">
        <div v-for="m in addableMembers" :key="m.id" class="m-pick-row" @click="toggleAddSelect(m)">
          <div class="m-pick-check" :class="{ checked: addSelectedIds.has(m.id) }">
            <svg v-if="addSelectedIds.has(m.id)" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#07c160"/><path d="M5 8l2 2 4-4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="m-pick-avatar2">{{ m.name?.[0] || '?' }}</div>
          <div class="m-pick-info2">
            <div class="m-pick-name2">{{ m.name }}</div>
            <div class="m-pick-sub2">{{ m.position || '' }}</div>
          </div>
        </div>
        <div v-if="!allContacts.length" class="m-pick-empty">加载中...</div>
        <div v-else-if="!addableMembers.length" class="m-pick-empty">没有可添加的联系人（共{{ allContacts.length }}人，已在群中或无匹配）</div>
      </div>
      <div class="m-pick-footer">
        <button class="m-pick-done" :disabled="!addSelectedIds.size" @click="confirmAddMembers">完成{{ addSelectedIds.size ? `(${addSelectedIds.size})` : '' }}</button>
      </div>
    </div>

    <!-- 成员操作菜单 -->
    <div v-if="showMemberAction" class="m-modal-mask m-gs-member-mask" @click.self="showMemberAction = false">
      <div class="m-modal-sheet m-modal-sheet-sm m-gs-member-sheet">
        <div class="m-modal-header">
          <span>成员操作</span>
          <button class="m-modal-close" @click="showMemberAction = false">关闭</button>
        </div>
        <div class="m-gs-member-action-info">
          <div class="m-gs-avatar-lg" :style="{ background: getAvatarColor(memberActionTarget?.id || '') }">
            {{ memberActionTarget?.name?.[0] || '?' }}
          </div>
          <div class="m-gs-member-action-name">{{ memberActionTarget?.name }}</div>
          <div class="m-gs-member-action-pos">{{ memberActionTarget?.position || '成员' }}</div>
        </div>
        <div class="m-gs-member-action-list">
          <div class="m-gs-member-action-row" @click="chatWithMember">
            <span>💬 发消息</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
          <div v-if="canRemoveMember" class="m-gs-member-action-row danger" @click="removeMember">
            <span>🗑 移出群聊</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f53f3f" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 清理确认 -->
    <!-- 修改群名 -->
    <div v-if="renamingGroup" class="m-modal-mask" @click.self="renamingGroup = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>修改群名</span>
          <button class="m-modal-close" @click="renamingGroup = false">取消</button>
        </div>
        <div class="m-modal-body">
          <input v-model="renameText" class="m-input" placeholder="输入新群名" maxlength="30" autofocus @keyup.enter="confirmRename" />
        </div>
        <div class="m-modal-footer">
          <button class="m-btn-danger" @click="confirmRename">确认修改</button>
        </div>
      </div>
    </div>

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
import { ref, computed, onMounted, onUnmounted, nextTick, inject, watch, type Ref } from 'vue'
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

// 是否群聊（3人及以上）
const isGroupChat = computed(() => members.value.length > 2)

// 私聊时的对方信息
const otherUser = computed(() => {
  if (isGroupChat.value) return null
  return members.value.find((m: any) => String(m.id) !== String(authStore.userInfo?.id)) || null
})

// 私聊时标题显示对方名字，群聊显示群名
const chatTitle = computed(() => {
  if (!members.value.length) return group.value?.name || '加载中...'
  if (!isGroupChat.value) {
    return otherUser.value?.name || group.value?.name || '聊天'
  }
  return group.value?.name || '群聊'
})

const inputText = ref('')
const sending = ref(false)
const loadingMore = ref(false)
const showGroupInfo = ref(false)
const showAddMember = ref(false)
const showCleanupConfirm = ref(false)
const renamingGroup = ref(false)
const renameText = ref('')
const showMemberAction = ref(false)
const memberActionTarget = ref<any>(null)

// 聊天时隐藏底部 TabBar（进入即隐藏，弹窗也隐藏）
const hideTabbar = inject<Ref<boolean>>('hideTabbar', ref(false))
hideTabbar.value = true
watch([showGroupInfo, showAddMember, showCleanupConfirm, showMemberAction], ([a, b, c, d]) => {
  // 弹窗关闭时不恢复 TabBar（因为还在聊天页），只在离开页面时恢复
  if (a || b || c || d) hideTabbar.value = true
})
const showAtPicker = ref(false)
const addMemberSearch = ref('')
const addSelectedIds = ref<Set<string>>(new Set())
const allContacts = ref<any[]>([])
let contactsLoaded = false
const cleanupDays = ref(180)

const ROBOT_AGENTS = [
  { id: 'captain', name: 'Captain 总指挥', position: '统一调度' },
  { id: 'secretary', name: '秘书', position: '广告部门秘书' },
  { id: 'copywriter', name: '文案Agent', position: '爆款文案' },
  { id: 'poster', name: '海报Agent', position: '视觉设计' },
  { id: 'video', name: '视频Agent', position: '短视频' },
  { id: 'brand', name: '品牌Agent', position: '品牌策略' },
  { id: 'trend', name: '趋势Agent', position: '热点追踪' },
  { id: 'publisher', name: '发布Agent', position: '多平台发布' },
  { id: 'designer', name: '平面设计师', position: '海报·Banner' },
  { id: 'marketing', name: '营销顾问', position: '营销战略' },
]

async function loadAllContacts() {
  if (contactsLoaded) return
  try {
    const [{ getAdminList }] = await Promise.all([import('@/api/setting')])
    const [adminRes, groupsRes] = await Promise.all([
      getAdminList({ list_rows: 500 }),
      http.get('/chat/groups', { params: { list_rows: 200 }, silent: true }),
    ])
    // 员工
    const rows = adminRes?.data?.rows ?? adminRes?.rows ?? []
    const humans = rows.map((r: any) => ({
      id: String(r.id),
      name: r.name || r.admin_name || '未知用户',
      position: r.dept_name || r.role_name || '',
    }))
    // 已有群聊
    const groups = (groupsRes?.data?.rows ?? groupsRes?.rows ?? []).map((g: any) => ({
      id: `group_${g.id}`,
      name: g.name || '群聊',
      position: '群聊',
    }))
    // 合并：机器人 + 群聊 + 员工
    allContacts.value = [...ROBOT_AGENTS, ...groups, ...humans]
    contactsLoaded = true
  } catch {
    allContacts.value = [...ROBOT_AGENTS]
  }
}
}
const cleaning = ref(false)
const aiMode = ref(false)
const pinEnabled = ref(false)
const showEditName = ref(false)

const msgListRef = ref<HTMLElement>()
const bottomRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()

let pollTimer: ReturnType<typeof setInterval> | null = null
let lastMessageId = 0

// 头像颜色
function getAvatarColor(id: string | number) {
  const colors = ['#576b95', '#07c160', '#10aeff', '#fa5151', '#ff8f3f', '#ffc300']
  const idx = String(id).split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return colors[idx % colors.length]
}

const addableMembers = computed(() => {
  const existingIds = new Set(members.value.map((m: any) => m.id))
  const all = allContacts.value
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
    ['ai-assistant-fixed', 'captain', 'copywriter', 'poster', 'video', 'brand', 'trend', 'publisher', 'designer', 'marketing'].includes(String(m.id))
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
    // 替换本地消息（用 id 去重，避免轮询重复）
    const idx = messages.value.findIndex(m => m.id === localMsg.id)
    if (idx !== -1) {
      messages.value.splice(idx, 1, sent)
    } else {
      // 本地消息已被轮询替换，检查是否已有服务器消息
      const exists = messages.value.some((m: any) => String(m.id) === String(sent.id))
      if (!exists) messages.value.push(sent)
    }
    lastMessageId = Math.max(lastMessageId, sent.id)

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

function toggleAddSelect(m: any) {
  const s = new Set(addSelectedIds.value)
  if (s.has(m.id)) s.delete(m.id)
  else s.add(m.id)
  addSelectedIds.value = s
}

function cancelAddMember() {
  showAddMember.value = false
  addSelectedIds.value = new Set()
  addMemberSearch.value = ''
}

// 打开选择器时加载通讯录
watch(showAddMember, (v) => { if (v) loadAllContacts() })

function startRename() {
  renameText.value = group.value?.name || ''
  renamingGroup.value = true
}
async function confirmRename() {
  const name = renameText.value.trim()
  if (!name || name === group.value?.name) { renamingGroup.value = false; return }
  try {
    await http.put(`/chat/groups/${groupId.value}`, { name })
    group.value = { ...group.value, name }
    renamingGroup.value = false
    ElMessage.success('群名已修改')
  } catch { ElMessage.error('修改失败') }
}

async function confirmAddMembers() {
  if (!addSelectedIds.value.size) return
  const ids = [...addSelectedIds.value]
  try {
    for (const uid of ids) {
      await http.post(`/chat/groups/${groupId.value}/members`, { user_id: uid })
    }
    // 刷新成员列表
    const { data: refreshed } = await http.get(`/chat/groups/${groupId.value}`)
    if (refreshed?.members) members.value = refreshed.members
    ElMessage.success(`已添加 ${ids.length} 人`)
    showAddMember.value = false
    addSelectedIds.value = new Set()
    addMemberSearch.value = ''
  } catch {
    ElMessage.error('添加失败')
  }
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

function openMemberAction(m: any) {
  memberActionTarget.value = m
  showMemberAction.value = true
}

// 不能移除自己
const canRemoveMember = computed(() => {
  if (!memberActionTarget.value) return false
  return String(memberActionTarget.value.id) !== String(authStore.userInfo?.id)
})

async function chatWithMember() {
  const target = memberActionTarget.value
  showMemberAction.value = false
  if (!target) return
  try {
    const res = await http.get(`/chat/groups/private/${target.id}`)
    const g = res?.data ?? res
    if (g?.id) {
      router.push(`/mobile/chat/${g.id}`)
    }
  } catch {
    ElMessage.error('打开私聊失败')
  }
}

async function removeMember() {
  const target = memberActionTarget.value
  if (!target) return
  try {
    await ElMessageBox.confirm(`确定将「${target.name}」移出群聊？`, '移出成员', { type: 'warning' })
    await http.delete(`/chat/groups/${groupId.value}/members/${target.id}`)
    members.value = members.value.filter((m: any) => String(m.id) !== String(target.id))
    showMemberAction.value = false
    ElMessage.success(`已移出 ${target.name}`)
  } catch { /* 取消 */ }
}

async function togglePin() {
  const newVal = !pinEnabled.value
  try {
    await http.post(`/chat/groups/${groupId.value}/pin`, { pinned: newVal })
    pinEnabled.value = newVal
    if (group.value) group.value.is_pinned = newVal
    ElMessage.success(newVal ? '已置顶' : '已取消置顶')
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
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
    if (groupRes.status === 'fulfilled') {
      group.value = groupRes.value?.data ?? groupRes.value
      pinEnabled.value = !!group.value?.is_pinned
    }
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
      // 去重：只添加本地不存在的消息
      const existingIds = new Set(messages.value.map((m: any) => String(m.id)))
      const newMsgs = rows.filter((m: any) => !existingIds.has(String(m.id)))
      if (newMsgs.length > 0) {
        messages.value.push(...newMsgs)
        lastMessageId = Math.max(lastMessageId, ...newMsgs.map((m: any) => m.id))
        await scrollToBottom()
      }
    } catch { /* 忽略 */ }
  }, 5000)
})

onUnmounted(() => {
  hideTabbar.value = false
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
  overflow-x: hidden;
  padding: 12px 12px;
  -webkit-overflow-scrolling: touch;
  /* 关键：允许 flex 子元素收缩到内容以下 */
  min-height: 0;
  /* 键盘弹出时安全适配 */
  overscroll-behavior: contain;
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
  top: 0;
  left: 0;
  right: 0;
  height: 100dvh;
  background: rgba(0,0,0,0.5);
  z-index: 1002;
  display: flex;
  align-items: flex-end;
}
.m-modal-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: calc(100dvh - 40px);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
  box-sizing: border-box;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}
.m-modal-sheet-tall { max-height: 100dvh; }
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

/* 微信风格群设置 */
.m-gs-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; }
.m-gs-sheet {
  position: fixed; top: 0; right: 0; bottom: 0; width: 90%; max-width: 400px;
  background: #111; border-radius: 0;
  display: flex; flex-direction: column; animation: slideRight 0.25s ease;
  z-index: 1001; padding-top: env(safe-area-inset-top);
}
.m-gs-header {
  display: flex; align-items: center; justify-content: center; height: 52px;
  position: relative; font-size: 17px; font-weight: 400; color: #fff;
}
.m-gs-back {
  position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
  color: #fff; cursor: pointer; display: flex; align-items: center;
}
.m-gs-body { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: env(safe-area-inset-bottom); }

/* 顶部：群头像 + 群名 */
.m-gs-top {
  display: flex; align-items: center; gap: 14px; padding: 16px 20px;
  border-bottom: 1px solid #2a2a2a;
}
.m-gs-top-avatar {
  width: 56px; height: 56px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #576b95, #3a4a6b);
}
.m-gs-add-btn-large {
  width: 36px; height: 36px; border: 1.5px dashed #555; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
}
.m-gs-top-name { font-size: 18px; color: #fff; }
.m-gs-top-info { display: flex; flex-direction: column; gap: 2px; }
.m-gs-top-sub { font-size: 13px; color: #999; }

/* 成员横向滚动列表 */
.m-gs-members-scroll {
  display: flex; gap: 14px; padding: 12px 20px; overflow-x: auto;
  -webkit-overflow-scrolling: touch; scrollbar-width: none;
}
.m-gs-members-scroll::-webkit-scrollbar { display: none; }
.m-gs-member-inline { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
.m-gs-avatar-sm {
  width: 40px; height: 40px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 15px; font-weight: 600;
}
.m-gs-member-inline-name { font-size: 11px; color: #999; max-width: 50px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }

/* 分组容器 */
.m-gs-section { margin: 8px 12px; border-radius: 8px; overflow: hidden; }

/* 设置行 */
.m-gs-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 16px; background: #1c1c1e; margin-bottom: 1px;
  font-size: 15px; color: #fff;
}
.m-gs-section .m-gs-row:first-child { border-radius: 8px 8px 0 0; }
.m-gs-section .m-gs-row:last-child { border-radius: 0 0 8px 8px; margin-bottom: 0; }
.m-gs-section .m-gs-row:only-child { border-radius: 8px; }
.m-gs-row-label { color: #fff; }
.m-gs-row.danger { color: #fa5151; justify-content: center; }

/* 快捷图标行 */
.m-gs-icons {
  display: flex; align-items: center; justify-content: space-around;
  padding: 10px 4px; background: #1c1c1e;
}
.m-gs-icon-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.m-gs-icon-item span { font-size: 11px; color: #888; }

/* 开关 */
.m-gs-switch {
  width: 51px; height: 31px; border-radius: 16px; background: #3a3a3c;
  position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0;
}
.m-gs-switch.active { background: #07c160; }
.m-gs-switch-dot {
  width: 27px; height: 27px; border-radius: 50%; background: #fff;
  position: absolute; top: 2px; left: 2px; transition: left 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.m-gs-switch.active .m-gs-switch-dot { left: 22px; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

/* 旧的添加成员弹窗样式保留 */
/* 微信风格选择联系人 */
.m-pick-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: #fff;
  display: flex; flex-direction: column;
}
.m-pick-topbar {
  height: 52px; display: flex; align-items: center; justify-content: center;
  position: relative; flex-shrink: 0;
  padding-top: env(safe-area-inset-top, 0px);
  border-bottom: 1px solid #f0f0f0;
}
.m-pick-close {
  position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
  background: none; border: none; font-size: 18px; color: #4e5969; cursor: pointer;
  padding-top: env(safe-area-inset-top, 0px);
}
.m-pick-title { font-size: 17px; font-weight: 600; color: #1d2129; }
.m-pick-count { font-size: 14px; color: #86909c; margin-left: 4px; }
.m-pick-search-bar {
  padding: 8px 16px; flex-shrink: 0;
}
.m-pick-search-input {
  width: 100%; height: 36px; background: #f5f5f7;
  border: none; border-radius: 8px; padding: 0 12px;
  font-size: 15px; color: #1d2129; outline: none;
  box-sizing: border-box;
}
.m-pick-body {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 0 16px;
}
.m-pick-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; cursor: pointer;
  border-bottom: 1px solid #f5f5f7;
  -webkit-tap-highlight-color: transparent;
}
.m-pick-row:active { background: #f5f5f7; }
.m-pick-check {
  width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid #c9cdd4; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.m-pick-check.checked { border-color: #07c160; }
.m-pick-avatar2 {
  width: 40px; height: 40px; background: #0071e3;
  border-radius: 6px; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px; font-weight: 600; flex-shrink: 0;
}
.m-pick-info2 { flex: 1; }
.m-pick-name2 { font-size: 16px; color: #1d2129; }
.m-pick-sub2 { font-size: 12px; color: #86909c; margin-top: 2px; }
.m-pick-empty { text-align: center; color: #86909c; padding: 40px 0; font-size: 14px; }
.m-pick-footer {
  padding: 12px 16px; padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  flex-shrink: 0; border-top: 1px solid #f0f0f0;
}
.m-pick-done {
  width: 100%; height: 48px; background: #07c160; border: none;
  border-radius: 8px; font-size: 17px; font-weight: 600;
  color: #fff; cursor: pointer;
}
.m-pick-done:disabled { background: #a8e6c1; cursor: not-allowed; }
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
.m-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color .2s;
}
.m-input:focus { border-color: #3370ff; }
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

/* 成员操作菜单 */
.m-modal-sheet.m-gs-member-sheet {
  z-index: 2000 !important;
  padding-bottom: env(safe-area-inset-bottom);
}
.m-modal-mask.m-gs-member-mask { z-index: 1002; }
.m-gs-member-action-info { text-align: center; padding: 16px 0 12px; }
.m-gs-avatar-lg { width: 56px; height: 56px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 600; }
.m-gs-member-action-name { font-size: 16px; font-weight: 600; color: #1d2129; margin-top: 8px; }
.m-gs-member-action-pos { font-size: 13px; color: #86909c; margin-top: 2px; }
.m-gs-member-action-list { padding: 0 16px; }
.m-gs-member-action-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f2f3f5; cursor: pointer; font-size: 15px; color: #1d2129; }
.m-gs-member-action-row:last-child { border-bottom: none; }
.m-gs-member-action-row.danger { color: #f53f3f; }
.m-gs-member-action-row.danger svg { stroke: #f53f3f; }
.m-modal-sheet-sm { max-height: 320px; }
.m-member-inline { cursor: pointer; }
</style>
