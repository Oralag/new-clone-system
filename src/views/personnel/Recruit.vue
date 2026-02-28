<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getRecruitList" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="职位">
              <el-input v-model="searchForm.position" clearable style="width:180px" />
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
        <el-table-column prop="position" label="招聘职位" min-width="140" />
        <el-table-column prop="dept_name" label="所属部门" min-width="120" />
        <el-table-column prop="num" label="招聘人数" width="100" />
        <el-table-column prop="status_tag" label="状态" width="100" />
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
        <el-form-item label="招聘职位" :rules="[{ required: true, message: '请输入招聘职位' }]" prop="position">
          <el-input v-model="form.position" />
        </el-form-item>
        <el-form-item label="所属部门" :rules="[{ required: true, message: '请输入所属部门' }]" prop="dept_name">
          <el-input v-model="form.dept_name" />
        </el-form-item>
        <el-form-item label="招聘人数" prop="num">
          <el-input-number v-model="form.num" :min="1" style="width:100%" />
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
import { getRecruitList, createRecruit, deleteRecruit } from '@/api/personnel'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增招聘')
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openForm(row?: any) {
  formTitle.value = '新增招聘'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createRecruit(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该招聘记录？', '提示', { type: 'warning' })
  await deleteRecruit(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
