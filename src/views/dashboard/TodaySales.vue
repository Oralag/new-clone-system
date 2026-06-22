<template>
  <div class="page-container">
    <el-row :gutter="12" style="margin-bottom:16px">
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" style="text-align:center">
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-bottom:4px">{{ t('dashboard.todaySales.totalSales') }}</div>
          <div style="font-size:24px;font-weight:700;color:#0071e3">¥{{ totalAmount.toFixed(2) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8">
        <el-card shadow="never" style="text-align:center">
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-bottom:4px">{{ t('dashboard.todaySales.saleAmount') }}</div>
          <div style="font-size:22px;font-weight:700;color:#16a34a">¥{{ saleAmount.toFixed(2) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8">
        <el-card shadow="never" style="text-align:center">
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-bottom:4px">{{ t('dashboard.todaySales.retailAmount') }}</div>
          <div style="font-size:22px;font-weight:700;color:#ea580c">¥{{ retailAmount.toFixed(2) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <el-tabs v-model="activeTab">

        <!-- 销售出库 -->
        <el-tab-pane :label="`${t('dashboard.todaySales.saleOut')} (${saleRows.length})`" name="sale">
          <!-- 桌面端表格 -->
          <template v-if="!isMobile">
            <el-table :data="saleRows" v-loading="loading" border size="small" style="width:100%" :max-height="400">
              <el-table-column type="index" width="40" align="center" />
              <el-table-column prop="order_no" :label="t('dashboard.todaySales.orderNo')" min-width="120" show-overflow-tooltip />
              <el-table-column prop="customer_name" :label="t('dashboard.todaySales.customer')" min-width="100" show-overflow-tooltip />
              <el-table-column :label="t('dashboard.todaySales.amount')" width="110" align="right">
                <template #default="{ row }">
                  <span style="color:#0071e3;font-weight:600">¥{{ ((row.after_discount != null && row.after_discount !== '') ? Number(row.after_discount) : Number(row.total_amount||0)).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="out_date" :label="t('dashboard.todaySales.date')" width="100" />
              <el-table-column :label="t('dashboard.todaySales.status')" width="70" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status==1?'success':'info'" size="small">{{ row.status==1?t('dashboard.todaySales.auditPassed'):t('dashboard.todaySales.auditPending') }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </template>
          <!-- 手机端卡片列表 -->
          <template v-else>
            <div v-if="loading" style="padding:20px;text-align:center;color:#999">{{ t('dashboard.todaySales.loading') }}</div>
            <div v-else-if="saleRows.length === 0" style="padding:20px;text-align:center;color:#999">{{ t('dashboard.todaySales.noSaleOut') }}</div>
            <div v-else class="mobile-list">
              <div v-for="(row, i) in saleRows" :key="i" class="mobile-card">
                <div class="mobile-card-header">
                  <span class="mobile-card-no">{{ row.order_no || ('—') }}</span>
                  <el-tag :type="row.status==1?'success':'info'" size="small">{{ row.status==1?t('dashboard.todaySales.auditPassed'):t('dashboard.todaySales.auditPending') }}</el-tag>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.customer') }}</span>
                  <span class="mobile-card-val">{{ row.customer_name || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.date') }}</span>
                  <span class="mobile-card-val">{{ row.out_date || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.warehouse') }}</span>
                  <span class="mobile-card-val">{{ row.warehouse_name || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.handler') }}</span>
                  <span class="mobile-card-val">{{ row.handler_name || row.staff_name || '—' }}</span>
                </div>
                <div class="mobile-card-footer">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.amount') }}</span>
                  <span class="mobile-card-amount">¥{{ ((row.after_discount != null && row.after_discount !== '') ? Number(row.after_discount) : Number(row.total_amount||0)).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div style="margin-top:8px;text-align:right;font-size:13px;color:rgba(29,29,31,0.5)">
            {{ t('dashboard.todaySales.total') }} <b style="color:#0071e3">¥{{ saleAmount.toFixed(2) }}</b>
          </div>
        </el-tab-pane>

        <!-- 零售订单 -->
        <el-tab-pane :label="`${t('dashboard.todaySales.retailOrder')} (${retailRows.length})`" name="retail">
          <!-- 桌面端表格 -->
          <template v-if="!isMobile">
            <el-table :data="retailRows" v-loading="loading" border size="small" style="width:100%" :max-height="400">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="detail-panel">
                    <div class="detail-title">
                      <span>{{ t('dashboard.todaySales.goodsDetail') }}</span>
                      <span class="detail-summary">
                        {{ retailOrderNo(row) }} · {{ row.member_name || row.customer_name || t('dashboard.todaySales.walkIn') }}
                      </span>
                    </div>
                    <el-table :data="parseGoods(row.goods_info)" size="small" border style="width:100%" :empty-text="t('dashboard.todaySales.noGoodsDetail')">
                      <el-table-column prop="goods_name" :label="t('dashboard.todaySales.goodsName')" min-width="160" show-overflow-tooltip />
                      <el-table-column prop="goods_sn" :label="t('dashboard.todaySales.code')" min-width="110" show-overflow-tooltip />
                      <el-table-column prop="unit_name" :label="t('dashboard.todaySales.unit')" width="70" align="center" />
                      <el-table-column :label="t('dashboard.todaySales.qty')" width="80" align="right">
                        <template #default="{ row: item }">{{ Number(item.num || item.quantity || 0) }}</template>
                      </el-table-column>
                      <el-table-column :label="t('dashboard.todaySales.unitPrice')" width="100" align="right">
                        <template #default="{ row: item }">¥{{ itemPrice(item).toFixed(2) }}</template>
                      </el-table-column>
                      <el-table-column :label="t('dashboard.todaySales.subtotal')" width="110" align="right">
                        <template #default="{ row: item }">
                          <span style="color:#0071e3;font-weight:600">¥{{ lineAmount(item).toFixed(2) }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                    <div class="detail-footer">
                      <span>{{ t('dashboard.todaySales.goodsTotal') }} ¥{{ Number(row.total_amount || 0).toFixed(2) }}</span>
                      <span>{{ t('dashboard.todaySales.discount') }} ¥{{ Number(row.discount_amount || 0).toFixed(2) }}</span>
                      <b>{{ t('dashboard.todaySales.paid') }} ¥{{ Number(row.pay_amount || row.total_amount || 0).toFixed(2) }}</b>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column type="index" width="40" align="center" />
              <el-table-column :label="t('dashboard.todaySales.orderNo')" min-width="120" show-overflow-tooltip>
                <template #default="{ row }">{{ retailOrderNo(row) }}</template>
              </el-table-column>
              <el-table-column :label="t('dashboard.todaySales.member')" min-width="100" show-overflow-tooltip>
                <template #default="{ row }">{{ row.member_name || row.customer_name || t('dashboard.todaySales.walkIn') }}</template>
              </el-table-column>
              <el-table-column :label="t('dashboard.todaySales.goodsCount')" width="80" align="center">
                <template #default="{ row }">{{ parseGoods(row.goods_info).length }}</template>
              </el-table-column>
              <el-table-column :label="t('dashboard.todaySales.paid')" width="110" align="right">
                <template #default="{ row }">
                  <span style="color:#0071e3;font-weight:600">¥{{ Number(row.pay_amount||0).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="t('dashboard.todaySales.payType')" width="80" align="center">
                <template #default="{ row }">{{ fmtPayType(row.pay_type || row.pay_method) }}</template>
              </el-table-column>
              <el-table-column prop="order_date" :label="t('dashboard.todaySales.date')" width="100" />
            </el-table>
          </template>
          <!-- 手机端卡片列表 -->
          <template v-else>
            <div v-if="loading" style="padding:20px;text-align:center;color:#999">{{ t('dashboard.todaySales.loading') }}</div>
            <div v-else-if="retailRows.length === 0" style="padding:20px;text-align:center;color:#999">{{ t('dashboard.todaySales.noRetail') }}</div>
            <div v-else class="mobile-list">
              <div v-for="(row, i) in retailRows" :key="i" class="mobile-card">
                <div class="mobile-card-header" @click="toggleRetail(row)">
                  <span class="mobile-card-no">{{ retailOrderNo(row) }}</span>
                  <el-button link type="primary" size="small">{{ isRetailExpanded(row) ? t('dashboard.todaySales.collapse') : t('dashboard.todaySales.detail') }}</el-button>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.member') }}</span>
                  <span class="mobile-card-val">{{ row.member_name || t('dashboard.todaySales.walkIn') }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.date') }}</span>
                  <span class="mobile-card-val">{{ row.order_date || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.payType') }}</span>
                  <span class="mobile-card-val">{{ row.pay_type || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.cashier') }}</span>
                  <span class="mobile-card-val">{{ row.cashier_name || row.staff_name || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.store') }}</span>
                  <span class="mobile-card-val">{{ row.store_name || '—' }}</span>
                </div>
                <div class="mobile-card-footer">
                  <span class="mobile-card-label">{{ t('dashboard.todaySales.paid') }}</span>
                  <span class="mobile-card-amount">¥{{ Number(row.pay_amount||0).toFixed(2) }}</span>
                </div>
                <div v-if="isRetailExpanded(row)" class="mobile-detail">
                  <div v-if="parseGoods(row.goods_info).length === 0" class="mobile-detail-empty">{{ t('dashboard.todaySales.noGoodsDetail') }}</div>
                  <div v-for="(item, idx) in parseGoods(row.goods_info)" :key="idx" class="mobile-detail-row">
                    <div>
                      <div class="mobile-detail-name">{{ item.goods_name || t('dashboard.todaySales.unnamedGoods') }}</div>
                      <div class="mobile-detail-meta">
                        {{ item.goods_sn || '—' }} · {{ item.unit_name || '—' }} · {{ Number(item.num || item.quantity || 0) }}
                      </div>
                    </div>
                    <div class="mobile-detail-amount">¥{{ lineAmount(item).toFixed(2) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div style="margin-top:8px;text-align:right;font-size:13px;color:rgba(29,29,31,0.5)">
            {{ t('dashboard.todaySales.retailPaidTotal') }} <b style="color:#0071e3">¥{{ retailAmount.toFixed(2) }}</b>
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import http from '@/api/http'

const { t } = useI18n()

const loading = ref(false)
const activeTab = ref('sale')
const saleRows = ref<any[]>([])
const retailRows = ref<any[]>([])
const expandedRetailIds = ref<any[]>([])
const isMobile = ref(window.innerWidth <= 768)

const today = (() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
})()

const saleAmount = computed(() => saleRows.value.filter((r: any) => Number(r.status) === 1).reduce((s: number, r: any) => {
  const amt = (r.after_discount != null && r.after_discount !== '') ? Number(r.after_discount) : Number(r.total_amount || 0)
  return s + amt
}, 0))
const retailAmount = computed(() => retailRows.value.filter((r: any) => Number(r.status) === 1).reduce((s: number, r: any) => s + Number(r.pay_amount||r.total_amount||0), 0))
const totalAmount = computed(() => saleAmount.value + retailAmount.value)

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
  return '—'
}

const PAY_TYPE_MAP: Record<string, string> = {
  cash: 'dashboard.payType.cash',
  wechat: 'dashboard.payType.wechat',
  alipay: 'dashboard.payType.alipay',
  balance: 'dashboard.payType.balance',
  card: 'dashboard.payType.card',
}

function fmtPayType(val: any) {
  if (!val) return '—'
  return PAY_TYPE_MAP[val] ? t(PAY_TYPE_MAP[val]) : val
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

async function fetchToday() {
  loading.value = true
  const [sr, rr] = await Promise.allSettled([
    http.get('/stock/SaleOutOrder/index', { params: { list_rows: 9999 } }),
    http.get('/retail/order/index',       { params: { list_rows: 9999 } }),
  ])
  if (sr.status === 'fulfilled') {
    const all: any[] = sr.value?.data?.rows ?? sr.value?.rows ?? []
    saleRows.value = all.filter((r: any) => (r.out_date||'').slice(0,10) === today)
    if (saleRows.value.length > 0) console.log('[TodaySales] 销售出库第一条字段:', JSON.stringify(saleRows.value[0]))
  }
  if (rr.status === 'fulfilled') {
    const all: any[] = rr.value?.data?.rows ?? rr.value?.rows ?? []
    retailRows.value = all.filter((r: any) => (r.order_date||'').slice(0,10) === today)
  }
  loading.value = false
}

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  fetchToday()
  timer = setInterval(fetchToday, 30000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.page-container {
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
}
@media (max-width: 768px) {
  .page-container { padding: 10px; }
}

/* 手机端卡片列表 */
.mobile-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mobile-card {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 12px 14px;
  border: 1px solid #e8eaed;
}
.mobile-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e8eaed;
}
.mobile-card-no {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}
.mobile-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}
.mobile-card-label {
  color: #999;
  flex-shrink: 0;
  margin-right: 8px;
}
.mobile-card-val {
  color: #1d1d1f;
  font-weight: 500;
  text-align: right;
  flex: 1;
}
.mobile-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e8eaed;
}
.mobile-card-amount {
  font-size: 18px;
  font-weight: 700;
  color: #0071e3;
}
.detail-panel {
  padding: 10px 48px 14px;
  background: #fafafa;
}
.detail-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1d1d1f;
}
.detail-summary {
  font-weight: 400;
  color: rgba(29,29,31,0.5);
}
.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 18px;
  padding-top: 8px;
  font-size: 13px;
  color: rgba(29,29,31,0.65);
}
.detail-footer b {
  color: #0071e3;
}
.mobile-detail {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #d8dde6;
}
.mobile-detail-empty {
  padding: 8px 0;
  text-align: center;
  color: #999;
  font-size: 12px;
}
.mobile-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
}
.mobile-detail-name {
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 600;
}
.mobile-detail-meta {
  margin-top: 2px;
  color: #999;
  font-size: 12px;
}
.mobile-detail-amount {
  color: #0071e3;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
</style>
