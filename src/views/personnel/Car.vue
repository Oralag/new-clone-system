<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getCarList"
          del-path="/personnel/car/batchDel"
          :export-file-name="$t('personnel.car.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.car.searchApplicant')">
              <el-input v-model="searchForm.applicant_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('personnel.car.searchCarPlate')">
              <el-input v-model="searchForm.car_plate" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.car.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.car.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('personnel.car.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="applicant_name" :label="$t('personnel.car.colApplicant')" min-width="120" />
        <el-table-column prop="car_plate" :label="$t('personnel.car.colCarPlate')" width="120" />
        <el-table-column prop="destination" :label="$t('personnel.car.colDestination')" min-width="140" />
        <el-table-column prop="start_date" :label="$t('personnel.car.colStartDate')" width="120" />
        <el-table-column prop="end_date" :label="$t('personnel.car.colEndDate')" width="120" />
        <el-table-column prop="remark" :label="$t('personnel.car.colRemark')" min-width="160" />
        <el-table-column prop="status_tag" :label="$t('personnel.car.colStatus')" width="100" />
        <el-table-column :label="$t('personnel.car.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('personnel.car.btnView') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('personnel.car.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('personnel.car.fieldApplicant')" :rules="[{ required: true, message: $t('personnel.car.ruleApplicantRequired') }]" prop="applicant_name">
          <el-input v-model="form.applicant_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.car.fieldCarPlate')" prop="car_plate">
          <el-input v-model="form.car_plate" />
        </el-form-item>
        <el-form-item :label="$t('personnel.car.fieldDestination')" prop="destination">
          <el-input v-model="form.destination" />
        </el-form-item>
        <el-form-item :label="$t('personnel.car.fieldStartDate')" prop="start_date">
          <el-date-picker v-model="form.start_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.car.fieldEndDate')" prop="end_date">
          <el-date-picker v-model="form.end_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.car.fieldRemark')" prop="remark">
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
import { getCarList, createCar, deleteCar } from '@/api/personnel'

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
  formTitle.value = t('personnel.car.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createCar(data)
    ElMessage.success(t('personnel.car.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('personnel.car.confirmDeleteMsg'), t('personnel.car.confirmDeleteTitle'), { type: 'warning' })
  await deleteCar(id)
  ElMessage.success(t('personnel.car.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
