<template>
  <div class="payable-page">
    <!-- 顶部汇总 -->
    <div class="summary-bar">
      <span class="summary-item">应付总金额：<strong class="red">{{ fmt(summaryUnpaid) }}</strong></span>
      <span class="summary-item">已付总金额：<strong class="blue">{{ fmt(summaryPaid) }}</strong></span>
      <span class="summary-item">业务总额：<strong class="orange">{{ fmt(summaryOrder) }}</strong></span>
      <span class="summary-item">退货总金额：<strong>{{ fmt(summaryReturn) }}</strong></span>
    </div>

    <el-card class="table-card">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <div class="search-area">
          <el-select
            v-model="searchForm.supplier_name"
            placeholder="请选择供应商"
            clearable
            filterable
            style="width:200px"
          >
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-date-picker
            v-model="searchForm.date_from"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width:140px"
          />
          <span style="color:rgba(29,29,31,0.35)">至</span>
          <el-date-picker
            v-model="searchForm.date_to"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:140px"
          />
          <el-button type="primary" :icon="Search" @click="load">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table :data="displayRows" v-loading="loading" border stripe style="width:100%" size="default">
        <el-table-column type="selection" width="44" />
        <el-table-column v-if="!isMobile" type="index" label="序号" width="60" align="center" />
        <el-table-column v-if="!isMobile" label="来源" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.__payable_source === 'expense' ? 'warning' : 'primary'" size="small">
              {{ row.source_name || (row.__payable_source === 'expense' ? '生产成本' : '采购') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplier_name" label="供应商" min-width="150" />
        <el-table-column v-if="!isMobile" prop="contact_name" label="联系人" min-width="100" />
        <el-table-column v-if="!isMobile" prop="contact_mobile" label="联系电话" min-width="130" />
        <el-table-column v-if="!isMobile" label="预付款" min-width="110" align="right">
          <template #default="{ row }">{{ fmt(row.prepay || 0) }}</template>
        </el-table-column>
        <el-table-column label="业务金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="font-weight:600">{{ fmt(row.order_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="!isMobile" label="已付欠款" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3">{{ fmt(row.paid_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="应付欠款" min-width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: Number(row.un_pay_amount) > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }">
              {{ fmt(row.un_pay_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">欠款详情</el-button>
            <el-button v-if="row.__payable_source !== 'expense'" type="warning" link size="small" @click="goPay(row)">付款</el-button>
            <el-button v-else type="warning" link size="small" @click="router.push('/finance/expense')">费用</el-button>
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
          @change="load"
        />
      </div>
    </el-card>

    <!-- 欠款详情弹框 -->
    <el-dialog v-model="detailVisible" :title="`${detailSupplier} - 欠款详情`" width="760px" destroy-on-close>
      <el-table :data="detailRows" border size="small">
        <el-table-column prop="source_name" label="来源" min-width="100">
          <template #default="{ row }">{{ row.source_name || '采购' }}</template>
        </el-table-column>
        <el-table-column prop="order_no" label="单号" min-width="150" />
        <el-table-column label="订单金额" min-width="110" align="right">
          <template #default="{ row }">{{ fmt(row.order_amount) }}</template>
        </el-table-column>
        <el-table-column label="已付金额" min-width="110" align="right">
          <template #default="{ row }"><span style="color:#0071e3">{{ fmt(row.paid_amount) }}</span></template>
        </el-table-column>
        <el-table-column label="应付金额" min-width="110" align="right">
          <template #default="{ row }"><span style="color:#dc2626;font-weight:600">{{ fmt(row.un_pay_amount) }}</span></template>
        </el-table-column>
        <el-table-column label="付款账户" min-width="120">
          <template #default="{ row }">
            <span v-if="row.fund_names && row.fund_names.length" style="color:rgba(29,29,31,0.7);font-size:12px">
              {{ row.fund_names.join('、') }}
            </span>
            <span v-else style="color:rgba(29,29,31,0.3);font-size:12px">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="订单日期" min-width="110" />
        <el-table-column label="操作" width="110" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToOrder(row.order_no)">查看原单</el-button>
            <el-button v-if="Number(row.un_pay_amount) > 0" type="warning" link size="small" @click="goPaySingle(row)">付款</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh } from '@element-plus/icons-vue'
import http from '@/api/http'
import { getExpenseList, getPayReceiptList } from '@/api/finance'
import { getSupplierList } from '@/api/procure'
import { applyProcureReturnsToPayableRows, normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'
import { getProcureOrderSupplierLabel } from '@/utils/supplierLabel'
import { buildExpensePayableRows } from '@/utils/expensePayable'
import { fmtDt } from '@/utils/date'

const router = useRouter()

const isMobile = ref(window.innerWidth < 768)
let _rt: ReturnType<typeof setTimeout> | null = null
function _onResize() { if (_rt) clearTimeout(_rt); _rt = setTimeout(() => { isMobile.value = window.innerWidth < 768 }, 300) }

const loading = ref(false)
const rows = ref<any[]>([])
const rawRows = ref<any[]>([])
const procureReturnRows = ref<any[]>([])
const allPayReceipts = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const supplierOptions = ref<any[]>([])

const displayRows = computed(() => {
  const normalizedReturns = normalizeProcureReturnFinanceRows(procureReturnRows.value)
  return applyProcureReturnsToPayableRows(rawRows.value, normalizedReturns)
})

const searchForm = reactive({ supplier_name: '', date_from: '', date_to: '' })

function fmt(v: any) {
  return Number(v || 0).toFixed(2)
}

const summaryOrder = computed(() => displayRows.value.reduce((s, r) => s + Number(r.order_amount || 0), 0))
const summaryPaid = computed(() => displayRows.value.reduce((s, r) => s + Number(r.paid_amount || 0), 0))
const summaryUnpaid = computed(() => displayRows.value.reduce((s, r) => s + Number(r.un_pay_amount || 0), 0))
const summaryReturn = computed(() => displayRows.value.reduce((s, r) => s + Number(r.return_amount || 0), 0))

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
    ])
    const ok = (i: number) => settled[i].status === 'fulfilled' ? (settled[i] as any).value : { data: { rows: [], list: [] } }
    const [orderRes, returnRes, supplierRes, expenseRes, payReceiptRes] = settled.map((_, i) => ok(i))

    // 构建已付 Map（每条记录只归一个 map，避免重复计算）
    const paidById: Record<number, number> = {}
    const paidByKey: Record<string, number> = {}
    const paidBySn: Record<string, number> = {}
    // 多ID备注付款：按供应商维度存储，聚合时再冲销
    const paidMultiBySup: Record<string, number> = {}
    for (const r of (payReceiptRes.data?.rows ?? [])) {
      const amt = Number(r.amount || 0)
      if (!amt) continue
      const sn = String(r.order_sn || '').trim()
      const sup = String(r.supplier_name || r.contact_name || '').trim()
      let matched = false
      if (Number(r.order_id)) {
        const id = Number(r.order_id); paidById[id] = (paidById[id] || 0) + amt; matched = true
      }
      const m1all = [...String(r.remark || '').matchAll(/采购单(?:自动)?付款\s+#(\d+)/g)]
      if (m1all.length === 1) {
        // 单个ID：直接归到该采购单
        const id = Number(m1all[0][1]); paidById[id] = (paidById[id] || 0) + amt; matched = true
      } else if (m1all.length > 1) {
        // 多个ID：按供应商维度存储，后续在供应商聚合阶段冲销
        if (sup) paidMultiBySup[sup] = (paidMultiBySup[sup] || 0) + amt
        matched = true
      }
      const m2 = String(r.remark || '').match(/采购单([A-Za-z0-9]+)审核自动生成/)
      if (m2) { const s = m2[1].trim(); paidBySn[s] = (paidBySn[s] || 0) + amt; matched = true }
      if (!matched && sn && sup) paidByKey[`${sn}@@${sup}`] = (paidByKey[`${sn}@@${sup}`] || 0) + amt
    }

    const orders: any[] = orderRes.data?.rows ?? []

    // 按供应商聚合采购订单
    const supplierMap = new Map<string, any>()
    for (const o of orders) {
      const displayName = getProcureOrderSupplierLabel(o, supplierRes.data?.rows ?? [])
      const key = displayName === '多供应商' ? `order:${o.id}` : (o.supplier_id ? `id:${o.supplier_id}` : `name:${String(o.supplier_name || '').trim()}`)
      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          supplier_id: displayName === '多供应商' ? 0 : (o.supplier_id || 0),
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
      const oSn = String(o.order_sn || '').trim()
      const oNo = String(o.order_no || '').trim()
      const oSup = String(o.supplier_name || '').trim()
      const paidAmt = (paidById[o.id] || 0)
        + (paidBySn[oSn] || paidBySn[oNo] || 0)
        + (paidByKey[`${oSn}@@${oSup}`] || paidByKey[`${oNo}@@${oSup}`] || 0)
      const unpaid = Math.max(0, orderAmt - paidAmt)
      s.order_amount += orderAmt
      s.paid_amount += paidAmt
      s.un_pay_amount += unpaid
      s.orders.push({
        order_id: o.id,
        order_no: o.order_no || o.order_sn || '',
        order_amount: orderAmt,
        paid_amount: paidAmt,
        un_pay_amount: unpaid,
        due_date: fmtDt(o.order_date || o.create_time),
      })
    }

    // 日期过滤（前端）
    let aggregated = Array.from(supplierMap.values())

    // 多ID付款：按供应商维度，依单据顺序冲销欠款
    for (const s of aggregated) {
      const supName = String(s.supplier_name || '').trim()
      let remaining = paidMultiBySup[supName] || 0
      if (remaining <= 0) continue
      for (const o of s.orders) {
        if (remaining <= 0) break
        const deduct = Math.min(remaining, o.un_pay_amount)
        o.paid_amount += deduct
        o.un_pay_amount = Math.max(0, o.un_pay_amount - deduct)
        remaining -= deduct
      }
      s.paid_amount = s.orders.reduce((sum: number, o: any) => sum + o.paid_amount, 0)
      s.un_pay_amount = s.orders.reduce((sum: number, o: any) => sum + o.un_pay_amount, 0)
    }
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

    const expensePayables = buildExpensePayableRows(expenseRes.data?.rows ?? expenseRes.data?.list ?? [])
      .filter((row: any) => !searchForm.supplier_name || String(row.supplier_name || '').includes(searchForm.supplier_name))
      .filter((row: any) => {
        const dueDate = String(row.orders?.[0]?.due_date || '')
        if (searchForm.date_from && dueDate < searchForm.date_from) return false
        if (searchForm.date_to && dueDate > searchForm.date_to) return false
        return true
      })

    rawRows.value = [...aggregated.filter(s => s.un_pay_amount > 0), ...expensePayables]
    procureReturnRows.value = returnRes.data?.rows ?? []
    allPayReceipts.value = payReceiptRes.data?.rows ?? []
    total.value = rawRows.value.length
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

async function viewDetail(row: any) {
  detailSupplier.value = row.supplier_name
  detailSupplierId.value = row.supplier_id
  // 给每行订单匹配付款账户名
  detailRows.value = (row.orders ?? []).map((o: any) => {
    const receipts = allPayReceipts.value.filter(r => {
      if (!Number(r.amount)) return false
      const sn = String(r.order_sn || '').trim()
      const oSn = String(o.order_no || '').trim()
      if (Number(r.order_id) && Number(r.order_id) === o.order_id) return true
      const m = [...String(r.remark || '').matchAll(/采购单(?:自动)?付款\s+#(\d+)/g)]
      if (m.some(x => Number(x[1]) === o.order_id)) return true
      const m2 = String(r.remark || '').match(/采购单([A-Za-z0-9]+)审核自动生成/)
      if (m2 && m2[1].trim() === oSn) return true
      if (sn && oSn && sn === oSn) return true
      return false
    })
    const fundNames = [...new Set(receipts.map(r => r.fund_name).filter(Boolean))]
    return { ...o, fund_names: fundNames }
  })
  detailVisible.value = true
}

// 跳转付款单新增页，带供应商参数
function goPay(row: any) {
  const unpaidOrders = (row.orders ?? []).filter((o: any) => Number(o.un_pay_amount) > 0)
  const orderIds = unpaidOrders.map((o: any) => o.order_id).filter(Boolean).join(',')
  router.push({
    path: '/finance/pay-receipt/new',
    query: {
      supplier_id: row.supplier_id,
      supplier_name: row.supplier_name,
      un_pay_amount: row.un_pay_amount,
      order_ids: orderIds || undefined,
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
    }
  })
}

// 跳转到采购单列表并高亮对应单据
function goToOrder(orderNo: string) {
  detailVisible.value = false
  router.push({ path: '/procure/order', query: { order_no: orderNo } })
}

onMounted(async () => {
  const res = await getSupplierList({ list_rows: 500 })
  supplierOptions.value = res.data?.rows ?? []
  await load()
  window.addEventListener('resize', _onResize)
})
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
