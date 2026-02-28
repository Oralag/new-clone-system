<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getUnitList" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="单位名称">
              <el-input v-model="searchForm.name" placeholder="请输入单位名称" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="Object.assign(searchForm, { name: '' }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>
        <el-table-column prop="name" label="单位名称" min-width="160" />
        <el-table-column prop="remark" label="备注" min-width="200" />
        <el-table-column label="操作" width="200" fixed="right">
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
        <el-form-item label="单位名称" prop="name" :rules="[{ required: true, message: '请输入单位名称' }]">
          <el-input v-model="form.name" placeholder="请输入单位名称" />
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
import { getUnitList, createUnit, updateUnit, deleteUnit } from '@/api/goods'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增')
const searchForm = reactive<any>({ name: '' })

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
    data.id ? await updateUnit(data) : await createUnit(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await deleteUnit(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
