<template>
  <div class="admin-layout">
    <!-- Left icon bar -->
    <sidebar-split />

    <!-- Floating submenu popup (shown on hover) -->
    <sidebar-flyout />

    <div class="main-container">
      <top-bar />
      <tags-bar />
      <div class="page-content">
        <router-view v-slot="{ Component, route }">
          <keep-alive>
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </router-view>
      </div>
      <div class="page-footer">
        版权所有 © {{ new Date().getFullYear() }} &nbsp;·&nbsp;
        <span class="footer-brand">游牧观文化传媒出品</span>
        &nbsp;·&nbsp; 数字游牧 ERP 系统 &nbsp;·&nbsp; 保留所有权利
      </div>
    </div>
  </div>

  <!-- Global AI Assistant -->
  <AiAssistant />
</template>

<script setup lang="ts">
import SidebarSplit from './components/SidebarSplit.vue'
import SidebarFlyout from './components/SidebarFlyout.vue'
import TopBar from './components/TopBar.vue'
import TagsBar from './components/TagsBar.vue'
import AiAssistant from '@/components/AiAssistant.vue'
import { useTabsStore } from '@/stores/tabs'
import { useRoute } from 'vue-router'

const route = useRoute()
const tabsStore = useTabsStore()

watch(
  () => route.path,
  () => {
    tabsStore.addTab(route)
  },
  { immediate: true },
)
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f0f2f5;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.page-footer {
  flex-shrink: 0;
  text-align: right;
  font-size: 10px;
  color: #c0c4cc;
  padding: 4px 16px 6px;
  border-top: 1px solid #eee;
  background: #fff;
  letter-spacing: 0.3px;
}
.footer-brand { color: #a0a8c0; font-weight: 500; }
</style>
