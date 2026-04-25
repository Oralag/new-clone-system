<template>
  <div class="page-container">
    <el-row :gutter="12" style="margin-bottom:16px">
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" style="text-align:center">
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-bottom:4px">今日总销售额</div>
          <div style="font-size:24px;font-weight:700;color:#0071e3">¥{{ totalAmount.toFixed(2) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8">
        <el-card shadow="never" style="text-align:center">
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-bottom:4px">销售出库金额</div>
          <div style="font-size:22px;font-weight:700;color:#16a34a">¥{{ saleAmount.toFixed(2) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8">
        <el-card shadow="never" style="text-align:center">
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-bottom:4px">零售订单金额</div>
          <div style="font-size:22px;font-weight:700;color:#ea580c">¥{{ retailAmount.toFixed(2) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <el-tabs v-model="activeTab">

        <!-- 销售出库 -->
        <el-tab-pane :label="`销售出库 (${saleRows.length})`" name="sale">
          <!-- 桌面端表格 -->
          <template v-if="!isMobile">
            <el-table :data="saleRows" v-loading="loading" border size="small" style="width:100%" :max-height="400">
              <el-table-column type="index" width="40" align="center" />
              <el-table-column prop="order_no" label="单号" min-width="120" show-overflow-tooltip />
              <el-table-column prop="customer_name" label="客户" min-width="100" show-overflow-tooltip />
              <el-table-column label="金额" width="110" align="right">
                <template #default="{ row }">
                  <span style="color:#0071e3;font-weight:600">¥{{ ((row.after_discount != null && row.after_discount !== '') ? Number(row.after_discount) : Number(row.total_amount||0)).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="out_date" label="日期" width="100" />
              <el-table-column label="状态" width="70" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status==1?'success':'info'" size="small">{{ row.status==1?'已审核':'待审核' }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </template>
          <!-- 手机端卡片列表 -->
          <template v-else>
            <div v-if="loading" style="padding:20px;text-align:center;color:#999">加载中...</div>
            <div v-else-if="saleRows.length === 0" style="padding:20px;text-align:center;color:#999">今日暂无销售出库</div>
            <div v-else class="mobile-list">
              <div v-for="(row, i) in saleRows" :key="i" class="mobile-card">
                <div class="mobile-card-header">
                  <span class="mobile-card-no">{{ row.order_no || ('—') }}</span>
                  <el-tag :type="row.status==1?'success':'info'" size="small">{{ row.status==1?'已审核':'待审核' }}</el-tag>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">客户</span>
                  <span class="mobile-card-val">{{ row.customer_name || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">日期</span>
                  <span class="mobile-card-val">{{ row.out_date || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">仓库</span>
                  <span class="mobile-card-val">{{ row.warehouse_name || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">经手人</span>
                  <span class="mobile-card-val">{{ row.handler_name || row.staff_name || '—' }}</span>
                </div>
                <div class="mobile-card-footer">
                  <span class="mobile-card-label">金额</span>
                  <span class="mobile-card-amount">¥{{ ((row.after_discount != null && row.after_discount !== '') ? Number(row.after_discount) : Number(row.total_amount||0)).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div style="margin-top:8px;text-align:right;font-size:13px;color:rgba(29,29,31,0.5)">
            合计 <b style="color:#0071e3">¥{{ saleAmount.toFixed(2) }}</b>
          </div>
        </el-tab-pane>

        <!-- 零售订单 -->
        <el-tab-pane :label="`零售订单 (${retailRows.length})`" name="retail">
          <!-- 桌面端表格 -->
          <template v-if="!isMobile">
            <el-table :data="retailRows" v-loading="loading" border size="small" style="width:100%" :max-height="400">
              <el-table-column type="index" width="40" align="center" />
              <el-table-column prop="order_no" label="单号" min-width="120" show-overflow-tooltip />
              <el-table-column prop="member_name" label="会员" min-width="100" show-overflow-tooltip />
              <el-table-column label="实付" width="110" align="right">
                <template #default="{ row }">
                  <span style="color:#0071e3;font-weight:600">¥{{ Number(row.pay_amount||0).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="pay_type" label="支付" width="80" align="center" />
              <el-table-column prop="order_date" label="日期" width="100" />
            </el-table>
          </template>
          <!-- 手机端卡片列表 -->
          <template v-else>
            <div v-if="loading" style="padding:20px;text-align:center;color:#999">加载中...</div>
            <div v-else-if="retailRows.length === 0" style="padding:20px;text-align:center;color:#999">今日暂无零售订单</div>
            <div v-else class="mobile-list">
              <div v-for="(row, i) in retailRows" :key="i" class="mobile-card">
                <div class="mobile-card-header">
                  <span class="mobile-card-no">{{ row.order_no || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">会员</span>
                  <span class="mobile-card-val">{{ row.member_name || '散客' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">日期</span>
                  <span class="mobile-card-val">{{ row.order_date || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">支付方式</span>
                  <span class="mobile-card-val">{{ row.pay_type || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">收银员</span>
                  <span class="mobile-card-val">{{ row.cashier_name || row.staff_name || '—' }}</span>
                </div>
                <div class="mobile-card-row">
                  <span class="mobile-card-label">门店</span>
                  <span class="mobile-card-val">{{ row.store_name || '—' }}</span>
                </div>
                <div class="mobile-card-footer">
                  <span class="mobile-card-label">实付</span>
                  <span class="mobile-card-amount">¥{{ Number(row.pay_amount||0).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div style="margin-top:8px;text-align:right;font-size:13px;color:rgba(29,29,31,0.5)">
            实付合计 <b style="color:#0071e3">¥{{ retailAmount.toFixed(2) }}</b>
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import http from '@/api/http'

const loading = ref(false)
const activeTab = ref('sale')
const saleRows = ref<any[]>([])
const retailRows = ref<any[]>([])
const isMobile = ref(window.innerWidth <= 768)

const today = (() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
})()

const saleAmount = computed(() => saleRows.value.reduce((s, r) => {
  const amt = (r.after_discount != null && r.after_discount !== '') ? Number(r.after_discount) : Number(r.total_amount || 0)
  return s + amt
}, 0))
const retailAmount = computed(() => retailRows.value.reduce((s, r) => s + Number(r.pay_amount||r.total_amount||0), 0))
const totalAmount = computed(() => saleAmount.value + retailAmount.value)

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
</style>
