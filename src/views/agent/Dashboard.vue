<template>
  <div class="dashboard">

    <!-- ── 品牌配置快捷栏 ── -->
    <div class="brand-config-bar" :class="{ unconfigured: !brandStore.isConfigured }" @click="$router.push('/agent/brand-settings')">
      <div class="bcb-left">
        <div class="bcb-logo" :style="brandStore.isConfigured && brandStore.brand.primaryColor ? { background: brandStore.brand.primaryColor } : {}">
          <span v-if="!brandStore.brand.logo">{{ (brandStore.brand.name || '品')[0] }}</span>
          <img v-else :src="brandStore.brand.logo" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" />
        </div>
        <div>
          <div class="bcb-name">{{ brandStore.isConfigured ? brandStore.brand.name : '未配置品牌' }}</div>
          <div class="bcb-hint">{{ brandStore.isConfigured ? (brandStore.brand.slogan || '点击编辑品牌信息') : '配置品牌信息后，AI将生成更精准的内容' }}</div>
        </div>
      </div>
      <button class="bcb-btn">{{ brandStore.isConfigured ? '编辑品牌' : '立即配置' }}</button>
    </div>

    <!-- ── Captain 指令台 ── -->
    <section class="command-section">
      <div class="command-header">
        <div class="command-title-group">
          <span class="captain-label">🎯 Captain 总指挥</span>
          <p class="command-desc">输入指令，Captain 将协调各部门完成任务</p>
        </div>
        <div class="command-chips">
          <button v-for="p in quickPrompts" :key="p" class="chip-btn" @click="fillCaptain(p)">{{ p }}</button>
        </div>
      </div>
      <CaptainBar />
    </section>

    <!-- ── Hero Banner ── -->
    <section class="hero-banner">
      <div class="hero-left">
        <div class="hero-eyebrow">
          <span class="hero-dot"></span>
          智能广告指挥中心
        </div>
        <h1 class="hero-title">{{ brandStore.isConfigured ? brandStore.brand.name : '我的公司' }}<br/><span class="hero-title-sub">全流程 AI 驱动</span></h1>
        <p class="hero-desc">Captain 统一调度 · 各部门协同作战 · 内容生产流水线全自动化</p>
        <div class="hero-actions">
          <button class="hero-btn primary" @click="$router.push('/agent/meeting')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="2" width="12" height="8" rx="2"/><path d="M4.5 13h5M7 10v3"/></svg>
            召开会议
          </button>
          <button class="hero-btn" @click="$router.push('/agent/trending')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 10L4.5 6.5L7.5 9.5L13 3"/><path d="M10 3h3v3"/></svg>
            查看热搜
          </button>
          <button class="hero-btn" @click="$router.push('/agent/publish')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M7 1v8M4.5 3.5L7 1l2.5 2.5"/><path d="M1.5 10v2.5h11V10"/></svg>
            发布管理
          </button>
        </div>
      </div>
      <!-- KPI 大数字 -->
      <div class="hero-kpi">
        <div class="kpi-item">
          <div class="kpi-value">{{ stats[0].value }}</div>
          <div class="kpi-label">已抓热搜</div>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <div class="kpi-value">{{ stats[1].value }}</div>
          <div class="kpi-label">已生文案</div>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <div class="kpi-value" :class="{ 'kpi-running': companyStatus.running > 0 }">{{ companyStatus.running > 0 ? companyStatus.running : stats[2].value }}</div>
          <div class="kpi-label">{{ companyStatus.running > 0 ? '流水线运行中' : '已发布' }}</div>
        </div>
      </div>
    </section>

    <!-- ── 部门卡片（首屏主角） ── -->
    <section class="depts-section">
      <div class="section-hd">
        <h3 class="section-title">各部门</h3>
        <span class="section-sub">点击进入对应部门工作间</span>
      </div>
      <div class="depts-row">
        <div v-for="dept in departments" :key="dept.id" class="dept-card" :style="{ '--dc': dept.color }" @click="$router.push(dept.path)">
          <div class="dept-illus" :style="{ background: dept.color }">
            <svg :viewBox="'0 0 12 12'" width="88" height="88" style="image-rendering:pixelated;opacity:0.28" v-html="deptIllus[dept.id] || deptIllus.content"></svg>
            <span class="dept-illus-label">{{ dept.name }}</span>
            <span v-if="dept.outsource" class="dept-illus-outsource">外聘</span>
          </div>
          <div class="dept-body">
            <div class="dept-card-top">
              <div class="dept-icon-wrap"><component :is="dept.icon" /></div>
              <span class="dept-status-dot"></span>
            </div>
            <div class="dept-name">{{ dept.name }}</div>
            <div class="dept-desc">{{ dept.desc }}</div>
            <div class="dept-enter-btn">进入 <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 6h8M7 3l3 3-3 3"/></svg></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 实时动态长条 ── -->
    <AgentLiveFeed class="live-feed-strip" />

    <!-- ── 今日热搜快览 ── -->
    <div class="trending-panel">
      <div class="panel-hd">
        <span class="panel-title">今日热搜快览</span>
        <router-link to="/agent/trending" class="panel-link">查看全部 <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 5.5h7M6 3l3 2.5L6 8"/></svg></router-link>
      </div>
      <div class="trending-list" v-if="topTrending.length > 0">
        <div v-for="(item, i) in topTrending" :key="i" class="trending-item">
          <span class="trending-rank" :class="i < 3 ? 'rank-hot' : ''">{{ i + 1 }}</span>
          <span class="trending-title">{{ item.title }}</span>
          <span v-if="item.category" class="trending-cate">{{ item.category }}</span>
          <span class="trending-heat">{{ item.heat }}</span>
        </div>
      </div>
      <div class="trending-empty" v-else>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="opacity:.25"><path d="M2 14h4l3.5-10 5 20 3.5-10H26"/></svg>
        <div>暂无热搜数据</div>
        <router-link to="/agent/trending" class="panel-link" style="margin-top:6px">去情报部抓取 →</router-link>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import { useTrendingStore } from '@/stores/agent'
import { useBrandStore } from '@/stores/brand'
import { useMeetingStore } from '@/stores/meeting'
import CaptainBar from '@/components/CaptainBar.vue'
import AgentLiveFeed from '@/components/agent/AgentLiveFeed.vue'

const agentStore = useTrendingStore()
const brandStore = useBrandStore()
const meetingStore = useMeetingStore()

// 今日日期
const todayLabel = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

// Captain 快捷指令
const quickPrompts = ['策划新品上线方案', '分析热搜生成推广方向', '制定本周内容计划']

function fillCaptain(text: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: text }))
}

// 今日数据
const stats = computed(() => [
  { type: 'trending', value: Object.values(agentStore.trending).reduce((s, a) => s + a.length, 0), label: '已抓热搜' },
  { type: 'copy',    value: agentStore.copywritingResults.length, label: '已生文案' },
  { type: 'publish', value: agentStore.history.filter(h => h.status === 'published').length, label: '已发布' },
])

// 部门图标组件（内联SVG细线条）
const IconContent  = defineComponent({ render: () => h('svg', { width:18, height:18, viewBox:'0 0 18 18', fill:'none', stroke:'currentColor', 'stroke-width':'1.5', 'stroke-linecap':'round' }, [
  h('rect', { x:3, y:2, width:12, height:14, rx:2 }),
  h('path', { d:'M6 6h6M6 9h6M6 12h4' }),
]) })
const IconCreative = defineComponent({ render: () => h('svg', { width:18, height:18, viewBox:'0 0 18 18', fill:'none', stroke:'currentColor', 'stroke-width':'1.5', 'stroke-linecap':'round' }, [
  h('circle', { cx:9, cy:9, r:3.5 }),
  h('path', { d:'M9 1v3M9 14v3M1 9h3M14 9h3' }),
]) })
const IconBrand    = defineComponent({ render: () => h('svg', { width:18, height:18, viewBox:'0 0 18 18', fill:'none', stroke:'currentColor', 'stroke-width':'1.5', 'stroke-linejoin':'round' }, [
  h('path', { d:'M9 2l2 5h5.5L12 10.5l1.5 5L9 13l-4.5 2.5L6 10.5 1.5 7H7L9 2z' }),
]) })
const IconTrending = defineComponent({ render: () => h('svg', { width:18, height:18, viewBox:'0 0 18 18', fill:'none', stroke:'currentColor', 'stroke-width':'1.5', 'stroke-linecap':'round', 'stroke-linejoin':'round' }, [
  h('path', { d:'M1 13L5.5 8.5L9 12L16 4' }),
  h('path', { d:'M13 4h3v3' }),
]) })
const IconPublish  = defineComponent({ render: () => h('svg', { width:18, height:18, viewBox:'0 0 18 18', fill:'none', stroke:'currentColor', 'stroke-width':'1.5', 'stroke-linecap':'round', 'stroke-linejoin':'round' }, [
  h('path', { d:'M9 2v10M6 5l3-3 3 3' }),
  h('path', { d:'M2 13v3h14v-3' }),
]) })

// 各部门专属像素风插画（12x12 viewBox，白色像素块）
const deptIllus: Record<string, string> = {
  content:   `<rect x="2" y="1" width="5" height="1" fill="white"/><rect x="1" y="2" width="1" height="7" fill="white"/><rect x="6" y="2" width="1" height="7" fill="white"/><rect x="2" y="9" width="5" height="1" fill="white"/><rect x="2" y="3" width="4" height="1" fill="white"/><rect x="2" y="5" width="4" height="1" fill="white"/><rect x="2" y="7" width="3" height="1" fill="white"/><rect x="8" y="2" width="3" height="1" fill="white"/><rect x="8" y="4" width="3" height="1" fill="white"/><rect x="8" y="6" width="2" height="1" fill="white"/>`,
  creative:  `<rect x="4" y="1" width="4" height="1" fill="white"/><rect x="3" y="2" width="1" height="1" fill="white"/><rect x="8" y="2" width="1" height="1" fill="white"/><rect x="2" y="3" width="1" height="4" fill="white"/><rect x="9" y="3" width="1" height="2" fill="white"/><rect x="2" y="7" width="1" height="1" fill="white"/><rect x="3" y="8" width="3" height="1" fill="white"/><rect x="7" y="6" width="3" height="1" fill="white"/><rect x="6" y="7" width="1" height="3" fill="white"/><rect x="7" y="9" width="3" height="1" fill="white"/><rect x="4" y="4" width="1" height="1" fill="white"/><rect x="6" y="3" width="1" height="1" fill="white"/>`,
  brand:     `<rect x="5" y="1" width="2" height="2" fill="white"/><rect x="1" y="4" width="10" height="2" fill="white"/><rect x="3" y="6" width="2" height="1" fill="white"/><rect x="7" y="6" width="2" height="1" fill="white"/><rect x="2" y="7" width="2" height="2" fill="white"/><rect x="8" y="7" width="2" height="2" fill="white"/><rect x="5" y="8" width="2" height="1" fill="white"/>`,
  intel:     `<rect x="1" y="8" width="1" height="1" fill="white"/><rect x="2" y="7" width="1" height="1" fill="white"/><rect x="3" y="6" width="1" height="1" fill="white"/><rect x="4" y="5" width="1" height="1" fill="white"/><rect x="5" y="6" width="1" height="1" fill="white"/><rect x="6" y="5" width="1" height="1" fill="white"/><rect x="7" y="4" width="1" height="1" fill="white"/><rect x="8" y="3" width="1" height="1" fill="white"/><rect x="9" y="2" width="2" height="1" fill="white"/><rect x="10" y="2" width="1" height="3" fill="white"/><rect x="1" y="9" width="10" height="1" fill="white"/>`,
  publish:   `<rect x="5" y="1" width="2" height="1" fill="white"/><rect x="4" y="2" width="1" height="1" fill="white"/><rect x="7" y="2" width="1" height="1" fill="white"/><rect x="3" y="3" width="1" height="1" fill="white"/><rect x="8" y="3" width="1" height="1" fill="white"/><rect x="5" y="1" width="2" height="5" fill="white"/><rect x="2" y="6" width="8" height="1" fill="white"/><rect x="2" y="7" width="3" height="2" fill="white"/><rect x="7" y="7" width="3" height="2" fill="white"/><rect x="2" y="9" width="8" height="1" fill="white"/>`,
  marketing: `<rect x="1" y="7" width="2" height="3" fill="white"/><rect x="4" y="5" width="2" height="5" fill="white"/><rect x="7" y="3" width="2" height="7" fill="white"/><rect x="1" y="10" width="10" height="1" fill="white"/><rect x="10" y="4" width="1" height="1" fill="white"/><rect x="11" y="3" width="1" height="1" fill="white"/>`,
  designer:  `<rect x="1" y="1" width="6" height="4" fill="white"/><rect x="2" y="2" width="4" height="2" fill="none"/><rect x="8" y="3" width="1" height="6" fill="white"/><rect x="7" y="4" width="1" height="1" fill="white"/><rect x="9" y="4" width="1" height="1" fill="white"/><rect x="8" y="9" width="1" height="2" fill="white"/><rect x="1" y="6" width="6" height="4" fill="white"/>`,
}

// 公司今日状态
const companyStatus = computed(() => {
  const totalOutput = agentStore.copywritingResults.length +
    Object.values(agentStore.trending).reduce((s: number, a: any[]) => s + a.length, 0)
  const running = meetingStore?.isRunning ? 1 : 0
  return { totalOutput, running }
})

// 7个部门定义
const departments = [
  {
    id: 'content',
    name: '内容部',
    desc: '文案·视频全链路内容生产',
    emoji: '✍️',
    color: '#f59e0b',
    path: '/agent/content',
    icon: IconContent,
  },
  {
    id: 'creative',
    name: '创意部',
    desc: '海报·视觉设计·创意策略',
    emoji: '🎨',
    color: '#ec4899',
    path: '/agent/creative',
    icon: IconCreative,
  },
  {
    id: 'brand',
    name: '品牌部',
    desc: '品牌战略·调性把控·竞品分析',
    emoji: '💎',
    color: '#8b5cf6',
    path: '/agent/brand',
    icon: IconBrand,
  },
  {
    id: 'intel',
    name: '情报部',
    desc: '热点追踪·趋势分析·选题建议',
    emoji: '📈',
    color: '#06b6d4',
    path: '/agent/trending',
    icon: IconTrending,
  },
  {
    id: 'publish',
    name: '发布部',
    desc: '多平台排期·发布计划·数据复盘',
    emoji: '🚀',
    color: '#10b981',
    path: '/agent/publish',
    icon: IconPublish,
  },
  {
    id: 'marketing',
    name: '营销顾问',
    desc: '营销战略·客户分析·定价策略·SWOT',
    emoji: '📊',
    color: '#059669',
    path: '/agent/marketing',
    icon: IconTrending,
    outsource: true,
  },
  {
    id: 'designer',
    name: '平面设计师',
    desc: '海报·Banner·Logo·包装·社媒图',
    emoji: '🎨',
    color: '#e11d48',
    path: '/agent/designer',
    icon: IconCreative,
    outsource: true,
  },
]

// 今日热搜快览
const topTrending = computed(() => {
  const douyin = agentStore.trending.douyin || []
  const xhs = agentStore.trending.xiaohongshu || []
  return (douyin.length > 0 ? douyin : xhs).slice(0, 6)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;

/* ── 品牌配置快捷栏 ── */
.brand-config-bar {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 18px;
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  cursor: pointer; transition: box-shadow 0.15s;
}
.brand-config-bar:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.bcb-hint { font-size: 11px; color: #AAAAAA; }
.bcb-btn {
  padding: 6px 14px; border-radius: 8px; flex-shrink: 0;
  border: 1px solid #E8E8E8; background: #F8F8F6;
  font-size: 12px; font-weight: 600; color: #555; cursor: pointer;
  font-family: inherit; transition: all 0.15s;
}
.bcb-btn:hover { border-color: #0071e3; color: #0071e3; background: rgba(0,113,227,0.04); }
.brand-config-bar.unconfigured .bcb-btn { border-color: rgba(245,158,11,0.4); color: #d97706; background: rgba(245,158,11,0.06); }
.brand-config-bar.unconfigured { background: rgba(245,158,11,0.04); border-color: rgba(245,158,11,0.2); }
.bcb-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.bcb-logo {
  width: 32px; height: 32px; border-radius: 8px;
  background: #0071e3; color: #fff;
  font-size: 14px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.bcb-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.bcb-name { font-size: 13px; font-weight: 700; color: #1A1A1A; }
.bcb-meta { font-size: 11px; color: #AAAAAA; }
.bcb-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #666666; flex-shrink: 0; }
.bcb-dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; animation: bcbpulse 2.5s ease-in-out infinite; }
@keyframes bcbpulse { 0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); } 50% { box-shadow: 0 0 0 4px rgba(52,211,153,0.05); } }
.bcb-edit-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid #E8E8E8; background: #F8F8F6;
  font-size: 11px; font-weight: 600; color: #666666;
  cursor: pointer; font-family: inherit; transition: all 0.15s; flex-shrink: 0;
}
.bcb-edit-btn:hover { border-color: #0071e3; color: #0071e3; background: rgba(0,113,227,0.04); }
.bcb-warn { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #b45309; flex: 1; }
.bcb-setup-btn {
  padding: 7px 16px; border-radius: 8px;
  background: #f59e0b; color: #fff; border: none;
  font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit;
  flex-shrink: 0; transition: opacity 0.15s;
}
.bcb-setup-btn:hover { opacity: 0.88; }

/* ── Hero Banner ── */
.hero-banner {
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
  padding: 28px 30px;
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-radius: 18px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  animation: fadeUp 0.25s ease both;
}
.hero-left { flex: 1; min-width: 0; }
.hero-eyebrow {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700; color: #AAAAAA;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 10px;
}
.hero-dot { width: 6px; height: 6px; border-radius: 50%; background: #0071e3; animation: bcbpulse 2s ease-in-out infinite; }
.hero-title {
  font-size: 28px; font-weight: 800; color: #1A1A1A;
  letter-spacing: -0.04em; line-height: 1.15; margin: 0 0 8px;
}
.hero-title-sub { font-size: 20px; color: #0071e3; font-weight: 700; }
.hero-desc { font-size: 13px; color: #888888; margin: 0 0 18px; line-height: 1.5; }
.hero-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.hero-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 10px;
  border: 1px solid #E8E8E8; background: #F8F8F6;
  font-size: 13px; font-weight: 600; color: #444444;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.hero-btn:hover { background: #EFEFED; color: #1A1A1A; }
.hero-btn.primary { background: #0071e3; color: #fff; border-color: transparent; }
.hero-btn.primary:hover { background: #0066cc; }

/* KPI 大数字 */
.hero-kpi {
  display: flex; align-items: center; gap: 0;
  background: #F8F8F6; border-radius: 14px;
  padding: 20px 24px; flex-shrink: 0;
}
.kpi-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0 20px; }
.kpi-value { font-size: 36px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.05em; line-height: 1; }
.kpi-value.kpi-running { color: #0071e3; animation: kpipulse 1.5s ease-in-out infinite; }
@keyframes kpipulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
.kpi-label { font-size: 11px; font-weight: 700; color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.06em; }
.kpi-divider { width: 1px; height: 40px; background: #E8E8E8; flex-shrink: 0; }

/* ── bottom-grid ── */
.command-section {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid #6366f1;
  border-radius: 14px;
  padding: 18px 18px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}
.live-feed-strip {
  width: 100%;
}
.feed-aside { display: flex; flex-direction: column; gap: 0; }
  padding-bottom: 40px;
  max-width: 1200px;
}

/* ── 品牌配置引导卡 ── */
.setup-guide-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  background: rgba(245,158,11,0.06);
  border: 1.5px solid rgba(245,158,11,0.22);
  border-radius: 14px;
  animation: fadeUp 0.3s ease both;
}
.guide-icon-wrap { flex-shrink: 0; }
.guide-body { flex: 1; }
.guide-title { font-size: 13.5px; font-weight: 700; color: #92400e; margin-bottom: 4px; }
.guide-desc { font-size: 12px; color: #b45309; line-height: 1.5; }
.guide-btn {
  padding: 9px 20px;
  background: #f59e0b; color: #fff;
  border: none; border-radius: 10px;
  font-size: 13px; font-weight: 700; font-family: inherit;
  cursor: pointer; white-space: nowrap;
  transition: opacity 0.15s;
}
.guide-btn:hover { opacity: 0.88; }

/* ── 顶部横幅 ── */
.company-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-top: 3px solid #0071e3;
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  animation: fadeUp 0.25s ease both;
}
.banner-left { flex: 1; min-width: 0; }
.banner-meta { display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
.banner-company { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #0071e3; }
.banner-industry { font-size: 10px; color: rgba(29,29,31,0.4); }
.banner-title { font-size: 22px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.04em; margin: 0 0 10px; line-height: 1.2; }
.banner-sub-row { display: flex; align-items: center; gap: 8px; }
.banner-date { font-size: 12px; color: rgba(29,29,31,0.4); }
.banner-sep { color: rgba(29,29,31,0.2); }
.ai-online-badge { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: #059669; }
.ai-online-dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; animation: aipulse 2.5s ease-in-out infinite; }

.banner-quick-actions { display: flex; gap: 8px; flex-shrink: 0; }
.bqa-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 10px;
  background: #f5f5f7;
  font-size: 12.5px; font-weight: 600;
  color: rgba(29,29,31,0.7);
  cursor: pointer; white-space: nowrap; font-family: inherit;
  transition: all 0.15s;
}
.bqa-btn:hover { background: #ebebed; color: #1d1d1f; }
.bqa-btn.primary { background: #0071e3; color: #fff; border-color: transparent; }
.bqa-btn.primary:hover { background: #0066cc; }

/* ── 中部网格 ── */
.mid-grid {
  display: grid;
  grid-template-columns: 1fr minmax(200px, 240px);
  gap: 14px;
  animation: fadeUp 0.3s 0.05s ease both;
}

/* Captain 指挥台 */
.command-section {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid #6366f1;
  border-radius: 14px;
  padding: 18px 18px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}
.command-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px; margin-bottom: 14px;
}
.captain-label {
  display: block;
  font-size: 13px; font-weight: 800; color: #1d1d1f;
  letter-spacing: -0.02em; margin-bottom: 3px;
}
.command-desc { font-size: 11px; color: rgba(29,29,31,0.4); margin: 0; }
.command-chips { display: flex; gap: 5px; flex-wrap: wrap; align-items: flex-start; }
.chip-btn {
  background: #f5f5f7; border: 1px solid rgba(0,0,0,0.08);
  border-radius: 20px; padding: 4px 10px;
  font-size: 11px; font-weight: 500; color: rgba(29,29,31,0.6);
  cursor: pointer; white-space: nowrap; font-family: inherit;
  transition: all 0.15s;
}
.chip-btn:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.06); }
.command-section :deep(.captain-bar) {
  border: none !important; border-radius: 0 !important;
  box-shadow: none !important; background: transparent !important;
  margin-bottom: 0 !important;
  border-top: 1px solid rgba(0,0,0,0.06) !important;
}

/* 今日数据侧栏 */
.stats-aside {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.stats-aside-title { font-size: 12px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px; letter-spacing: -0.01em; }
.stats-cards { display: flex; flex-direction: column; gap: 8px; }
.stat-card {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 12px;
  background: #f5f5f7; border-radius: 10px;
}
.stat-card-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(0,113,227,0.08); display: flex; align-items: center; justify-content: center; color: #0071e3; flex-shrink: 0; }
.stat-card-value { font-size: 20px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.04em; line-height: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stat-card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(29,29,31,0.35); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── 部门入口卡片横排 ── */
.depts-section {
  display: flex; flex-direction: column; gap: 10px;
  animation: fadeUp 0.3s 0.1s ease both;
}
.section-hd { display: flex; align-items: center; gap: 10px; }
.section-title { font-size: 13px; font-weight: 700; color: #1d1d1f; margin: 0; }
.section-sub { font-size: 11px; color: rgba(29,29,31,0.4); }

.depts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.dept-card {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 0;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.dept-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.09); }

/* 像素风插画头图 */
.dept-illus {
  height: 130px;
  border-radius: 12px 12px 0 0;
  background: var(--dc);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dept-illus-label {
  position: absolute;
  top: 10px;
  left: 12px;
  font-family: monospace;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: rgba(255,255,255,0.85);
  text-transform: uppercase;
}
.dept-illus-outsource {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 9px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  border: 1px dashed rgba(255,255,255,0.5);
  border-radius: 4px;
  padding: 1px 5px;
  letter-spacing: 0.05em;
}

/* 公司状态栏 */
.company-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-radius: 10px;
  font-size: 12px;
  color: #666666;
  animation: fadeUp 0.2s ease both;
}
.csb-item { display: flex; align-items: center; gap: 5px; }
.csb-item strong { color: #1A1A1A; font-weight: 700; }
.csb-item.csb-active { color: #0071e3; }
.csb-sep { color: #CCCCCC; }
.csb-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.csb-dot-green { background: #34d399; }
.csb-dot-blue  { background: #0071e3; }
.csb-dot-gray  { background: #CCCCCC; }
.csb-pulse { animation: aipulse 2s ease-in-out infinite; }

/* 卡片内容区 */
.dept-body {
  padding: 14px 16px 14px;
  display: flex; flex-direction: column; gap: 6px;
}

.dept-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.dept-icon-wrap {
  width: 34px; height: 34px; border-radius: 9px;
  background: color-mix(in srgb, var(--dc, #0071e3) 10%, white);
  display: flex; align-items: center; justify-content: center;
  color: var(--dc, #0071e3);
}
.dept-status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #34d399;
  animation: aipulse 2.5s ease-in-out infinite;
}
.dept-name { font-size: 13px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.01em; }
.dept-desc { font-size: 11px; color: rgba(29,29,31,0.45); line-height: 1.4; flex: 1; }
.dept-enter-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 700; color: var(--dc, #0071e3);
  margin-top: 6px;
}

/* ── 热搜快览 ── */
.trending-panel {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
  padding: 18px;
  animation: fadeUp 0.3s 0.15s ease both;
}
.panel-hd {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.panel-title { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.panel-link {
  display: flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 600; color: #0071e3; text-decoration: none;
}
.panel-link:hover { opacity: 0.75; }

.trending-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
.trending-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 8px;
  transition: background 0.1s;
}
.trending-item:hover { background: #f5f5f7; }
.trending-rank {
  width: 18px; height: 18px; border-radius: 5px;
  background: #f5f5f7;
  font-size: 10.5px; font-weight: 700; color: rgba(29,29,31,0.4);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rank-hot { background: rgba(239,68,68,0.1); color: #ef4444; }
.trending-title { flex: 1; font-size: 12.5px; color: #1d1d1f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.trending-cate {
  font-size: 10px; color: rgba(29,29,31,0.35);
  background: #f5f5f7; padding: 2px 6px; border-radius: 4px;
  white-space: nowrap; flex-shrink: 0;
}
.trending-heat { font-size: 11px; color: rgba(29,29,31,0.3); white-space: nowrap; flex-shrink: 0; }
.trending-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 20px 0; font-size: 12px; color: rgba(29,29,31,0.35); text-align: center; gap: 6px;
}

/* 动画 */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes aipulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
  50% { box-shadow: 0 0 0 4px rgba(52,211,153,0.06); }
}

/* 响应式 */
@media (max-width: 1200px) {
}
@media (max-width: 1100px) {
}
@media (max-width: 900px) {
  .mid-grid { grid-template-columns: 1fr; }
  .company-banner { flex-direction: column; align-items: flex-start; }
  .banner-quick-actions { width: 100%; }
  .trending-list { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .trending-list { grid-template-columns: 1fr; }
}

/* ── 移动端适配优化 ── */
@media (max-width: 768px) {
  .dashboard { padding: 12px; }
  
  /* 品牌配置栏 */
  .brand-config-bar { flex-direction: column; gap: 12px; padding: 14px; }
  .bcb-left { width: 100%; }
  .bcb-btn { width: 100%; }
  
  /* 指令台 */
  .command-section { padding: 16px; }
  .command-header { flex-direction: column; gap: 12px; }
  .command-chips { flex-wrap: wrap; }
  
  /* Hero Banner */
  .hero-banner { flex-direction: column; padding: 20px; }
  .hero-left { width: 100%; }
  .hero-title { font-size: 22px; line-height: 1.3; }
  .hero-title br { display: none; }
  .hero-actions { flex-direction: column; gap: 8px; }
  .hero-btn { width: 100%; justify-content: center; }
  
  /* 中间网格 */
  .mid-grid { grid-template-columns: 1fr; gap: 12px; }
  
  /* 公司横幅 */
  .company-banner { flex-direction: column; padding: 16px; gap: 12px; }
  .banner-quick-actions { width: 100%; justify-content: stretch; }
  .banner-quick-actions button { flex: 1; }
  
  /* 热搜列表 */
  .trending-list { grid-template-columns: 1fr; }
  
  /* 部门卡片 */
  .dept-grid { grid-template-columns: 1fr; gap: 12px; }
  .dept-card { padding: 16px; }
  
  /* 状态网格 */
  .status-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .status-card { padding: 12px; }
  .status-value { font-size: 20px; }
}

@media (max-width: 480px) {
  .hero-title { font-size: 18px; }
  .hero-desc { font-size: 13px; }
  .status-grid { grid-template-columns: 1fr; }
}
</style>
