<template>
  <div class="admin-layout" :class="{ 'is-mobile': isMobile }">
    <sidebar-split v-if="!isMobile" />
    <sidebar-flyout v-if="!isMobile" />

    <div class="main-container">
      <!-- 移动端顶部栏 -->
      <div v-if="isMobile" class="mobile-topbar">
        <button class="mobile-menu-btn" @click="showMobileMenu = true">
          <el-icon><Menu /></el-icon>
        </button>
        <span class="mobile-title">{{ route.meta?.title || '数字游牧ERP' }}</span>
        <button class="mobile-home-btn" @click="router.push('/portal')">
          <el-icon><HomeFilled /></el-icon>
        </button>
        <el-dropdown trigger="click" @command="handleUserCmd" class="mobile-user">
          <el-avatar :size="30" :src="authStore.avatar" class="mobile-avatar">
            {{ authStore.userName.charAt(0) }}
          </el-avatar>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="isSuperAdmin" command="admin-console">🏢 租户管理控制台</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 桌面端顶部栏 + 标签栏 -->
      <template v-if="!isMobile">
        <top-bar />
        <tags-bar />
      </template>

      <!-- 体验版引导横幅 -->
      <trial-banner ref="trialBannerRef" />

      <div class="page-content" :class="{ 'is-mobile': isMobile }">
        <router-view v-slot="{ Component, route: r }">
          <keep-alive>
            <component :is="Component" :key="r.path" />
          </keep-alive>
        </router-view>
        <div class="page-footer" v-if="!isMobile">
          版权所有 © {{ new Date().getFullYear() }} &nbsp;·&nbsp;
          <span class="footer-brand">游牧观文化传媒出品</span>
          &nbsp;·&nbsp; 数字游牧 ERP 系统 &nbsp;·&nbsp; 保留所有权利
        </div>
        <!-- 移动端底部占位，防止内容被底部导航遮挡（Safari padding-bottom bug workaround） -->
        <div v-if="isMobile" class="mobile-scroll-spacer" />
      </div>
    </div>

    <!-- 移动端底部导航 -->
    <div v-if="isMobile" class="mobile-bottom-nav">
      <div class="mobile-nav-item" :class="{ active: route.path === '/dashboard' }" @click="router.push('/dashboard')">
        <el-icon class="nav-icon"><Odometer /></el-icon>
        <span class="nav-label">首页</span>
      </div>
      <div class="mobile-nav-item" :class="{ active: route.path === '/mobile/apps' }" @click="router.push('/mobile/apps')">
        <el-icon class="nav-icon"><Grid /></el-icon>
        <span class="nav-label">应用</span>
      </div>
      <div class="mobile-nav-item" :class="{ active: route.path === '/mobile/stats' }" @click="router.push('/mobile/stats')">
        <svg class="nav-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span class="nav-label">统计</span>
      </div>
    </div>

    <!-- 移动端抽屉菜单 -->
    <el-drawer v-if="isMobile" v-model="showMobileMenu" direction="ltr" size="82%" :with-header="false">
      <div class="drawer-inner">
        <div class="drawer-header">
          <div class="drawer-logo">
            <el-icon :size="22" color="#3a8ee6"><Promotion /></el-icon>
            <span>数字游牧 ERP</span>
          </div>
          <el-button :icon="Close" circle plain size="small" @click="showMobileMenu = false" />
        </div>
        <div class="drawer-menu">
          <div v-for="section in visibleMenuData" :key="section.key" class="drawer-section">
            <div class="drawer-section-title">
              <el-icon><component :is="section.icon" /></el-icon>
              {{ section.title }}
            </div>
            <div class="drawer-section-items">
              <div v-for="child in section.children" :key="child.key" class="drawer-item"
                :class="{ active: route.path === child.path }"
                @click="navigateTo(child.path)">
                {{ child.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
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
import { menuData } from './components/menuData'
import { Menu, Grid, Promotion, Close, HomeFilled, Odometer } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()
const appStore = useAppStore()
const authStore = useAuthStore()
const permStore = usePermissionStore()
const trialBannerRef = ref<any>(null)

const visibleMenuData = computed(() => permStore.filteredMenuData)

const showMobileMenu = ref(false)
const isMobile = ref(window.innerWidth < 768)
const onResize = () => { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const SUPER_ADMIN = '17747344571'
const isSuperAdmin = computed(() => (authStore.userInfo?.account || '') === SUPER_ADMIN)

const mobileNavItems = [
  { key: 'dashboard', title: '首页',  icon: 'Odometer',     path: '/dashboard' },
  { key: 'sale',      title: '销售',  icon: 'ShoppingCart', path: '/sale/client' },
  { key: 'finance',   title: '财务',  icon: 'Money',        path: '/finance/overview' },
  { key: 'warehouse', title: '仓库',  icon: 'House',        path: '/warehouse/stock' },
]

function onMobileNav(item: { key: string; path: string }) {
  appStore.setActiveTopMenu(item.key)
  router.push(item.path)
}

function navigateTo(path?: string) {
  if (!path) return
  showMobileMenu.value = false
  router.push(path)
}

async function handleUserCmd(cmd: string) {
  if (cmd === 'admin-console') {
    router.push('/admin-console')
  } else if (cmd === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    authStore.logout()
    router.push('/login')
  }
}

watch(() => route.path, () => { tabsStore.addTab(route) }, { immediate: true })
</script>

<style scoped>
.admin-layout { display: flex; height: 100vh; min-height: 100vh; overflow: hidden; background: #ffffff; min-width: 900px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
.admin-layout.is-mobile { min-width: unset; overflow: auto; height: 100%; }
.main-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; background: #ffffff; }
.main-container.is-mobile { overflow: visible; height: auto; }
.page-content { flex: 1; overflow-y: auto; overflow-x: auto; padding: 16px; background: #f5f5f7; }
.page-footer { text-align: right; font-size: 10px; color: rgba(0,0,0,0.2); padding: 4px 0 6px; letter-spacing: -0.01em; }
.footer-brand { color: rgba(0,0,0,0.25); font-weight: 600; }

/* 移动端顶部栏 */
.mobile-topbar { height: 52px; background: #fff; border-bottom: 1px solid #e8e8e8; display: flex; align-items: center; padding: 0 12px; gap: 10px; flex-shrink: 0; }
.mobile-menu-btn, .mobile-home-btn { background: none; border: none; padding: 6px; cursor: pointer; color: #4e5969; font-size: 20px; display: flex; align-items: center; flex-shrink: 0; }
.mobile-title { flex: 1; font-size: 16px; font-weight: 600; color: #1d2129; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mobile-user { flex-shrink: 0; }
.mobile-avatar { cursor: pointer; background: #165dff; color: #fff; font-weight: 600; }

/* 移动端底部导航 */
.mobile-bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: #fff; border-top: 1px solid #e8e8e8; display: flex; align-items: stretch; z-index: 200; padding-bottom: env(safe-area-inset-bottom); }
.mobile-nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; color: #86909c; padding: 6px 4px; }
.mobile-nav-item.active { color: #3a8ee6; }
.nav-icon { font-size: 20px; }
.nav-icon-svg { width: 22px; height: 22px; }
.nav-label { font-size: 11px; line-height: 1; }

/* 移动端内容区底部留白 */
.page-content.is-mobile { padding: 8px; padding-bottom: 8px; overflow-x: hidden; }
/* Safari bug: padding-bottom in overflow:auto scroll containers is ignored — use a spacer div instead (see template) */
.mobile-scroll-spacer { height: calc(100px + env(safe-area-inset-bottom, 34px)); flex-shrink: 0; }

/* 移动端抽屉 */
.drawer-inner { display: flex; flex-direction: column; height: 100%; }
.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 12px; border-bottom: 1px solid #e8e8e8; flex-shrink: 0; }
.drawer-logo { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; color: #1d2129; }
.drawer-menu { flex: 1; overflow-y: auto; padding: 8px 0; }
.drawer-section { margin-bottom: 4px; }
.drawer-section-title { display: flex; align-items: center; gap: 6px; padding: 10px 16px 6px; font-size: 13px; font-weight: 600; color: #4e5969; }
.drawer-section-items { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 8px; }
.drawer-item { padding: 7px 14px; font-size: 13px; color: #4e5969; background: #f2f3f5; border-radius: 20px; cursor: pointer; border: 1px solid transparent; }
.drawer-item:active, .drawer-item.active { background: #e8f0fe; color: #165dff; border-color: #c5d6ff; }
</style>
