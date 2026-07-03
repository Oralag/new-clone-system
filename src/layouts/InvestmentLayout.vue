<template>
  <div class="inv-layout">

    <!-- ── 移动端顶栏 ── -->
    <div v-if="isMobile" class="mobile-topbar">
      <button class="mobile-menu-btn" @click="drawerOpen = true">
        <Menu :size="18" :stroke-width="1.5" />
      </button>
      <span class="mobile-title">{{ currentPageTitle }}</span>
      <span class="budget-cta budget-cta--sm">
        <span class="budget-cta-label">BUDGET</span>
        <span class="budget-cta-val">¥{{ adamStore.core.budget.toLocaleString() }}</span>
      </span>
    </div>

    <!-- 移动端抽屉 -->
    <el-drawer v-if="isMobile" v-model="drawerOpen" direction="ltr" size="260px" :with-header="false" class="inv-drawer">
      <div class="drawer-inner">
        <div class="drawer-logo">
          <span class="drawer-logo-text">ADAM<i>.</i></span>
          <span class="life-dot" :class="{ alive: adamStore.isAlive, dormant: !adamStore.isAlive }"></span>
        </div>
        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="drawer-item" active-class="drawer-item--active" @click="drawerOpen = false">
          {{ item.label }}
        </router-link>
        <router-link to="/portal" class="drawer-item drawer-item--back" @click="drawerOpen = false">
          {{ t('investment.backToPortalArrow') }}
        </router-link>
      </div>
    </el-drawer>

    <!-- ── 主容器（图1：灰色背景上的大圆角浅色卡） ── -->
    <main class="inv-shell">

      <!-- 顶部导航（桌面端，图1 式：LOGO. | 链接管道分隔 | 黑色 CTA） -->
      <header v-if="!isMobile" class="inv-nav">
        <router-link to="/investment" class="nav-logo">
          ADAM<i>.</i>
          <span class="life-dot" :class="{ alive: adamStore.isAlive, dormant: !adamStore.isAlive }"></span>
        </router-link>

        <nav class="nav-links">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ 'nav-link--active': isActiveNav(item.path) }"
          >{{ item.label }}</router-link>
        </nav>

        <div class="nav-right">
          <span class="nav-clock">{{ clockStr }}</span>
          <div class="nav-theme-btns">
            <button class="nav-theme-btn" :class="{ active: appStore.theme === 'light' }" :title="t('layout.themeLight')" @click="appStore.setTheme('light')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              </svg>
            </button>
            <button class="nav-theme-btn" :class="{ active: appStore.theme === 'dark' }" :title="t('layout.themeDark')" @click="appStore.setTheme('dark')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>
            <button class="nav-theme-btn" :class="{ active: appStore.theme === 'eye' }" :title="t('layout.themeEye')" @click="appStore.setTheme('eye')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <span class="status-pill" :class="adamStore.core.status">
            <span class="status-dot"></span>
            <span class="status-text">{{ statusLabel }}</span>
          </span>
          <span class="budget-cta">
            <span class="budget-cta-label">BUDGET</span>
            <span class="budget-cta-val">¥{{ adamStore.core.budget.toLocaleString() }}</span>
          </span>
          <router-link to="/portal" class="nav-back" :title="t('investment.backToPortal')">
            <ChevronLeft :size="16" :stroke-width="2" />
          </router-link>
        </div>
      </header>

      <!-- 内容区 -->
      <div class="inv-body" :class="{ 'inv-body--full': isFullBleed }">
        <section class="inv-content" :class="{ 'inv-content--full': isFullBleed }">
          <router-view />
        </section>

        <aside v-if="showChat" class="inv-chat" :class="{ 'inv-chat--hero': isHome }">
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
import { ChevronLeft, Menu } from 'lucide-vue-next'
import AdamChat from '@/components/AdamChat.vue'

const route = useRoute()
const adamStore = useAdamStore()
const appStore = useAppStore()
const { t, locale } = useI18n()

const drawerOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)
const isHome = computed(() => route.path === '/investment')
const isFullBleed = computed(() => route.path === '/investment/city' || route.path === '/investment/workspace')
const showChat = computed(() => route.path !== '/investment/city')

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
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
}
updateClock()
clockTimer = setInterval(updateClock, 30_000)

const navItems = computed(() => ([
  { path: '/investment', label: t('investment.overview') },
  { path: '/investment/city', label: t('investment.cityMap') },
  { path: '/investment/market', label: t('investment.market') },
  { path: '/investment/marketing', label: t('investment.marketing') },
  { path: '/investment/designer', label: t('investment.designer') },
  { path: '/investment/archive', label: t('investment.archive') },
  { path: '/investment/library', label: t('investment.library') },
]))

function isActiveNav(path: string) {
  if (path === '/investment') return route.path === '/investment'
  return route.path.startsWith(path)
}

const pageTitleMap = computed<Record<string, string>>(() => ({
  '/investment': t('investment.overview'),
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
   投资部门 — 参考图1（FROGSOUND）式布局
   灰色画布 + 大圆角浅色容器 + 顶部管道分隔导航
   ═══════════════════════════════════════════════════ */

.inv-layout {
  --inv-canvas: #e2e1dd;
  --inv-shell: #f5f4f0;
  --inv-ink: #131311;
  --inv-ink-soft: rgba(19, 19, 17, 0.66);
  --inv-ink-muted: rgba(19, 19, 17, 0.4);
  --inv-line: rgba(19, 19, 17, 0.1);
  --inv-yellow: #f6df3e;
  --inv-orange: #f4502e;
  --inv-blue: #adc9dc;
  --inv-mint: #99c49f;
  --inv-black: #131311;

  /* 兼容变量：投资子页面（Market/City/Library/Archive/AdamChat）大量使用，
     固定为本模块浅色调，避免全局主题切换造成模块内明暗错乱 */
  --gray: #eceae4;
  --dark: var(--inv-ink);
  --mid: var(--inv-ink-soft);
  --dim: var(--inv-ink-muted);
  --faint: rgba(19, 19, 17, 0.055);
  --border: var(--inv-line);
  --card-bg: #ffffff;
  --accent: var(--inv-orange);

  height: 100vh;
  box-sizing: border-box;
  padding: 26px;
  background: var(--inv-canvas);
  font-family: 'Inter', 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--inv-ink);
  display: flex;
}

/* ── 主容器 ── */
.inv-shell {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--inv-shell);
  border-radius: 34px;
  overflow: hidden;
}

/* ── 顶部导航 ── */
.inv-nav {
  flex-shrink: 0;
  height: 76px;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 44px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: var(--inv-ink);
  text-decoration: none;
  flex-shrink: 0;
}
.nav-logo i {
  font-style: normal;
  color: var(--inv-orange);
}
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
.life-dot.dormant { background: var(--inv-ink-muted); opacity: 0.5; }
@keyframes lifepulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(153, 196, 159, 0.22); }
  50% { box-shadow: 0 0 0 8px rgba(153, 196, 159, 0.08); }
}

/* 中央链接：管道分隔 */
.nav-links {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-link {
  position: relative;
  padding: 6px 18px;
  font-size: 12px;
  font-weight: 500;
  color: var(--inv-ink-soft);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.16s ease;
}
.nav-link:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 1px;
  height: 12px;
  transform: translateY(-50%);
  background: rgba(19, 19, 17, 0.28);
}
.nav-link:hover { color: var(--inv-ink); }
.nav-link--active {
  color: var(--inv-ink);
  font-weight: 800;
}
.nav-link--active::before {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: -2px;
  height: 2px;
  border-radius: 2px;
  background: var(--inv-ink);
}

/* 右侧：时钟 / 主题 / 状态 / 黑色 CTA / 返回 */
.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.nav-clock {
  font-size: 11px;
  color: var(--inv-ink-muted);
}
.nav-theme-btns {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border-radius: 999px;
  background: rgba(19, 19, 17, 0.06);
}
.nav-theme-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--inv-ink-soft);
  transition: background 0.15s, color 0.15s;
}
.nav-theme-btn:hover { background: rgba(255, 255, 255, 0.8); color: var(--inv-ink); }
.nav-theme-btn.active { background: var(--inv-black); color: #fff; }

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 13px;
  border-radius: 999px;
  background: rgba(19, 19, 17, 0.05);
}
.status-pill.alive { background: rgba(153, 196, 159, 0.3); }
.status-pill.survival { background: rgba(244, 80, 46, 0.14); }
.status-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--inv-ink-muted); }
.alive .status-dot { background: #3f7a48; }
.survival .status-dot { background: var(--inv-orange); animation: survPulse 1.2s ease-in-out infinite; }
.shutdown .status-dot { opacity: 0.3; }
@keyframes survPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.status-text {
  font-size: 9px;
  font-weight: 800;
  color: var(--inv-ink-soft);
}
.alive .status-text { color: #3f7a48; }
.survival .status-text { color: var(--inv-orange); }

/* 黑色 CTA（图1 的 Get Started Free 位） */
.budget-cta {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 18px;
  border-radius: 12px;
  background: var(--inv-black);
}
.budget-cta-label {
  font-size: 9px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}
.budget-cta-val {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}
.budget-cta--sm { height: 30px; padding: 0 12px; border-radius: 9px; }
.budget-cta--sm .budget-cta-val { font-size: 11px; }

.nav-back {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--inv-ink-soft);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.nav-back:hover { background: rgba(19, 19, 17, 0.06); color: var(--inv-ink); }
.nav-back svg { transform: rotate(180deg); }

/* ── 内容区 ── */
.inv-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 20px;
  padding: 8px 44px 32px;
}
.inv-body--full { padding: 0; gap: 0; }

.inv-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}
.inv-content--full { overflow: hidden; }

/* 右侧 Adam 对话卡 */
.inv-chat {
  width: 340px;
  flex: 0 0 340px;
  min-height: 0;
  display: flex;
  align-items: stretch;
}
.inv-chat :deep(.panel-chat) {
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
}
.inv-chat :deep(.panel-chat.collapsed) { height: auto; }
.inv-chat :deep(.chat-messages) {
  flex: 1;
  min-height: 0;
  max-height: none;
}
.inv-chat :deep(.chat-input-area) { margin-top: auto; flex-shrink: 0; }

/* 首页：右侧卡按图1 的橙红竖长卡处理（仅换壳，不动结构） */
.inv-chat--hero { width: 300px; flex-basis: 300px; }
.inv-chat--hero :deep(.panel-chat) {
  background: var(--inv-orange);
  border: none;
  border-radius: 30px;
}
.inv-chat--hero :deep(.panel-head) {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  margin: 14px 14px 6px;
  padding: 6px 12px;
  border-bottom: none;
}
.inv-chat--hero :deep(.chat-messages) { background: transparent; }
.inv-chat--hero :deep(.chat-empty-title),
.inv-chat--hero :deep(.chat-empty-text) { color: rgba(255, 255, 255, 0.85); }
.inv-chat--hero :deep(.chat-empty-icon) { color: rgba(255, 255, 255, 0.7); }
.inv-chat--hero :deep(.msg-content) {
  background: rgba(255, 255, 255, 0.16);
  border-color: transparent;
  color: #fff;
}
.inv-chat--hero :deep(.msg-sender),
.inv-chat--hero :deep(.msg-time),
.inv-chat--hero :deep(.disclaimer) { color: rgba(255, 255, 255, 0.66); }
.inv-chat--hero :deep(.chat-input-area) {
  background: transparent;
  border-top-color: rgba(255, 255, 255, 0.24);
}
.inv-chat--hero :deep(.chat-input) {
  background: rgba(255, 255, 255, 0.92);
  border-color: transparent;
  color: var(--inv-ink);
}
.inv-chat--hero :deep(.send-btn) {
  background: var(--inv-black);
  color: #fff;
  border-color: transparent;
}

/* ── 移动端 ── */
.mobile-topbar {
  height: 52px;
  background: rgba(255, 255, 255, 0.86);
  border-bottom: 1px solid var(--inv-line);
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
  color: var(--inv-ink-soft);
  display: flex;
  align-items: center;
}
.mobile-title {
  flex: 1;
  font-size: 13px;
  font-weight: 700;
  color: var(--inv-ink);
}

.drawer-inner {
  padding: 12px 10px 16px;
  background: var(--inv-shell);
  min-height: 100%;
}
.drawer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 14px;
  border-bottom: 1px solid var(--inv-line);
  margin-bottom: 8px;
}
.drawer-logo-text {
  font-size: 15px;
  font-weight: 900;
  color: var(--inv-ink);
}
.drawer-logo-text i { font-style: normal; color: var(--inv-orange); }
.drawer-item {
  display: block;
  padding: 11px 12px;
  border-radius: 14px;
  margin-bottom: 3px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--inv-ink-soft);
}
.drawer-item--active {
  background: var(--inv-black);
  color: #fff;
  font-weight: 700;
}
.drawer-item--back {
  margin-top: 10px;
  font-size: 11px;
  color: var(--inv-ink-muted);
}

@media (max-width: 767px) {
  .inv-layout { display: block; height: auto; min-height: 100vh; padding: 0; }
  .inv-shell { border-radius: 0; min-height: calc(100vh - 52px); }
  .inv-body {
    display: block;
    padding: 14px 12px 132px;
    overflow: visible;
  }
  .inv-body--full { padding: 0; }
  .inv-chat,
  .inv-chat--hero {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
    z-index: 40;
    display: block;
  }
}
</style>

<style>
/* 全局覆盖 el-drawer 在投资模块的样式 */
.inv-drawer .el-drawer {
  background: #f5f4f0 !important;
}
.inv-drawer .el-drawer__body {
  padding: 0 !important;
}
</style>
