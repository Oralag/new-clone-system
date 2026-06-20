<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getSocialList"
          del-path="/personnel/social/batchDel"
          :export-file-name="$t('personnel.social.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.social.searchStaffName')">
              <el-input v-model="searchForm.staff_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('personnel.social.searchDeptName')">
              <el-input v-model="searchForm.dept_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.social.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.social.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('personnel.social.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="staff_name" :label="$t('personnel.social.colStaffName')" min-width="120" />
        <el-table-column prop="dept_name" :label="$t('personnel.social.colDeptName')" min-width="120" />
        <el-table-column prop="social_base" :label="$t('personnel.social.colSocialBase')" width="120" />
        <el-table-column prop="company_pay" :label="$t('personnel.social.colCompanyPay')" width="120" />
        <el-table-column prop="staff_pay" :label="$t('personnel.social.colStaffPay')" width="120" />
        <el-table-column prop="period" :label="$t('personnel.social.colPeriod')" width="120" />
        <el-table-column :label="$t('personnel.social.colActions')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('personnel.social.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="$t('personnel.social.formTitleAdd')" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('personnel.social.fieldStaffName')" :rules="[{ required: true, message: $t('personnel.social.ruleStaffNameRequired') }]" prop="staff_name">
          <el-input v-model="form.staff_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.social.fieldDeptName')" prop="dept_name">
          <el-input v-model="form.dept_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.social.fieldSocialBase')" prop="social_base">
          <el-input-number v-model="form.social_base" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.social.fieldCompanyPay')" prop="company_pay">
          <el-input-number v-model="form.company_pay" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.social.fieldStaffPay')" prop="staff_pay">
          <el-input-number v-model="form.staff_pay" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.social.fieldPeriod')" prop="period">
          <el-input v-model="form.period" :placeholder="$t('personnel.social.fieldPeriodPlaceholder')" />
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
import { getSocialList, createSocial, deleteSocial } from '@/api/personnel'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openForm() {
  formRef.value?.open()
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createSocial(data)
    ElMessage.success(t('personnel.social.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('personnel.social.confirmDeleteMsg'), t('personnel.social.confirmDeleteTitle'), { type: 'warning' })
  await deleteSocial(id)
  ElMessage.success(t('personnel.social.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
