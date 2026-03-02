<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getDeptList"
          del-path="/setting/dept/batchDel"
          export-file-name="部门管理" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="部门名称">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
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
        <el-table-column prop="name" label="部门名称" min-width="140" />
        <el-table-column prop="parent_name" label="上级部门" min-width="120" />
        <el-table-column prop="leader_name" label="负责人" min-width="120" />
        <el-table-column prop="sort" label="排序" width="80" />
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
        <el-form-item label="部门名称" :rules="[{ required: true, message: '请输入部门名称' }]" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="上级部门" prop="parent_name">
          <el-input v-model="form.parent_name" />
        </el-form-item>
        <el-form-item label="负责人" prop="leader_name">
          <el-input v-model="form.leader_name" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width:100%" />
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
import { getDeptList, createDept, updateDept, deleteDept } from '@/api/setting'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增部门')
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑部门' : '新增部门'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    data.id ? await updateDept(data) : await createDept(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该部门？', '提示', { type: 'warning' })
  await deleteDept(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
