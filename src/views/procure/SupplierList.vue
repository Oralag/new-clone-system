<template>
  <div class="supplier-page">
    <div class="list-layout">

      <!-- 左侧分类面板 -->
      <div class="cate-panel">
        <div class="cate-header">
          <span class="cate-title">供应商分类</span>
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

      <!-- 右侧供应商列表 -->
      <div class="supplier-list-wrap">
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
            <div class="toolbar-left">
              <el-button type="primary" :icon="Plus" @click="openForm()">新增供应商</el-button>
            </div>
            <div class="toolbar-right">
              <el-upload :show-file-list="false" accept=".xlsx,.xls,.csv" :before-upload="handleImport" style="display:inline-block">
                <el-button :icon="Upload" size="small">导入</el-button>
              </el-upload>
              <el-button :icon="Download" size="small" @click="handleExport">导出</el-button>
            </div>
          </div>
          <!-- 已选提示 -->
          <div v-if="selectedRows.length > 0" class="selected-bar">
            已选 <strong>{{ selectedRows.length }}</strong> 条
            <el-button type="primary" link size="small" @click="tableRef?.clearSelection()">取消选择</el-button>
            <el-button type="danger" :icon="Delete" size="small" style="margin-left:auto" @click="handleBatchDelete">
              批量删除({{ selectedRows.length }})
            </el-button>
          </div>
          <!-- 表格 -->
          <el-table ref="tableRef" :data="filteredRows" v-loading="loading" border stripe style="width:100%"
            @selection-change="(v: any[]) => selectedRows = v">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="name" label="供应商名称" min-width="150" />
            <el-table-column prop="contact" label="联系人" width="120" />
            <el-table-column prop="mobile" label="手机号" width="130" />
            <el-table-column label="供应商分类" width="120">
              <template #default="{ row }">
                {{ getCateName(row.id) }}
              </template>
            </el-table-column>
            <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
            <el-table-column prop="bank" label="银行账户" min-width="160" show-overflow-tooltip />
            <el-table-column label="欠款" width="110" align="right">
              <template #default="{ row }">
                <span :style="getDebtBalance(row.id) > 0 ? 'color:#dc2626;font-weight:600' : ''">
                  ¥{{ getDebtBalance(row.id).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="累计采购" width="110" align="right">
              <template #default="{ row }">
                <span style="color:rgba(29,29,31,0.35)">¥{{ getTotalPurchase(row.id).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="success" size="small" link @click="openView(row)">查看</el-button>
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

    <!-- 新增/编辑供应商弹框 -->
    <el-dialog v-model="formVisible" :title="formTitle" width="520px" append-to-body>
      <el-form ref="formRef" :model="formData" label-width="90px" :disabled="isViewMode">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="name"
              :rules="[{ required: true, message: '请输入供应商名称' }]">
              <el-input v-model="formData.name" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商分类">
              <div style="display:flex;gap:4px;width:100%">
                <el-select v-model="formData.cate_id" placeholder="请选择" clearable style="flex:1">
                  <el-option v-for="c in cateOptions" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
                <el-button :icon="Plus" @click="openCateForm()" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact">
              <el-input v-model="formData.contact" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="mobile">
              <el-input v-model="formData.mobile" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="地址" prop="address">
              <el-input v-model="formData.address" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 财务信息（编辑模式显示） -->
      <div v-if="formData.id" class="finance-panel" v-loading="financeLoading">
        <div class="finance-title">往来账目</div>
        <div class="finance-grid">
          <div class="finance-item">
            <span class="fi-label">欠款金额</span>
            <span class="fi-value red">¥{{ financeInfo.debtBalance.toFixed(2) }}</span>
          </div>
          <div class="finance-item">
            <span class="fi-label">累计采购</span>
            <span class="fi-value">¥{{ financeInfo.totalPurchase.toFixed(2) }}</span>
          </div>
          <div class="finance-item">
            <span class="fi-label">累计付款</span>
            <span class="fi-value green">¥{{ financeInfo.totalPaid.toFixed(2) }}</span>
          </div>
          <div class="finance-item">
            <span class="fi-label">预付款</span>
            <span class="fi-value orange">¥{{ financeInfo.prepaid.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div v-if="formData.id && formData.create_time" class="create-time-note">创建时间：{{ formData.create_time }}</div>
        <el-button @click="formVisible = false">关闭</el-button>
        <template v-if="isViewMode">
          <el-button type="primary" @click="isViewMode = false">编辑</el-button>
        </template>
        <template v-else>
          <el-button type="primary" :loading="formSaving" @click="handleSubmit">确定</el-button>
        </template>
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

    <!-- 导入预览弹框 -->
    <el-dialog v-model="importDialogVisible" title="导入预览" width="70%" append-to-body>
      <div style="margin-bottom:10px;font-size:13px;color:rgba(29,29,31,0.35)">共 {{ importPreviewData.length }} 条，确认后导入。</div>
      <el-table :data="importPreviewData.slice(0, 10)" border size="small" max-height="320">
        <el-table-column v-for="col in (importPreviewData[0] ? Object.keys(importPreviewData[0]) : [])" :key="col" :prop="col" :label="col" min-width="120" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Edit, Delete, Search, Refresh, Download, Upload } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getSupplierList, createSupplier, updateSupplier, deleteSupplier, getProcureOrderList } from '@/api/procure'
import { getPayableList, getPayReceiptList } from '@/api/finance'
import http from '@/api/http'
import { readScopedJson, writeScopedJson } from '@/utils/storageScope'
import * as XLSX from 'xlsx'

// ── 本地分类（localStorage） ──────────────────────────────────────────────────
const CATE_KEY = 'erp_supplier_cates'
const CATE_MAP_KEY = 'erp_supplier_cate_map'  // { supplierId: cateId }

// ── 实时财务数据：采购单 + 付款单 ─────────────────────────────────────────────
const purchaseMap = ref<Record<number, number>>({})  // 累计采购
const paidMap = ref<Record<number, number>>({})       // 累计付款
const debtMap = ref<Record<number, number>>({})       // 欠款

function getDebtBalance(supplierId: number): number {
  return debtMap.value[supplierId] ?? 0
}
function getTotalPurchase(supplierId: number): number {
  return purchaseMap.value[supplierId] ?? 0
}

async function loadSupplierFinance() {
  try {
    const [orderRes, payRes] = await Promise.all([
      getProcureOrderList({ list_rows: 2000 }),
      getPayReceiptList({ list_rows: 2000 }),
    ])
    // 累计采购（已审核采购单，按行供应商拆分）
    const orders: any[] = orderRes.data?.rows ?? orderRes.data?.list ?? []
    const pMap: Record<number, number> = {}
    for (const o of orders) {
      if (Number(o.status) !== 1) continue
      const headSid = Number(o.supplier_id)
      let items: any[] = []
      try { items = JSON.parse(o.goods_info || '[]') } catch { items = [] }
      // 检查是否有行级供应商
      const hasRowSupplier = items.some((i: any) => Number(i.supplier_id))
      if (!hasRowSupplier) {
        // 单一供应商，整单金额归头部
        if (headSid) pMap[headSid] = (pMap[headSid] || 0) + Number(o.total_amount || 0)
      } else {
        // 多供应商，按行拆分
        for (const item of items) {
          const rowSid = Number(item.supplier_id) || headSid
          if (!rowSid) continue
          const rowAmount = (Number(item.num) || 0) * (Number(item.price) || 0)
          pMap[rowSid] = (pMap[rowSid] || 0) + rowAmount
        }
      }
    }
    purchaseMap.value = pMap
    // 累计付款
    const payments: any[] = payRes.data?.rows ?? payRes.data?.list ?? []
    const pmMap: Record<number, number> = {}
    for (const p of payments) {
      const sid = Number(p.supplier_id)
      if (sid) pmMap[sid] = (pmMap[sid] || 0) + Number(p.amount || 0)
    }
    paidMap.value = pmMap
    // 欠款 = 采购 - 付款
    const dMap: Record<number, number> = {}
    const allIds = new Set([...Object.keys(pMap), ...Object.keys(pmMap)].map(Number))
    for (const sid of allIds) {
      dMap[sid] = Math.max(0, (pMap[sid] || 0) - (pmMap[sid] || 0))
    }
    debtMap.value = dMap
  } catch { /* ignore */ }
}

// ── 财务信息（编辑弹框内） ────────────────────────────────────────────────────
const financeLoading = ref(false)
const financeInfo = reactive({ debtBalance: 0, totalPurchase: 0, totalPaid: 0, prepaid: 0 })

async function loadFinanceInfo(supplierId: number) {
  financeLoading.value = true
  try {
    financeInfo.totalPurchase = purchaseMap.value[supplierId] ?? 0
    financeInfo.totalPaid = paidMap.value[supplierId] ?? 0
    financeInfo.prepaid = Math.max(0, financeInfo.totalPaid - financeInfo.totalPurchase)
    financeInfo.debtBalance = Math.max(0, financeInfo.totalPurchase - financeInfo.totalPaid)
  } finally {
    financeLoading.value = false
  }
}

interface CateItem { id: number; name: string }

function loadCatesFromStorage(): CateItem[] {
  return readScopedJson<CateItem[]>(CATE_KEY, [])
}
function saveCatesToStorage(list: CateItem[]) {
  writeScopedJson(CATE_KEY, list)
}
function loadCateMap(): Record<number, number> {
  return readScopedJson<Record<number, number>>(CATE_MAP_KEY, {})
}
function saveCateMap(map: Record<number, number>) {
  writeScopedJson(CATE_MAP_KEY, map)
}

const cateOptions = ref<CateItem[]>(loadCatesFromStorage())
const cateMap = ref<Record<number, number>>(loadCateMap())
const cateKeyword = ref('')
const selectedCateId = ref<number | null>(null)

const filteredCates = computed(() => {
  if (!cateKeyword.value) return cateOptions.value
  return cateOptions.value.filter(c => c.name.includes(cateKeyword.value))
})

function getCateName(supplierId: number): string {
  const cateId = cateMap.value[supplierId]
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
  ElMessageBox.confirm('确定删除该分类？已关联供应商的分类将被清除。', '提示', { type: 'warning' }).then(() => {
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
    else { currentPage.value = 1; loadData() }
    ElMessage.success('删除成功')
  })
}

function selectCate(id: number | null) {
  selectedCateId.value = id
  currentPage.value = 1
  loadData()
}

// ── 供应商列表（自管理，支持前端分类过滤） ────────────────────────────────────
const allRows = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const selectedRows = ref<any[]>([])
const tableRef = ref<any>()

const filteredRows = computed(() => {
  if (selectedCateId.value === null) return allRows.value
  return allRows.value.filter(row => cateMap.value[row.id] === selectedCateId.value)
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await getSupplierList({
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

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handleReset() {
  keyword.value = ''
  currentPage.value = 1
  loadData()
}

// ── 供应商表单 ────────────────────────────────────────────────────────────────
const formVisible = ref(false)
const isViewMode = ref(false)
const formTitle = ref('新增供应商')
const formSaving = ref(false)
const formRef = ref()
const formData = reactive<any>({
  id: 0, name: '', contact: '', mobile: '', cate_id: null, address: '', remark: '',
})

function openView(row: any) {
  isViewMode.value = true
  formTitle.value = '查看供应商'
  const nextData = {
    id: 0,
    name: '',
    contact: '',
    mobile: '',
    cate_id: null as any,
    address: '',
    remark: '',
    ...row,
  }
  nextData.cate_id = cateMap.value[row.id] ?? null
  Object.assign(formData, nextData)
  formVisible.value = true
  financeInfo.debtBalance = 0; financeInfo.totalPurchase = 0; financeInfo.totalPaid = 0; financeInfo.prepaid = 0
  loadFinanceInfo(row.id)
}

function openForm(row?: any) {
  isViewMode.value = false
  formTitle.value = row ? '编辑供应商' : '新增供应商'
  const nextData = {
    id: 0,
    name: '',
    contact: '',
    mobile: '',
    cate_id: null as any,
    address: '',
    remark: '',
    ...(row ?? {}),
  }
  nextData.cate_id = row ? (cateMap.value[row.id] ?? null) : null
  Object.assign(formData, nextData)
  formVisible.value = true
  if (row?.id) {
    financeInfo.debtBalance = 0
    financeInfo.totalPurchase = 0
    financeInfo.totalPaid = 0
    financeInfo.prepaid = 0
    loadFinanceInfo(row.id, row.name)
  }
}

async function handleSubmit() {
  try { await formRef.value?.validate() } catch { return }
  formSaving.value = true
  try {
    const { cate_id, ...payload } = formData
    let supplierId = formData.id
    if (supplierId) {
      await updateSupplier(payload)
    } else {
      const res = await createSupplier(payload)
      // Handle various response shapes
      supplierId = res?.data?.id ?? res?.data?.data?.id ?? res?.id ?? (typeof res?.data === 'number' ? res.data : null)
    }
    // 保存分类关联到本地
    if (supplierId) {
      const map = { ...cateMap.value }
      if (cate_id) map[supplierId] = cate_id
      else delete map[supplierId]
      cateMap.value = map
      saveCateMap(map)
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
  await ElMessageBox.confirm('确定删除该供应商吗？', '提示', { type: 'warning' })
  await deleteSupplier(id)
  const map = { ...cateMap.value }
  delete map[id]
  cateMap.value = map
  saveCateMap(map)
  ElMessage.success('删除成功')
  loadData()
}

async function handleBatchDelete() {
  const ids = selectedRows.value.map((r: any) => r.id).filter(Boolean)
  if (!ids.length) return
  await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个供应商吗？`, '批量删除', { type: 'warning' })
  await http.post('/procure/supplier/batchDel', { ids })
  ElMessage.success(`已删除 ${ids.length} 个供应商`)
  selectedRows.value = []
  loadData()
}

function handleExport() {
  const rows = allRows.value
  if (!rows.length) { ElMessage.warning('暂无数据可导出'); return }
  const data = rows.map(r => ({
    '供应商名称': r.name, '联系人': r.contact, '手机号': r.mobile,
    '地址': r.address, '银行账户': r.bank, '备注': r.remark,
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Sheet1')
  XLSX.writeFile(wb, `供应商列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`)
  ElMessage.success(`已导出 ${rows.length} 条数据`)
}

const importDialogVisible = ref(false)
const importPreviewData = ref<any[]>([])
const importLoading = ref(false)

function handleImport(file: File): boolean {
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target!.result as ArrayBuffer)
    const wb = XLSX.read(data, { type: 'array' })
    const json: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
    if (!json.length) { ElMessage.warning('Excel文件无数据'); return }
    importPreviewData.value = json
    importDialogVisible.value = true
  }
  reader.readAsArrayBuffer(file)
  return false
}

async function confirmImport() {
  importLoading.value = true
  let success = 0, failed = 0
  for (const row of importPreviewData.value) {
    try {
      const mapped: any = {}
      if (row['供应商名称'] || row['name']) mapped.name = row['供应商名称'] || row['name']
      if (row['联系人'] || row['contact']) mapped.contact = row['联系人'] || row['contact']
      if (row['手机号'] || row['mobile']) mapped.mobile = row['手机号'] || row['mobile']
      if (row['地址'] || row['address']) mapped.address = row['地址'] || row['address']
      if (row['银行账户'] || row['bank']) mapped.bank = row['银行账户'] || row['bank']
      if (row['备注'] || row['remark']) mapped.remark = row['备注'] || row['remark']
      if (!mapped.name) { failed++; continue }
      await createSupplier(mapped)
      success++
    } catch { failed++ }
  }
  importLoading.value = false
  importDialogVisible.value = false
  ElMessage.success(`导入完成：成功 ${success} 条${failed > 0 ? `，失败 ${failed} 条` : ''}`)
  loadData()
}

onMounted(async () => {
  await loadData()
  loadSupplierFinance()
})
</script>

<style scoped>
.create-time-note { font-size: 11px; color: #c0c4cc; text-align: right; margin-bottom: 8px; }
.finance-panel { margin-top: 16px; border-top: 1px solid #f5f5f7; padding-top: 12px; }
.finance-title { font-size: 13px; font-weight: 600; color: #1d1d1f; margin-bottom: 10px; }
.finance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.finance-item { background: #f5f7fa; border-radius: 10px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
.fi-label { font-size: 12px; color: rgba(29,29,31,0.35); }
.fi-value { font-size: 14px; font-weight: 600; color: #1d1d1f; }
.fi-value.green { color: #16a34a; }
.fi-value.red { color: #dc2626; }
.fi-value.orange { color: #ea580c; }
.supplier-page { height: 100%; }
.toolbar-left { display: flex; gap: 8px; align-items: center; }
.toolbar-right { display: flex; gap: 4px; align-items: center; }
.selected-bar { margin-bottom: 8px; padding: 6px 12px; background: #e8f3ff; border-radius: 8px; font-size: 13px; color: #0071e3; display: flex; align-items: center; gap: 8px; }

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
  border-radius: 12px;
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
  border-bottom: 1px solid #f5f5f7;
  flex-shrink: 0;
}

.cate-title { font-size: 13px; font-weight: 600; color: #1d1d1f; }
.cate-search { padding: 8px 10px; flex-shrink: 0; }
.cate-tree { flex: 1; overflow-y: auto; }

.cate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  cursor: pointer;
  transition: background 0.12s;
}
.cate-item:hover { background: #f5f7ff; }
.cate-item:hover .cate-item-actions { opacity: 1; }
.cate-item.active { background: rgba(0,113,227,0.08); color: #0071e3; font-weight: 500; }

.cate-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cate-item-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.12s; flex-shrink: 0; }
.act-icon { font-size: 13px; color: rgba(29,29,31,0.35); cursor: pointer; padding: 2px; }
.act-icon:hover { color: #0071e3; }
.act-icon.danger:hover { color: #dc2626; }
.cate-empty { text-align: center; color: rgba(29,29,31,0.35); font-size: 12px; padding: 20px 0; }

.supplier-list-wrap { flex: 1; overflow: hidden; }

@media (max-width: 767px) {
  .list-layout { flex-direction: column !important; height: auto !important; }
  .cate-panel { width: 100% !important; margin-right: 0 !important; margin-bottom: 8px; border-radius: 14px; max-height: none !important; overflow: visible !important; }
  .cate-search { display: none !important; }
  .cate-header { border-bottom: none !important; padding-bottom: 4px !important; }
  .cate-tree { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; overflow-x: auto !important; overflow-y: visible !important; gap: 6px; padding: 6px 10px !important; height: auto !important; scrollbar-width: none; }
  .cate-tree::-webkit-scrollbar { display: none; }
  .cate-item { flex-shrink: 0 !important; border-radius: 20px !important; padding: 5px 14px !important; background: #f5f5f7; border: 1px solid transparent; white-space: nowrap; display: flex !important; }
  .cate-item.active { background: rgba(0,113,227,0.08) !important; color: #0071e3 !important; border-color: rgba(0,113,227,0.2) !important; }
  .cate-item-actions { display: none !important; }
  .supplier-list-wrap { overflow: visible !important; }
}

.sc-table { background: #fff; border-radius: 12px; padding: 16px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }

.sc-search {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f7;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.search-actions { display: flex; gap: 8px; }

.sc-toolbar { margin-bottom: 12px; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }

.sc-pagination { display: flex; justify-content: flex-end; margin-top: 16px; flex-shrink: 0; }

@media (max-width: 767px) {
  .list-layout { flex-direction: column !important; height: auto !important; }
  .cate-panel { width: 100% !important; margin-right: 0 !important; margin-bottom: 8px; border-radius: 14px; max-height: none !important; overflow: visible !important; }
  .cate-search { display: none !important; }
  .cate-header { border-bottom: none !important; padding-bottom: 4px !important; }
  .cate-tree { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; overflow-x: auto !important; overflow-y: visible !important; gap: 6px; padding: 6px 10px !important; height: auto !important; scrollbar-width: none; }
  .cate-tree::-webkit-scrollbar { display: none; }
  .cate-item { flex-shrink: 0 !important; border-radius: 20px !important; padding: 5px 14px !important; background: #f5f5f7; border: 1px solid transparent; white-space: nowrap; display: flex !important; }
  .cate-item.active { background: rgba(0,113,227,0.08) !important; color: #0071e3 !important; border-color: rgba(0,113,227,0.2) !important; }
  .cate-item-actions { display: none !important; }
  .supplier-list-wrap { overflow: visible !important; }
}
</style>
