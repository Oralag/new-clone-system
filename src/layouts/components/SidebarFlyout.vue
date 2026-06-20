<template>
  <Transition name="flyout">
    <div
      v-if="flyoutMenu"
      class="sidebar-flyout"
      :style="{ top: flyoutTop + 'px' }"
      @mouseenter="appStore.cancelHideTimer()"
      @mouseleave="appStore.scheduleHide()"
    >
      <div class="flyout-header">{{ tt(flyoutMenu.title) }}</div>
      <div
        v-for="item in flyoutMenu.children"
        :key="item.key"
        class="flyout-item"
        :class="{ active: route.path === item.path }"
        @click="navigate(item.path!)"
      >
        {{ tt(item.title) }}
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'
import { useRoute, useRouter } from 'vue-router'
import { menuData } from './menuData'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tt = (key: string) => (key && key.startsWith('menu.') ? t(key) : key)

const appStore = useAppStore()
const permStore = usePermissionStore()
const route = useRoute()
const router = useRouter()

const flyoutMenu = computed(() =>
  appStore.hoverTopMenu ? permStore.filteredMenuData.find(m => m.key === appStore.hoverTopMenu) : null
)

const flyoutTop = computed(() => {
  const rawY = appStore.flyoutY
  const itemCount = flyoutMenu.value?.children?.length ?? 0
  const estimatedH = 48 + itemCount * 36 + 14
  const maxTop = window.innerHeight - estimatedH - 8
  return Math.min(rawY, Math.max(8, maxTop))
})

function navigate(path: string) {
  appStore.setHoverTopMenu('')
  if (path === '/retail/cashregister') {
    router.push('/cashregister')
    return
  }
  for (const menu of menuData) {
    if (menu.children?.some(c => c.path === path)) {
      appStore.setActiveTopMenu(menu.key)
      break
    }
  }
  router.push(path)
}
</script>

<style scoped>
.sidebar-flyout {
  position: fixed;
  left: 94px;
  width: 172px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08);
  z-index: 300;
  overflow-y: auto;
  max-height: calc(100vh - 16px);
  padding: 6px 0 8px;
}

.sidebar-flyout::-webkit-scrollbar { width: 4px; }
.sidebar-flyout::-webkit-scrollbar-track { background: transparent; }
.sidebar-flyout::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.06); border-radius: 10px; }

.flyout-header {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  padding: 12px 14px 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}

.flyout-item {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--mid);
  cursor: pointer;
  border-radius: 10px;
  margin: 1px 6px;
  transition: all 0.15s cubic-bezier(0.23, 1, 0.32, 1);
  letter-spacing: -0.01em;
}

.flyout-item:hover {
  background: var(--gray-2);
  color: var(--dark);
}

.flyout-item.active {
  background: rgba(0, 113, 227, 0.08);
  color: #0071e3;
  font-weight: 600;
}

/* Slide-in transition */
.flyout-enter-active,
.flyout-leave-active {
  transition: opacity 0.2s cubic-bezier(0.23, 1, 0.32, 1), transform 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}
.flyout-enter-from,
.flyout-leave-to {
  opacity: 0;
  transform: translateX(-8px) scale(0.98);
}
</style>
