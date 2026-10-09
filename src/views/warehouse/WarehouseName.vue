<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="listAllWarehouses"
          del-path="/stock/WarehouseName/batchDel"
          :export-file-name="$t('warehouse.warehouseName.exportFileName')" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.name" :placeholder="$t('warehouse.warehouseName.searchName')" clearable style="width: 180px" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('warehouse.warehouseName.btnAdd') }}</el-button>
        </template>

        <el-table-column :label="$t('warehouse.warehouseName.colName')" min-width="150">
          <template #default="{ row }">
            <span>{{ row.name }}</span>
            <el-tag v-if="row.id === defaultWarehouseId" type="success" size="small" style="margin-left: 8px">{{ $t('warehouse.warehouseName.tagDefault') }}</el-tag>
            <el-tag v-if="Number(row.status) === 0" type="info" size="small" style="margin-left: 8px">已停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" :label="$t('warehouse.warehouseName.colAddress')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="remark" :label="$t('warehouse.warehouseName.colRemark')" min-width="160" show-overflow-tooltip />

        <el-table-column :label="$t('warehouse.warehouseName.colActions')" width="270" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openForm(row)">{{ $t('warehouse.warehouseName.btnEdit') }}</el-button>
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('warehouse.warehouseName.btnView') }}</el-button>
            <el-button
              size="small" link
              :type="row.id === defaultWarehouseId ? 'info' : 'warning'"
              :disabled="row.id === defaultWarehouseId"
              @click="setDefault(row)"
            >{{ row.id === defaultWarehouseId ? $t('warehouse.warehouseName.btnAlreadyDefault') : $t('warehouse.warehouseName.btnSetDefault') }}</el-button>
            <el-button v-if="row.id !== defaultWarehouseId" size="small" link :type="Number(row.status) === 0 ? 'success' : 'info'"
              @click="toggleStatus(row)">{{ Number(row.status) === 0 ? '启用' : '停用' }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('warehouse.warehouseName.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <ScForm ref="formRef" :title="editingRow ? $t('warehouse.warehouseName.formTitleEdit') : $t('warehouse.warehouseName.formTitleAdd')" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('warehouse.warehouseName.fieldName')" prop="name" :rules="[{ required: true, message: $t('warehouse.warehouseName.ruleNameRequired') }]">
          <el-input v-model="form.name" :placeholder="$t('warehouse.warehouseName.placeholderName')" />
        </el-form-item>
        <el-form-item :label="$t('warehouse.warehouseName.fieldAddress')" prop="address">
          <el-input v-model="form.address" :placeholder="$t('warehouse.warehouseName.placeholderAddress')" />
        </el-form-item>
        <el-form-item :label="$t('warehouse.warehouseName.fieldRemark')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :placeholder="$t('warehouse.warehouseName.placeholderRemark')" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getWarehouseList, createWarehouse, updateWarehouse, deleteWarehouse } from '@/api/warehouse'
import http from '@/api/http'
import { getSyncedDefaultWarehouseId, saveSyncedDefaultWarehouseId } from '@/utils/defaultWarehouse'

const { t } = useI18n()
const tableRef = ref()
const formRef = ref()
const editingRow = ref<any>(null)
const defaultWarehouseId = ref<number | null>(null)
// 仓库管理页要看到停用的仓库（其他页面的仓库列表默认不返回停用仓库）
const listAllWarehouses = (params?: any) => getWarehouseList({ ...(params || {}), all: 1 })
// 停用后开单选不到它，收银台/线上单兜底也不会再扣到它；库存和历史单据都保留
const toggleStatus = async (row: any) => {
  const disable = Number(row.status) !== 0
  if (disable) {
    await ElMessageBox.confirm(`停用「${row.name}」后，开单时选不到它，库存和历史单据都保留，随时可以再启用。`, '停用仓库', { type: 'warning' })
  }
  await updateWarehouse({ id: row.id, status: disable ? 0 : 1 })
  ElMessage.success(disable ? '已停用' : '已启用')
  tableRef.value?.refresh?.()
}

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
  ElMessage.success(t('warehouse.warehouseName.msgSetDefaultSuccess', { name: row.name }))
}

const handleSubmit = async (form: any, done: () => void) => {
  try {
    if (editingRow.value) {
      await updateWarehouse({ ...form, id: editingRow.value.id })
      ElMessage.success(t('warehouse.warehouseName.msgEditSuccess'))
    } else {
      const res = await getWarehouseList({ name: form.name, page: 1, page_size: 50, all: 1 })
      const rows: any[] = res?.rows ?? res?.data?.rows ?? []
      const duplicate = rows.find((r: any) => r.name === form.name)
      if (duplicate) {
        ElMessage.error(t('warehouse.warehouseName.msgDuplicateName', { name: form.name }))
        return
      }
      await createWarehouse(form)
      ElMessage.success(t('warehouse.warehouseName.msgSuccess'))
    }
    done()
    tableRef.value.refresh()
  } catch {
    //
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm(t('warehouse.warehouseName.msgConfirmDelete'), t('warehouse.warehouseName.msgConfirmTitle'), { type: 'warning' })
  await http.post('/stock/WarehouseName/batchDel', { ids: [id] })
  ElMessage.success(t('warehouse.warehouseName.msgDeleteSuccess'))
  if (defaultWarehouseId.value === id) {
    defaultWarehouseId.value = null
    await saveSyncedDefaultWarehouseId(0)
  }
  tableRef.value.refresh()
}
</script>
