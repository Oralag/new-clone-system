<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          del-path="/stock/Pick/batchDel"
          :export-file-name="$t('warehouse.pick.exportFileName')" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.pick_no" :placeholder="$t('warehouse.pick.searchPickNo')" clearable style="width: 180px" />
          <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('warehouse.pick.searchReconcileStatus')">
            <el-option :label="$t('warehouse.pick.filterUnreconciled')" value="unreconciled" />
          </el-select>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('warehouse.pick.btnAdd') }}</el-button>
        </template>

        <el-table-column prop="pick_no" :label="$t('warehouse.pick.colPickNo')" width="160" />
        <el-table-column prop="goods_name" :label="$t('warehouse.pick.colGoodsName')" min-width="150" />
        <el-table-column prop="num" :label="$t('warehouse.pick.colNum')" width="100" />
        <el-table-column prop="warehouse_name" :label="$t('warehouse.pick.colWarehouseName')" width="150" />
        <el-table-column prop="status_name" :label="$t('warehouse.pick.colStatus')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'info' : 'warning'" size="small">
              {{ row.status_name || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('warehouse.pick.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('warehouse.pick.btnView') }}</el-button>
            <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('warehouse.pick.btnReconciled') : $t('warehouse.pick.btnReconcile') }}</el-button>
            <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('warehouse.pick.titleAuditedCannotDelete') : ''" @click="handleDelete(row.id)">{{ $t('warehouse.pick.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <ScForm ref="formRef" :title="$t('warehouse.pick.formTitle')" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('warehouse.pick.fieldGoodsName')" prop="goods_name" :rules="[{ required: true, message: $t('warehouse.pick.ruleGoodsNameRequired') }]">
          <el-input v-model="form.goods_name" :placeholder="$t('warehouse.pick.placeholderGoodsName')" />
        </el-form-item>
        <el-form-item :label="$t('warehouse.pick.fieldNum')" prop="num" :rules="[{ required: true, message: $t('warehouse.pick.ruleNumRequired') }]">
          <el-input-number v-model="form.num" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('warehouse.pick.fieldWarehouseName')" prop="warehouse_name">
          <el-input v-model="form.warehouse_name" :placeholder="$t('warehouse.pick.placeholderWarehouseName')" />
        </el-form-item>
        <el-form-item :label="$t('warehouse.pick.fieldRemark')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :placeholder="$t('warehouse.pick.placeholderRemark')" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import ScForm from '@/components/ScForm.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getPickList, createPick, deletePick } from '@/api/warehouse'

const { t } = useI18n()
const tableRef = ref()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_warehouse_pick', tableRef)
const reconcileFilteredApi = createFilteredApi(getPickList, 'reconcile_filter')
const formRef = ref()

const searchForm = reactive({
  pick_no: '',
  reconcile_filter: ''
})

const openForm = () => {
  formRef.value.open()
}

const handleSubmit = async (form: any, done: () => void) => {
  try {
    await createPick(form)
    ElMessage.success(t('warehouse.pick.msgSuccess'))
    done()
    tableRef.value.refresh()
  } catch {
    //
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm(t('warehouse.pick.msgConfirmDelete'), t('warehouse.pick.msgConfirmTitle'), { type: 'warning' })
  await deletePick(id)
  ElMessage.success(t('warehouse.pick.msgDeleteSuccess'))
  tableRef.value.refresh()
}
</script>
