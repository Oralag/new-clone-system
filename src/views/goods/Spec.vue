<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getSpecList"
          del-path="/goods/ShopSpec/batchDel"
          :export-file-name="$t('goods.spec.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('goods.spec.searchNameLabel')">
              <el-input v-model="searchForm.name" :placeholder="$t('goods.spec.searchNamePlaceholder')" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('goods.spec.btnSearch') }}</el-button>
            <el-button @click="Object.assign(searchForm, { name: '' }); tableRef?.loadData()">{{ $t('goods.spec.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('goods.spec.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="name" :label="$t('goods.spec.colName')" min-width="160" />
        <el-table-column prop="values" :label="$t('goods.spec.colValues')" min-width="200" />
        <el-table-column :label="$t('goods.spec.colActions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">{{ $t('goods.spec.btnView') }}</el-button>
              <el-button type="primary" link @click="openForm(row)">{{ $t('goods.spec.btnEdit') }}</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">{{ $t('goods.spec.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('goods.spec.formNameLabel')" prop="name" :rules="[{ required: true, message: $t('goods.spec.formNameRequired') }]">
          <el-input v-model="form.name" :placeholder="$t('goods.spec.formNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('goods.spec.formRemarkLabel')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :placeholder="$t('goods.spec.formRemarkPlaceholder')" />
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
import { getSpecList, createSpec, updateSpec, deleteSpec } from '@/api/goods'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref(t('goods.spec.formTitleAdd'))
const searchForm = reactive<any>({ name: '' })

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? t('goods.spec.formTitleEdit') : t('goods.spec.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    data.id ? await updateSpec(data) : await createSpec(data)
    ElMessage.success(t('goods.spec.msgSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('goods.spec.msgConfirmDelete'), t('goods.spec.msgTip'), { type: 'warning' })
  await deleteSpec(id)
  ElMessage.success(t('goods.spec.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
