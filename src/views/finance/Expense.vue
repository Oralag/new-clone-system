<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getExpenseListForTable"
          del-path="/finance/Expense/batchDel"
          export-file-name="费用记录" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="费用单号">
              <el-input v-model="searchForm.expense_no" placeholder="请输入费用单号" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="费用类型">
              <el-input v-model="searchForm.type_name" placeholder="请输入费用类型" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="付款标记">
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
        <el-table-column label="申请日期" min-width="110">
          <template #default="{ row }">{{ (row.apply_date || row.created_at || '').slice(0, 10) }}</template>
        </el-table-column>
        <el-table-column label="付款标记" min-width="100" align="center">
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
            <el-button v-if="row.payment_status !== 'pending'" type="warning" link @click="handleMarkPayment(row, 'pending')">标待付款</el-button>
            <el-button v-if="row.payment_status !== 'paid'" type="success" link @click="handleMarkPayment(row, 'paid')">标已付款</el-button>
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
        <el-form-item label="付款标记" prop="payment_status">
          <el-select v-model="form.payment_status" placeholder="请选择" style="width:100%">
            <el-option label="待付款" value="pending" />
            <el-option label="已付款" value="paid" />
            <el-option label="不标记" value="" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Wallet, CreditCard } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getExpenseList, createExpense, updateExpense, deleteExpense } from '@/api/finance'

const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增')
const searchForm = reactive<any>({ expense_no: '', type_name: '', payment_status: '' })

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

async function handleMarkPayment(row: any, paymentStatus: 'pending' | 'paid') {
  await ElMessageBox.confirm(
    `确定把这张费用单标记为${paymentStatus === 'paid' ? '已付款' : '待付款'}？`,
    '提示',
    { type: 'warning' }
  )
  await updateExpense({
    id: row.id,
    type_name: row.type_name,
    amount: row.amount,
    apply_date: row.apply_date || row.expense_date || '',
    applicant_name: row.applicant_name || row.admin_name || '',
    order_sn: row.order_sn || row.expense_no || '',
    remark: row.remark_clean ?? row.remark ?? '',
    payment_status: paymentStatus,
  })
  ElMessage.success('标记成功')
  tableRef.value?.refresh()
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await deleteExpense(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
