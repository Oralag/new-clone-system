<template>
  <div class="top-bar">
    <div class="breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>{{ currentTopMenuTitle }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ routeTitle }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="top-actions">
      <!-- 当前账号名称 -->
      <span class="account-label">{{ isSuperAdmin ? adminLabel : authStore.userName }}</span>

      <!-- 返回选择模块 -->
      <el-tooltip :content="t('route.Portal')" placement="bottom">
        <button class="action-btn" @click="router.push('/portal')">
          <el-icon :size="17"><Grid /></el-icon>
        </button>
      </el-tooltip>

      <!-- 品牌中心预览 -->
      <el-tooltip :content="t('layout.brandCenter')" placement="bottom">
        <button class="action-btn action-btn-brand" @click="router.push('/brand?from=erp')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        </button>
      </el-tooltip>

      <el-tooltip :content="t('layout.notifications')" placement="bottom">
        <el-popover placement="bottom-end" :width="360" trigger="click" v-model:visible="notifVisible">
          <template #reference>
            <button class="action-btn notif-btn" @click="openNotifications">
              <el-icon :size="18"><Bell /></el-icon>
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>
          </template>
          <div class="notif-panel">
            <div class="notif-header">
              <span class="notif-title">{{ t('layout.agentNotifications') }}</span>
              <el-button v-if="notifications.length > 0" link size="small" @click="notifications = []">{{ t('common.clear') }}</el-button>
            </div>
            <div v-if="notifications.length === 0" class="notif-empty">{{ t('layout.noNotifications') }}</div>
            <div v-else class="notif-list">
              <div v-for="n in notifications" :key="n.id" class="notif-item">
                <div class="notif-item-header">
                  <span class="notif-tag" :class="n.type">{{ notifTypeLabel(n.type) }}</span>
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
            <el-dropdown-item command="profile">{{ t('layout.profile') }}</el-dropdown-item>
            <el-dropdown-item command="password">{{ t('layout.changePassword') }}</el-dropdown-item>
            <el-dropdown-item v-if="isSuperAdmin" command="admin-console">🏢 {{ t('layout.tenantConsole') }}</el-dropdown-item>
            <el-dropdown-item divided command="logout">{{ t('layout.logout') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 个人资料弹框 -->
    <el-dialog v-model="profileVisible" :title="t('layout.profile')" width="400px" append-to-body>
      <el-form :model="profileForm" label-width="90px">
        <el-form-item :label="t('login.account')">
          <el-input :value="authStore.userInfo?.account" disabled />
        </el-form-item>
        <el-form-item :label="t('profile.name')">
          <el-input v-model="profileForm.name" :placeholder="t('profile.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('profile.mobile')">
          <el-input v-model="profileForm.mobile" :placeholder="t('profile.mobilePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('profile.email')">
          <el-input v-model="profileForm.email" :placeholder="t('profile.emailPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="profileVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="profileSaving" @click="saveProfile">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹框 -->
    <el-dialog v-model="pwdVisible" :title="t('layout.changePassword')" width="400px" append-to-body>
      <el-form :model="pwdForm" label-width="110px">
        <el-form-item :label="t('profile.oldPassword')">
          <el-input v-model="pwdForm.old_password" type="password" show-password :placeholder="t('profile.oldPasswordPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('profile.newPassword')">
          <el-input v-model="pwdForm.new_password" type="password" show-password :placeholder="t('profile.newPasswordPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('profile.confirmPassword')">
          <el-input v-model="pwdForm.confirm_password" type="password" show-password :placeholder="t('profile.confirmPasswordPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="pwdSaving" @click="savePassword">{{ t('profile.confirmChange') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Bell, ArrowDown, Grid } from '@element-plus/icons-vue'
import { menuData } from './menuData'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { updateAdmin, getCompanyInfo } from '@/api/setting'
import http from '@/api/http'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const adminLabel = computed(() => t('layout.admin'))
const currentTopMenuTitle = computed(() => {
  const m = menuData.find((m) => m.key === appStore.activeTopMenu)
  if (!m) return ''
  // menuData.title now stores i18n key like 'menu.group.dashboard'
  return m.title?.startsWith('menu.') ? t(m.title) : m.title
})
const routeTitle = computed(() => {
  const meta = route.meta as any
  if (meta?.titleKey) return t(meta.titleKey)
  const name = route.name as string | undefined
  if (name) {
    const key = `route.${name}`
    const v = t(key)
    if (v && v !== key) return v
  }
  return meta?.title ?? ''
})

function notifTypeLabel(type: 'morning' | 'noon' | 'evening') {
  const map = { morning: t('layout.notifMorning'), noon: t('layout.notifNoon'), evening: t('layout.notifEvening') }
  return map[type]
}

// ── 实时时钟 ──────────────────────────────────────────────────────────────────
const clockStr = ref('')
let clockTimer: ReturnType<typeof setInterval> | null = null

function updateClock() {
  const now = new Date()
  const clockLocale = locale.value === 'en-US' ? 'en-US' : 'zh-CN'
  clockStr.value = new Intl.DateTimeFormat(clockLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
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
    ElMessage.success(t('profile.updated'))
    profileVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('common.saveFailed'))
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
  if (!pwdForm.old_password) { ElMessage.warning(t('profile.oldPasswordRequired')); return }
  if (pwdForm.new_password.length < 6) { ElMessage.warning(t('profile.newPasswordTooShort')); return }
  if (pwdForm.new_password !== pwdForm.confirm_password) { ElMessage.warning(t('profile.passwordMismatch')); return }
  pwdSaving.value = true
  try {
    await http.post('/auth/updatePassword', {
      old_password: pwdForm.old_password,
      new_password: pwdForm.new_password,
    })
    ElMessage.success(t('profile.passwordChanged'))
    pwdVisible.value = false
    authStore.logout()
    router.push('/login')
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('common.failed'))
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
    await ElMessageBox.confirm(t('layout.confirmLogout'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
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

.lang-btn .lang-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
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
