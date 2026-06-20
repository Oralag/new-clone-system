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
import { getProcureOrderSupplierLabel, getProcureOrderSupplierId } from '@/utils/supplierLabel'
import { buildExpensePayableRows } from '@/utils/expensePayable'
import { buildProcureFeePaidByOrder, getProcureFeeNeedPayAmount, isProcureExtraFeePayment } from '@/utils/procureFeeFinance'
import { fmtDt } from '@/utils/date'

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
    // 审核自动生成的付款单是系统预付记录，不计入应付欠款（与原系统口径一致）
    const manualPayList = rawPayList.filter((r: any) =>
      !/审核自动生成/.test(String(r.remark || ''))
    )
    const procureFeePaidById = buildProcureFeePaidByOrder(manualPayList)


    const orders: any[] = (orderRes.data?.rows ?? []).filter((o: any) => Number(o.status) === 1)

    // 构建已关联采购单的 order_sn 集合（用于区分"已链接"和"未链接"付款）
    const orderSnSet = new Set(orders.map(o => String(o.order_sn || '').trim()).filter(Boolean))
    const orderNoSet = new Set(orders.map(o => String(o.order_no || '').trim()).filter(Boolean))

    // 构建"未链接到具体采购单"的手动付款：按供应商名聚合
    // 场景：从应付款点"付款"→多订单路径，PayReceipt 没有 order_id，order_sn 为空
    // 后端无法更新采购单 pay_amount，这里在供应商层面补计
    const unlinkedPaidBySupplier: Record<string, number> = {}
    for (const r of manualPayList) {
      if (String(r.contact_type || '') !== 'supplier') continue
      const amt = Number(r.amount || 0)
      if (!amt) continue
      const sn = String(r.order_sn || '').trim()
      // 已通过 order_sn 链接到具体采购单的付款 → 已反映在 o.pay_amount 中，跳过
      if (sn && (orderSnSet.has(sn) || orderNoSet.has(sn))) continue
      const supplierName = String(r.contact_name || '').trim()
      if (supplierName) {
        unlinkedPaidBySupplier[supplierName] = (unlinkedPaidBySupplier[supplierName] || 0) + amt
      }
    }

    // 按供应商聚合采购订单
    const supplierMap = new Map<string, any>()
    for (const o of orders) {
      const displayName = getProcureOrderSupplierLabel(o, supplierRes.data?.rows ?? [])
      const resolvedSupplierId = getProcureOrderSupplierId(o)
      const key = displayName === '多供应商' ? `order:${o.id}` : (resolvedSupplierId ? `id:${resolvedSupplierId}` : `name:${String(displayName || '').trim()}`)
      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          supplier_id: displayName === '多供应商' ? 0 : resolvedSupplierId,
          supplier_name: displayName,
          contact_name: o.contact_name || '',
          contact_mobile: o.contact_mobile || '',
          order_amount: 0,
          paid_amount: 0,
          un_pay_amount: 0,
          prepay: 0,
          orders: [],
        })
      }
      const s = supplierMap.get(key)!
      const orderAmt = Number(o.after_discount ?? o.total_amount ?? 0)
      const paidAmt = Number(o.pay_amount || 0)
      const feeNeedPay = getProcureFeeNeedPayAmount(o)
      const feePaid = procureFeePaidById[o.id] || 0
      const feeUnpaid = Math.max(0, feeNeedPay - feePaid)
      const unpaid = orderAmt - paidAmt
      if (unpaid <= 0 && feeUnpaid <= 0) continue
      s.order_amount += orderAmt + feeNeedPay
      s.paid_amount += paidAmt + feePaid
      s.un_pay_amount += unpaid + feeUnpaid
      s.orders.push({
        order_id: o.id,
        order_sn: String(o.order_sn || '').trim(),
        order_no: o.order_no || o.order_sn || '',
        order_amount: orderAmt + feeNeedPay,
        paid_amount: paidAmt + feePaid,
        base_pay_amount: paidAmt,  // 原始 pay_amount，用于付款后更新
        un_pay_amount: unpaid + feeUnpaid,
        due_date: fmtDt(o.order_date),
      })
    }

    // 日期过滤（前端）
    let aggregated = Array.from(supplierMap.values())

    if (searchForm.date_from || searchForm.date_to) {
      for (const s of aggregated) {
        s.orders = s.orders.filter((o: any) => {
          if (searchForm.date_from && o.due_date < searchForm.date_from) return false
          if (searchForm.date_to && o.due_date > searchForm.date_to) return false
          return true
        })
        s.order_amount = s.orders.reduce((sum: number, o: any) => sum + o.order_amount, 0)
        s.paid_amount = s.orders.reduce((sum: number, o: any) => sum + o.paid_amount, 0)
        s.un_pay_amount = s.orders.reduce((sum: number, o: any) => sum + o.un_pay_amount, 0)
      }
      aggregated = aggregated.filter(s => s.orders.length > 0)
    }

    // 把"未链接到具体采购单"的手动付款（多订单路径）在供应商层面扣减应付
    for (const s of aggregated) {
      const extra = unlinkedPaidBySupplier[s.supplier_name] || 0
      if (extra > 0) {
        const deduct = Math.min(extra, s.un_pay_amount)
        s.paid_amount += deduct
        s.un_pay_amount -= deduct
      }
    }

    const expensePayables = buildExpensePayableRows(expenseRes.data?.rows ?? expenseRes.data?.list ?? [])
      .filter((row: any) => !searchForm.supplier_name || String(row.supplier_name || '').includes(searchForm.supplier_name))
      .filter((row: any) => {
        const dueDate = String(row.orders?.[0]?.due_date || '')
        if (searchForm.date_from && dueDate < searchForm.date_from) return false
        if (searchForm.date_to && dueDate > searchForm.date_to) return false
        return true
      })

    // 聚合合同附加费用（对方承担、有收款方的）按 supplier_name，计算已付/未付
    const contracts: any[] = contractRes.data?.rows ?? []
    // 构建销售附加费已付 Map：orderId:feeName → 已付金额
    const saleFeePaidMap: Record<string, number> = {}
    for (const r of manualPayList) {
      const m = String(r.remark || '').match(/销售订单附加费用\s*#(\d+):(.+?)(?:\s|\[|$)/)
      if (m) {
        const key = `${Number(m[1])}:${m[2].trim()}`
        saleFeePaidMap[key] = (saleFeePaidMap[key] || 0) + Number(r.amount || 0)
      }
    }
    const feeMap = new Map<string, { order_amount: number; paid_amount: number; orders: any[] }>()
    for (const c of contracts) {
      let feeItems: any[] = []
      try {
        const raw = c.fee_items
        if (typeof raw === 'string' && raw && raw !== '[]') feeItems = JSON.parse(raw)
        else if (Array.isArray(raw)) feeItems = raw
      } catch { feeItems = [] }
      // 从 remark [FI:] 标签恢复（后端未持久化 fee_items 字段时的兜底）
      if (!feeItems.length) {
        try {
          const fiMatch = String(c.remark || '').match(/\[FI:([^\]]+)\]/)
          if (fiMatch) feeItems = JSON.parse(decodeURIComponent(atob(fiMatch[1])))
        } catch { /* ignore */ }
      }
      for (const f of feeItems) {
        if (f.bearer === 'buyer') continue  // 我方承担走采购付款，合同附加费只收录对方承担的
        const amt = Number(f.amount || 0)
        if (!amt) continue
        const feeName = String(f.name || '费用').trim()
        const paid = saleFeePaidMap[`${c.id}:${feeName}`] || 0
        const unpaid = amt - paid
        if (unpaid <= 0.001) continue  // 已付清，跳过
        const supplierName = String(f.supplier_name || '').trim() || `合同附加-${feeName}`
        if (!feeMap.has(supplierName)) feeMap.set(supplierName, { order_amount: 0, paid_amount: 0, orders: [] })
        const entry = feeMap.get(supplierName)!
        entry.order_amount += amt
        entry.paid_amount += paid
        entry.orders.push({
          order_id: c.id,
          order_no: c.order_sn || c.order_no || '',
          order_amount: amt,
          paid_amount: paid,
          un_pay_amount: unpaid,
          due_date: fmtDt(c.sign_date || c.order_date || c.created_at),
          source_name: `合同附加-${feeName}`,
        })
      }
    }
    const contractFeeRows = Array.from(feeMap.entries())
      .map(([supplierName, entry]) => ({
        supplier_id: 0,
        supplier_name: supplierName,
        contact_name: '',
        contact_mobile: '',
        order_amount: entry.order_amount,
        paid_amount: entry.paid_amount,
        un_pay_amount: entry.order_amount - entry.paid_amount,
        prepay: 0,
        orders: entry.orders,
        __payable_source: 'contract_fee',
        source_name: '合同附加费',
      }))
      .filter(r => !searchForm.supplier_name || r.supplier_name.includes(searchForm.supplier_name))
      .filter(r => r.un_pay_amount > 0.001)

    // 零售附加费用：按费用名聚合未付金额
    const retailFeePaidMap: Record<string, number> = {}
    for (const r of manualPayList) {
      const m = String(r.remark || '').match(/零售附加费用\s*#(\d+):(.+?)(?:\s|$)/)
      if (m) {
        const key = `${m[1]}:${m[2].trim()}`
        retailFeePaidMap[key] = (retailFeePaidMap[key] || 0) + Number(r.amount || 0)
      }
    }
    // 后端列表接口不返回 fee_items，从 RetailOrder 页面写入的 localStorage 缓存读取
    let retailFeeCache: Record<string, any[]> = {}
    try { retailFeeCache = JSON.parse(localStorage.getItem('retail_fee_items_cache_v1') || '{}') } catch {}

    const retailOrders: any[] = (retailRes.data?.rows ?? []).filter((o: any) => Number(o.status) === 1)
    const retailFeeMap = new Map<string, { order_amount: number; paid_amount: number; orders: any[] }>()
    for (const o of retailOrders) {
      let feeItems: any[] = []
      try {
        if (o.fee_items !== undefined && o.fee_items !== null) {
          feeItems = Array.isArray(o.fee_items) ? o.fee_items : JSON.parse(o.fee_items || '[]')
        } else {
          feeItems = retailFeeCache[String(o.id)] ?? []
        }
      } catch { feeItems = [] }
      for (const f of feeItems) {
        // 只有明确标记为 buyer（我方承担）才进应付；老数据未标记或其他值一律不算
        if (f.bearer !== 'buyer') continue
        const amt = Number(f.amount || 0)
        if (!amt) continue
        const feeName = String(f.name || '费用').trim()
        const paid = retailFeePaidMap[`${o.id}:${feeName}`] || 0
        const unpaid = amt - paid
        if (unpaid <= 0.001) continue
        if (!retailFeeMap.has(feeName)) retailFeeMap.set(feeName, { order_amount: 0, paid_amount: 0, orders: [] })
        const entry = retailFeeMap.get(feeName)!
        entry.order_amount += amt
        entry.paid_amount += paid
        entry.orders.push({
          order_id: o.id,
          order_no: o.order_sn || `LS${String(o.id).padStart(3, '0')}`,
          order_amount: amt,
          paid_amount: paid,
          un_pay_amount: unpaid,
          due_date: o.order_date || '',
          source_name: `零售-${feeName}`,
        })
      }
    }
    const retailFeeRows = Array.from(retailFeeMap.entries())
      .map(([feeName, entry]) => ({
        supplier_id: 0,
        supplier_name: feeName,
        contact_name: '',
        contact_mobile: '',
        order_amount: entry.order_amount,
        paid_amount: entry.paid_amount,
        un_pay_amount: entry.order_amount - entry.paid_amount,
        prepay: 0,
        orders: entry.orders,
        __payable_source: 'retail_fee',
        source_name: '零售附加费',
      }))
      .filter(r => r.un_pay_amount > 0.001)

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
