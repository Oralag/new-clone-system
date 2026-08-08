<template>
  <div class="today-expense">
    <div class="ts-header">
      <span class="ts-back" @click="router.back()">‹</span>
      <span class="ts-title">今日支出</span>
    </div>

    <div class="ts-list" v-if="!loading">
      <div v-if="rows.length === 0" class="ts-empty">今日无支出</div>
      <div v-for="row in rows" :key="expandKey(row)" class="ts-row" @click="toggle(row)">
        <div class="ts-row-top">
          <span class="ts-order-no">{{ row.flow_no || '-' }}</span>
          <span class="ts-amount">-¥{{ fmt(Math.abs(Number(row.amount || 0))) }}</span>
        </div>
        <div class="ts-row-mid">
          <span class="ts-name">{{ payeeName(row) }}</span>
          <span class="ts-date">{{ getFlowDate(row) }}</span>
        </div>
        <div v-if="row.fund_name || row.remark" class="ts-row-bot">
          <span v-if="row.fund_name" class="ts-fund">{{ row.fund_name }}</span>
          <span v-if="row.remark" class="ts-remark">{{ row.remark }}</span>
        </div>
        <div class="ts-row-act">
          <button class="ts-detail-btn" type="button">{{ isExpanded(row) ? '收起' : '明细' }}</button>
        </div>

        <div v-if="isExpanded(row)" class="ts-detail">
          <div v-if="detailLoading" class="ts-detail-empty">加载中...</div>
          <template v-else-if="relatedOrder(row)">
            <div class="ts-detail-src">
              关联{{ sourceLabel(row) }} {{ sourceNo(row) }}
            </div>
            <div v-if="parseGoods(relatedOrder(row).goods_info).length === 0" class="ts-detail-empty">暂无商品明细</div>
            <div
              v-for="(item, idx) in parseGoods(relatedOrder(row).goods_info)"
              :key="idx"
              class="ts-detail-row"
            >
              <div class="ts-detail-main">
                <div class="ts-detail-name">{{ item.goods_name || '未命名商品' }}</div>
                <div class="ts-detail-meta">
                  {{ item.unit_name || '-' }} · {{ Number(item.num || item.quantity || 0) }} × ¥{{ fmt(itemPrice(item)) }}
                </div>
              </div>
              <div class="ts-detail-price">¥{{ fmt(lineAmount(item)) }}</div>
            </div>
            <div class="ts-detail-sum">
              <span>单据金额 ¥{{ fmt(relatedOrder(row).total_amount) }}</span>
              <span v-if="Number(relatedOrder(row).freight_amount || 0) > 0">
                运费 ¥{{ fmt(relatedOrder(row).freight_amount) }}
              </span>
              <span>本次付款 ¥{{ fmt(Math.abs(Number(row.amount || 0))) }}</span>
            </div>
          </template>
          <template v-else>
            <div class="ts-detail-empty">
              {{ sourceNo(row) ? '未找到关联单据明细' : '该支出无关联单据' }}
            </div>
            <div class="ts-detail-sum">
              <span>付款账户 {{ row.fund_name || '-' }}</span>
              <span>金额 ¥{{ fmt(Math.abs(Number(row.amount || 0))) }}</span>
            </div>
          </template>
        </div>
      </div>
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
const _rows = ref<any[]>([])

function getToday() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fmt(n: any) {
  return Number(n || 0).toFixed(2)
}

function getFlowDate(row: any) {
  return String(
    row?.flow_date ||
    row?.pay_date ||
    row?.expense_date ||
    row?.apply_date ||
    row?.created_at ||
    row?.create_time ||
    row?.date ||
    '',
  ).slice(0, 10)
}

function isExpenseFlow(row: any) {
  const flowNo = String(row?.flow_no || '').toUpperCase()
  if (flowNo.startsWith('SK')) return false
  if (flowNo.startsWith('FK')) return true
  const type = String(row?.flow_type || row?.type || row?._direction || '').toLowerCase()
  if (type) return type !== 'income'
  return Number(row?.amount || 0) < 0
}

function payeeName(row: any) {
  return row?.contact_name || row?.supplier_name || row?.customer_name || row?.name || '—'
}

// ===== 明细展开 =====
const expandedIds = ref<any[]>([])
const orderMap = ref<Record<string, any>>({})
const detailLoading = ref(false)
const ordersLoaded = ref(false)

function expandKey(row: any) {
  return row?.id ?? row?.flow_no
}

function isExpanded(row: any) {
  return expandedIds.value.includes(expandKey(row))
}

// 支出流水本身不带商品，靠备注里的单号回查原始单据
function sourceNo(row: any) {
  const m = String(row?.remark || '').match(/PO\d+/i)
  return m ? m[0] : ''
}

function sourceLabel(_row: any) {
  return '采购单'
}

function relatedOrder(row: any) {
  const no = sourceNo(row)
  return no ? orderMap.value[no] || null : null
}

async function loadPurchaseOrders() {
  if (ordersLoaded.value) return
  detailLoading.value = true
  try {
    const res = await http.get('/stock/PurchaseOrder/index', { params: { list_rows: 500 } })
    const list = res?.data?.rows ?? res?.rows ?? []
    const map: Record<string, any> = {}
    list.forEach((o: any) => {
      const no = String(o.order_no || o.order_sn || '')
      if (no) map[no] = o
    })
    orderMap.value = map
    ordersLoaded.value = true
  } finally {
    detailLoading.value = false
  }
}

async function toggle(row: any) {
  const key = expandKey(row)
  if (isExpanded(row)) {
    expandedIds.value = expandedIds.value.filter(k => k !== key)
    return
  }
  expandedIds.value = [...expandedIds.value, key]
  if (sourceNo(row)) await loadPurchaseOrders()
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

function itemPrice(item: any) {
  return Number(item.price ?? item.unit_price ?? item.price_no_tax ?? 0)
}

function lineAmount(item: any) {
  const direct = Number(item._total ?? item.amount ?? item.total_amount ?? item.subtotal ?? 0)
  if (direct > 0) return direct
  return Number(item.num || item.quantity || 0) * itemPrice(item)
}

const today = getToday()

const rows = computed(() =>
  _rows.value
    .filter((r: any) => getFlowDate(r) === today && isExpenseFlow(r))
    .sort((a: any, b: any) => String(b.create_time || b.pay_date || '').localeCompare(String(a.create_time || a.pay_date || '')))
)

onMounted(async () => {
  try {
    const res = await http.get('/finance/fundFlow/index', { params: { list_rows: 500 } })
    _rows.value = res?.data?.rows ?? res?.rows ?? []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.today-expense {
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

.ts-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 12px;
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
.ts-amount {
  font-size: 15px;
  font-weight: 700;
  color: #f53f3f;
}
.ts-row-mid {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ts-name { font-size: 12px; color: #4e5969; }
.ts-date { font-size: 11px; color: #c2c8d5; }

.ts-row-bot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: #86909c;
}
.ts-fund {
  background: #f2f3f5;
  padding: 2px 8px;
  border-radius: 4px;
}
.ts-remark {
  color: #86909c;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ts-row-act {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}
.ts-detail-btn {
  border: 0;
  background: transparent;
  color: #0071e3;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 0;
}
.ts-detail {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed #e5e6eb;
}
.ts-detail-src {
  font-size: 11px;
  color: #86909c;
  margin-bottom: 4px;
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
.ts-detail-sum {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f2f3f5;
  font-size: 12px;
  color: #4e5969;
}
</style>
