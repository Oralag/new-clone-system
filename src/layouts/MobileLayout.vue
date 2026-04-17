<template>
  <div class="wx-layout">
    <!-- 顶部导航栏（消息页由MobileChat接管，不重复显示） -->
    <div class="wx-navbar" v-if="activeTab !== 'chat'">
      <button v-if="!isMainTab" class="wx-nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-else class="wx-nav-placeholder"></div>
      <span class="wx-nav-title">{{ route.meta?.title || '数字游牧' }}</span>
      <div class="wx-nav-right">
        <div class="wx-nav-avatar nav-avatar-btn" @click="router.push('/mobile/my')">
          {{ authStore.userName?.[0] || '我' }}
        </div>
      </div>
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
        <div class="m-nav-icon-wrap">
          <svg v-if="tab.key === 'workbench'" class="m-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <svg v-else-if="tab.key === 'chat'" class="m-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <svg v-else-if="tab.key === 'contacts'" class="m-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <svg v-else-if="tab.key === 'stats'" class="m-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <svg v-else-if="tab.key === 'modules'" class="m-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <svg v-else-if="tab.key === 'my'" class="m-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span v-if="tab.key === 'chat' && unreadCount > 0" class="m-nav-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </div>
        <span class="m-nav-label">{{ tab.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import http from '@/api/http'
import { useAuthStore } from '@/stores/auth'
import MobileMeetingPinned from './MobileMeetingPinned.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const tabs = [
  { key: 'chat', label: '消息', path: '/mobile/chat' },
  { key: 'contacts', label: '通讯录', path: '/mobile/contacts' },
  { key: 'workbench', label: '工作台', path: '/mobile/workbench' },
  { key: 'stats', label: '统计', path: '/mobile/stats' },
  { key: 'modules', label: '模块', path: '/mobile/modules' },
]

const activeTab = ref('chat')
const unreadCount = ref(0)
const pendingCount = ref(0)
const taskCount = ref(0)
const keepAlivePages = ['MobileWorkbench', 'MobileChat', 'MobileContacts', 'MobileStats', 'MobileModules']

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
  // 先精确匹配，再前缀匹配（chat/:id 也算 chat tab）
  const exact = tabs.find(t => t.path === path)
  if (exact) {
    activeTab.value = exact.key
  } else {
    const prefix = tabs.find(t => path.startsWith(t.path + '/') || path === t.path)
    if (prefix) activeTab.value = prefix.key
  }
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
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.wx-nav-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--wx-blue);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}
.wx-nav-avatar:active { opacity: 0.75; }

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

.m-nav-icon-wrap {
  position: relative;
  width: 24px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-nav-icon {
  width: 22px;
  height: 22px;
}

.m-nav-badge {
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

.m-nav-label {
  font-size: 10px;
  line-height: 1;
  font-weight: 500;
}

.wx-tabbar {
  margin-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
