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
            {{ cate.name }}
          </div>
        </div>
      </div>
    </div>

    <div style="flex:1;min-width:0">
      <el-card>
        <div class="stock-topbar">
          <div class="topbar-left">
            <span
              v-for="item in overviewStats"
              :key="item.label"
              class="stat-label"
            >
              {{ item.label }}
              <strong class="stat-blue">{{ item.value }}</strong>
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
          <el-table-column prop="goods_name" label="商品名称" min-width="160" />
          <el-table-column prop="goods_sn" label="商品编码" width="130" />
          <el-table-column prop="cate_name" label="分类" width="100" />
          <el-table-column prop="spec" label="规格" width="90" />
          <el-table-column prop="unit_name" label="单位" width="65" align="center" />
          <el-table-column label="当前库存" width="120" align="center">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;justify-content:center">
                <el-tag :type="stockStatusType(row)" size="small" effect="plain">
                  {{ Number(row.stock_num).toFixed(2) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="安全库存" width="120" align="center">
            <template #default="{ row }">
              <span v-if="Number(row.safe_min) > 0 || Number(row.safe_max) > 0" style="font-size:12px;color:#6b7280">
                {{ safeRangeText(row) }}
              </span>
              <span v-else style="font-size:12px;color:#c0c4cc">未设置</span>
            </template>
          </el-table-column>
          <el-table-column label="库存状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="stockStatusType(row)" size="small">{{ stockStatusLabel(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="成本价" width="90" align="right">
            <template #default="{ row }">¥{{ Number(row.cost_price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="库存货值" width="110" align="right">
            <template #default="{ row }">
              <span style="color:#165dff;font-weight:500">¥{{ (Number(row.stock_num) * Number(row.cost_price || 0)).toFixed(2) }}</span>
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
            @size-change="loadData"
            @current-change="loadData"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { getStockList, getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const selectedWarehouse = ref(0)
const selectedCate = ref(0)
const statusFilter = ref<'all' | 'low' | 'zero' | 'normal'>('all')

const warehouses = ref<any[]>([])
const categories = ref<any[]>([])
const allRows = ref<any[]>([])

const totalQty = computed(() => tableData.value.reduce((sum, item) => sum + Number(item.stock_num || 0), 0))
const lowStockCount = computed(() => allRows.value.filter(item => Number(item.safe_min) > 0 && Number(item.stock_num) < Number(item.safe_min)).length)
const zeroStockCount = computed(() => allRows.value.filter(item => Number(item.stock_num) <= 0).length)
const highStockCount = computed(() => allRows.value.filter(item => Number(item.safe_max) > 0 && Number(item.stock_num) > Number(item.safe_max)).length)
const overviewStats = computed(() => [
  { label: '总库存', value: totalQty.value.toFixed(2) },
  { label: '库存不足', value: lowStockCount.value },
  { label: '零库存', value: zeroStockCount.value },
  { label: '库存过高', value: highStockCount.value },
])
const tableSummaryText = computed(() => {
  const filters = []
  if (selectedWarehouse.value) {
    const warehouse = warehouses.value.find(item => item.id === selectedWarehouse.value)
    if (warehouse?.name) filters.push(warehouse.name)
  }
  if (selectedCate.value) {
    const cate = categories.value.find(item => item.id === selectedCate.value)
    if (cate?.name) filters.push(cate.name)
  }
  if (statusFilter.value !== 'all') filters.push(stockFilterLabel(statusFilter.value))
  if (keyword.value.trim()) filters.push(`关键词：${keyword.value.trim()}`)
  return filters.join(' / ')
})
const stockHealthHint = computed(() => {
  const healthy = Math.max(allRows.value.length - lowStockCount.value - zeroStockCount.value, 0)
  return `${selectionScopeText.value} · 正常 ${healthy} / 异常 ${lowStockCount.value + zeroStockCount.value + highStockCount.value}`
})
const selectionScopeText = computed(() => {
  const labels = []
  if (selectedWarehouse.value) {
    const warehouse = warehouses.value.find(item => item.id === selectedWarehouse.value)
    if (warehouse?.name) labels.push(`仓库：${warehouse.name}`)
  }
  if (selectedCate.value) {
    const cate = categories.value.find(item => item.id === selectedCate.value)
    if (cate?.name) labels.push(`分类：${cate.name}`)
  }
  return labels.join(' / ') || '当前范围：全部'
})

function stockStatusType(row: any) {
  const stock = Number(row.stock_num)
  const safeMin = Number(row.safe_min || 0)
  const safeMax = Number(row.safe_max || 0)
  if (stock < 0) return 'danger'
  if (stock === 0) return 'info'
  if (safeMin > 0 && stock < safeMin) return 'danger'
  if (safeMax > 0 && stock > safeMax) return 'warning'
  return 'success'
}

function stockStatusLabel(row: any) {
  const stock = Number(row.stock_num)
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

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      list_rows: pageSize.value,
      page: page.value,
    }
    if (keyword.value) params.keyword = keyword.value
    if (selectedCate.value) params.cate_id = selectedCate.value
    if (selectedWarehouse.value) params.warehouse_id = selectedWarehouse.value

    const response: any = await getStockList(params)
    let rows = response?.data?.rows ?? response?.rows ?? []
    const rawTotal = response?.data?.total ?? response?.total ?? rows.length

    if (statusFilter.value === 'low') {
      rows = rows.filter((item: any) => Number(item.safe_min) > 0 && Number(item.stock_num) < Number(item.safe_min))
    } else if (statusFilter.value === 'zero') {
      rows = rows.filter((item: any) => Number(item.stock_num) <= 0)
    } else if (statusFilter.value === 'normal') {
      rows = rows.filter((item: any) => {
        const stock = Number(item.stock_num)
        const safeMin = Number(item.safe_min || 0)
        const safeMax = Number(item.safe_max || 0)
        return stock > 0 && !(safeMin > 0 && stock < safeMin) && !(safeMax > 0 && stock > safeMax)
      })
    }

    tableData.value = rows
    total.value = statusFilter.value === 'all' ? rawTotal : rows.length
  } finally {
    loading.value = false
  }
}

async function loadOverviewRows() {
  const response: any = await getStockList({ list_rows: 2000 })
  allRows.value = response?.data?.rows ?? response?.rows ?? []
}

async function loadMeta() {
  const [warehouseRes, cateRes] = await Promise.all([
    getWarehouseList({ list_rows: 200 }),
    http.get('/goods/ShopGoodsCate/index', { params: { list_rows: 200 } }),
  ])
  warehouses.value = warehouseRes.data?.rows ?? []
  categories.value = cateRes.data?.rows ?? []
}

function refreshWithFirstPage() {
  page.value = 1
  loadData()
}

function selectWarehouse(id: number) {
  selectedWarehouse.value = id
  refreshWithFirstPage()
}

function selectCate(id: number) {
  selectedCate.value = id
  refreshWithFirstPage()
}

onMounted(async () => {
  await loadMeta()
  await Promise.all([loadData(), loadOverviewRows()])
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
  border-radius: 4px;
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
  background: #f0f0f0;
  margin: 0 6px;
  flex-shrink: 0;
}

.sidebar-label {
  font-size: 11px;
  font-weight: 600;
  color: #86909c;
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
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.pager-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 13px;
  color: #666;
}
</style>
