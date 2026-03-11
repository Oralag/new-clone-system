<template>
  <div class="entry-page">
    <div class="grain" />

    <main class="entry-shell">
      <section class="brand-panel">
        <div class="brand-topline">Nomad ERP Cloud</div>
        <h1 class="brand-title">数字游牧 ERP</h1>
        <p class="brand-tagline">欧式极简交互，企业级业务与财务协同中枢</p>
        <p class="brand-copy">
          从传统进销存走向智能化运营：你已上线的智能体工作流模块可直接承接品牌策略、内容生产与执行流程，
          后续可平滑扩展到客服自动对接接单等业务引擎。
        </p>

        <div class="module-grid">
          <article class="module-card active">
            <div class="module-title">智能体工作流</div>
            <div class="module-meta">已上线</div>
            <p>品牌、热搜、文案、视频、发布一体化流程。</p>
          </article>
          <article class="module-card">
            <div class="module-title">客服自动对接接单</div>
            <div class="module-meta">规划中</div>
            <p>对话到订单自动流转，减少人工接单延迟。</p>
          </article>
          <article class="module-card">
            <div class="module-title">多渠道订单中台</div>
            <div class="module-meta">规划中</div>
            <p>统一汇总电商、私域、门店订单与履约状态。</p>
          </article>
        </div>

        <div class="advantage-list">
          <span>业务财务一体口径</span>
          <span>审核反审核可追溯</span>
          <span>云端开通按需付费</span>
        </div>
      </section>

      <section class="auth-panel">
        <div class="auth-card">
          <div class="mode-switch">
            <button :class="['mode-btn', { active: activeTab === 'login' }]" @click="switchTab('login')">登录</button>
            <button :class="['mode-btn', { active: activeTab === 'register' }]" @click="switchTab('register')">注册</button>
          </div>

          <div class="auth-head">
            <h2>{{ activeTab === 'login' ? '进入工作台' : '创建企业账号' }}</h2>
            <p>{{ activeTab === 'login' ? '继续你的业务与智能体流程' : '30 秒开通，立即开始使用' }}</p>
          </div>

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
              <el-input v-model="loginForm.account" placeholder="请输入账号" prefix-icon="User" clearable />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password clearable />
            </el-form-item>
            <el-button type="primary" size="large" :loading="loginLoading" class="submit-btn" @click="handleLogin">
              登录系统
            </el-button>
          </el-form>

          <el-form
            v-else
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            size="large"
            label-position="top"
            @keydown.enter="handleRegister"
          >
            <el-form-item label="账号" prop="account">
              <el-input v-model="registerForm.account" placeholder="请输入登录账号" clearable />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password clearable />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password clearable />
            </el-form-item>
            <el-form-item label="企业名称" prop="company_name">
              <el-input v-model="registerForm.company_name" placeholder="例如：某某贸易有限公司" clearable />
            </el-form-item>
            <el-form-item label="联系人手机号" prop="mobile">
              <el-input v-model="registerForm.mobile" placeholder="用于服务通知" clearable />
            </el-form-item>
            <el-button type="primary" size="large" :loading="registerLoading" class="submit-btn" @click="handleRegister">
              立即注册
            </el-button>
          </el-form>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import http from '@/api/http'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const activeTab = ref<'login' | 'register'>('login')

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

const loginLoading = ref(false)
const registerLoading = ref(false)

const loginForm = reactive({
  account: '',
  password: '',
})

const registerForm = reactive({
  account: '',
  password: '',
  confirmPassword: '',
  company_name: '',
  mobile: '',
})

const loginRules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const registerRules: FormRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 4, message: '账号至少 4 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次密码输入不一致'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  company_name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

function switchTab(tab: 'login' | 'register') {
  activeTab.value = tab
}

async function handleLogin() {
  if (!loginFormRef.value) return
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  loginLoading.value = true
  try {
    await authStore.login(loginForm.account, loginForm.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/portal'
    router.push(redirect)
  } finally {
    loginLoading.value = false
  }
}

async function handleRegister() {
  if (!registerFormRef.value) return
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return

  registerLoading.value = true
  try {
    await http.post('/admin/Admin/register', {
      account: registerForm.account,
      password: registerForm.password,
      company_name: registerForm.company_name,
      mobile: registerForm.mobile,
      contact_name: registerForm.account,
    })

    ElMessage.success('注册成功，请登录')
    loginForm.account = registerForm.account
    loginForm.password = registerForm.password
    activeTab.value = 'login'
  } catch (error: any) {
    if (error?.response?.status === 404) {
      ElMessage.error('当前环境未开通自助注册，请联系管理员开通')
    } else {
      ElMessage.error(error?.message || '注册失败')
    }
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
.entry-page {
  --ink: #e9edf4;
  --ink-soft: rgba(233, 237, 244, 0.78);
  --panel: rgba(14, 18, 24, 0.6);
  --line: rgba(255, 255, 255, 0.12);
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(circle at 12% 12%, rgba(166, 145, 114, 0.28) 0, rgba(11, 18, 32, 0) 32%), linear-gradient(135deg, #0a0f18 0%, #111827 46%, #1a1f2e 100%);
  overflow: hidden;
}

.grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.09;
  background-image: radial-gradient(circle, #fff 0.4px, transparent 0.4px);
  background-size: 3px 3px;
}

.entry-shell {
  position: relative;
  z-index: 1;
  width: min(1220px, 100%);
  min-height: calc(100vh - 48px);
  margin: 0 auto;
  border: 1px solid var(--line);
  border-radius: 26px;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
  backdrop-filter: blur(18px);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.32);
  display: grid;
  grid-template-columns: 1.16fr 0.84fr;
}

.brand-panel {
  padding: 56px 56px 44px;
  color: var(--ink);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brand-topline {
  font-size: 12px;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: rgba(213, 189, 153, 0.95);
}

.brand-title {
  margin: 0;
  font-size: 56px;
  line-height: 1.06;
  letter-spacing: 0.6px;
  font-weight: 600;
  font-family: 'Iowan Old Style', 'Times New Roman', STSong, serif;
}

.brand-tagline {
  margin: 0;
  font-size: 18px;
  color: var(--ink-soft);
}

.brand-copy {
  margin: 8px 0 2px;
  font-size: 15px;
  line-height: 1.8;
  color: rgba(233, 237, 244, 0.85);
  max-width: 92%;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.module-card {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  padding: 14px;
}

.module-card.active {
  border-color: rgba(213, 189, 153, 0.9);
  background: linear-gradient(160deg, rgba(213, 189, 153, 0.2), rgba(213, 189, 153, 0.06));
}

.module-title {
  font-size: 14px;
  font-weight: 700;
  color: #f6f8fc;
}

.module-meta {
  margin-top: 3px;
  font-size: 12px;
  color: rgba(213, 189, 153, 0.92);
}

.module-card p {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: rgba(224, 230, 240, 0.82);
}

.advantage-list {
  margin-top: auto;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.advantage-list span {
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(238, 242, 248, 0.88);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
}

.auth-panel {
  padding: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: min(420px, 100%);
  border: 1px solid rgba(22, 26, 32, 0.12);
  background: rgba(250, 250, 250, 0.94);
  border-radius: 20px;
  padding: 24px 24px 20px;
}

.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #d5d9e1;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 18px;
}

.mode-btn {
  border: none;
  height: 40px;
  background: #f3f5f8;
  font-size: 14px;
  color: #5c636f;
  cursor: pointer;
}

.mode-btn.active {
  background: #161c24;
  color: #fff;
  font-weight: 600;
}

.auth-head h2 {
  margin: 0;
  font-size: 30px;
  letter-spacing: 0.2px;
  font-weight: 600;
  color: #141922;
  font-family: 'Iowan Old Style', 'Times New Roman', STSong, serif;
}

.auth-head p {
  margin: 8px 0 18px;
  color: #5f6672;
  font-size: 13px;
}

.submit-btn {
  width: 100%;
  height: 46px;
  margin-top: 8px;
  border-radius: 12px;
}

@media (max-width: 1080px) {
  .entry-page {
    padding: 16px;
  }

  .entry-shell {
    grid-template-columns: 1fr;
    min-height: calc(100vh - 32px);
  }

  .brand-panel {
    border-right: none;
    border-bottom: 1px solid var(--line);
    padding: 30px 24px 24px;
  }

  .brand-title {
    font-size: 40px;
  }

  .brand-copy {
    max-width: 100%;
  }

  .module-grid {
    grid-template-columns: 1fr;
  }

  .auth-panel {
    padding: 22px 16px 24px;
  }
}

@media (max-width: 600px) {
  .entry-page {
    padding: 0;
    display: flex;
    align-items: stretch;
    justify-content: center;
    min-height: 100dvh;
    background: #fff;
  }

  .grain,
  .brand-panel {
    display: none;
  }

  .entry-shell {
    width: 100%;
    min-height: 100dvh;
    border: none;
    border-radius: 0;
    box-shadow: none;
    backdrop-filter: none;
    background: #fff;
    display: flex;
    flex-direction: column;
  }

  .auth-panel {
    flex: 1;
    padding: 40px 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .auth-panel::before {
    content: '数字游牧 ERP';
    display: block;
    font-size: 28px;
    font-weight: 700;
    color: #141922;
    font-family: 'PingFang SC', STSong, serif;
    margin-bottom: 6px;
  }

  .auth-panel::after {
    content: '企业级业务与财务协同中枢';
    display: block;
    font-size: 13px;
    color: #86909c;
    margin-bottom: 32px;
  }

  .auth-card {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0;
    width: 100%;
  }

  .auth-head h2 {
    font-size: 22px;
  }

  .submit-btn {
    height: 50px;
    font-size: 16px;
    border-radius: 12px;
  }
}
</style>
