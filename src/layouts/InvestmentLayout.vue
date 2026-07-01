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

      <div class="inv-body" :class="{ 'inv-body--workspace': route.path === '/investment/workspace' || route.path === '/investment/city' }">
        <section class="inv-content" :class="{ 'inv-content--workspace': route.path === '/investment/workspace' || route.path === '/investment/city' }">
          <router-view />
        </section>

        <aside v-if="route.path !== '/investment/city'" class="inv-adam-wrap">
          <AdamChat />
        </aside>
      </div>
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
  --inv-canvas: #d8d8d5;
  --inv-shell: #f1f0ec;
  --inv-panel: #fbfaf6;
  --inv-panel-soft: #eeece6;
  --inv-ink: #171715;
  --inv-ink-soft: rgba(23, 23, 21, 0.68);
  --inv-ink-muted: rgba(23, 23, 21, 0.42);
  --inv-line: rgba(23, 23, 21, 0.1);
  --inv-line-strong: rgba(23, 23, 21, 0.18);
  --inv-yellow: #ffea1f;
  --inv-orange: #f0602d;
  --inv-mint: #99c49f;
  --inv-black: #080806;
  --inv-blue: #a9c9df;
  --inv-violet: #5e53e7;
  --inv-red: #e7553f;
  --gray: var(--inv-panel-soft);
  --dark: var(--inv-ink);
  --mid: var(--inv-ink-soft);
  --dim: var(--inv-ink-muted);
  --faint: rgba(23, 23, 21, 0.055);
  --border: var(--inv-line);
  --card-bg: var(--inv-panel);
  --accent: var(--inv-orange);
  display: flex;
  height: 100vh;
  padding: 28px;
  box-sizing: border-box;
  background: var(--inv-canvas);
  font-family: 'Inter', 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--dark);
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
/* ── 侧边栏 ── */
.inv-sidebar {
  width: 220px;
  background: #ecebe7;
  border: 0;
  border-radius: 30px 0 0 30px;
  box-shadow: inset -1px 0 0 rgba(23, 23, 21, 0.08);
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
  padding: 22px 18px 18px;
  border-bottom: 1px solid rgba(23, 23, 21, 0.08);
  position: relative;
}
.logo-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--inv-black);
  color: var(--inv-yellow);
}
.logo-icon svg circle:first-child { stroke: rgba(255, 255, 255, 0.72); }
.logo-icon svg circle:nth-child(2) { fill: var(--inv-yellow); opacity: 0.95; }
.logo-icon svg circle:nth-child(3) { fill: var(--inv-black); }
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
  background: var(--inv-mint);
  box-shadow: 0 0 0 4px rgba(153, 196, 159, 0.22);
  animation: lifepulse 2.5s ease-in-out infinite;
}
.life-dot.dormant {
  background: var(--dim);
  opacity: 0.5;
}
@keyframes lifepulse {
  0%,100% { box-shadow: 0 0 0 4px rgba(153, 196, 159, 0.22); }
  50% { box-shadow: 0 0 0 8px rgba(153, 196, 159, 0.08); }
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
  padding: 11px 12px;
  border-radius: 16px;
  text-decoration: none;
  color: rgba(23, 23, 21, 0.62);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  margin-bottom: 3px;
  border: 1px solid transparent;
  position: relative;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.58);
  color: var(--inv-ink);
  border-color: transparent;
}
.nav-item--active {
  background: var(--inv-black) !important;
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
  background: var(--inv-yellow);
  border-radius: 999px;
  transform: translateY(-50%);
}

/* 底部 */
.sidebar-footer {
  padding: 10px 10px 16px;
  border-top: 1px solid rgba(23, 23, 21, 0.08);
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
  background: var(--inv-shell);
  border-radius: 0 30px 30px 0;
}

/* 顶栏 */
.inv-topbar {
  height: 66px;
  background: transparent;
  border-bottom: 1px solid rgba(23, 23, 21, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 26px;
  flex-shrink: 0;
}
.topbar-left { display: flex; align-items: center; gap: 10px; }
.topbar-title {
  font-size: 24px;
  font-weight: 500;
  color: var(--dark);
  margin: 0;
  letter-spacing: 0;
}
.topbar-right { display: flex; align-items: center; gap: 12px; }

/* 实时时钟 */
.inv-clock {
  font-size: 11px;
  font-family: inherit;
  color: rgba(23, 23, 21, 0.5);
  letter-spacing: 0;
  opacity: 1;
}

/* 主题切换按钮 */
.topbar-theme-btns {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(23, 23, 21, 0.06);
  border-radius: 999px;
  padding: 2px 4px;
  border: 1px solid rgba(23, 23, 21, 0.08);
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
.topbar-theme-btn.active { background: var(--inv-black); color: #ffffff; box-shadow: none; }

/* 预算标签 */
.budget-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 999px;
  background: var(--inv-yellow);
  border: 1px solid transparent;
}
.budget-label {
  font-size: 8px;
  font-weight: 700;
  color: rgba(23, 23, 21, 0.56);
  font-family: inherit;
  letter-spacing: 0;
}
.budget-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--inv-ink);
  font-family: inherit;
  letter-spacing: 0;
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
  background: rgba(153, 196, 159, 0.32);
  border: 1px solid rgba(153, 196, 159, 0.22);
}
.status-tag.dormant {
  background: var(--faint);
  border: 1px solid var(--border);
}
.status-tag.survival {
  background: rgba(240, 96, 45, 0.16);
  border: 1px solid rgba(240, 96, 45, 0.22);
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
.alive .status-dot { background: var(--inv-mint); box-shadow: none; }
.dormant .status-dot { background: var(--dim); opacity: 0.5; }
.survival .status-dot { background: var(--inv-orange); animation: survPulse 1.2s ease-in-out infinite; }
.shutdown .status-dot { background: var(--dim); opacity: 0.3; }
@keyframes survPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.status-text {
  font-size: 9px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0;
}
.alive .status-text { color: #3f7a48; }
.dormant .status-text { color: var(--dim); opacity: 0.6; }
.survival .status-text { color: var(--inv-orange); }
.shutdown .status-text { color: var(--dim); opacity: 0.4; }

/* 内容区 */
.inv-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
  padding: 22px 26px 26px;
  background: transparent;
  overflow: hidden;
}
.inv-body--workspace {
  padding: 0;
  gap: 0;
}
.inv-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 0;
  scrollbar-width: thin;
}
.inv-content--workspace {
  padding: 0;
  overflow: hidden;
}

/* Adam 对话框：桌面端是右侧模块，移动端是底部浮层 */
.inv-adam-wrap {
  width: 360px;
  flex: 0 0 360px;
  min-height: 0;
  background: transparent;
  display: flex;
  align-items: flex-start;
}
.inv-adam-wrap :deep(.panel-chat) {
  width: 100%;
  max-height: 100%;
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
  .inv-layout { display: block; height: auto; min-height: 100vh; padding: 0; }
  .inv-main { border-radius: 0; }
  .inv-main { min-height: calc(100vh - 48px); }
  .inv-body {
    display: block;
    padding: 14px 12px 132px;
    overflow: visible;
  }
  .inv-body--workspace {
    padding: 0;
  }
  .inv-adam-wrap {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
    z-index: 40;
    display: block;
  }
  .inv-content { padding: 0; }
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

/* 投资部门模块化视觉覆盖：追参考图的浅灰画布 + 彩色功能块 */
.inv-layout,
.inv-layout * {
  letter-spacing: 0 !important;
}

.inv-layout button,
.inv-layout input,
.inv-layout textarea,
.inv-layout select {
  font-family: inherit !important;
}

.inv-layout :is(.panel, .panel-card, .status-card, .library-page, .chat-panel, .city-sidebar, .detail-panel, .hall-panel, .ws-chat-panel, .add-form, .knowledge-intro, .modal-box) {
  background: var(--inv-panel) !important;
  border: 0 !important;
  border-radius: 24px !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.inv-layout :is(.panel-head, .chat-header, .library-header, .modal-head, .modal-foot, .sidebar-title-bar) {
  background: transparent !important;
  border-color: rgba(23, 23, 21, 0.08) !important;
}

.inv-layout :is(.panel-title, .panel-hd, .header-sub, .tab-code, .metric-key, .emotion-label, .sidebar-section-title, .form-label) {
  color: rgba(23, 23, 21, 0.48) !important;
  font-family: inherit !important;
  text-transform: none !important;
}

.inv-layout :is(.panel-desc, .empty-sub, .header-sub, .output-time, .news-time, .code-cell, .index-code) {
  color: rgba(23, 23, 21, 0.42) !important;
  opacity: 1 !important;
}

.inv-layout :is(.btn-gold, .btn-confirm, .add-btn, .bar-send, .search-btn, .fund-deposit-btn, .detail-enter-hall) {
  background: var(--inv-black) !important;
  border-color: transparent !important;
  color: #fff !important;
  border-radius: 14px !important;
  box-shadow: none !important;
}

.inv-layout :is(.btn-ghost, .btn-cancel, .type-btn, .kline-period-btn) {
  background: rgba(23, 23, 21, 0.06) !important;
  border-color: transparent !important;
  color: rgba(23, 23, 21, 0.7) !important;
  border-radius: 999px !important;
}

.inv-layout :is(.form-input, .goal-input, .bar-input, .search-input) {
  background: #efede7 !important;
  border-color: transparent !important;
  border-radius: 16px !important;
  color: var(--inv-ink) !important;
}

/* 首页：把生命体观测改成参考图式大模块 */
.inv-layout .obs-home {
  max-width: 1500px !important;
  gap: 18px !important;
}

.inv-layout .obs-home .status-card {
  background: var(--inv-yellow) !important;
  border-radius: 34px !important;
  padding: 28px !important;
  min-height: 250px;
}

.inv-layout .obs-home .card-grid-texture {
  opacity: 0.16 !important;
  background:
    radial-gradient(circle at 78% 28%, rgba(8, 8, 6, 0.14) 0 2px, transparent 2px 12px),
    linear-gradient(135deg, transparent 0 58%, rgba(8, 8, 6, 0.08) 58% 62%, transparent 62%) !important;
}

.inv-layout .life-indicator {
  background: var(--inv-black) !important;
  border-radius: 18px !important;
}

.inv-layout .name-main,
.inv-layout .metric-val,
.inv-layout .index-price,
.inv-layout .flow-val,
.inv-layout .breadth-val {
  color: var(--inv-ink) !important;
  font-family: inherit !important;
  font-weight: 800 !important;
}

.inv-layout .name-id,
.inv-layout .metric-val.positive,
.inv-layout .metric-val.credit {
  color: var(--inv-orange) !important;
}

.inv-layout .metrics-strip {
  display: grid !important;
  grid-template-columns: repeat(5, minmax(112px, 1fr)) !important;
  gap: 10px !important;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  overflow: visible !important;
}

.inv-layout .metric-block {
  align-items: flex-start !important;
  gap: 6px !important;
  min-height: 86px !important;
  padding: 14px !important;
  border-radius: 22px !important;
  background: rgba(255, 255, 255, 0.58) !important;
}

.inv-layout .metric-divider {
  display: none !important;
}

.inv-layout .energy-bar-wrap,
.inv-layout .accuracy-track,
.inv-layout .sector-bar {
  background: rgba(23, 23, 21, 0.1) !important;
}

.inv-layout .energy-bar,
.inv-layout .accuracy-fill,
.inv-layout .sector-fill {
  background: var(--inv-black) !important;
}

.inv-layout .triple-grid {
  grid-template-columns: minmax(280px, 1fr) minmax(260px, 0.9fr) !important;
  gap: 16px !important;
}

.inv-layout .panel-log {
  grid-column: 1 / -1 !important;
  min-height: 220px !important;
}

.inv-layout .panel-instruction {
  background: var(--inv-black) !important;
  color: #fff !important;
}

.inv-layout .panel-instruction :is(.panel-title, .panel-desc, .empty-text, .empty-sub, .instruction-title, .instruction-thesis, .instruction-time, .instruction-conf) {
  color: rgba(255, 255, 255, 0.86) !important;
}

.inv-layout .panel-instruction .instruction-card {
  background: rgba(255, 255, 255, 0.09) !important;
  border-radius: 22px !important;
}

.inv-layout .panel-instruction .instruction-glow-bar {
  background: var(--inv-yellow) !important;
}

.inv-layout .panel-trust {
  background: var(--inv-mint) !important;
}

.inv-layout .trust-rung {
  background: rgba(255, 255, 255, 0.32) !important;
  border-radius: 16px !important;
  opacity: 1 !important;
}

.inv-layout .trust-rung.active {
  background: var(--inv-yellow) !important;
  border-color: transparent !important;
}

.inv-layout :is(.rung-name, .pending-type, .event-text, .event-stage-tag, .event-time) {
  color: var(--inv-ink) !important;
}

/* 市场页：金融模块驾驶舱 */
.inv-layout .market-page .tab-bar,
.inv-layout .library-page .tab-switch {
  display: inline-flex !important;
  width: fit-content !important;
  max-width: 100% !important;
  gap: 4px !important;
  padding: 5px !important;
  margin-bottom: 18px !important;
  background: #e8e6df !important;
  border: 0 !important;
  border-radius: 999px !important;
}

.inv-layout .market-page .tab-btn,
.inv-layout .library-page .tab-btn {
  border: 0 !important;
  border-radius: 999px !important;
  bottom: 0 !important;
  padding: 9px 16px !important;
}

.inv-layout .market-page .tab-btn.active,
.inv-layout .library-page .tab-btn.active {
  background: var(--inv-black) !important;
  color: #fff !important;
}

.inv-layout .market-page .tab-btn.active .tab-code {
  color: var(--inv-yellow) !important;
}

.inv-layout .indices-row,
.inv-layout .breadth-grid,
.inv-layout .sector-grid,
.inv-layout .flow-grid,
.inv-layout .discovery-list,
.inv-layout .rec-list,
.inv-layout .watchlist {
  background: transparent !important;
  gap: 12px !important;
  padding: 16px !important;
}

.inv-layout :is(.index-card, .breadth-card, .sector-card, .flow-card, .discovery-card, .rec-card, .watch-card, .kb-card, .knowledge-card, .reflection-card, .output-item, .quick-item, .prompt-card, .inst-item, .tool-chip, .ledger-row, .transfer-card, .loan-item) {
  border: 0 !important;
  border-radius: 20px !important;
  box-shadow: none !important;
}

.inv-layout .index-card {
  min-height: 120px !important;
  padding: 18px !important;
}

.inv-layout .index-card:nth-child(1),
.inv-layout .breadth-card:nth-child(1),
.inv-layout .knowledge-card:nth-child(1),
.inv-layout .prompt-card:nth-child(1) {
  background: var(--inv-yellow) !important;
}

.inv-layout .index-card:nth-child(2),
.inv-layout .breadth-card:nth-child(2),
.inv-layout .knowledge-card:nth-child(2),
.inv-layout .prompt-card:nth-child(2) {
  background: var(--inv-orange) !important;
}

.inv-layout .index-card:nth-child(3),
.inv-layout .breadth-card:nth-child(3),
.inv-layout .knowledge-card:nth-child(3),
.inv-layout .prompt-card:nth-child(3) {
  background: var(--inv-mint) !important;
}

.inv-layout .index-card:nth-child(4),
.inv-layout .breadth-card:nth-child(4),
.inv-layout .knowledge-card:nth-child(4),
.inv-layout .prompt-card:nth-child(4) {
  background: var(--inv-black) !important;
  color: #fff !important;
}

.inv-layout .index-card:nth-child(5) {
  background: var(--inv-blue) !important;
}

.inv-layout .index-card:nth-child(4) :is(.index-name, .index-code, .index-price, .index-change),
.inv-layout .breadth-card:nth-child(4) :is(.breadth-label, .breadth-val, .breadth-sub),
.inv-layout .knowledge-card:nth-child(4) :is(.card-title, .card-domain, .card-tag, .card-toggle, .content-text),
.inv-layout .prompt-card:nth-child(4) :is(.prompt-label, .prompt-icon) {
  color: #fff !important;
}

.inv-layout .kline-panel {
  background: var(--inv-black) !important;
  color: #fff !important;
}

.inv-layout .kline-panel :is(.panel-title, .panel-desc, .kline-loading, .kline-period-btn) {
  color: rgba(255, 255, 255, 0.72) !important;
}

.inv-layout .kline-wrap {
  background: var(--inv-black) !important;
  border-radius: 0 0 24px 24px !important;
}

.inv-layout .rank-table tbody tr,
.inv-layout .rank-table thead th,
.inv-layout .news-item {
  border-color: rgba(23, 23, 21, 0.08) !important;
}

.inv-layout .up,
.inv-layout .flow-val.positive,
.inv-layout .fund-balance-val.positive {
  color: var(--inv-red) !important;
}

.inv-layout .down,
.inv-layout .flow-val.negative,
.inv-layout .fund-balance-val.negative {
  color: #477aa2 !important;
}

/* 顾问和设计师工作台 */
.inv-layout :is(.marketing-dept, .designer-dept) {
  max-width: 1500px !important;
}

.inv-layout :is(.marketing-dept, .designer-dept) .dept-employee-card {
  background: var(--inv-black) !important;
  border: 0 !important;
  border-radius: 28px !important;
  color: #fff !important;
  box-shadow: none !important;
}

.inv-layout :is(.marketing-dept, .designer-dept) .dec-illus {
  background: var(--inv-yellow) !important;
}

.inv-layout :is(.marketing-dept, .designer-dept) :is(.dec-name, .dec-role, .dec-desc, .dec-stat-value, .dec-stat-label) {
  color: rgba(255, 255, 255, 0.88) !important;
}

.inv-layout :is(.marketing-dept, .designer-dept) .three-col {
  grid-template-columns: 220px minmax(0, 1fr) !important;
  gap: 16px !important;
}

.inv-layout :is(.marketing-dept, .designer-dept) .right-panel {
  grid-column: 1 / -1 !important;
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
  gap: 12px !important;
}

.inv-layout :is(.marketing-dept, .designer-dept) .chat-panel {
  min-height: 560px !important;
  padding: 16px 16px 0 !important;
}

.inv-layout :is(.marketing-dept, .designer-dept) .chat-header {
  background: var(--inv-black) !important;
  border-radius: 20px !important;
  padding: 14px !important;
}

.inv-layout :is(.marketing-dept, .designer-dept) :is(.chat-agent-name, .chat-agent-sub) {
  color: #fff !important;
}

.inv-layout .assistant .msg-bubble {
  background: #efede7 !important;
}

.inv-layout .user .msg-bubble {
  background: var(--inv-yellow) !important;
  border-color: transparent !important;
}

/* 档案馆 / 图书馆 */
.inv-layout .archive-page,
.inv-layout .library-page {
  max-width: 1180px !important;
  background: transparent !important;
  border: 0 !important;
  overflow: visible !important;
}

.inv-layout .library-header {
  background: var(--inv-panel) !important;
  border-radius: 28px !important;
  margin-bottom: 16px !important;
  border: 0 !important;
}

.inv-layout .kb-grid,
.inv-layout .knowledge-grid {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important;
  gap: 14px !important;
}

.inv-layout .kb-card,
.inv-layout .knowledge-card,
.inv-layout .reflection-card {
  background: var(--inv-panel) !important;
  padding: 18px !important;
}

.inv-layout .kb-card:nth-child(3n + 1),
.inv-layout .reflection-card:nth-child(3n + 1) {
  background: var(--inv-yellow) !important;
}

.inv-layout .kb-card:nth-child(3n + 2),
.inv-layout .reflection-card:nth-child(3n + 2) {
  background: var(--inv-mint) !important;
}

.inv-layout .kb-card:nth-child(3n + 3),
.inv-layout .reflection-card:nth-child(3n + 3) {
  background: var(--inv-black) !important;
  color: #fff !important;
}

.inv-layout .kb-card:nth-child(3n + 3) :is(.kb-card-title, .kb-card-summary, .kb-category, .kb-time, .kb-source, .kb-expand-hint, .kb-tag),
.inv-layout .reflection-card:nth-child(3n + 3) :is(.reflection-content, .reflection-id, .reflection-time, .link-label, .link-tag) {
  color: rgba(255, 255, 255, 0.86) !important;
}

/* 园区 / 工作区 / 大厅 */
.inv-layout .city-page,
.inv-layout .workspace-root,
.inv-layout .hall-page {
  background: var(--inv-canvas) !important;
  color: var(--inv-ink) !important;
}

.inv-layout .city-page {
  gap: 18px !important;
  padding: 20px !important;
  box-sizing: border-box !important;
}

.inv-layout .city-sidebar {
  width: 280px !important;
  margin-right: 0 !important;
}

.inv-layout .city-sidebar.collapsed {
  width: 52px !important;
}

.inv-layout .city-main,
.inv-layout .iso-viewport,
.inv-layout .ws-scene,
.inv-layout .hall-scene {
  background: var(--inv-panel) !important;
  border-radius: 28px !important;
  overflow: hidden !important;
}

.inv-layout :is(.ws-wall-left, .ws-wall-right, .ws-floor, .hall-wall, .hall-floor) {
  opacity: 0.18 !important;
  filter: saturate(0.25) brightness(1.8) !important;
}

.inv-layout :is(.ws-label, .npc-name, .prop-label) {
  background: var(--inv-black) !important;
  color: #fff !important;
  border-radius: 999px !important;
  padding: 4px 9px !important;
  text-shadow: none !important;
}

.inv-layout .ws-statusbar,
.inv-layout .hall-hud {
  background: var(--inv-black) !important;
  color: #fff !important;
  border: 0 !important;
  border-radius: 22px !important;
}

.inv-layout .workspace-root {
  gap: 16px !important;
  padding: 18px !important;
  box-sizing: border-box !important;
  font-family: inherit !important;
}

.inv-layout .hall-page {
  padding: 18px !important;
  gap: 16px !important;
  font-family: inherit !important;
}

.inv-layout .hall-body {
  gap: 16px !important;
}

.inv-layout .panel-tab.on {
  background: var(--inv-yellow) !important;
  color: var(--inv-ink) !important;
}

@media (max-width: 1100px) {
  .inv-layout .triple-grid,
  .inv-layout :is(.marketing-dept, .designer-dept) .three-col {
    grid-template-columns: 1fr !important;
  }

  .inv-layout .indices-row {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 767px) {
  .inv-layout :is(.panel, .panel-card, .status-card, .library-page, .chat-panel, .city-sidebar, .detail-panel, .hall-panel, .ws-chat-panel) {
    border-radius: 18px !important;
  }

  .inv-layout .metrics-strip {
    grid-template-columns: 1fr 1fr !important;
  }

  .inv-layout .indices-row {
    grid-template-columns: 1fr !important;
  }
}
</style>
