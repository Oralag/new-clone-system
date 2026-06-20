<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getSalaryList"
          del-path="/personnel/salary/batchDel"
          :export-file-name="$t('personnel.salary.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.salary.searchStaffName')">
              <el-input v-model="searchForm.staff_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('personnel.salary.searchDeptName')">
              <el-input v-model="searchForm.dept_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.salary.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.salary.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('personnel.salary.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="staff_name" :label="$t('personnel.salary.colStaffName')" min-width="120" />
        <el-table-column prop="dept_name" :label="$t('personnel.salary.colDeptName')" min-width="120" />
        <el-table-column prop="base_salary" :label="$t('personnel.salary.colBaseSalary')" width="120" />
        <el-table-column prop="performance" :label="$t('personnel.salary.colPerformance')" width="100" />
        <el-table-column prop="total_salary" :label="$t('personnel.salary.colTotalSalary')" width="120" />
        <el-table-column prop="period" :label="$t('personnel.salary.colPeriod')" width="120" />
        <el-table-column prop="status_tag" :label="$t('personnel.salary.colStatus')" width="100" />
        <el-table-column :label="$t('personnel.salary.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('personnel.salary.btnView') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('personnel.salary.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('personnel.salary.fieldStaffName')" :rules="[{ required: true, message: $t('personnel.salary.ruleStaffNameRequired') }]" prop="staff_name">
          <el-input v-model="form.staff_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.salary.fieldBaseSalary')" prop="base_salary">
          <el-input-number v-model="form.base_salary" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.salary.fieldPerformance')" prop="performance">
          <el-input-number v-model="form.performance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.salary.fieldPeriod')" prop="period">
          <el-input v-model="form.period" />
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
import { getSalaryList, createSalary, deleteSalary } from '@/api/personnel'

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
  formTitle.value = t('personnel.salary.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createSalary(data)
    ElMessage.success(t('personnel.salary.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('personnel.salary.confirmDeleteMsg'), t('personnel.salary.confirmDeleteTitle'), { type: 'warning' })
  await deleteSalary(id)
  ElMessage.success(t('personnel.salary.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
