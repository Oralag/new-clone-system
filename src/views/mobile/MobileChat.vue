<template>
  <div class="chat-page">
    <!-- 顶部栏：企业微信风格 — 搜索 + 标题 + 新建 -->
    <div class="wx-nav-bar">
      <div class="wx-nav-left">
        <div class="wx-nav-search" @click="showSearch = !showSearch">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span>搜索</span>
        </div>
      </div>
      <div class="wx-nav-title">消息</div>
      <div class="wx-nav-right">
        <button class="wx-nav-btn" @click="showNewChat = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜索展开面板 -->
    <div v-if="showSearch" class="chat-search-panel">
      <div class="chat-search-bar">
        <div class="chat-search-inner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            v-model="searchKeyword"
            class="chat-search-input"
            placeholder="搜索聊天记录"
            autofocus
          />
          <button v-if="searchKeyword" class="chat-search-clear" @click="searchKeyword = ''">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <button class="chat-search-cancel" @click="showSearch = false; searchKeyword = ''">取消</button>
      </div>
    </div>

    <!-- 会议室置顶入口（企业微信置顶会话风格） -->
    <div class="chat-meeting-bar" @click="router.push('/mobile/meeting')">
      <div class="chat-meeting-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8">
          <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
        </svg>
      </div>
      <span class="chat-meeting-text">会议室</span>
      <span class="chat-meeting-sub" v-if="activeMeetingCount > 0">{{ activeMeetingCount }} 个会议进行中</span>
      <span class="chat-meeting-arrow">›</span>
    </div>

    <!-- 消息列表 -->
    <div class="chat-list" v-if="!showSearch">
      <div v-if="groups.length === 0" class="chat-empty">
        <div class="chat-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="chat-empty-text">暂无消息</div>
      </div>

      <div
        v-for="g in groups"
        :key="g.id"
        class="chat-item"
        @click="router.push(`/mobile/chat/${g.id}`)"
      >
        <!-- 头像 -->
        <div class="chat-avatar-wrap">
          <div class="chat-avatar" :style="avatarStyle(g)">
            {{ g.avatar_text || g.name?.[0] || '群' }}
          </div>
          <span v-if="g.unread > 0" class="chat-unread-dot" v-show="false"></span>
        </div>
        <!-- 内容 -->
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

    <!-- 搜索结果 -->
    <div class="chat-search-result" v-if="showSearch && searchKeyword">
      <div class="chat-search-hint" v-if="searchResults.length === 0 && !searchLoading">
        未找到 "{{ searchKeyword}}" 相关结果
      </div>
      <div v-for="r in searchResults" :key="r.id" class="chat-search-item" @click="openSearchResult(r)">
        <div class="chat-avatar chat-avatar--sm">{{ r.name?.[0] || '?' }}</div>
        <div class="chat-body">
          <div class="chat-top">
            <span class="chat-name" v-html="highlight(r.name)"></span>
          </div>
          <div class="chat-bottom">
            <span class="chat-msg" v-html="highlight(r.sub)"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建会话按钮 -->
    <div class="chat-fab" @click="showNewChat = true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>

    <!-- 新建会话弹窗 -->
    <div v-if="showNewChat" class="chat-modal-mask" @click.self="showNewChat = false">
      <div class="chat-modal">
        <div class="chat-modal-hd">
          <span class="chat-modal-title">新建会话</span>
          <button class="chat-modal-close" @click="showNewChat = false">关闭</button>
        </div>
        <div class="chat-modal-body">
          <div class="chat-modal-search">
            <input v-model="newChatKeyword" placeholder="搜索联系人" class="chat-modal-input" />
          </div>
          <div class="chat-modal-list">
            <div
              v-for="c in filteredContacts"
              :key="c.id"
              class="chat-modal-item"
              @click="startChat(c)"
            >
              <div class="chat-avatar chat-avatar--sm">{{ c.name?.[0] || '?' }}</div>
              <span class="chat-modal-name">{{ c.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建会话/群聊弹窗 -->
    <div v-if="showNewChat" class="chat-new-mask" @click.self="showNewChat = false">
      <div class="chat-new-sheet">
        <div class="chat-new-header">
          <span>发起聊天</span>
          <button @click="showNewChat = false">取消</button>
        </div>
        <div class="chat-new-body">
          <div class="chat-new-item" @click="createGroupChat">
            <div class="chat-new-icon" style="background:#2E6BE6;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="chat-new-info">
              <div class="chat-new-title">发起群聊</div>
              <div class="chat-new-sub">选择联系人创建群聊</div>
            </div>
            <span class="contacts-arrow">›</span>
          </div>
          <div class="chat-new-item" @click="router.push('/mobile/contacts'); showNewChat = false">
            <div class="chat-new-icon" style="background:#52C41A;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="chat-new-info">
              <div class="chat-new-title">发起单聊</div>
              <div class="chat-new-sub">从通讯录选择联系人</div>
            </div>
            <span class="contacts-arrow">›</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'

const router = useRouter()
const groups = ref<any[]>([])
const contacts = ref<any[]>([])
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const showSearch = ref(false)
const showNewChat = ref(false)
const newChatKeyword = ref('')
const activeMeetingCount = ref(0)

const filteredContacts = computed(() => {
  const kw = newChatKeyword.value.toLowerCase()
  if (!kw) return contacts.value.slice(0, 20)
  return contacts.value.filter((c: any) => c.name?.toLowerCase().includes(kw))
})

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

async function createGroupChat() {
  // TODO: 跳转到选人页面创建群聊，目前直接导航到会议室（可复用成员选择器）
  showNewChat.value = false
  router.push('/mobile/meeting')
}

async function loadGroups() {
  try {
    const res = await http.get('/chat/groups', { params: { list_rows: 50 } })
    const rows = res?.data?.rows ?? res?.rows ?? []
    groups.value = rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.group_name || '会话',
      avatar_text: r.name?.[0],
      last_msg: r.last_message || r.last_msg || '暂无消息',
      last_time: r.last_time ? formatTime(r.last_time) : '',
      unread: r.unread ?? 0,
    }))
    // 总未读数
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
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

function openSearchResult(r: any) {
  showSearch.value = false
  searchKeyword.value = ''
  if (r.type === 'customer') router.push('/mobile/sale/client')
  else if (r.type === 'order') router.push('/mobile/sale/out')
}

async function startChat(c: any) {
  showNewChat.value = false
  try {
    const res = await http.post('/chat/create', { type: 'dm', target_id: c.id })
    if (res?.data?.id) {
      router.push(`/mobile/chat/${res.data.id}`)
    }
  } catch {
    router.push(`/mobile/chat/dm/${c.id}`)
  }
}

watch(searchKeyword, (v) => { if (v) doSearch() })

onMounted(() => {
  loadGroups()
  loadContacts()
  loadActiveMeetings()
})
</script>

<script lang="ts">
import { watch } from 'vue'
export default { name: 'MobileChat' }
</script>

<style scoped>
.chat-page {
  min-height: 100%;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* ── 搜索栏 ── */
.chat-search-bar {
  background: #fafafa;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 5;
}
.chat-search-inner {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ededed;
  border-radius: 6px;
  padding: 6px 10px;
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
.chat-search-cancel {
  border: none;
  background: transparent;
  color: #2E6BE6;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
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
.chat-empty {
  text-align: center;
  padding: 60px 0;
  color: #999;
}
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

/* ── 搜索结果 ── */
.chat-search-result { background: #fff; }
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

/* ── 新建会话弹窗 ── */
.chat-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.chat-modal {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
}
.chat-modal-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.chat-modal-title { font-size: 16px; font-weight: 700; color: #1d2129; }
.chat-modal-close { border: none; background: transparent; color: #2E6BE6; font-size: 14px; cursor: pointer; }
.chat-modal-body { flex: 1; overflow-y: auto; }
.chat-modal-search { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }
.chat-modal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.chat-modal-input:focus { border-color: #2E6BE6; }
.chat-modal-list { padding: 8px 0; }
.chat-modal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.chat-modal-item:active { background: #f5f5f5; }
.chat-modal-name { font-size: 14px; color: #333; }

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

/* ── 企业微信风格顶部导航栏 ── */
.wx-nav-bar {
  background: #fff;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px 0 4px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: env(safe-area-inset-top, 0px);
}
.wx-nav-left { flex: 1; }
.wx-nav-title {
  flex: 0 0 auto;
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
  text-align: center;
  padding: 0 8px;
}
.wx-nav-right { flex: 1; display: flex; justify-content: flex-end; }
.wx-nav-search {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: #f2f3f5;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-width: 80px;
}
.wx-nav-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #2E6BE6;
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
}
.wx-nav-btn:active { background: #f0f0f5; }

/* ── 搜索展开面板 ── */
.chat-search-panel {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

/* ── 新建会话弹窗 ── */
.chat-new-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.chat-new-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  animation: slideUp 0.25s ease;
}
.chat-new-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
}
.chat-new-header button {
  border: none;
  background: transparent;
  color: #2E6BE6;
  font-size: 14px;
  cursor: pointer;
}
.chat-new-body { padding: 8px 0 calc(env(safe-area-inset-bottom, 0px) + 8px); }
.chat-new-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.chat-new-item:active { background: #fafafa; }
.chat-new-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chat-new-info { flex: 1; }
.chat-new-title { font-size: 16px; font-weight: 600; color: #1d2129; margin-bottom: 2px; }
.chat-new-sub { font-size: 12px; color: #86909c; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
