<template>
  <div class="history-page">

    <!-- Header -->
    <div class="page-header">
      <div class="page-title">对话历史</div>
      <button v-if="agents.some(a => a.messageCount > 0)" class="btn-clear-all" @click="clearAll">
        清空全部
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="state-loading">
      <div class="spin"></div>
      <span>加载中...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="agents.every(a => a.messageCount === 0)" class="state-empty">
      <div class="empty-icon">💬</div>
      <div class="empty-title">暂无对话历史</div>
      <div class="empty-sub">去和各个 Agent 聊聊吧</div>
    </div>

    <!-- Agent cards -->
    <div v-else class="agents-grid">
      <div
        v-for="agent in agents.filter(a => a.messageCount > 0)"
        :key="agent.agentId"
        class="agent-card"
        :class="{ active: activeAgentId === agent.agentId }"
        :style="{ '--c': agent.color }"
        @click="selectAgent(agent)"
      >
        <div class="card-avatar">{{ agent.emoji }}</div>
        <div class="card-info">
          <div class="card-name">{{ agent.name }}</div>
          <div class="card-preview">{{ agent.lastUserMessage || '暂无对话' }}</div>
        </div>
        <div class="card-meta">
          <div class="msg-count">{{ agent.messageCount }} 条</div>
          <button class="btn-clear-agent" @click.stop="clearAgent(agent.agentId)" title="清空此 Agent 记忆">×</button>
        </div>
      </div>
    </div>

    <!-- Conversation viewer -->
    <div v-if="activeAgent" class="conv-viewer">
      <div class="conv-header">
        <div class="conv-title">
          <span class="conv-emoji">{{ activeAgent.emoji }}</span>
          {{ activeAgent.name }} 的对话记录
        </div>
        <button class="conv-close" @click="activeAgentId = ''">×</button>
      </div>
      <div class="conv-messages" ref="convRef">
        <template v-for="(msg, idx) in activeAgent.messages" :key="idx">
          <div v-if="msg.role === 'user'" class="msg msg-user">
            <div class="bubble user-bubble">{{ msg.content }}</div>
          </div>
          <div v-else class="msg msg-assistant">
            <div class="msg-avatar">{{ activeAgent.emoji }}</div>
            <div class="bubble assistant-bubble" v-html="renderMd(msg.content)"></div>
          </div>
        </template>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { marked } from 'marked'

interface AgentSummary {
  agentId: string
  name: string
  emoji: string
  color: string
  messageCount: number
  lastUserMessage: string
  messages: Array<{ role: string; content: string }>
}

const loading = ref(true)
const agents = ref<AgentSummary[]>([])
const activeAgentId = ref('')
const convRef = ref<HTMLElement>()

const activeAgent = computed(() => agents.value.find(a => a.agentId === activeAgentId.value))

function renderMd(text: string) {
  if (!text) return ''
  return marked.parse(text) as string
}

function selectAgent(agent: AgentSummary) {
  activeAgentId.value = agent.agentId
  nextTick(() => {
    if (convRef.value) convRef.value.scrollTop = convRef.value.scrollHeight
  })
}

async function loadHistory() {
  loading.value = true
  const token = localStorage.getItem('erp_token') || ''
  try {
    const resp = await fetch('/api/agent-memory', {
      headers: { 'x-erp-token': token },
    })
    if (resp.ok) {
      agents.value = await resp.json()
    }
  } catch {}
  loading.value = false
}

async function clearAgent(agentId: string) {
  const token = localStorage.getItem('erp_token') || ''
  await fetch(`/api/agent-memory?agentId=${agentId}`, {
    method: 'DELETE',
    headers: { 'x-erp-token': token },
  })
  agents.value = agents.value.filter(a => a.agentId !== agentId)
  if (activeAgentId.value === agentId) activeAgentId.value = ''
}

async function clearAll() {
  const token = localStorage.getItem('erp_token') || ''
  await fetch('/api/agent-memory', {
    method: 'DELETE',
    headers: { 'x-erp-token': token },
  })
  agents.value = []
  activeAgentId.value = ''
}

onMounted(loadHistory)
</script>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.btn-clear-all {
  padding: 6px 14px;
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-clear-all:hover { background: #fee2e2; }

/* States */
.state-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #94a3b8;
  font-size: 14px;
  padding: 60px 0;
  justify-content: center;
}
.spin {
  width: 20px; height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.state-empty {
  text-align: center;
  padding: 80px 0;
  color: #94a3b8;
}
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-title { font-size: 16px; font-weight: 600; color: #475569; margin-bottom: 6px; }
.empty-sub { font-size: 13px; }

/* Agent cards */
.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.agent-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.agent-card:hover { border-color: var(--c); box-shadow: 0 2px 12px color-mix(in srgb, var(--c) 15%, transparent); }
.agent-card.active { border-color: var(--c); background: color-mix(in srgb, var(--c) 5%, white); }

.card-avatar {
  width: 42px; height: 42px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c) 12%, white);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.card-info { flex: 1; min-width: 0; }
.card-name { font-size: 14px; font-weight: 600; color: #1e293b; }
.card-preview {
  font-size: 12px; color: #94a3b8;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-top: 2px;
}
.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.msg-count {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c) 12%, white);
  color: var(--c);
  font-weight: 600;
}
.btn-clear-agent {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 2px;
  transition: color 0.15s;
}
.btn-clear-agent:hover { color: #ef4444; }

/* Conversation viewer */
.conv-viewer {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.conv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}
.conv-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}
.conv-emoji { font-size: 18px; }
.conv-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  transition: color 0.15s;
}
.conv-close:hover { color: #475569; }

.conv-messages {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.msg { display: flex; gap: 10px; align-items: flex-start; }
.msg-user { flex-direction: row-reverse; }
.msg-assistant { flex-direction: row; }

.msg-avatar {
  width: 30px; height: 30px;
  border-radius: 8px;
  background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  margin-top: 2px;
}

.bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  max-width: 80%;
}
.user-bubble {
  background: #6366f1;
  color: #fff;
  border-radius: 12px 4px 12px 12px;
  margin-left: auto;
}
.assistant-bubble {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  border-radius: 4px 12px 12px 12px;
}
.assistant-bubble :deep(p) { margin: 0 0 8px; }
.assistant-bubble :deep(p:last-child) { margin-bottom: 0; }
.assistant-bubble :deep(ul), .assistant-bubble :deep(ol) { margin: 6px 0; padding-left: 20px; }
.assistant-bubble :deep(li) { margin-bottom: 3px; }
.assistant-bubble :deep(strong) { font-weight: 700; }
.assistant-bubble :deep(code) { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }

@media (max-width: 600px) {
  .agents-grid { grid-template-columns: 1fr; }
}
</style>
