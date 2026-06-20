<template>
  <div class="tags-bar">
    <div class="tags-wrap">
      <div
        class="tag-item"
        :class="{ active: route.path === '/dashboard' }"
        @click="router.push('/dashboard')"
      >
        {{ t('route.Dashboard') }}
      </div>
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.path"
        class="tag-item"
        :class="{ active: route.path === tab.path }"
        @click="router.push(tab.path)"
        @contextmenu.prevent="showContextMenu($event, tab.path)"
      >
        {{ tab.titleKey ? t(tab.titleKey) : tab.title }}
        <span class="tag-close" @click.stop="tabsStore.closeTab(tab.path)">
          <el-icon><Close /></el-icon>
        </span>
      </div>
    </div>
  </div>

  <!-- Context menu -->
  <div
    v-if="contextMenu.visible"
    class="context-menu"
    :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    @mouseleave="contextMenu.visible = false"
  >
    <div class="ctx-item" @click="closeOther">{{ t('layout.closeOthers') }}</div>
    <div class="ctx-item" @click="tabsStore.closeAllTabs(); router.push('/dashboard'); contextMenu.visible = false">{{ t('layout.closeAll') }}</div>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { useTabsStore } from '@/stores/tabs'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const tabsStore = useTabsStore()
const route = useRoute()
const router = useRouter()

const contextMenu = reactive({ visible: false, x: 0, y: 0, path: '' })

function showContextMenu(e: MouseEvent, path: string) {
  contextMenu.visible = true
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.path = path
}

function closeOther() {
  tabsStore.closeOtherTabs(contextMenu.path)
  router.push(contextMenu.path)
  contextMenu.visible = false
}
</script>

<style scoped>
.tags-bar {
  height: 40px;
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 14px;
  overflow: hidden;
}

.tags-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  overflow-x: auto;
  height: 100%;
  scrollbar-width: none;
}

.tags-wrap::-webkit-scrollbar {
  display: none;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--mid);
  background: transparent;
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid transparent;
  transition: all 0.15s cubic-bezier(0.23, 1, 0.32, 1);
  flex-shrink: 0;
  letter-spacing: -0.01em;
}

.tag-item:hover {
  background: var(--gray);
  color: var(--dark);
}

.tag-item.active {
  background: var(--card-bg);
  color: #0071e3;
  border-color: rgba(0, 113, 227, 0.15);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  font-weight: 600;
}

.tag-close {
  display: flex;
  align-items: center;
  font-size: 10px;
  opacity: 0.4;
  transition: opacity 0.15s, color 0.15s;
  line-height: 1;
}

.tag-close:hover {
  opacity: 1;
  color: #ff3b30;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  padding: 5px;
  min-width: 120px;
}

.ctx-item {
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: var(--mid);
  border-radius: 8px;
  transition: background 0.12s;
}

.ctx-item:hover {
  background: var(--gray);
  color: var(--dark);
}
</style>
