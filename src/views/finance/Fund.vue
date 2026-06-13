<template>
  <div class="page-container">

    <!-- 明细模式：带 fund_id 跳转进来时直接展示该账户流水 -->
    <template v-if="detailMode">
      <div class="detail-header">
        <el-button :icon="ArrowLeft" @click="exitDetail">返回账户列表</el-button>
        <div class="detail-title">{{ viewFund?.name }} — 账户明细</div>
      </div>
      <el-card shadow="never" class="detail-meta-card">
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
      </el-card>
      <el-card shadow="never">
        <div class="detail-toolbar">
          <el-radio-group v-model="detailFilter" size="small">
            <el-radio-button value="all">全部 {{ viewDetails.length }} 笔</el-radio-button>
            <el-radio-button value="income">收入 {{ viewIncomeCount }} 笔 · ¥{{ viewIncomeTotal.toFixed(2) }}</el-radio-button>
            <el-radio-button value="expense">支出 {{ viewExpenseCount }} 笔 · ¥{{ viewExpenseTotal.toFixed(2) }}</el-radio-button>
          </el-radio-group>
        </div>
        <!-- Channel breakdown for retail fund -->
        <div v-if="isRetailDetailFund && channelStats.length" class="channel-stats-row">
          <div v-for="cs in channelStats" :key="cs.channel" class="channel-stat-item">
            <div class="channel-stat-label">{{ cs.channel }}</div>
            <div class="channel-stat-amount">¥{{ cs.total.toFixed(2) }}</div>
            <div class="channel-stat-count">{{ cs.count }} 笔</div>
          </div>
        </div>
        <el-table :data="filteredDetails" v-loading="viewLoading" border stripe style="width:100%">
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
          <el-table-column label="备注" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.remark || '—' }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <!-- 列表模式 -->
    <template v-else>
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

      <!-- 查看弹窗（直接在列表点查看时使用） -->
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
        <!-- Channel breakdown for retail fund -->
        <div v-if="isRetailDetailFund && channelStats.length" class="channel-stats-row">
          <div v-for="cs in channelStats" :key="cs.channel" class="channel-stat-item">
            <div class="channel-stat-label">{{ cs.channel }}</div>
            <div class="channel-stat-amount">¥{{ cs.total.toFixed(2) }}</div>
            <div class="channel-stat-count">{{ cs.count }} 笔</div>
          </div>
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
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
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
const route = useRoute()
const router = useRouter()

// ── 查看弹窗（列表页点查看用）──
const viewVisible = ref(false)
const viewLoading = ref(false)
const viewFund = ref<any>(null)
const viewDetails = ref<any[]>([])

// 明细模式：从外部带 fund_id 跳入时为 true，直接展示流水列表而非弹窗
const detailMode = ref(false)

const detailFilter = ref<'all' | 'income' | 'expense'>('all')
const filteredDetails = computed(() =>
  detailFilter.value === 'all' ? viewDetails.value : viewDetails.value.filter(r => r._direction === detailFilter.value)
)
const viewIncomeTotal = computed(() => viewDetails.value.filter(r => r._direction === 'income').reduce((s, r) => s + Number(r.amount || 0), 0))
const viewExpenseTotal = computed(() => viewDetails.value.filter(r => r._direction === 'expense').reduce((s, r) => s + Number(r.amount || 0), 0))
const viewIncomeCount = computed(() => viewDetails.value.filter(r => r._direction === 'income').length)
const viewExpenseCount = computed(() => viewDetails.value.filter(r => r._direction === 'expense').length)

const sourceMap: Record<string, string> = {
  customer: '客户', supplier: '供应商', other: '其他',
}

const RETAIL_CHANNELS = ['线下', '美团', '微信小店', '拼多多', '淘宝', '抖音', '小红书']
const isRetailDetailFund = computed(() => String(viewFund.value?.name || '').includes('零售'))

function extractChannel(row: any): string {
  const remark = String(row.remark || '')
  for (const ch of RETAIL_CHANNELS) {
    if (remark.includes(`[${ch}]`)) return ch
  }
  if (row._source === '零售单') return '线下'
  return '其他'
}

const channelStats = computed(() => {
  if (!isRetailDetailFund.value) return []
  const map: Record<string, { total: number; count: number }> = {}
  for (const row of viewDetails.value.filter((r: any) => r._direction === 'income')) {
    const ch = extractChannel(row)
    if (!map[ch]) map[ch] = { total: 0, count: 0 }
    map[ch].total += Number(row.amount || 0)
    map[ch].count++
  }
  return [...RETAIL_CHANNELS, '其他'].filter(ch => map[ch]).map(ch => ({ channel: ch, ...map[ch] }))
})

function typeLabel(type: any) {
  const m: Record<string, string> = { '1': '银行账户', '2': '现金', '3': '第三方' }
  return m[String(type)] || ''
}

function exitDetail() {
  detailMode.value = false
  viewFund.value = null
  viewDetails.value = []
  router.replace({ path: '/finance/fund' })
}

async function loadViewDetails(fundId: number) {
  detailFilter.value = 'all'
  viewLoading.value = true
  viewDetails.value = []
  try {
    const isRetailFund = String(viewFund.value?.name || '').includes('零售')
    const requests: Promise<any>[] = [
      getPayReceiptList({ list_rows: 2000 }),
      getCollectReceiptList({ list_rows: 2000 }),
    ]
    if (isRetailFund) requests.push(http.get('/retail/order/index', { params: { list_rows: 3000, status: 1 } }))

    const [payRes, collectRes, retailRes] = await Promise.all(requests)

    const allPayRows: any[] = payRes.data?.rows ?? []
    const filteredPayRows = allPayRows.filter((r: any) => Number(r.fund_id) === fundId)
    const missingNameRows = filteredPayRows.filter(
      (r: any) => r.contact_type === 'supplier' && !r.contact_name && r.order_sn
    )
    let snToSupplier: Record<string, string> = {}
    if (missingNameRows.length > 0) {
      try {
        const poRes = await http.get('/stock/PurchaseOrder/index', { params: { list_rows: 1000 } })
        const poRows: any[] = poRes.data?.rows ?? []
        for (const po of poRows) {
          if (po.order_sn) snToSupplier[po.order_sn] = po.supplier_name || ''
        }
      } catch {}
    }
    const payRows = filteredPayRows.map((r: any) => ({
      ...r,
      contact_name: r.contact_name || snToSupplier[r.order_sn] || '',
      _direction: 'expense',
      _source: sourceMap[r.contact_type] || r.contact_type || '',
    }))
    const collectRows = (collectRes.data?.rows ?? [])
      .filter((r: any) => Number(r.fund_id) === fundId)
      .map((r: any) => ({ ...r, _direction: 'income', _source: sourceMap[r.contact_type] || r.contact_type || '' }))

    // 零售账户：零售单 fund_id=null，按约定全部归入零售收款账户
    const retailRows = isRetailFund
      ? (retailRes?.data?.rows ?? []).map((r: any) => ({
          ...r,
          receipt_date: r.order_date || r.created_at,
          amount: Number(r.pay_amount || r.total_amount || 0),
          contact_name: r.member_name || r.customer_name || '散客',
          _direction: 'income',
          _source: '零售单',
          remark: r.remark || '',
        }))
      : []

    const all = [...payRows, ...collectRows, ...retailRows]
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

async function openView(row: any) {
  viewFund.value = row
  viewVisible.value = true
  await loadViewDetails(Number(row.id))
}

async function openFundById(fundId: number) {
  if (!fundId) return
  const res = await getFundList({ list_rows: 200, id: fundId })
  const row = (res.data?.rows ?? res.data?.list ?? []).find((r: any) => Number(r.id) === fundId)
  if (row) {
    viewFund.value = row
    detailMode.value = true
    await loadViewDetails(fundId)
  }
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑' : '新增'
  formRef.value?.open(normalizeFundRow(row))
}

function normalizeFundRow(row?: any) {
  if (!row) return row
  if (row.raw_balance === undefined) return row
  return { ...row, balance: row.raw_balance }
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
    data: { ...(fundRes.data || {}), rows: nextRows, list: nextRows },
  }
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
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

function syncRouteFundDetail() {
  const fundId = Number(route.query.fund_id || 0)
  if (fundId) {
    openFundById(fundId).catch(() => {})
  } else {
    detailMode.value = false
  }
}

onMounted(syncRouteFundDetail)
watch(() => route.query.fund_id, syncRouteFundDetail)
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
.view-header { margin-bottom: 12px; }
.view-summary { display: flex; gap: 24px; align-items: center; margin-bottom: 10px; font-size: 14px; color: #606266; }
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.detail-title {
  font-size: 18px;
  font-weight: 700;
  color: #1d1d1f;
}
.detail-meta-card {
  margin-bottom: 12px;
}
.detail-toolbar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
}
.channel-stats-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.channel-stat-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 8px 14px;
  min-width: 100px;
  text-align: center;
}
.channel-stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.channel-stat-amount {
  font-size: 16px;
  font-weight: 700;
  color: #16a34a;
}
.channel-stat-count {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 2px;
}
</style>
