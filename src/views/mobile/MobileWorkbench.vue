<template>
  <div class="wb-page">
    <div class="wb-scroll">
    <!-- 收银台入口 -->
    <div class="wb-cashier-card" @click="go('/cashregister')">
      <div class="wb-cashier-left">
        <div class="wb-cashier-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
            <rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            <line x1="6" y1="14" x2="12" y2="14"/><line x1="6" y1="17" x2="10" y2="17"/>
          </svg>
        </div>
        <div class="wb-cashier-info">
          <div class="wb-cashier-title">收银台</div>
          <div class="wb-cashier-sub">扫码收款 · 订单结算 · 会员核销</div>
        </div>
      </div>
      <div class="wb-cashier-arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5"><polyline points="9 18 15 12 9 6"/></svg>
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

    <!-- 团队动态 -->
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

    <!-- 常用功能（横向滚动显示全部模块） -->
    <div class="wb-section">
      <div class="wb-section-hd">
        <span class="wb-section-dot" style="background: #F5A623"></span>
        <span class="wb-section-title">常用功能</span>
        <button class="wb-section-more" @click="showPicker = true">管理 ›</button>
      </div>
      <div class="wb-fav-scroll">
        <div
          v-for="app in allModuleApps"
          :key="app.path"
          class="wb-fav-item"
          @click="go(app.path)"
        >
          <div class="wb-fav-icon" :style="{ background: app.bg }">
            <span v-html="app.icon" />
          </div>
          <div class="wb-fav-name">{{ app.name }}</div>
        </div>
      </div>
    </div>

    <!-- 常用功能选择器 -->
    <Teleport to="body">
      <div v-if="showPicker" class="fav-overlay" @click.self="showPicker = false">
        <div class="fav-sheet">
          <div class="fav-sheet-hd">
            <span class="fav-sheet-title">管理常用功能</span>
            <button class="fav-sheet-close" @click="showPicker = false">完成</button>
          </div>
          <div class="fav-sheet-grid">
            <div
              v-for="app in allModuleApps"
              :key="app.path"
              class="fav-sheet-item"
              :class="{ 'fav-sheet-item--on': isFav(app.path) }"
              @click="toggleFav(app)"
            >
              <div class="fav-sheet-icon" :style="{ background: app.bg }">
                <span v-html="app.icon" />
                <div v-if="isFav(app.path)" class="fav-sheet-check">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div class="fav-sheet-name">{{ app.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 快捷操作（九宫格） -->
    <div class="wb-section">
      <div class="wb-section-hd">
        <span class="wb-section-dot" style="background: #2E6BE6"></span>
        <span class="wb-section-title">快捷操作</span>
        <button class="wb-section-more" @click="showPicker = true">管理 ›</button>
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
      </div>
    </div>

    <div style="height: 20px"></div>
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

function parseGoodsInfo(g: any) {
  if (Array.isArray(g)) return g
  if (typeof g !== 'string' || !g) return []
  try { return JSON.parse(g) } catch { return [] }
}

const kpi = ref({ todaySale: '0', todayOrders: 0, customerTotal: 0, stockWarn: 0 })
const pendingItems = ref<any[]>([])
const activities = ref<any[]>([])
const showPicker = ref(false)

// 所有可用模块
const allModuleApps = [
  { name: '销售出库', path: '/mobile/sale/out', bg: 'rgba(0,113,227,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' },
  { name: '采购订单', path: '/mobile/procure/order', bg: 'rgba(124,58,237,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>' },
  { name: '采购入库', path: '/mobile/procure/inhouse', bg: 'rgba(8,145,178,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
  { name: '仓库管理', path: '/mobile/warehouse/stock', bg: 'rgba(5,150,105,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  { name: '财务总览', path: '/mobile/finance/overview', bg: 'rgba(217,119,6,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { name: '应收账款', path: '/mobile/finance/receivable', bg: 'rgba(220,38,38,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' },
  { name: '客户管理', path: '/mobile/sale/client', bg: 'rgba(0,113,227,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
  { name: '商品资料', path: '/mobile/goods/info', bg: 'rgba(249,115,22,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
  { name: '品牌管理', path: '/mobile/goods/brand', bg: 'rgba(124,58,237,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
  { name: '人事管理', path: '/mobile/personnel/staff', bg: 'rgba(0,113,227,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { name: '生产计划', path: '/mobile/production/plan', bg: 'rgba(5,150,105,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { name: '投资管理', path: '/mobile/investment/overview', bg: 'rgba(249,115,22,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
  { name: '消息中心', path: '/mobile/message', bg: 'rgba(0,113,227,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
  { name: '任务中心', path: '/mobile/task', bg: 'rgba(8,145,178,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { name: 'AI 助手', path: '/mobile/ai', bg: 'rgba(124,58,237,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/></svg>' },
]

function loadFavs() {
  try {
    return JSON.parse(localStorage.getItem('wb_favs') || '[]')
  } catch { return [] }
}

function saveFavs(paths: string[]) {
  localStorage.setItem('wb_favs', JSON.stringify(paths))
}

const favoriteApps = ref<any[]>(loadFavs())

function isFav(path: string) {
  return favoriteApps.value.some(f => f.path === path)
}

function toggleFav(app: any) {
  if (isFav(app.path)) {
    favoriteApps.value = favoriteApps.value.filter(f => f.path !== app.path)
  } else {
    favoriteApps.value = [...favoriteApps.value, app]
  }
  saveFavs(favoriteApps.value.map(f => f.path))
}

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
  { name: '销售出库', path: '/mobile/sale/out', bg: 'rgba(0,113,227,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' },
  { name: '采购订单', path: '/mobile/procure/order', bg: 'rgba(124,58,237,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>' },
  { name: '采购入库', path: '/mobile/procure/inhouse', bg: 'rgba(8,145,178,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
  { name: '仓库管理', path: '/mobile/warehouse/stock', bg: 'rgba(5,150,105,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  { name: '财务总览', path: '/mobile/finance/overview', bg: 'rgba(217,119,6,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
  { name: '应收账款', path: '/mobile/finance/receivable', bg: 'rgba(220,38,38,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' },
  { name: '客户管理', path: '/mobile/sale/client', bg: 'rgba(0,113,227,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' },
  { name: '商品资料', path: '/mobile/goods/info', bg: 'rgba(249,115,22,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
  { name: '品牌管理', path: '/mobile/goods/brand', bg: 'rgba(124,58,237,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
  { name: '人事管理', path: '/mobile/personnel/staff', bg: 'rgba(0,113,227,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { name: '生产计划', path: '/mobile/production/plan', bg: 'rgba(5,150,105,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { name: '投资管理', path: '/mobile/investment/overview', bg: 'rgba(249,115,22,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
  { name: '消息中心', path: '/mobile/message', bg: 'rgba(0,113,227,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
  { name: '任务中心', path: '/mobile/task', bg: 'rgba(8,145,178,0.08)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
  { name: 'AI 助手', path: '/mobile/ai', bg: 'rgba(124,58,237,0.1)', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>' },
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
  const type = a.action_type?.split('_')[0] || ''
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
  const route = routeMap[type] || '/mobile/workbench'
  router.push(route)
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

  const todaySales = saleRows.filter((r: any) => Number(r.status) === 1 && (r.out_date || '').slice(0, 10) === todayStr)
  const todayRetail = retailRows.filter((r: any) => Number(r.status) === 1 && (r.order_date || '').slice(0, 10) === todayStr)
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
    (parseGoodsInfo(r.goods_info)).forEach((i: any) => {
      stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) + Number(i.num || 0)
    })
  })
  ;[...saleRows, ...retailRows].forEach((r: any) => {
    if (Number(r.status) !== 1) return
    ;(parseGoodsInfo(r.goods_info)).forEach((i: any) => {
      stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) - Number(i.num || 0)
    })
  })
  kpi.value.stockWarn = goodsRows.filter((g: any) => (stockMap[g.id] ?? 0) <= 0).length

  // 待处理
  pendingItems.value = []
  const pendingProcure = procureRows.filter((r: any) => Number(r.status) === 0)
  const pendingRetail = retailRows.filter((r: any) => Number(r.status) === 0)
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
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
  overflow: hidden;
}
.wb-scroll {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}

/* ── 收银台入口卡片 ── */
.wb-cashier-card {
  margin: 0 12px 12px;
  padding: 16px;
  background: linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
  transition: transform 0.15s, box-shadow 0.15s;
}
.wb-cashier-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}
.wb-cashier-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.wb-cashier-icon {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.wb-cashier-info {}
.wb-cashier-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 3px;
}
.wb-cashier-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}
.wb-cashier-arrow {
  color: #fff;
  flex-shrink: 0;
  margin-left: 8px;
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

/* ── 常用功能横向滚动 ── */
.wb-fav-scroll {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.wb-fav-scroll::-webkit-scrollbar { display: none; }
.wb-fav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.wb-fav-item:active .wb-fav-icon { opacity: 0.7; }
.wb-fav-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}
.wb-fav-name {
  font-size: 12px;
  color: #333;
  text-align: center;
  max-width: 52px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 常用功能选择器 ── */
.fav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}
.fav-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.fav-sheet-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}
.fav-sheet-title { font-size: 16px; font-weight: 600; color: #1d2129; }
.fav-sheet-close {
  border: none;
  background: #2E6BE6;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 5px 14px;
  border-radius: 16px;
  cursor: pointer;
}
.fav-sheet-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  padding: 12px 12px 24px;
}
.fav-sheet-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px;
  cursor: pointer;
  border-radius: 10px;
  transition: background 0.15s;
}
.fav-sheet-item:active { background: #f5f5f5; }
.fav-sheet-item--on .fav-sheet-icon { box-shadow: 0 0 0 2px #2E6BE6; }
.fav-sheet-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.fav-sheet-check {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: #2E6BE6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}
.fav-sheet-name {
  font-size: 12px;
  color: #333;
  text-align: center;
  max-width: 60px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wb-empty-sm { text-align: center; padding: 16px; color: #bbb; font-size: 13px; }

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
