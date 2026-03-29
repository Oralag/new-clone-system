<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getOtherExpenseList"
          :import-api="importRow"
          export-file-name="其他支出" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="编号">
              <el-input v-model="searchForm.keyword" placeholder="请输入编号" clearable style="width:160px" />
            </el-form-item>
            <el-form-item label="收款单位">
              <el-input v-model="searchForm.contact" placeholder="请输入收款单位" clearable style="width:160px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
          <span class="toolbar-summary">总笔数：<b>{{ summaryCount }}</b>&emsp;总金额：<b style="color:#dc2626">{{ summaryTotal }}</b></span>
        </template>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="编号" min-width="140">
          <template #default="{ row }">{{ row.receipt_no || row.order_sn || row.order_no || '—' }}</template>
        </el-table-column>
        <el-table-column label="单据日期" min-width="150">
          <template #default="{ row }">{{ fmtDt(row.pay_date || row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="收款单位" min-width="160">
          <template #default="{ row }">{{ row.contact_name || '—' }}</template>
        </el-table-column>
        <el-table-column label="支出类型" min-width="110">
          <template #default="{ row }">{{ row.pay_type_name || row.remark_type || '—' }}</template>
        </el-table-column>
        <el-table-column label="结算账户" min-width="140">
          <template #default="{ row }">{{ row.fund_name || '—' }}</template>
        </el-table-column>
        <el-table-column label="收款金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="font-weight:600">{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" min-width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : 'info'" size="small" style="cursor:pointer" @click="handleAudit(row)">
              {{ Number(row.status) === 1 ? '已审核' : '未审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openView(row)">查看</el-button>
            <el-button v-if="Number(row.status) === 1" type="warning" link @click="handleAudit(row)">反审核</el-button>
            <el-button v-else type="success" link @click="handleAudit(row)">审核</el-button>
            <el-button type="danger" link :disabled="Number(row.status) === 1" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 新增弹窗 -->
    <el-dialog v-model="formVisible" title="新增其他支出" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="fd" label-width="90px" :rules="rules">
        <el-form-item label="单据日期" prop="pay_date">
          <el-date-picker v-model="fd.pay_date" type="date" value-format="YYYY-MM-DD" placeholder="请选择日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="收款单位" prop="contact_name">
          <el-input v-model="fd.contact_name" placeholder="如：某某商行、张三" />
        </el-form-item>
        <el-form-item label="支出类型" prop="pay_type_name">
          <el-input v-model="fd.pay_type_name" placeholder="如：店面、劳务费、包装支出" />
        </el-form-item>
        <el-form-item label="结算账户" prop="fund_id">
          <el-select v-model="fd.fund_id" filterable placeholder="请选择账户" style="width:100%" @change="onFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款金额" prop="amount">
          <el-input-number v-model="fd.amount" :min="0.01" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="fd.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看弹窗 -->
    <el-dialog v-model="viewVisible" title="查看其他支出" width="520px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="编号">{{ viewRow?.receipt_no || viewRow?.order_sn || '—' }}</el-descriptions-item>
        <el-descriptions-item label="单据日期">{{ fmtDt(viewRow?.pay_date) }}</el-descriptions-item>
        <el-descriptions-item label="收款单位">{{ viewRow?.contact_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="支出类型">{{ viewRow?.pay_type_name || viewRow?.remark_type || '—' }}</el-descriptions-item>
        <el-descriptions-item label="结算账户">{{ viewRow?.fund_name || '—' }}</el-descriptions-item>
        <el-descriptions-item label="收款金额">¥{{ Number(viewRow?.amount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ Number(viewRow?.status) === 1 ? '已审核' : '未审核' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ viewRow?.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import http from '@/api/http'
import { getPayReceiptList, createPayReceipt, deletePayReceipt, getFundList, createFund, updateFund } from '@/api/finance'
import { fmtDt } from '@/utils/date'

const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<FormInstance>()
const formVisible = ref(false)
const submitting = ref(false)
const viewVisible = ref(false)
const viewRow = ref<any>(null)
const fundOptions = ref<any[]>([])

const searchForm = reactive<any>({ keyword: '', contact: '' })

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

const rules: FormRules = {
  pay_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  contact_name: [{ required: true, message: '请输入收款单位', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  fund_id: [{ required: true, message: '请选择结算账户', trigger: 'change' }],
}

// 统计
const allRows = ref<any[]>([])
const summaryCount = computed(() => allRows.value.length)
const summaryTotal = computed(() => allRows.value.reduce((s, r) => s + Number(r.amount || 0), 0).toFixed(2))

async function getOtherExpenseList(params?: any) {
  const safeParams = { ...(params || {}), list_rows: 2000, page: 1 }
  const keyword = String(safeParams.keyword || '').trim()
  const contact = String(safeParams.contact || '').trim()
  delete safeParams.keyword
  delete safeParams.contact
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
  allRows.value = rows
  return { ...res, data: { ...(res.data || {}), rows, total: rows.length } }
}

function resetSearch() {
  Object.assign(searchForm, { keyword: '', contact: '' })
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
  const action = isAudited ? '反审核' : '审核'
  await ElMessageBox.confirm(`确定${action}该支出记录？`, '提示', { type: 'warning' })
  await http.post('/finance/PayReceipt/edit', { id: row.id, status: isAudited ? 0 : 1 })
  ElMessage.success(`${action}成功`)
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
    ElMessage.success('新增成功')
    formVisible.value = false
    tableRef.value?.refresh()
    loadFunds()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: any) {
  if (Number(row.status) === 1) {
    ElMessage.warning('请先反审核再删除')
    return
  }
  await ElMessageBox.confirm(`确定删除"${row.contact_name || ''}"的支出记录？`, '提示', { type: 'warning' })
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
  ElMessage.success('删除成功')
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
  const n = name.toLowerCase()
  return fundOptions.value.find((f: any) => String(f.name || '').toLowerCase() === n)
    || fundOptions.value.find((f: any) => String(f.name || '').toLowerCase().includes(n) || n.includes(String(f.name || '').toLowerCase()))
    || null
}

async function matchOrCreateFund(name: string) {
  if (!name) return fundOptions.value[0] || null
  const existing = matchFund(name)
  if (existing) return existing
  // 自动创建新账户
  await createFund({ name, balance: 0, type: 1, status: 1 })
  // 重新加载账户列表拿到新ID
  const res = await getFundList({ list_rows: 200 })
  fundOptions.value = (res.data?.rows ?? res.data?.list ?? []).filter((f: any) => f.status === 1 || f.status === '1')
  return matchFund(name) || fundOptions.value[0] || null
}

let _colCache: ReturnType<typeof guessColumns> | null = null

async function importRow(row: any) {
  if (!_colCache) _colCache = guessColumns(row)
  const g = _colCache
  const contactName = (g.nameCol ? String(row[g.nameCol] || '').trim() : '') || resolveField(row, '收支类型', '支出说明', '说明', '摘要', '用途', '项目', '名称', '费用', '内容', '收款单位', '付款单位', 'contact_name', 'name', 'description')
  const rawAmount = g.amountCol ? row[g.amountCol] : resolveField(row, '收款金额', '金额', '支出金额', '付款金额', 'amount', 'money')
  const amount = Number(String(rawAmount).replace(/[,，¥￥]/g, '')) || 0
  if (amount <= 0) throw new Error('金额无效')
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
