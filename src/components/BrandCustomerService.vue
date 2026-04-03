<template>
  <div class="brand-cs" :class="{ open: isOpen }">
    <!-- 浮动按钮 -->
    <button class="brand-cs-trigger" @click="toggleOpen" :class="{ pulse: !isOpen && hasUnread }" title="客服">
      <transition name="cs-icon" mode="out-in">
        <svg v-if="!isOpen" key="chat" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <svg v-else key="close" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </transition>
      <span v-if="!isOpen && hasUnread" class="brand-cs-badge"></span>
    </button>

    <!-- 聊天窗口 -->
    <transition name="cs-window">
      <div v-if="isOpen" class="brand-cs-window">
        <!-- 头部 -->
        <div class="cs-header">
          <div class="cs-header-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div class="cs-header-info">
            <p class="cs-header-name">Nova · 客服助手</p>
            <p class="cs-header-status">
              <span class="cs-status-dot"></span>
              在线 · 即时回复
            </p>
          </div>
          <button class="cs-close-btn" @click="isOpen = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- 消息区 -->
        <div class="cs-messages" ref="messagesRef">
          <div v-for="(msg, i) in messages" :key="i" class="cs-msg" :class="msg.role">
            <div v-if="msg.role === 'assistant'" class="cs-msg-avatar">N</div>
            <div class="cs-msg-bubble">
              <span v-html="renderMarkdown(msg.content)"></span>
            </div>
          </div>
          <div v-if="thinking" class="cs-msg assistant">
            <div class="cs-msg-avatar">N</div>
            <div class="cs-msg-bubble cs-thinking">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- 快捷问题 -->
        <div v-if="messages.length <= 1" class="cs-quick-btns">
          <button v-for="q in quickQuestions" :key="q" class="cs-quick-btn" @click="sendQuick(q)">{{ q }}</button>
        </div>

        <!-- 输入区 -->
        <div class="cs-input-area">
          <input
            v-model="inputText"
            class="cs-input"
            placeholder="请输入您的问题..."
            @keyup.enter="sendMessage"
            :disabled="thinking"
          />
          <button class="cs-send-btn" @click="sendMessage" :disabled="!inputText.trim() || thinking">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { useBrandEditStore } from '@/stores/brandEdit'

const brandEdit = useBrandEditStore()
const isOpen = ref(false)
const hasUnread = ref(true)
const thinking = ref(false)
const inputText = ref('')
const messagesRef = ref<HTMLElement>()

interface Message { role: 'user' | 'assistant'; content: string }
const messages = ref<Message[]>([
  { role: 'assistant', content: '你好！我是 Nova，NOMADIC DAIRY 的专属客服 👋\n\n有什么我可以帮你的吗？无论是产品咨询、采购合作还是订单问题，都可以直接问我。' }
])

const quickQuestions = [
  '批发采购怎么申请？',
  '物流配送多久？',
  '如何查询我的订单？',
  'How to place a wholesale order?',
]

function toggleOpen() {
  isOpen.value = !isOpen.value
  if (isOpen.value) hasUnread.value = false
}

function buildBrandContext() {
  const cfg = brandEdit.config
  return `品牌名：${cfg.brandName}
品牌口号：${cfg.brandSlogan}
覆盖国家：${cfg.stats.find(s => s.label.includes('国家'))?.num || '120+'}
活跃用户：${cfg.stats.find(s => s.label.includes('用户'))?.num || '50,000+'}
用户评分：${cfg.totalRating}/5（${cfg.totalReviews}条评价，推荐率${cfg.recommendRate}%）
物流服务：${cfg.carriers.map(c => `${c.name}(${c.time})`).join('、')}
退换货政策：${cfg.policies.map(p => p.title).join('、')}
支持渠道：${cfg.channels.map(c => `${c.title}(${c.tag})`).join('、')}`
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || thinking.value) return
  inputText.value = ''
  messages.value.push({ role: 'user', content: text })
  await scrollToBottom()
  thinking.value = true

  try {
    const apiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE || '')
    const res = await fetch(`${apiBase}/api/brand-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.value,
        brandContext: buildBrandContext(),
      }),
    })

    if (!res.ok || !res.body) {
      messages.value.push({ role: 'assistant', content: '抱歉，暂时无法连接，请稍后再试。' })
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let reply = ''
    messages.value.push({ role: 'assistant', content: '' })
    const lastIdx = messages.value.length - 1

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') break
        try {
          const evt = JSON.parse(data)
          if (evt.type === 'text' && evt.text) {
            reply += evt.text
            messages.value[lastIdx].content = reply
            await scrollToBottom()
          }
        } catch { /* ignore */ }
      }
    }
    if (!reply) messages.value[lastIdx].content = '抱歉，暂时无法回复，请联系人工客服。'
  } catch {
    messages.value.push({ role: 'assistant', content: '网络异常，请稍后再试。' })
  } finally {
    thinking.value = false
    await scrollToBottom()
  }
}

async function sendQuick(q: string) {
  inputText.value = q
  await sendMessage()
}

async function scrollToBottom() {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.brand-cs {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 8888;
}

/* 触发按钮 */
.brand-cs-trigger {
  width: 52px; height: 52px; border-radius: 50%;
  background: #1d1d1f; color: #fff;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  transition: background 0.2s, transform 0.2s;
  position: relative;
}
.brand-cs-trigger:hover { background: #7c3aed; transform: scale(1.05); }
.brand-cs.open .brand-cs-trigger { background: #7c3aed; }
.brand-cs-badge {
  position: absolute; top: 2px; right: 2px;
  width: 12px; height: 12px; background: #ef4444; border-radius: 50%;
  border: 2px solid #fff;
}
.brand-cs-trigger.pulse .brand-cs-badge {
  animation: badge-pulse 2s infinite;
}
@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

/* 聊天窗口 */
.brand-cs-window {
  position: absolute; bottom: 64px; right: 0;
  width: 340px; height: 480px;
  background: #fff; border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; overflow: hidden;
}

/* 头部 */
.cs-header {
  background: linear-gradient(135deg, #1d1d1f, #3d3d3f);
  padding: 16px 16px 14px;
  display: flex; align-items: center; gap: 10px;
}
.cs-header-avatar {
  width: 36px; height: 36px; border-radius: 10px;
  background: #7c3aed; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cs-header-info { flex: 1; }
.cs-header-name { font-size: 13px; font-weight: 700; color: #fff; }
.cs-header-status { font-size: 10px; color: rgba(255,255,255,0.55); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.cs-status-dot { width: 6px; height: 6px; background: #34c759; border-radius: 50%; }
.cs-close-btn { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.5); display: flex; align-items: center; }
.cs-close-btn:hover { color: #fff; }

/* 消息区 */
.cs-messages {
  flex: 1; overflow-y: auto; padding: 16px 14px;
  display: flex; flex-direction: column; gap: 12px;
}
.cs-msg { display: flex; gap: 8px; align-items: flex-end; }
.cs-msg.user { flex-direction: row-reverse; }
.cs-msg-avatar {
  width: 28px; height: 28px; border-radius: 8px;
  background: #7c3aed; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.cs-msg-bubble {
  max-width: 230px; padding: 10px 12px;
  border-radius: 14px; font-size: 13px; line-height: 1.5;
}
.cs-msg.assistant .cs-msg-bubble {
  background: #f5f5f7; color: #1d1d1f;
  border-bottom-left-radius: 4px;
}
.cs-msg.user .cs-msg-bubble {
  background: #1d1d1f; color: #fff;
  border-bottom-right-radius: 4px;
}

/* 打字动画 */
.cs-thinking { display: flex; gap: 4px; align-items: center; padding: 12px 14px; }
.cs-thinking span {
  width: 6px; height: 6px; background: rgba(29,29,31,0.3); border-radius: 50%;
  animation: typing-dot 1.4s ease-in-out infinite;
}
.cs-thinking span:nth-child(2) { animation-delay: 0.2s; }
.cs-thinking span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* 快捷问题 */
.cs-quick-btns { padding: 0 12px 10px; display: flex; flex-wrap: wrap; gap: 6px; }
.cs-quick-btn {
  font-size: 11px; font-weight: 600; padding: 5px 10px;
  border-radius: 999px; border: 1.5px solid rgba(124,58,237,0.2);
  background: #fff; color: #7c3aed; cursor: pointer;
  transition: all 0.2s; white-space: nowrap;
}
.cs-quick-btn:hover { background: rgba(124,58,237,0.08); border-color: #7c3aed; }

/* 输入区 */
.cs-input-area {
  padding: 12px; border-top: 1px solid rgba(0,0,0,0.06);
  display: flex; gap: 8px;
}
.cs-input {
  flex: 1; padding: 9px 12px;
  border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px;
  font-size: 13px; outline: none; font-family: inherit;
  transition: border-color 0.2s;
}
.cs-input:focus { border-color: #7c3aed; }
.cs-input:disabled { background: #f5f5f7; }
.cs-send-btn {
  width: 36px; height: 36px; border-radius: 10px;
  background: #1d1d1f; color: #fff;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}
.cs-send-btn:hover:not(:disabled) { background: #7c3aed; }
.cs-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* 动画 */
.cs-window-enter-active, .cs-window-leave-active { transition: all 0.3s cubic-bezier(0.23,1,0.32,1); }
.cs-window-enter-from, .cs-window-leave-to { opacity: 0; transform: translateY(16px) scale(0.95); transform-origin: bottom right; }

.cs-icon-enter-active, .cs-icon-leave-active { transition: all 0.2s; }
.cs-icon-enter-from, .cs-icon-leave-to { opacity: 0; transform: rotate(90deg) scale(0.5); }

@media (max-width: 480px) {
  .brand-cs { bottom: 16px; right: 16px; }
  .brand-cs-window { width: calc(100vw - 32px); right: 0; }
}
</style>
