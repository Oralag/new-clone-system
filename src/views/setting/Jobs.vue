<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getJobsList"
          del-path="/setting/jobs/batchDel"
      :export-file-name="$t('route.SettingJobs')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('setting.jobs.searchName')">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('setting.jobs.searchDept')">
              <el-input v-model="searchForm.dept_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('setting.jobs.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('setting.jobs.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('setting.jobs.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="name" :label="$t('setting.jobs.colName')" min-width="140" />
        <el-table-column prop="dept_name" :label="$t('setting.jobs.colDept')" min-width="120" />
        <el-table-column prop="remark" :label="$t('setting.jobs.colRemark')" min-width="180" />
        <el-table-column :label="$t('setting.jobs.colActions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="openView(row)">{{ $t('setting.jobs.btnView') }}</el-button>
              <el-button type="primary" size="small" link @click="openForm(row)">{{ $t('setting.jobs.btnEdit') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('setting.jobs.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('setting.jobs.fieldName')" :rules="[{ required: true, message: t('setting.jobs.ruleNameRequired') }]" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('setting.jobs.fieldDept')" prop="dept_name">
          <el-input v-model="form.dept_name" />
        </el-form-item>
        <el-form-item :label="$t('setting.jobs.fieldRemark')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getJobsList, createJobs, updateJobs, deleteJobs } from '@/api/setting'

const { t } = useI18n()

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('')
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? t('setting.jobs.formTitleEdit') : t('setting.jobs.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    data.id ? await updateJobs(data) : await createJobs(data)
    ElMessage.success(t('setting.jobs.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('setting.jobs.confirmDeleteMsg'), t('setting.jobs.confirmDeleteTitle'), { type: 'warning' })
  await deleteJobs(id)
  ElMessage.success(t('setting.jobs.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
