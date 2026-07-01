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
      <div v-if="!isMobile && route.path !== '/investment/city'" class="inv-color-rail" aria-label="Theme quick switcher">
        <span class="rail-chevron">⌃</span>
        <button
          type="button"
          class="rail-dot rail-dot--paper"
          :class="{ active: appStore.theme === 'light' }"
          title="Light"
          @click="appStore.setTheme('light')"
        ></button>
        <button
          type="button"
          class="rail-dot rail-dot--aqua"
          :class="{ active: appStore.theme === 'eye' }"
          title="Soft"
          @click="appStore.setTheme('eye')"
        ></button>
        <button
          type="button"
          class="rail-dot rail-dot--ink"
          :class="{ active: appStore.theme === 'dark' }"
          title="Dark"
          @click="appStore.setTheme('dark')"
        ></button>
        <router-link class="rail-dot rail-dot--blue" to="/investment/city" title="Open campus map" aria-label="Open campus map"></router-link>
        <span class="rail-chevron">⌄</span>
      </div>

      <div v-if="!isMobile && route.path === '/investment'" class="inv-hero-copy" aria-label="Adam investment hero">
        <div class="hero-count">
          <span></span>
          <span class="active"></span>
          <span></span>
          <span></span>
          <b>01/03</b>
        </div>
        <h2>
          <span>Adam</span>
          <span>Invest,</span>
          <strong>Today</strong>
        </h2>
        <div class="hero-actions">
          <router-link class="hero-primary" to="/investment/workspace">
            <span>↗</span>
            Open Desk
          </router-link>
          <router-link class="hero-link" to="/investment/market">View Market</router-link>
        </div>
      </div>

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
          <div v-if="!isMobile && route.path === '/investment'" class="inv-campus-map" aria-label="Adam campus map preview">
            <div class="inv-campus-real-map" aria-hidden="true">
              <CampusMapPreview />
            </div>
            <router-link class="campus-map-open" to="/investment/city" aria-label="打开完整园区地图">
              <span>园区地图</span>
              <b>打开完整视图</b>
            </router-link>
          </div>
        </section>

        <aside v-if="route.path !== '/investment/city'" class="inv-adam-wrap">
          <AdamChat />
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAdamStore } from '@/stores/adam'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'
import { Eye, TrendingUp, ChevronLeft, Menu, Map, BarChart3, BookOpen, Library, Palette, Home } from 'lucide-vue-next'
import CaptainBar from '@/components/CaptainBar.vue'
import AdamChat from '@/components/AdamChat.vue'

const CampusMapPreview = defineAsyncComponent(() => import('@/views/investment/City.vue'))

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
  --inv-aqua: #c7ddd6;
  --inv-accent-blue: #2f6fed;
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
  --accent: var(--inv-accent-blue);
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
  color: var(--inv-aqua);
}
.logo-icon svg circle:first-child { stroke: rgba(255, 255, 255, 0.72); }
.logo-icon svg circle:nth-child(2) { fill: var(--inv-aqua); opacity: 0.95; }
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
  background: var(--inv-aqua);
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
  background: var(--inv-aqua);
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
  background: rgba(47, 111, 237, 0.14);
  border: 1px solid rgba(47, 111, 237, 0.2);
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
.survival .status-dot { background: var(--inv-accent-blue); animation: survPulse 1.2s ease-in-out infinite; }
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
.survival .status-text { color: var(--inv-accent-blue); }
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
  background: var(--inv-aqua) !important;
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
  color: var(--inv-accent-blue) !important;
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
  background: var(--inv-aqua) !important;
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
  background: var(--inv-aqua) !important;
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
  color: var(--inv-aqua) !important;
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
  background: var(--inv-aqua) !important;
}

.inv-layout .index-card:nth-child(2),
.inv-layout .breadth-card:nth-child(2),
.inv-layout .knowledge-card:nth-child(2),
.inv-layout .prompt-card:nth-child(2) {
  background: var(--inv-accent-blue) !important;
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
  background: var(--inv-aqua) !important;
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
  background: var(--inv-aqua) !important;
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
  background: var(--inv-aqua) !important;
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
  background: var(--inv-aqua) !important;
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

/* ═══════════════════════════════════════════════════
   Reference chase — desktop composition closer to IMG_5912
   顶部横向导航 + 左标题 + 中央薄荷主视觉 + 右蓝色 Adam 卡
   ═══════════════════════════════════════════════════ */
@media (min-width: 1180px) {
  .inv-layout {
    padding: 34px !important;
    display: block !important;
    background: #d7d7d4 !important;
    overflow: hidden !important;
  }

  .inv-main {
    position: relative !important;
    width: 100% !important;
    height: calc(100vh - 68px) !important;
    min-height: 760px !important;
    border-radius: 32px !important;
    background: #f4f3f1 !important;
    overflow: hidden !important;
    box-shadow: none !important;
  }

  /* 把原左侧栏重排成参考图顶部导航 */
  .inv-sidebar {
    position: absolute !important;
    z-index: 30 !important;
    top: 48px !important;
    left: 82px !important;
    right: 82px !important;
    width: auto !important;
    height: 48px !important;
    display: grid !important;
    grid-template-columns: 190px minmax(0, 1fr) 110px !important;
    align-items: center !important;
    background: transparent !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  .inv-sidebar .sidebar-logo {
    padding: 0 !important;
    border: 0 !important;
    gap: 0 !important;
  }

  .inv-sidebar .logo-icon,
  .inv-sidebar .logo-sub,
  .inv-sidebar .life-dot {
    display: none !important;
  }

  .inv-sidebar .logo-text {
    font-size: 14px !important;
    font-weight: 900 !important;
    letter-spacing: -0.04em !important;
    color: #11110f !important;
  }

  .inv-sidebar .logo-text::after {
    content: ".";
  }

  .inv-sidebar .sidebar-nav {
    height: 48px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .inv-sidebar .nav-section-title {
    display: none !important;
  }

  .inv-sidebar .nav-item {
    height: 32px !important;
    margin: 0 !important;
    padding: 0 16px !important;
    border: 0 !important;
    border-radius: 999px !important;
    background: transparent !important;
    color: rgba(18, 18, 16, 0.62) !important;
    font-size: 11px !important;
    font-weight: 500 !important;
    gap: 0 !important;
    transition: color 0.18s ease, background 0.18s ease !important;
  }

  .inv-sidebar .nav-item svg {
    display: none !important;
  }

  .inv-sidebar .nav-item:not(:last-child)::after {
    content: "";
    position: absolute;
    right: 0;
    top: 10px;
    width: 1px;
    height: 12px;
    background: rgba(18, 18, 16, 0.34);
  }

  .inv-sidebar .nav-item:hover {
    background: rgba(255, 255, 255, 0.54) !important;
    color: #11110f !important;
  }

  .inv-sidebar .nav-item--active {
    background: transparent !important;
    color: #11110f !important;
    font-weight: 800 !important;
  }

  .inv-sidebar .nav-item--active::before {
    display: none !important;
  }

  .inv-sidebar .sidebar-footer {
    padding: 0 !important;
    border: 0 !important;
    display: flex !important;
    justify-content: flex-end !important;
  }

  .inv-sidebar .nav-item--back {
    width: 42px !important;
    height: 42px !important;
    padding: 0 !important;
    justify-content: center !important;
    background: transparent !important;
    color: #11110f !important;
  }

  .inv-sidebar .nav-item--back .nav-item-label {
    display: none !important;
  }

  .inv-sidebar .nav-item--back svg {
    display: block !important;
    transform: rotate(180deg);
  }

  /* 顶部右侧操作，模拟参考图的黑色 CTA + 小状态胶囊 */
  .inv-topbar {
    position: absolute !important;
    z-index: 32 !important;
    top: 48px !important;
    right: 112px !important;
    width: auto !important;
    height: 48px !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    gap: 12px !important;
  }

  .inv-topbar .topbar-left,
  .inv-topbar .inv-clock,
  .inv-topbar .topbar-theme-btns {
    display: none !important;
  }

  .inv-topbar .topbar-right {
    gap: 10px !important;
  }

  .inv-topbar .budget-tag {
    min-height: 42px !important;
    padding: 0 20px !important;
    border-radius: 10px !important;
    background: #11110f !important;
    color: #fff !important;
  }

  .inv-topbar .budget-label {
    display: none !important;
  }

  .inv-topbar .budget-val {
    color: #fff !important;
    font-size: 12px !important;
    font-weight: 800 !important;
  }

  .inv-topbar .budget-val::before {
    content: "Budget ";
    font-weight: 700;
  }

  .inv-topbar .status-tag {
    min-height: 42px !important;
    padding: 0 14px !important;
    border-radius: 999px !important;
    background: rgba(255, 255, 255, 0.64) !important;
    border: 0 !important;
  }

  .inv-topbar .status-text {
    color: #11110f !important;
  }

  /* 左侧颜色控制条，追参考图的装饰比例 */
  .inv-color-rail {
    position: absolute;
    z-index: 24;
    left: 82px;
    top: 126px;
    width: 40px;
    height: 194px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    color: #11110f;
  }

  .inv-color-rail::before {
    content: "Colors";
    position: absolute;
    left: 0;
    top: -30px;
    font-size: 11px;
    color: rgba(17, 17, 15, 0.72);
  }

  .rail-chevron {
    font-size: 13px;
    line-height: 1;
    color: rgba(17, 17, 15, 0.8);
  }

  .rail-dot {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: block;
    border: 0;
    padding: 0;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.16s ease, box-shadow 0.16s ease;
  }

  .rail-dot:hover,
  .rail-dot:focus-visible {
    transform: scale(1.08);
    box-shadow: 0 0 0 4px rgba(47, 111, 237, 0.14);
    outline: none;
  }

  .rail-dot.active {
    box-shadow: 0 0 0 3px #f4f3f1, 0 0 0 5px rgba(17, 17, 15, 0.16);
  }

  .rail-dot--paper { background: #dcdcd9; }
  .rail-dot--aqua { background: #c7ddd6; }
  .rail-dot--ink { background: #242729; }
  .rail-dot--blue { background: #2f6fed; }

  .inv-hero-copy {
    position: absolute;
    z-index: 25;
    left: 82px;
    top: 360px;
    width: 190px;
    color: #11110f;
  }

  .hero-count {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 28px;
    color: #11110f;
  }

  .hero-count span {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: rgba(17, 17, 15, 0.16);
  }

  .hero-count span.active {
    width: 10px;
    height: 10px;
    background: #11110f;
    box-shadow: 0 0 0 3px #f4f3f1, 0 0 0 4px rgba(17, 17, 15, 0.18);
  }

  .hero-count b {
    margin-left: auto;
    font-size: 15px;
    font-weight: 500;
  }

  .inv-hero-copy h2 {
    margin: 0;
    font-size: clamp(45px, 4.2vw, 64px);
    line-height: 0.94;
    letter-spacing: -0.08em !important;
    font-weight: 260;
  }

  .inv-hero-copy h2 span,
  .inv-hero-copy h2 strong {
    display: block;
  }

  .inv-hero-copy h2 strong {
    margin-top: 8px;
    font-weight: 900;
    letter-spacing: -0.07em !important;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 22px;
    margin-top: 30px;
  }

  .hero-primary {
    height: 40px;
    padding: 0 18px;
    border: 0;
    border-radius: 8px;
    background: #11110f;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    line-height: 1;
    transition: transform 0.16s ease, background 0.16s ease;
  }

  .hero-primary:hover,
  .hero-primary:focus-visible {
    transform: translateY(-1px);
    background: #2f6fed;
    outline: none;
  }

  .hero-primary span {
    margin-right: 8px;
  }

  .hero-link {
    color: rgba(17, 17, 15, 0.72);
    font-size: 12px;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  /* 内容区在参考图里从标题右侧开始 */
  .inv-body:not(.inv-body--workspace) {
    position: relative !important;
    height: 100% !important;
    padding: 132px 78px 54px 280px !important;
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 178px !important;
    gap: 34px !important;
    overflow: hidden !important;
    background: transparent !important;
  }

  .inv-content:not(.inv-content--workspace) {
    overflow: visible !important;
    min-height: 0 !important;
  }

  .inv-body:not(.inv-body--workspace) .inv-content {
    align-self: stretch !important;
    position: relative !important;
  }

  .inv-campus-map {
    position: absolute;
    z-index: 3;
    inset: 0;
    border-radius: 36px;
    overflow: hidden;
    pointer-events: none;
  }

  .inv-campus-real-map {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
    opacity: 0.72;
    filter: saturate(0.74) contrast(0.94) brightness(1.05);
    pointer-events: none;
  }

  .inv-campus-real-map::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 48% 47%, rgba(255, 255, 255, 0.26), transparent 0 26%),
      linear-gradient(90deg, rgba(199, 221, 214, 0.3), rgba(199, 221, 214, 0.2));
  }

  .inv-campus-real-map .city-page {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    display: block !important;
    padding: 0 !important;
    gap: 0 !important;
    background: transparent !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }

  .inv-campus-real-map :is(.city-sidebar, .city-chat, .mood-badge, .zone-labels, .iso-hud, .iso-controls, .dialog-mask, .hall-enter-overlay, .bldg-callout, .bldg-enter-btn, .adam-popup, .adam-bubble, .weather-rain) {
    display: none !important;
  }

  .inv-campus-real-map .city-main,
  .inv-campus-real-map .iso-viewport {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    display: block !important;
    border-radius: inherit !important;
    background: transparent !important;
    overflow: hidden !important;
    cursor: default !important;
  }

  .inv-campus-real-map .iso-scene {
    top: 50% !important;
    left: 50% !important;
    transition: none !important;
  }

  .inv-campus-real-map :is(.iso-ground, .iso-bldg, .deco-tree, .iso-decor, .iso-statue, .adam-character) {
    pointer-events: none !important;
  }

  .campus-map-open {
    position: absolute;
    z-index: 9;
    right: 28px;
    bottom: 28px;
    min-width: 138px;
    padding: 12px 15px;
    border-radius: 18px;
    background: rgba(17, 17, 15, 0.9);
    color: #fff;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 3px;
    pointer-events: auto;
    transition: transform 0.16s ease, background 0.16s ease;
  }

  .campus-map-open span {
    color: rgba(255, 255, 255, 0.64);
    font-size: 10px;
    line-height: 1;
  }

  .campus-map-open b {
    color: #fff;
    font-size: 12px;
    line-height: 1.1;
    font-weight: 900;
    letter-spacing: -0.03em !important;
  }

  .campus-map-open:hover,
  .campus-map-open:focus-visible {
    transform: translateY(-2px);
    background: #2f6fed;
    outline: none;
  }

  /* 首页：把 Index 里的三层卡片摆成参考图比例 */
  .inv-layout .obs-home {
    height: 100% !important;
    max-width: none !important;
    display: grid !important;
    grid-template-columns: minmax(360px, 1.15fr) minmax(230px, 0.72fr) minmax(220px, 0.62fr) !important;
    grid-template-rows: minmax(380px, 1fr) 150px !important;
    gap: 24px 28px !important;
    align-items: stretch !important;
  }

  .inv-layout .obs-home .layer {
    width: auto !important;
    min-width: 0 !important;
  }

  .inv-layout .obs-home .layer-status {
    grid-column: 1 / -1 !important;
    grid-row: 1 !important;
    min-width: 0 !important;
  }

  .inv-layout .obs-home .layer-panels,
  .inv-layout .obs-home .triple-grid {
    display: contents !important;
  }

  .inv-layout .obs-home .status-card {
    height: 100% !important;
    min-height: 380px !important;
    border-radius: 36px !important;
    padding: 0 !important;
    overflow: visible !important;
    background: #c7ddd6 !important;
    box-shadow: none !important;
  }

  .inv-layout .obs-home .card-grid-texture {
    border-radius: inherit !important;
    opacity: 0.28 !important;
    background:
      radial-gradient(circle at 78% 70%, rgba(17, 17, 15, 0.13) 0 2px, transparent 2px 11px),
      repeating-linear-gradient(135deg, transparent 0 8px, rgba(17, 17, 15, 0.08) 8px 11px, transparent 11px 18px) !important;
    mask-image: radial-gradient(circle at 72% 74%, #000 0 22%, transparent 23% 100%);
  }

  .inv-layout .obs-home .status-header {
    position: absolute !important;
    inset: 0 !important;
    margin: 0 !important;
    display: block !important;
    z-index: 2 !important;
  }

  .inv-layout .obs-home .adam-identity {
    position: static !important;
    display: block !important;
  }

  .inv-layout .obs-home .life-indicator {
    position: absolute !important;
    left: 50% !important;
    top: 54% !important;
    width: min(34vw, 340px) !important;
    height: min(34vw, 340px) !important;
    border-radius: 50% !important;
    background: transparent !important;
    transform: translate(-50%, -50%) !important;
    filter: drop-shadow(0 24px 24px rgba(76, 55, 22, 0.2)) !important;
  }

  .inv-layout .obs-home .life-indicator::before {
    content: "";
    position: absolute;
    left: 17%;
    top: 22%;
    width: 68%;
    height: 68%;
    border-radius: 44% 56% 54% 46%;
    background: rgba(255, 255, 255, 0.32);
    transform: rotate(-14deg);
  }

  .inv-layout .obs-home .adam-identity-img {
    position: relative !important;
    z-index: 2 !important;
    width: 82% !important;
    height: 82% !important;
    object-fit: contain !important;
  }

  .inv-layout .obs-home .life-orbit {
    display: none !important;
  }

  .inv-layout .obs-home .adam-name {
    position: absolute !important;
    left: 30px !important;
    bottom: 30px !important;
    z-index: 3 !important;
    max-width: 230px !important;
    gap: 5px !important;
  }

  .inv-layout .obs-home .name-main {
    font-size: 28px !important;
    line-height: 0.95 !important;
    font-weight: 900 !important;
    letter-spacing: -0.06em !important;
  }

  .inv-layout .obs-home .name-id {
    color: #2f6fed !important;
  }

  .inv-layout .obs-home .name-sub {
    color: rgba(17, 17, 15, 0.58) !important;
    font-family: inherit !important;
    font-size: 11px !important;
    letter-spacing: -0.01em !important;
  }

  .inv-layout .obs-home .header-right {
    position: absolute !important;
    top: 26px !important;
    left: 26px !important;
    z-index: 4 !important;
    display: flex !important;
    align-items: flex-start !important;
    gap: 10px !important;
  }

  .inv-layout .obs-home .sys-tag {
    height: 80px !important;
    width: 170px !important;
    box-sizing: border-box !important;
    align-items: flex-start !important;
    padding: 14px !important;
    border-radius: 22px !important;
    background: rgba(255, 255, 255, 0.82) !important;
    border: 0 !important;
    color: #11110f !important;
    font-family: inherit !important;
  }

  .inv-layout .obs-home .sys-label {
    color: #11110f !important;
    letter-spacing: 0 !important;
  }

  .inv-layout .obs-home .activate-btn {
    height: 48px !important;
    padding: 0 18px !important;
    border-radius: 999px !important;
    background: #2f6fed !important;
    color: #fff !important;
    border: 0 !important;
  }

  .inv-layout .obs-home .metrics-strip {
    position: absolute !important;
    top: 26px !important;
    right: 28px !important;
    z-index: 4 !important;
    width: auto !important;
    display: flex !important;
    gap: 14px !important;
    padding: 0 !important;
    background: transparent !important;
  }

  .inv-layout .obs-home .metric-block {
    width: 62px !important;
    height: 62px !important;
    min-height: 0 !important;
    box-sizing: border-box !important;
    padding: 8px !important;
    border-radius: 50% !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    background: rgba(255, 255, 255, 0.36) !important;
    overflow: hidden !important;
  }

  .inv-layout .obs-home .metric-block:nth-of-type(1) {
    background: #2f6fed !important;
    color: #fff !important;
  }

  .inv-layout .obs-home .metric-block:nth-of-type(3) {
    background: #11110f !important;
    color: #fff !important;
  }

  .inv-layout .obs-home .metric-block:nth-of-type(5) {
    background: #a9c9df !important;
  }

  .inv-layout .obs-home .metric-key {
    display: none !important;
  }

  .inv-layout .obs-home .metric-val {
    max-width: 52px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    font-size: 11px !important;
    line-height: 1.08 !important;
    color: currentColor !important;
  }

  .inv-layout .obs-home .metric-unit {
    font-size: 9px !important;
  }

  .inv-layout .obs-home .energy-bar-wrap {
    width: 42px !important;
    height: 5px !important;
    background: rgba(17, 17, 15, 0.14) !important;
  }

  .inv-layout .obs-home .energy-num {
    font-size: 10px !important;
  }

  .inv-layout .obs-home .emotion-strip {
    position: absolute !important;
    left: 50% !important;
    bottom: -24px !important;
    z-index: 6 !important;
    width: 190px !important;
    min-height: 58px !important;
    padding: 8px 12px !important;
    box-sizing: border-box !important;
    border-radius: 24px !important;
    background: #2f6fed !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
    transform: translateX(-50%) !important;
  }

  .inv-layout .obs-home .emotion-label {
    color: rgba(255, 255, 255, 0.82) !important;
    font-size: 9px !important;
  }

  .inv-layout .obs-home .emotion-bars {
    gap: 5px !important;
    align-items: flex-end !important;
  }

  .inv-layout .obs-home .emotion-bar-bg {
    width: 12px !important;
    height: 24px !important;
    background: rgba(255, 255, 255, 0.22) !important;
    border-radius: 999px !important;
  }

  .inv-layout .obs-home .emotion-bar-fill {
    background: #c7ddd6 !important;
  }

  .inv-layout .obs-home .emotion-name {
    display: none !important;
  }

  .inv-layout .obs-home .panel-instruction {
    grid-column: 1 !important;
    grid-row: 2 !important;
    align-self: end !important;
    min-height: 126px !important;
    padding: 0 !important;
    background: transparent !important;
    border-radius: 0 !important;
    color: #11110f !important;
    overflow: visible !important;
  }

  .inv-layout .obs-home .panel-instruction .panel-head {
    display: none !important;
  }

  .inv-layout .obs-home .panel-instruction .instruction-card,
  .inv-layout .obs-home .panel-instruction .empty-state {
    min-height: 112px !important;
    padding: 16px 18px !important;
    border-radius: 24px !important;
    background: #11110f !important;
    color: #fff !important;
  }

  .inv-layout .obs-home .panel-instruction :is(.instruction-title, .instruction-thesis, .instruction-conf, .instruction-time, .empty-text, .empty-sub) {
    color: rgba(255, 255, 255, 0.86) !important;
  }

  .inv-layout .obs-home .panel-instruction .instruction-actions {
    margin-top: 12px !important;
  }

  .inv-layout .obs-home .panel-instruction .btn-gold,
  .inv-layout .obs-home .panel-instruction .btn-ghost {
    min-height: 34px !important;
    border-radius: 999px !important;
  }

  .inv-layout .obs-home .panel-instruction .btn-gold {
    background: #c7ddd6 !important;
    color: #11110f !important;
  }

  .inv-layout .obs-home .panel-trust,
  .inv-layout .obs-home .panel-log {
    grid-row: 2 !important;
    min-height: 126px !important;
    padding: 0 !important;
    background: transparent !important;
    border-radius: 0 !important;
    overflow: hidden !important;
  }

  .inv-layout .obs-home .panel-trust {
    grid-column: 2 !important;
  }

  .inv-layout .obs-home .panel-log {
    grid-column: 3 !important;
    justify-self: stretch !important;
    width: auto !important;
    transform: none !important;
  }

  .inv-layout .obs-home .panel-trust .panel-head,
  .inv-layout .obs-home .panel-log .panel-head {
    padding: 0 0 10px !important;
    border: 0 !important;
  }

  .inv-layout .obs-home .panel-trust .panel-icon,
  .inv-layout .obs-home .panel-log .panel-icon {
    display: none !important;
  }

  .inv-layout .obs-home .panel-trust .panel-title,
  .inv-layout .obs-home .panel-log .panel-title {
    color: #11110f !important;
    font-size: 13px !important;
    font-weight: 800 !important;
  }

  .inv-layout .obs-home .trust-ladder,
  .inv-layout .obs-home .event-list {
    max-height: 96px !important;
    overflow: hidden !important;
    padding: 0 !important;
  }

  .inv-layout .obs-home .trust-rung {
    min-height: 28px !important;
    margin-bottom: 5px !important;
    padding: 6px 8px !important;
    border-radius: 999px !important;
    background: rgba(17, 17, 15, 0.06) !important;
  }

  .inv-layout .obs-home .trust-rung:not(.active) {
    display: none !important;
  }

  .inv-layout .obs-home .trust-rung.active {
    display: flex !important;
    background: #99c49f !important;
  }

  .inv-layout .obs-home .rung-perms,
  .inv-layout .obs-home .rung-progress,
  .inv-layout .obs-home .event-stage-tag {
    display: none !important;
  }

  .inv-layout .obs-home .event-item {
    grid-template-columns: 42px 1fr !important;
    gap: 8px !important;
    min-height: 24px !important;
  }

  .inv-layout .obs-home .event-timeline {
    display: none !important;
  }

  .inv-layout .obs-home .event-text {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  /* 右侧 Adam：压成参考图的蓝色手机卡 */
  .inv-adam-wrap {
    width: 178px !important;
    flex: 0 0 178px !important;
    min-height: 0 !important;
    margin-top: 74px !important;
    align-self: start !important;
    display: block !important;
  }

  .inv-adam-wrap .panel.panel-chat {
    position: relative !important;
    height: 392px !important;
    min-height: 392px !important;
    max-height: 392px !important;
    border-radius: 32px !important;
    background: #2f6fed !important;
    border: 0 !important;
    color: #fff !important;
    box-shadow: none !important;
    overflow: hidden !important;
  }

  .inv-adam-wrap .panel.panel-chat::before {
    content: "›";
    position: absolute;
    z-index: 8;
    right: 16px;
    bottom: 18px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #fff;
    color: #2f6fed;
    font-size: 26px;
    line-height: 1;
  }

  .inv-adam-wrap .panel.panel-chat::after {
    content: "Adam\A Smart";
    white-space: pre;
    position: absolute;
    z-index: 8;
    left: 18px;
    bottom: 20px;
    color: #fff;
    font-size: 20px;
    line-height: 0.92;
    font-weight: 800;
    letter-spacing: -0.06em !important;
  }

  .inv-adam-wrap .panel.panel-chat .panel-head {
    position: relative !important;
    z-index: 5 !important;
    height: 26px !important;
    margin: 14px 14px 0 !important;
    padding: 0 8px !important;
    border: 0 !important;
    border-radius: 999px !important;
    background: rgba(255, 255, 255, 0.88) !important;
    color: #11110f !important;
    gap: 6px !important;
  }

  .inv-adam-wrap .chat-avatar {
    width: 18px !important;
    height: 18px !important;
    border-radius: 50% !important;
    background: #11110f !important;
  }

  .inv-adam-wrap .chat-avatar-img {
    width: 17px !important;
    height: 17px !important;
  }

  .inv-adam-wrap .chat-heading {
    min-width: 0 !important;
  }

  .inv-adam-wrap .panel.panel-chat .panel-title {
    font-size: 8px !important;
    color: rgba(17, 17, 15, 0.82) !important;
    white-space: nowrap !important;
  }

  .inv-adam-wrap .panel.panel-chat .panel-desc {
    display: none !important;
  }

  .inv-adam-wrap .comm-status,
  .inv-adam-wrap .collapse-btn {
    display: none !important;
  }

  .inv-adam-wrap .panel.panel-chat .chat-messages {
    position: relative !important;
    z-index: 2 !important;
    min-height: 252px !important;
    max-height: 252px !important;
    padding: 22px 12px 0 !important;
    background: transparent !important;
    overflow: hidden !important;
  }

  .inv-adam-wrap .panel.panel-chat .chat-empty {
    position: relative !important;
    min-height: 230px !important;
    padding: 0 !important;
    justify-content: center !important;
  }

  .inv-adam-wrap .chat-empty-icon {
    width: 118px !important;
    height: 118px !important;
    border-radius: 26px !important;
    display: grid !important;
    place-items: center !important;
    background: rgba(17, 17, 15, 0.12) !important;
    color: #fff !important;
    transform: rotate(4deg);
  }

  .inv-adam-wrap .chat-empty-title,
  .inv-adam-wrap .chat-empty-text {
    display: none !important;
  }

  .inv-adam-wrap .msg-content {
    max-width: 132px !important;
    margin-left: 0 !important;
    border: 0 !important;
    background: rgba(255, 255, 255, 0.18) !important;
    color: #fff !important;
    font-size: 10px !important;
    line-height: 1.45 !important;
  }

  .inv-adam-wrap .msg-header {
    display: none !important;
  }

  .inv-adam-wrap .chat-input-area {
    position: absolute !important;
    z-index: 7 !important;
    left: 12px !important;
    right: 12px !important;
    bottom: 72px !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
  }

  .inv-adam-wrap .input-row {
    gap: 5px !important;
  }

  .inv-adam-wrap .img-btn {
    display: none !important;
  }

  .inv-adam-wrap .chat-input {
    min-height: 30px !important;
    height: 30px !important;
    padding: 7px 10px !important;
    border: 0 !important;
    border-radius: 999px !important;
    background: rgba(255, 255, 255, 0.24) !important;
    color: #fff !important;
    font-size: 10px !important;
  }

  .inv-adam-wrap .chat-input::placeholder {
    color: rgba(255, 255, 255, 0.72) !important;
  }

  .inv-adam-wrap .send-btn {
    width: 30px !important;
    height: 30px !important;
    border: 0 !important;
    border-radius: 50% !important;
    background: #fff !important;
    color: #2f6fed !important;
  }
}

@media (min-width: 1180px) and (max-width: 1360px) {
  .inv-sidebar {
    left: 58px !important;
    right: 58px !important;
    grid-template-columns: 140px minmax(0, 1fr) 80px !important;
  }

  .inv-sidebar .nav-item {
    padding: 0 10px !important;
    font-size: 10px !important;
  }

  .inv-topbar {
    right: 82px !important;
  }

  .inv-color-rail,
  .inv-hero-copy {
    left: 58px !important;
  }

  .inv-body:not(.inv-body--workspace) {
    padding-left: 238px !important;
    padding-right: 56px !important;
    gap: 24px !important;
    grid-template-columns: minmax(0, 1fr) 164px !important;
  }

  .inv-adam-wrap {
    width: 164px !important;
    flex-basis: 164px !important;
  }
}
</style>
