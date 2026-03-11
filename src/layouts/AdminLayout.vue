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

      <div class="page-content" :class="{ 'is-mobile': isMobile }">
        <router-view v-slot="{ Component, route: r }">
          <keep-alive>
            <component :is="Component" :key="r.path" />
          </keep-alive>
        </router-view>
      </div>

      <div class="page-footer" v-if="!isMobile">
        版权所有 © {{ new Date().getFullYear() }} &nbsp;·&nbsp;
        <span class="footer-brand">游牧观文化传媒出品</span>
        &nbsp;·&nbsp; 数字游牧 ERP 系统 &nbsp;·&nbsp; 保留所有权利
      </div>
    </div>

    <!-- 移动端底部导航 -->
    <div v-if="isMobile" class="mobile-bottom-nav">
      <div v-for="item in mobileNavItems" :key="item.key" class="mobile-nav-item"
        :class="{ active: appStore.activeTopMenu === item.key }"
        @click="onMobileNav(item)">
        <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
        <span class="nav-label">{{ item.title }}</span>
      </div>
      <div class="mobile-nav-item" :class="{ active: showMobileMenu }" @click="showMobileMenu = true">
        <el-icon class="nav-icon"><Grid /></el-icon>
        <span class="nav-label">更多</span>
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
          <div v-for="section in menuData" :key="section.key" class="drawer-section">
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
</template>

<script setup lang="ts">
import SidebarSplit from './components/SidebarSplit.vue'
import SidebarFlyout from './components/SidebarFlyout.vue'
import TopBar from './components/TopBar.vue'
import TagsBar from './components/TagsBar.vue'
import AiAssistant from '@/components/AiAssistant.vue'
import { useTabsStore } from '@/stores/tabs'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { menuData } from './components/menuData'
import { Menu, Grid, Promotion, Close, HomeFilled } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()
const appStore = useAppStore()
const authStore = useAuthStore()

const showMobileMenu = ref(false)
const isMobile = ref(window.innerWidth < 768)
const onResize = () => { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

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
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    authStore.logout()
    router.push('/login')
  }
}

watch(() => route.path, () => { tabsStore.addTab(route) }, { immediate: true })
</script>

<style scoped>
.admin-layout { display: flex; height: 100vh; overflow: hidden; background: #f0f2f5; }
.main-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.page-content { flex: 1; overflow-y: auto; padding: 12px; }
.page-footer { flex-shrink: 0; text-align: right; font-size: 10px; color: #c0c4cc; padding: 4px 16px 6px; border-top: 1px solid #eee; background: #fff; }
.footer-brand { color: #a0a8c0; font-weight: 500; }

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
.nav-label { font-size: 11px; line-height: 1; }

/* 移动端内容区底部留白 */
.page-content.is-mobile { padding: 8px; padding-bottom: calc(68px + env(safe-area-inset-bottom)); }

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
