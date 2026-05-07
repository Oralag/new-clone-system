<template>
  <div class="admin-layout" :class="{ 'is-mobile': isMobile }">
    <sidebar-split v-if="!isMobile" />
    <sidebar-flyout v-if="!isMobile" />

    <div class="main-container">
      <!-- 移动端顶部栏：仅在非底部Tab页时显示页面标题 -->
      <div v-if="isMobile" class="mobile-topbar">
        <span class="mobile-title">{{ mobilePageTitle }}</span>
        <div class="mobile-topbar-actions">
          <button class="mobile-theme-btn-wrap" @click="cycleTheme">
            <el-icon :size="17" v-if="appStore.theme === 'dark'"><Moon /></el-icon>
            <el-icon :size="17" v-else-if="appStore.theme === 'eye'"><View /></el-icon>
            <el-icon :size="17" v-else><Sunny /></el-icon>
          </button>
        </div>
      </div>

      <!-- 桌面端顶部栏 + 标签栏 -->
      <template v-if="!isMobile">
        <top-bar />
        <tags-bar />
      </template>

      <!-- 体验版引导横幅 -->
      <trial-banner ref="trialBannerRef" />

      <div ref="pageContentRef" class="page-content" :class="{ 'is-mobile': isMobile }">
        <router-view v-slot="{ Component, route: r }">
          <keep-alive>
            <component :is="Component" :key="Object.keys(r.query).length ? r.fullPath : r.path" />
          </keep-alive>
        </router-view>
        <div class="page-footer" v-if="!isMobile">
          版权所有 © {{ new Date().getFullYear() }} &nbsp;·&nbsp;
          <span class="footer-brand">游牧观文化传媒出品</span>
          &nbsp;·&nbsp; 数字游牧 ERP 系统 &nbsp;·&nbsp; 保留所有权利
        </div>
        <!-- 移动端底部占位，防止内容被底部导航遮挡 -->
        <div v-if="isMobile" class="mobile-scroll-spacer" />
      </div>
    </div>

    <!-- 移动端底部导航 5Tab -->
    <div v-if="isMobile" class="mobile-bottom-nav">
      <!-- 首页 -->
      <div
        class="mobile-nav-item"
        :class="{ active: route.path === '/dashboard' }"
        @click="navTo(isLegacyMode ? '/dashboard?legacy=1&from=legacy_nav' : '/dashboard')"
      >
        <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span class="nav-label">首页</span>
      </div>

      <!-- 工作（应用） -->
      <div
        class="mobile-nav-item"
        :class="{ active: route.path === '/mobile/apps' }"
        @click="navTo(isLegacyMode ? '/mobile/apps?legacy=1&from=legacy_nav' : '/mobile/apps')"
      >
        <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
        <span class="nav-label">工作</span>
      </div>

      <!-- 新建（中间突出按钮） -->
      <div class="mobile-nav-item mobile-nav-add" @click="showQuickCreate = true">
        <div class="nav-add-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span class="nav-label">新建</span>
      </div>

      <!-- 报表 -->
      <div
        class="mobile-nav-item"
        :class="{ active: route.path === '/mobile/stats' || (isLegacyMode && route.path === '/dashboard/today-sales') }"
        @click="navTo(isLegacyMode ? '/dashboard/today-sales?legacy=1&from=legacy_nav' : '/mobile/stats')"
      >
        <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span class="nav-label">报表</span>
      </div>

      <!-- 我的 -->
      <div
        class="mobile-nav-item"
        :class="{ active: route.path === '/mobile/profile' }"
        @click="navTo(isLegacyMode ? '/mobile/profile?legacy=1&from=legacy_nav' : '/mobile/profile')"
      >
        <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span class="nav-label">我的</span>
      </div>
    </div>

    <!-- 快速新建面板 -->
    <div v-if="isMobile && showQuickCreate" class="quick-create-mask" @click.self="showQuickCreate = false">
      <div class="quick-create-sheet">
        <div class="qc-handle" />
        <div class="qc-title">快速新建</div>
        <div class="qc-grid">
          <div class="qc-item" @click="goCreate('/sale/out')">
            <div class="qc-icon" style="background:rgba(0,113,227,0.1)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <span>销售出库</span>
          </div>
          <div class="qc-item" @click="goCreate('/procure/order')">
            <div class="qc-icon" style="background:rgba(124,58,237,0.1)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <span>采购订单</span>
          </div>
          <div class="qc-item" @click="goCreate('/finance/collect-receipt')">
            <div class="qc-icon" style="background:rgba(5,150,105,0.1)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <span>收款单</span>
          </div>
          <div class="qc-item" @click="goCreate('/finance/pay-receipt')">
            <div class="qc-icon" style="background:rgba(217,119,6,0.1)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <span>付款单</span>
          </div>
          <div class="qc-item" @click="goCreate('/sale/contract')">
            <div class="qc-icon" style="background:rgba(0,113,227,0.08)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <span>销售合同</span>
          </div>
          <div class="qc-item" @click="goCreate('/procure/inhouse')">
            <div class="qc-icon" style="background:rgba(8,145,178,0.1)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <span>采购入库</span>
          </div>
          <div class="qc-item" @click="goCreate('/office/expense')">
            <div class="qc-icon" style="background:rgba(220,38,38,0.08)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <span>报销申请</span>
          </div>
          <div class="qc-item" @click="goCreate('/cashregister')">
            <div class="qc-icon" style="background:rgba(249,115,22,0.1)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h2M10 15h4"/></svg>
            </div>
            <span>零售收银</span>
          </div>
        </div>
        <button class="qc-cancel" @click="showQuickCreate = false">取消</button>
      </div>
    </div>

  </div>

  <AiAssistant />
  <OnboardingGuide />
</template>

<script setup lang="ts">
import SidebarSplit from './components/SidebarSplit.vue'
import SidebarFlyout from './components/SidebarFlyout.vue'
import TopBar from './components/TopBar.vue'
import TagsBar from './components/TagsBar.vue'
import AiAssistant from '@/components/AiAssistant.vue'
import OnboardingGuide from '@/components/OnboardingGuide.vue'
import TrialBanner from '@/components/TrialBanner.vue'
import { useTabsStore } from '@/stores/tabs'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { useRoute, useRouter } from 'vue-router'
import { Sunny, Moon, View } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()
const appStore = useAppStore()
const authStore = useAuthStore()
const permStore = usePermissionStore()
const trialBannerRef = ref<any>(null)
const pageContentRef = ref<HTMLElement | null>(null)
const showQuickCreate = ref(false)

const isMobile = ref(window.innerWidth < 768)
const onResize = () => { isMobile.value = window.innerWidth < 768 }
onMounted(() => {
  window.addEventListener('resize', onResize)
  ;(window as any).__pageContent = pageContentRef
})
onUnmounted(() => window.removeEventListener('resize', onResize))

// 底部Tab页不在顶栏重复显示标题，其他页面显示当前路由标题
const TAB_PATHS = ['/dashboard', '/mobile/apps', '/mobile/stats', '/mobile/profile']
const isLegacyMode = computed(() => String(route.query?.legacy || '') === '1')
const mobilePageTitle = computed(() => {
  if (TAB_PATHS.includes(route.path)) return '数字游牧 ERP'
  return (route.meta?.title as string) || '数字游牧 ERP'
})

function cycleTheme() {
  const themes = ['light', 'dark', 'eye'] as const
  const idx = themes.indexOf(appStore.theme as any)
  appStore.setTheme(themes[(idx + 1) % 3])
}

function goCreate(path: string) {
  showQuickCreate.value = false
  router.push(path)
}

let lastNavTime = 0
function navTo(path: string) {
  const now = Date.now()
  if (now - lastNavTime < 500) return
  lastNavTime = now
  router.push(path)
}

watch(() => route.path, () => { tabsStore.addTab(route) }, { immediate: true })
</script>

<style scoped>
.admin-layout { display: flex; height: 100vh; min-height: 100vh; overflow: hidden; background: var(--card-bg); min-width: 900px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
.admin-layout.is-mobile { min-width: unset; }
.main-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; background: var(--card-bg); }
.page-content { flex: 1; overflow-y: auto; overflow-x: auto; padding: 16px; background: var(--gray); }
.page-footer { text-align: right; font-size: 10px; color: rgba(0,0,0,0.2); padding: 4px 0 6px; letter-spacing: -0.01em; }
.footer-brand { color: rgba(0,0,0,0.25); font-weight: 600; }

/* ── 移动端顶部栏 ── */
.mobile-topbar {
  height: 48px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
}
.mobile-title {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: var(--dark);
  letter-spacing: -0.02em;
}
.mobile-topbar-actions { display: flex; align-items: center; gap: 4px; }
.mobile-theme-btn-wrap {
  width: 34px; height: 34px;
  background: var(--gray);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--mid);
}

/* ── 移动端底部导航 ── */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  background: var(--card-bg);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: stretch;
  z-index: 200;
  padding-bottom: env(safe-area-inset-bottom);
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  color: var(--dim);
  padding: 6px 4px;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
}
.mobile-nav-item.active { color: #0071e3; }
.mobile-nav-item.active .nav-svg { stroke: #0071e3; }

.nav-svg { width: 22px; height: 22px; stroke: currentColor; }
.nav-label { font-size: 10px; line-height: 1; font-weight: 500; }

/* 中间 + 按钮 */
.mobile-nav-add { position: relative; }
.nav-add-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #0071e3, #005bb5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0,113,227,0.45);
  margin-top: -10px;
  flex-shrink: 0;
}
.mobile-nav-add .nav-label { color: #0071e3; font-weight: 600; }

/* ── 移动端内容区 ── */
.page-content.is-mobile {
  overflow-x: hidden;
  padding: 0;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}
/* 手机端表格横向可滚动 */
.page-content.is-mobile :deep(.el-table) { width: 100% !important; }
.page-content.is-mobile :deep(.el-table__body-wrapper),
.page-content.is-mobile :deep(.el-table__header-wrapper) { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.mobile-scroll-spacer { height: calc(60px + env(safe-area-inset-bottom, 0px)); flex-shrink: 0; }

/* ── 快速新建面板 ── */
.quick-create-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 300;
  display: flex;
  align-items: flex-end;
}
.quick-create-sheet {
  width: 100%;
  background: var(--card-bg, #fff);
  border-radius: 20px 20px 0 0;
  padding: 12px 20px calc(env(safe-area-inset-bottom, 0px) + 20px);
  animation: slideUp 0.25s ease;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
.qc-handle {
  width: 36px; height: 4px;
  background: var(--border, #e5e6eb);
  border-radius: 2px;
  margin: 0 auto 16px;
}
.qc-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--dark, #1d2129);
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}
.qc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 8px;
  margin-bottom: 20px;
}
.qc-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.qc-item:active { opacity: 0.7; }
.qc-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qc-item span {
  font-size: 11px;
  color: var(--mid, #4e5969);
  font-weight: 500;
  text-align: center;
}
.qc-cancel {
  width: 100%;
  height: 50px;
  background: var(--gray, #f5f5f7);
  border: none;
  border-radius: 14px;
  font-size: 16px;
  color: var(--mid, #4e5969);
  font-weight: 600;
  cursor: pointer;
}
.qc-cancel:active { background: var(--gray-2, #e8e8ea); }
</style>
