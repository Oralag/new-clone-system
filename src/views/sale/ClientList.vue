<template>
  <div class="client-page">
    <div class="list-layout">

      <!-- 左侧分类面板 -->
      <div class="cate-panel">
        <div class="cate-header">
          <span class="cate-title">客户分类</span>
          <el-button :icon="Plus" size="small" circle @click="openCateForm()" />
        </div>
        <div class="cate-search">
          <el-input v-model="cateKeyword" placeholder="搜索分类" clearable size="small" />
        </div>
        <div class="cate-tree">
          <div class="cate-item" :class="{ active: selectedCateId === null }" @click="selectCate(null)">
            全部
          </div>
          <template v-for="item in filteredCates" :key="item.id">
            <div class="cate-item" :class="{ active: selectedCateId === item.id }" @click="selectCate(item.id)">
              <span class="cate-item-name">{{ item.name }}</span>
              <span class="cate-item-actions">
                <el-icon class="act-icon" @click.stop="openCateForm(item)"><Edit /></el-icon>
                <el-icon class="act-icon danger" @click.stop="handleDeleteCate(item.id)"><Delete /></el-icon>
              </span>
            </div>
          </template>
          <div v-if="filteredCates.length === 0" class="cate-empty">暂无分类</div>
        </div>
      </div>

      <!-- 右侧客户列表 -->
      <div class="client-list-wrap">
        <div class="sc-table">
          <!-- 搜索栏 -->
          <div class="sc-search">
            <el-input v-model="keyword" placeholder="名称/手机号" clearable style="width:200px"
              @keyup.enter="handleSearch" />
            <div class="search-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </div>
          </div>
          <!-- 工具栏 -->
          <div class="sc-toolbar">
            <el-button type="primary" :icon="Plus" @click="openForm()">新增客户</el-button>
          </div>
          <!-- 表格 -->
          <el-table :data="filteredRows" v-loading="loading" border stripe style="width:100%">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="nickname" label="客户名称" min-width="150" />
            <el-table-column prop="mobile" label="手机号" width="130" />
            <el-table-column label="客户分类" width="120">
              <template #default="{ row }">
                {{ getCateName(row.id) }}
              </template>
            </el-table-column>
            <el-table-column label="客户等级" width="100">
              <template #default="{ row }">
                {{ getLevelName(row.id) }}
              </template>
            </el-table-column>
            <el-table-column label="来源" width="100">
              <template #default="{ row }">
                {{ getSourceName(row.source_id || row.source) }}
              </template>
            </el-table-column>
            <el-table-column label="余额" width="100" align="right">
              <template #default="{ row }">
                {{ getCustomerBalance(row.id, row.balance).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="openView(row)">查看</el-button>
                <el-button type="primary" size="small" link @click="openForm(row)">编辑</el-button>
                <el-button type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <!-- 分页 -->
          <div class="sc-pagination" v-if="total > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[20, 50, 100, 200]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="() => { currentPage = 1; loadData() }"
              @current-change="loadData"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 查看客户弹框 -->
    <el-dialog v-model="viewVisible" title="客户详情" width="480px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="客户名称">{{ viewRow.nickname }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ viewRow.mobile || '—' }}</el-descriptions-item>
        <el-descriptions-item label="客户分类">{{ getCateName(viewRow.id) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="客户等级">{{ getLevelName(viewRow.id) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ getSourceName(viewRow.source_id || viewRow.source) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="余额">{{ viewRow.balance ?? '0' }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ viewRow.address || '—' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ viewRow.remark || '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ viewRow.create_time || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
        <el-button type="primary" @click="viewVisible = false; openForm(viewRow)">编辑</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑客户弹框 -->
    <el-dialog v-model="formVisible" :title="formTitle" width="560px" append-to-body>
      <el-form ref="formRef" :model="formData" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="nickname"
              :rules="[{ required: true, message: '请输入客户名称' }]">
              <el-input v-model="formData.nickname" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="mobile">
              <el-input v-model="formData.mobile" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户分类">
              <div style="display:flex;gap:4px;width:100%">
                <el-select v-model="formData.cate_id" placeholder="请选择" clearable style="flex:1">
                  <el-option v-for="c in cateOptions" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
                <el-button :icon="Plus" @click="openCateForm()" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户等级">
              <el-select v-model="formData.level_id" placeholder="请选择等级" clearable style="width:100%">
                <el-option v-for="lv in levelOptions" :key="lv.id" :label="lv.name" :value="lv.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源">
              <el-select v-model="formData.source_id" placeholder="请选择来源" clearable style="width:100%">
                <el-option label="直接拜访" :value="1" />
                <el-option label="客户转介绍" :value="2" />
                <el-option label="电话开发" :value="3" />
                <el-option label="网络平台" :value="4" />
                <el-option label="展会活动" :value="5" />
                <el-option label="其他" :value="6" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="地址">
              <el-input v-model="formData.address" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 财务信息（编辑模式显示） -->
      <div v-if="formData.id" class="finance-panel" v-loading="financeLoading">
        <div class="finance-title">财务信息</div>
        <div class="finance-grid">
          <div class="finance-item">
            <span class="fi-label">预付款余额</span>
            <span class="fi-value green">¥{{ financeInfo.prepayBalance.toFixed(2) }}</span>
          </div>
          <div class="finance-item">
            <span class="fi-label">累计充值</span>
            <span class="fi-value">¥{{ financeInfo.totalPrepay.toFixed(2) }}</span>
          </div>
          <div class="finance-item">
            <span class="fi-label">累计消费</span>
            <span class="fi-value red">¥{{ financeInfo.totalConsumed.toFixed(2) }}</span>
          </div>
          <div class="finance-item">
            <span class="fi-label">未收款</span>
            <span class="fi-value orange">¥{{ financeInfo.unReceived.toFixed(2) }}</span>
          </div>
        </div>
        <div class="finance-actions">
          <el-button type="success" size="small" :icon="Plus" @click="openPrepayDialog">充值预付款</el-button>
          <el-button size="small" @click="viewReceivable">查看应收记录</el-button>
        </div>
      </div>
      <div v-if="formData.id && formData.create_time" class="create-time-note">
        创建时间：{{ formData.create_time }}
      </div>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="formSaving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 充值预付款弹框 -->
    <el-dialog v-model="prepayVisible" title="充值预付款" width="380px" append-to-body>
      <el-form :model="prepayForm" label-width="90px">
        <el-form-item label="客户">
          <el-input :value="formData.nickname" disabled />
        </el-form-item>
        <el-form-item label="充值金额" required>
          <el-input-number v-model="prepayForm.amount" :min="0.01" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="收款账户">
          <div style="display:flex;gap:4px;width:100%">
            <el-select v-model="prepayForm.account_name" placeholder="请选择账户" style="flex:1">
              <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.name" />
              <el-option label="现金" value="现金" />
            </el-select>
            <el-button :icon="Plus" @click="addFundVisible = true" />
          </div>
        </el-form-item>
        <el-form-item label="收款日期">
          <el-date-picker v-model="prepayForm.receipt_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="prepayForm.remark" placeholder="如：预付款充值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="prepayVisible = false">取消</el-button>
        <el-button type="primary" :loading="prepaySaving" @click="submitPrepay">确认充值</el-button>
      </template>
    </el-dialog>

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

    <!-- 分类新增/编辑弹框 -->
    <el-dialog v-model="cateFormVisible" :title="cateFormTitle" width="360px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="分类名称">
          <el-input v-model="cateFormName" placeholder="请输入分类名称" @keyup.enter="handleSaveCate" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cateFormVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCate">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Edit, Delete, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getSaleCustomerList, getSaleCustomerDetail, createSaleCustomer, updateSaleCustomer, deleteSaleCustomer } from '@/api/sale'
import { loadLevels, loadLevelMap, saveLevelMap, type LevelItem } from '@/utils/customerLevel'
import { getCollectReceiptList, createCollectReceipt, getReceivableList, getFundList, createFund } from '@/api/finance'

const router = useRouter()

// ── 本地余额（localStorage） ──────────────────────────────────────────────────
const BALANCE_MAP_KEY = 'erp_customer_balance_map'  // { customerId: balance }
function loadBalanceMap(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(BALANCE_MAP_KEY) || '{}') } catch { return {} }
}
function saveBalanceMap(map: Record<number, number>) {
  localStorage.setItem(BALANCE_MAP_KEY, JSON.stringify(map))
}
const balanceMap = ref<Record<number, number>>(loadBalanceMap())
function getCustomerBalance(customerId: number, backendBalance: any): number {
  if (balanceMap.value[customerId] !== undefined) return balanceMap.value[customerId]
  return Number(backendBalance) || 0
}

// ── 本地分类（localStorage） ──────────────────────────────────────────────────
const CATE_KEY = 'erp_customer_cates'
const CATE_MAP_KEY = 'erp_customer_cate_map'  // { customerId: cateId }

interface CateItem { id: number; name: string }

function loadCatesFromStorage(): CateItem[] {
  try { return JSON.parse(localStorage.getItem(CATE_KEY) || '[]') } catch { return [] }
}
function saveCatesToStorage(list: CateItem[]) {
  localStorage.setItem(CATE_KEY, JSON.stringify(list))
}
function loadCateMap(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(CATE_MAP_KEY) || '{}') } catch { return {} }
}
function saveCateMap(map: Record<number, number>) {
  localStorage.setItem(CATE_MAP_KEY, JSON.stringify(map))
}

const cateOptions = ref<CateItem[]>(loadCatesFromStorage())
const cateMap = ref<Record<number, number>>(loadCateMap())
const cateKeyword = ref('')
const selectedCateId = ref<number | null>(null)

// ── 客户等级（localStorage） ──────────────────────────────────────────────────
const LEVEL_MAP_KEY = 'erp_customer_level_map'
function loadCustomerLevelMap(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(LEVEL_MAP_KEY) || '{}') } catch { return {} }
}
function saveCustomerLevelMap(map: Record<number, number>) {
  localStorage.setItem(LEVEL_MAP_KEY, JSON.stringify(map))
}
const levelOptions = ref<LevelItem[]>(loadLevels())
const customerLevelMap = ref<Record<number, number>>(loadCustomerLevelMap())

function getLevelName(customerId: number): string {
  const levelId = customerLevelMap.value[customerId]
  if (!levelId) return ''
  return levelOptions.value.find(l => l.id === levelId)?.name ?? ''
}

const filteredCates = computed(() => {
  if (!cateKeyword.value) return cateOptions.value
  return cateOptions.value.filter(c => c.name.includes(cateKeyword.value))
})

function getCateName(customerId: number): string {
  const cateId = cateMap.value[customerId]
  if (!cateId) return ''
  return cateOptions.value.find(c => c.id === cateId)?.name ?? ''
}

// 分类新增/编辑
const cateFormVisible = ref(false)
const cateFormTitle = ref('新增分类')
const cateFormName = ref('')
let editingCateId: number | null = null

function openCateForm(row?: CateItem) {
  editingCateId = row ? row.id : null
  cateFormName.value = row ? row.name : ''
  cateFormTitle.value = row ? '编辑分类' : '新增分类'
  cateFormVisible.value = true
}

function handleSaveCate() {
  const name = cateFormName.value.trim()
  if (!name) { ElMessage.warning('请输入分类名称'); return }
  const list = [...cateOptions.value]
  if (editingCateId !== null) {
    const idx = list.findIndex(c => c.id === editingCateId)
    if (idx !== -1) list[idx] = { id: editingCateId, name }
  } else {
    list.push({ id: Date.now(), name })
  }
  cateOptions.value = list
  saveCatesToStorage(list)
  cateFormVisible.value = false
  ElMessage.success('操作成功')
}

function handleDeleteCate(id: number) {
  ElMessageBox.confirm('确定删除该分类？已关联客户的分类将被清除。', '提示', { type: 'warning' }).then(() => {
    const list = cateOptions.value.filter(c => c.id !== id)
    cateOptions.value = list
    saveCatesToStorage(list)
    const map = { ...cateMap.value }
    for (const k of Object.keys(map)) {
      if (map[Number(k)] === id) delete map[Number(k)]
    }
    cateMap.value = map
    saveCateMap(map)
    if (selectedCateId.value === id) selectCate(null)
    else refilter()   // 刷新当前视图
    ElMessage.success('删除成功')
  })
}

function selectCate(id: number | null) {
  selectedCateId.value = id
  refilter()
}

// ── 客户列表（自管理，支持前端分类过滤） ─────────────────────────────────────
const allRows = ref<any[]>([])     // 当前页后端返回的全量数据
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const keyword = ref('')

// 按选中分类二次过滤
const filteredRows = computed(() => {
  if (selectedCateId.value === null) return allRows.value
  return allRows.value.filter(row => cateMap.value[row.id] === selectedCateId.value)
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await getSaleCustomerList({
      page: currentPage.value,
      list_rows: pageSize.value,
      keyword: keyword.value || undefined,
    })
    const data = res?.data || res
    allRows.value = data?.rows || data?.list || data?.data || []
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

function refilter() {
  // 分类切换只是 computed 重算，不需要重新请求
  // 但若切换分类后当前页没有数据，回到第一页重新拉
  currentPage.value = 1
  loadData()
}

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handleReset() {
  keyword.value = ''
  currentPage.value = 1
  loadData()
}

// ── 客户表单 ──────────────────────────────────────────────────────────────────
const formVisible = ref(false)
const formTitle = ref('新增客户')
const formSaving = ref(false)
const formRef = ref()
const formData = reactive<any>({
  id: 0, nickname: '', mobile: '', cate_id: null, level_id: null, source: null, source_id: null, address: '', remark: '',
})

function openForm(row?: any) {
  formTitle.value = row ? '编辑客户' : '新增客户'
  Object.assign(formData, {
    id: 0, nickname: '', mobile: '', cate_id: null, level_id: null, source: null, source_id: null, address: '', remark: '',
    ...(row ?? {}),
    cate_id: row ? (cateMap.value[row.id] ?? null) : null,
    level_id: row ? (customerLevelMap.value[row.id] ?? null) : null,
  })
  formVisible.value = true
  // 编辑模式：加载财务信息
  if (row?.id) {
    financeInfo.prepayBalance = 0
    financeInfo.totalPrepay = 0
    financeInfo.totalConsumed = 0
    financeInfo.unReceived = 0
    loadFinanceInfo(row.id, row.nickname)
  }
}

async function handleSubmit() {
  try { await formRef.value?.validate() } catch { return }
  formSaving.value = true
  try {
    const { cate_id, level_id, ...payload } = formData
    let customerId = formData.id
    if (customerId) {
      await updateSaleCustomer(payload)
    } else {
      const res = await createSaleCustomer(payload)
      customerId = res.data?.id ?? res.data
    }
    // 保存分类关联到本地
    if (customerId) {
      const cMap = { ...cateMap.value }
      if (cate_id) cMap[customerId] = cate_id
      else delete cMap[customerId]
      cateMap.value = cMap
      saveCateMap(cMap)
      // 保存等级关联到本地
      const lMap = { ...customerLevelMap.value }
      if (level_id) lMap[customerId] = level_id
      else delete lMap[customerId]
      customerLevelMap.value = lMap
      saveCustomerLevelMap(lMap)
    }
    ElMessage.success('操作成功')
    formVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  } finally {
    formSaving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该客户吗？', '提示', { type: 'warning' })
  await deleteSaleCustomer(id)
  const cMap = { ...cateMap.value }
  delete cMap[id]
  cateMap.value = cMap
  saveCateMap(cMap)
  const lMap = { ...customerLevelMap.value }
  delete lMap[id]
  customerLevelMap.value = lMap
  saveCustomerLevelMap(lMap)
  ElMessage.success('删除成功')
  loadData()
}

// ── 查看 ──────────────────────────────────────────────────────────────────────
const viewVisible = ref(false)
const viewRow = ref<any>({})

function openView(row: any) {
  viewRow.value = row
  viewVisible.value = true
}

const SOURCE_NAMES: Record<number, string> = {
  1: '直接拜访', 2: '客户转介绍', 3: '电话开发', 4: '网络平台', 5: '展会活动', 6: '其他',
}
function getSourceName(source: any): string {
  return SOURCE_NAMES[Number(source)] ?? ''
}

// ── 财务信息 ──────────────────────────────────────────────────────────────────
const financeLoading = ref(false)
const financeInfo = reactive({
  prepayBalance: 0,
  totalPrepay: 0,
  totalConsumed: 0,
  unReceived: 0,
})

async function loadFinanceInfo(customerId: number, customerName: string) {
  financeLoading.value = true
  try {
    // 查收款单（预付款充值记录）
    const receiptRes = await getCollectReceiptList({ customer_name: customerName, list_rows: 500 })
    const receipts: any[] = receiptRes?.data?.rows ?? receiptRes?.data?.list ?? []
    const prepayReceipts = receipts.filter((r: any) =>
      r.remark?.includes('预付款') || r.customer_name === customerName
    )
    const totalPrepay = prepayReceipts.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)

    // 查应收账款（消费记录）
    const receivableRes = await getReceivableList({ customer_name: customerName, list_rows: 500 })
    const receivables: any[] = receivableRes?.data?.rows ?? receivableRes?.data?.list ?? []
    const totalConsumed = receivables.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const totalReceived = receivables.reduce((s: number, r: any) => s + Number(r.received_amount || 0), 0)
    const unReceived = Math.max(0, totalConsumed - totalReceived)

    financeInfo.totalPrepay = totalPrepay
    financeInfo.totalConsumed = totalConsumed
    financeInfo.unReceived = unReceived
    financeInfo.prepayBalance = Math.max(0, totalPrepay - totalConsumed)
    // 同步余额到 balanceMap，确保列表显示正确
    const bMap = { ...balanceMap.value }
    bMap[customerId] = financeInfo.prepayBalance
    balanceMap.value = bMap
    saveBalanceMap(bMap)
  } catch {
    // 静默失败，不影响主流程
  } finally {
    financeLoading.value = false
  }
}

// ── 预付款充值 ────────────────────────────────────────────────────────────────
const prepayVisible = ref(false)
const prepaySaving = ref(false)
const prepayForm = reactive({
  amount: 0,
  account_name: '',
  receipt_date: new Date().toISOString().slice(0, 10),
  remark: '预付款充值',
})
const fundOptions = ref<any[]>([])

async function loadFunds() {
  try {
    const res = await getFundList({ list_rows: 100 })
    fundOptions.value = res?.data?.rows ?? res?.data?.list ?? []
  } catch { /* ignore */ }
}

const addFundVisible = ref(false)
const addFundLoading = ref(false)
const fundForm = reactive({ name: '', balance: 0 })

async function submitAddFund() {
  if (!fundForm.name.trim()) { ElMessage.warning('请输入账户名称'); return }
  addFundLoading.value = true
  try {
    await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success('新增账户成功')
    addFundVisible.value = false
    await loadFunds()
    prepayForm.account_name = fundForm.name.trim()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '新增失败')
  } finally {
    addFundLoading.value = false
  }
}

function openPrepayDialog() {
  prepayForm.amount = 0
  prepayForm.account_name = ''
  prepayForm.receipt_date = new Date().toISOString().slice(0, 10)
  prepayForm.remark = '预付款充值'
  prepayVisible.value = true
}

async function submitPrepay() {
  if (!prepayForm.amount || prepayForm.amount <= 0) {
    ElMessage.warning('请输入充值金额'); return
  }
  prepaySaving.value = true
  try {
    await createCollectReceipt({
      contact_type: 'customer',
      contact_id: formData.id,
      contact_name: formData.nickname || formData.name,
      amount: prepayForm.amount,
      account_name: prepayForm.account_name || '现金',
      receipt_date: prepayForm.receipt_date,
      remark: prepayForm.remark || '预付款充值',
    })
    ElMessage.success('充值成功，已记入财务收款单')
    prepayVisible.value = false
    // 本地维护余额（后端不同步balance字段）
    const currentBalance = getCustomerBalance(formData.id, allRows.value.find((r: any) => r.id === formData.id)?.balance)
    const newBalance = currentBalance + prepayForm.amount
    const bMap = { ...balanceMap.value }
    bMap[formData.id] = newBalance
    balanceMap.value = bMap
    saveBalanceMap(bMap)
    loadFinanceInfo(formData.id, formData.nickname)
  } catch (e: any) {
    ElMessage.error(e?.message ?? '充值失败')
  } finally {
    prepaySaving.value = false
  }
}

function viewReceivable() {
  router.push('/finance/receivable')
}

onMounted(() => {
  loadData()
  loadFunds()
})
</script>

<style scoped>
.client-page { height: 100%; }

.list-layout {
  display: flex;
  height: calc(100vh - 110px);
  min-height: 500px;
}

.cate-panel {
  width: 180px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 12px;
}

.cate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  border-bottom: 1px solid #f2f3f5;
  flex-shrink: 0;
}

.cate-title { font-size: 13px; font-weight: 600; color: #1d2129; }
.cate-search { padding: 8px 10px; flex-shrink: 0; }
.cate-tree { flex: 1; overflow-y: auto; }

.cate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  color: #4e5969;
  cursor: pointer;
  transition: background 0.12s;
}
.cate-item:hover { background: #f5f7ff; }
.cate-item:hover .cate-item-actions { opacity: 1; }
.cate-item.active { background: #e8f0fe; color: #165dff; font-weight: 500; }

.cate-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cate-item-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.12s; flex-shrink: 0; }
.act-icon { font-size: 13px; color: #86909c; cursor: pointer; padding: 2px; }
.act-icon:hover { color: #165dff; }
.act-icon.danger:hover { color: #f53f3f; }
.cate-empty { text-align: center; color: #86909c; font-size: 12px; padding: 20px 0; }

.client-list-wrap { flex: 1; overflow: hidden; }

.sc-table { background: #fff; border-radius: 8px; padding: 16px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }

.sc-search {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.search-actions { display: flex; gap: 8px; }

.sc-toolbar { margin-bottom: 12px; flex-shrink: 0; }

.sc-pagination { display: flex; justify-content: flex-end; margin-top: 16px; flex-shrink: 0; }

.finance-panel {
  margin-top: 16px;
  border-top: 1px solid #f2f3f5;
  padding-top: 12px;
}
.finance-title { font-size: 13px; font-weight: 600; color: #1d2129; margin-bottom: 10px; }
.finance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.finance-item { background: #f5f7fa; border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
.fi-label { font-size: 12px; color: #86909c; }
.fi-value { font-size: 14px; font-weight: 600; color: #1d2129; }
.fi-value.green { color: #00b42a; }
.fi-value.red { color: #f53f3f; }
.fi-value.orange { color: #ff7d00; }
.finance-actions { display: flex; gap: 8px; }
.create-time-note { font-size: 11px; color: #c0c4cc; margin-top: 10px; text-align: right; }
</style>
