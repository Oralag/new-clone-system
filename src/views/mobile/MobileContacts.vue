<template>
  <div class="m-contacts">
    <!-- 搜索栏 -->
    <div class="m-search-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input v-model="keyword" class="m-search-input" placeholder="搜索成员或部门..." @input="onSearch" />
      <button v-if="keyword" class="m-search-clear" @click="keyword = ''">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- 在线成员 -->
    <div v-if="!keyword && onlineMembers.length > 0" class="m-section">
      <div class="m-section-label">
        <span class="m-online-dot" />在线成员 · {{ onlineMembers.length }}
      </div>
      <div class="m-online-scroll">
        <div v-for="m in onlineMembers" :key="m.id" class="m-online-item" @click="openMember(m)">
          <div class="m-online-avatar">{{ m.name?.[0] || '?' }}</div>
          <div class="m-online-name">{{ m.name }}</div>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="keyword && searchResults.length > 0" class="m-section">
      <div class="m-section-label">搜索结果 · {{ searchResults.length }}</div>
      <div class="m-member-list">
        <div v-for="m in searchResults" :key="m.id" class="m-member-item" @click="openMember(m)">
          <div class="m-member-avatar">{{ m.name?.[0] || '?' }}</div>
          <div class="m-member-info">
            <div class="m-member-name">{{ m.name }}</div>
            <div class="m-member-sub">{{ m.dept || m.position || '成员' }}</div>
          </div>
          <div class="m-member-arrow">›</div>
        </div>
      </div>
    </div>

    <!-- 部门列表（无搜索时） -->
    <div v-if="!keyword">
      <!-- 主账户显示全部组织架构 -->
      <div v-for="dept in filteredDepts" :key="dept.id" class="m-dept-block">
        <div class="m-dept-header" @click="toggleDept(dept.id)">
          <div class="m-dept-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <span class="m-dept-name">{{ dept.name }}</span>
            <span class="m-dept-count">{{ dept.members?.length || 0 }}</span>
          </div>
          <svg class="m-dept-arrow" :class="{ open: expandedDepts.has(dept.id) }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <div v-if="expandedDepts.has(dept.id)" class="m-member-list">
          <div v-for="m in dept.members" :key="m.id" class="m-member-item" @click="openMember(m)">
            <div class="m-member-avatar-wrap">
              <div class="m-member-avatar">{{ m.name?.[0] || '?' }}</div>
              <div v-if="isOnline(m)" class="m-member-online-dot" />
            </div>
            <div class="m-member-info">
              <div class="m-member-name">{{ m.name }}</div>
              <div class="m-member-sub">{{ m.position || m.role || '成员' }}</div>
            </div>
            <div class="m-member-actions">
              <button class="m-member-action-btn" @click.stop="callMember(m)" title="拨打电话">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b42a" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </button>
              <button class="m-member-action-btn" @click.stop="chatMember(m)" title="发消息">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="!dept.members?.length" class="m-dept-empty">暂无成员</div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredDepts.length === 0" class="m-empty">
        <div class="m-empty-icon">👥</div>
        <div class="m-empty-text">暂无成员</div>
      </div>
    </div>

    <!-- 成员详情弹窗 -->
    <div v-if="showMemberDetail" class="m-modal-mask" @click.self="showMemberDetail = false">
      <div class="m-member-detail-sheet">
        <div class="m-detail-header">
          <div class="m-detail-avatar">{{ selectedMember?.name?.[0] || '?' }}</div>
          <div class="m-detail-name">{{ selectedMember?.name }}</div>
          <div class="m-detail-sub">{{ selectedMember?.position || selectedMember?.role || '成员' }}</div>
          <div class="m-detail-online-status" :class="{ online: isOnline(selectedMember) }">
            {{ isOnline(selectedMember) ? '在线' : '离线' }}
          </div>
        </div>
        <div class="m-detail-info">
          <div v-if="selectedMember?.phone" class="m-detail-info-row">
            <span class="m-detail-info-label">手机</span>
            <span class="m-detail-info-value">{{ selectedMember.phone }}</span>
          </div>
          <div v-if="selectedMember?.dept" class="m-detail-info-row">
            <span class="m-detail-info-label">部门</span>
            <span class="m-detail-info-value">{{ selectedMember.dept }}</span>
          </div>
          <div v-if="selectedMember?.account" class="m-detail-info-row">
            <span class="m-detail-info-label">账号</span>
            <span class="m-detail-info-value">{{ selectedMember.account }}</span>
          </div>
        </div>
        <!-- 今日动态 -->
        <div class="m-detail-activity">
          <div class="m-detail-activity-title">今日动态</div>
          <div v-if="memberActivities.length === 0" class="m-detail-activity-empty">今日无操作记录</div>
          <div v-else class="m-detail-activity-list">
            <div v-for="a in memberActivities" :key="a.id" class="m-detail-activity-item">
              <span class="m-detail-activity-name">{{ a.action_name }}</span>
              <span class="m-detail-activity-time">{{ formatTime(a.created_at) }}</span>
            </div>
          </div>
        </div>
        <div class="m-detail-actions">
          <button class="m-detail-action-btn m-detail-call" @click="callMember(selectedMember)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            拨打电话
          </button>
          <button class="m-detail-action-btn m-detail-chat" @click="chatMember(selectedMember)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            发消息
          </button>
        </div>
        <button class="m-detail-close" @click="showMemberDetail = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'

const router = useRouter()

const keyword = ref('')
const departments = ref<any[]>([])
const expandedDepts = ref(new Set<number>())
const allMembers = ref<any[]>([])
const onlineMemberIds = ref(new Set<number>())
const showMemberDetail = ref(false)
const selectedMember = ref<any>(null)
const memberActivities = ref<any[]>([])

const searchResults = computed(() => {
  if (!keyword.value) return []
  const q = keyword.value.toLowerCase()
  return allMembers.value.filter((m: any) =>
    m.name?.toLowerCase().includes(q) ||
    m.dept?.toLowerCase().includes(q) ||
    m.account?.toLowerCase().includes(q)
  )
})

const filteredDepts = computed(() => {
  return departments.value
})

function toggleDept(id: number) {
  if (expandedDepts.value.has(id)) {
    expandedDepts.value.delete(id)
  } else {
    expandedDepts.value.add(id)
  }
}

function onSearch() { /* computed handles it */ }

function isOnline(m: any) {
  return onlineMemberIds.value.has(m.id)
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function openMember(m: any) {
  selectedMember.value = m
  showMemberDetail.value = true
  loadMemberActivity(m.id)
}

async function loadMemberActivity(memberId: number) {
  try {
    const res = await http.get('/mobile/operation-logs', { params: { user_id: memberId, list_rows: 10 } })
    memberActivities.value = res?.data?.rows ?? res?.rows ?? []
  } catch {
    memberActivities.value = []
  }
}

function callMember(m: any) {
  if (m.phone) {
    window.location.href = `tel:${m.phone}`
  }
}

function chatMember(m: any) {
  showMemberDetail.value = false
  // 跳转到与该成员的私聊
  router.push(`/mobile/chat/dm/${m.id}`)
}

const onlineMembers = computed(() => {
  return allMembers.value.filter((m: any) => isOnline(m)).slice(0, 10)
})

onMounted(async () => {
  // 加载成员列表（复用现有账号 API）
  try {
    const res = await http.get('/admin/Admin/index', { params: { list_rows: 200 } })
    const users = res?.data?.rows ?? res?.rows ?? []
    allMembers.value = users

    // 尝试加载在线状态
    try {
      const statusRes = await http.get('/mobile/online-status')
      const statuses = statusRes?.data ?? []
      onlineMemberIds.value = new Set(statuses.map((s: any) => s.user_id))
    } catch { /* 忽略 */ }

    // 尝试从部门 API 获取组织架构
    try {
      const deptRes = await http.get('/admin/dept')
      const depts = deptRes?.data ?? deptRes ?? []
      departments.value = depts.map((d: any) => ({
        ...d,
        members: users.filter((u: any) => u.dept_id === d.id || u.department === d.name)
      }))
      // 全部展开第一个部门
      if (departments.value.length > 0) {
        expandedDepts.value.add(departments.value[0].id)
      }
    } catch {
      // 兜底：按角色分组
      const roleGroups = groupByRole(users)
      departments.value = roleGroups
      if (roleGroups.length > 0) {
        expandedDepts.value.add(roleGroups[0].id)
      }
    }
  } catch (e) {
    console.error('Failed to load contacts', e)
  }
})

function groupByRole(users: any[]) {
  const map = new Map<string, any[]>()
  users.forEach(u => {
    const role = u.is_admin === 1 ? '管理员' : (u.position || '员工')
    if (!map.has(role)) map.set(role, [])
    map.get(role)!.push(u)
  })
  let id = 1
  return Array.from(map.entries()).map(([name, members]) => ({
    id: id++,
    name,
    members,
  }))
}
</script>

<style scoped>
.m-contacts {
  min-height: 100%;
  background: #f5f5f7;
  padding-bottom: 80px;
}

/* ── 搜索栏 ── */
.m-search-bar {
  background: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid #f2f3f5;
  position: sticky;
  top: 0;
  z-index: 5;
}
.m-search-input {
  flex: 1;
  border: none;
  background: #f5f5f7;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 14px;
  color: #1d2129;
  outline: none;
}
.m-search-clear { border: none; background: transparent; cursor: pointer; padding: 2px; display: flex; }

/* ── 通用区块 ── */
.m-section { padding: 12px 0 4px; }
.m-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #86909c;
  padding: 0 16px;
  margin-bottom: 8px;
}
.m-online-dot {
  width: 6px; height: 6px;
  background: #00b42a;
  border-radius: 50%;
}
.m-online-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 0 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.m-online-scroll::-webkit-scrollbar { display: none; }
.m-online-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  cursor: pointer;
}
.m-online-avatar {
  width: 44px; height: 44px;
  background: linear-gradient(135deg, #0071e3, #005bb5);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}
.m-online-name { font-size: 11px; color: #4e5969; font-weight: 500; white-space: nowrap; }

/* ── 部门 ── */
.m-dept-block { margin-bottom: 4px; }
.m-dept-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-dept-header:active { background: #f5f5f7; }
.m-dept-left { display: flex; align-items: center; gap: 8px; }
.m-dept-name { font-size: 14px; font-weight: 600; color: #1d2129; }
.m-dept-count {
  font-size: 11px;
  color: #86909c;
  background: #f2f3f5;
  padding: 1px 7px;
  border-radius: 999px;
}
.m-dept-arrow { transition: transform 0.2s; }
.m-dept-arrow.open { transform: rotate(180deg); }
.m-member-list { background: #fff; }
.m-member-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-bottom: 1px solid #f7f8fa;
}
.m-member-item:last-child { border-bottom: none; }
.m-member-item:active { background: #f5f5f7; }
.m-member-avatar-wrap { position: relative; flex-shrink: 0; }
.m-member-avatar {
  width: 40px; height: 40px;
  background: linear-gradient(135deg, #0071e3, #005bb5);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}
.m-member-online-dot {
  position: absolute;
  bottom: 0; right: 0;
  width: 10px; height: 10px;
  background: #00b42a;
  border: 2px solid #fff;
  border-radius: 50%;
}
.m-member-info { flex: 1; min-width: 0; }
.m-member-name { font-size: 14px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-member-sub { font-size: 12px; color: #86909c; margin-top: 2px; }
.m-member-arrow { font-size: 20px; color: #c2c8d5; flex-shrink: 0; }
.m-member-actions { display: flex; gap: 4px; }
.m-member-action-btn {
  width: 30px; height: 30px;
  border: none;
  background: #f5f5f7;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-dept-empty { text-align: center; padding: 16px; font-size: 13px; color: #86909c; }

/* ── 成员详情弹窗 ── */
.m-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 500;
  display: flex;
  align-items: flex-end;
}
.m-member-detail-sheet {
  background: #fff;
  border-radius: 20px 20px 0 0;
  width: 100%;
  animation: slideUp 0.25s ease;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.m-detail-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px 16px;
  background: linear-gradient(135deg, #0071e3, #005bb5);
  border-radius: 20px 20px 0 0;
}
.m-detail-avatar {
  width: 72px; height: 72px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
}
.m-detail-name { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.m-detail-sub { font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 8px; }
.m-detail-online-status {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.8);
}
.m-detail-online-status.online { background: rgba(0,180,42,0.3); color: #fff; }

.m-detail-info { padding: 16px; border-bottom: 1px solid #f2f3f5; }
.m-detail-info-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f7f8fa; }
.m-detail-info-row:last-child { border-bottom: none; }
.m-detail-info-label { font-size: 13px; color: #86909c; width: 50px; flex-shrink: 0; }
.m-detail-info-value { font-size: 14px; color: #1d2129; font-weight: 500; }

.m-detail-activity { padding: 12px 16px; }
.m-detail-activity-title { font-size: 13px; font-weight: 700; color: #1d2129; margin-bottom: 8px; }
.m-detail-activity-empty { font-size: 13px; color: #86909c; text-align: center; padding: 12px; }
.m-detail-activity-list { display: flex; flex-direction: column; gap: 6px; }
.m-detail-activity-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #4e5969; }
.m-detail-activity-name { font-weight: 500; }
.m-detail-activity-time { color: #86909c; font-size: 12px; }

.m-detail-actions { display: flex; gap: 12px; padding: 0 16px 12px; }
.m-detail-action-btn {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}
.m-detail-call { background: #00b42a; color: #fff; }
.m-detail-chat { background: #0071e3; color: #fff; }
.m-detail-close {
  display: block;
  width: calc(100% - 32px);
  margin: 0 16px 16px;
  height: 48px;
  background: #f5f5f7;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #4e5969;
  cursor: pointer;
}
.m-detail-close:active { background: #e8e8ea; }

/* ── 空状态 ── */
.m-empty { text-align: center; padding: 60px 0; }
.m-empty-icon { font-size: 48px; margin-bottom: 12px; }
.m-empty-text { font-size: 14px; color: #86909c; }

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>
