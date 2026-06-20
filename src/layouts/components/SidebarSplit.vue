<template>
  <div class="sidebar-split">
    <!-- Logo -->
    <div class="logo-area">
      <div class="logo-icon">
        <svg width="42" height="42" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="36" height="36" rx="8" fill="url(#nbgs)"/>
          <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue','Arial',sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
          <circle cx="27" cy="8" r="4" fill="#F19D38"/>
          <defs>
            <linearGradient id="nbgs" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#1C2B48"/>
              <stop offset="100%" stop-color="#1D3974"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div class="logo-name">{{ logoName }}</div>
    </div>

    <!-- Menu -->
    <div class="menu-list">
      <div
        v-for="item in visibleMenuData"
        :key="item.key"
        class="menu-item"
        :class="{ active: appStore.activeTopMenu === item.key }"
        @mouseenter="onHover(item.key, $event)"
        @mouseleave="onLeave"
        @click="onClick(item.key)"
      >
        <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
        <span class="menu-label">{{ tt(item.title) }}</span>
      </div>
    </div>

    <!-- Bottom avatar -->
    <div class="sidebar-bottom">
      <el-avatar :size="32" :src="authStore.avatar" class="user-avatar">
        {{ authStore.userName.charAt(0) }}
      </el-avatar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { menuData } from './menuData'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { useRouter, useRoute } from 'vue-router'
import { Promotion } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tt = (key: string) => (key && key.startsWith('menu.') ? t(key) : key)
const logoName = computed(() => t('app.name'))

const appStore = useAppStore()
const authStore = useAuthStore()
const permStore = usePermissionStore()
const router = useRouter()
const route = useRoute()

const visibleMenuData = computed(() => permStore.filteredMenuData)

// 路由变化时自动同步顶级菜单高亮
watchEffect(() => {
  const path = route.path
  const matched = menuData.find(m => m.children?.some(c => c.path && path.startsWith(c.path)))
  if (matched) appStore.setActiveTopMenu(matched.key)
})

function onHover(key: string, e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  appStore.showFlyout(key, rect.top)
}

function onLeave() {
  appStore.scheduleHide()
}

function onClick(key: string) {
  appStore.setActiveTopMenu(key)
  appStore.setHoverTopMenu('')
  const menu = visibleMenuData.value.find(m => m.key === key)
  const firstPath = menu?.children?.[0]?.path
  if (firstPath) router.push(firstPath)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.sidebar-split {
  width: 90px;
  background: var(--gray);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: visible;
  z-index: 100;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.sidebar-split::-webkit-scrollbar { width: 4px; }
.sidebar-split::-webkit-scrollbar-track { background: transparent; }
.sidebar-split::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.06); border-radius: 10px; }

/* Logo */
.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 0 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.logo-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  border-radius: 10px;
}

.logo-name {
  font-size: 11px;
  color: var(--dark);
  font-weight: 700;
  letter-spacing: -0.02em;
  opacity: 0.5;
}

/* Menu list */
.menu-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 6px;
  gap: 2px;
}

/* Each menu item */
.menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 7px;
  padding: 9px 10px;
  cursor: pointer;
  color: var(--mid);
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  border-radius: 10px;
}

.menu-item:hover {
  background: var(--faint);
  color: var(--dark);
}

.menu-item.active {
  background: var(--card-bg);
  color: var(--dark);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
}

.menu-item.active .menu-icon {
  color: #0071e3;
}

.menu-icon {
  font-size: 15px;
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.menu-label {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1;
  letter-spacing: -0.01em;
}

/* Bottom */
.sidebar-bottom {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.user-avatar {
  cursor: pointer;
  background: var(--gray-2);
  color: var(--dark);
  font-weight: 600;
  font-size: 13px;
}
</style>
