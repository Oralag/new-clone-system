<template>
  <div class="creative-dept">

    <DeptBulletin dept-id="creative" />

    <!-- ── 中部：设计专员指挥台 + 今日数据 ── -->
    <div class="mid-grid">
      <section class="command-section" :style="{ '--ac': '#ec4899' }">
        <div class="command-header">
          <div class="command-title-group">
            <span class="agent-label">🎨 创意部</span>
            <p class="command-desc">海报 · 视觉设计 · 创意策略</p>
          </div>
          <div class="command-chips">
            <button class="chip-btn" @click="$router.push('/agent/poster')">生成海报</button>
            <button class="chip-btn" @click="$router.push('/agent/meeting')">发起会议</button>
          </div>
        </div>
        <AgentChat agent-id="poster" ref="chatRef" />
      </section>

      <aside class="stats-aside">
        <div class="stats-aside-title">今日数据</div>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-card-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="1" width="16" height="16" rx="3"/><circle cx="6" cy="6" r="1.5"/><path d="M17 12l-5-5L1 17"/></svg></div>
            <div class="stat-card-value">{{ posterCount }}</div>
            <div class="stat-card-label">已生海报</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon icon-pub"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 2v10M6 5l3-3 3 3"/><path d="M2 13v3h14v-3"/></svg></div>
            <div class="stat-card-value">{{ publishCount }}</div>
            <div class="stat-card-label">已发布</div>
          </div>
        </div>
      </aside>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTrendingStore } from '@/stores/agent'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptBulletin from '@/components/agent/DeptBulletin.vue'

const agentStore = useTrendingStore()
const chatRef = ref<InstanceType<typeof AgentChat>>()

const posterCount = computed(() => agentStore.flowResults.filter(r => r.type === 'poster').length)
const publishCount = computed(() => agentStore.history.filter(h => h.status === 'published').length)
</script>

<style scoped>
.creative-dept {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 40px;
  max-width: 1200px;
}

.mid-grid { display: grid; grid-template-columns: 1fr 240px; gap: 14px; }

.command-section {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid var(--ac, #ec4899); border-radius: 14px;
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
.stat-card-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(236,72,153,0.08); display: flex; align-items: center; justify-content: center; color: #ec4899; flex-shrink: 0; }
.icon-pub { background: rgba(16,185,129,0.08) !important; color: #10b981 !important; }
.stat-card-value { font-size: 22px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.04em; line-height: 1; }
.stat-card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(29,29,31,0.35); }

@media (max-width: 900px) { .mid-grid { grid-template-columns: 1fr; } }
</style>
