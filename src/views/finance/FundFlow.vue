<template>
  <div class="page-container">
    <div class="page-title">资金明细</div>
    <!-- 顶部汇总卡片 -->
    <div class="summary-bar" v-loading="summaryLoading">
      <div class="summary-card">
        <span class="s-label">资金余额</span>
        <span class="s-value blue">¥{{ summary.balance.toFixed(2) }}</span>
        <span class="s-formula">{{ summary.fundCount }} 个账户实时余额合计</span>
      </div>
      <div class="summary-card">
        <span class="s-label">累计收入</span>
        <span class="s-value green">¥{{ summary.income.toFixed(2) }}</span>
        <span class="s-formula">按资金流水入账记录统计</span>
      </div>
      <div class="summary-card">
        <span class="s-label">累计支出</span>
        <span class="s-value red">¥{{ summary.expense.toFixed(2) }}</span>
        <span class="s-formula">按资金流水出账记录统计</span>
      </div>
      <div class="summary-card">
        <span class="s-label">未付款</span>
        <span class="s-value orange">¥{{ summary.unpaid.toFixed(2) }}</span>
        <span class="s-formula">= 采购单 − 已付款</span>
      </div>
    </div>

    <!-- 明细表格 -->
    <el-card>
      <div class="table-toolbar">
        <div class="toolbar-filters">
          <el-input v-model="filterKeyword" placeholder="搜索名称/单号" clearable style="width:180px" />
          <el-select v-model="filterType" placeholder="收支类型" clearable style="width:120px">
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
          <el-select v-model="filterSource" placeholder="来源" clearable style="width:130px">
            <el-option v-for="item in sourceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </div>
        <span class="table-count">共 {{ filteredItems.length }} 条</span>
      </div>
      <el-table :data="pagedItems" v-loading="tableLoading" border stripe style="width:100%">
        <el-table-column label="日期" width="110">
          <template #default="{ row }">{{ row.date }}</template>
        </el-table-column>
        <el-table-column label="账户" width="120">
          <template #default="{ row }">{{ row.fund_name || '—' }}</template>
        </el-table-column>
        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="对象" min-width="140">
          <template #default="{ row }">{{ row.name }}</template>
        </el-table-column>
        <el-table-column label="单号" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.order_no || '—' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="130" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'income' ? '#16a34a' : '#dc2626', fontWeight: '600' }">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ Number(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
      </el-table>
      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredItems.length"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getFundList, getPayableList, getFundFlowList } from '@/api/finance'
import { normalizeFundFlowRows, sumFundFlowExpense, sumFundFlowIncome } from '@/utils/fundFlow'

const summaryLoading = ref(false)
const tableLoading = ref(false)
const summary = reactive({ balance: 0, income: 0, expense: 0, totalPurchase: 0, unpaid: 0, fundCount: 0 })

const filterKeyword = ref('')
const filterType = ref('')
const filterSource = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

interface FlowItem {
  date: string
  fund_name: string
  type: 'income' | 'expense'
  source: string
  name: string
  order_no: string
  amount: number
  remark: string
}

const allItems = ref<FlowItem[]>([])

const filteredItems = computed(() => {
  let list = allItems.value
  if (filterType.value) list = list.filter(i => i.type === filterType.value)
  if (filterSource.value) list = list.filter(i => i.source === filterSource.value)
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    list = list.filter(i => i.name.toLowerCase().includes(kw) || (i.order_no || '').toLowerCase().includes(kw))
  }
  return list
})

const sourceOptions = computed(() =>
  Array.from(new Set(allItems.value.map(item => item.source).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN'))
)

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

onMounted(async () => {
  summaryLoading.value = true
  tableLoading.value = true
  try {
    const [fundRes, flowRes, payableRes] = await Promise.all([
      getFundList({ list_rows: 200 }),
      getFundFlowList({ list_rows: 2000 }),
      getPayableList({ list_rows: 1000 }),
    ])

    const normalizedRows = normalizeFundFlowRows(flowRes.data?.rows ?? flowRes.data?.list ?? [])
    allItems.value = normalizedRows.map(row => ({
      date: row.date,
      fund_name: row.fund_name,
      type: row.flow_type === 'income' ? 'income' : 'expense',
      source: row.source,
      name: row.name,
      order_no: row.order_no,
      amount: row.amount,
      remark: row.remark,
    }))

    const funds: any[] = fundRes.data?.rows ?? fundRes.data?.list ?? []
    const payables: any[] = payableRes.data?.rows ?? payableRes.data?.list ?? []
    summary.fundCount = funds.length
    summary.balance = funds.reduce((sum, row) => sum + Number(row.balance || 0), 0)
    summary.income = sumFundFlowIncome(normalizedRows)
    summary.expense = sumFundFlowExpense(normalizedRows)
    summary.totalPurchase = payables.reduce((sum, row) => sum + Number(row.order_amount || row.total_amount || 0), 0)
    summary.unpaid = payables.reduce((sum, row) => {
      if (row?.un_pay_amount !== undefined && row?.un_pay_amount !== null && row?.un_pay_amount !== '') {
        return sum + Math.max(0, Number(row.un_pay_amount || 0))
      }
      return sum + Math.max(0, Number(row.order_amount || row.total_amount || 0) - Number(row.paid_amount || 0))
    }, 0)

  } catch { /* ignore */ } finally {
    summaryLoading.value = false
    tableLoading.value = false
  }
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 18px; font-weight: 700; color: #1d1d1f; }

.summary-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid #e4e7ed;
}
.s-label { font-size: 12px; color: rgba(29,29,31,0.45); }
.s-value { font-size: 22px; font-weight: 700; color: #1d1d1f; }
.s-value.blue { color: #0071e3; }
.s-value.green { color: #16a34a; }
.s-value.red { color: #dc2626; }
.s-value.orange { color: #ea580c; }
.s-formula { font-size: 11px; color: rgba(29,29,31,0.35); margin-top: 2px; }

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-filters { display: flex; gap: 8px; flex-wrap: wrap; }
.table-count { font-size: 13px; color: rgba(29,29,31,0.35); }

@media (max-width: 767px) {
  .summary-bar { grid-template-columns: repeat(2, 1fr); }
}
</style>
