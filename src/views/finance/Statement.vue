<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getStatementList"
          del-path="/finance/Statement/batchDel"
          :export-file-name="t('finance.statement.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="t('finance.statement.statementNo')">
              <el-input v-model="searchForm.statement_no" :placeholder="t('finance.statement.statementNoPlaceholder')" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="t('finance.statement.customerName')">
              <el-input v-model="searchForm.customer_name" :placeholder="t('finance.statement.customerNamePlaceholder')" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ t('finance.statement.query') }}</el-button>
            <el-button @click="Object.assign(searchForm, { statement_no: '', customer_name: '' }); tableRef?.loadData()">{{ t('finance.statement.reset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ t('finance.statement.add') }}</el-button>
        </template>
        <el-table-column prop="statement_no" :label="t('finance.statement.statementNo')" min-width="160" />
        <el-table-column prop="customer_name" :label="t('finance.statement.customerName')" min-width="140" />
        <el-table-column prop="start_date" :label="t('finance.statement.startDate')" min-width="120" />
        <el-table-column prop="end_date" :label="t('finance.statement.endDate')" min-width="120" />
        <el-table-column prop="total_amount" :label="t('finance.statement.totalAmount')" min-width="120" />
        <el-table-column prop="status_tag" :label="t('finance.statement.status')" min-width="100" />
        <el-table-column :label="t('finance.statement.operation')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">{{ t('finance.statement.view') }}</el-button>
              <el-button type="primary" link @click="openForm(row)">{{ t('finance.statement.edit') }}</el-button>
              <el-button type="danger" link @click="handleDelete(row.id)">{{ t('finance.statement.delete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="t('finance.statement.customerName')" prop="customer_name">
          <el-input v-model="form.customer_name" :placeholder="t('finance.statement.customerNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('finance.statement.startDate')" prop="start_date">
          <el-date-picker v-model="form.start_date" type="date" :placeholder="t('finance.statement.startDatePlaceholder')" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="t('finance.statement.endDate')" prop="end_date">
          <el-date-picker v-model="form.end_date" type="date" :placeholder="t('finance.statement.endDatePlaceholder')" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="t('finance.statement.remark')" prop="remark">
          <el-input v-model="form.remark" type="textarea" :placeholder="t('finance.statement.remarkPlaceholder')" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getStatementList, createStatement, updateStatement, deleteStatement } from '@/api/finance'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref(t('finance.statement.formTitleAdd'))
const searchForm = reactive<any>({ statement_no: '', customer_name: '' })

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? t('finance.statement.formTitleEdit') : t('finance.statement.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    if (data.id) {
      await updateStatement(data)
    } else {
      await createStatement(data)
    }
    ElMessage.success(t('finance.statement.opSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || t('finance.statement.opFailed'))
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('finance.statement.confirmDelete'), t('finance.statement.confirmDeleteTitle'), { type: 'warning' })
  await deleteStatement(id)
  ElMessage.success(t('finance.statement.deleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
