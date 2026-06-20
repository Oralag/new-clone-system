<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="getExpenseListForTable"
          :batch-del-api="handleBatchDel"
          :export-file-name="$t('finance.expense.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('finance.expense.expenseNo')">
              <el-input v-model="searchForm.expense_no" :placeholder="$t('finance.expense.expenseNoPlaceholder')" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('finance.expense.expenseType')">
              <el-input v-model="searchForm.type_name" :placeholder="$t('finance.expense.expenseTypePlaceholder')" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('finance.expense.paymentStatus')">
              <el-select v-model="searchForm.payment_status" clearable style="width:140px" :placeholder="$t('finance.expense.all')">
                <el-option :label="$t('finance.expense.paymentStatusPending')" value="pending" />
                <el-option :label="$t('finance.expense.paymentStatusPaid')" value="paid" />
                <el-option :label="$t('finance.expense.paymentStatusNone')" value="none" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('finance.expense.reconcileStatus')">
              <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('finance.expense.all')">
                <el-option :label="$t('finance.expense.unreconciled')" value="unreconciled" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('common.query') }}</el-button>
            <el-button @click="Object.assign(searchForm, { expense_no: '', type_name: '', payment_status: '', reconcile_filter: '' }); tableRef?.loadData()">{{ $t('common.reset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('common.add') }}</el-button>
          <el-button :icon="Wallet" @click="router.push('/finance/fund-flow')">{{ $t('finance.expense.fundFlow') }}</el-button>
          <el-button :icon="CreditCard" @click="router.push('/finance/pay-receipt')">{{ $t('finance.expense.payReceipt') }}</el-button>
        </template>
        <el-table-column :label="$t('finance.expense.expenseNo')" min-width="160">
          <template #default="{ row }">{{ row.expense_no || row.order_sn || '—' }}</template>
        </el-table-column>
        <el-table-column prop="type_name" :label="$t('finance.expense.expenseType')" min-width="120" />
        <el-table-column :label="$t('finance.expense.amount')" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#dc2626;font-weight:600">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="applicant_name" :label="$t('finance.expense.applicant')" min-width="120" />
        <el-table-column :label="$t('finance.expense.applyDate')" min-width="150">
          <template #default="{ row }">{{ fmtDt(row.apply_date || row.created_at) }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.expense.paymentStatus')" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.payment_status_tag" size="small">{{ row.payment_status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.expense.remark')" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark_clean || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.expense.operation')" width="300" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">{{ $t('finance.expense.view') }}</el-button>
            <el-button type="primary" link @click="openForm(row)">{{ $t('finance.expense.edit') }}</el-button>
            <el-button v-if="row.payment_status !== 'paid'" type="success" link @click="openPayDialog(row)">{{ $t('finance.expense.pay') }}</el-button>
            <el-button type="warning" link @click="router.push('/finance/fund-flow')">{{ $t('finance.expense.flow') }}</el-button>
            <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('finance.expense.reconciled') : $t('finance.expense.reconcile') }}</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">{{ $t('finance.expense.delete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('finance.expense.formExpenseType')" prop="type_name">
          <el-input v-model="form.type_name" :placeholder="$t('finance.expense.expenseTypePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('finance.expense.formAmount')" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.expense.formApplyDate')" prop="apply_date">
          <el-date-picker v-model="form.apply_date" type="date" :placeholder="$t('finance.expense.formApplyDatePlaceholder')" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.expense.formRemark')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :placeholder="$t('finance.expense.formRemarkPlaceholder')" />
        </el-form-item>
      </template>
    </ScForm>
    <el-dialog v-model="payVisible" :title="$t('finance.expense.payDialogTitle')" width="460px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item :label="$t('finance.expense.payFormExpenseType')">
          <el-input :value="payRow?.type_name || payRow?.name || ''" readonly />
        </el-form-item>
        <el-form-item :label="$t('finance.expense.payFormDate')">
          <el-date-picker v-model="payForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.expense.payFormAccount')">
          <el-select v-model="payForm.fund_id" filterable clearable :placeholder="$t('finance.expense.payFormAccountPlaceholder')" style="width:100%" @change="onPayFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('finance.expense.payFormAmount')">
          <el-input-number v-model="payForm.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.expense.payFormRemark')">
          <el-input v-model="payForm.remark" type="textarea" :rows="3" :placeholder="$t('finance.expense.payFormRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payVisible = false">{{ $t('finance.expense.cancel') }}</el-button>
        <el-button type="primary" :loading="paySubmitting" @click="submitPay">{{ $t('finance.expense.confirmPay') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Wallet, CreditCard } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import ScForm from '@/components/ScForm.vue'
import { getExpenseList, createExpense, updateExpense, deleteExpense, createPayReceipt, getFundList } from '@/api/finance'
import { adjustFundBalance } from '@/utils/fund'
import { fmtDt } from '@/utils/date'

const { t } = useI18n()
const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, ids: reconciledIds } = useReconcile('reconcile_expense', tableRef)
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('')
const searchForm = reactive<any>({ expense_no: '', type_name: '', payment_status: '', reconcile_filter: '' })
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
  const isUnreconciled = params?.reconcile_filter === 'unreconciled'
  const fetchParams = isUnreconciled ? { ...params, reconcile_filter: undefined, list_rows: 10000, page: 1 } : params
  const res = await getExpenseList(fetchParams)
  const paymentStatus = String(params?.payment_status || '')

  let rows = res.data?.rows ?? []
  let list = res.data?.list ?? []

  if (paymentStatus) {
    const match = (row: any) => {
      if (paymentStatus === 'none') return !row.payment_status
      return row.payment_status === paymentStatus
    }
    rows = rows.filter(match)
    list = list.filter(match)
  }

  if (isUnreconciled) {
    rows = rows.filter((r: any) => !reconciledIds.value.has(Number(r.id)))
    list = list.filter((r: any) => !reconciledIds.value.has(Number(r.id)))
  }

  if (!paymentStatus && !isUnreconciled) return res
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
  formTitle.value = row ? t('finance.expense.editTitle') : t('finance.expense.addTitle')
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
    ElMessage.success(t('finance.expense.opSuccess'))
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
    ElMessage.warning(t('finance.expense.selectAccount'))
    return
  }
  if (Number(payForm.amount || 0) <= 0) {
    ElMessage.warning(t('finance.expense.fillAmount'))
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
    ElMessage.success(t('finance.expense.paySuccess'))
    tableRef.value?.refresh()
  } finally {
    paySubmitting.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('finance.expense.deleteConfirm'), t('finance.expense.deleteTip'), { type: 'warning' })
  await deleteExpense(id)
  ElMessage.success(t('finance.expense.deleteSuccess'))
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
