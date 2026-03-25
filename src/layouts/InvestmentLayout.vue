<template>
  <div class="inv-layout">

    <!-- ── 侧边栏（桌面端） ── -->
    <aside v-if="!isMobile" class="inv-sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#F5A623" stroke-width="1.5" opacity="0.6"/>
            <circle cx="12" cy="12" r="4" fill="#F5A623" opacity="0.8"/>
            <circle cx="12" cy="12" r="1.5" fill="var(--card-bg)"/>
          </svg>
        </div>
        <div class="logo-text-wrap">
          <span class="logo-text">ADAM</span>
          <span class="logo-sub">Investment Observatory</span>
        </div>
        <span class="life-dot" :class="{ alive: adamStore.isAlive, dormant: !adamStore.isAlive }"></span>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/investment" class="nav-item" active-class="nav-item--active" exact>
          <Eye :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">总览</span>
        </router-link>
        <router-link to="/investment/city" class="nav-item" active-class="nav-item--active">
          <Map :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">园区地图</span>
        </router-link>

        <div class="nav-section-title">情报研究</div>
        <router-link to="/investment/market" class="nav-item" active-class="nav-item--active">
          <BarChart3 :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">市场情报</span>
        </router-link>

        <div class="nav-section-title">商业生态</div>
        <router-link to="/investment/marketing" class="nav-item" active-class="nav-item--active">
          <TrendingUp :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">营销顾问</span>
        </router-link>
        <router-link to="/investment/designer" class="nav-item" active-class="nav-item--active">
          <Palette :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">平面设计师</span>
        </router-link>

        <div class="nav-section-title">亚当</div>
        <router-link to="/investment/archive" class="nav-item" active-class="nav-item--active">
          <BookOpen :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">档案馆</span>
        </router-link>
        <router-link to="/investment/library" class="nav-item" active-class="nav-item--active">
          <Library :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">图书馆</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/portal" class="nav-item nav-item--back">
          <ChevronLeft :size="15" :stroke-width="1.5" />
          <span class="nav-item-label">返回门户</span>
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
    <el-drawer v-if="isMobile" v-model="drawerOpen" direction="ltr" size="75%" :with-header="false" class="inv-drawer">
      <div class="drawer-inner">
        <div class="drawer-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#F5A623" stroke-width="1.5" opacity="0.6"/>
            <circle cx="12" cy="12" r="4" fill="#F5A623" opacity="0.8"/>
          </svg>
          <span class="drawer-logo-text">ADAM</span>
        </div>
        <router-link v-for="item in mobileNavItems" :key="item.path" :to="item.path" class="nav-item" active-class="nav-item--active" @click="drawerOpen = false">
          <span class="nav-item-label">{{ item.label }}</span>
        </router-link>
        <router-link to="/portal" class="nav-item nav-item--back" @click="drawerOpen = false">
          <span class="nav-item-label">← 返回门户</span>
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
          <!-- 主题切换 -->
          <div class="topbar-theme-btns">
            <button class="topbar-theme-btn" :class="{ active: appStore.theme === 'light' }" title="亮色" @click="appStore.setTheme('light')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              </svg>
            </button>
            <button class="topbar-theme-btn" :class="{ active: appStore.theme === 'dark' }" title="暗黑" @click="appStore.setTheme('dark')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </button>
            <button class="topbar-theme-btn" :class="{ active: appStore.theme === 'eye' }" title="护眼" @click="appStore.setTheme('eye')">
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

      <section class="inv-content">
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
import { Eye, TrendingUp, ChevronLeft, Menu, Map, BarChart3, BookOpen, Library, Palette } from 'lucide-vue-next'

const route = useRoute()
const adamStore = useAdamStore()
const appStore = useAppStore()

const drawerOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))
function handleResize() { isMobile.value = window.innerWidth < 768 }

const mobileNavItems = [
  { path: '/investment', label: '总览' },
  { path: '/investment/city', label: '园区地图' },
  { path: '/investment/market', label: '市场情报' },
  { path: '/investment/marketing', label: '营销顾问' },
  { path: '/investment/designer', label: '平面设计师' },
  { path: '/investment/archive', label: '档案馆' },
  { path: '/investment/library', label: '图书馆' },
]

const pageTitleMap: Record<string, string> = {
  '/investment': '亚当观测舱',
  '/investment/city': '生态园区',
  '/investment/market': '市场情报',
  '/investment/marketing': '营销顾问',
  '/investment/designer': '平面设计师',
  '/investment/archive': '档案馆',
  '/investment/library': '图书馆',
}
const currentPageTitle = computed(() => pageTitleMap[route.path] || '亚当观测舱')

const statusLabel = computed(() => {
  const map: Record<string, string> = { dormant: 'DORMANT', alive: 'SYS.ONLINE', survival: 'SURVIVAL', shutdown: 'SHUTDOWN' }
  return map[adamStore.core.status] || 'UNKNOWN'
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   黑曜石观测舱 — Layout
   Observatory-grade navigation shell
   ═══════════════════════════════════════════════════ */

.inv-layout {
  display: flex;
  height: 100vh;
  background: var(--gray);
  font-family: 'Inter', 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--dark);
}

/* ── 侧边栏 ── */
.inv-sidebar {
  width: 260px;
  background: var(--card-bg);
  border-right: 1px solid var(--border);
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
  border-bottom: 1px solid var(--border);
  position: relative;
}
.logo-icon { flex-shrink: 0; }
.logo-text-wrap { flex: 1; min-width: 0; }
.logo-text {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #F5A623;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.12em;
}
.logo-sub {
  display: block;
  font-size: 8px;
  color: var(--dim);
  margin-top: 2px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.6;
}

/* 生命指示灯 */
.life-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.life-dot.alive {
  background: #00E5A0;
  box-shadow: 0 0 6px rgba(0,229,160,0.4), 0 0 0 2px rgba(0,229,160,0.15);
  animation: lifepulse 2.5s ease-in-out infinite;
}
.life-dot.dormant {
  background: var(--dim);
  opacity: 0.5;
}
@keyframes lifepulse {
  0%,100% { box-shadow: 0 0 6px rgba(0,229,160,0.4), 0 0 0 2px rgba(0,229,160,0.15); }
  50% { box-shadow: 0 0 10px rgba(0,229,160,0.2), 0 0 0 5px rgba(0,229,160,0.05); }
}

/* 导航 */
.sidebar-nav { padding: 12px 10px 0; flex: 1; }
.nav-section-title {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.1em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  padding: 12px 12px 4px;
  text-transform: uppercase;
  opacity: 0.6;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  text-decoration: none;
  color: var(--mid);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 2px;
  border: 1px solid transparent;
  position: relative;
}
.nav-item:hover {
  background: var(--faint);
  color: var(--dark);
  border-color: var(--border);
}
.nav-item--active {
  background: rgba(245,166,35,0.06) !important;
  color: #F5A623 !important;
  font-weight: 600;
  border-color: rgba(245,166,35,0.15) !important;
}
.nav-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: #F5A623;
  border-radius: 1px;
  box-shadow: 0 0 4px rgba(245,166,35,0.3);
}

/* 底部 */
.sidebar-footer {
  padding: 10px 10px 16px;
  border-top: 1px solid var(--border);
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
  height: 48px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}
.topbar-left { display: flex; align-items: center; gap: 10px; }
.topbar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  margin: 0;
  letter-spacing: 0;
}
.topbar-right { display: flex; align-items: center; gap: 12px; }

/* 主题切换按钮 */
.topbar-theme-btns {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--gray);
  border-radius: 999px;
  padding: 2px 4px;
  border: 1px solid var(--border);
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
.topbar-theme-btn:hover { background: var(--faint); color: var(--dark); }
.topbar-theme-btn.active { background: var(--card-bg); color: #F5A623; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

/* 预算标签 */
.budget-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(245,166,35,0.04);
  border: 1px solid rgba(245,166,35,0.12);
}
.budget-label {
  font-size: 8px;
  font-weight: 700;
  color: rgba(245,166,35,0.50);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
}
.budget-val {
  font-size: 12px;
  font-weight: 700;
  color: #F5A623;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: -0.01em;
}

/* 状态标签 */
.status-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 4px;
}
.status-tag.alive {
  background: rgba(0,229,160,0.04);
  border: 1px solid rgba(0,229,160,0.12);
}
.status-tag.dormant {
  background: var(--faint);
  border: 1px solid var(--border);
}
.status-tag.survival {
  background: rgba(255,77,77,0.04);
  border: 1px solid rgba(255,77,77,0.12);
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
.alive .status-dot { background: #00E5A0; box-shadow: 0 0 4px rgba(0,229,160,0.4); }
.dormant .status-dot { background: var(--dim); opacity: 0.5; }
.survival .status-dot { background: #FF4D4D; animation: survPulse 1.2s ease-in-out infinite; }
.shutdown .status-dot { background: var(--dim); opacity: 0.3; }
@keyframes survPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
.status-text {
  font-size: 9px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
}
.alive .status-text { color: #00E5A0; }
.dormant .status-text { color: var(--dim); opacity: 0.6; }
.survival .status-text { color: #FF4D4D; }
.shutdown .status-text { color: var(--dim); opacity: 0.4; }

/* 内容区 */
.inv-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: var(--gray);
  scrollbar-width: thin;
}

/* ── 移动端 ── */
.mobile-topbar {
  height: 48px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
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
  background: var(--card-bg);
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
  color: #F5A623;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.1em;
}

@media (max-width: 767px) {
  .inv-layout { display: block; height: auto; min-height: 100vh; }
  .inv-main { min-height: calc(100vh - 48px); }
  .inv-content { padding: 14px 12px 24px; }
}
</style>

<style>
/* 全局覆盖 el-drawer 在投资模块的样式 */
.inv-drawer .el-drawer {
  background: var(--card-bg) !important;
}
.inv-drawer .el-drawer__body {
  padding: 0 !important;
}
</style>
