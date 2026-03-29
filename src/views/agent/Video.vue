<template>
  <div class="agent-page">
    <DeptBulletin dept-id="video" />
    <div class="mid-grid">
      <!-- 左侧：视频Agent 指挥台 -->
      <section class="command-section" :style="{ '--ac': '#0071e3' }">
        <div class="command-header">
          <div class="command-title-group">
            <span class="agent-label">🎬 视频Agent</span>
            <p class="command-desc">短视频脚本 · 分镜设计 · 口播文案</p>
          </div>
          <div class="command-chips">
            <button v-for="p in quickPrompts" :key="p" class="chip-btn" @click="chatRef?.sendQuickPrompt(p)">{{ p }}</button>
          </div>
        </div>
        <AgentChat
          agent-id="video"
          @streaming-change="streaming = $event"
          ref="chatRef"
        />
      </section>

      <!-- 右侧：今日数据 -->
      <aside class="stats-aside">
        <div class="stats-aside-title">今日数据</div>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-card-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="3" width="13" height="12" rx="2"/><path d="M14 7l3-2v8l-3-2V7z"/></svg></div>
            <div class="stat-card-value">{{ videoCount }}</div>
            <div class="stat-card-label">已生脚本</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 2v10M6 5l3-3 3 3"/><path d="M2 13v3h14v-3"/></svg></div>
            <div class="stat-card-value">{{ publishCount }}</div>
            <div class="stat-card-label">已发布</div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTrendingStore } from '@/stores/agent'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptBulletin from '@/components/agent/DeptBulletin.vue'

const agentStore = useTrendingStore()
const streaming = ref(false)
const chatRef = ref<InstanceType<typeof AgentChat>>()

const quickPrompts = [
  '写一个15秒抖音短视频脚本',
  '帮我设计一个产品开箱视频的分镜',
  '写一段60秒口播文案介绍新品',
]

const videoCount = computed(() => agentStore.videoResults.length)
const publishCount = computed(() => agentStore.history.filter(h => h.status === 'published').length)
</script>

<style scoped>
.agent-page { display: flex; flex-direction: column; gap: 16px; max-width: 1200px; }
.mid-grid { display: grid; grid-template-columns: 1fr 240px; gap: 14px; }
.command-section {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid var(--ac, #0071e3); border-radius: 14px;
  padding: 18px 18px 0; box-shadow: 0 2px 12px rgba(0,0,0,0.05); overflow: hidden;
}
.command-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.agent-label { display: block; font-size: 13px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.02em; margin-bottom: 3px; }
.command-desc { font-size: 11px; color: rgba(29,29,31,0.4); margin: 0; }
.command-chips { display: flex; gap: 5px; flex-wrap: wrap; align-items: flex-start; }
.chip-btn { background: #f5f5f7; border: 1px solid rgba(0,0,0,0.08); border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 500; color: rgba(29,29,31,0.6); cursor: pointer; white-space: nowrap; font-family: inherit; transition: all 0.15s; }
.chip-btn:hover { border-color: var(--ac); color: var(--ac); background: color-mix(in srgb, var(--ac) 6%, white); }
.command-section :deep(.agent-bar) { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; margin-bottom: 0 !important; border-top: 1px solid rgba(0,0,0,0.06) !important; }

.stats-aside { background: #ffffff; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.stats-aside-title { font-size: 12px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px; letter-spacing: -0.01em; }
.stats-cards { display: flex; flex-direction: column; gap: 8px; }
.stat-card { display: flex; align-items: center; gap: 10px; padding: 11px 12px; background: #f5f5f7; border-radius: 10px; }
.stat-card-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(0,113,227,0.08); display: flex; align-items: center; justify-content: center; color: #0071e3; flex-shrink: 0; }
.stat-card-value { font-size: 22px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.04em; line-height: 1; }
.stat-card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(29,29,31,0.35); }
@media (max-width: 900px) { .mid-grid { grid-template-columns: 1fr; } }
</style>
