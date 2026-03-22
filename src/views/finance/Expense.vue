<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getExpenseListForTable"
          :batch-del-api="handleBatchDel"
          export-file-name="费用记录" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="费用单号">
              <el-input v-model="searchForm.expense_no" placeholder="请输入费用单号" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="费用类型">
              <el-input v-model="searchForm.type_name" placeholder="请输入费用类型" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="付款状态">
              <el-select v-model="searchForm.payment_status" clearable style="width:140px" placeholder="全部">
                <el-option label="待付款" value="pending" />
                <el-option label="已付款" value="paid" />
                <el-option label="未标记" value="none" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="Object.assign(searchForm, { expense_no: '', type_name: '', payment_status: '' }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
          <el-button :icon="Wallet" @click="router.push('/finance/fund-flow')">资金流水</el-button>
          <el-button :icon="CreditCard" @click="router.push('/finance/pay-receipt')">付款单</el-button>
        </template>
        <el-table-column label="费用单号" min-width="160">
          <template #default="{ row }">{{ row.expense_no || row.order_sn || '—' }}</template>
        </el-table-column>
        <el-table-column prop="type_name" label="费用类型" min-width="120" />
        <el-table-column label="金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#dc2626;font-weight:600">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="applicant_name" label="申请人" min-width="120" />
        <el-table-column label="申请日期" min-width="150">
          <template #default="{ row }">{{ (row.apply_date || row.created_at || '').slice(0, 16).replace('T', ' ') }}</template>
        </el-table-column>
        <el-table-column label="付款状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.payment_status_tag" size="small">{{ row.payment_status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark_clean || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">查看</el-button>
            <el-button type="primary" link @click="openForm(row)">编辑</el-button>
            <el-button v-if="row.payment_status !== 'paid'" type="success" link @click="openPayDialog(row)">付款</el-button>
            <el-button type="warning" link @click="router.push('/finance/fund-flow')">流水</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="费用类型" prop="type_name">
          <el-input v-model="form.type_name" placeholder="请输入费用类型" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="申请日期" prop="apply_date">
          <el-date-picker v-model="form.apply_date" type="date" placeholder="请选择申请日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </template>
    </ScForm>
    <el-dialog v-model="payVisible" title="费用付款" width="460px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="费用类型">
          <el-input :value="payRow?.type_name || payRow?.name || ''" readonly />
        </el-form-item>
        <el-form-item label="付款日期">
          <el-date-picker v-model="payForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="付款账户">
          <el-select v-model="payForm.fund_id" filterable clearable placeholder="请选择账户" style="width:100%" @change="onPayFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款金额">
          <el-input-number v-model="payForm.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="payForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payVisible = false">取消</el-button>
        <el-button type="primary" :loading="paySubmitting" @click="submitPay">确认付款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Wallet, CreditCard } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getExpenseList, createExpense, updateExpense, deleteExpense, createPayReceipt, getFundList } from '@/api/finance'
import { adjustFundBalance } from '@/utils/fund'

const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增')
const searchForm = reactive<any>({ expense_no: '', type_name: '', payment_status: '' })
const fundOptions = ref<any[]>([])
const payVisible = ref(false)
const paySubmitting = ref(false)
const payRow = ref<any>(null)
const payForm = reactive<any>({
  pay_date: new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10),
  fund_id: null,
  fund_name: '',
  amount: 0,
  remark: '',
})

async function getExpenseListForTable(params?: any) {
  const res = await getExpenseList(params)
  const paymentStatus = String(params?.payment_status || '')
  if (!paymentStatus) return res

  const match = (row: any) => {
    if (paymentStatus === 'none') return !row.payment_status
    return row.payment_status === paymentStatus
  }

  const rows = (res.data?.rows ?? []).filter(match)
  const list = (res.data?.list ?? []).filter(match)
  return {
    ...res,
    data: {
      ...(res.data || {}),
      rows,
      list,
      total: rows.length || list.length,
    },
  }
}

function openView(row?: any) {
  formRef.value?.openView(row ? { ...row, remark: row.remark_clean ?? row.remark ?? '' } : row)
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑' : '新增'
  formRef.value?.open(row ? { ...row, remark: row.remark_clean ?? row.remark ?? '' } : {
    apply_date: new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10),
    payment_status: 'pending',
    remark: '',
  })
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    if (data?.id) await updateExpense(data)
    else await createExpense(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function loadFunds() {
  const res = await getFundList({ list_rows: 200 })
  fundOptions.value = res.data?.rows ?? res.data?.list ?? []
}

function onPayFundChange(id: any) {
  const found = fundOptions.value.find((f: any) => f.id === id)
  payForm.fund_name = found?.name || ''
}

function openPayDialog(row: any) {
  payRow.value = row
  payForm.pay_date = new Date().toLocaleDateString('sv-SE')
  payForm.fund_id = null
  payForm.fund_name = ''
  payForm.amount = Number(row.amount || 0)
  payForm.remark = row.remark_clean ?? row.remark ?? ''
  payVisible.value = true
}

async function submitPay() {
  const row = payRow.value
  if (!row) return
  if (!payForm.fund_id) {
    ElMessage.warning('请选择付款账户')
    return
  }
  if (Number(payForm.amount || 0) <= 0) {
    ElMessage.warning('请填写付款金额')
    return
  }
  paySubmitting.value = true
  try {
    await createPayReceipt({
      order_sn: row.order_sn || row.expense_no || '',
      pay_date: payForm.pay_date,
      contact_type: 'other',
      contact_name: row.type_name || row.name || '费用支出',
      amount: Number(payForm.amount || 0),
      fund_id: payForm.fund_id,
      fund_name: payForm.fund_name || '',
      pay_type: payForm.fund_name?.includes('现金') ? 'cash' : payForm.fund_name?.includes('支付宝') ? 'alipay' : payForm.fund_name?.includes('微信') ? 'wechat' : 'bank',
      remark: payForm.remark || '',
    })
    await updateExpense({
      id: Number(row.id),
      type_name: row.type_name,
      amount: row.amount,
      apply_date: row.apply_date || row.expense_date || '',
      order_sn: row.order_sn || row.expense_no || '',
      remark: row.remark_clean ?? row.remark ?? '',
      payment_status: 'paid',
    })
    // 扣减资金账户余额
    try {
      await adjustFundBalance({
        fundId: payForm.fund_id,
        fundName: payForm.fund_name,
        delta: -Number(payForm.amount || 0),
      })
    } catch { /* 扣减失败不阻塞 */ }
    payVisible.value = false
    ElMessage.success('付款成功')
    tableRef.value?.refresh()
  } finally {
    paySubmitting.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await deleteExpense(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

async function handleBatchDel({ ids }: { ids: number[] }) {
  await Promise.all(ids.map(id => deleteExpense(id)))
}

onMounted(() => {
  loadFunds().catch(() => {})
})
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
