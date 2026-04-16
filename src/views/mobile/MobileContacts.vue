<template>
  <div class="contacts-page">
    <!-- 顶部栏：企业微信风格 -->
    <div class="wx-nav-bar">
      <div class="wx-nav-left">
        <div class="wx-nav-search" @click="showSearch = !showSearch">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span>搜索</span>
        </div>
      </div>
      <div class="wx-nav-title">通讯录</div>
      <div class="wx-nav-right">
        <button class="wx-nav-btn" @click="showNewGroup = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜索展开 -->
    <div v-if="showSearch" class="contacts-search">
      <div class="contacts-search-inner">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input v-model="keyword" class="contacts-search-input" placeholder="搜索联系人" @input="doFilter" />
      </div>
    </div>

    <!-- 分组列表（企业微信风格：字母索引） -->
    <div class="contacts-body">
      <!-- 部门架构入口 -->
      
      <!-- 机器人分类 -->
      <div class="contacts-robot-section">
        <div class="contacts-robot-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#722ED1" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/><path d="M12 2v6"/></svg>
          机器人
        </div>
        <div
          v-for="bot in robotAgents"
          :key="bot.id"
          class="contacts-item"
          @click="router.push(bot.route)"
        >
          <div class="contacts-avatar" :style="{ background: bot.color }">{{ bot.avatar }}</div>
          <div class="contacts-info">
            <div class="contacts-name-row">
              <span class="contacts-name">{{ bot.name }}</span>
            </div>
            <div class="contacts-dept">{{ bot.desc }}</div>
          </div>
          <span class="contacts-arrow">›</span>
        </div>
      </div>

<div class="contacts-dept-entry" @click="router.push('/mobile/contacts/dept')">
        <div class="contacts-dept-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div class="contacts-dept-info">
          <span class="contacts-dept-name">组织架构</span>
          <span class="contacts-dept-sub">查看全部部门和员工</span>
        </div>
        <span class="contacts-arrow">›</span>
      </div>

      <!-- 通讯录列表（子账户/员工） -->
    <div v-if="filteredEmployees.length === 0 && !keyword" class="contacts-empty">
      <div class="contacts-empty-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      </div>
      <div class="contacts-empty-text">暂无子账户</div>
    </div>

    <div
      v-for="c in filteredEmployees"
      :key="c.id"
      class="contacts-item"
      @click="viewEmployee(c)"
    >
      <div class="contacts-avatar">{{ c.name?.[0] || '?' }}</div>
      <div class="contacts-info">
        <div class="contacts-name">{{ c.name }}</div>
        <div class="contacts-sub" v-if="c.role_name || c.dept_name">
          {{ c.role_name || '' }}{{ c.role_name && c.dept_name ? ' · ' : '' }}{{ c.dept_name || '' }}
        </div>
        </div>
        <span class="contacts-arrow">›</span>
      </div>
    </div>

    <!-- 侧边字母索引（企业微信风格） -->
    <div class="contacts-index">
      <div
        v-for="letter in letters"
        :key="letter"
        class="contacts-index-item"
        :class="{ active: activeLetter === letter }"
        @touchstart.prevent="scrollToLetter(letter)"
        @click="scrollToLetter(letter)"
      >{{ letter === '#' ? ' ' : letter }}</div>
    </div>

    <!-- 新建群聊弹窗 -->
    <div v-if="showNewGroup" class="chat-new-mask" @click.self="showNewGroup = false">
      <div class="chat-new-sheet">
        <div class="chat-new-header">
          <span>发起群聊</span>
          <button @click="showNewGroup = false">取消</button>
        </div>
        <div class="chat-new-body">
          <div class="chat-new-item" @click="createGroup">
            <div class="chat-new-icon" style="background:#2E6BE6;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="chat-new-info">
              <div class="chat-new-title">选择成员创建群聊</div>
              <div class="chat-new-sub">邀请通讯录成员加入</div>
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
import { getAdminList } from '@/api/setting'
import http from '@/api/http'

const router = useRouter()
const keyword = ref('')
const employees = ref<any[]>([])
const groups = ref<any[]>([])
const showSearch = ref(false)
const showNewGroup = ref(false)
const activeLetter = ref('')
const letters = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const filteredEmployees = computed(() => {
  const kw = keyword.value.toLowerCase().trim()
  if (!kw) return employees.value
  return employees.value.filter((c: any) =>
    (c.name || '').toLowerCase().includes(kw) ||
    (c.phone || '').includes(kw)
  )
})

function viewEmployee(c: any) {
  // 发起私聊：查找或创建与该联系人的 1:1 会话
  const existing = groups.value.find((g: any) => g.member_ids?.includes(c.id))
  if (existing) {
    router.push(`/mobile/chat/${existing.id}`)
  } else {
    router.push(`/mobile/chat/new?userId=${c.id}&name=${encodeURIComponent(c.name || '')}`)
  }
}

function viewCustomer() {
  router.push('/mobile/sale/client')
}

function createGroup() {
  showNewGroup.value = false
  router.push('/mobile/meeting')
}

async function loadEmployees() {
  try {
    const res = await getAdminList({ list_rows: 500 })
    const rows = res?.data?.rows ?? res?.rows ?? []
    employees.value = rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.admin_name || '未知用户',
      phone: r.phone || '',
      role_name: r.role_name || '',
      dept_name: r.dept_name || '',
      letter: (r.name || r.admin_name || '#')[0].toUpperCase(),
    })).sort((a, b) => (a.letter || '#').localeCompare(b.letter || '#'))
  } catch { employees.value = [] }
}

function scrollToLetter(letter: string) {
  activeLetter.value = letter
  const kw = letter === '#' ? '' : letter
  if (!kw) {
    document.querySelector('.contacts-body')?.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const items = document.querySelectorAll('.contacts-item')
  for (const item of items) {
    const name = item.querySelector('.contacts-name')?.textContent?.[0]?.toUpperCase()
    if (name === kw) {
      item.scrollIntoView({ behavior: 'smooth', block: 'start' })
      break
    }
  }
}

onMounted(async () => {
  loadEmployees()
  const res = await http.get('/chat/groups', { params: { list_rows: 200 } })
  groups.value = res?.data?.rows ?? res?.rows ?? []
})
</script>

<script lang="ts">
export default { name: 'MobileContacts' }
</script>

<style scoped>
.contacts-page {
  min-height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ── 搜索栏 ── */
.contacts-search {
  background: #fafafa;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 5;
}
.contacts-search-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ededed;
  border-radius: 6px;
  padding: 6px 10px;
}
.contacts-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  outline: none;
}
.contacts-search-input::placeholder { color: #999; }

/* ── 部门入口 ── */
.contacts-dept-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  -webkit-tap-highlight-color: transparent;
  background: #fafafa;
}
.contacts-dept-entry:active { background: #f0f0f0; }
.contacts-dept-icon {
  width: 40px;
  height: 40px;
  background: rgba(46,107,230,0.08);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.contacts-dept-info { flex: 1; }
.contacts-dept-name { font-size: 15px; font-weight: 600; color: #1d2129; display: block; }
.contacts-dept-sub { font-size: 12px; color: #999; }

/* ── 客户列表 ── */
.contacts-body { flex: 1; }
.contacts-empty { text-align: center; padding: 40px 0; }
.contacts-empty-icon { margin-bottom: 8px; }
.contacts-empty-text { font-size: 13px; color: #999; }

.contacts-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.contacts-item:last-child { border-bottom: none; }
.contacts-item:active { background: #f5f5f5; }

.contacts-avatar {
  width: 44px;
  height: 44px;
  background: #2E6BE6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.contacts-info { flex: 1; min-width: 0; }
.contacts-name { font-size: 15px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.contacts-sub { font-size: 12px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.contacts-arrow { font-size: 18px; color: #ccc; flex-shrink: 0; }

/* ── 侧边字母索引 ── */
.contacts-index {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  z-index: 10;
  padding: 8px 3px;
  background: rgba(0,0,0,0.03);
  border-radius: 4px 0 0 4px;
}
.contacts-index-item {
  font-size: 10px;
  font-weight: 600;
  color: #2E6BE6;
  width: 16px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-radius: 2px;
  transition: background 0.1s;
  user-select: none;
}
.contacts-index-item:active,
.contacts-index-item.active { background: #2E6BE6; color: #fff; }

/* ── 企业微信风格导航栏（复用 chat 样式） ── */
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

/* ── 新建群聊弹窗（复用 chat 样式） ── */
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

/* ── 机器人分类 ── */
.contacts-robot-section {
  margin-top: 8px;
}
.contacts-robot-title {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  font-size: 12px;
  color: #722ED1;
  font-weight: 600;
  background: #f9f0ff;
}
.contacts-item .contacts-avatar {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.contacts-name-row {
  display: flex;
  align-items: center;
  gap: 4px;
}