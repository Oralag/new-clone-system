<template>
  <div class="receipt-page">
    <el-card>
      <!-- 搜索栏 -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <el-input v-model="searchForm.receipt_no" placeholder="收款单号" clearable style="width:160px" @change="applyFilter" />
        <el-input v-model="searchForm.contact_name" placeholder="收款对象" clearable style="width:150px" @change="applyFilter" />
        <el-select v-model="searchForm.contact_type" placeholder="类型" clearable style="width:130px" @change="applyFilter">
          <el-option label="客户" value="customer" />
          <el-option label="供应商" value="supplier" />
          <el-option label="员工" value="staff" />
          <el-option label="其他" value="other" />
          <el-option label="预付款充值" value="prepay" />
        </el-select>
        <el-button :icon="Refresh" @click="loadAll">刷新</el-button>
        <div style="flex:1" />
        <el-button type="primary" :icon="Plus" @click="openCreate" data-guide-id="guide-collect-receipt-create">新增收款单</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="pagedRows" v-loading="loading" border stripe style="width:100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="receipt_no" label="收款单号" min-width="150" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row._isPrepay ? 'primary' : (typeTagMap[getRowContactType(row)] ?? '')">
              {{ row._isPrepay ? '预付款充值' : typeLabel(getRowContactType(row)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收款对象" min-width="130">
          <template #default="{ row }">
            {{ getRowContactName(row) }}
          </template>
        </el-table-column>
        <el-table-column label="收款金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a;font-weight:600">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="退款金额" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: Number(row.refund_allocated || 0) > 0 ? '#dc2626' : 'rgba(29,29,31,0.25)', fontWeight: 600 }">
              ¥{{ Number(row.refund_allocated || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="净收款" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ Number(row.net_amount ?? row.amount ?? 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收款账户" width="130">
          <template #default="{ row }">
            {{ row.account_name || row.fund_name || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="收款日期" width="110">
          <template #default="{ row }">
            {{ (row.receipt_date || row.pay_date || row.created_at || '').slice(0, 10) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row._isPrepay" type="danger" link size="small" :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
            <span v-else style="color:#999;font-size:12px">预付款</span>
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
    <el-drawer v-model="drawerVisible" title="新增收款单" size="520px" destroy-on-close data-guide-id="guide-collect-receipt-form">
      <el-form ref="formRef" :model="fd" label-width="90px" style="padding:0 8px">
        <el-form-item label="收款对象类型" prop="contact_type" :rules="[{ required: true, message: '请选择类型' }]">
          <el-select v-model="fd.contact_type" style="width:100%" @change="onTypeChange">
            <el-option label="客户" value="customer" />
            <el-option label="供应商" value="supplier" />
            <el-option label="员工" value="staff" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款对象" prop="contact_id" :rules="[{ required: true, message: '请选择收款对象' }]"
          v-if="fd.contact_type !== 'other'">
          <div style="display:flex;gap:6px;width:100%">
            <el-select v-model="fd.contact_id" placeholder="请选择" filterable style="flex:1"
              @change="onContactChange">
              <el-option v-for="c in contactOptions" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="openQuickAdd" />
          </div>
        </el-form-item>
        <el-form-item label="收款对象" prop="contact_name" :rules="[{ required: true, message: '请输入名称' }]"
          v-else>
          <el-input v-model="fd.contact_name" placeholder="请输入收款对象名称" />
        </el-form-item>
        <el-form-item label="收款金额" prop="amount" :rules="[{ required: true, message: '请输入收款金额' }]">
          <el-input-number v-model="fd.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="收款账户" prop="fund_id">
          <div style="display:flex;gap:4px;width:100%">
            <el-select v-model="fd.fund_id" placeholder="请选择账户" clearable style="flex:1"
              @change="onFundChange">
              <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
            <el-button :icon="Plus" @click="openAddFund" />
          </div>
        </el-form-item>
        <el-form-item label="收款日期" prop="receipt_date">
          <el-date-picker v-model="fd.receipt_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="关联单据" prop="order_no">
          <el-input v-model="fd.order_no" placeholder="关联订单/合同编号（可选）" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="fd.remark" type="textarea" :rows="3" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave" data-guide-id="guide-collect-receipt-save">保存</el-button>
      </template>
    </el-drawer>

    <!-- 快速新增联系人弹框 -->
    <el-dialog v-model="quickAddVisible" :title="`快速新增${typeLabel(fd.contact_type)}`" width="360px" append-to-body>
      <el-form :model="quickForm" label-width="70px">
        <el-form-item label="名称" required>
          <el-input v-model="quickForm.name" placeholder="请输入名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickAddVisible = false">取消</el-button>
        <el-button type="primary" :loading="quickSaving" @click="confirmQuickAdd">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" title="新增资金账户" width="360px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item label="账户名称">
          <el-input v-model="fundForm.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="初始余额">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">取消</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">确认新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getCollectReceiptList, createCollectReceipt, deleteCollectReceipt, getFundList, createFund, getReceivableList } from '@/api/finance'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getSupplierList, createSupplier } from '@/api/procure'
import { getStaffList, createStaff } from '@/api/personnel'
import http from '@/api/http'
import { applySaleReturnsToCollectReceiptRows, normalizeSaleReturnFinanceRows } from '@/utils/saleReturnFinance'

// ── 数据加载 ──────────────────────────────────────────────────────────────────
const loading = ref(false)
const allRows = ref<any[]>([])
const searchForm = reactive<any>({ receipt_no: '', contact_name: '', contact_type: '' })
const currentPage = ref(1)
const pageSize = ref(20)

async function loadAll() {
  loading.value = true
  try {
    const [receiptRes, prepayRes, receivableRes, saleReturnRes] = await Promise.all([
      getCollectReceiptList({ list_rows: 1000 }),
      http.get('/finance/Prepay/index', { params: { pay_type: 'customer', list_rows: 1000 } }),
      getReceivableList({ list_rows: 1000 }),
      http.get('/stock/SaleReturnOrder/index', { params: { status: 1, list_rows: 1000 } }),
    ])
    // 过滤掉收款单里旧版“预付款充值”重复写入的记录（预付款核销记录要保留）
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
  } finally {
    loading.value = false
  }
}

const filteredRows = computed(() => {
  return allRows.value.filter(r => {
    if (searchForm.receipt_no && !String(r.receipt_no || '').includes(searchForm.receipt_no)) return false
    const name = getRowContactName(r)
    if (searchForm.contact_name && !name.includes(searchForm.contact_name)) return false
    if (searchForm.contact_type && getRowContactType(r) !== searchForm.contact_type) return false
    return true
  })
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function applyFilter() {
  currentPage.value = 1
}

// ── 类型标签 ──────────────────────────────────────────────────────────────────
const typeTagMap: Record<string, string> = {
  customer: 'success', supplier: 'warning', staff: 'info', other: '', prepay: 'primary'
}

function typeLabel(type: string) {
  const map: Record<string, string> = { customer: '客户', supplier: '供应商', staff: '员工', other: '其他', prepay: '预付款充值' }
  return map[type] ?? type
}

function getRowContactType(row: any) {
  if (row?._isPrepay) return 'prepay'
  const explicit = String(row?.contact_type || '').trim()
  if (explicit) return explicit
  if (row?.customer_id || row?.customer_name) return 'customer'
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
  receipt_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
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
  try { await formRef.value?.validate() } catch { ElMessage.warning('请填写必填项'); return }
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
    ElMessage.success('保存成功')
    drawerVisible.value = false
    await loadAll()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该收款单？', '提示', { type: 'warning' })
  await deleteCollectReceipt(id)
  ElMessage.success('删除成功')
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
  if (!quickForm.name.trim()) { ElMessage.warning('请输入名称'); return }
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
    ElMessage.success('新增成功')
  } catch (e: any) {
    ElMessage.error(e?.message ?? '新增失败')
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
  if (!fundForm.name.trim()) { ElMessage.warning('请输入账户名称'); return }
  addFundLoading.value = true
  try {
    await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success('新增账户成功')
    addFundVisible.value = false
    await loadFunds()
    const newFund = fundOptions.value.find(f => f.name === fundForm.name.trim())
    if (newFund) { fd.fund_id = newFund.id; fd.fund_name = newFund.name }
  } catch (e: any) {
    ElMessage.error(e?.message ?? '新增失败')
  } finally {
    addFundLoading.value = false
  }
}
</script>

<style scoped>
.receipt-page { height: 100%; }
</style>
