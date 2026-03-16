<template>
  <div class="dashboard">

    <!-- ── 区域1: Captain 指挥台 ── -->
    <section class="command-section">
      <div class="command-header">
        <div class="command-title-group">
          <span class="command-eyebrow">AI 多智能体总调度</span>
          <h2 class="command-title">Captain 指挥官</h2>
        </div>
        <div class="command-chips">
          <button
            v-for="p in quickPrompts"
            :key="p"
            class="chip-btn"
            @click="fillCaptain(p)"
          >{{ p }}</button>
        </div>
      </div>
      <CaptainBar />
    </section>

    <!-- ── 区域2: 部门 + Agent ── -->
    <section class="teams-section">
      <div class="section-hd">
        <h3 class="section-title">Agent 团队</h3>
        <span class="section-sub">{{ totalAgents }} 名专员全员在岗</span>
      </div>

      <div
        v-for="dept in departments"
        :key="dept.id"
        class="dept-block"
      >
        <!-- 部门头 -->
        <div class="dept-hd">
          <div class="dept-hd-left">
            <span class="dept-emoji">{{ dept.emoji }}</span>
            <div>
              <div class="dept-name">{{ dept.name }}</div>
              <div class="dept-desc">{{ dept.desc }}</div>
            </div>
          </div>
          <span class="dept-count-tag">{{ dept.members.length }} 人在岗</span>
        </div>

        <!-- Agent 卡片列表 -->
        <div class="members-row">
          <div
            v-for="member in dept.members"
            :key="member.id"
            class="member-card"
            @click="$router.push(member.path)"
          >
            <div class="member-avatar" :style="{ background: member.color + '15', color: member.color }">
              {{ member.emoji }}
            </div>
            <div class="member-body">
              <div class="member-name">{{ member.name }}</div>
              <div class="member-role">{{ member.role }}</div>
            </div>
            <div class="member-footer">
              <span class="online-tag">
                <span class="online-dot"></span>在岗
              </span>
              <span class="member-cta">开始任务 →</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 区域3: 底部双栏 ── -->
    <div class="bottom-grid">
      <!-- 数据概览 -->
      <div class="stats-panel">
        <div class="panel-hd">
          <span class="panel-title">数据概览</span>
        </div>
        <div class="stats-grid">
          <div v-for="s in stats" :key="s.label" class="stat-item">
            <div class="stat-icon">{{ s.emoji }}</div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- 今日热搜快览 -->
      <div class="trending-panel">
        <div class="panel-hd">
          <span class="panel-title">今日热搜</span>
          <router-link to="/agent/trending" class="panel-link">查看全部 →</router-link>
        </div>
        <div class="trending-list">
          <div
            v-for="(item, i) in topTrending"
            :key="i"
            class="trending-item"
          >
            <span class="trending-rank" :class="i < 3 ? 'rank-hot' : ''">{{ i + 1 }}</span>
            <span class="trending-title">{{ item.title }}</span>
            <span class="trending-heat">{{ item.heat }}</span>
          </div>
          <div v-if="topTrending.length === 0" class="trending-empty">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:.3;margin-bottom:6px">
              <path d="M3 12h4l3-9 4 18 3-9h4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div>暂无热搜数据</div>
            <router-link to="/agent/trending" class="panel-link" style="margin-top:6px">立即抓取 →</router-link>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTrendingStore } from '@/stores/agent'
import CaptainBar from '@/components/CaptainBar.vue'

const agentStore = useTrendingStore()

// 快捷指令
const quickPrompts = [
  '分析今日热搜，生成推广方向',
  '帮我规划新品上市内容计划',
  '追踪当前热点给出选题方向',
]

function fillCaptain(text: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: text }))
}

// 部门 + Agent 定义
const departments = ref([
  {
    id: 'content',
    name: '内容部',
    emoji: '✍️',
    desc: '文案、海报、视频全链路内容生产',
    members: [
      { id: 'copywriter', name: '文案专员', role: '平台爆款文案 · 标题优化', emoji: '✍️', color: '#f59e0b', path: '/agent/copywriting' },
      { id: 'poster',     name: '设计专员', role: '海报方案 · 视觉创意',     emoji: '🎨', color: '#ec4899', path: '/agent/poster' },
      { id: 'video',      name: '视频专员', role: '短视频脚本 · 分镜设计',   emoji: '🎬', color: '#ef4444', path: '/agent/video' },
    ],
  },
  {
    id: 'brand',
    name: '品牌部',
    emoji: '💎',
    desc: '品牌战略、调性把控、竞品分析',
    members: [
      { id: 'brand', name: '品牌专员', role: '品牌策略 · 内容调性审核', emoji: '💎', color: '#8b5cf6', path: '/agent/brand' },
    ],
  },
  {
    id: 'intel',
    name: '情报部',
    emoji: '📈',
    desc: '热点追踪、趋势分析、选题建议',
    members: [
      { id: 'trend', name: '趋势专员', role: '热点分析 · 选题方向', emoji: '📈', color: '#06b6d4', path: '/agent/trending' },
    ],
  },
  {
    id: 'publish',
    name: '发布部',
    emoji: '🚀',
    desc: '多平台排期、发布计划、数据复盘',
    members: [
      { id: 'publisher', name: '发布专员', role: '多平台排期 · 发布计划', emoji: '🚀', color: '#10b981', path: '/agent/publish' },
    ],
  },
])

const totalAgents = computed(() => departments.value.reduce((s, d) => s + d.members.length, 0))

// 数据统计
const stats = computed(() => [
  { emoji: '🔥', value: Object.values(agentStore.trending).reduce((s, a) => s + a.length, 0) || 0, label: '已抓热搜' },
  { emoji: '✍️', value: agentStore.copywritingResults.length || 0, label: '已生文案' },
  { emoji: '🎬', value: agentStore.videoResults.length || 0, label: '已生视频' },
  { emoji: '🚀', value: agentStore.history.filter(h => h.status === 'published').length || 0, label: '已发布' },
])

// 今日热搜快览（取 douyin 前5，无则取 xiaohongshu）
const topTrending = computed(() => {
  const douyin = agentStore.trending.douyin || []
  const xhs = agentStore.trending.xiaohongshu || []
  return (douyin.length > 0 ? douyin : xhs).slice(0, 5)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
}

/* ── 区域1: Captain 指挥台 ── */
.command-section {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-top: 2px solid rgba(0,113,227,0.35);
  border-radius: 14px;
  padding: 20px 20px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  animation: fadeUp 0.3s ease both;
}
.command-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 14px; margin-bottom: 16px;
}
.command-eyebrow {
  display: block;
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: #0071e3; opacity: 0.8;
  margin-bottom: 4px;
}
.command-title {
  font-size: 17px; font-weight: 800; color: #1d1d1f;
  letter-spacing: -0.03em; margin: 0;
}
.command-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.chip-btn {
  background: #f5f5f7;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 11.5px; font-weight: 500;
  color: rgba(29,29,31,0.6);
  cursor: pointer; white-space: nowrap;
  transition: all 0.15s;
  font-family: inherit;
}
.chip-btn:hover {
  border-color: #0071e3; color: #0071e3;
  background: rgba(0,113,227,0.06);
}
/* CaptainBar 嵌入适配 */
.command-section :deep(.captain-bar) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
  margin-bottom: 0 !important;
  border-top: 1px solid rgba(0,0,0,0.06) !important;
}

/* ── 区域2: 部门 + Agent ── */
.teams-section {
  display: flex; flex-direction: column; gap: 12px;
  animation: fadeUp 0.3s 0.07s ease both;
}
.section-hd { display: flex; align-items: center; gap: 10px; }
.section-title { font-size: 14px; font-weight: 700; color: #1d1d1f; margin: 0; letter-spacing: -0.02em; }
.section-sub { font-size: 11px; color: rgba(29,29,31,0.4); font-weight: 500; }

.dept-block {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  overflow: hidden;
}
.dept-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.dept-hd-left { display: flex; align-items: center; gap: 12px; }
.dept-emoji { font-size: 24px; }
.dept-name { font-size: 14px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.02em; }
.dept-desc { font-size: 11.5px; color: rgba(29,29,31,0.4); margin-top: 2px; }
.dept-count-tag {
  font-size: 11px; font-weight: 600;
  background: rgba(52,211,153,0.1); color: #16a34a;
  padding: 3px 10px; border-radius: 20px; white-space: nowrap;
}

.members-row {
  display: flex; gap: 10px;
  padding: 14px 18px;
  flex-wrap: wrap;
}
.member-card {
  flex: 1; min-width: 160px; max-width: 240px;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  display: flex; flex-direction: column; gap: 8px;
  transition: all 0.2s;
  background: #fafafa;
}
.member-card:hover {
  border-color: rgba(0,0,0,0.14);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.07);
  background: #ffffff;
}
.member-avatar {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}
.member-body { flex: 1; }
.member-name { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.member-role { font-size: 11px; color: rgba(29,29,31,0.4); line-height: 1.4; margin-top: 2px; }
.member-footer {
  display: flex; align-items: center; justify-content: space-between;
}
.online-tag {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: #16a34a; font-weight: 600;
}
.online-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #34d399; flex-shrink: 0;
}
.member-cta {
  font-size: 11px; font-weight: 600;
  color: rgba(29,29,31,0.3);
  transition: color 0.15s;
}
.member-card:hover .member-cta { color: #0071e3; }

/* ── 区域3: 底部双栏 ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  animation: fadeUp 0.3s 0.14s ease both;
}

.stats-panel,
.trending-panel {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 18px;
}
.panel-hd {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.panel-title { font-size: 13px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.01em; }
.panel-link { font-size: 11.5px; font-weight: 600; color: #0071e3; text-decoration: none; }
.panel-link:hover { opacity: 0.75; }

/* 数据统计 */
.stats-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
.stat-item {
  padding: 14px 12px;
  background: #f5f5f7;
  border-radius: 10px;
  text-align: center;
}
.stat-icon { font-size: 18px; margin-bottom: 6px; }
.stat-value {
  font-size: 26px; font-weight: 800; color: #1d1d1f;
  letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px;
}
.stat-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: rgba(29,29,31,0.3);
}

/* 今日热搜 */
.trending-list { display: flex; flex-direction: column; }
.trending-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.trending-item:last-child { border-bottom: none; }
.trending-rank {
  width: 18px; height: 18px; border-radius: 5px;
  background: #f5f5f7;
  font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.4);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rank-hot { background: rgba(239,68,68,0.1); color: #ef4444; }
.trending-title {
  flex: 1; font-size: 12.5px; color: #1d1d1f;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.trending-heat { font-size: 11px; color: rgba(29,29,31,0.35); white-space: nowrap; flex-shrink: 0; }
.trending-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 20px 0; font-size: 12px; color: rgba(29,29,31,0.35);
  text-align: center;
}

/* 入场动画 */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 响应式 */
@media (max-width: 900px) {
  .bottom-grid { grid-template-columns: 1fr; }
  .members-row { gap: 8px; }
  .member-card { min-width: 140px; }
}
@media (max-width: 560px) {
  .command-header { flex-direction: column; gap: 10px; }
  .command-chips { flex-wrap: wrap; }
}
</style>
