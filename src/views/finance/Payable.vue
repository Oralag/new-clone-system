<template>
  <div class="payable-page">
    <!-- 顶部汇总 -->
    <div class="summary-bar">
      <span class="summary-item">{{ $t('finance.payable.summaryUnpaid') }}：<strong class="red">{{ fmt(summaryUnpaid) }}</strong></span>
      <span class="summary-item">{{ $t('finance.payable.summaryPaid') }}：<strong class="blue">{{ fmt(summaryPaid) }}</strong></span>
      <span class="summary-item">{{ $t('finance.payable.summaryOrder') }}：<strong class="orange">{{ fmt(summaryOrder) }}</strong></span>
      <span class="summary-item">{{ $t('finance.payable.summaryReturn') }}：<strong>{{ fmt(summaryReturn) }}</strong></span>
    </div>

    <el-card class="table-card">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <div class="search-area">
          <el-select
            v-model="searchForm.supplier_name"
            :placeholder="$t('finance.payable.searchSupplierPlaceholder')"
            clearable
            filterable
            style="width:200px"
          >
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-date-picker
            v-model="searchForm.date_from"
            type="date"
            :placeholder="$t('finance.payable.searchDateFrom')"
            value-format="YYYY-MM-DD"
            style="width:140px"
          />
          <span style="color:rgba(29,29,31,0.35)">{{ $t('finance.payable.searchDateSeparator') }}</span>
          <el-date-picker
            v-model="searchForm.date_to"
            type="date"
            :placeholder="$t('finance.payable.searchDateTo')"
            value-format="YYYY-MM-DD"
            style="width:140px"
          />
          <el-button type="primary" :icon="Search" @click="load">{{ $t('finance.payable.btnSearch') }}</el-button>
          <el-button :icon="Refresh" @click="resetSearch">{{ $t('finance.payable.btnReset') }}</el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table :data="displayRows" v-loading="loading" border stripe style="width:100%" size="default">
        <el-table-column type="selection" width="44" />
        <el-table-column v-if="!isMobile" type="index" :label="$t('finance.payable.colIndex')" width="60" align="center" />
        <el-table-column v-if="!isMobile" :label="$t('finance.payable.colSource')" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.__payable_source === 'expense' ? 'warning' : row.__payable_source === 'contract_fee' ? 'info' : row.__payable_source === 'retail_fee' ? 'success' : 'primary'"
              size="small"
            >
              {{ row.source_name || (row.__payable_source === 'expense' ? $t('finance.payable.sourceProduction') : row.__payable_source === 'contract_fee' ? $t('finance.payable.sourceContractFee') : row.__payable_source === 'retail_fee' ? $t('finance.payable.sourceRetailFee') : $t('finance.payable.sourcePurchase')) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplier_name" :label="$t('finance.payable.colSupplier')" min-width="150" />
        <el-table-column v-if="!isMobile" prop="contact_name" :label="$t('finance.payable.colContact')" min-width="100" />
        <el-table-column v-if="!isMobile" prop="contact_mobile" :label="$t('finance.payable.colMobile')" min-width="130" />
        <el-table-column v-if="!isMobile" :label="$t('finance.payable.colPrepay')" min-width="110" align="right">
          <template #default="{ row }">{{ fmt(row.prepay || 0) }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.payable.colOrderAmount')" min-width="120" align="right">
          <template #default="{ row }">
            <span style="font-weight:600">{{ fmt(row.order_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="!isMobile" :label="$t('finance.payable.colPaidAmount')" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3">{{ fmt(row.paid_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.payable.colUnpaidAmount')" min-width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: Number(row.un_pay_amount) > 0 ? '#dc2626' : Number(row.un_pay_amount) < 0 ? '#d97706' : '#16a34a', fontWeight: '600' }">
              {{ fmt(row.un_pay_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.payable.colActions')" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">{{ $t('finance.payable.btnDebtDetail') }}</el-button>
            <el-button v-if="row.__payable_source !== 'expense'" type="warning" link size="small" @click="goPay(row)">{{ $t('finance.payable.btnPay') }}</el-button>
            <el-button v-else type="warning" link size="small" @click="router.push('/finance/expense')">{{ $t('finance.payable.btnExpense') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="(s: number) => { pageSize.value = s; page.value = 1 }"
          @current-change="(p: number) => { page.value = p }"
        />
      </div>
    </el-card>

    <!-- 欠款详情弹框 -->
    <el-dialog v-model="detailVisible" :title="`${detailSupplier} - ${$t('finance.payable.btnDebtDetail')}`" width="min(960px, 95vw)" destroy-on-close>
      <el-table :data="detailRows" border size="small">
        <el-table-column type="index" :label="$t('finance.payable.detailColIndex')" width="56" align="center" />
        <el-table-column prop="source_name" :label="$t('finance.payable.detailColSource')" min-width="100">
          <template #default="{ row }">{{ row.source_name || $t('finance.payable.detailSourceFallback') }}</template>
        </el-table-column>
        <el-table-column prop="order_no" :label="$t('finance.payable.detailColOrderNo')" min-width="150" />
        <el-table-column :label="$t('finance.payable.detailColOrderAmount')" min-width="110" align="right">
          <template #default="{ row }">{{ fmt(row.order_amount) }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.payable.detailColPaidAmount')" min-width="110" align="right">
          <template #default="{ row }"><span style="color:#0071e3">{{ fmt(row.paid_amount) }}</span></template>
        </el-table-column>
        <el-table-column :label="$t('finance.payable.detailColUnpaidAmount')" min-width="110" align="right">
          <template #default="{ row }"><span :style="{ color: Number(row.un_pay_amount) < 0 ? '#d97706' : '#dc2626', fontWeight: '600' }">{{ fmt(row.un_pay_amount) }}</span></template>
        </el-table-column>
        <el-table-column :label="$t('finance.payable.detailColPayAccount')" min-width="120">
          <template #default="{ row }">
            <span v-if="Number(row.paid_amount) > 0 && row.fund_names && row.fund_names.length" style="color:rgba(29,29,31,0.7);font-size:12px">
              {{ row.fund_names.join('、') }}
            </span>
            <span v-else style="color:rgba(29,29,31,0.3);font-size:12px">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" :label="$t('finance.payable.detailColOrderDate')" min-width="110" />
        <el-table-column :label="$t('finance.payable.detailColActions')" width="110" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToOrder(row)">{{ $t('finance.payable.detailBtnViewOrder') }}</el-button>
            <el-button v-if="Number(row.un_pay_amount) > 0" type="warning" link size="small" @click="goPaySingle(row)">{{ $t('finance.payable.detailBtnPay') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search, Refresh } from '@element-plus/icons-vue'
import http from '@/api/http'
import { getExpenseList, getPayReceiptList } from '@/api/finance'
import { getRetailOrderList } from '@/api/retail'
import { getSupplierList } from '@/api/procure'
import { applyProcureReturnsToPayableRows, normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'
import { buildExpensePayableRows } from '@/utils/expensePayable'
import { buildSupplierPayableRows, buildContractFeePayableRows, buildRetailFeePayableRows } from '@/utils/payableCalc'

const { t } = useI18n()
const router = useRouter()

const isMobile = ref(window.innerWidth < 768)
let _rt: ReturnType<typeof setTimeout> | null = null
function _onResize() { if (_rt) clearTimeout(_rt); _rt = setTimeout(() => { isMobile.value = window.innerWidth < 768 }, 300) }

const loading = ref(false)
const rows = ref<any[]>([])
const rawRows = ref<any[]>([])
const procureReturnRows = ref<any[]>([])
const allPayReceipts = ref<any[]>([])
const fundNameMap = ref<Map<number, string>>(new Map())
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const supplierOptions = ref<any[]>([])

const filteredRows = computed(() => {
  const normalizedReturns = normalizeProcureReturnFinanceRows(procureReturnRows.value)
  return applyProcureReturnsToPayableRows(rawRows.value, normalizedReturns)
})

const displayRows = computed(() => {
  const all = filteredRows.value
  const start = (page.value - 1) * pageSize.value
  return all.slice(start, start + pageSize.value)
})

const searchForm = reactive({ supplier_name: '', date_from: '', date_to: '' })

function fmt(v: any) {
  return Number(v || 0).toFixed(2)
}

const summaryOrder = computed(() => filteredRows.value.reduce((s, r) => s + Number(r.order_amount || 0), 0))
const summaryPaid = computed(() => filteredRows.value.reduce((s, r) => s + Number(r.paid_amount || 0), 0))
const summaryUnpaid = computed(() => filteredRows.value.reduce((s, r) => s + Number(r.un_pay_amount || 0), 0))
const summaryReturn = computed(() => filteredRows.value.reduce((s, r) => s + Number(r.return_amount || 0), 0))

async function load() {
  loading.value = true
  try {
    const settled = await Promise.allSettled([
      http.get('/stock/PurchaseOrder/index', {
        params: {
          list_rows: 2000,
          status: 1,
          supplier_name: searchForm.supplier_name || undefined,
        }
      }),
      http.get('/procure/ProcureReturn/index', {
        params: {
          supplier_name: searchForm.supplier_name || undefined,
          status: 1,
          list_rows: 1000,
        }
      }),
      http.get('/procure/supplier/index', { params: { list_rows: 500 } }),
      getExpenseList({ list_rows: 1000 }),
      getPayReceiptList({ list_rows: 2000 }),
      http.get('/shop/ContractOrder/index', { params: { list_rows: 2000 } }),
      getRetailOrderList({ list_rows: 2000 }),
    ])
    const ok = (i: number) => settled[i].status === 'fulfilled' ? (settled[i] as any).value : { data: { rows: [], list: [] } }
    const [orderRes, returnRes, supplierRes, expenseRes, payReceiptRes, contractRes, retailRes] = settled.map((_, i) => ok(i))

    // 构建资金账户 id→name 映射，用于付款单 fund_name 缺失时的回退
    const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 200 } }).catch(() => ({ data: { rows: [] } }))
    fundNameMap.value = new Map((fundRes.data?.rows ?? []).map((f: any) => [Number(f.id), String(f.name || '')]))

    const rawPayList = payReceiptRes.data?.rows ?? []
    // 统一口径：应付计算全部走 utils/payableCalc.ts（与 Overview.vue / FundFlow.vue 共用）
    const aggregated = buildSupplierPayableRows(
      orderRes.data?.rows ?? [],
      rawPayList,
      supplierRes.data?.rows ?? [],
      { dateFrom: searchForm.date_from, dateTo: searchForm.date_to },
    )

    const expensePayables = buildExpensePayableRows(expenseRes.data?.rows ?? expenseRes.data?.list ?? [])
      .filter((row: any) => !searchForm.supplier_name || String(row.supplier_name || '').includes(searchForm.supplier_name))
      .filter((row: any) => {
        const dueDate = String(row.orders?.[0]?.due_date || '')
        if (searchForm.date_from && dueDate < searchForm.date_from) return false
        if (searchForm.date_to && dueDate > searchForm.date_to) return false
        return true
      })

    // 合同附加费用 / 零售附加费用：统一走 utils/payableCalc.ts
    const contractFeeRows = buildContractFeePayableRows(contractRes.data?.rows ?? [], rawPayList)
      .filter(r => !searchForm.supplier_name || r.supplier_name.includes(searchForm.supplier_name))
    const retailFeeRows = buildRetailFeePayableRows(retailRes.data?.rows ?? [], rawPayList)

    rawRows.value = [...aggregated.filter(s => s.un_pay_amount > 0), ...expensePayables, ...contractFeeRows, ...retailFeeRows]
    procureReturnRows.value = returnRes.data?.rows ?? []
    allPayReceipts.value = rawPayList
    total.value = filteredRows.value.length
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  Object.assign(searchForm, { supplier_name: '', date_from: '', date_to: '' })
  page.value = 1
  load()
}

// 欠款详情
const detailVisible = ref(false)
const detailSupplier = ref('')
const detailSupplierId = ref<any>(null)
const detailRows = ref<any[]>([])

function viewDetail(row: any) {
  detailSupplier.value = row.supplier_name
  detailSupplierId.value = row.supplier_id
  detailRows.value = (row.orders ?? []).filter((o: any) => Number(o.un_pay_amount) !== 0).map((o: any) => {
    const receipts = allPayReceipts.value.filter(r => {
      if (!Number(r.amount)) return false
      const sn = String(r.order_sn || '').trim()
      const oNo = String(o.order_no || '').trim()
      if (Number(r.order_id) && Number(r.order_id) === o.order_id) return true
      const m = [...String(r.remark || '').matchAll(/采购单(?:自动)?付款\s+#(\d+)/g)]
      if (m.some(x => Number(x[1]) === o.order_id)) return true
      const m2 = String(r.remark || '').match(/采购单([A-Za-z0-9-]+)审核自动生成/)
      if (m2 && m2[1].trim() === oNo) return true
      if (sn && oNo && sn === oNo) return true
      return false
    })
    const fundNames = [...new Set(receipts.map(r => {
      const name = String(r.fund_name || '').trim()
      if (name) return name
      const fid = Number(r.fund_id)
      return fid ? (fundNameMap.value.get(fid) || '') : ''
    }).filter(Boolean))]
    return { ...o, fund_names: fundNames }
  })
  detailVisible.value = true
}

// 跳转付款单新增页，带供应商参数
function goPay(row: any) {
  const unpaidOrders = (row.orders ?? []).filter((o: any) => Number(o.un_pay_amount) > 0)
  const orderIds = unpaidOrders.map((o: any) => o.order_id).filter(Boolean).join(',')
  const orderAmounts = unpaidOrders.map((o: any) => Number(o.un_pay_amount).toFixed(2)).join(',')
  const orderSns = unpaidOrders.map((o: any) => String(o.order_sn || '')).join(',')
  const orderPayAmounts = unpaidOrders.map((o: any) => Number(o.base_pay_amount || 0).toFixed(2)).join(',')
  router.push({
    path: '/finance/pay-receipt/new',
    query: {
      supplier_id: row.supplier_id,
      supplier_name: row.supplier_name,
      un_pay_amount: row.un_pay_amount,
      order_ids: orderIds || undefined,
      order_amounts: orderAmounts || undefined,
      order_sns: orderSns || undefined,
      order_pay_amounts: orderPayAmounts || undefined,
    }
  })
}

// 从欠款详情弹框单笔付款（精确传 order_id）
function goPaySingle(order: any) {
  detailVisible.value = false
  router.push({
    path: '/finance/pay-receipt/new',
    query: {
      supplier_id: detailSupplierId.value,
      supplier_name: detailSupplier.value,
      un_pay_amount: order.un_pay_amount,
      order_id: order.order_id,
      order_no: order.order_no,
      order_sn: order.order_sn || '',
      order_pay_amount: Number(order.base_pay_amount || 0).toFixed(2),
    }
  })
}

// 跳转到采购单列表并高亮对应单据
function goToOrder(order: any) {
  detailVisible.value = false
  const sn = String(order.order_no || '').trim()
  const id = order.order_id
  // 合同附加费 → 销售订单查看页
  if (String(order.source_name || '').includes('合同附加')) {
    const rn = String(order.order_no || '').trim()
    router.push({ path: `/sale/contract/view/${id}`, query: rn ? { receipt_no: rn } : {} })
  } else {
    router.push(`/procure/order/view/${id}`)
  }
}

onMounted(async () => {
  const res = await getSupplierList({ list_rows: 500 })
  supplierOptions.value = res.data?.rows ?? []
  await load()
  window.addEventListener('resize', _onResize)
})
// keep-alive 下返回此页时重新拉取数据（否则付款后回来数据不更新）
onActivated(() => { load() })
onUnmounted(() => window.removeEventListener('resize', _onResize))
</script>

<style scoped>
.payable-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-bar {
  background: #fff;
  border-radius: 12px;
  padding: 14px 24px;
  display: flex;
  gap: 40px;
  border: 1px solid rgba(0,0,0,0.06);
  font-size: 14px;
  color: rgba(29,29,31,0.5);
}

.summary-item strong { font-size: 16px; }
.summary-item strong.red { color: #dc2626; }
.summary-item strong.blue { color: #0071e3; }
.summary-item strong.orange { color: #ea580c; }

.table-card { border-radius: 12px; }

.toolbar {
  margin-bottom: 14px;
}

.search-area {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
