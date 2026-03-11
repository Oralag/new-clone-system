<template>
  <div class="agent-layout" :data-theme="theme">
    <!-- Desktop Sidebar -->
    <aside v-if="!isMobile" class="agent-sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-mark">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M9 2V16M2 6L16 12M16 6L2 12" stroke="currentColor" stroke-width="1" stroke-linejoin="round" opacity="0.4"/>
          </svg>
        </div>
        <span class="logo-text">Nomad Agent</span>
      </div>

      <!-- Brand Card -->
      <div class="brand-card" @click="$router.push('/agent/brand')">
        <div v-if="brandStore.isConfigured" class="brand-configured">
          <div class="brand-avatar">{{ brandStore.brand.name.charAt(0) }}</div>
          <div class="brand-info">
            <div class="brand-name">{{ brandStore.brand.name }}</div>
            <div class="brand-sub">{{ brandStore.brand.subIndustry || brandStore.brand.industry || '未设置行业' }}</div>
          </div>
          <svg class="brand-edit-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
          </svg>
        </div>
        <div v-else class="brand-unconfigured">
          <div class="warn-dot" />
          <span>配置品牌信息</span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">工作流</div>
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          active-class="nav-item--active"
        >
          <div class="nav-icon-wrap">
            <component :is="item.icon" />
          </div>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </nav>

      <!-- Platforms -->
      <div class="sidebar-platforms">
        <div class="nav-section-label">发布平台</div>
        <div v-for="p in platforms" :key="p.key" class="platform-row">
          <span class="platform-name">{{ p.name }}</span>
          <span :class="['platform-badge', p.tier]">{{ p.tier === 'primary' ? '主要' : '次要' }}</span>
        </div>
      </div>

      <!-- Footer -->
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

    <!-- Mobile Topbar -->
    <div v-if="isMobile" class="agent-mobile-topbar">
      <button class="mobile-menu-btn" @click="drawerOpen = true">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="mobile-agent-title">{{ currentPageTitle }}</span>
      <div class="theme-switch-mini">
        <button :class="['theme-btn', { active: theme === 'light' }]" @click="setTheme('light')">白</button>
        <button :class="['theme-btn', { active: theme === 'dark' }]" @click="setTheme('dark')">黑</button>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <el-drawer v-if="isMobile" v-model="drawerOpen" direction="ltr" size="75%" :with-header="false">
      <div class="mobile-drawer-inner">
        <div class="drawer-logo-row">
          <div class="logo-mark" style="width:28px;height:28px;background:#1a1a1a;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
          <span style="font-size:13px;font-weight:650;color:#1a1a1a;margin-left:9px">Nomad Agent</span>
        </div>
        <div style="padding:8px 0">
          <div class="nav-section-label" style="padding:10px 16px 6px">工作流</div>
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="mobile-nav-link"
            active-class="mobile-nav-link--active"
            @click="drawerOpen = false"
          >
            <div class="nav-icon-wrap"><component :is="item.icon" /></div>
            <span>{{ item.label }}</span>
          </router-link>
          <router-link
            to="/agent/history"
            class="mobile-nav-link"
            active-class="mobile-nav-link--active"
            @click="drawerOpen = false"
          >
            <div class="nav-icon-wrap"><IconHistory /></div>
            <span>历史记录</span>
          </router-link>
          <router-link
            to="/portal"
            class="mobile-nav-link"
            style="color:#999"
            @click="drawerOpen = false"
          >
            <div class="nav-icon-wrap"><IconBack /></div>
            <span>返回主页</span>
          </router-link>
        </div>
      </div>
    </el-drawer>

    <!-- Main -->
    <div class="agent-main">
      <!-- Desktop Topbar -->
      <header v-if="!isMobile" class="agent-topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">{{ currentPageTitle }}</h1>
          <div v-if="brandStore.isConfigured" class="topbar-brand-pill">
            {{ brandStore.brand.name }}  ·  {{ brandStore.brand.subIndustry || brandStore.brand.industry }}
          </div>
        </div>
        <div class="topbar-right">
          <div class="theme-switch">
            <button :class="['theme-btn', { active: theme === 'light' }]" @click="setTheme('light')">白色</button>
            <button :class="['theme-btn', { active: theme === 'dark' }]" @click="setTheme('dark')">黑色</button>
          </div>
          <div class="status-indicator">
            <span class="status-dot" />
            <span class="status-text">AI 在线</span>
          </div>
        </div>
      </header>

      <!-- Brand Warning Banner -->
      <div v-if="!brandStore.isConfigured && showBanner" class="brand-banner">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L13 12H1L7 1Z" stroke="#d97706" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M7 5V8" stroke="#d97706" stroke-width="1.2" stroke-linecap="round"/>
          <circle cx="7" cy="10" r="0.5" fill="#d97706"/>
        </svg>
        <span>尚未配置品牌信息，AI 生成效果将受限</span>
        <button class="banner-btn" @click="$router.push('/agent/brand')">立即配置</button>
        <button class="banner-close" @click="showBanner = false">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <main class="agent-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineComponent, h, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBrandStore } from '@/stores/brand'

const THEME_KEY = 'agent_theme'

const route = useRoute()
const brandStore = useBrandStore()

// Banner: show if brand not configured, dismissable
const showBanner = ref(!brandStore.isConfigured)
watch(() => brandStore.isConfigured, (v) => { if (v) showBanner.value = false })

// Theme
const theme = ref<'light' | 'dark'>('light')
const isMobile = ref(window.innerWidth < 768)
const drawerOpen = ref(false)

const onResize = () => { isMobile.value = window.innerWidth < 768 }

onMounted(() => {
  window.addEventListener('resize', onResize)
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') theme.value = saved
})
onUnmounted(() => window.removeEventListener('resize', onResize))

function setTheme(t: 'light' | 'dark') {
  theme.value = t
  localStorage.setItem(THEME_KEY, t)
}

// SVG icon components
const IconDashboard = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [
  h('rect', { x: 1, y: 1, width: 5, height: 5, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('rect', { x: 8, y: 1, width: 5, height: 5, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('rect', { x: 1, y: 8, width: 5, height: 5, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('rect', { x: 8, y: 8, width: 5, height: 5, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 }),
]) })

const IconTrend = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [
  h('path', { d: 'M1 10L5 6L8 9L13 3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M10 3h3v3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
]) })

const IconCopy = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [
  h('path', { d: 'M3 4h8v8H3z', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linejoin': 'round' }),
  h('path', { d: 'M5 4V2h6v6H9', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linejoin': 'round' }),
]) })

const IconVideo = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [
  h('rect', { x: 1, y: 3, width: 9, height: 8, rx: 1, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('path', { d: 'M10 6l3-2v6l-3-2V6Z', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linejoin': 'round' }),
]) })

const IconPoster = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [
  h('rect', { x: 1, y: 1, width: 12, height: 12, rx: 2, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('rect', { x: 3, y: 3, width: 5, height: 4, rx: 1, stroke: 'currentColor', 'stroke-width': 1.1 }),
  h('path', { d: 'M9 4h2M9 6.5h2M3 9h8M3 11h6', stroke: 'currentColor', 'stroke-width': 1.1, 'stroke-linecap': 'round' }),
]) })

const IconPublish = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [
  h('path', { d: 'M7 1v8M4 4L7 1l3 3', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M2 10v2h10v-2', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
]) })

const IconHistory = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [
  h('circle', { cx: 7, cy: 7, r: 5.5, stroke: 'currentColor', 'stroke-width': 1.3 }),
  h('path', { d: 'M7 4.5V7l2 1.5', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
]) })

const IconBack = defineComponent({ render: () => h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none' }, [
  h('path', { d: 'M9 2L4 7l5 5', stroke: 'currentColor', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
]) })

const navItems = [
  { path: '/agent', icon: IconDashboard, label: '工作台' },
  { path: '/agent/trending', icon: IconTrend, label: '热搜抓取' },
  { path: '/agent/copywriting', icon: IconCopy, label: '文案生成' },
  { path: '/agent/poster', icon: IconPoster, label: '图文海报' },
  { path: '/agent/video', icon: IconVideo, label: '视频生成' },
  { path: '/agent/publish', icon: IconPublish, label: '发布管理' },
]

const platforms = [
  { key: 'douyin', name: '抖音', tier: 'primary' },
  { key: 'xiaohongshu', name: '小红书', tier: 'primary' },
  { key: 'kuaishou', name: '快手', tier: 'primary' },
  { key: 'weibo', name: '微博', tier: 'secondary' },
  { key: 'bilibili', name: 'B站', tier: 'secondary' },
  { key: 'zhihu', name: '知乎', tier: 'secondary' },
]

const PAGE_TITLES: Record<string, string> = {
  '/agent': '工作台',
  '/agent/brand': '品牌设置',
  '/agent/trending': '热搜抓取',
  '/agent/copywriting': '文案生成',
  '/agent/poster': '图文海报',
  '/agent/video': '视频生成',
  '/agent/publish': '发布管理',
  '/agent/history': '历史记录',
}

const currentPageTitle = computed(() => PAGE_TITLES[route.path] || '智能体工作流')
</script>

<style scoped>
[data-v-b806fa13],
.agent-layout,
.agent-layout * {
  box-sizing: border-box;
}

.agent-layout {
  display: flex;
  min-height: 100vh;
  background: #edf2f8;
  color: #0f172a;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.agent-sidebar {
  width: 220px;
  background: #fdfefe;
  border-right: 1px solid #d7dee8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.agent-sidebar::-webkit-scrollbar,
.agent-content::-webkit-scrollbar {
  width: 0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 22px 20px 18px;
  border-bottom: 1px solid #e2e8f0;
  color: #1a1a1a;
}

.logo-mark {
  width: 28px;
  height: 28px;
  background: #1a1a1a;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.logo-text {
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.3px;
  color: #1a1a1a;
}

.brand-card {
  margin: 12px 14px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d4dce8;
  background: #f4f7fc;
  cursor: pointer;
  transition: all 0.18s;
}

.brand-card:hover {
  border-color: #bcc8d8;
  background: #ebf1f9;
}

.brand-configured {
  display: flex;
  align-items: center;
  gap: 9px;
}

.brand-avatar {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: linear-gradient(135deg, #1a1a1a, #3a3a3a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.brand-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.brand-name {
  font-size: 12px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-sub {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.brand-edit-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.brand-unconfigured {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.warn-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}

.sidebar-nav {
  padding: 8px 10px 0;
  flex: 1;
}

.nav-section-label {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 10px 10px 6px;
}

.nav-item,
.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  text-decoration: none;
  color: #475569;
  font-size: 13px;
  font-weight: 450;
  transition: all 0.15s;
  cursor: pointer;
  margin-bottom: 1px;
}

.nav-item:hover,
.mobile-nav-link:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.nav-item--active,
.mobile-nav-link--active {
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
}

.nav-icon-wrap {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  font-size: 10px;
  background: #ef4444;
  color: #fff;
  border-radius: 999px;
  padding: 1px 6px;
  font-weight: 600;
}

.sidebar-platforms {
  margin: 10px 14px 0;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}

.platform-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
}

.platform-name {
  font-size: 12px;
  color: #475569;
}

.platform-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.platform-badge.primary {
  background: #ede9fe;
  color: #7c3aed;
}

.platform-badge.secondary {
  background: #e2e8f0;
  color: #64748b;
}

.sidebar-footer {
  margin-top: auto;
  padding: 12px 10px 14px;
  border-top: 1px solid #e2e8f0;
}

.footer-back {
  color: #94a3b8;
}

.footer-back:hover {
  color: #475569;
}

.agent-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.agent-topbar {
  height: 56px;
  background: rgba(253, 254, 255, 0.86);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid #dbe2ec;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.topbar-title {
  font-size: 18px;
  font-weight: 650;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.2px;
}

.topbar-brand-pill {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #4f46e5;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  padding: 4px 10px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.theme-switch,
.theme-switch-mini {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #eef2f7;
  border: 1px solid #d8e0ea;
  border-radius: 999px;
  padding: 2px;
}

.theme-btn {
  border: none;
  background: transparent;
  height: 28px;
  min-width: 42px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}

.theme-btn.active {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
  animation: pulse 2s infinite;
}

.status-text {
  font-size: 12px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.brand-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: #fff7ed;
  border-bottom: 1px solid #fed7aa;
  color: #c2410c;
  font-size: 13px;
}

.brand-banner span {
  flex: 1;
}

.banner-btn {
  border: 1px solid #fb923c;
  background: rgba(255, 255, 255, 0.55);
  color: #c2410c;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.banner-btn:hover {
  background: #fff;
}

.banner-close {
  border: none;
  background: transparent;
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 2px;
}

.banner-close:hover {
  color: #0f172a;
}

.agent-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.agent-mobile-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: rgba(253, 254, 255, 0.9);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid #dbe2ec;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  z-index: 100;
}

.mobile-menu-btn {
  border: none;
  background: transparent;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
}

.mobile-menu-btn:hover {
  background: #eef2f7;
}

.mobile-agent-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.mobile-drawer-inner {
  height: 100%;
  padding: 18px 0;
  background: #fff;
}

.drawer-logo-row {
  display: flex;
  align-items: center;
  padding: 0 16px 14px;
  border-bottom: 1px solid #edf2f7;
  margin-bottom: 6px;
}

:deep(.el-drawer__body) {
  padding: 0;
}

:deep(.el-drawer) {
  background: #fff;
}

:deep(.el-overlay) {
  backdrop-filter: blur(4px);
}

:deep(.page-head),
:deep(.page-top) {
  margin-bottom: 24px;
}

:deep(.page-title),
:deep(.section-title),
:deep(.card-label),
:deep(.config-label) {
  color: #0f172a;
}

:deep(.page-desc),
:deep(.field-hint),
:deep(.prompt-hint),
:deep(.summary-label),
:deep(.format-desc),
:deep(.style-desc) {
  color: #64748b;
}

:deep(.section-card),
:deep(.preview-card),
:deep(.result-card-wrap),
:deep(.config-card),
:deep(.preview-card),
:deep(.card) {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

:deep(.text-input),
:deep(.field-input),
:deep(.field-select),
:deep(.tag-input),
:deep(.script-area),
:deep(.adv-select) {
  transition: all 0.15s ease;
}

:deep(.text-input:focus),
:deep(.field-input:focus),
:deep(.field-select:focus),
:deep(.tag-input:focus),
:deep(.script-area:focus),
:deep(.adv-select:focus) {
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
}

:deep(.btn-generate),
:deep(.btn-save),
:deep(.btn-add),
:deep(.btn-ai-inline),
:deep(.btn-secondary),
:deep(.text-btn) {
  transition: all 0.16s ease;
}

:deep(.btn-generate:hover),
:deep(.btn-save:hover),
:deep(.btn-add:hover),
:deep(.btn-ai-inline:hover),
:deep(.text-btn:hover) {
  transform: translateY(-1px);
}

:global([data-theme='dark']) .agent-layout,
:global([data-theme='dark']) .mobile-drawer-inner,
:global([data-theme='dark']) :deep(.el-drawer) {
  background: #0f1722;
  color: #e2e8f0;
}

:global([data-theme='dark']) .agent-sidebar,
:global([data-theme='dark']) .agent-topbar,
:global([data-theme='dark']) .agent-mobile-topbar {
  background: rgba(15, 23, 34, 0.92);
  border-color: #1e293b;
}

:global([data-theme='dark']) .sidebar-logo,
:global([data-theme='dark']) .sidebar-footer,
:global([data-theme='dark']) .sidebar-platforms,
:global([data-theme='dark']) .drawer-logo-row {
  border-color: #1e293b;
}

:global([data-theme='dark']) .logo-mark {
  background: #e2e8f0;
  color: #111827;
}

:global([data-theme='dark']) .logo-text,
:global([data-theme='dark']) .brand-name,
:global([data-theme='dark']) .topbar-title,
:global([data-theme='dark']) .mobile-agent-title {
  color: #e2e8f0;
}

:global([data-theme='dark']) .brand-card {
  background: #162233;
  border-color: #233247;
}

:global([data-theme='dark']) .brand-card:hover,
:global([data-theme='dark']) .nav-item:hover,
:global([data-theme='dark']) .mobile-nav-link:hover,
:global([data-theme='dark']) .mobile-menu-btn:hover {
  background: #1d283b;
}

:global([data-theme='dark']) .brand-sub,
:global([data-theme='dark']) .nav-section-label,
:global([data-theme='dark']) .platform-name,
:global([data-theme='dark']) .status-indicator,
:global([data-theme='dark']) .theme-btn,
:global([data-theme='dark']) .footer-back,
:global([data-theme='dark']) .banner-close {
  color: #64748b;
}

:global([data-theme='dark']) .nav-item,
:global([data-theme='dark']) .mobile-nav-link {
  color: #94a3b8;
}

:global([data-theme='dark']) .nav-item--active,
:global([data-theme='dark']) .mobile-nav-link--active,
:global([data-theme='dark']) .platform-badge.primary,
:global([data-theme='dark']) .topbar-brand-pill {
  background: rgba(79, 70, 229, 0.14);
  border-color: rgba(129, 140, 248, 0.24);
  color: #a5b4fc;
}

:global([data-theme='dark']) .platform-badge.secondary,
:global([data-theme='dark']) .theme-switch,
:global([data-theme='dark']) .theme-switch-mini {
  background: #162233;
  border-color: #233247;
}

:global([data-theme='dark']) .theme-btn.active {
  background: #233247;
  color: #e2e8f0;
  box-shadow: none;
}

:global([data-theme='dark']) .brand-banner {
  background: rgba(124, 58, 237, 0.12);
  border-color: rgba(129, 140, 248, 0.22);
  color: #c4b5fd;
}

:global([data-theme='dark']) .banner-btn {
  background: rgba(15, 23, 42, 0.25);
  border-color: rgba(129, 140, 248, 0.4);
  color: #c4b5fd;
}

:global([data-theme='dark']) .banner-btn:hover {
  background: rgba(15, 23, 42, 0.44);
}

:global([data-theme='dark']) :deep(.card),
:global([data-theme='dark']) :deep(.section-card),
:global([data-theme='dark']) :deep(.preview-card),
:global([data-theme='dark']) :deep(.result-card-wrap),
:global([data-theme='dark']) :deep(.config-card),
:global([data-theme='dark']) :deep(.poster-card),
:global([data-theme='dark']) :deep(.video-item),
:global([data-theme='dark']) :deep(.stock-sidebar) {
  background: #141c29 !important;
  border-color: #223246 !important;
  box-shadow: none !important;
}

:global([data-theme='dark']) :deep(.hero) {
  border-color: #223246 !important;
}

:global([data-theme='dark']) :deep(.page-title),
:global([data-theme='dark']) :deep(.section-title),
:global([data-theme='dark']) :deep(.card-label),
:global([data-theme='dark']) :deep(.config-label),
:global([data-theme='dark']) :deep(.result-count),
:global([data-theme='dark']) :deep(.poster-title),
:global([data-theme='dark']) :deep(.video-title),
:global([data-theme='dark']) :deep(.style-name),
:global([data-theme='dark']) :deep(.format-name),
:global([data-theme='dark']) :deep(.ratio-name),
:global([data-theme='dark']) :deep(.model-name),
:global([data-theme='dark']) :deep(.saved-name) {
  color: #e2e8f0 !important;
}

:global([data-theme='dark']) :deep(.page-desc),
:global([data-theme='dark']) :deep(.field-hint),
:global([data-theme='dark']) :deep(.prompt-hint),
:global([data-theme='dark']) :deep(.summary-label),
:global([data-theme='dark']) :deep(.format-desc),
:global([data-theme='dark']) :deep(.style-desc),
:global([data-theme='dark']) :deep(.ratio-platforms),
:global([data-theme='dark']) :deep(.recent-meta),
:global([data-theme='dark']) :deep(.saved-meta) {
  color: #64748b !important;
}

:global([data-theme='dark']) :deep(.text-input),
:global([data-theme='dark']) :deep(.field-input),
:global([data-theme='dark']) :deep(.field-select),
:global([data-theme='dark']) :deep(.tag-input),
:global([data-theme='dark']) :deep(.script-area),
:global([data-theme='dark']) :deep(.adv-select),
:global([data-theme='dark']) :deep(.prompt-preview),
:global([data-theme='dark']) :deep(.poster-content),
:global([data-theme='dark']) :deep(.preview-mock),
:global([data-theme='dark']) :deep(.video-thumb) {
  background: #162233 !important;
  border-color: #2b3a4f !important;
  color: #e2e8f0 !important;
}

:global([data-theme='dark']) :deep(.topic-chip),
:global([data-theme='dark']) :deep(.poster-style-tag),
:global([data-theme='dark']) :deep(.poster-tag),
:global([data-theme='dark']) :deep(.model-tag),
:global([data-theme='dark']) :deep(.status-badge),
:global([data-theme='dark']) :deep(.platform-badge) {
  opacity: 0.95;
}

:global([data-theme='dark']) :deep(.btn-sm),
:global([data-theme='dark']) :deep(.btn-outline),
:global([data-theme='dark']) :deep(.icon-btn),
:global([data-theme='dark']) :deep(.text-btn),
:global([data-theme='dark']) :deep(.video-btn),
:global([data-theme='dark']) :deep(.btn-secondary) {
  background: #162233 !important;
  border-color: #2b3a4f !important;
  color: #e2e8f0 !important;
}

:deep(.brand-page),
:deep(.copywriting-page),
:deep(.poster-page),
:deep(.video-page),
:deep(.dashboard),
:deep(.history-page),
:deep(.publish-page) {
  max-width: 1020px;
}

:deep(.brand-saved-bar),
:deep(.autoflow-card),
:deep(.flow-panel),
:deep(.page-head),
:deep(.result-head),
:deep(.summary-card),
:deep(.page-header),
:deep(.progress-bar-wrap) {
  position: relative;
}

:deep(.brand-saved-bar),
:deep(.flow-panel),
:deep(.autoflow-card),
:deep(.result-card-wrap),
:deep(.config-card),
:deep(.preview-card),
:deep(.section-card),
:deep(.poster-card),
:deep(.video-item) {
  backdrop-filter: blur(10px);
}

:deep(.brand-saved-bar)::after,
:deep(.autoflow-card)::after,
:deep(.flow-panel)::after,
:deep(.result-card-wrap)::after,
:deep(.preview-card)::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

:deep(.flow-panel-header),
:deep(.flow-panel-header-right),
:deep(.flow-panel-steps),
:deep(.done-btns),
:deep(.poster-actions),
:deep(.video-actions),
:deep(.result-head),
:deep(.script-meta),
:deep(.summary-row) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.flow-panel-title),
:deep(.autoflow-title-wrap),
:deep(.saved-bar-left),
:deep(.flow-step-chip),
:deep(.poster-tags),
:deep(.video-tags),
:deep(.topbar-left),
:deep(.topbar-right) {
  display: flex;
  align-items: center;
  gap: 10px;
}

:deep(.flow-panel-title),
:deep(.done-title),
:deep(.page-title),
:deep(.result-count),
:deep(.saved-name) {
  letter-spacing: -0.2px;
}

:deep(.flow-panel-step),
:deep(.workflow-step),
:deep(.recent-row),
:deep(.history-row) {
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

:deep(.flow-panel-step:hover),
:deep(.history-row:hover),
:deep(.recent-row:hover),
:deep(.poster-card:hover),
:deep(.video-item:hover) {
  transform: translateY(-1px);
}

:deep(.fps-track) {
  width: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

:deep(.fps-dot) {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  background: #ede9fe;
  color: #7c3aed;
}

:deep(.fps-line) {
  width: 2px;
  flex: 1;
  min-height: 18px;
  margin: 6px 0;
  background: #e2e8f0;
}

:deep(.fps-content) {
  flex: 1;
  min-width: 0;
  padding-bottom: 14px;
}

:deep(.fps-title) {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}

:deep(.fps-log) {
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}

:deep(.fps-log-loading) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.loading-dots) {
  display: inline-flex;
  gap: 4px;
}

:deep(.loading-dots span) {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #8b5cf6;
  animation: pulse 1s infinite;
}

:deep(.loading-dots span:nth-child(2)) {
  animation-delay: 0.15s;
}

:deep(.loading-dots span:nth-child(3)) {
  animation-delay: 0.3s;
}

:deep(.flow-pulse),
:deep(.fps-spinner) {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12);
  animation: pulse 1s infinite;
}

:deep(.done-icon) {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  font-size: 20px;
  font-weight: 700;
  margin: 0 auto 14px;
}

:deep(.done-desc),
:deep(.prompt-hint),
:deep(.empty-text),
:deep(.preview-hint),
:deep(.field-hint) {
  line-height: 1.6;
}

:deep(.topic-chip),
:deep(.product-chip),
:deep(.poster-tag),
:deep(.model-tag),
:deep(.ready-chip),
:deep(.platform-badge),
:deep(.status-badge) {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);
}

:deep(.poster-style-tag),
:deep(.result-loading),
:deep(.saved-time),
:deep(.prev-hint),
:deep(.prompt-hint),
:deep(.summary-label),
:deep(.summary-value),
:deep(.recent-meta) {
  font-variant-numeric: tabular-nums;
}

:deep(.poster-content),
:deep(.preview-mock),
:deep(.video-thumb),
:deep(.prompt-preview) {
  overflow: hidden;
}

:global([data-theme='dark']) :deep(.brand-saved-bar),
:global([data-theme='dark']) :deep(.autoflow-card),
:global([data-theme='dark']) :deep(.flow-panel) {
  background: linear-gradient(180deg, rgba(20, 28, 41, 0.98), rgba(15, 23, 34, 0.98)) !important;
  border-color: #223246 !important;
}

:global([data-theme='dark']) :deep(.brand-saved-bar)::after,
:global([data-theme='dark']) :deep(.autoflow-card)::after,
:global([data-theme='dark']) :deep(.flow-panel)::after,
:global([data-theme='dark']) :deep(.result-card-wrap)::after,
:global([data-theme='dark']) :deep(.preview-card)::after {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

:global([data-theme='dark']) :deep(.fps-dot),
:global([data-theme='dark']) :deep(.step-index) {
  background: rgba(79, 70, 229, 0.14);
  color: #a5b4fc;
}

:global([data-theme='dark']) :deep(.fps-line),
:global([data-theme='dark']) :deep(.step-line),
:global([data-theme='dark']) :deep(.summary-card) {
  border-color: #223246 !important;
  background: #223246;
}

:global([data-theme='dark']) :deep(.fps-title),
:global([data-theme='dark']) :deep(.done-title),
:global([data-theme='dark']) :deep(.flow-panel-title),
:global([data-theme='dark']) :deep(.result-count),
:global([data-theme='dark']) :deep(.stat-value),
:global([data-theme='dark']) :deep(.saved-name) {
  color: #f8fafc !important;
}

:global([data-theme='dark']) :deep(.fps-log),
:global([data-theme='dark']) :deep(.done-desc),
:global([data-theme='dark']) :deep(.saved-time),
:global([data-theme='dark']) :deep(.prev-hint),
:global([data-theme='dark']) :deep(.summary-value) {
  color: #94a3b8 !important;
}

:global([data-theme='dark']) :deep(.done-icon) {
  background: rgba(34, 197, 94, 0.16);
  color: #4ade80;
}

:global([data-theme='dark']) :deep(.flow-pulse),
:global([data-theme='dark']) :deep(.fps-spinner),
:global([data-theme='dark']) :deep(.loading-dots span) {
  background: #a78bfa;
  box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.12);
}

:global([data-theme='dark']) :deep(.workflow-step:hover),
:global([data-theme='dark']) :deep(.flow-panel-step:hover),
:global([data-theme='dark']) :deep(.recent-row:hover),
:global([data-theme='dark']) :deep(.history-row:hover) {
  border-color: #2b3a4f !important;
}

@media (max-width: 767px) {
  .agent-layout {
    flex-direction: column;
    padding-top: 52px;
  }

  .agent-content {
    padding: 16px 14px;
  }

  .brand-banner {
    padding: 10px 14px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .topbar-brand-pill,
  .status-indicator {
    display: none;
  }
}
</style>
