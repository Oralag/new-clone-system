<template>
  <div class="top-bar">
    <div class="breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>{{ currentTopMenu?.title }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ route.meta?.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="top-actions">
      <!-- 返回选择模块 -->
      <el-tooltip content="选择模块" placement="bottom">
        <button class="action-btn" @click="router.push('/portal')">
          <el-icon :size="17"><Grid /></el-icon>
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
        <button class="action-btn">
          <el-icon :size="18"><Bell /></el-icon>
        </button>
      </el-tooltip>

      <el-dropdown trigger="click" @command="handleUserCmd">
        <div class="user-info">
          <el-avatar :size="28" :src="authStore.avatar" class="avatar">
            {{ authStore.userName.charAt(0) }}
          </el-avatar>
          <span class="user-name">{{ authStore.userName }}</span>
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
import { updateAdmin } from '@/api/setting'
import http from '@/api/http'

const appStore = useAppStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

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
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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
  color: rgba(29, 29, 31, 0.4) !important;
  font-weight: 500;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #1d1d1f !important;
  font-weight: 600;
}

:deep(.el-breadcrumb__separator) {
  color: rgba(29, 29, 31, 0.2) !important;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
  color: rgba(29, 29, 31, 0.4);
  transition: background 0.15s, color 0.15s;
}

.action-btn:hover {
  background: #f5f5f7;
  color: #1d1d1f;
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
  background: #f5f5f7;
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
  color: #1d1d1f;
  letter-spacing: -0.01em;
}

.arrow-icon {
  font-size: 11px;
  color: rgba(29, 29, 31, 0.3);
}
</style>
