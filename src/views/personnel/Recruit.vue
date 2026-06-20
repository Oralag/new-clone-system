<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getRecruitList"
          del-path="/personnel/recruit/batchDel"
          :export-file-name="$t('personnel.recruit.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.recruit.searchPosition')">
              <el-input v-model="searchForm.position" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('personnel.recruit.searchDept')">
              <el-input v-model="searchForm.dept_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.recruit.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.recruit.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('personnel.recruit.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="position" :label="$t('personnel.recruit.colPosition')" min-width="140" />
        <el-table-column prop="dept_name" :label="$t('personnel.recruit.colDept')" min-width="120" />
        <el-table-column prop="num" :label="$t('personnel.recruit.colNum')" width="100" />
        <el-table-column prop="status_tag" :label="$t('personnel.recruit.colStatus')" width="100" />
        <el-table-column :label="$t('personnel.recruit.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('personnel.recruit.btnView') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('personnel.recruit.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('personnel.recruit.fieldPosition')" :rules="[{ required: true, message: $t('personnel.recruit.rulePositionRequired') }]" prop="position">
          <el-input v-model="form.position" />
        </el-form-item>
        <el-form-item :label="$t('personnel.recruit.fieldDept')" :rules="[{ required: true, message: $t('personnel.recruit.ruleDeptRequired') }]" prop="dept_name">
          <el-input v-model="form.dept_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.recruit.fieldNum')" prop="num">
          <el-input-number v-model="form.num" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.recruit.fieldRemark')" prop="remark">
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
import { getRecruitList, createRecruit, deleteRecruit } from '@/api/personnel'

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
  formTitle.value = t('personnel.recruit.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createRecruit(data)
    ElMessage.success(t('personnel.recruit.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('personnel.recruit.confirmDeleteMsg'), t('personnel.recruit.confirmDeleteTitle'), { type: 'warning' })
  await deleteRecruit(id)
  ElMessage.success(t('personnel.recruit.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
