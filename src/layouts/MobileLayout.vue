<template>
  <div class="wx-layout">
    <!-- 顶部导航栏 -->
    <div class="wx-navbar">
      <button v-if="!isMainTab" class="wx-nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-else class="wx-nav-placeholder"></div>
      <span class="wx-nav-title">{{ route.meta?.title || '数字游牧' }}</span>
      <div class="wx-nav-right"></div>
    </div>

    <!-- 内容区 -->
    <div class="wx-content">
      <router-view v-slot="{ Component, route: r }">
        <keep-alive :include="keepAlivePages">
          <component :is="Component" :key="r.path" />
        </keep-alive>
      </router-view>
    </div>

    <!-- 底部 Tab Bar（企业微信风格） -->
    <div class="wx-tabbar">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="wx-tab"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab)"
      >
        <!-- 工作台 -->
        <template v-if="tab.key === 'workbench'">
          <div class="wx-tab-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path v-if="activeTab !== 'workbench'" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path v-else d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span v-if="pendingCount > 0" class="wx-tab-dot">{{ pendingCount > 9 ? '9+' : pendingCount }}</span>
          </div>
          <span class="wx-tab-label">{{ tab.label }}</span>
        </template>

        <!-- 消息 -->
        <template v-else-if="tab.key === 'chat'">
          <div class="wx-tab-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path v-if="activeTab !== 'chat'" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path v-else d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span v-if="unreadCount > 0" class="wx-tab-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </div>
          <span class="wx-tab-label">{{ tab.label }}</span>
        </template>

        <!-- 通讯录 -->
        <template v-else-if="tab.key === 'contacts'">
          <div class="wx-tab-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path v-if="activeTab !== 'contacts'" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path v-else d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <circle v-if="activeTab !== 'contacts'" cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.8"/>
              <circle v-else cx="9" cy="7" r="4" fill="currentColor" stroke="currentColor" stroke-width="1.8"/>
              <path v-if="activeTab !== 'contacts'" d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path v-else d="M23 21v-2a4 4 0 0 0-3-3.87" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path v-if="activeTab !== 'contacts'" d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path v-else d="M16 3.13a4 4 0 0 1 0 7.75" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="wx-tab-label">{{ tab.label }}</span>
        </template>

        <!-- 任务 -->
        <template v-else-if="tab.key === 'task'">
          <div class="wx-tab-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path v-if="activeTab !== 'task'" d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path v-else d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span v-if="taskCount > 0" class="wx-tab-dot">{{ taskCount > 9 ? '9+' : taskCount }}</span>
          </div>
          <span class="wx-tab-label">{{ tab.label }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import http from '@/api/http'

const router = useRouter()
const route = useRoute()

const tabs = [
  { key: 'chat', label: '消息', path: '/mobile/chat' },
  { key: 'contacts', label: '通讯录', path: '/mobile/contacts' },
  { key: 'workbench', label: '工作台', path: '/mobile/workbench' },
  { key: 'task', label: '任务', path: '/mobile/task' },
]

const activeTab = ref('chat')
const unreadCount = ref(0)
const pendingCount = ref(0)
const taskCount = ref(0)
const keepAlivePages = ['MobileWorkbench', 'MobileChat', 'MobileContacts', 'MobileTask']

// 判断当前是否为 Tab 主页面（主页面不显示返回按钮）
const isMainTab = computed(() => {
  return tabs.some(t => t.path === route.path)
})

// 返回按钮
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/mobile/workbench')
  }
}

watch(() => route.path, (path) => {
  const matched = tabs.find(t => t.path === path)
  if (matched) activeTab.value = matched.key
}, { immediate: true })

function switchTab(tab: typeof tabs[0]) {
  if (tab.key === activeTab.value) return
  activeTab.value = tab.key
  router.push(tab.path)
}

function setUnread(n: number) { unreadCount.value = n }
function setPending(n: number) { pendingCount.value = n }

watch(unreadCount, (n) => {
  if (typeof uni !== 'undefined') {
    uni.$emit('update:unread', n)
  }
})

onMounted(async () => {
  // 默认跳工作台
  if (route.path === '/' || !tabs.find(t => route.path.startsWith(t.path))) {
    router.replace('/mobile/workbench')
  }

  // 加载未读消息数
  try {
    const res = await http.get('/chat/groups/unread')
    unreadCount.value = res?.data?.unread ?? 0
  } catch { /* 忽略 */ }
})
</script>

<script lang="ts">
import { onMounted } from 'vue'
export default { name: 'MobileLayout' }
</script>

<style scoped>
/* ── 企业微信风格布局 ── */
.wx-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'SF Pro Text', sans-serif;
  overflow: hidden;
  /* 企业微信蓝色 */
  --wx-blue: #2E6BE6;
  --wx-gray: #999;
  --wx-light: #ededed;
  --wx-bg: #f5f5f5;
  --wx-nav-h: 44px;
}

/* ── 顶部导航栏 ── */
.wx-navbar {
  height: var(--wx-nav-h);
  padding-top: env(safe-area-inset-top, 0px);
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  z-index: 200;
}

.wx-nav-back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--wx-blue);
  -webkit-tap-highlight-color: transparent;
  padding: 0;
}

.wx-nav-back svg {
  width: 22px;
  height: 22px;
}

.wx-nav-placeholder {
  width: 44px;
}

.wx-nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
  padding: 0 44px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wx-nav-right {
  width: 44px;
}

/* ── 内容区 ── */
.wx-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  background: #fff;
}

/* ── 底部 Tab Bar ── */
.wx-tabbar {
  height: 50px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-shrink: 0;
  z-index: 100;
}

.wx-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  color: #999;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  transition: color 0.15s;
}

.wx-tab.active { color: var(--wx-blue); }

.wx-tab-icon {
  position: relative;
  width: 22px;
  height: 22px;
}

.wx-tab-icon svg {
  width: 22px;
  height: 22px;
}

.wx-tab-label {
  font-size: 10px;
  line-height: 1;
  font-weight: 500;
}

.wx-tab-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  background: #f53f3f;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  line-height: 1;
  transform: scale(0.85);
}

.wx-tab-dot {
  position: absolute;
  top: -4px;
  right: -8px;
  width: 8px;
  height: 8px;
  background: #f53f3f;
  border-radius: 50%;
}
</style>
