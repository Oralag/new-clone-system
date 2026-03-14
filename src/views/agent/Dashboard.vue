<template>
  <div class="dashboard">
    <!-- Captain 指挥官 -->
    <CaptainBar />

    <div class="dash-main-header">
      <div>
        <h1 class="dash-title">智能体工作流</h1>
        <p class="dash-sub">自动追踪热搜 · AI 生成内容 · 多平台一键发布</p>
      </div>
    </div>

    <!-- 入口卡片 -->
    <div class="actions-grid">
      <div
        v-for="action in actions"
        :key="action.path"
        class="action-card"
        @click="$router.push(action.path)"
      >
        <div class="action-icon" :style="{ background: action.color + '14', color: action.color }">
          <component :is="action.iconComp" />
        </div>
        <div class="action-body">
          <div class="action-title">{{ action.title }}</div>
          <div class="action-desc">{{ action.desc }}</div>
        </div>
        <svg class="action-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="stats-row">
      <div v-for="s in stats" :key="s.label" class="stat-card">
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div v-if="agentStore.history.length > 0" class="recent-card">
      <div class="recent-header">
        <div class="recent-title-row">
          <span class="dash-section-label" style="margin:0">最近发布</span>
        </div>
        <button class="link-btn" @click="$router.push('/agent/history')">全部记录 →</button>
      </div>
      <div class="recent-list">
        <div v-for="(item, i) in agentStore.history.slice(0, 5)" :key="i" class="recent-row">
          <div class="recent-info">
            <span class="recent-name">{{ item.title }}</span>
            <span class="recent-meta">{{ item.time }} · {{ item.platforms.join(' / ') }}</span>
          </div>
          <span :class="['status-badge', item.status]">
            {{ item.status === 'published' ? '已发布' : item.status === 'draft' ? '草稿' : '失败' }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="empty-recent">
      <div class="empty-recent-icon">📭</div>
      <div class="empty-recent-text">还没有发布记录</div>
      <div class="empty-recent-sub">开始使用各 Agent 生成并发布内容</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, defineComponent } from 'vue'
import { useTrendingStore } from '@/stores/agent'
import CaptainBar from '@/components/CaptainBar.vue'

const agentStore = useTrendingStore()

const IconTrend = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('path', { d: 'M2 16L8 10l4 4 10-10' }), h('path', { d: 'M18 4h4v4' })]) })
const IconPen = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('path', { d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' })]) })
const IconImage = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }), h('circle', { cx: 8.5, cy: 8.5, r: 1.5 }), h('path', { d: 'M21 15l-5-5L5 21' })]) })
const IconVideo = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('rect', { x: 2, y: 6, width: 14, height: 12, rx: 2 }), h('path', { d: 'M16 10l6-4v12l-6-4V10z' })]) })
const IconSend = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('line', { x1: 22, y1: 2, x2: 11, y2: 13 }), h('polygon', { points: '22 2 15 22 11 13 2 9 22 2' })]) })

const actions = [
  { path: '/agent/trending', title: '热搜抓取', desc: '实时获取各平台热门话题', color: '#f97316', iconComp: IconTrend },
  { path: '/agent/copywriting', title: '文案生成', desc: 'AI 一键写爆款文案', color: '#8b5cf6', iconComp: IconPen },
  { path: '/agent/poster', title: '图文海报', desc: 'AI 生成小红书海报方案', color: '#ec4899', iconComp: IconImage },
  { path: '/agent/video', title: '视频生成', desc: '短视频脚本与分镜设计', color: '#0071e3', iconComp: IconVideo },
  { path: '/agent/publish', title: '发布管理', desc: '多平台发布计划与排期', color: '#34d399', iconComp: IconSend },
]

const stats = computed(() => [
  { value: Object.values(agentStore.trending).reduce((s, a) => s + a.length, 0) || '0', label: '已抓取热搜' },
  { value: agentStore.copywritingResults.length || '0', label: '已生成文案' },
  { value: agentStore.videoResults.length || '0', label: '已生成视频' },
  { value: agentStore.history.filter(h => h.status === 'published').length || '0', label: '已发布内容' },
])
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
}

.dash-main-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.dash-title {
  font-size: clamp(26px, 4vw, 40px);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #1d1d1f;
  margin: 0 0 6px;
}
.dash-sub {
  font-size: 13px;
  color: rgba(29,29,31,0.4);
  font-weight: 500;
  margin: 0;
}

/* Action cards */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.action-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  padding: 16px 14px;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.23,1,0.32,1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.action-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 16px 32px rgba(0,0,0,0.08);
  border-color: rgba(0,0,0,0.1);
}
.action-icon {
  width: 38px; height: 38px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.4s cubic-bezier(0.23,1,0.32,1);
}
.action-card:hover .action-icon { transform: rotate(-8deg) scale(1.1); }
.action-title { font-size: 12.5px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.02em; }
.action-desc { font-size: 11px; color: rgba(29,29,31,0.38); line-height: 1.4; font-weight: 500; }
.action-arrow { color: rgba(29,29,31,0.18); transition: all 0.3s; flex-shrink: 0; }
.action-card:hover .action-arrow { transform: translateX(3px); color: #1d1d1f; }
.action-body { flex: 1; }

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.stat-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 18px 16px;
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1d1d1f;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 6px;
}
.stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(29,29,31,0.28);
}

/* Recent */
.recent-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  padding: 20px 22px;
}
.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.link-btn {
  font-size: 12px; font-weight: 600; color: #0071e3;
  background: none; border: none; cursor: pointer; padding: 0;
  transition: opacity 0.15s;
}
.link-btn:hover { opacity: 0.7; }
.recent-list { display: flex; flex-direction: column; }
.recent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.recent-row:last-child { border-bottom: none; }
.recent-info { display: flex; flex-direction: column; gap: 2px; }
.recent-name { font-size: 13px; color: #1d1d1f; font-weight: 500; }
.recent-meta { font-size: 11px; color: rgba(29,29,31,0.3); font-weight: 500; }
.status-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
.status-badge.published { background: rgba(52,211,153,0.1); color: #16a34a; }
.status-badge.draft { background: #fffbeb; color: #d97706; }
.status-badge.failed { background: #fef2f2; color: #dc2626; }

.empty-recent {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  padding: 36px 20px;
  text-align: center;
}
.empty-recent-icon { font-size: 32px; margin-bottom: 10px; }
.empty-recent-text { font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 4px; }
.empty-recent-sub { font-size: 12px; color: rgba(29,29,31,0.4); }

/* Dark mode */
:global([data-theme='dark']) .action-card,
:global([data-theme='dark']) .stat-card,
:global([data-theme='dark']) .recent-card,
:global([data-theme='dark']) .empty-recent { background: #111827; border-color: #1f2937; }
:global([data-theme='dark']) .dash-title,
:global([data-theme='dark']) .action-title,
:global([data-theme='dark']) .stat-value,
:global([data-theme='dark']) .recent-name,
:global([data-theme='dark']) .empty-recent-text { color: #f8fafc; }
:global([data-theme='dark']) .dash-sub,
:global([data-theme='dark']) .action-desc,
:global([data-theme='dark']) .stat-label,
:global([data-theme='dark']) .recent-meta,
:global([data-theme='dark']) .empty-recent-sub { color: #64748b; }
:global([data-theme='dark']) .recent-row { border-bottom-color: #1e2a3a; }
:global([data-theme='dark']) .action-card:hover { background: #1a2332; border-color: #2d3f55; }

@media (max-width: 1000px) {
  .actions-grid { grid-template-columns: repeat(3, 1fr); }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .actions-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
