<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-badge">
          <span class="header-badge-dot"></span>
          <span>Neural Ad Engine v3.1</span>
        </div>
        <h1 class="page-title">智能体工作流</h1>
        <p class="page-sub">自动追踪热搜 · AI 生成内容 · 多平台一键发布</p>
      </div>
      <div class="header-right">
        <span class="header-date">{{ today }}</span>
      </div>
    </div>

    <!-- Action Cards -->
    <div class="actions-grid">
      <div
        v-for="action in actions"
        :key="action.path"
        class="action-card"
        @click="$router.push(action.path)"
      >
        <div class="action-icon" :style="{ background: action.dot + '14', color: action.dot }">
          <component :is="action.iconComp" />
        </div>
        <div class="action-body">
          <div class="action-title">{{ action.title }}</div>
          <div class="action-desc">{{ action.desc }}</div>
        </div>
        <svg class="action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </div>

    <!-- Stats + Workflow -->
    <div class="two-col">
      <!-- Stats -->
      <div class="apple-card">
        <div class="card-header">
          <div>
            <div class="card-micro">Performance Metrics</div>
            <div class="card-title">数据概览</div>
          </div>
        </div>
        <div class="stats-grid">
          <div v-for="s in stats" :key="s.label" class="stat-item">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Workflow timeline -->
      <div class="apple-card dark-card">
        <div class="card-header">
          <div>
            <div class="card-micro" style="color:rgba(255,255,255,0.3)">Active Sequences</div>
            <div class="card-title" style="color:#fff">工作流程</div>
          </div>
          <div class="live-badge">
            <span class="live-dot"></span>
            <span>Running</span>
          </div>
        </div>
        <div class="workflow-list">
          <div class="workflow-vline"></div>
          <div v-for="(step, index) in workflowSteps" :key="index" class="workflow-step">
            <div class="step-node">
              <span>{{ index + 1 }}</span>
            </div>
            <div class="step-content">
              <div class="step-name">{{ step.label }}</div>
              <div class="step-detail">{{ step.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent -->
    <div v-if="agentStore.history.length > 0" class="apple-card">
      <div class="card-header">
        <div>
          <div class="card-micro">Latest Activity</div>
          <div class="card-title">最近发布</div>
        </div>
        <button class="link-btn" @click="$router.push('/agent/history')">查看全部 →</button>
      </div>
      <div class="recent-list">
        <div v-for="(item, i) in agentStore.history.slice(0, 4)" :key="i" class="recent-row">
          <div class="recent-info">
            <span class="recent-title">{{ item.title }}</span>
            <span class="recent-meta">{{ item.time }} · {{ item.platforms.join(' / ') }}</span>
          </div>
          <span :class="['status-badge', item.status]">
            {{ item.status === 'published' ? '已发布' : item.status === 'draft' ? '草稿' : '失败' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, defineComponent } from 'vue'
import { useTrendingStore } from '@/stores/agent'

const agentStore = useTrendingStore()

const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

const IconTrend = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('path', { d: 'M2 16L8 10l4 4 10-10' }), h('path', { d: 'M18 4h4v4' })]) })
const IconPen = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('path', { d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' })]) })
const IconImage = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }), h('circle', { cx: 8.5, cy: 8.5, r: 1.5 }), h('path', { d: 'M21 15l-5-5L5 21' })]) })
const IconVideo = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('rect', { x: 2, y: 6, width: 14, height: 12, rx: 2 }), h('path', { d: 'M16 10l6-4v12l-6-4V10z' })]) })
const IconSend = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }, [h('line', { x1: 22, y1: 2, x2: 11, y2: 13 }), h('polygon', { points: '22 2 15 22 11 13 2 9 22 2' })]) })

const actions = [
  { path: '/agent/trending', title: '抓取热搜', desc: '获取今日最热话题', dot: '#f97316', iconComp: IconTrend },
  { path: '/agent/copywriting', title: '生成文案', desc: 'AI 一键写爆款文案', dot: '#8b5cf6', iconComp: IconPen },
  { path: '/agent/poster', title: '图文海报', desc: 'AI 生成小红书海报', dot: '#ec4899', iconComp: IconImage },
  { path: '/agent/video', title: '生成视频', desc: '自动合成短视频', dot: '#0071e3', iconComp: IconVideo },
  { path: '/agent/publish', title: '发布内容', desc: '一键发布多平台', dot: '#34d399', iconComp: IconSend },
]

const workflowSteps = [
  { label: '抓取热搜', detail: '从各平台实时获取热门话题' },
  { label: 'AI 分析', detail: '识别与品牌相关的内容方向' },
  { label: '生成文案', detail: '多风格、多平台定制文案' },
  { label: '图文海报', detail: 'AI 生成小红书/朋友圈图文' },
  { label: '生成视频', detail: 'AI 合成短视频素材' },
  { label: '人工审核', detail: '确认内容符合品牌调性' },
  { label: '自动发布', detail: '定时同步发布至各平台' },
]

const stats = computed(() => [
  { value: Object.values(agentStore.trending).reduce((sum, arr) => sum + arr.length, 0) || '—', label: '已抓取热搜' },
  { value: agentStore.copywritingResults.length || '—', label: '已生成文案' },
  { value: agentStore.videoResults.length || '—', label: '已生成视频' },
  { value: agentStore.history.filter(h => h.status === 'published').length || '—', label: '已发布内容' },
])
</script>

<style scoped>
.dashboard {
  max-width: 1000px;
  padding-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 12px;
  background: rgba(0,113,227,0.07);
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #0071e3;
  margin-bottom: 14px;
}

.header-badge-dot {
  width: 5px;
  height: 5px;
  background: #0071e3;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

.page-title {
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.0;
  color: #1d1d1f;
  margin: 0 0 10px;
}

.page-sub {
  font-size: 14px;
  color: rgba(29,29,31,0.4);
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.01em;
}

.header-date {
  font-size: 11px;
  font-weight: 600;
  color: rgba(29,29,31,0.25);
  letter-spacing: 0.04em;
}

/* ── Action Cards ── */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.action-card {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 20px;
  padding: 20px 16px;
  cursor: pointer;
  transition: all 0.6s cubic-bezier(0.23,1,0.32,1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
  border-color: rgba(0,0,0,0.1);
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.4s cubic-bezier(0.23,1,0.32,1);
}

.action-card:hover .action-icon { transform: rotate(-8deg) scale(1.1); }

.action-body { flex: 1; }

.action-title {
  font-size: 13px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.action-desc {
  font-size: 11px;
  color: rgba(29,29,31,0.4);
  line-height: 1.45;
  font-weight: 500;
}

.action-arrow {
  color: rgba(29,29,31,0.2);
  flex-shrink: 0;
  transition: transform 0.3s, color 0.3s;
}
.action-card:hover .action-arrow { transform: translateX(3px); color: #1d1d1f; }

/* ── Cards ── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.apple-card {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 24px;
  padding: 28px;
  overflow: hidden;
}

.dark-card {
  background: #1d1d1f;
  border-color: transparent;
  position: relative;
}

.dark-card::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(0,113,227,0.12) 0%, transparent 70%);
  pointer-events: none;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.card-micro {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(29,29,31,0.28);
  margin-bottom: 4px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.03em;
}

.link-btn {
  font-size: 12px;
  font-weight: 600;
  color: #0071e3;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  letter-spacing: -0.01em;
  transition: opacity 0.15s;
}
.link-btn:hover { opacity: 0.7; }

.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(52,211,153,0.1);
  border: 1px solid rgba(52,211,153,0.2);
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  color: #34d399;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.live-dot {
  width: 5px;
  height: 5px;
  background: #34d399;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: rgba(0,0,0,0.05);
  border-radius: 16px;
  overflow: hidden;
}

.stat-item {
  background: #ffffff;
  padding: 20px 18px;
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  color: #1d1d1f;
  letter-spacing: -0.04em;
  margin-bottom: 4px;
  line-height: 1;
}

.stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(29,29,31,0.28);
}

/* Workflow */
.workflow-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 28px;
}

.workflow-vline {
  position: absolute;
  left: 10px;
  top: 6px;
  bottom: 6px;
  width: 1px;
  background: rgba(255,255,255,0.08);
}

.workflow-step {
  display: flex;
  gap: 14px;
  padding-bottom: 16px;
  position: relative;
}

.workflow-step:last-child { padding-bottom: 0; }

.step-node {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0,113,227,0.15);
  border: 1px solid rgba(0,113,227,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #60a5fa;
  flex-shrink: 0;
  position: absolute;
  left: -28px;
  top: 1px;
}

.step-content { padding-top: 1px; }

.step-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  margin-bottom: 2px;
  letter-spacing: -0.01em;
}

.step-detail {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  font-weight: 500;
  line-height: 1.4;
}

/* Recent */
.recent-list { display: flex; flex-direction: column; }

.recent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.recent-row:last-child { border-bottom: none; }

.recent-info { display: flex; flex-direction: column; gap: 3px; }
.recent-title { font-size: 13px; color: #1d1d1f; font-weight: 500; letter-spacing: -0.01em; }
.recent-meta { font-size: 11px; color: rgba(29,29,31,0.3); font-weight: 500; }

.status-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
.status-badge.published { background: rgba(52,211,153,0.1); color: #16a34a; }
.status-badge.draft { background: #fffbeb; color: #d97706; }
.status-badge.failed { background: #fef2f2; color: #dc2626; }

/* Dark mode support */
:global([data-theme='dark']) .page-title { color: #f8fafc; }
:global([data-theme='dark']) .page-sub, :global([data-theme='dark']) .header-date { color: #64748b; }
:global([data-theme='dark']) .page-header { border-bottom-color: #1e2a3a; }
:global([data-theme='dark']) .apple-card { background: #111827; border-color: #1f2937; }
:global([data-theme='dark']) .dark-card { background: #0d1117; }
:global([data-theme='dark']) .card-title, :global([data-theme='dark']) .action-title, :global([data-theme='dark']) .recent-title { color: #e2e8f0; }
:global([data-theme='dark']) .action-card { background: #111827; border-color: #1f2937; }
:global([data-theme='dark']) .action-card:hover { background: #1a2332; border-color: #2d3f55; }
:global([data-theme='dark']) .stats-grid { background: #1e2a3a; }
:global([data-theme='dark']) .stat-item { background: #111827; }
:global([data-theme='dark']) .stat-value { color: #f8fafc; }
:global([data-theme='dark']) .recent-row { border-bottom-color: #1e2a3a; }

@media (max-width: 900px) {
  .actions-grid { grid-template-columns: repeat(2, 1fr); }
  .two-col { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .actions-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
}
</style>
