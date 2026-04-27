<template>
  <div class="today-sale">
    <div class="ts-header">
      <span class="ts-back" @click="router.back()">‹</span>
      <span class="ts-title">今日销售</span>
    </div>

    <!-- 顶部汇总 -->
    <div class="ts-summary">
      <div class="ts-sum-card main">
        <div class="ts-sum-label">今日总销售额</div>
        <div class="ts-sum-value blue">¥{{ fmt(totalAmt) }}</div>
      </div>
      <div class="ts-sum-card">
        <div class="ts-sum-label">销售出库金额</div>
        <div class="ts-sum-value blue">¥{{ fmt(saleAmt) }}</div>
      </div>
      <div class="ts-sum-card">
        <div class="ts-sum-label">零售订单金额</div>
        <div class="ts-sum-value orange">¥{{ fmt(retailAmt) }}</div>
      </div>
    </div>

    <!-- Tab -->
    <div class="ts-tabs">
      <div :class="['ts-tab', activeTab === 'sale' ? 'active' : '']" @click="activeTab = 'sale'">
        销售出库 ({{ saleRows.length }})
      </div>
      <div :class="['ts-tab', activeTab === 'retail' ? 'active' : '']" @click="activeTab = 'retail'">
        零售订单 ({{ retailRows.length }})
      </div>
    </div>

    <!-- 列表 -->
    <div class="ts-list" v-if="!loading">
      <!-- 销售出库 -->
      <template v-if="activeTab === 'sale'">
        <div v-if="saleRows.length === 0" class="ts-empty">暂无数据</div>
        <div v-for="row in saleRows" :key="row.id" class="ts-row">
          <div class="ts-row-top">
            <span class="ts-order-no">{{ row.out_order_no || row.order_no || '-' }}</span>
          </div>
          <div class="ts-row-mid">
            <span class="ts-customer">{{ row.customer_name || '-' }}</span>
            <span class="ts-date">{{ (row.out_date || '').slice(0, 10) }}</span>
          </div>
          <div class="ts-row-bot">
            <span class="ts-label">实付</span>
            <span class="ts-amount">¥{{ fmt(row.total_amount) }}</span>
          </div>
        </div>
        <div class="ts-foot-total">实付合计 ¥{{ fmt(saleAmt) }}</div>
      </template>

      <!-- 零售订单 -->
      <template v-if="activeTab === 'retail'">
        <div v-if="retailRows.length === 0" class="ts-empty">暂无数据</div>
        <div v-for="row in retailRows" :key="row.id" class="ts-row">
          <div class="ts-row-top" @click="toggleRetail(row)">
            <span class="ts-order-no">{{ retailOrderNo(row) }}</span>
            <button class="ts-detail-btn" type="button">{{ isRetailExpanded(row) ? '收起' : '明细' }}</button>
          </div>
          <div class="ts-row-mid">
            <span class="ts-customer">{{ row.member_name || row.customer_name || '散客' }}</span>
            <span class="ts-date">{{ fmtDateTime(row.created_at || row.order_date) }}</span>
          </div>
          <div class="ts-row-bot">
            <span class="ts-label">实付</span>
            <span class="ts-amount">¥{{ fmt(row.pay_amount || row.total_amount) }}</span>
            <span class="ts-label" style="margin-left:12px">支付</span>
            <span class="ts-pay-type">{{ fmtPayType(row.pay_type || row.pay_method) }}</span>
          </div>
          <div v-if="isRetailExpanded(row)" class="ts-detail">
            <div v-if="parseGoods(row.goods_info).length === 0" class="ts-detail-empty">暂无商品明细</div>
            <div v-for="(item, idx) in parseGoods(row.goods_info)" :key="idx" class="ts-detail-row">
              <div class="ts-detail-main">
                <div class="ts-detail-name">{{ item.goods_name || '未命名商品' }}</div>
                <div class="ts-detail-meta">
                  {{ item.goods_sn || '-' }} · {{ item.unit_name || '-' }} · {{ Number(item.num || item.quantity || 0) }}
                </div>
              </div>
              <div class="ts-detail-price">¥{{ fmt(lineAmount(item)) }}</div>
            </div>
          </div>
        </div>
        <div class="ts-foot-total">实付合计 ¥{{ fmt(retailAmt) }}</div>
      </template>
    </div>
    <div v-else class="ts-loading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'

const router = useRouter()
const loading = ref(true)
const activeTab = ref<'sale' | 'retail'>('sale')

const _saleRows = ref<any[]>([])
const _retailRows = ref<any[]>([])
const expandedRetailIds = ref<any[]>([])

function getToday() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fmt(n: any) {
  return Number(n || 0).toFixed(2)
}

function fmtDateTime(val: any) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return String(val).slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const PAY_TYPE_MAP: Record<string, string> = {
  cash: '现金', wechat: '微信', alipay: '支付宝', balance: '余额', card: '银行卡',
}
function fmtPayType(val: any) {
  if (!val) return '-'
  return PAY_TYPE_MAP[val] || val
}

function parseGoods(info: any): any[] {
  if (!info) return []
  if (Array.isArray(info)) return info
  try {
    const parsed = JSON.parse(info)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function retailOrderNo(row: any) {
  if (row.order_sn || row.order_no) return row.order_sn || row.order_no
  const date = (row.order_date || row.created_at || '').slice(0, 10).replace(/-/g, '')
  if (date || row.id) return `LS${date}${String(row.id || '').padStart(3, '0')}`
  return '-'
}

function itemPrice(item: any) {
  return Number(item.price ?? item.sell_price ?? item.sale_price ?? item.unit_price ?? item.retail_price ?? 0)
}

function lineAmount(item: any) {
  const direct = Number(item.amount ?? item.total_amount ?? item.subtotal ?? 0)
  if (direct > 0) return direct
  return Number(item.num || item.quantity || 0) * itemPrice(item)
}

function retailExpandKey(row: any) {
  return row.id ?? retailOrderNo(row)
}

function isRetailExpanded(row: any) {
  return expandedRetailIds.value.includes(retailExpandKey(row))
}

function toggleRetail(row: any) {
  const key = retailExpandKey(row)
  expandedRetailIds.value = isRetailExpanded(row)
    ? expandedRetailIds.value.filter(id => id !== key)
    : [...expandedRetailIds.value, key]
}

const today = getToday()

const saleRows = computed(() =>
  _saleRows.value.filter((r: any) => (r.out_date || '').slice(0, 10) === today && Number(r.status) === 1)
)
const retailRows = computed(() =>
  _retailRows.value.filter((r: any) => (r.order_date || '').slice(0, 10) === today && Number(r.status) === 1)
)

const saleAmt = computed(() =>
  saleRows.value.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
)
const retailAmt = computed(() =>
  retailRows.value.reduce((s: number, r: any) => s + Number(r.pay_amount || r.total_amount || 0), 0)
)
const totalAmt = computed(() => saleAmt.value + retailAmt.value)

onMounted(async () => {
  const [saleRes, retailRes] = await Promise.allSettled([
    http.get('/stock/SaleOutOrder/index', { params: { list_rows: 500 } }),
    http.get('/retail/order/index', { params: { list_rows: 500 } }),
  ])
  const rows = (r: PromiseSettledResult<any>) =>
    r.status === 'fulfilled' ? (r.value?.data?.rows ?? r.value?.rows ?? []) : []
  _saleRows.value = rows(saleRes)
  _retailRows.value = rows(retailRes)
  loading.value = false
})
</script>

<style scoped>
.today-sale {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f7;
}

.ts-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}
.ts-back {
  font-size: 24px;
  color: #0071e3;
  margin-right: 10px;
  cursor: pointer;
  line-height: 1;
}
.ts-title {
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
}

.ts-summary {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1px;
  background: #e5e6eb;
  border-bottom: 1px solid #e5e6eb;
}
.ts-sum-card {
  background: #fff;
  padding: 16px 10px;
  text-align: center;
}
.ts-sum-label {
  font-size: 11px;
  color: #86909c;
  margin-bottom: 8px;
}
.ts-sum-value {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.ts-sum-value.blue { color: #0071e3; }
.ts-sum-value.orange { color: #f77234; }

.ts-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e5e6eb;
}
.ts-tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #86909c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-weight: 500;
}
.ts-tab.active {
  color: #0071e3;
  border-bottom-color: #0071e3;
  font-weight: 700;
}

.ts-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.ts-loading, .ts-empty {
  text-align: center;
  padding: 48px 0;
  color: #c2c8d5;
  font-size: 14px;
}

.ts-row {
  background: #fff;
  margin: 10px 12px 0;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.ts-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.ts-order-no {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}
.ts-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.ts-status.done { background: #e8ffea; color: #00b42a; }
.ts-status.pending { background: #fff7e8; color: #ff7d00; }

.ts-row-mid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.ts-customer { font-size: 12px; color: #4e5969; }
.ts-date { font-size: 11px; color: #c2c8d5; }

.ts-row-bot {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ts-label { font-size: 11px; color: #86909c; }
.ts-amount { font-size: 15px; font-weight: 700; color: #1d2129; }
.ts-pay-type { font-size: 12px; color: #86909c; }
.ts-detail-btn {
  border: 0;
  background: transparent;
  color: #0071e3;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 0;
}
.ts-detail {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #e5e6eb;
}
.ts-detail-empty {
  padding: 8px 0;
  text-align: center;
  color: #c2c8d5;
  font-size: 12px;
}
.ts-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
}
.ts-detail-main {
  min-width: 0;
}
.ts-detail-name {
  color: #1d2129;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ts-detail-meta {
  margin-top: 2px;
  color: #86909c;
  font-size: 11px;
}
.ts-detail-price {
  color: #0071e3;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.ts-foot-total {
  text-align: right;
  padding: 12px 24px 20px;
  font-size: 13px;
  color: #1d2129;
  font-weight: 600;
}
</style>
