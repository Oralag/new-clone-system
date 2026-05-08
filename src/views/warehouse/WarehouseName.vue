<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getWarehouseList"
          del-path="/stock/WarehouseName/batchDel"
          export-file-name="仓库管理" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.name" placeholder="仓库名称" clearable style="width: 180px" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>

        <el-table-column label="仓库名称" min-width="150">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
            <el-tag v-if="row.id === defaultWarehouseId" type="success" size="small" style="margin-left: 8px">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openForm(row)">编辑</el-button>
            <el-button type="success" size="small" link @click="formRef?.openView(row)">查看</el-button>
            <el-button
              size="small" link
              :type="row.id === defaultWarehouseId ? 'info' : 'warning'"
              :disabled="row.id === defaultWarehouseId"
              @click="setDefault(row)"
            >{{ row.id === defaultWarehouseId ? '已默认' : '设为默认' }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <ScForm ref="formRef" :title="editingRow ? '编辑仓库' : '新增仓库'" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="仓库名称" prop="name" :rules="[{ required: true, message: '请输入仓库名称' }]">
          <el-input v-model="form.name" placeholder="请输入仓库名称" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" />
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

import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getWarehouseList, createWarehouse, updateWarehouse, deleteWarehouse } from '@/api/warehouse'
import http from '@/api/http'
import { getSyncedDefaultWarehouseId, saveSyncedDefaultWarehouseId } from '@/utils/defaultWarehouse'

const tableRef = ref()
const formRef = ref()
const editingRow = ref<any>(null)
const defaultWarehouseId = ref<number | null>(null)

const searchForm = reactive({
  name: ''
})

onMounted(async () => {
  defaultWarehouseId.value = await getSyncedDefaultWarehouseId(true) || null
})

const openForm = (row?: any) => {
  editingRow.value = row ?? null
  if (row) {
    formRef.value.open(row)
  } else {
    formRef.value.open()
  }
}

const setDefault = async (row: any) => {
  await saveSyncedDefaultWarehouseId(row.id)
  defaultWarehouseId.value = row.id
  ElMessage.success(`已将"${row.name}"设为默认仓库`)
}

const handleSubmit = async (form: any, done: () => void) => {
  try {
    if (editingRow.value) {
      await updateWarehouse({ ...form, id: editingRow.value.id })
      ElMessage.success('修改成功')
    } else {
      // 检查同名仓库
      const res = await getWarehouseList({ name: form.name, page: 1, page_size: 50 })
      const rows: any[] = res?.rows ?? res?.data?.rows ?? []
      const duplicate = rows.find((r: any) => r.name === form.name)
      if (duplicate) {
        ElMessage.error(`仓库"${form.name}"已存在，不可重复创建`)
        return
      }
      await createWarehouse(form)
      ElMessage.success('操作成功')
    }
    done()
    tableRef.value.refresh()
  } catch {
    //
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除该仓库吗？', '提示', { type: 'warning' })
  await http.post('/stock/WarehouseName/batchDel', { ids: [id] })
  ElMessage.success('删除成功')
  if (defaultWarehouseId.value === id) {
    defaultWarehouseId.value = null
    await saveSyncedDefaultWarehouseId(0)
  }
  tableRef.value.refresh()
}
</script>
