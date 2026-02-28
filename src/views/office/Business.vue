<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-button type="primary" :icon="Plus" @click="onAdd">新增</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getBusinessList" :params="searchForm">
        <el-table-column label="员工姓名" prop="staff_name" />
        <el-table-column label="目的地" prop="destination" />
        <el-table-column label="开始日期" prop="start_date" />
        <el-table-column label="结束日期" prop="end_date" />
        <el-table-column label="天数" prop="days" />
        <el-table-column label="状态" prop="status_tag" />
        <el-table-column label="申请时间" prop="apply_time" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" link @click="onDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增出差申请" width="500px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="目的地" prop="destination">
          <el-input v-model="form.destination" placeholder="请输入目的地" />
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker v-model="form.start_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker v-model="form.end_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
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
import { getBusinessList, createBusiness, deleteBusiness } from '@/api/office'

const scTable = ref()
const searchForm = reactive<any>({})
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const form = reactive<any>({
  destination: '',
  start_date: '',
  end_date: '',
  remark: ''
})

const rules = {
  destination: [{ required: true, message: '请输入目的地', trigger: 'blur' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

function onAdd() {
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
  await deleteBusiness(id)
  ElMessage.success('删除成功')
  scTable.value.loadData()
}

async function onSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    await createBusiness(form)
    ElMessage.success('新增成功')
    dialogVisible.value = false
    scTable.value.loadData()
  } finally {
    submitLoading.value = false
  }
}

function onDialogClosed() {
  formRef.value?.resetFields()
  Object.assign(form, { destination: '', start_date: '', end_date: '', remark: '' })
}
</script>

<style scoped>
.page-container {}
</style>
