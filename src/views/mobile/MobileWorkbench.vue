<template>
  <div class="m-workbench">
    <!-- 个性化问候 -->
    <div class="m-greeting">
      <div class="m-greeting-text">
        <div class="m-greeting-hi">{{ greeting }}, {{ authStore.userName }}</div>
        <div class="m-greeting-date">{{ today }} {{ weekday }}</div>
      </div>
      <div class="m-greeting-avatar" @click="router.push('/mobile/my')">
        {{ authStore.userName?.[0] || '我' }}
      </div>
    </div>

    <!-- 今日核心指标 -->
    <div class="m-kpi-row">
      <div class="m-kpi-card m-kpi-primary" @click="router.push('/mobile/activity')">
        <div class="m-kpi-label">今日销售</div>
        <div class="m-kpi-value">¥{{ kpi.todaySale }}</div>
        <div class="m-kpi-sub">{{ kpi.todayOrders }} 笔订单</div>
      </div>
      <div class="m-kpi-right-stack">
        <div class="m-kpi-card m-kpi-small" @click="router.push('/sale/client')">
          <div class="m-kpi-label">客户总数</div>
          <div class="m-kpi-value-sm">{{ kpi.customerTotal }}</div>
        </div>
        <div class="m-kpi-card m-kpi-small" :class="{ warn: kpi.stockWarn > 0 }" @click="router.push('/warehouse/warning')">
          <div class="m-kpi-label">库存预警</div>
          <div class="m-kpi-value-sm">{{ kpi.stockWarn }}</div>
        </div>
      </div>
    </div>

    <!-- 待处理 -->
    <div v-if="pendingItems.length > 0" class="m-section">
      <div class="m-section-header">
        <span class="m-section-title">⏰ 待处理</span>
        <span class="m-section-badge">{{ pendingItems.length }}</span>
        <button class="m-section-more" @click="router.push('/mobile/activity')">全部 ›</button>
      </div>
      <div class="m-pending-list">
        <div v-for="item in pendingItems" :key="item.id" class="m-pending-item" @click="handlePendingClick(item)">
          <div class="m-pending-icon" :style="{ background: item.iconBg }">
            <span v-html="item.icon" />
          </div>
          <div class="m-pending-content">
            <div class="m-pending-title">{{ item.title }}</div>
            <div class="m-pending-sub">{{ item.sub }}</div>
          </div>
          <div class="m-pending-action">
            <span class="m-pending-btn">{{ item.actionText }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="m-section">
      <div class="m-section-header">
        <span class="m-section-title">📋 业务模块</span>
      </div>
      <div class="m-app-grid">
        <div v-for="app in appList" :key="app.path" class="m-app-item" @click="router.push(app.path)">
          <div class="m-app-icon" :style="{ background: app.bg }">
            <span v-html="app.icon" />
          </div>
          <div class="m-app-name">{{ app.name }}</div>
          <div v-if="app.badge" class="m-app-badge">{{ app.badge }}</div>
        </div>
      </div>
    </div>

    <!-- 工作动态 -->
    <div class="m-section">
      <div class="m-section-header">
        <span class="m-section-title">📰 团队动态</span>
        <button class="m-section-more" @click="router.push('/mobile/activity')">全部 ›</button>
      </div>
      <div v-if="activities.length === 0" class="m-empty">
        <div class="m-empty-icon">📭</div>
        <div class="m-empty-text">暂无动态</div>
      </div>
      <div v-else class="m-activity-list">
        <div v-for="a in activities" :key="a.id" class="m-activity-item" @click="handleActivityClick(a)">
          <div class="m-activity-avatar">{{ a.user_name?.[0] || '?' }}</div>
          <div class="m-activity-content">
            <div class="m-activity-title">
              <span class="m-activity-name">{{ a.user_name }}</span>
              <span class="m-activity-action">{{ a.action_name }}</span>
            </div>
            <div class="m-activity-time">{{ formatTime(a.created_at) }}</div>
          </div>
        </div>
      </div>
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

const kpi = ref({ todaySale: '0', todayOrders: 0, customerTotal: 0, stockWarn: 0 })
const pendingItems = ref<any[]>([])
const activities = ref<any[]>([])

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const today = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const weekday = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[new Date().getDay()]
})

const appList = [
  { name: '销售出库', path: '/sale/out', bg: 'rgba(0,113,227,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' },
  { name: '采购订单', path: '/procure/order', bg: 'rgba(124,58,237,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>' },
  { name: '采购入库', path: '/procure/inhouse', bg: 'rgba(8,145,178,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
  { name: '仓库管理', path: '/warehouse/stock', bg: 'rgba(5,150,105,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  { name: '财务总览', path: '/finance/overview', bg: 'rgba(217,119,6,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { name: '应收账款', path: '/finance/receivable', bg: 'rgba(220,38,38,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' },
  { name: '客户管理', path: '/sale/client', bg: 'rgba(0,113,227,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
  { name: '商品资料', path: '/goods/info', bg: 'rgba(249,115,22,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
  { name: '品牌管理', path: '/brand/brand', bg: 'rgba(124,58,237,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
  { name: '人事管理', path: '/personnel/staff', bg: 'rgba(0,113,227,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { name: '生产计划', path: '/production/plan', bg: 'rgba(5,150,105,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { name: '投资管理', path: '/investment/overview', bg: 'rgba(249,115,22,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
]

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function handlePendingClick(item: any) {
  if (item.route) router.push(item.route)
}

function handleActivityClick(a: any) {
  if (a.related_type && a.related_id) {
    // 跳转到相关单据
    if (a.action_type?.startsWith('sale')) router.push('/sale/out')
    else if (a.action_type?.startsWith('procure')) router.push('/procure/order')
  }
}

function fmt(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return n >= 0 ? n.toFixed(2) : '0'
}

onMounted(async () => {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const [saleRes, retailRes, custRes, goodsRes, procureRes] = await Promise.allSettled([
    http.get('/stock/SaleOutOrder/index', { params: { list_rows: 2000 } }),
    http.get('/retail/order/index', { params: { list_rows: 2000 } }),
    http.get('/shop/ShopCustomer/index', { params: { list_rows: 1 } }),
    http.get('/goods/ShopGoods/index', { params: { list_rows: 2000, status: 1 } }),
    http.get('/procure/ProcureInhouse/index', { params: { list_rows: 2000 } }),
  ])

  const getRows = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value?.data?.rows ?? r.value?.rows ?? []) : []
  const saleRows = getRows(saleRes)
  const retailRows = getRows(retailRes)

  const todaySales = saleRows.filter((r: any) => (r.out_date || '').slice(0, 10) === todayStr)
  const todayRetail = retailRows.filter((r: any) => (r.order_date || '').slice(0, 10) === todayStr)
  const totalSale = todaySales.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
  const totalRetail = todayRetail.reduce((s: number, r: any) => s + Number(r.pay_amount || r.total_amount || 0), 0)

  kpi.value.todaySale = fmt(totalSale + totalRetail)
  kpi.value.todayOrders = todaySales.length + todayRetail.length

  if (custRes.status === 'fulfilled') {
    kpi.value.customerTotal = custRes.value?.data?.total ?? custRes.value?.total ?? 0
  }

  // 库存预警
  const goodsRows = getRows(goodsRes)
  const procureRows = getRows(procureRes)
  const stockMap: Record<number, number> = {}
  procureRows.filter((r: any) => Number(r.status) === 1).forEach((r: any) => {
    (JSON.parse(r.goods_info || '[]')).forEach((i: any) => {
      stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) + Number(i.num || 0)
    })
  })
  ;[...saleRows, ...retailRows].forEach((r: any) => {
    if (r.out_date !== undefined && Number(r.status) !== 1) return
    (JSON.parse(r.goods_info || '[]')).forEach((i: any) => {
      stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) - Number(i.num || 0)
    })
  })
  kpi.value.stockWarn = goodsRows.filter((g: any) => (stockMap[g.id] ?? 0) <= 0).length

  // 待处理
  pendingItems.value = []
  // 检查采购入库待审核
  const pendingProcure = procureRows.filter((r: any) => Number(r.status) === 0)
  if (pendingProcure.length > 0) {
    pendingItems.value.push({
      id: 'procure',
      title: `采购入库待审核 ${pendingProcure.length} 笔`,
      sub: `合计 ¥${pendingProcure.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0).toFixed(0)}`,
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      iconBg: '#f97316',
      actionText: '去审核',
      route: '/procure/inhouse',
    })
  }
  // 销售待审核
  const pendingSales = saleRows.filter((r: any) => Number(r.status) === 0)
  if (pendingSales.length > 0) {
    pendingItems.value.push({
      id: 'sale',
      title: `销售出库待审核 ${pendingSales.length} 笔`,
      sub: `合计 ¥${pendingSales.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0).toFixed(0)}`,
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
      iconBg: '#0071e3',
      actionText: '去审核',
      route: '/sale/out',
    })
  }

  // 工作动态
  try {
    const actRes = await http.get('/mobile/operation-logs', { params: { list_rows: 10 } })
    activities.value = actRes?.data?.rows ?? actRes?.rows ?? []
  } catch { /* 忽略 */ }
})
</script>

<style scoped>
.m-workbench {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: 80px;
  background: #f5f5f7;
  min-height: 100%;
}

/* ── 问候 ── */
.m-greeting {
  background: linear-gradient(135deg, #0071e3 0%, #005bb5 100%);
  padding: 20px 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.m-greeting-hi { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.02em; margin-bottom: 4px; }
.m-greeting-date { font-size: 13px; color: rgba(255,255,255,0.65); }
.m-greeting-avatar {
  width: 44px; height: 44px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid rgba(255,255,255,0.4);
}

/* ── KPI ── */
.m-kpi-row {
  display: flex;
  gap: 10px;
  padding: 12px 12px 0;
}
.m-kpi-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-kpi-card:active { background: #f0f5ff; }
.m-kpi-primary { flex: 1.2; }
.m-kpi-right-stack { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.m-kpi-small { padding: 10px 12px; }
.m-kpi-label { font-size: 11px; font-weight: 600; color: #86909c; margin-bottom: 6px; }
.m-kpi-value { font-size: 26px; font-weight: 800; color: #1d2129; letter-spacing: -0.03em; margin-bottom: 3px; }
.m-kpi-sub { font-size: 11px; color: #86909c; }
.m-kpi-value-sm { font-size: 18px; font-weight: 800; color: #1d2129; letter-spacing: -0.03em; }
.m-kpi-card.warn .m-kpi-value-sm { color: #f53f3f; }

/* ── 通用区块 ── */
.m-section { padding: 16px 12px 0; }
.m-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.m-section-title { font-size: 15px; font-weight: 700; color: #1d2129; letter-spacing: -0.01em; }
.m-section-badge {
  background: #f53f3f;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  min-width: 18px;
  text-align: center;
}
.m-section-more {
  margin-left: auto;
  border: none;
  background: transparent;
  color: #86909c;
  font-size: 13px;
  cursor: pointer;
}

/* ── 待处理 ── */
.m-pending-list { display: flex; flex-direction: column; gap: 8px; }
.m-pending-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-pending-item:active { background: #f5f5f7; }
.m-pending-icon {
  width: 34px; height: 34px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.m-pending-content { flex: 1; min-width: 0; }
.m-pending-title { font-size: 13px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-pending-sub { font-size: 11px; color: #86909c; margin-top: 2px; }
.m-pending-btn {
  font-size: 12px;
  font-weight: 600;
  color: #0071e3;
  background: #e8f0fe;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

/* ── 应用网格 ── */
.m-app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.m-app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 4px 10px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}
.m-app-item:active { background: #f5f5f7; }
.m-app-icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.m-app-name { font-size: 11px; font-weight: 600; color: #4e5969; text-align: center; line-height: 1.2; }
.m-app-badge {
  position: absolute;
  top: 6px; right: 6px;
  min-width: 16px; height: 16px;
  background: #f53f3f;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
}

/* ── 动态 ── */
.m-activity-list { display: flex; flex-direction: column; gap: 0; }
.m-activity-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-activity-item:last-child { border-bottom: none; }
.m-activity-item:active { background: #f5f5f7; margin: 0 -12px; padding: 10px 12px; }
.m-activity-avatar {
  width: 32px; height: 32px;
  background: #0071e3;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.m-activity-content { flex: 1; min-width: 0; }
.m-activity-title { font-size: 13px; color: #1d2129; line-height: 1.5; }
.m-activity-name { font-weight: 600; }
.m-activity-action { color: #4e5969; }
.m-activity-time { font-size: 11px; color: #86909c; margin-top: 2px; }

/* ── 空状态 ── */
.m-empty { text-align: center; padding: 24px 0; }
.m-empty-icon { font-size: 32px; margin-bottom: 8px; }
.m-empty-text { font-size: 13px; color: #86909c; }
</style>
