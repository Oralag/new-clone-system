<template>
  <div class="login-page">
    <div class="left-panel">
      <!-- Logo -->
      <div class="logo-row">
        <div class="logo-icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="url(#nbg)"/>
            <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue','Arial',sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
            <circle cx="27" cy="8" r="4" fill="#F19D38"/>
            <defs>
              <linearGradient id="nbg" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#1C2B48"/>
                <stop offset="100%" stop-color="#1D3974"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="logo-text">数字游牧 ERP</span>
      </div>

      <!-- Form area -->
      <div class="form-area">
        <div class="form-heading">
          <h1>{{ activeTab === 'login' ? 'Sign In' : 'Join Us' }}</h1>
          <p class="form-heading-cn">{{ activeTab === 'login' ? '欢迎回来，请登录您的账户' : '创建账户，开启数字游牧之旅' }}</p>
          <p v-if="activeTab === 'login'">
            New here? <a href="#" @click.prevent="switchTab('register')">Create account</a>
          </p>
          <p v-else>
            Already a member? <a href="#" @click.prevent="switchTab('login')">Sign In</a>
          </p>
        </div>

        <!-- Login Form -->
        <el-form
          v-if="activeTab === 'login'"
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          size="large"
          label-position="top"
          @keydown.enter="handleLogin"
        >
          <el-form-item label="ACCOUNT" prop="account">
            <el-input v-model="loginForm.account" placeholder="Phone / Username" clearable />
          </el-form-item>
          <el-form-item label="ACCESS KEY" prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="••••••••" show-password clearable />
          </el-form-item>
          <button class="submit-btn" :disabled="loginLoading" @click.prevent="handleLogin">
            <span v-if="!loginLoading">SIGN IN</span>
            <span v-else class="loading-dots"><span></span><span></span><span></span></span>
          </button>
        </el-form>

        <!-- Register Form -->
        <el-form
          v-else
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          size="large"
          label-position="top"
        >
          <el-form-item label="COMPANY NAME" prop="company_name">
            <el-input v-model="registerForm.company_name" placeholder="Your Company" clearable />
          </el-form-item>
          <el-form-item label="MOBILE" prop="mobile">
            <el-input v-model="registerForm.mobile" placeholder="Phone number" clearable />
          </el-form-item>
          <el-form-item label="ACCESS KEY" prop="password">
            <el-input v-model="registerForm.password" type="password" placeholder="••••••••" show-password clearable />
          </el-form-item>
          <el-form-item label="CONFIRM KEY" prop="confirmPassword">
            <el-input v-model="registerForm.confirmPassword" type="password" placeholder="••••••••" show-password clearable />
          </el-form-item>
          <el-form-item label="VERIFY" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="registerForm.captcha" placeholder="输入右侧验证码" clearable style="flex:1" />
              <captcha-canvas ref="captchaRef" v-model:code="captchaCode" :width="110" :height="36" />
            </div>
          </el-form-item>
          <el-alert v-if="registerTip" :title="registerTip" :type="registerTipType" :closable="false" show-icon style="margin-bottom:16px;border-radius:12px" />
          <button class="submit-btn" :disabled="registerLoading" @click.prevent="handleRegister">
            <span v-if="!registerLoading">JOIN NOW</span>
            <span v-else class="loading-dots"><span></span><span></span><span></span></span>
          </button>
        </el-form>
      </div>

      <!-- Footer -->
      <div class="left-footer">
        <div class="status-row">
          <span class="status-dot"></span>
          <span class="status-label">SYSTEM STATUS</span>
          <span class="status-ok">Operational</span>
        </div>
        <div class="footer-meta">
          <span>数字游牧 ERP</span>
          <span class="dot-sep">·</span>
          <span>V3.0 STABLE BUILD</span>
        </div>
      </div>
    </div>

    <div class="right-panel">
      <!-- Decorative circles -->
      <div class="deco-circle deco-c1"></div>
      <div class="deco-circle deco-c2"></div>

      <div class="right-content">
        <div class="next-gen-badge">
          <span class="badge-star">✦</span>
          <span>NEXT-GEN PLATFORM</span>
        </div>

        <h2 class="hero-title">
          <span class="line-white">构建数字</span><br />
          <span class="line-light">未来。</span>
        </h2>

        <p class="hero-sub">为现代数字游牧企业打造的终极管理工作台</p>

        <div class="feature-cards">
          <div class="feat-card" v-for="f in features" :key="f.title">
            <div class="feat-arrow">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="feat-text">
              <div class="feat-title">{{ f.title }}</div>
              <div class="feat-desc">{{ f.desc }}</div>
            </div>
          </div>
        </div>

        <div class="right-footer">
          <div class="trust-block">
            <div class="avatars">
              <div class="av" v-for="(c, i) in avatarColors" :key="i" :style="{ background: c, left: i * 22 + 'px' }"></div>
            </div>
            <div class="trust-text">
              <div class="trust-label">TRUSTED BY</div>
              <div class="trust-count">10,000+ FOUNDERS</div>
            </div>
          </div>
          <div class="uptime-block">
            <div class="uptime-label">GLOBAL UPTIME</div>
            <div class="uptime-num">99.999%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import http from '@/api/http'
import CaptchaCanvas from '@/components/CaptchaCanvas.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const features = [
  { title: '全球化架构', desc: '让您的业务在无国界的世界中自由流动' },
  { title: 'AI 智能驱动', desc: '从创意生成到全球投放，一键触达目标受众' },
  { title: '极速响应', desc: '毫秒级数据同步，掌控全球业务动态' },
]

const avatarColors = ['#f87171', '#fb923c', '#a78bfa', '#60a5fa', '#34d399']

const activeTab = ref<'login' | 'register'>('login')
function switchTab(tab: 'login' | 'register') {
  activeTab.value = tab
  registerTip.value = ''
  registerTipType.value = 'info'
}

const loginFormRef = ref<FormInstance>()
const loginLoading = ref(false)
const loginForm = reactive({ account: '', password: '' })
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
    const redirect = (route.query.redirect as string) || '/portal'
    router.push(redirect)
  } catch {
  } finally {
    loginLoading.value = false
  }
}

const registerFormRef = ref<FormInstance>()
const registerLoading = ref(false)
const registerTip = ref('')
const registerTipType = ref<'success' | 'error' | 'info'>('info')
const registerForm = reactive({ company_name: '', mobile: '', password: '', confirmPassword: '', captcha: '' })
const captchaRef = ref<any>(null)
const captchaCode = ref('')

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value === '') { callback(new Error('请再次输入密码')) }
  else if (value !== registerForm.password) { callback(new Error('两次输入的密码不一致')) }
  else { callback() }
}

const validateCaptcha = (_rule: any, value: string, callback: any) => {
  if (!value) { callback(new Error('请输入验证码')) }
  else if (value.toUpperCase() !== captchaCode.value.toUpperCase()) {
    captchaRef.value?.refresh()
    callback(new Error('验证码错误，已刷新'))
  }
  else { callback() }
}

const registerRules: FormRules = {
  company_name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请设置密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' }, { validator: validateConfirmPassword, trigger: 'blur' }],
  captcha: [{ required: true, validator: validateCaptcha, trigger: 'blur' }],
}

async function handleRegister() {
  if (!registerFormRef.value) return
  const valid = await registerFormRef.value.validate().catch(() => false)
  if (!valid) return
  registerLoading.value = true
  registerTip.value = ''
  try {
    await http.post('/login/register', { company_name: registerForm.company_name, mobile: registerForm.mobile, password: registerForm.password })
    registerTip.value = '注册成功，请登录'
    registerTipType.value = 'success'
    setTimeout(() => { switchTab('login'); loginForm.account = registerForm.mobile }, 1500)
  } catch (e: any) {
    registerTip.value = e?.message || '注册失败，请重试'
    registerTipType.value = 'error'
    captchaRef.value?.refresh()
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
* { box-sizing: border-box; }

.login-page {
  min-height: 100vh;
  display: flex;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── LEFT PANEL ── */
.left-panel {
  width: 480px;
  flex-shrink: 0;
  background: #f0f0f5;
  display: flex;
  flex-direction: column;
  padding: 40px 48px;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #1a1a2e;
}

.form-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 0;
}

.form-heading {
  margin-bottom: 36px;
}

.form-heading h1 {
  font-size: 44px;
  font-weight: 900;
  letter-spacing: -0.045em;
  color: #1a1a2e;
  margin: 0 0 6px;
  line-height: 1;
}

.form-heading-cn {
  font-size: 13px;
  color: #aaa;
  margin: 0 0 8px;
  font-weight: 500;
}

.form-heading p {
  font-size: 14px;
  color: #888;
  margin: 0;
  font-weight: 500;
}

.form-heading a {
  color: #5B4FE8;
  text-decoration: none;
  font-weight: 700;
}

.form-heading a:hover { text-decoration: underline; }

.submit-btn {
  width: 100%;
  margin-top: 8px;
  height: 52px;
  font-size: 13px;
  font-weight: 800;
  border-radius: 14px;
  border: none;
  background: #5B4FE8;
  color: white;
  cursor: pointer;
  letter-spacing: 0.1em;
  box-shadow: 0 8px 24px rgba(91,79,232,0.32);
  transition: all 0.22s cubic-bezier(0.23,1,0.32,1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  background: #4a3fd4;
  transform: translateY(-1px);
  box-shadow: 0 12px 32px rgba(91,79,232,0.42);
}

.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.loading-dots { display: flex; gap: 5px; align-items: center; }

.captcha-row { display: flex; align-items: center; gap: 10px; width: 100%; }
.loading-dots span { width: 6px; height: 6px; background: white; border-radius: 50%; animation: blink 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }

.left-footer {
  padding-top: 24px;
  border-top: 1px solid rgba(0,0,0,0.07);
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(34,197,94,0.6);
}

.status-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #aaa;
}

.status-ok {
  font-size: 11px;
  font-weight: 700;
  color: #22c55e;
}

.footer-meta {
  font-size: 10px;
  color: #bbb;
  font-weight: 600;
  letter-spacing: 0.05em;
  display: flex;
  gap: 6px;
}

.dot-sep { color: #ddd; }

/* ── RIGHT PANEL ── */
.right-panel {
  flex: 1;
  background: linear-gradient(135deg, #5B4FE8 0%, #4338CA 40%, #3730A3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 72px;
  position: relative;
  overflow: hidden;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.08);
  pointer-events: none;
}

.deco-c1 {
  width: 520px;
  height: 520px;
  top: -100px;
  right: -100px;
}

.deco-c2 {
  width: 360px;
  height: 360px;
  bottom: -80px;
  right: 120px;
}

.right-content {
  max-width: 500px;
  position: relative;
  z-index: 1;
  width: 100%;
}

.next-gen-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.75);
  margin-bottom: 28px;
}

.badge-star { font-size: 9px; }

.hero-title {
  font-size: clamp(52px, 6vw, 80px);
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 0.95;
  margin: 0 0 20px;
}

.line-white { color: #ffffff; }
.line-light { color: rgba(255,255,255,0.45); }

.hero-sub {
  font-size: 16px;
  color: rgba(255,255,255,0.6);
  font-weight: 500;
  margin: 0 0 40px;
  line-height: 1.65;
}

.feature-cards {
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 40px;
}

.feat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 14px;
  transition: background 0.2s;
  cursor: default;
}

.feat-card:hover { background: rgba(255,255,255,0.07); }

.feat-arrow {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.feat-card:hover .feat-arrow { background: rgba(255,255,255,0.22); }

.feat-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 3px;
}

.feat-desc {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  font-weight: 500;
}

.right-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trust-block {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatars {
  position: relative;
  height: 34px;
  width: 110px;
}

.av {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.25);
  top: 0;
}

.trust-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.4);
  margin-bottom: 3px;
}

.trust-count {
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}

.uptime-block { text-align: right; }

.uptime-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.4);
  margin-bottom: 3px;
}

.uptime-num {
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.03em;
}

/* ── Element Plus overrides ── */
:deep(.el-form-item__label) {
  font-size: 10px;
  font-weight: 800;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding-bottom: 6px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1.5px rgba(91,79,232,0.25);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(91,79,232,0.35) !important;
}

:deep(.el-input__inner) {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .login-page { flex-direction: column-reverse; }
  .left-panel { width: 100%; padding: 32px 28px; }
  .right-panel { padding: 48px 28px; min-height: 50vh; }
  .hero-title { font-size: 40px; }
  .feature-cards { margin-bottom: 24px; }
}
</style>
