<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="请输入标题" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="员工姓名">
          <el-input v-model="searchForm.staff_name" placeholder="请输入员工姓名" clearable style="width:180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">查询</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="onAdd">新增</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getWorkReportList" :params="searchForm">
        <el-table-column label="标题" prop="title" />
        <el-table-column label="员工姓名" prop="staff_name" />
        <el-table-column label="类型" prop="type_name" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" link @click="onDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增工作汇报" width="500px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" placeholder="请选择类型" style="width:100%">
            <el-option label="日报" value="日报" />
            <el-option label="周报" value="周报" />
            <el-option label="月报" value="月报" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入内容" />
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
import { getWorkReportList, createWorkReport, deleteWorkReport } from '@/api/office'

const scTable = ref()
const searchForm = reactive<any>({ title: '', staff_name: '' })
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const form = reactive<any>({
  title: '',
  type: '',
  content: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

function onReset() {
  searchForm.title = ''
  searchForm.staff_name = ''
  scTable.value.loadData()
}

function onAdd() {
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
  await deleteWorkReport(id)
  ElMessage.success('删除成功')
  scTable.value.loadData()
}

async function onSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    await createWorkReport(form)
    ElMessage.success('新增成功')
    dialogVisible.value = false
    scTable.value.loadData()
  } finally {
    submitLoading.value = false
  }
}

function onDialogClosed() {
  formRef.value?.resetFields()
  Object.assign(form, { title: '', type: '', content: '' })
}
</script>

<style scoped>
.page-container {}
</style>
