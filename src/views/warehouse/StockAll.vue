<template>
  <div class="stock-page">

    <!-- 手机端：分类筛选 drawer -->
    <el-drawer v-if="isMobile" v-model="drawerVisible" title="分类筛选" direction="ltr" size="260px">
      <div class="sidebar-col" style="padding:0 8px">
        <div class="sidebar-label-row">
          <span class="sidebar-label">分类</span>
          <el-button :icon="Plus" size="small" circle @click="openCateForm()" />
        </div>
        <el-select
          v-model="selectedWarehouse"
          size="small"
          style="width:100%;margin-bottom:8px"
          @change="(val: any) => selectWarehouse(val)"
        >
          <el-option label="全部仓库" :value="0" />
          <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
        </el-select>
        <div class="sidebar-section" v-loading="cateLoading">
          <div :class="['sidebar-item', selectedCate === 0 ? 'active' : '']" @click="selectCate(0); drawerVisible = false">全部</div>
          <el-tree
            :data="cateTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            :default-expand-all="false"
            highlight-current
            style="background:transparent"
            @node-click="(node: any) => { selectCate(node.id); drawerVisible = false }"
          >
            <template #default="{ node, data }">
              <span :class="['tree-node-label', selectedCate === data.id ? 'active' : '']" style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:4px;overflow:hidden">
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ data.name }}</span>
                <span class="cate-item-actions" style="flex-shrink:0">
                  <el-icon class="act-icon" @click.stop="openCateForm(data)"><Edit /></el-icon>
                  <el-icon class="act-icon danger" @click.stop="handleDeleteCate(data.id)"><Delete /></el-icon>
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
    </el-drawer>

    <!-- 桌面端：固定侧边栏 -->
    <div v-if="!isMobile" class="stock-sidebar" :style="{ width: sidebarWidth + 'px' }">
      <div class="sidebar-inner">

      <div class="sidebar-col">
        <div class="sidebar-label-row">
          <span class="sidebar-label">分类</span>
          <el-button :icon="Plus" size="small" circle @click="openCateForm()" />
        </div>

        <!-- 仓库下拉 -->
        <el-select
          v-model="selectedWarehouse"
          size="small"
          style="width:100%;margin-bottom:8px"
          @change="(val) => selectWarehouse(val)"
        >
          <el-option label="全部仓库" :value="0" />
          <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
        </el-select>

        <div class="sidebar-section" v-loading="cateLoading">
          <div :class="['sidebar-item', selectedCate === 0 ? 'active' : '']" @click="selectCate(0)">全部</div>
          <el-tree
            :data="cateTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            :default-expand-all="false"
            highlight-current
            style="background:transparent"
            @node-click="(node: any) => selectCate(node.id)"
          >
            <template #default="{ node, data }">
              <span :class="['tree-node-label', selectedCate === data.id ? 'active' : '']" style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:4px;overflow:hidden">
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ data.name }}</span>
                <span class="cate-item-actions" style="flex-shrink:0">
                  <el-icon class="act-icon" @click.stop="openCateForm(data)"><Edit /></el-icon>
                  <el-icon class="act-icon danger" @click.stop="handleDeleteCate(data.id)"><Delete /></el-icon>
                </span>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
      </div><!-- /sidebar-inner -->
    </div>
    <div v-if="!isMobile" class="sidebar-resize-handle" @mousedown="startResize" />

    <div style="flex:1;min-width:0">
      <el-card>
        <div class="stock-topbar">
          <div class="topbar-left">
            <!-- 手机端：分类筛选入口按钮 -->
            <el-button v-if="isMobile" size="small" @click="drawerVisible = true">
              <el-icon><Filter /></el-icon>
              {{ selectedCate === 0 ? '全部分类' : cateOptions.find(c => c.id === selectedCate)?.name || '分类' }}
            </el-button>
            <span v-for="item in overviewStats" :key="item.label" class="stat-label">
              {{ item.label }}
              <strong :class="item.label === '库存不足' && item.value > 0 ? 'stat-orange' : 'stat-blue'">{{ item.value }}</strong>
            </span>
            <span v-if="negativeStockItems.length > 0" class="stat-label">
              负库存
              <template v-for="(item, idx) in negativeStockItems" :key="idx">
                <strong class="stat-red">{{ item.qty % 1 === 0 ? item.qty.toFixed(0) : item.qty.toFixed(2).replace(/\.?0+$/, '') }}{{ item.unit }}</strong>
                <span v-if="idx < negativeStockItems.length - 1" style="color:#999;margin:0 2px">·</span>
              </template>
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

        <div v-if="isMobile" v-loading="loading" class="mobile-stock-list">
          <div v-if="!tableData.length" class="mobile-stock-empty">暂无数据</div>
          <div v-for="row in tableData" :key="row.id" :class="['mobile-stock-card', bomGoodsSet.has(row.goods_sn) ? 'is-bom' : '']">
            <div class="mobile-stock-card__head">
              <div class="mobile-stock-card__title-wrap">
                <div class="mobile-stock-card__title">{{ row.goods_name || '—' }}</div>
                <div class="mobile-stock-card__meta">
                  <span>{{ row.goods_sn || '无编码' }}</span>
                  <span v-if="row.cate_name">{{ row.cate_name }}</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                <el-tag v-if="bomGoodsSet.has(row.goods_sn)" size="small" class="mobile-stock-card__bom">BOM</el-tag>
                <el-tag :type="stockStatusType(row)" size="small">{{ stockStatusLabel(row) }}</el-tag>
              </div>
            </div>
            <div class="mobile-stock-card__inline">
              <span class="mobile-stock-card__label">单位</span>
              <span class="mobile-stock-card__value">{{ row.unit_name || '—' }}</span>
              <span class="mobile-stock-card__sep">·</span>
              <span class="mobile-stock-card__label">库存</span>
              <el-tag :type="stockStatusType(row)" size="small" effect="plain">
                {{ getStockQty(row).toFixed(0) }}
              </el-tag>
            </div>
            <div class="mobile-stock-card__actions">
              <el-button type="info" link size="small" @click="openFlowDialog(row)">流水</el-button>
              <el-button type="success" link size="small" @click="router.push('/procure/inhouse')">采购</el-button>
              <el-button type="warning" link size="small" @click="router.push('/sale/contract')">销售</el-button>
            </div>
          </div>
        </div>

        <el-table v-else v-loading="loading" :data="tableData" border stripe size="small" style="width:100%;margin-top:8px"
          :row-class-name="({ row }: any) => bomGoodsSet.has(row.goods_sn) ? 'bom-row' : ''"
          @sort-change="handleSortChange">
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column prop="goods_name" label="商品名称" min-width="120" sortable="custom">
            <template #default="{ row }">
              <span>{{ row.goods_name }}</span>
              <el-tag v-if="bomGoodsSet.has(row.goods_sn)" size="small" style="margin-left:6px;vertical-align:middle;background:#e6a23c;color:#fff;border-color:#e6a23c">BOM</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="goods_sn" label="商品编码" width="130" />
          <el-table-column prop="cate_name" label="分类" width="100" sortable="custom" />
          <el-table-column label="规格" width="90">
            <template #default="{ row }">
              <span>{{ formatSpecDisplay(row.spec) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="unit_name" label="单位" width="65" align="center" />
          <el-table-column label="库存" width="140" align="center" sortable="custom" prop="__stock_qty" :sort-orders="['descending','ascending',null]">
            <template #default="{ row }">
              <el-tag :type="stockStatusType(row)" size="small" effect="plain">
                <div style="line-height:1.3;text-align:center">
                  <div>{{ formatStockMain(row.id, getStockQty(row), row.unit_name) }}</div>
                  <div v-if="formatStockSub(row.id, getStockQty(row), row.unit_name)" style="opacity:0.45;font-size:10px">({{ formatStockSub(row.id, getStockQty(row), row.unit_name) }})</div>
                </div>
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="库存状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="stockStatusType(row)" size="small">{{ stockStatusLabel(row) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="移动均价" width="130" align="right">
            <template #default="{ row }">
              <div>¥{{ getAvgPrice(row).toFixed(3) }}/{{ row.unit_name }}</div>
              <div v-if="getLargeUnitPrice(row.id, getAvgPrice(row))" style="font-size:11px;color:#999">
                ¥{{ getLargeUnitPrice(row.id, getAvgPrice(row))!.price.toFixed(3) }}/{{ getLargeUnitPrice(row.id, getAvgPrice(row))!.unit }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="库存货值" width="110" align="right" sortable="custom" prop="__stock_value" :sort-orders="['descending','ascending',null]">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ (getStockQty(row) * getAvgPrice(row)).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="出入库记录" width="280" align="center">
            <template #default="{ row }">
              <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap">
                <el-tag v-if="inhouseCountMap[row.id] > 0" type="success" size="small" effect="plain">
                  采购入库 {{ inhouseCountMap[row.id] }}次
                </el-tag>
                <el-tag v-if="returnCountMap[row.id] > 0" type="warning" size="small" effect="plain">
                  退货 {{ returnCountMap[row.id] }}次
                </el-tag>
                <el-tag v-if="saleCountMap[row.id] > 0" type="danger" size="small" effect="plain">
                  销售出库 {{ saleCountMap[row.id] }}次
                </el-tag>
                <el-tag v-if="retailCountMap[row.id] > 0" type="primary" size="small" effect="plain">
                  零售 {{ retailCountMap[row.id] }}次
                </el-tag>
                <el-tag v-if="otherInCountMap[row.id] > 0" type="success" size="small" effect="plain">
                  其他入库 {{ otherInCountMap[row.id] }}次
                </el-tag>
                <el-tag v-if="otherOutCountMap[row.id] > 0" type="danger" size="small" effect="plain">
                  其他出库 {{ otherOutCountMap[row.id] }}次
                </el-tag>
                <el-tag v-if="prodInCountMap[row.id] > 0" type="success" size="small" effect="plain">
                  生产入库 {{ prodInCountMap[row.id] }}次
                </el-tag>
                <el-tag v-if="prodOutCountMap[row.id] > 0" type="warning" size="small" effect="plain">
                  生产领料 {{ prodOutCountMap[row.id] }}次
                </el-tag>
                <span v-if="!inhouseCountMap[row.id] && !returnCountMap[row.id] && !saleCountMap[row.id] && !retailCountMap[row.id] && !otherInCountMap[row.id] && !otherOutCountMap[row.id] && !prodInCountMap[row.id] && !prodOutCountMap[row.id]" style="color:#c0c4cc;font-size:12px">无记录</span>
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
              <el-button type="info" link size="small" @click="openFlowDialog(row)">流水</el-button>
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

  <!-- 出入库流水弹窗 -->
  <el-dialog v-model="flowDialogVisible" :title="`出入库流水 — ${flowGoodsName}`" width="750px" append-to-body>
    <div v-loading="flowLoading">
      <el-table :data="flowRows" border size="small" style="width:100%" max-height="440">
        <el-table-column type="index" width="45" align="center" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="(flowTypeMap[row._type]?.tag as any) || 'info'" size="small">
              {{ flowTypeMap[row._type]?.label || row._type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="单据编号" min-width="130">
          <template #default="{ row }">
            <span style="font-size:13px;color:#555">{{ row._sn || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="跳转" width="70" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToDoc(row)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: flowTypeMap[row._type]?.direction === '+' ? '#16a34a' : '#dc2626', fontWeight: 600 }">
              {{ flowTypeMap[row._type]?.direction || '+' }}{{ row._qty }}<span v-if="row._unit" style="font-weight:400;margin-left:2px">{{ row._unit }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="90" align="right">
          <template #default="{ row }">¥{{ Number(row._price || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="日期" width="100">
          <template #default="{ row }">{{ fmtDt(row._date) }}</template>
        </el-table-column>
        <el-table-column label="备注/对方" min-width="110" :show-overflow-tooltip="{ appendTo: 'body' }">
          <template #default="{ row }">{{ row._partner || '—' }}</template>
        </el-table-column>
      </el-table>
      <div v-if="!flowLoading && flowRows.length" style="display:flex;gap:20px;margin-top:10px;font-size:13px;color:#606266">
        <template v-if="!flowHasMultiUnit">
          <span>入库合计：<b style="color:#16a34a">+{{ flowRows.filter(r => flowTypeMap[r._type]?.direction === '+').reduce((s, r) => s + r._qty, 0) }}</b></span>
          <span>出库合计：<b style="color:#dc2626">-{{ flowRows.filter(r => flowTypeMap[r._type]?.direction === '-').reduce((s, r) => s + r._qty, 0) }}</b></span>
          <span>净变动：<b>{{ flowRows.reduce((s, r) => s + (flowTypeMap[r._type]?.direction === '+' ? r._qty : -r._qty), 0) }}</b></span>
        </template>
        <span>共 <b>{{ flowRows.length }}</b> 笔</span>
      </div>
      <div v-if="!flowLoading && !flowRows.length" style="text-align:center;color:#c0c4cc;padding:20px">暂无记录</div>
    </div>
    <template #footer>
      <el-button @click="flowDialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="cateFormVisible" :title="cateFormTitle" width="400px" append-to-body>
    <el-form :model="cateForm" label-width="90px">
      <el-form-item label="分类名称" :rules="[{ required: true }]">
        <el-input v-model="cateForm.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="上级分类">
        <el-select v-model="cateForm.parent_id" placeholder="请选择（可选）" clearable style="width:100%">
          <el-option v-for="c in cateTree" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="排序">
        <el-input-number v-model="cateForm.sort" :min="0" style="width:100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="cateFormVisible = false">取消</el-button>
      <el-button type="primary" :loading="cateSaving" @click="handleSaveCate">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, onUnmounted, ref, reactive, watch } from 'vue'
import { fmtDt } from '@/utils/date'
import { useRouter } from 'vue-router'
import { Search, Plus, Edit, Delete, Filter } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStockList, getWarehouseList } from '@/api/warehouse'
import { getGoodsList, getGoodsCateList, createGoodsCate, updateGoodsCate, deleteGoodsCate, getUnitConvert } from '@/api/goods'
import http from '@/api/http'
import { useStockRefreshStore } from '@/stores/stockRefresh'

const router = useRouter()
const stockRefreshStore = useStockRefreshStore()

// ── 移动端检测 ────────────────────────────────────────────────────────────────
const isMobile = ref(window.innerWidth < 768)
const drawerVisible = ref(false)
function onResize() { isMobile.value = window.innerWidth < 768 }

// ── 侧边栏拖拽调宽 ────────────────────────────────────────────────────────────
const SIDEBAR_MIN = 180
const SIDEBAR_MAX = 500
const sidebarWidth = ref(Number(localStorage.getItem('stock_sidebar_w') || 260))

function startResize(e: MouseEvent) {
  e.preventDefault()
  const startX = e.clientX
  const startW = sidebarWidth.value
  function onMove(ev: MouseEvent) {
    const w = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW + ev.clientX - startX))
    sidebarWidth.value = w
  }
  function onUp() {
    localStorage.setItem('stock_sidebar_w', String(sidebarWidth.value))
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
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
const sortProp = ref('')
const sortOrder = ref<'ascending' | 'descending' | ''>('')

function handleSortChange({ prop, order }: { prop: string; order: string | null }) {
  sortProp.value = prop || ''
  sortOrder.value = (order as any) || ''
  page.value = 1
}

const warehouses = ref<any[]>([])

// ── 分类面板 ──────────────────────────────────────────────────────────────────
const cateOptions = ref<any[]>([])
const cateLoading = ref(false)

interface CateTreeNode { id: number; name: string; sort: number; parent_id: any; children: CateTreeNode[] }

function buildCateTree(source: any[]) {
  const all: CateTreeNode[] = source.map(c => ({ ...c, children: [] }))
  const map: Record<number, CateTreeNode> = {}
  all.forEach(c => { map[c.id] = c })
  const roots: CateTreeNode[] = []
  all.forEach(c => {
    const pid = Number(c.parent_id ?? 0)
    if (pid && map[pid]) map[pid].children.push(c)
    else roots.push(c)
  })
  return roots
}

const cateTree = computed<CateTreeNode[]>(() => buildCateTree(cateOptions.value))

async function loadCates() {
  cateLoading.value = true
  try {
    const res = await getGoodsCateList({ list_rows: 200 })
    const rows = res.data?.rows ?? []
    cateOptions.value = rows.sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
  } finally {
    cateLoading.value = false
  }
}

// 分类新增/编辑弹框
const cateFormVisible = ref(false)
const cateFormTitle = ref('新增分类')
const cateSaving = ref(false)
const cateForm = reactive({ id: 0, name: '', parent_id: null as any, sort: 0 })

function openCateForm(row?: any) {
  if (row) {
    Object.assign(cateForm, { id: row.id, name: row.name, parent_id: row.parent_id ?? null, sort: row.sort ?? 0 })
    cateFormTitle.value = '编辑分类'
  } else {
    Object.assign(cateForm, { id: 0, name: '', parent_id: null, sort: 0 })
    cateFormTitle.value = '新增分类'
  }
  cateFormVisible.value = true
}

async function handleSaveCate() {
  if (!cateForm.name.trim()) { ElMessage.warning('请输入分类名称'); return }
  const sameLevelDup = cateOptions.value.find(c =>
    c.name.trim() === cateForm.name.trim() &&
    String(c.parent_id ?? '0') === String(cateForm.parent_id ?? '0') &&
    c.id !== cateForm.id
  )
  if (sameLevelDup) { ElMessage.warning(`同级分类下已存在"${cateForm.name}"，请使用其他名称`); return }
  cateSaving.value = true
  try {
    cateForm.id ? await updateGoodsCate(cateForm) : await createGoodsCate(cateForm)
    ElMessage.success('操作成功')
    cateFormVisible.value = false
    await loadCates()
  } finally {
    cateSaving.value = false
  }
}

async function handleDeleteCate(id: number) {
  await ElMessageBox.confirm('确定删除该分类？', '提示', { type: 'warning' })
  await deleteGoodsCate(id)
  ElMessage.success('删除成功')
  if (selectedCate.value === id) selectedCate.value = 0
  await loadCates()
}

// All goods (from goods table - includes zero-stock items)
const allGoods = ref<any[]>([])
const bomGoodsSet = ref<Set<string>>(new Set())
// Stock qty map: goods_id -> qty (from stock/StockAll - updated by inhouse audit)
const stockQtyMap = ref<Record<number, number>>({})
const stockPriceMap = ref<Record<number, number>>({})
// 多单位换算 map: goods_id -> [{unit_name, ratio}] (大单位在前，小单位ratio=1在后)
const unitConvertMap = ref<Record<number, { unit_name: string; ratio: number }[]>>({})
// 快速换算查找：`${goods_id}:${unit_name}` -> ratio（基础单位倍数）
const unitRatioLookup = ref<Record<string, number>>({})

// 反审核/取消/作废单据不计入库存流水展示与统计
function isReversedOrCanceledDoc(row: any): boolean {
  const text = [
    row?.remark,
    row?.type_name,
    row?.flow_type,
    row?.biz_type,
    row?.order_type,
    row?.source_type,
    row?.order_no,
    row?.in_no,
    row?.return_no,
    row?.order_sn,
  ].map(v => String(v || '')).join(' ')
  return /(反审核|取消|作废|撤销|_reverse|reverse)/i.test(text)
}

// 自动翻页拉取所有数据（解决 list_rows=500 上限问题）
async function fetchAllPages(url: string, params: Record<string, any> = {}): Promise<any[]> {
  const pageSize = 500
  const firstRes = await http.get(url, { params: { ...params, list_rows: pageSize, page: 1 } })
  const firstData = firstRes.data
  const rows: any[] = firstData?.rows ?? []
  const total: number = Number(firstData?.total ?? firstData?.count ?? rows.length)
  if (total <= pageSize) return rows
  const totalPages = Math.ceil(total / pageSize)
  const rest = await Promise.allSettled(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      http.get(url, { params: { ...params, list_rows: pageSize, page: i + 2 } })
    )
  )
  for (const r of rest) {
    if (r.status === 'fulfilled') rows.push(...(r.value.data?.rows ?? []))
  }
  return rows
}

async function loadUnitConvertMap() {
  // 只加载 multi_unit=true 的商品
  const multiGoods = allGoods.value.filter(g => g.multi_unit)
  await Promise.allSettled(multiGoods.map(async (g) => {
    try {
      const res = await getUnitConvert(g.id)
      const rows: any[] = res.data?.rows ?? []
      if (rows.length) {
        unitConvertMap.value[g.id] = rows.map((r: any) => ({ unit_name: r.unit_name, ratio: Number(r.ratio) }))
        for (const r of rows) {
          unitRatioLookup.value[`${g.id}:${r.unit_name}`] = Number(r.ratio)
        }
      }
    } catch {}
  }))
}

function formatSpecDisplay(spec: string): string {
  if (!spec) return ''
  try {
    const obj = JSON.parse(spec)
    if (obj.attrs && Array.isArray(obj.attrs) && obj.attrs.length > 0) {
      return obj.attrs.map((a: any) => (a.values || []).join('/')).join('; ')
    }
    return ''
  } catch {}
  return spec
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function inferRatioFromSpec(unitName: string, spec?: string): number | null {
  if (!unitName || !spec) return null
  const escapedUnit = escapeRegExp(unitName)
  const match = String(spec).match(new RegExp(`(^|[^\\d.])(\\d+(?:\\.\\d+)?)\\s*[/／]\\s*${escapedUnit}($|[^\\u4e00-\\u9fa5A-Za-z0-9_])`))
  const ratio = match ? Number(match[2]) : 0
  return ratio > 0 ? ratio : null
}

// 从 spec 里提取"X斤"数值（用于旧导入记录，explicit unit_ratio 缺失时优先读 spec）
function inferBaseQtyFromSpec(spec?: string): number | null {
  if (!spec) return null
  const m = String(spec).match(/(\d+(?:\.\d+)?)\s*斤/)
  return m ? Number(m[1]) : null
}

// 将 goods_info item 的数量换算为基础单位数量
function toBaseQty(goodsId: number, unitName: string, num: number, spec?: string, unitRatio?: any): number {
  const explicitRatio = Number(unitRatio || 0)
  // unit_ratio > 1：明确的大单位比例，直接用
  if (explicitRatio > 1) return num * explicitRatio
  // unit_ratio = 0：未存比例，先读 spec，再查换算表
  if (explicitRatio === 0) {
    const specRatio = inferBaseQtyFromSpec(spec)
    if (specRatio !== null) return num * specRatio
    const ratio = unitRatioLookup.value[`${goodsId}:${unitName}`] ?? inferRatioFromSpec(unitName, spec)
    return ratio ? num * ratio : num
  }
  // unit_ratio = 1：可能是"基础单位"，也可能是保存时未写入正确比例的 bug
  // 若换算表说该单位是大单位（ratio > 1），优先用换算表（修正写入 bug）
  const lookupRatio = unitRatioLookup.value[`${goodsId}:${unitName}`]
  if (lookupRatio && lookupRatio > 1) return num * lookupRatio
  return num
}

// 将小单位数量换算为 "X大单位 Y小单位" 格式
function formatStockWithUnits(goodsId: number, qty: number, baseUnit: string): string {
  return formatStockMain(goodsId, qty, baseUnit)
}

// 主显示：总基础单位数量
function formatStockMain(goodsId: number, qty: number, baseUnit: string): string {
  const display = Number.isInteger(qty) ? qty.toString() : qty.toFixed(2).replace(/\.?0+$/, '')
  // 只有当 goods.unit_name 在换算表里是大单位（ratio > 1），库存才存在更小基础单位里，才切换标签
  const units = unitConvertMap.value[goodsId]
  const tableBase = units?.find(u => u.ratio === 1)
  const baseUnitRatio = unitRatioLookup.value[`${goodsId}:${baseUnit}`]
  const label = (tableBase && tableBase.unit_name !== baseUnit && baseUnitRatio && baseUnitRatio > 1)
    ? tableBase.unit_name : baseUnit
  return `${display} ${label}`
}

// 辅助显示：有大单位时显示"X大单位Y基础单位"，有小单位时显示"X小单位"
function formatStockSub(goodsId: number, qty: number, baseUnit: string): string {
  const units = unitConvertMap.value[goodsId]
  if (!units || units.length < 2) return ''
  const tableBase = units.find(u => u.ratio === 1)
  const baseLabel = tableBase ? tableBase.unit_name : baseUnit
  const otherUnits = units.filter(u => u.ratio !== 1)
  if (!otherUnits.length) return ''
  const largeUnit = otherUnits.find(u => u.ratio > 1)
  if (largeUnit) {
    if (largeUnit.unit_name === baseLabel) return ''  // 大单位=基础单位，无意义
    const sign = qty < 0 ? -1 : 1
    const absQty = Math.abs(qty)
    const large = Math.floor(absQty / largeUnit.ratio)
    const small = absQty % largeUnit.ratio
    if (large === 0) return ''
    if (small === 0) return `${sign < 0 ? '-' : ''}${large}${largeUnit.unit_name}`
    return `${sign < 0 ? '-' : ''}${large}${largeUnit.unit_name}${small.toFixed(0)}${baseLabel}`
  }
  // 没有大单位，显示小单位换算（如1斤=2袋）
  const smallUnit = otherUnits.reduce((a, b) => a.ratio < b.ratio ? a : b)
  if (smallUnit.ratio <= 0) return ''
  const converted = qty / smallUnit.ratio
  if (converted === 0) return ''
  return `${converted % 1 === 0 ? converted.toFixed(0) : converted.toFixed(1)}${smallUnit.unit_name}`
}

// 获取大单位的移动均价（= 小单位均价 × 换算比）
function getLargeUnitPrice(goodsId: number, basePrice: number): { unit: string; price: number } | null {
  const units = unitConvertMap.value[goodsId]
  if (!units || units.length < 2) return null
  const largeUnit = units.reduce((a, b) => b.ratio > a.ratio ? b : a)
  if (largeUnit.ratio <= 1) return null
  return { unit: largeUnit.unit_name, price: basePrice * largeUnit.ratio }
}
// Net deduction map: goods_id -> qty deducted by sales+retail (not yet reflected in StockAll)
const deductQtyMap = ref<Record<number, number>>({})

// Activity maps: goods_id -> count
const inhouseCountMap = ref<Record<number, number>>({})
const returnCountMap = ref<Record<number, number>>({})
const saleCountMap = ref<Record<number, number>>({})
const retailCountMap = ref<Record<number, number>>({})
const otherInCountMap = ref<Record<number, number>>({})
const otherOutCountMap = ref<Record<number, number>>({})
const prodInCountMap = ref<Record<number, number>>({})
const prodOutCountMap = ref<Record<number, number>>({})

function getStockQty(row: any): number {
  return stockQtyMap.value[row.id] ?? Number(row.stock_num ?? 0)
}

function getAvgPrice(row: any): number {
  return stockPriceMap.value[row.id] ?? Number(row.cost_price ?? 0)
}

// Recursively collect all descendant cate ids (including self)
function getCateIds(id: number): number[] {
  const ids: number[] = []
  function collect(cateId: number) {
    ids.push(cateId)
    // find in flat cateOptions for all children
    cateOptions.value.forEach(c => {
      if (Number(c.parent_id) === cateId) collect(c.id)
    })
  }
  collect(id)
  return ids
}

// Filtered list (client-side after loading all goods)
const filteredGoods = computed(() => {
  let rows = allGoods.value

  // 选了具体仓库时，隐藏零库存商品
  if (selectedWarehouse.value) {
    rows = rows.filter(r => getStockQty(r) > 0)
  }

  if (selectedCate.value) {
    const matchIds = getCateIds(selectedCate.value)
    rows = rows.filter(r => matchIds.includes(Number(r.cate_id)))
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

  if (sortProp.value && sortOrder.value) {
    const dir = sortOrder.value === 'ascending' ? 1 : -1
    rows = [...rows].sort((a, b) => {
      let av: any, bv: any
      if (sortProp.value === '__stock_qty') {
        av = getStockQty(a); bv = getStockQty(b)
      } else if (sortProp.value === '__stock_value') {
        av = getStockQty(a) * getAvgPrice(a); bv = getStockQty(b) * getAvgPrice(b)
      } else {
        av = a[sortProp.value] ?? ''; bv = b[sortProp.value] ?? ''
      }
      if (typeof av === 'string') return dir * av.localeCompare(bv)
      return dir * (av - bv)
    })
  }

  return rows
})

const totalQty = computed(() => filteredGoods.value.reduce((s, r) => s + getStockQty(r), 0))
const totalStockValue = computed(() => filteredGoods.value.reduce((s, r) => s + getStockQty(r) * getAvgPrice(r), 0))
const negativeStockCount = computed(() => filteredGoods.value.filter(r => getStockQty(r) < 0).length)
const negativeStockItems = computed(() => {
  const unitMap: Record<string, number> = {}
  for (const r of filteredGoods.value) {
    const qty = getStockQty(r)
    if (qty < 0) {
      const unit = r.unit_name || ''
      unitMap[unit] = (unitMap[unit] || 0) + qty
    }
  }
  return Object.entries(unitMap)
    .map(([unit, qty]) => ({ unit, qty }))
    .sort((a, b) => a.qty - b.qty)
})
const lowStockCount = computed(() => filteredGoods.value.filter(r => Number(r.safe_min) > 0 && getStockQty(r) < Number(r.safe_min)).length)
const zeroStockCount = computed(() => filteredGoods.value.filter(r => getStockQty(r) === 0).length)
const highStockCount = computed(() => filteredGoods.value.filter(r => Number(r.safe_max) > 0 && getStockQty(r) > Number(r.safe_max)).length)

const overviewStats = computed(() => [
  { label: '商品总数', value: filteredGoods.value.length },
  { label: '总库存', value: totalQty.value.toFixed(2) },
  { label: '库存总值', value: '¥' + totalStockValue.value.toFixed(2) },
  { label: '库存不足', value: lowStockCount.value },
  { label: '零库存', value: zeroStockCount.value },
])

const tableSummaryText = computed(() => {
  const filters = []
  if (selectedCate.value) {
    const cate = cateOptions.value.find(item => item.id === selectedCate.value)
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
    const cate = cateOptions.value.find(item => item.id === selectedCate.value)
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
  if (stock < 0) return '负库存'
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
  if (id) {
    // 选了具体仓库：先用后端 qty，同时刷新均价
    loadStockMap(id)
  } else {
    // 切回全部：重算流水汇总
    reloadStockRelatedData()
  }
  page.value = 1
}

function selectCate(id: number) {
  selectedCate.value = Number(id)
  page.value = 1
}

async function loadAllGoods() {
  const res = await getGoodsList({ list_rows: 2000 })
  allGoods.value = res.data?.rows ?? []
  await loadUnitConvertMap()
}

async function loadStockMap(warehouseId = 0) {
  try {
    // 后端不支持 warehouse_id 过滤，全量拉取后前端过滤
    const res: any = await getStockList({ list_rows: 2000 })
    let rows: any[] = res?.data?.rows ?? res?.rows ?? []

    // 按仓库过滤（前端过滤，后端不支持 warehouse_id 参数）
    // 注意：StockAll 里默认仓库存的是 warehouse_id=0，不是 WarehouseName 表里的 id
    let filteredRows = rows
    if (warehouseId) {
      // 先找该仓库名称，用名称匹配（因为 StockAll.warehouse_id 和 WarehouseName.id 可能对不上）
      const whInfo = warehouses.value.find((w: any) => w.id === warehouseId)
      const whName = whInfo?.name || ''
      if (whName === '默认仓库' || warehouseId === 1) {
        // 默认仓库在 StockAll 里存为 warehouse_id=0
        filteredRows = rows.filter((r: any) => Number(r.warehouse_id) === 0 || r.warehouse_name === '默认仓库' || r.warehouse_name === '')
      } else {
        filteredRows = rows.filter((r: any) => Number(r.warehouse_id) === warehouseId || r.warehouse_name === whName)
      }
    }

    // 选了具体仓库时，用 StockAll 的 qty 做仓库级别覆盖
    if (warehouseId) {
      const idQtyMap: Record<number, number> = {}
      for (const r of filteredRows) {
        const gid = Number(r.goods_id || 0)
        if (gid) {
          const goods = allGoods.value.find((g: any) => Number(g.id) === gid)
          idQtyMap[gid] = (idQtyMap[gid] || 0) + toBaseQty(gid, r.unit_name || '', Number(r.qty ?? 0), goods?.spec)
        }
      }
      const qtyMap: Record<number, number> = {}
      for (const g of allGoods.value) {
        qtyMap[g.id] = idQtyMap[g.id] ?? 0
      }
      stockQtyMap.value = qtyMap
    }

    // goods_code -> qty map（均价计算用，保留兼容）
    const snQtyMap: Record<string, number> = {}
    for (const r of filteredRows) {
      const sn = r.goods_code || r.goods_sn
      if (!sn) continue
      snQtyMap[sn] = (snQtyMap[sn] || 0) + Number(r.qty ?? r.stock_num ?? 0)
    }

    // 移动加权平均价：采购入库 + BOM物料成本
    const snTotalCost: Record<string, number> = {}
    const snTotalQty: Record<string, number> = {}
    try {
      const ihRes = await http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } })

      // 采购入库单
      const ihRows: any[] = ihRes.data?.rows ?? []
      // 建 goods_sn -> goods_id 映射，用于单位换算
      const snToGid: Record<string, number> = {}
      for (const g of allGoods.value) {
        if (g.goods_sn) snToGid[g.goods_sn] = g.id
      }
      for (const ih of ihRows) {
        if (Number(ih.status) !== 1) continue
        try {
          const items: any[] = Array.isArray(ih.goods_info) ? ih.goods_info : JSON.parse(ih.goods_info || '[]')
          for (const item of items) {
            const sn = item.goods_sn
            if (!sn) continue
            const rawQty = Number(item.num || 0)
            const price = Number(item.price || 0)
            if (rawQty > 0 && price > 0) {
              // 换算为基础单位数量和单价
              const gid = snToGid[sn] || 0
              const baseQty = gid ? toBaseQty(gid, item.unit_name, rawQty, item.spec, item.unit_ratio) : rawQty
              const basePrice = baseQty > 0 ? (rawQty * price) / baseQty : price
              snTotalCost[sn] = (snTotalCost[sn] || 0) + baseQty * basePrice
              snTotalQty[sn] = (snTotalQty[sn] || 0) + baseQty
            }
          }
        } catch {}
      }

      // BOM产品：成品均价 = BOM各物料用量 × 物料采购均价 之和
      // 先建 goods_sn -> 采购均价 的映射
      const snAvgPrice: Record<string, number> = {}
      for (const _sn in snTotalQty) {
        if (snTotalQty[_sn] > 0) snAvgPrice[_sn] = snTotalCost[_sn] / snTotalQty[_sn]
      }
      // 查BOM表
      let bomRows: any[] = []
      try {
        const bomRes = await http.get('/goods/BomGoods/index', { params: { list_rows: 500 } })
        bomRows = bomRes.data?.list ?? bomRes.data?.rows ?? []
      } catch {}
      // 按 goods_sn 记录有BOM的成品
      const bomSnSet = new Set<string>()
      for (const b of bomRows) {
        const sn = b.goods_sn || ''
        if (sn) bomSnSet.add(sn)
      }
      bomGoodsSet.value = bomSnSet
      // 按 goods_sn 分组BOM物料
      const bomMap: Record<string, { material_sn: string; num: number }[]> = {}
      for (const b of bomRows) {
        const sn = b.goods_sn || ''
        if (!sn) continue
        if (!bomMap[sn]) bomMap[sn] = []
        bomMap[sn].push({ material_sn: b.material_sn || '', num: Number(b.num || 0) })
      }
      // 有BOM定义的商品，用BOM物料成本算均价
      for (const sn in bomMap) {
        let bomCost = 0
        for (const mat of bomMap[sn]) {
          bomCost += mat.num * (snAvgPrice[mat.material_sn] || 0)
        }
        if (bomCost > 0) {
          snTotalCost[sn] = bomCost
          snTotalQty[sn] = 1
        }
      }
    } catch {}

    // 再用商品表的 goods_sn 匹配商品 id（仅更新均价，库存数量由 loadActivityMaps 流水汇总）
    const priceMap: Record<number, number> = {}
    for (const g of allGoods.value) {
      const sn = g.goods_sn
      if (!sn) continue
      // 移动加权平均价 = 采购总额 / 采购总量
      if (snTotalQty[sn] > 0) {
        priceMap[g.id] = snTotalCost[sn] / snTotalQty[sn]
      }
    }
    stockPriceMap.value = priceMap
  } catch { /* ignore */ }
}

async function loadActivityMaps() {
  try {
    const [inhouseRows, retailRowsRaw, returnRows, otherInRows, otherOutRows, prodInRows, prodOutRows] = await Promise.all([
      fetchAllPages('/procure/ProcureInhouse/index').catch(() => [] as any[]),
      fetchAllPages('/retail/order/index').catch(() => [] as any[]),
      fetchAllPages('/procure/ProcureReturn/index').catch(() => [] as any[]),
      fetchAllPages('/stock/OtherIn/index').catch(() => [] as any[]),
      fetchAllPages('/stock/OtherOut/index').catch(() => [] as any[]),
      fetchAllPages('/production/inhouse/index').catch(() => [] as any[]),
      fetchAllPages('/production/material/index').catch(() => [] as any[]),
    ])

    // 流水库存汇总：goods_id -> 净数量（入库为正，出库为负）
    const fqMap: Record<number, number> = {}

    // 退货单涉及的入库单 id 集合，用于排除
    const returnInhouseIds = new Set<number>()
    for (const r of returnRows) {
      const inhouseId = Number(r.inhouse_id || 0)
      if (inhouseId) returnInhouseIds.add(inhouseId)
    }

    // Inhouse (采购入库) — 排除退货触发的入库单
    const inMap: Record<number, number> = {}
    for (const r of inhouseRows) {
      if (Number(r.status) !== 1) continue  // 只统计已审核
      if (isReversedOrCanceledDoc(r)) continue
      if (returnInhouseIds.has(Number(r.id))) continue
      if (String(r.remark || '').includes('退货')) continue
      try {
        const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
        const goodsInThisOrder = new Set<number>()
        for (const item of items) {
          const gid = Number(item.goods_id)
          const qty = Number(item.num || 0)
          if (gid) {
            goodsInThisOrder.add(gid)
            fqMap[gid] = (fqMap[gid] || 0) + toBaseQty(gid, item.unit_name, qty, item.spec, item.unit_ratio) // 入库 +
          }
        }
        for (const gid of goodsInThisOrder) {
          inMap[gid] = (inMap[gid] || 0) + 1
        }
      } catch { /* ignore */ }
    }
    inhouseCountMap.value = inMap

    // Return (采购退货出库)
    const retMap: Record<number, number> = {}
    for (const r of returnRows) {
        if (r.status !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        try {
          const allItems = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const items = allItems.filter((i: any) => !i._meta)
          const goodsInThisReturn = new Set<number>()
          for (const item of items) {
            const gid = Number(item.goods_id)
            const qty = Number(item.num || 0)
            if (gid) {
              goodsInThisReturn.add(gid)
              fqMap[gid] = (fqMap[gid] || 0) - toBaseQty(gid, item.unit_name, qty, item.spec, item.unit_ratio) // 退货出库 -
            }
          }
          for (const gid of goodsInThisReturn) {
            retMap[gid] = (retMap[gid] || 0) + 1
          }
        } catch { /* ignore */ }
    }
    returnCountMap.value = retMap

    // Sale out orders (销售出库)
    const dMap: Record<number, number> = {}
    const sMap: Record<number, number> = {}
    try {
      const saleRows: any[] = await fetchAllPages('/stock/SaleOutOrder/index', { status: 1 })
      for (const r of saleRows) {
        if (Number(r.status) !== 1) continue  // 只统计已审核
        if (isReversedOrCanceledDoc(r)) continue
        try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const goodsInThisOrder = new Set<number>()
          for (const item of items) {
            const gid = Number(item.goods_id)
            const qty = Number(item.num || 0)
            if (gid) {
              goodsInThisOrder.add(gid)
              dMap[gid] = (dMap[gid] || 0) + qty
              fqMap[gid] = (fqMap[gid] || 0) - toBaseQty(gid, item.unit_name, qty, item.spec, item.unit_ratio) // 销售出库 -
            }
          }
          for (const gid of goodsInThisOrder) {
            sMap[gid] = (sMap[gid] || 0) + 1
          }
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    saleCountMap.value = sMap

    // Retail (零售出库) — 只统计已审核
    const retailRows = retailRowsRaw.filter((r: any) => Number(r.status) === 1)
    const rMap: Record<number, number> = {}
    for (const r of retailRows) {
      if (isReversedOrCanceledDoc(r)) continue
      try {
        const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
        const goodsInThisOrder = new Set<number>()
        for (const item of items) {
          const gid = Number(item.goods_id)
          const qty = Number(item.num || item.qty || 0)
          if (gid) {
            goodsInThisOrder.add(gid)
            dMap[gid] = (dMap[gid] || 0) + qty
            fqMap[gid] = (fqMap[gid] || 0) - toBaseQty(gid, item.unit_name, qty, item.spec, item.unit_ratio) // 零售出库 -
          }
        }
        for (const gid of goodsInThisOrder) {
          rMap[gid] = (rMap[gid] || 0) + 1
        }
      } catch { /* ignore */ }
    }
    retailCountMap.value = rMap
    deductQtyMap.value = dMap

    // Other In (其他入库)
    const oiMap: Record<number, number> = {}
    for (const r of otherInRows) {
        if (Number(r.status) !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const goodsInThis = new Set<number>()
          for (const item of items) {
            const gid = Number(item.goods_id)
            const qty = Number(item.num || 0)
            if (gid) {
              goodsInThis.add(gid)
              fqMap[gid] = (fqMap[gid] || 0) + toBaseQty(gid, item.unit_name, qty, item.spec, item.unit_ratio) // 其他入库 +
            }
          }
          for (const gid of goodsInThis) {
            oiMap[gid] = (oiMap[gid] || 0) + 1
          }
        } catch { /* ignore */ }
    }
    otherInCountMap.value = oiMap

    // Other Out (其他出库) — 跳过为零售/销售出库单创建的 OtherOut（对应单据已在各自流水中计入）
    const ooMap: Record<number, number> = {}
    for (const r of otherOutRows) {
        if (Number(r.status) !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        const _rem = String(r.remark || '')
        if (_rem.startsWith('零售') || _rem.startsWith('销售出库')) continue
        try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const goodsInThis = new Set<number>()
          for (const item of items) {
            const gid = Number(item.goods_id)
            const qty = Number(item.num || 0)
            if (gid) {
              goodsInThis.add(gid)
              fqMap[gid] = (fqMap[gid] || 0) - toBaseQty(gid, item.unit_name, qty, item.spec, item.unit_ratio) // 其他出库 -
            }
          }
          for (const gid of goodsInThis) {
            ooMap[gid] = (ooMap[gid] || 0) + 1
          }
        } catch { /* ignore */ }
    }
    otherOutCountMap.value = ooMap

    // Production Inhouse (生产入库) — 单品记录
    const piMap: Record<number, number> = {}
    for (const r of prodInRows) {
        if (r.status !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        const gid = Number(r.goods_id)
        const qty = Number(r.inhouse_qty || r.qty || 0)
        if (gid) {
          piMap[gid] = (piMap[gid] || 0) + 1
          fqMap[gid] = (fqMap[gid] || 0) + qty // 生产入库 +
        }
    }
    prodInCountMap.value = piMap

    // Production Material (生产领料)
    const pmMap: Record<number, number> = {}
    for (const r of prodOutRows) {
        if (r.status !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const goodsInThis = new Set<number>()
          for (const item of items) {
            const gid = Number(item.goods_id)
            const qty = Number(item.num || 0)
            if (gid) {
              goodsInThis.add(gid)
              fqMap[gid] = (fqMap[gid] || 0) - qty // 生产领料 -
            }
          }
          for (const gid of goodsInThis) {
            pmMap[gid] = (pmMap[gid] || 0) + 1
          }
        } catch { /* ignore */ }
    }
    prodOutCountMap.value = pmMap

    // 用流水汇总覆盖库存数量（toBaseQty 已修正 unit_ratio=1 的写入 bug）
    stockQtyMap.value = fqMap
  } catch { /* ignore */ }
}

async function loadMeta() {
  const warehouseRes = await getWarehouseList({ list_rows: 200 })
  warehouses.value = warehouseRes.data?.rows ?? []
}

// ── 出入库流水弹窗 ────────────────────────────────────────────────────────────
const flowDialogVisible = ref(false)
const flowLoading = ref(false)
const flowGoodsName = ref('')
const flowRows = ref<any[]>([])
const flowHasMultiUnit = ref(false)

const flowTypeMap: Record<string, { label: string; tag: string; direction: '+' | '-' }> = {
  in: { label: '采购入库', tag: 'success', direction: '+' },
  return_in: { label: '采购退货', tag: 'warning', direction: '-' },
  out: { label: '销售出库', tag: 'danger', direction: '-' },
  retail: { label: '零售出库', tag: 'primary', direction: '-' },
  other_in: { label: '其他入库', tag: 'success', direction: '+' },
  other_out: { label: '其他出库', tag: 'danger', direction: '-' },
  prod_in: { label: '生产入库', tag: 'success', direction: '+' },
  prod_out: { label: '生产领料', tag: 'warning', direction: '-' },
}

function goToDoc(row: any) {
  flowDialogVisible.value = false
  if (row._type === 'in') {
    router.push({ path: '/procure/inhouse', query: { in_no: row._sn } })
  } else if (row._type === 'return_in') {
    router.push({ path: '/procure/return', query: { return_no: row._sn } })
  } else if (row._type === 'out') {
    router.push('/sale/out')
  } else if (row._type === 'retail') {
    router.push('/retail/order')
  } else if (row._type === 'other_in') {
    router.push('/warehouse/other-in')
  } else if (row._type === 'other_out') {
    router.push('/warehouse/other-out')
  } else if (row._type === 'prod_in') {
    router.push('/production/inhouse')
  } else if (row._type === 'prod_out') {
    router.push('/production/material')
  }
}

async function openFlowDialog(goods: any) {
  flowGoodsName.value = goods.goods_name || ''
  flowDialogVisible.value = true
  flowLoading.value = true
  flowRows.value = []
  flowHasMultiUnit.value = !!goods.multi_unit
  try {
    const gid = Number(goods.id)
    const rows: any[] = []

    const [
      inhouseAllRows,
      procureOrderAllRows,
      saleOutAllRows,
      retailAllRows,
      returnAllRows,
      otherInAllRows,
      otherOutAllRows,
      prodInAllRows,
      prodOutAllRows,
    ] = await Promise.all([
      fetchAllPages('/procure/ProcureInhouse/index').catch(() => [] as any[]),
      fetchAllPages('/stock/PurchaseOrder/index').catch(() => [] as any[]),
      fetchAllPages('/stock/SaleOutOrder/index', { status: 1 }).catch(() => [] as any[]),
      fetchAllPages('/retail/order/index').catch(() => [] as any[]),
      fetchAllPages('/procure/ProcureReturn/index').catch(() => [] as any[]),
      fetchAllPages('/stock/OtherIn/index').catch(() => [] as any[]),
      fetchAllPages('/stock/OtherOut/index').catch(() => [] as any[]),
      fetchAllPages('/production/inhouse/index').catch(() => [] as any[]),
      fetchAllPages('/production/material/index').catch(() => [] as any[]),
    ])
    const procureOrderById: Record<number, any> = {}
    for (const order of procureOrderAllRows) {
      const id = Number(order.id || 0)
      if (id) procureOrderById[id] = order
    }

    // 采购入库
    for (const r of inhouseAllRows) {
      if (Number(r.status) !== 1) continue  // 只统计已审核
      if (isReversedOrCanceledDoc(r)) continue
      try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const matchedItems = items.filter((i: any) =>
            (gid && Number(i.goods_id) === gid) ||
            (goods.goods_name && i.goods_name === goods.goods_name)
          )
          // 每行单独一条记录，保留原始单位和数量
          for (const item of matchedItems) {
            const procureOrder = procureOrderById[Number(r.purchase_order_id || 0)]
            const displayQty = Number(item.num || 0)
            const displayUnit = item.unit_name || ''
            rows.push({
              _type: 'in',
              _sn: r.in_no || r.inhouse_no || '',
              _qty: displayQty,
              _unit: displayUnit,
              _price: Number(item.price || 0),
              _date: procureOrder?.order_date || r.order_date || r.in_date || r.inhouse_date || r.created_at || r.create_time || '',
              _partner: r.supplier_name || '',
            })
          }
        } catch { /* ignore */ }
    }

    // 采购退货（出库）
    for (const r of returnAllRows) {
        if (r.status !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        try {
          const allItems = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const items = allItems.filter((i: any) => !i._meta)
          const matched = items.find((i: any) =>
            (gid && Number(i.goods_id) === gid) ||
            (goods.goods_name && i.goods_name === goods.goods_name)
          )
          if (matched) {
            rows.push({
              _type: 'return_in',
              _sn: r.return_no || '',
              _qty: Number(matched.num || 0),
              _unit: matched.unit_name || '',
              _price: Number(matched.price || 0),
              _date: r.return_date || r.created_at || r.create_time || '',
              _partner: r.supplier_name || '',
            })
          }
        } catch { /* ignore */ }
    }

    // 销售出库
    for (const r of saleOutAllRows) {
        if (Number(r.status) !== 1) continue  // 只统计已审核
        if (isReversedOrCanceledDoc(r)) continue
        try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const matched = items.find((i: any) =>
            (gid && Number(i.goods_id) === gid) ||
            (goods.goods_name && i.goods_name === goods.goods_name)
          )
          if (matched) {
            const m = (r.remark || '').match(/^\[NO:([^\]]+)\]/)
            rows.push({
              _type: 'out',
              _sn: m ? m[1] : (r.order_sn || r.order_no || ''),
              _qty: Number(matched.num || 0),
              _unit: matched.unit_name || '',
              _price: Number(matched.price || 0),
              _date: r.out_date || r.created_at || r.create_time || '',
              _partner: r.customer_name || '',
            })
          }
        } catch { /* ignore */ }
    }

    // 零售出库
    for (const r of retailAllRows) {
        if (Number(r.status) !== 1) continue  // 只统计已审核
        if (isReversedOrCanceledDoc(r)) continue
        try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const matched = items.find((i: any) =>
            (gid && Number(i.goods_id) === gid) ||
            (goods.goods_name && i.goods_name === goods.goods_name)
          )
          if (matched) {
            rows.push({
              _type: 'retail',
              _sn: r.order_no || '',
              _qty: Number(matched.num || 0),
              _unit: matched.unit_name || '',
              _price: Number(matched.price || 0),
              _date: r.order_date || r.created_at || r.create_time || '',
              _partner: r.member_name || '散客',
            })
          }
        } catch { /* ignore */ }
    }

    // 其他入库
    for (const r of otherInAllRows) {
        if (Number(r.status) !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const matched = items.find((i: any) =>
            (gid && Number(i.goods_id) === gid) ||
            (goods.goods_name && i.goods_name === goods.goods_name)
          )
          if (matched) {
            rows.push({
              _type: 'other_in',
              _sn: r.order_no || '',
              _qty: Number(matched.num || 0),
              _unit: matched.unit_name || '',
              _price: Number(matched.price || 0),
              _date: r.in_date || r.created_at || '',
              _partner: r.remark || '',
            })
          }
        } catch { /* ignore */ }
    }

    // 其他出库 — 跳过为零售/销售出库单创建的 OtherOut（对应单据已在各自流水中显示）
    for (const r of otherOutAllRows) {
        if (Number(r.status) !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        const _rem = String(r.remark || '')
        if (_rem.startsWith('零售') || _rem.startsWith('销售出库')) continue
        try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const matched = items.find((i: any) =>
            (gid && Number(i.goods_id) === gid) ||
            (goods.goods_name && i.goods_name === goods.goods_name)
          )
          if (matched) {
            rows.push({
              _type: 'other_out',
              _sn: r.order_no || '',
              _qty: Number(matched.num || 0),
              _unit: matched.unit_name || '',
              _price: Number(matched.price || 0),
              _date: r.out_date || r.created_at || '',
              _partner: r.remark || '',
            })
          }
        } catch { /* ignore */ }
    }

    // 生产入库（单品记录，不是 goods_info 数组）
    for (const r of prodInAllRows) {
        if (r.status !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        if ((gid && Number(r.goods_id) === gid) || (goods.goods_name && r.goods_name === goods.goods_name)) {
          rows.push({
            _type: 'prod_in',
            _sn: r.inhouse_no || r.order_sn || '',
            _qty: Number(r.inhouse_qty || r.qty || 0),
            _unit: r.unit_name || '',
            _price: 0,
            _date: r.inhouse_date || r.created_at || r.create_time || '',
            _partner: r.remark?.replace(/\n【SYS_PI_META】.*/s, '') || '',
          })
        }
    }

    // 生产领料（goods_info 数组）
    for (const r of prodOutAllRows) {
        if (r.status !== 1) continue
        if (isReversedOrCanceledDoc(r)) continue
        try {
          const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const matched = items.find((i: any) =>
            (gid && Number(i.goods_id) === gid) ||
            (goods.goods_name && i.goods_name === goods.goods_name)
          )
          if (matched) {
            rows.push({
              _type: 'prod_out',
              _sn: r.order_sn || '',
              _qty: Number(matched.num || 0),
              _unit: matched.unit_name || '',
              _price: Number(matched.out_price || 0),
              _date: r.pick_date || r.created_at || '',
              _partner: r.remark || '',
            })
          }
        } catch { /* ignore */ }
    }

    // 按日期排序
    rows.sort((a, b) => (a._date > b._date ? -1 : 1))
    flowRows.value = rows
  } catch { /* ignore */ } finally {
    flowLoading.value = false
  }
}

async function reloadStockRelatedData() {
  await Promise.allSettled([
    loadStockMap(selectedWarehouse.value),
    loadActivityMaps(),
  ])
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  loading.value = true
  try {
    await loadAllGoods()
    await Promise.allSettled([loadMeta(), loadCates(), loadStockMap(), loadActivityMaps()])
  } finally {
    loading.value = false
  }
})

onActivated(() => {
  reloadStockRelatedData()
})

watch(() => stockRefreshStore.version, () => {
  reloadStockRelatedData()
})
</script>

<style scoped>
:deep(.bom-row) {
  background-color: #fdf6ec !important;
}
:deep(.bom-row:hover > td) {
  background-color: #faecd8 !important;
}
.stock-page {
  display: flex;
  height: 100%;
}

.stock-sidebar {
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: row;
  position: relative;
}

.sidebar-inner {
  flex: 1;
  padding: 10px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: row;
  gap: 0;
  min-width: 0;
}

.sidebar-resize-handle {
  width: 5px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  margin-right: 12px;
}

.sidebar-resize-handle:hover {
  background: #dbeafe;
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

.sidebar-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  display: flex;
  align-items: center;
  gap: 4px;
}

.sidebar-item:hover {
  background: #f0f7ff;
}

.sidebar-item.active {
  background: #e6f0ff;
  color: #409eff;
  font-weight: 600;
}

.sidebar-item-child {
  padding-left: 16px;
}

.cate-arrow {
  flex-shrink: 0;
  transition: transform 0.2s;
  transform: rotate(0deg);
  font-size: 12px;
}

.cate-arrow.expanded {
  transform: rotate(90deg);
}

.cate-arrow-placeholder {
  display: inline-block;
  width: 12px;
  flex-shrink: 0;
}

.cate-item-name {
  flex: 1;
  white-space: normal;
  word-break: break-all;
}

.cate-item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
}

.sidebar-item:hover .cate-item-actions,
.el-tree-node__content:hover .cate-item-actions {
  opacity: 1;
}

.act-icon {
  font-size: 13px;
  color: rgba(29,29,31,0.35);
  cursor: pointer;
  padding: 2px;
}

.act-icon:hover { color: #0071e3; }
.act-icon.danger:hover { color: #dc2626; }

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

.mobile-stock-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-stock-empty {
  padding: 28px 0;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.mobile-stock-card {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  overflow: hidden;
}

.mobile-stock-card.is-bom {
  background: #fffbf2;
  border-color: #f5d7a1;
}

.mobile-stock-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.mobile-stock-card__title-wrap {
  flex: 1;
  min-width: 0;
}

.mobile-stock-card__title {
  font-size: 14px;
  line-height: 1.4;
  font-weight: 600;
  color: #303133;
  word-break: break-word;
}

.mobile-stock-card__meta {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  font-size: 12px;
  color: #909399;
  word-break: break-all;
}

.mobile-stock-card__bom {
  flex-shrink: 0;
  background: #e6a23c;
  color: #fff;
  border-color: #e6a23c;
}

.mobile-stock-card__inline {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0;
  font-size: 12px;
}

.mobile-stock-card__sep {
  color: #c2c8d5;
  margin: 0 2px;
}

.mobile-stock-card__item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-stock-card__label {
  font-size: 11px;
  color: #909399;
}

.mobile-stock-card__value {
  font-size: 13px;
  color: #303133;
  word-break: break-word;
}

.mobile-stock-card__value--link {
  color: #409eff;
}

.mobile-stock-card__actions {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f2f3f5;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

@media (max-width: 767px) {
  .stock-page {
    flex-direction: column;
  }
  .stock-topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .stock-topbar > div:last-child {
    width: 100%;
  }
  .stock-topbar > div:last-child .el-select {
    flex: 1;
    min-width: 0;
  }
  .stock-topbar > div:last-child .el-input {
    flex: 1;
    min-width: 0;
    width: auto !important;
  }
  .topbar-left {
    flex-wrap: wrap;
    gap: 4px 8px;
  }
  .stat-label {
    font-size: 11px !important;
  }
  .pager-row {
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  }
  .pager-row .el-pagination__sizes,
  .pager-row .el-pagination__jump {
    display: none;
  }
  .mobile-stock-card {
    padding: 10px;
    border-radius: 10px;
  }
  .mobile-stock-card__inline {
    gap: 4px;
  }
}
/* 移动端抽屉高度限制 */
:deep(.el-drawer) {
  max-height: 100vh !important;
}
:deep(.el-drawer__body) {
  height: 100%;
  overflow-y: auto;
}
</style>
