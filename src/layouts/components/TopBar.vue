<template>
  <div class="top-bar">
    <div class="breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>{{ currentTopMenu?.title }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ route.meta?.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="top-actions">
      <!-- 当前账号名称 -->
      <span class="account-label">{{ isSuperAdmin ? '管理员' : authStore.userName }}</span>

      <!-- 返回选择模块 -->
      <el-tooltip content="选择模块" placement="bottom">
        <button class="action-btn" @click="router.push('/portal')">
          <el-icon :size="17"><Grid /></el-icon>
        </button>
      </el-tooltip>

      <!-- 品牌中心预览 -->
      <el-tooltip content="品牌中心" placement="bottom">
        <button class="action-btn action-btn-brand" @click="router.push('/brand?from=erp')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </button>
      </el-tooltip>

      <!-- 主题切换 -->
      <el-tooltip content="亮色" placement="bottom">
        <button class="action-btn" :class="{ active: appStore.theme === 'light' }" @click="appStore.setTheme('light')">
          <el-icon :size="16"><Sunny /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="暗黑" placement="bottom">
        <button class="action-btn" :class="{ active: appStore.theme === 'dark' }" @click="appStore.setTheme('dark')">
          <el-icon :size="16"><Moon /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="护眼" placement="bottom">
        <button class="action-btn" :class="{ active: appStore.theme === 'eye' }" @click="appStore.setTheme('eye')">
          <el-icon :size="16"><View /></el-icon>
        </button>
      </el-tooltip>

      <el-tooltip content="消息通知" placement="bottom">
        <el-popover placement="bottom-end" :width="360" trigger="click" v-model:visible="notifVisible">
          <template #reference>
            <button class="action-btn notif-btn" @click="openNotifications">
              <el-icon :size="18"><Bell /></el-icon>
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>
          </template>
          <div class="notif-panel">
            <div class="notif-header">
              <span class="notif-title">智能体通知</span>
              <el-button v-if="notifications.length > 0" link size="small" @click="notifications = []">清空</el-button>
            </div>
            <div v-if="notifications.length === 0" class="notif-empty">暂无新通知</div>
            <div v-else class="notif-list">
              <div v-for="n in notifications" :key="n.id" class="notif-item">
                <div class="notif-item-header">
                  <span class="notif-tag" :class="n.type">{{ { morning: '早报', noon: '午检', evening: '晚结' }[n.type] }}</span>
                  <span class="notif-time">{{ n.time }}</span>
                </div>
                <div class="notif-item-title">{{ n.title }}</div>
                <div class="notif-item-content">{{ n.content }}</div>
              </div>
            </div>
          </div>
        </el-popover>
      </el-tooltip>

      <el-dropdown trigger="click" @command="handleUserCmd">
        <div class="user-info">
          <el-avatar :size="28" :src="authStore.avatar" class="avatar">
            {{ authStore.userName.charAt(0) }}
          </el-avatar>
          <span class="user-name">{{ appStore.companyName || authStore.userName }}</span>
          <el-icon class="arrow-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人资料</el-dropdown-item>
            <el-dropdown-item command="password">修改密码</el-dropdown-item>
            <el-dropdown-item v-if="isSuperAdmin" command="admin-console">🏢 租户管理控制台</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 个人资料弹框 -->
    <el-dialog v-model="profileVisible" title="个人资料" width="400px" append-to-body>
      <el-form :model="profileForm" label-width="80px">
        <el-form-item label="账号">
          <el-input :value="authStore.userInfo?.account" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="profileForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="profileForm.mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="profileVisible = false">取消</el-button>
        <el-button type="primary" :loading="profileSaving" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹框 -->
    <el-dialog v-model="pwdVisible" title="修改密码" width="400px" append-to-body>
      <el-form :model="pwdForm" label-width="90px">
        <el-form-item label="当前密码">
          <el-input v-model="pwdForm.old_password" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.new_password" type="password" show-password placeholder="至少6位" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="pwdForm.confirm_password" type="password" show-password placeholder="再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSaving" @click="savePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Bell, ArrowDown, Sunny, Moon, View, Grid } from '@element-plus/icons-vue'
import { menuData } from './menuData'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { updateAdmin, getCompanyInfo } from '@/api/setting'
import http from '@/api/http'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// ── 实时时钟 ──────────────────────────────────────────────────────────────────
const clockStr = ref('')
let clockTimer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  clockStr.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} 星期${weekDays[now.getDay()]} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}
updateClock()
clockTimer = setInterval(updateClock, 1000)

// 挂载时加载企业名（若 store 尚未有值）
onMounted(async () => {
  if (!appStore.companyName) {
    try {
      const res: any = await getCompanyInfo()
      const name = (res.data ?? res)?.name
      if (name) appStore.setCompanyName(name)
    } catch { /* 静默失败，不影响页面 */ }
  }
  // 每5分钟拉一次通知（检测是否有早中晚推送）
  await fetchNotifications()
  notifTimer = setInterval(fetchNotifications, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (notifTimer) clearInterval(notifTimer)
})

// ── 智能体通知 ────────────────────────────────────────────────────────────────
interface Notification { id: string; type: 'morning' | 'noon' | 'evening'; title: string; content: string; time: string }
const notifications = ref<Notification[]>([])
const notifVisible = ref(false)
const unreadCount = ref(0)
let notifTimer: ReturnType<typeof setInterval> | null = null

async function fetchNotifications() {
  try {
    const res = await fetch('/api/notifications', {
      headers: { 'x-erp-token': localStorage.getItem('erp_token') || '' }
    })
    if (!res.ok) return
    const { messages } = await res.json()
    if (messages?.length > 0) {
      notifications.value.unshift(...messages)
      if (notifications.value.length > 20) notifications.value.splice(20)
      unreadCount.value += messages.length
    }
  } catch { /* 静默失败 */ }
}

function openNotifications() {
  unreadCount.value = 0
  notifVisible.value = !notifVisible.value
}

const SUPER_ADMIN = '17747344571'
const isSuperAdmin = computed(() => {
  const acc = authStore.userInfo?.account || ''
  return acc === SUPER_ADMIN
})

const currentTopMenu = computed(() =>
  menuData.find((m) => m.key === appStore.activeTopMenu),
)

// ── 个人资料 ──────────────────────────────────────────────────────────────────
const profileVisible = ref(false)
const profileSaving = ref(false)
const profileForm = reactive({ name: '', mobile: '', email: '' })

function openProfile() {
  profileForm.name = authStore.userInfo?.name ?? ''
  profileForm.mobile = authStore.userInfo?.mobile ?? ''
  profileForm.email = authStore.userInfo?.email ?? ''
  profileVisible.value = true
}

async function saveProfile() {
  profileSaving.value = true
  try {
    const id = authStore.userInfo?.id
    await updateAdmin({ id, name: profileForm.name, mobile: profileForm.mobile, email: profileForm.email })
    if (authStore.userInfo) {
      authStore.userInfo.name = profileForm.name
      authStore.userInfo.mobile = profileForm.mobile
      authStore.userInfo.email = profileForm.email
      localStorage.setItem('erp_user_info', JSON.stringify(authStore.userInfo))
    }
    ElMessage.success('资料已更新')
    profileVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    profileSaving.value = false
  }
}

// ── 修改密码 ──────────────────────────────────────────────────────────────────
const pwdVisible = ref(false)
const pwdSaving = ref(false)
const pwdForm = reactive({ old_password: '', new_password: '', confirm_password: '' })

function openPassword() {
  pwdForm.old_password = ''
  pwdForm.new_password = ''
  pwdForm.confirm_password = ''
  pwdVisible.value = true
}

async function savePassword() {
  if (!pwdForm.old_password) { ElMessage.warning('请输入当前密码'); return }
  if (pwdForm.new_password.length < 6) { ElMessage.warning('新密码至少6位'); return }
  if (pwdForm.new_password !== pwdForm.confirm_password) { ElMessage.warning('两次输入的密码不一致'); return }
  pwdSaving.value = true
  try {
    await http.post('/auth/updatePassword', {
      old_password: pwdForm.old_password,
      new_password: pwdForm.new_password,
    })
    ElMessage.success('密码已修改，请重新登录')
    pwdVisible.value = false
    authStore.logout()
    router.push('/login')
  } catch (e: any) {
    ElMessage.error(e?.message ?? '修改失败')
  } finally {
    pwdSaving.value = false
  }
}

async function handleUserCmd(cmd: string) {
  if (cmd === 'profile') {
    openProfile()
  } else if (cmd === 'password') {
    openPassword()
  } else if (cmd === 'admin-console') {
    router.push('/admin-console')
  } else if (cmd === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.top-bar {
  height: 54px;
  background: var(--card-bg);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 50;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.breadcrumb {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

:deep(.el-breadcrumb__inner) {
  color: var(--dim) !important;
  font-weight: 500;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--dark) !important;
  font-weight: 600;
}

:deep(.el-breadcrumb__separator) {
  color: var(--faint) !important;
}

.top-clock {
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--dim);
  letter-spacing: 0.03em;
  user-select: none;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #666);
  margin-right: 2px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mid);
  transition: background 0.15s, color 0.15s;
}
.action-btn-brand { color: #7c3aed; }

.action-btn:hover {
  background: var(--gray);
  color: var(--dark);
}

.action-btn.active {
  background: var(--blue-light);
  color: var(--blue);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  padding: 5px 10px 5px 5px;
  border-radius: 20px;
  transition: background 0.15s;
}

.user-info:hover {
  background: var(--gray);
}

.avatar {
  background: #0071e3;
  color: #fff;
  font-weight: 600;
  font-size: 12px;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  letter-spacing: -0.01em;
}

.arrow-icon {
  font-size: 11px;
  color: var(--dim);
}

/* 通知按钮 */
.notif-btn { position: relative; }
.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: #EF4444;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  pointer-events: none;
}

/* 通知面板 */
.notif-panel { max-height: 480px; display: flex; flex-direction: column; }
.notif-header { display: flex; align-items: center; justify-content: space-between; padding: 0 0 10px 0; border-bottom: 1px solid var(--gray, #f0f0f0); margin-bottom: 10px; }
.notif-title { font-size: 14px; font-weight: 600; color: var(--dark, #1a1a1a); }
.notif-empty { text-align: center; color: var(--dim, #aaa); font-size: 13px; padding: 24px 0; }
.notif-list { overflow-y: auto; max-height: 400px; display: flex; flex-direction: column; gap: 12px; }
.notif-item { padding: 12px; border-radius: 8px; background: var(--gray, #f8f8f6); border: 1px solid #ebebeb; }
.notif-item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.notif-tag { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
.notif-tag.morning { background: #FEF3C7; color: #D97706; }
.notif-tag.noon { background: #DBEAFE; color: #2563EB; }
.notif-tag.evening { background: #EDE9FE; color: #7C3AED; }
.notif-time { font-size: 11px; color: var(--dim, #aaa); }
.notif-item-title { font-size: 12px; font-weight: 600; color: var(--dark, #1a1a1a); margin-bottom: 4px; }
.notif-item-content { font-size: 12px; color: var(--mid, #666); line-height: 1.6; white-space: pre-wrap; }
</style>
