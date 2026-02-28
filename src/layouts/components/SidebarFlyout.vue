<template>
  <Transition name="flyout">
    <div
      v-if="flyoutMenu"
      class="sidebar-flyout"
      :style="{ top: flyoutTop + 'px' }"
      @mouseenter="appStore.cancelHideTimer()"
      @mouseleave="appStore.scheduleHide()"
    >
      <div class="flyout-header">{{ flyoutMenu.title }}</div>
      <div
        v-for="item in flyoutMenu.children"
        :key="item.key"
        class="flyout-item"
        :class="{ active: route.path === item.path }"
        @click="navigate(item.path!)"
      >
        {{ item.title }}
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useRoute, useRouter } from 'vue-router'
import { menuData } from './menuData'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

const flyoutMenu = computed(() =>
  appStore.hoverTopMenu ? menuData.find(m => m.key === appStore.hoverTopMenu) : null
)

// 每项高度约 37px，header 约 44px，padding 14px
const flyoutTop = computed(() => {
  const rawY = appStore.flyoutY
  const itemCount = flyoutMenu.value?.children?.length ?? 0
  const estimatedH = 44 + itemCount * 37 + 14
  const maxTop = window.innerHeight - estimatedH - 8
  return Math.min(rawY, Math.max(8, maxTop))
})

function navigate(path: string) {
  appStore.setHoverTopMenu('')
  if (path === '/retail/cashregister') {
    window.open('/#/cashregister', '_blank')
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
  left: 90px;
  width: 168px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 300;
  overflow-y: auto;
  max-height: calc(100vh - 16px);
  padding: 6px 0 8px;
}

.flyout-header {
  font-size: 13px;
  font-weight: 700;
  color: #1d2129;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 4px;
}

.flyout-item {
  padding: 9px 16px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
  border-radius: 6px;
  margin: 1px 6px;
  transition: all 0.12s;
}

.flyout-item:hover {
  background: #f2f3f5;
  color: #165dff;
}

.flyout-item.active {
  background: #e8f0fe;
  color: #165dff;
  font-weight: 500;
}

/* Slide-in transition */
.flyout-enter-active,
.flyout-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.flyout-enter-from,
.flyout-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
