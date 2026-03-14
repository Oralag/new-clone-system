<template>
  <div class="agent-layout" :data-theme="theme">
    <aside v-if="!isMobile" class="agent-sidebar">
      <div class="sidebar-logo">
        <div class="logo-mark">
          <img src="/nomad-logo.png" alt="数字游牧" class="logo-mark-img" />
        </div>
        <span class="logo-text">Nomad Agent</span>
      </div>

      <div class="brand-card" @click="router.push('/agent/brand')">
        <div v-if="brandStore.isConfigured" class="brand-configured">
          <div class="brand-avatar">{{ brandStore.brand.name.charAt(0) }}</div>
          <div class="brand-info">
            <div class="brand-name">{{ brandStore.brand.name }}</div>
            <div class="brand-sub">{{ brandStore.brand.subIndustry || brandStore.brand.industry || '未设置行业' }}</div>
          </div>
          <svg class="brand-edit-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
          </svg>
        </div>
        <div v-else class="brand-unconfigured">
          <div class="warn-dot"></div>
          <span>配置品牌信息</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-label">工作流</div>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
        >
          <div class="nav-icon-wrap"><component :is="item.icon" /></div>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-workflow">
        <div class="nav-section-label">自动化流程</div>
        <div class="workflow-list">
          <div v-for="(step, i) in workflowSteps" :key="i" class="workflow-step">
            <div class="step-node">{{ i + 1 }}</div>
            <div class="step-body">
              <div class="step-name">{{ step.label }}</div>
              <div class="step-detail">{{ step.detail }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar-platforms">
        <div class="nav-section-label">发布平台</div>
        <div v-for="platform in platforms" :key="platform.key" class="platform-row">
          <span class="platform-name">{{ platform.emoji }} {{ platform.name }}</span>
          <span class="platform-badge" :class="platform.tier">{{ platform.tier === 'primary' ? '主要' : '次要' }}</span>
        </div>
      </div>

      <div class="sidebar-footer">
        <router-link to="/agent/history" class="nav-item" active-class="nav-item--active">
          <div class="nav-icon-wrap"><IconHistory /></div>
          <span class="nav-label">历史记录</span>
        </router-link>
        <router-link to="/portal" class="nav-item footer-back">
          <div class="nav-icon-wrap"><IconBack /></div>
          <span class="nav-label">返回主页</span>
        </router-link>
      </div>
    </aside>

    <div v-if="isMobile" class="agent-mobile-topbar">
      <button class="mobile-menu-btn" @click="drawerOpen = true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <span class="mobile-agent-title">{{ currentPageTitle }}</span>
      <div class="theme-switch-mini">
        <button class="theme-btn" :class="{ active: theme === 'light' }" @click="setTheme('light')">白</button>
        <button class="theme-btn" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">黑</button>
      </div>
    </div>

    <el-drawer v-if="isMobile" v-model="drawerOpen" direction="ltr" size="75%" :with-header="false">
      <div class="mobile-drawer-inner">
        <div class="drawer-logo-row">
          <div class="logo-mark">
            <img src="/nomad-logo.png" alt="数字游牧" class="logo-mark-img" />
          </div>
          <span class="logo-text">Nomad Agent</span>
        </div>
        <div style="padding: 8px 0">
          <router-link
            v-for="item in mobileNavItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            active-class="nav-item--active"
            @click="drawerOpen = false"
          >
            <div class="nav-icon-wrap"><component :is="item.icon" /></div>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>
      </div>
    </el-drawer>

    <main class="agent-main">
      <header v-if="!isMobile" class="agent-topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">{{ currentPageTitle }}</h1>
          <div v-if="brandStore.isConfigured" class="topbar-brand-pill">{{ brandStore.brand.name }}</div>
        </div>
        <div class="topbar-right">
          <div class="status-indicator">
            <span class="status-dot"></span>
            <span class="status-text">AI 在线</span>
          </div>
          <div class="theme-switch">
            <button class="theme-btn" :class="{ active: theme === 'light' }" @click="setTheme('light')">白</button>
            <button class="theme-btn" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">黑</button>
          </div>
        </div>
      </header>

      <div v-if="showBrandBanner" class="brand-banner">
        <span>⚠️ 尚未配置品牌信息，AI 生成效果将受限。</span>
        <button class="banner-btn" @click="router.push('/agent/brand')">立即配置</button>
        <button class="banner-close" @click="showBrandBanner = false">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <section class="agent-content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'

const route = useRoute()
const router = useRouter()
const brandStore = useBrandStore()

const THEME_KEY = 'agent_theme'
const drawerOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)
const showBrandBanner = ref(!brandStore.isConfigured)
const theme = ref<'light' | 'dark'>('light')

watch(() => brandStore.isConfigured, value => {
  if (value) showBrandBanner.value = false
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
  const savedTheme = localStorage.getItem(THEME_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') theme.value = savedTheme
})

onUnmounted(() => window.removeEventListener('resize', handleResize))

function handleResize() { isMobile.value = window.innerWidth < 768 }
function setTheme(value: 'light' | 'dark') { theme.value = value; localStorage.setItem(THEME_KEY, value) }

const IconDashboard = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [h('rect', { x: 1, y: 1, width: 5, height: 5, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 }), h('rect', { x: 8, y: 1, width: 5, height: 5, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 }), h('rect', { x: 1, y: 8, width: 5, height: 5, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 }), h('rect', { x: 8, y: 8, width: 5, height: 5, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 })]) })
const IconTrending = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [h('path', { d: 'M1 10L5 6L8 9L13 3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), h('path', { d: 'M10 3h3v3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })]) })
const IconCopywriting = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [h('path', { d: 'M3 4h8v8H3z', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linejoin': 'round' }), h('path', { d: 'M5 4V2h6v6H9', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linejoin': 'round' })]) })
const IconVideo = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [h('rect', { x: 1, y: 3, width: 9, height: 8, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 }), h('path', { d: 'M10 6l3-2v6l-3-2V6Z', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linejoin': 'round' })]) })
const IconPoster = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [h('rect', { x: 1, y: 1, width: 12, height: 12, rx: 2, stroke: 'currentColor', 'stroke-width': 1.3 }), h('rect', { x: 3, y: 3, width: 5, height: 4, rx: 1, stroke: 'currentColor', 'stroke-width': 1.1 }), h('path', { d: 'M9 4h2M9 6.5h2M3 9h8M3 11h6', stroke: 'currentColor', 'stroke-width': 1.1, 'stroke-linecap': 'round' })]) })
const IconPublish = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [h('path', { d: 'M7 1v8M4 4L7 1l3 3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), h('path', { d: 'M2 10v2h10v-2', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })]) })
const IconHistory = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [h('path', { d: 'M2.5 7A4.5 4.5 0 117 11.5', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round' }), h('path', { d: 'M2.5 3.5v3h3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), h('path', { d: 'M7 4.3v2.9l2 1.2', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })]) })
const IconBack = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [h('path', { d: 'M9 2L4 7l5 5', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })]) })
const IconLab = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [
  h('path', { d: 'M5 1v4L2 10a1 1 0 001 1h8a1 1 0 001-1L9 5V1', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M4 1h6', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
  h('circle', { cx: 5.5, cy: 8, r: 1, fill: 'currentColor', opacity: 0.7 }),
  h('circle', { cx: 8.5, cy: 9, r: 0.8, fill: 'currentColor', opacity: 0.5 }),
]) })

const navItems = [
  { path: '/agent', icon: IconDashboard, label: '工作台' },
  { path: '/agent/trending', icon: IconTrending, label: '热搜抓取' },
  { path: '/agent/copywriting', icon: IconCopywriting, label: '文案生成' },
  { path: '/agent/poster', icon: IconPoster, label: '图文海报' },
  { path: '/agent/video', icon: IconVideo, label: '视频生成' },
  { path: '/agent/creative-lab', icon: IconLab, label: 'AI创意实验室' },
  { path: '/agent/publish', icon: IconPublish, label: '发布管理' },
]

const mobileNavItems = [
  { path: '/agent/brand', icon: IconDashboard, label: '品牌设置' },
  ...navItems,
  { path: '/agent/history', icon: IconHistory, label: '历史记录' },
]

const platforms = [
  { key: 'douyin', name: '抖音', emoji: '🎵', tier: 'primary' },
  { key: 'xiaohongshu', name: '小红书', emoji: '📕', tier: 'primary' },
  { key: 'kuaishou', name: '快手', emoji: '⚡', tier: 'primary' },
  { key: 'weibo', name: '微博', emoji: '🌐', tier: 'secondary' },
  { key: 'bilibili', name: 'B站', emoji: '📺', tier: 'secondary' },
  { key: 'zhihu', name: '知乎', emoji: '💡', tier: 'secondary' },
]

const workflowSteps = [
  { label: '热搜抓取', detail: '实时获取各平台热点' },
  { label: 'AI 分析', detail: '匹配品牌内容方向' },
  { label: '文案生成', detail: '多平台定制文案' },
  { label: '图文海报', detail: 'AI 生成视觉素材' },
  { label: '视频脚本', detail: '短视频分镜设计' },
  { label: '人工审核', detail: '品牌调性把关' },
  { label: '定时发布', detail: '同步发布各平台' },
]

const pageTitleMap: Record<string, string> = {
  '/agent': '工作台',
  '/agent/brand': '品牌设置',
  '/agent/trending': '热搜抓取',
  '/agent/copywriting': '文案生成',
  '/agent/video': '视频生成',
  '/agent/creative-lab': 'AI 创意实验室',
  '/agent/publish': '发布管理',
  '/agent/history': '历史记录',
}

const currentPageTitle = computed(() => pageTitleMap[route.path] || '智能体工作流')
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.agent-layout {
  display: flex;
  height: 100vh;
  background: #f5f5f7;
  color: #1d1d1f;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Sidebar ── */
.agent-sidebar {
  width: 232px;
  background: #ffffff;
  border-right: 1px solid rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}
.agent-sidebar::-webkit-scrollbar { width: 0; }

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 18px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.logo-mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-mark-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 7px;
}

.logo-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1d1d1f;
}

/* Brand card */
.brand-card {
  margin: 12px 12px 0;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.07);
  background: #f5f5f7;
  cursor: pointer;
  transition: all 0.18s;
}
.brand-card:hover { background: #e8e8ed; }

.brand-configured { display: flex; align-items: center; gap: 9px; }

.brand-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #1d1d1f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.brand-info { flex: 1; overflow: hidden; }
.brand-name { font-size: 12px; font-weight: 600; color: #1d1d1f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.brand-sub { font-size: 11px; color: rgba(29,29,31,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.brand-edit-icon { color: rgba(29,29,31,0.3); flex-shrink: 0; }

.brand-unconfigured { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(29,29,31,0.4); font-weight: 500; }
.warn-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; flex-shrink: 0; }

/* Nav */
.sidebar-nav { padding: 12px 10px 0; flex: 1; }

.nav-section-label {
  padding: 0 8px 6px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(29,29,31,0.28);
  margin-top: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: rgba(29,29,31,0.45);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
  cursor: pointer;
  margin-bottom: 1px;
  letter-spacing: -0.01em;
}
.nav-item:hover { background: #f5f5f7; color: #1d1d1f; }
.nav-item--active { background: #f5f5f7; color: #1d1d1f; font-weight: 600; }
.nav-item--active .nav-icon-wrap { color: #0071e3; }

.nav-icon-wrap { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nav-label { flex: 1; }

/* Workflow */
.sidebar-workflow { padding: 4px 10px 8px; }

.workflow-list {
  display: flex;
  flex-direction: column;
  padding-left: 22px;
  position: relative;
}
.workflow-list::before {
  content: '';
  position: absolute;
  left: 17px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: rgba(0,0,0,0.07);
}

.workflow-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 10px;
  position: relative;
}
.workflow-step:last-child { padding-bottom: 0; }

.step-node {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(0,113,227,0.1);
  border: 1px solid rgba(0,113,227,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 700;
  color: #0071e3;
  flex-shrink: 0;
  position: absolute;
  left: -22px;
  top: 2px;
}

.step-body { padding-top: 0; }
.step-name { font-size: 11.5px; font-weight: 600; color: rgba(29,29,31,0.75); margin-bottom: 1px; }
.step-detail { font-size: 10px; color: rgba(29,29,31,0.35); line-height: 1.4; }

/* Platforms */
.sidebar-platforms { padding: 4px 10px 8px; }
.platform-row { display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; }
.platform-name { font-size: 12px; color: rgba(29,29,31,0.45); font-weight: 500; }
.platform-badge { font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
.platform-badge.primary { background: rgba(0,113,227,0.08); color: #0071e3; }
.platform-badge.secondary { background: #f5f5f7; color: rgba(29,29,31,0.4); }

/* Footer */
.sidebar-footer { padding: 8px 10px 14px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 1px; }
.footer-back { color: rgba(29,29,31,0.3); }
.footer-back:hover { color: #1d1d1f; }

/* ── Main ── */
.agent-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f5f7;
}

.agent-topbar {
  height: 54px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  flex-shrink: 0;
}

.topbar-left { display: flex; align-items: center; gap: 12px; }

.topbar-title {
  font-size: 15px;
  font-weight: 700;
  color: #1d1d1f;
  margin: 0;
  letter-spacing: -0.02em;
}

.topbar-brand-pill {
  font-size: 11px;
  color: #0071e3;
  background: rgba(0,113,227,0.08);
  border: 1px solid rgba(0,113,227,0.15);
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.topbar-right { display: flex; align-items: center; gap: 14px; }

.theme-switch, .theme-switch-mini {
  display: inline-flex;
  background: #f5f5f7;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
}

.theme-btn {
  border: none;
  background: transparent;
  color: rgba(29,29,31,0.4);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.15s;
}
.theme-btn.active { background: #1d1d1f; color: #fff; }

.status-indicator { display: flex; align-items: center; gap: 6px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 2px rgba(52,211,153,0.2); animation: pulse 2.5s infinite; }
.status-text { font-size: 11px; font-weight: 600; color: rgba(29,29,31,0.4); }

@keyframes pulse { 0%,100%{box-shadow:0 0 0 2px rgba(52,211,153,0.2)} 50%{box-shadow:0 0 0 4px rgba(52,211,153,0.08)} }

.brand-banner {
  background: #fffbeb;
  border-bottom: 1px solid #fde68a;
  padding: 9px 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  font-size: 13px;
  color: #92400e;
}
.banner-btn { padding: 3px 12px; border-radius: 20px; border: 1px solid #fcd34d; background: #fef3c7; color: #92400e; font-size: 12px; cursor: pointer; font-weight: 600; transition: background 0.15s; }
.banner-btn:hover { background: #fde68a; }
.banner-close { margin-left: auto; background: none; border: none; cursor: pointer; color: #d97706; display: flex; align-items: center; padding: 2px; opacity: 0.6; transition: opacity 0.15s; }
.banner-close:hover { opacity: 1; }

.agent-content { flex: 1; overflow-y: auto; padding: 28px 32px; }

/* Mobile */
.agent-mobile-topbar {
  height: 52px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 10px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.mobile-menu-btn { background: none; border: none; padding: 6px; cursor: pointer; color: rgba(29,29,31,0.5); display: flex; align-items: center; flex-shrink: 0; }
.mobile-agent-title { flex: 1; font-size: 15px; font-weight: 700; color: #1d1d1f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.02em; }
.mobile-drawer-inner { padding: 0 6px 12px; }
.drawer-logo-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px 14px; }

/* ── Dark theme ── */
[data-theme='dark'] { background: #0f172a; color: #e2e8f0; }
[data-theme='dark'] .agent-sidebar { background: #111827; border-color: #1f2937; }
[data-theme='dark'] .agent-topbar, [data-theme='dark'] .agent-mobile-topbar { background: rgba(17,24,39,0.8); border-color: #1f2937; }
[data-theme='dark'] .logo-text, [data-theme='dark'] .topbar-title, [data-theme='dark'] .brand-name, [data-theme='dark'] .mobile-agent-title { color: #f8fafc; }
[data-theme='dark'] .brand-card { background: #1f2937; border-color: #334155; }
[data-theme='dark'] .brand-card:hover, [data-theme='dark'] .nav-item:hover { background: #1e293b; }
[data-theme='dark'] .nav-item, [data-theme='dark'] .platform-name, [data-theme='dark'] .status-text, [data-theme='dark'] .brand-sub, [data-theme='dark'] .footer-back { color: #94a3b8; }
[data-theme='dark'] .nav-item--active { background: rgba(0,113,227,0.12); color: #60a5fa; }
[data-theme='dark'] .platform-badge.primary { background: rgba(96,165,250,0.1); color: #60a5fa; }
[data-theme='dark'] .platform-badge.secondary { background: #1e293b; color: #94a3b8; }
[data-theme='dark'] .topbar-brand-pill { background: rgba(96,165,250,0.1); border-color: rgba(96,165,250,0.2); color: #60a5fa; }
[data-theme='dark'] .theme-switch, [data-theme='dark'] .theme-switch-mini { border-color: #334155; background: #1e293b; }
[data-theme='dark'] .theme-btn { background: transparent; color: #94a3b8; }
[data-theme='dark'] .theme-btn.active { background: #f8fafc; color: #111827; }
[data-theme='dark'] .agent-main { background: #0f172a; }
[data-theme='dark'] .sidebar-logo { border-color: #1f2937; }
[data-theme='dark'] .sidebar-footer { border-color: #1f2937; }
[data-theme='dark'] .step-name { color: #94a3b8; }
[data-theme='dark'] .step-detail { color: #475569; }
[data-theme='dark'] .workflow-list::before { background: rgba(255,255,255,0.07); }
[data-theme='dark'] .step-node { background: rgba(96,165,250,0.1); border-color: rgba(96,165,250,0.2); color: #60a5fa; }
[data-theme='dark'] .nav-section-label { color: #475569; }

@media (max-width: 767px) {
  .agent-layout { display: block; height: auto; min-height: 100vh; }
  .agent-main { min-height: calc(100vh - 52px); }
  .agent-content { padding: 18px 16px 24px; }
  .brand-banner { padding: 10px 16px; align-items: flex-start; flex-wrap: wrap; }
}
</style>
