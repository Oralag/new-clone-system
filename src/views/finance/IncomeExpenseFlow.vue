<template>
  <div class="page-container">
    <div class="flow-header">
      <div>
        <div class="page-title">{{ $t('finance.incomeExpenseFlow.pageTitle') }}</div>
        <div class="flow-sub">{{ $t('finance.incomeExpenseFlow.pageSub') }}</div>
      </div>
      <el-button :loading="loading" type="primary" @click="loadData">{{ $t('finance.incomeExpenseFlow.refresh') }}</el-button>
    </div>

    <el-row :gutter="12" class="summary-row">
      <el-col :xs="24" :sm="8">
        <el-card shadow="never" class="summary-card">
          <div class="summary-label">{{ $t('finance.incomeExpenseFlow.salesIncome') }}</div>
          <div class="summary-value green">¥{{ fmt(incomeTotal) }}</div>
          <div class="summary-sub">{{ $t('finance.incomeExpenseFlow.salesOrders', { n: incomeCount }) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8">
        <el-card shadow="never" class="summary-card">
          <div class="summary-label">{{ $t('finance.incomeExpenseFlow.purchaseExpense') }}</div>
          <div class="summary-value red">¥{{ fmt(expenseTotal) }}</div>
          <div class="summary-sub">{{ $t('finance.incomeExpenseFlow.purchaseOrders', { n: expenseCount }) }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8">
        <el-card shadow="never" class="summary-card">
          <div class="summary-label">{{ $t('finance.incomeExpenseFlow.netAmount') }}</div>
          <div class="summary-value" :class="netAmount >= 0 ? 'green' : 'red'">{{ netAmount >= 0 ? '+' : '-' }}¥{{ fmt(Math.abs(netAmount)) }}</div>
          <div class="summary-sub">{{ $t('finance.incomeExpenseFlow.netFormula') }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-filters">
          <el-input v-model="keyword" :placeholder="$t('finance.incomeExpenseFlow.searchPlaceholder')" clearable style="width:220px" />
          <el-select v-model="flowType" :placeholder="$t('finance.incomeExpenseFlow.flowTypePlaceholder')" clearable style="width:130px">
            <el-option :label="$t('finance.incomeExpenseFlow.flowTypeIncome')" value="income" />
            <el-option :label="$t('finance.incomeExpenseFlow.flowTypeExpense')" value="expense" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            :range-separator="$t('finance.incomeExpenseFlow.rangeSeparator')"
            :start-placeholder="$t('finance.incomeExpenseFlow.startDate')"
            :end-placeholder="$t('finance.incomeExpenseFlow.endDate')"
            style="width:240px"
          />
        </div>
        <span class="table-count">{{ $t('finance.incomeExpenseFlow.totalCount', { n: filteredRows.length }) }}</span>
      </div>

      <el-table :data="pagedRows" v-loading="loading" border stripe style="width:100%">
        <el-table-column :label="$t('finance.incomeExpenseFlow.date')" width="120">
          <template #default="{ row }">{{ row.date }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.incomeExpenseFlow.type')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
              {{ row.type === 'income' ? $t('finance.incomeExpenseFlow.income') : $t('finance.incomeExpenseFlow.expense') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" :label="$t('finance.incomeExpenseFlow.source')" width="110" />
        <el-table-column prop="name" :label="$t('finance.incomeExpenseFlow.counterpart')" min-width="150" show-overflow-tooltip />
        <el-table-column prop="order_no" :label="$t('finance.incomeExpenseFlow.orderNo')" min-width="150" show-overflow-tooltip />
        <el-table-column :label="$t('finance.incomeExpenseFlow.amount')" width="140" align="right">
          <template #default="{ row }">
            <span class="amount" :class="row.type === 'income' ? 'green' : 'red'">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ fmt(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.incomeExpenseFlow.status')" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="$t('finance.incomeExpenseFlow.remark')" min-width="160" show-overflow-tooltip />
        <el-table-column :label="$t('finance.incomeExpenseFlow.operation')" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="router.push(row.link)">{{ $t('finance.incomeExpenseFlow.view') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredRows.length"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getContractList } from '@/api/sale'
import { getProcureOrderList } from '@/api/procure'
import { getSaleContractStatusText, isEffectiveSaleContract } from '@/utils/saleContractStatus'

interface FlowRow {
  id: number | string
  date: string
  type: 'income' | 'expense'
  source: string
  name: string
  order_no: string
  amount: number
  statusText: string
  remark: string
  link: string
}

const { t } = useI18n()
const router = useRouter()
const loading = ref(false)
const keyword = ref('')
const flowType = ref('')
const dateRange = ref<[string, string] | null>(null)
const rows = ref<FlowRow[]>([])
const currentPage = ref(1)
const pageSize = ref(20)

function fmt(v: number | string) {
  const n = Number(v || 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getRows(res: any): any[] {
  return res?.data?.rows ?? res?.data?.list ?? res?.data?.data ?? res?.rows ?? []
}

function fmtDate(val: any) {
  const raw = String(val || '').trim()
  if (!raw) return '—'
  return raw.slice(0, 10)
}

function orderNo(row: any, fallbackPrefix: string) {
  return row.order_sn || row.order_no || row.contract_no || (row.id ? `${fallbackPrefix}${String(row.id).padStart(4, '0')}` : '—')
}

function saleAmount(row: any) {
  const total = Number(row.total_amount || row.amount || 0)
  const afterDisc = Number(row.after_discount)
  return (Number.isFinite(afterDisc) && afterDisc > 0 && afterDisc <= total) ? afterDisc : total
}

function procureAmount(row: any) {
  return Number(Number(row.after_discount) > 0 ? row.after_discount : (row.total_amount ?? row.amount ?? 0))
}

function getProcureSupplierLabel(row: any) {
  try {
    const items = typeof row.goods_info === 'string' ? JSON.parse(row.goods_info) : (Array.isArray(row.goods_info) ? row.goods_info : [])
    const names = [...new Set(items.map((item: any) => String(item.supplier_name || '').trim()).filter(Boolean))]
    if (names.length > 1) return t('finance.incomeExpenseFlow.multiSupplier')
    if (names.length === 1) return names[0]
  } catch {}
  return row.supplier_name || row.customer_name || '—'
}

const filteredRows = computed(() => {
  let list = rows.value
  if (flowType.value) list = list.filter(row => row.type === flowType.value)
  if (dateRange.value) {
    const [start, end] = dateRange.value
    list = list.filter(row => row.date !== '—' && row.date >= start && row.date <= end)
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(row =>
      row.name.toLowerCase().includes(kw) ||
      row.order_no.toLowerCase().includes(kw) ||
      row.remark.toLowerCase().includes(kw)
    )
  }
  return list
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const incomeTotal = computed(() => filteredRows.value.filter(row => row.type === 'income').reduce((sum, row) => sum + row.amount, 0))
const expenseTotal = computed(() => filteredRows.value.filter(row => row.type === 'expense').reduce((sum, row) => sum + row.amount, 0))
const netAmount = computed(() => incomeTotal.value - expenseTotal.value)
const incomeCount = computed(() => filteredRows.value.filter(row => row.type === 'income').length)
const expenseCount = computed(() => filteredRows.value.filter(row => row.type === 'expense').length)

watch([keyword, flowType, dateRange, pageSize], () => {
  currentPage.value = 1
})

async function loadData() {
  loading.value = true
  try {
    const [saleRes, procureRes] = await Promise.allSettled([
      getContractList({ list_rows: 3000 }),
      getProcureOrderList({ list_rows: 3000 }),
    ])
    const saleRows = saleRes.status === 'fulfilled' ? getRows(saleRes.value) : []
    const procureRows = procureRes.status === 'fulfilled' ? getRows(procureRes.value) : []

    const saleItems: FlowRow[] = saleRows
      .filter(isEffectiveSaleContract)
      .map((row: any) => ({
        id: `sale-${row.id || orderNo(row, 'XS')}`,
        date: fmtDate(row.sign_date || row.contract_date || row.order_date || row.created_at || row.create_time),
        type: 'income',
        source: t('finance.incomeExpenseFlow.sourceIncome'),
        name: row.customer_name || '—',
        order_no: orderNo(row, 'XS'),
        amount: saleAmount(row),
        statusText: getSaleContractStatusText(row.status),
        remark: row.remark || '',
        link: '/sale/contract',
      }))

    const procureItems: FlowRow[] = procureRows
      .filter((row: any) => Number(row.status) === 1)
      .map((row: any) => ({
        id: `procure-${row.id || orderNo(row, 'CG')}`,
        date: fmtDate(row.order_date || row.created_at || row.create_time),
        type: 'expense',
        source: t('finance.incomeExpenseFlow.sourceExpense'),
        name: getProcureSupplierLabel(row),
        order_no: orderNo(row, 'CG'),
        amount: procureAmount(row),
        statusText: t('finance.incomeExpenseFlow.approved'),
        remark: row.remark || '',
        link: '/procure/order',
      }))

    rows.value = [...saleItems, ...procureItems]
      .filter(row => row.amount > 0)
      .sort((a, b) => b.date.localeCompare(a.date) || b.order_no.localeCompare(a.order_no))
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.flow-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
}
.flow-sub {
  margin-top: 4px;
  color: rgba(29,29,31,0.55);
  font-size: 13px;
}
.summary-row {
  margin-bottom: 12px;
}
.summary-card {
  min-height: 104px;
}
.summary-label {
  font-size: 13px;
  color: rgba(29,29,31,0.5);
}
.summary-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 800;
}
.summary-sub {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(29,29,31,0.45);
}
.green {
  color: #16a34a;
}
.red {
  color: #dc2626;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.toolbar-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.table-count {
  color: rgba(29,29,31,0.45);
  font-size: 13px;
  white-space: nowrap;
}
.amount {
  font-weight: 700;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
@media (max-width: 768px) {
  .page-container {
    padding: 10px;
  }
  .flow-header {
    align-items: stretch;
    flex-direction: column;
  }
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .toolbar-filters > * {
    width: 100% !important;
  }
  .pager {
    overflow-x: auto;
    justify-content: flex-start;
  }
}
</style>
