<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getDeptList"
          del-path="/setting/dept/batchDel"
          export-file-name="部门管理" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('setting.dept.searchName')">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('setting.dept.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('setting.dept.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('setting.dept.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="name" :label="$t('setting.dept.colName')" min-width="140" />
        <el-table-column prop="parent_name" :label="$t('setting.dept.colParent')" min-width="120" />
        <el-table-column prop="leader_name" :label="$t('setting.dept.colLeader')" min-width="120" />
        <el-table-column prop="sort" :label="$t('setting.dept.colSort')" width="80" />
        <el-table-column :label="$t('setting.dept.colActions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="openView(row)">{{ $t('setting.dept.btnView') }}</el-button>
              <el-button type="primary" size="small" link @click="openForm(row)">{{ $t('setting.dept.btnEdit') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('setting.dept.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('setting.dept.fieldName')" :rules="[{ required: true, message: t('setting.dept.ruleNameRequired') }]" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item :label="$t('setting.dept.fieldParent')" prop="parent_name">
          <el-input v-model="form.parent_name" />
        </el-form-item>
        <el-form-item :label="$t('setting.dept.fieldLeader')" prop="leader_name">
          <el-input v-model="form.leader_name" />
        </el-form-item>
        <el-form-item :label="$t('setting.dept.fieldSort')" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width:100%" />
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
import { getDeptList, createDept, updateDept, deleteDept } from '@/api/setting'

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
  formTitle.value = row ? t('setting.dept.formTitleEdit') : t('setting.dept.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    data.id ? await updateDept(data) : await createDept(data)
    ElMessage.success(t('setting.dept.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('setting.dept.confirmDeleteMsg'), t('setting.dept.confirmDeleteTitle'), { type: 'warning' })
  await deleteDept(id)
  ElMessage.success(t('setting.dept.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
