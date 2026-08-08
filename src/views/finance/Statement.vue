<template>
  <div class="page-container">
    <el-card>
      <el-tabs v-model="activeTab">
      <!-- 页签一：往来单位（默认只列有欠款的），每行一个「对账」按钮 -->
      <el-tab-pane :label="t('finance.statement.tabPartners')" name="partners">
        <div class="partner-bar">
          <el-input v-model="partnerKeyword" :placeholder="t('finance.statement.partnerPlaceholder')"
              clearable style="width:200px" />
          <el-checkbox v-model="showAllPartners">{{ t('finance.statement.showAllPartners') }}</el-checkbox>
          <el-button :icon="Refresh" @click="loadPartnerBalances">{{ t('common.refresh') }}</el-button>
          <div style="flex:1" />
          <span class="partner-summary">
            {{ t('finance.statement.partnerSummary', { n: displayPartners.length }) }}
            &emsp;{{ t('finance.statement.closingRecv') }}<b class="recv">{{ money(partnerTotalRecv) }}</b>
            &emsp;{{ t('finance.statement.closingPay') }}<b class="pay">{{ money(partnerTotalPay) }}</b>
          </span>
        </div>
        <el-table :data="displayPartners" v-loading="partnerLoading" border stripe height="560">
          <el-table-column :label="t('finance.statement.partner')" min-width="200">
            <template #default="{ row }">
              <span style="font-weight:600">{{ row.customer_name || row.supplier_name }}</span>
              <el-tag v-if="row.partner_type === 'both'" size="small" type="warning" style="margin-left:6px">
                {{ t('finance.statement.typeBoth') }}
              </el-tag>
              <el-tag v-else-if="row.partner_type === 'supplier'" size="small" type="info" style="margin-left:6px">
                {{ t('finance.statement.typeSupplier') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('finance.statement.closingRecv')" width="130" align="right">
            <template #default="{ row }">
              <span :class="row.recv > 0.005 ? 'recv' : 'zero'">{{ money(row.recv) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('finance.statement.closingPay')" width="130" align="right">
            <template #default="{ row }">
              <span :class="row.pay > 0.005 ? 'pay' : 'zero'">{{ money(row.pay) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('finance.statement.netAmount')" width="140" align="right">
            <template #default="{ row }">
              <span :class="row.net >= 0 ? 'net-pos' : 'net-neg'">{{ money(row.net) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('finance.statement.lastStatement')" width="150">
            <template #default="{ row }">
              <span v-if="row.last_date">{{ row.last_date }}</span>
              <span v-else class="zero">—</span>
            </template>
          </el-table-column>
          <el-table-column :label="t('finance.statement.operation')" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openReconcile(row)">{{ t('finance.statement.btnReconcile') }}</el-button>
              <el-button type="info" link :disabled="!row.stmt_count" @click="openRecords(row)">
                {{ t('finance.statement.btnRecords') }}<span v-if="row.stmt_count">({{ row.stmt_count }})</span>
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <div style="padding:24px;color:var(--el-text-color-secondary)">
              {{ showAllPartners ? t('finance.statement.noPartners') : t('finance.statement.noDebtPartners') }}
            </div>
          </template>
        </el-table>
      </el-tab-pane>

      <!-- 页签二：已出具的对账单 -->
      <el-tab-pane :label="t('finance.statement.tabStatements')" name="statements">
      <ScTable ref="tableRef" :api-obj="getStatementList"
          del-path="/finance/Statement/batchDel"
          :export-file-name="t('finance.statement.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="t('finance.statement.statementNo')">
              <el-input v-model="searchForm.statement_no" :placeholder="t('finance.statement.statementNoPlaceholder')" clearable style="width:160px" />
            </el-form-item>
            <el-form-item :label="t('finance.statement.partner')">
              <el-select v-model="searchForm.customer_name" filterable clearable
                  :placeholder="t('finance.statement.partnerPlaceholder')" style="width:170px">
                <el-option v-for="c in partnerOptions" :key="c.id" :label="c.name" :value="c.name">
                  <span>{{ c.name }}</span>
                  <el-tag v-if="c.linked_supplier_id" size="small" type="warning" style="margin-left:8px">
                    {{ t('finance.statement.typeBoth') }}
                  </el-tag>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="t('finance.statement.status')">
              <el-select v-model="searchForm.status" clearable style="width:130px">
                <el-option v-for="(key, k) in STATEMENT_STATUS_KEY" :key="k" :label="t(`finance.statement.${key}`)" :value="Number(k)" />
              </el-select>
            </el-form-item>
          </el-form>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openGenerator()">{{ t('finance.statement.add') }}</el-button>
        </template>

        <el-table-column prop="statement_no" :label="t('finance.statement.statementNo')" min-width="150" />
        <el-table-column :label="t('finance.statement.partner')" min-width="180">
          <template #default="{ row }">
            <span>{{ row.customer_name }}</span>
            <el-tag v-if="row.partner_type === 'both'" size="small" type="warning" style="margin-left:6px">
              {{ t('finance.statement.typeBoth') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.dateRange')" min-width="190">
          <template #default="{ row }">{{ dateOnly(row.start_date) }} ~ {{ dateOnly(row.end_date) }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.openingBalance')" min-width="110" align="right">
          <template #default="{ row }">{{ money(row.opening_balance) }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.recvAmount')" min-width="110" align="right">
          <template #default="{ row }">{{ money(row.recv_amount) }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.payAmount')" min-width="110" align="right">
          <template #default="{ row }">{{ money(row.pay_amount) }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.closingRecv')" min-width="110" align="right">
          <template #default="{ row }">{{ money(row.closing_recv) }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.closingPay')" min-width="110" align="right">
          <template #default="{ row }">{{ money(row.closing_pay) }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.netAmount')" min-width="120" align="right">
          <template #default="{ row }">
            <span :class="Number(row.net_amount) >= 0 ? 'net-pos' : 'net-neg'">{{ money(row.net_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.status')" min-width="110">
          <template #default="{ row }">
            <el-tag :type="(STATEMENT_STATUS_TYPE[Number(row.status)] as any) || 'info'" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.operation')" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openDetail(row)">{{ t('finance.statement.view') }}</el-button>
            <el-button type="primary" link :disabled="isLocked(row)" @click="openGenerator(row)">{{ t('finance.statement.edit') }}</el-button>
            <el-dropdown trigger="click" @command="(cmd: any) => handleStatus(row, cmd)">
              <el-button type="warning" link>{{ t('finance.statement.status') }}<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="1" :disabled="Number(row.status) === 1">{{ t('finance.statement.send') }}</el-dropdown-item>
                  <el-dropdown-item :command="2" :disabled="Number(row.status) === 2">{{ t('finance.statement.markConfirmed') }}</el-dropdown-item>
                  <el-dropdown-item :command="3" :disabled="Number(row.status) === 3">{{ t('finance.statement.markDisputed') }}</el-dropdown-item>
                  <el-dropdown-item :command="4" :disabled="Number(row.status) === 4">{{ t('finance.statement.markSettled') }}</el-dropdown-item>
                  <el-dropdown-item :command="0" divided :disabled="Number(row.status) === 0">{{ t('finance.statement.withdraw') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="danger" link @click="handleDelete(row.id)">{{ t('finance.statement.delete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
      </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 生成 / 编辑对账单 -->
    <el-dialog v-model="genVisible" :title="genTitle" width="1080px" top="5vh" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item :label="t('finance.statement.partner')" required>
              <!-- 纯供应商没有客户档案，选择器选不到它，显示成只读 -->
              <el-input v-if="form.partner_type === 'supplier'" :model-value="form.supplier_name" disabled />
              <el-select v-else v-model="form.customer_id" filterable :placeholder="t('finance.statement.partnerPlaceholder')"
                  style="width:100%" @change="handlePartnerChange">
                <el-option v-for="c in partnerOptions" :key="c.id" :label="c.name" :value="c.id">
                  <span>{{ c.name }}</span>
                  <el-tag v-if="c.linked_supplier_id" size="small" type="warning" style="margin-left:8px">
                    {{ t('finance.statement.typeBoth') }}
                  </el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item :label="t('finance.statement.dateRange')" required>
              <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" style="width:100%"
                  :start-placeholder="t('finance.statement.startDatePlaceholder')"
                  :end-placeholder="t('finance.statement.endDatePlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label=" ">
              <el-button type="primary" :loading="generating" @click="handleGenerate">
                {{ generating ? t('finance.statement.generating') : t('finance.statement.generate') }}
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="t('finance.statement.remark')">
          <el-input v-model="form.remark" type="textarea" :rows="1" :placeholder="t('finance.statement.remarkPlaceholder')" />
        </el-form-item>
      </el-form>

      <!-- 汇总：三段式 -->
      <div v-if="lines.length" class="summary-bar">
        <div class="sum-item"><label>{{ t('finance.statement.openingBalance') }}</label><b>{{ money(summary.opening_balance) }}</b></div>
        <span class="sum-op">+</span>
        <div class="sum-item"><label>{{ t('finance.statement.recvAmount') }}</label><b class="recv">{{ money(summary.recv_amount) }}</b></div>
        <div class="sum-item"><label>{{ t('finance.statement.payAmount') }}</label><b class="pay">{{ money(summary.pay_amount) }}</b></div>
        <span class="sum-op">−</span>
        <div class="sum-item"><label>{{ t('finance.statement.collectedAmount') }}</label><b>{{ money(summary.collected_amount) }}</b></div>
        <div class="sum-item"><label>{{ t('finance.statement.paidAmount') }}</label><b>{{ money(summary.paid_amount) }}</b></div>
        <span class="sum-op">=</span>
        <div class="sum-item"><label>{{ t('finance.statement.closingRecv') }}</label><b class="recv">{{ money(summary.closing_recv) }}</b></div>
        <div class="sum-item"><label>{{ t('finance.statement.closingPay') }}</label><b class="pay">{{ money(summary.closing_pay) }}</b></div>
        <div class="sum-item net"><label>{{ t('finance.statement.netAmount') }}</label>
          <b :class="summary.net_amount >= 0 ? 'net-pos' : 'net-neg'">{{ money(summary.net_amount) }}</b>
        </div>
      </div>

      <el-table v-if="lines.length" :data="linesWithBalance" height="340" size="small" border>
        <el-table-column prop="date" :label="t('finance.statement.date')" width="105" />
        <el-table-column :label="t('finance.statement.docType')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.side === 'recv' ? 'success' : 'warning'" size="small" effect="plain">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_sn" :label="t('finance.statement.docNo')" min-width="140" />
        <el-table-column prop="summary" :label="t('finance.statement.summary')" min-width="140" show-overflow-tooltip />
        <el-table-column :label="t('finance.statement.debit')" width="105" align="right">
          <template #default="{ row }">{{ row.debit ? money(row.debit) : '' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.credit')" width="105" align="right">
          <template #default="{ row }">{{ row.credit ? money(row.credit) : '' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.offset')" width="95" align="right">
          <template #default="{ row }">{{ row.offset ? money(row.offset) : '' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.collected')" width="95" align="right">
          <template #default="{ row }">{{ row.collected ? money(row.collected) : '' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.paid')" width="95" align="right">
          <template #default="{ row }">{{ row.paid ? money(row.paid) : '' }}</template>
        </el-table-column>
        <el-table-column :label="t('finance.statement.balance')" width="110" align="right">
          <template #default="{ row }">{{ money(row.balance) }}</template>
        </el-table-column>
        <el-table-column width="50" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" link :icon="Delete" @click="lines.splice($index, 1)" />
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="generated" :description="t('finance.statement.noDetail')" :image-size="60" />

      <template #footer>
        <span v-if="lines.length" class="detail-count">{{ t('finance.statement.detailCount', { n: lines.length }) }}</span>
        <el-button @click="genVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" :disabled="!lines.length" @click="handleSave">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Delete, ArrowDown, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import http from '@/api/http'
import { fmtDt } from '@/utils/date'
import {
  getStatementList, createStatement, updateStatement, deleteStatement, confirmStatement,
} from '@/api/finance'
import { getSaleCustomerList } from '@/api/sale'
import { buildContractReceivableItems, deductSaleReturnsByCustomer } from '@/utils/receivableCalc'
import { normalizeSaleReturnFinanceRows } from '@/utils/saleReturnFinance'
import { buildSupplierPayableRows } from '@/utils/payableCalc'
import {
  buildStatement, withRunningBalance, STATEMENT_STATUS_KEY, STATEMENT_STATUS_TYPE, statementStatusKey,
  type StatementLine, type StatementSummary,
} from '@/utils/statementCalc'

const { t } = useI18n()
const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ statement_no: '', customer_name: '', status: '' })

// ── 页签一：往来单位实时余额 ────────────────────────────────────────────────
const activeTab = ref('partners')
const partnerLoading = ref(false)
const partnerRows = ref<any[]>([])
const showAllPartners = ref(false)
const partnerKeyword = ref('')

const displayPartners = computed(() => {
  const kw = partnerKeyword.value.trim()
  return partnerRows.value
    .filter(r => showAllPartners.value || r.recv > 0.005 || r.pay > 0.005)
    .filter(r => !kw || `${r.customer_name}${r.supplier_name}`.includes(kw))
    .sort((a, b) => (b.recv + b.pay) - (a.recv + a.pay))
})
const partnerTotalRecv = computed(() => displayPartners.value.reduce((s, r) => s + r.recv, 0))
const partnerTotalPay = computed(() => displayPartners.value.reduce((s, r) => s + r.pay, 0))

/**
 * 拉往来单位的当前应收/应付。
 * 铁律：应收走 receivableCalc、应付走 payableCalc，与应收账款页/应付账款页完全同口径，
 * 禁止在本页另写一套算法。
 */
async function loadPartnerBalances() {
  partnerLoading.value = true
  try {
    const settled = await Promise.allSettled([
      getSaleCustomerList({ list_rows: 500 }),
      http.get('/procure/supplier/index', { params: { list_rows: 500 } }),
      http.get('/shop/ContractOrder/index', { params: { list_rows: 3000 } }),
      http.get('/stock/SaleReturnOrder/index', { params: { list_rows: 2000 } }),
      http.get('/finance/CollectReceipt/index', { params: { list_rows: 5000 } }),
      http.get('/stock/PurchaseOrder/index', { params: { list_rows: 3000 } }),
      http.get('/finance/PayReceipt/index', { params: { list_rows: 5000 } }),
      getStatementList({ list_rows: 500 }),
    ])
    const rows = (i: number) =>
      settled[i].status === 'fulfilled' ? ((settled[i] as any).value.data?.rows ?? []) : []

    const customers = rows(0)
    const suppliers = rows(1)

    // 应收（统一口径）
    const recvByName = new Map<string, number>()
    for (const it of deductSaleReturnsByCustomer(
      buildContractReceivableItems(rows(2), rows(4)),
      normalizeSaleReturnFinanceRows(rows(3)),
    )) {
      const k = String(it.customer_name || '').trim()
      if (k) recvByName.set(k, (recvByName.get(k) ?? 0) + Number(it.un_pay_amount || 0))
    }

    // 应付（统一口径）
    const payById = new Map<number, number>()
    const payByName = new Map<string, number>()
    for (const sp of buildSupplierPayableRows(rows(5), rows(6), suppliers)) {
      const amt = Number(sp.un_pay_amount || 0)
      const id = Number(sp.supplier_id || 0)
      const nm = String(sp.supplier_name || '').trim()
      if (id) payById.set(id, (payById.get(id) ?? 0) + amt)
      if (nm) payByName.set(nm, (payByName.get(nm) ?? 0) + amt)
    }

    // 已出对账单：按往来单位统计张数和最近一次日期
    const stmtCount = new Map<string, number>()
    const stmtLast = new Map<string, string>()
    for (const st of rows(7)) {
      for (const nm of [st.customer_name, st.supplier_name]) {
        const k = String(nm || '').trim()
        if (!k) continue
        stmtCount.set(k, (stmtCount.get(k) ?? 0) + 1)
        const d = dateOnly(st.end_date)
        if (d && d > (stmtLast.get(k) ?? '')) stmtLast.set(k, d)
      }
    }

    const list: any[] = []
    const linkedSupplierIds = new Set<number>()
    for (const c of customers) {
      const name = String(c.nickname || c.name || '').trim()
      if (!name) continue
      const supId = Number(c.linked_supplier_id || 0)
      const sup = supId ? suppliers.find((x: any) => Number(x.id) === supId) : null
      if (supId) linkedSupplierIds.add(supId)
      const supName = String(sup?.name || '').trim()
      list.push({
        key: `c${c.id}`,
        customer_id: Number(c.id),
        customer_name: name,
        supplier_id: supId,
        supplier_name: supName,
        partner_type: supId ? 'both' : 'customer',
        recv: recvByName.get(name) ?? 0,
        pay: supId ? (payById.get(supId) ?? payByName.get(supName) ?? 0) : 0,
        stmt_count: stmtCount.get(name) ?? 0,
        last_date: stmtLast.get(name) ?? '',
      })
    }
    // 纯供应商（没有被任何客户关联的）：只有欠款才列，否则 50+ 个供应商会把列表刷满
    for (const sp of suppliers) {
      const id = Number(sp.id)
      if (linkedSupplierIds.has(id)) continue
      const name = String(sp.name || '').trim()
      if (!name) continue
      const pay = payById.get(id) ?? payByName.get(name) ?? 0
      if (pay <= 0.005 && !showAllPartners.value) continue
      list.push({
        key: `s${id}`,
        customer_id: 0,
        customer_name: '',
        supplier_id: id,
        supplier_name: name,
        partner_type: 'supplier',
        recv: 0,
        pay,
        stmt_count: stmtCount.get(name) ?? 0,
        last_date: stmtLast.get(name) ?? '',
      })
    }
    partnerRows.value = list.map(r => ({ ...r, net: Math.round((r.recv - r.pay) * 100) / 100 }))
  } finally {
    partnerLoading.value = false
  }
}

/** 从往来单位行直接开对账：单位已锁定，只需选区间 */
function openReconcile(p: any) {
  Object.assign(form, defaultForm())
  Object.assign(summary, emptySummary())
  lines.value = []
  generated.value = false
  form.customer_id = p.customer_id || null
  form.customer_name = p.customer_name
  form.supplier_id = Number(p.supplier_id || 0)
  form.supplier_name = p.supplier_name
  form.partner_type = p.partner_type
  // 默认区间：本年 1 月 1 日 至 今天
  const now = new Date()
  dateRange.value = [`${now.getFullYear()}-01-01`, now.toLocaleDateString('sv-SE')]
  genVisible.value = true
}

/** 查看该单位历史出过的对账单：切到第二个页签并带上筛选 */
function openRecords(p: any) {
  searchForm.customer_name = p.customer_name || p.supplier_name
  activeTab.value = 'statements'
  nextTick(() => tableRef.value?.loadData())
}

const genVisible = ref(false)
const generating = ref(false)
const generated = ref(false)
const saving = ref(false)
const partnerOptions = ref<any[]>([])
const dateRange = ref<[string, string] | null>(null)
const lines = ref<StatementLine[]>([])

const emptySummary = (): StatementSummary => ({
  opening_recv: 0, opening_pay: 0, opening_balance: 0,
  recv_amount: 0, pay_amount: 0, collected_amount: 0, paid_amount: 0,
  closing_recv: 0, closing_pay: 0, net_amount: 0,
})
const summary = reactive<StatementSummary>(emptySummary())

const defaultForm = () => ({
  id: 0,
  customer_id: null as any,
  customer_name: '',
  supplier_id: 0,
  supplier_name: '',
  partner_type: 'customer',
  remark: '',
})
const form = reactive(defaultForm())

const genTitle = computed(() =>
  form.id ? t('finance.statement.formTitleEdit') : t('finance.statement.formTitleAdd'))

const linesWithBalance = computed(() =>
  withRunningBalance(lines.value, summary.opening_recv, summary.opening_pay))

function money(v: any) {
  return Number(v || 0).toFixed(2)
}

/** 状态文案（走 i18n，中英文界面都正确） */
function statusText(status: any) {
  const key = statementStatusKey(status)
  return key ? t(key) : '-'
}

/** 只取日期部分：DATE 字段按 UTC 零点存，fmtDt 转本地时区会多出 08:00 */
function dateOnly(v: any) {
  return fmtDt(v).slice(0, 10)
}

/** 对方已确认(2)/已结清(4)的对账单锁定，不可改（与后端 edit 校验一致） */
function isLocked(row: any) {
  return [2, 4].includes(Number(row.status))
}

async function loadPartners() {
  try {
    const res = await getSaleCustomerList({ list_rows: 500 })
    const rows = res.data?.rows ?? []
    partnerOptions.value = rows.map((r: any) => ({
      id: r.id,
      name: r.nickname || r.name,
      linked_supplier_id: Number(r.linked_supplier_id || 0),
    }))
  } catch { /* ignore */ }
}

function handlePartnerChange(id: number) {
  const p = partnerOptions.value.find(c => c.id === id)
  form.customer_name = p?.name || ''
  form.supplier_id = p?.linked_supplier_id || 0
  form.partner_type = form.supplier_id ? 'both' : 'customer'
  // 换单位后原明细作废
  lines.value = []
  generated.value = false
  Object.assign(summary, emptySummary())
}

function openGenerator(row?: any) {
  Object.assign(form, defaultForm())
  Object.assign(summary, emptySummary())
  lines.value = []
  generated.value = false
  dateRange.value = null
  if (row) {
    form.id = row.id
    form.customer_id = row.customer_id
    form.customer_name = row.customer_name
    form.supplier_id = Number(row.supplier_id || 0)
    form.supplier_name = row.supplier_name || ''
    form.partner_type = row.partner_type || 'customer'
    form.remark = row.remark || ''
    dateRange.value = [dateOnly(row.start_date), dateOnly(row.end_date)]
    try {
      const d = typeof row.detail === 'string' ? JSON.parse(row.detail || '[]') : (row.detail ?? [])
      lines.value = Array.isArray(d) ? d : []
    } catch { lines.value = [] }
    Object.assign(summary, {
      opening_recv: Number(row.opening_recv ?? 0),
      opening_pay: Number(row.opening_pay ?? 0),
      opening_balance: Number(row.opening_balance || 0),
      recv_amount: Number(row.recv_amount || 0),
      pay_amount: Number(row.pay_amount || 0),
      collected_amount: Number(row.collected_amount || 0),
      paid_amount: Number(row.paid_amount || 0),
      closing_recv: Number(row.closing_recv || 0),
      closing_pay: Number(row.closing_pay || 0),
      net_amount: Number(row.net_amount || 0),
    })
    generated.value = true
  }
  genVisible.value = true
}

async function handleGenerate() {
  if (!form.customer_id && !form.supplier_id) return ElMessage.warning(t('finance.statement.partnerPlaceholder'))
  if (!dateRange.value?.[0] || !dateRange.value?.[1]) return ElMessage.warning(t('finance.statement.dateRange'))
  if (lines.value.length) {
    try {
      await ElMessageBox.confirm(t('finance.statement.regenerateTip'), t('finance.statement.confirmDeleteTitle'), { type: 'warning' })
    } catch { return }
  }

  generating.value = true
  try {
    const needSupplier = form.supplier_id > 0
    // 注意：这里必须拉全量单据，不能按日期预过滤 —— 期初余额靠区间之前的单据算出来
    const settled = await Promise.allSettled([
      http.get('/shop/ContractOrder/index', { params: { list_rows: 3000 } }),
      http.get('/stock/SaleReturnOrder/index', { params: { list_rows: 2000 } }),
      http.get('/finance/CollectReceipt/index', { params: { list_rows: 5000 } }),
      needSupplier ? http.get('/stock/PurchaseOrder/index', { params: { list_rows: 3000 } }) : Promise.resolve({ data: { rows: [] } }),
      needSupplier ? http.get('/procure/ProcureReturn/index', { params: { list_rows: 2000 } }) : Promise.resolve({ data: { rows: [] } }),
      needSupplier ? http.get('/finance/PayReceipt/index', { params: { list_rows: 5000 } }) : Promise.resolve({ data: { rows: [] } }),
      needSupplier ? http.get('/procure/supplier/index', { params: { list_rows: 500 } }) : Promise.resolve({ data: { rows: [] } }),
    ])
    const rows = (i: number) =>
      settled[i].status === 'fulfilled' ? ((settled[i] as any).value.data?.rows ?? []) : []

    if (needSupplier && !form.supplier_name) {
      const sup = rows(6).find((s: any) => Number(s.id) === form.supplier_id)
      form.supplier_name = sup?.name || ''
    }

    const result = buildStatement(
      {
        contracts: rows(0),
        saleReturns: rows(1),
        collectReceipts: rows(2),
        purchaseOrders: rows(3),
        procureReturns: rows(4),
        payReceipts: rows(5),
      },
      {
        customer_id: Number(form.customer_id || 0),
        customer_name: form.customer_name,
        supplier_id: form.supplier_id,
        supplier_name: form.supplier_name,
      },
      dateRange.value[0],
      dateRange.value[1],
    )
    lines.value = result.lines
    Object.assign(summary, result.summary)
    generated.value = true
    if (!result.lines.length) ElMessage.info(t('finance.statement.noDetail'))
  } finally {
    generating.value = false
  }
}

async function handleSave() {
  if (!lines.value.length) return
  saving.value = true
  try {
    const payload: any = {
      customer_id: form.customer_id,
      customer_name: form.customer_name,
      supplier_id: form.supplier_id,
      supplier_name: form.supplier_name,
      partner_type: form.partner_type,
      settle_mode: 'full',
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1],
      remark: form.remark,
      detail: lines.value,
      ...summary,
      // 兼容旧列：amount / total_amount 存期末净额
      amount: summary.net_amount,
    }
    if (form.id) await updateStatement({ id: form.id, ...payload })
    else await createStatement(payload)
    ElMessage.success(t('finance.statement.opSuccess'))
    genVisible.value = false
    tableRef.value?.refresh()
    loadPartnerBalances()
  } catch (e: any) {
    ElMessage.error(e?.message || t('finance.statement.opFailed'))
  } finally {
    saving.value = false
  }
}

async function handleStatus(row: any, status: number) {
  let remark = ''
  if (status === 2 || status === 3) {
    try {
      const r = await ElMessageBox.prompt(
        t('finance.statement.confirmRemarkPlaceholder'),
        t('finance.statement.confirmRemark'),
        { inputValue: row.confirm_remark || '', inputType: 'textarea' },
      )
      remark = r.value || ''
    } catch { return }
  }
  try {
    await confirmStatement(row.id, status, remark)
    ElMessage.success(t('finance.statement.opSuccess'))
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || t('finance.statement.opFailed'))
  }
}

function openDetail(row: any) {
  router.push({ name: 'FinanceStatementDetail', params: { id: row.id } })
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('finance.statement.confirmDelete'), t('finance.statement.confirmDeleteTitle'), { type: 'warning' })
  await deleteStatement(id)
  ElMessage.success(t('finance.statement.deleteSuccess'))
  tableRef.value?.refresh()
}

onMounted(() => { loadPartners(); loadPartnerBalances() })
</script>

<style scoped>
.summary-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}
.sum-item { display: flex; flex-direction: column; min-width: 84px; }
.sum-item label { font-size: 12px; color: var(--el-text-color-secondary); }
.sum-item b { font-size: 15px; font-variant-numeric: tabular-nums; }
.sum-item.net { margin-left: auto; }
.sum-op { color: var(--el-text-color-secondary); font-size: 14px; padding: 0 2px; }
.recv { color: var(--el-color-success); }
.pay { color: var(--el-color-warning); }
.net-pos { color: var(--el-color-success); font-weight: 600; }
.net-neg { color: var(--el-color-danger); font-weight: 600; }
.partner-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.partner-summary { font-size: 13px; color: var(--el-text-color-secondary); }
.partner-summary b { font-variant-numeric: tabular-nums; margin-left: 2px; }
.zero { color: var(--el-text-color-placeholder); }
.detail-count { float: left; line-height: 32px; color: var(--el-text-color-secondary); font-size: 13px; }
</style>
