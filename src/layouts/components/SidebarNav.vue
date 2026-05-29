<template>
  <div class="sidebar-nav">
    <div class="nav-header">
      <span class="nav-title">{{ currentMenu?.title }}</span>
    </div>
    <div class="nav-body">
      <div
        v-for="item in currentMenu?.children"
        :key="item.key"
        class="nav-item"
        :class="{ active: route.path === item.path }"
        @click="navigate(item.path!)"
      >
        {{ item.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { menuData } from './menuData'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'
import { useRoute, useRouter } from 'vue-router'

const appStore = useAppStore()
const permStore = usePermissionStore()
const route = useRoute()
const router = useRouter()

const currentMenu = computed(() =>
  permStore.filteredMenuData.find((m) => m.key === appStore.activeTopMenu),
)

function navigate(path: string) {
  if (path === '/retail/cashregister') {
    router.push('/cashregister')
    return
  }
  router.push(path)
}

// Auto-activate parent menu based on current route
watch(
  () => route.path,
  (path) => {
    for (const menu of permStore.filteredMenuData) {
      if (menu.children?.some((c) => c.path && path.startsWith(c.path))) {
        appStore.setActiveTopMenu(menu.key)
        return
      }
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.sidebar-nav {
  width: 180px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.nav-header {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  border-bottom: 1px solid #e8e8e8;
}

.nav-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px;
}

.nav-item {
  padding: 9px 12px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  margin-bottom: 2px;
}

.nav-item:hover {
  background: #f2f3f5;
  color: #165dff;
}

.nav-item.active {
  background: #e8f0fe;
  color: #165dff;
  font-weight: 500;
}
</style>
