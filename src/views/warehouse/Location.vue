<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getLocationList"
          del-path="/stock/Location/batchDel"
          export-file-name="库位管理" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.name" :placeholder="$t('warehouse.location.searchLocationName')" clearable style="width: 180px" />
          <el-input v-model="searchForm.warehouse_name" :placeholder="$t('warehouse.location.searchWarehouseName')" clearable style="width: 180px" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('warehouse.location.btnAdd') }}</el-button>
        </template>

        <el-table-column prop="name" :label="$t('warehouse.location.colLocationName')" min-width="150" />
        <el-table-column prop="warehouse_name" :label="$t('warehouse.location.colWarehouseName')" width="160" />
        <el-table-column prop="remark" :label="$t('warehouse.location.colRemark')" min-width="160" show-overflow-tooltip />

        <el-table-column :label="$t('warehouse.location.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('warehouse.location.btnView') }}</el-button>
              <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('warehouse.location.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <ScForm ref="formRef" :title="$t('warehouse.location.formTitle')" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('warehouse.location.fieldLocationName')" prop="name" :rules="[{ required: true, message: t('warehouse.location.ruleLocationNameRequired') }]">
          <el-input v-model="form.name" :placeholder="$t('warehouse.location.placeholderLocationName')" />
        </el-form-item>
        <el-form-item :label="$t('warehouse.location.fieldWarehouseName')" prop="warehouse_name">
          <el-input v-model="form.warehouse_name" :placeholder="$t('warehouse.location.placeholderWarehouseName')" />
        </el-form-item>
        <el-form-item :label="$t('warehouse.location.fieldRemark')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :placeholder="$t('warehouse.location.placeholderRemark')" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { useI18n } from 'vue-i18n'

import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getLocationList, createLocation, deleteLocation } from '@/api/warehouse'

const { t } = useI18n()
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
    ElMessage.success(t('warehouse.location.msgSuccess'))
    done()
    tableRef.value.refresh()
  } catch {
    //
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm(t('warehouse.location.msgConfirmDelete'), t('warehouse.location.msgConfirmTitle'), { type: 'warning' })
  await deleteLocation(id)
  ElMessage.success(t('warehouse.location.msgDeleteSuccess'))
  tableRef.value.refresh()
}
</script>
