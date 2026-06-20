<template>
  <div class="ledger-page">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form inline>
        <el-form-item :label="$t('reports.saleLedger.yearLabel')">
          <el-select v-model="searchYear" style="width:100px" @change="loadAll">
            <el-option v-for="y in yearOptions" :key="y" :label="y+''" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('reports.saleLedger.customerLabel')">
          <el-select v-model="searchCustomerId" clearable :placeholder="$t('reports.saleLedger.customerPlaceholder')" style="width:160px" @change="loadAll">
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.customer_name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadAll">{{ $t('reports.saleLedger.search') }}</el-button>
          <el-button @click="onReset">{{ $t('reports.saleLedger.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card blue">
        <div class="stat-icon"><el-icon><Document /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleLedger.statCount') }}</div>
          <div class="stat-value">{{ stats.count }}</div>
        </div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleLedger.statTotal') }}</div>
          <div class="stat-value">¥ {{ fmt(stats.total) }}</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleLedger.statReceived') }}</div>
          <div class="stat-value">¥ {{ fmt(stats.received) }}</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><el-icon><Clock /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleLedger.statUnreceived') }}</div>
          <div class="stat-value">¥ {{ fmt(stats.unreceived) }}</div>
        </div>
      </div>
      <div class="stat-card pink">
        <div class="stat-icon"><el-icon><RefreshLeft /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleLedger.statRefund') }}</div>
          <div class="stat-value">¥ {{ fmt(stats.refund) }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="chart-row">
      <el-card class="chart-card pie-card">
        <div class="card-title">{{ $t('reports.saleLedger.chartPieTitle') }}</div>
        <div ref="pieRef" style="height:220px"></div>
      </el-card>
      <el-card class="chart-card line-card">
        <div class="card-title">{{ $t('reports.saleLedger.chartLineTitle') }}</div>
        <div ref="lineRef" style="height:220px"></div>
      </el-card>
    </div>

    <!-- 明细表格 -->
    <el-card class="table-card">
      <el-table :data="tableData" border stripe size="small" style="width:100%">
        <el-table-column type="index" :label="$t('reports.saleLedger.colIndex')" width="55" align="center" />
        <el-table-column :label="$t('reports.saleLedger.colReceiptDate')" prop="contract_date" width="110" />
        <el-table-column :label="$t('reports.saleLedger.colCustomerName')" prop="customer_name" min-width="120" />
        <el-table-column :label="$t('reports.saleLedger.colContractAmount')" prop="total_amount" width="110" align="right">
          <template #default="{ row }">{{ fmt(contractAmount(row)) }}</template>
        </el-table-column>
        <el-table-column :label="$t('reports.saleLedger.colReceived')" width="110" align="right">
          <template #default="{ row }">{{ fmt(row.receive_amount) }}</template>
        </el-table-column>
        <el-table-column :label="$t('reports.saleLedger.colUnreceived')" width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: calcUnreceived(row) > 0 ? '#ef4444' : '#16a34a' }">
              {{ fmt(calcUnreceived(row)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.saleLedger.colRefund')" width="90" align="right">
          <template #default="{ row }">{{ fmt(row.refund_amount) }}</template>
        </el-table-column>
        <el-table-column :label="$t('reports.saleLedger.colDebtStatus')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="calcUnreceived(row) > 0 ? 'danger' : 'success'" size="small">
              {{ calcUnreceived(row) > 0 ? $t('reports.saleLedger.statusUnpaid') : $t('reports.saleLedger.statusPaid') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.saleLedger.colContractStatus')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'primary' : 'info'" size="small">
              {{ row.status === 1 ? $t('reports.saleLedger.statusInProgress') : $t('reports.saleLedger.statusCompleted') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.saleLedger.colRemark')" prop="remark" min-width="120" />
      </el-table>
      <div style="margin-top:12px;text-align:right">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="loadTable"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { Search, Document, Wallet, CircleCheck, Clock, RefreshLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { PieChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getSaleContractList } from '@/api/reports'
import { getCollectReceiptList } from '@/api/finance'
import { getSaleCustomerList } from '@/api/sale'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'
import { applySaleReceiptPayments, getSaleContractAmount } from '@/utils/saleFinance'

echarts.use([PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const searchYear = ref(currentYear)
const searchCustomerId = ref<number | null>(null)
const customerOptions = ref<any[]>([])

const allRows = ref<any[]>([])
const tableData = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const pieRef = ref<HTMLElement>()
const lineRef = ref<HTMLElement>()
let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

const fmt = (v: any) => Number(v || 0).toFixed(2)
const contractAmount = (row: any) => Number(row.finance_total_amount ?? getSaleContractAmount(row))
const calcUnreceived = (row: any) => Math.max(0, contractAmount(row) - Number(row.receive_amount || 0))

const stats = computed(() => {
  const rows = allRows.value
  return {
    count: rows.length,
    total: rows.reduce((s, r) => s + contractAmount(r), 0),
    received: rows.reduce((s, r) => s + Number(r.receive_amount || 0), 0),
    unreceived: rows.reduce((s, r) => s + calcUnreceived(r), 0),
    refund: rows.reduce((s, r) => s + Number(r.refund_amount || 0), 0),
  }
})

async function loadCustomers() {
  try {
    const res: any = await getSaleCustomerList({ page: 1, list_rows: 200 })
    customerOptions.value = res?.data?.rows || res?.rows || []
  } catch {}
}

function filterRows(rows: any[]) {
  return rows.filter(r => {
    const d = (r.contract_date || r.created_at || '')
    const yearMatch = d.startsWith(String(searchYear.value))
    const custMatch = !searchCustomerId.value || r.customer_id === searchCustomerId.value
    return isEffectiveSaleContract(r) && yearMatch && custMatch
  })
}

async function loadAll() {
  try {
    const [contractRes, receiptRes] = await Promise.allSettled([
      getSaleContractList({ page: 1, list_rows: 5000, customer_id: searchCustomerId.value || undefined }),
      getCollectReceiptList({ page: 1, list_rows: 5000 }),
    ])
    const contracts: any[] = contractRes.status === 'fulfilled'
      ? (contractRes.value?.data?.rows || contractRes.value?.rows || [])
      : []
    const receipts: any[] = receiptRes.status === 'fulfilled'
      ? (receiptRes.value?.data?.rows || receiptRes.value?.data?.list || receiptRes.value?.rows || [])
      : []
    allRows.value = filterRows(applySaleReceiptPayments(contracts, receipts))
  } catch {
    allRows.value = []
  }
  page.value = 1
  const start = (page.value - 1) * pageSize.value
  tableData.value = allRows.value.slice(start, start + pageSize.value)
  total.value = allRows.value.length
  nextTick(() => { renderPie(); renderLine() })
}

async function loadTable() {
  const start = (page.value - 1) * pageSize.value
  tableData.value = allRows.value.slice(start, start + pageSize.value)
  total.value = allRows.value.length
}

function onReset() {
  searchYear.value = currentYear
  searchCustomerId.value = null
  loadAll()
}

function renderPie() {
  if (!pieRef.value) return
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  const { received, unreceived, refund } = stats.value
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { orient: 'vertical', left: 10, top: 'center', textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'],
      label: { formatter: '{b}: {d}%', fontSize: 11 },
      data: [
        { name: t('reports.saleLedger.pieReceived'), value: received.toFixed(2), itemStyle: { color: '#f5a623' } },
        { name: t('reports.saleLedger.pieUnreceived'), value: unreceived.toFixed(2), itemStyle: { color: '#4ade80' } },
        { name: t('reports.saleLedger.pieRefund'), value: refund.toFixed(2), itemStyle: { color: '#f87171' } },
      ].filter(d => Number(d.value) > 0)
    }]
  })
}

function renderLine() {
  if (!lineRef.value) return
  if (!lineChart) lineChart = echarts.init(lineRef.value)
  const months = Array.from({ length: 12 }, (_, i) => `${searchYear.value}-${String(i + 1).padStart(2, '0')}`)
  const byMonth = (field: string) => months.map(m =>
    allRows.value.filter(r => (r.contract_date || r.created_at || '').startsWith(m))
      .reduce((s, r) => s + (field === 'total_amount' ? contractAmount(r) : Number(r[field] || 0)), 0).toFixed(2)
  )
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: [t('reports.saleLedger.seriesContract'), t('reports.saleLedger.seriesReceived'), t('reports.saleLedger.seriesUnreceived')], top: 0, right: 10 },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: months.map(m => m.slice(5)), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [
      { name: t('reports.saleLedger.seriesContract'), type: 'line', smooth: true, data: byMonth('total_amount'), itemStyle: { color: '#3b82f6' } },
      { name: t('reports.saleLedger.seriesReceived'), type: 'line', smooth: true, data: byMonth('receive_amount'), itemStyle: { color: '#10b981' } },
      { name: t('reports.saleLedger.seriesUnreceived'), type: 'line', smooth: true,
        data: months.map(m => allRows.value.filter(r => (r.contract_date || r.created_at || '').startsWith(m)).reduce((s, r) => s + calcUnreceived(r), 0).toFixed(2)),
        itemStyle: { color: '#ef4444' }
      },
    ]
  })
}

onMounted(() => {
  loadCustomers()
  loadAll()
})
</script>

<style scoped>
.ledger-page { display: flex; flex-direction: column; gap: 14px; padding: 14px; }
.search-card :deep(.el-card__body) { padding: 12px 16px; }
.stat-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.stat-card {
  border-radius: 8px; padding: 16px 14px;
  display: flex; align-items: center; gap: 14px; color: #fff;
}
.stat-card.blue   { background: linear-gradient(135deg,#3b82f6,#1d4ed8); }
.stat-card.orange { background: linear-gradient(135deg,#f59e0b,#d97706); }
.stat-card.green  { background: linear-gradient(135deg,#10b981,#059669); }
.stat-card.red    { background: linear-gradient(135deg,#ef4444,#dc2626); }
.stat-card.pink   { background: linear-gradient(135deg,#ec4899,#db2777); }
.stat-icon { font-size: 28px; opacity: .85; }
.stat-label { font-size: 13px; opacity: .9; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; }
.chart-row { display: grid; grid-template-columns: 1fr 2fr; gap: 14px; }
.chart-card :deep(.el-card__body) { padding: 12px 14px; }
.card-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #374151; }
.table-card :deep(.el-card__body) { padding: 14px; }
@media (max-width: 900px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}
</style>
