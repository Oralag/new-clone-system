<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getStaffList"
          del-path="/setting/Admin/batchDel"
          export-file-name="员工列表" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="员工姓名">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="部门">
              <el-input v-model="searchForm.dept_name" clearable style="width:180px" />
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
        <el-table-column prop="name" label="员工姓名" min-width="120" />
        <el-table-column prop="dept_name" label="部门" min-width="120" />
        <el-table-column prop="jobs_name" label="职务" min-width="120" />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column prop="entry_date" label="入职日期" width="120" />
        <el-table-column prop="status_tag" label="状态" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="openView(row)">查看</el-button>
              <el-button type="primary" size="small" link @click="openForm(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="员工姓名" :rules="[{ required: true, message: '请输入员工姓名' }]" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="部门" prop="dept_name">
          <el-input v-model="form.dept_name" />
        </el-form-item>
        <el-form-item label="职务" prop="jobs_name">
          <el-input v-model="form.jobs_name" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" />
        </el-form-item>
        <el-form-item label="入职日期" prop="entry_date">
          <el-date-picker v-model="form.entry_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
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
import { getStaffList, createStaff, updateStaff, deleteStaff } from '@/api/personnel'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增员工')
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑员工' : '新增员工'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    if (!data.id) {
      // setting/Admin requires account + password for new staff
      if (!data.account) {
        data.account = 'staff_' + String(data.name || '').replace(/\s+/g, '') + '_' + Date.now().toString().slice(-6)
      }
      if (!data.password) data.password = '123456'
      data.role_id = data.role_id ?? 0
    }
    data.id ? await updateStaff(data) : await createStaff(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该员工档案？', '提示', { type: 'warning' })
  await deleteStaff(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
