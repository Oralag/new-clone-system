<template>
  <div class="agent-layout" :class="theme">
    <!-- Mobile Top Bar -->
    <div v-if="isMobile" class="mobile-topbar">
      <button class="hamburger" @click="drawerOpen = true">
        <span /><span /><span />
      </button>
      <span class="mobile-page-title">{{ currentPageTitle }}</span>
      <button class="theme-toggle" @click="toggleTheme">
        <span v-if="theme === 'dark'">☀️</span>
        <span v-else>🌙</span>
      </button>
    </div>

    <!-- Mobile Drawer -->
    <el-drawer v-if="isMobile" v-model="drawerOpen" direction="ltr" :size="260" :with-header="false">
      <div class="sidebar-inner">
        <SidebarContent
          :brand-store="brandStore"
          :nav-items="navItems"
          :platforms="platforms"
          :theme="theme"
          @navigate="onNavigate"
          @close="drawerOpen = false"
        />
      </div>
    </el-drawer>

    <!-- Desktop Sidebar -->
    <aside v-else class="sidebar">
      <SidebarContent
        :brand-store="brandStore"
        :nav-items="navItems"
        :platforms="platforms"
        :theme="theme"
        @navigate="onNavigate"
      />
    </aside>

    <!-- Main -->
    <div class="main-wrap">
      <!-- Desktop Topbar -->
      <header v-if="!isMobile" class="topbar">
        <div class="topbar-left">
          <span class="page-title">{{ currentPageTitle }}</span>
          <span v-if="brandStore.isConfigured" class="brand-pill">{{ brandStore.brand.name }}</span>
        </div>
        <div class="topbar-right">
          <a class="home-link" href="/#/dashboard">主页</a>
          <button class="theme-toggle" @click="toggleTheme">
            <span v-if="theme === 'dark'">☀️</span>
            <span v-else>🌙</span>
          </button>
          <span class="ai-status"><span class="dot" />AI在线</span>
        </div>
      </header>

      <!-- Brand Warning Banner -->
      <div v-if="!brandStore.isConfigured" class="brand-warning">
        ⚠️ 尚未配置品牌信息，AI生成效果将受限。
        <router-link to="/agent/brand" class="warning-link">立即配置 →</router-link>
      </div>

      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'

const brandStore = useBrandStore()
const route = useRoute()
const router = useRouter()

// Theme
const theme = ref<'light' | 'dark'>(
  (localStorage.getItem('agent_theme') as 'light' | 'dark') || 'light'
)
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('agent_theme', theme.value)
}

// Mobile
const isMobile = ref(window.innerWidth < 768)
const drawerOpen = ref(false)
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// Nav
const navItems = [
  { label: '工作台', path: '/agent', icon: 'IconHome', exact: true },
  { label: '品牌设置', path: '/agent/brand', icon: 'IconBrand' },
  { label: '热搜抓取', path: '/agent/trending', icon: 'IconTrend' },
  { label: '文案生成', path: '/agent/copywriting', icon: 'IconPen' },
  { label: '图文海报', path: '/agent/poster', icon: 'IconImage' },
  { label: '视频生成', path: '/agent/video', icon: 'IconVideo' },
  { label: '发布管理', path: '/agent/publish', icon: 'IconPublish' },
  { label: '历史记录', path: '/agent/history', icon: 'IconHistory' },
]

const platforms = [
  { label: '抖音', type: 'primary' },
  { label: '小红书', type: 'primary' },
  { label: '快手', type: 'primary' },
  { label: '微博', type: 'secondary' },
  { label: 'B站', type: 'secondary' },
  { label: '知乎', type: 'secondary' },
]

const currentPageTitle = computed(() => {
  const map: Record<string, string> = {
    '/agent': '工作台',
    '/agent/brand': '品牌设置',
    '/agent/trending': '热搜抓取',
    '/agent/copywriting': '文案生成',
    '/agent/poster': '图文海报',
    '/agent/video': '视频生成',
    '/agent/publish': '发布管理',
    '/agent/history': '历史记录',
  }
  return map[route.path] || '数字游牧'
})

function onNavigate(path: string) {
  if (path === '/portal') {
    window.location.href = '/#/dashboard'
  } else {
    router.push(path)
  }
  drawerOpen.value = false
}

// Sidebar as sub-component
const SidebarContent = defineComponent({
  props: ['brandStore', 'navItems', 'platforms', 'theme'],
  emits: ['navigate', 'close'],
  setup(props, { emit }) {
    const route = useRoute()
    function isActive(item: any) {
      if (item.exact) return route.path === item.path
      return route.path.startsWith(item.path)
    }
    return () => h('div', { class: 'sidebar-content' }, [
      h('div', { class: 'logo' }, [
        h('span', { class: 'logo-icon' }, '🧭'),
        h('span', { class: 'logo-text' }, 'Nomad Agent'),
      ]),
      h('div', {
        class: ['brand-card', !props.brandStore.isConfigured && 'brand-card--warn'],
        onClick: () => emit('navigate', '/agent/brand'),
      }, props.brandStore.isConfigured
        ? [h('span', { class: 'brand-card-name' }, props.brandStore.brand.name),
           h('span', { class: 'brand-card-sub' }, props.brandStore.brand.industry || '品牌主页')]
        : [h('span', { class: 'brand-card-warn' }, '⚠️ 前往品牌设置')]
      ),
      h('nav', { class: 'nav-list' },
        props.navItems.map((item: any) =>
          h('div', {
            key: item.path,
            class: ['nav-item', isActive(item) && 'nav-item--active'],
            onClick: () => emit('navigate', item.path),
          }, item.label)
        )
      ),
      h('div', { class: 'platform-section' }, [
        h('div', { class: 'platform-label' }, '发布平台'),
        h('div', { class: 'platform-list' },
          props.platforms.map((p: any) =>
            h('span', { key: p.label, class: ['platform-tag', `platform-tag--${p.type}`] }, p.label)
          )
        ),
      ]),
      h('div', { class: 'sidebar-footer' }, [
        h('div', { class: 'footer-link', onClick: () => emit('navigate', '/portal') }, '← 返回主系统'),
      ]),
    ])
  },
})
</script>

<style scoped>
.agent-layout {
  display: flex;
  min-height: 100vh;
  background: #edf2f8;
  color: #1a1a2e;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}
.agent-layout.dark {
  background: #0f1218;
  color: #e2e8f0;
}

/* Sidebar */
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: #fdfefe;
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.dark .sidebar {
  background: #141a24;
  border-right-color: #1e2a3a;
}
.sidebar-inner {
  height: 100%;
  overflow-y: auto;
}
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 0;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px 20px;
  font-size: 16px;
  font-weight: 700;
}
.logo-icon { font-size: 20px; }
.logo-text { color: #3b82f6; }
.dark .logo-text { color: #60a5fa; }

.brand-card {
  margin: 0 12px 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  cursor: pointer;
  transition: background 0.2s;
}
.brand-card:hover { background: #dbeafe; }
.dark .brand-card { background: #1e2d45; border-color: #2d4a6e; }
.dark .brand-card:hover { background: #243554; }
.brand-card--warn { background: #fff7ed; border-color: #fed7aa; }
.dark .brand-card--warn { background: #2d1f0e; border-color: #7c4a1a; }
.brand-card-name { display: block; font-weight: 600; font-size: 13px; }
.brand-card-sub { display: block; font-size: 11px; color: #64748b; margin-top: 2px; }
.dark .brand-card-sub { color: #94a3b8; }
.brand-card-warn { font-size: 12px; color: #ea580c; }

.nav-list { flex: 1; padding: 0 8px; }
.nav-item {
  padding: 9px 12px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 13.5px;
  margin-bottom: 2px;
  transition: background 0.15s;
  color: #475569;
}
.nav-item:hover { background: #f1f5f9; }
.dark .nav-item { color: #94a3b8; }
.dark .nav-item:hover { background: #1e2a3a; }
.nav-item--active { background: #eff6ff; color: #2563eb; font-weight: 600; }
.dark .nav-item--active { background: #1e3a5f; color: #60a5fa; }

.platform-section { padding: 12px 20px; }
.platform-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.platform-list { display: flex; flex-wrap: wrap; gap: 6px; }
.platform-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
}
.platform-tag--primary { background: #dbeafe; color: #1d4ed8; }
.platform-tag--secondary { background: #f1f5f9; color: #475569; }
.dark .platform-tag--primary { background: #1e3a5f; color: #93c5fd; }
.dark .platform-tag--secondary { background: #1e2a3a; color: #94a3b8; }

.sidebar-footer {
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  margin-top: auto;
}
.dark .sidebar-footer { border-top-color: #1e2a3a; }
.footer-link {
  font-size: 12.5px;
  color: #64748b;
  cursor: pointer;
  padding: 5px 0;
  transition: color 0.15s;
}
.footer-link:hover { color: #3b82f6; }
.dark .footer-link { color: #64748b; }
.dark .footer-link:hover { color: #60a5fa; }

/* Main */
.main-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.topbar {
  height: 56px;
  background: #fdfefe;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}
.dark .topbar { background: #141a24; border-bottom-color: #1e2a3a; }
.topbar-left { display: flex; align-items: center; gap: 10px; }
.page-title { font-size: 15px; font-weight: 600; }
.brand-pill {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 20px;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 500;
}
.dark .brand-pill { background: #1e3a5f; color: #93c5fd; }
.topbar-right { display: flex; align-items: center; gap: 14px; }
.home-link {
  font-size: 13px;
  color: #64748b;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.15s;
}
.home-link:hover { color: #3b82f6; border-color: #bfdbfe; background: #eff6ff; }
.dark .home-link { color: #94a3b8; border-color: #1e2a3a; }
.dark .home-link:hover { color: #60a5fa; border-color: #2d4a6e; background: #1e3a5f; }
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.15s;
}
.theme-toggle:hover { background: #f1f5f9; }
.dark .theme-toggle:hover { background: #1e2a3a; }
.ai-status { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #64748b; }
.dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #22c55e;
  display: inline-block;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.brand-warning {
  background: #fff7ed;
  border-bottom: 1px solid #fed7aa;
  padding: 8px 24px;
  font-size: 13px;
  color: #9a3412;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dark .brand-warning { background: #2d1f0e; border-bottom-color: #7c4a1a; color: #fb923c; }
.warning-link { color: #ea580c; text-decoration: none; font-weight: 600; }
.warning-link:hover { text-decoration: underline; }

.main-content { flex: 1; overflow-y: auto; padding: 24px; }

/* Mobile */
.mobile-topbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 52px;
  background: #fdfefe;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}
.dark .mobile-topbar { background: #141a24; border-bottom-color: #1e2a3a; }
.mobile-page-title { font-size: 15px; font-weight: 600; }
.hamburger {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
}
.hamburger span {
  display: block;
  width: 20px;
  height: 2px;
  background: currentColor;
  border-radius: 2px;
}

@media (max-width: 767px) {
  .agent-layout { flex-direction: column; padding-top: 52px; }
  .main-content { padding: 16px 14px; }
}

/* Dark theme overrides for child page classes */
.dark :deep(.page-title) { color: #e2e8f0; }
.dark :deep(.hero-title) { color: #f1f5f9; }
.dark :deep(.hero-sub) { color: #94a3b8; }
.dark :deep(.card) {
  background: #141a24 !important;
  border-color: #1e2a3a !important;
  color: #e2e8f0;
}
.dark :deep(.action-card) {
  background: #1a2332 !important;
  border-color: #1e2a3a !important;
  color: #e2e8f0;
}
.dark :deep(.action-card:hover) { background: #1e2a3a !important; }
.dark :deep(.action-title) { color: #e2e8f0; }
.dark :deep(.text-input),
.dark :deep(.field-input) {
  background: #1a2332 !important;
  border-color: #2d3f55 !important;
  color: #e2e8f0 !important;
}
.dark :deep(.text-area),
.dark :deep(.field-textarea) {
  background: #1a2332 !important;
  border-color: #2d3f55 !important;
  color: #e2e8f0 !important;
}
.dark :deep(.tab) {
  background: #1a2332;
  border-color: #2d3f55;
  color: #94a3b8;
}
.dark :deep(.tab.active) {
  background: #1e3a5f;
  border-color: #3b82f6;
  color: #60a5fa;
}
.dark :deep(.btn-sm) {
  background: #1e3a5f;
  color: #60a5fa;
  border-color: #2d4a6e;
}
.dark :deep(.stat-item) { background: #1a2332 !important; border-color: #1e2a3a !important; }
.dark :deep(.stat-value) { color: #60a5fa; }
.dark :deep(.stat-label) { color: #64748b; }
.dark :deep(.history-row) { background: #1a2332 !important; border-color: #1e2a3a !important; }
.dark :deep(.status-badge) { opacity: 0.9; }
</style>
