<template>
  <div class="dashboard">
    <!-- Hero -->
    <div class="hero card">
      <div class="hero-left">
        <div class="hero-title">你好，今天想创作什么？</div>
        <div class="hero-sub">{{ today }} · 数字游牧内容工作台</div>
      </div>
      <div v-if="brandStore.isConfigured" class="brand-pill-hero">{{ brandStore.brand.name }}</div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item card" v-for="s in stats" :key="s.label">
        <div class="stat-value">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="section-title page-title">快速开始</div>
    <div class="actions-grid">
      <div
        v-for="action in actions"
        :key="action.path"
        class="action-card"
        @click="router.push(action.path)"
      >
        <div class="action-icon">{{ action.icon }}</div>
        <div class="action-title">{{ action.title }}</div>
        <div class="action-desc">{{ action.desc }}</div>
      </div>
    </div>

    <!-- Bottom two-col -->
    <div class="bottom-grid">
      <!-- Recent Activity -->
      <div class="card recent-card">
        <div class="card-header">最近生成</div>
        <div v-if="agentStore.flowResults.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">暂无生成记录</div>
          <div class="empty-sub">开始创作后，记录将显示在这里</div>
        </div>
        <div v-else class="result-list">
          <div v-for="(r, i) in agentStore.flowResults.slice(0, 5)" :key="i" class="result-row">
            <span class="result-platform">{{ r.platformName }}</span>
            <span class="result-topic">{{ r.topic }}</span>
            <span class="result-type">{{ typeLabel(r.type) }}</span>
          </div>
        </div>
      </div>

      <!-- Platform Stats -->
      <div class="card platform-card">
        <div class="card-header">平台覆盖</div>
        <div class="platform-stats">
          <div v-for="p in platformStats" :key="p.name" class="pstat-row">
            <span class="pstat-name">{{ p.name }}</span>
            <div class="pstat-bar-wrap">
              <div class="pstat-bar" :style="{ width: p.pct + '%', background: p.color }" />
            </div>
            <span class="pstat-val">{{ p.pct }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'
import { useTrendingStore } from '@/stores/agent'

const router = useRouter()
const brandStore = useBrandStore()
const agentStore = useTrendingStore()

const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const stats = computed(() => [
  { label: '本月内容', value: agentStore.flowResults.length || 0 },
  { label: '发布平台', value: brandStore.brand.mainPlatforms?.length || 0 },
  { label: '待发布', value: 0 },
  { label: '品牌健康度', value: brandStore.isConfigured ? '良好' : '未配置' },
])

const actions = [
  { icon: '🔥', title: '热搜抓取', desc: '实时获取各平台热搜话题', path: '/agent/trending' },
  { icon: '✍️', title: '文案生成', desc: 'AI一键生成品牌文案', path: '/agent/copywriting' },
  { icon: '🖼️', title: '图文海报', desc: '生成图文内容与海报文案', path: '/agent/poster' },
  { icon: '🎬', title: '视频脚本', desc: '短视频脚本与分镜创作', path: '/agent/video' },
  { icon: '📤', title: '发布管理', desc: '管理内容发布计划', path: '/agent/publish' },
]

const platformStats = [
  { name: '抖音', pct: 85, color: '#3b82f6' },
  { name: '小红书', pct: 72, color: '#ec4899' },
  { name: '快手', pct: 60, color: '#f59e0b' },
  { name: '微博', pct: 45, color: '#ef4444' },
  { name: 'B站', pct: 30, color: '#8b5cf6' },
]

function typeLabel(type: string) {
  const map: Record<string, string> = {
    video_script: '视频脚本',
    poster: '图文海报',
    copy: '文案',
  }
  return map[type] || type
}
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }

.card {
  background: #fdfefe;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
  border-color: #bfdbfe;
}
.hero-title { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
.hero-sub { font-size: 13px; color: #64748b; }
.brand-pill-hero {
  padding: 6px 16px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-item { text-align: center; padding: 16px; }
.stat-value { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 4px; }
.stat-label { font-size: 12px; color: #64748b; }

.section-title { font-size: 15px; font-weight: 600; margin-bottom: -8px; }
.page-title { color: #1e293b; }

.actions-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.action-card {
  background: #fdfefe;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}
.action-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}
.action-icon { font-size: 28px; margin-bottom: 10px; }
.action-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
.action-desc { font-size: 11px; color: #94a3b8; line-height: 1.4; }

.bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card-header { font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #374151; }

.empty-state { text-align: center; padding: 24px 0; }
.empty-icon { font-size: 32px; margin-bottom: 8px; }
.empty-text { font-size: 14px; color: #64748b; font-weight: 500; }
.empty-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; }

.result-list { display: flex; flex-direction: column; gap: 8px; }
.result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 7px;
  font-size: 13px;
}
.result-platform {
  padding: 2px 8px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}
.result-topic { flex: 1; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-type { font-size: 11px; color: #94a3b8; flex-shrink: 0; }

.platform-stats { display: flex; flex-direction: column; gap: 12px; }
.pstat-row { display: flex; align-items: center; gap: 10px; }
.pstat-name { width: 40px; font-size: 12px; color: #64748b; flex-shrink: 0; }
.pstat-bar-wrap { flex: 1; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.pstat-bar { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
.pstat-val { width: 32px; font-size: 12px; color: #64748b; text-align: right; flex-shrink: 0; }

@media (max-width: 767px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .actions-grid { grid-template-columns: repeat(2, 1fr); }
  .bottom-grid { grid-template-columns: 1fr; }
}
</style>
