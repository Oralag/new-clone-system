<template>
  <div class="tags-bar">
    <div class="tags-wrap">
      <div
        class="tag-item"
        :class="{ active: route.path === '/dashboard' }"
        @click="router.push('/dashboard')"
      >
        工作台
      </div>
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.path"
        class="tag-item"
        :class="{ active: route.path === tab.path }"
        @click="router.push(tab.path)"
        @contextmenu.prevent="showContextMenu($event, tab.path)"
      >
        {{ tab.title }}
        <el-icon class="tag-close" @click.stop="tabsStore.closeTab(tab.path)">
          <Close />
        </el-icon>
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
    <div class="ctx-item" @click="closeOther">关闭其他</div>
    <div class="ctx-item" @click="tabsStore.closeAllTabs(); router.push('/dashboard'); contextMenu.visible = false">关闭所有</div>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { useTabsStore } from '@/stores/tabs'
import { useRoute, useRouter } from 'vue-router'

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
  height: 36px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 8px;
  overflow: hidden;
}

.tags-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
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
  gap: 4px;
  padding: 3px 10px;
  font-size: 12px;
  color: #4e5969;
  background: #f2f3f5;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid transparent;
  transition: all 0.15s;
  flex-shrink: 0;
}

.tag-item:hover {
  color: #165dff;
  background: #e8f0fe;
}

.tag-item.active {
  color: #165dff;
  background: #e8f0fe;
  border-color: #165dff;
}

.tag-close {
  font-size: 10px;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.tag-close:hover {
  opacity: 1;
  color: #f53f3f;
}

.context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  padding: 4px 0;
  min-width: 120px;
}

.ctx-item {
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  color: #1d2129;
}

.ctx-item:hover {
  background: #f2f3f5;
  color: #165dff;
}
</style>
