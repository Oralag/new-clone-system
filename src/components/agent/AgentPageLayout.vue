<template>
  <div class="ap-layout">
    <!-- 左侧面板 -->
    <aside class="ap-sidebar">
      <!-- Agent 身份卡 -->
      <div class="ap-id-card" :style="{ '--ac': agentColor }">
        <div class="ap-avatar">{{ agentEmoji }}</div>
        <div class="ap-name">{{ agentName }}</div>
        <div class="ap-specialty">{{ agentSpecialty }}</div>
        <div class="ap-live" :class="{ active: streaming }">
          <span class="ap-live-dot"></span>
          <span>{{ streaming ? '正在响应' : 'AI 就绪' }}</span>
        </div>
      </div>

      <!-- 快捷提示 -->
      <div v-if="quickPrompts?.length" class="ap-section">
        <div class="ap-section-label">快速开始</div>
        <div class="ap-prompts">
          <button
            v-for="p in quickPrompts"
            :key="p"
            class="ap-prompt-btn"
            @click="$emit('quick-prompt', p)"
          >{{ p }}</button>
        </div>
      </div>

      <!-- 历史记录 -->
      <div class="ap-section ap-history-section">
        <div class="ap-section-label">
          <span>历史记录</span>
          <button v-if="history.length > 0" class="ap-clear-btn" @click="clearHistory" title="清空历史">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
        <div v-if="loadingHistory" class="ap-history-empty">加载中…</div>
        <div v-else-if="history.length === 0" class="ap-history-empty">暂无历史记录</div>
        <div v-else class="ap-history-list">
          <div
            v-for="(msg, i) in history"
            :key="i"
            class="ap-history-item"
            @click="$emit('restore', msg)"
            :title="msg.content"
          >
            <span class="ap-history-role">{{ msg.role === 'user' ? '你' : agentEmoji }}</span>
            <span class="ap-history-text">{{ msg.content }}</span>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="ap-sidebar-footer">
        <router-link to="/agent/history" class="ap-footer-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 7A4.5 4.5 0 117 11.5"/><path d="M2.5 3.5v3h3"/><path d="M7 4.3v2.9l2 1.2"/></svg>
          全部历史
        </router-link>
      </div>
    </aside>

    <!-- 右侧主体 -->
    <div class="ap-main">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  agentId: string
  agentName: string
  agentEmoji: string
  agentSpecialty: string
  agentColor: string
  quickPrompts?: string[]
  streaming?: boolean
}>()

const emit = defineEmits<{
  (e: 'quick-prompt', p: string): void
  (e: 'restore', msg: any): void
}>()

interface HistoryMsg { role: string; content: string }
const history = ref<HistoryMsg[]>([])
const loadingHistory = ref(false)

async function loadHistory() {
  const token = localStorage.getItem('erp_token') || ''
  if (!token) return
  loadingHistory.value = true
  try {
    const res = await fetch(`/api/agent-chat?agentId=${props.agentId}`, {
      headers: { 'x-erp-token': token },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) history.value = data.slice(-20)
    }
  } catch {} finally {
    loadingHistory.value = false
  }
}

async function clearHistory() {
  const token = localStorage.getItem('erp_token') || ''
  try {
    await fetch(`/api/agent-chat?agentId=${props.agentId}`, {
      method: 'DELETE',
      headers: { 'x-erp-token': token },
    })
    history.value = []
  } catch {}
}

onMounted(loadHistory)
defineExpose({ loadHistory })
</script>

<style scoped>
.ap-layout {
  display: flex;
  gap: 20px;
  height: calc(100vh - 110px);
  min-height: 500px;
}

/* ── Sidebar ── */
.ap-sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 18px;
  overflow: hidden;
}

/* Identity card */
.ap-id-card {
  padding: 20px 18px 16px;
  background: color-mix(in srgb, var(--ac, #6366f1) 6%, white);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.ap-avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--ac, #6366f1) 14%, white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 6px;
  border: 1.5px solid color-mix(in srgb, var(--ac, #6366f1) 22%, white);
}

.ap-name {
  font-size: 13px;
  font-weight: 700;
  color: #1d1d1f;
  text-align: center;
}

.ap-specialty {
  font-size: 11px;
  color: rgba(29,29,31,0.4);
  text-align: center;
  line-height: 1.4;
}

.ap-live {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
  color: rgba(29,29,31,0.3);
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(0,0,0,0.04);
}
.ap-live.active { color: #16a34a; background: rgba(22,163,74,0.08); }
.ap-live-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.ap-live.active .ap-live-dot { animation: blink 1.2s ease-in-out infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* Sections */
.ap-section {
  padding: 14px 14px 0;
  flex-shrink: 0;
}
.ap-history-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-bottom: 0;
  overflow: hidden;
}

.ap-section-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(29,29,31,0.28);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Quick prompts */
.ap-prompts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.ap-prompt-btn {
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.07);
  background: #f9f9fb;
  color: rgba(29,29,31,0.65);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.4;
}
.ap-prompt-btn:hover {
  background: color-mix(in srgb, var(--ac, #6366f1) 8%, white);
  border-color: color-mix(in srgb, var(--ac, #6366f1) 25%, white);
  color: color-mix(in srgb, var(--ac, #6366f1) 90%, #1d1d1f);
}

/* History */
.ap-history-empty {
  font-size: 12px;
  color: rgba(29,29,31,0.25);
  text-align: center;
  padding: 16px 0;
  font-style: italic;
}

.ap-history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 10px;
}
.ap-history-list::-webkit-scrollbar { width: 3px; }
.ap-history-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }

.ap-history-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;
}
.ap-history-item:hover { background: #f5f5f7; }

.ap-history-role {
  font-size: 11px;
  font-weight: 700;
  color: rgba(29,29,31,0.3);
  flex-shrink: 0;
  min-width: 16px;
  padding-top: 1px;
}

.ap-history-text {
  font-size: 11.5px;
  color: rgba(29,29,31,0.55);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.ap-clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(29,29,31,0.2);
  padding: 2px;
  border-radius: 4px;
  display: flex;
  transition: color 0.15s;
}
.ap-clear-btn:hover { color: #dc2626; }

/* Footer */
.ap-sidebar-footer {
  padding: 10px 14px;
  border-top: 1px solid rgba(0,0,0,0.06);
  flex-shrink: 0;
}

.ap-footer-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(29,29,31,0.4);
  text-decoration: none;
  padding: 5px 6px;
  border-radius: 7px;
  transition: all 0.15s;
}
.ap-footer-link:hover { background: #f5f5f7; color: #1d1d1f; }

/* ── Main ── */
.ap-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Dark mode */
:global([data-theme='dark']) .ap-sidebar { background: #111827; border-color: #1f2937; }
:global([data-theme='dark']) .ap-id-card { background: rgba(99,102,241,0.08); border-bottom-color: #1f2937; }
:global([data-theme='dark']) .ap-name { color: #f8fafc; }
:global([data-theme='dark']) .ap-specialty { color: #64748b; }
:global([data-theme='dark']) .ap-prompt-btn { background: #1e293b; border-color: #334155; color: #94a3b8; }
:global([data-theme='dark']) .ap-history-item:hover { background: #1e293b; }
:global([data-theme='dark']) .ap-history-text { color: #94a3b8; }
:global([data-theme='dark']) .ap-section-label { color: #475569; }
:global([data-theme='dark']) .ap-footer-link { color: #64748b; }
:global([data-theme='dark']) .ap-footer-link:hover { background: #1e293b; color: #e2e8f0; }
:global([data-theme='dark']) .ap-sidebar-footer { border-top-color: #1f2937; }
:global([data-theme='dark']) .ap-prompts { border-bottom-color: #1f2937; }

@media (max-width: 768px) {
  .ap-layout { flex-direction: column; height: auto; }
  .ap-sidebar { width: 100%; border-radius: 14px; }
  .ap-history-section { max-height: 180px; }
}
</style>
