<template>
  <div class="m-layout" :class="{ 'm-dark': isDark }">
    <!-- 顶部栏 -->
    <div class="m-topbar">
      <div class="m-topbar-left">
        <span class="m-topbar-brand">游牧 ERP</span>
      </div>
      <div class="m-topbar-right">
        <button class="m-icon-btn" @click="handleSearch" title="搜索">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        <button class="m-icon-btn" @click="handleNotify" title="通知">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="notifyCount > 0" class="m-badge">{{ notifyCount > 9 ? '9+' : notifyCount }}</span>
        </button>
      </div>
    </div>

    <!-- 会议室置顶区 -->
    <MobileMeetingPinned v-if="activeTab === 'workbench'" />

    <!-- 内容区 -->
    <div class="m-content">
      <router-view v-slot="{ Component, route: r }">
        <keep-alive :include="keepAlivePages">
          <component :is="Component" :key="r.path" />
        </keep-alive>
      </router-view>
    </div>

    <!-- 底部导航 -->
    <div class="m-bottom-nav">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="m-nav-item"
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
          <svg v-else-if="tab.key === 'meeting'" class="m-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/>
          </svg>
          <svg v-else-if="tab.key === 'my'" class="m-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span v-if="tab.key === 'chat' && unreadCount > 0" class="m-nav-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </div>
        <span class="m-nav-label">{{ tab.label }}</span>
      </div>
    </div>

    <!-- 全局搜索弹窗 -->
    <div v-if="showSearch" class="m-search-mask" @click.self="showSearch = false">
      <div class="m-search-sheet">
        <div class="m-search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="searchKeyword"
            class="m-search-input"
            placeholder="搜索客户/订单/商品/供应商..."
            @keyup.enter="doSearch"
          />
          <button v-if="searchKeyword" class="m-search-clear" @click="searchKeyword = ''">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="m-search-results">
          <div v-if="!searchKeyword" class="m-search-hint">
            <div class="m-search-hint-title">快捷搜索</div>
            <div class="m-search-tags">
              <span class="m-search-tag" @click="searchKeyword = '客户'">客户</span>
              <span class="m-search-tag" @click="searchKeyword = '订单'">订单</span>
              <span class="m-search-tag" @click="searchKeyword = '库存'">库存</span>
              <span class="m-search-tag" @click="searchKeyword = '供应商'">供应商</span>
            </div>
          </div>
          <div v-else-if="searchLoading" class="m-search-loading">搜索中...</div>
          <div v-else-if="searchResults.length === 0" class="m-search-empty">未找到 "{{ searchKeyword}}" 相关结果</div>
          <div v-else class="m-search-list">
            <div v-for="item in searchResults" :key="item.id" class="m-search-item" @click="openSearchResult(item)">
              <div class="m-search-item-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2">
                  <path v-if="item.type === 'customer'" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle v-if="item.type === 'customer'" cx="12" cy="7" r="4"/>
                  <path v-else-if="item.type === 'order'" d="M9 11l3 3L22 4"/><path v-else-if="item.type === 'order'" d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  <path v-else d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <div class="m-search-item-content">
                <div class="m-search-item-title">{{ item.title }}</div>
                <div class="m-search-item-sub">{{ item.sub }}</div>
              </div>
              <div class="m-search-item-arrow">›</div>
            </div>
          </div>
        </div>
        <button class="m-search-cancel" @click="showSearch = false">取消</button>
      </div>
    </div>

    <!-- 通知弹窗 -->
    <div v-if="showNotify" class="m-notify-mask" @click.self="showNotify = false">
      <div class="m-notify-sheet">
        <div class="m-notify-header">
          <span class="m-notify-title">通知</span>
          <button class="m-notify-close" @click="showNotify = false">完成</button>
        </div>
        <div class="m-notify-list">
          <div v-if="notifications.length === 0" class="m-notify-empty">暂无新通知</div>
          <div v-for="n in notifications" :key="n.id" class="m-notify-item" :class="{ unread: !n.read }" @click="handleNotifyClick(n)">
            <div class="m-notify-icon" :style="{ background: n.iconBg }">
              <span v-html="n.icon" />
            </div>
            <div class="m-notify-content">
              <div class="m-notify-text">{{ n.text }}</div>
              <div class="m-notify-time">{{ n.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import http from '@/api/http'
import MobileMeetingPinned from './MobileMeetingPinned.vue'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

const isDark = computed(() => appStore.theme === 'dark')

// Tab 定义
const tabs = [
  { key: 'workbench', label: '工作台', path: '/mobile/workbench' },
  { key: 'chat', label: '消息', path: '/mobile/chat' },
  { key: 'contacts', label: '通讯录', path: '/mobile/contacts' },
  { key: 'meeting', label: '会议室', path: '/mobile/meeting' },
  { key: 'my', label: '我的', path: '/mobile/my' },
]

const activeTab = ref('workbench')
const unreadCount = ref(0)
const notifyCount = ref(0)
const keepAlivePages = ['MobileWorkbench', 'MobileChat', 'MobileContacts', 'MobileMeeting', 'MobileActivity']

// 搜索
const showSearch = ref(false)
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const searchInputRef = ref<HTMLInputElement>()

// 通知
const showNotify = ref(false)
const notifications = ref<any[]>([])

watch(() => route.path, (path) => {
  const matched = tabs.find(t => path.startsWith(t.path))
  if (matched) activeTab.value = matched.key
}, { immediate: true })

function switchTab(tab: typeof tabs[0]) {
  if (tab.key === activeTab.value && tab.key === 'workbench') {
    // 刷新工作台
    return
  }
  activeTab.value = tab.key
  router.push(tab.path)
}

async function handleSearch() {
  showSearch.value = true
  await nextTick()
  searchInputRef.value?.focus()
}

async function doSearch() {
  if (!searchKeyword.value.trim()) return
  searchLoading.value = true
  try {
    // 并行查多个模块
    const [custRes, saleRes, goodsRes] = await Promise.allSettled([
      http.get('/shop/ShopCustomer/index', { params: { keywords: searchKeyword.value, list_rows: 5 } }),
      http.get('/stock/SaleOutOrder/index', { params: { keywords: searchKeyword.value, list_rows: 5 } }),
      http.get('/goods/ShopGoods/index', { params: { keywords: searchKeyword.value, list_rows: 5 } }),
    ])
    const results: any[] = []
    if (custRes.status === 'fulfilled') {
      const rows = custRes.value?.data?.rows ?? custRes.value?.rows ?? []
      rows.forEach((r: any) => results.push({ id: r.id, type: 'customer', title: r.name || r.customer_name, sub: `客户 | ${r.phone || '无电话'}` }))
    }
    if (saleRes.status === 'fulfilled') {
      const rows = saleRes.value?.data?.rows ?? saleRes.value?.rows ?? []
      rows.forEach((r: any) => results.push({ id: r.id, type: 'order', title: `#${r.id} ${r.customer_name || '客户'}`, sub: `销售单 | ¥${r.total_amount || 0}` }))
    }
    if (goodsRes.status === 'fulfilled') {
      const rows = goodsRes.value?.data?.rows ?? goodsRes.value?.rows ?? []
      rows.forEach((r: any) => results.push({ id: r.id, type: 'goods', title: r.goods_name, sub: `商品 | 库存 ${r.stock_num ?? '?'}` }))
    }
    searchResults.value = results
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

function openSearchResult(item: any) {
  showSearch.value = false
  searchKeyword.value = ''
  searchResults.value = []
  if (item.type === 'customer') router.push(`/sale/client`)
  else if (item.type === 'order') router.push(`/sale/out`)
  else if (item.type === 'goods') router.push(`/goods/info`)
}

async function handleNotify() {
  showNotify.value = true
  await loadNotifications()
}

async function loadNotifications() {
  try {
    const res = await http.get('/mobile/notifications', { params: { list_rows: 20 } })
    notifications.value = res?.data?.rows ?? res?.rows ?? []
    notifyCount.value = notifications.value.filter((n: any) => !n.read).length
  } catch {
    notifications.value = []
  }
}

function handleNotifyClick(n: any) {
  n.read = true
  if (n.route) router.push(n.route)
}

onMounted(async () => {
  // 加载未读消息数
  try {
    const res = await http.get('/chat/groups/unread')
    unreadCount.value = res?.data?.unread ?? 0
  } catch { /* 忽略 */ }

  // 默认跳转到工作台
  if (route.path === '/' || !tabs.find(t => route.path.startsWith(t.path))) {
    router.replace('/mobile/workbench')
  }
})
</script>

<style scoped>
/* ── 布局容器 ── */
.m-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: #f5f5f7;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
  overflow: hidden;
}

/* ── 顶部栏 ── */
.m-topbar {
  height: 48px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
  border-bottom: 1px solid #e5e6eb;
  position: relative;
  z-index: 10;
}
.m-topbar-left { flex: 1; }
.m-topbar-brand {
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
  letter-spacing: -0.02em;
}
.m-topbar-right { display: flex; align-items: center; gap: 4px; }
.m-icon-btn {
  width: 36px; height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #4e5969;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.m-icon-btn:active { background: #f2f3f5; }
.m-badge {
  position: absolute;
  top: 2px; right: 2px;
  min-width: 16px; height: 16px;
  background: #f53f3f;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  line-height: 1;
}

/* ── 内容区 ── */
.m-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

/* ── 底部导航 ── */
.m-bottom-nav {
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: #fff;
  border-top: 1px solid #e5e6eb;
  display: flex;
  flex-shrink: 0;
  z-index: 10;
}
.m-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  color: #86909c;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
  position: relative;
  padding: 6px 0;
}
.m-nav-item.active { color: #0071e3; }
.m-nav-icon-wrap { position: relative; }
.m-nav-icon { width: 22px; height: 22px; }
.m-nav-badge {
  position: absolute;
  top: -4px; right: -8px;
  min-width: 16px; height: 16px;
  background: #f53f3f;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  line-height: 1;
}
.m-nav-label { font-size: 10px; font-weight: 500; line-height: 1; }

/* ── 搜索弹窗 ── */
.m-search-mask, .m-notify-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.2s ease;
}
.m-search-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 80vh;
  animation: slideUp 0.25s ease;
}
.m-search-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f7;
  border-radius: 12px;
  padding: 10px 12px;
}
.m-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #1d2129;
  outline: none;
}
.m-search-input::placeholder { color: #86909c; }
.m-search-clear { border: none; background: transparent; cursor: pointer; padding: 2px; display: flex; }
.m-search-results { flex: 1; overflow-y: auto; min-height: 100px; }
.m-search-hint { padding: 8px 0; }
.m-search-hint-title { font-size: 12px; font-weight: 600; color: #86909c; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
.m-search-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.m-search-tag {
  padding: 6px 14px;
  background: #f2f3f5;
  border-radius: 999px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-search-tag:active { background: #e8f0fe; color: #0071e3; }
.m-search-loading, .m-search-empty { text-align: center; padding: 32px 0; font-size: 14px; color: #86909c; }
.m-search-list { display: flex; flex-direction: column; }
.m-search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-search-item:last-child { border-bottom: none; }
.m-search-item:active { background: #f5f5f7; margin: 0 -16px; padding: 12px 16px; }
.m-search-item-icon { width: 32px; height: 32px; background: #e8f0fe; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.m-search-item-content { flex: 1; min-width: 0; }
.m-search-item-title { font-size: 14px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-search-item-sub { font-size: 12px; color: #86909c; margin-top: 2px; }
.m-search-item-arrow { font-size: 20px; color: #c2c8d5; flex-shrink: 0; }
.m-search-cancel {
  width: 100%;
  height: 48px;
  background: #f5f5f7;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #4e5969;
  cursor: pointer;
}
.m-search-cancel:active { background: #e8e8ea; }

/* ── 通知弹窗 ── */
.m-notify-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  margin-top: auto;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
}
.m-notify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f2f3f5;
}
.m-notify-title { font-size: 17px; font-weight: 700; color: #1d2129; }
.m-notify-close { border: none; background: transparent; color: #0071e3; font-size: 15px; font-weight: 600; cursor: pointer; }
.m-notify-list { overflow-y: auto; flex: 1; padding: 8px 0; }
.m-notify-empty { text-align: center; padding: 40px 0; font-size: 14px; color: #86909c; }
.m-notify-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-notify-item:active { background: #f5f5f7; }
.m-notify-item.unread { background: #f0f7ff; }
.m-notify-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; }
.m-notify-content { flex: 1; min-width: 0; }
.m-notify-text { font-size: 14px; color: #1d2129; line-height: 1.5; }
.m-notify-time { font-size: 12px; color: #86909c; margin-top: 4px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

/* ── 深色主题 ── */
.m-dark .m-topbar { background: #1f2937; border-color: #374151; }
.m-dark .m-topbar-brand { color: #f9fafb; }
.m-dark .m-icon-btn { color: #9ca3af; }
.m-dark .m-bottom-nav { background: #1f2937; border-color: #374151; }
.m-dark .m-nav-item { color: #6b7280; }
.m-dark .m-nav-item.active { color: #60a5fa; }
.m-dark .m-content { background: #111827; }
.m-dark .m-search-sheet, .m-dark .m-notify-sheet { background: #1f2937; }
.m-dark .m-search-input-wrap { background: #374151; }
.m-dark .m-search-input { color: #f9fafb; }
.m-dark .m-search-tag { background: #374151; color: #d1d5db; }
.m-dark .m-search-cancel { background: #374151; color: #d1d5db; }
</style>
