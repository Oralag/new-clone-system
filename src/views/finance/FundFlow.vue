<template>
  <div class="page-container">
    <div class="page-title">资金明细</div>
    <!-- 顶部汇总卡片 -->
    <div class="summary-bar" v-loading="summaryLoading">
      <div class="summary-card">
        <span class="s-label">资金余额</span>
        <span class="s-value blue">¥{{ summary.balance.toFixed(2) }}</span>
        <span class="s-formula">收入 ¥{{ summary.income.toFixed(2) }} − 支出 ¥{{ summary.expense.toFixed(2) }} = ¥{{ summary.balance.toFixed(2) }}</span>
      </div>
      <div class="summary-card">
        <span class="s-label">累计收入</span>
        <span class="s-value green">¥{{ summary.income.toFixed(2) }}</span>
        <span class="s-formula">收款单 + 零售单</span>
      </div>
      <div class="summary-card">
        <span class="s-label">累计支出</span>
        <span class="s-value red">¥{{ summary.expense.toFixed(2) }}</span>
        <span class="s-formula">付款单合计</span>
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
            <el-option label="销售收款" value="销售收款" />
            <el-option label="会员充值" value="会员充值" />
            <el-option label="其他收入" value="其他收入" />
            <el-option label="零售单" value="零售单" />
            <el-option label="采购付款" value="采购付款" />
            <el-option label="其他支出" value="其他支出" />
            <el-option label="费用" value="费用" />
          </el-select>
        </div>
        <span class="table-count">共 {{ filteredItems.length }} 条</span>
      </div>
      <el-table :data="pagedItems" v-loading="tableLoading" border stripe style="width:100%">
        <el-table-column label="日期" width="110">
          <template #default="{ row }">{{ row.date }}</template>
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
import { getFundList, getPayReceiptList, getCollectReceiptList, getExpenseList } from '@/api/finance'
import { getProcureOrderList } from '@/api/procure'
import http from '@/api/http'

const summaryLoading = ref(false)
const tableLoading = ref(false)
const summary = reactive({ balance: 0, income: 0, expense: 0, totalPurchase: 0, unpaid: 0 })

const filterKeyword = ref('')
const filterType = ref('')
const filterSource = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

interface FlowItem {
  date: string
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

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

onMounted(async () => {
  summaryLoading.value = true
  tableLoading.value = true
  try {
    const [collectRes, retailRes, purchaseRes, payRes, expenseRes, rechargeRes] = await Promise.all([
      getCollectReceiptList({ list_rows: 1000 }),
      http.get('/retail/order/index', { params: { list_rows: 1000 } }),
      getProcureOrderList({ list_rows: 1000 }),
      getPayReceiptList({ list_rows: 1000 }),
      getExpenseList({ list_rows: 1000 }),
      http.get('/retail/recharge/index', { params: { list_rows: 1000 } }),
    ])

    const items: FlowItem[] = []

    // 收款单（收入）
    const collectSourceMap: Record<string, string> = { customer: '销售收款', supplier: '供应商退款', staff: '员工还款', other: '其他收入' }
    const collects: any[] = collectRes.data?.rows ?? collectRes.data?.list ?? []
    for (const r of collects) {
      items.push({
        date: (r.receipt_date || r.create_time || '').slice(0, 10),
        type: 'income',
        source: collectSourceMap[r.contact_type] || '收款单',
        name: r.contact_name || r.customer_name || '—',
        order_no: r.receipt_no || r.order_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      })
    }

    // 零售单（收入）
    const retails: any[] = retailRes.data?.rows ?? retailRes.data?.list ?? []
    for (const r of retails) {
      items.push({
        date: (r.order_date || r.create_time || '').slice(0, 10),
        type: 'income',
        source: '零售单',
        name: r.customer_name || r.member_name || '散客',
        order_no: r.order_sn || r.order_no || '',
        amount: Number(r.total_amount || r.pay_amount || 0),
        remark: r.remark || '',
      })
    }

    // 付款单（支出）
    const payments: any[] = payRes.data?.rows ?? payRes.data?.list ?? []
    const paySourceMap: Record<string, string> = { supplier: '采购付款', customer: '客户退款', staff: '员工费用', other: '其他支出' }
    for (const r of payments) {
      items.push({
        date: (r.pay_date || r.create_time || '').slice(0, 10),
        type: 'expense',
        source: paySourceMap[r.contact_type] || '付款单',
        name: r.contact_name || r.supplier_name || '—',
        order_no: r.receipt_no || r.order_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      })
    }

    // 会员充值（收入）
    const recharges: any[] = rechargeRes.data?.rows ?? rechargeRes.data?.list ?? []
    for (const r of recharges) {
      items.push({
        date: (r.recharge_date || r.create_time || '').slice(0, 10),
        type: 'income',
        source: '会员充值',
        name: r.member_name || '—',
        order_no: r.recharge_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      })
    }

    // 客户预付款（收入）/ 供应商预付款（支出）
    // 已通过收款单/付款单记录，不重复计入

    // 费用（支出）
    const expenses: any[] = expenseRes.data?.rows ?? expenseRes.data?.list ?? []
    for (const r of expenses) {
      items.push({
        date: (r.apply_date || r.expense_date || r.create_time || '').slice(0, 10),
        type: 'expense',
        source: '费用',
        name: r.type_name || r.expense_name || r.name || '—',
        order_no: r.expense_no || r.order_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      })
    }

    // 过滤掉金额为0的无效条目，按日期倒序
    const validItems = items.filter(i => i.amount > 0)
    validItems.sort((a, b) => b.date.localeCompare(a.date))
    allItems.value = validItems

    // 汇总
    const incomeTotal = items.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0)
    const expenseTotal = items.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
    summary.income = incomeTotal
    summary.expense = expenseTotal
    summary.balance = Math.max(0, incomeTotal - expenseTotal)
    summary.totalPurchase = 0
    summary.unpaid = 0

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
