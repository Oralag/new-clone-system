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
        <el-tab-pane :label="`销售出库 (${saleRows.length})`" name="sale">
          <div class="table-wrap">
          <el-table :data="saleRows" v-loading="loading" border size="small" style="width:100%" :max-height="tableMaxH">
            <el-table-column type="index" width="40" align="center" />
            <el-table-column v-if="!isMobile" prop="order_no" label="单号" min-width="120" show-overflow-tooltip />
            <el-table-column prop="customer_name" label="客户" min-width="80" show-overflow-tooltip />
            <el-table-column label="金额" min-width="95" align="right"
              :formatter="(row:any) => '¥' + Number(row.total_amount||0).toFixed(2)" />
            <el-table-column v-if="!isMobile" prop="out_date" label="日期" width="100" />
            <el-table-column v-if="!isMobile" label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status==1?'success':'info'" size="small">{{ row.status==1?'已审核':'待审核' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          </div>
          <div style="margin-top:8px;text-align:right;font-size:13px;color:rgba(29,29,31,0.5)">
            合计 <b style="color:#0071e3">¥{{ saleAmount.toFixed(2) }}</b>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="`零售订单 (${retailRows.length})`" name="retail">
          <div class="table-wrap">
          <el-table :data="retailRows" v-loading="loading" border size="small" style="width:100%" :max-height="tableMaxH">
            <el-table-column type="index" width="40" align="center" />
            <el-table-column v-if="!isMobile" prop="order_no" label="单号" min-width="120" show-overflow-tooltip />
            <el-table-column prop="member_name" label="会员" min-width="80" show-overflow-tooltip />
            <el-table-column label="实付" min-width="95" align="right"
              :formatter="(row:any) => '¥' + Number(row.pay_amount||0).toFixed(2)" />
            <el-table-column v-if="!isMobile" prop="pay_method" label="支付" width="80" align="center" />
            <el-table-column v-if="!isMobile" prop="order_date" label="日期" width="100" />
          </el-table>
          </div>
          <div style="margin-top:8px;text-align:right;font-size:13px;color:rgba(29,29,31,0.5)">
            实付合计 <b style="color:#0071e3">¥{{ retailAmount.toFixed(2) }}</b>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import http from '@/api/http'

const loading = ref(false)
const activeTab = ref('sale')
const saleRows = ref<any[]>([])
const retailRows = ref<any[]>([])
const tableMaxH = ref(400)
const isMobile = ref(window.innerWidth <= 768)

// 手机端表格矮一些
if (isMobile.value) tableMaxH.value = 320
const today = (() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
})()

const saleAmount = computed(() => saleRows.value.reduce((s, r) => s + Number(r.total_amount||0), 0))
const retailAmount = computed(() => retailRows.value.reduce((s, r) => s + Number(r.pay_amount||r.total_amount||0), 0))
const totalAmount = computed(() => saleAmount.value + retailAmount.value)

onMounted(async () => {
  loading.value = true
  const [sr, rr] = await Promise.allSettled([
    http.get('/stock/SaleOutOrder/index', { params: { list_rows: 500 } }),
    http.get('/retail/order/index',       { params: { list_rows: 500 } }),
  ])
  if (sr.status === 'fulfilled') {
    const all: any[] = sr.value?.data?.rows ?? sr.value?.rows ?? []
    saleRows.value = all.filter((r: any) => (r.out_date||'').slice(0,10) === today)
  }
  if (rr.status === 'fulfilled') {
    const all: any[] = rr.value?.data?.rows ?? rr.value?.rows ?? []
    retailRows.value = all.filter((r: any) => (r.order_date||'').slice(0,10) === today)
  }
  loading.value = false
})
</script>

<style scoped>
.page-container {
  padding: 16px;
  overflow: auto;
  max-width: 100%;
  box-sizing: border-box;
}
.table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
@media (max-width: 768px) {
  .page-container { padding: 10px; }
}
</style>
