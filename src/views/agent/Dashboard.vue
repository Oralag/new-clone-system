<template>
  <div class="dashboard">
    <div class="hero">
      <div class="hero-text">
        <h2 class="hero-title">智能体工作流</h2>
        <p class="hero-sub">自动追踪热搜 · AI 生成内容 · 多平台一键发布</p>
      </div>
      <div class="hero-meta">
        <span class="hero-date">{{ today }}</span>
      </div>
    </div>

    <div class="actions-grid">
      <div
        v-for="action in actions"
        :key="action.path"
        class="action-card"
        @click="$router.push(action.path)"
      >
        <div class="action-dot" :style="{ background: action.dot }" />
        <div class="action-body">
          <div class="action-title">{{ action.title }}</div>
          <div class="action-desc">{{ action.desc }}</div>
        </div>
        <svg class="action-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-header">
          <span class="card-title">数据概览</span>
        </div>
        <div class="stats-grid">
          <div v-for="s in stats" :key="s.label" class="stat-item">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">工作流程</span>
        </div>
        <div class="workflow-list">
          <div v-for="(step, index) in workflowSteps" :key="index" class="workflow-step">
            <div class="step-left">
              <div class="step-index">{{ index + 1 }}</div>
              <div v-if="index < workflowSteps.length - 1" class="step-line" />
            </div>
            <div class="step-content">
              <div class="step-name">{{ step.label }}</div>
              <div class="step-detail">{{ step.detail }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="agentStore.history.length > 0" class="card">
      <div class="card-header">
        <span class="card-title">最近发布</span>
        <button class="link-btn" @click="$router.push('/agent/history')">查看全部</button>
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
import { computed } from 'vue'
import { useTrendingStore } from '@/stores/agent'

const agentStore = useTrendingStore()

const today = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

const actions = [
  { path: '/agent/trending', title: '抓取热搜', desc: '获取今日最热话题', dot: '#f97316' },
  { path: '/agent/copywriting', title: '生成文案', desc: 'AI 一键写爆款文案', dot: '#8b5cf6' },
  { path: '/agent/poster', title: '图文海报', desc: 'AI 生成小红书海报', dot: '#ec4899' },
  { path: '/agent/video', title: '生成视频', desc: '自动合成短视频', dot: '#0ea5e9' },
  { path: '/agent/publish', title: '发布内容', desc: '一键发布多平台', dot: '#22c55e' },
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
  {
    value: Object.values(agentStore.trending).reduce((sum, arr) => sum + arr.length, 0) || '—',
    label: '已抓取热搜',
  },
  {
    value: agentStore.copywritingResults.length || '—',
    label: '已生成文案',
  },
  {
    value: agentStore.videoResults.length || '—',
    label: '已生成视频',
  },
  {
    value: agentStore.history.filter(h => h.status === 'published').length || '—',
    label: '已发布内容',
  },
])
</script>

<style scoped>
.dashboard {
  max-width: 960px;
  padding-bottom: 48px;
}

.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #ebebeb;
  position: relative;
}

.hero-title {
  font-size: 24px;
  font-weight: 650;
  color: #1a1a1a;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}

.hero-sub {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.hero-date {
  font-size: 12px;
  color: #bbb;
}

.autoflow-card,
.autoflow-running {
  background: linear-gradient(135deg, #faf5ff, #eff6ff);
  border: 1.5px solid #c4b5fd;
  border-radius: 16px;
  padding: 22px 24px;
  margin-bottom: 20px;
}

.autoflow-header,
.running-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.autoflow-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.autoflow-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.autoflow-title,
.running-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
}

.autoflow-sub {
  font-size: 12px;
  color: #7c3aed;
  margin-top: 2px;
}

.autoflow-options {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.opt-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.opt-label {
  width: 56px;
  flex-shrink: 0;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

.opt-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.opt-tag {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  color: #64748b;
}

.opt-tag.active {
  border-color: #7c3aed;
  background: #7c3aed;
  color: #fff;
}

.flow-steps-preview {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.flow-step-chip {
  display: flex;
  align-items: center;
  gap: 6px;
}

.flow-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flow-step-name {
  font-size: 12px;
  color: #4c1d95;
  font-weight: 600;
}

.btn-autoflow,
.btn-goto {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
}

.running-brand {
  font-size: 12px;
  color: #7c3aed;
  background: #f5f3ff;
  padding: 3px 10px;
  border-radius: 20px;
}

.running-steps {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
}

.running-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.running-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 14px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: #e2e8f0;
  z-index: 0;
}

.running-step.done::after {
  background: #7c3aed;
}

.rs-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  z-index: 1;
  position: relative;
}

.running-step.done .rs-icon { background: #7c3aed; color: #fff; }
.running-step.active .rs-icon { background: #ede9fe; color: #7c3aed; border: 2px solid #7c3aed; }
.running-step.pending .rs-icon { background: #f1f5f9; color: #94a3b8; }
.rs-label { font-size: 11px; color: #64748b; text-align: center; }
.running-step.done .rs-label { color: #7c3aed; font-weight: 600; }
.running-step.active .rs-label { color: #1a1a1a; font-weight: 600; }
.spinner-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; }
.running-done { text-align: center; padding-top: 4px; }
.done-title { font-size: 15px; font-weight: 700; color: #16a34a; margin-bottom: 14px; }
.done-btns { display: flex; gap: 10px; justify-content: center; }

.actions-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.action-card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  padding: 18px 16px;
  cursor: pointer;
  transition: all 0.18s;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

.action-card:hover {
  border-color: #d0d0d0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.action-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.action-body {
  flex: 1;
}

.action-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.action-arrow {
  color: #ccc;
  flex-shrink: 0;
  margin-top: 2px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.card {
  background: #fff;
  border: 1px solid #ebebeb;
  border-radius: 12px;
  padding: 20px 22px;
  position: relative;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.link-btn {
  font-size: 12px;
  color: #888;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover {
  color: #1a1a1a;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.stat-item {
  background: #fff;
  padding: 18px 16px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: #aaa;
}

.workflow-list {
  display: flex;
  flex-direction: column;
}

.workflow-step {
  display: flex;
  gap: 12px;
}

.step-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}

.step-index {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #888;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-line {
  width: 1px;
  flex: 1;
  background: #f0f0f0;
  margin: 3px 0;
  min-height: 12px;
}

.step-content {
  padding-bottom: 14px;
  padding-top: 1px;
}

.step-name {
  font-size: 13px;
  font-weight: 550;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.step-detail {
  font-size: 11px;
  color: #aaa;
  line-height: 1.4;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.recent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 0;
  border-bottom: 1px solid #f5f5f5;
}

.recent-row:last-child {
  border-bottom: none;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.recent-title {
  font-size: 13px;
  color: #1a1a1a;
  font-weight: 450;
}

.recent-meta {
  font-size: 11px;
  color: #bbb;
}

.status-badge {
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 20px;
  font-weight: 500;
}

.status-badge.published {
  background: #f0fdf4;
  color: #16a34a;
}

.status-badge.draft {
  background: #fffbeb;
  color: #d97706;
}

.status-badge.failed {
  background: #fef2f2;
  color: #dc2626;
}

.hero::after,
.card::after,
.action-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.action-card::after,
.card::after {
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

:global([data-theme='dark']) .hero-title,
:global([data-theme='dark']) .action-title,
:global([data-theme='dark']) .card-title,
:global([data-theme='dark']) .step-name,
:global([data-theme='dark']) .recent-title {
  color: #e2e8f0;
}

:global([data-theme='dark']) .hero {
  border-bottom-color: #1e2a3a;
}

:global([data-theme='dark']) .hero-sub,
:global([data-theme='dark']) .hero-date,
:global([data-theme='dark']) .action-desc,
:global([data-theme='dark']) .stat-label,
:global([data-theme='dark']) .step-detail,
:global([data-theme='dark']) .recent-meta,
:global([data-theme='dark']) .link-btn {
  color: #64748b;
}

:global([data-theme='dark']) .card,
:global([data-theme='dark']) .action-card {
  background: #141a24;
  border-color: #1e2a3a;
}

:global([data-theme='dark']) .action-card:hover {
  background: #1a2332;
  border-color: #2d3f55;
}

:global([data-theme='dark']) .stats-grid,
:global([data-theme='dark']) .step-index,
:global([data-theme='dark']) .step-line {
  background: #1e2a3a;
}

:global([data-theme='dark']) .stat-item {
  background: #141a24;
}

:global([data-theme='dark']) .stat-value {
  color: #f8fafc;
}

:global([data-theme='dark']) .recent-row {
  border-bottom-color: #1e2a3a;
}

:global([data-theme='dark']) .action-card::after,
:global([data-theme='dark']) .card::after {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

@media (max-width: 900px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .two-col {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .hero,
  .recent-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
