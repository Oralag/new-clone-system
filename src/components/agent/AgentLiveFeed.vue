<template>
  <div class="live-feed">
    <div class="lf-hd">
      <span class="lf-dot"></span>
      <span class="lf-title">实时动态</span>
    </div>
    <div class="lf-list" ref="listEl">
      <TransitionGroup name="feed">
        <div v-for="item in displayItems" :key="item.id" class="lf-item">
          <span class="lf-emoji">{{ item.emoji }}</span>
          <div class="lf-body">
            <span class="lf-text">{{ item.text }}</span>
            <span class="lf-time">{{ item.time }}</span>
          </div>
        </div>
      </TransitionGroup>
      <div v-if="displayItems.length === 0" class="lf-empty">等待团队动态…</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMeetingStore } from '@/stores/meeting'
import { useTrendingStore } from '@/stores/agent'

const meetingStore = useMeetingStore()
const agentStore   = useTrendingStore()

// 从 store 派生真实动态
const storeItems = computed(() => {
  const items: { id: string; emoji: string; text: string; time: string; ts: number }[] = []

  // 会议室消息
  for (const m of meetingStore.messages.slice(-6)) {
    if (!m.content || m.isStreaming) continue
    const short = m.content.replace(/\s+/g, ' ').slice(0, 28)
    items.push({
      id:    'm_' + m.id,
      emoji: m.agentEmoji || '💬',
      text:  `${m.agentName}：${short}${m.content.length > 28 ? '…' : ''}`,
      time:  fmtTs(m.timestamp),
      ts:    m.timestamp,
    })
  }

  // 发布产出
  for (const r of agentStore.flowResults.slice(-4)) {
    const typeMap: Record<string, string> = { copy: '✍️', poster: '🖼️', video: '🎬', summary: '📋', video_script: '🎬', image_text: '🖼️' }
    const emoji = typeMap[r.type] || '📄'
    items.push({
      id:    'r_' + (r.id || Math.random()),
      emoji,
      text:  `${emoji} ${r.title?.slice(0, 20) || r.type} 已生成`,
      time:  '刚刚',
      ts:    1,
    })
  }

  return items.sort((a, b) => b.ts - a.ts).slice(0, 8)
})

// 静态占位（store 为空时显示）
const placeholders = [
  { id: 'p1', emoji: '🎯', text: 'Captain 等待新议题', time: '待命中', ts: 0 },
  { id: 'p2', emoji: '📈', text: 'Rex 已就绪，等待抓取热搜', time: '待命中', ts: 0 },
  { id: 'p3', emoji: '✍️', text: 'Maya 等待文案任务', time: '待命中', ts: 0 },
]

const displayItems = computed(() =>
  storeItems.value.length > 0 ? storeItems.value : placeholders
)

function fmtTs(ts: number) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const listEl = ref<HTMLElement>()
</script>

<style scoped>
.live-feed {
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 160px;
}

.lf-hd {
  display: flex;
  align-items: center;
  gap: 7px;
}
.lf-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #0071e3;
  animation: lfpulse 1.8s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes lfpulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(0,113,227,0.15); }
  50%      { box-shadow: 0 0 0 5px rgba(0,113,227,0.04); }
}
.lf-title {
  font-size: 11px; font-weight: 700;
  color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.06em;
}

.lf-list { display: flex; flex-direction: column; gap: 6px; }
.lf-empty { font-size: 12px; color: #CCCCCC; font-style: italic; padding: 8px 0; }

.lf-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 10px;
  background: #F8F8F6;
  border-radius: 8px;
  transition: background 0.15s;
}
.lf-item:hover { background: #F0F0EE; }

.lf-emoji { font-size: 14px; flex-shrink: 0; line-height: 1.4; }
.lf-body {
  flex: 1; min-width: 0;
  display: flex; align-items: baseline; justify-content: space-between; gap: 6px;
}
.lf-text {
  font-size: 12px; color: #444444;
  line-height: 1.4; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
  flex: 1; min-width: 0;
}
.lf-time {
  font-size: 10px; color: #CCCCCC;
  flex-shrink: 0;
}

/* TransitionGroup 动画 */
.feed-enter-active { animation: feedIn 0.25s ease both; }
.feed-leave-active { animation: feedIn 0.15s ease reverse both; position: absolute; }
@keyframes feedIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
