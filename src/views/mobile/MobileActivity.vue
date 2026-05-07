<template>
  <div class="m-activity">
    <!-- Tab: 全部 / 我的 / 团队 -->
    <div class="m-activity-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        :class="['m-activity-tab', activeTab === t.key ? 'active' : '']"
        @click="activeTab = t.key; loadActivities(true)"
      >{{ t.label }}</button>
    </div>

    <!-- 筛选 -->
    <div class="m-activity-filter">
      <div class="m-activity-filter-date">
        <button :class="['m-filter-btn', dateRange === 'today' ? 'active' : '']" @click="dateRange = 'today'; loadActivities(true)">今天</button>
        <button :class="['m-filter-btn', dateRange === 'week' ? 'active' : '']" @click="dateRange = 'week'; loadActivities(true)">本周</button>
        <button :class="['m-filter-btn', dateRange === 'month' ? 'active' : '']" @click="dateRange = 'month'; loadActivities(true)">本月</button>
      </div>
      <div class="m-activity-count">{{ activities.length }} 条动态</div>
    </div>

    <!-- 动态列表 -->
    <div class="m-activity-list">
      <div v-if="loading && activities.length === 0" class="m-loading">
        <div class="m-loading-spinner" />
        <span>加载中...</span>
      </div>

      <div v-else-if="activities.length === 0" class="m-empty">
        <div class="m-empty-icon">📭</div>
        <div class="m-empty-title">暂无动态</div>
        <div class="m-empty-sub">还没有任何操作记录</div>
      </div>

      <template v-else>
        <!-- 按日期分组 -->
        <div v-for="(group, date) in groupedActivities" :key="date" class="m-activity-group">
          <div class="m-activity-date-label">{{ formatDate(date) }}</div>
          <div class="m-activity-date-count">{{ group.length }} 条</div>

          <div v-for="a in group" :key="a.id" class="m-activity-item" @click="handleActivityClick(a)">
            <div class="m-activity-avatar" :style="getAvatarStyle(a)">
              {{ a.user_name?.[0] || '?' }}
            </div>
            <div class="m-activity-content">
              <div class="m-activity-top">
                <span class="m-activity-user">{{ a.user_name }}</span>
                <span class="m-activity-action">{{ a.action_name }}</span>
                <span class="m-activity-badge" :class="getTypeClass(a.action_type)">{{ getTypeTag(a.action_type) }}</span>
              </div>
              <div v-if="getDetailText(a)" class="m-activity-detail">{{ getDetailText(a) }}</div>
              <div class="m-activity-time">{{ formatTime(a.created_at) }}</div>
            </div>
            <div v-if="a.status" class="m-activity-status" :class="getStatusClass(a.status)">
              {{ getStatusText(a.status) }}
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="m-load-more" @click="loadActivities(false)">
          {{ loading ? '加载中...' : '加载更多' }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import http from '@/api/http'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('all')
const dateRange = ref('today')
const activities = ref<any[]>([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'mine', label: '我的' },
  { key: 'team', label: '团队' },
]

const groupedActivities = computed(() => {
  const groups: Record<string, any[]> = {}
  activities.value.forEach(a => {
    const date = (a.created_at || '').slice(0, 10)
    if (!groups[date]) groups[date] = []
    groups[date].push(a)
  })
  return groups
})

function getDateFrom() {
  const now = new Date()
  if (dateRange.value === 'today') {
    return now.toISOString().slice(0, 10)
  } else if (dateRange.value === 'week') {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay())
    return d.toISOString().slice(0, 10)
  } else {
    const d = new Date(now)
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  }
}

function getAvatarStyle(a: any) {
  const colors = ['#0071e3', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']
  const idx = (a.user_name?.[0]?.charCodeAt(0) || 0) % colors.length
  return { background: colors[idx] }
}

function getTypeTag(type: string) {
  const map: Record<string, string> = {
    sale_create: '销售',
    sale_approve: '审批',
    procure_create: '采购',
    procure_in: '入库',
    warehouse_check: '盘点',
    warehouse_in: '入库',
    warehouse_out: '出库',
    ai_input: 'AI录入',
    task_create: '任务',
    task_complete: '完成',
  }
  return map[type] || '操作'
}

function getTypeClass(type: string) {
  if (type?.includes('sale')) return 'type-sale'
  if (type?.includes('procure') || type?.includes('in')) return 'type-procure'
  if (type?.includes('warehouse') || type?.includes('check')) return 'type-warehouse'
  if (type?.includes('ai')) return 'type-ai'
  if (type?.includes('task')) return 'type-task'
  return 'type-default'
}

function getDetailText(a: any) {
  if (!a.detail) return ''
  try {
    const d = typeof a.detail === 'string' ? JSON.parse(a.detail) : a.detail
    if (d.amount) return `金额：¥${Number(d.amount).toFixed(2)}`
    if (d.goods_name) return `${d.goods_name} × ${d.quantity || 1}`
    if (d.message) return d.message
    return ''
  } catch {
    return a.detail
  }
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending_review: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    completed: '已完成',
    pending: '待处理',
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  if (status === 'pending_review' || status === 'pending') return 'status-pending'
  if (status === 'approved' || status === 'completed') return 'status-ok'
  if (status === 'rejected') return 'status-reject'
  return ''
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDate(date: string) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  today.setHours(0, 0, 0, 0)
  if (d.getTime() === today.getTime()) return '今天'
  if (d.getTime() === yesterday.getTime()) return '昨天'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function handleActivityClick(a: any) {
  if (!a.related_type) return
  const routeMap: Record<string, string> = {
    sale: '/mobile/sale/out',
    procure: '/mobile/procure/order',
    warehouse: '/mobile/warehouse/stock',
    finance: '/mobile/finance/overview',
    task: '/mobile/task',
    ai: '/mobile/ai',
    investment: '/mobile/investment/overview',
    personnel: '/mobile/personnel/staff',
    goods: '/mobile/goods/info',
  }
  const base = routeMap[a.related_type.split('_')[0]] || '/mobile/dashboard'
  router.push(base)
}

async function loadActivities(reset = false) {
  if (reset) {
    activities.value = []
    page.value = 1
    hasMore.value = true
  }
  if (!hasMore.value || loading.value) return
  loading.value = true

  try {
    const params: any = {
      list_rows: 30,
      page: page.value,
    }
    if (dateRange.value) params.from_date = getDateFrom()
    if (activeTab.value === 'mine') params.user_id = authStore.userInfo?.id
    if (activeTab.value === 'team') params.scope = 'team'

    const res = await http.get('/mobile/operation-logs', { params })
    const rows = res?.data?.rows ?? res?.rows ?? []
    const total = res?.data?.total ?? res?.total ?? 0

    if (reset) {
      activities.value = rows
    } else {
      activities.value.push(...rows)
    }

    hasMore.value = activities.value.length < total
    page.value++
  } catch (e) {
    console.error('Failed to load activities', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadActivities(true)
})
</script>

<style scoped>
.m-activity { min-height: 100%; background: #f5f5f7; padding-bottom: 80px; }

.m-activity-tabs {
  display: flex;
  background: #fff;
  padding: 0 16px;
  border-bottom: 1px solid #f2f3f5;
  position: sticky;
  top: 0;
  z-index: 5;
}
.m-activity-tab {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #86909c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.m-activity-tab.active { color: #0071e3; border-bottom-color: #0071e3; }

.m-activity-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fff;
  margin-bottom: 2px;
}
.m-activity-filter-date { display: flex; gap: 6px; }
.m-filter-btn {
  padding: 4px 12px;
  border: 1px solid #e5e6eb;
  background: transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #4e5969;
  cursor: pointer;
}
.m-filter-btn.active { background: #0071e3; color: #fff; border-color: #0071e3; }
.m-activity-count { font-size: 12px; color: #86909c; }

.m-activity-list { padding: 0 12px; }
.m-loading { text-align: center; padding: 40px 0; color: #86909c; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.m-loading-spinner {
  width: 28px; height: 28px;
  border: 3px solid #e5e6eb;
  border-top-color: #0071e3;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.m-empty { text-align: center; padding: 60px 0; }
.m-empty-icon { font-size: 48px; margin-bottom: 12px; }
.m-empty-title { font-size: 16px; font-weight: 700; color: #1d2129; margin-bottom: 4px; }
.m-empty-sub { font-size: 13px; color: #86909c; }

.m-activity-group { margin-bottom: 12px; }
.m-activity-date-label {
  font-size: 13px;
  font-weight: 700;
  color: #1d2129;
  padding: 12px 4px 6px;
}
.m-activity-date-count {
  font-size: 11px;
  color: #86909c;
  margin-bottom: 4px;
  padding: 0 4px;
}

.m-activity-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-activity-item:active { background: #f5f5f7; }
.m-activity-avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}
.m-activity-content { flex: 1; min-width: 0; }
.m-activity-top { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.m-activity-user { font-size: 14px; font-weight: 700; color: #1d2129; }
.m-activity-action { font-size: 14px; color: #4e5969; }
.m-activity-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
}
.m-activity-badge.type-sale { background: #dbeafe; color: #1d4ed8; }
.m-activity-badge.type-procure { background: #fef3c7; color: #92400e; }
.m-activity-badge.type-warehouse { background: #d1fae5; color: #065f46; }
.m-activity-badge.type-ai { background: #ede9fe; color: #6d28d9; }
.m-activity-badge.type-task { background: #ffe4e6; color: #be123c; }
.m-activity-badge.type-default { background: #f2f3f5; color: #4e5969; }
.m-activity-detail { font-size: 13px; color: #86909c; margin-bottom: 4px; }
.m-activity-time { font-size: 11px; color: #c2c8d5; }
.m-activity-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  flex-shrink: 0;
}
.m-activity-status.status-pending { background: #fef3c7; color: #92400e; }
.m-activity-status.status-ok { background: #d1fae5; color: #065f46; }
.m-activity-status.status-reject { background: #fee2e2; color: #991b1b; }

.m-load-more {
  text-align: center;
  font-size: 14px;
  color: #0071e3;
  font-weight: 600;
  padding: 16px;
  cursor: pointer;
}
</style>
