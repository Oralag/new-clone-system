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
      <span class="nav-title">租户管理</span>
      <button class="icon-btn" @click="loadUsers" :disabled="loading" title="刷新">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" :class="{ spin: loading }">
          <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c1.8 0 3.4.87 4.4 2.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M12 2l.4 2.7L9.7 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="page">

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
              <th>状态</th>
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
  editForm.value = { ...u, new_password: '' }
  editVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    const payload: any = {
      mobile: editForm.value.mobile,
      backend_url: editForm.value.backend_url || null,
    }
    if (editForm.value.new_password) payload.password = editForm.value.new_password

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
  await ElMessageBox.confirm(
    `确定删除「${u.company_name}」？此操作不可恢复。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '确定删除', confirmButtonClass: 'el-button--danger' }
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

onMounted(loadUsers)
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
  flex: 1;
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
}
.icon-btn:hover { background: #f2f3f5; }
.icon-btn:disabled { opacity: 0.4; cursor: default; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; }

/* ── Page ────────────────────────────────────────────────── */
.page {
  max-width: 1000px;
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
</style>
