<template>
  <div class="receipt-page">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getCollectReceiptList"
          del-path="/finance/CollectReceipt/batchDel"
          export-file-name="收款记录" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.receipt_no" placeholder="收款单号" clearable style="width:160px" />
          <el-input v-model="searchForm.contact_name" placeholder="收款对象" clearable style="width:150px" />
          <el-select v-model="searchForm.contact_type" placeholder="类型" clearable style="width:110px">
            <el-option label="客户" value="customer" />
            <el-option label="供应商" value="supplier" />
            <el-option label="员工" value="staff" />
            <el-option label="其他" value="other" />
          </el-select>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增收款单</el-button>
        </template>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="receipt_no" label="收款单号" min-width="150" />
        <el-table-column prop="contact_type_label" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTagMap[row.contact_type] ?? ''">{{ typeLabel(row.contact_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收款对象" min-width="130">
          <template #default="{ row }">
            {{ row.contact_name || row.customer_name || row.nickname || row.supplier_name || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="收款金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#00b42a;font-weight:600">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="account_name" label="收款账户" width="130" />
        <el-table-column label="收款日期" width="110">
          <template #default="{ row }">
            {{ (row.receipt_date || row.created_at || '').slice(0, 10) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 新增收款单抽屉 -->
    <el-drawer v-model="drawerVisible" title="新增收款单" size="520px" destroy-on-close>
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
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
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
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getCollectReceiptList, createCollectReceipt, deleteCollectReceipt, getFundList, createFund } from '@/api/finance'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getSupplierList, createSupplier } from '@/api/procure'

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ receipt_no: '', contact_name: '', contact_type: '' })

const typeTagMap: Record<string, string> = {
  customer: 'success', supplier: 'warning', staff: 'info', other: ''
}

function typeLabel(type: string) {
  const map: Record<string, string> = { customer: '客户', supplier: '供应商', staff: '员工', other: '其他' }
  return map[type] ?? type
}

// ── 抽屉 ──────────────────────────────────────────────────────────────────────
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
    const payload: any = {
      ...rest,
      fund_id: fund_id ?? 0,
      fund_name: fund_name || '',
      order_sn: order_no || null,
    }
    if (contact_type === 'customer') {
      payload.customer_id = contact_id ?? 0
      payload.customer_name = fd.contact_name
    }
    await createCollectReceipt(payload)
    ElMessage.success('保存成功')
    drawerVisible.value = false
    tableRef.value?.refresh()
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
  tableRef.value?.refresh()
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

onMounted(() => { loadContacts(); loadFunds() })

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
