<template>
  <div class="sidebar-split">
    <!-- Logo -->
    <div class="logo-area">
      <div class="logo-icon">
        <el-icon :size="26" color="#fff"><Promotion /></el-icon>
      </div>
      <div class="logo-name">数字游牧</div>
    </div>

    <!-- Menu -->
    <div class="menu-list">
      <div
        v-for="item in menuData"
        :key="item.key"
        class="menu-item"
        :class="{ active: appStore.activeTopMenu === item.key }"
        @mouseenter="onHover(item.key, $event)"
        @mouseleave="onLeave"
        @click="onClick(item.key)"
      >
        <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
        <span class="menu-label">{{ item.title }}</span>
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
import { useRouter } from 'vue-router'
import { Promotion } from '@element-plus/icons-vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

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
  const menu = menuData.find(m => m.key === key)
  const firstPath = menu?.children?.[0]?.path
  if (firstPath) router.push(firstPath)
}
</script>

<style scoped>
.sidebar-split {
  width: 90px;
  background: linear-gradient(180deg, #3a8ee6 0%, #1a6fd4 100%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-shrink: 0;
  overflow-y: auto;
  overflow-x: visible;
  z-index: 100;
}

.sidebar-split::-webkit-scrollbar { display: none; }

/* Logo */
.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 0 16px;
  border-bottom: 1px solid rgba(255,255,255,0.18);
  flex-shrink: 0;
}

.logo-icon {
  width: 46px;
  height: 46px;
  background: rgba(255,255,255,0.18);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-name {
  font-size: 12px;
  color: #fff;
  font-weight: 600;
  letter-spacing: 1px;
}

/* Menu list */
.menu-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

/* Each menu item */
.menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 11px 10px;
  cursor: pointer;
  color: rgba(255,255,255,0.82);
  transition: background 0.15s, color 0.15s;
  margin: 1px 4px;
  border-radius: 8px;
}

.menu-item:hover {
  background: rgba(255,255,255,0.16);
  color: #fff;
}

.menu-item.active {
  background: rgba(255,255,255,0.24);
  color: #fff;
}

.menu-icon {
  font-size: 14px;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.menu-label {
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
  line-height: 1;
}

/* Bottom */
.sidebar-bottom {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.18);
  flex-shrink: 0;
}

.user-avatar {
  cursor: pointer;
  background: rgba(255,255,255,0.25);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}
</style>
