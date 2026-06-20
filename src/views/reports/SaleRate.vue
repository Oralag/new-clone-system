<template>
  <div class="ledger-page">
    <el-card class="search-card">
      <el-form inline>
        <el-form-item :label="$t('reports.saleRate.yearLabel')">
          <el-select v-model="searchYear" style="width:100px" @change="loadAll">
            <el-option v-for="y in yearOptions" :key="y" :label="y+''" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('reports.saleRate.customerLabel')">
          <el-input v-model="searchCustomer" :placeholder="$t('reports.saleRate.customerPlaceholder')" clearable style="width:160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadAll">{{ $t('reports.saleRate.search') }}</el-button>
          <el-button @click="onReset">{{ $t('reports.saleRate.reset') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="stat-cards">
      <div class="stat-card blue">
        <div class="stat-icon"><el-icon><Document /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleRate.statContract') }}</div>
          <div class="stat-value">{{ stats.contractCount }} {{ $t('reports.saleRate.statContractUnit') }}</div>
          <div class="stat-subline">{{ $t('reports.saleRate.statContractAmount') }} ¥{{ fmt(stats.contractTotal) }}</div>
        </div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleRate.statRetail') }}</div>
          <div class="stat-value">{{ stats.retailCount }} {{ $t('reports.saleRate.statRetailUnit') }}</div>
          <div class="stat-subline">{{ $t('reports.saleRate.statRetailAmount') }} ¥{{ fmt(stats.retailTotal) }}</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleRate.statReceived') }}</div>
          <div class="stat-value">¥ {{ fmt(stats.received) }}</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><el-icon><Clock /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleRate.statUnreceived') }}</div>
          <div class="stat-value">¥ {{ fmt(stats.unreceived) }}</div>
        </div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><el-icon><User /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">{{ $t('reports.saleRate.statCustomers') }}</div>
          <div class="stat-value">{{ stats.customers }}</div>
        </div>
      </div>
    </div>

    <div class="chart-row">
      <el-card class="chart-card">
        <div class="card-title">{{ $t('reports.saleRate.chartBarTitle') }}</div>
        <div ref="barRef" style="height:260px"></div>
      </el-card>
      <el-card class="chart-card">
        <div class="chart-title-row">
          <div class="card-title">{{ $t('reports.saleRate.chartLineTitle') }}</div>
          <el-radio-group v-model="trendType" size="small" @change="renderLine">
            <el-radio-button label="all">{{ $t('reports.saleRate.trendAll') }}</el-radio-button>
            <el-radio-button label="contract">{{ $t('reports.saleRate.trendContract') }}</el-radio-button>
            <el-radio-button label="retail">{{ $t('reports.saleRate.trendRetail') }}</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="lineRef" style="height:260px"></div>
      </el-card>
    </div>

    <el-card class="table-card">
      <div class="card-title" style="margin-bottom:10px">{{ $t('reports.saleRate.tableTitle') }}</div>
      <el-table :data="summaryData" border stripe size="small" style="width:100%">
        <el-table-column type="index" :label="$t('reports.saleRate.colIndex')" width="55" align="center" />
        <el-table-column :label="$t('reports.saleRate.colCustomerName')" prop="customer_name" min-width="130" />
        <el-table-column :label="$t('reports.saleRate.colCount')" prop="count" width="80" align="center" />
        <el-table-column :label="$t('reports.saleRate.colTotal')" width="120" align="right">
          <template #default="{ row }">¥ {{ fmt(row.total) }}</template>
        </el-table-column>
        <el-table-column :label="$t('reports.saleRate.colReceived')" width="120" align="right">
          <template #default="{ row }">¥ {{ fmt(row.received) }}</template>
        </el-table-column>
        <el-table-column :label="$t('reports.saleRate.colUnreceived')" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.unreceived > 0 ? '#ef4444' : '#16a34a' }">
              ¥ {{ fmt(row.unreceived) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.saleRate.colReceiveRate')" width="90" align="center">
          <template #default="{ row }">
            {{ row.total > 0 ? ((row.received / row.total) * 100).toFixed(1) + '%' : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { Search, Document, Wallet, CircleCheck, Clock, User } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getSaleContractList } from '@/api/reports'
import { getCollectReceiptList } from '@/api/finance'
import { getRetailOrderList } from '@/api/retail'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'
import {
  applySaleReceiptPayments,
  getSaleContractAmount,
  getSaleContractOrderNo,
  getSaleReceiptAmount,
  getSaleReceiptCustomerName,
  getSaleReceiptDate,
  getSaleReceiptOrderNo,
  isSaleCustomerReceipt,
} from '@/utils/saleFinance'

echarts.use([BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const searchYear = ref(currentYear)
const searchCustomer = ref('')
const trendType = ref<'all' | 'contract' | 'retail'>('all')

const allRows = ref<any[]>([])
const receiptRows = ref<any[]>([])
const barRef = ref<HTMLElement>()
const lineRef = ref<HTMLElement>()
let barChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

const fmt = (v: any) => Number(v || 0).toFixed(2)
const rowDate = (row: any) => String(
  row._source === 'retail'
    ? (row.order_date || row.created_at || row.create_time || '')
    : (row.contract_date || row.sign_date || row.order_date || row.created_at || row.create_time || ''),
)
const contractAmount = (row: any) => Number(
  row.finance_total_amount
  ?? (row._source === 'retail' ? (row.pay_amount ?? row.total_amount ?? row.after_discount ?? 0) : getSaleContractAmount(row)),
)
const calcUnreceived = (row: any) => Math.max(0, contractAmount(row) - Number(row.receive_amount || 0))
const isEffectiveSaleRow = (row: any) => row._source === 'retail'
  ? Number(row.status) === 1
  : isEffectiveSaleContract(row)

function normalizeRetailRows(rows: any[]) {
  return (rows || [])
    .filter((row: any) => Number(row.status) === 1)
    .map((row: any, index: number) => {
      const amount = Number(row.pay_amount ?? row.total_amount ?? row.after_discount ?? 0)
      const date = row.order_date || row.created_at || row.create_time || ''
      return {
        ...row,
        id: row.id ? `retail-${row.id}` : `retail-idx-${index}`,
        _source: 'retail',
        customer_name: row.customer_name || row.member_name || '散客',
        contract_date: date,
        finance_total_amount: amount,
        receive_amount: amount,
        paid_amount: amount,
        un_pay_amount: 0,
        status: 1,
      }
    })
}

const filteredRows = computed(() => {
  return allRows.value.filter(r => {
    const d = rowDate(r)
    const yearOk = d.startsWith(String(searchYear.value))
    const custOk = !searchCustomer.value || (r.customer_name || '').includes(searchCustomer.value)
    return isEffectiveSaleRow(r) && yearOk && custOk
  })
})

const stats = computed(() => {
  const rows = filteredRows.value
  const customers = new Set(rows.map(r => r.customer_name)).size
  const contractRows = rows.filter(r => r._source !== 'retail')
  const retailRows = rows.filter(r => r._source === 'retail')
  const contractTotal = contractRows.reduce((s, r) => s + contractAmount(r), 0)
  const retailTotal = retailRows.reduce((s, r) => s + contractAmount(r), 0)
  return {
    count: rows.length,
    contractCount: contractRows.length,
    retailCount: retailRows.length,
    total: contractTotal + retailTotal,
    contractTotal,
    retailTotal,
    received: rows.reduce((s, r) => s + Number(r.receive_amount || 0), 0),
    unreceived: rows.reduce((s, r) => s + calcUnreceived(r), 0),
    customers,
  }
})

const summaryData = computed(() => {
  const map: Record<string, any> = {}
  for (const r of filteredRows.value) {
    const name = r.customer_name || '未知'
    if (!map[name]) {
      map[name] = {
        customer_name: name,
        count: 0,
        contract_count: 0,
        retail_count: 0,
        total: 0,
        contract_total: 0,
        retail_total: 0,
        received: 0,
        unreceived: 0,
      }
    }
    map[name].count++
    const amount = contractAmount(r)
    const isRetail = r._source === 'retail'
    if (isRetail) {
      map[name].retail_count++
      map[name].retail_total += amount
    } else {
      map[name].contract_count++
      map[name].contract_total += amount
    }
    map[name].total += amount
    map[name].received += Number(r.receive_amount || 0)
    map[name].unreceived += calcUnreceived(r)
  }
  return Object.values(map).sort((a, b) => b.total - a.total)
})

async function loadAll() {
  try {
    const [contractRes, receiptRes, retailRes] = await Promise.allSettled([
      getSaleContractList({ page: 1, list_rows: 5000 }),
      getCollectReceiptList({ page: 1, list_rows: 5000 }),
      getRetailOrderList({ page: 1, list_rows: 5000 }),
    ])
    const contracts: any[] = contractRes.status === 'fulfilled'
      ? (contractRes.value?.data?.rows || contractRes.value?.rows || [])
      : []
    const receipts: any[] = receiptRes.status === 'fulfilled'
      ? (receiptRes.value?.data?.rows || receiptRes.value?.data?.list || receiptRes.value?.rows || [])
      : []
    const retailRows: any[] = retailRes.status === 'fulfilled'
      ? (retailRes.value?.data?.rows || retailRes.value?.data?.list || retailRes.value?.rows || [])
      : []
    receiptRows.value = receipts
    allRows.value = [
      ...applySaleReceiptPayments(contracts, receipts).map(row => ({ ...row, _source: 'contract' })),
      ...normalizeRetailRows(retailRows),
    ]
  } catch { allRows.value = [] }
  nextTick(() => { renderBar(); renderLine() })
}

function onReset() {
  searchYear.value = currentYear
  searchCustomer.value = ''
  loadAll()
}

function renderBar() {
  if (!barRef.value) return
  if (!barChart) barChart = echarts.init(barRef.value)
  const top10 = summaryData.value.slice(0, 10)
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 100, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    yAxis: { type: 'category', data: top10.map(r => r.customer_name).reverse(), axisLabel: { fontSize: 11 } },
    series: [
      { name: t('reports.saleRate.seriesContract'), type: 'bar', data: top10.map(r => r.contract_total.toFixed(2)).reverse(), itemStyle: { color: '#3b82f6' } },
      { name: t('reports.saleRate.seriesRetail'), type: 'bar', data: top10.map(r => r.retail_total.toFixed(2)).reverse(), itemStyle: { color: '#f59e0b' } },
      { name: t('reports.saleRate.seriesReceived'), type: 'bar', data: top10.map(r => r.received.toFixed(2)).reverse(), itemStyle: { color: '#10b981' } },
    ]
  })
}

function renderLine() {
  if (!lineRef.value) return
  if (!lineChart) lineChart = echarts.init(lineRef.value)
  const months = Array.from({ length: 12 }, (_, i) => `${searchYear.value}-${String(i + 1).padStart(2, '0')}`)
  const rows = filteredRows.value
  const trendRows = rows.filter(row => {
    if (trendType.value === 'contract') return row._source !== 'retail'
    if (trendType.value === 'retail') return row._source === 'retail'
    return true
  })
  const orderNos = new Set(
    trendRows
      .filter(r => r._source !== 'retail')
      .flatMap(r => [getSaleContractOrderNo(r), r.order_sn, r.order_no, r.contract_no].map(v => String(v || '').trim()).filter(Boolean)),
  )
  const receiptMatchesFilter = (receipt: any) => {
    if (!isSaleCustomerReceipt(receipt)) return false
    if (!searchCustomer.value) return true
    const receiptCustomer = getSaleReceiptCustomerName(receipt)
    const receiptOrderNo = getSaleReceiptOrderNo(receipt)
    return receiptCustomer.includes(searchCustomer.value) || (receiptOrderNo && orderNos.has(receiptOrderNo))
  }
  const byReceiptMonth = months.map(m => {
    const contractReceipts = trendType.value === 'retail'
      ? 0
      : receiptRows.value
        .filter(receipt => getSaleReceiptDate(receipt).startsWith(m) && receiptMatchesFilter(receipt))
        .reduce((sum, receipt) => sum + getSaleReceiptAmount(receipt), 0)
    const retailReceipts = trendType.value === 'contract'
      ? 0
      : trendRows
      .filter(row => row._source === 'retail' && rowDate(row).startsWith(m))
      .reduce((sum, row) => sum + contractAmount(row), 0)
    return (contractReceipts + retailReceipts).toFixed(2)
  })
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: [t('reports.saleRate.seriesSaleAmount'), t('reports.saleRate.seriesReceived')], top: 0, right: 10 },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: months.map(m => m.slice(5)), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [
      { name: t('reports.saleRate.seriesSaleAmount'), type: 'line', smooth: false, itemStyle: { color: '#3b82f6' },
        data: months.map(m => trendRows.filter(r => rowDate(r).startsWith(m)).reduce((s, r) => s + contractAmount(r), 0).toFixed(2)) },
      { name: t('reports.saleRate.seriesReceived'), type: 'line', smooth: false, itemStyle: { color: '#10b981' }, data: byReceiptMonth },
    ]
  })
}

onMounted(() => { loadAll() })
</script>

<style scoped>
.ledger-page { display: flex; flex-direction: column; gap: 14px; padding: 14px; }
.search-card :deep(.el-card__body) { padding: 12px 16px; }
.stat-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.stat-card { border-radius: 8px; padding: 16px 14px; display: flex; align-items: center; gap: 14px; color: #fff; }
.stat-card.blue   { background: linear-gradient(135deg,#3b82f6,#1d4ed8); }
.stat-card.orange { background: linear-gradient(135deg,#f59e0b,#d97706); }
.stat-card.green  { background: linear-gradient(135deg,#10b981,#059669); }
.stat-card.red    { background: linear-gradient(135deg,#ef4444,#dc2626); }
.stat-card.purple { background: linear-gradient(135deg,#8b5cf6,#7c3aed); }
.stat-icon { font-size: 28px; opacity: .85; }
.stat-label { font-size: 13px; opacity: .9; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; }
.stat-subline { margin-top: 4px; font-size: 12px; line-height: 1.35; opacity: .9; }
.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.chart-card :deep(.el-card__body) { padding: 12px 14px; }
.card-title { font-size: 14px; font-weight: 600; color: #374151; }
.chart-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
.table-card :deep(.el-card__body) { padding: 14px; }
@media (max-width: 900px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}
</style>
