<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getJobChangeList"
          del-path="/personnel/jobChange/batchDel"
          export-file-name="调岗记录" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="员工姓名">
              <el-input v-model="searchForm.staff_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>
        <el-table-column prop="staff_name" label="员工姓名" min-width="120" />
        <el-table-column prop="change_type_name" label="异动类型" min-width="120" />
        <el-table-column prop="before_dept" label="异动前部门" min-width="130" />
        <el-table-column prop="after_dept" label="异动后部门" min-width="130" />
        <el-table-column prop="change_date" label="异动日期" width="120" />
        <el-table-column prop="remark" label="备注" min-width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">查看</el-button>
              <el-button type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="员工姓名" :rules="[{ required: true, message: '请输入员工姓名' }]" prop="staff_name">
          <el-input v-model="form.staff_name" />
        </el-form-item>
        <el-form-item label="异动类型" :rules="[{ required: true, message: '请选择异动类型' }]" prop="change_type">
          <el-input v-model="form.change_type" />
        </el-form-item>
        <el-form-item label="异动前部门" prop="before_dept">
          <el-input v-model="form.before_dept" />
        </el-form-item>
        <el-form-item label="异动后部门" prop="after_dept">
          <el-input v-model="form.after_dept" />
        </el-form-item>
        <el-form-item label="异动日期" prop="change_date">
          <el-date-picker v-model="form.change_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getJobChangeList, createJobChange, deleteJobChange } from '@/api/personnel'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增异动记录')
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openForm(row?: any) {
  formTitle.value = '新增异动记录'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createJobChange(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该异动记录？', '提示', { type: 'warning' })
  await deleteJobChange(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
