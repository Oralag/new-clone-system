<template>
  <div class="wb-page">
    <!-- 顶部背景区（企业微信蓝色头部，含头像卡片） -->
    <div class="wb-header" @click="router.push('/mobile/my')">
      <div class="wb-profile-row">
        <div class="wb-avatar">{{ authStore.userName?.[0] || '我' }}</div>
        <div class="wb-profile-info">
          <span class="wb-hi">{{ greeting }}, {{ authStore.userName }}</span>
          <span class="wb-company">{{ authStore.companyName || '数字游牧' }}</span>
        </div>
        <span class="wb-profile-arrow">›</span>
      </div>
      <div class="wb-date-row">
        <span class="wb-date">{{ today }}</span>
        <span class="wb-weekday">{{ weekday }}</span>
      </div>
    </div>

    <!-- 今日概况（卡片式，企业微信风格） -->
    <div class="wb-cards">
      <div class="wb-card wb-card--primary" @click="go('/mobile/sale/overview')">
        <div class="wb-card-label">今日销售</div>
        <div class="wb-card-value">¥{{ kpi.todaySale }}</div>
        <div class="wb-card-sub">{{ kpi.todayOrders }} 笔订单</div>
      </div>
      <div class="wb-card-sub-stack">
        <div class="wb-card wb-card--sm" @click="go('/mobile/sale/client')">
          <div class="wb-card-label">客户总数</div>
          <div class="wb-card-value-sm">{{ kpi.customerTotal }}</div>
        </div>
        <div class="wb-card wb-card--sm" :class="{ warn: kpi.stockWarn > 0 }" @click="go('/mobile/warehouse/warning')">
          <div class="wb-card-label">库存预警</div>
          <div class="wb-card-value-sm">{{ kpi.stockWarn }}</div>
        </div>
      </div>
    </div>

    <!-- 待办提醒 -->
    <div v-if="pendingItems.length > 0" class="wb-section">
      <div class="wb-section-hd">
        <span class="wb-section-dot"></span>
        <span class="wb-section-title">待办提醒</span>
        <span class="wb-section-count">{{ pendingItems.length }}</span>
      </div>
      <div class="wb-todo-list">
        <div
          v-for="item in pendingItems"
          :key="item.id"
          class="wb-todo-item"
          @click="go(item.route)"
        >
          <div class="wb-todo-icon" :style="{ background: item.color }">
            <span v-html="item.icon" />
          </div>
          <div class="wb-todo-body">
            <div class="wb-todo-title">{{ item.title }}</div>
            <div class="wb-todo-sub">{{ item.sub }}</div>
          </div>
          <div class="wb-todo-arrow">›</div>
        </div>
      </div>
    </div>

    <!-- 快捷操作（企业微信九宫格） -->
    <div class="wb-section">
      <div class="wb-section-hd">
        <span class="wb-section-dot" style="background: #F5A623"></span>
        <span class="wb-section-title">快捷操作</span>
      </div>
      <div class="wb-quick-grid">
        <div
          v-for="app in quickApps"
          :key="app.path"
          class="wb-quick-item"
          @click="go(app.path)"
        >
          <div class="wb-quick-icon" :style="{ background: app.bg }">
            <span v-html="app.icon" />
          </div>
          <div class="wb-quick-name">{{ app.name }}</div>
        </div>
        <!-- 更多应用 -->
        <div class="wb-quick-item" @click="go('/mobile/apps')">
          <div class="wb-quick-icon" style="background: rgba(0,0,0,0.04)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.8">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <div class="wb-quick-name" style="color: #999">更多应用</div>
        </div>
      </div>
    </div>

    <!-- 工作动态 -->
    <div class="wb-section">
      <div class="wb-section-hd">
        <span class="wb-section-dot" style="background: #52C41A"></span>
        <span class="wb-section-title">团队动态</span>
        <button class="wb-section-more" @click="go('/mobile/activity')">更多 ›</button>
      </div>
      <div v-if="activities.length === 0" class="wb-empty">暂无动态</div>
      <div v-else class="wb-feed-list">
        <div
          v-for="a in activities"
          :key="a.id"
          class="wb-feed-item"
          @click="handleActivityClick(a)"
        >
          <div class="wb-feed-avatar">{{ a.user_name?.[0] || '?' }}</div>
          <div class="wb-feed-body">
            <div class="wb-feed-top">
              <span class="wb-feed-name">{{ a.user_name }}</span>
              <span class="wb-feed-action">{{ a.action_name }}</span>
            </div>
            <div class="wb-feed-desc" v-if="a.description">{{ a.description }}</div>
            <div class="wb-feed-time">{{ formatTime(a.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部占位 -->
    <div style="height: 20px"></div>
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

const quickApps = [
  { name: '销售出库', path: '/mobile/sale/out', bg: 'rgba(46,107,230,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' },
  { name: '采购订单', path: '/mobile/procure/order', bg: 'rgba(46,107,230,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>' },
  { name: '采购入库', path: '/mobile/procure/inhouse', bg: 'rgba(46,107,230,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
  { name: '库存查询', path: '/mobile/warehouse/stock', bg: 'rgba(46,107,230,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
  { name: '应收账款', path: '/mobile/finance/receivable', bg: 'rgba(245,63,63,0.06)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f53f3f" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { name: '客户管理', path: '/mobile/sale/client', bg: 'rgba(46,107,230,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
  { name: '商品资料', path: '/mobile/goods/info', bg: 'rgba(46,107,230,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
  { name: '财务总览', path: '/mobile/finance/overview', bg: 'rgba(46,107,230,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
]

function go(path: string) { router.push(path) }

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

function handleActivityClick(a: any) {
  if (a.action_type?.startsWith('sale')) router.push('/mobile/sale/out')
  else if (a.action_type?.startsWith('procure')) router.push('/mobile/procure/order')
}

function fmt(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return n >= 0 ? n.toFixed(2) : '0'
}

onMounted(async () => {
  const todayStr = new Date().toISOString().slice(0, 10)

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
  const goodsRows = getRows(goodsRes)
  const procureRows = getRows(procureRes)

  const todaySales = saleRows.filter((r: any) => (r.out_date || '').slice(0, 10) === todayStr)
  const todayRetail = retailRows.filter((r: any) => (r.order_date || '').slice(0, 10) === todayStr)
  kpi.value.todayOrders = todaySales.length + todayRetail.length
  const totalSale = todaySales.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
  const totalRetail = todayRetail.reduce((s: number, r: any) => s + Number(r.pay_amount || r.total_amount || 0), 0)
  kpi.value.todaySale = fmt(totalSale + totalRetail)

  if (custRes.status === 'fulfilled') {
    kpi.value.customerTotal = custRes.value?.data?.total ?? custRes.value?.total ?? 0
  }

  // 库存预警
  const stockMap: Record<number, number> = {}
  procureRows.filter((r: any) => Number(r.status) === 1).forEach((r: any) => {
    (JSON.parse(r.goods_info || '[]')).forEach((i: any) => {
      stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) + Number(i.num || 0)
    })
  })
  ;[...saleRows, ...retailRows].forEach((r: any) => {
    if (r.out_date !== undefined && Number(r.status) !== 1) return
    ;(JSON.parse(r.goods_info || '[]')).forEach((i: any) => {
      stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) - Number(i.num || 0)
    })
  })
  kpi.value.stockWarn = goodsRows.filter((g: any) => (stockMap[g.id] ?? 0) <= 0).length

  // 待处理
  pendingItems.value = []
  const pendingProcure = procureRows.filter((r: any) => Number(r.status) === 0)
  if (pendingProcure.length > 0) {
    pendingItems.value.push({
      id: 'procure',
      title: `采购入库待审核 ${pendingProcure.length} 笔`,
      sub: `合计 ¥${pendingProcure.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0).toFixed(0)}`,
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      color: '#F5A623',
      route: '/mobile/procure/inhouse',
    })
  }
  const pendingSales = saleRows.filter((r: any) => Number(r.status) === 0)
  if (pendingSales.length > 0) {
    pendingItems.value.push({
      id: 'sale',
      title: `销售出库待审核 ${pendingSales.length} 笔`,
      sub: `合计 ¥${pendingSales.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0).toFixed(0)}`,
      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
      color: '#2E6BE6',
      route: '/mobile/sale/out',
    })
  }

  // 通知未读数
  if (pendingItems.value.length > 0 && typeof uni !== 'undefined') {
    uni.$emit('update:pending', pendingItems.value.length)
  }

  // 工作动态
  try {
    const actRes = await http.get('/mobile/operation-logs', { params: { list_rows: 10 } })
    activities.value = actRes?.data?.rows ?? actRes?.rows ?? []
  } catch { /* 忽略 */ }
})
</script>

<style scoped>
.wb-page {
  background: #f5f5f5;
  min-height: 100%;
  padding-bottom: 0;
}

/* ── 蓝色头部 ── */
.wb-header {
  background: linear-gradient(135deg, #2E6BE6 0%, #1B4FCC 100%);
  padding: 20px 16px 28px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.wb-profile-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.wb-avatar {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
  border: 2px solid rgba(255,255,255,0.3);
}
.wb-profile-info { flex: 1; }
.wb-hi {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
  display: block;
  margin-bottom: 2px;
}
.wb-company {
  font-size: 13px;
  color: rgba(255,255,255,0.65);
  display: block;
}
.wb-profile-arrow {
  font-size: 22px;
  color: rgba(255,255,255,0.5);
  flex-shrink: 0;
}
.wb-date-row { display: flex; align-items: center; gap: 8px; }
.wb-date { font-size: 13px; color: rgba(255,255,255,0.75); }
.wb-weekday { font-size: 13px; color: rgba(255,255,255,0.6); }

/* ── KPI 卡片 ── */
.wb-cards {
  display: flex;
  gap: 10px;
  padding: 0 14px;
  margin-top: -18px;
  margin-bottom: 14px;
}
.wb-card {
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.wb-card:active { background: #fafafa; }
.wb-card--primary {
  flex: 1.3;
  padding: 16px 16px 14px;
}
.wb-card-sub-stack { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.wb-card--sm { padding: 12px 14px; }
.wb-card-label { font-size: 12px; color: #999; margin-bottom: 4px; }
.wb-card-value { font-size: 26px; font-weight: 700; color: #1d2129; letter-spacing: -0.03em; line-height: 1.1; }
.wb-card-sub { font-size: 11px; color: #999; margin-top: 2px; }
.wb-card-value-sm { font-size: 18px; font-weight: 700; color: #1d2129; letter-spacing: -0.03em; }
.wb-card.warn .wb-card-value-sm { color: #f53f3f; }

/* ── 分区 ── */
.wb-section {
  background: #fff;
  margin-bottom: 10px;
}
.wb-section-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f0f0f0;
}
.wb-section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2E6BE6;
  flex-shrink: 0;
}
.wb-section-title { font-size: 14px; font-weight: 600; color: #1d2129; flex: 1; }
.wb-section-count {
  min-width: 18px;
  height: 18px;
  background: #f53f3f;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}
.wb-section-more {
  border: none;
  background: transparent;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

/* ── 待办列表 ── */
.wb-todo-list { padding: 4px 0; }
.wb-todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.wb-todo-item:active { background: #f5f5f5; }
.wb-todo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wb-todo-body { flex: 1; min-width: 0; }
.wb-todo-title { font-size: 14px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wb-todo-sub { font-size: 12px; color: #999; margin-top: 2px; }
.wb-todo-arrow { font-size: 18px; color: #ccc; flex-shrink: 0; }

/* ── 快捷操作九宫格 ── */
.wb-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: #f0f0f0;
  padding: 1px 0;
}
.wb-quick-item {
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 4px 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.wb-quick-item:active { background: #f5f5f5; }
.wb-quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wb-quick-name {
  font-size: 12px;
  color: #333;
  text-align: center;
  line-height: 1.2;
}

/* ── 动态列表 ── */
.wb-empty { text-align: center; padding: 24px; color: #999; font-size: 13px; }
.wb-feed-list { padding: 4px 0; }
.wb-feed-item {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.wb-feed-item:active { background: #f5f5f5; }
.wb-feed-avatar {
  width: 36px;
  height: 36px;
  background: #2E6BE6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
.wb-feed-body { flex: 1; min-width: 0; }
.wb-feed-top { display: flex; align-items: baseline; gap: 4px; flex-wrap: wrap; }
.wb-feed-name { font-size: 14px; font-weight: 600; color: #1d2129; }
.wb-feed-action { font-size: 13px; color: #666; }
.wb-feed-desc { font-size: 13px; color: #666; margin-top: 3px; line-height: 1.4; }
.wb-feed-time { font-size: 12px; color: #bbb; margin-top: 3px; }
</style>
