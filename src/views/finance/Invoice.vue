<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getInvoiceList"
          del-path="/finance/Invoice/batchDel"
          export-file-name="发票管理" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="发票号码">
              <el-input v-model="searchForm.invoice_no" placeholder="请输入发票号码" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="客户名称">
              <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="Object.assign(searchForm, { invoice_no: '', customer_name: '' }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>
        <el-table-column prop="invoice_no" label="发票号码" min-width="160" />
        <el-table-column prop="customer_name" label="客户名称" min-width="140" />
        <el-table-column prop="amount" label="金额" min-width="120" />
        <el-table-column prop="invoice_type_name" label="发票类型" min-width="120" />
        <el-table-column prop="status_tag" label="状态" min-width="100" />
        <el-table-column prop="invoice_date" label="开票日期" min-width="120" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">查看</el-button>
              <el-button type="primary" link @click="openForm(row)">编辑</el-button>
              <el-button type="danger" link :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="客户名称" prop="customer_name">
          <el-input v-model="form.customer_name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="发票号码" prop="invoice_no">
          <el-input v-model="form.invoice_no" placeholder="请输入发票号码" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="发票类型" prop="invoice_type">
          <el-select v-model="form.invoice_type" placeholder="请选择发票类型" style="width:100%">
            <el-option label="增值税专票" value="1" />
            <el-option label="普票" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="开票日期" prop="invoice_date">
          <el-date-picker v-model="form.invoice_date" type="date" placeholder="请选择开票日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getInvoiceList, createInvoice, deleteInvoice } from '@/api/finance'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增')
const searchForm = reactive<any>({ invoice_no: '', customer_name: '' })

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑' : '新增'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createInvoice(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await deleteInvoice(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
