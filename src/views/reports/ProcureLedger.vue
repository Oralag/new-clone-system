<template>
  <div class="ledger-page">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form inline>
        <el-form-item label="年份">
          <el-select v-model="searchYear" style="width:100px" @change="loadAll">
            <el-option v-for="y in yearOptions" :key="y" :label="y+''" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="searchSupplier" placeholder="供应商名称" clearable style="width:160px" @change="loadAll" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadAll">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card blue">
        <div class="stat-icon"><el-icon><Document /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">采购单数量（份）</div>
          <div class="stat-value">{{ stats.count }}</div>
        </div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon"><el-icon><Wallet /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">采购总金额</div>
          <div class="stat-value">¥ {{ fmt(stats.total) }}</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">已付金额</div>
          <div class="stat-value">¥ {{ fmt(stats.paid) }}</div>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon"><el-icon><Clock /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">未付金额</div>
          <div class="stat-value">¥ {{ fmt(stats.unpaid) }}</div>
        </div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon"><el-icon><Box /></el-icon></div>
        <div class="stat-body">
          <div class="stat-label">运费合计</div>
          <div class="stat-value">¥ {{ fmt(stats.freight) }}</div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="chart-row">
      <el-card class="chart-card pie-card">
        <div class="card-title">累计付款进度</div>
        <div ref="pieRef" style="height:220px"></div>
      </el-card>
      <el-card class="chart-card line-card">
        <div class="card-title">月度采购金额明细</div>
        <div ref="lineRef" style="height:220px"></div>
      </el-card>
    </div>

    <!-- 明细表格 -->
    <el-card class="table-card">
      <el-table :data="tableData" border stripe size="small" style="width:100%">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="下单日期" prop="order_date" width="110" />
        <el-table-column label="供应商名称" min-width="120">
          <template #default="{ row }">{{ getSupplierLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="采购金额" prop="total_amount" width="110" align="right">
          <template #default="{ row }">{{ fmt(row.total_amount) }}</template>
        </el-table-column>
        <el-table-column label="已付金额" width="110" align="right">
          <template #default="{ row }">{{ fmt(row.pay_amount) }}</template>
        </el-table-column>
        <el-table-column label="未付金额" width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: calcUnpaid(row) > 0 ? '#ef4444' : '#16a34a' }">
              {{ fmt(calcUnpaid(row)) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="运费" prop="freight_amount" width="80" align="right">
          <template #default="{ row }">{{ fmt(row.freight_amount) }}</template>
        </el-table-column>
        <el-table-column label="欠款状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="calcUnpaid(row) > 0 ? 'danger' : 'success'" size="small">
              {{ calcUnpaid(row) > 0 ? '未结清' : '已结清' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="采购状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'primary' : 'info'" size="small">
              {{ row.status === 1 ? '进行中' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="仓库" prop="warehouse_name" width="100" />
        <el-table-column label="备注" prop="remark" min-width="100" />
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { Search, Document, Wallet, CircleCheck, Clock, Box } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { PieChart, LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getProcureContractList } from '@/api/reports'

echarts.use([PieChart, LineChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const searchYear = ref(currentYear)
const searchSupplier = ref('')

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
const calcUnpaid = (row: any) => Math.max(0, Number(row.total_amount || 0) - Number(row.pay_amount || 0))

const stats = computed(() => {
  const rows = allRows.value
  return {
    count: rows.length,
    total: rows.reduce((s, r) => s + Number(r.total_amount || 0), 0),
    paid: rows.reduce((s, r) => s + Number(r.pay_amount || 0), 0),
    unpaid: rows.reduce((s, r) => s + calcUnpaid(r), 0),
    freight: rows.reduce((s, r) => s + Number(r.freight_amount || 0), 0),
  }
})

function getSupplierLabel(row: any): string {
  try {
    const items = typeof row.goods_info === 'string' ? JSON.parse(row.goods_info) : (row.goods_info || [])
    const ids = [...new Set(items.map((i: any) => Number(i.supplier_id)).filter(Boolean))]
    if (ids.length > 1) return '多供应商'
    if (ids.length === 1) return items.find((i: any) => i.supplier_id)?.supplier_name || row.supplier_name || String(ids[0])
  } catch {}
  return row.supplier_name || '—'
}

function filterRows(rows: any[]) {
  return rows.filter(r => {
    const d = (r.order_date || r.created_at || '')
    const yearMatch = d.startsWith(String(searchYear.value))
    const supMatch = !searchSupplier.value || (r.supplier_name || '').includes(searchSupplier.value)
    return r.status === 1 && yearMatch && supMatch
  })
}

async function loadAll() {
  try {
    const res: any = await getProcureContractList({ page: 1, list_rows: 1000 })
    const rows = res?.data?.rows || res?.rows || []
    allRows.value = filterRows(rows)
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
  searchSupplier.value = ''
  loadAll()
}

function renderPie() {
  if (!pieRef.value) return
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  const { paid, unpaid } = stats.value
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { orient: 'vertical', left: 10, top: 'center', textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['60%', '50%'],
      label: { formatter: '{b}: {d}%', fontSize: 11 },
      data: [
        { name: '已付金额', value: paid.toFixed(2), itemStyle: { color: '#f5a623' } },
        { name: '未付金额', value: unpaid.toFixed(2), itemStyle: { color: '#4ade80' } },
      ].filter(d => Number(d.value) > 0)
    }]
  })
}

function renderLine() {
  if (!lineRef.value) return
  if (!lineChart) lineChart = echarts.init(lineRef.value)
  const months = Array.from({ length: 12 }, (_, i) => `${searchYear.value}-${String(i + 1).padStart(2, '0')}`)
  const byMonth = (field: string) => months.map(m =>
    allRows.value.filter(r => (r.order_date || r.created_at || '').startsWith(m))
      .reduce((s, r) => s + Number(r[field] || 0), 0).toFixed(2)
  )
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['采购金额', '已付金额', '未付金额'], top: 0, right: 10 },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: months.map(m => m.slice(5)), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
    series: [
      { name: '采购金额', type: 'line', smooth: true, data: byMonth('total_amount'), itemStyle: { color: '#3b82f6' } },
      { name: '已付金额', type: 'line', smooth: true, data: byMonth('pay_amount'), itemStyle: { color: '#10b981' } },
      { name: '未付金额', type: 'line', smooth: true,
        data: months.map(m => allRows.value.filter(r => (r.order_date || r.created_at || '').startsWith(m)).reduce((s, r) => s + calcUnpaid(r), 0).toFixed(2)),
        itemStyle: { color: '#ef4444' }
      },
    ]
  })
}

onMounted(() => { loadAll() })
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
.stat-card.purple { background: linear-gradient(135deg,#8b5cf6,#7c3aed); }
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
