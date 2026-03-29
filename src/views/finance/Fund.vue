<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getFundListWithRefund"
          del-path="/finance/Fund/batchDel"
          export-file-name="资金账户" :params="searchForm"
          :export-columns="{ name: '账户名称', type_name: '账户类型', refund_amount: '采购退货退款', balance: '余额', remark: '备注' }">
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
        <el-table-column label="采购退货退款" min-width="120" align="right">
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
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <!-- 查看弹窗：账户信息 + 收支明细 -->
    <el-dialog v-model="viewVisible" :title="`${viewFund?.name || ''} — 账户明细`" width="900px" destroy-on-close>
      <div class="view-header">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="账户名称">{{ viewFund?.name }}</el-descriptions-item>
          <el-descriptions-item label="账户类型">{{ viewFund?.type_name || typeLabel(viewFund?.type) }}</el-descriptions-item>
          <el-descriptions-item label="余额">
            <span :style="{ fontWeight: 600, color: Number(viewFund?.display_balance ?? viewFund?.balance ?? 0) < 0 ? '#dc2626' : '#16a34a' }">
              ¥{{ Number(viewFund?.display_balance ?? viewFund?.balance ?? 0).toFixed(2) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ viewFund?.remark || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="view-summary">
        <span>收入合计：<b style="color:#16a34a">¥{{ viewIncomeTotal.toFixed(2) }}</b></span>
        <span>支出合计：<b style="color:#dc2626">¥{{ viewExpenseTotal.toFixed(2) }}</b></span>
        <span>共 <b>{{ viewDetails.length }}</b> 笔</span>
      </div>

      <el-table :data="viewDetails" v-loading="viewLoading" border stripe size="small" max-height="400" style="width:100%">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row._direction === 'income' ? 'success' : 'danger'" size="small">
              {{ row._direction === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日期" width="150">
          <template #default="{ row }">{{ fmtDt(row.receipt_date || row.pay_date || row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="对方单位" min-width="130">
          <template #default="{ row }">{{ row.contact_name || row.customer_name || row.supplier_name || '—' }}</template>
        </el-table-column>
        <el-table-column label="来源" width="90">
          <template #default="{ row }">{{ row._source || '—' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="right">
          <template #default="{ row }">
            <span :style="{ fontWeight: 600, color: row._direction === 'income' ? '#16a34a' : '#dc2626' }">
              {{ row._direction === 'income' ? '+' : '-' }}¥{{ Number(row.amount || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="160" :show-overflow-tooltip="{ appendTo: 'body' }">
          <template #default="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import http from '@/api/http'
import { getFundList, createFund, updateFund, deleteFund, getPayReceiptList, getCollectReceiptList } from '@/api/finance'
import { applyProcureReturnsToFundRows, normalizeProcureReturnFinanceRows } from '@/utils/procureReturnFinance'
import { fmtDt } from '@/utils/date'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增')
const searchForm = reactive<any>({ name: '' })

// ── 查看弹窗 ──
const viewVisible = ref(false)
const viewLoading = ref(false)
const viewFund = ref<any>(null)
const viewDetails = ref<any[]>([])

const viewIncomeTotal = computed(() => viewDetails.value.filter(r => r._direction === 'income').reduce((s, r) => s + Number(r.amount || 0), 0))
const viewExpenseTotal = computed(() => viewDetails.value.filter(r => r._direction === 'expense').reduce((s, r) => s + Number(r.amount || 0), 0))

const sourceMap: Record<string, string> = {
  customer: '客户', supplier: '供应商', other: '其他',
}

function typeLabel(type: any) {
  const m: Record<string, string> = { '1': '银行账户', '2': '现金', '3': '第三方' }
  return m[String(type)] || ''
}

async function openView(row: any) {
  viewFund.value = row
  viewVisible.value = true
  viewLoading.value = true
  viewDetails.value = []
  try {
    const fundId = Number(row.id)
    const [payRes, collectRes] = await Promise.all([
      getPayReceiptList({ list_rows: 2000 }),
      getCollectReceiptList({ list_rows: 2000 }),
    ])
    const payRows = (payRes.data?.rows ?? [])
      .filter((r: any) => Number(r.fund_id) === fundId)
      .map((r: any) => ({ ...r, _direction: 'expense', _source: sourceMap[r.contact_type] || r.contact_type || '' }))
    const collectRows = (collectRes.data?.rows ?? [])
      .filter((r: any) => Number(r.fund_id) === fundId)
      .map((r: any) => ({ ...r, _direction: 'income', _source: sourceMap[r.contact_type] || r.contact_type || '' }))
    const all = [...payRows, ...collectRows]
    all.sort((a, b) => {
      const da = a.receipt_date || a.pay_date || a.create_time || ''
      const db = b.receipt_date || b.pay_date || b.create_time || ''
      return db.localeCompare(da)
    })
    viewDetails.value = all
  } finally {
    viewLoading.value = false
  }
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
    // 只传后端需要的字段，过滤掉前端计算字段（raw_balance, display_balance, refund_amount 等）
    const payload: any = { name: data.name, type: data.type, balance: data.balance, remark: data.remark }
    if (data.id) {
      payload.id = data.id
      await updateFund(payload)
    } else {
      await createFund(payload)
    }
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(row: any) {
  // 检查是否有关联的收支记录
  const fundId = Number(row.id)
  const [payRes, collectRes] = await Promise.all([
    getPayReceiptList({ list_rows: 2000 }),
    getCollectReceiptList({ list_rows: 2000 }),
  ])
  const payCount = (payRes.data?.rows ?? []).filter((r: any) => Number(r.fund_id) === fundId).length
  const collectCount = (collectRes.data?.rows ?? []).filter((r: any) => Number(r.fund_id) === fundId).length
  const total = payCount + collectCount

  if (total > 0) {
    ElMessage.warning(`该账户下有 ${total} 笔收支记录（${payCount}笔支出、${collectCount}笔收入），无法删除。请先清空关联记录`)
    return
  }

  await ElMessageBox.confirm(`确定删除账户"${row.name}"？`, '提示', { type: 'warning' })
  await deleteFund(row.id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
.view-header { margin-bottom: 12px; }
.view-summary { display: flex; gap: 24px; align-items: center; margin-bottom: 10px; font-size: 14px; color: #606266; }
</style>
