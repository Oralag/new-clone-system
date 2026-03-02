<template>
  <div class="stock-page">
    <!-- 左侧过滤面板 -->
    <div class="stock-sidebar">
      <div class="sidebar-col">
        <div class="sidebar-label">仓库</div>
        <el-input v-model="warehouseKeyword" placeholder="搜索" clearable size="small" style="margin-bottom:6px" />
        <div class="sidebar-section">
          <div :class="['sidebar-item', selectedWarehouse === 0 ? 'active' : '']" @click="selectWarehouse(0)">全部</div>
          <div
            v-for="w in filteredWarehouses" :key="w.id"
            :class="['sidebar-item', selectedWarehouse === w.id ? 'active' : '']"
            @click="selectWarehouse(w.id)"
          >{{ w.name }}</div>
        </div>
      </div>
      <div class="sidebar-divider" />
      <div class="sidebar-col">
        <div class="sidebar-label">分类</div>
        <el-input v-model="cateKeyword" placeholder="搜索" clearable size="small" style="margin-bottom:6px" />
        <div class="sidebar-section">
          <div :class="['sidebar-item', selectedCate === 0 ? 'active' : '']" @click="selectCate(0)">全部</div>
          <div
            v-for="c in filteredCates" :key="c.id"
            :class="['sidebar-item', selectedCate === c.id ? 'active' : '']"
            @click="selectCate(c.id)"
          >{{ c.name }}</div>
        </div>
      </div>
    </div>

    <!-- 右侧主内容 -->
    <div class="stock-main">
      <el-card style="margin-bottom:0">
        <!-- 顶部统计栏 -->
        <div class="stock-topbar">
          <div class="topbar-left">
            <el-button type="warning" size="small" @click="exportData">导出</el-button>
            <span class="stat-label">合计库存: <b class="stat-blue">{{ totalQty.toFixed(2) }}</b></span>
            <span class="stat-label">合计货值: <b class="stat-orange">{{ totalValue.toFixed(2) }}</b></span>
            <span class="warning-tag high" title="高库存商品">
              <span class="dot orange"></span>高库存 <b class="stat-orange">{{ highStockCount }}</b>
            </span>
            <span class="warning-tag low" title="低库存商品">
              <span class="dot red"></span>低库存 <b class="stat-red">{{ lowStockCount }}</b>
            </span>
          </div>
          <div class="topbar-right">
            <el-input
              v-model="keyword"
              placeholder="商品名称/商品编码"
              clearable
              size="small"
              style="width:200px"
              @change="loadData"
            >
              <template #append>
                <el-button :icon="Search" @click="loadData" />
              </template>
            </el-input>
          </div>
        </div>

        <!-- 表格 -->
        <el-table
          :data="tableData"
          v-loading="loading"
          border
          stripe
          size="small"
          style="width:100%;margin-top:8px"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="goods_name" label="商品名称" min-width="160">
            <template #default="{ row }">
              <span class="goods-link" @click="showDetail(row)">{{ row.goods_name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" width="80">
            <template #default="{ row }">{{ row.unit_name || '—' }}</template>
          </el-table-column>
          <el-table-column label="仓库名称" width="110">
            <template #default="{ row }">{{ row.warehouse_name || '—' }}</template>
          </el-table-column>
          <el-table-column label="移动平均价" width="110" align="right">
            <template #default="{ row }">{{ row.avg_price ? Number(row.avg_price).toFixed(4) : '—' }}</template>
          </el-table-column>
          <el-table-column label="可用库存" width="130" align="center">
            <template #default="{ row }">
              <span style="display:inline-flex;align-items:center;gap:4px">
                <span v-if="getStockTag(row) === 'warning'" class="dot orange" style="width:8px;height:8px" />
                <span v-if="getStockTag(row) === 'danger'" class="dot red" style="width:8px;height:8px" />
                <el-tag :type="getStockTag(row)" size="small" effect="plain">{{ row.qty }}</el-tag>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="安全库存" width="120" align="center">
            <template #default="{ row }">
              <span v-if="parseFloat(row.safe_min) > 0 || parseFloat(row.safe_max) > 0" style="font-size:12px;color:#999">
                {{ row.safe_min || 0 }} ~ {{ row.safe_max || '∞' }}
              </span>
              <span v-else style="font-size:12px;color:#ccc">未设置</span>
            </template>
          </el-table-column>
          <el-table-column label="成本总额" width="110" align="right">
            <template #default="{ row }">
              {{ ((row.qty || 0) * (row.avg_price || 0)).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="showDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div style="margin-top:12px;display:flex;justify-content:flex-end;align-items:center;gap:8px">
          <span style="font-size:13px;color:#666">共 {{ total }} 条</span>
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

      <!-- 库存详情抽屉 -->
      <el-drawer v-model="detailVisible" title="库存详情" size="460px" direction="rtl">
        <template v-if="detailRow">
          <!-- 核心数据突出显示 -->
          <div style="display:flex;gap:12px;margin-bottom:16px">
            <div style="flex:1;background:#f0f9ff;border-radius:8px;padding:12px;text-align:center">
              <div style="font-size:11px;color:#86909c;margin-bottom:4px">可用库存</div>
              <div style="font-size:22px;font-weight:700;color:#409eff">{{ detailRow.qty }}</div>
              <div style="font-size:11px;color:#86909c">{{ detailRow.unit_name || '' }}</div>
            </div>
            <div style="flex:1;background:#fff7e6;border-radius:8px;padding:12px;text-align:center">
              <div style="font-size:11px;color:#86909c;margin-bottom:4px">成本总额</div>
              <div style="font-size:22px;font-weight:700;color:#e6a23c">¥{{ ((detailRow.qty || 0) * (detailRow.avg_price || 0)).toFixed(2) }}</div>
              <div style="font-size:11px;color:#86909c">均价 {{ detailRow.avg_price || 0 }}</div>
            </div>
          </div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="商品名称">{{ detailRow.goods_name }}</el-descriptions-item>
            <el-descriptions-item label="商品编码">{{ detailRow.goods_sn || '—' }}</el-descriptions-item>
            <el-descriptions-item label="商品单位">{{ detailRow.unit_name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="仓库名称">{{ detailRow.warehouse_name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="库位名称">{{ detailRow.location_name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="锁定数量">{{ detailRow.lock_qty || 0 }}</el-descriptions-item>
            <el-descriptions-item label="安全最低库存">{{ detailRow.safe_min || 0 }}</el-descriptions-item>
            <el-descriptions-item label="安全最高库存">{{ detailRow.safe_max || 0 }}</el-descriptions-item>
            <el-descriptions-item label="属性">{{ detailRow.attr || '—' }}</el-descriptions-item>
            <el-descriptions-item label="规格型号">{{ detailRow.spec_model || '—' }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getStockList, getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const warehouseKeyword = ref('')
const cateKeyword = ref('')
const selectedWarehouse = ref(0)
const selectedCate = ref(0)

const warehouses = ref<any[]>([])
const cates = ref<any[]>([])

const detailVisible = ref(false)
const detailRow = ref<any>(null)

const filteredWarehouses = computed(() =>
  warehouses.value.filter(w => !warehouseKeyword.value || w.name.includes(warehouseKeyword.value))
)
const filteredCates = computed(() =>
  cates.value.filter(c => !cateKeyword.value || c.name.includes(cateKeyword.value))
)

const totalQty = computed(() => tableData.value.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0))
const totalValue = computed(() => tableData.value.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.avg_price) || 0), 0))
const highStockCount = computed(() => tableData.value.filter(r => {
  const safeMax = parseFloat(r.safe_max) || 0
  return safeMax > 0 && (parseFloat(r.qty) || 0) > safeMax
}).length)
const lowStockCount = computed(() => tableData.value.filter(r => {
  const safeMin = parseFloat(r.safe_min) || 0
  return safeMin > 0 && (parseFloat(r.qty) || 0) < safeMin
}).length)

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, list_rows: pageSize.value }
    if (keyword.value) params.goods_name = keyword.value
    if (selectedWarehouse.value) params.warehouse_id = selectedWarehouse.value
    if (selectedCate.value) params.cate_id = selectedCate.value
    const res = await getStockList(params)
    tableData.value = res.data?.rows || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

async function loadMeta() {
  const [wRes, cRes] = await Promise.all([
    getWarehouseList({ list_rows: 200 }),
    http.get('/goods/ShopGoodsCate/index', { params: { list_rows: 200 } })
  ])
  warehouses.value = wRes.data?.rows || []
  cates.value = cRes.data?.rows || []
}

function selectWarehouse(id: number) {
  selectedWarehouse.value = id
  page.value = 1
  loadData()
}

function selectCate(id: number) {
  selectedCate.value = id
  page.value = 1
  loadData()
}

function getStockTag(row: any) {
  const qty = parseFloat(row.qty) || 0
  const safeMax = parseFloat(row.safe_max) || 0
  const safeMin = parseFloat(row.safe_min) || 0
  if (safeMax > 0 && qty > safeMax) return 'warning'
  if (safeMin > 0 && qty < safeMin) return 'danger'
  return 'success'
}

function showDetail(row: any) {
  detailRow.value = row
  detailVisible.value = true
}

function exportData() {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  loadMeta()
  loadData()
})
</script>

<style scoped>
.stock-page {
  display: flex;
  height: 100%;
  gap: 12px;
  padding: 0;
}
.stock-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 4px;
  padding: 10px 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
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
.sidebar-item {
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background .15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-item:hover { background: #f0f7ff; }
.sidebar-item.active { background: #e6f0ff; color: #409eff; font-weight: 600; }
.sidebar-section { display: flex; flex-direction: column; gap: 2px; }
.sidebar-label {
  font-size: 11px;
  font-weight: 600;
  color: #86909c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  padding: 0 4px;
}

.stock-main { flex: 1; min-width: 0; }
.stock-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}
.topbar-left { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.topbar-right { display: flex; align-items: center; }
.stat-label { font-size: 13px; color: #333; }
.stat-blue { color: #409eff; font-size: 16px; }
.stat-orange { color: #e6a23c; font-size: 16px; }
.stat-red { color: #f56c6c; font-size: 16px; }
.warning-tag { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: default; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot.orange { background: #e6a23c; }
.dot.red { background: #f56c6c; }
.goods-link { color: #409eff; cursor: pointer; text-decoration: underline; }
.goods-link:hover { opacity: 0.8; }
</style>
