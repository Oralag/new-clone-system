<template>
  <div class="console-wrap">

    <!-- Nav -->
    <div class="top-nav">
      <button class="back-btn" @click="router.push('/dashboard')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        返回首页
      </button>
      <span class="nav-title">管理控制台</span>
      <div class="nav-tabs">
        <button :class="['nav-tab', { active: activeTab === 'tenants' }]" @click="activeTab = 'tenants'">租户管理</button>
        <button :class="['nav-tab', { active: activeTab === 'invites' }]" @click="activeTab = 'invites'">邀请码</button>
      </div>
      <button v-if="activeTab === 'tenants'" class="icon-btn" @click="loadUsers" :disabled="loading" title="刷新">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" :class="{ spin: loading }">
          <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.87 4.4 2.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M12 2l.4 2.7L9.7 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- ── Tenants Tab ── -->
    <div class="page" v-if="activeTab === 'tenants'">

      <!-- Summary bar -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-num">{{ users.length }}</span>
          <span class="summary-label">总租户</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-num paid">{{ paidCount }}</span>
          <span class="summary-label">已付费</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-num trial">{{ trialCount }}</span>
          <span class="summary-label">体验中</span>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <span class="summary-num suspended">{{ suspendedCount }}</span>
          <span class="summary-label">已暂停</span>
        </div>
        <div class="summary-spacer" />
        <div class="search-box">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10.5 10.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input v-model="searchText" placeholder="搜索…" />
        </div>
        <div class="filter-group">
          <button v-for="f in filters" :key="f.key"
            :class="['f-btn', { active: filterStatus === f.key }]"
            @click="filterStatus = f.key">
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrap" v-loading="loading">
        <div v-if="!loading && filteredUsers.length === 0" class="empty-state">
          {{ searchText ? '没有匹配结果' : '暂无注册用户' }}
        </div>

        <table v-else class="user-table">
          <thead>
            <tr>
              <th>企业</th>
              <th>手机号</th>
              <th>付费状态</th>
              <th>套餐</th>
              <th>到期时间</th>
              <th>体验状态</th>
              <th>后端</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u.mobile"
              :class="{ 'row-suspended': u.status === 'suspended' }">
              <td>
                <div class="company-cell">
                  <div class="company-dot" :class="{ paid: u.is_paid }">
                    {{ (u.company_name || '?').charAt(0) }}
                  </div>
                  <span class="company-name">{{ u.company_name }}</span>
                </div>
              </td>
              <td class="mono">{{ u.mobile }}</td>
              <td>
                <div class="badge-group">
                  <span :class="['badge', u.is_paid ? 'badge-paid' : 'badge-trial']">
                    {{ u.is_paid ? '付费版' : '体验版' }}
                  </span>
                  <span v-if="u.status === 'suspended'" class="badge badge-suspended">已暂停</span>
                </div>
              </td>
              <td>
                <span v-if="u.plan_label" class="plan-label">{{ u.plan_label }}</span>
                <span v-else class="trial-cell-none">—</span>
              </td>
              <td>
                <div v-if="u.paid_until">
                  <div v-if="isPaidExpired(u.paid_until)" class="trial-cell-expired">已到期</div>
                  <div v-else class="paid-until-cell">
                    <span class="trial-dot"></span>
                    {{ formatDate(u.paid_until) }}
                  </div>
                </div>
                <span v-else class="trial-cell-none">—</span>
              </td>
              <td>
                <div v-if="!u.trial_start_at" class="trial-cell-none">未领取</div>
                <div v-else-if="u.trial_days_left > 0" class="trial-cell-active">
                  <span class="trial-dot"></span>
                  剩余 <strong>{{ u.trial_days_left }}</strong> 天
                </div>
                <div v-else class="trial-cell-expired">已到期</div>
              </td>
              <td>
                <div class="backend-cell">
                  <span class="backend-dot" :class="{ on: !!u.backend_url }" />
                  <span class="backend-text">{{ u.backend_url ? '专属后端' : '共享体验' }}</span>
                </div>
              </td>
              <td class="date-cell">{{ formatDate(u.created_at) }}</td>
              <td>
                <div class="action-group">
                  <button class="act-btn primary" @click="openEdit(u)">
                    {{ u.is_paid ? '编辑' : '开通' }}
                  </button>
                  <button class="act-btn" @click="toggleStatus(u)">
                    {{ u.status === 'suspended' ? '恢复' : '暂停' }}
                  </button>
                  <button class="act-btn danger" @click="handleDelete(u)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="page-footer" v-if="lastRefresh !== '-'">
        最后刷新：{{ lastRefresh }}
      </div>
    </div>

    <!-- ── Invites Tab ── -->
    <div class="page" v-if="activeTab === 'invites'">

      <!-- Generate card -->
      <div class="invite-gen-card">
        <div class="invite-gen-title">生成邀请码</div>
        <div class="invite-gen-row">
          <div class="plan-options">
            <button v-for="p in planOptions" :key="p.value"
              :class="['plan-btn', { active: newPlan === p.value }]"
              @click="newPlan = p.value">
              {{ p.label }}
            </button>
          </div>
          <button class="gen-btn" @click="generateCode">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            生成邀请码
          </button>
        </div>
        <div v-if="lastGeneratedCode" class="gen-result">
          <span class="gen-code">{{ lastGeneratedCode }}</span>
          <button class="copy-btn" @click="copyCode(lastGeneratedCode)">复制</button>
        </div>
      </div>

      <!-- Invite code list -->
      <div class="table-wrap">
        <div v-if="inviteCodes.length === 0" class="empty-state">
          暂无邀请码，点击上方生成
        </div>
        <table v-else class="user-table">
          <thead>
            <tr>
              <th>邀请码</th>
              <th>套餐</th>
              <th>有效期至</th>
              <th>状态</th>
              <th>使用者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in inviteCodes" :key="c.code"
              :class="{ 'row-suspended': !!c.usedBy || isExpired(c.expiresAt) }">
              <td>
                <span class="code-text">{{ c.code }}</span>
              </td>
              <td>
                <span class="badge badge-paid">{{ c.planLabel }}</span>
              </td>
              <td class="date-cell">{{ c.expiresAt.slice(0, 10) }}</td>
              <td>
                <span v-if="c.usedBy" class="badge badge-trial">已使用</span>
                <span v-else-if="isExpired(c.expiresAt)" class="badge badge-suspended">已过期</span>
                <span v-else class="badge" style="background:#e8ffea;color:#00b42a">未使用</span>
              </td>
              <td class="date-cell">{{ c.usedBy || '-' }}</td>
              <td>
                <div class="action-group">
                  <button class="act-btn" @click="copyCode(c.code)">复制</button>
                  <button class="act-btn danger" @click="revokeCode(c.code)">撤销</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Dialog -->
    <el-dialog v-model="editVisible"
      :title="editForm.is_paid ? '编辑付费配置' : '开通付费账号'"
      width="460px" append-to-body>

      <div class="dialog-user-row">
        <div class="dialog-dot" :class="{ paid: editForm.is_paid }">
          {{ (editForm.company_name || '?').charAt(0) }}
        </div>
        <div>
          <div class="dialog-name">{{ editForm.company_name }}</div>
          <div class="dialog-mobile">{{ editForm.mobile }}</div>
        </div>
      </div>

      <el-form :model="editForm" label-width="100px" style="margin-top:20px">
        <el-form-item label="套餐">
          <div class="plan-options">
            <button v-for="p in paidPlanOptions" :key="p.value"
              :class="['plan-btn', { active: editForm.plan === p.value }]"
              type="button"
              @click="editForm.plan = p.value">
              <span class="plan-btn-name">{{ p.label }}</span>
              <span class="plan-btn-price">¥{{ p.price }}</span>
            </button>
          </div>
          <div v-if="editForm.plan" class="field-hint">
            到期时间：{{ calcExpireDate(editForm.plan, editForm.paid_until) }}
          </div>
        </el-form-item>
        <el-form-item label="专属后端">
          <el-input v-model="editForm.backend_url"
            placeholder="https://erp-tenant-xxx.up.railway.app" clearable />
          <div class="field-hint">填写后客户自动路由到专属后端，留空则继续体验模式</div>
        </el-form-item>
        <el-form-item label="重置密码">
          <el-input v-model="editForm.new_password"
            placeholder="留空则不修改" show-password clearable />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editForm.is_paid ? '保存' : '确认开通' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const users = ref<any[]>([])
const editVisible = ref(false)
const editForm = ref<any>({})
const searchText = ref('')
const filterStatus = ref('all')
const lastRefresh = ref('-')
const activeTab = ref<'tenants' | 'invites'>('tenants')

const filters = [
  { key: 'all', label: '全部' },
  { key: 'paid', label: '付费' },
  { key: 'trial', label: '体验' },
  { key: 'suspended', label: '暂停' },
]

const paidCount = computed(() => users.value.filter(u => u.is_paid).length)
const trialCount = computed(() => users.value.filter(u => !u.is_paid && u.status !== 'suspended').length)
const suspendedCount = computed(() => users.value.filter(u => u.status === 'suspended').length)

const filteredUsers = computed(() => {
  let list = users.value
  if (filterStatus.value === 'paid') list = list.filter(u => u.is_paid)
  else if (filterStatus.value === 'trial') list = list.filter(u => !u.is_paid && u.status !== 'suspended')
  else if (filterStatus.value === 'suspended') list = list.filter(u => u.status === 'suspended')
  const q = searchText.value.trim().toLowerCase()
  if (q) list = list.filter(u =>
    (u.company_name || '').toLowerCase().includes(q) || (u.mobile || '').includes(q)
  )
  return list
})

function getAdminToken() {
  return auth.token || localStorage.getItem('erp_token') || ''
}

async function loadUsers() {
  loading.value = true
  try {
    const res = await fetch('/api/admin-console?action=list', {
      headers: { 'x-admin-token': getAdminToken() },
    })
    const data = await res.json()
    if (data.code === 1) {
      users.value = data.data
      lastRefresh.value = new Date().toLocaleTimeString('zh-CN')
    } else {
      ElMessage.error(data.message || '加载失败')
    }
  } catch {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

function openEdit(u: any) {
  editForm.value = { ...u, new_password: '', plan: '' }
  editVisible.value = true
}

const paidPlanOptions = [
  { value: '1m', label: '1个月', months: 1, price: 99 },
  { value: '3m', label: '3个月', months: 3, price: 268 },
  { value: '6m', label: '半年', months: 6, price: 499 },
  { value: '1y', label: '1年', months: 12, price: 888 },
]

function calcExpireDate(planValue: string, existingPaidUntil?: string): string {
  const plan = paidPlanOptions.find(p => p.value === planValue)
  if (!plan) return ''
  // 从当前到期时间续期，否则从今天起算
  const base = existingPaidUntil && new Date(existingPaidUntil) > new Date()
    ? new Date(existingPaidUntil)
    : new Date()
  base.setMonth(base.getMonth() + plan.months)
  return base.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function isPaidExpired(paidUntil: string): boolean {
  return new Date(paidUntil) < new Date()
}

async function handleSave() {
  saving.value = true
  try {
    const payload: any = {
      mobile: editForm.value.mobile,
      backend_url: editForm.value.backend_url || null,
    }
    if (editForm.value.new_password) payload.password = editForm.value.new_password

    // 套餐：计算新到期时间
    if (editForm.value.plan) {
      const plan = paidPlanOptions.find(p => p.value === editForm.value.plan)
      if (plan) {
        const base = editForm.value.paid_until && new Date(editForm.value.paid_until) > new Date()
          ? new Date(editForm.value.paid_until)
          : new Date()
        base.setMonth(base.getMonth() + plan.months)
        payload.plan_label = plan.label
        payload.paid_until = base.toISOString()
      }
    }

    const res = await fetch('/api/admin-console?action=update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': getAdminToken() },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.code === 1) {
      ElMessage.success(editForm.value.is_paid ? '已保存' : '已开通付费账号')
      editVisible.value = false
      await loadUsers()
    } else {
      ElMessage.error(data.message || '操作失败')
    }
  } finally {
    saving.value = false
  }
}

async function toggleStatus(u: any) {
  const newStatus = u.status === 'suspended' ? 'active' : 'suspended'
  const label = newStatus === 'suspended' ? '暂停' : '恢复'
  await ElMessageBox.confirm(`确定${label}「${u.company_name}」？`, '确认', { type: 'warning' })
  const res = await fetch('/api/admin-console?action=update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': getAdminToken() },
    body: JSON.stringify({ mobile: u.mobile, status: newStatus }),
  })
  const data = await res.json()
  if (data.code === 1) { ElMessage.success(`已${label}`); await loadUsers() }
  else ElMessage.error(data.message)
}

async function handleDelete(u: any) {
  const backendHint = u.backend_url
    ? `<div style="margin-top:12px;padding:10px 12px;background:#fff7e6;border:1px solid #ffd591;border-radius:6px;font-size:12px;line-height:1.8;color:#874d00;">
        <strong>完整注销步骤：</strong><br>
        1. 点击「确定删除」— 删除本系统账号<br>
        2. 前往 Railway 删除该客户的后端服务（所有业务数据将彻底清除）<br>
        <a href="https://railway.app/dashboard" target="_blank"
          style="color:#1d5fce;text-decoration:none;font-weight:600;">
          → 打开 Railway 控制台
        </a><br>
        <span style="color:#86909c;">后端地址：${u.backend_url}</span>
      </div>`
    : `<div style="margin-top:12px;padding:10px 12px;background:#f7f8fa;border:1px solid #e8eaed;border-radius:6px;font-size:12px;color:#4e5969;">
        该账号为体验用户，无独立后端，删除账号即可。
      </div>`

  await ElMessageBox.confirm(
    `<span>确定注销「<strong>${u.company_name}</strong>」的账号？</span>${backendHint}`,
    '注销账号',
    {
      type: 'warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
    }
  )
  const res = await fetch('/api/admin-console?action=delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': getAdminToken() },
    body: JSON.stringify({ mobile: u.mobile }),
  })
  const data = await res.json()
  if (data.code === 1) { ElMessage.success('已删除'); await loadUsers() }
  else ElMessage.error(data.message)
}

function formatDate(str: string) {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// ── Invite Code Management ────────────────────────────────────
const INVITE_STORAGE_KEY = 'nomad_invite_codes'

const planOptions = [
  { value: '1m', label: '1个月', months: 1, planLabel: '1个月付费版' },
  { value: '3m', label: '3个月', months: 3, planLabel: '3个月付费版' },
  { value: '6m', label: '半年', months: 6, planLabel: '半年付费版' },
  { value: '1y', label: '1年', months: 12, planLabel: '1年付费版' },
]

const newPlan = ref('3m')
const lastGeneratedCode = ref('')
const inviteCodes = ref<any[]>([])

function loadInviteCodes() {
  try {
    inviteCodes.value = JSON.parse(localStorage.getItem(INVITE_STORAGE_KEY) || '[]')
  } catch {
    inviteCodes.value = []
  }
}

function saveInviteCodes() {
  localStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(inviteCodes.value))
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function generateCode() {
  const plan = planOptions.find(p => p.value === newPlan.value)!
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setMonth(expiresAt.getMonth() + plan.months)
  const paidUntil = new Date(now)
  paidUntil.setMonth(paidUntil.getMonth() + plan.months)

  const code = randomCode()
  inviteCodes.value.unshift({
    code,
    planLabel: plan.planLabel,
    expiresAt: expiresAt.toISOString(),
    paidUntil: paidUntil.toISOString(),
    createdAt: now.toISOString(),
    usedBy: null,
    usedAt: null,
  })
  saveInviteCodes()
  lastGeneratedCode.value = code
  ElMessage.success('邀请码已生成')
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date()
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('已复制：' + code)
  } catch {
    ElMessage.info('邀请码：' + code)
  }
}

async function revokeCode(code: string) {
  await ElMessageBox.confirm(`确定撤销邀请码 ${code}？`, '撤销确认', { type: 'warning' })
  inviteCodes.value = inviteCodes.value.filter(c => c.code !== code)
  saveInviteCodes()
  ElMessage.success('已撤销')
}

onMounted(() => {
  loadUsers()
  loadInviteCodes()
})
</script>

<style scoped>
* { box-sizing: border-box; }

.console-wrap {
  min-height: 100vh;
  background: #f7f8fa;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Nav ─────────────────────────────────────────────────── */
.top-nav {
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #4e5969;
  padding: 5px 10px;
  border-radius: 7px;
  transition: background 0.15s;
  flex-shrink: 0;
}
.back-btn:hover { background: #f2f3f5; }

.nav-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.nav-tabs {
  display: flex;
  gap: 2px;
  background: #f2f3f5;
  border-radius: 8px;
  padding: 3px;
  flex: 1;
  max-width: 240px;
  margin: 0 8px;
}
.nav-tab {
  flex: 1;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #86909c;
  padding: 5px 12px;
  border-radius: 6px;
  transition: all 0.15s;
  white-space: nowrap;
}
.nav-tab.active {
  background: #fff;
  color: #1d2129;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  border: 1px solid #e8eaed;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4e5969;
  transition: all 0.15s;
  flex-shrink: 0;
  margin-left: auto;
}
.icon-btn:hover { background: #f2f3f5; }
.icon-btn:disabled { opacity: 0.4; cursor: default; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; }

/* ── Page ────────────────────────────────────────────────── */
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px;
}

/* ── Summary bar ─────────────────────────────────────────── */
.summary-bar {
  display: flex;
  align-items: center;
  gap: 0;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  padding: 14px 20px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  row-gap: 10px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 18px;
  min-width: 56px;
}

.summary-num {
  font-size: 22px;
  font-weight: 800;
  color: #1d2129;
  line-height: 1;
}
.summary-num.paid { color: #00b42a; }
.summary-num.trial { color: #ff7d00; }
.summary-num.suspended { color: #f53f3f; }

.summary-label {
  font-size: 11px;
  color: #86909c;
  margin-top: 3px;
}

.summary-divider {
  width: 1px;
  height: 28px;
  background: #e8eaed;
}

.summary-spacer { flex: 1; }

.search-box {
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #e8eaed;
  border-radius: 7px;
  padding: 6px 10px;
  color: #86909c;
  transition: border-color 0.15s;
}
.search-box:focus-within { border-color: #3a8ee6; }
.search-box input {
  border: none;
  outline: none;
  font-size: 13px;
  color: #1d2129;
  width: 140px;
  background: transparent;
}
.search-box input::placeholder { color: #c9cdd4; }

.filter-group {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.f-btn {
  background: none;
  border: 1px solid #e8eaed;
  cursor: pointer;
  font-size: 12px;
  color: #4e5969;
  padding: 5px 12px;
  border-radius: 6px;
  transition: all 0.15s;
  white-space: nowrap;
}
.f-btn:hover { border-color: #c9cdd4; background: #f7f8fa; }
.f-btn.active { background: #e8f0fe; border-color: #a5c3ff; color: #1d5fce; font-weight: 600; }

/* ── Table ───────────────────────────────────────────────── */
.table-wrap {
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  overflow: hidden;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.user-table thead tr {
  background: #f7f8fa;
  border-bottom: 1px solid #e8eaed;
}

.user-table th {
  padding: 10px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #86909c;
  white-space: nowrap;
}

.user-table tbody tr {
  border-bottom: 1px solid #f2f3f5;
  transition: background 0.1s;
}
.user-table tbody tr:last-child { border-bottom: none; }
.user-table tbody tr:hover { background: #fafbfc; }
.user-table tr.row-suspended { opacity: 0.55; }

.user-table td {
  padding: 12px 14px;
  color: #1d2129;
  vertical-align: middle;
}

/* Company cell */
.company-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}

.company-dot {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #e8f0fe;
  color: #1d5fce;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.company-dot.paid { background: #e8ffea; color: #00b42a; }

.company-name { font-weight: 600; color: #1d2129; }

/* Mono */
.mono { font-family: 'SF Mono', 'Fira Code', monospace; color: #4e5969; font-size: 12px; }

/* Badges */
.badge-group { display: flex; gap: 5px; flex-wrap: wrap; }

.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}
.badge-paid { background: #e8ffea; color: #00b42a; }
.badge-trial { background: #fff7e6; color: #ff7d00; }
.badge-suspended { background: #fff1f0; color: #f53f3f; }

/* Trial status cells */
.trial-cell-none { font-size: 12px; color: #c9cdd4; }
.trial-cell-active {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #00b42a;
}
.trial-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #00b42a; flex-shrink: 0;
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }
.trial-cell-active strong { font-weight: 700; }
.trial-cell-expired { font-size: 12px; color: #f53f3f; }

/* Backend */
.backend-cell { display: flex; align-items: center; gap: 6px; }
.backend-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #c9cdd4; flex-shrink: 0;
}
.backend-dot.on { background: #00b42a; }
.backend-text { font-size: 12px; color: #4e5969; }

/* Date */
.date-cell { font-size: 12px; color: #86909c; white-space: nowrap; }

/* Actions */
.action-group { display: flex; gap: 5px; }

.act-btn {
  border: 1px solid #e8eaed;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  color: #4e5969;
  padding: 4px 10px;
  border-radius: 5px;
  transition: all 0.15s;
  white-space: nowrap;
}
.act-btn:hover { background: #f2f3f5; border-color: #c9cdd4; }
.act-btn.primary { color: #1d5fce; border-color: #a5c3ff; background: #e8f0fe; }
.act-btn.primary:hover { background: #d4e4fd; }
.act-btn.danger { color: #f53f3f; border-color: #ffccc7; }
.act-btn.danger:hover { background: #fff1f0; }

/* Empty */
.empty-state {
  text-align: center;
  color: #86909c;
  padding: 52px 0;
  font-size: 13px;
}

/* Footer */
.page-footer {
  text-align: right;
  font-size: 11px;
  color: #c9cdd4;
  margin-top: 12px;
}

/* Dialog */
.dialog-user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px 14px;
}

.dialog-dot {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #e8f0fe;
  color: #1d5fce;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dialog-dot.paid { background: #e8ffea; color: #00b42a; }

.dialog-name { font-size: 14px; font-weight: 600; color: #1d2129; }
.dialog-mobile { font-size: 12px; color: #86909c; margin-top: 2px; }

.field-hint { font-size: 11px; color: #86909c; margin-top: 4px; line-height: 1.5; }

/* ── Invite Gen Card ── */
.invite-gen-card {
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  padding: 20px 20px 16px;
  margin-bottom: 16px;
}
.invite-gen-title {
  font-size: 14px;
  font-weight: 700;
  color: #1d2129;
  margin-bottom: 14px;
}
.invite-gen-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.plan-options {
  display: flex;
  gap: 6px;
}
.plan-btn {
  background: #f2f3f5;
  border: 1.5px solid transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #4e5969;
  padding: 7px 16px;
  border-radius: 8px;
  transition: all 0.15s;
  white-space: nowrap;
}
.plan-btn:hover { background: #e8eaed; }
.plan-btn.active {
  background: #e8f0fe;
  border-color: #a5c3ff;
  color: #1d5fce;
  font-weight: 700;
}
.gen-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1d2129;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 8px;
  transition: background 0.15s;
  margin-left: auto;
}
.gen-btn:hover { background: #3a3a3a; }

.gen-result {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  background: #f7f8fa;
  border: 1px dashed #c9cdd4;
  border-radius: 8px;
  padding: 10px 14px;
}
.gen-code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 15px;
  font-weight: 700;
  color: #1d2129;
  letter-spacing: 0.08em;
  flex: 1;
}
.copy-btn {
  background: #1d2129;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 6px;
  transition: background 0.15s;
  white-space: nowrap;
}
.copy-btn:hover { background: #3a3a3a; }

/* Plan label */
.plan-label {
  font-size: 12px;
  font-weight: 600;
  color: #1d5fce;
  background: #e8f0fe;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

/* Paid until cell */
.paid-until-cell {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #00b42a;
}

/* Plan selector in dialog */
.plan-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: #f2f3f5;
  border: 1.5px solid transparent;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.15s;
  min-width: 64px;
}
.plan-btn:hover { background: #e8eaed; }
.plan-btn.active {
  background: #e8f0fe;
  border-color: #a5c3ff;
}
.plan-btn-name {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}
.plan-btn.active .plan-btn-name { color: #1d5fce; }
.plan-btn-price {
  font-size: 11px;
  color: #86909c;
}
.plan-btn.active .plan-btn-price { color: #1d5fce; }

/* Code cell */
.code-text {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  letter-spacing: 0.05em;
}
</style>
