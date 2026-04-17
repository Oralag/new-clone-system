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
        <button class="nav-icon-btn" @click="showChatPlus = !showChatPlus; showFabPlus = false" title="新建">
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
                <span class="chat-name">{{ g.name }}<span v-if="g.type === 'group' || g.member_count > 2" class="group-badge">群</span></span>
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

    <!-- ── + 号下拉菜单（快捷操作） ── -->
  </div>

  <!-- ── 右键/长按菜单 ── -->
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

  <!-- 所有弹窗通过 Teleport 渲染到 body，避免被 .wx-layout 的 overflow:hidden 裁剪 -->
  <Teleport to="body">
    <!-- 发起群聊 - 联系人选择面板 -->
    <div v-if="showCreateGroup" class="m-modal-mask" @click.self="showCreateGroup = false">
      <div class="m-modal-sheet m-modal-sheet-tall" @touchmove.stop>
        <div class="m-modal-header">
          <span>发起群聊</span>
          <button class="m-modal-close" @click="showCreateGroup = false">取消</button>
        </div>
        <div style="padding: 8px 16px; border-bottom: 1px solid #f2f3f5; flex-shrink: 0;">
          <input v-model="newGroupName" placeholder="群聊名称（选填）" class="group-name-input" />
          <div class="group-search-input">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input v-model="groupSearchKeyword" placeholder="搜索联系人" />
          </div>
        </div>
        <!-- 已选成员 -->
        <div v-if="selectedMembers.length > 0" class="selected-members-bar">
          <div class="selected-members-scroll">
            <div v-for="m in selectedMembers" :key="m.id" class="selected-member-chip" @click="toggleMember(m)">
              <span>{{ m.name?.[0] || '?' }}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
        </div>
        <!-- 联系人列表 -->
        <div class="m-modal-body" style="padding: 0;">
          <div v-for="c in groupFilteredContacts" :key="c.id" class="group-contact-item" :class="{ selected: selectedMembers.some(m => m.id === c.id) }" @click="toggleMember(c)">
            <div class="group-contact-avatar">{{ c.name?.[0] || '?' }}</div>
            <span class="group-contact-name">{{ c.name }}</span>
            <div class="group-contact-check">
              <svg v-if="selectedMembers.some(m => m.id === c.id)" width="18" height="18" viewBox="0 0 24 24" fill="#07c160" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
            </div>
          </div>
        </div>
        <!-- 底部确认 -->
        <div class="m-modal-footer">
          <button class="group-create-btn" :disabled="selectedMembers.length === 0" @click="doCreateGroup">
            确定（{{ selectedMembers.length }}）
          </button>
        </div>
      </div>
    </div>

    <!-- ── 顶栏+菜单：聊天操作 ── -->
    <div v-if="showChatPlus" class="plus-menu-mask" @click="showChatPlus = false"></div>
    <div v-if="showChatPlus" class="plus-menu chat-plus-menu">
      <div class="plus-menu-item" @click="showCreateGroup = true; showChatPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#07c160" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        发起群聊
      </div>
      <div class="plus-menu-item" @click="router.push('/mobile/chat/new'); showChatPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        新的聊天
      </div>
    </div>

    <!-- ── 底部FAB+菜单：业务快捷操作 ── -->
    <div v-if="showFabPlus" class="plus-menu-mask" @click="showFabPlus = false"></div>
    <div v-if="showFabPlus" class="plus-menu fab-plus-menu">
      <div class="fab-plus-title">快捷操作</div>
      <div class="plus-menu-item" @click="router.push('/mobile/procure/scan-in'); showFabPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="10" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>
        扫码入库
      </div>
      <div class="plus-menu-item" @click="router.push('/mobile/task/new?new=1'); showFabPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        新建工作计划
      </div>
      <div class="plus-menu-item" @click="router.push('/mobile/sale/out'); showFabPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        新建销售出库
      </div>
      <div class="plus-menu-item" @click="router.push('/cashregister'); showFabPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="14" x2="12" y2="14"/><line x1="6" y1="17" x2="10" y2="17"/></svg>
        快捷收款
      </div>
    </div>

    <!-- ── 右下角快捷操作按钮 ── -->
    <div class="chat-fab" @click="showFabPlus = !showFabPlus; showChatPlus = false">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'
import { getAdminList } from '@/api/setting'
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
const showChatPlus = ref(false)
const showFabPlus = ref(false)
const showCreateGroup = ref(false)
const selectedMembers = ref<any[]>([])
const groupSearchKeyword = ref('')
const newGroupName = ref('')

// 打开群聊面板时确保通讯录已加载
watch(showCreateGroup, (v) => { if (v && contacts.value.length === 0) loadContacts() })

const groupFilteredContacts = computed(() => {
  const kw = groupSearchKeyword.value.toLowerCase().trim()
  // 合并 AI助手 + 机器人Agent + 员工
  const aiBot = pinnedSessions.value.find(s => s.type === 'ai')
  const botContacts = aiBot ? [{ id: aiBot.id, name: aiBot.name, role_name: 'AI助手', _isBot: true }] : []
  // 通讯录中的机器人Agent
  const robotAgents = [
    { id: 'captain', name: 'Captain 总指挥', role_name: '机器人' },
    { id: 'copywriter', name: '文案Agent', role_name: '机器人' },
    { id: 'poster', name: '海报Agent', role_name: '机器人' },
    { id: 'video', name: '视频Agent', role_name: '机器人' },
    { id: 'brand', name: '品牌Agent', role_name: '机器人' },
    { id: 'trend', name: '趋势Agent', role_name: '机器人' },
    { id: 'publisher', name: '发布Agent', role_name: '机器人' },
    { id: 'designer', name: '平面设计师', role_name: '机器人' },
    { id: 'marketing', name: '营销顾问', role_name: '机器人' },
  ]
  const all = [...botContacts, ...robotAgents, ...contacts.value]
  if (!kw) return all
  return all.filter((c: any) => c.name?.toLowerCase().includes(kw))
})

function toggleMember(c: any) {
  const idx = selectedMembers.value.findIndex(m => m.id === c.id)
  if (idx >= 0) selectedMembers.value.splice(idx, 1)
  else selectedMembers.value.push(c)
}

async function doCreateGroup() {
  if (selectedMembers.value.length === 0) return
  try {
    const memberIds = selectedMembers.value.map(m => m.id)
    let name = newGroupName.value.trim()
    if (!name) {
      name = memberIds.length === 1
        ? `与${selectedMembers.value[0].name}的群聊`
        : `群聊(${memberIds.length + 1}人)`
    }
    const res = await http.post('/adminapi/chat/groups', {
      name,
      member_ids: memberIds
    })
    console.log('[doCreateGroup] res:', JSON.stringify(res))
    showCreateGroup.value = false
    selectedMembers.value = []
    groupSearchKeyword.value = ''
    newGroupName.value = ''
    // 后端返回 { code:1, data: { id, name, ... } }
    const groupId = res?.data?.id || res?.id
    if (groupId) {
      loadGroups() // 后台刷新列表
      router.push(`/mobile/chat/${groupId}`)
    } else {
      loadGroups()
    }
  } catch (e) {
    console.error('[doCreateGroup] error:', e)
    alert('创建群聊失败：' + (e?.message || '未知错误'))
    showCreateGroup.value = false
    selectedMembers.value = []
    groupSearchKeyword.value = ''
    newGroupName.value = ''
  }
}
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
      member_count: r.member_count ?? r.members?.length ?? 0,
      type: r.member_count > 2 || r.members?.length > 2 ? 'group' : 'dm',
    }))
    const totalUnread = rows.reduce((s: number, r: any) => s + (r.unread ?? 0), 0)
    if (typeof uni !== 'undefined') uni.$emit('update:unread', totalUnread)
  } catch { groups.value = [] }
}

// 加载内部员工通讯录
async function loadContacts() {
  try {
    const res = await getAdminList({ list_rows: 500 })
    const rows = res?.data?.rows ?? res?.rows ?? []
    contacts.value = rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.admin_name || '未知用户',
      role_name: r.role_name || '',
    }))
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

const filteredContacts2 = computed(() => {
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
  router.push('/mobile/agent/meeting')
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

/* 发起群聊 */
.group-search-input {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 6px 10px;
  margin-top: 6px;
}
.group-search-input input {
  border: none;
  background: none;
  outline: none;
  flex: 1;
  font-size: 14px;
}
.group-name-input {
  width: 100%;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.selected-members-bar {
  padding: 8px 16px;
  border-bottom: 1px solid #f2f3f5;
  flex-shrink: 0;
}
.selected-members-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.selected-member-chip {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #e8f5e9;
  color: #07c160;
  border-radius: 14px;
  padding: 3px 8px 3px 6px;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.selected-member-chip span {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #07c160;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
.group-contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 10px;
}
.group-contact-item:active { background: #f5f5f5; }
.group-contact-avatar {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #07c160;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}
.group-contact-name { flex: 1; font-size: 15px; color: #1d2129; }
.group-contact-check { flex-shrink: 0; }
.group-create-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}
.group-create-btn:disabled { background: #ccc; color: #fff; }

/* Modal (same as MobileGroupChat) */
.m-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100dvh;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.m-modal-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  /* 高度用 dvh 配合 bottom padding，确保底部按钮不被 TabBar 遮挡 */
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.m-modal-sheet-tall { max-height: 100dvh; }
.m-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
  flex-shrink: 0;
}
.m-modal-close { border: none; background: transparent; color: #0071e3; font-size: 14px; cursor: pointer; }
.m-modal-body { flex: 1; min-height: 0; overflow-y: auto; padding: 0; padding-bottom: env(safe-area-inset-bottom, 0px); touch-action: pan-y; -webkit-overflow-scrolling: touch; }
.m-modal-footer { padding: 14px 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom, 20px)); border-top: 1px solid #f2f3f5; flex-shrink: 0; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.plus-menu {
  position: fixed;
  background: #fff;
  border-radius: 10px;
  width: 140px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 199;
  overflow: hidden;
  animation: fadeIn 0.15s ease;
}
.plus-menu::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  transform: rotate(45deg);
  box-shadow: -2px -2px 4px rgba(0,0,0,0.06);
}
.chat-plus-menu::before { top: -6px; right: 16px; }
.fab-plus-menu::before { bottom: -6px; right: 16px; }
.plus-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
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
.group-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 0 5px;
  height: 16px;
  background: #2E6BE6;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 3px;
  vertical-align: middle;
}

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

/* ── 右下角快捷操作按钮 ── */
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

/* ── 菜单定位区分 ── */
.chat-plus-menu {
  top: 50px;
  right: 12px;
}
.fab-plus-menu {
  bottom: 126px;
  right: 12px;
  top: auto;
}
.fab-plus-title {
  padding: 10px 16px 6px;
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
