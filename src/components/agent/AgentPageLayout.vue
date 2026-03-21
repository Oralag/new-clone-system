<template>
  <div class="ap-layout">
    <!-- 顶部专员身份条 -->
    <div class="ap-staff-bar" :style="{ '--ac': agentColor }">
      <!-- 专员头像 + 信息 -->
      <div class="ap-staff-identity">
        <div class="ap-staff-avatar">{{ agentEmoji }}</div>
        <div class="ap-staff-info">
          <div class="ap-staff-name">{{ agentName }}</div>
          <div class="ap-staff-role">{{ agentSpecialty }}</div>
        </div>
        <!-- 状态指示灯 -->
        <div class="ap-status-pill" :class="{ active: streaming }">
          <span class="ap-status-dot"></span>
          <span>{{ streaming ? '正在响应' : 'AI 就绪' }}</span>
        </div>
      </div>

      <!-- 快捷提示按钮 -->
      <div v-if="quickPrompts?.length" class="ap-quick-btns">
        <button
          v-for="p in quickPrompts"
          :key="p"
          class="ap-quick-btn"
          @click="$emit('quick-prompt', p)"
          :title="p"
        >{{ p }}</button>
      </div>

      <!-- 右侧操作 -->
      <div class="ap-staff-actions">
        <button
          v-if="history.length > 0"
          class="ap-clear-btn"
          @click="clearHistory"
          title="清空对话记忆"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
          <span>清空</span>
        </button>
        <router-link to="/agent/history" class="ap-history-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2.5 7A4.5 4.5 0 117 11.5"/>
            <path d="M2.5 3.5v3h3"/>
            <path d="M7 4.3v2.9l2 1.2"/>
          </svg>
          历史
        </router-link>
      </div>
    </div>

    <!-- 主内容区 -->
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

async function loadHistory() {
  const token = localStorage.getItem('erp_token') || ''
  if (!token) return
  try {
    const res = await fetch(`/api/agent-chat?agentId=${props.agentId}`, {
      headers: { 'x-erp-token': token },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) history.value = data.slice(-20)
    }
  } catch {}
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
  flex-direction: column;
  height: calc(100vh - 110px);
  min-height: 500px;
  gap: 0;
}

/* ── 顶部专员身份条 ── */
.ap-staff-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid var(--ac, #6366f1);
  border-radius: 12px;
  margin-bottom: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.ap-staff-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.ap-staff-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--ac, #6366f1) 12%, white);
  border: 1.5px solid color-mix(in srgb, var(--ac, #6366f1) 20%, white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.ap-staff-info { min-width: 0; }
.ap-staff-name {
  font-size: 13px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.01em;
}
.ap-staff-role {
  font-size: 10.5px;
  color: rgba(29,29,31,0.4);
  margin-top: 1px;
}

.ap-status-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 600;
  color: rgba(29,29,31,0.35);
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(0,0,0,0.04);
  white-space: nowrap;
}
.ap-status-pill.active {
  color: #16a34a;
  background: rgba(22,163,74,0.08);
}
.ap-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
.ap-status-pill.active .ap-status-dot {
  animation: blink 1.2s ease-in-out infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* 快捷提示按钮 */
.ap-quick-btns {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  flex-wrap: wrap;
  min-width: 0;
}

.ap-quick-btn {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.08);
  background: #f5f5f7;
  color: rgba(29,29,31,0.6);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  transition: all 0.15s;
  font-family: inherit;
}
.ap-quick-btn:hover {
  background: color-mix(in srgb, var(--ac, #6366f1) 8%, white);
  border-color: color-mix(in srgb, var(--ac, #6366f1) 30%, white);
  color: color-mix(in srgb, var(--ac, #6366f1) 90%, #1d1d1f);
}

/* 右侧操作 */
.ap-staff-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ap-clear-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.08);
  background: #f5f5f7;
  color: rgba(29,29,31,0.45);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.ap-clear-btn:hover { background: rgba(220,38,38,0.06); border-color: rgba(220,38,38,0.2); color: #dc2626; }

.ap-history-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.08);
  background: #f5f5f7;
  color: rgba(29,29,31,0.45);
  font-size: 11.5px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s;
}
.ap-history-link:hover { background: #ebebed; color: #1d1d1f; }

/* ── 主内容区 ── */
.ap-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 暗色模式 */
:global([data-theme='dark']) .ap-staff-bar { background: #111827; border-color: #1f2937; border-left-color: var(--ac, #6366f1); }
:global([data-theme='dark']) .ap-staff-name { color: #f8fafc; }
:global([data-theme='dark']) .ap-staff-role { color: #64748b; }
:global([data-theme='dark']) .ap-quick-btn { background: #1e293b; border-color: #334155; color: #94a3b8; }
:global([data-theme='dark']) .ap-clear-btn { background: #1e293b; border-color: #334155; color: #64748b; }
:global([data-theme='dark']) .ap-history-link { background: #1e293b; border-color: #334155; color: #64748b; }
:global([data-theme='dark']) .ap-history-link:hover { background: #273549; color: #e2e8f0; }

@media (max-width: 768px) {
  .ap-layout { height: auto; }
  .ap-staff-bar { padding: 10px 12px; gap: 10px; }
  .ap-quick-btns { display: none; }
  .ap-main { min-height: calc(100vh - 180px); }
}
</style>
