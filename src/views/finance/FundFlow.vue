<template>
  <div class="page-container fund-flow-page">
    <div class="page-title">{{ $t('finance.fundFlow.pageTitle') }}</div>
    <!-- 顶部汇总卡片 -->
    <div v-if="filterType !== 'expense' && filterType !== 'income'" class="summary-bar" v-loading="summaryLoading">
      <div class="summary-card">
        <span class="s-label">{{ $t('finance.fundFlow.summaryBalance') }}</span>
        <span class="s-value blue">¥{{ summary.balance.toFixed(2) }}</span>
        <span class="s-formula">{{ $t('finance.fundFlow.summaryBalanceFormula', { income: summary.income.toFixed(2), expense: summary.expense.toFixed(2), balance: summary.balance.toFixed(2) }) }}</span>
      </div>
      <div class="summary-card">
        <span class="s-label">{{ $t('finance.fundFlow.summaryIncome') }}</span>
        <span class="s-value green">+¥{{ summary.income.toFixed(2) }}</span>
        <span class="s-formula">{{ $t('finance.fundFlow.summaryIncomeDesc') }}</span>
      </div>
      <div class="summary-card">
        <span class="s-label">{{ $t('finance.fundFlow.summaryExpense') }}</span>
        <span class="s-value red">-¥{{ summary.expense.toFixed(2) }}</span>
        <span class="s-formula">{{ $t('finance.fundFlow.summaryExpenseDesc') }}</span>
      </div>
      <div class="summary-card">
        <span class="s-label">{{ $t('finance.fundFlow.summaryUnpaid') }}</span>
        <span class="s-value orange">¥{{ summary.unpaid.toFixed(2) }}</span>
        <span class="s-formula">{{ $t('finance.fundFlow.summaryUnpaidDesc') }}</span>
      </div>
      <div class="summary-card">
        <span class="s-label">{{ $t('finance.fundFlow.summaryUncollected') }}</span>
        <span class="s-value red">¥{{ summary.uncollected.toFixed(2) }}</span>
        <span class="s-formula">{{ $t('finance.fundFlow.summaryUncollectedDesc') }}</span>
      </div>
    </div>

    <!-- 收入分类汇总（仅收入视图显示） -->
    <div v-if="filterType === 'income'" class="income-breakdown-bar">
      <div class="ib-card total">
        <span class="ib-label">{{ $t('finance.fundFlow.incomeBreakdownTotal') }}</span>
        <span class="ib-value">+¥{{ incomeBreakdown.total.toFixed(2) }}</span>
      </div>
      <div class="ib-card">
        <span class="ib-label">{{ $t('finance.fundFlow.incomeBreakdownRetail') }}</span>
        <span class="ib-value">+¥{{ incomeBreakdown.retail.toFixed(2) }}</span>
      </div>
      <div class="ib-card">
        <span class="ib-label">{{ $t('finance.fundFlow.incomeBreakdownSales') }}</span>
        <span class="ib-value">+¥{{ incomeBreakdown.sales.toFixed(2) }}</span>
      </div>
      <div class="ib-card">
        <span class="ib-label">{{ $t('finance.fundFlow.incomeBreakdownOther') }}</span>
        <span class="ib-value">+¥{{ incomeBreakdown.other.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 支出分类汇总（仅支出视图显示） -->
    <div v-if="filterType === 'expense'" class="expense-breakdown-bar">
      <div class="eb-card total">
        <span class="eb-label">{{ $t('finance.fundFlow.expenseBreakdownTotal') }}</span>
        <span class="eb-value">-¥{{ expenseBreakdown.total.toFixed(2) }}</span>
      </div>
      <div class="eb-card">
        <span class="eb-label">{{ $t('finance.fundFlow.expenseBreakdownPurchase') }}</span>
        <span class="eb-value">-¥{{ expenseBreakdown.purchase.toFixed(2) }}</span>
      </div>
      <div class="eb-card">
        <span class="eb-label">{{ $t('finance.fundFlow.expenseBreakdownDelivery') }}</span>
        <span class="eb-value">-¥{{ expenseBreakdown.delivery.toFixed(2) }}</span>
      </div>
      <div class="eb-card">
        <span class="eb-label">{{ $t('finance.fundFlow.expenseBreakdownStore') }}</span>
        <span class="eb-value">-¥{{ expenseBreakdown.store.toFixed(2) }}</span>
      </div>
      <div class="eb-card">
        <span class="eb-label">{{ $t('finance.fundFlow.expenseBreakdownOther') }}</span>
        <span class="eb-value">-¥{{ expenseBreakdown.other.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 明细表格 -->
    <el-card class="flow-list-card">
      <div class="table-toolbar">
        <div class="toolbar-filters">
          <el-input v-model="filterKeyword" :placeholder="$t('finance.fundFlow.filterKeywordPlaceholder')" clearable style="width:180px" />
          <el-select v-model="filterType" :placeholder="$t('finance.fundFlow.filterTypePlaceholder')" clearable style="width:120px">
            <el-option :label="$t('finance.fundFlow.filterTypeIncome')" value="income" />
            <el-option :label="$t('finance.fundFlow.filterTypeExpense')" value="expense" />
          </el-select>
          <el-select v-model="filterSource" :placeholder="$t('finance.fundFlow.filterSourcePlaceholder')" clearable style="width:130px">
            <el-option v-for="item in sourceOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-tag v-if="dateScopeLabel" class="date-scope-tag" type="info" effect="plain">{{ dateScopeLabel }}</el-tag>
        </div>
        <span class="table-count">{{ $t('finance.fundFlow.tableCount', { count: filteredItems.length }) }}</span>
      </div>
      <el-table class="desktop-flow-table" :data="pagedItems" v-loading="tableLoading" border stripe style="width:100%">
        <el-table-column :label="$t('finance.fundFlow.colDate')" width="150">
          <template #default="{ row }">{{ row.date }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.fundFlow.colAccount')" width="120">
          <template #default="{ row }">{{ row.fund_name || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.fundFlow.colSource')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.fundFlow.colObject')" min-width="140">
          <template #default="{ row }">{{ row.name }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.fundFlow.colOrderNo')" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.order_no || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.fundFlow.colAmount')" width="130" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'income' ? '#16a34a' : '#dc2626', fontWeight: '600' }">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ Number(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.fundFlow.colRemark')" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
      </el-table>

      <div v-loading="tableLoading" class="mobile-flow-list">
        <div v-if="pagedItems.length === 0 && !tableLoading" class="mobile-flow-empty">{{ $t('finance.fundFlow.mobileNoData') }}</div>
        <div
          v-for="row in pagedItems"
          :key="`${row.type}-${row.source}-${row.order_no}-${row.date}-${row.amount}-${row.name}`"
          class="mobile-flow-card"
        >
          <div class="mf-head">
            <div class="mf-title">
              <span class="mf-source" :class="row.type">{{ row.source }}</span>
              <span class="mf-date">{{ row.date }}</span>
            </div>
            <div class="mf-amount" :class="row.type">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ Number(row.amount).toFixed(2) }}
            </div>
          </div>
          <div class="mf-name">{{ row.name || '—' }}</div>
          <div class="mf-meta">
            <span>{{ $t('finance.fundFlow.mobileAccount') }}：{{ row.fund_name || '—' }}</span>
            <span v-if="row.order_no">{{ $t('finance.fundFlow.mobileOrderNo') }}：{{ row.order_no }}</span>
          </div>
          <div v-if="row.remark" class="mf-remark">{{ $t('finance.fundFlow.mobileRemark') }}：{{ row.remark }}</div>
        </div>
      </div>

      <div class="pagination-wrap">
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
import { ref, reactive, computed, onMounted, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getPayReceiptList, getCollectReceiptList, getExpenseList, getFundList } from '@/api/finance'
import http from '@/api/http'
import { normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'
import { buildSaleReturnSettlementRows, normalizeSaleReturnFinanceRows } from '@/utils/saleReturnFinance'
import { getPayReceiptSupplierLabel } from '@/utils/supplierLabel'
import { buildProcureFeePaidByOrder, getProcureFeeNeedPayAmount, isProcureExtraFeePayment } from '@/utils/procureFeeFinance'
import { fmtDt } from '@/utils/date'
import { calcSaleContractReceivable } from '@/utils/saleContractAmount'

const { t } = useI18n()
const route = useRoute()
const summaryLoading = ref(false)
const tableLoading = ref(false)
const summary = reactive({ balance: 0, income: 0, expense: 0, unpaid: 0, uncollected: 0 })
const purchaseOrdersForLabel = ref<any[]>([])
const supplierListForLabel = ref<any[]>([])

const filterKeyword = ref('')
const filterType = ref('')
const filterSource = ref('')
const filterDate = ref('')

function getTodayKey() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getDateKey(value: string) {
  const text = String(value || '').trim()
  const match = text.match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : text.slice(0, 10)
}

watchEffect(() => {
  const t = route.query.type
  filterType.value = (t === 'income' || t === 'expense') ? t as string : ''
  filterDate.value = route.query.date === 'today' ? getTodayKey() : ''
})
const currentPage = ref(1)
const pageSize = ref(20)
const dateScopeLabel = computed(() => filterDate.value === getTodayKey() ? t('finance.fundFlow.dateScopeToday') : '')

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
  if (filterDate.value) list = list.filter(i => getDateKey(i.date) === filterDate.value)
  if (filterSource.value) list = list.filter(i => i.source === filterSource.value)
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    list = list.filter(i => i.name.toLowerCase().includes(kw) || (i.order_no || '').toLowerCase().includes(kw))
  }
  return list
})

watch([filterKeyword, filterType, filterSource, filterDate], () => {
  currentPage.value = 1
})

const sourceOptions = computed(() =>
  Array.from(new Set(allItems.value.map(item => item.source).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'zh-CN'))
)

// 收入分类汇总（仅在收入视图下显示）
const incomeBreakdown = computed(() => {
  const incomes = allItems.value.filter(i => i.type === 'income')
  const total = incomes.reduce((s, i) => s + i.amount, 0)
  const retail = incomes.filter(i => i.source === '零售单').reduce((s, i) => s + i.amount, 0)
  const sales = incomes.filter(i => i.source === '销售收款').reduce((s, i) => s + i.amount, 0)
  const other = total - retail - sales
  return { total, retail, sales, other }
})

// 支出分类汇总（仅在支出视图下显示）
const expenseBreakdown = computed(() => {
  const expenses = allItems.value.filter(i => i.type === 'expense')
  const total = expenses.reduce((s, i) => s + i.amount, 0)
  const purchase = expenses.filter(i => i.source === '采购付款').reduce((s, i) => s + i.amount, 0)
  const isDelivery = (i: FlowItem) =>
    /快递|运费|跑腿/.test(i.remark || '') || /快递|运费|跑腿/.test(i.name || '')
  const isStore = (i: FlowItem) =>
    /店面/.test(i.name || '') || /店面/.test(i.remark || '')
  const otherExpenses = expenses.filter(i => i.source !== '采购付款')
  const delivery = otherExpenses.filter(isDelivery).reduce((s, i) => s + i.amount, 0)
  const store = otherExpenses.filter(i => !isDelivery(i) && isStore(i)).reduce((s, i) => s + i.amount, 0)
  const other = otherExpenses.filter(i => !isDelivery(i) && !isStore(i)).reduce((s, i) => s + i.amount, 0)
  return { total, purchase, delivery, store, other }
})

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
      http.get('/shop/ContractOrder/index', { params: { list_rows: 3000 } }),
    ])
    const ok = (i: number) => settled[i].status === 'fulfilled' ? (settled[i] as any).value : { data: { rows: [], list: [] } }
    const [collectRes, retailRes, payRes, expenseRes, rechargeRes, prepayRes, fundRes, returnRes, saleReturnRes, procureRes, supRes, contractRes] = settled.map((_, i) => ok(i))
    purchaseOrdersForLabel.value = procureRes.data?.rows ?? []
    supplierListForLabel.value = supRes.data?.rows ?? []

    const items: FlowItem[] = []
    const fundRows: any[] = fundRes.data?.rows ?? fundRes.data?.list ?? []
    const fundNameMap = new Map<number, string>(fundRows.map((row: any) => [Number(row.id), String(row.name || '')]))

    const collectSourceMap: Record<string, string> = { customer: '销售收款', sale: '销售收款', supplier: '供应商退款', staff: '员工还款', other: '其他收入' }
    const PLATFORM_REMARK_MAP: [string, string][] = [
      ['[微信小店]', '微信小店'], ['[拼多多]', '拼多多'], ['[小红书]', '小红书'],
      ['[抖音]', '抖音'], ['[美团]', '美团'], ['[淘宝]', '淘宝'],
    ]
    const collects: any[] = collectRes.data?.rows ?? collectRes.data?.list ?? []
    for (const r of collects) {
      const ctKey = r.contact_type || r.category || ''
      const remark = String(r.remark || '')
      const platformEntry = PLATFORM_REMARK_MAP.find(([tag]) => remark.includes(tag))
      // contact_type 为空但有 customer_name 的，视为销售收款
      const resolvedSource = isCustomerPrepayLike(r) ? '预收款'
        : platformEntry ? platformEntry[1]
        : (collectSourceMap[ctKey] || (r.customer_name ? '销售收款' : '其他收入'))
      const resolvedName = r.contact_name || r.customer_name || (platformEntry ? platformEntry[1] : '—')
      items.push({
        date: fmtDt(r.receipt_date || r.create_time),
        fund_name: r.fund_name || r.account_name || '—',
        type: 'income',
        source: resolvedSource,
        name: resolvedName,
        order_no: r.receipt_no || r.order_no || '',
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      })
    }

    const retails: any[] = (retailRes.data?.rows ?? retailRes.data?.list ?? []).filter((r: any) => Number(r.status) === 1)
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
      // 单据支出费用已从 pay_receipt 中展示，跳过避免重复
      if (/^采购单据支出\s*#\d+$/.test(r.remark || '')) continue
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

    // 销售退货退款留在客户余额（非现金流出），不计入资金流水支出

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
    const procureFeePaidById = buildProcureFeePaidByOrder(payRows)
    for (const r of payRows) {
      const amt = Number(r.amount || 0)
      if (!amt) continue
      if (isProcureExtraFeePayment(r)) continue
      if (/审核自动生成/.test(String(r.remark || ''))) continue
      const orderSn = String(r.order_sn || '').trim()
      const supplierName = String(r.supplier_name || r.contact_name || '').trim()
      const m1 = String(r.remark || '').match(/采购单(?:自动)?付款\s+#(\d+)/)
      if (m1) { const id = Number(m1[1]); procurePaidById[id] = (procurePaidById[id] || 0) + amt }
      else if (orderSn && supplierName) procurePaidByKey[`${orderSn}@@${supplierName}`] = (procurePaidByKey[`${orderSn}@@${supplierName}`] || 0) + amt
    }
    const purchaseUnpaidTotal = (procureRes.data?.rows ?? [])
      .filter((r: any) => Number(r.status) === 1)
      .reduce((s: number, r: any) => {
        const orderAmt = Number(r.after_discount != null ? r.after_discount : r.total_amount)
        const oSn = String(r.order_sn || '').trim()
        const oNo = String(r.order_no || '').trim()
        const sup = String(r.supplier_name || '').trim()
        const paid = (procurePaidById[r.id] || 0)
          + (procurePaidBySn[oSn] || procurePaidBySn[oNo] || 0)
          + (procurePaidByKey[`${oSn}@@${sup}`] || procurePaidByKey[`${oNo}@@${sup}`] || 0)
        const feeUnpaid = Math.max(0, getProcureFeeNeedPayAmount(r) - (procureFeePaidById[r.id] || 0))
        return s + Math.max(0, orderAmt - paid) + feeUnpaid
      }, 0)
    summary.unpaid = pendingExpenseTotal + purchaseUnpaidTotal

    // 未收款：FIFO 匹配已审核销售合同与收款单
    const audited = (contractRes.data?.rows ?? []).filter((c: any) => Number(c.status) === 1)
    const snToContractId = new Map<string, number>()
    for (const c of audited) {
      if (c.order_sn) snToContractId.set(String(c.order_sn), c.id)
    }
    const contractCalcAmt = (c: any): number => {
      return calcSaleContractReceivable(c)
    }
    const contractDirectPaid = new Map<number, number>()
    const custUnmatchedPaid = new Map<number, number>()
    for (const r of collects) {
      if (String(r.remark || '').startsWith('[other]')) continue
      const amount = Number(r.amount || 0)
      const rsn = String(r.order_sn || '').trim()
      const custId = Number(r.customer_id || 0)
      if (rsn && snToContractId.has(rsn)) {
        const cid = snToContractId.get(rsn)!
        contractDirectPaid.set(cid, (contractDirectPaid.get(cid) ?? 0) + amount)
      } else if (custId > 0) {
        custUnmatchedPaid.set(custId, (custUnmatchedPaid.get(custId) ?? 0) + amount)
      }
    }
    const byCustomer = new Map<number, any[]>()
    for (const c of audited) {
      const custId = Number(c.customer_id || 0)
      if (custId > 0 && custUnmatchedPaid.has(custId)) {
        if (!byCustomer.has(custId)) byCustomer.set(custId, [])
        byCustomer.get(custId)!.push(c)
      }
    }
    for (const cl of byCustomer.values()) {
      cl.sort((a: any, b: any) => String(a.order_date || a.created_at || '').localeCompare(String(b.order_date || b.created_at || '')))
    }
    const contractFifoPaid = new Map<number, number>()
    for (const [custId, cl] of byCustomer) {
      let remaining = custUnmatchedPaid.get(custId) ?? 0
      for (const c of cl) {
        const total = contractCalcAmt(c)
        const direct = contractDirectPaid.get(c.id) ?? 0
        const leftover = Math.max(0, total - direct)
        const applied = Math.min(remaining, leftover)
        if (applied > 0) contractFifoPaid.set(c.id, applied)
        remaining = Math.max(0, remaining - applied)
        if (remaining <= 0) break
      }
    }
    let uncollectedTotal = 0
    for (const c of audited) {
      const receiptPaid = contractDirectPaid.has(c.id) || contractFifoPaid.has(c.id)
        ? (contractDirectPaid.get(c.id) ?? 0) + (contractFifoPaid.get(c.id) ?? 0)
        : undefined
      const paid = receiptPaid !== undefined ? receiptPaid : Number(c.receive_amount || 0)
      const total = contractCalcAmt(c)
      uncollectedTotal += Math.max(0, total - paid)
    }
    summary.uncollected = uncollectedTotal

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
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}
.income-breakdown-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.ib-card {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ib-card.total {
  background: #fff;
  border-color: #16a34a;
}
.ib-label { font-size: 11px; color: rgba(29,29,31,0.45); }
.ib-value { font-size: 16px; font-weight: 700; color: #16a34a; }

.expense-breakdown-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.eb-card {
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.eb-card.total {
  background: #fff;
  border-color: #dc2626;
}
.eb-label { font-size: 11px; color: rgba(29,29,31,0.45); }
.eb-value { font-size: 16px; font-weight: 700; color: #dc2626; }
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
.date-scope-tag { align-self: center; }
.mobile-flow-list { display: none; }
.pagination-wrap { display:flex; justify-content:flex-end; margin-top:12px; }

@media (max-width: 767px) {
  .fund-flow-page {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    gap: 12px;
    padding: 0 10px 12px;
    overflow-x: hidden !important;
  }
  .fund-flow-page,
  .fund-flow-page * {
    box-sizing: border-box;
  }
  .page-title {
    font-size: 18px;
    padding: 2px 0;
  }
  .summary-bar {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
  .summary-card {
    flex: none !important;
    min-width: 0 !important;
    max-width: 100% !important;
    padding: 12px;
    border-radius: 10px;
  }
  .s-value {
    font-size: clamp(18px, 6vw, 24px);
    line-height: 1.15;
    word-break: break-all;
  }
  .s-formula {
    line-height: 1.35;
  }
  :deep(.el-card__body) {
    padding: 12px;
  }
  .flow-list-card {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden !important;
  }
  .flow-list-card :deep(.el-card__body) {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden !important;
  }
  .table-toolbar {
    align-items: stretch;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
  .toolbar-filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
    gap: 8px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
  .toolbar-filters > * {
    min-width: 0 !important;
    max-width: 100% !important;
  }
  .toolbar-filters :deep(.el-input),
  .toolbar-filters :deep(.el-select) {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  .toolbar-filters :deep(.el-select:nth-child(3)) {
    grid-column: 1 / -1;
  }
  .date-scope-tag {
    grid-column: 1 / -1;
    justify-self: flex-start;
  }
  .table-count {
    width: 100%;
    text-align: right;
  }
  .desktop-flow-table {
    display: none !important;
  }
  .mobile-flow-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 80px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }
  .mobile-flow-empty {
    padding: 28px 0;
    text-align: center;
    color: rgba(29,29,31,0.35);
    font-size: 13px;
  }
  .mobile-flow-card {
    background: #fff;
    border: 1px solid #edf0f5;
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    min-width: 0;
  }
  .mf-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
    min-width: 0;
  }
  .mf-title {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1 1 auto;
    min-width: 0;
  }
  .mf-source {
    display: inline-flex;
    align-items: center;
    max-width: 120px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.6;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mf-source.income {
    color: #16a34a;
    background: rgba(22,163,74,0.1);
  }
  .mf-source.expense {
    color: #dc2626;
    background: rgba(220,38,38,0.1);
  }
  .mf-date {
    color: #9ca3af;
    font-size: 12px;
    line-height: 24px;
  }
  .mf-amount {
    flex: 0 1 auto;
    min-width: 0;
    font-size: 17px;
    font-weight: 800;
    line-height: 1.4;
    text-align: right;
    word-break: break-word;
  }
  .mf-amount.income { color: #16a34a; }
  .mf-amount.expense { color: #dc2626; }
  .mf-name {
    margin-top: 9px;
    color: #1d2129;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.45;
    word-break: break-word;
  }
  .mf-meta {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 7px;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.4;
    word-break: break-word;
  }
  .mf-remark {
    margin-top: 7px;
    color: #9ca3af;
    font-size: 12px;
    line-height: 1.45;
    word-break: break-word;
  }
  .pagination-wrap {
    justify-content: center;
    overflow-x: hidden;
    padding-bottom: 2px;
  }
  .pagination-wrap :deep(.el-pagination) {
    --el-pagination-button-width: 28px;
    --el-pagination-button-height: 28px;
    max-width: 100%;
    flex-wrap: nowrap;
    justify-content: center;
  }
  .pagination-wrap :deep(.el-pagination__sizes),
  .pagination-wrap :deep(.el-pagination__total),
  .pagination-wrap :deep(.el-pager) {
    display: none;
  }
}
</style>
