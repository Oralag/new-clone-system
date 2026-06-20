<template>
  <div class="receipt-page">
    <el-card>
      <!-- 搜索栏 -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <el-input v-model="searchForm.receipt_no" :placeholder="$t('finance.collectReceipt.searchReceiptNo')" clearable style="width:160px" @change="applyFilter" />
        <el-input v-model="searchForm.contact_name" :placeholder="$t('finance.collectReceipt.searchContactName')" clearable style="width:150px" @change="applyFilter" />
        <el-select v-model="searchForm.contact_type" :placeholder="$t('finance.collectReceipt.searchType')" clearable style="width:130px" @change="applyFilter">
          <el-option :label="$t('finance.collectReceipt.typeCustomer')" value="customer" />
          <el-option :label="$t('finance.collectReceipt.typeSupplier')" value="supplier" />
          <el-option :label="$t('finance.collectReceipt.typeStaff')" value="staff" />
          <el-option :label="$t('finance.collectReceipt.typeOther')" value="other" />
          <el-option :label="$t('finance.collectReceipt.typePrepay')" value="prepay" />
        </el-select>
        <el-input v-model="searchForm.remark_kw" :placeholder="$t('finance.collectReceipt.searchRemarkKw')" clearable style="width:140px" @change="applyFilter" />
        <el-date-picker v-model="searchForm.date_range" type="daterange" value-format="YYYY-MM-DD"
          range-separator="~" :start-placeholder="$t('finance.collectReceipt.searchDateFrom')" :end-placeholder="$t('finance.collectReceipt.searchDateTo')"
          style="width:230px" @change="applyFilter" clearable />
        <el-button :icon="Refresh" @click="loadAll">{{ $t('finance.collectReceipt.btnRefresh') }}</el-button>
        <div style="flex:1" />
        <el-button type="primary" :icon="Plus" @click="openCreate" data-guide-id="guide-collect-receipt-create">{{ $t('finance.collectReceipt.btnCreate') }}</el-button>
      </div>
      <div style="padding:6px 0 8px;font-size:14px;color:#606266">
        {{ $t('finance.collectReceipt.summaryFilter') }}<b>{{ filteredRows.length }}</b> {{ $t('finance.collectReceipt.summaryCount') }}&emsp;{{ $t('finance.collectReceipt.summaryTotal') }}<b style="color:#16a34a">¥{{ collectSummaryTotal }}</b>&emsp;{{ $t('finance.collectReceipt.summaryNet') }}<b style="color:#0071e3">¥{{ collectSummaryNet }}</b>
      </div>

      <!-- 表格 -->
      <el-table :data="pagedRows" v-loading="loading" border stripe style="width:100%" :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''">
        <el-table-column type="index" :label="$t('finance.collectReceipt.colIndex')" width="60" align="center" />
        <el-table-column prop="receipt_no" :label="$t('finance.collectReceipt.colReceiptNo')" min-width="150" />
        <el-table-column :label="$t('finance.collectReceipt.colType')" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row._isPrepay ? 'primary' : (typeTagMap[getRowContactType(row)] ?? '')">
              {{ row._isPrepay ? $t('finance.collectReceipt.typePrepay') : typeLabel(getRowContactType(row)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.collectReceipt.colContact')" min-width="130">
          <template #default="{ row }">
            {{ getRowContactName(row) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.collectReceipt.colAmount')" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a;font-weight:600">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.collectReceipt.colRefund')" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: Number(row.refund_allocated || 0) > 0 ? '#dc2626' : 'rgba(29,29,31,0.25)', fontWeight: 600 }">
              ¥{{ Number(row.refund_allocated || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.collectReceipt.colNet')" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ Number(row.net_amount ?? row.amount ?? 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.collectReceipt.colAccount')" width="130">
          <template #default="{ row }">
            {{ row.account_name || row.fund_name || '—' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.collectReceipt.colDate')" width="150">
          <template #default="{ row }">
            {{ fmtDt(row.receipt_date || row.pay_date || row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="$t('finance.collectReceipt.colRemark')" min-width="130" show-overflow-tooltip />
        <el-table-column :label="$t('finance.collectReceipt.colActions')" width="250" fixed="right">
          <template #default="{ row }">
            <template v-if="!row._isPrepay">
              <el-button v-if="getRowContactType(row) === 'customer'" type="primary" link size="small" @click="goToContract(row)">{{ $t('finance.collectReceipt.btnOriginalOrder') }}</el-button>
              <el-button v-if="Number(row.status) === 1" type="warning" link size="small" @click="handleUnaudit(row)">{{ $t('finance.collectReceipt.btnUnaudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleCollectReconcile(row)">{{ row._reconciled ? $t('finance.collectReceipt.btnReconciled') : $t('finance.collectReceipt.btnReconcile') }}</el-button>
              <el-button type="danger" link size="small" :disabled="Number(row.status) === 1" @click="handleDelete(row.id)">{{ $t('finance.collectReceipt.btnDelete') }}</el-button>
            </template>
            <span v-else style="color:#999;font-size:12px">{{ $t('finance.collectReceipt.labelPrepay') }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="display:flex;justify-content:flex-end;margin-top:12px">
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

    <!-- 新增收款单抽屉 -->
    <el-drawer v-model="drawerVisible" :title="$t('finance.collectReceipt.drawerTitle')" size="520px" destroy-on-close data-guide-id="guide-collect-receipt-form">
      <el-form ref="formRef" :model="fd" label-width="90px" style="padding:0 8px">
        <el-form-item :label="$t('finance.collectReceipt.formContactType')" prop="contact_type" :rules="[{ required: true, message: $t('finance.collectReceipt.ruleContactTypeRequired') }]">
          <el-select v-model="fd.contact_type" style="width:100%" @change="onTypeChange">
            <el-option :label="$t('finance.collectReceipt.typeCustomer')" value="customer" />
            <el-option :label="$t('finance.collectReceipt.typeSupplier')" value="supplier" />
            <el-option :label="$t('finance.collectReceipt.typeStaff')" value="staff" />
            <el-option :label="$t('finance.collectReceipt.typeOther')" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('finance.collectReceipt.formContact')" prop="contact_id" :rules="[{ required: true, message: $t('finance.collectReceipt.ruleContactRequired') }]"
          v-if="fd.contact_type !== 'other'">
          <div style="display:flex;gap:6px;width:100%">
            <el-select v-model="fd.contact_id" :placeholder="$t('finance.collectReceipt.formContactPlaceholder')" filterable style="flex:1"
              @change="onContactChange">
              <el-option v-for="c in contactOptions" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="openQuickAdd" />
          </div>
        </el-form-item>
        <el-form-item :label="$t('finance.collectReceipt.formContactOther')" prop="contact_name" :rules="[{ required: true, message: $t('finance.collectReceipt.ruleContactNameRequired') }]"
          v-else>
          <el-input v-model="fd.contact_name" :placeholder="$t('finance.collectReceipt.formContactOtherPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('finance.collectReceipt.formAmount')" prop="amount" :rules="[{ required: true, message: $t('finance.collectReceipt.ruleAmountRequired') }]">
          <el-input-number v-model="fd.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.collectReceipt.formAccount')" prop="fund_id">
          <div style="display:flex;gap:4px;width:100%">
            <el-select v-model="fd.fund_id" :placeholder="$t('finance.collectReceipt.formAccountPlaceholder')" clearable style="flex:1"
              @change="onFundChange">
              <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
            <el-button :icon="Plus" @click="openAddFund" />
          </div>
        </el-form-item>
        <el-form-item :label="$t('finance.collectReceipt.formDate')" prop="receipt_date">
          <el-date-picker v-model="fd.receipt_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.collectReceipt.formOrderNo')" prop="order_no">
          <el-input v-model="fd.order_no" :placeholder="$t('finance.collectReceipt.formOrderNoPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('finance.collectReceipt.formRemark')" prop="remark">
          <el-input v-model="fd.remark" type="textarea" :rows="3" :placeholder="$t('finance.collectReceipt.formRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">{{ $t('finance.collectReceipt.btnCancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave" data-guide-id="guide-collect-receipt-save">{{ $t('finance.collectReceipt.btnSave') }}</el-button>
      </template>
    </el-drawer>

    <!-- 快速新增联系人弹框 -->
    <el-dialog v-model="quickAddVisible" :title="`${$t('finance.collectReceipt.quickAddTitlePrefix')}${typeLabel(fd.contact_type)}`" width="360px" append-to-body>
      <el-form :model="quickForm" label-width="70px">
        <el-form-item :label="$t('finance.collectReceipt.quickFormName')" required>
          <el-input v-model="quickForm.name" :placeholder="$t('finance.collectReceipt.quickFormNamePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickAddVisible = false">{{ $t('finance.collectReceipt.quickBtnCancel') }}</el-button>
        <el-button type="primary" :loading="quickSaving" @click="confirmQuickAdd">{{ $t('finance.collectReceipt.quickBtnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" :title="$t('finance.collectReceipt.addFundTitle')" width="360px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item :label="$t('finance.collectReceipt.addFundName')">
          <el-input v-model="fundForm.name" :placeholder="$t('finance.collectReceipt.addFundNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('finance.collectReceipt.addFundBalance')">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">{{ $t('finance.collectReceipt.addFundBtnCancel') }}</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">{{ $t('finance.collectReceipt.addFundBtnConfirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getCollectReceiptList, createCollectReceipt, deleteCollectReceipt, getFundList, createFund, getReceivableList } from '@/api/finance'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getSupplierList, createSupplier } from '@/api/procure'
import { getStaffList, createStaff } from '@/api/personnel'
import http from '@/api/http'
import { applySaleReturnsToCollectReceiptRows, normalizeSaleReturnFinanceRows } from '@/utils/saleReturnFinance'
import { adjustFundBalance } from '@/utils/fund'
import { fmtDt } from '@/utils/date'

const { t } = useI18n()

// ── 核对 ──────────────────────────────────────────────────────────────────────
const reconcileIds = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem('reconcile_collect_receipt') || '[]')))
function toggleCollectReconcile(row: any) {
  const newVal = !row._reconciled
  if (newVal) reconcileIds.value.add(row.id)
  else reconcileIds.value.delete(row.id)
  localStorage.setItem('reconcile_collect_receipt', JSON.stringify([...reconcileIds.value]))
  const idx = allRows.value.findIndex((r: any) => r.id === row.id)
  if (idx !== -1) allRows.value.splice(idx, 1, { ...allRows.value[idx], _reconciled: newVal })
}

// ── 数据加载 ──────────────────────────────────────────────────────────────────
const router = useRouter()

function goToContract(row: any) {
  const customerName = getRowContactName(row)
  router.push({ path: '/sale/contract', query: { customer_name: customerName } })
}

const loading = ref(false)
const allRows = ref<any[]>([])
const searchForm = reactive<any>({ receipt_no: '', contact_name: '', contact_type: '', remark_kw: '', date_range: [] as string[] })
const currentPage = ref(1)
const pageSize = ref(20)

async function loadAll() {
  loading.value = true
  try {
    const settled = await Promise.allSettled([
      getCollectReceiptList({ list_rows: 1000 }),
      http.get('/finance/Prepay/index', { params: { pay_type: 'customer', list_rows: 1000 } }),
      getReceivableList({ list_rows: 1000 }),
      http.get('/stock/SaleReturnOrder/index', { params: { status: 1, list_rows: 1000 } }),
    ])
    const ok = (i: number) => settled[i].status === 'fulfilled' ? (settled[i] as any).value : { data: { rows: [], list: [] } }
    const [receiptRes, prepayRes, receivableRes, saleReturnRes] = settled.map((_, i) => ok(i))
    // 过滤掉收款单里旧版"预付款充值"重复写入的记录（预付款核销记录要保留）
    const allReceipts: any[] = receiptRes?.data?.rows ?? receiptRes?.data?.list ?? []
    const receipts = allReceipts.filter((r: any) => !/^预付款充值/.test(String(r.remark || '').trim()))
    const prepays: any[] = prepayRes?.data?.rows ?? prepayRes?.data?.list ?? []
    const receivableRows: any[] = receivableRes?.data?.rows ?? receivableRes?.data?.list ?? []
    const saleReturnRows = normalizeSaleReturnFinanceRows(saleReturnRes?.data?.rows ?? saleReturnRes?.data?.list ?? [])
    const adjustedReceipts = applySaleReturnsToCollectReceiptRows(receipts, saleReturnRows, receivableRows)

    const prepayRows = prepays.map((r: any) => ({
      ...r,
      _isPrepay: true,
      receipt_no: r.order_sn || r.prepay_no || '—',
      contact_type: 'prepay',
      contact_name: r.customer_name || '—',
      amount: r.amount,
      fund_name: r.fund_name || '',
      receipt_date: r.pay_date || r.create_time || '',
      remark: r.remark || '预付款充值',
    }))

    // 合并，按日期倒序
    const merged = [...adjustedReceipts.map((r: any) => ({ ...r, _isPrepay: false })), ...prepayRows]
    merged.sort((a, b) => {
      const da = (a.receipt_date || a.pay_date || a.created_at || '').slice(0, 10)
      const db = (b.receipt_date || b.pay_date || b.created_at || '').slice(0, 10)
      return db.localeCompare(da)
    })
    allRows.value = merged
    reconcileIds.value.forEach((id: number) => {
      const idx = allRows.value.findIndex((r: any) => r.id === id)
      if (idx !== -1 && !allRows.value[idx]._reconciled) allRows.value.splice(idx, 1, { ...allRows.value[idx], _reconciled: true })
    })
  } finally {
    loading.value = false
  }
}

const filteredRows = computed(() => {
  const [dateFrom, dateTo] = searchForm.date_range?.length === 2 ? searchForm.date_range : [null, null]
  return allRows.value.filter(r => {
    if (searchForm.receipt_no && !String(r.receipt_no || '').includes(searchForm.receipt_no)) return false
    const name = getRowContactName(r)
    if (searchForm.contact_name && !name.includes(searchForm.contact_name)) return false
    if (searchForm.contact_type && getRowContactType(r) !== searchForm.contact_type) return false
    if (dateFrom || dateTo) {
      const d = String(r.receipt_date || r.pay_date || r.created_at || '').slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
    }
    if (searchForm.remark_kw && !String(r.remark || '').toLowerCase().includes(searchForm.remark_kw.toLowerCase())) return false
    return true
  })
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const collectSummaryTotal = computed(() => filteredRows.value.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2))
const collectSummaryNet = computed(() => filteredRows.value.reduce((s, r) => s + Number(r.net_amount ?? r.amount ?? 0), 0).toFixed(2))

function applyFilter() {
  currentPage.value = 1
}

// ── 类型标签 ──────────────────────────────────────────────────────────────────
const typeTagMap: Record<string, string> = {
  customer: 'success', supplier: 'warning', staff: 'info', other: '', prepay: 'primary'
}

function typeLabel(type: string) {
  const map: Record<string, () => string> = {
    customer: () => t('finance.collectReceipt.typeCustomer'),
    supplier: () => t('finance.collectReceipt.typeSupplier'),
    staff: () => t('finance.collectReceipt.typeStaff'),
    other: () => t('finance.collectReceipt.typeOther'),
    prepay: () => t('finance.collectReceipt.typePrepay'),
  }
  return map[type]?.() ?? type
}

function getRowContactType(row: any) {
  if (row?._isPrepay) return 'prepay'
  const explicit = String(row?.contact_type || '').trim()
  if (explicit) return explicit
  if (row?.customer_id || row?.customer_name) return 'customer'
  if (String(row?.pay_type || '') === 'customer') return 'customer'
  const remark = String(row?.remark || '').toLowerCase()
  if (remark.startsWith('[supplier]')) return 'supplier'
  if (remark.startsWith('[staff]')) return 'staff'
  return 'other'
}

function getRowContactName(row: any) {
  return String(row?.contact_name || row?.customer_name || row?.nickname || row?.supplier_name || '—')
}

// ── 新增收款单 ─────────────────────────────────────────────────────────────────
const drawerVisible = ref(false)
const saving = ref(false)
const formRef = ref()

const defaultFd = () => ({
  contact_type: 'customer' as string,
  contact_id: null as any,
  contact_name: '',
  amount: 0,
  fund_id: null as any,
  fund_name: '',
  receipt_date: new Date().toLocaleDateString('sv-SE'),
  order_no: '',
  remark: '',
})

const fd = reactive(defaultFd())
const contactOptions = ref<any[]>([])

async function loadContacts() {
  contactOptions.value = []
  if (fd.contact_type === 'customer') {
    const res = await getSaleCustomerList({ list_rows: 500 })
    contactOptions.value = (res.data?.rows ?? []).map((r: any) => ({ id: r.id, name: r.nickname || r.name }))
  } else if (fd.contact_type === 'supplier') {
    const res = await getSupplierList({ list_rows: 500 })
    contactOptions.value = res.data?.rows ?? []
  } else if (fd.contact_type === 'staff') {
    const res = await getStaffList({ list_rows: 500 })
    contactOptions.value = (res.data?.rows ?? []).map((r: any) => ({ id: r.id, name: r.name }))
  }
}

function onTypeChange() {
  fd.contact_id = null
  fd.contact_name = ''
  if (fd.contact_type !== 'other') loadContacts()
}

function onContactChange(id: any) {
  const c = contactOptions.value.find(x => x.id === id)
  fd.contact_name = c?.name ?? ''
}

function onFundChange(id: any) {
  const f = fundOptions.value.find(x => x.id === id)
  fd.fund_name = f?.name ?? ''
}

function openCreate() {
  Object.assign(fd, defaultFd())
  loadContacts()
  drawerVisible.value = true
}

async function handleSave() {
  try { await formRef.value?.validate() } catch { ElMessage.warning(t('finance.collectReceipt.msgRequiredFields')); return }
  saving.value = true
  try {
    const { contact_type, contact_id, fund_id, fund_name, order_no, ...rest } = fd
    const normalizedRemark = (() => {
      const rawRemark = String(fd.remark || '').trim()
      if (contact_type === 'customer') return rawRemark
      const marker = `[${contact_type}]`
      return rawRemark.startsWith(marker) ? rawRemark : `${marker}${rawRemark ? ` ${rawRemark}` : ''}`
    })()
    const payload: any = {
      ...rest,
      contact_type,
      contact_id: contact_id ?? 0,
      contact_name: fd.contact_name || '',
      fund_id: fund_id ?? 0,
      fund_name: fund_name || '',
      order_sn: order_no || null,
      order_no: order_no || null,
      remark: normalizedRemark,
    }
    if (contact_type === 'customer') {
      payload.customer_id = contact_id ?? 0
      payload.customer_name = fd.contact_name
    }
    await createCollectReceipt(payload)
    ElMessage.success(t('finance.collectReceipt.msgSaveSuccess'))
    drawerVisible.value = false
    await loadAll()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('finance.collectReceipt.msgSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('finance.collectReceipt.confirmDeleteMsg'), t('finance.collectReceipt.confirmDeleteTitle'), { type: 'warning' })
  const row = allRows.value.find(r => r.id === id)
  await deleteCollectReceipt(id)
  // 回退资金账户余额
  if (row && Number(row.amount || 0) > 0) {
    try {
      await adjustFundBalance({
        fundId: row.fund_id,
        fundName: row.fund_name || row.account_name,
        delta: -Number(row.amount),
      })
    } catch { /* 回退失败不阻塞删除结果 */ }
  }
  ElMessage.success(t('finance.collectReceipt.msgDeleteSuccess'))
  await loadAll()
}

async function handleUnaudit(row: any) {
  await ElMessageBox.confirm(t('finance.collectReceipt.confirmUnauditMsg'), t('finance.collectReceipt.confirmUnauditTitle'), { type: 'warning' })
  await http.post('/finance/CollectReceipt/edit', { id: row.id, status: 0 })
  ElMessage.success(t('finance.collectReceipt.msgUnauditSuccess'))
  await loadAll()
}

// ── 快速新增 ──────────────────────────────────────────────────────────────────
const quickAddVisible = ref(false)
const quickSaving = ref(false)
const quickForm = reactive({ name: '' })

function openQuickAdd() {
  quickForm.name = ''
  quickAddVisible.value = true
}

async function confirmQuickAdd() {
  if (!quickForm.name.trim()) { ElMessage.warning(t('finance.collectReceipt.msgQuickAddNameRequired')); return }
  quickSaving.value = true
  try {
    let res: any
    if (fd.contact_type === 'customer') {
      res = await createSaleCustomer({ name: quickForm.name.trim() })
    } else if (fd.contact_type === 'supplier') {
      res = await createSupplier({ name: quickForm.name.trim() })
    } else if (fd.contact_type === 'staff') {
      res = await createStaff({ name: quickForm.name.trim() })
    }
    quickAddVisible.value = false
    await loadContacts()
    const newId = res?.data?.id ?? res?.data
    if (newId) { fd.contact_id = newId; onContactChange(newId) }
    ElMessage.success(t('finance.collectReceipt.msgQuickAddSuccess'))
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('finance.collectReceipt.msgQuickAddFailed'))
  } finally {
    quickSaving.value = false
  }
}

onMounted(() => { loadAll(); loadFunds() })

// ── 资金账户 ──────────────────────────────────────────────────────────────────
const fundOptions = ref<any[]>([])
const addFundVisible = ref(false)
const addFundLoading = ref(false)
const fundForm = reactive({ name: '', balance: 0 })

async function loadFunds() {
  try {
    const res = await getFundList({ list_rows: 100 })
    fundOptions.value = res.data?.rows ?? res.data?.list ?? []
  } catch { /* ignore */ }
}

function openAddFund() {
  fundForm.name = ''
  fundForm.balance = 0
  addFundVisible.value = true
}

async function submitAddFund() {
  if (!fundForm.name.trim()) { ElMessage.warning(t('finance.collectReceipt.msgAddFundNameRequired')); return }
  addFundLoading.value = true
  try {
    await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success(t('finance.collectReceipt.msgAddFundSuccess'))
    addFundVisible.value = false
    await loadFunds()
    const newFund = fundOptions.value.find(f => f.name === fundForm.name.trim())
    if (newFund) { fd.fund_id = newFund.id; fd.fund_name = newFund.name }
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('finance.collectReceipt.msgAddFundFailed'))
  } finally {
    addFundLoading.value = false
  }
}
</script>

<style scoped>
.receipt-page { height: 100%; }
</style>
