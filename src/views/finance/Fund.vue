<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getFundListWithRefund"
          del-path="/finance/Fund/batchDel"
          export-file-name="资金账户" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="账户名称">
              <el-input v-model="searchForm.name" placeholder="请输入账户名称" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="Object.assign(searchForm, { name: '' }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>
        <el-table-column prop="name" label="账户名称" min-width="140" />
        <el-table-column prop="type_name" label="账户类型" min-width="120" />
        <el-table-column label="退货退款" min-width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: Number(row.refund_amount || 0) > 0 ? '#16a34a' : 'rgba(29,29,31,0.25)', fontWeight: 600 }">
              ¥{{ Number(row.refund_amount || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="余额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="font-weight:600">¥{{ Number(row.display_balance ?? row.balance ?? 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">查看</el-button>
              <el-button type="primary" link @click="openForm(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="账户名称" prop="name" :rules="[{ required: true, message: '请输入账户名称' }]">
          <el-input v-model="form.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="账户类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择账户类型" style="width:100%">
            <el-option label="银行账户" value="1" />
            <el-option label="现金" value="2" />
            <el-option label="第三方" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="余额" prop="balance">
          <el-input-number v-model="form.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import http from '@/api/http'
import { getFundList, createFund, updateFund, deleteFund } from '@/api/finance'
import { applyProcureReturnsToFundRows, normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增')
const searchForm = reactive<any>({ name: '' })

function openView(row?: any) {
  formRef.value?.openView(normalizeFundRow(row))
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑' : '新增'
  formRef.value?.open(normalizeFundRow(row))
}

function normalizeFundRow(row?: any) {
  if (!row) return row
  if (row.raw_balance === undefined) return row
  return {
    ...row,
    balance: row.raw_balance,
  }
}

async function getFundListWithRefund(params: any) {
  const [fundRes, returnRes] = await Promise.all([
    getFundList(params),
    http.get('/procure/ProcureReturn/index', { params: { status: 1, list_rows: 1000 } }),
  ])

  const rawRows: any[] = fundRes.data?.rows ?? fundRes.data?.list ?? []
  const fundNameMap = new Map<number, string>(rawRows.map((row: any) => [Number(row.id || 0), String(row.name || '')]))
  const normalizedReturns = normalizeProcureReturnFinanceRows(returnRes.data?.rows ?? [], fundNameMap)
  const nextRows = applyProcureReturnsToFundRows(rawRows, normalizedReturns)

  return {
    ...fundRes,
    data: {
      ...(fundRes.data || {}),
      rows: nextRows,
      list: nextRows,
    },
  }
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    if (data.id) {
      await updateFund(data)
    } else {
      await createFund(data)
    }
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await deleteFund(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
