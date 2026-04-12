<template>
  <div class="receipt-page">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getPayReceiptListWithRefund"
          del-path="/finance/PayReceipt/batchDel"
          export-file-name="付款记录" :params="searchForm"
          sort-by="pay_date" :sort-desc="true">
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
        <el-table-column label="付款对象" min-width="130">
          <template #default="{ row }">{{ getPaySupplierLabel(row) }}</template>
        </el-table-column>
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
        <el-table-column label="付款日期" width="150">
          <template #default="{ row }">{{ fmtDt(row.pay_date || row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="pay_method" label="付款方式" width="100" align="center" />
        <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleRevoke(row)">撤销付款</el-button>
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
import { getPayReceiptList, deletePayReceipt, unAuditPayReceipt } from '@/api/finance'
import http from '@/api/http'
import { applyProcureReturnsToPayReceiptRows, normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'
import { getPayReceiptSupplierLabel } from '@/utils/supplierLabel'
import { adjustFundBalance } from '@/utils/fund'
import { fmtDt } from '@/utils/date'

const router = useRouter()
const purchaseOrders = ref<any[]>([])
const supplierList = ref<any[]>([])

function getPaySupplierLabel(row: any) {
  return getPayReceiptSupplierLabel(row, purchaseOrders.value, supplierList.value)
}

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
  const settled = await Promise.allSettled([
    getPayReceiptList({ ...params, list_rows: 10000, page: 1 }),
    http.get('/procure/ProcureReturn/index', { params: { status: 1, list_rows: 1000 } }),
    http.get('/stock/PurchaseOrder/index', { params: { list_rows: 1000 } }),
    http.get('/procure/supplier/index', { params: { list_rows: 500 } }),
  ])
  const ok = (i: number) => settled[i].status === 'fulfilled' ? (settled[i] as any).value : { data: { rows: [], list: [] } }
  const [payRes, returnRes, procureRes, supRes] = settled.map((_, i) => ok(i))
  purchaseOrders.value = procureRes.data?.rows ?? []
  supplierList.value = supRes.data?.rows ?? []

  let rows: any[] = payRes.data?.rows ?? []
  const normalizedReturns = normalizeProcureReturnFinanceRows(returnRes.data?.rows ?? [])
  rows = applyProcureReturnsToPayReceiptRows(rows, normalizedReturns)

  // 后端不支持筛选字段，前端过滤
  if (params.contact_type) rows = rows.filter(r => r.contact_type === params.contact_type)
  if (params.contact_name) rows = rows.filter(r => (r.contact_name ?? '').includes(params.contact_name))
  if (params.receipt_no) rows = rows.filter(r => (r.receipt_no ?? '').includes(params.receipt_no))

  return {
    ...payRes,
    data: {
      ...(payRes.data || {}),
      rows,
      total: rows.length,
    },
  }
}

async function handleRevoke(row: any) {
  await ElMessageBox.confirm(
    `确定撤销付款单 ${row.receipt_no || row.order_sn || ''} ？\n\n将自动反审核并删除该付款单，¥${Number(row.amount || 0).toFixed(2)} 将回流至「${row.fund_name || row.account_name || '对应账户'}」，对应采购单恢复为未付款状态。`,
    '撤销付款', { type: 'warning', confirmButtonText: '确定撤销', cancelButtonText: '取消' }
  )
  try {
    await deletePayReceipt(row.id)
    if (Number(row.amount || 0) > 0) {
      try {
        await adjustFundBalance({ fundId: row.fund_id, fundName: row.fund_name || row.account_name, delta: Number(row.amount) })
      } catch { /* 回退失败不阻塞 */ }
    }
    ElMessage.success('已撤销，资金已回流，请重新付款')
    tableRef.value?.refresh()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message ?? '撤销失败')
  }
}
</script>

<style scoped>
.receipt-page { min-height: 100%; }
</style>
