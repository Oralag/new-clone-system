<template>
  <div class="ops-orders-page">
    <section class="hero">
      <div>
        <span class="hero-kicker">订单中心</span>
        <div class="hero-title">聚合多平台订单</div>
        <div class="hero-desc">统一处理各平台订单，回到原有 ERP 发货和审核链路。</div>
      </div>
      <div class="hero-actions">
        <button class="ghost-btn" @click="router.push('/ecommerce/overview')">返回总览</button>
      </div>
    </section>

    <section class="filter-bar">
      <el-select v-model="filter.platform" size="small" placeholder="全部平台" style="width:120px" clearable>
        <el-option label="全部平台" value="" />
        <el-option label="淘宝" value="taobao" />
        <el-option label="京东" value="jd" />
        <el-option label="拼多多" value="pdd" />
        <el-option label="抖音" value="douyin" />
        <el-option label="快手" value="kuaishou" />
        <el-option label="微信小店" value="wxd" />
      </el-select>
      <el-select v-model="filter.status" size="small" placeholder="订单状态" style="width:120px" clearable>
        <el-option label="全部" value="" />
        <el-option label="待发货" value="pending" />
        <el-option label="已发货" value="shipped" />
        <el-option label="已完成" value="completed" />
        <el-option label="已退款" value="refunded" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-date-picker v-model="filter.dateRange" type="daterange" size="small" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:220px" />
      <el-input v-model="filter.keyword" size="small" placeholder="订单号/商品/客户" style="width:160px" clearable />
      <button class="ghost-btn small" @click="loadOrders">搜索</button>
    </section>

    <section class="stat-row">
      <div class="stat-chip">
        <span class="chip-val">{{ stats.total }}</span>
        <span class="chip-lbl">总订单</span>
      </div>
      <div class="stat-chip pending">
        <span class="chip-val">{{ stats.pending }}</span>
        <span class="chip-lbl">待发货</span>
      </div>
      <div class="stat-chip shipped">
        <span class="chip-val">{{ stats.shipped }}</span>
        <span class="chip-lbl">已发货</span>
      </div>
      <div class="stat-chip completed">
        <span class="chip-val">{{ stats.completed }}</span>
        <span class="chip-lbl">已完成</span>
      </div>
      <div class="stat-chip refunded">
        <span class="chip-val">{{ stats.refunded }}</span>
        <span class="chip-lbl">退款</span>
      </div>
    </section>

    <section class="orders-list">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="notConfigured" class="empty-state config-tip">
        <div class="tip-icon">🔌</div>
        <div class="tip-text">拼多多尚未接入</div>
        <div class="tip-sub">请先在「平台接入」页保存 PDD 开放平台凭证</div>
        <button class="ghost-btn" style="margin-top:12px" @click="router.push('/ecommerce/platforms')">去接入 →</button>
      </div>
      <div v-else-if="!orders.length" class="empty-state">暂无匹配到订单。</div>
      <div v-else>
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-hd">
            <div class="order-left">
              <span class="platform-tag" :style="{ background: getPlatformColor(order.platform) }">{{ getPlatformName(order.platform) }}</span>
              <span class="order-no">{{ order.orderNo }}</span>
            </div>
            <div class="order-right">
              <span class="order-time">{{ order.createdAt }}</span>
              <span class="status-badge" :class="'status-' + order.status">{{ getStatusText(order.status) }}</span>
            </div>
          </div>
          <div class="order-body">
            <div class="order-goods">
              <div v-for="g in order.goods" :key="g.name" class="goods-item">
                <span class="goods-name">{{ g.name }}</span>
                <span class="goods-qty">×{{ g.qty }}</span>
              </div>
            </div>
            <div class="order-amount">
              <div class="amount-val">¥{{ order.amount?.toFixed(2) }}</div>
              <div class="amount-lbl">{{ order.goods.length }}件商品</div>
            </div>
          </div>
          <div class="order-ft">
            <span class="customer-name">{{ order.customerName }}</span>
            <div class="order-actions">
              <button v-if="order.status === 'pending'" class="ghost-btn small" @click="shipOrder(order)">去发货</button>
              <button class="ghost-btn small" @click="viewOrder(order)">查看</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="pagination-wrap">
      <el-pagination
        v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadOrders" @current-change="loadOrders"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const orders = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const notConfigured = ref(false)

const filter = reactive({
  platform: 'pdd',  // 目前只有 PDD 直连，默认筛选 PDD
  status: '',
  dateRange: [] as string[],
  keyword: '',
})

const stats = ref({ total: 0, pending: 0, shipped: 0, completed: 0, refunded: 0 })

const platformMap: Record<string, { name: string; color: string }> = {
  taobao: { name: '淘宝', color: '#ff5000' },
  jd: { name: '京东', color: '#e2231a' },
  pdd: { name: '拼多多', color: '#e02020' },
  douyin: { name: '抖音', color: '#161823' },
  kuaishou: { name: '快手', color: '#ff6600' },
  wxd: { name: '微信小店', color: '#07c160' },
}

// PDD 状态码 → 通用状态
const PDD_STATUS_MAP: Record<string, number> = {
  pending: 2, shipped: 3, completed: 5, refunded: 14,
}

const statusMap: Record<string, string> = {
  pending: '待发货', shipped: '已发货', completed: '已完成',
  refunded: '已退款', cancelled: '已取消',
}

function getPlatformName(p: string) { return platformMap[p]?.name || p }
function getPlatformColor(p: string) { return platformMap[p]?.color || '#999' }
function getStatusText(s: string) { return statusMap[s] || s }

// 日期范围 → 天数（最近 N 天）
function datesToDays(): number {
  if (filter.dateRange?.length === 2 && filter.dateRange[0]) {
    const start = new Date(filter.dateRange[0]).getTime()
    return Math.max(1, Math.ceil((Date.now() - start) / 86400000))
  }
  return 7
}

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  loading.value = true
  notConfigured.value = false
  try {
    // 当前只支持 PDD 直连，其他平台暂时显示空
    if (filter.platform && filter.platform !== 'pdd') {
      orders.value = []
      total.value = 0
      return
    }

    const params = new URLSearchParams({
      page: String(page.value),
      page_size: String(pageSize.value),
      days: String(datesToDays()),
    })
    if (filter.status) params.set('order_status', String(PDD_STATUS_MAP[filter.status] ?? ''))
    if (filter.keyword) params.set('keyword', filter.keyword)

    const res = await fetch(`/api/pdd/orders?${params}`)
    const data = await res.json() as any

    if (!res.ok) {
      if (data.not_configured) {
        notConfigured.value = true
        orders.value = []
        return
      }
      throw new Error(data.error || '拉取失败')
    }

    orders.value = data.list || []
    total.value = data.total || 0
    if (data.stats) stats.value = data.stats
  } catch (e: any) {
    orders.value = []
  } finally {
    loading.value = false
  }
}

function shipOrder(_order: any) {
  router.push('/sale/out')
}

function viewOrder(_order: any) {
  router.push('/sale/contract')
}
</script>

<style scoped>
.ops-orders-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.18), transparent 30%),
    linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.hero-kicker {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(13, 148, 136, 0.1);
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.hero-desc {
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
}

.hero-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.stat-row {
  display: flex;
  gap: 10px;
}

.stat-chip {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chip-val {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.chip-lbl {
  font-size: 11px;
  color: #64748b;
}

.stat-chip.pending { border-left: 3px solid #f59e0b; }
.stat-chip.shipped { border-left: 3px solid #3b82f6; }
.stat-chip.completed { border-left: 3px solid #10b981; }
.stat-chip.refunded { border-left: 3px solid #ef4444; }

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-card {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  padding: 16px;
}

.order-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-tag {
  font-size: 11px;
  color: #fff;
  padding: 3px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.order-no {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
}

.order-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-time {
  font-size: 12px;
  color: #64748b;
}

.status-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.status-pending { background: #fef3c7; color: #d97706; }
.status-shipped { background: #dbeafe; color: #2563eb; }
.status-completed { background: #d1fae5; color: #059669; }
.status-refunded { background: #fee2e2; color: #dc2626; }
.status-cancelled { background: #f3f4f6; color: #9ca3af; }

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-goods {
  flex: 1;
}

.goods-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  margin-bottom: 2px;
}

.goods-qty {
  color: #64748b;
}

.order-amount {
  text-align: right;
}

.amount-val {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.amount-lbl {
  font-size: 11px;
  color: #64748b;
}

.order-ft {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
}

.customer-name {
  font-size: 12px;
  color: #475569;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-size: 13px;
}

.config-tip {
  padding: 48px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.94);
  border-radius: 20px;
  border: 1px solid rgba(148,163,184,0.14);
}

.tip-icon { font-size: 36px; margin-bottom: 4px; }
.tip-text { font-size: 16px; font-weight: 700; color: #0f172a; }
.tip-sub  { font-size: 13px; color: #64748b; }

.ghost-btn {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: #fff;
  color: #334155;
}
.ghost-btn.small {
  padding: 8px 12px;
  font-size: 12px;
}
.ghost-btn:hover {
  background: #f1f5f9;
}
</style>
