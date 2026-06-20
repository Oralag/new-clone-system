<template>
  <div class="receivable-page">
    <!-- 顶部汇总 -->
    <div :class="['summary-bar', isMobile ? 'summary-bar--mobile' : '']">
      <span class="summary-item">{{ $t('finance.receivable.summaryTotal') }}：<strong class="blue">{{ fmt(summaryTotal) }}</strong></span>
      <span class="summary-item">{{ $t('finance.receivable.summaryPaid') }}：<strong class="green">{{ fmt(summaryPaid) }}</strong></span>
      <span class="summary-item">{{ $t('finance.receivable.summaryReturn') }}：<strong class="orange">{{ fmt(summaryReturn) }}</strong></span>
      <span class="summary-item">{{ $t('finance.receivable.summaryUnpaid') }}：<strong class="red">{{ fmt(summaryUnpaid) }}</strong></span>
    </div>

    <el-card class="table-card" data-guide-id="guide-receivable-card">
      <div class="toolbar">
        <div class="search-area">
          <el-input v-model="searchForm.customer_name" :placeholder="$t('finance.receivable.searchCustomerPlaceholder')" clearable style="width:180px" />
          <el-input v-model="searchForm.order_sn" :placeholder="$t('finance.receivable.searchOrderSnPlaceholder')" clearable style="width:180px" />
          <el-date-picker v-model="searchForm.date_from" type="date" :placeholder="$t('finance.receivable.searchDateFrom')" value-format="YYYY-MM-DD" style="width:140px" />
          <span style="color:rgba(29,29,31,0.35)">{{ $t('finance.receivable.searchDateSeparator') }}</span>
          <el-date-picker v-model="searchForm.date_to" type="date" :placeholder="$t('finance.receivable.searchDateTo')" value-format="YYYY-MM-DD" style="width:140px" />
          <el-button type="primary" :icon="Search" @click="load">{{ $t('finance.receivable.btnSearch') }}</el-button>
          <el-button :icon="Refresh" @click="resetSearch">{{ $t('finance.receivable.btnReset') }}</el-button>
        </div>
      </div>

      <!-- 手机端：卡片列表 -->
      <div v-if="isMobile" v-loading="loading" class="mobile-rec-list">
        <div v-if="!displayRows.length" class="mobile-rec-empty">{{ $t('finance.receivable.mobileNoData') }}</div>
        <div v-for="row in displayRows" :key="row.customer_name" class="mobile-rec-card">
          <div class="mrc-top">
            <span class="mrc-name">{{ row.customer_name || '—' }}</span>
            <span class="mrc-unpaid" :style="{ color: row.un_pay_amount > 0 ? '#dc2626' : '#16a34a' }">
              {{ $t('finance.receivable.mobileDebt') }} ¥{{ fmt(row.un_pay_amount) }}
            </span>
          </div>
          <div class="mrc-row">
            <span class="mrc-label">{{ $t('finance.receivable.mobileReceivable') }}</span><span class="mrc-val blue">¥{{ fmt(row.total_amount) }}</span>
            <span class="mrc-label">{{ $t('finance.receivable.mobilePaid') }}</span><span class="mrc-val green">¥{{ fmt(row.paid_amount) }}</span>
            <span class="mrc-label">{{ $t('finance.receivable.mobileOrderCount') }}</span><span class="mrc-val">{{ row.orders.length }}</span>
          </div>
          <div class="mrc-actions">
            <el-button size="small" @click="openDetail(row)">{{ $t('finance.receivable.mobileBtnDetail') }}</el-button>
            <el-button size="small" type="primary" @click="openCollect(row)">{{ $t('finance.receivable.mobileBtnCollect') }}</el-button>
          </div>
        </div>
        <div class="mobile-rec-total">{{ $t('finance.receivable.mobileSummaryText', { total }) }} ¥{{ fmt(summaryUnpaid) }}</div>
      </div>

      <!-- PC端：表格（按客户聚合，一客户一行） -->
      <el-table v-else :data="displayRows" v-loading="loading" border stripe style="width:100%" size="default">
        <el-table-column type="index" :label="$t('finance.receivable.colIndex')" width="60" align="center" />
        <el-table-column prop="customer_name" :label="$t('finance.receivable.colCustomer')" min-width="150" />
        <el-table-column :label="$t('finance.receivable.colOrderCount')" width="90" align="center">
          <template #default="{ row }">{{ row.orders.length }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.colTotalAmount')" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.colPaidAmount')" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a">¥{{ fmt(row.paid_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.colReturnAmount')" min-width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.return_amount > 0 ? '#f97316' : 'rgba(29,29,31,0.25)', fontWeight: '600' }">
              ¥{{ fmt(row.return_amount || 0) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.colUnpaidAmount')" min-width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.un_pay_amount > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }">
              ¥{{ fmt(row.un_pay_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.colActions')" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">{{ $t('finance.receivable.btnDetail') }}</el-button>
            <el-button type="success" link size="small" @click="openCollect(row)">{{ $t('finance.receivable.btnCollect') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap" v-if="!isMobile">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="(s: number) => { pageSize = s; page = 1 }"
          @current-change="(p: number) => { page = p }"
        />
      </div>
    </el-card>

    <!-- 欠款详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="`${detailCustomer?.customer_name} · ${$t('finance.receivable.btnDetail')}`" width="820px" destroy-on-close>
      <div class="detail-summary">
        <span>{{ $t('finance.receivable.detailSummaryTotal') }}：<strong class="blue">¥{{ fmt(detailCustomer?.total_amount) }}</strong></span>
        <span>{{ $t('finance.receivable.detailSummaryPaid') }}：<strong class="green">¥{{ fmt(detailCustomer?.paid_amount) }}</strong></span>
        <span>{{ $t('finance.receivable.detailSummaryUnpaid') }}：<strong class="red">¥{{ fmt(detailCustomer?.un_pay_amount) }}</strong></span>
      </div>
      <el-table :data="detailCustomer?.orders ?? []" border stripe size="small" style="width:100%">
        <el-table-column type="index" :label="$t('finance.receivable.detailColIndex')" width="55" align="center" />
        <el-table-column prop="source" :label="$t('finance.receivable.detailColSource')" width="90" />
        <el-table-column :label="$t('finance.receivable.detailColOrderNo')" min-width="160">
          <template #default="{ row }">{{ row.order_sn || row.order_no || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.detailColTotalAmount')" min-width="110" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.detailColPaidAmount')" min-width="110" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a">¥{{ fmt(row.paid_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.detailColUnpaidAmount')" min-width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.un_pay_amount > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }">
              ¥{{ fmt(row.un_pay_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.detailColDate')" min-width="145">
          <template #default="{ row }">{{ fmtDt(row.out_date) }}</template>
        </el-table-column>
        <el-table-column :label="$t('finance.receivable.detailColActions')" width="80" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="router.push(row.source === '样品单' ? '/sale/sample' : '/sale/out')">{{ $t('finance.receivable.detailBtnViewOrder') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">{{ $t('finance.receivable.detailBtnClose') }}</el-button>
        <el-button type="primary" @click="detailVisible = false; openCollect(detailCustomer)">{{ $t('finance.receivable.detailBtnCollect') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增收款单抽屉 -->
    <el-drawer v-model="collectVisible" :title="$t('finance.receivable.drawerTitle')" size="520px" destroy-on-close>
      <el-form ref="formRef" :model="fd" label-width="90px" style="padding:0 8px">
        <el-form-item :label="$t('finance.receivable.formContact')" prop="contact_id" :rules="[{ required: true, message: $t('finance.receivable.ruleContactRequired') }]">
          <div style="display:flex;gap:6px;width:100%">
            <el-select v-model="fd.contact_id" :placeholder="$t('finance.receivable.formContact')" filterable style="flex:1" @change="onContactChange">
              <el-option v-for="c in contactOptions" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item :label="$t('finance.receivable.formCurrentDebt')">
          <el-input :model-value="fmt(fd.un_pay_amount)" readonly />
        </el-form-item>
        <el-form-item :label="$t('finance.receivable.formAmount')" prop="amount" :rules="[{ required: true, message: $t('finance.receivable.ruleAmountRequired') }]">
          <el-input-number v-model="fd.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.receivable.formFundAccount')" prop="fund_id" :rules="[{ required: true, message: $t('finance.receivable.ruleFundRequired') }]">
          <div style="display:flex;gap:4px;width:100%">
            <el-select v-model="fd.fund_id" :placeholder="$t('finance.receivable.formFundPlaceholder')" style="flex:1" @change="onFundChange">
              <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
            <el-button :icon="Plus" @click="openAddFund" />
          </div>
        </el-form-item>
        <el-form-item :label="$t('finance.receivable.formDate')" prop="receipt_date">
          <el-date-picker v-model="fd.receipt_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.receivable.formRemark')" prop="remark">
          <el-input v-model="fd.remark" type="textarea" :rows="3" :placeholder="$t('finance.receivable.formRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="collectVisible = false">{{ $t('finance.receivable.drawerBtnCancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('finance.receivable.drawerBtnSave') }}</el-button>
      </template>
    </el-drawer>

    <!-- 新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" :title="$t('finance.receivable.addFundTitle')" width="360px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item :label="$t('finance.receivable.addFundName')">
          <el-input v-model="fundForm.name" :placeholder="$t('finance.receivable.addFundNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('finance.receivable.addFundBalance')">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">{{ $t('finance.receivable.addFundBtnCancel') }}</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">{{ $t('finance.receivable.addFundBtnConfirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'
import { fmtDt } from '@/utils/date'
import { createCollectReceipt, getFundList, createFund } from '@/api/finance'
import { getSaleCustomerList } from '@/api/sale'
import { adjustFundBalance } from '@/utils/fund'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'
import { calcSaleContractReceivable } from '@/utils/saleContractAmount'

const { t } = useI18n()
const router = useRouter()
const loading = ref(false)
const allRows = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const searchForm = reactive({ customer_name: '', order_sn: '', date_from: '', date_to: '' })
const isMobile = ref(window.innerWidth < 768)

const detailVisible = ref(false)
const detailCustomer = ref<any>(null)

const collectVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const contactOptions = ref<any[]>([])
const fundOptions = ref<any[]>([])
const addFundVisible = ref(false)
const addFundLoading = ref(false)
const fundForm = reactive({ name: '', balance: 0 })

const defaultFd = () => ({
  contact_id: null as any,
  contact_name: '',
  un_pay_amount: 0,
  amount: 0,
  fund_id: null as any,
  fund_name: '',
  receipt_date: new Date().toLocaleDateString('sv-SE'),
  remark: '',
})
const fd = reactive(defaultFd())

function fmt(v: any) {
  return Number(v || 0).toFixed(2)
}

// 按客户聚合（直接用每笔合同的 paid_amount/un_pay_amount）
const groupedRows = computed(() => {
  const map = new Map<string, any>()
  for (const r of allRows.value) {
    const key = r.customer_name || '未知客户'
    if (!map.has(key)) {
      map.set(key, {
        customer_name: key,
        customer_id: r.customer_id || null,
        total_amount: 0,
        paid_amount: 0,
        return_amount: 0,
        un_pay_amount: 0,
        orders: [],
        _returnAdded: false,
      })
    }
    const g = map.get(key)!
    g.total_amount += Number(r.total_amount || 0)
    g.paid_amount += Number(r.paid_amount || 0)
    g.un_pay_amount += Number(r.un_pay_amount || 0)
    if (!g._returnAdded && r._return_amount) { g.return_amount = r._return_amount; g._returnAdded = true }
    if (!g.customer_id && r.customer_id) g.customer_id = r.customer_id
    g.orders.push(r)
  }
  return Array.from(map.values()).map(g => ({
    ...g,
    un_pay_amount: Math.max(0, g.un_pay_amount - (g.return_amount || 0)),
  })).filter(g => g.un_pay_amount > 0)
})

const total = computed(() => groupedRows.value.length)

const displayRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return groupedRows.value.slice(start, start + pageSize.value)
})

const summaryTotal = computed(() => groupedRows.value.reduce((s, r) => s + r.total_amount, 0))
const summaryPaid = computed(() => groupedRows.value.reduce((s, r) => s + r.paid_amount, 0))
const summaryReturn = computed(() => groupedRows.value.reduce((s, r) => s + (r.return_amount || 0), 0))
const summaryUnpaid = computed(() => groupedRows.value.reduce((s, r) => s + r.un_pay_amount, 0))

function openDetail(row: any) {
  detailCustomer.value = row
  detailVisible.value = true
}

async function openCollect(row: any) {
  Object.assign(fd, defaultFd())
  fd.un_pay_amount = row?.un_pay_amount ?? 0
  fd.amount = row?.un_pay_amount ?? 0
  await loadContacts()
  if (row?.customer_id) {
    fd.contact_id = row.customer_id
    fd.contact_name = row.customer_name
  } else {
    const matched = contactOptions.value.find(c => c.name === row?.customer_name)
    if (matched) { fd.contact_id = matched.id; fd.contact_name = matched.name }
  }
  collectVisible.value = true
}

async function loadContacts() {
  try {
    const res = await getSaleCustomerList({ list_rows: 500 })
    contactOptions.value = (res.data?.rows ?? []).map((r: any) => ({ id: r.id, name: r.nickname || r.name }))
  } catch { /* ignore */ }
}

function onContactChange(id: any) {
  const c = contactOptions.value.find(x => x.id === id)
  fd.contact_name = c?.name ?? ''
  const g = groupedRows.value.find(r => r.customer_id === id || r.customer_name === fd.contact_name)
  fd.un_pay_amount = g?.un_pay_amount ?? 0
  fd.amount = g?.un_pay_amount ?? 0
}

function onFundChange(id: any) {
  const f = fundOptions.value.find(x => x.id === id)
  fd.fund_name = f?.name ?? ''
}

async function handleSave() {
  try { await formRef.value?.validate() } catch { ElMessage.warning(t('finance.receivable.msgRequiredFields')); return }
  saving.value = true
  try {
    const payload: any = {
      contact_type: 'customer',
      contact_id: fd.contact_id ?? 0,
      contact_name: fd.contact_name,
      customer_id: fd.contact_id ?? 0,
      customer_name: fd.contact_name,
      amount: fd.amount,
      fund_id: fd.fund_id ?? 0,
      fund_name: fd.fund_name,
      receipt_date: fd.receipt_date,
      remark: (fd.remark || '').trim(),
    }
    await createCollectReceipt(payload)
    // 更新资金账户余额
    if (fd.fund_id && fd.amount > 0) {
      try {
        await adjustFundBalance({ fundId: fd.fund_id, fundName: fd.fund_name, delta: fd.amount })
      } catch { /* 余额更新失败不阻断主流程 */ }
    }
    ElMessage.success(t('finance.receivable.msgCollectSuccess'))
    collectVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('finance.receivable.msgSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function loadFunds() {
  try {
    const res = await getFundList({ list_rows: 100 })
    fundOptions.value = res.data?.rows ?? res.data?.list ?? []
  } catch { /* ignore */ }
}

function openAddFund() {
  fundForm.name = ''
  fundForm.balance = 0
  addFundVisible.value = true
}

async function submitAddFund() {
  if (!fundForm.name.trim()) { ElMessage.warning(t('finance.receivable.msgAccountNameRequired')); return }
  addFundLoading.value = true
  try {
    await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success(t('finance.receivable.msgAddFundSuccess'))
    addFundVisible.value = false
    await loadFunds()
    const newFund = fundOptions.value.find(f => f.name === fundForm.name.trim())
    if (newFund) { fd.fund_id = newFund.id; fd.fund_name = newFund.name }
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('finance.receivable.msgAddFundFailed'))
  } finally {
    addFundLoading.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const params: any = { list_rows: 2000 }
    if (searchForm.customer_name) params.customer_name = searchForm.customer_name
    if (searchForm.order_sn) params.order_sn = searchForm.order_sn

    const [contractRes, receiptRes, saleReturnRes] = await Promise.allSettled([
      http.get('/shop/ContractOrder/index', { params: { ...params, list_rows: 2000 } }),
      http.get('/finance/CollectReceipt/index', { params: { list_rows: 5000 } }),
      http.get('/stock/SaleReturnOrder/index', { params: { status: 1, list_rows: 2000 } }),
    ])

    const contractRows: any[] = contractRes.status === 'fulfilled' ? (contractRes.value.data?.rows ?? []) : []
    const receipts: any[] = receiptRes.status === 'fulfilled' ? (receiptRes.value.data?.rows ?? []) : []
    const saleReturns: any[] = saleReturnRes.status === 'fulfilled' ? (saleReturnRes.value.data?.rows ?? []) : []

    // 建退货金额按客户名汇总（status=1 已审核）
    const returnAmtByCustomer = new Map<string, number>()
    for (const r of saleReturns) {
      if (Number(r.status) !== 1) continue
      const key = String(r.customer_name || '').trim()
      if (!key) continue
      const amt = Number(r.return_amount ?? r.total_amount ?? 0)
      returnAmtByCustomer.set(key, (returnAmtByCustomer.get(key) ?? 0) + amt)
    }

    // 与 Overview.vue 口径一致：status=1 已审核 + status=4 已转单（均有应收）
    // 排除线上电商平台（现收现结，不走应收账款）
    const ONLINE_CUSTOMER_IDS = new Set([63, 10, 12, 7, 8, 11])
    const audited = contractRows.filter(r => isEffectiveSaleContract(r) && !ONLINE_CUSTOMER_IDS.has(Number(r.customer_id)))
    const snToId = new Map<string, number>()
    for (const c of audited) {
      if (c.order_sn) snToId.set(String(c.order_sn), c.id)
      if (c.order_no)  snToId.set(String(c.order_no),  c.id)
    }

    const contractDirectPaid = new Map<number, number>()
    const custUnmatchedPaid = new Map<number, number>()

    for (const r of receipts) {
      if (String(r.remark || '').startsWith('[other]')) continue  // 杂项收入，跳过
      const amount = Number(r.amount || 0)
      const rSn = String(r.order_sn || '').trim()
      const custId = Number(r.customer_id || 0)
      if (rSn && snToId.has(rSn)) {
        const cid = snToId.get(rSn)!
        contractDirectPaid.set(cid, (contractDirectPaid.get(cid) ?? 0) + amount)
      } else if (custId > 0) {
        custUnmatchedPaid.set(custId, (custUnmatchedPaid.get(custId) ?? 0) + amount)
      }
    }
    const byCustomer = new Map<number, any[]>()
    for (const r of audited) {
      const custId = Number(r.customer_id || 0)
      if (custId > 0 && custUnmatchedPaid.has(custId)) {
        if (!byCustomer.has(custId)) byCustomer.set(custId, [])
        byCustomer.get(custId)!.push(r)
      }
    }
    for (const contracts of byCustomer.values()) {
      contracts.sort((a: any, b: any) =>
        new Date(a.order_date || a.created_at).getTime() - new Date(b.order_date || b.created_at).getTime()
      )
    }

    const calcAmt = (c: any): number => {
      return calcSaleContractReceivable(c)
    }

    // FIFO 分配无合同引用的收款到剩余未付合同
    const contractFifoPaid = new Map<number, number>()
    for (const [custId, contracts] of byCustomer) {
      let remaining = custUnmatchedPaid.get(custId) ?? 0
      for (const c of contracts) {
        const total = calcAmt(c)
        const directPaid = contractDirectPaid.get(c.id) ?? 0
        const leftover = Math.max(0, total - directPaid)
        const applied = Math.min(remaining, leftover)
        if (applied > 0) contractFifoPaid.set(c.id, applied)
        remaining = Math.max(0, remaining - applied)
        if (remaining <= 0) break
      }
    }

    const contractPaid = new Map<number, number>()
    for (const id of new Set([...contractDirectPaid.keys(), ...contractFifoPaid.keys()])) {
      contractPaid.set(id, (contractDirectPaid.get(id) ?? 0) + (contractFifoPaid.get(id) ?? 0))
    }

    const contractItems = audited.map((r: any) => {
      const receiptPaid = contractPaid.get(r.id)
      // 与 Contract.vue getReceivedAmount 一致：收款单有记录优先，否则用合同自身的 receive_amount
      const paid = receiptPaid !== undefined ? receiptPaid : Number(r.receive_amount || 0)
      const total = calcAmt(r)
      return {
        ...r,
        source: '销售订单',
        order_sn: r.order_sn || r.order_no || '',
        out_date: r.order_date || r.created_at,
        total_amount: total,
        paid_amount: paid,
        un_pay_amount: Math.max(0, total - paid),
        _return_amount: returnAmtByCustomer.get(String(r.customer_name || '').trim()) ?? 0,
      }
    })

    allRows.value = contractItems.filter((r: any) => {
      if (r.un_pay_amount <= 0) return false
      if (searchForm.customer_name && !String(r.customer_name || '').includes(searchForm.customer_name)) return false
      if (searchForm.order_sn && !String(r.order_sn || r.order_no || '').includes(searchForm.order_sn)) return false
      if (searchForm.date_from && fmtDt(r.out_date) < searchForm.date_from) return false
      if (searchForm.date_to && fmtDt(r.out_date) > searchForm.date_to) return false
      return true
    })
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  Object.assign(searchForm, { customer_name: '', order_sn: '', date_from: '', date_to: '' })
  page.value = 1
  load()
}

onMounted(() => { load(); loadFunds() })
</script>

<style scoped>
.receivable-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-bar {
  background: #fff;
  border-radius: 12px;
  padding: 14px 24px;
  display: flex;
  gap: 40px;
  border: 1px solid rgba(0,0,0,0.06);
  font-size: 14px;
  color: rgba(29,29,31,0.5);
}

.summary-item strong { font-size: 16px; }
.summary-item strong.blue   { color: #0071e3; }
.summary-item strong.green  { color: #16a34a; }
.summary-item strong.orange { color: #d97706; }
.summary-item strong.red    { color: #dc2626; }

.table-card { border-radius: 12px; }
.toolbar { margin-bottom: 14px; }
.search-area { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }

.detail-summary {
  display: flex;
  gap: 32px;
  padding: 10px 0 16px;
  font-size: 14px;
  color: rgba(29,29,31,0.5);
}
.detail-summary strong { font-size: 15px; }
.detail-summary strong.blue  { color: #0071e3; }
.detail-summary strong.green { color: #16a34a; }
.detail-summary strong.red   { color: #dc2626; }

.summary-bar--mobile {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px;
}
.summary-bar--mobile .summary-item { display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
.summary-bar--mobile .summary-item strong { font-size: 16px; }

.mobile-rec-list { padding: 8px 0; }
.mobile-rec-empty { text-align: center; padding: 40px; color: #c2c8d5; font-size: 14px; }
.mobile-rec-card {
  background: #fff;
  border-radius: 12px;
  margin: 8px 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.mrc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.mrc-name { font-size: 14px; font-weight: 700; color: #1d2129; }
.mrc-unpaid { font-size: 13px; font-weight: 700; }
.mrc-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; margin-bottom: 10px; }
.mrc-label { color: #86909c; }
.mrc-val { font-weight: 600; color: #1d2129; margin-right: 6px; }
.mrc-val.blue { color: #0071e3; }
.mrc-val.green { color: #16a34a; }
.mrc-actions { display: flex; gap: 8px; }
.mobile-rec-total { text-align: center; padding: 12px; font-size: 13px; color: #4e5969; font-weight: 600; }

.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
