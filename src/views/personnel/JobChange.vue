<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getJobChangeList"
          del-path="/personnel/jobChange/batchDel"
          :export-file-name="$t('personnel.jobChange.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.jobChange.searchStaff')">
              <el-input v-model="searchForm.staff_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.jobChange.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.jobChange.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('personnel.jobChange.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="staff_name" :label="$t('personnel.jobChange.colStaff')" min-width="120" />
        <el-table-column prop="change_type_name" :label="$t('personnel.jobChange.colChangeType')" min-width="120" />
        <el-table-column prop="before_dept" :label="$t('personnel.jobChange.colBeforeDept')" min-width="130" />
        <el-table-column prop="after_dept" :label="$t('personnel.jobChange.colAfterDept')" min-width="130" />
        <el-table-column prop="change_date" :label="$t('personnel.jobChange.colChangeDate')" width="120" />
        <el-table-column prop="remark" :label="$t('personnel.jobChange.colRemark')" min-width="160" />
        <el-table-column :label="$t('personnel.jobChange.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('personnel.jobChange.btnView') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('personnel.jobChange.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('personnel.jobChange.fieldStaff')" :rules="[{ required: true, message: $t('personnel.jobChange.ruleStaffRequired') }]" prop="staff_name">
          <el-input v-model="form.staff_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.jobChange.fieldChangeType')" :rules="[{ required: true, message: $t('personnel.jobChange.ruleChangeTypeRequired') }]" prop="change_type">
          <el-input v-model="form.change_type" />
        </el-form-item>
        <el-form-item :label="$t('personnel.jobChange.fieldBeforeDept')" prop="before_dept">
          <el-input v-model="form.before_dept" />
        </el-form-item>
        <el-form-item :label="$t('personnel.jobChange.fieldAfterDept')" prop="after_dept">
          <el-input v-model="form.after_dept" />
        </el-form-item>
        <el-form-item :label="$t('personnel.jobChange.fieldChangeDate')" prop="change_date">
          <el-date-picker v-model="form.change_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.jobChange.fieldRemark')" prop="remark">
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
import { getJobChangeList, createJobChange, deleteJobChange } from '@/api/personnel'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('')
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openForm(row?: any) {
  formTitle.value = t('personnel.jobChange.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createJobChange(data)
    ElMessage.success(t('personnel.jobChange.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('personnel.jobChange.confirmDeleteMsg'), t('personnel.jobChange.confirmDeleteTitle'), { type: 'warning' })
  await deleteJobChange(id)
  ElMessage.success(t('personnel.jobChange.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
