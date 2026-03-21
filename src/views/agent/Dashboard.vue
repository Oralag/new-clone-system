<template>
  <div class="dashboard">

    <!-- ── 品牌未配置引导卡 ── -->
    <div v-if="!brandStore.isConfigured" class="setup-guide-card">
      <div class="guide-icon">🏢</div>
      <div class="guide-body">
        <div class="guide-title">欢迎来到数字游牧传媒</div>
        <div class="guide-desc">配置品牌信息后，各部门专员将基于品牌宪法开展工作，生产更精准的内容。</div>
      </div>
      <button class="guide-btn" @click="$router.push('/agent/brand')">立即配置品牌 →</button>
    </div>

    <!-- ── 公司Banner ── -->
    <section class="company-banner">
      <div class="banner-left">
        <div class="company-tag">数字游牧传媒</div>
        <h1 class="company-title" v-if="brandStore.isConfigured">
          {{ brandStore.brand.name }}
          <span class="company-industry">· {{ brandStore.brand.subIndustry || brandStore.brand.industry }}</span>
        </h1>
        <h1 class="company-title placeholder" v-else>未配置品牌信息</h1>
        <div class="banner-stats">
          <div class="bstat">
            <span class="bstat-num">{{ totalStaff }}</span>
            <span class="bstat-label">名专员在岗</span>
          </div>
          <div class="bstat-sep">·</div>
          <div class="bstat">
            <span class="bstat-num">{{ departmentCount }}</span>
            <span class="bstat-label">个部门</span>
          </div>
          <div class="bstat-sep">·</div>
          <div class="bstat">
            <span class="bstat-num ai-online">AI 在线</span>
          </div>
        </div>
      </div>
      <div class="banner-actions">
        <button class="banner-btn primary" @click="$router.push('/agent/meeting')">
          <span class="btn-icon">💬</span> 召开会议
        </button>
        <button class="banner-btn" @click="$router.push('/agent/trending')">
          <span class="btn-icon">📈</span> 查看热搜
        </button>
        <button class="banner-btn" @click="$router.push('/agent/publish')">
          <span class="btn-icon">🚀</span> 发布管理
        </button>
      </div>
    </section>

    <!-- ── Captain 指挥台 ── -->
    <section class="command-section">
      <div class="command-header">
        <div class="command-title-group">
          <div class="captain-badge">🎯 董事长办公室</div>
          <h2 class="command-title">Captain 总指挥</h2>
          <p class="command-sub">输入指令，Captain 将协调各部门专员完成任务</p>
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

    <!-- ── 部门卡片 ── -->
    <section class="depts-section">
      <div class="section-hd">
        <h3 class="section-title">各部门专员</h3>
        <span class="section-sub">点击卡片进入对应专员工作间</span>
      </div>

      <div class="depts-grid">
        <div
          v-for="dept in departments"
          :key="dept.id"
          class="dept-card"
        >
          <!-- 部门头 -->
          <div class="dept-card-hd">
            <span class="dept-emoji">{{ dept.emoji }}</span>
            <div class="dept-info">
              <div class="dept-name">{{ dept.name }}</div>
              <div class="dept-desc">{{ dept.desc }}</div>
            </div>
          </div>
          <!-- 专员列表 -->
          <div class="staff-list">
            <div
              v-for="member in dept.members"
              :key="member.id"
              class="staff-row"
              @click="$router.push(member.path)"
            >
              <div class="staff-avatar" :style="{ background: member.color + '18', color: member.color }">
                {{ member.emoji }}
              </div>
              <div class="staff-info">
                <span class="staff-name">{{ member.name }}</span>
                <span class="staff-role">{{ member.role }}</span>
              </div>
              <div class="staff-status">
                <span class="status-dot"></span>
                <span class="status-text">在岗</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 底部双栏 ── -->
    <div class="bottom-grid">
      <!-- 数据概览 -->
      <div class="stats-panel">
        <div class="panel-hd">
          <span class="panel-title">今日数据</span>
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
import { useBrandStore } from '@/stores/brand'
import CaptainBar from '@/components/CaptainBar.vue'

const agentStore = useTrendingStore()
const brandStore = useBrandStore()

// Captain 快捷指令
const quickPrompts = [
  '策划新品上线内容方案',
  '分析热搜生成推广方向',
  '制定本周多平台内容计划',
]

function fillCaptain(text: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: text }))
}

// 部门 + 专员定义（体现公司架构）
const departments = ref([
  {
    id: 'content',
    name: '内容部',
    emoji: '✍️',
    desc: '文案·视频全链路内容生产',
    members: [
      { id: 'copywriter', name: '林晓文', role: '高级文案策划', emoji: '✍️', color: '#f59e0b', path: '/agent/copywriting' },
      { id: 'video', name: '张明远', role: '视频内容总监', emoji: '🎬', color: '#ef4444', path: '/agent/video' },
    ],
  },
  {
    id: 'creative',
    name: '创意部',
    emoji: '🎨',
    desc: '海报·视觉设计·创意策略',
    members: [
      { id: 'poster', name: '陈美琪', role: '首席设计师', emoji: '🎨', color: '#ec4899', path: '/agent/poster' },
    ],
  },
  {
    id: 'brand',
    name: '品牌部',
    emoji: '💎',
    desc: '品牌战略·调性把控·竞品分析',
    members: [
      { id: 'brand', name: '王思远', role: '品牌战略总监', emoji: '💎', color: '#8b5cf6', path: '/agent/brand' },
    ],
  },
  {
    id: 'intel',
    name: '情报部',
    emoji: '📈',
    desc: '热点追踪·趋势分析·选题建议',
    members: [
      { id: 'trend', name: '刘浩然', role: '市场情报总监', emoji: '📈', color: '#06b6d4', path: '/agent/trending' },
    ],
  },
  {
    id: 'publish',
    name: '发布部',
    emoji: '🚀',
    desc: '多平台排期·发布计划·数据复盘',
    members: [
      { id: 'publisher', name: '赵欣然', role: '发布运营总监', emoji: '🚀', color: '#10b981', path: '/agent/publish' },
    ],
  },
])

// 统计数量
const totalStaff = computed(() => departments.value.reduce((s, d) => s + d.members.length, 0))
const departmentCount = computed(() => departments.value.length)

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

/* ── 品牌配置引导卡 ── */
.setup-guide-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  background: rgba(245,158,11,0.07);
  border: 1.5px solid rgba(245,158,11,0.25);
  border-radius: 14px;
  animation: fadeUp 0.3s ease both;
}
.guide-icon { font-size: 32px; flex-shrink: 0; }
.guide-body { flex: 1; }
.guide-title { font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 4px; }
.guide-desc { font-size: 12px; color: #b45309; line-height: 1.5; }
.guide-btn {
  padding: 9px 20px;
  background: #f59e0b; color: #fff;
  border: none; border-radius: 10px;
  font-size: 13px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
  transition: opacity 0.15s;
}
.guide-btn:hover { opacity: 0.88; }

/* ── 公司Banner ── */
.company-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-top: 3px solid #0071e3;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  animation: fadeUp 0.25s ease both;
}
.banner-left { flex: 1; min-width: 0; }
.company-tag {
  display: inline-flex;
  align-items: center;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: #0071e3; opacity: 0.8;
  margin-bottom: 6px;
}
.company-title {
  font-size: 22px; font-weight: 800;
  color: #1d1d1f; letter-spacing: -0.04em;
  margin: 0 0 10px; line-height: 1.2;
}
.company-title.placeholder { color: rgba(29,29,31,0.25); font-style: italic; }
.company-industry { font-size: 14px; font-weight: 500; color: rgba(29,29,31,0.4); margin-left: 4px; }
.banner-stats {
  display: flex;
  align-items: center;
  gap: 10px;
}
.bstat { display: flex; align-items: baseline; gap: 4px; }
.bstat-num {
  font-size: 15px; font-weight: 800;
  color: #1d1d1f; letter-spacing: -0.03em;
}
.bstat-num.ai-online {
  font-size: 11px;
  background: rgba(52,211,153,0.12);
  color: #059669;
  padding: 2px 9px; border-radius: 20px;
  font-weight: 700;
}
.bstat-label { font-size: 11px; color: rgba(29,29,31,0.4); }
.bstat-sep { color: rgba(29,29,31,0.2); font-size: 12px; }
.banner-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
.banner-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 9px 16px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 10px;
  background: #f5f5f7;
  font-size: 12.5px; font-weight: 600;
  color: rgba(29,29,31,0.7);
  cursor: pointer; white-space: nowrap;
  transition: all 0.15s;
}
.banner-btn:hover { background: #ebebed; color: #1d1d1f; border-color: rgba(0,0,0,0.15); }
.banner-btn.primary {
  background: #0071e3; color: #fff;
  border-color: transparent;
}
.banner-btn.primary:hover { background: #0066cc; }
.btn-icon { font-size: 13px; }

/* ── Captain 指挥台 ── */
.command-section {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid #6366f1;
  border-radius: 14px;
  padding: 20px 20px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  animation: fadeUp 0.3s 0.05s ease both;
}
.command-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 14px; margin-bottom: 16px;
}
.captain-badge {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: #6366f1;
  margin-bottom: 5px;
}
.command-title {
  font-size: 17px; font-weight: 800; color: #1d1d1f;
  letter-spacing: -0.03em; margin: 0 0 4px;
}
.command-sub { font-size: 12px; color: rgba(29,29,31,0.4); margin: 0; }
.command-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.chip-btn {
  background: #f5f5f7; border: 1px solid rgba(0,0,0,0.08);
  border-radius: 20px; padding: 5px 12px;
  font-size: 11.5px; font-weight: 500;
  color: rgba(29,29,31,0.6);
  cursor: pointer; white-space: nowrap;
  transition: all 0.15s; font-family: inherit;
}
.chip-btn:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.06); }
.command-section :deep(.captain-bar) {
  border: none !important; border-radius: 0 !important;
  box-shadow: none !important; background: transparent !important;
  margin-bottom: 0 !important;
  border-top: 1px solid rgba(0,0,0,0.06) !important;
}

/* ── 部门卡片区 ── */
.depts-section {
  display: flex; flex-direction: column; gap: 12px;
  animation: fadeUp 0.3s 0.1s ease both;
}
.section-hd { display: flex; align-items: center; gap: 10px; }
.section-title { font-size: 14px; font-weight: 700; color: #1d1d1f; margin: 0; letter-spacing: -0.02em; }
.section-sub { font-size: 11px; color: rgba(29,29,31,0.4); font-weight: 500; }

.depts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.dept-card {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  overflow: hidden;
}

.dept-card-hd {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.dept-emoji { font-size: 22px; }
.dept-info { flex: 1; }
.dept-name { font-size: 13px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.01em; }
.dept-desc { font-size: 11px; color: rgba(29,29,31,0.4); margin-top: 2px; }

.staff-list { padding: 6px 10px 10px; display: flex; flex-direction: column; gap: 2px; }

.staff-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.staff-row:hover { background: #f5f5f7; }

.staff-avatar {
  width: 32px; height: 32px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.staff-info { flex: 1; min-width: 0; }
.staff-name { display: block; font-size: 13px; font-weight: 700; color: #1d1d1f; }
.staff-role { display: block; font-size: 10.5px; color: rgba(29,29,31,0.4); margin-top: 1px; }

.staff-status {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: #16a34a; font-weight: 600;
  white-space: nowrap;
}
.status-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #34d399;
  animation: aipulse 2.5s ease-in-out infinite;
}

/* ── 底部双栏 ── */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  animation: fadeUp 0.3s 0.15s ease both;
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

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat-item { padding: 14px 12px; background: #f5f5f7; border-radius: 10px; text-align: center; }
.stat-icon { font-size: 18px; margin-bottom: 6px; }
.stat-value { font-size: 26px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(29,29,31,0.3); }

.trending-list { display: flex; flex-direction: column; }
.trending-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
.trending-item:last-child { border-bottom: none; }
.trending-rank {
  width: 18px; height: 18px; border-radius: 5px;
  background: #f5f5f7;
  font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.4);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rank-hot { background: rgba(239,68,68,0.1); color: #ef4444; }
.trending-title { flex: 1; font-size: 12.5px; color: #1d1d1f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.trending-heat { font-size: 11px; color: rgba(29,29,31,0.35); white-space: nowrap; flex-shrink: 0; }
.trending-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 20px 0; font-size: 12px; color: rgba(29,29,31,0.35); text-align: center;
}

/* 入场动画 */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes aipulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
  50% { box-shadow: 0 0 0 4px rgba(52,211,153,0.06); }
}

/* 响应式 */
@media (max-width: 900px) {
  .company-banner { flex-direction: column; align-items: flex-start; }
  .banner-actions { width: 100%; }
  .bottom-grid { grid-template-columns: 1fr; }
  .depts-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .command-header { flex-direction: column; gap: 10px; }
  .command-chips { flex-wrap: wrap; }
}
</style>
