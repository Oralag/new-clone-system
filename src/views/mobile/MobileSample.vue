<template>
  <div class="ms-page">

    <!-- 列表页 -->
    <template v-if="!showForm">
      <!-- 顶部摘要 -->
      <div class="ms-summary">
        <div class="ms-sum-item">
          <div class="ms-sum-label">样品单</div>
          <div class="ms-sum-val">{{ summary.count }}</div>
        </div>
        <div class="ms-sum-item">
          <div class="ms-sum-label">待审核</div>
          <div class="ms-sum-val warn">{{ summary.pending }}</div>
        </div>
        <div class="ms-sum-item">
          <div class="ms-sum-label">样品费用</div>
          <div class="ms-sum-val orange">¥{{ fmt(summary.companyCost) }}</div>
        </div>
        <div class="ms-sum-item">
          <div class="ms-sum-label">客户应收</div>
          <div class="ms-sum-val blue">¥{{ fmt(summary.receivable) }}</div>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="ms-search-bar">
        <input v-model="keyword" class="ms-search-input" placeholder="样品单号 / 客户" @input="onSearch" />
        <button class="ms-btn-primary ms-btn-sm" @click="openCreate">+ 新增</button>
      </div>

      <!-- 状态筛选 -->
      <div class="ms-tabs">
        <div v-for="t in statusTabs" :key="t.val" :class="['ms-tab', filterStatus === t.val ? 'active' : '']" @click="filterStatus = t.val">{{ t.label }}</div>
      </div>

      <!-- 列表 -->
      <div class="ms-list" v-if="!listLoading">
        <div v-if="filteredList.length === 0" class="ms-empty">暂无样品单</div>
        <div v-for="row in filteredList" :key="row.id" class="ms-card" @click="openView(row)">
          <div class="ms-card-top">
            <span class="ms-order-no">{{ row.sample_no || '—' }}</span>
            <span :class="['ms-badge', statusMeta(row.status).cls]">{{ statusMeta(row.status).label }}</span>
          </div>
          <div class="ms-card-mid">
            <span class="ms-customer">{{ row.customer_name || row.contact_name || '—' }}</span>
            <span :class="['ms-type-tag', typeMeta(row.sample_type).cls]">{{ typeMeta(row.sample_type).label }}</span>
          </div>
          <div class="ms-card-bot">
            <span class="ms-meta">{{ fmtDt(row.sample_date || row.created_at) }}</span>
            <span class="ms-meta">{{ row.warehouse_name || '' }}</span>
          </div>
          <div class="ms-card-amounts">
            <span class="ms-amount orange">成本 ¥{{ fmt(row.company_cost) }}</span>
            <span class="ms-amount blue">应收 ¥{{ fmt(row.receivable_amount) }}</span>
          </div>
          <!-- 操作按钮 -->
          <div class="ms-card-actions" @click.stop>
            <button v-if="row.status !== 1" class="ms-act-btn" @click="openEdit(row)">编辑</button>
            <button v-if="row.status === 0" class="ms-act-btn green" @click="doAudit(row, 1)">审核</button>
            <button v-if="row.status === 0" class="ms-act-btn red" @click="doAudit(row, 2)">驳回</button>
            <button v-if="row.status === 1" class="ms-act-btn orange" @click="doAudit(row, 0)">反审核</button>
            <button v-if="row.status !== 1" class="ms-act-btn red" @click="doDelete(row)">删除</button>
          </div>
        </div>
      </div>
      <div v-else class="ms-empty">加载中…</div>
    </template>

    <!-- 表单页 -->
    <template v-else>
      <div class="ms-form-topbar">
        <button class="ms-back-btn" @click="backToList">‹ 返回</button>
        <span class="ms-form-title">{{ isView ? '查看样品单' : fd.id ? '编辑样品单' : '新增样品单' }}</span>
        <button v-if="!isView" class="ms-btn-primary ms-btn-sm" :disabled="saving" @click="handleSave">
          {{ saving ? '保存中…' : '保存' }}
        </button>
        <div v-else style="width:56px"></div>
      </div>

      <div class="ms-form-body">
        <!-- 基本信息 -->
        <div class="ms-section-title">基本信息</div>
        <div class="ms-field">
          <label>样品单号</label>
          <input :value="fd.sample_no || '保存后自动生成'" disabled class="ms-input ms-input-disabled" />
        </div>
        <div class="ms-field">
          <label>样品类型</label>
          <select v-model="fd.sample_type" class="ms-input" :disabled="isView" @change="calcTotals">
            <option value="free">免费样品</option>
            <option value="paid">收费样品</option>
            <option value="borrow">借样</option>
          </select>
        </div>
        <div class="ms-field">
          <label>客户</label>
          <select v-model="fd.customer_id" class="ms-input" :disabled="isView" @change="onCustomerChange">
            <option value="">请选择客户</option>
            <option :value="INTERNAL_CUSTOMER_VALUE">内部领用</option>
            <option v-for="c in customerOptions" :key="c.id" :value="c.id">{{ c.name || c.nickname }}</option>
          </select>
        </div>
        <div class="ms-field">
          <label>客户名称</label>
          <input v-model="fd.customer_name" class="ms-input" placeholder="可直接录入潜在客户" :disabled="isView" />
        </div>
        <div class="ms-field">
          <label>发样日期</label>
          <input v-model="fd.sample_date" type="date" class="ms-input" :disabled="isView" />
        </div>
        <div class="ms-field">
          <label>仓库</label>
          <select v-model="fd.warehouse_id" class="ms-input" :disabled="isView" @change="onWarehouseChange">
            <option value="">请选择仓库</option>
            <option v-for="w in warehouseOptions" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div v-if="fd.sample_type === 'borrow'" class="ms-field">
          <label>预计退回</label>
          <input v-model="fd.return_date" type="date" class="ms-input" :disabled="isView" />
        </div>

        <!-- 样品明细 -->
        <div class="ms-section-title" style="margin-top:16px">
          样品明细
          <span v-if="!isView" class="ms-add-link" @click="openGoodsPicker">+ 选择商品</span>
        </div>
        <div v-if="fd.items.length === 0" class="ms-empty-sm">请添加样品商品</div>
        <div v-for="(item, idx) in fd.items" :key="idx" class="ms-goods-card">
          <div class="ms-goods-top">
            <span class="ms-goods-name">{{ item.goods_name || '未命名' }}</span>
            <button v-if="!isView" class="ms-del-btn" @click="removeRow(idx)">✕</button>
          </div>
          <div class="ms-goods-meta">{{ item.goods_sn }} · {{ item.spec }} · {{ item.unit_name }}</div>
          <div class="ms-goods-nums">
            <div class="ms-goods-field">
              <span>数量</span>
              <div class="ms-stepper" :class="{ disabled: isView }">
                <button class="ms-stepper-btn" :disabled="isView" @click="adjustItemNum(item, -1)">−</button>
                <input
                  :value="formatItemNum(item.num)"
                  type="number"
                  inputmode="decimal"
                  step="0.01"
                  class="ms-stepper-input"
                  :disabled="isView"
                  @input="onItemNumInput(item, $event)"
                  @blur="normalizeItemNum(item)"
                />
                <button class="ms-stepper-btn" :disabled="isView" @click="adjustItemNum(item, 1)">+</button>
              </div>
            </div>
            <div class="ms-goods-field">
              <span>成本价</span>
              <span class="ms-cost-val">¥{{ Number(item.cost_price || 0).toFixed(2) }}</span>
            </div>
            <div v-if="fd.sample_type === 'paid'" class="ms-goods-field">
              <span>收费价</span>
              <input v-model.number="item.price" type="number" class="ms-mini-input" :disabled="isView" @change="calcTotals" />
            </div>
          </div>
        </div>

        <!-- 物流与结算 -->
        <div class="ms-section-title" style="margin-top:16px">物流与结算</div>
        <div class="ms-settle-cards">
          <div class="ms-settle-row"><span>样品收费</span><b>¥{{ fmt(chargeAmount) }}</b></div>
          <div class="ms-settle-row"><span>样品成本</span><b>¥{{ fmt(goodsCost) }}</b></div>
        </div>
        <div class="ms-field">
          <label>运费</label>
          <input v-model.number="fd.freight_amount" type="number" class="ms-input" :disabled="isView" @change="calcTotals" />
        </div>
        <div class="ms-field">
          <label>运费承担</label>
          <select v-model="fd.freight_bearer" class="ms-input" :disabled="isView" @change="calcTotals">
            <option value="seller">公司承担</option>
            <option value="buyer">客户承担</option>
            <option value="half">各半</option>
            <option value="free">免运费</option>
          </select>
        </div>
        <div class="ms-settle-cards">
          <div class="ms-settle-row"><span>客户应收</span><b class="blue">¥{{ fmt(fd.receivable_amount) }}</b></div>
          <div class="ms-settle-row"><span>公司费用</span><b class="orange">¥{{ fmt(fd.company_cost) }}</b></div>
        </div>
        <div class="ms-field">
          <label>已收金额</label>
          <input v-model.number="fd.paid_amount" type="number" class="ms-input" :disabled="isView" />
        </div>
        <div v-if="fd.paid_amount > 0" class="ms-field">
          <label>收款账户</label>
          <select v-model="fd.receipt_fund_id" class="ms-input" :disabled="isView" @change="onReceiptFundChange">
            <option value="">请选择账户</option>
            <option v-for="f in fundOptions" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
        <div v-if="fd.company_cost > 0" class="ms-field">
          <label>费用状态</label>
          <select v-model="fd.expense_payment_status" class="ms-input" :disabled="isView" @change="onExpenseStatusChange">
            <option value="pending">待收款</option>
            <option value="paid">已收款</option>
            <option value="free">无需付款</option>
          </select>
        </div>
        <div v-if="fd.company_cost > 0 && fd.expense_payment_status === 'paid'" class="ms-field">
          <label>收款账户</label>
          <select v-model="fd.expense_fund_id" class="ms-input" :disabled="isView" @change="onExpenseFundChange">
            <option value="">请选择账户</option>
            <option v-for="f in fundOptions" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
        <div class="ms-field">
          <label>快递公司</label>
          <input v-model="fd.courier" class="ms-input" :disabled="isView" />
        </div>
        <div class="ms-field">
          <label>运单号</label>
          <input v-model="fd.tracking_no" class="ms-input" :disabled="isView" />
        </div>
        <div class="ms-field">
          <label>备注</label>
          <textarea v-model="fd.remark" class="ms-input ms-textarea" rows="2" :disabled="isView" />
        </div>

        <div style="height:32px"></div>
      </div>
    </template>

    <!-- 商品选择抽屉 -->
    <Teleport to="body">
      <div v-if="goodsPickerVisible" class="ms-drawer-overlay" @click.self="goodsPickerVisible = false">
        <div class="ms-drawer">
          <div class="ms-drawer-head">
            <span>选择商品</span>
            <span class="ms-drawer-close" @click="goodsPickerVisible = false">✕</span>
          </div>
          <div class="ms-drawer-search">
            <input v-model="goodsKeyword" class="ms-search-input" placeholder="商品名称 / 编码" @input="searchGoods" />
          </div>
          <div class="ms-drawer-list">
            <div v-if="goodsLoading" class="ms-empty">加载中…</div>
            <div v-else-if="goodsList.length === 0" class="ms-empty">无结果</div>
            <div
              v-for="g in goodsList"
              :key="g.id"
              :class="['ms-goods-row', isGoodsSelected(g) ? 'selected' : '']"
              @click="toggleGoods(g)"
            >
              <div class="ms-goods-row-check">
                <svg v-if="isGoodsSelected(g)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <div v-else class="ms-uncheck"></div>
              </div>
              <div class="ms-goods-row-info">
                <div class="ms-goods-row-name">{{ g.goods_name }}</div>
                <div class="ms-goods-row-meta">{{ g.goods_sn }} · {{ g.unit_name }} · 库存{{ g.stock_num ?? 0 }}</div>
              </div>
              <div class="ms-goods-row-price">¥{{ fmt(getDisplayCost(g)) }}</div>
            </div>
          </div>
          <div class="ms-drawer-foot">
            <button class="ms-btn-cancel" @click="goodsPickerVisible = false">取消</button>
            <button class="ms-btn-primary" @click="confirmGoods">确定 ({{ pickerSelected.length }})</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'
import { getWarehouseList } from '@/api/warehouse'
import { auditSample, createSample, deleteSample, getSampleList, updateSample, getSaleCustomerList } from '@/api/sale'
import { getBomByGoods, getBomList } from '@/api/goods'
import { getFundList } from '@/api/finance'
import { fmtDt } from '@/utils/date'
import { getSyncedDefaultWarehouseId } from '@/utils/defaultWarehouse'
import { fuzzyFilterGoods } from '@/utils/fuzzyMatch'

// ── 列表 ──
const listLoading = ref(false)
const allRows = ref<any[]>([])
const keyword = ref('')
const filterStatus = ref<string | number>('')
const summary = reactive({ count: 0, pending: 0, receivable: 0, companyCost: 0 })

const statusTabs = [
  { val: '', label: '全部' },
  { val: 0, label: '待审核' },
  { val: 1, label: '已审核' },
  { val: 2, label: '已驳回' },
]

const filteredList = computed(() => {
  let rows = allRows.value
  if (filterStatus.value !== '') rows = rows.filter(r => Number(r.status) === Number(filterStatus.value))
  const kw = keyword.value.trim().toLowerCase()
  if (kw) rows = rows.filter(r => (r.sample_no || '').toLowerCase().includes(kw) || (r.customer_name || '').toLowerCase().includes(kw))
  return rows
})

function onSearch() { /* filteredList is computed */ }

function statusMeta(s: number) {
  return ({ 0: { label: '待审核', cls: 'badge-warn' }, 1: { label: '已审核', cls: 'badge-ok' }, 2: { label: '已驳回', cls: 'badge-err' } } as any)[Number(s)] || { label: '—', cls: '' }
}
function typeMeta(t: string) {
  return ({ free: { label: '免费', cls: 'type-free' }, paid: { label: '收费', cls: 'type-paid' }, borrow: { label: '借样', cls: 'type-borrow' } } as any)[t] || { label: '—', cls: '' }
}

async function loadList() {
  listLoading.value = true
  try {
    const res = await getSampleList({ list_rows: 500 })
    const rows = res.data?.rows ?? []
    allRows.value = rows
    summary.count = rows.length
    summary.pending = rows.filter((r: any) => Number(r.status) === 0).length
    summary.receivable = rows.reduce((s: number, r: any) => s + Number(r.receivable_amount || 0), 0)
    summary.companyCost = rows.reduce((s: number, r: any) => s + Number(r.company_cost || 0), 0)
  } finally {
    listLoading.value = false
  }
}

// ── 表单 ──
const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)

const customerOptions = ref<any[]>([])
const warehouseOptions = ref<any[]>([])
const fundOptions = ref<any[]>([])
const INTERNAL_CUSTOMER_VALUE = '__internal__'

function defaultFd() {
  return {
    id: 0, sample_no: '', sample_type: 'free',
    customer_id: null as any, customer_name: '', contact_name: '', admin_name: '',
    sample_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
    return_date: '', warehouse_id: null as any, warehouse_name: '',
    items: [] as any[],
    sample_amount: 0, freight_amount: 0, freight_bearer: 'seller',
    courier: '', tracking_no: '',
    receivable_amount: 0, paid_amount: 0, company_cost: 0,
    receipt_fund_id: null as any, receipt_fund_name: '',
    expense_payment_status: 'pending',
    expense_fund_id: null as any, expense_fund_name: '',
    remark: '', status: 0,
  }
}
const fd = reactive(defaultFd())

const goodsCost = computed(() =>
  fd.items.reduce((s, i) => s + Number(i.num || 0) * Number(i.cost_price || i.out_price || 0), 0)
)
const chargeAmount = computed(() =>
  fd.sample_type === 'paid'
    ? fd.items.reduce((s, i) => s + Number(i.num || 0) * Number(i.price || 0), 0)
    : 0
)

function calcTotals() {
  fd.sample_amount = Number(chargeAmount.value.toFixed(2))
  const freight = Number(fd.freight_amount || 0)
  const custFreight = fd.freight_bearer === 'buyer' ? freight : fd.freight_bearer === 'half' ? freight / 2 : 0
  const coFreight = fd.freight_bearer === 'seller' ? freight : fd.freight_bearer === 'half' ? freight / 2 : 0
  fd.receivable_amount = Number((fd.sample_amount + custFreight).toFixed(2))
  fd.company_cost = Number(((fd.sample_type === 'paid' ? 0 : goodsCost.value) + coFreight).toFixed(2))
  if (fd.paid_amount > fd.receivable_amount) fd.paid_amount = fd.receivable_amount
  if (fd.paid_amount <= 0) {
    fd.receipt_fund_id = null
    fd.receipt_fund_name = ''
  }
  if (fd.company_cost <= 0) {
    fd.expense_payment_status = 'free'
    fd.expense_fund_id = null
    fd.expense_fund_name = ''
  }
}

function onCustomerChange(e: any) {
  const id = e.target?.value ?? e
  if (id === INTERNAL_CUSTOMER_VALUE) {
    fd.customer_name = '内部'
    fd.contact_name = ''
    return
  }
  const c = customerOptions.value.find(x => String(x.id) === String(id))
  if (c) fd.customer_name = c.name || c.nickname || fd.customer_name
}
function onWarehouseChange(e: any) {
  const id = e.target?.value ?? e
  const w = warehouseOptions.value.find(x => String(x.id) === String(id))
  if (w) fd.warehouse_name = w.name
}
function onReceiptFundChange(e: any) {
  const id = e.target?.value ?? e
  const f = fundOptions.value.find(x => String(x.id) === String(id))
  if (f) fd.receipt_fund_name = f.name
}
function onExpenseFundChange(e: any) {
  const id = e.target?.value ?? e
  const f = fundOptions.value.find(x => String(x.id) === String(id))
  if (f) fd.expense_fund_name = f.name
}

function onExpenseStatusChange() {
  if (fd.expense_payment_status !== 'paid') {
    fd.expense_fund_id = null
    fd.expense_fund_name = ''
  }
}

async function applyDefaultWarehouse() {
  if (fd.warehouse_id) return
  const defaultWhId = await getSyncedDefaultWarehouseId()
  const wh = warehouseOptions.value.find(x => Number(x.id) === defaultWhId)
    || warehouseOptions.value[0]
  if (!wh) return
  fd.warehouse_id = wh.id
  fd.warehouse_name = wh.name
}

function removeRow(idx: number) { fd.items.splice(idx, 1); calcTotals() }

function roundNum(value: number, precision = 2) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function formatItemNum(value: any) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  return Number.isInteger(num) ? String(num) : String(roundNum(num, 2))
}

function normalizeItemNum(item: any) {
  const raw = Number(item.num)
  item.num = Number.isFinite(raw) && raw >= 0 ? roundNum(raw, 2) : 0
  calcTotals()
}

function onItemNumInput(item: any, event: Event) {
  const target = event.target as HTMLInputElement
  item.num = target.value
}

function adjustItemNum(item: any, delta: number) {
  const current = Number(item.num || 0)
  const next = Math.max(0, roundNum(current + delta, 2))
  item.num = next
  calcTotals()
}

async function ensureWarehouseOptionsLoaded() {
  if (warehouseOptions.value.length) return
  try {
    const res = await getWarehouseList({ list_rows: 200 })
    warehouseOptions.value = res.data?.rows ?? []
  } catch {
    //
  }
}

async function openCreate() {
  Object.assign(fd, defaultFd()); fd.items = []
  await ensureWarehouseOptionsLoaded()
  await applyDefaultWarehouse()
  isView.value = false; showForm.value = true
}
function openEdit(row: any) {
  Object.assign(fd, defaultFd(), row)
  fd.items = parseItems(row.goods_info)
  calcTotals(); isView.value = false; showForm.value = true
}
function openView(row: any) {
  Object.assign(fd, defaultFd(), row)
  fd.items = parseItems(row.goods_info)
  calcTotals(); isView.value = true; showForm.value = true
}
function backToList() { showForm.value = false; loadList() }

function parseItems(v: any) {
  if (Array.isArray(v)) return v
  try { return JSON.parse(v || '[]') } catch { return [] }
}

async function handleSave() {
  if (!fd.customer_name && !fd.customer_id) { ElMessage.warning('请选择或填写客户'); return }
  if (!fd.sample_date) { ElMessage.warning('请选择发样日期'); return }
  if (!fd.warehouse_id) { ElMessage.warning('请选择仓库'); return }
  if (!fd.items.length) { ElMessage.warning('请添加样品明细'); return }
  calcTotals()
  if (fd.paid_amount > 0 && !fd.receipt_fund_id) { ElMessage.warning('已收金额大于0时请选择收款账户'); return }
  if (fd.company_cost > 0 && fd.expense_payment_status === 'paid' && !fd.expense_fund_id) { ElMessage.warning('公司费用已付款时请选择付款账户'); return }
  saving.value = true
  try {
    const payload = {
      ...fd,
      customer_id: fd.customer_id && fd.customer_id !== INTERNAL_CUSTOMER_VALUE ? fd.customer_id : null,
      customer_name: fd.customer_id === INTERNAL_CUSTOMER_VALUE ? (fd.customer_name || '内部') : fd.customer_name,
      receipt_fund_id: fd.receipt_fund_id || null,
      expense_fund_id: fd.expense_fund_id || null,
      return_date: fd.return_date || null,
      goods_info: JSON.stringify(fd.items),
    }
    if (fd.id) await updateSample(payload)
    else await createSample(payload)
    ElMessage.success('保存成功')
    backToList()
  } finally { saving.value = false }
}

async function doAudit(row: any, status: number) {
  const label = status === 1 ? '审核' : status === 0 ? '反审核' : '驳回'
  await ElMessageBox.confirm(`确定${label}该样品单？`, '提示', { type: 'warning' })
  await auditSample(row.id, status)
  ElMessage.success('操作成功')
  loadList()
}

async function doDelete(row: any) {
  await ElMessageBox.confirm('确定删除该样品单？', '提示', { type: 'warning' })
  await deleteSample(row.id)
  ElMessage.success('删除成功')
  loadList()
}

// ── 商品选择抽屉 ──
const goodsPickerVisible = ref(false)
const goodsKeyword = ref('')
const goodsList = ref<any[]>([])
const goodsLoading = ref(false)
const pickerSelected = ref<any[]>([])
const pickerCostMap = ref<Record<number, number>>({})
let allGoods: any[] = []

function isGoodsSelected(g: any) { return pickerSelected.value.some(x => x.id === g.id) }
function toggleGoods(g: any) {
  const idx = pickerSelected.value.findIndex(x => x.id === g.id)
  if (idx >= 0) pickerSelected.value.splice(idx, 1)
  else pickerSelected.value.push(g)
}

async function openGoodsPicker() {
  pickerSelected.value = []
  goodsKeyword.value = ''
  goodsPickerVisible.value = true
  goodsLoading.value = true
  try {
    const res = await http.get('/goods/ShopGoods/index', { params: { list_rows: 500 } })
    const typeMap: Record<number, number> = (() => { try { return JSON.parse(localStorage.getItem('erp_goods_type_map') || '{}') } catch { return {} } })()
    allGoods = (res.data?.rows ?? []).map((g: any) => ({ ...g, goods_type: g.goods_type ?? typeMap[Number(g.id)] ?? 2 }))
    goodsList.value = allGoods
    void warmupGoodsCosts(goodsList.value.slice(0, 80))
  } finally { goodsLoading.value = false }
}

function searchGoods() {
  goodsList.value = fuzzyFilterGoods(allGoods, goodsKeyword.value)
  void warmupGoodsCosts(goodsList.value.slice(0, 80))
}

// ── BOM 成本解析（同桌面端逻辑） ──
let bomListCache: any[] | null = null
const bomCostCache = new Map<string, number>()

function firstPositiveNumber(...values: any[]) {
  for (const v of values) {
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

async function resolveBomCost(goods: any): Promise<number> {
  const key = String(goods.id || goods.goods_id || goods.goods_sn || goods.goods_name || '')
  if (!key) return 0
  if (bomCostCache.has(key)) return bomCostCache.get(key) || 0
  if (!bomListCache) {
    try {
      const res = await getBomList({ list_rows: 2000 })
      bomListCache = res.data?.rows ?? res.data?.list ?? []
    } catch { bomListCache = []; return 0 }
  }
  const bom = bomListCache.find((item: any) =>
    (goods.id && Number(item.goods_id) === Number(goods.id)) ||
    (goods.goods_sn && item.goods_sn === goods.goods_sn) ||
    (goods.goods_name && item.goods_name === goods.goods_name)
  )
  if (!bom) {
    bomCostCache.set(key, 0)
    return 0
  }
  const localPrices: Record<number, number> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_bom_prices') || '{}') } catch { return {} }
  })()
  const calcRowsCost = (rows: any[]) => {
    const cost = rows.reduce((sum, row) => {
      const price = firstPositiveNumber(
        row.price, row.cost_price, row.out_price, row.in_price, row.purchase_price, row.avg_price, localPrices[row.id],
      )
      const qty = Number(row.num ?? row.qty ?? row.quantity ?? row.material_num ?? 0)
      return sum + qty * price
    }, 0)
    return Number(cost.toFixed(4))
  }
  try {
    const detailId = bom?.id || bom?.goods_id || goods.id
    if (detailId) {
      const detailRes = await getBomByGoods(detailId)
      const rows: any[] = detailRes.data?.items ?? detailRes.data?.rows ?? detailRes.data?.list ?? []
      const fixed = calcRowsCost(rows)
      bomCostCache.set(key, fixed)
      if (fixed > 0) return fixed
    }
  } catch {}
  bomCostCache.set(key, 0)
  return 0
}

async function resolveGoodsCost(goods: any): Promise<number> {
  const direct = firstPositiveNumber(
    goods.cost_price, goods.costPrice, goods.purchase_price,
    goods.avg_price, goods.in_price, goods.out_price,
  )
  if (direct > 0) return direct
  try { return await resolveBomCost(goods) } catch { return 0 }
}

function getDisplayCost(goods: any) {
  const id = Number(goods.id || goods.goods_id || 0)
  if (id && Number.isFinite(pickerCostMap.value[id])) return pickerCostMap.value[id]
  return firstPositiveNumber(
    goods.cost_price, goods.costPrice, goods.purchase_price,
    goods.avg_price, goods.in_price, goods.out_price,
  )
}

async function warmupGoodsCosts(rows: any[]) {
  const targets = rows.filter((goods: any) => {
    const id = Number(goods.id || goods.goods_id || 0)
    if (!id) return false
    if (Number.isFinite(pickerCostMap.value[id])) return false
    return !firstPositiveNumber(
      goods.cost_price, goods.costPrice, goods.purchase_price,
      goods.avg_price, goods.in_price, goods.out_price,
    )
  })
  await Promise.all(targets.map(async (goods: any) => {
    const id = Number(goods.id || goods.goods_id || 0)
    const cost = await resolveGoodsCost(goods)
    pickerCostMap.value = {
      ...pickerCostMap.value,
      [id]: cost,
    }
  }))
}

async function confirmGoods() {
  goodsPickerVisible.value = false

  if (!bomListCache) {
    try {
      const res = await getBomList({ list_rows: 2000 })
      bomListCache = res.data?.rows ?? res.data?.list ?? []
    } catch { bomListCache = [] }
  }

  for (const g of pickerSelected.value) {
    const bom = bomListCache!.find((item: any) =>
      (g.id && Number(item.goods_id) === Number(g.id)) ||
      (g.goods_sn && item.goods_sn === g.goods_sn) ||
      (g.goods_name && item.goods_name === g.goods_name)
    )

    if (bom?.id) {
      let expand = false
      try {
        await ElMessageBox.confirm(
          `「${g.goods_name || g.name}」有BOM配置，是否展开BOM明细加入样品？\n（礼盒组装选"展开"，普通成品选"不展开"）`,
          '展开BOM',
          { confirmButtonText: '展开', cancelButtonText: '不展开', type: 'info', closeOnClickModal: false }
        )
        expand = true
      } catch { expand = false }

      if (expand) {
        try {
          const detailRes = await getBomByGoods(bom.id)
          const bomItems: any[] = detailRes.data?.items ?? []
          if (bomItems.length > 0) {
            for (const item of bomItems) {
              const matched = allGoods.find((ag: any) =>
                (item.goods_sn && ag.goods_sn === item.goods_sn) ||
                (!item.goods_sn && ag.goods_name === item.goods_name)
              )
              const costPrice = await resolveGoodsCost(matched || item)
              fd.items.push({
                goods_id: matched?.id || item.goods_id || 0,
                goods_name: item.goods_name || '',
                goods_sn: item.goods_sn || matched?.goods_sn || '',
                spec: item.spec || matched?.spec || '',
                unit_name: item.unit_name || '',
                num: Number(item.num || 1),
                cost_price: costPrice || Number(item.price || 0),
                out_price: costPrice || Number(item.price || 0),
                price: Number(matched?.sell_price || 0),
                remark: '',
              })
            }
            calcTotals()
            continue
          }
        } catch {}
      }
    }

    const costPrice = await resolveGoodsCost(g)
    fd.items.push({
      goods_id: g.id,
      goods_name: g.goods_name || g.name || '',
      goods_sn: g.goods_sn || '',
      spec: g.spec || '',
      unit_name: g.unit_name || '',
      num: 1,
      cost_price: costPrice,
      out_price: costPrice,
      price: Number(g.sell_price || 0),
      remark: '',
    })
  }
  calcTotals()
}

function fmt(v: any) { return Number(v || 0).toFixed(2) }

async function loadBaseData() {
  const [c, w, f] = await Promise.allSettled([
    getSaleCustomerList({ list_rows: 500 }),
    getWarehouseList({ list_rows: 200 }),
    getFundList({ list_rows: 200 }),
  ])
  if (c.status === 'fulfilled') customerOptions.value = c.value.data?.rows ?? []
  if (w.status === 'fulfilled') warehouseOptions.value = w.value.data?.rows ?? []
  if (f.status === 'fulfilled') fundOptions.value = f.value.data?.rows ?? []
  await applyDefaultWarehouse()
}

onMounted(() => { void loadBaseData(); loadList() })
</script>

<style scoped>
.ms-page {
  min-height: 100%;
  background: #f5f5f5;
  padding-bottom: 24px;
}

/* 摘要 */
.ms-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}
.ms-sum-item {
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid #f0f0f0;
}
.ms-sum-item:last-child { border-right: none; }
.ms-sum-label { font-size: 11px; color: #999; margin-bottom: 4px; }
.ms-sum-val { font-size: 16px; font-weight: 700; color: #1d2129; }
.ms-sum-val.warn { color: #f53f3f; }
.ms-sum-val.blue { color: #0071e3; font-size: 13px; }
.ms-sum-val.orange { color: #d97706; font-size: 13px; }

/* 搜索 */
.ms-search-bar {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}
.ms-search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #f9fafb;
}
.ms-search-input:focus { border-color: #2563EB; background: #fff; }

/* Tabs */
.ms-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}
.ms-tab {
  flex: 1;
  text-align: center;
  padding: 9px 0;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.ms-tab.active { color: #2563EB; border-bottom-color: #2563EB; font-weight: 600; }

/* 列表卡片 */
.ms-list { padding: 0 12px; display: flex; flex-direction: column; gap: 10px; margin-top: 2px; }
.ms-empty { text-align: center; padding: 40px; color: #bbb; font-size: 14px; }
.ms-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.ms-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.ms-order-no { font-size: 14px; font-weight: 600; color: #1d2129; }
.ms-card-mid { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.ms-customer { font-size: 14px; color: #374151; }
.ms-card-bot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
.ms-card-amounts { display: flex; justify-content: space-between; margin-bottom: 10px; }
.ms-meta { font-size: 12px; color: #9ca3af; }
.ms-amount { font-size: 13px; font-weight: 600; margin-left: auto; }
.ms-badge {
  font-size: 11px; padding: 2px 7px; border-radius: 10px; font-weight: 500;
}
.badge-ok { background: #d1fae5; color: #065f46; }
.badge-warn { background: #fef3c7; color: #92400e; }
.badge-err { background: #fee2e2; color: #991b1b; }
.ms-type-tag { font-size: 11px; padding: 2px 7px; border-radius: 10px; }
.type-free { background: #f0fdf4; color: #16a34a; }
.type-paid { background: #eff6ff; color: #2563eb; }
.type-borrow { background: #fffbeb; color: #d97706; }
.ms-card-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.ms-act-btn {
  padding: 5px 12px; border-radius: 6px; border: 1px solid #e5e7eb;
  font-size: 12px; cursor: pointer; background: #fff; color: #374151;
}
.ms-act-btn.green { border-color: #16a34a; color: #16a34a; }
.ms-act-btn.red { border-color: #dc2626; color: #dc2626; }
.ms-act-btn.orange { border-color: #d97706; color: #d97706; }

/* 表单 */
.ms-form-topbar {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px;
  background: #fff; border-bottom: 1px solid #e5e7eb;
}
.ms-back-btn { background: none; border: none; font-size: 18px; color: #2563EB; cursor: pointer; padding: 0 6px 0 0; }
.ms-form-title { font-size: 15px; font-weight: 600; color: #1d2129; flex: 1; text-align: center; }
.ms-btn-primary {
  background: #2563EB; color: #fff; border: none; border-radius: 8px;
  padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.ms-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.ms-btn-sm { padding: 6px 14px; font-size: 13px; border-radius: 7px; }
.ms-btn-cancel {
  flex: 1; padding: 12px 0; border-radius: 10px; border: none;
  background: #f3f4f6; color: #374151; font-size: 15px; font-weight: 600; cursor: pointer;
}

.ms-form-body { padding: 12px 14px; }
.ms-section-title {
  font-size: 14px; font-weight: 700; color: #1d2129;
  margin-bottom: 10px; margin-top: 4px;
  display: flex; align-items: center; justify-content: space-between;
}
.ms-add-link { font-size: 13px; color: #2563EB; font-weight: 500; cursor: pointer; }
.ms-field { margin-bottom: 12px; }
.ms-field label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 5px; }
.ms-input {
  width: 100%; box-sizing: border-box;
  padding: 10px 12px; border: 1.5px solid #e5e7eb; border-radius: 8px;
  font-size: 15px; color: #1d2129; background: #fff; outline: none;
  -webkit-appearance: none; appearance: none;
}
.ms-input:focus { border-color: #2563EB; }
.ms-input-disabled { background: #f9fafb; color: #9ca3af; }
.ms-textarea { min-height: 72px; resize: vertical; }

/* 商品卡片 */
.ms-goods-card {
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 12px; margin-bottom: 10px;
}
.ms-goods-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.ms-goods-name { font-size: 14px; font-weight: 600; color: #1d2129; flex: 1; margin-right: 8px; }
.ms-del-btn { background: none; border: none; font-size: 16px; color: #9ca3af; cursor: pointer; padding: 0; flex-shrink: 0; }
.ms-goods-meta { font-size: 12px; color: #9ca3af; margin-bottom: 10px; }
.ms-goods-nums { display: flex; gap: 12px; flex-wrap: wrap; }
.ms-goods-field { display: flex; align-items: center; gap: 6px; }
.ms-goods-field span { font-size: 12px; color: #6b7280; white-space: nowrap; }
.ms-stepper {
  display: inline-flex;
  align-items: center;
  width: 156px;
  height: 42px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}
.ms-stepper.disabled {
  opacity: 0.7;
}
.ms-stepper-btn {
  width: 42px;
  height: 100%;
  border: 0;
  background: #f8fafc;
  color: #475569;
  font-size: 22px;
  line-height: 1;
}
.ms-stepper-btn:active {
  background: #eef2ff;
}
.ms-stepper-btn:disabled {
  background: #f8fafc;
  color: #cbd5e1;
}
.ms-stepper-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: none;
  background: #fff;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  -moz-appearance: textfield;
}
.ms-stepper-input::-webkit-outer-spin-button,
.ms-stepper-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ms-cost-val { font-size: 14px; color: #374151; font-weight: 500; min-width: 64px; text-align: right; }
.ms-empty-sm { text-align: center; padding: 20px; color: #bbb; font-size: 13px; }

/* 结算 */
.ms-settle-cards {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;
}
.ms-settle-row {
  background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 10px 12px; display: flex; flex-direction: column; gap: 4px;
}
.ms-settle-row span { font-size: 12px; color: #6b7280; }
.ms-settle-row b { font-size: 16px; color: #1d2129; }
.blue { color: #0071e3 !important; }
.orange { color: #d97706 !important; }

/* 商品抽屉 */
.ms-drawer-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end;
}
.ms-drawer {
  width: 100%; max-height: 80vh; background: #fff;
  border-radius: 16px 16px 0 0; display: flex; flex-direction: column;
}
.ms-drawer-head {
  padding: 16px 16px 12px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #f0f0f0; font-size: 16px; font-weight: 600; color: #1a1a1a;
  flex-shrink: 0;
}
.ms-drawer-close { font-size: 18px; color: #999; cursor: pointer; }
.ms-drawer-search { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.ms-drawer-list { flex: 1; overflow-y: auto; }
.ms-goods-row {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  border-bottom: 1px solid #f5f5f5; cursor: pointer;
  transition: background 0.1s;
}
.ms-goods-row:active, .ms-goods-row.selected { background: #eff6ff; }
.ms-goods-row-check { width: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.ms-uncheck { width: 16px; height: 16px; border: 2px solid #d1d5db; border-radius: 4px; }
.ms-goods-row-info { flex: 1; min-width: 0; }
.ms-goods-row-name { font-size: 14px; font-weight: 500; color: #1d2129; }
.ms-goods-row-meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.ms-goods-row-price { font-size: 13px; color: #d97706; font-weight: 500; flex-shrink: 0; }
.ms-drawer-foot {
  display: flex; gap: 10px; padding: 12px 14px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid #f0f0f0; flex-shrink: 0;
}
.ms-drawer-foot .ms-btn-primary { flex: 1; padding: 12px 0; border-radius: 10px; font-size: 15px; }
</style>
