<template>
  <div class="receivable-page">
    <!-- 顶部汇总 -->
    <div :class="['summary-bar', isMobile ? 'summary-bar--mobile' : '']">
      <span class="summary-item">应收总金额：<strong class="blue">{{ fmt(summaryTotal) }}</strong></span>
      <span class="summary-item">已收总金额：<strong class="green">{{ fmt(summaryPaid) }}</strong></span>
      <span class="summary-item">退货总金额：<strong class="orange">{{ fmt(summaryReturn) }}</strong></span>
      <span class="summary-item">待收欠款：<strong class="red">{{ fmt(summaryUnpaid) }}</strong></span>
    </div>

    <el-card class="table-card" data-guide-id="guide-receivable-card">
      <div class="toolbar">
        <div class="search-area">
          <el-input v-model="searchForm.customer_name" placeholder="客户名称" clearable style="width:180px" />
          <el-input v-model="searchForm.order_sn" placeholder="出库单号" clearable style="width:180px" />
          <el-date-picker v-model="searchForm.date_from" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width:140px" />
          <span style="color:rgba(29,29,31,0.35)">至</span>
          <el-date-picker v-model="searchForm.date_to" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" style="width:140px" />
          <el-button type="primary" :icon="Search" @click="load">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </div>
      </div>

      <!-- 手机端：卡片列表 -->
      <div v-if="isMobile" v-loading="loading" class="mobile-rec-list">
        <div v-if="!displayRows.length" class="mobile-rec-empty">暂无数据</div>
        <div v-for="row in displayRows" :key="row.customer_name" class="mobile-rec-card">
          <div class="mrc-top">
            <span class="mrc-name">{{ row.customer_name || '—' }}</span>
            <span class="mrc-unpaid" :style="{ color: row.un_pay_amount > 0 ? '#dc2626' : '#16a34a' }">
              欠款 ¥{{ fmt(row.un_pay_amount) }}
            </span>
          </div>
          <div class="mrc-row">
            <span class="mrc-label">应收</span><span class="mrc-val blue">¥{{ fmt(row.total_amount) }}</span>
            <span class="mrc-label">已收</span><span class="mrc-val green">¥{{ fmt(row.paid_amount) }}</span>
            <span class="mrc-label">单数</span><span class="mrc-val">{{ row.orders.length }}</span>
          </div>
          <div class="mrc-actions">
            <el-button size="small" @click="openDetail(row)">欠款详情</el-button>
            <el-button size="small" type="primary" @click="openCollect(row)">收款</el-button>
          </div>
        </div>
        <div class="mobile-rec-total">共 {{ total }} 位客户 · 待收合计 ¥{{ fmt(summaryUnpaid) }}</div>
      </div>

      <!-- PC端：表格（按客户聚合，一客户一行） -->
      <el-table v-else :data="displayRows" v-loading="loading" border stripe style="width:100%" size="default">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="customer_name" label="客户名称" min-width="150" />
        <el-table-column label="欠款单数" width="90" align="center">
          <template #default="{ row }">{{ row.orders.length }}</template>
        </el-table-column>
        <el-table-column label="应收金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已收金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a">¥{{ fmt(row.paid_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="退货金额" min-width="120" align="right">
          <template #default>
            <span style="color:rgba(29,29,31,0.25);font-weight:600">¥0.00</span>
          </template>
        </el-table-column>
        <el-table-column label="待收欠款" min-width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.un_pay_amount > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }">
              ¥{{ fmt(row.un_pay_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">欠款详情</el-button>
            <el-button type="success" link size="small" @click="openCollect(row)">收款</el-button>
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
    <el-dialog v-model="detailVisible" :title="`${detailCustomer?.customer_name} · 欠款详情`" width="820px" destroy-on-close>
      <div class="detail-summary">
        <span>应收合计：<strong class="blue">¥{{ fmt(detailCustomer?.total_amount) }}</strong></span>
        <span>已收合计：<strong class="green">¥{{ fmt(detailCustomer?.paid_amount) }}</strong></span>
        <span>待收欠款：<strong class="red">¥{{ fmt(detailCustomer?.un_pay_amount) }}</strong></span>
      </div>
      <el-table :data="detailCustomer?.orders ?? []" border stripe size="small" style="width:100%">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column prop="source" label="来源" width="90" />
        <el-table-column label="单据号" min-width="160">
          <template #default="{ row }">{{ row.order_sn || row.order_no || '—' }}</template>
        </el-table-column>
        <el-table-column label="应收金额" min-width="110" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已收金额" min-width="110" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a">¥{{ fmt(row.paid_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="待收欠款" min-width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.un_pay_amount > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }">
              ¥{{ fmt(row.un_pay_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="签单日期" min-width="145">
          <template #default="{ row }">{{ fmtDt(row.out_date) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="router.push(row.source === '样品单' ? '/sale/sample' : '/sale/out')">查看单据</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="detailVisible = false; openCollect(detailCustomer)">去收款</el-button>
      </template>
    </el-dialog>

    <!-- 新增收款单抽屉 -->
    <el-drawer v-model="collectVisible" title="新增收款单" size="520px" destroy-on-close>
      <el-form ref="formRef" :model="fd" label-width="90px" style="padding:0 8px">
        <el-form-item label="收款对象" prop="contact_id" :rules="[{ required: true, message: '请选择客户' }]">
          <div style="display:flex;gap:6px;width:100%">
            <el-select v-model="fd.contact_id" placeholder="请选择客户" filterable style="flex:1" @change="onContactChange">
              <el-option v-for="c in contactOptions" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="当前欠款">
          <el-input :model-value="fmt(fd.un_pay_amount)" readonly />
        </el-form-item>
        <el-form-item label="收款金额" prop="amount" :rules="[{ required: true, message: '请输入收款金额' }]">
          <el-input-number v-model="fd.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="收款账户" prop="fund_id" :rules="[{ required: true, message: '请选择收款账户' }]">
          <div style="display:flex;gap:4px;width:100%">
            <el-select v-model="fd.fund_id" placeholder="请选择账户" style="flex:1" @change="onFundChange">
              <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
            <el-button :icon="Plus" @click="openAddFund" />
          </div>
        </el-form-item>
        <el-form-item label="收款日期" prop="receipt_date">
          <el-date-picker v-model="fd.receipt_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="fd.remark" type="textarea" :rows="3" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="collectVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-drawer>

    <!-- 新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" title="新增资金账户" width="360px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item label="账户名称">
          <el-input v-model="fundForm.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="初始余额">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">取消</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">确认新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'
import { fmtDt } from '@/utils/date'
import { createCollectReceipt, getFundList, createFund } from '@/api/finance'
import { getSaleCustomerList } from '@/api/sale'
import { adjustFundBalance } from '@/utils/fund'

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
        un_pay_amount: 0,
        orders: [],
      })
    }
    const g = map.get(key)!
    g.total_amount += Number(r.total_amount || 0)
    g.paid_amount += Number(r.paid_amount || 0)
    g.un_pay_amount += Number(r.un_pay_amount || 0)
    if (!g.customer_id && r.customer_id) g.customer_id = r.customer_id
    g.orders.push(r)
  }
  return Array.from(map.values()).filter(g => g.un_pay_amount > 0)
})

const total = computed(() => groupedRows.value.length)

const displayRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return groupedRows.value.slice(start, start + pageSize.value)
})

const summaryTotal = computed(() => groupedRows.value.reduce((s, r) => s + r.total_amount, 0))
const summaryPaid = computed(() => groupedRows.value.reduce((s, r) => s + r.paid_amount, 0))
const summaryReturn = computed(() => 0)
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
  try { await formRef.value?.validate() } catch { ElMessage.warning('请填写必填项'); return }
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
    ElMessage.success('收款成功')
    collectVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
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
  if (!fundForm.name.trim()) { ElMessage.warning('请输入账户名称'); return }
  addFundLoading.value = true
  try {
    await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success('新增账户成功')
    addFundVisible.value = false
    await loadFunds()
    const newFund = fundOptions.value.find(f => f.name === fundForm.name.trim())
    if (newFund) { fd.fund_id = newFund.id; fd.fund_name = newFund.name }
  } catch (e: any) {
    ElMessage.error(e?.message ?? '新增失败')
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

    const [contractRes, receiptRes] = await Promise.allSettled([
      http.get('/shop/ContractOrder/index', { params: { ...params, status: 1 } }),
      http.get('/finance/CollectReceipt/index', { params: { list_rows: 5000 } }),
    ])

    const contractRows: any[] = contractRes.status === 'fulfilled' ? (contractRes.value.data?.rows ?? []) : []
    const receipts: any[] = receiptRes.status === 'fulfilled' ? (receiptRes.value.data?.rows ?? []) : []

    const contractIdSet = new Set(contractRows.map((r: any) => r.id))

    // 策略1：有 #contractId 的收款 → 直接匹配到指定合同
    // 策略2：无 #contractId 的收款（新方式）→ 按客户 FIFO 分配
    // 引用已删除合同的孤儿收款 → 忽略（不计入任何合同）
    const contractDirectPaid = new Map<number, number>()   // 单对单匹配
    const custUnmatchedPaid = new Map<number, number>()    // 待 FIFO 分配

    for (const r of receipts) {
      const m = String(r.remark || '').match(/#(\d+)/)
      const amount = Number(r.amount || 0)
      const custId = Number(r.customer_id || 0)
      if (m) {
        const cid = Number(m[1])
        if (contractIdSet.has(cid)) {
          contractDirectPaid.set(cid, (contractDirectPaid.get(cid) ?? 0) + amount)
        }
        // 合同已删除 → 忽略
      } else if (custId > 0) {
        custUnmatchedPaid.set(custId, (custUnmatchedPaid.get(custId) ?? 0) + amount)
      }
    }

    // 已审核合同按客户分组，日期升序
    const audited = contractRows.filter((r: any) => Number(r.status) === 1)
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

    // FIFO 分配无合同引用的收款到剩余未付合同
    const contractFifoPaid = new Map<number, number>()
    for (const [custId, contracts] of byCustomer) {
      let remaining = custUnmatchedPaid.get(custId) ?? 0
      for (const c of contracts) {
        const total = Number(c.after_discount || 0) || Number(c.total_amount || 0)
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
      const paid = contractPaid.get(r.id) ?? 0
      const total = Number(r.after_discount || 0) || Number(r.total_amount || 0)
      return {
        ...r,
        source: '销售订单',
        order_sn: r.order_sn || r.order_no || '',
        out_date: r.order_date || r.created_at,
        paid_amount: paid,
        un_pay_amount: Math.max(0, total - paid),
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
