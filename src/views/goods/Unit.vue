<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getUnitList"
          del-path="/goods/ShopUnit/batchDel"
          :export-file-name="$t('goods.unit.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('goods.unit.searchNameLabel')">
              <el-input v-model="searchForm.name" :placeholder="$t('goods.unit.searchNamePlaceholder')" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('goods.unit.btnSearch') }}</el-button>
            <el-button @click="Object.assign(searchForm, { name: '' }); tableRef?.loadData()">{{ $t('goods.unit.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('goods.unit.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="name" :label="$t('goods.unit.colName')" min-width="160" />
        <el-table-column prop="remark" :label="$t('goods.unit.colRemark')" min-width="200" />
        <el-table-column :label="$t('goods.unit.colActions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">{{ $t('goods.unit.btnView') }}</el-button>
              <el-button type="primary" link @click="openForm(row)">{{ $t('goods.unit.btnEdit') }}</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">{{ $t('goods.unit.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('goods.unit.formNameLabel')" prop="name" :rules="[{ required: true, message: $t('goods.unit.formNameRequired') }]">
          <el-input v-model="form.name" :placeholder="$t('goods.unit.formNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('goods.unit.formRemarkLabel')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :placeholder="$t('goods.unit.formRemarkPlaceholder')" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getUnitList, createUnit, updateUnit, deleteUnit } from '@/api/goods'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref(t('goods.unit.formTitleAdd'))
const searchForm = reactive<any>({ name: '' })

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? t('goods.unit.formTitleEdit') : t('goods.unit.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    data.id ? await updateUnit(data) : await createUnit(data)
    ElMessage.success(t('goods.unit.msgSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('goods.unit.msgConfirmDelete'), t('goods.unit.msgTip'), { type: 'warning' })
  await deleteUnit(id)
  ElMessage.success(t('goods.unit.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
