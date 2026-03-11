<template>
  <div class="login-page">
    <!-- Left brand panel -->
    <div class="brand-panel">
      <div class="brand-content">
        <div class="brand-logo">
          <span class="brand-icon">数</span>
        </div>
        <h1 class="brand-title">数字游牧</h1>
        <p class="brand-subtitle">欧式极简交互，企业级业务与财务协同中枢</p>

        <ul class="feature-list">
          <li class="feature-item">
            <el-icon class="feature-icon"><CircleCheckFilled /></el-icon>
            <span class="feature-text">智能体工作流</span>
            <el-tag size="small" class="badge-live">已上线</el-tag>
          </li>
          <li class="feature-item">
            <el-icon class="feature-icon"><CircleCheckFilled /></el-icon>
            <span class="feature-text">多渠道订单中台</span>
            <el-tag size="small" class="badge-live">已上线</el-tag>
          </li>
          <li class="feature-item">
            <el-icon class="feature-icon"><CircleCheckFilled /></el-icon>
            <span class="feature-text">审核反审核可追溯</span>
            <el-tag size="small" class="badge-live">已上线</el-tag>
          </li>
          <li class="feature-item">
            <el-icon class="feature-icon"><CircleCheckFilled /></el-icon>
            <span class="feature-text">财务凭证自动生成</span>
            <el-tag size="small" class="badge-live">已上线</el-tag>
          </li>
          <li class="feature-item">
            <el-icon class="feature-icon"><Clock /></el-icon>
            <span class="feature-text">供应链协同门户</span>
            <el-tag size="small" class="badge-plan">规划中</el-tag>
          </li>
          <li class="feature-item">
            <el-icon class="feature-icon"><Clock /></el-icon>
            <span class="feature-text">BI 数据大屏</span>
            <el-tag size="small" class="badge-plan">规划中</el-tag>
          </li>
        </ul>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="form-panel">
      <div class="form-card">
        <div class="form-header">
          <h2 class="form-title">{{ activeTab === 'login' ? '欢迎回来' : '创建账户' }}</h2>
          <p class="form-subtitle">{{ activeTab === 'login' ? '登录数字游牧 ERP 系统' : '注册新的企业账户' }}</p>
        </div>

        <!-- Tab switcher -->
        <div class="tab-switcher">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'login' }"
            @click="switchTab('login')"
          >登录</button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'register' }"
            @click="switchTab('register')"
          >注册</button>
        </div>

        <!-- Login form -->
        <el-form
          v-if="activeTab === 'login'"
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          size="large"
          label-position="top"
          @keydown.enter="handleLogin"
        >
          <el-form-item label="账号" prop="account">
            <el-input
              v-model="loginForm.account"
              placeholder="请输入账号"
              prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            :loading="loginLoading"
            class="submit-btn"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form>

        <!-- Register form -->
        <el-form
          v-else
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          size="large"
          label-position="top"
        >
          <el-form-item label="企业名称" prop="company_name">
            <el-input
              v-model="registerForm.company_name"
              placeholder="请输入企业名称"
              prefix-icon="OfficeBuilding"
              clearable
            />
          </el-form-item>

          <el-form-item label="联系人手机号" prop="mobile">
            <el-input
              v-model="registerForm.mobile"
              placeholder="请输入手机号"
              prefix-icon="Phone"
              clearable
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请设置密码"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-alert
            v-if="registerTip"
            :title="registerTip"
            :type="registerTipType"
            :closable="false"
            show-icon
            class="register-tip"
          />

          <el-button
            type="primary"
            size="large"
            :loading="registerLoading"
            class="submit-btn"
            @click="handleRegister"
          >
            注 册
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, Clock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import http from '@/api/http'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Tab state
const activeTab = ref<'login' | 'register'>('login')

function switchTab(tab: 'login' | 'register') {
  activeTab.value = tab
  registerTip.value = ''
  registerTipType.value = 'info'
}

// ─── Login ───────────────────────────────────────────────────────────────────

const loginFormRef = ref<FormInstance>()
const loginLoading = ref(false)

const loginForm = reactive({
  account: '',
  password: '',
})

const loginRules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!loginFormRef.value) return
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  loginLoading.value = true
  try {
    await authStore.login(loginForm.account, loginForm.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch {
    // Error already shown by http interceptor
  } finally {
    loginLoading.value = false
  }
}

// ─── Register ────────────────────────────────────────────────────────────────

const registerFormRef = ref<FormInstance>()
const registerLoading = ref(false)
const registerTip = ref('')
const registerTipType = ref<'success' | 'error' | 'info'>('info')

const registerForm = reactive({
  company_name: '',
  mobile: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  company_name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

async function handleRegister() {
  if (!registerFormRef.value) return
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return

  registerLoading.value = true
  registerTip.value = ''
  try {
    await http.post('/admin/Admin/register', {
      company_name: registerForm.company_name,
      mobile: registerForm.mobile,
      password: registerForm.password,
    })
    registerTip.value = '注册成功，请登录'
    registerTipType.value = 'success'
    // Switch to login after short delay
    setTimeout(() => {
      switchTab('login')
      loginForm.account = registerForm.mobile
    }, 1500)
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg.includes('未开通') || msg.includes('自助注册')) {
      registerTip.value = '当前环境未开通自助注册，请联系管理员开通'
    } else if (msg) {
      registerTip.value = msg
    } else {
      registerTip.value = '当前环境未开通自助注册，请联系管理员开通'
    }
    registerTipType.value = 'error'
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
}

/* ── Left brand panel ── */
.brand-panel {
  flex: 1;
  background: linear-gradient(145deg, #0f1724 0%, #1a2540 60%, #1e3a5f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 48px;
  position: relative;
  overflow: hidden;
}

.brand-panel::before {
  content: '';
  position: absolute;
  top: -200px;
  right: -200px;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(22, 93, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.brand-panel::after {
  content: '';
  position: absolute;
  bottom: -150px;
  left: -150px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(22, 93, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.brand-content {
  max-width: 420px;
  position: relative;
  z-index: 1;
}

.brand-logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #165dff, #4080ff);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.4);
}

.brand-icon {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.brand-title {
  font-size: 36px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 12px;
  letter-spacing: 2px;
}

.brand-subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.65);
  margin: 0 0 40px;
  line-height: 1.6;
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.feature-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.feature-item:nth-child(-n+4) .feature-icon {
  color: #4ade80;
}

.feature-item:nth-child(n+5) .feature-icon {
  color: rgba(255, 255, 255, 0.35);
}

.feature-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  flex: 1;
}

.badge-live {
  background: rgba(74, 222, 128, 0.15) !important;
  border-color: rgba(74, 222, 128, 0.4) !important;
  color: #4ade80 !important;
  font-size: 11px !important;
}

.badge-plan {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.45) !important;
  font-size: 11px !important;
}

/* ── Right form panel ── */
.form-panel {
  width: 480px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}

.form-card {
  width: 100%;
  background: #ffffff;
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.08);
}

.form-header {
  margin-bottom: 28px;
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 6px;
}

.form-subtitle {
  font-size: 13px;
  color: #86909c;
  margin: 0;
}

/* ── Tab switcher ── */
.tab-switcher {
  display: flex;
  background: #f2f3f5;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 28px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #86909c;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: #165dff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-btn:hover:not(.active) {
  color: #4e5969;
}

/* ── Submit button ── */
.submit-btn {
  width: 100%;
  margin-top: 8px;
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  letter-spacing: 2px;
}

/* ── Register tip alert ── */
.register-tip {
  margin-bottom: 16px;
  border-radius: 8px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }

  .brand-panel {
    padding: 40px 24px;
    min-height: 280px;
    flex: none;
  }

  .brand-title {
    font-size: 28px;
  }

  .form-panel {
    width: 100%;
    padding: 32px 20px;
  }

  .form-card {
    padding: 28px 24px;
  }
}
</style>
