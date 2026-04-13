<template>
  <div class="m-chat-page">
    <!-- 标题栏 -->
    <div class="m-chat-header">
      <span class="m-chat-title">消息</span>
      <button class="m-chat-create-btn" @click="showCreateGroup = true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>

    <!-- 搜索 -->
    <div class="m-chat-search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input v-model="searchKeyword" class="m-chat-search-input" placeholder="搜索群聊或联系人..." />
    </div>

    <!-- Tab: 群聊 / 通知 -->
    <div class="m-chat-tabs">
      <button :class="['m-chat-tab', activeTab === 'groups' ? 'active' : '']" @click="activeTab = 'groups'">
        群聊 <span v-if="groupUnread > 0" class="m-tab-badge">{{ groupUnread }}</span>
      </button>
      <button :class="['m-chat-tab', activeTab === 'notifications' ? 'active' : '']" @click="activeTab = 'notifications'">
        通知 <span v-if="notifUnread > 0" class="m-tab-badge">{{ notifUnread }}</span>
      </button>
      <button :class="['m-chat-tab', activeTab === 'ai' ? 'active' : '']" @click="goAIBot">
        🤖 AI助手
      </button>
    </div>

    <!-- 群聊列表 -->
    <div v-if="activeTab === 'groups'" class="m-chat-list">
      <div v-if="filteredGroups.length === 0" class="m-chat-empty">
        <div class="m-chat-empty-icon">💬</div>
        <div class="m-chat-empty-text">暂无群聊</div>
        <button class="m-chat-empty-btn" @click="showCreateGroup = true">创建群聊</button>
      </div>
      <div v-for="g in filteredGroups" :key="g.id" class="m-chat-item" @click="openChat(g)">
        <div class="m-chat-item-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="m-chat-item-content">
          <div class="m-chat-item-top">
            <span class="m-chat-item-name">{{ g.name }}</span>
            <span class="m-chat-item-time">{{ formatTime(g.last_message_at) }}</span>
          </div>
          <div class="m-chat-item-bottom">
            <span class="m-chat-item-preview">{{ g.last_message || '暂无消息' }}</span>
            <span v-if="g.unread > 0" class="m-chat-unread">{{ g.unread > 99 ? '99+' : g.unread }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知列表 -->
    <div v-if="activeTab === 'notifications'" class="m-notif-list">
      <div v-if="notifications.length === 0" class="m-chat-empty">
        <div class="m-chat-empty-icon">🔔</div>
        <div class="m-chat-empty-text">暂无通知</div>
      </div>
      <div v-for="n in notifications" :key="n.id" class="m-notif-item" :class="{ unread: !n.read }" @click="handleNotif(n)">
        <div class="m-notif-icon" :style="{ background: n.iconBg }">{{ n.icon }}</div>
        <div class="m-notif-content">
          <div class="m-notif-title">{{ n.title }}</div>
          <div class="m-notif-text">{{ n.text }}</div>
          <div class="m-notif-time">{{ formatTime(n.created_at) }}</div>
        </div>
      </div>
    </div>

    <!-- 创建群聊弹窗 -->
    <div v-if="showCreateGroup" class="m-modal-mask" @click.self="showCreateGroup = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>创建群聊</span>
          <button class="m-modal-close" @click="showCreateGroup = false">取消</button>
        </div>
        <div class="m-modal-body">
          <div class="m-form-item">
            <label>群名称</label>
            <input v-model="newGroupForm.name" class="m-input" placeholder="如：销售部群" />
          </div>
          <div class="m-form-item">
            <label>选择成员</label>
            <div class="m-selected-members">
              <div v-for="m in newGroupForm.members" :key="m.id" class="m-member-chip">
                {{ m.name }} <button @click="removeNewMember(m.id)">×</button>
              </div>
              <button class="m-add-member-btn" @click="showMemberPicker = true">+ 添加</button>
            </div>
          </div>
        </div>
        <div class="m-modal-footer">
          <button class="m-btn-primary" :disabled="!newGroupForm.name || newGroupForm.members.length === 0 || creating" @click="createGroup">
            {{ creating ? '创建中...' : '创建群聊' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 成员选择器 -->
    <div v-if="showMemberPicker" class="m-modal-mask" @click.self="showMemberPicker = false">
      <div class="m-modal-sheet">
        <div class="m-modal-header">
          <span>选择成员</span>
          <button class="m-modal-close" @click="showMemberPicker = false">完成</button>
        </div>
        <div class="m-modal-body">
          <div class="m-pick-search">
            <input v-model="pickSearch" class="m-input" placeholder="搜索成员..." />
          </div>
          <div class="m-pick-list">
            <div v-for="m in filteredPickMembers" :key="m.id" class="m-pick-item" @click="toggleNewMember(m)">
              <div class="m-pick-check">
                <svg v-if="isNewMemberSelected(m.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="m-pick-avatar">{{ m.name?.[0] || '?' }}</div>
              <div class="m-pick-info">
                <div class="m-pick-name">{{ m.name }}</div>
                <div class="m-pick-sub">{{ m.position || m.role || '成员' }}</div>
              </div>
            </div>
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
import { ElMessage } from 'element-plus'

const router = useRouter()

const searchKeyword = ref('')
const activeTab = ref('groups')
const showCreateGroup = ref(false)
const showMemberPicker = ref(false)
const creating = ref(false)
const pickSearch = ref('')
const groups = ref<any[]>([])
const notifications = ref<any[]>([])
const allMembers = ref<any[]>([])
const groupUnread = ref(0)
const notifUnread = ref(0)

const newGroupForm = ref({ name: '', members: [] as any[] })

const filteredGroups = computed(() => {
  if (!searchKeyword.value) return groups.value
  const q = searchKeyword.value.toLowerCase()
  return groups.value.filter((g: any) => g.name?.toLowerCase().includes(q))
})

const filteredPickMembers = computed(() => {
  if (!pickSearch.value) return allMembers.value
  const q = pickSearch.value.toLowerCase()
  return allMembers.value.filter((m: any) => m.name?.toLowerCase().includes(q))
})

function isNewMemberSelected(id: number) {
  return newGroupForm.value.members.some((m: any) => m.id === id)
}

function toggleNewMember(m: any) {
  if (isNewMemberSelected(m.id)) {
    newGroupForm.value.members = newGroupForm.value.members.filter((x: any) => x.id !== m.id)
  } else {
    newGroupForm.value.members.push(m)
  }
}

function removeNewMember(id: number) {
  newGroupForm.value.members = newGroupForm.value.members.filter((m: any) => m.id !== id)
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${d.getMonth() + 1}-${d.getDate()}`
}

function openChat(g: any) {
  router.push(`/mobile/chat/${g.id}`)
}

function goAIBot() {
  router.push('/mobile/ai-bot')
}

function handleNotif(n: any) {
  n.read = true
  if (n.route) router.push(n.route)
}

async function createGroup() {
  creating.value = true
  try {
    const res = await http.post('/chat/groups', {
      name: newGroupForm.value.name,
      member_ids: newGroupForm.value.members.map((m: any) => m.id),
    })
    const newGroup = res?.data ?? res
    showCreateGroup.value = false
    newGroupForm.value = { name: '', members: [] }
    ElMessage.success('群聊创建成功')
    groups.value.unshift({ ...newGroup, unread: 0, last_message: '' })
    router.push(`/mobile/chat/${newGroup.id}`)
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  // 加载群列表
  try {
    const res = await http.get('/chat/groups', { params: { list_rows: 50 } })
    groups.value = res?.data?.rows ?? res?.rows ?? []
    groupUnread.value = groups.value.reduce((s: number, g: any) => s + (g.unread || 0), 0)
  } catch { /* 忽略 */ }

  // 加载通知
  try {
    const res = await http.get('/mobile/notifications', { params: { list_rows: 20 } })
    notifications.value = res?.data?.rows ?? res?.rows ?? []
    notifUnread.value = notifications.value.filter((n: any) => !n.read).length
  } catch { /* 忽略 */ }

  // 加载成员
  try {
    const res = await http.get('/admin/Admin/index', { params: { list_rows: 200 } })
    allMembers.value = res?.data?.rows ?? res?.rows ?? []
  } catch { /* 忽略 */ }
})
</script>

<style scoped>
.m-chat-page {
  min-height: 100%;
  background: #fff;
  padding-bottom: 80px;
}

.m-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f2f3f5;
}
.m-chat-title { font-size: 22px; font-weight: 800; color: #1d2129; letter-spacing: -0.02em; }
.m-chat-create-btn {
  width: 36px; height: 36px;
  background: #0071e3;
  border: none;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.m-chat-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  background: #f5f5f7;
  border-radius: 10px;
  padding: 8px 12px;
}
.m-chat-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #1d2129;
  outline: none;
}

.m-chat-tabs {
  display: flex;
  padding: 0 16px;
  border-bottom: 1px solid #f2f3f5;
  gap: 0;
}
.m-chat-tab {
  flex: 1;
  height: 40px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #86909c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  -webkit-tap-highlight-color: transparent;
}
.m-chat-tab.active { color: #0071e3; border-bottom-color: #0071e3; }
.m-tab-badge {
  background: #f53f3f;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 999px;
  min-width: 16px;
  text-align: center;
}

.m-chat-list { padding: 8px 0; }
.m-chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-chat-item:active { background: #f5f5f7; }
.m-chat-item-avatar {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, #0071e3, #005bb5);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.m-chat-item-content { flex: 1; min-width: 0; }
.m-chat-item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.m-chat-item-name { font-size: 15px; font-weight: 600; color: #1d2129; }
.m-chat-item-time { font-size: 12px; color: #86909c; flex-shrink: 0; }
.m-chat-item-bottom { display: flex; justify-content: space-between; align-items: center; }
.m-chat-item-preview { font-size: 13px; color: #86909c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.m-chat-unread {
  background: #f53f3f;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  flex-shrink: 0;
  margin-left: 8px;
}

.m-notif-list { padding: 8px 0; }
.m-notif-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-notif-item.unread { background: #f0f7ff; }
.m-notif-item:active { background: #f5f5f7; }
.m-notif-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.m-notif-content { flex: 1; min-width: 0; }
.m-notif-title { font-size: 14px; font-weight: 600; color: #1d2129; margin-bottom: 2px; }
.m-notif-text { font-size: 13px; color: #4e5969; margin-bottom: 4px; }
.m-notif-time { font-size: 11px; color: #86909c; }

.m-chat-empty { text-align: center; padding: 60px 0; }
.m-chat-empty-icon { font-size: 48px; margin-bottom: 12px; }
.m-chat-empty-text { font-size: 14px; color: #86909c; margin-bottom: 16px; }
.m-chat-empty-btn {
  padding: 8px 24px;
  background: #0071e3;
  border: none;
  border-radius: 999px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

/* 弹窗 */
.m-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.m-modal-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
}
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
.m-modal-body { flex: 1; overflow-y: auto; padding: 16px; }
.m-modal-footer { padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px); border-top: 1px solid #f2f3f5; flex-shrink: 0; }

.m-form-item { margin-bottom: 16px; }
.m-form-item label { display: block; font-size: 13px; font-weight: 600; color: #4e5969; margin-bottom: 8px; }
.m-input {
  width: 100%;
  height: 44px;
  background: #f5f5f7;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 15px;
  color: #1d2129;
  outline: none;
  box-sizing: border-box;
}
.m-input:focus { border-color: #0071e3; background: #fff; }
.m-selected-members { display: flex; flex-wrap: wrap; gap: 8px; }
.m-member-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #e8f0fe;
  color: #0071e3;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
}
.m-member-chip button { border: none; background: transparent; color: #0071e3; cursor: pointer; font-size: 14px; padding: 0; }
.m-add-member-btn {
  border: 1px dashed #0071e3;
  background: transparent;
  color: #0071e3;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
}

.m-pick-search { margin-bottom: 12px; }
.m-pick-list { display: flex; flex-direction: column; }
.m-pick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 1px solid #f2f3f5;
}
.m-pick-check {
  width: 20px; height: 20px;
  border: 2px solid #e5e6eb;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.m-pick-item:has(.m-pick-check svg) .m-pick-check { background: #e8f0fe; border-color: #0071e3; }
.m-pick-avatar {
  width: 36px; height: 36px;
  background: #0071e3;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}
.m-pick-info { flex: 1; }
.m-pick-name { font-size: 14px; font-weight: 600; color: #1d2129; }
.m-pick-sub { font-size: 12px; color: #86909c; }

.m-btn-primary {
  width: 100%;
  height: 48px;
  background: #0071e3;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
}
.m-btn-primary:disabled { background: #a0cfff; cursor: not-allowed; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
