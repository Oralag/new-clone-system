<template>
  <div class="material-page">
    <div v-if="!showForm">
      <el-card>
        <ScTable
          ref="tableRef"
          :api-obj="getMaterialList"
          del-path="/production/material/batchDel"
          export-file-name="生产领料"
          :params="searchForm"
        >
          <template #search>
            <el-input v-model="searchForm.order_sn" placeholder="领料单号" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width:160px" />
            <el-button type="primary" @click="loadSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增领料</el-button>
          </template>
          <el-table-column prop="order_sn" label="领料单号" min-width="150">
            <template #default="{ row }">{{ row.order_sn || row.out_no || `LL${String(row.id || '').padStart(4, '0')}` }}</template>
          </el-table-column>
          <el-table-column prop="admin_name" label="领料人" width="100">
            <template #default="{ row }">{{ row.admin_name || row.receiver || '—' }}</template>
          </el-table-column>
          <el-table-column label="领料日期" width="110">
            <template #default="{ row }">{{ (row.pick_date || row.out_date || row.created_at || '').slice(0, 10) }}</template>
          </el-table-column>
          <el-table-column prop="warehouse_name" label="出库仓库" min-width="120" />
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
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="doAudit(row, 1)">审核</el-button>
              <el-button v-if="row.status === 0" type="danger" size="small" link @click="doAudit(row, 2)">驳回</el-button>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" size="small" link @click="doAudit(row, 0)">反审核</el-button>
              <el-button
                type="danger"
                size="small"
                link
                :disabled="row.status === 1"
                :title="row.status === 1 ? '请先反审核再删除' : ''"
                @click="handleDelete(row.id)"
              >删除</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <div v-else class="form-page">
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">返回</el-button>
          <span class="form-title">{{ isView ? '查看领料单' : fd.id ? '编辑领料单' : '新增领料单' }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">已审核</el-tag>
          <el-tag v-else-if="fd.status === 2" type="danger" size="small">已驳回</el-tag>
        </div>
        <div v-if="!isView" class="form-topbar-right">
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        </div>
      </div>

      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">领料日期</span>
                <el-date-picker v-model="fd.pick_date" type="date" value-format="YYYY-MM-DD" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">领料人</span>
                <StaffSelect v-if="!isView" v-model="fd.admin_name" placeholder="领料人" style="flex:1" />
                <span v-else style="flex:1">{{ fd.admin_name || '—' }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">默认仓库</span>
                <el-select v-if="!isView" v-model="fd.warehouse_id" placeholder="选择仓库" style="flex:1" @change="onWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
                <span v-else style="flex:1">{{ fd.warehouse_name || '—' }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">关联计划</span>
                <el-select
                  v-if="!isView"
                  v-model="fd.production_plan_id"
                  placeholder="可选"
                  style="flex:1"
                  filterable
                  clearable
                  @focus="loadPlanOptions"
                  @change="onPlanSelect"
                  @clear="clearPlan"
                >
                  <el-option
                    v-for="p in planList"
                    :key="p.id"
                    :label="`${p.order_sn || ('SC' + (p.plan_date || p.created_at || '').slice(0, 10).replace(/-/g, '') + String(p.id).padStart(3, '0'))} · ${p.goods_name || ''}`"
                    :value="p.id"
                  />
                </el-select>
                <span v-else style="flex:1">{{ fd.plan_name || fd.production_plan_id || '—' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <div v-if="!isView" class="goods-toolbar">
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">选择商品</el-button>
          <el-button size="small" @click="addEmptyRow">手动添加行</el-button>
          <span class="goods-summary">领料总价：<b>{{ totalPrice.toFixed(2) }}</b></span>
        </div>
        <div v-else class="goods-summary-view">领料总价：<b>{{ totalPrice.toFixed(2) }}</b></div>

        <el-table :data="fd.items" border size="small" style="width:100%" empty-text="请添加领料商品">
          <el-table-column type="index" label="#" width="45" align="center" />
          <el-table-column label="商品名称" min-width="140">
            <template #default="{ row }">
              <el-input v-if="!isView" v-model="row.goods_name" size="small" />
              <span v-else>{{ row.goods_name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="商品编码" width="110">
            <template #default="{ row }">{{ row.goods_sn || '—' }}</template>
          </el-table-column>
          <el-table-column label="单位" width="70" align="center">
            <template #default="{ row }">{{ row.unit_name || '—' }}</template>
          </el-table-column>
          <el-table-column label="出库仓库" width="140">
            <template #default="{ row }">
              <el-select
                v-if="!isView"
                v-model="row.warehouse_id"
                size="small"
                placeholder="选仓库"
                style="width:100%"
                @change="(id: any) => onRowWarehouseChange(row, id)"
              >
                <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
              <span v-else>{{ row.warehouse_name || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库存" width="80" align="right">
            <template #default="{ row }">
              <span :style="{ color: Number(row.stock_num || 0) > 0 ? '#16a34a' : '#dc2626' }">
                {{ row.stock_num != null ? Number(row.stock_num).toFixed(2).replace(/\.00$/, '') : '—' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="领料数量" width="110">
            <template #header>
              领料数量
              <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('num', '领料数量')">批量</el-button>
            </template>
            <template #default="{ row }">
              <el-input-number
                v-if="!isView"
                v-model="row.num"
                :min="0"
                :precision="2"
                controls-position="right"
                size="small"
                style="width:100%"
                @change="calcRow(row)"
              />
              <span v-else>{{ row.num }}</span>
            </template>
          </el-table-column>
          <el-table-column label="出库单价" width="110">
            <template #header>
              出库单价
              <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('out_price', '出库单价')">批量</el-button>
            </template>
            <template #default="{ row }">
              <el-input-number
                v-if="!isView"
                v-model="row.out_price"
                :min="0"
                :precision="4"
                controls-position="right"
                size="small"
                style="width:100%"
                @change="calcRow(row)"
              />
              <span v-else>{{ row.out_price }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计" width="100" align="right">
            <template #default="{ row }"><b style="color:#dc2626">{{ ((row.num || 0) * (row.out_price || 0)).toFixed(2) }}</b></template>
          </el-table-column>
          <el-table-column label="备注" min-width="100">
            <template #default="{ row }">
              <el-input v-if="!isView" v-model="row.remark" size="small" placeholder="备注" />
              <span v-else>{{ row.remark || '' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!isView" label="" width="50" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" :icon="Delete" @click="fd.items.splice($index, 1)" />
            </template>
          </el-table-column>
        </el-table>

        <div class="form-footer">
          <div class="footer-summary">合计：数量 <b>{{ totalNum.toFixed(2) }}</b>&nbsp;&nbsp;总价 <b style="color:#dc2626">{{ totalPrice.toFixed(2) }}</b></div>
          <div class="field-row" style="margin-top:8px">
            <span class="field-label">备注</span>
            <el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" />
          </div>
        </div>
      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <el-dialog v-model="batchVisible" :title="`批量设置：${batchLabel}`" width="280px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" @click="applyBatch">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import StaffSelect from '@/components/StaffSelect.vue'
import { getMaterialList, createMaterial, deleteMaterial, auditMaterial } from '@/api/production'
import { getProductionPlanList } from '@/api/production'
import { getWarehouseList } from '@/api/warehouse'
import { getBomByGoods } from '@/api/goods'
import http from '@/api/http'
import { applyMaterialStockDelta } from '@/utils/materialStock'
import { usePermissionStore } from '@/stores/permission'

const route = useRoute()
const permStore = usePermissionStore()
const tableRef = ref<InstanceType<typeof ScTable>>()
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

const today = () => new Date().toISOString().slice(0, 10)
const toNumber = (value: any) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const searchForm = reactive({ order_sn: '', out_no: '', goods_name: '' })
function loadSearch() {
  searchForm.out_no = searchForm.order_sn
  tableRef.value?.loadData()
}
function resetSearch() {
  searchForm.order_sn = ''
  searchForm.out_no = ''
  searchForm.goods_name = ''
  tableRef.value?.loadData()
}

const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)
const warehouseOptions = ref<any[]>([])
const planList = ref<any[]>([])

async function loadWarehouses() {
  try {
    const r = await getWarehouseList({ list_rows: 200 })
    warehouseOptions.value = r.data?.list || r.data?.rows || r.data?.data || []
  } catch {}
}

function getWarehouseName(warehouseId: any) {
  return warehouseOptions.value.find((item: any) => Number(item.id) === Number(warehouseId))?.name || ''
}

function defaultFd() {
  return {
    id: 0,
    status: 0,
    order_sn: '',
    pick_date: today(),
    production_plan_id: 0,
    plan_name: '',
    admin_name: '',
    remark: '',
    warehouse_id: null as any,
    warehouse_name: '',
    items: [] as any[],
  }
}

const fd = reactive(defaultFd())

function normalizeItem(raw: any = {}) {
  const warehouseId = toNumber(raw.warehouse_id || fd.warehouse_id || 0)
  const warehouseName = raw.warehouse_name || getWarehouseName(warehouseId) || fd.warehouse_name || ''
  const row = {
    goods_id: toNumber(raw.goods_id),
    goods_name: raw.goods_name || raw.name || '',
    goods_sn: raw.goods_sn || '',
    spec: raw.spec || '',
    unit_name: raw.unit_name || '',
    stock_num: raw.stock_num ?? null,
    warehouse_id: warehouseId || null,
    warehouse_name: warehouseName,
    num: toNumber(raw.num ?? raw.qty),
    out_price: toNumber(raw.out_price ?? raw.price ?? raw.cost_price),
    row_total: 0,
    remark: raw.remark || '',
  }
  row.row_total = row.num * row.out_price
  return row
}

function buildFormFromRow(row: any) {
  Object.assign(fd, defaultFd(), {
    ...row,
    order_sn: row.order_sn || row.out_no || '',
    pick_date: row.pick_date || row.out_date || today(),
    production_plan_id: toNumber(row.production_plan_id || row.plan_id),
    plan_name: row.plan_name || '',
    admin_name: row.admin_name || row.receiver || '',
    warehouse_id: row.warehouse_id ?? null,
    warehouse_name: row.warehouse_name || '',
  })
  try {
    fd.items = JSON.parse(row.goods_info || '[]').map((item: any) => normalizeItem(item))
  } catch {
    fd.items = []
  }
}

function calcRow(row: any) {
  row.row_total = toNumber(row.num) * toNumber(row.out_price)
}

const totalNum = computed(() => fd.items.reduce((sum, row) => sum + toNumber(row.num), 0))
const totalPrice = computed(() => fd.items.reduce((sum, row) => sum + toNumber(row.num) * toNumber(row.out_price), 0))

async function loadRowStock(row: any, warehouseId?: any) {
  const resolvedWarehouseId = toNumber(warehouseId || row.warehouse_id || fd.warehouse_id || 0)
  row.warehouse_id = resolvedWarehouseId || null
  row.warehouse_name = row.warehouse_name || getWarehouseName(resolvedWarehouseId) || fd.warehouse_name || ''
  if (!resolvedWarehouseId || !row.goods_id) {
    row.stock_num = resolvedWarehouseId ? 0 : null
    return
  }
  row.stock_num = null
  try {
    const res = await http.get('/stock/StockAll/index', {
      params: { warehouse_id: resolvedWarehouseId, goods_id: row.goods_id, list_rows: 100 },
    })
    const rows: any[] = res.data?.rows ?? res.data?.list ?? []
    row.stock_num = rows.reduce((sum: number, item: any) => sum + toNumber(item.stock_num ?? item.qty), 0)
  } catch {
    row.stock_num = 0
  }
}

async function refreshAllRowStocks() {
  await Promise.all(fd.items.map((row) => loadRowStock(row)))
}

async function openAdd() {
  Object.assign(fd, defaultFd())
  fd.items = []
  isView.value = false
  showForm.value = true
  await loadWarehouses()
}

async function openEdit(row: any) {
  await loadWarehouses()
  buildFormFromRow(row)
  isView.value = false
  showForm.value = true
  await refreshAllRowStocks()
}

async function openView(row: any) {
  await loadWarehouses()
  buildFormFromRow(row)
  isView.value = true
  showForm.value = true
  await refreshAllRowStocks()
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

function onGoodsConfirm(goods: any[]) {
  goods.forEach((goodsRow) => {
    const row = normalizeItem({
      goods_id: goodsRow.id || goodsRow.goods_id,
      goods_name: goodsRow.goods_name || goodsRow.name,
      goods_sn: goodsRow.goods_sn || '',
      spec: goodsRow.spec || '',
      unit_name: goodsRow.unit_name || '',
      stock_num: goodsRow.stock_num ?? null,
      warehouse_id: fd.warehouse_id,
      warehouse_name: fd.warehouse_name,
      num: 1,
      out_price: goodsRow.cost_price || goodsRow.out_price || 0,
      remark: '',
    })
    fd.items.push(row)
    void loadRowStock(row)
  })
}

function addEmptyRow() {
  fd.items.push(normalizeItem({ warehouse_id: fd.warehouse_id, warehouse_name: fd.warehouse_name, num: 1 }))
}

async function loadPlanOptions() {
  if (planList.value.length) return
  try {
    const r = await getProductionPlanList({ list_rows: 100 })
    planList.value = r.data?.list || r.data?.rows || r.data?.data || []
  } catch {}
}

function clearPlan() {
  fd.production_plan_id = 0
  fd.plan_name = ''
}

async function onPlanSelect(id: any) {
  const plan = planList.value.find((item: any) => Number(item.id) === Number(id))
  if (!plan) return
  fd.production_plan_id = Number(plan.id)
  fd.plan_name = plan.order_sn || ''
  const planSn = plan.order_sn || `SC${(plan.plan_date || plan.created_at || '').slice(0, 10).replace(/-/g, '')}${String(plan.id).padStart(3, '0')}`
  fd.order_sn = `${planSn}-L`
  try {
    const planItems: any[] = JSON.parse(plan.goods_info || '[]')
    fd.items = []
    for (const goodsItem of planItems) {
      const bomRes = await getBomByGoods(goodsItem.goods_id)
      const bomRows: any[] = bomRes.data?.rows ?? []
      for (const bom of bomRows) {
        if (!bom.material_name) continue
        let price = 0
        try {
          const prices = JSON.parse(localStorage.getItem('erp_bom_prices') || '{}')
          price = toNumber(prices[bom.id])
        } catch {}
        fd.items.push(normalizeItem({
          goods_id: bom.material_id || bom.goods_id,
          goods_name: bom.material_name,
          goods_sn: bom.material_sn || '',
          unit_name: bom.unit_name || '',
          warehouse_id: fd.warehouse_id,
          warehouse_name: fd.warehouse_name,
          num: toNumber(bom.num) * toNumber(goodsItem.num || 1),
          out_price: price,
          remark: goodsItem.goods_name,
        }))
      }
    }
    if (fd.items.length) {
      ElMessage.success(`已自动填入 ${fd.items.length} 种物料`)
      await refreshAllRowStocks()
    }
  } catch {}
}

async function onWarehouseChange(id: any) {
  const warehouseName = getWarehouseName(id)
  fd.warehouse_name = warehouseName
  fd.items.forEach((row) => {
    if (!row.warehouse_id) {
      row.warehouse_id = toNumber(id) || null
      row.warehouse_name = warehouseName
    }
  })
  await refreshAllRowStocks()
}

async function onRowWarehouseChange(row: any, warehouseId: any) {
  row.warehouse_name = getWarehouseName(warehouseId)
  await loadRowStock(row, warehouseId)
}

const batchVisible = ref(false)
const batchField = ref('')
const batchLabel = ref('')
const batchValue = ref(0)
function batchSet(field: string, label: string) {
  batchField.value = field
  batchLabel.value = label
  batchValue.value = 0
  batchVisible.value = true
}
function applyBatch() {
  fd.items.forEach((row) => {
    row[batchField.value] = batchValue.value
    calcRow(row)
  })
  batchVisible.value = false
}

function prepareItemsForSave() {
  return fd.items.map((item) => normalizeItem(item)).filter((item) => item.goods_id || item.goods_sn)
}

function validateBeforeSave(items: any[]) {
  if (!fd.pick_date) return '请选择领料日期'
  if (!items.length) return '请添加商品'
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    const rowLabel = item.goods_name || `第${index + 1}行`
    if (!toNumber(item.goods_id) && !String(item.goods_sn || '').trim()) return `${rowLabel}缺少商品信息`
    if (toNumber(item.num) <= 0) return `${rowLabel}的领料数量必须大于0`
    if (!toNumber(item.warehouse_id || fd.warehouse_id)) return `${rowLabel}请选择出库仓库`
  }
  return ''
}

async function syncAuditAndStock(materialId: number, status: 0 | 1, items: any[], warehouseId?: number, warehouseName?: string) {
  await auditMaterial(materialId, status)
  if (status !== 1 && status !== 0) return { changedCount: 0 }
  try {
    return await applyMaterialStockDelta(items, {
      direction: status === 1 ? 'deduct' : 'restore',
      defaultWarehouseId: warehouseId,
      defaultWarehouseName: warehouseName,
    })
  } catch (error) {
    try {
      await auditMaterial(materialId, status === 1 ? 0 : 1)
    } catch {}
    throw error
  }
}

async function handleSave() {
  const items = prepareItemsForSave()
  const validationMessage = validateBeforeSave(items)
  if (validationMessage) {
    ElMessage.warning(validationMessage)
    return
  }

  saving.value = true
  try {
    const warehouseId = toNumber(fd.warehouse_id || items[0]?.warehouse_id)
    const warehouseName = fd.warehouse_name || getWarehouseName(warehouseId)
    const payload: any = {
      order_sn: fd.order_sn || '',
      out_no: fd.order_sn || '',
      pick_date: fd.pick_date,
      out_date: fd.pick_date,
      production_plan_id: fd.production_plan_id || 0,
      plan_id: fd.production_plan_id || 0,
      plan_name: fd.plan_name || '',
      admin_name: fd.admin_name || '',
      receiver: fd.admin_name || '',
      warehouse_id: warehouseId || 0,
      warehouse_name: warehouseName,
      remark: fd.remark || '',
      goods_info: JSON.stringify(items),
      goods_name: items.map((item) => item.goods_name).join('、').slice(0, 100),
      total_price: totalPrice.value,
    }
    if (fd.id) payload.id = fd.id

    const res = await createMaterial(payload)
    const materialId = toNumber(res.data?.id || res.data?.data?.id || res.data || fd.id)
    if (!materialId) throw new Error('保存成功但未获取到领料单ID，无法同步库存')

    const { changedCount } = await syncAuditAndStock(materialId, 1, items, warehouseId, warehouseName)
    ElMessage.success(`保存成功，库存已扣减 ${changedCount} 项`)
    backToList()
  } catch (error: any) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function doAudit(row: any, status: number) {
  const labels: Record<number, string> = { 1: '审核', 2: '驳回', 0: '反审核' }
  await ElMessageBox.confirm(`确定${labels[status]}该领料单？`, '提示', { type: 'warning' })
  try {
    if (status === 2) {
      await auditMaterial(row.id, 2)
      ElMessage.success('操作成功')
      tableRef.value?.refresh()
      return
    }

    const items: any[] = JSON.parse(row.goods_info || '[]')
    const normalizedItems = items.map((item) => normalizeItem({
      ...item,
      warehouse_id: item.warehouse_id || row.warehouse_id,
      warehouse_name: item.warehouse_name || row.warehouse_name,
    }))
    const { changedCount } = await syncAuditAndStock(
      toNumber(row.id),
      status as 0 | 1,
      normalizedItems,
      toNumber(row.warehouse_id),
      row.warehouse_name || '',
    )
    ElMessage.success(status === 1 ? `审核成功，库存已扣减 ${changedCount} 项` : `反审核成功，库存已回滚 ${changedCount} 项`)
    tableRef.value?.refresh()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await deleteMaterial(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

onMounted(async () => {
  await loadWarehouses()
  const { plan_id, plan_name, goods_info } = route.query
  if (!plan_id) return

  Object.assign(fd, defaultFd())
  fd.production_plan_id = toNumber(plan_id)
  fd.plan_name = String(plan_name || '')
  fd.items = []
  isView.value = false
  showForm.value = true

  try {
    const planItems: any[] = JSON.parse(String(goods_info || '[]'))
    for (const goodsItem of planItems) {
      const bomRes = await getBomByGoods(goodsItem.goods_id)
      const bomRows: any[] = bomRes.data?.rows ?? []
      for (const bom of bomRows) {
        if (!bom.material_name) continue
        let price = 0
        try {
          const prices = JSON.parse(localStorage.getItem('erp_bom_prices') || '{}')
          price = toNumber(prices[bom.id])
        } catch {}
        fd.items.push(normalizeItem({
          goods_id: bom.material_id || bom.goods_id,
          goods_name: bom.material_name,
          goods_sn: bom.material_sn || '',
          unit_name: bom.unit_name || '',
          warehouse_id: fd.warehouse_id,
          warehouse_name: fd.warehouse_name,
          num: toNumber(bom.num) * toNumber(goodsItem.num || 1),
          out_price: price,
          remark: `${goodsItem.goods_name} BOM`,
        }))
      }
    }
    await refreshAllRowStocks()
  } catch {}
})
</script>

<style scoped>
.material-page{}
.form-page{background:#fff;min-height:calc(100vh - 80px)}
.form-topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #e8edf2;background:#fff;position:sticky;top:0;z-index:10}
.form-topbar-left{display:flex;align-items:center;gap:10px}
.form-title{font-size:15px;font-weight:600;color:#333}
.form-body{padding:16px}
.form-section{margin-bottom:12px}
.field-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.field-label{font-size:13px;color:#555;white-space:nowrap;flex-shrink:0;min-width:52px}
.field-label.required::before{content:'*';color:#f56c6c;margin-right:2px}
.goods-toolbar{display:flex;align-items:center;gap:8px;padding:8px 0;margin-bottom:6px;border-top:1px solid #f0f0f0}
.goods-summary-view{padding:6px 0;font-size:13px;color:#555;border-top:1px solid #f0f0f0;margin-bottom:6px}
.goods-summary{margin-left:auto;font-size:13px;color:#555}
.goods-summary b{color:#dc2626}
.form-footer{padding:12px 0;border-top:1px solid #f0f0f0}
.footer-summary{font-size:13px;color:#555}
.footer-summary b{color:#dc2626}
</style>
