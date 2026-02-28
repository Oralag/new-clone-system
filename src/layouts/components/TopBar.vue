<template>
  <div class="top-bar">
    <div class="breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>{{ currentTopMenu?.title }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ route.meta?.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="top-actions">
      <el-tooltip content="消息通知" placement="bottom">
        <el-button :icon="Bell" circle size="small" plain />
      </el-tooltip>

      <el-dropdown trigger="click" @command="handleUserCmd">
        <div class="user-info">
          <el-avatar :size="28" :src="authStore.avatar" class="avatar">
            {{ authStore.userName.charAt(0) }}
          </el-avatar>
          <span class="user-name">{{ authStore.userName }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人资料</el-dropdown-item>
            <el-dropdown-item command="password">修改密码</el-dropdown-item>
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
import { Bell, ArrowDown } from '@element-plus/icons-vue'
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
    // 更新本地缓存
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
  height: 50px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}

.breadcrumb { font-size: 13px; }

.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}
.user-info:hover { background: #f2f3f5; }

.avatar { background: #165dff; color: #fff; }
.user-name { font-size: 13px; color: #1d2129; }
</style>

