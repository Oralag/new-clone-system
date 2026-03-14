<template>
  <div class="stock-page">
    <div class="stock-sidebar">
      <div class="sidebar-col">
        <div class="sidebar-label">仓库</div>
        <div class="sidebar-section">
          <div :class="['sidebar-item', selectedWarehouse === 0 ? 'active' : '']" @click="selectWarehouse(0)">全部</div>
          <div
            v-for="warehouse in warehouses"
            :key="warehouse.id"
            :class="['sidebar-item', selectedWarehouse === warehouse.id ? 'active' : '']"
            @click="selectWarehouse(warehouse.id)"
          >
            {{ warehouse.name }}
          </div>
        </div>
      </div>

      <div class="sidebar-divider" />

      <div class="sidebar-col">
        <div class="sidebar-label">分类</div>
        <div class="sidebar-section">
          <div :class="['sidebar-item', selectedCate === 0 ? 'active' : '']" @click="selectCate(0)">全部</div>
          <div
            v-for="cate in categories"
            :key="cate.id"
            :class="['sidebar-item', selectedCate === cate.id ? 'active' : '']"
            @click="selectCate(cate.id)"
          >
            <span class="cate-name">{{ cate.name }}</span>
            <span class="cate-actions" @click.stop>
              <el-button type="primary" link size="small" @click.stop="openEditCate(cate)">编辑</el-button>
              <el-button type="danger" link size="small" @click.stop="handleDeleteCate(cate)">删除</el-button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div style="flex:1;min-width:0">
      <el-card>
        <div class="stock-topbar">
          <div class="topbar-left">
            <span v-for="item in overviewStats" :key="item.label" class="stat-label">
              {{ item.label }}
              <strong :class="item.label === '负库存' && item.value > 0 ? 'stat-red' : item.label === '库存不足' && item.value > 0 ? 'stat-orange' : 'stat-blue'">{{ item.value }}</strong>
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span :title="selectionScopeText" style="font-size:12px;color:#999">{{ stockHealthHint }}</span>
            <el-select v-model="statusFilter" size="small" style="width:110px" @change="refreshWithFirstPage">
              <el-option label="全部" value="all" />
              <el-option label="库存不足" value="low" />
              <el-option label="零库存" value="zero" />
              <el-option label="正常" value="normal" />
            </el-select>
            <el-input
              v-model="keyword"
              placeholder="商品名称/编码"
              clearable
              size="small"
              style="width:200px"
              @change="refreshWithFirstPage"
            >
              <template #append>
                <el-button :icon="Search" @click="refreshWithFirstPage" />
              </template>
            </el-input>
          </div>
        </div>

        <el-table v-loading="loading" :data="tableData" border stripe size="small" style="width:100%;margin-top:8px">
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column prop="goods_name" label="商品名称" min-width="150" />
          <el-table-column prop="goods_sn" label="商品编码" width="130" />
          <el-table-column prop="cate_name" label="分类" width="100" />
          <el-table-column prop="spec" label="规格" width="90" />
          <el-table-column prop="unit_name" label="单位" width="65" align="center" />
          <el-table-column label="当前库存" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="stockStatusType(row)" size="small" effect="plain">
                {{ getStockQty(row).toFixed(2) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="库存状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="stockStatusType(row)" size="small">{{ stockStatusLabel(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="成本价" width="90" align="right">
            <template #default="{ row }">¥{{ getAvgPrice(row).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="库存货值" width="110" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ (getStockQty(row) * getAvgPrice(row)).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="出入库记录" width="190" align="center">
            <template #default="{ row }">
              <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap">
                <el-tag v-if="inhouseCountMap[row.id] > 0" type="success" size="small" effect="plain">
                  采购入库 {{ inhouseCountMap[row.id] }}次
                </el-tag>
                <el-tag v-if="saleCountMap[row.id] > 0" type="warning" size="small" effect="plain">
                  销售出库 {{ saleCountMap[row.id] }}次
                </el-tag>
                <el-tag v-if="retailCountMap[row.id] > 0" type="primary" size="small" effect="plain">
                  零售 {{ retailCountMap[row.id] }}次
                </el-tag>
                <span v-if="!inhouseCountMap[row.id] && !saleCountMap[row.id] && !retailCountMap[row.id]" style="color:#c0c4cc;font-size:12px">无记录</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="安全库存" width="130" align="center">
            <template #default="{ row }">
              <span v-if="Number(row.safe_min) > 0 || Number(row.safe_max) > 0"
                style="font-size:12px;color:#6b7280;cursor:pointer" @click="openSafeSetting(row)">
                {{ safeRangeText(row) }}
              </span>
              <el-button v-else type="primary" link size="small" @click="openSafeSetting(row)">设置</el-button>
            </template>
          </el-table-column>
          <el-table-column label="流水" width="60" align="center">
            <template #default="{ row }">
              <el-button type="info" link size="small" @click="router.push('/warehouse/flow')">流水</el-button>
            </template>
          </el-table-column>
          <el-table-column label="快捷跳转" width="120" align="center" fixed="right" class-name="col-white-bg">
            <template #default="{ row }">
              <el-button type="success" link size="small" @click="router.push('/procure/inhouse')">采购</el-button>
              <el-button type="warning" link size="small" @click="router.push('/sale/contract')">销售</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager-row">
          <span>共 {{ total }} 条</span>
          <span v-if="tableSummaryText" style="color:#999">{{ tableSummaryText }}</span>
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[20, 50, 100]"
            layout="sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="() => { page = 1 }"
            @current-change="() => {}"
          />
        </div>
      </el-card>
    </div>
  </div>

  <!-- 安全库存设置弹窗 -->
  <el-dialog v-model="safeDialogVisible" title="设置安全库存" width="360px" :close-on-click-modal="false">
    <div style="font-size:13px;color:#666;margin-bottom:12px">{{ safeForm.goods_name }}</div>
    <el-form label-width="80px">
      <el-form-item label="最低库存">
        <el-input-number v-model="safeForm.safe_min" :min="0" :precision="0" style="width:100%" placeholder="低于此值触发不足预警" />
      </el-form-item>
      <el-form-item label="最高库存">
        <el-input-number v-model="safeForm.safe_max" :min="0" :precision="0" style="width:100%" placeholder="0表示不限" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="safeDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="safeSaving" @click="saveSafeSetting">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="editCateDialog" title="编辑分类" width="360px">
    <el-form label-width="80px">
      <el-form-item label="分类名称">
        <el-input v-model="editCateForm.name" placeholder="请输入分类名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editCateDialog = false">取消</el-button>
      <el-button type="primary" @click="submitEditCate">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStockList, getWarehouseList } from '@/api/warehouse'
import { getGoodsList, updateGoodsCate, deleteGoodsCate } from '@/api/goods'
import http from '@/api/http'

const router = useRouter()
const loading = ref(false)
const tableData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredGoods.value.slice(start, start + pageSize.value)
})
const total = computed(() => filteredGoods.value.length)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const selectedWarehouse = ref(0)
const selectedCate = ref(0)
const statusFilter = ref<'all' | 'low' | 'zero' | 'normal'>('all')

const warehouses = ref<any[]>([])
const categories = ref<any[]>([])

// All goods (from goods table - includes zero-stock items)
const allGoods = ref<any[]>([])
// Stock qty map: goods_id -> qty (from stock/StockAll - updated by inhouse audit)
const stockQtyMap = ref<Record<number, number>>({})
const stockPriceMap = ref<Record<number, number>>({})
// Net deduction map: goods_id -> qty deducted by sales+retail (not yet reflected in StockAll)
const deductQtyMap = ref<Record<number, number>>({})

// Activity maps: goods_id -> count
const inhouseCountMap = ref<Record<number, number>>({})
const saleCountMap = ref<Record<number, number>>({})
const retailCountMap = ref<Record<number, number>>({})

function getStockQty(row: any): number {
  const base = stockQtyMap.value[row.id] ?? Number(row.stock_num ?? 0)
  const deduct = deductQtyMap.value[row.id] ?? 0
  return base - deduct
}

function getAvgPrice(row: any): number {
  return stockPriceMap.value[row.id] ?? Number(row.cost_price ?? 0)
}

// Filtered list (client-side after loading all goods)
const filteredGoods = computed(() => {
  let rows = allGoods.value

  if (selectedCate.value) {
    rows = rows.filter(r => r.cate_id === selectedCate.value)
  }

  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    rows = rows.filter(r =>
      String(r.goods_name || '').toLowerCase().includes(kw) ||
      String(r.goods_sn || '').toLowerCase().includes(kw)
    )
  }

  if (statusFilter.value === 'low') {
    rows = rows.filter(r => Number(r.safe_min) > 0 && getStockQty(r) < Number(r.safe_min))
  } else if (statusFilter.value === 'zero') {
    rows = rows.filter(r => getStockQty(r) <= 0)
  } else if (statusFilter.value === 'normal') {
    rows = rows.filter(r => {
      const qty = getStockQty(r)
      const safeMin = Number(r.safe_min || 0)
      const safeMax = Number(r.safe_max || 0)
      return qty > 0 && !(safeMin > 0 && qty < safeMin) && !(safeMax > 0 && qty > safeMax)
    })
  }

  return rows
})

const totalQty = computed(() => filteredGoods.value.reduce((s, r) => s + getStockQty(r), 0))
const negativeStockCount = computed(() => filteredGoods.value.filter(r => getStockQty(r) < 0).length)
const lowStockCount = computed(() => filteredGoods.value.filter(r => Number(r.safe_min) > 0 && getStockQty(r) < Number(r.safe_min)).length)
const zeroStockCount = computed(() => filteredGoods.value.filter(r => getStockQty(r) === 0).length)
const highStockCount = computed(() => filteredGoods.value.filter(r => Number(r.safe_max) > 0 && getStockQty(r) > Number(r.safe_max)).length)

const overviewStats = computed(() => [
  { label: '商品总数', value: filteredGoods.value.length },
  { label: '总库存', value: totalQty.value.toFixed(2) },
  { label: '负库存', value: negativeStockCount.value },
  { label: '库存不足', value: lowStockCount.value },
  { label: '零库存', value: zeroStockCount.value },
])

const tableSummaryText = computed(() => {
  const filters = []
  if (selectedCate.value) {
    const cate = categories.value.find(item => item.id === selectedCate.value)
    if (cate?.name) filters.push(cate.name)
  }
  if (statusFilter.value !== 'all') filters.push(stockFilterLabel(statusFilter.value))
  if (keyword.value.trim()) filters.push(`关键词：${keyword.value.trim()}`)
  return filters.join(' / ')
})

const stockHealthHint = computed(() => {
  const healthy = Math.max(filteredGoods.value.length - negativeStockCount.value - lowStockCount.value - zeroStockCount.value, 0)
  return `正常 ${healthy} / 负库存 ${negativeStockCount.value} / 零库存 ${zeroStockCount.value} / 不足 ${lowStockCount.value}`
})

const selectionScopeText = computed(() => {
  const labels = []
  if (selectedWarehouse.value) {
    const w = warehouses.value.find(item => item.id === selectedWarehouse.value)
    if (w?.name) labels.push(`仓库：${w.name}`)
  }
  if (selectedCate.value) {
    const cate = categories.value.find(item => item.id === selectedCate.value)
    if (cate?.name) labels.push(`分类：${cate.name}`)
  }
  return labels.join(' / ') || '当前范围：全部'
})

function stockStatusType(row: any) {
  const stock = getStockQty(row)
  const safeMin = Number(row.safe_min || 0)
  const safeMax = Number(row.safe_max || 0)
  if (stock < 0) return 'danger'
  if (stock === 0) return 'info'
  if (safeMin > 0 && stock < safeMin) return 'danger'
  if (safeMax > 0 && stock > safeMax) return 'warning'
  return 'success'
}

function stockStatusLabel(row: any) {
  const stock = getStockQty(row)
  const safeMin = Number(row.safe_min || 0)
  const safeMax = Number(row.safe_max || 0)
  if (stock < 0) return '库存负数'
  if (stock === 0) return '零库存'
  if (safeMin > 0 && stock < safeMin) return '库存不足'
  if (safeMax > 0 && stock > safeMax) return '库存过高'
  return '正常'
}

function stockFilterLabel(value: 'all' | 'low' | 'zero' | 'normal') {
  return ({ all: '全部', low: '库存不足', zero: '零库存', normal: '正常' } as const)[value]
}

function safeRangeText(row: any) {
  const min = Number(row.safe_min || 0).toFixed(0)
  const max = Number(row.safe_max || 0)
  return `${min} ~ ${max > 0 ? max.toFixed(0) : '∞'}`
}

// 安全库存设置
const safeDialogVisible = ref(false)
const safeSaving = ref(false)
const safeForm = ref({ id: 0, goods_name: '', safe_min: 0, safe_max: 0 })

function openSafeSetting(row: any) {
  safeForm.value = {
    id: row.id,
    goods_name: row.goods_name || '',
    safe_min: Number(row.safe_min || 0),
    safe_max: Number(row.safe_max || 0),
  }
  safeDialogVisible.value = true
}

async function saveSafeSetting() {
  safeSaving.value = true
  try {
    await http.post('/goods/ShopGoods/edit', { id: safeForm.value.id, safe_min: safeForm.value.safe_min, safe_max: safeForm.value.safe_max })
    // 更新本地数据
    const row = allGoods.value.find((r: any) => r.id === safeForm.value.id)
    if (row) { row.safe_min = safeForm.value.safe_min; row.safe_max = safeForm.value.safe_max }
    safeDialogVisible.value = false
    ElMessage.success('设置成功')
  } catch {
    ElMessage.error('设置失败')
  } finally {
    safeSaving.value = false
  }
}

function refreshWithFirstPage() {
  page.value = 1
}

function selectWarehouse(id: number) {
  selectedWarehouse.value = id
  loadStockMap(id)
  page.value = 1
}

function selectCate(id: number) {
  selectedCate.value = id
  page.value = 1
}

async function loadAllGoods() {
  const res = await getGoodsList({ list_rows: 2000 })
  allGoods.value = res.data?.rows ?? []
}

async function loadStockMap(warehouseId = 0) {
  try {
    const params: any = { list_rows: 2000 }
    if (warehouseId) params.warehouse_id = warehouseId
    const res: any = await getStockList(params)
    const rows: any[] = res?.data?.rows ?? res?.rows ?? []
    const qtyMap: Record<number, number> = {}
    const priceMap: Record<number, number> = {}
    for (const r of rows) {
      const gid = Number(r.goods_id)
      if (!gid) continue
      qtyMap[gid] = (qtyMap[gid] || 0) + Number(r.qty ?? r.stock_num ?? 0)
      if (!priceMap[gid] && Number(r.avg_price ?? r.cost_price ?? 0) > 0) {
        priceMap[gid] = Number(r.avg_price ?? r.cost_price ?? 0)
      }
    }
    stockQtyMap.value = qtyMap
    stockPriceMap.value = priceMap
  } catch { /* ignore */ }
}

async function loadActivityMaps() {
  try {
    const [inhouseRes, retailRes] = await Promise.allSettled([
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 500 } }),
      http.get('/retail/order/index', { params: { list_rows: 500 } }),
    ])

    // Inhouse map (入库)
    const inhouseRows: any[] = inhouseRes.status === 'fulfilled' ? (inhouseRes.value.data?.rows ?? []) : []
    const inMap: Record<number, number> = {}
    for (const r of inhouseRows) {
      try {
        const items = JSON.parse(r.goods_info || '[]')
        for (const item of items) {
          const gid = Number(item.goods_id)
          if (gid) inMap[gid] = (inMap[gid] || 0) + 1
        }
      } catch { /* ignore */ }
    }
    inhouseCountMap.value = inMap

    // Sale contracts as proxy for sales (出库)
    const dMap: Record<number, number> = {}
    const sMap: Record<number, number> = {}
    try {
      const saleRes = await http.get('/shop/ContractOrder/index', { params: { list_rows: 500, status: 1 } })
      const saleRows: any[] = saleRes.data?.rows ?? []
      for (const r of saleRows) {
        try {
          const items = JSON.parse(r.goods_info || '[]')
          for (const item of items) {
            const gid = Number(item.goods_id)
            const qty = Number(item.num || 0)
            if (gid) {
              sMap[gid] = (sMap[gid] || 0) + 1
              dMap[gid] = (dMap[gid] || 0) + qty
            }
          }
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    saleCountMap.value = sMap

    // Retail map (零售出库)
    const retailRows: any[] = retailRes.status === 'fulfilled' ? (retailRes.value.data?.rows ?? []) : []
    const rMap: Record<number, number> = {}
    for (const r of retailRows) {
      try {
        const items = JSON.parse(r.goods_info || '[]')
        for (const item of items) {
          const gid = Number(item.goods_id)
          const qty = Number(item.num || item.qty || 0)
          if (gid) {
            rMap[gid] = (rMap[gid] || 0) + 1
            dMap[gid] = (dMap[gid] || 0) + qty
          }
        }
      } catch { /* ignore */ }
    }
    retailCountMap.value = rMap
    deductQtyMap.value = dMap
  } catch { /* ignore */ }
}

async function loadMeta() {
  const warehouseRes = await getWarehouseList({ list_rows: 200 })
  warehouses.value = warehouseRes.data?.rows ?? []
}

function buildCategories() {
  const seen = new Set<string>()
  const result: any[] = []
  for (const g of allGoods.value) {
    const key = String(g.cate_id ?? '')
    if (g.cate_id && g.cate_name && !seen.has(key)) {
      seen.add(key)
      result.push({ id: g.cate_id, name: g.cate_name })
    }
  }
  categories.value = result
}

const editCateDialog = ref(false)
const editCateForm = ref<{ id: number; name: string }>({ id: 0, name: '' })

function openEditCate(cate: any) {
  editCateForm.value = { id: cate.id, name: cate.name }
  editCateDialog.value = true
}

async function submitEditCate() {
  const name = editCateForm.value.name.trim()
  if (!name) { ElMessage.warning('分类名称不能为空'); return }
  const dup = categories.value.find(c => c.name === name && c.id !== editCateForm.value.id)
  if (dup) { ElMessage.warning('已存在同名分类'); return }
  await updateGoodsCate({ id: editCateForm.value.id, name })
  ElMessage.success('修改成功')
  editCateDialog.value = false
  await loadAllGoods()
  buildCategories()
}

async function handleDeleteCate(cate: any) {
  await ElMessageBox.confirm(`确定删除分类「${cate.name}」？`, '提示', { type: 'warning' })
  await deleteGoodsCate(cate.id)
  ElMessage.success('删除成功')
  if (selectedCate.value === cate.id) selectedCate.value = 0
  await loadAllGoods()
  buildCategories()
}

onMounted(async () => {
  loading.value = true
  try {
    await loadMeta()
    await Promise.all([loadAllGoods(), loadStockMap(), loadActivityMaps()])
    buildCategories()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stock-page {
  display: flex;
  height: 100%;
  gap: 12px;
}

.stock-sidebar {
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 10px 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  display: flex;
  flex-direction: row;
  gap: 0;
}

.sidebar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar-divider {
  width: 1px;
  background: rgba(0,0,0,0.05);
  margin: 0 6px;
  flex-shrink: 0;
}

.sidebar-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(29,29,31,0.35);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  padding: 0 4px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-item {
  padding: 5px 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cate-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cate-actions {
  display: none;
  flex-shrink: 0;
  gap: 0;
}

.sidebar-item:hover .cate-actions {
  display: flex;
}

.sidebar-item:hover {
  background: #f0f7ff;
}

.sidebar-item.active {
  background: #e6f0ff;
  color: #409eff;
  font-weight: 600;
}

.stock-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-label {
  font-size: 13px;
  color: #333;
}

.stat-blue {
  color: #409eff;
  font-size: 15px;
}
.stat-red {
  color: #dc2626;
  font-size: 15px;
}
.stat-orange {
  color: #ea580c;
  font-size: 15px;
}

.pager-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

:deep(.col-white-bg .cell),
:deep(.col-white-bg) {
  background-color: #fff !important;
}
</style>
