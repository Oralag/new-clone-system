<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">{{ platformName }}{{ t('onlineOrders.ordersSuffix') }}</h2>
        <el-tag size="small" style="margin-left:10px" :color="platformColor" effect="dark">{{ platformName }}</el-tag>
      </div>
      <el-button type="primary" :icon="Plus" @click="openForm()">{{ t('onlineOrders.enterOrder') }}</el-button>
    </div>

    <!-- KPI 卡片 -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">{{ t('onlineOrders.totalOrders') }}</div>
        <div class="kpi-val blue">{{ rows.length }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ t('onlineOrders.totalRevenue') }}</div>
        <div class="kpi-val green">¥{{ fmt(totalAmount) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ t('onlineOrders.monthRevenue') }}</div>
        <div class="kpi-val blue">¥{{ fmt(monthAmount) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ t('onlineOrders.totalExpense') }}</div>
        <div class="kpi-val red">¥{{ fmt(totalExpense) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ t('onlineOrders.netIncome') }}</div>
        <div class="kpi-val" :class="netIncome >= 0 ? 'green' : 'red'">¥{{ fmt(netIncome) }}</div>
      </div>
    </div>

    <!-- 主体：左订单 + 右支出 -->
    <div class="main-columns">
      <!-- 左：筛选 + 订单列表 -->
      <div class="col-orders">
        <el-card style="margin-bottom:10px">
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <el-date-picker v-model="dateRange" type="daterange" :range-separator="t('common.to')"
              :start-placeholder="t('onlineOrders.startDate')" :end-placeholder="t('onlineOrders.endDate')"
              value-format="YYYY-MM-DD" style="width:260px" @change="currentPage=1" />
            <el-button :icon="Refresh" @click="resetFilter">{{ t('common.reset') }}</el-button>
          </div>
        </el-card>
        <el-card>
          <el-table :data="pagedRows" v-loading="loading" border size="small" style="width:100%" row-key="order_sn">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div style="padding:8px 48px 12px">
                  <el-table :data="getGoodsInfo(row)" size="small" border style="width:100%">
                    <el-table-column prop="goods_name" :label="t('onlineOrders.goodsName')" min-width="140" />
                    <el-table-column prop="unit_name" :label="t('onlineOrders.unit')" width="70" align="center" />
                    <el-table-column prop="num" :label="t('onlineOrders.quantity')" width="80" align="right" />
                    <el-table-column :label="t('onlineOrders.unitPrice')" width="100" align="right">
                      <template #default="{ row: item }">¥{{ Number(item.price).toFixed(2) }}</template>
                    </el-table-column>
                    <el-table-column :label="t('onlineOrders.subtotal')" width="100" align="right">
                      <template #default="{ row: item }">
                        <span style="color:#0071e3">¥{{ (Number(item.num) * Number(item.price)).toFixed(2) }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('onlineOrders.orderNo')" prop="order_sn" width="160" />
            <el-table-column :label="t('onlineOrders.date')" width="100">
              <template #default="{ row }">{{ fmtDate(row.order_date) }}</template>
            </el-table-column>
            <el-table-column :label="t('onlineOrders.summary')" show-overflow-tooltip>
              <template #default="{ row }">
                <span style="font-size:12px">{{ getGoodsSummary(row) || row.remark || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('onlineOrders.revenue')" align="right" width="100">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:600">¥{{ fmt(getOrderAmount(row)) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('onlineOrders.status')" align="center" width="76">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
                  {{ row.status === 1 ? t('onlineOrders.audited') : t('onlineOrders.pending') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" align="center" width="76">
              <template #default="{ row }">
                <el-button v-if="row.status !== 1" type="primary" size="small" plain
                  :loading="auditingId === row.id" @click="handleAudit(row)">{{ t('common.audit') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top:10px;display:flex;align-items:center;justify-content:space-between">
            <span style="color:rgba(29,29,31,0.5);font-size:12px">{{ t('onlineOrders.count', { count: filteredRows.length }) }}</span>
            <el-pagination v-model:current-page="currentPage" :page-size="20"
              :total="filteredRows.length" layout="prev, pager, next" background small />
          </div>
        </el-card>
      </div>

      <!-- 右：平台支出 -->
      <div class="col-expense">
        <el-card style="height:100%">
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-weight:600;font-size:14px">{{ t('onlineOrders.platformExpense') }}</span>
              <el-button type="primary" size="small" :icon="Plus" @click="openExpenseForm">{{ t('common.add') }}</el-button>
            </div>
          </template>
          <el-table :data="expenses" v-loading="expenseLoading" border size="small" style="width:100%">
            <el-table-column :label="t('onlineOrders.date')" width="90">
              <template #default="{ row }">{{ fmtDate(row.pay_date || row.created_at) }}</template>
            </el-table-column>
            <el-table-column :label="t('onlineOrders.type')" width="90">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ getExpenseType(row.contact_name || '') }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.remark')" show-overflow-tooltip>
              <template #default="{ row }">{{ (row.remark || '').replace(channelTag, '').trim() }}</template>
            </el-table-column>
            <el-table-column :label="t('onlineOrders.amount')" align="right" width="90">
              <template #default="{ row }">
                <span style="color:#dc2626;font-weight:600">¥{{ fmt(Number(row.amount)) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="" align="center" width="50">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDeleteExpense(row)">{{ t('common.delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="expenses.length" style="margin-top:10px;text-align:right;font-size:13px;color:#dc2626;font-weight:600">
            {{ t('common.total') }}：¥{{ fmt(totalExpense) }}
          </div>
        </el-card>
      </div>
    </div>

    <!-- 录入订单弹框 -->
    <el-dialog v-model="formVisible" :title="t('onlineOrders.enterOrderTitle', { platform: platformName })" width="660px" append-to-body>
      <el-form :model="formData" label-width="90px">
        <el-form-item :label="t('onlineOrders.orderDate')" required>
          <el-date-picker v-model="formData.order_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="t('onlineOrders.platformNo')">
          <el-input v-model="formData.platform_no" :placeholder="t('onlineOrders.platformNoPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('onlineOrders.goodsDetail')">
          <div style="width:100%">
            <el-table :data="formData.items" border size="small" style="width:100%;margin-bottom:8px">
              <el-table-column :label="t('onlineOrders.goods')" min-width="180">
                <template #default="{ row }">
                  <el-autocomplete v-model="row.goods_name" :fetch-suggestions="searchGoods"
                    value-key="goods_name" :placeholder="t('onlineOrders.searchGoods')" size="small" style="width:100%"
                    @select="(item: any) => onGoodsSelect(row, item)" clearable />
                </template>
              </el-table-column>
              <el-table-column :label="t('onlineOrders.quantity')" width="85">
                <template #default="{ row }">
                  <el-input-number v-model="row.num" :min="0.001" :precision="3" :controls="false" size="small" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column :label="t('onlineOrders.unitPrice')" width="90">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :min="0" :precision="2" :controls="false" size="small" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column :label="t('onlineOrders.subtotal')" width="80" align="right">
                <template #default="{ row }">
                  <span style="font-size:12px;color:#0071e3">¥{{ (Number(row.num||0)*Number(row.price||0)).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column width="44" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" size="small" :icon="Close" circle plain @click="formData.items.splice($index,1)" />
                </template>
              </el-table-column>
            </el-table>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <el-button size="small" :icon="Plus" @click="formData.items.push({goods_id:0,goods_name:'',num:1,price:0})">{{ t('onlineOrders.addGoods') }}</el-button>
              <span style="font-weight:700;color:#0071e3;font-size:14px">{{ t('common.total') }}：¥{{ itemsTotal.toFixed(2) }}</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item :label="t('common.remark')">
          <el-input v-model="formData.remark" type="textarea" :rows="2" :placeholder="t('onlineOrders.remarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 录入支出弹框 -->
    <el-dialog v-model="expenseVisible" :title="t('onlineOrders.newPlatformExpense')" width="420px" append-to-body>
      <el-form :model="expenseForm" label-width="90px">
        <el-form-item :label="t('onlineOrders.date')" required>
          <el-date-picker v-model="expenseForm.expense_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="t('onlineOrders.expenseType')" required>
          <el-select v-model="expenseForm.type" style="width:100%">
            <el-option :label="t('onlineOrders.expenseTypes.ad')" value="广告推广" />
            <el-option :label="t('onlineOrders.expenseTypes.commission')" value="平台佣金" />
            <el-option :label="t('onlineOrders.expenseTypes.refund')" value="退款损失" />
            <el-option :label="t('onlineOrders.expenseTypes.packaging')" value="包装耗材" />
            <el-option :label="t('common.all')" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('onlineOrders.expenseAccount')" required>
          <el-select v-model="expenseForm.fund_id" style="width:100%" :placeholder="t('onlineOrders.selectExpenseAccount')">
            <el-option v-for="f in fundList" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('onlineOrders.amount') + '(¥)'" required>
          <el-input-number v-model="expenseForm.amount" :precision="2" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item :label="t('common.remark')">
          <el-input v-model="expenseForm.remark" :placeholder="t('onlineOrders.expenseRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="expenseVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="expenseSaving" @click="handleSaveExpense">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Refresh, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import http from '@/api/http'
import { stockEffect } from '@/utils/stockEffect'

const route = useRoute()
const { t } = useI18n()

// ── 平台配置（从路由 meta 读取）──
const platformName = computed(() => String(route.meta?.platformName || t('onlineOrders.online')))
const customerId = computed(() => Number(route.meta?.customerId || 0))
const customerName = computed(() => String(route.meta?.customerName || platformName.value))
const channelTag = computed(() => String(route.meta?.channelTag || `[${platformName.value}]`))
const platformColor = computed(() => String(route.meta?.platformColor || '#409eff'))

const RETAIL_FUND_ID = 59

// ── 订单数据 ──
const rows = ref<any[]>([])
const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const currentPage = ref(1)

const filteredRows = computed(() => {
  if (!dateRange.value) return rows.value
  const [start, end] = dateRange.value
  return rows.value.filter(r => (r.order_date || '').slice(0, 10) >= start && (r.order_date || '').slice(0, 10) <= end)
})
const pagedRows = computed(() => filteredRows.value.slice((currentPage.value - 1) * 20, currentPage.value * 20))

function getOrderAmount(r: any) { return Number(r.after_discount) || Number(r.total_amount) || 0 }
const totalAmount = computed(() => rows.value.reduce((s, r) => s + getOrderAmount(r), 0))
const monthAmount = computed(() => {
  const ym = new Date().toISOString().slice(0, 7)
  return rows.value.filter(r => (r.order_date || '').startsWith(ym)).reduce((s, r) => s + getOrderAmount(r), 0)
})

// ── 支出数据 ──
const expenses = ref<any[]>([])
const expenseLoading = ref(false)
const totalExpense = computed(() => expenses.value.reduce((s, e) => s + Number(e.amount || 0), 0))
const netIncome = computed(() => totalAmount.value - totalExpense.value)

function fmt(n: number) { return n.toFixed(2) }
function fmtDate(d: string) { return d ? d.slice(0, 10) : '' }

function getGoodsInfo(row: any) {
  return Array.isArray(row.goods_info) ? row.goods_info : []
}
function getGoodsSummary(row: any) {
  const items = getGoodsInfo(row)
  if (!items.length) return ''
  if (items.length === 1) return `${items[0].goods_name} x${items[0].num}`
  return `${items[0].goods_name} 等${items.length}件`
}
function getExpenseType(name: string) {
  const types = [
    { key: '广告推广', label: t('onlineOrders.expenseTypes.ad') },
    { key: '平台佣金', label: t('onlineOrders.expenseTypes.commission') },
    { key: '退款损失', label: t('onlineOrders.expenseTypes.refund') },
    { key: '包装耗材', label: t('onlineOrders.expenseTypes.packaging') },
  ]
  return types.find(v => name.includes(v.key))?.label || t('onlineOrders.otherExpense')
}

async function loadData() {
  loading.value = true
  try {
    const PAGE = 20
    const first: any = await http.get('/shop/ContractOrder/index', { params: { page: 1, size: PAGE } })
    const total = first?.data?.total || 0
    const all: any[] = [...(first?.data?.rows || [])]
    const rest = await Promise.all(Array.from({ length: Math.ceil(total / PAGE) - 1 }, (_, i) =>
      http.get('/shop/ContractOrder/index', { params: { page: i + 2, size: PAGE } })
    ))
    for (const r of rest) all.push(...(r?.data?.rows || []))
    rows.value = all
      .filter(r => Number(r.customer_id) === customerId.value)
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
  } finally {
    loading.value = false
  }
}

async function loadExpenses() {
  expenseLoading.value = true
  try {
    const first: any = await http.get('/finance/PayReceipt/index', { params: { page: 1, size: 100 } })
    const total = first?.data?.total || 0
    const all: any[] = [...(first?.data?.rows || [])]
    const rest = await Promise.all(Array.from({ length: Math.ceil(total / 100) - 1 }, (_, i) =>
      http.get('/finance/PayReceipt/index', { params: { page: i + 2, size: 100 } })
    ))
    for (const r of rest) all.push(...(r?.data?.rows || []))
    expenses.value = all
      .filter(e => (e.remark || '').includes(channelTag.value))
      .sort((a, b) => new Date(b.pay_date || b.created_at).getTime() - new Date(a.pay_date || a.created_at).getTime())
  } finally {
    expenseLoading.value = false
  }
}

function resetFilter() { dateRange.value = null; currentPage.value = 1 }

// ── 审核 ──
const auditingId = ref<number | null>(null)
async function handleAudit(row: any) {
  auditingId.value = row.id
  try {
    await http.post('/shop/ContractOrder/audit', { id: row.id })
    // 扣库存
    const validItems = getGoodsInfo(row).filter((i: any) => i.goods_id && Number(i.num) > 0)
    if (validItems.length) {
      try { await stockEffect(validItems, 'deduct', undefined, `${platformName.value}${t('onlineOrders.outboundTag')}#${row.id}`) }
      catch { ElMessage.warning(t('onlineOrders.auditStockFailed')) }
    }
    // 创建收款单
    try {
      await http.post('/finance/CollectReceipt/add', {
        customer_id: customerId.value,
        customer_name: customerName.value,
        contact_type: 'customer',
        contact_name: customerName.value,
        amount: getOrderAmount(row),
        fund_id: RETAIL_FUND_ID,
        fund_name: t('onlineOrders.retailFund'),
        receipt_date: (row.order_date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        remark: `${channelTag.value} ${platformName.value}订单 ${row.order_sn}`,
        order_sn: row.order_sn,
      })
    } catch { ElMessage.warning(t('onlineOrders.auditReceiptFailed')) }
    ElMessage.success(t('onlineOrders.auditSuccess'))
    loadData()
  } finally {
    auditingId.value = null
  }
}

// ── 商品搜索 ──
interface GoodsItem { goods_id: number; goods_name: string; num: number; price: number }
let goodsPool: any[] = []
async function ensureGoodsPool() {
  if (goodsPool.length) return
  const PAGE = 20
  const first: any = await http.get('/goods/ShopGoods/index', { params: { page: 1, size: PAGE } })
  const total = first?.data?.total || 0
  goodsPool = [...(first?.data?.rows || [])]
  const rest = await Promise.all(Array.from({ length: Math.ceil(total / PAGE) - 1 }, (_, i) =>
    http.get('/goods/ShopGoods/index', { params: { page: i + 2, size: PAGE } })
  ))
  for (const r of rest) goodsPool.push(...(r?.data?.rows || []))
}
async function searchGoods(kw: string, cb: (r: any[]) => void) {
  await ensureGoodsPool()
  const q = kw.trim().toLowerCase()
  cb(q ? goodsPool.filter(g => (g.goods_name || '').toLowerCase().includes(q)).slice(0, 20) : goodsPool.slice(0, 20))
}
function onGoodsSelect(row: GoodsItem, item: any) {
  row.goods_id = item.id || item.goods_id
  row.goods_name = item.goods_name
  row.price = Number(item.sell_price || item.price || 0)
}

// ── 录入订单 ──
const formVisible = ref(false)
const saving = ref(false)
const formData = ref<{ order_date: string; platform_no: string; remark: string; items: GoodsItem[] }>({
  order_date: '', platform_no: '', remark: '', items: []
})
const itemsTotal = computed(() => formData.value.items.reduce((s, i) => s + Number(i.num || 0) * Number(i.price || 0), 0))

function openForm() {
  formData.value = { order_date: new Date().toISOString().slice(0, 10), platform_no: '', remark: '', items: [{ goods_id: 0, goods_name: '', num: 1, price: 0 }] }
  formVisible.value = true
}

async function handleSave() {
  if (!formData.value.order_date) { ElMessage.warning(t('onlineOrders.chooseOrderDate')); return }
  const validItems = formData.value.items.filter(i => i.goods_id && Number(i.num) > 0)
  if (!validItems.length) { ElMessage.warning(t('onlineOrders.addAtLeastOne')); return }
  const total = validItems.reduce((s, i) => s + i.num * i.price, 0)
  saving.value = true
  try {
    const remark = [formData.value.platform_no ? `${platformName.value}订单 ${formData.value.platform_no}` : '', formData.value.remark].filter(Boolean).join(' ')
    await http.post('/shop/ContractOrder/add', {
      customer_id: customerId.value,
      customer_name: customerName.value,
      order_date: formData.value.order_date,
      sign_date: formData.value.order_date,
      total_amount: total,
      after_discount: total,
      discount_type: 'none',
      discount_value: 0,
      freight_amount: 0,
      freight_bearer: 'buyer',
      goods_info: validItems.map(i => ({ goods_id: i.goods_id, goods_name: i.goods_name, num: i.num, price: i.price, total_price: Number((i.num * i.price).toFixed(2)) })),
      remark,
    })
    ElMessage.success(t('onlineOrders.saveSuccess'))
    formVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

// ── 支出 ──
const expenseVisible = ref(false)
const expenseSaving = ref(false)
const fundList = ref<{ id: number; name: string }[]>([])
const expenseForm = ref({ expense_date: '', type: '广告推广', fund_id: 7, amount: 0, remark: '' })

async function ensureFundList() {
  if (fundList.value.length) return
  const res: any = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
  fundList.value = (res?.data?.rows || []).map((f: any) => ({ id: f.id, name: f.name }))
}

function openExpenseForm() {
  ensureFundList()
  expenseForm.value = { expense_date: new Date().toISOString().slice(0, 10), type: '广告推广', fund_id: 7, amount: 0, remark: '' }
  expenseVisible.value = true
}

async function handleSaveExpense() {
  if (!expenseForm.value.expense_date) { ElMessage.warning(t('onlineOrders.chooseDate')); return }
  if (!expenseForm.value.amount) { ElMessage.warning(t('onlineOrders.enterAmount')); return }
  expenseSaving.value = true
  try {
    const selectedFund = fundList.value.find(f => f.id === expenseForm.value.fund_id)
    await http.post('/finance/PayReceipt/add', {
      contact_type: 'other',
      contact_name: `${platformName.value}-${expenseForm.value.type}`,
      amount: expenseForm.value.amount,
      fund_id: expenseForm.value.fund_id,
      fund_name: selectedFund?.name || '',
      pay_date: expenseForm.value.expense_date,
      remark: `${channelTag.value} ${expenseForm.value.remark}`.trim(),
      status: 1,
    })
    ElMessage.success(t('onlineOrders.saveSuccess'))
    expenseVisible.value = false
    loadExpenses()
  } finally {
    expenseSaving.value = false
  }
}

async function handleDeleteExpense(row: any) {
  await ElMessageBox.confirm(t('onlineOrders.deleteExpenseConfirm', { amount: fmt(Number(row.amount)) }), t('onlineOrders.deleteExpense'), { type: 'warning' })
  await http.post('/finance/PayReceipt/del', { id: row.id })
  ElMessage.success(t('common.deleteSuccess'))
  loadExpenses()
}

// 路由切换时重新加载（同一组件复用）
watch(() => route.meta?.customerId, () => { loadData(); loadExpenses() })

onMounted(() => { loadData(); loadExpenses() })
</script>

<style scoped>
.page-container { padding: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; }
.page-title { font-size: 20px; font-weight: 600; color: #1d1d1f; margin: 0; }
.kpi-row { display: flex; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
.kpi-card { background: #fff; border-radius: 12px; padding: 16px 22px; min-width: 130px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
.kpi-label { font-size: 12px; color: rgba(29,29,31,0.5); margin-bottom: 6px; }
.kpi-val { font-size: 24px; font-weight: 700; }
.kpi-val.blue { color: #0071e3; }
.kpi-val.green { color: #16a34a; }
.kpi-val.red { color: #dc2626; }
.main-columns { display: flex; gap: 14px; align-items: flex-start; }
.col-orders { flex: 1 1 0; min-width: 0; }
.col-expense { width: 400px; flex-shrink: 0; }
</style>
