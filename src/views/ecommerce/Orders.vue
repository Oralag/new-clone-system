<template>
  <div class="orders-page">
    <div class="page-header">
      <div class="page-title">📋 订单中心</div>
      <div class="page-desc">聚合6平台订单，统一处理发货、退款、退货</div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
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
      <el-button size="small" type="primary" @click="loadOrders">搜索</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-row">
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
    </div>

    <!-- 订单列表 -->
    <div class="orders-list">
      <div v-if="loading" class="loading-state">加载中…</div>
      <div v-else-if="!orders.length" class="empty-state">暂无订单</div>
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
              <div class="amount-val">¥{{ order.amount.toFixed(2) }}</div>
              <div class="amount-lbl">{{ order.goods.length }}件商品</div>
            </div>
          </div>
          <div class="order-ft">
            <span class="customer-name">{{ order.customerName }}</span>
            <div class="order-actions">
              <el-button v-if="order.status === 'pending'" size="small" type="primary" @click="shipOrder(order)">发货</el-button>
              <el-button size="small" @click="viewOrder(order)">详情</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadOrders" @current-change="loadOrders"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

const loading = ref(false)
const orders = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filter = reactive({
  platform: '',
  status: '',
  dateRange: [] as string[],
  keyword: '',
})

const stats = ref({ total: 0, pending: 0, shipped: 0, completed: 0, refunded: 0 })

const platformMap: Record<string, { name: string; color: string }> = {
  taobao: { name: '淘宝', color: '#ff5000' },
  jd: { name: '京东', color: '#e2231a' },
  pdd: { name: '拼多多', color: '#e2231a' },
  douyin: { name: '抖音', color: '#000000' },
  kuaishou: { name: '快手', color: '#ff0000' },
  wxd: { name: '微信小店', color: '#07c160' },
}

const statusMap: Record<string, string> = {
  pending: '待发货', shipped: '已发货', completed: '已完成',
  refunded: '已退款', cancelled: '已取消',
}

function getPlatformName(p: string) { return platformMap[p]?.name || p }
function getPlatformColor(p: string) { return platformMap[p]?.color || '#999' }
function getStatusText(s: string) { return statusMap[s] || s }

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  loading.value = true
  try {
    const r = await http.post('/erp/ecommerce/orders', {
      page: page.value,
      pageSize: pageSize.value,
      platform: filter.platform,
      status: filter.status,
      keyword: filter.keyword,
      startDate: filter.dateRange?.[0],
      endDate: filter.dateRange?.[1],
    }, { silent: true })
    orders.value = r.data?.list || []
    total.value = r.data?.total || 0
    if (r.data?.stats) stats.value = r.data.stats
  } catch { orders.value = [] }
  finally { loading.value = false }
}

function shipOrder(order: any) {
  ElMessage({ message: `订单 ${order.orderNo} 发货功能开发中`, type: 'info' })
}

function viewOrder(order: any) {
  ElMessage({ message: `查看订单 ${order.orderNo} 详情`, type: 'info' })
}
</script>

<style scoped>
.orders-page { padding: 16px; }
.page-header { margin-bottom: 14px; }
.page-title { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
.page-desc { font-size: 13px; color: #999; }
.filter-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.stat-row { display: flex; gap: 8px; margin-bottom: 14px; }
.stat-chip { background: #fff; border-radius: 10px; padding: 8px 14px; display: flex; align-items: center; gap: 6px; }
.chip-val { font-size: 16px; font-weight: 700; color: #333; }
.chip-lbl { font-size: 11px; color: #999; }
.stat-chip.pending { border-left: 3px solid #f59e0b; }
.stat-chip.shipped { border-left: 3px solid #3b82f6; }
.stat-chip.completed { border-left: 3px solid #10b981; }
.stat-chip.refunded { border-left: 3px solid #ef4444; }
.orders-list { display: flex; flex-direction: column; gap: 10px; }
.order-card { background: #fff; border-radius: 12px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.order-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.order-left { display: flex; align-items: center; gap: 8px; }
.platform-tag { font-size: 11px; color: #fff; padding: 2px 8px; border-radius: 8px; }
.order-no { font-size: 13px; color: #555; font-weight: 500; }
.order-right { display: flex; align-items: center; gap: 8px; }
.order-time { font-size: 12px; color: #999; }
.status-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; }
.status-pending { background: #fef3c7; color: #d97706; }
.status-shipped { background: #dbeafe; color: #2563eb; }
.status-completed { background: #d1fae5; color: #059669; }
.status-refunded { background: #fee2e2; color: #dc2626; }
.status-cancelled { background: #f3f4f6; color: #9ca3af; }
.order-body { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.order-goods { flex: 1; }
.goods-item { display: flex; gap: 8px; font-size: 13px; color: #333; margin-bottom: 2px; }
.goods-qty { color: #999; }
.order-amount { text-align: right; }
.amount-val { font-size: 16px; font-weight: 700; color: #333; }
.amount-lbl { font-size: 11px; color: #999; }
.order-ft { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f3f4f6; padding-top: 10px; }
.customer-name { font-size: 12px; color: #555; }
.order-actions { display: flex; gap: 6px; }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #999; font-size: 14px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
