<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getLocationList" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.name" placeholder="库位名称" clearable style="width: 180px" />
          <el-input v-model="searchForm.warehouse_name" placeholder="仓库名称" clearable style="width: 180px" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>

        <el-table-column prop="name" label="库位名称" min-width="150" />
        <el-table-column prop="warehouse_name" label="仓库名称" width="160" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">查看</el-button>
              <el-button type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <ScForm ref="formRef" title="新增库位" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="库位名称" prop="name" :rules="[{ required: true, message: '请输入库位名称' }]">
          <el-input v-model="form.name" placeholder="请输入库位名称" />
        </el-form-item>
        <el-form-item label="仓库名称" prop="warehouse_name">
          <el-input v-model="form.warehouse_name" placeholder="请输入仓库名称" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'

import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getLocationList, createLocation, deleteLocation } from '@/api/warehouse'

const tableRef = ref()
const formRef = ref()

const searchForm = reactive({
  name: '',
  warehouse_name: ''
})

const openForm = () => {
  formRef.value.open()
}

const handleSubmit = async (form: any, done: () => void) => {
  try {
    await createLocation(form)
    ElMessage.success('操作成功')
    done()
    tableRef.value.refresh()
  } catch {
    //
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除该库位吗？', '提示', { type: 'warning' })
  await deleteLocation(id)
  ElMessage.success('删除成功')
  tableRef.value.refresh()
}
</script>
