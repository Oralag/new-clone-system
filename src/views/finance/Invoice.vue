<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          del-path="/finance/Invoice/batchDel"
          :export-file-name="t('finance.invoice.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="t('finance.invoice.invoiceNo')">
              <el-input v-model="searchForm.invoice_no" :placeholder="t('finance.invoice.invoiceNoPlaceholder')" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="t('finance.invoice.customerName')">
              <el-input v-model="searchForm.customer_name" :placeholder="t('finance.invoice.customerNamePlaceholder')" clearable style="width:180px" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="t('finance.invoice.reconcileStatus')">
                <el-option :label="t('finance.invoice.unreconciled')" value="unreconciled" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ t('finance.invoice.query') }}</el-button>
            <el-button @click="Object.assign(searchForm, { invoice_no: '', customer_name: '', reconcile_filter: '' }); tableRef?.loadData()">{{ t('finance.invoice.reset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ t('finance.invoice.add') }}</el-button>
        </template>
        <el-table-column prop="invoice_no" :label="t('finance.invoice.invoiceNo')" min-width="160" />
        <el-table-column prop="customer_name" :label="t('finance.invoice.customerName')" min-width="140" />
        <el-table-column prop="amount" :label="t('finance.invoice.amount')" min-width="120" />
        <el-table-column prop="invoice_type_name" :label="t('finance.invoice.invoiceType')" min-width="120" />
        <el-table-column prop="status_tag" :label="t('finance.invoice.status')" min-width="100" />
        <el-table-column prop="invoice_date" :label="t('finance.invoice.invoiceDate')" min-width="120" />
        <el-table-column :label="t('finance.invoice.operation')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">{{ t('finance.invoice.view') }}</el-button>
              <el-button type="primary" link @click="openForm(row)">{{ t('finance.invoice.edit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? t('finance.invoice.reconciled') : t('finance.invoice.reconcile') }}</el-button>
              <el-button type="danger" link :disabled="row.status === 1" :title="row.status === 1 ? t('finance.invoice.deleteAuditedTip') : ''" @click="handleDelete(row.id)">{{ t('finance.invoice.delete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="t('finance.invoice.customerName')" prop="customer_name">
          <el-input v-model="form.customer_name" :placeholder="t('finance.invoice.customerNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('finance.invoice.invoiceNo')" prop="invoice_no">
          <el-input v-model="form.invoice_no" :placeholder="t('finance.invoice.invoiceNoPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('finance.invoice.amountLabel')" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="t('finance.invoice.invoiceType')" prop="invoice_type">
          <el-select v-model="form.invoice_type" :placeholder="t('finance.invoice.invoiceTypePlaceholder')" style="width:100%">
            <el-option :label="t('finance.invoice.vatSpecial')" value="1" />
            <el-option :label="t('finance.invoice.vatGeneral')" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('finance.invoice.invoiceDate')" prop="invoice_date">
          <el-date-picker v-model="form.invoice_date" type="date" :placeholder="t('finance.invoice.invoiceDatePlaceholder')" value-format="YYYY-MM-DD" style="width:100%" />
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
import { useReconcile } from '@/composables/useReconcile'
import ScForm from '@/components/ScForm.vue'
import { getInvoiceList, createInvoice, updateInvoice, deleteInvoice } from '@/api/finance'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_invoice', tableRef)
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref(t('finance.invoice.formTitleAdd'))
const searchForm = reactive<any>({ invoice_no: '', customer_name: '', reconcile_filter: '' })
const reconcileFilteredApi = createFilteredApi(getInvoiceList, 'reconcile_filter')

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? t('finance.invoice.formTitleEdit') : t('finance.invoice.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    if (data.id) {
      await updateInvoice(data)
    } else {
      await createInvoice(data)
    }
    ElMessage.success(t('finance.invoice.opSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || t('finance.invoice.opFailed'))
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('finance.invoice.confirmDelete'), t('finance.invoice.confirmDeleteTitle'), { type: 'warning' })
  await deleteInvoice(id)
  ElMessage.success(t('finance.invoice.deleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
