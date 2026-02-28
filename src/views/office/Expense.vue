<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="申请人">
          <el-input v-model="searchForm.applicant_name" placeholder="请输入申请人" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-input v-model="searchForm.status" placeholder="请输入状态" clearable style="width:180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">查询</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="onAdd">新增</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getOfficeExpenseList" :params="searchForm">
        <el-table-column label="报销单号" prop="expense_no" />
        <el-table-column label="申请人" prop="applicant_name" />
        <el-table-column label="类型" prop="type_name" />
        <el-table-column label="金额" prop="amount" />
        <el-table-column label="状态" prop="status_tag" />
        <el-table-column label="申请日期" prop="apply_date" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" link @click="onDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增报销申请" width="500px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="类型" prop="type_name">
          <el-input v-model="form.type_name" placeholder="请输入类型" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="申请日期">
          <el-date-picker v-model="form.apply_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getOfficeExpenseList, createOfficeExpense, deleteOfficeExpense } from '@/api/office'

const scTable = ref()
const searchForm = reactive<any>({ applicant_name: '', status: '' })
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const form = reactive<any>({
  type_name: '',
  amount: 0,
  apply_date: '',
  remark: ''
})

const rules = {
  type_name: [{ required: true, message: '请输入类型', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

function onReset() {
  searchForm.applicant_name = ''
  searchForm.status = ''
  scTable.value.loadData()
}

function onAdd() {
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
  await deleteOfficeExpense(id)
  ElMessage.success('删除成功')
  scTable.value.loadData()
}

async function onSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    await createOfficeExpense(form)
    ElMessage.success('新增成功')
    dialogVisible.value = false
    scTable.value.loadData()
  } finally {
    submitLoading.value = false
  }
}

function onDialogClosed() {
  formRef.value?.resetFields()
  Object.assign(form, { type_name: '', amount: 0, apply_date: '', remark: '' })
}
</script>

<style scoped>
.page-container {}
</style>
