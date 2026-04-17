<template>
  <div class="chat-page">
    <!-- 顶部栏：企业微信风格 -->
    <div class="wx-nav-bar">
      <div class="wx-nav-left">
        <button class="nav-icon-btn" @click="showDrawer = !showDrawer" title="菜单">
          <svg width="18" height="18" viewBox="0 0 20 18" fill="#333">
            <rect y="1" width="16" height="2" rx="1"/>
            <rect y="8" width="12" height="2" rx="1"/>
            <rect y="15" width="14" height="2" rx="1"/>
          </svg>
        </button>
      </div>
      <div class="wx-nav-title">消息</div>
      <div class="wx-nav-right">
        <button class="nav-icon-btn" @click="showSearch = !showSearch" title="搜索">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        <button class="nav-icon-btn" @click="showPlusMenu = !showPlusMenu" title="新建">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜索栏（常驻在顶部栏下方） -->
    <div class="chat-search-bar" @click="showSearch = true">
      <div class="chat-search-inner">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span class="chat-search-placeholder">搜索</span>
      </div>
    </div>

    <!-- 子Tab：全部 / 待办 / AI管家 -->
    <div class="chat-sub-tabs">
      <div
        v-for="tab in subTabs"
        :key="tab.key"
        class="chat-sub-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</div>
    </div>

    <!-- ── 全部 Tab ── -->
    <div v-show="activeTab === 'all'" class="tab-panel">
      <!-- 消息列表 -->
      <div class="chat-list">
        <div v-if="displayedGroups.length === 0 && groups.length === 0" class="chat-empty">
          <div class="chat-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="chat-empty-text">暂无消息</div>
        </div>
        <div
          v-for="g in displayedGroups"
          :key="g.id"
          class="chat-item-wrap"
          :class="{ 'swiped': swipedId === g.id }"
        >
          <!-- 左滑操作按钮 -->
          <div class="chat-item-actions" v-if="!!swipedId && swipedId === g.id && !!g.id">
            <div class="action-btn pin-btn" @click.stop="togglePin(g)">
              {{ g.is_pinned ? '取消置顶' : '置顶' }}
            </div>
            <div class="action-btn delete-btn" @click.stop="deleteGroup(g)">
              删除
            </div>
          </div>
          <!-- 聊天项主体 -->
          <div
            class="chat-item"
            :class="{ 'chat-item--pinned': g.is_pinned }"
            @click="swipeMoved ? (swipeMoved = false) : (closeSwipe(), g.route ? router.push(g.route) : router.push(`/mobile/chat/${g.id}`))"
            @touchstart.passive="onSwipeStart($event, g)"
            @touchend.passive="onSwipeEnd"
            @touchmove.passive="onSwipeMove"
          >
            <span v-if="g.is_pinned" class="chat-pin-icon">📌</span>
            <div class="chat-avatar-wrap">
              <div class="chat-avatar" :style="avatarStyle(g)">{{ g.avatar_text || g.name?.[0] || '群' }}</div>
              <span v-if="g.unread > 0" class="chat-unread-dot"></span>
            </div>
            <div class="chat-body">
              <div class="chat-top">
                <span class="chat-name">{{ g.name }}</span>
                <span class="chat-time">{{ g.last_time }}</span>
              </div>
              <div class="chat-bottom">
                <span class="chat-msg">{{ g.last_msg }}</span>
                <span v-if="g.unread > 0" class="chat-badge">{{ g.unread > 99 ? '99+' : g.unread }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 待办 Tab ── -->
    <div v-show="activeTab === 'todo'" class="todo-tab">
      <div v-if="pendingItems.length === 0" class="chat-empty">
        <div class="chat-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div class="chat-empty-text">暂无待审核事项</div>
      </div>
      <div
        v-for="item in pendingItems"
        :key="item.key"
        class="chat-item todo-item"
        @click="item.onClick?.()"
      >
        <div class="chat-avatar" :style="{ background: item.color || '#2E6BE6' }">{{ item.icon }}</div>
        <div class="chat-body">
          <div class="chat-top">
            <span class="chat-name">{{ item.label }}</span>
            <span class="chat-badge">{{ item.count }}</span>
          </div>
          <div class="chat-bottom">
            <span class="chat-msg">点击查看详情</span>
          </div>
        </div>
        <span class="chat-meeting-arrow">›</span>
      </div>
    </div>

    <!-- ── AI管家 Tab ── -->
    <div v-show="activeTab === 'ai'" class="ai-tab" @click="router.push('/mobile/ai')">
      <div class="ai-banner">
        <div class="ai-avatar">🤖</div>
        <div class="ai-info">
          <div class="ai-title">AI 管家</div>
          <div class="ai-sub">智能助手，随时为您服务 →</div>
        </div>
      </div>
    </div>

    <!-- ── 搜索结果 ── -->
    <div v-if="showSearch" class="search-fullscreen">
      <div class="chat-search-panel">
        <div class="chat-search-bar-row">
          <div class="chat-search-inner-input">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              v-model="searchKeyword"
              class="chat-search-input"
              placeholder="搜索聊天记录"
              autofocus
            />
            <button v-if="searchKeyword" @click="searchKeyword = ''" class="chat-search-clear">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <button class="chat-search-cancel" @click="showSearch = false; searchKeyword = ''">取消</button>
        </div>
      </div>
      <div class="chat-search-result">
        <div class="chat-search-hint" v-if="searchResults.length === 0 && !searchLoading && searchKeyword">
          未找到 "{{ searchKeyword }}" 相关结果
        </div>
        <div v-for="r in searchResults" :key="r.id" class="chat-search-item" @click="openSearchResult(r); showSearch = false">
          <div class="chat-avatar chat-avatar--sm">{{ r.name?.[0] || '?' }}</div>
          <div class="chat-body">
            <div class="chat-top"><span class="chat-name" v-html="highlight(r.name)"></span></div>
            <div class="chat-bottom"><span class="chat-msg" v-html="highlight(r.sub)"></span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 左侧抽屉遮罩 ── -->
    <div v-if="showDrawer" class="drawer-mask" @click="showDrawer = false"></div>

    <!-- ── 左侧抽屉 ── -->
    <div class="drawer" :class="{ open: showDrawer }">
      <!-- 顶部用户卡片 -->
      <div class="drawer-hero">
        <div class="drawer-avatar-wrap">
          <div class="drawer-avatar">{{ authStore.userName?.[0] || '我' }}</div>
          <div class="drawer-status"></div>
        </div>
        <div class="drawer-name">{{ authStore.userName || '用户' }}</div>
        <div class="drawer-company">{{ authStore.companyName || '数字游牧' }}</div>
        <!-- 右上角工具图标 -->
        <div class="drawer-top-actions">
          <button class="drawer-action-btn" @click="router.push('/'); showDrawer = false" title="PC端">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </button>
          <button class="drawer-action-btn" @click="handleScan(); showDrawer = false" title="扫一扫">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 中间菜单 -->
      <div class="drawer-menu">
        <div class="drawer-item" @click="router.push('/mobile/stats'); showDrawer = false">
          <span class="drawer-item-icon">📊</span>
          <span>数据报表</span>
        </div>
        <div class="drawer-item" @click="router.push('/mobile/my'); showDrawer = false">
          <span class="drawer-item-icon">👤</span>
          <span>个人信息</span>
        </div>
      </div>

      <!-- 底部固定 -->
      <div class="drawer-footer">
        <div class="drawer-item" @click="router.push('/mobile/my'); showDrawer = false">
          <span class="drawer-item-icon">⚙️</span>
          <span>设置</span>
        </div>
        <div class="drawer-item danger" @click="handleLogout">
          <span class="drawer-item-icon">🚪</span>
          <span>退出登录</span>
        </div>
      </div>
    </div>

    <!-- ── + 号下拉菜单 ── -->
    <div v-if="showPlusMenu" class="plus-menu-mask" @click="showPlusMenu = false"></div>
    <div v-if="showPlusMenu" class="plus-menu">
      <div class="plus-menu-item" @click="router.push('/mobile/meeting'); showPlusMenu = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        发起会议
      </div>
      <div class="plus-menu-item" @click="router.push('/mobile/contacts'); showPlusMenu = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        通讯录
      </div>
    </div>

    <!-- ── 右下角新建按钮 ── -->
    <div class="chat-fab" @click="showPlusMenu = !showPlusMenu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>
  </div>

  <!-- ── 右键/长按菜单 ── -->
  <!-- 右键菜单 mask（暂时隐藏） -->
  <!-- <div v-if="contextGroup" class="context-menu-mask" @click="closeSwipe" @touchstart.passive="closeSwipe"></div> -->
  <div v-if="contextGroup" class="context-menu" :style="contextMenuStyle">
    <div class="ctx-item" @click="togglePin(contextGroup)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      {{ contextGroup.is_pinned ? '取消置顶' : '置顶聊天' }}
    </div>
    <div class="ctx-item ctx-item--danger" @click="deleteGroup(contextGroup)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      删除会话
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 固定置顶项（如 AI 管家）
const pinnedSessions = ref([
  { id: 'meeting-fixed', name: 'AI会议室', avatar_text: '🏛', last_msg: '多Agent协同 · Captain主持', last_time: '', type: 'meeting', unread: 0, is_pinned: true, route: '/mobile/meeting' },
  { id: 'ai-assistant-fixed', name: 'AI 管家', avatar_text: '🤖', last_msg: '随时为您服务', last_time: '', type: 'ai', unread: 0, is_pinned: true, route: '/mobile/ai' },
])

const groups = ref<any[]>([])
const contacts = ref<any[]>([])
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const showSearch = ref(false)
const showNewChat = ref(false)
const newChatKeyword = ref('')
const activeMeetingCount = ref(0)
const showDrawer = ref(false)
const showPlusMenu = ref(false)
const activeTab = ref('all')

// 显示列表：固定置顶 + 用户置顶/普通会话（按最新时间排序，置顶优先）
// 按 id 去重，保留所有聊天（包括不在通讯录的）
const displayedGroups = computed(() => {
  const fixedIds = new Set(pinnedSessions.value.map(p => p.id))
  const seen = new Set<string>()
  const filtered = groups.value.filter(g => {
    if (!g.id) return false
    if (seen.has(g.id)) return false
    seen.add(g.id)
    return !fixedIds.has(g.id)
  })
  const sorted = [...filtered].sort((a, b) => {
    if (!!b.is_pinned !== !!a.is_pinned) return b.is_pinned ? 1 : -1
    return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  })
  return [...pinnedSessions.value, ...sorted]
})

// ── 左滑操作 ──
const swipedId = ref<string | null>(null)
const swipeStartX = ref(0)
const currentSwipeItem = ref<any>(null)
const swipeMoved = ref(false) // 区分滑动 vs 点击，防止 click 事件误关
const SWIPE_THRESHOLD = 50
const contextGroup = ref<any>(null)
const contextMenuStyle = ref<any>({})

function onSwipeStart(e: TouchEvent, g: any) {
  swipeStartX.value = e.touches[0].clientX
  swipeMoved.value = false
  currentSwipeItem.value = g
}
function onSwipeMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - swipeStartX.value
  if (Math.abs(dx) > 5) swipeMoved.value = true // 有实际滑动
  // 左滑（dx < -50）显示操作按钮
  if (dx < -SWIPE_THRESHOLD && currentSwipeItem.value) {
    swipedId.value = currentSwipeItem.value.id
  }
  // 右滑关闭
  if (dx > 10 && swipedId.value) {
    swipedId.value = null
  }
}
function onSwipeEnd() {
  currentSwipeItem.value = null
}
function closeSwipe() {
  swipedId.value = null
  currentSwipeItem.value = null
}

async function togglePin(g: any) {
  closeSwipe()
  const pinned = !g.is_pinned
  if (pinned) {
    groups.value = groups.value.map(x => x.id === g.id ? { ...x, is_pinned: true } : x)
  } else {
    groups.value = groups.value.map(x => x.id === g.id ? { ...x, is_pinned: false } : x)
  }
  try {
    await http.post(`/chat/groups/${g.id}/pin`, { pinned })
  } catch { /* 静默失败，前端已更新 */ }
}

async function deleteGroup(g: any) {
  closeSwipe()
  // 确认对话框
  if (!confirm(`确定要删除与 "${g.name}" 的聊天吗？\n\n删除后聊天记录将无法恢复。`)) {
    return
  }
  try {
    await http.delete(`/chat/groups/${g.id}`)
    groups.value = groups.value.filter(x => x.id !== g.id)
  } catch { /* 静默失败 */ }
}

const pendingItems = ref<any[]>([])

const subTabs = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待办' },
  { key: 'ai', label: 'AI管家' },
]

function avatarStyle(g: any) {
  const colors = ['#2E6BE6', '#52C41A', '#F5A623', '#F53F3F', '#722ED1', '#0FC6C2', '#EB6F29']
  const idx = (g.name || '').charCodeAt(0) % colors.length
  return { background: colors[idx] }
}

function highlight(text: string) {
  if (!text || !searchKeyword.value) return text
  const kw = searchKeyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${kw})`, 'gi'), '<mark>$1</mark>')
}

async function loadPendingItems() {
  try {
    const [procRes, retailRes] = await Promise.allSettled([
      http.get('/procure/ProcureOrder/index', { params: { list_rows: 1 } }),
      http.get('/retail/RetailOut/index', { params: { list_rows: 1 } }),
    ])
    const procRows = procRes.status === 'fulfilled' ? (procRes.value?.data?.rows ?? []) : []
    const retailRows = retailRes.status === 'fulfilled' ? (retailRes.value?.data?.rows ?? []) : []
    const pendingProc = procRows.filter((r: any) => Number(r.status) === 0)
    const pendingRetail = retailRows.filter((r: any) => Number(r.status) === 0)
    const items: any[] = []
    if (pendingProc.length > 0) {
      items.push({ key: 'procure', label: '采购单待审核', icon: '📦', color: '#2E6BE6', count: pendingProc.length, onClick: () => router.push('/mobile/procure/order') })
    }
    if (pendingRetail.length > 0) {
      items.push({ key: 'retail', label: '零售单待审核', icon: '🛒', color: '#FF6B35', count: pendingRetail.length, onClick: () => router.push('/mobile/sale/out') })
    }
    pendingItems.value = items
  } catch { pendingItems.value = [] }
}

async function loadGroups() {
  try {
    const res = await http.get('/chat/groups', { params: { list_rows: 200 } })
    const rows = res?.data?.rows ?? res?.rows ?? []
    groups.value = rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.group_name || '会话',
      avatar_text: r.name?.[0],
      last_msg: r.last_message || r.last_msg || '暂无消息',
      last_time: formatTime(r.last_message_at || r.last_time || ''),
      unread: r.unread ?? 0,
      is_pinned: r.is_pinned ?? false,
      last_message_at: r.last_message_at || '',
    }))
    const totalUnread = rows.reduce((s: number, r: any) => s + (r.unread ?? 0), 0)
    if (typeof uni !== 'undefined') uni.$emit('update:unread', totalUnread)
  } catch { groups.value = [] }
}

async function loadContacts() {
  try {
    const res = await http.get('/shop/ShopCustomer/index', { params: { list_rows: 200 } })
    const rows = res?.data?.rows ?? res?.rows ?? []
    contacts.value = rows.map((r: any) => ({ id: r.id, name: r.name || r.customer_name }))
  } catch { contacts.value = [] }
}

async function loadActiveMeetings() {
  try {
    const res = await http.get('/meeting/active')
    const list = res?.data ?? res?.list ?? []
    activeMeetingCount.value = list.length
  } catch { activeMeetingCount.value = 0 }
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  if (diff < 7 * 86400000) return ['日','一','二','三','四','五','六'][d.getDay()]
  return `${d.getMonth() + 1}/${d.getDate()}`
}

async function doSearch() {
  if (!searchKeyword.value.trim()) { searchResults.value = []; return }
  searchLoading.value = true
  try {
    const [custRes, saleRes] = await Promise.allSettled([
      http.get('/shop/ShopCustomer/index', { params: { keywords: searchKeyword.value, list_rows: 10 } }),
      http.get('/stock/SaleOutOrder/index', { params: { keywords: searchKeyword.value, list_rows: 10 } }),
    ])
    const results: any[] = []
    if (custRes.status === 'fulfilled') {
      (custRes.value?.data?.rows ?? custRes.value?.rows ?? []).forEach((r: any) => {
        results.push({ id: r.id, type: 'customer', name: r.name || r.customer_name, sub: `客户 | ${r.phone || '无电话'}` })
      })
    }
    if (saleRes.status === 'fulfilled') {
      (saleRes.value?.data?.rows ?? saleRes.value?.rows ?? []).forEach((r: any) => {
        results.push({ id: r.id, type: 'order', name: `#${r.id} ${r.customer_name || '客户'}`, sub: `销售单 | ¥${r.total_amount || 0}` })
      })
    }
    searchResults.value = results
  } catch { searchResults.value = [] } finally { searchLoading.value = false }
}

function openSearchResult(r: any) {
  showSearch.value = false
  searchKeyword.value = ''
  if (r.type === 'customer') router.push('/mobile/sale/client')
  else if (r.type === 'order') router.push('/mobile/sale/out')
}

function handleScan() {
  // 跳扫码查库存
  router.push('/mobile/warehouse/scan')
}

function handleLogout() {
  authStore.logout()
  router.replace('/login')
  showDrawer.value = false
}

const filteredContacts = computed(() => {
  const kw = newChatKeyword.value.toLowerCase()
  if (!kw) return contacts.value.slice(0, 20)
  return contacts.value.filter((c: any) => c.name?.toLowerCase().includes(kw))
})

function startChat(c: any) {
  showNewChat.value = false
  http.post('/chat/create', { type: 'dm', target_id: c.id })
    .then((res) => { if (res?.data?.id) router.push(`/mobile/chat/${res.data.id}`) })
    .catch(() => router.push(`/mobile/chat/dm/${c.id}`))
}

function createGroupChat() {
  showNewChat.value = false
  router.push('/mobile/meeting')
}

import { watch } from 'vue'
watch(searchKeyword, (v) => { if (v) doSearch() })

let listPollTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadGroups()
  loadContacts()
  loadActiveMeetings()
  loadPendingItems()
  // 每 10 秒刷新消息列表（检查新消息和未读）
  listPollTimer = setInterval(() => {
    loadGroups()
  }, 10000)
})

onUnmounted(() => {
  if (listPollTimer) clearInterval(listPollTimer)
})
</script>

<script lang="ts">
export default { name: 'MobileChat' }
</script>

<style scoped>
.chat-page {
  height: 100%;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chat-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
  overscroll-behavior: contain;
}

/* tab 内容面板：撑满剩余空间，让内部滚动生效 */
.tab-panel,
.todo-tab,
.ai-tab {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* ── 企业微信风格顶部导航栏 ── */
.wx-nav-bar {
  background: #fff;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 4px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: env(safe-area-inset-top, 0px);
}
.wx-nav-left { flex: 1; display: flex; align-items: center; }
.wx-nav-title {
  flex: 0 0 auto;
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
  text-align: center;
  padding: 0 8px;
}
.wx-nav-right { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 2px; }
.nav-icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.nav-icon-btn:active { background: #f0f0f5; }

/* ── 搜索栏 ── */
.chat-search-bar {
  background: #fff;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  flex-shrink: 0;
}
.chat-search-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f2f3f5;
  border-radius: 6px;
  padding: 7px 12px;
}
.chat-search-placeholder { font-size: 14px; color: #999; }

/* ── 子Tab ── */
.chat-sub-tabs {
  background: #fff;
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.chat-sub-tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
}
.chat-sub-tab.active { color: #2E6BE6; font-weight: 700; }
.chat-sub-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 2px;
  background: #2E6BE6;
  border-radius: 1px;
}

/* ── 会议室入口 ── */
.chat-meeting-bar {
  background: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.chat-meeting-bar:active { background: #f5f5f5; }
.chat-meeting-icon {
  width: 36px;
  height: 36px;
  background: rgba(46,107,230,0.08);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chat-meeting-text { font-size: 14px; font-weight: 600; color: #1d2129; flex: 1; }
.chat-meeting-sub { font-size: 12px; color: #F5A623; font-weight: 500; }
.chat-meeting-arrow { font-size: 18px; color: #ccc; }

/* ── 消息列表 ── */
.chat-list { background: #fff; }
.chat-empty { text-align: center; padding: 60px 0; color: #999; }
.chat-empty-icon { margin-bottom: 10px; }
.chat-empty-text { font-size: 14px; }
.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
  position: relative;
}
.chat-item:last-child { border-bottom: none; }
.chat-item:active { background: #f0f0f0; }
.chat-avatar-wrap { position: relative; flex-shrink: 0; }
.chat-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  background: #2E6BE6;
}
.chat-avatar--sm { width: 40px; height: 40px; font-size: 14px; border-radius: 6px; }
.chat-avatar--meeting {
  background: rgba(99,102,241,0.12);
  color: #6366f1;
}
.chat-item--meeting {
  background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%);
}
.chat-item--meeting:active {
  background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%);
}
.chat-unread-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #f53f3f;
  border-radius: 50%;
  border: 2px solid #fff;
}
.chat-body { flex: 1; min-width: 0; }
.chat-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.chat-name { font-size: 15px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chat-time { font-size: 12px; color: #bbb; flex-shrink: 0; }
.chat-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.chat-msg { font-size: 13px; color: #999; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.chat-badge {
  min-width: 18px;
  height: 18px;
  background: #f53f3f;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  flex-shrink: 0;
}
.todo-item .chat-body { min-width: 0; }
.todo-item .chat-name { font-size: 14px; }

/* ── AI管家 Tab ── */
.ai-tab { padding: 16px; }
.ai-banner {
  background: linear-gradient(135deg, #2E6BE6 0%, #4A8BF5 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}
.ai-banner:active { opacity: 0.85; }
.ai-avatar { font-size: 40px; line-height: 1; }
.ai-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.ai-sub { font-size: 13px; color: rgba(255,255,255,0.75); }

/* ── 搜索全屏 ── */
.search-fullscreen { position: relative; z-index: 30; }
.chat-search-panel {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 12px;
}
.chat-search-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-search-inner-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f2f3f5;
  border-radius: 6px;
  padding: 7px 10px;
}
.chat-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  outline: none;
}
.chat-search-input::placeholder { color: #999; }
.chat-search-clear { border: none; background: transparent; cursor: pointer; padding: 2px; display: flex; }
.chat-search-cancel { border: none; background: transparent; color: #2E6BE6; font-size: 14px; cursor: pointer; white-space: nowrap; }
.chat-search-result { background: #fff; min-height: 200px; }
.chat-search-hint { text-align: center; padding: 40px; color: #999; font-size: 14px; }
.chat-search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}
.chat-search-item:active { background: #f5f5f5; }
.chat-search-item :deep(mark) { background: rgba(46,107,230,0.12); color: #2E6BE6; border-radius: 2px; }

/* ── 左侧抽屉 ── */
.drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 300;
  animation: fadeIn 0.2s ease;
}
.drawer {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 75vw;
  max-width: 280px;
  background: #1B3A8C;
  z-index: 301;
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0px);
}
.drawer.open { transform: translateX(0); }
.drawer-hero {
  background: linear-gradient(135deg, #1B3A8C 0%, #2A52BE 100%);
  padding: 24px 16px 16px;
  position: relative;
  flex-shrink: 0;
}
.drawer-avatar-wrap { position: relative; width: 60px; margin-bottom: 10px; }
.drawer-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  border: 2px solid rgba(255,255,255,0.4);
}
.drawer-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #52C41A;
  border-radius: 50%;
  border: 2px solid #1B3A8C;
}
.drawer-name { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.drawer-company { font-size: 13px; color: rgba(255,255,255,0.7); }
.drawer-top-actions {
  position: absolute;
  top: 16px;
  right: 12px;
  display: flex;
  gap: 8px;
}
.drawer-action-btn {
  width: 34px;
  height: 34px;
  border: none;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255,255,255,0.9);
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.drawer-action-btn:active { background: rgba(255,255,255,0.25); }
.drawer-menu { flex: 1; padding: 8px 0; }
.drawer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  color: rgba(255,255,255,0.9);
  font-size: 15px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.drawer-item:active { background: rgba(255,255,255,0.08); }
.drawer-item-icon { font-size: 18px; }
.drawer-item.danger { color: #ff7875; }
.drawer-footer { border-top: 1px solid rgba(255,255,255,0.15); padding: 8px 0 calc(env(safe-area-inset-bottom, 0px) + 8px); }

/* ── + 号下拉菜单 ── */
.plus-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 198;
}
.plus-menu {
  position: fixed;
  right: 16px;
  bottom: 116px;
  background: #fff;
  border-radius: 8px;
  width: 150px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 199;
  overflow: hidden;
  animation: fadeIn 0.15s ease;
}
.plus-menu::before {
  content: '';
  position: absolute;
  bottom: -6px;
  right: 16px;
  width: 12px;
  height: 12px;
  background: #fff;
  transform: rotate(45deg);
  box-shadow: -2px -2px 4px rgba(0,0,0,0.06);
}
.plus-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.plus-menu-item:active { background: #f5f5f5; }
.plus-menu-item + .plus-menu-item { border-top: 1px solid #f0f0f0; }
.plus-menu-item svg { color: #666; flex-shrink: 0; }

/* ── 置顶标识 ── */
.chat-item--pinned { background: #fafafa; }
.chat-pin-icon { position: absolute; top: 8px; left: 4px; font-size: 10px; }

/* ── 左滑操作 ── */
.chat-item-wrap {
  position: relative;
  overflow: hidden;
}
.chat-item-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: none;
  z-index: 1;
}
.chat-item-wrap.swiped .chat-item-actions {
  display: flex;
}
.chat-item-wrap.swiped > .chat-item {
  transform: translateX(-160px);
}
.chat-item {
  transition: transform 0.2s ease;
  position: relative;
  z-index: 2;
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
}
.pin-btn {
  background: #f5a623;
}
.delete-btn {
  background: #ff4d4f;
}

/* ── 右键/长按菜单 ── */
.context-menu-mask {
  position: fixed; inset: 0; z-index: 999;
  background: transparent;
}
.context-menu {
  position: fixed; z-index: 1000;
  background: rgba(255,255,255,0.98);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  overflow: hidden;
  min-width: 140px;
  backdrop-filter: blur(10px);
}
.ctx-item {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 16px;
  font-size: 14px; color: #333;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-bottom: 1px solid #f0f0f0;
}
.ctx-item:last-child { border-bottom: none; }
.ctx-item:active { background: #f5f5f5; }
.ctx-item svg { color: #666; flex-shrink: 0; }
.ctx-item--danger { color: #ee4444; }
.ctx-item--danger svg { color: #ee4444; }

/* ── 右下角新建按钮 ── */
.chat-fab {
  position: fixed;
  bottom: 66px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: #2E6BE6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46,107,230,0.4);
  -webkit-tap-highlight-color: transparent;
  z-index: 50;
  transition: transform 0.15s, box-shadow 0.15s;
}
.chat-fab:active { transform: scale(0.92); box-shadow: 0 2px 6px rgba(46,107,230,0.3); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
