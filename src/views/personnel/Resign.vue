<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getResignList"
          del-path="/personnel/resign/batchDel"
          :export-file-name="$t('personnel.resign.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.resign.searchStaff')">
              <el-input v-model="searchForm.staff_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.resign.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.resign.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('personnel.resign.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="staff_name" :label="$t('personnel.resign.colStaff')" min-width="120" />
        <el-table-column prop="resign_type_name" :label="$t('personnel.resign.colResignType')" min-width="120" />
        <el-table-column prop="resign_date" :label="$t('personnel.resign.colResignDate')" width="120" />
        <el-table-column prop="remark" :label="$t('personnel.resign.colRemark')" min-width="180" />
        <el-table-column prop="status_tag" :label="$t('personnel.resign.colStatus')" width="100" />
        <el-table-column :label="$t('personnel.resign.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('personnel.resign.btnView') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('personnel.resign.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('personnel.resign.fieldStaff')" :rules="[{ required: true, message: $t('personnel.resign.ruleStaffRequired') }]" prop="staff_name">
          <el-input v-model="form.staff_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.resign.fieldResignType')" prop="resign_type">
          <el-input v-model="form.resign_type" />
        </el-form-item>
        <el-form-item :label="$t('personnel.resign.fieldResignDate')" prop="resign_date">
          <el-date-picker v-model="form.resign_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.resign.fieldRemark')" prop="remark">
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
import { getResignList, createResign, deleteResign } from '@/api/personnel'

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
  formTitle.value = t('personnel.resign.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createResign(data)
    ElMessage.success(t('personnel.resign.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('personnel.resign.confirmDeleteMsg'), t('personnel.resign.confirmDeleteTitle'), { type: 'warning' })
  await deleteResign(id)
  ElMessage.success(t('personnel.resign.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
