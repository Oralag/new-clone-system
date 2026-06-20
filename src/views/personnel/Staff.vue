<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getStaffList"
          del-path="/setting/Admin/batchDel"
          :export-file-name="$t('personnel.staff.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.staff.searchName')">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('personnel.staff.searchDeptName')">
              <el-input v-model="searchForm.dept_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.staff.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.staff.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('personnel.staff.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="name" :label="$t('personnel.staff.colName')" min-width="120" />
        <el-table-column prop="dept_name" :label="$t('personnel.staff.colDeptName')" min-width="120" />
        <el-table-column prop="jobs_name" :label="$t('personnel.staff.colJobsName')" min-width="120" />
        <el-table-column prop="mobile" :label="$t('personnel.staff.colMobile')" width="130" />
        <el-table-column prop="entry_date" :label="$t('personnel.staff.colEntryDate')" width="120" />
        <el-table-column prop="status_tag" :label="$t('personnel.staff.colStatus')" width="100" />
        <el-table-column :label="$t('personnel.staff.colActions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="openView(row)">{{ $t('personnel.staff.btnView') }}</el-button>
            <el-button type="primary" size="small" link @click="openForm(row)">{{ $t('personnel.staff.btnEdit') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('personnel.staff.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('personnel.staff.fieldName')" :rules="[{ required: true, message: $t('personnel.staff.ruleNameRequired') }]" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.staff.fieldDeptName')" prop="dept_name">
          <el-input v-model="form.dept_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.staff.fieldJobsName')" prop="jobs_name">
          <el-input v-model="form.jobs_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.staff.fieldMobile')" prop="mobile">
          <el-input v-model="form.mobile" />
        </el-form-item>
        <el-form-item :label="$t('personnel.staff.fieldEntryDate')" prop="entry_date">
          <el-date-picker v-model="form.entry_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
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
import { getStaffList, createStaff, updateStaff, deleteStaff } from '@/api/personnel'

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
  formTitle.value = row ? t('personnel.staff.formTitleEdit') : t('personnel.staff.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    if (!data.id) {
      // setting/Admin requires account + password for new staff
      if (!data.account) {
        data.account = 'staff_' + String(data.name || '').replace(/\s+/g, '') + '_' + Date.now().toString().slice(-6)
      }
      if (!data.password) data.password = '123456'
      data.role_id = data.role_id ?? 0
    }
    data.id ? await updateStaff(data) : await createStaff(data)
    ElMessage.success(t('personnel.staff.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('personnel.staff.confirmDeleteMsg'), t('personnel.staff.confirmDeleteTitle'), { type: 'warning' })
  await deleteStaff(id)
  ElMessage.success(t('personnel.staff.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
