<template>
  <div class="ledger-page">
    <el-card class="search-card">
      <el-form inline>
        <el-form-item label="年份">
          <el-select v-model="searchYear" style="width:100px" @change="loadAll">
            <el-option v-for="y in yearOptions" :key="y" :label="y+''" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户">
          <el-input v-model="searchCustomer" placeholder="客户名称" clearable style="width:160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadAll">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="stat-cards">
      <div class="stat-card blue">
        <div class="stat-icon"><el-icon><Document /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">合同数量（份）</div>
          <div class="stat-value">{{ stats.count }}</div>
        </div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">合同总金额</div>
          <div class="stat-value">¥ {{ fmt(stats.total) }}</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">已收金额</div>
          <div class="stat-value">¥ {{ fmt(stats.received) }}</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><el-icon><Clock /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">未收金额</div>
          <div class="stat-value">¥ {{ fmt(stats.unreceived) }}</div>
        </div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><el-icon><User /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">客户数量</div>
          <div class="stat-value">{{ stats.customers }}</div>
        </div>
      </div>
    </div>

    <div class="chart-row">
      <el-card class="chart-card">
        <div class="card-title">按客户统计（金额 Top10）</div>
        <div ref="barRef" style="height:260px"></div>
      </el-card>
      <el-card class="chart-card">
        <div class="card-title">月度销售趋势</div>
        <div ref="lineRef" style="height:260px"></div>
      </el-card>
    </div>

    <el-card class="table-card">
      <div class="card-title" style="margin-bottom:10px">按客户汇总</div>
      <el-table :data="summaryData" border stripe size="small" style="width:100%">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="客户名称" prop="customer_name" min-width="130" />
        <el-table-column label="合同数" prop="count" width="80" align="center" />
        <el-table-column label="合同总额" width="120" align="right">
          <template #default="{ row }">¥ {{ fmt(row.total) }}</template>
        </el-table-column>
        <el-table-column label="已收金额" width="120" align="right">
          <template #default="{ row }">¥ {{ fmt(row.received) }}</template>
        </el-table-column>
        <el-table-column label="未收金额" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.unreceived > 0 ? '#ef4444' : '#16a34a' }">
              ¥ {{ fmt(row.unreceived) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="收款率" width="90" align="center">
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
import { Search, Document, Wallet, CircleCheck, Clock, User } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getSaleContractList } from '@/api/reports'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'

echarts.use([BarChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const searchYear = ref(currentYear)
const searchCustomer = ref('')

const allRows = ref<any[]>([])
const barRef = ref<HTMLElement>()
const lineRef = ref<HTMLElement>()
let barChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

const fmt = (v: any) => Number(v || 0).toFixed(2)
const calcUnreceived = (row: any) => Math.max(0, Number(row.total_amount || 0) - Number(row.receive_amount || 0))

const filteredRows = computed(() => {
  return allRows.value.filter(r => {
    const d = r.contract_date || r.created_at || ''
    const yearOk = d.startsWith(String(searchYear.value))
    const custOk = !searchCustomer.value || (r.customer_name || '').includes(searchCustomer.value)
    return isEffectiveSaleContract(r) && yearOk && custOk
  })
})

const stats = computed(() => {
  const rows = filteredRows.value
  const customers = new Set(rows.map(r => r.customer_name)).size
  return {
    count: rows.length,
    total: rows.reduce((s, r) => s + Number(r.total_amount || 0), 0),
    received: rows.reduce((s, r) => s + Number(r.receive_amount || 0), 0),
    unreceived: rows.reduce((s, r) => s + calcUnreceived(r), 0),
    customers,
  }
})

const summaryData = computed(() => {
  const map: Record<string, any> = {}
  for (const r of filteredRows.value) {
    const name = r.customer_name || '未知'
    if (!map[name]) map[name] = { customer_name: name, count: 0, total: 0, received: 0, unreceived: 0 }
    map[name].count++
    map[name].total += Number(r.total_amount || 0)
    map[name].received += Number(r.receive_amount || 0)
    map[name].unreceived += calcUnreceived(r)
  }
  return Object.values(map).sort((a, b) => b.total - a.total)
})

async function loadAll() {
  try {
    const res: any = await getSaleContractList({ page: 1, list_rows: 1000 })
    allRows.value = res?.data?.rows || res?.rows || []
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
      { name: '合同金额', type: 'bar', data: top10.map(r => r.total.toFixed(2)).reverse(), itemStyle: { color: '#3b82f6' } },
      { name: '已收金额', type: 'bar', data: top10.map(r => r.received.toFixed(2)).reverse(), itemStyle: { color: '#10b981' } },
    ]
  })
}

function renderLine() {
  if (!lineRef.value) return
  if (!lineChart) lineChart = echarts.init(lineRef.value)
  const months = Array.from({ length: 12 }, (_, i) => `${searchYear.value}-${String(i + 1).padStart(2, '0')}`)
  const rows = filteredRows.value
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['合同金额', '已收金额'], top: 0, right: 10 },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: months.map(m => m.slice(5)), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [
      { name: '合同金额', type: 'line', smooth: true, itemStyle: { color: '#3b82f6' },
        data: months.map(m => rows.filter(r => (r.contract_date || r.created_at || '').startsWith(m)).reduce((s, r) => s + Number(r.total_amount || 0), 0).toFixed(2)) },
      { name: '已收金额', type: 'line', smooth: true, itemStyle: { color: '#10b981' },
        data: months.map(m => rows.filter(r => (r.contract_date || r.created_at || '').startsWith(m)).reduce((s, r) => s + Number(r.receive_amount || 0), 0).toFixed(2)) },
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
.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.chart-card :deep(.el-card__body) { padding: 12px 14px; }
.card-title { font-size: 14px; font-weight: 600; color: #374151; }
.table-card :deep(.el-card__body) { padding: 14px; }
@media (max-width: 900px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}
</style>
