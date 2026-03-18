<template>
  <div class="receipt-page">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getPayReceiptListWithRefund"
          del-path="/finance/PayReceipt/batchDel"
          export-file-name="付款记录" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.receipt_no" placeholder="付款单号" clearable style="width:160px" />
          <el-input v-model="searchForm.contact_name" placeholder="付款对象" clearable style="width:150px" />
          <el-select v-model="searchForm.contact_type" placeholder="类型" clearable style="width:110px">
            <el-option label="供应商" value="supplier" />
            <el-option label="客户" value="customer" />
            <el-option label="员工" value="staff" />
            <el-option label="其他" value="other" />
          </el-select>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="router.push('/finance/pay-receipt/new')">新增付款单</el-button>
        </template>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="receipt_no" label="付款单号" min-width="150" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTagMap[row.contact_type] ?? ''">{{ typeLabel(row.contact_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact_name" label="付款对象" min-width="130" />
        <el-table-column prop="amount" label="付款金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#dc2626;font-weight:600">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="退款金额" width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: Number(row.refund_allocated || 0) > 0 ? '#16a34a' : 'rgba(29,29,31,0.25)', fontWeight: 600 }">
              ¥{{ Number(row.refund_allocated || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="净付款" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ Number(row.net_amount ?? row.amount ?? 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="付款账户" width="130">
          <template #default="{ row }">{{ row.fund_name || row.account_name || '—' }}</template>
        </el-table-column>
        <el-table-column prop="pay_date" label="付款日期" width="110" />
        <el-table-column prop="pay_method" label="付款方式" width="100" align="center" />
        <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getPayReceiptList, deletePayReceipt } from '@/api/finance'
import http from '@/api/http'
import { applyProcureReturnsToPayReceiptRows, normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'

const router = useRouter()

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ receipt_no: '', contact_name: '', contact_type: '' })

const typeTagMap: Record<string, string> = {
  supplier: 'warning', customer: 'success', staff: 'info', other: ''
}

function typeLabel(type: string) {
  const map: Record<string, string> = { supplier: '供应商', customer: '客户', staff: '员工', other: '其他' }
  return map[type] ?? type
}

async function getPayReceiptListWithRefund(params: any) {
  const [payRes, returnRes] = await Promise.all([
    getPayReceiptList(params),
    http.get('/procure/ProcureReturn/index', { params: { status: 1, list_rows: 1000 } }),
  ])

  const rows: any[] = payRes.data?.rows ?? []
  const normalizedReturns = normalizeProcureReturnFinanceRows(returnRes.data?.rows ?? [])
  const nextRows = applyProcureReturnsToPayReceiptRows(rows, normalizedReturns)

  return {
    ...payRes,
    data: {
      ...(payRes.data || {}),
      rows: nextRows,
    },
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该付款单？', '提示', { type: 'warning' })
  await deletePayReceipt(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.receipt-page { height: 100%; }
</style>
