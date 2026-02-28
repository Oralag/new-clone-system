<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="请输入标题" clearable style="width:180px" />
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
      <ScTable ref="scTable" :api-obj="getTaskList" :params="searchForm">
        <el-table-column label="标题" prop="title" />
        <el-table-column label="负责人" prop="assignee_name" />
        <el-table-column label="优先级" prop="priority_name" />
        <el-table-column label="状态" prop="status_tag" />
        <el-table-column label="截止日期" prop="deadline" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="onEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="onDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.assignee_name" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="form.priority" placeholder="请选择优先级" style="width:100%">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DD" style="width:100%" />
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
import { getTaskList, createTask, updateTask, deleteTask } from '@/api/office'

const scTable = ref()
const searchForm = reactive<any>({ title: '', status: '' })
const dialogVisible = ref(false)
const dialogTitle = ref('新增任务')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)

const form = reactive<any>({
  id: null,
  title: '',
  assignee_name: '',
  priority: '',
  deadline: '',
  remark: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

function onReset() {
  searchForm.title = ''
  searchForm.status = ''
  scTable.value.loadData()
}

function onAdd() {
  isEdit.value = false
  dialogTitle.value = '新增任务'
  dialogVisible.value = true
}

function onEdit(row: any) {
  isEdit.value = true
  dialogTitle.value = '编辑任务'
  Object.assign(form, row)
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
  await deleteTask(id)
  ElMessage.success('删除成功')
  scTable.value.loadData()
}

async function onSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateTask(form)
    } else {
      await createTask(form)
    }
    ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    scTable.value.loadData()
  } finally {
    submitLoading.value = false
  }
}

function onDialogClosed() {
  formRef.value?.resetFields()
  Object.assign(form, { id: null, title: '', assignee_name: '', priority: '', deadline: '', remark: '' })
}
</script>

<style scoped>
.page-container {}
</style>
