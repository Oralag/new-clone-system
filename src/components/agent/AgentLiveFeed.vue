<template>
  <div class="live-feed">
    <div class="lf-hd">
      <span class="lf-dot"></span>
      <span class="lf-title">实时动态</span>
      <span class="lf-live-badge" v-if="storeItems.length > 0">LIVE</span>
    </div>
    <div class="lf-list" ref="listEl">
      <TransitionGroup name="feed">
        <div v-for="item in displayItems" :key="item.id" class="lf-item" :class="item.type">
          <div class="lf-agent-dot" :style="{ background: item.color || '#6366f1' }"></div>
          <div class="lf-body">
            <div class="lf-top">
              <span class="lf-agent">{{ item.agent }}</span>
              <span class="lf-time">{{ item.time }}</span>
            </div>
            <span class="lf-text">{{ item.text }}</span>
            <span v-if="item.stage" class="lf-stage-tag" :style="{ background: item.color + '22', color: item.color }">{{ item.stage }}</span>
          </div>
        </div>
      </TransitionGroup>
      <div v-if="displayItems.length === 0" class="lf-empty">等待团队动态…</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMeetingStore } from '@/stores/meeting'
import { useTrendingStore } from '@/stores/agent'
import { usePipelineStore, PIPELINE_STAGES } from '@/stores/pipeline'

const meetingStore = useMeetingStore()
const agentStore   = useTrendingStore()
const pipelineStore = usePipelineStore()

const AGENT_MAP: Record<string, { name: string; color: string }> = {
  trend:      { name: 'Rex · 情报', color: '#06b6d4' },
  copywriter: { name: 'Maya · 内容', color: '#f59e0b' },
  poster:     { name: 'Leo · 创意', color: '#ec4899' },
  publisher:  { name: 'Nova · 发布', color: '#10b981' },
  captain:    { name: 'Captain', color: '#6366f1' },
}

const storeItems = computed(() => {
  const items: { id: string; agent: string; color: string; text: string; time: string; ts: number; type: string; stage?: string }[] = []

  // 会议室消息
  for (const m of meetingStore.messages.slice(-6)) {
    if (!m.content || m.isStreaming) continue
    const short = m.content.replace(/\s+/g, ' ').slice(0, 40)
    const agentInfo = AGENT_MAP[m.agentId || ''] || { name: m.agentName || '?', color: '#6366f1' }
    items.push({
      id: 'm_' + m.id,
      agent: agentInfo.name,
      color: agentInfo.color,
      text: short + (m.content.length > 40 ? '…' : ''),
      time: fmtTs(m.timestamp),
      ts: m.timestamp,
      type: 'meeting',
    })
  }

  // 流水线传递事件（从 pipeline store 的产出记录推断）
  for (const task of pipelineStore.tasks.slice(0, 5)) {
    for (const stage of PIPELINE_STAGES) {
      const output = task.stageOutputs[stage.id]
      if (!output) continue
      const stageIdx = PIPELINE_STAGES.findIndex(s => s.id === stage.id)
      const nextStage = PIPELINE_STAGES[stageIdx + 1]
      items.push({
        id: `p_${task.id}_${stage.id}`,
        agent: stage.emoji + ' ' + stage.label,
        color: stage.color,
        text: output.slice(0, 35) + (output.length > 35 ? '…' : ''),
        time: fmtTs(task.createdAt),
        ts: task.createdAt,
        type: 'handoff',
        stage: nextStage ? `→ ${nextStage.label}` : '已完成',
      })
    }
  }

  // 发布产出
  for (const r of agentStore.flowResults.slice(-3)) {
    const typeMap: Record<string, { emoji: string; color: string }> = {
      copy: { emoji: '✍️', color: '#f59e0b' },
      poster: { emoji: '🖼️', color: '#ec4899' },
      video: { emoji: '🎬', color: '#ef4444' },
      summary: { emoji: '📋', color: '#6366f1' },
    }
    const t = typeMap[r.type] || { emoji: '📄', color: '#999' }
    items.push({
      id: 'r_' + (r.id || Math.random()),
      agent: t.emoji + ' ' + (r.title?.slice(0, 12) || r.type),
      color: t.color,
      text: '已生成',
      time: '刚刚',
      ts: 1,
      type: 'output',
    })
  }

  return items.sort((a, b) => b.ts - a.ts).slice(0, 10)
})

const placeholders = [
  { id: 'p1', agent: '🎯 Captain', color: '#6366f1', text: '等待新议题', time: '待命中', ts: 0, type: 'idle' },
  { id: 'p2', agent: '📈 Rex', color: '#06b6d4', text: '已就绪，等待抓取热搜', time: '待命中', ts: 0, type: 'idle' },
  { id: 'p3', agent: '✍️ Maya', color: '#f59e0b', text: '等待文案任务', time: '待命中', ts: 0, type: 'idle' },
]

const displayItems = computed(() =>
  storeItems.value.length > 0 ? storeItems.value : placeholders
)

function fmtTs(ts: number) {
  if (!ts) return ''
  const d = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm前'
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const listEl = ref<HTMLElement>()
</script>

<style scoped>
.live-feed {
  background: #111827;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 160px;
}

.lf-hd {
  display: flex; align-items: center; gap: 7px;
}
.lf-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #34d399;
  animation: lfpulse 1.8s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes lfpulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
  50%      { box-shadow: 0 0 0 5px rgba(52,211,153,0.05); }
}
.lf-title {
  font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.08em;
  flex: 1;
}
.lf-live-badge {
  font-size: 9px; font-weight: 800; letter-spacing: 0.1em;
  background: rgba(52,211,153,0.15); color: #34d399;
  padding: 2px 7px; border-radius: 6px;
}

.lf-list { display: flex; flex-direction: column; gap: 5px; }
.lf-empty { font-size: 12px; color: rgba(255,255,255,0.2); font-style: italic; padding: 8px 0; }

.lf-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 10px;
  background: rgba(255,255,255,0.04);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.05);
  transition: background 0.15s;
}
.lf-item:hover { background: rgba(255,255,255,0.07); }
.lf-item.handoff { border-color: rgba(255,255,255,0.08); }
.lf-item.idle { opacity: 0.5; }

.lf-agent-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.lf-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.lf-top { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
.lf-agent { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lf-time { font-size: 10px; color: rgba(255,255,255,0.25); flex-shrink: 0; }
.lf-text { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.4; }
.lf-stage-tag {
  align-self: flex-start;
  font-size: 10px; font-weight: 700; padding: 1px 7px;
  border-radius: 6px; margin-top: 2px;
}

/* TransitionGroup 动画 */
.feed-enter-active { animation: feedIn 0.22s ease both; }
.feed-leave-active { animation: feedIn 0.15s ease reverse both; position: absolute; }
@keyframes feedIn {
  from { opacity: 0; transform: translateY(-5px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
