<template>
  <div class="adam-chat">
    <div class="adam-topbar">
      <button class="adam-back" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <div class="adam-title">{{ t('mobileAdamChat.title') }}</div>
      <div style="width:40px"></div>
    </div>

    <div ref="listRef" class="adam-messages">
      <div v-if="loading" class="adam-loading">{{ t('common.loading') }}</div>
      <div v-else-if="messages.length === 0" class="adam-empty">{{ t('common.noData') }}</div>
      <template v-else>
        <div v-for="msg in messages" :key="msg.id" class="adam-row" :class="{ own: msg.isOwn }">
          <div v-if="!msg.isOwn" class="adam-avatar">亚</div>
          <div class="adam-col">
            <div v-if="!msg.isOwn" class="adam-name">{{ t('mobileAdamChat.adamName') }}</div>
            <div class="adam-bubble" :class="{ own: msg.isOwn }" v-html="renderContent(msg.content)"></div>
            <div class="adam-time">{{ formatTime(msg.created_at) }}</div>
          </div>
        </div>
      </template>
      <div ref="bottomRef"></div>
    </div>

    <div class="adam-input-bar">
      <textarea
        v-model="inputText"
        class="adam-input"
        :placeholder="t('mobileAdamChat.placeholder')"
        rows="1"
        @keydown.enter.prevent="send"
      />
      <button class="adam-send" :disabled="!inputText.trim() || sending" @click="send">{{ t('common.submit') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const listRef = ref<HTMLElement | null>(null)
const bottomRef = ref<HTMLElement | null>(null)
const messages = ref<any[]>([])
const loading = ref(true)
const inputText = ref('')
const sending = ref(false)

function renderContent(content: string) {
  return (content || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return isToday ? `${h}:${m}` : `${d.getMonth()+1}/${d.getDate()} ${h}:${m}`
}

async function scrollToBottom() {
  await nextTick()
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
}

async function loadMessages() {
  loading.value = true
  try {
    const token = localStorage.getItem('erp_token') || ''
    const myId = String(authStore.userInfo?.id || authStore.userInfo?.admin_id || 'me')

    const [histRes, inboxRes] = await Promise.all([
      fetch('/api/adam/history', { headers: { 'x-erp-token': token } }),
      fetch('/api/adam/messages?peek=1', { headers: { 'x-erp-token': token } }),
    ])

    const all: any[] = []
    const seenIds = new Set<string>()

    if (histRes.ok) {
      const data = await histRes.json() as { messages?: any[] }
      ;(data.messages || []).forEach((m: any, i: number) => {
        const id = `h_${m.id || i}`
        if (seenIds.has(id)) return
        seenIds.add(id)
        const ts = m.timestamp || m.created_at || new Date(Date.now() - i * 1000).toISOString()
        all.push({ id, content: m.content, created_at: ts, isOwn: m.role === 'user' })
      })
    }

    if (inboxRes.ok) {
      const data = await inboxRes.json() as { messages?: any[] }
      ;(data.messages || []).forEach((m: any) => {
        const id = `i_${m.id}`
        if (seenIds.has(id)) return
        seenIds.add(id)
        all.push({ id, content: m.content, created_at: m.timestamp, isOwn: false })
      })
    }

    messages.value = all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // 标记 inbox 已读
    fetch('/api/adam/messages', { headers: { 'x-erp-token': token } }).catch(() => {})
    localStorage.setItem('adam_chat_last_read', String(Date.now()))
  } catch (e) {
    console.error('loadMessages error', e)
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

async function send() {
  const text = inputText.value.trim()
  if (!text || sending.value) return
  sending.value = true
  inputText.value = ''
  const token = localStorage.getItem('erp_token') || ''
  const myId = String(authStore.userInfo?.id || authStore.userInfo?.admin_id || 'me')
  const myName = authStore.userInfo?.name || authStore.userInfo?.account || t('mobileAdamChat.me')
  const ts = new Date().toISOString()

  // 本地先显示
  messages.value.push({ id: `local_${Date.now()}`, content: text, created_at: ts, isOwn: true })
  await scrollToBottom()

  try {
    // 保存到 history
    const existing = messages.value
      .filter(m => !m.id.startsWith('local_') || m.isOwn)
      .map(m => ({ role: m.isOwn ? 'user' : 'assistant', content: m.content, timestamp: m.created_at }))
    await fetch('/api/adam/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ messages: existing }),
    })
  } catch { /* 忽略 */ }
  sending.value = false
}

onMounted(loadMessages)
</script>

<style scoped>
.adam-chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: #f5f5f7;
}
.adam-topbar {
  height: 52px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  border-bottom: 1px solid #e5e6eb;
  flex-shrink: 0;
}
.adam-back {
  width: 40px; height: 40px;
  border: none; background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #4e5969;
}
.adam-title {
  font-size: 16px; font-weight: 600; color: #1d2129;
}
.adam-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.adam-loading, .adam-empty {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin: 40px 0;
}
.adam-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.adam-row.own {
  flex-direction: row-reverse;
}
.adam-avatar {
  width: 36px; height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7B61FF, #5B3FD8);
  color: #fff;
  font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.adam-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 72%;
}
.adam-name {
  font-size: 11px; color: #86909c;
  padding-left: 2px;
}
.adam-bubble {
  padding: 10px 13px;
  border-radius: 12px;
  background: #fff;
  font-size: 14px;
  line-height: 1.55;
  color: #1d2129;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
}
.adam-bubble.own {
  background: #165DFF;
  color: #fff;
}
.adam-time {
  font-size: 10px;
  color: #c9cdd4;
  padding: 0 2px;
}
.adam-row.own .adam-time {
  text-align: right;
}
.adam-input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px;
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  background: #fff;
  border-top: 1px solid #e5e6eb;
  flex-shrink: 0;
}
.adam-input {
  flex: 1;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  resize: none;
  outline: none;
  line-height: 1.4;
  max-height: 90px;
  overflow-y: auto;
}
.adam-send {
  padding: 8px 14px;
  background: #165DFF;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  height: 36px;
}
.adam-send:disabled {
  opacity: 0.4;
}
</style>
