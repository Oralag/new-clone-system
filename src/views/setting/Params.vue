<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getParamsList"
          del-path="/setting/params/batchDel"
      :export-file-name="$t('route.SettingParams')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('setting.params.searchName')">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('setting.params.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('setting.params.btnReset') }}</el-button>
          </div>
        </template>
        <el-table-column prop="name" :label="$t('setting.params.colName')" min-width="160" />
        <el-table-column prop="key" :label="$t('setting.params.colKey')" min-width="160" />
        <el-table-column prop="value" :label="$t('setting.params.colValue')" min-width="200" />
        <el-table-column :label="$t('setting.params.colActions')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openEditForm(row)">{{ $t('setting.params.btnEdit') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="$t('setting.params.formTitle')" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('setting.params.fieldValue')" prop="value">
          <el-input v-model="form.value" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getParamsList, updateParams } from '@/api/setting'

const { t } = useI18n()

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openEditForm(row: any) {
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await updateParams(data)
    ElMessage.success(t('setting.params.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
