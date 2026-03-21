<template>
  <div class="inhouse-page">

    <!-- ── 列表视图 ─────────────────────────────────────────────────────── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getProductionInhouseList"
            del-path="/production/inhouse/batchDel"
            export-file-name="生产入库" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.order_sn" placeholder="入库单号" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width:160px" />
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增生产入库</el-button>
          </template>
          <el-table-column prop="order_sn" label="入库单号" min-width="150" />
          <el-table-column prop="goods_name" label="商品名称" min-width="150" />
          <el-table-column prop="inhouse_qty" label="入库数量" width="100" align="right" />
          <el-table-column prop="unit_name" label="单位" width="70" align="center" />
          <el-table-column prop="warehouse_name" label="入库仓库" min-width="110" />
          <el-table-column prop="inhouse_date" label="入库日期" width="110">
            <template #default="{ row }">{{ (row.inhouse_date || row.create_time || '').slice(0,10) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">查看</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="handleAudit(row, 1)">审核</el-button>
              <el-button v-if="row.status === 0" type="danger" size="small" link @click="handleAudit(row, 2)">驳回</el-button>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" size="small" link @click="handleAudit(row, 0)">反审核</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ── 新增/编辑/查看表单 ─────────────────────────────────────────── -->
    <div v-else class="form-page">
      <!-- 顶部操作栏 -->
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">返回</el-button>
          <span class="form-title">{{ isView ? '查看生产入库' : fd.id ? '编辑生产入库' : '新增生产入库' }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">已审核</el-tag>
          <el-tag v-else-if="fd.status === 2" type="danger" size="small">已驳回</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">保存并审核（Ctrl+S）</el-button>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <!-- 生产计划单 -->
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label required">生产计划单</span>
                <el-input v-model="fd.plan_name" placeholder="请选择生产计划单" readonly style="flex:1" />
                <el-button v-if="!isView" type="primary" @click="openPlanPicker">选择生产计划单</el-button>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label">入库单号</span>
                <el-input v-model="fd.order_sn" placeholder="入库单号（不填写自动生成）" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label">入库日期</span>
                <el-date-picker v-model="fd.in_date" type="date" value-format="YYYY-MM-DD"
                  style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label">入库仓库</span>
                <el-select v-model="fd.warehouse_id" placeholder="请选择仓库" style="flex:1"
                  :disabled="isView" @change="onWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="field-row">
                <span class="field-label">倒冲领料</span>
                <span v-if="isView || fd.status === 1" style="flex:1;color:#666">{{ fd.back_flush ? '已开启' : '未开启' }}</span>
                <el-tooltip v-else
                  :content="hasMaterial ? '该计划已有手工领料单，不可倒冲' : ''"
                  :disabled="!hasMaterial"
                  placement="top">
                  <el-switch v-model="fd.back_flush" :disabled="hasMaterial" />
                </el-tooltip>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 商品清单 -->
        <div class="goods-section">
          <div class="goods-header">
            <span>商品清单</span>
            <span class="goods-summary">
              成本合计：<b>{{ totalCost.toFixed(2) }}</b>
              &nbsp;&nbsp;入库总价：<b>{{ totalInPrice.toFixed(2) }}</b>
            </span>
          </div>
          <el-table :data="fd.items" border size="small" style="width:100%" empty-text="请先选择生产计划单">
            <el-table-column type="index" width="45" align="center" />
            <el-table-column prop="goods_sn" label="商品编码" width="120" />
            <el-table-column prop="goods_name" label="商品名称" min-width="140" />
            <el-table-column prop="spec" label="规格型号" width="110" />
            <el-table-column prop="unit_name" label="单位" width="65" align="center" />
            <el-table-column prop="plan_num" label="生产数量" width="90" align="right" />
            <el-table-column label="可入库数量" width="100" align="right">
              <template #default="{ row }">
                <span :style="{ color: (row.plan_num - row.already_in) > 0 ? '#16a34a' : '#dc2626' }">
                  {{ Math.max(0, (row.plan_num || 0) - (row.already_in || 0)).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="本次入库数量" width="130" align="right">
              <template #header>
                本次入库数量
                <el-button link type="primary" size="small" @click="batchSetNum">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.num }}</span>
              </template>
            </el-table-column>
            <el-table-column label="物料单价" width="120" align="right">
              <template #header>
                物料单价
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('material_price')">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.material_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.material_price }}</span>
              </template>
            </el-table-column>
            <el-table-column label="物料合计" width="110" align="right">
              <template #header>
                物料合计
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('material_total')">批量</el-button>
              </template>
              <template #default="{ row }">
                <span>{{ ((row.num || 0) * (row.material_price || 0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="加工单价" width="120" align="right">
              <template #header>
                加工单价
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('process_price')">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.process_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.process_price }}</span>
              </template>
            </el-table-column>
            <el-table-column label="加工合计" width="110" align="right">
              <template #header>
                加工合计
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('process_total')">批量</el-button>
              </template>
              <template #default="{ row }">
                <span>{{ ((row.num || 0) * (row.process_price || 0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="总成本" width="110" align="right">
              <template #default="{ row }">
                <b style="color:#0071e3">{{ row.total_cost?.toFixed(2) ?? '0.00' }}</b>
              </template>
            </el-table-column>
            <el-table-column label="入库单价" width="120" align="right">
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.in_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.in_price }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 备注 -->
        <div class="remark-section">
          <el-row :gutter="16">
            <el-col :span="16">
              <div class="field-row">
                <span class="field-label">备注</span>
                <el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" />
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>

    <!-- 生产计划选择弹框 -->
    <el-dialog v-model="planPickerVisible" title="选择生产计划单" width="800px" append-to-body>
      <el-table :data="planList" border size="small" height="400"
        @row-click="onSelectPlan" style="cursor:pointer">
        <el-table-column label="计划单号" width="150">
          <template #default="{ row }">{{ row.order_sn || `SC${(row.plan_date||row.created_at||'').slice(0,10).replace(/-/g,'')}${String(row.id).padStart(3,'0')}` }}</template>
        </el-table-column>
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="schedule_num" label="排产数量" width="100" align="right" />
        <el-table-column prop="actual_num" label="已生产" width="100" align="right" />
        <el-table-column prop="finish_date" label="完工日期" width="110">
          <template #default="{ row }">{{ (row.finish_date || '').slice(0,10) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '已审核' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 批量设置弹框 -->
    <el-dialog v-model="batchVisible" :title="`批量设置 ${batchLabel}`" width="320px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" @click="applyBatch">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import ScTable from '@/components/ScTable.vue'
import { getProductionInhouseList, createProductionInhouse, updateProductionInhouse, deleteProductionInhouse, auditProductionInhouse } from '@/api/production'
import { getProductionPlanList } from '@/api/production'
import { getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { createExpense } from '@/api/finance'
import { createMaterial, auditMaterial } from '@/api/production'
import { getBomByGoods } from '@/api/goods'
import { applyMaterialStockDelta } from '@/utils/materialStock'

const route = useRoute()
const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()
const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({})

// ── 视图状态 ─────────────────────────────────────────────────────────────────
const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)
const hasMaterial = ref(false) // 该计划是否已有手工领料单

// ── 表单数据 ─────────────────────────────────────────────────────────────────
function defaultFd() {
  return {
    id: 0,
    order_sn: '',
    plan_id: 0,
    plan_name: '',
    in_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
    warehouse_id: null as any,
    warehouse_name: '',
    admin_name: '',
    back_flush: false,
    remark: '',
    status: 0,
    items: [] as any[],
  }
}
const fd = reactive(defaultFd())

// ── 仓库选项 ─────────────────────────────────────────────────────────────────
const warehouseOptions = ref<any[]>([])
async function loadWarehouses() {
  try {
    const res = await getWarehouseList({ list_rows: 100 })
    warehouseOptions.value = res.data?.rows ?? []
  } catch {}
}

function onWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.warehouse_name = w?.name ?? ''
}

// ── 计算 ─────────────────────────────────────────────────────────────────────
function calcRow(row: any) {
  row.total_cost = ((row.num || 0) * ((row.material_price || 0) + (row.process_price || 0)))
  row.in_price = (row.material_price || 0) + (row.process_price || 0)
}

const totalCost = computed(() =>
  fd.items.reduce((s, r) => s + (r.total_cost || 0), 0)
)
const totalInPrice = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.in_price || 0), 0)
)

// ── 打开表单 ─────────────────────────────────────────────────────────────────
async function openAdd() {
  Object.assign(fd, defaultFd())
  fd.items = []
  isView.value = false
  showForm.value = true
  await loadWarehouses()
}

function buildItemsFromRow(row: any) {
  if (row.goods_info) {
    try { return JSON.parse(row.goods_info) } catch {}
  }
  if (row.goods_id || row.goods_name) {
    return [{
      goods_id: row.goods_id || 0,
      goods_name: row.goods_name || '',
      goods_sn: row.goods_sn || '',
      unit_name: row.unit_name || '',
      spec: row.spec || '',
      plan_num: Number(row.inhouse_qty || 0),
      already_in: 0,
      num: Number(row.inhouse_qty || 0),
      material_price: 0,
      process_price: 0,
      in_price: 0,
      total_cost: 0,
    }]
  }
  return []
}

function openEdit(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  fd.items = buildItemsFromRow(row)
  fd.items.forEach(r => calcRow(r))
  isView.value = false
  showForm.value = true
  loadWarehouses()
  const planSn = row.plan_name ? row.plan_name.split(' - ')[0] : ''
  checkHasMaterial(Number(row.plan_id || 0), planSn)
}

function openView(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  fd.items = buildItemsFromRow(row)
  fd.items.forEach(r => calcRow(r))
  isView.value = true
  showForm.value = true
  loadWarehouses()
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

function buildAuditStockItems(row: any) {
  const fallbackItem = {
    goods_id: row.goods_id || 0,
    goods_name: row.goods_name || '',
    goods_sn: row.goods_sn || '',
    num: Number(row.inhouse_qty || 0),
    unit_name: row.unit_name || '',
    avg_price: Number(row.in_price || row.avg_price || 0),
    warehouse_id: row.warehouse_id || 0,
    warehouse_name: row.warehouse_name || '',
  }

  const items = (() => {
    if (!row?.goods_info) return [fallbackItem]
    try {
      const parsed = JSON.parse(row.goods_info || '[]')
      return Array.isArray(parsed) && parsed.length ? parsed : [fallbackItem]
    } catch {
      return [fallbackItem]
    }
  })()

  return items
    .map((item: any) => ({
      goods_id: item.goods_id || row.goods_id || 0,
      goods_name: item.goods_name || row.goods_name || '',
      goods_sn: item.goods_sn || row.goods_sn || '',
      num: Number(item.num ?? item.inhouse_qty ?? row.inhouse_qty ?? 0),
      unit_name: item.unit_name || row.unit_name || '',
      avg_price: Number(item.in_price ?? item.avg_price ?? row.in_price ?? row.avg_price ?? 0),
      warehouse_id: item.warehouse_id || row.warehouse_id || 0,
      warehouse_name: item.warehouse_name || row.warehouse_name || '',
    }))
    .filter((item: any) => (item.goods_id || item.goods_sn || item.goods_name) && item.num > 0)
}

async function syncAuditAndStock(row: any, status: 0 | 1) {
  await auditProductionInhouse(row.id, status)

  const items = buildAuditStockItems(row)
  if (!items.length) return { changedCount: 0 }

  try {
    return await applyMaterialStockDelta(items, {
      direction: status === 1 ? 'restore' : 'deduct',
      defaultWarehouseId: row.warehouse_id,
      defaultWarehouseName: row.warehouse_name || '',
    })
  } catch (error) {
    try {
      await auditProductionInhouse(row.id, status === 1 ? 0 : 1)
    } catch {}
    throw error
  }
}

function getResponseId(res: any, fallbackId = 0) {
  return Number(res?.data?.id || res?.data?.data?.id || res?.data || fallbackId || 0)
}

async function autoAuditSavedRows(rows: any[]) {
  const auditedRows: any[] = []

  try {
    for (const row of rows) {
      await syncAuditAndStock(row, 1)
      auditedRows.push(row)
    }
    return { changedCount: auditedRows.length }
  } catch (error) {
    for (const row of [...auditedRows].reverse()) {
      try {
        await syncAuditAndStock(row, 0)
      } catch {}
    }
    throw error
  }
}

// ── 检查计划是否已有手工领料单 ────────────────────────────────────────────────
async function checkHasMaterial(planId: number, planSn: string) {
  hasMaterial.value = false
  if (!planId) return
  try {
    const mRes = await http.get('/production/material/index', {
      params: { list_rows: 500, production_plan_id: planId }
    })
    const mRows: any[] = mRes.data?.rows ?? []
    for (const mr of mRows) {
      const mrPlanId = Number(mr.production_plan_id || mr.plan_id || 0)
      const snMatch = planSn && (mr.order_sn || '').includes(planSn)
      if ((mrPlanId === planId || snMatch) && Number(mr.status) === 1) {
        hasMaterial.value = true
        return
      }
    }
  } catch {}
}

// ── 生产计划选择器 ────────────────────────────────────────────────────────────
const planPickerVisible = ref(false)
const planList = ref<any[]>([])

async function openPlanPicker() {
  try {
    const res = await getProductionPlanList({ list_rows: 200, status: 1 })
    planList.value = res.data?.rows ?? []
  } catch {}
  planPickerVisible.value = true
}

async function onSelectPlan(plan: any) {
  fd.plan_id = plan.id
  const planSn = plan.order_sn || `SC${(plan.plan_date||plan.created_at||'').slice(0,10).replace(/-/g,'')}${String(plan.id).padStart(3,'0')}`
  fd.plan_name = `${planSn} - ${plan.goods_name}`
  planPickerVisible.value = false

  // 查该计划已审核的领料单，汇总物料总价，同时设置 hasMaterial
  let materialTotalPrice = 0
  let materialTotalNum = 0
  hasMaterial.value = false
  try {
    const mRes = await http.get('/production/material/index', {
      params: { list_rows: 500, production_plan_id: plan.id }
    })
    const mRows: any[] = mRes.data?.rows ?? []
    const pid = Number(plan.id)
    for (const mr of mRows) {
      const mrPlanId = Number(mr.production_plan_id || mr.plan_id || 0)
      const snMatch = planSn && (mr.order_sn || '').includes(planSn)
      if ((mrPlanId === pid || snMatch) && Number(mr.status) === 1) {
        hasMaterial.value = true
        materialTotalPrice += Number(mr.total_price || 0)
        try {
          const items: any[] = JSON.parse(mr.goods_info || '[]')
          materialTotalNum += items.reduce((s, i) => s + Number(i.num || 0), 0)
        } catch {}
      }
    }
    // 如果按 plan_id 过滤后没有结果，再全量扫描一次（兼容后端不支持过滤的情况）
    if (!hasMaterial.value && mRows.length === 0) {
      const mRes2 = await http.get('/production/material/index', { params: { list_rows: 1000 } })
      const mRows2: any[] = mRes2.data?.rows ?? []
      for (const mr of mRows2) {
        const mrPlanId = Number(mr.production_plan_id || mr.plan_id || 0)
        const snMatch = planSn && (mr.order_sn || '').includes(planSn)
        if ((mrPlanId === pid || snMatch) && Number(mr.status) === 1) {
          hasMaterial.value = true
          materialTotalPrice += Number(mr.total_price || 0)
          try {
            const items: any[] = JSON.parse(mr.goods_info || '[]')
            materialTotalNum += items.reduce((s, i) => s + Number(i.num || 0), 0)
          } catch {}
        }
      }
    }
  } catch {}

  // 加载该计划的商品（从 goods_info 解析）
  try {
    let items: any[] = []
    try { items = JSON.parse(plan.goods_info || '[]') } catch {}
    if (!items.length && plan.goods_id) {
      items = [{
        goods_id: plan.goods_id,
        goods_name: plan.goods_name,
        goods_sn: plan.goods_sn || '',
        unit_name: plan.unit_name || '',
        spec: '',
        plan_num: plan.schedule_num || plan.plan_num || 0,
        already_in: plan.inhouse_num || 0,
        num: Math.max(0, (plan.schedule_num || plan.plan_num || 0) - (plan.inhouse_num || 0)),
        material_price: 0,
        process_price: 0,
        in_price: 0,
        total_cost: 0,
      }]
    } else {
      items = items.map(i => ({
        ...i,
        plan_num: i.plan_num || i.num || 0,
        already_in: i.already_in || 0,
        num: i.num || 0,
        material_price: i.material_price || 0,
        process_price: i.process_price || 0,
        in_price: i.in_price || 0,
        total_cost: 0,
      }))
    }

    // 自动填入物料单价：领料总价 ÷ 计划总数量
    const planTotalNum = items.reduce((s, i) => s + Number(i.num || 0), 0)
    if (materialTotalPrice > 0 && planTotalNum > 0) {
      const unitMaterialPrice = materialTotalPrice / planTotalNum
      items.forEach(item => {
        item.material_price = Number(unitMaterialPrice.toFixed(4))
      })
      ElMessage.success(`已自动带入物料成本：¥${materialTotalPrice.toFixed(2)}`)
    }

    items.forEach(r => calcRow(r))
    fd.items = items
  } catch {}
}

// ── 批量设置 ─────────────────────────────────────────────────────────────────
const batchVisible = ref(false)
const batchField = ref('')
const batchLabel = ref('')
const batchValue = ref(0)

function batchSetNum() {
  batchField.value = 'num'
  batchLabel.value = '本次入库数量'
  batchValue.value = 0
  batchVisible.value = true
}

function batchSetField(field: string) {
  const labels: Record<string, string> = {
    material_price: '物料单价',
    material_total: '物料合计（按数量平摊）',
    process_price: '加工单价',
    process_total: '加工合计（按数量平摊）',
  }
  batchField.value = field
  batchLabel.value = labels[field] || field
  batchValue.value = 0
  batchVisible.value = true
}

function applyBatch() {
  const field = batchField.value
  const val = batchValue.value
  for (const row of fd.items) {
    if (field === 'material_total') {
      row.material_price = row.num > 0 ? val / row.num : 0
    } else if (field === 'process_total') {
      row.process_price = row.num > 0 ? val / row.num : 0
    } else {
      row[field] = val
    }
    calcRow(row)
  }
  batchVisible.value = false
}

// ── 保存 ─────────────────────────────────────────────────────────────────────
async function handleSave() {
  if (!fd.plan_id) {
    ElMessage.warning('请选择生产计划单')
    return
  }
  if (!fd.items.length) {
    ElMessage.warning('请添加商品')
    return
  }
  saving.value = true
  try {
    const basePayload: any = {
      plan_id: fd.plan_id,
      plan_no: fd.plan_name,
      inhouse_date: fd.in_date,
      warehouse_id: fd.warehouse_id || 0,
      warehouse_name: fd.warehouse_name || '',
      admin_name: fd.admin_name || '',
      remark: fd.remark || '',
      inhouse_no: fd.order_sn || '',
    }
    const savedRows: any[] = []
    if (fd.id) {
      // 编辑：用第一个商品更新
      const item0 = fd.items[0] || {}
      const updatePayload = {
        ...basePayload,
        id: fd.id,
        goods_id: item0.goods_id || 0,
        goods_name: fd.items.map((i: any) => i.goods_name).join('、').slice(0, 100),
        inhouse_qty: fd.items.reduce((s: number, r: any) => s + (Number(r.num) || 0), 0),
      }
      await updateProductionInhouse(updatePayload)
      savedRows.push({
        ...updatePayload,
        goods_sn: item0.goods_sn || '',
        unit_name: item0.unit_name || '',
        in_price: Number(item0.in_price || 0),
      })
    } else {
      // 新增：每个商品保存一条记录
      for (const item of fd.items) {
        const createPayload = {
          ...basePayload,
          goods_id: item.goods_id || 0,
          goods_name: item.goods_name || '',
          inhouse_qty: Number(item.num) || 0,
        }
        const res = await createProductionInhouse(createPayload)
        savedRows.push({
          ...createPayload,
          id: getResponseId(res),
          goods_sn: item.goods_sn || '',
          unit_name: item.unit_name || '',
          in_price: Number(item.in_price || 0),
        })
      }
    }

    const { changedCount } = await autoAuditSavedRows(savedRows)

    const processTotal = fd.items.reduce((s: number, r: any) => s + (Number(r.num) || 0) * (Number(r.process_price) || 0), 0)
    if (processTotal > 0) {
      await createExpense({
        type_name: '人工成本',
        amount: processTotal,
        apply_date: fd.in_date || new Date().toISOString().slice(0, 10),
        order_sn: fd.order_sn || '',
        remark: `生产入库人工成本 - ${fd.items.map((i: any) => i.goods_name).join('、').slice(0, 80)}`,
      })
    }

    // 倒冲领料：按 BOM 自动生成领料单并扣减库存
    if (fd.back_flush && fd.warehouse_id) {
      try {
        // 汇总所有成品需要的原材料（BOM × 本次入库数量）
        const materialMap = new Map<number, any>()
        for (const item of fd.items) {
          const qty = Number(item.num) || 0
          if (!qty || !item.goods_id) continue
          const bomRes = await getBomByGoods(item.goods_id)
          const bomItems: any[] = bomRes.data?.list ?? bomRes.data?.rows ?? bomRes.data ?? []
          for (const bom of bomItems) {
            const matId = Number(bom.material_id || bom.goods_id)
            const need = (Number(bom.num) || 0) * qty
            if (!matId || need <= 0) continue
            if (materialMap.has(matId)) {
              materialMap.get(matId).num += need
            } else {
              materialMap.set(matId, {
                goods_id: matId,
                goods_name: bom.material_name || bom.goods_name || '',
                goods_sn: bom.material_sn || bom.goods_sn || '',
                unit_name: bom.unit_name || '',
                num: need,
                out_price: Number(bom.cost_price || bom.price || 0),
                warehouse_id: fd.warehouse_id,
                warehouse_name: fd.warehouse_name || '',
              })
            }
          }
        }
        const matItems = [...materialMap.values()]
        if (matItems.length) {
          const matRes = await createMaterial({
            pick_date: fd.in_date || new Date().toISOString().slice(0, 10),
            production_plan_id: fd.plan_id || 0,
            plan_name: fd.plan_name || '',
            admin_name: fd.admin_name || '',
            warehouse_id: fd.warehouse_id,
            warehouse_name: fd.warehouse_name || '',
            remark: `倒冲领料 - ${fd.items.map((i: any) => i.goods_name).join('、').slice(0, 80)}`,
            goods_info: JSON.stringify(matItems),
            goods_name: matItems.map(i => i.goods_name).join('、').slice(0, 100),
            total_price: matItems.reduce((s, i) => s + i.num * i.out_price, 0),
          })
          const matId = Number(matRes.data?.id || matRes.data?.data?.id || matRes.data)
          if (matId) {
            await auditMaterial(matId, 1)
          }
          await applyMaterialStockDelta(matItems, {
            direction: 'deduct',
            defaultWarehouseId: fd.warehouse_id,
            defaultWarehouseName: fd.warehouse_name || '',
          })
          stockRefreshStore.trigger()
          ElMessage.success(`倒冲领料完成，已扣减 ${matItems.length} 种原材料`)
        }
      } catch (e: any) {
        ElMessage.warning(`倒冲领料失败：${e?.message ?? '未知错误'}，请手工补录领料单`)
      }
    }
    ElMessage.success(`保存并审核成功，库存已增加 ${changedCount} 项`)
    stockRefreshStore.trigger()
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

// ── 审核/删除 ────────────────────────────────────────────────────────────────
async function handleAudit(row: any, status: number) {
  const action = status === 1 ? '审核通过' : status === 2 ? '驳回' : '反审核'
  await ElMessageBox.confirm(`确定${action}该生产入库单？`, '提示', { type: 'warning' })
  try {
    if (status === 2) {
      await auditProductionInhouse(row.id, status)
      ElMessage.success(`${action}成功`)
      tableRef.value?.refresh()
      return
    }

    const { changedCount } = await syncAuditAndStock(row, status as 0 | 1)
    stockRefreshStore.trigger()
    ElMessage.success(
      status === 1
        ? `${action}成功，库存已增加 ${changedCount} 项`
        : `${action}成功，库存已回滚 ${changedCount} 项`
    )
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该生产入库记录？', '提示', { type: 'warning' })
  await deleteProductionInhouse(id)
  ElMessage.success('删除成功')
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
}

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

async function initFromQuery() {
  const { plan_id, plan_name, goods_info } = route.query
  if (!plan_id) return

  await loadWarehouses()
  Object.assign(fd, defaultFd())
  fd.plan_id = Number(plan_id)

  const planItems: any[] = JSON.parse(String(goods_info || '[]'))
  fd.plan_name = String(plan_name || '')
  fd.items = []
  if (!planItems.length) { isView.value = false; showForm.value = true; checkHasMaterial(Number(plan_id), String(plan_name || '')); return }

  // 1. 查该计划已审核领料单，汇总每种商品的物料总价
  const materialPriceMap: Record<number, number> = {} // goods_id → 总金额
  const materialNumMap: Record<number, number> = {}   // goods_id → 总数量
  try {
    const mRes = await http.get('/production/material/index', { params: { list_rows: 500 } })
    const mRows: any[] = mRes.data?.rows ?? []
    const pid = Number(plan_id)
    for (const mr of mRows) {
      const mrPlanId = Number(mr.production_plan_id || mr.plan_id || 0)
      if (mrPlanId !== pid || Number(mr.status) !== 1) continue
      try {
        const items: any[] = JSON.parse(mr.goods_info || '[]')
        for (const it of items) {
          const gid = Number(it.goods_id)
          const num = Number(it.num || 0)
          const price = Number(it.out_price || it.price || 0)
          materialNumMap[gid] = (materialNumMap[gid] || 0) + num
          materialPriceMap[gid] = (materialPriceMap[gid] || 0) + num * price
        }
      } catch {}
    }
  } catch {}

  // 2. 查商品采购价作为兜底
  const costPriceMap: Record<number, number> = {}
  try {
    const goodsIds = planItems.map(gi => gi.goods_id).filter(Boolean)
    const gRes = await http.get('/goods/ShopGoods/index', { params: { list_rows: 200 } })
    const gRows: any[] = gRes.data?.rows ?? gRes.data?.list ?? []
    for (const g of gRows) {
      if (goodsIds.includes(g.id)) costPriceMap[g.id] = Number(g.cost_price || 0)
    }
  } catch {}

  // 3. 组装 items
  let hasPrice = false
  for (const gi of planItems) {
    const gid = Number(gi.goods_id)
    const num = Number(gi.num || 0)
    // 物料单价：领料单实际单价 > 商品采购价 > 0
    let materialPrice = 0
    if (materialNumMap[gid] > 0) {
      materialPrice = Number((materialPriceMap[gid] / materialNumMap[gid]).toFixed(4))
    } else if (costPriceMap[gid] > 0) {
      materialPrice = costPriceMap[gid]
    }
    if (materialPrice > 0) hasPrice = true
    const item = {
      goods_id: gid,
      goods_name: gi.goods_name,
      goods_sn: gi.goods_sn || '',
      unit_name: gi.unit_name || '',
      num,
      material_price: materialPrice,
      process_price: 0,
      in_price: materialPrice,
      total_cost: 0,
    }
    calcRow(item)
    fd.items.push(item)
  }
  if (hasPrice) ElMessage.success('已自动带入物料成本')
  isView.value = false
  checkHasMaterial(Number(plan_id), String(plan_name || ''))
  showForm.value = true
}

// 防止 onMounted + onActivated 在首次加载时都触发导致重复
let _initDone = false
onMounted(async () => { _initDone = false; await initFromQuery(); _initDone = true })
onActivated(async () => { if (_initDone) await initFromQuery() })
</script>

<style scoped>
.inhouse-page { height: 100%; }

/* 表单页 */
.form-page { display: flex; flex-direction: column; height: 100%; background: #f5f6fa; }
.form-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.06);
}
.form-topbar-left { display: flex; align-items: center; gap: 10px; }
.form-title { font-size: 15px; font-weight: 600; color: #1d1d1f; }

.form-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.form-section { background: #fff; border-radius: 12px; padding: 16px 20px; }

/* 字段行 */
.field-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.field-label { font-size: 13px; color: rgba(29,29,31,0.5); white-space: nowrap; width: 70px; flex-shrink: 0; }
.field-label.required::before { content: '* '; color: #dc2626; }

/* 商品清单 */
.goods-section { background: #fff; border-radius: 12px; padding: 16px 20px; }
.goods-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px; font-size: 13px; font-weight: 600; color: #1d1d1f;
}
.goods-summary { font-size: 13px; color: rgba(29,29,31,0.5); font-weight: normal; }
.goods-summary b { color: #0071e3; }

.remark-section { background: #fff; border-radius: 12px; padding: 16px 20px; }
</style>
