<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getExpenseList"
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
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="Object.assign(searchForm, { expense_no: '', type_name: '' }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>
        <el-table-column prop="expense_no" label="费用单号" min-width="160" />
        <el-table-column prop="type_name" label="费用类型" min-width="120" />
        <el-table-column prop="amount" label="金额" min-width="120" />
        <el-table-column prop="applicant_name" label="申请人" min-width="120" />
        <el-table-column prop="status_tag" label="状态" min-width="100" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">查看</el-button>
              <el-button type="primary" link @click="openForm(row)">编辑</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getExpenseList, createExpense, deleteExpense } from '@/api/finance'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增')
const searchForm = reactive<any>({ expense_no: '', type_name: '' })

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑' : '新增'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createExpense(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
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
