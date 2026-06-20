<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">美团订单</h2>
        <el-tag type="warning" size="small" style="margin-left:10px">美团闪购</el-tag>
      </div>
      <el-button type="primary" :icon="Plus" @click="openForm()">录入订单</el-button>
    </div>

    <!-- KPI 卡片 -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">总订单数</div>
        <div class="kpi-val blue">{{ rows.length }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">总收入</div>
        <div class="kpi-val green">¥{{ fmt(totalAmount) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">本月收入</div>
        <div class="kpi-val blue">¥{{ fmt(monthAmount) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">总支出</div>
        <div class="kpi-val red">¥{{ fmt(totalExpense) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">净收入</div>
        <div class="kpi-val" :class="netIncome >= 0 ? 'green' : 'red'">¥{{ fmt(netIncome) }}</div>
      </div>
    </div>

    <!-- 主体：左侧订单列表 + 右侧平台支出 -->
    <div class="main-columns">
      <!-- 左：筛选 + 订单列表 -->
      <div class="col-orders">
        <el-card style="margin-bottom:10px">
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
              start-placeholder="开始日期" end-placeholder="结束日期"
              value-format="YYYY-MM-DD" style="width:260px" @change="loadData" />
            <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
          </div>
        </el-card>
        <el-card>
          <el-table :data="pagedRows" v-loading="loading" border size="small" style="width:100%" row-key="order_sn">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div style="padding:8px 48px 12px">
                  <el-table :data="getExpandItems(row)" size="small" border style="width:100%">
                    <el-table-column prop="goods_name" label="商品名称" min-width="140" />
                    <el-table-column prop="unit_name" label="单位" width="70" align="center" />
                    <el-table-column prop="num" label="数量" width="80" align="right" />
                    <el-table-column label="单价" width="100" align="right">
                      <template #default="{ row: item }">¥{{ Number(item.price).toFixed(2) }}</template>
                    </el-table-column>
                    <el-table-column label="小计" width="100" align="right">
                      <template #default="{ row: item }">
                        <span style="color:#0071e3">¥{{ (Number(item.num) * Number(item.price)).toFixed(2) }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                  <div v-if="isEstimated(row.remark)" style="margin-top:6px;color:#f59e0b;font-size:11px">
                    ⚠ 收入为估算值（实际以美团结算报告为准）
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="单号" prop="order_sn" width="160" />
            <el-table-column label="日期" width="100">
              <template #default="{ row }">{{ fmtDate(row.order_date) }}</template>
            </el-table-column>
            <el-table-column label="平台订单号" width="180" show-overflow-tooltip>
              <template #default="{ row }">
                <span style="color:rgba(29,29,31,0.5);font-size:12px">{{ getPlatformNo(row.remark) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="商品摘要" show-overflow-tooltip>
              <template #default="{ row }">
                <span style="font-size:12px;color:#1d1d1f">{{ getProductSummary(row.remark) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="商家收入" align="right" width="100">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:600">¥{{ fmt(Number(row.after_discount || row.total_amount)) }}</span>
                <el-icon v-if="isEstimated(row.remark)" style="color:#f59e0b;margin-left:2px;font-size:11px"><Warning /></el-icon>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="76">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
                  {{ row.status === 1 ? '已审核' : '待审核' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="76">
              <template #default="{ row }">
                <el-button v-if="row.status !== 1" type="primary" size="small" plain
                  :loading="auditingId === row.id" @click="handleAudit(row)">
                  审核
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top:10px;display:flex;align-items:center;justify-content:space-between">
            <span style="color:rgba(29,29,31,0.5);font-size:12px">共 {{ filteredRows.length }} 条</span>
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="20"
              :total="filteredRows.length"
              layout="prev, pager, next"
              background
              small
            />
          </div>
        </el-card>
      </div>

      <!-- 右：平台支出 -->
      <div class="col-expense">
        <el-card style="height:100%">
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-weight:600;font-size:14px">平台支出</span>
              <el-button type="primary" size="small" :icon="Plus" @click="openExpenseForm">新增</el-button>
            </div>
          </template>
          <el-table :data="expenses" v-loading="expenseLoading" border size="small" style="width:100%">
            <el-table-column label="日期" width="90">
              <template #default="{ row }">{{ fmtDate(row.pay_date || row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ getExpenseType(row.contact_name || row.name || '') }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" show-overflow-tooltip>
              <template #default="{ row }">{{ (row.remark || '').replace('[美团平台]', '').trim() }}</template>
            </el-table-column>
            <el-table-column label="金额" align="right" width="90">
              <template #default="{ row }">
                <span style="color:#dc2626;font-weight:600">¥{{ fmt(Number(row.amount)) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="" align="center" width="50">
              <template #default="{ row }">
                <el-button type="danger" size="small" link @click="handleDeleteExpense(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="expenses.length" style="margin-top:10px;text-align:right;font-size:13px;color:#dc2626;font-weight:600">
            合计：¥{{ fmt(totalExpense) }}
          </div>
        </el-card>
      </div>
    </div>

    <!-- 录入订单弹框 -->
    <el-dialog v-model="formVisible" title="录入美团订单" width="660px" append-to-body>
      <el-form :model="formData" label-width="90px">
        <el-form-item label="订单日期" required>
          <el-date-picker v-model="formData.order_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="平台单号">
          <el-input v-model="formData.platform_no" placeholder="美团订单编号（可选）" />
        </el-form-item>
        <el-form-item label="商品明细">
          <div style="width:100%">
            <el-table :data="formData.items" border size="small" style="width:100%;margin-bottom:8px">
              <el-table-column label="商品" min-width="180">
                <template #default="{ row }">
                  <el-autocomplete
                    v-model="row.goods_name"
                    :fetch-suggestions="searchGoods"
                    value-key="goods_name"
                    placeholder="搜索商品名称"
                    size="small"
                    style="width:100%"
                    @select="(item: any) => onGoodsSelect(row, item)"
                    clearable
                  />
                </template>
              </el-table-column>
              <el-table-column label="数量" width="85">
                <template #default="{ row }">
                  <el-input-number v-model="row.num" :min="0.001" :precision="3" :controls="false" size="small" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column label="单价" width="90">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :min="0" :precision="2" :controls="false" size="small" style="width:100%" />
                </template>
              </el-table-column>
              <el-table-column label="小计" width="80" align="right">
                <template #default="{ row }">
                  <span style="font-size:12px;color:#0071e3">¥{{ (Number(row.num||0)*Number(row.price||0)).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column width="44" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" size="small" :icon="Close" circle plain @click="formData.items.splice($index, 1)" />
                </template>
              </el-table-column>
            </el-table>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <el-button size="small" :icon="Plus" @click="formData.items.push({goods_id:0,goods_name:'',num:1,price:0})">添加商品</el-button>
              <span style="font-weight:700;color:#0071e3;font-size:14px">合计：¥{{ itemsTotal.toFixed(2) }}</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="客户姓名等信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 录入支出弹框 -->
    <el-dialog v-model="expenseVisible" title="新增平台支出" width="420px" append-to-body>
      <el-form :model="expenseForm" label-width="90px">
        <el-form-item label="日期" required>
          <el-date-picker v-model="expenseForm.expense_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="支出类型" required>
          <el-select v-model="expenseForm.type" style="width:100%">
            <el-option label="广告推广" value="广告推广" />
            <el-option label="平台佣金" value="平台佣金" />
            <el-option label="退款损失" value="退款损失" />
            <el-option label="包装耗材" value="包装耗材" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="支出账户" required>
          <el-select v-model="expenseForm.fund_id" style="width:100%" placeholder="选择支出账户">
            <el-option v-for="f in fundList" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额(¥)" required>
          <el-input-number v-model="expenseForm.amount" :precision="2" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="expenseForm.remark" placeholder="详细说明（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="expenseVisible = false">取消</el-button>
        <el-button type="primary" :loading="expenseSaving" @click="handleSaveExpense">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Refresh, Warning, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'
import { stockEffect } from '@/utils/stockEffect'

const MEITUAN_CUSTOMER_ID = 63
const MEITUAN_TAG = '[美团平台]'

const rows = ref<any[]>([])
const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)

// ── 订单统计 ──
const totalAmount = computed(() => rows.value.reduce((s, r) => s + Number(r.after_discount || r.total_amount || 0), 0))
const monthAmount = computed(() => {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return rows.value
    .filter(r => (r.order_date || '').startsWith(ym))
    .reduce((s, r) => s + Number(r.after_discount || r.total_amount || 0), 0)
})
const filteredRows = computed(() => {
  if (!dateRange.value) return rows.value
  const [start, end] = dateRange.value
  return rows.value.filter(r => {
    const d = (r.order_date || '').slice(0, 10)
    return d >= start && d <= end
  })
})
const currentPage = ref(1)
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * 20
  return filteredRows.value.slice(start, start + 20)
})

// ── 支出统计 ──
const expenses = ref<any[]>([])
const expenseLoading = ref(false)
const totalExpense = computed(() => expenses.value.reduce((s, e) => s + Number(e.amount || 0), 0))
const netIncome = computed(() => totalAmount.value - totalExpense.value)

function fmt(n: number) { return n.toFixed(2) }
function fmtDate(d: string) { return d ? d.slice(0, 10) : '' }
function getPlatformNo(remark: string) {
  const m = (remark || '').match(/美团闪购订单\s*(\d+)/)
  return m ? m[1] : ''
}
function getProducts(remark: string): { name: string; price: number; count: number }[] {
  const m = (remark || '').match(/商品:\s*([^|]+)/)
  if (!m) return []
  return m[1].split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const pm = s.match(/^(.+?)\s+x(\d+)\s+¥([\d.]+)$/)
    if (!pm) return null
    return { name: pm[1].trim(), count: Number(pm[2]), price: Number(pm[3]) }
  }).filter(Boolean) as { name: string; price: number; count: number }[]
}
function getProductSummary(remark: string): string {
  const products = getProducts(remark)
  if (!products.length) return ''
  if (products.length === 1) return `${products[0].name} x${products[0].count}`
  return `${products[0].name} 等${products.length}件`
}
function isEstimated(remark: string): boolean {
  return (remark || '').includes('估算值')
}
function getExpandItems(row: any): any[] {
  const gi: any[] = Array.isArray(row.goods_info) ? row.goods_info : []
  if (gi.length) return gi.map(i => ({ goods_name: i.goods_name, unit_name: i.unit_name || '', num: i.num, price: i.price }))
  return getProducts(row.remark).map(p => ({ goods_name: p.name, unit_name: '', num: p.count, price: p.price }))
}
function getExpenseType(name: string): string {
  const types = ['广告推广', '平台佣金', '退款损失', '包装耗材']
  return types.find(t => (name || '').includes(t)) || '其他支出'
}

async function loadData() {
  loading.value = true
  try {
    const PAGE_SIZE = 20
    const first: any = await http.get('/shop/ContractOrder/index', { params: { page: 1, size: PAGE_SIZE } })
    const firstData = first?.data || first
    const total: number = firstData?.total || 0
    const allRows: any[] = [...(firstData?.rows || firstData?.list || [])]
    const totalPages = Math.ceil(total / PAGE_SIZE)
    const remaining = Array.from({ length: totalPages - 1 }, (_, i) =>
      http.get('/shop/ContractOrder/index', { params: { page: i + 2, size: PAGE_SIZE } })
    )
    const results = await Promise.all(remaining)
    for (const res of results) {
      const d = res?.data || res
      allRows.push(...(d?.rows || d?.list || []))
    }
    rows.value = allRows
      .filter((r: any) => Number(r.customer_id) === MEITUAN_CUSTOMER_ID)
      .sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
  } finally {
    loading.value = false
  }
}

async function loadExpenses() {
  expenseLoading.value = true
  try {
    const first: any = await http.get('/finance/PayReceipt/index', { params: { page: 1, size: 100 } })
    const firstData = first?.data || first
    const total: number = firstData?.total || 0
    const allRows: any[] = [...(firstData?.rows || firstData?.list || [])]
    const totalPages = Math.ceil(total / 100)
    const remaining = Array.from({ length: totalPages - 1 }, (_, i) =>
      http.get('/finance/PayReceipt/index', { params: { page: i + 2, size: 100 } })
    )
    const results = await Promise.all(remaining)
    for (const res of results) {
      const d = res?.data || res
      allRows.push(...(d?.rows || d?.list || []))
    }
    expenses.value = allRows
      .filter((e: any) => (e.remark || '').includes(MEITUAN_TAG))
      .sort((a: any, b: any) => new Date(b.pay_date || b.created_at).getTime() - new Date(a.pay_date || a.created_at).getTime())
  } finally {
    expenseLoading.value = false
  }
}

function resetFilter() { dateRange.value = null; currentPage.value = 1 }

// ── 审核 ──
const RETAIL_FUND_ID = 59
const auditingId = ref<number | null>(null)
async function handleAudit(row: any) {
  auditingId.value = row.id
  try {
    await http.post('/shop/ContractOrder/audit', { id: row.id })

    // Deduct inventory if order has goods
    const items: GoodsItem[] = Array.isArray(row.goods_info) ? row.goods_info : []
    const validItems = items.filter(i => i.goods_id && Number(i.num) > 0)
    if (validItems.length) {
      try {
        await stockEffect(validItems, 'deduct', undefined, `美团出库#${row.id}`)
      } catch {
        ElMessage.warning('审核成功，但库存扣减失败，请手动处理')
      }
    }

    // Auto-create CollectReceipt in 零售收款账户 (id=59)
    try {
      const amt = Number(row.after_discount || row.total_amount || 0)
      await http.post('/finance/CollectReceipt/add', {
        customer_id: MEITUAN_CUSTOMER_ID,
        customer_name: '美团平台',
        contact_type: 'customer',
        contact_name: '美团平台',
        amount: amt,
        fund_id: RETAIL_FUND_ID,
        fund_name: '零售收款账户',
        receipt_date: (row.order_date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        remark: `[美团] 美团订单 ${row.order_sn}`,
        order_sn: row.order_sn,
      })
    } catch {
      ElMessage.warning('审核成功，但自动生成收款单失败，请手动补录')
      loadData()
      return
    }
    ElMessage.success('审核成功，已扣库存并记入零售收款账户')
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
  const rest = await Promise.all(
    Array.from({ length: Math.ceil(total / PAGE) - 1 }, (_, i) =>
      http.get('/goods/ShopGoods/index', { params: { page: i + 2, size: PAGE } })
    )
  )
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
const itemsTotal = computed(() =>
  formData.value.items.reduce((s, i) => s + Number(i.num || 0) * Number(i.price || 0), 0)
)

function openForm() {
  formData.value = {
    order_date: new Date().toISOString().slice(0, 10),
    platform_no: '',
    remark: '',
    items: [{ goods_id: 0, goods_name: '', num: 1, price: 0 }]
  }
  formVisible.value = true
}

async function handleSave() {
  if (!formData.value.order_date) { ElMessage.warning('请选择订单日期'); return }
  const validItems = formData.value.items.filter(i => i.goods_id && Number(i.num) > 0)
  if (!validItems.length) { ElMessage.warning('请至少添加一个商品'); return }
  const total = validItems.reduce((s, i) => s + Number(i.num) * Number(i.price || 0), 0)
  saving.value = true
  try {
    const remark = [
      formData.value.platform_no ? `美团闪购订单 ${formData.value.platform_no}` : '',
      formData.value.remark
    ].filter(Boolean).join(' ')
    const goods_info = validItems.map(i => ({
      goods_id: i.goods_id,
      goods_name: i.goods_name,
      num: i.num,
      price: i.price,
      total_price: Number((i.num * i.price).toFixed(2)),
    }))
    await http.post('/shop/ContractOrder/add', {
      customer_id: MEITUAN_CUSTOMER_ID,
      customer_name: '美团平台',
      order_date: formData.value.order_date,
      sign_date: formData.value.order_date,
      total_amount: total,
      after_discount: total,
      discount_type: 'none',
      discount_value: 0,
      freight_amount: 0,
      freight_bearer: 'buyer',
      goods_info,
      remark
    })
    ElMessage.success('录入成功')
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
  if (!expenseForm.value.expense_date) { ElMessage.warning('请选择日期'); return }
  if (!expenseForm.value.amount) { ElMessage.warning('请填写金额'); return }
  expenseSaving.value = true
  try {
    const selectedFund = fundList.value.find(f => f.id === expenseForm.value.fund_id)
    await http.post('/finance/PayReceipt/add', {
      contact_type: 'other',
      contact_name: `美团-${expenseForm.value.type}`,
      amount: expenseForm.value.amount,
      fund_id: expenseForm.value.fund_id,
      fund_name: selectedFund?.name || '',
      pay_date: expenseForm.value.expense_date,
      remark: `${MEITUAN_TAG} ${expenseForm.value.remark}`.trim(),
      status: 1,
    })
    ElMessage.success('录入成功，已计入其他支出')
    expenseVisible.value = false
    loadExpenses()
  } finally {
    expenseSaving.value = false
  }
}

async function handleDeleteExpense(row: any) {
  await ElMessageBox.confirm(`确认删除「${row.contact_name || row.name}」¥${fmt(Number(row.amount))}？`, '删除支出', { type: 'warning' })
  await http.post('/finance/PayReceipt/del', { id: row.id })
  ElMessage.success('已删除')
  loadExpenses()
}

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
