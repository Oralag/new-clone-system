<template>
  <div class="inv-layout">

    <!-- ── 侧边栏（桌面端） ── -->
    <aside v-if="!isMobile" class="inv-sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
            <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.8"/>
            <circle cx="12" cy="12" r="1.5" fill="var(--card-bg)"/>
          </svg>
        </div>
        <div class="logo-text-wrap">
          <span class="logo-text">ADAM</span>
          <span class="logo-sub">{{ t('investment.subtitle') }}</span>
        </div>
        <span class="life-dot" :class="{ alive: adamStore.isAlive, dormant: !adamStore.isAlive }"></span>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/investment" class="nav-item" active-class="nav-item--active" exact>
          <Eye :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">{{ t('investment.overview') }}</span>
        </router-link>
        <router-link to="/investment/city" class="nav-item" active-class="nav-item--active">
          <Map :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">{{ t('investment.cityMap') }}</span>
        </router-link>

        <div class="nav-section-title">{{ t('investment.sectionResearch') }}</div>
        <router-link to="/investment/market" class="nav-item" active-class="nav-item--active">
          <BarChart3 :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">{{ t('investment.market') }}</span>
        </router-link>

        <div class="nav-section-title">{{ t('investment.sectionEcosystem') }}</div>
        <router-link to="/investment/marketing" class="nav-item" active-class="nav-item--active">
          <TrendingUp :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">{{ t('investment.marketing') }}</span>
        </router-link>
        <router-link to="/investment/designer" class="nav-item" active-class="nav-item--active">
          <Palette :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">{{ t('investment.designer') }}</span>
        </router-link>

        <div class="nav-section-title">{{ t('investment.sectionAdam') }}</div>
        <router-link to="/investment/archive" class="nav-item" active-class="nav-item--active">
          <BookOpen :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">{{ t('investment.archive') }}</span>
        </router-link>
        <router-link to="/investment/library" class="nav-item" active-class="nav-item--active">
          <Library :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">{{ t('investment.library') }}</span>
        </router-link>
        <router-link to="/investment/workspace" class="nav-item" active-class="nav-item--active">
          <Home :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">{{ t('investment.workspace') }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/portal" class="nav-item nav-item--back">
          <ChevronLeft :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">{{ t('investment.backToPortal') }}</span>
        </router-link>
      </div>
    </aside>

    <!-- ── 移动端顶栏 ── -->
    <div v-if="isMobile" class="mobile-topbar">
      <button class="mobile-menu-btn" @click="drawerOpen = true">
        <Menu :size="18" :stroke-width="1.5" />
      </button>
      <span class="mobile-title">{{ currentPageTitle }}</span>
      <span class="budget-tag">
        <span class="budget-label">BUDGET</span>
        <span class="budget-val">¥{{ adamStore.core.budget.toLocaleString() }}</span>
      </span>
    </div>

    <!-- 移动端抽屉 -->
    <el-drawer v-if="isMobile" v-model="drawerOpen" direction="ltr" size="260px" :with-header="false" class="inv-drawer">
      <div class="drawer-inner">
        <div class="drawer-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
            <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.8"/>
          </svg>
          <span class="drawer-logo-text">ADAM</span>
        </div>
        <router-link v-for="item in mobileNavItems" :key="item.path" :to="item.path" class="nav-item" active-class="nav-item--active" @click="drawerOpen = false">
          <span class="nav-item-label">{{ item.label }}</span>
        </router-link>
        <router-link to="/portal" class="nav-item nav-item--back" @click="drawerOpen = false">
          <span class="nav-item-label">{{ t('investment.backToPortalArrow') }}</span>
        </router-link>
      </div>
    </el-drawer>

    <!-- ── 主内容区 ── -->
    <main class="inv-main">
      <header v-if="!isMobile" class="inv-topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="topbar-right">
          <!-- 实时时钟 -->
          <div class="inv-clock">{{ clockStr }}</div>
          <!-- 主题切换 -->
          <div class="topbar-theme-btns">
            <button class="topbar-theme-btn" :class="{ active: appStore.theme === 'light' }" :title="t('layout.themeLight')" @click="appStore.setTheme('light')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              </svg>
            </button>
            <button class="topbar-theme-btn" :class="{ active: appStore.theme === 'dark' }" :title="t('layout.themeDark')" @click="appStore.setTheme('dark')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>
            <button class="topbar-theme-btn" :class="{ active: appStore.theme === 'eye' }" :title="t('layout.themeEye')" @click="appStore.setTheme('eye')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <div class="budget-tag">
            <span class="budget-label">BUDGET</span>
            <span class="budget-val">¥{{ adamStore.core.budget.toLocaleString() }}</span>
          </div>
          <div class="status-tag" :class="adamStore.core.status">
            <span class="status-dot"></span>
            <span class="status-text">{{ statusLabel }}</span>
          </div>
        </div>
      </header>

      <div v-if="route.path !== '/investment/city'" class="inv-adam-wrap">
        <AdamChat />
      </div>

      <section class="inv-content" :class="{ 'inv-content--workspace': route.path === '/investment/workspace' || route.path === '/investment/city' }">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAdamStore } from '@/stores/adam'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'
import { Eye, TrendingUp, ChevronLeft, Menu, Map, BarChart3, BookOpen, Library, Palette, Home } from 'lucide-vue-next'
import CaptainBar from '@/components/CaptainBar.vue'
import AdamChat from '@/components/AdamChat.vue'

const route = useRoute()
const adamStore = useAdamStore()
const appStore = useAppStore()
const { t, locale } = useI18n()

const drawerOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // 从 Cloudflare KV 拉回亚当 core 状态，覆盖本地缓存
  // 防止 localStorage 被清空后 defaultCore() 把 KV 里的 alive 反向覆盖成 dormant
  adamStore.syncCoreFromKV()
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (clockTimer) clearInterval(clockTimer)
})
function handleResize() { isMobile.value = window.innerWidth < 768 }

// ── 实时时钟 ──
const clockStr = ref('')
let clockTimer: ReturnType<typeof setInterval> | null = null
function updateClock() {
  const now = new Date()
  const clockLocale = locale.value === 'en-US' ? 'en-US' : 'zh-CN'
  clockStr.value = new Intl.DateTimeFormat(clockLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
}
updateClock()
clockTimer = setInterval(updateClock, 1000)

const mobileNavItems = computed(() => ([
  { path: '/investment', label: t('investment.overview') },
  { path: '/investment/city', label: t('investment.cityMap') },
  { path: '/investment/market', label: t('investment.market') },
  { path: '/investment/marketing', label: t('investment.marketing') },
  { path: '/investment/designer', label: t('investment.designer') },
  { path: '/investment/archive', label: t('investment.archive') },
  { path: '/investment/library', label: t('investment.library') },
  { path: '/investment/workspace', label: t('investment.workspace') },
]))

const pageTitleMap = computed<Record<string, string>>(() => ({
  '/investment': t('investment.pageOverview'),
  '/investment/city': t('investment.pageCity'),
  '/investment/market': t('investment.market'),
  '/investment/marketing': t('investment.marketing'),
  '/investment/designer': t('investment.designer'),
  '/investment/archive': t('investment.archive'),
  '/investment/library': t('investment.library'),
  '/investment/workspace': t('investment.pageWorkspace'),
}))
const currentPageTitle = computed(() => pageTitleMap.value[route.path] || t('investment.pageOverview'))

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    dormant: t('investment.statusDormant'),
    alive: t('investment.statusAlive'),
    survival: t('investment.statusSurvival'),
    shutdown: t('investment.statusShutdown'),
  }
  return map[adamStore.core.status] || 'UNKNOWN'
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   投资生态舱 — Frosted Flat Shell
   ═══════════════════════════════════════════════════ */

.inv-layout {
  --inv-canvas: #eef3fb;
  --inv-canvas-2: #f8efe6;
  --inv-ink: #172027;
  --inv-ink-soft: rgba(23, 32, 39, 0.64);
  --inv-ink-muted: rgba(23, 32, 39, 0.42);
  --inv-line: rgba(42, 52, 65, 0.12);
  --inv-line-strong: rgba(42, 52, 65, 0.18);
  --inv-glass: rgba(255, 255, 255, 0.68);
  --inv-glass-strong: rgba(255, 255, 255, 0.82);
  --inv-blue: #4f79c7;
  --inv-blue-soft: #dfe9fb;
  --inv-coral: #ef6f5e;
  --inv-sun: #f3b451;
  --inv-sky: #5d89d4;
  --gray: transparent;
  --dark: var(--inv-ink);
  --mid: var(--inv-ink-soft);
  --dim: var(--inv-ink-muted);
  --faint: rgba(79, 121, 199, 0.08);
  --border: var(--inv-line);
  --card-bg: var(--inv-glass);
  display: flex;
  height: 100vh;
  background: var(--inv-canvas);
  font-family: 'Inter', 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--dark);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
/* ── 侧边栏 ── */
.inv-sidebar {
  width: 260px;
  background: rgba(255, 255, 255, 0.58);
  border-right: 1px solid rgba(255, 255, 255, 0.62);
  box-shadow: inset -1px 0 0 rgba(42, 52, 65, 0.08);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
  scrollbar-width: none;
  position: relative;
}
.inv-sidebar::-webkit-scrollbar { display: none; }

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 16px;
  border-bottom: 1px solid rgba(42, 52, 65, 0.1);
  position: relative;
}
.logo-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--inv-blue);
  color: white;
}
.logo-icon svg circle:first-child { stroke: rgba(255, 255, 255, 0.72); }
.logo-icon svg circle:nth-child(2) { fill: #ffffff; opacity: 0.95; }
.logo-icon svg circle:nth-child(3) { fill: var(--inv-blue); }
.logo-text-wrap { flex: 1; min-width: 0; }
.logo-text {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--inv-ink);
  font-family: inherit;
  letter-spacing: 0.02em;
}
.logo-sub {
  display: block;
  font-size: 11px;
  color: var(--inv-ink-muted);
  margin-top: 2px;
  font-family: inherit;
  letter-spacing: 0;
  text-transform: none;
  opacity: 1;
}

/* 生命指示灯 */
.life-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.life-dot.alive {
  background: var(--inv-blue);
  box-shadow: 0 0 0 4px rgba(79, 121, 199, 0.13);
  animation: lifepulse 2.5s ease-in-out infinite;
}
.life-dot.dormant {
  background: var(--dim);
  opacity: 0.5;
}
@keyframes lifepulse {
  0%,100% { box-shadow: 0 0 0 4px rgba(79, 121, 199, 0.13); }
  50% { box-shadow: 0 0 0 7px rgba(79, 121, 199, 0.06); }
}

/* 导航 */
.sidebar-nav { padding: 12px 10px 0; flex: 1; }
.nav-section-title {
  font-size: 11px;
  font-weight: 700;
  color: rgba(23, 32, 39, 0.38);
  letter-spacing: 0.02em;
  font-family: inherit;
  padding: 15px 12px 6px;
  text-transform: none;
  opacity: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none;
  color: rgba(23, 32, 39, 0.62);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  margin-bottom: 3px;
  border: 1px solid transparent;
  position: relative;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.46);
  color: var(--inv-ink);
  border-color: rgba(255, 255, 255, 0.74);
}
.nav-item--active {
  background: var(--inv-blue) !important;
  color: #ffffff !important;
  font-weight: 600;
  border-color: transparent !important;
}
.nav-item--active::before {
  content: '';
  position: absolute;
  right: 10px;
  top: 50%;
  width: 6px;
  height: 6px;
  background: #ffffff;
  border-radius: 999px;
  transform: translateY(-50%);
}

/* 底部 */
.sidebar-footer {
  padding: 10px 10px 16px;
  border-top: 1px solid rgba(42, 52, 65, 0.1);
}
.nav-item--back { color: var(--dim); font-size: 11px; }
.nav-item--back:hover { color: var(--mid); }

/* ── 主内容 ── */
.inv-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* 顶栏 */
.inv-topbar {
  height: 56px;
  background: rgba(255, 255, 255, 0.54);
  border-bottom: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}
.topbar-left { display: flex; align-items: center; gap: 10px; }
.topbar-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dark);
  margin: 0;
  letter-spacing: 0;
}
.topbar-right { display: flex; align-items: center; gap: 12px; }

/* 实时时钟 */
.inv-clock {
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: rgba(23, 32, 39, 0.46);
  letter-spacing: 0;
  opacity: 1;
}

/* 主题切换按钮 */
.topbar-theme-btns {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(79, 121, 199, 0.08);
  border-radius: 999px;
  padding: 2px 4px;
  border: 1px solid rgba(79, 121, 199, 0.1);
}
.topbar-theme-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mid);
  transition: background 0.15s, color 0.15s;
}
.topbar-theme-btn:hover { background: rgba(255, 255, 255, 0.7); color: var(--dark); }
.topbar-theme-btn.active { background: var(--inv-blue); color: #ffffff; box-shadow: none; }

/* 预算标签 */
.budget-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 999px;
  background: var(--inv-sun);
  border: 1px solid transparent;
}
.budget-label {
  font-size: 8px;
  font-weight: 700;
  color: rgba(23, 32, 39, 0.52);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
}
.budget-val {
  font-size: 12px;
  font-weight: 700;
  color: #172027;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: -0.01em;
}

/* 状态标签 */
.status-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 999px;
}
.status-tag.alive {
  background: var(--inv-blue-soft);
  border: 1px solid rgba(79, 121, 199, 0.16);
}
.status-tag.dormant {
  background: var(--faint);
  border: 1px solid var(--border);
}
.status-tag.survival {
  background: rgba(239, 111, 94, 0.14);
  border: 1px solid rgba(239, 111, 94, 0.2);
}
.status-tag.shutdown {
  background: var(--faint);
  border: 1px solid var(--border);
}
.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.alive .status-dot { background: var(--inv-blue); box-shadow: none; }
.dormant .status-dot { background: var(--dim); opacity: 0.5; }
.survival .status-dot { background: var(--inv-coral); animation: survPulse 1.2s ease-in-out infinite; }
.shutdown .status-dot { background: var(--dim); opacity: 0.3; }
@keyframes survPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.status-text {
  font-size: 9px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
}
.alive .status-text { color: var(--inv-blue); }
.dormant .status-text { color: var(--dim); opacity: 0.6; }
.survival .status-text { color: var(--inv-coral); }
.shutdown .status-text { color: var(--dim); opacity: 0.4; }

/* Adam 对话框 */
.inv-adam-wrap {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 40;
  width: min(430px, calc(100vw - 320px));
  background: transparent;
}

/* 内容区 */
.inv-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: transparent;
  scrollbar-width: thin;
}
.inv-content--workspace {
  padding: 0;
  overflow: hidden;
}

/* ── 移动端 ── */
.mobile-topbar {
  height: 52px;
  background: rgba(255, 255, 255, 0.64);
  border-bottom: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 10px;
  position: sticky;
  top: 0;
  z-index: 20;
  flex-shrink: 0;
}
.mobile-menu-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: var(--mid);
  display: flex;
  align-items: center;
}
.mobile-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
}

/* 抽屉内部 */
.drawer-inner {
  padding: 10px 8px 14px;
  background: rgba(255, 255, 255, 0.72);
  min-height: 100%;
}
.drawer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 6px 14px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}
.drawer-logo-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--inv-blue);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
}

@media (max-width: 767px) {
  .inv-layout { display: block; height: auto; min-height: 100vh; }
  .inv-main { min-height: calc(100vh - 48px); }
  .inv-adam-wrap {
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
  }
  .inv-content { padding: 14px 12px 132px; }
}
</style>

<style>
/* 全局覆盖 el-drawer 在投资模块的样式 */
.inv-drawer .el-drawer {
  background: rgba(255, 255, 255, 0.76) !important;
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
}
.inv-drawer .el-drawer__body {
  padding: 0 !important;
}
</style>
