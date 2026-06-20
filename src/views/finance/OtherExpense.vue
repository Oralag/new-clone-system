<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          :import-api="importRow"
          :export-file-name="t('finance.otherExpense.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="t('finance.otherExpense.labelNo')">
              <el-input v-model="searchForm.keyword" :placeholder="t('finance.otherExpense.placeholderNo')" clearable style="width:160px" />
            </el-form-item>
            <el-form-item :label="t('finance.otherExpense.labelPayee')">
              <el-input v-model="searchForm.contact" :placeholder="t('finance.otherExpense.placeholderPayee')" clearable style="width:160px" />
            </el-form-item>
            <el-form-item :label="t('finance.otherExpense.labelExpenseType')">
              <el-input v-model="searchForm.pay_type" :placeholder="t('finance.otherExpense.placeholderExpenseType')" clearable style="width:140px" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="t('finance.otherExpense.placeholderReconcileStatus')">
                <el-option :label="t('finance.otherExpense.optionUnreconciled')" value="unreconciled" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ t('common.query') }}</el-button>
            <el-button @click="resetSearch">{{ t('common.reset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ t('finance.otherExpense.btnAdd') }}</el-button>
          <span class="toolbar-summary">{{ t('finance.otherExpense.summaryCount') }}<b>{{ summaryCount }}</b>&emsp;{{ t('finance.otherExpense.summaryTotal') }}<b style="color:#dc2626">{{ summaryTotal }}</b></span>
        </template>
        <el-table-column type="index" :label="t('finance.otherExpense.colSeq')" width="60" align="center" />
        <el-table-column :label="t('finance.otherExpense.colNo')" min-width="140">
          <template #default="{ row }">{{ row.receipt_no || row.order_sn || row.order_no || '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.otherExpense.colDate')" min-width="150">
          <template #default="{ row }">{{ fmtDt(row.pay_date || row.create_time) }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.otherExpense.colPayee')" min-width="160">
          <template #default="{ row }">{{ row.contact_name || '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.otherExpense.colExpenseType')" min-width="110">
          <template #default="{ row }">{{ row.pay_type_name || row.remark_type || extractPayType(row.remark) || '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.otherExpense.colFundAccount')" min-width="140">
          <template #default="{ row }">{{ row.fund_name || '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.otherExpense.colAmount')" min-width="120" align="right">
          <template #default="{ row }">
            <span style="font-weight:600">{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('finance.otherExpense.colAuditStatus')" min-width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : 'info'" size="small" style="cursor:pointer" @click="handleAudit(row)">
              {{ Number(row.status) === 1 ? t('finance.otherExpense.statusAudited') : t('finance.otherExpense.statusPending') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('finance.otherExpense.colRemark')" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.otherExpense.colAction')" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openView(row)">{{ t('finance.otherExpense.btnView') }}</el-button>
            <el-button v-if="Number(row.status) === 1" type="warning" link @click="handleAudit(row)">{{ t('finance.otherExpense.btnReverseAudit') }}</el-button>
            <el-button v-else type="success" link @click="handleAudit(row)">{{ t('finance.otherExpense.btnAudit') }}</el-button>
            <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? t('finance.otherExpense.btnReconciled') : t('finance.otherExpense.btnReconcile') }}</el-button>
            <el-button type="danger" link :disabled="Number(row.status) === 1" @click="handleDelete(row)">{{ t('finance.otherExpense.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 新增弹窗 -->
    <el-dialog v-model="formVisible" :title="t('finance.otherExpense.dialogAddTitle')" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="fd" label-width="90px" :rules="rules">
        <el-form-item :label="t('finance.otherExpense.labelDocDate')" prop="pay_date">
          <el-date-picker v-model="fd.pay_date" type="date" value-format="YYYY-MM-DD" :placeholder="t('finance.otherExpense.placeholderDate')" style="width:100%" />
        </el-form-item>
        <el-form-item :label="t('finance.otherExpense.labelPayeeForm')" prop="contact_name">
          <el-input v-model="fd.contact_name" :placeholder="t('finance.otherExpense.placeholderPayeeForm')" />
        </el-form-item>
        <el-form-item :label="t('finance.otherExpense.labelExpenseTypeForm')" prop="pay_type_name">
          <el-input v-model="fd.pay_type_name" :placeholder="t('finance.otherExpense.placeholderExpenseTypeForm')" />
        </el-form-item>
        <el-form-item :label="t('finance.otherExpense.labelFundAccountForm')" prop="fund_id">
          <el-select v-model="fd.fund_id" filterable :placeholder="t('finance.otherExpense.placeholderFundAccount')" style="width:100%" @change="onFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('finance.otherExpense.labelAmountForm')" prop="amount">
          <el-input-number v-model="fd.amount" :min="0.01" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="t('finance.otherExpense.labelRemarkForm')" prop="remark">
          <el-input v-model="fd.remark" type="textarea" :rows="2" :placeholder="t('finance.otherExpense.placeholderRemark')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">{{ t('finance.otherExpense.btnCancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ t('finance.otherExpense.btnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看弹窗 -->
    <el-dialog v-model="viewVisible" :title="t('finance.otherExpense.dialogViewTitle')" width="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item :label="t('finance.otherExpense.colNo')">{{ viewRow?.receipt_no || viewRow?.order_sn || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="t('finance.otherExpense.labelDocDate')">{{ fmtDt(viewRow?.pay_date) }}</el-descriptions-item>
        <el-descriptions-item :label="t('finance.otherExpense.labelPayeeForm')">{{ viewRow?.contact_name || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="t('finance.otherExpense.labelExpenseTypeForm')">{{ viewRow?.pay_type_name || viewRow?.remark_type || extractPayType(viewRow?.remark) || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="t('finance.otherExpense.labelFundAccountForm')">{{ viewRow?.fund_name || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="t('finance.otherExpense.labelAmountForm')">¥{{ Number(viewRow?.amount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item :label="t('finance.otherExpense.colAuditStatus')">{{ Number(viewRow?.status) === 1 ? t('finance.otherExpense.statusAudited') : t('finance.otherExpense.statusPending') }}</el-descriptions-item>
        <el-descriptions-item :label="t('finance.otherExpense.labelRemarkForm')">{{ viewRow?.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewVisible = false">{{ t('finance.otherExpense.btnClose') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import http from '@/api/http'
import { getPayReceiptList, createPayReceipt, deletePayReceipt, getFundList, createFund, updateFund } from '@/api/finance'
import { fmtDt } from '@/utils/date'

const { t } = useI18n()
const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_other_expense', tableRef)
const formRef = ref<FormInstance>()
const formVisible = ref(false)
const submitting = ref(false)
const viewVisible = ref(false)
const viewRow = ref<any>(null)
const fundOptions = ref<any[]>([])

const searchForm = reactive<any>({ keyword: '', contact: '', pay_type: '', reconcile_filter: '' })
const reconcileFilteredApi = createFilteredApi(getOtherExpenseList, 'reconcile_filter')

const today = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)

const fd = reactive({
  pay_date: today(),
  contact_name: '',
  pay_type_name: '',
  amount: 0,
  fund_id: null as number | null,
  fund_name: '',
  remark: '',
})

const rules = computed<FormRules>(() => ({
  pay_date: [{ required: true, message: t('finance.otherExpense.ruleDate'), trigger: 'change' }],
  contact_name: [{ required: true, message: t('finance.otherExpense.rulePayee'), trigger: 'blur' }],
  amount: [{ required: true, message: t('finance.otherExpense.ruleAmount'), trigger: 'blur' }],
  fund_id: [{ required: true, message: t('finance.otherExpense.ruleFundAccount'), trigger: 'change' }],
}))

// 统计
const allRows = ref<any[]>([])
const summaryCount = computed(() => allRows.value.length)
const summaryTotal = computed(() => allRows.value.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2))

function extractPayType(remark?: string) {
  if (!remark) return ''
  const m = remark.match(/^\[([^\]]+)\]/)
  return m ? m[1] : ''
}

async function getOtherExpenseList(params?: any) {
  const safeParams = { ...(params || {}), list_rows: 2000, page: 1 }
  const keyword = String(safeParams.keyword || '').trim()
  const contact = String(safeParams.contact || '').trim()
  const payType = String(safeParams.pay_type || '').trim()
  delete safeParams.keyword
  delete safeParams.contact
  delete safeParams.pay_type
  const res = await getPayReceiptList(safeParams)
  let rows = res.data?.rows ?? res.data?.list ?? []
  // 前端过滤 contact_type=other
  rows = rows.filter((r: any) => r.contact_type === 'other')
  if (keyword) {
    const kw = keyword.toLowerCase()
    rows = rows.filter((r: any) =>
      String(r.receipt_no || r.order_sn || '').toLowerCase().includes(kw)
    )
  }
  if (contact) {
    const ct = contact.toLowerCase()
    rows = rows.filter((r: any) => String(r.contact_name || '').toLowerCase().includes(ct))
  }
  if (payType) {
    const pt = payType.toLowerCase()
    rows = rows.filter((r: any) => {
      const typeStr = String(r.pay_type_name || r.remark_type || extractPayType(r.remark) || '').toLowerCase()
      return typeStr.includes(pt)
    })
  }
  allRows.value = rows
  return { ...res, data: { ...(res.data || {}), rows, total: rows.length } }
}

function resetSearch() {
  Object.assign(searchForm, { keyword: '', contact: '', pay_type: '', reconcile_filter: '' })
  tableRef.value?.loadData()
}

async function loadFunds() {
  const res = await getFundList({ list_rows: 200 })
  fundOptions.value = (res.data?.rows ?? res.data?.list ?? []).filter((f: any) => f.status === 1 || f.status === '1')
}

function onFundChange(id: any) {
  const found = fundOptions.value.find((f: any) => f.id === id)
  fd.fund_name = found?.name || ''
}

function openForm() {
  fd.pay_date = today()
  fd.contact_name = ''
  fd.pay_type_name = ''
  fd.amount = 0
  fd.fund_id = null
  fd.fund_name = ''
  fd.remark = ''
  formVisible.value = true
}

function openView(row: any) {
  viewRow.value = row
  viewVisible.value = true
}

async function handleAudit(row: any) {
  const isAudited = Number(row.status) === 1
  const action = isAudited ? t('finance.otherExpense.btnReverseAudit') : t('finance.otherExpense.btnAudit')
  await ElMessageBox.confirm(t('finance.otherExpense.msgAuditConfirm', { action }), t('finance.otherExpense.msgAuditTip'), { type: 'warning' })
  await http.post('/finance/PayReceipt/edit', { id: row.id, status: isAudited ? 0 : 1 })
  ElMessage.success(t('finance.otherExpense.msgAuditSuccess', { action }))
  tableRef.value?.refresh()
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    await createPayReceipt({
      pay_date: fd.pay_date,
      contact_type: 'other',
      contact_name: fd.contact_name,
      amount: Number(fd.amount),
      fund_id: fd.fund_id,
      fund_name: fd.fund_name,
      pay_type: 'bank',
      remark: fd.remark ? `[${fd.pay_type_name || '其他'}] ${fd.remark}` : (fd.pay_type_name || ''),
    })
    // 扣减资金账户余额
    const fund = fundOptions.value.find((f: any) => f.id === fd.fund_id)
    if (fund) {
      await updateFund({
        id: fund.id,
        name: fund.name,
        balance: Number(fund.balance || 0) - Number(fd.amount),
      })
    }
    ElMessage.success(t('finance.otherExpense.msgAddSuccess'))
    formVisible.value = false
    tableRef.value?.refresh()
    loadFunds()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: any) {
  if (Number(row.status) === 1) {
    ElMessage.warning(t('finance.otherExpense.msgAuditFirst'))
    return
  }
  await ElMessageBox.confirm(t('finance.otherExpense.msgDeleteConfirm', { name: row.contact_name || '' }), t('finance.otherExpense.msgDeleteTip'), { type: 'warning' })
  await deletePayReceipt(row.id)
  // 回滚资金账户余额
  const amount = Number(row.amount || 0)
  if (row.fund_id && amount > 0) {
    const fundRes = await getFundList({ list_rows: 200 })
    const fund = (fundRes.data?.rows ?? []).find((f: any) => f.id === row.fund_id)
    if (fund) {
      await updateFund({
        id: fund.id,
        name: fund.name,
        balance: Number(fund.balance || 0) + amount,
      })
    }
  }
  ElMessage.success(t('finance.otherExpense.msgDeleteSuccess'))
  tableRef.value?.refresh()
  loadFunds()
}

onMounted(() => {
  loadFunds().catch(() => {})
})

// ── 导入：自动识别表格字段 ──────────────────────────────────────────────────────
function resolveField(row: any, ...keys: string[]): string {
  // 精确匹配
  for (const k of keys) {
    const v = row[k]
    if (v !== undefined && v !== null && String(v).trim()) return String(v).trim()
  }
  // 模糊匹配：列名包含关键词
  const colNames = Object.keys(row)
  for (const k of keys) {
    const found = colNames.find(c => c.includes(k) || k.includes(c))
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim()) return String(row[found]).trim()
  }
  return ''
}

function guessColumns(row: any) {
  const cols = Object.keys(row)
  let nameCol = '', amountCol = '', dateCol = '', remarkCol = '', fundCol = ''
  // 先按关键词匹配
  const nameKeys = ['支出说明', '说明', '摘要', '用途', '项目', '名称', '费用', '内容', '事项', '类型', '类别', '标题', '收支类型', '收款单位', '付款单位', 'contact_name', 'name', 'description', 'title', 'type']
  const amountKeys = ['金额', '支出金额', '付款金额', '收款金额', '数额', '费用金额', 'amount', 'money', 'total']
  const dateKeys = ['日期', '支出日期', '付款日期', '单据日期', '时间', 'date', 'pay_date']
  const remarkKeys = ['备注', '说明', 'remark', 'note', 'memo']
  const fundKeys = ['资金账户', '账户', '付款账户', '结算账户', '银行', 'fund_name', 'account', 'bank']

  for (const c of cols) {
    const cl = c.toLowerCase()
    if (!nameCol && nameKeys.some(k => cl.includes(k) || k.includes(cl))) nameCol = c
    if (!amountCol && amountKeys.some(k => cl.includes(k) || k.includes(cl))) amountCol = c
    if (!dateCol && dateKeys.some(k => cl.includes(k) || k.includes(cl))) dateCol = c
    if (!fundCol && fundKeys.some(k => cl.includes(k) || k.includes(cl))) fundCol = c
    if (!remarkCol && remarkKeys.some(k => cl === k)) remarkCol = c
  }

  // 智能猜测：如果没匹配到，按值类型推断
  if (!amountCol) {
    amountCol = cols.find(c => !([nameCol, dateCol, remarkCol, fundCol].includes(c)) && !isNaN(Number(row[c])) && Number(row[c]) > 0) || ''
  }
  if (!dateCol) {
    dateCol = cols.find(c => !([nameCol, amountCol, remarkCol, fundCol].includes(c)) && /\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(String(row[c]))) || ''
  }
  if (!nameCol) {
    // 第一个非数字、非日期的文本列
    nameCol = cols.find(c => !([amountCol, dateCol, remarkCol, fundCol].includes(c)) && isNaN(Number(row[c])) && String(row[c]).trim().length > 0) || ''
  }
  if (!remarkCol) {
    remarkCol = cols.find(c => !([nameCol, amountCol, dateCol, fundCol].includes(c)) && String(row[c]).trim().length > 0) || ''
  }

  return { nameCol, amountCol, dateCol, remarkCol, fundCol }
}

function matchFund(name: string) {
  if (!name) return null
  const n = name.toLowerCase().trim()
  return fundOptions.value.find((f: any) => String(f.name || '').toLowerCase().trim() === n) || null
}

async function matchOrCreateFund(name: string) {
  if (!name) return null
  const existing = matchFund(name)
  if (existing) return existing
  // 没有完全匹配的账户，自动新建
  await createFund({ name, balance: 0, fund_type: 1, status: 1 })
  const res = await getFundList({ list_rows: 200 })
  fundOptions.value = res.data?.rows ?? res.data?.list ?? []
  return matchFund(name) || null
}

let _colCache: ReturnType<typeof guessColumns> | null = null

async function importRow(row: any) {
  if (!_colCache) _colCache = guessColumns(row)
  const g = _colCache
  const contactName = (g.nameCol ? String(row[g.nameCol] || '').trim() : '') || resolveField(row, '收支类型', '支出说明', '说明', '摘要', '用途', '项目', '名称', '费用', '内容', '收款单位', '付款单位', 'contact_name', 'name', 'description')
  const rawAmount = g.amountCol ? row[g.amountCol] : resolveField(row, '收款金额', '金额', '支出金额', '付款金额', 'amount', 'money')
  const amount = Number(String(rawAmount).replace(/[,，¥￥]/g, '')) || 0
  if (amount <= 0) throw new Error(t('finance.otherExpense.msgAmountInvalid'))
  const dateStr = (g.dateCol ? String(row[g.dateCol] || '').trim() : '') || resolveField(row, '单据日期', '日期', '支出日期', '付款日期', 'date', 'pay_date') || today()
  const remark = (g.remarkCol ? String(row[g.remarkCol] || '').trim() : '') || resolveField(row, '备注', 'remark', 'note')
  const fundName = (g.fundCol ? String(row[g.fundCol] || '').trim() : '') || resolveField(row, '结算账户', '资金账户', '账户', 'fund_name', 'account')
  const fund = await matchOrCreateFund(fundName)
  // 支出说明优先用 contactName，为空则用备注
  const finalName = contactName || remark || '其他支出'
  await createPayReceipt({
    pay_date: dateStr,
    contact_type: 'other',
    contact_name: finalName,
    amount,
    fund_id: fund?.id || null,
    fund_name: fund?.name || '',
    pay_type: 'bank',
    remark: remark || contactName || '',
  })
  if (fund && amount > 0) {
    await updateFund({ id: fund.id, name: fund.name, balance: Number(fund.balance || 0) - amount })
    fund.balance = Number(fund.balance || 0) - amount
  }
}
</script>

<style scoped>
.search-actions { display: flex; gap: 8px; }
.toolbar-summary { margin-left: 16px; font-size: 14px; line-height: 32px; color: #606266; }
</style>
