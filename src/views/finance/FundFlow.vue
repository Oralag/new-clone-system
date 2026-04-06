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
        <span class="s-formula">按所有资金收入明细汇总</span>
      </div>
      <div class="summary-card">
        <span class="s-label">累计支出</span>
        <span class="s-value red">¥{{ summary.expense.toFixed(2) }}</span>
        <span class="s-formula">按所有资金支出明细汇总</span>
      </div>
      <div class="summary-card">
        <span class="s-label">未付款</span>
        <span class="s-value orange">¥{{ summary.unpaid.toFixed(2) }}</span>
        <span class="s-formula">来源：应付账款 + 待付款费用</span>
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
        <el-table-column label="日期" width="150">
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
import { ref, reactive, computed, onMounted, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { getPayReceiptList, getCollectReceiptList, getExpenseList, getFundList } from '@/api/finance'
import http from '@/api/http'
import { normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'
import { buildSaleReturnSettlementRows, normalizeSaleReturnFinanceRows } from '@/utils/saleReturnFinance'
import { getPayReceiptSupplierLabel } from '@/utils/supplierLabel'
import { fmtDt } from '@/utils/date'

const route = useRoute()
const summaryLoading = ref(false)
const tableLoading = ref(false)
const summary = reactive({ balance: 0, income: 0, expense: 0, unpaid: 0 })
const purchaseOrdersForLabel = ref<any[]>([])
const supplierListForLabel = ref<any[]>([])

const filterKeyword = ref('')
const filterType = ref('')
const filterSource = ref('')

watchEffect(() => {
  const t = route.query.type
  filterType.value = (t === 'income' || t === 'expense') ? t as string : ''
})
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

function isCustomerPrepayLike(row: any) {
  const rawSource = String(
    row?.source_name ||
    row?.source_type ||
    row?.biz_type ||
    row?.module_name ||
    row?.trade_type ||
    row?.scene ||
    row?.contact_type ||
    row?.pay_type ||
    ''
  ).toLowerCase()
  const remark = String(row?.remark || '')
  return (
    rawSource.includes('prepay') ||
    rawSource.includes('预付') ||
    rawSource.includes('预收') ||
    remark.includes('预付款充值') ||
    remark.includes('预收款') ||
    remark.includes('预收')
  )
}

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
    const settled = await Promise.allSettled([
      getCollectReceiptList({ list_rows: 1000 }),
      http.get('/retail/order/index', { params: { list_rows: 1000 } }),
      getPayReceiptList({ list_rows: 1000 }),
      getExpenseList({ list_rows: 1000 }),
      http.get('/retail/recharge/index', { params: { list_rows: 1000 } }),
      http.get('/finance/Prepay/index', { params: { list_rows: 1000 } }),
      getFundList({ list_rows: 200 }),
      http.get('/procure/ProcureReturn/index', { params: { status: 1, list_rows: 1000 } }),
      http.get('/stock/SaleReturnOrder/index', { params: { status: 1, list_rows: 1000 } }),
      http.get('/stock/PurchaseOrder/index', { params: { list_rows: 1000 } }),
      http.get('/procure/supplier/index', { params: { list_rows: 500 } }),
    ])
    const ok = (i: number) => settled[i].status === 'fulfilled' ? (settled[i] as any).value : { data: { rows: [], list: [] } }
    const [collectRes, retailRes, payRes, expenseRes, rechargeRes, prepayRes, fundRes, returnRes, saleReturnRes, procureRes, supRes] = settled.map((_, i) => ok(i))
    purchaseOrdersForLabel.value = procureRes.data?.rows ?? []
    supplierListForLabel.value = supRes.data?.rows ?? []

    const items: FlowItem[] = []
    const fundRows: any[] = fundRes.data?.rows ?? fundRes.data?.list ?? []
    const fundNameMap = new Map<number, string>(fundRows.map((row: any) => [Number(row.id), String(row.name || '')]))

    const collectSourceMap: Record<string, string> = { customer: '销售收款', supplier: '供应商退款', staff: '员工还款', other: '其他收入' }
    const collects: any[] = collectRes.data?.rows ?? collectRes.data?.list ?? []
    for (const r of collects) {
      items.push({
        date: fmtDt(r.receipt_date || r.create_time),
        fund_name: r.fund_name || r.account_name || '—',
        type: 'income',
        source: isCustomerPrepayLike(r) ? '预收款' : (collectSourceMap[r.contact_type] || '收款单'),
        name: r.contact_name || r.customer_name || '—',
        order_no: r.receipt_no || r.order_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      })
    }

    const retails: any[] = (retailRes.data?.rows ?? retailRes.data?.list ?? []).filter((r: any) => r.status === 1)
    for (const r of retails) {
      items.push({
        date: fmtDt(r.order_date || r.create_time),
        fund_name: r.fund_name || r.account_name || '—',
        type: 'income',
        source: '零售单',
        name: r.customer_name || r.member_name || '散客',
        order_no: r.order_sn || r.order_no || '',
        amount: Number(r.pay_amount || r.total_amount || 0),
        remark: r.remark || '',
      })
    }

    const payments: any[] = payRes.data?.rows ?? payRes.data?.list ?? []
    const paySourceMap: Record<string, string> = { supplier: '采购付款', customer: '客户退款', staff: '员工费用', other: '其他支出' }
    for (const r of payments) {
      items.push({
        date: fmtDt(r.pay_date || r.create_time),
        fund_name: r.fund_name || r.account_name || '—',
        type: 'expense',
        source: paySourceMap[r.contact_type] || '付款单',
        name: getPayReceiptSupplierLabel(r, purchaseOrdersForLabel.value, supplierListForLabel.value),
        order_no: r.receipt_no || r.order_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      })
    }

    const recharges: any[] = rechargeRes.data?.rows ?? rechargeRes.data?.list ?? []
    for (const r of recharges) {
      items.push({
        date: fmtDt(r.recharge_date || r.create_time),
        fund_name: r.fund_name || r.account_name || '—',
        type: 'income',
        source: '会员充值',
        name: r.member_name || '—',
        order_no: r.recharge_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      })
    }

    const expenses: any[] = expenseRes.data?.rows ?? expenseRes.data?.list ?? []
    for (const r of expenses) {
      if (r.payment_status === 'pending') continue
      items.push({
        date: fmtDt(r.apply_date || r.expense_date || r.create_time),
        fund_name: r.fund_name || r.account_name || '—',
        type: 'expense',
        source: r.payment_status === 'paid' ? '费用(已付)' : '费用',
        name: r.type_name || r.expense_name || r.name || '—',
        order_no: r.expense_no || r.order_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark_clean || r.remark || '',
      })
    }

    const prepays: any[] = prepayRes.data?.rows ?? prepayRes.data?.list ?? []
    for (const r of prepays) {
      const isCustomer = r.pay_type === 'customer'
      items.push({
        date: fmtDt(r.create_time),
        fund_name: r.fund_name || '—',
        type: isCustomer ? 'income' : 'expense',
        source: isCustomer ? '客户预收款' : '供应商预付款',
        name: isCustomer ? (r.customer_name || '—') : (r.supplier_name || '—'),
        order_no: r.prepay_no || r.order_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      })
    }

    const normalizedReturns = normalizeProcureReturnFinanceRows(returnRes.data?.rows ?? [], fundNameMap)
    for (const r of normalizedReturns) {
      if (r.refund_amount <= 0) continue
      items.push({
        date: r.date,
        fund_name: r.fund_name || '—',
        type: 'income',
        source: '采购退货退款',
        name: r.supplier_name || '—',
        order_no: r.order_no || '',
        amount: Number(r.refund_amount || 0),
        remark: r.remark || '采购退货退款',
      })
    }

    const saleReturnFinanceRows = buildSaleReturnSettlementRows(
      [],
      normalizeSaleReturnFinanceRows(saleReturnRes.data?.rows ?? saleReturnRes.data?.list ?? [])
    )
    for (const r of saleReturnFinanceRows) {
      if (r.refund_amount <= 0) continue
      items.push({
        date: r.date,
        fund_name: '—',
        type: 'expense',
        source: '销售退货退款',
        name: r.customer_name || '—',
        order_no: r.order_no || '',
        amount: Number(r.refund_amount || 0),
        remark: r.remark || '销售退货退款',
      })
    }

    const validItems = items.filter(i => i.amount > 0)
    validItems.sort((a, b) => b.date.localeCompare(a.date))
    allItems.value = validItems

    const incomeTotal = items.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0)
    const expenseTotal = items.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
    summary.income = incomeTotal
    summary.expense = expenseTotal
    summary.balance = incomeTotal - expenseTotal
    // 未付款 = 待付款费用 + 已审核采购单欠款（已付从付款单匹配）
    const pendingExpenseTotal = expenses
      .filter((r: any) => r.payment_status === 'pending')
      .reduce((s: number, r: any) => s + Math.max(0, Number(r.amount || 0)), 0)
    const payRows: any[] = payRes.data?.rows ?? payRes.data?.list ?? []
    const procurePaidById: Record<number, number> = {}
    const procurePaidByKey: Record<string, number> = {}
    const procurePaidBySn: Record<string, number> = {}
    for (const r of payRows) {
      const amt = Number(r.amount || 0)
      if (!amt) continue
      const orderSn = String(r.order_sn || '').trim()
      const supplierName = String(r.supplier_name || r.contact_name || '').trim()
      if (orderSn && supplierName) procurePaidByKey[`${orderSn}@@${supplierName}`] = (procurePaidByKey[`${orderSn}@@${supplierName}`] || 0) + amt
      const m1 = String(r.remark || '').match(/采购单(?:自动)?付款\s+#(\d+)/)
      if (m1) { const id = Number(m1[1]); procurePaidById[id] = (procurePaidById[id] || 0) + amt }
      const m2 = String(r.remark || '').match(/采购单([A-Za-z0-9]+)审核自动生成/)
      if (m2) { const sn = m2[1].trim(); procurePaidBySn[sn] = (procurePaidBySn[sn] || 0) + amt }
    }
    const purchaseUnpaidTotal = (procureRes.data?.rows ?? [])
      .filter((r: any) => Number(r.status) === 1)
      .reduce((s: number, r: any) => {
        const orderAmt = Number(r.after_discount != null ? r.after_discount : r.total_amount)
        const sn = String(r.order_sn || r.order_no || '').trim()
        const sup = String(r.supplier_name || '').trim()
        const paid = procurePaidById[r.id] || procurePaidByKey[`${sn}@@${sup}`] || procurePaidBySn[sn] || 0
        return s + Math.max(0, orderAmt - paid)
      }, 0)
    summary.unpaid = pendingExpenseTotal + purchaseUnpaidTotal

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
